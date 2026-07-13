# Epic Everywhere

**Full-service AI customer success from [Epic Tech AI](https://x.com/EpicTechAI)**  
Chat help now · phone coaching next · live video tutoring after that — paid in micro-steps so anyone can start.

Contact: **epictechai@gmail.com** · X: [**@EpicTechAI**](https://x.com/EpicTechAI)

---

## What this repo is

Public product surface for **Epic Everywhere** / **Epic Desk**:

| Path | Purpose |
|------|---------|
| `apps/epic-everywhere/` | Static landing (Vercel-ready) |
| `epic-desk/` | Packages, CS scripts, runbook, catalog stub |
| `docs/` | Product vision, deploy plan, use case |

**Secrets are not in this repo.** Stripe, Slack, Vercel, GitHub, and model keys live in the Epic Tech AI / Machine secrets manager and are injected via the executor gateway.

---

## Money ladder

| Layer | Prices | Examples |
|-------|--------|----------|
| Micro | $0.99–$10 | ticket, starter pack, text CS, workflow fix, credits |
| Sessions | $12–$49 | phone 15/30, video tutor 25/50, class seat |
| Packages | $750–$2,500 | pilot landing, agent ops setup, school pilot |

See `epic-desk/PACKAGES.md` and `docs/product-epic-everywhere.md`.

---

## Local preview

```bash
python3 -m http.server 3000 --directory apps/epic-everywhere
# open http://localhost:3000
```

Paste Stripe **Payment Link** URLs into `apps/epic-everywhere/config.js` (`paymentLink` fields) and `epic-desk/catalog.live.json`.

---

## Deploy (Vercel)

1. Import this repo in Vercel  
2. **Root Directory:** `apps/epic-everywhere`  
3. Framework: Other (static)  
4. Deploy  

Details: `docs/DEPLOY.md`.

---

## Ops

- CS scripts: `epic-desk/CS_SCRIPTS.md`  
- Lead → package close: `epic-desk/RUNBOOK.md`  
- Week 0 vertical slice: landing + micro pay + chat CS  
- Phase 2: Twilio phone · Phase 3: Daily/LiveKit video  

---

## Security

- No API keys in git  
- Human approval before large Stripe charges  
- Restricted Stripe key in production dashboard only  

---

## License

Proprietary © Epic Tech AI. Contact for partnership or school pilots.

---

## Legal (read before payments)

Customer-facing policies live in [`apps/epic-everywhere/legal/`](./apps/epic-everywhere/legal/):

- [Terms of Service](./apps/epic-everywhere/legal/TERMS.md)
- [Privacy Policy](./apps/epic-everywhere/legal/PRIVACY.md)
- [Refund Policy](./apps/epic-everywhere/legal/REFUNDS.md)
- [Acceptable Use](./apps/epic-everywhere/legal/AUP.md)
- [AI Disclaimer](./apps/epic-everywhere/legal/AI-DISCLAIMER.md)
- [Cookie Policy](./apps/epic-everywhere/legal/COOKIES.md)
- [Proprietary License](./apps/epic-everywhere/legal/LICENSE.md)

Repository license summary: [LICENSE](./LICENSE)

These are an operational baseline; have counsel review for your jurisdiction before high-volume commerce.

---

## Catalog scale

- **60 SKUs** in [`epic-desk/catalog.full.json`](./epic-desk/catalog.full.json) (micro · sessions · packages · retainers · vertical kits)
- Live Stripe URLs in [`epic-desk/catalog.live.json`](./epic-desk/catalog.live.json)
- Generate site config: `python3 epic-desk/scripts/generate_config.py`
- Seed Payment Links (needs Stripe write scopes): `python3 epic-desk/scripts/seed_stripe_payment_links.py`
- Setup guide: [`epic-desk/STRIPE_SETUP.md`](./epic-desk/STRIPE_SETUP.md)
