const db = require("../lib/db");
const { json, getBearer, cors } = require("../lib/http");

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

  try {
    const token = getBearer(req);
    const session = await db.getSession(token);
    if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
      return json(res, 401, { error: "unauthorized" });
    }
    const user = await db.ensureUser(session.email);
    const media = await db.listMediaForUser(session.email, 30);
    return json(res, 200, {
      ok: true,
      user: {
        email: user.email,
        credits: user.credits || 0,
        mediaCount: user.mediaCount || 0,
        createdAt: user.createdAt,
      },
      media,
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "me_failed", detail: String(e.message || e) });
  }
};
