const db = require("../../lib/db");
const { json, readJson, cors } = require("../../lib/http");
const { timingSafeEqualStr, isProduction } = require("../../lib/security");

/**
 * DEV ONLY grant — requires ADMIN_KEY header, disabled when FORCE_SECURE=1
 * or when AUTH_DEBUG is off in production.
 * POST { email, credits } + header x-admin-key
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  if (process.env.FORCE_SECURE === "1") {
    return json(res, 404, { error: "not_found" });
  }
  if (isProduction() && process.env.AUTH_DEBUG !== "1") {
    return json(res, 404, { error: "not_found" });
  }

  const adminKey = process.env.ADMIN_KEY;
  const provided = req.headers["x-admin-key"] || "";
  if (!adminKey || !timingSafeEqualStr(provided, adminKey)) {
    return json(res, 401, { error: "unauthorized" });
  }

  try {
    const body = await readJson(req);
    if (!body) return json(res, 400, { error: "invalid_json" });
    const email = String(body.email || "").trim().toLowerCase();
    const credits = Math.min(100, Math.max(0, Number(body.credits) || 0));
    if (!email || !credits) return json(res, 400, { error: "bad_request" });
    const user = await db.addCredits(email, credits, "admin:dev_grant");
    return json(res, 200, { ok: true, email: user.email, credits: user.credits });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "grant_failed" });
  }
};
