# Do this once (copy-paste simple)

You do **not** need to understand the whole stack.  
Customers already unlock via **secure claim** after Stripe pay.  
Do these steps so **everything** is finished.

---

## Already done for you

- Website live: https://epic-everywhere.vercel.app/
- Studio: https://epic-everywhere.vercel.app/studio/
- Admin: https://epic-everywhere.vercel.app/admin/
- 66 Payment Links live in Stripe
- After pay → success page → auto-checks with Stripe (no fake payments)
- Legal pages live

---

## Step 1 — Stripe webhook (5 minutes) ← only critical leftover

This is a **backup** so credits still land if the browser never hits the success page.

1. Open: https://dashboard.stripe.com/webhooks  
2. Click **Add endpoint** (or **+ Add destination**)  
3. Endpoint URL — paste exactly:

```text
https://epic-everywhere.vercel.app/api/webhook/stripe
```

4. Events to send — select:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded` (if listed)

5. Click **Add endpoint**  
6. Open the new endpoint → **Reveal** under **Signing secret**  
7. Copy the secret (starts with `whsec_`)

### Put secret on Vercel

1. Open: https://vercel.com/epic-tech-ai-projects/epic-everywhere/settings/environment-variables  
   (or Vercel → project **epic-everywhere** → Settings → Environment Variables)

2. **Add**:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: paste `whsec_…`
   - Environments: Production + Preview

3. **Save**

4. Deployments → **⋯** on latest → **Redeploy** (or push any commit)

---

## Step 2 — OpenAI billing (so images actually generate)

1. Open: https://platform.openai.com/settings/organization/billing  
2. Add payment method / credits if it says hard limit reached  
3. Without this, Studio login works but **Generate** fails

---

## Step 3 — Test like a customer (2 minutes)

1. Open https://epic-everywhere.vercel.app/  
2. Unlock something small (e.g. Media Pack or $1.50 single image) with **your real email**  
3. Finish Stripe checkout  
4. You should land on success → “Access confirmed…”  
5. Open https://epic-everywhere.vercel.app/studio/  
6. Same email → Send code → (while `AUTH_DEBUG` is on, code appears) → Verify  
7. Generate an image  

If step 7 fails with billing error → finish Step 2.

---

## Step 4 — Admin (you only)

1. https://epic-everywhere.vercel.app/admin/  
2. Paste your **ADMIN_KEY** (in Vercel env `ADMIN_KEY`, or the one we generated for you)  
3. See users, grant access if someone is stuck  

---

## Optional later

| Item | When |
|------|------|
| Custom domain DNS for sm0k367.com | When you want branded URL |
| `AUTH_DEBUG=0` + real email codes | When you add Resend/Postmark |
| `FORCE_SECURE=1` | After email OTP works |

---

## If something fails

| Symptom | Fix |
|---------|-----|
| Paid but no Studio access | Email must match receipt; open success page once; or Admin → grant credits |
| Generate fails | OpenAI billing |
| Webhook shows red in Stripe | Check URL + `STRIPE_WEBHOOK_SECRET` + redeploy |
| Forgot admin key | Vercel → epic-everywhere → Settings → Env → `ADMIN_KEY` (reveal/rotate) |

---

**That’s the whole “get it done” list.**  
Code + site + Stripe products are already live; Step 1 + 2 are dashboard clicks only.
