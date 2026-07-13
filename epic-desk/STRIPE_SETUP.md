# Stripe setup — Payment Links for Epic Everywhere

## Blocker (current)

The connected restricted key (`rk_live_…`) can **list products** but **cannot**:

- create products (`product_write`)
- create/read prices (`plan_read` / price write)
- create/read payment links (`payment_links_write` / `payment_links_read`)
- create customers/invoices

Until you unlock scopes **or** create links in the Dashboard, `paymentLink` fields stay `null` and the site uses the start form.

---

## Option A — Unlock key + auto-seed (preferred)

1. Stripe Dashboard → **Developers → API keys** → edit restricted key  
2. Enable at minimum:

| Permission | Why |
|------------|-----|
| Products — Write | Create SKU products |
| Prices — Write (+ Read) | Default prices |
| Payment Links — Write (+ Read) | Public buy URLs |
| Customers — Write/Read | Invoices later |
| Invoices — Write/Read | Package billing later |
| Checkout Sessions — Write | Optional alternate |

3. Put the key only in Machine secrets / env — **never git**.

4. After Vercel deploy, set success URL and seed:

```bash
export STRIPE_API_KEY='YOUR_RESTRICTED_OR_SECRET_KEY'   # shell / CI only — never git
export EPIC_SUCCESS_URL='https://YOUR_DOMAIN/success.html'
python3 epic-desk/scripts/seed_stripe_payment_links.py
python3 epic-desk/scripts/generate_config.py
git add epic-desk/catalog.live.json apps/epic-everywhere/config.js
git commit -m "feat: wire live Stripe Payment Links"
git push
```

5. Redeploy Vercel (or auto-deploy from GitHub).

---

## Option B — Dashboard manual (works with current key)

For each SKU in `epic-desk/catalog.full.json` (or start with featured micros):

1. **Product catalog → Add product**  
   - Name: `Epic Everywhere — {name}`  
   - One-time price in USD (cents from catalog)  
2. **Payment Links → New**  
   - Select that price  
   - After payment → redirect to `https://YOUR_DOMAIN/success.html`  
   - Enable promotion codes (optional)  
3. Copy `https://buy.stripe.com/...` into:

```json
// epic-desk/catalog.live.json → skus.<id>.payment_link
```

4. Run:

```bash
python3 epic-desk/scripts/generate_config.py
```

### Minimum live set (launch today)

| SKU | Amount |
|-----|--------|
| `cs-text-burst` | $4.99 |
| `workflow-fix` | $9.00 |
| `ai-starter-pack` | $2.99 |
| `credit-10` | $10.00 |
| `human-ticket` | $0.99 |
| `pilot-landing` | $750 |
| `agent-ops-setup` | $1,500 |
| `school-pilot` | $2,500 |

---

## Legal must be live first

Footer already links:

- `/legal/TERMS.md`
- `/legal/PRIVACY.md`
- `/legal/REFUNDS.md`

Do not promote Payment Links until the **deployed** site serves those URLs.

---

## Stripe Customer settings checklist

- [ ] Business name / support email: epictechai@gmail.com  
- [ ] Customer emails (receipts) enabled  
- [ ] Branding logo/color  
- [ ] Statement descriptor sensible  
- [ ] Public business details match Terms  

---

## After links exist

Site buy buttons auto-enable when `paymentLink` is non-null in generated `config.js`.  
Agent catalog: `epic-desk/catalog.live.json`.  
Public repo: https://github.com/Sm0k367/epic-everywhere

---

## Related: Stripe Projects (different product)

[Stripe Projects](https://docs.stripe.com/projects) (CLI public preview) provisions third-party services (Vercel, Supabase, Twilio, …) and syncs credentials to `.env`. It does **not** create Epic Everywhere Payment Links. For customer payments, use this doc + `seed_stripe_payment_links.py`. Project memory: `.kortix/memory/stripe-projects.md`.

