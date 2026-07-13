const crypto = require("crypto");
const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");
const {
  clientIp,
  rateLimit,
  authDebugEnabled,
  validEmail,
  hashSecret,
} = require("../../lib/security");

/**
 * Passwordless login: POST { email }
 * Code is hashed at rest. Never returned unless AUTH_DEBUG=1 (non-production only recommended).
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const ip = clientIp(req);
  const rl = rateLimit("auth_start:" + ip, 8, 15 * 60_000);
  if (!rl.ok) {
    return json(res, 429, { error: "rate_limited", retryAfterSec: rl.retryAfterSec });
  }

  try {
    const body = await readJson(req);
    if (!body) return json(res, 400, { error: "invalid_json" });

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!validEmail(email)) {
      return json(res, 400, { error: "invalid_email" });
    }

    // Per-email rate limit
    const rlEmail = rateLimit("auth_start_email:" + email, 5, 15 * 60_000);
    if (!rlEmail.ok) {
      return json(res, 429, { error: "rate_limited" });
    }

    await db.ensureUser(email);
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await db.saveOtp(email, {
      email,
      codeHash: hashSecret(code, email),
      expiresAt,
      attempts: 0,
    });

    const debug = authDebugEnabled();

    // Production: integrate Resend/Postmark here. Until then, only debug returns code.
    // Without email delivery and without AUTH_DEBUG, user cannot log in — set AUTH_DEBUG=1
    // only temporarily, or add email.

    return json(res, 200, {
      ok: true,
      email,
      message: debug
        ? "Verification code issued."
        : "If this email can receive mail, a code was sent. Check spam.",
      // Only expose code when explicitly debugging
      ...(debug ? { debugCode: code } : {}),
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "auth_start_failed" });
  }
};
