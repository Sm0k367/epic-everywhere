const { claimCheckoutSession } = require("../lib/payments");
const { json, readJson, cors, getBearer } = require("../lib/http");
const db = require("../lib/db");
const { clientIp, rateLimit, validEmail } = require("../lib/security");

/**
 * POST { session_id }
 * Optional Authorization: Bearer <session> — if present, email must match payment.
 *
 * Customer lands on success.html?session_id={CHECKOUT_SESSION_ID}
 * Frontend calls this to unlock credits after a REAL paid Stripe session.
 * Stripe is the source of truth — fake session IDs fail retrieve.
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const rl = rateLimit("claim:" + clientIp(req), 15, 60_000);
  if (!rl.ok) {
    return json(res, 429, { error: "rate_limited", retryAfterSec: rl.retryAfterSec });
  }

  try {
    const body = await readJson(req);
    if (!body) return json(res, 400, { error: "invalid_json" });

    const sessionId = String(body.session_id || body.sessionId || "").trim();
    if (!sessionId.startsWith("cs_")) {
      return json(res, 400, { error: "invalid_session_id" });
    }

    let expectedEmail = null;
    const token = getBearer(req);
    if (token) {
      const session = await db.getSession(token);
      if (session && (!session.expiresAt || Date.now() < session.expiresAt)) {
        expectedEmail = session.email;
      }
    }
    // Optional body email only as soft filter when not logged in —
    // still must match Stripe session email inside claimCheckoutSession
    if (!expectedEmail && body.email && validEmail(body.email)) {
      expectedEmail = String(body.email).trim().toLowerCase();
    }

    const result = await claimCheckoutSession(sessionId, expectedEmail);
    if (!result.ok) {
      const status =
        result.error === "not_paid"
          ? 402
          : result.error === "email_mismatch"
            ? 403
            : 400;
      return json(res, status, result);
    }

    return json(res, 200, {
      ok: true,
      granted: result.granted,
      reason: result.reason,
      credits: result.credits,
      balance: result.balance,
      email: result.email,
      message: result.granted
        ? "Access unlocked. Sign in to Studio with this email."
        : result.reason === "already_claimed"
          ? "Already unlocked. Sign in to Studio."
          : "Processed.",
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "claim_failed", detail: String(e.message || e) });
  }
};
