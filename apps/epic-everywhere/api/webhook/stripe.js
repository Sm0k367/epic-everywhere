const Stripe = require("stripe");
const db = require("../../lib/db");
const { creditsForSku, creditsForAmountCents } = require("../../lib/credits");
const { json, readBody, cors } = require("../../lib/http");

/**
 * Stripe webhook: checkout.session.completed
 * Grant studio credits from Payment Link purchases.
 * Endpoint: https://YOUR_DOMAIN/api/webhook/stripe
 */
async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json(res, 503, { error: "stripe_not_configured" });

  const stripe = new Stripe(stripeKey);
  const raw = await readBody(req);
  let event;

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    if (whSecret) {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(raw, sig, whSecret);
    } else {
      event = JSON.parse(raw.toString("utf8"));
    }
  } catch (err) {
    console.error("webhook verify failed", err.message);
    return json(res, 400, { error: "invalid_signature" });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await handleCheckout(event.data.object);
    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const email =
        pi.receipt_email ||
        (pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].billing_details && pi.charges.data[0].billing_details.email) ||
        (pi.metadata && pi.metadata.email);
      const sku = pi.metadata && pi.metadata.sku;
      const amount = pi.amount_received || pi.amount;
      if (email) await grant(email, sku, amount, pi.id);
    }

    return json(res, 200, { received: true });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "webhook_handler_failed" });
  }
}

async function handleCheckout(session) {
  const email =
    (session.customer_details && session.customer_details.email) ||
    session.customer_email ||
    (session.metadata && session.metadata.email);
  if (!email) {
    console.warn("checkout without email", session.id);
    return;
  }
  const sku = (session.metadata && (session.metadata.sku || session.metadata.SKU)) || null;
  const amount = session.amount_total;
  await grant(email, sku, amount, session.id);
}

async function grant(email, sku, amountCents, ref) {
  let credits = creditsForSku(sku);
  if (!credits) credits = creditsForAmountCents(amountCents);
  if (!credits) {
    console.warn("no credits mapped", { email, sku, amountCents, ref });
    return;
  }
  const user = await db.addCredits(email, credits, `stripe:${sku || "amount"}:${ref}`);
  console.log("granted", email, credits, "balance", user.credits);
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;
