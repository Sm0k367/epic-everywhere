/**
 * Map Epic Everywhere SKUs / amounts → studio credits.
 * 1 credit ≈ 1 standard image generation (or short CS unit).
 */
const SKU_CREDITS = {
  "human-ticket": 1,
  "tip-3": 1,
  "tip-5": 2,
  "ai-starter-pack": 3,
  "ai-starter-pack-pro": 10,
  "cs-text-burst": 5,
  "cs-text-burst-72": 12,
  "workflow-fix": 8,
  "workflow-fix-3": 24,
  "credit-5": 5,
  "credit-10": 10,
  "credit-25": 25,
  "credit-50": 50,
  "prompt-audit": 6,
  "tool-stack-map": 8,
  "media-pack-5": 5,
  "media-pack-20": 20,
  "media-pack-50": 50,
  "media-pack-100": 100,
  "image-single": 1,
  "image-burst-10": 10,
  "video-still-pack": 15,
};

function creditsForSku(sku) {
  if (!sku) return 0;
  return SKU_CREDITS[sku] || 0;
}

/** Fallback if metadata missing: $1 ≈ 1 credit for micros under $50 */
function creditsForAmountCents(cents) {
  if (!cents || cents <= 0) return 0;
  if (cents < 5000) return Math.max(1, Math.round(cents / 100));
  // packages: grant a starter media bonus only
  if (cents >= 75000) return 25;
  return Math.max(1, Math.round(cents / 200));
}

function generationCost(kind) {
  if (kind === "image_hd") return 2;
  if (kind === "image") return 1;
  return 1;
}

module.exports = {
  SKU_CREDITS,
  creditsForSku,
  creditsForAmountCents,
  generationCost,
};
