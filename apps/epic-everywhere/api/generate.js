const OpenAI = require("openai");
const { put } = require("@vercel/blob");
const db = require("../lib/db");
const { generationCost } = require("../lib/credits");
const { json, readJson, getBearer, cors } = require("../lib/http");

/**
 * POST { prompt, kind?: "image"|"image_hd" }
 * Auth: Bearer session token
 * Spends credits, stores image in Blob, returns url.
 */
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return json(res, 503, { error: "media_not_configured", detail: "OPENAI_API_KEY missing" });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 503, { error: "storage_not_configured" });
    }

    const token = getBearer(req);
    const session = await db.getSession(token);
    if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
      return json(res, 401, { error: "unauthorized" });
    }

    const body = await readJson(req);
    const prompt = String(body.prompt || "").trim();
    const kind = body.kind === "image_hd" ? "image_hd" : "image";
    if (!prompt || prompt.length < 3) {
      return json(res, 400, { error: "prompt_required" });
    }
    if (prompt.length > 2000) {
      return json(res, 400, { error: "prompt_too_long" });
    }

    const cost = generationCost(kind);
    const user = await db.ensureUser(session.email);
    if ((user.credits || 0) < cost) {
      return json(res, 402, {
        error: "insufficient_credits",
        credits: user.credits || 0,
        need: cost,
        buy: "/#pricing",
      });
    }

    // Reserve credits first
    await db.addCredits(session.email, -cost, `generate:${kind}`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const size = kind === "image_hd" ? "1024x1024" : "1024x1024";
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";

    let b64;
    try {
      const img = await openai.images.generate({
        model,
        prompt,
        size,
        n: 1,
      });
      b64 = img.data?.[0]?.b64_json;
      if (!b64 && img.data?.[0]?.url) {
        // fetch remote
        const r = await fetch(img.data[0].url);
        const buf = Buffer.from(await r.arrayBuffer());
        b64 = buf.toString("base64");
      }
    } catch (err) {
      // refund on failure
      await db.addCredits(session.email, cost, `refund:generate_failed`);
      console.error("image gen failed", err);
      return json(res, 502, {
        error: "generation_failed",
        detail: String(err.message || err),
      });
    }

    if (!b64) {
      await db.addCredits(session.email, cost, `refund:empty_image`);
      return json(res, 502, { error: "empty_image" });
    }

    const id = db.randomToken(12);
    const buf = Buffer.from(b64, "base64");
    const blob = await put(`media-files/${session.email.replace(/[^a-z0-9@._-]/gi, "_")}/${id}.png`, buf, {
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
    return json(res, 500, { error: "generate_failed", detail: String(e.message || e) });
  }
};
