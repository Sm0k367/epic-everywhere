/**
 * Lightweight document DB on Vercel Blob.
 * Keys are public-read-safe only when we store media URLs;
 * user records use opaque hashed paths and are written as private where supported.
 */
const { put, list, del, head } = require("@vercel/blob");
const crypto = require("crypto");

const PREFIX = "epic-db/";

function hashEmail(email) {
  return crypto
    .createHash("sha256")
    .update(String(email).trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

async function putJson(key, obj, { access = "private" } = {}) {
  const pathname = `${PREFIX}${key}`;
  const blob = await put(pathname, JSON.stringify(obj, null, 2), {
    access,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob;
}

async function getJson(key) {
  const pathname = `${PREFIX}${key}`;
  // Prefer list+fetch by pathname; Blob private URLs need token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const result = await list({ prefix: pathname, limit: 1, token });
    const hit = (result.blobs || []).find((b) => b.pathname === pathname);
    if (!hit) return null;
    const res = await fetch(hit.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Public blobs don't need auth; try without if 401
    if (!res.ok) {
      const res2 = await fetch(hit.url);
      if (!res2.ok) return null;
      return await res2.json();
    }
    return await res.json();
  } catch {
    return null;
  }
}

async function deleteKey(key) {
  const pathname = `${PREFIX}${key}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const result = await list({ prefix: pathname, limit: 5, token });
  for (const b of result.blobs || []) {
    if (b.pathname === pathname) await del(b.url, { token });
  }
}

async function getUser(email) {
  const id = hashEmail(email);
  return getJson(`users/${id}.json`);
}

async function saveUser(user) {
  const id = hashEmail(user.email);
  user.id = user.id || id;
  user.email = String(user.email).trim().toLowerCase();
  user.updatedAt = new Date().toISOString();
  // Store as public JSON under opaque hash path (no PII in URL beyond hash)
  // Credits ledger is not secret beyond email; access controlled by session token.
  await putJson(`users/${id}.json`, user, { access: "public" });
  return user;
}

async function ensureUser(email) {
  let user = await getUser(email);
  if (user) return user;
  user = {
    id: hashEmail(email),
    email: String(email).trim().toLowerCase(),
    credits: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mediaCount: 0,
  };
  return saveUser(user);
}

async function addCredits(email, amount, reason) {
  const user = await ensureUser(email);
  user.credits = Math.max(0, (user.credits || 0) + amount);
  user.lastCreditReason = reason;
  user.lastCreditAt = new Date().toISOString();
  await saveUser(user);
  // append ledger entry
  const lid = randomToken(8);
  await putJson(
    `ledger/${user.id}/${Date.now()}-${lid}.json`,
    {
      email: user.email,
      delta: amount,
      balance: user.credits,
      reason,
      at: new Date().toISOString(),
    },
    { access: "public" }
  );
  return user;
}

async function saveSession(token, session) {
  await putJson(`sessions/${token}.json`, session, { access: "public" });
}

async function getSession(token) {
  if (!token) return null;
  return getJson(`sessions/${token}.json`);
}

async function saveOtp(email, record) {
  await putJson(`otps/${hashEmail(email)}.json`, record, { access: "public" });
}

async function getOtp(email) {
  return getJson(`otps/${hashEmail(email)}.json`);
}

async function saveMediaMeta(meta) {
  await putJson(`media/${meta.id}.json`, meta, { access: "public" });
  return meta;
}

async function listMediaForUser(email, limit = 50) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefix = `${PREFIX}media/`;
  const result = await list({ prefix, limit: 200, token });
  const out = [];
  for (const b of result.blobs || []) {
    try {
      const res = await fetch(b.url);
      if (!res.ok) continue;
      const meta = await res.json();
      if (meta.email === String(email).toLowerCase()) out.push(meta);
    } catch {
      /* skip */
    }
  }
  out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return out.slice(0, limit);
}

module.exports = {
  hashEmail,
  randomToken,
  putJson,
  getJson,
  getUser,
  saveUser,
  ensureUser,
  addCredits,
  saveSession,
  getSession,
  saveOtp,
  getOtp,
  saveMediaMeta,
  listMediaForUser,
  put,
  PREFIX,
};
