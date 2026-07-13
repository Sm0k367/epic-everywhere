const { list } = require("@vercel/blob");
const db = require("../../lib/db");
const { json, getBearer, cors, readJson } = require("../../lib/http");
const {
  timingSafeEqualStr,
  clientIp,
  rateLimit,
} = require("../../lib/security");

function adminOk(req) {
  const key = process.env.ADMIN_KEY;
  if (!key) return false;
  const h = req.headers["x-admin-key"] || "";
  if (h && timingSafeEqualStr(h, key)) return true;
  const bearer = getBearer(req);
  return bearer && timingSafeEqualStr(bearer, key);
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();

  const rl = rateLimit("admin:" + clientIp(req), 40, 60_000);
  if (!rl.ok) return json(res, 429, { error: "rate_limited" });

  if (!adminOk(req)) return json(res, 401, { error: "unauthorized" });

  try {
    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body) return json(res, 400, { error: "invalid_json" });
      const email = String(body.email || "").trim().toLowerCase();
      const credits = Math.min(5000, Math.max(0, Number(body.credits) || 0));
      if (!email || !credits) return json(res, 400, { error: "bad_request" });
      const user = await db.addCredits(email, credits, "admin:grant");
      return json(res, 200, { ok: true, email: user.email, credits: user.credits });
    }

    if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const users = [];
    const media = [];
    let ledgerCount = 0;

    if (token) {
      const uList = await list({ prefix: db.PREFIX + "users/", limit: 200, token });
      for (const b of uList.blobs || []) {
        try {
          const r = await fetch(b.url);
          if (r.ok) users.push(await r.json());
        } catch { /* skip */ }
      }
      const mList = await list({ prefix: db.PREFIX + "media/", limit: 100, token });
      for (const b of mList.blobs || []) {
        try {
          const r = await fetch(b.url);
          if (r.ok) media.push(await r.json());
        } catch { /* skip */ }
      }
      const lList2 = await list({ prefix: db.PREFIX + "ledger/", limit: 500, token });
      ledgerCount = (lList2.blobs || []).length;
    }

    users.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    media.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const totalCredits = users.reduce((s, u) => s + (u.credits || 0), 0);
    const totalMedia = users.reduce((s, u) => s + (u.mediaCount || 0), 0);

    return json(res, 200, {
      ok: true,
      stats: {
        users: users.length,
        totalCredits,
        totalMedia,
        mediaMeta: media.length,
        ledgerEntries: ledgerCount,
      },
      users: users.slice(0, 50).map((u) => ({
        email: u.email,
        credits: u.credits || 0,
        mediaCount: u.mediaCount || 0,
        updatedAt: u.updatedAt,
        createdAt: u.createdAt,
      })),
      media: media.slice(0, 40).map((m) => ({
        id: m.id,
        email: m.email,
        url: m.url,
        prompt: (m.prompt || "").slice(0, 120),
        createdAt: m.createdAt,
        cost: m.cost,
      })),
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "admin_failed" });
  }
};
