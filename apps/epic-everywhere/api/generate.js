const OpenAI = require("openai");
const { put } = require("@vercel/blob");
const db = require("../lib/db");
const { generationCost } = require("../lib/credits");
const { json, readJson, getBearer, cors } = require("../lib/http");
const {
  clientIp,
  rateLimit,
  sanitizePrompt,
} = require("../lib/security");

/**
 * POST { prompt, kind?: "image"|"image_hd" }
 * Auth required. Credits deducted only after successful model response starts storage.
 */
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const ip = clientIp(req);
  const rl = rateLimit("gen:" + ip, 20, 60_000);
  if (!rl.ok) return json(res, 429, { error: "rate_limited" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return json(res, 503, { error: "media_not_configured" });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 503, { error: "storage_not_configured" });
    }

    const token = getBearer(req);
    const session = await db.getSession(token);
    if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
      return json(res, 401, { error: "unauthorized" });
    }

    const rlUser = rateLimit("gen_user:" + session.email, 30, 60_000);
    if (!rlUser.ok) return json(res, 429, { error: "rate_limited" });

    const body = await readJson(req);
    if (!body) return json(res, 400, { error: "invalid_json" });

    const prompt = sanitizePrompt(body.prompt);
    const kind = body.kind === "image_hd" ? "image_hd" : "image";
    if (prompt.length < 3) return json(res, 400, { error: "prompt_required" });

    // Block obvious prompt injection / abuse patterns lightly
    if (/ignore (all )?(previous|above) instructions/i.test(prompt)) {
      return json(res, 400, { error: "prompt_rejected" });
    }

    const cost = generationCost(kind);
    const user = await db.ensureUser(session.email);
    if ((user.credits || 0) < cost) {
      return json(res, 402, {
        error: "insufficient_credits",
        credits: user.credits || 0,
        need: cost,
      });
    }

    // Deduct first (prevent free abuse under concurrency); refund on failure
    await db.addCredits(session.email, -cost, `generate:${kind}`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";

    let b64;
    try {
      const img = await openai.images.generate({
        model,
        prompt,
        size: "1024x1024",
        n: 1,
      });
      b64 = img.data?.[0]?.b64_json;
      if (!b64 && img.data?.[0]?.url) {
        const r = await fetch(img.data[0].url);
        if (!r.ok) throw new Error("image_fetch_failed");
        const buf = Buffer.from(await r.arrayBuffer());
        b64 = buf.toString("base64");
      }
    } catch (err) {
      await db.addCredits(session.email, cost, `refund:generate_failed`);
      console.error("image gen failed", err.message);
      return json(res, 502, {
        error: "generation_failed",
        detail: String(err.message || err).slice(0, 200),
      });
    }

    if (!b64) {
      await db.addCredits(session.email, cost, `refund:empty_image`);
      return json(res, 502, { error: "empty_image" });
    }

    const id = db.randomToken(12);
    const buf = Buffer.from(b64, "base64");
    // Cap size ~15MB
    if (buf.length > 15 * 1024 * 1024) {
      await db.addCredits(session.email, cost, `refund:image_too_large`);
      return json(res, 502, { error: "image_too_large" });
    }

    const safeEmail = session.email.replace(/[^a-z0-9@._-]/gi, "_");
    const blob = await put(`media-files/${safeEmail}/${id}.png`, buf, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const meta = {
      id,
      email: session.email,
      prompt,
      kind,
      cost,
      url: blob.url,
      createdAt: new Date().toISOString(),
      model,
    };
    await db.saveMediaMeta(meta);

    const fresh = await db.ensureUser(session.email);
    fresh.mediaCount = (fresh.mediaCount || 0) + 1;
    await db.saveUser(fresh);

    return json(res, 200, {
      ok: true,
      media: meta,
      credits: fresh.credits || 0,
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "generate_failed" });
  }
};
