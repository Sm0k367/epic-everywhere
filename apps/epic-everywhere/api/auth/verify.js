const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");

/**
 * POST { email, code } → { token, user }
 */
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  try {
    const body = await readJson(req);
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const code = String(body.code || "").trim();
    if (!email || !code) return json(res, 400, { error: "missing_fields" });

    const otp = await db.getOtp(email);
    if (!otp || otp.code !== code) {
      return json(res, 401, { error: "invalid_code" });
    }
    if (Date.now() > (otp.expiresAt || 0)) {
      return json(res, 401, { error: "code_expired" });
    }

    const user = await db.ensureUser(email);
    const token = db.randomToken(32);
    const session = {
      token,
      email: user.email,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    await db.saveSession(token, session);

    // burn otp
    await db.saveOtp(email, { email, code: null, expiresAt: 0, used: true });

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
    return json(res, 500, { error: "auth_verify_failed", detail: String(e.message || e) });
  }
};
