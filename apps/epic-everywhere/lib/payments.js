/**
 * Secure credit grants — always verify with Stripe when possible.
 * Idempotent: same payment ref never grants twice.
 */
const Stripe = require("stripe");
const db = require("./db");
const { creditsForSku, creditsForAmountCents } = require("./credits");

function stripeClient() {
  const key = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("stripe_not_configured");
  return new Stripe(key);
}

/**
 * Grant credits once for a payment reference.
 * @returns {{ granted: boolean, credits?: number, balance?: number, reason?: string }}
 */
async function grantOnce({ email, sku, amountCents, ref, source }) {
  if (!email || !ref) {
    return { granted: false, reason: "missing_email_or_ref" };
  }
  const emailNorm = String(email).trim().toLowerCase();
  const refSafe = String(ref).replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 128);
  if (!refSafe) return { granted: false, reason: "bad_ref" };

  // Idempotency lock
  const claimKey = `claims/${refSafe}.json`;
  const existing = await db.getJson(claimKey);
  if (existing && existing.granted) {
    return {
      granted: false,
      reason: "already_claimed",
      credits: existing.credits,
      balance: existing.balance,
      email: existing.email,
    };
  }

  let credits = creditsForSku(sku);
  if (!credits) credits = creditsForAmountCents(amountCents);
  if (!credits || credits < 1) {
    return { granted: false, reason: "no_credit_mapping" };
  }
  // Cap single grant to prevent metadata abuse even if amount is huge
  credits = Math.min(credits, 500);

  const user = await db.addCredits(
    emailNorm,
    credits,
    `${source || "stripe"}:${sku || "amount"}:${refSafe}`
  );

  await db.putJson(claimKey, {
    granted: true,
    email: emailNorm,
    sku: sku || null,
    amountCents: amountCents || null,
    credits,
    balance: user.credits,
    ref: refSafe,
    source: source || "stripe",
    at: new Date().toISOString(),
  });

  return {
    granted: true,
    credits,
    balance: user.credits,
    email: emailNorm,
  };
}

/**
 * Retrieve and validate a Checkout Session from Stripe, then grant.
 * Rejects unpaid / open / no-email sessions.
 */
async function claimCheckoutSession(sessionId, expectedEmail) {
  if (!sessionId || !String(sessionId).startsWith("cs_")) {
    return { ok: false, error: "invalid_session_id" };
  }

  const stripe = stripeClient();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });
  } catch (e) {
    return { ok: false, error: "session_not_found", detail: e.message };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    // Payment Links: payment_status should be paid
    if (session.payment_status !== "paid") {
      return { ok: false, error: "not_paid", payment_status: session.payment_status };
    }
  }

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.email;

  if (!email) {
    return { ok: false, error: "no_email_on_payment" };
  }

  if (expectedEmail) {
    const a = String(expectedEmail).trim().toLowerCase();
    const b = String(email).trim().toLowerCase();
    if (a !== b) {
      return { ok: false, error: "email_mismatch" };
    }
  }

  // Prefer metadata.sku; else try product metadata from line items
  let sku = session.metadata?.sku || session.metadata?.SKU || null;
  if (!sku && session.line_items?.data?.[0]) {
    const li = session.line_items.data[0];
    const prod = li.price?.product;
    if (prod && typeof prod === "object") {
      sku = prod.metadata?.sku || null;
    }
  }

  const amountCents = session.amount_total || 0;
  const result = await grantOnce({
    email,
    sku,
    amountCents,
    ref: session.id,
    source: "checkout_claim",
  });

  return {
    ok: true,
    email: String(email).toLowerCase(),
    sku,
    amountCents,
    ...result,
  };
}

/**
 * Process a verified Stripe event object (after signature check).
 */
async function processStripeEvent(event) {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.payment_status && session.payment_status !== "paid") {
      // still allow complete + paid
      if (session.payment_status !== "paid") {
        return { skipped: true, reason: "not_paid" };
      }
    }
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email;
    const sku = session.metadata?.sku || session.metadata?.SKU || null;
    const amount = session.amount_total;
    if (!email) return { skipped: true, reason: "no_email" };
    return grantOnce({
      email,
      sku,
      amountCents: amount,
      ref: session.id,
      source: "webhook",
    });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    // Prefer not to double-grant if checkout session also fires —
    // use PI id as ref; claim by cs_ id is separate.
    // Only grant if metadata.sku present (avoid double with checkout)
    const sku = pi.metadata?.sku;
    if (!sku) return { skipped: true, reason: "pi_without_sku_use_checkout" };
    const email =
      pi.receipt_email ||
      pi.charges?.data?.[0]?.billing_details?.email ||
      pi.metadata?.email;
    if (!email) return { skipped: true, reason: "no_email" };
    return grantOnce({
      email,
      sku,
      amountCents: pi.amount_received || pi.amount,
      ref: pi.id,
      source: "webhook_pi",
    });
  }

  return { skipped: true, reason: "unhandled_event" };
}

module.exports = {
  stripeClient,
  grantOnce,
  claimCheckoutSession,
  processStripeEvent,
};
