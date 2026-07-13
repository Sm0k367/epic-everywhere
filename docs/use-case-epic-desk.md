# Use Case: Epic Desk — Secure Founder Ops Agent

**Product:** Epic Tech AI  
**Codename:** Epic Desk  
**One-liner:** An autonomous ops agent that turns a lead into a paid engagement — research, outreach draft, Slack handoff, Stripe checkout, and project memory — without ever holding an API key.

Contact: epictechai@gmail.com · x.com/@EpicTechAI

---

## Problem

Indie founders and small AI agencies lose deals to slow ops:

- Manual research across weathered tabs (company, pricing, market data)
- Copy-paste into chatbots that can’t charge, ship, or notify the team
- Keys pasted into prompts and leaked into git
- No durable memory of what was promised to which client

They cannot pay for DigitalOcean bare-metal GPUs. They need **SOTA-feeling capability at free/near-free cost**, with **revenue** on day one.

---

## Solution

**Epic Desk** is a Machine-hosted agent workflow on Epic Tech AI that:

1. Ingests a lead (Slack message, form, or chat)
2. Researches with **free public APIs** (no GPU farm)
3. Reasons with **free/SOTA LLM tiers** behind a gateway (keys never in the agent)
4. Drafts outreach and a scoped offer
5. Pings the human on **Slack** for approval
6. Opens **Stripe Checkout** only after human confirm
7. Scaffolds a client site/app via **Vercel** + **GitHub** when paid
8. Writes durable facts into **project memory** for the next session

---

## Who it’s for

| Persona | Pain | Why Epic Desk |
|---------|------|----------------|
| Solo AI consultant | Can’t afford ops hire + GPU bills | Free model tier + Stripe closes cash |
| 2–5 person agency | Leads die in Slack | Agent does research + checkout path |
| Tech-in-Schools / education pilots | Need demos that don’t leak keys | Executor security model |

---

## Happy path (one deal)

```
Lead arrives (Slack / chat)
        │
        ▼
┌───────────────────┐
│  Epic Desk agent  │
└─────────┬─────────┘
          │
          ├─1─ free tools: company/domain/FX/geo (public-api-lists)
          ├─2─ LLM: draft brief + proposal (Groq/Gemini via gateway)
          ├─3─ Slack: "Approve offer $X?"  ── human yes
          ├─4─ Stripe: Checkout session (restricted key)
          ├─5─ on paid → GitHub repo + Vercel deploy skeleton
          ├─6─ Supabase: store lead/deal row (optional)
          └─7─ memory: client, price, scope, next step
```

**Target time:** lead → paid link in **under 15 minutes** of human attention (mostly one Slack approve).

---

## What we already have wired

From `kortix.toml` connectors:

| Connector | Epic Desk use |
|-----------|----------------|
| `slack_v2` | Lead intake, approval pings, status updates |
| `stripe` | Checkout / PaymentIntent for the engagement fee |
| `github` | Create client repo, open PRs for deliverables |
| `vercel_token_auth` | Deploy landing page or client portal |
| `supabase` | CRM-lite: leads, deals, status |

Platform capabilities:

| Capability | Use |
|------------|-----|
| `kortix-executor` | All external calls; no raw keys in agent context |
| `.kortix/memory/` | Client glossary, pricing norms, past scope decisions |
| Change requests | Agent never merges production code without human review |

---

## Free SOTA compute layer (budget path)

Per project decision (2026-07-12): **no DO bare metal**. Stack:

| Layer | Implementation | Cost target |
|-------|----------------|-------------|
| Models | LiteLLM → Groq / Gemini free / OpenRouter `:free` | $0–low |
| Tools | Allowlist from [public-api-lists](https://github.com/public-api-lists/public-api-lists) `all.json` | $0 |
| Training / fine-tune (later) | Colab / Kaggle only if needed | $0 |
| Always-on GPU | **Not required** for this use case | $0 |

### Example free tools for this use case

| Tool name | Purpose | Auth preference |
|-----------|---------|-----------------|
| `fx_convert` | Quote multi-currency retainers | No (Frankfurter-class) |
| `crypto_spot` (optional) | If client pays in crypto narrative | No (Coinpaprika-class) |
| `holiday_check` | Delivery date promises | No (Nager.Date-class) |
| `ip_or_geo` | Rough locale for timezone in Slack | No / free key |
| `domain_hint` | Domainsdb-style lookup for lead quality | No |

Filter: **Auth = No**, **HTTPS = Yes**, cache 15–60 minutes.

---

## Security model (non-negotiable)

Matches Epic Tech AI README:

1. Agent **never** sees `STRIPE_API_KEY`, LLM keys, or Vercel tokens.
2. Stripe key is **restricted** (checkout/customers only — no refunds/payouts).
3. **Charge only after human Slack approve** (or explicit confirmed workflow).
4. No leaked-key harvesting; only **own** free-tier accounts.
5. Memory files hold client *facts*, never secrets or card data.
6. Code/deploy changes go through **change requests**.

---

## Money model

| Stream | How |
|--------|-----|
| **Engagement fee** | Stripe Checkout for fixed-scope pilot ($500–$5k typical) |
| **Retainer** | Monthly Checkout / subscription once pilot converts |
| **Productized packages** | “Landing page in 48h”, “Agent ops setup”, “School pilot kit” |

Epic Desk does **not** invent prices. Pricing tiers live in config/memory; agent only creates Checkout for an approved amount.

### Example packages (editable)

| SKU | Price | Deliverable |
|-----|-------|-------------|
| `pilot-landing` | $750 | One-page site on Vercel + basic form |
| `agent-ops-setup` | $1,500 | Epic Tech project + Slack + Stripe wired |
| `school-pilot` | $2,500 | Branded agent workspace + teacher handoff doc |

---

## Agent behavior (spec)

### Inputs

- Slack thread or user message: company name, contact, rough need, budget hint  
- Optional: URL, email, deadline  

### Steps

1. **Normalize lead** → structured JSON (`company`, `contact`, `need`, `budget`, `deadline`).
2. **Research** → public tools only; summarize in 5 bullets.
3. **Match SKU** → from package table; if unclear, ask one clarifying question.
4. **Draft** → proposal (scope, out of scope, timeline, price).
5. **Human gate** → Slack Block Kit / message with Approve / Edit / Reject.
6. **On Approve** → `stripe` checkout session; post payment link to Slack + client email if available.
7. **On paid webhook / status check** → create GitHub repo from template; trigger Vercel deploy; write Supabase deal = `won`.
8. **Memory** → client name, SKU, price, repo URL, next milestone (via CR).

### Failure modes

| Failure | Behavior |
|---------|----------|
| Public API rate limit | Use cached data or skip tool; don’t invent facts |
| LLM free tier 429 | Fail over via LiteLLM router to next free provider |
| Human rejects | Close deal as `lost`; memory note only if pattern is durable |
| Stripe error | Slack error to human; never retry charge without re-approval |

---

## Success metrics

| Metric | Target (first 30 days) |
|--------|-------------------------|
| Time lead → checkout link | < 15 min human time |
| Checkout conversion | ≥ 20% of approved offers |
| Key leaks | **0** |
| GPU spend | **$0** |
| Deals with memory continuity | 100% of won deals |

---

## Build phases

### Phase 0 — Docs & config (this doc)

- [x] Use case written  
- [x] Package table + runbook (`epic-desk/`)  
- [x] epic-desk skill + agent  
- [ ] **Unblock Stripe restricted key** (scopes in `epic-desk/PACKAGES.md`)  
- [ ] Seed `catalog.live.json` with price IDs / payment links  

### Phase 1 — Happy path MVP (no custom UI)

1. [x] Runbook: lead → research → approve → invoice path documented  
2. Slack trigger: message in `#leads` with company name  
3. Agent research stub (2–3 free APIs) + LLM draft  
4. Human approve → Stripe invoice/pay link via executor  
5. Memory entry for won deal  

### Phase 2 — Ship path

1. On paid → GitHub repo from template  
2. Vercel deploy of `test-site6`-style or client template  
3. Supabase deal row  

### Phase 3 — Productize

1. LiteLLM connector as HTTP OpenAPI tool  
2. public-api-lists allowlist service  
3. Public landing page: “Book a pilot” → same flow  
4. Metrics dashboard (Supabase)  

---

## Example Slack conversation

```
human: New lead — Acme Tutoring wants an AI homework helper for 3 schools. Budget ~2k. Need something live in 2 weeks.

agent: Lead normalized.
      Research (free tools): US-based education org signals; no holiday block on proposed go-live week.
      Recommended SKU: school-pilot ($2,500) — slightly over stated budget; alt pilot-landing ($750) too small for 3 schools.
      Draft proposal ready.

      Approve school-pilot @ $2,500?
      [Approve] [Propose $2,000] [Reject]

human: [Approve]

agent: Stripe Checkout created (restricted key via executor).
      Pay link: https://checkout.stripe.com/...
      Posted to this thread. I will not charge again without a new approval.
```

---

## Why this use case fits Epic Tech AI

| Epic Tech claim | Epic Desk proof |
|-----------------|-----------------|
| Real power (not toy chat) | Stripe + Slack + GitHub + Vercel |
| SOTA models without key leak | Free LLM gateway + executor |
| Memory brain | Client/deal continuity across sessions |
| Revenue by design | Checkout only after human gate |
| Bootstrapped compute | Public APIs + free model tiers, not DO H100s |

---

## Non-goals

- Training foundation models or renting bare-metal GPUs  
- Fully autonomous charging without human approval  
- Scraping or using **leaked** third-party API keys  
- Replacing a full CRM in v1  

---

## Next actions

1. Put package table into `.kortix/memory/` (pricing norms).  
2. Implement Phase 1 as a skill or agent prompt + Slack trigger.  
3. Add LiteLLM + tool allowlist when ready (HTTP connectors).  
4. Run one internal dry-run deal end-to-end.

---

*Epic Tech AI — autonomous when it should be, secure when it must be, profitable by design.*
