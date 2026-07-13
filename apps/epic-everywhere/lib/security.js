/**
 * Security helpers: rate limits, origin checks, hashing, idempotency.
 * Rate limit store is in-memory per serverless instance (best-effort);
 * critical money paths always verify with Stripe.
 */
const crypto = require("crypto");

const buckets = new Map();

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Simple sliding window: max `limit` hits per `windowMs` for key.
 * Returns { ok, retryAfterSec }
 */
function rateLimit(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    b = { start: now, count: 0 };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.start + windowMs - now) / 1000),
    };
  }
  return { ok: true };
}

function hashSecret(value, salt = "") {
  return crypto
    .createHash("sha256")
    .update(String(salt) + ":" + String(value))
    .digest("hex");
}

function timingSafeEqualStr(a, b) {
  try {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Allowed browser origins for credentialed API use */
function allowedOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS ||
    "https://epic-everywhere.vercel.app,https://epic-everywhere.sm0k367.com,https://everywhere.sm0k367.com,http://localhost:3000";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (!origin) {
    // same-origin / server-to-server
    res.setHeader("Access-Control-Allow-Origin", allowed[0] || "https://epic-everywhere.vercel.app");
  }
  // If origin present but not allowed: no ACAO header (browser blocks)
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature, x-admin-key"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}

function isProduction() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

/** AUTH_DEBUG only when explicitly enabled AND not forced off */
function authDebugEnabled() {
  if (process.env.AUTH_DEBUG === "0" || process.env.AUTH_DEBUG === "false") return false;
  if (process.env.FORCE_SECURE === "1") return false;
  return process.env.AUTH_DEBUG === "1" || process.env.AUTH_DEBUG === "true";
}

function sanitizePrompt(prompt) {
  return String(prompt || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, 2000);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());
}

module.exports = {
  clientIp,
  rateLimit,
  hashSecret,
  timingSafeEqualStr,
  allowedOrigins,
  setCors,
  isProduction,
  authDebugEnabled,
  sanitizePrompt,
  validEmail,
};
