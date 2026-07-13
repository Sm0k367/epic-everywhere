const { setCors } = require("./security");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return null; // invalid JSON
  }
}

function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function cors(req, res) {
  // support both cors(res) legacy and cors(req,res)
  if (res === undefined) {
    // old signature cors(res) — treat first arg as res, no origin filter
    const onlyRes = req;
    onlyRes.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    onlyRes.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Stripe-Signature, x-admin-key"
    );
    return;
  }
  setCors(req, res);
}

module.exports = { json, readBody, readJson, getBearer, cors };
