# Seed Epic Desk Stripe catalog

Run after restricted key has `product_write` + `plan_read` (and ideally `checkout_session_write`).

## Option A — Agent (preferred)

Tell the agent:

> Seed Epic Desk Stripe catalog from epic-desk/PACKAGES.md. Create three products with default one-time USD prices 75000, 150000, 250000 cents. Write product IDs and price IDs into epic-desk/catalog.live.json via CR.

Agent uses executor:

```
stripe.create_product
  name: Epic Desk — Pilot Landing
  defaultPriceDataCurrency: usd
  defaultPriceDataUnitAmount: 75000

stripe.create_product
  name: Epic Desk — Agent Ops Setup
  defaultPriceDataCurrency: usd
  defaultPriceDataUnitAmount: 150000

stripe.create_product
  name: Epic Desk — School Pilot
  defaultPriceDataCurrency: usd
  defaultPriceDataUnitAmount: 250000
```

## Option B — Dashboard (works with current key)

1. Stripe Dashboard → Product catalog → Add product  
2. Create the three names/prices above  
3. Copy each `prod_…` and `price_…` into `epic-desk/catalog.live.json`  
4. Optional: Payment Links → create link per price → put URLs in catalog  

## catalog.live.json shape

```json
{
  "updated": "YYYY-MM-DD",
  "currency": "usd",
  "skus": {
    "pilot-landing": {
      "name": "Epic Desk — Pilot Landing",
      "amount_cents": 75000,
      "product_id": "prod_…",
      "price_id": "price_…",
      "payment_link": "https://buy.stripe.com/…"
    },
    "agent-ops-setup": { "...": "..." },
    "school-pilot": { "...": "..." }
  }
}
```

**Do not commit secret keys.** Product/price IDs and public payment link URLs are fine.
