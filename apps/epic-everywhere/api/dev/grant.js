const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");

/**
 * DEV ONLY: POST { email, credits }
 * Enabled when AUTH_DEBUG=1. Remove or disable in hard production.
 */
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
  if (process.env.AUTH_DEBUG !== "1" && process.env.AUTH_DEBUG !== "true") {
    return json(res, 404, { error: "not_found" });
  }
  try {
    const body = await readJson(req);
    const email = String(body.email || "").trim().toLowerCase();
    const credits = Math.min(500, Math.max(0, Number(body.credits) || 0));
    if (!email || !credits) return json(res, 400, { error: "bad_request" });
    const user = await db.addCredits(email, credits, "dev:grant");
    return json(res, 200, { ok: true, email: user.email, credits: user.credits });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "grant_failed", detail: String(e.message || e) });
  }
};
