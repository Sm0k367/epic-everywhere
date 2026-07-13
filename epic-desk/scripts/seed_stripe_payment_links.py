#!/usr/bin/env python3
"""
Create Stripe Products + Prices + Payment Links for every SKU in catalog.full.json.

Requires STRIPE_API_KEY with:
  product_write, plan_write (prices), payment_links_write
  (and product_read / plan_read / payment_links_read to resume)

Usage:
  export STRIPE_API_KEY='YOUR_RESTRICTED_OR_SECRET_KEY'
  python3 epic-desk/scripts/seed_stripe_payment_links.py

Writes/updates: epic-desk/catalog.live.json
Then run: python3 epic-desk/scripts/generate_config.py

NEVER commits the API key. Payment Link URLs are public and safe to commit.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "epic-desk" / "catalog.full.json"
LIVE = ROOT / "epic-desk" / "catalog.live.json"
API = "https://api.stripe.com/v1"


def stripe(method: str, path: str, data: dict | None = None) -> dict:
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        raise SystemExit("STRIPE_API_KEY not set")
    body = None
    headers = {"Authorization": f"Bearer {key}"}
    if data is not None:
        body = urllib.parse.urlencode(data, doseq=True).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(API + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f"{method} {path} -> {e.code}: {err[:500]}") from e


def load_live() -> dict:
    if LIVE.exists():
        return json.loads(LIVE.read_text())
    return {
        "updated": None,
        "currency": "usd",
        "status": "seeding",
        "skus": {},
        "existing_account_products": {},
    }


def main() -> int:
    full = json.loads(CATALOG.read_text())
    live = load_live()
    live.setdefault("skus", {})
    success_url = os.environ.get(
        "EPIC_SUCCESS_URL",
        "https://example.com/success.html",  # replace after Vercel deploy
    )
    created = 0
    skipped = 0
    errors = []

    for s in full["skus"]:
        sid = s["id"]
        existing = live["skus"].get(sid) or {}
        if existing.get("payment_link") and existing.get("price_id"):
            skipped += 1
            continue
        # Skip pure phase placeholders if env set
        if s.get("phase") and os.environ.get("SKIP_PHASED") == "1":
            skipped += 1
            continue
        try:
            prod = stripe(
                "POST",
                "/products",
                {
                    "name": f"Epic Everywhere — {s['name']}",
                    "description": s.get("blurb") or s["name"],
                    "metadata[sku]": sid,
                    "metadata[layer]": s.get("layer", ""),
                    "metadata[vertical]": s.get("vertical", ""),
                    "default_price_data[currency]": "usd",
                    "default_price_data[unit_amount]": str(int(s["amount_cents"])),
                    **(
                        {
                            "default_price_data[recurring][interval]": s["recurring"],
                        }
                        if s.get("recurring")
                        else {}
                    ),
                },
            )
            price_id = prod.get("default_price")
            if isinstance(price_id, dict):
                price_id = price_id.get("id")
            if not price_id:
                # fetch product
                prod2 = stripe("GET", f"/products/{prod['id']}")
                price_id = prod2.get("default_price")
            pl = stripe(
                "POST",
                "/payment_links",
                {
                    "line_items[0][price]": price_id,
                    "line_items[0][quantity]": "1",
                    "metadata[sku]": sid,
                    "after_completion[type]": "redirect",
                    "after_completion[redirect][url]": success_url,
                    "allow_promotion_codes": "true",
                    "billing_address_collection": "auto",
                },
            )
            live["skus"][sid] = {
                "name": s["name"],
                "amount_cents": int(s["amount_cents"]),
                "product_id": prod["id"],
                "price_id": price_id,
                "payment_link": pl.get("url"),
                "payment_link_id": pl.get("id"),
                "layer": s.get("layer"),
                "vertical": s.get("vertical"),
                "phase": s.get("phase"),
            }
            created += 1
            print(f"OK {sid} -> {pl.get('url')}")
        except Exception as e:
            msg = str(e)
            errors.append(f"{sid}: {msg[:200]}")
            print(f"ERR {sid}: {msg[:200]}", file=sys.stderr)
            # permission errors: stop early
            if "Permission denied" in msg or "403" in msg:
                print(
                    "\nStripe key lacks write scopes. Enable product_write, "
                    "price/plan write, payment_links_write on the restricted key.\n"
                    "Dashboard: https://dashboard.stripe.com/apikeys\n",
                    file=sys.stderr,
                )
                break

    from datetime import date

    live["updated"] = date.today().isoformat()
    live["status"] = "partial" if errors else "live"
    live["currency"] = "usd"
    LIVE.write_text(json.dumps(live, indent=2) + "\n")
    print(f"\nCreated {created}, skipped {skipped}, errors {len(errors)}")
    print(f"Wrote {LIVE}")
    if created:
        print("Next: python3 epic-desk/scripts/generate_config.py")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
