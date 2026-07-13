const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");

/**
 * Passwordless login: POST { email }
 * Dev/demo: returns otp in response when AUTH_DEBUG=1 or no email provider.
 * Production: set AUTH_DEBUG=0 and wire email (optional later).
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: "invalid_email" });
    }

    await db.ensureUser(email);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 15 * 60 * 1000;
    await db.saveOtp(email, {
      email,
      code,
      expiresAt,
      attempts: 0,
    });

    const debug =
      process.env.AUTH_DEBUG === "1" ||
      process.env.AUTH_DEBUG === "true" ||
      !process.env.SMTP_URL;

    // TODO: send email via Resend/Postmark when SMTP configured
    return json(res, 200, {
      ok: true,
      email,
      message: debug
        ? "Dev code issued (also returned in response)."
        : "If this email can receive mail, a code was sent.",
      ...(debug ? { debugCode: code } : {}),
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "auth_start_failed", detail: String(e.message || e) });
  }
};
