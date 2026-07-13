const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");
const {
  clientIp,
  rateLimit,
  validEmail,
  hashSecret,
  timingSafeEqualStr,
} = require("../../lib/security");

/**
 * POST { email, code } → { token, user }
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const ip = clientIp(req);
  const rl = rateLimit("auth_verify:" + ip, 20, 15 * 60_000);
  if (!rl.ok) return json(res, 429, { error: "rate_limited" });

  try {
    const body = await readJson(req);
    if (!body) return json(res, 400, { error: "invalid_json" });

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const code = String(body.code || "").trim();
    if (!validEmail(email) || !/^\d{6}$/.test(code)) {
      return json(res, 400, { error: "invalid_credentials" });
    }

    const otp = await db.getOtp(email);
    if (!otp || !otp.codeHash) {
      return json(res, 401, { error: "invalid_code" });
    }
    if (Date.now() > (otp.expiresAt || 0)) {
      return json(res, 401, { error: "code_expired" });
    }
    if ((otp.attempts || 0) >= 5) {
      return json(res, 401, { error: "too_many_attempts" });
    }

    const attemptHash = hashSecret(code, email);
    if (!timingSafeEqualStr(attemptHash, otp.codeHash)) {
      otp.attempts = (otp.attempts || 0) + 1;
      await db.saveOtp(email, otp);
      return json(res, 401, { error: "invalid_code" });
    }

    const user = await db.ensureUser(email);
    const token = db.randomToken(32);
    const session = {
      token,
      email: user.email,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    await db.saveSession(token, session);

    // Invalidate OTP
    await db.saveOtp(email, {
      email,
      codeHash: null,
      expiresAt: 0,
      used: true,
    });

    return json(res, 200, {
      ok: true,
      token,
      user: {
        email: user.email,
        credits: user.credits || 0,
        mediaCount: user.mediaCount || 0,
      },
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "auth_verify_failed" });
  }
};
