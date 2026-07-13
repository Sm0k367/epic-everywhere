# Security — Epic Everywhere production

## Customer money path (no fake payments)

1. Customer pays only on **Stripe Checkout / Payment Links** (PCI by Stripe).
2. Success URL includes `{CHECKOUT_SESSION_ID}`.
3. Browser calls **`POST /api/claim`** with that id.
4. Server **retrieves the session from Stripe API** and checks `payment_status=paid`.
5. Credits granted **once** (idempotent claim file in Blob).
6. Optional: Stripe **webhook** with **signature verification** also grants (same idempotency).

**Unsigned webhook bodies are rejected** when `STRIPE_WEBHOOK_SECRET` is required (always in current code).

Fake `session_id` values fail Stripe retrieve → no credits.

## Auth

- Passwordless OTP; **code stored hashed** (not plaintext).
- Attempt limits; rate limits per IP/email.
- Sessions: 7-day bearer tokens.
- `AUTH_DEBUG=1` returns codes in API (ops only). Set `AUTH_DEBUG=0` + email delivery for hard lockdown.
- `FORCE_SECURE=1` disables debug grant paths.

## Admin

- `/admin` + `/api/admin/*` require `ADMIN_KEY` (timing-safe compare).
- Dev grant requires admin key; disabled under `FORCE_SECURE=1`.

## Rate limits

Applied on auth, claim, generate, admin, webhook (per-instance memory).

## Headers

CSP, X-Frame-Options DENY, nosniff, referrer policy on all routes.

## Required env (Vercel)

| Var | Purpose |
|-----|---------|
| `STRIPE_API_KEY` | Server Stripe calls (restricted key with needed scopes) |
| `STRIPE_WEBHOOK_SECRET` | **Required** for webhook endpoint |
| `OPENAI_API_KEY` | Image generation |
| `BLOB_READ_WRITE_TOKEN` | DB + media storage |
| `ADMIN_KEY` | Admin console |
| `AUTH_DEBUG` | `0` in hard prod if email OTP live; `1` only while bootstrapping |
| `FORCE_SECURE` | `1` to hard-disable debug grants |
| `ALLOWED_ORIGINS` | Optional CSV of CORS origins |
| `OPENAI_IMAGE_MODEL` | e.g. `gpt-image-1-mini` |

## Stripe Dashboard (you)

1. **Developers → Webhooks → Add endpoint**  
   URL: `https://epic-everywhere.vercel.app/api/webhook/stripe`  
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`  
2. Copy **Signing secret** → Vercel env `STRIPE_WEBHOOK_SECRET` → redeploy  
3. Restricted key: keep **no payouts**; products/prices/payment_links/checkout as needed  
4. Prefer **webhook_write** only if automating endpoint creation  

## Not hackable claims (within design)

| Attack | Mitigation |
|--------|------------|
| POST fake paid webhook | Signature required |
| Fake session_id claim | Stripe retrieve + paid check |
| Double credit same payment | Idempotent claims |
| OTP brute force | Rate limit + attempt cap + hashed OTP |
| Free generate | Credits required; deduct first |
| Admin without key | 401 |
| Clickjacking | X-Frame-Options DENY + CSP |

## Residual risks (honest)

- Blob JSON DB is not private ACLs on every object; paths are unguessable hashes — upgrade to Postgres RLS later.
- AUTH_DEBUG exposes codes if left on.
- OpenAI/Stripe account compromise is out of app scope — protect dashboard 2FA.
- Serverless rate limits are best-effort per instance.

## Customer satisfaction + security

Happy path: pay → claim verifies with Stripe → Studio login → generate.  
No code path grants paid credits without Stripe confirmation when webhook secret is set and claim is used.
