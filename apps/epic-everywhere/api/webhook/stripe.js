const Stripe = require("stripe");
const { processStripeEvent } = require("../../lib/payments");
const { json, readBody, cors } = require("../../lib/http");
const { clientIp, rateLimit } = require("../../lib/security");

/**
 * Stripe webhook — SIGNATURE REQUIRED.
 * Fake JSON posts are rejected when STRIPE_WEBHOOK_SECRET is set (required in production).
 *
 * Endpoint: https://epic-everywhere.vercel.app/api/webhook/stripe
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded
 */
async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const rl = rateLimit("wh:" + clientIp(req), 100, 60_000);
  if (!rl.ok) return json(res, 429, { error: "rate_limited" });

  const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) return json(res, 503, { error: "stripe_not_configured" });
  if (!whSecret) {
    // Refuse unsigned mode in production — prevents free-credit attacks
    console.error("STRIPE_WEBHOOK_SECRET missing — rejecting webhook");
    return json(res, 503, {
      error: "webhook_secret_required",
      detail: "Set STRIPE_WEBHOOK_SECRET in Vercel. Unsigned webhooks are disabled.",
    });
  }

  const stripe = new Stripe(stripeKey);
  const raw = await readBody(req);
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    if (!sig) return json(res, 400, { error: "missing_signature" });
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    console.error("webhook verify failed", err.message);
    return json(res, 400, { error: "invalid_signature" });
  }

  try {
    const result = await processStripeEvent(event);
    return json(res, 200, { received: true, result });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "webhook_handler_failed" });
  }
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;
