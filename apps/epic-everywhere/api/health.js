const { json, cors } = require("../lib/http");

/**
 * Public health — no secrets. Shows which integrations are configured.
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

  const checks = {
    ok: true,
    service: "epic-everywhere",
    stripeKey: Boolean(process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    openai: Boolean(process.env.OPENAI_API_KEY),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    adminKey: Boolean(process.env.ADMIN_KEY),
    authDebug: process.env.AUTH_DEBUG === "1" || process.env.AUTH_DEBUG === "true",
    forceSecure: process.env.FORCE_SECURE === "1",
    claimPath: "POST /api/claim (primary unlock after pay)",
    webhookPath: "POST /api/webhook/stripe (backup; needs signing secret)",
  };

  // overall ready for paid customers
  checks.readyForCustomers =
    checks.stripeKey && checks.blob && (checks.openai || true);

  checks.notes = [];
  if (!checks.stripeWebhookSecret) {
    checks.notes.push(
      "Add STRIPE_WEBHOOK_SECRET from Stripe Dashboard webhooks (optional backup; claim path works without it)."
    );
  }
  if (!checks.openai) {
    checks.notes.push("OPENAI_API_KEY missing — Studio generate will fail.");
  }
  if (checks.authDebug) {
    checks.notes.push("AUTH_DEBUG on — codes may appear in API (bootstrap mode).");
  }

  return json(res, 200, checks);
};
