# How we build & deploy Epic Everywhere (real world)

**Honest answer:** we do **not** ship phone + live video + full CRM on day one.  
We ship a **thin vertical slice** that makes money and teaches AI, then add channels.

Contact: epictechai@gmail.com · x.com/@EpicTechAI

---

## The real-world system (what “all of it” means)

```
┌─────────────────────────────────────────────────────────────┐
│  CUSTOMER                                                    │
│  Web / X / Slack  →  (later) Phone  →  (later) Video tutor  │
└────────────┬────────────────┬────────────────┬──────────────┘
             │                │                │
             ▼                ▼                ▼
┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│ Landing (Vercel) │  │ Epic Desk   │  │ Twilio / Daily   │
│ buy · book · FAQ │  │ agent here  │  │ Phase 2 / 3      │
└────────┬─────────┘  └──────┬──────┘  └────────┬─────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│  STRIPE  micro links · packages · (later) credits ledger     │
│  SLACK   #leads #cs · human approve                          │
│  GITHUB  this repo · client deliverables                     │
│  MEMORY  .kortix/memory · client progress                    │
│  (later) SUPABASE CRM · LIVEKIT/DAILY rooms · CAL booking    │
└─────────────────────────────────────────────────────────────┘
```

| Piece | Who builds | Where it runs | When |
|-------|------------|---------------|------|
| Agent + runbooks + CS scripts | This Machine session | Machine cloud | **Live now** |
| Landing + micro buy CTAs | Static site in `apps/epic-everywhere/` | **Vercel** | **Week 0** |
| Stripe Payment Links | You in Dashboard (or agent after key unlock) | Stripe | **Week 0** |
| Slack CS / approve | Agent + you | Slack | **Week 0** |
| Phone coaching | Twilio + agent scripts | Twilio + Machine | Phase 2 |
| Live video tutoring | Daily/LiveKit + calendar | Vercel room page + provider | Phase 3 |
| Credits / portal | Supabase + small API | Vercel serverless or Machine app | Phase 4 |

---

## Vertical slice we ship first (Week 0)

**One real use case:**  
> A parent or founder lands on the site → picks **$4.99 text CS** or **$9 workflow fix** → pays Stripe → lands on success page → DMs / emails / Slack us → Epic Desk agent delivers help in chat using `CS_SCRIPTS.md`.

That is **real world**. Everything else is additive.

### Definition of done (Week 0)

- [ ] Public URL on Vercel (`epic-everywhere` or custom domain)  
- [ ] At least **3** live Stripe Payment Links in `epic-desk/catalog.live.json`  
- [ ] Success page tells them how to start CS (email / X / Slack)  
- [ ] You can complete one paid micro and one CS resolution end-to-end  
- [ ] Agent uses RUNBOOK + CS_SCRIPTS without inventing prices  

---

## Build plan (ordered, no fantasy)

### Step 1 — Product brain (done)

- Use case, packages, CS scripts, Epic Everywhere vision  
- Agent skill `epic-desk`  
- Memory decisions  

### Step 2 — Money rails (you + agent)

1. Stripe Dashboard → Payment Links for:  
   `$0.99` · `$2.99` · `$4.99` · `$9` · `$10`  
2. Paste URLs into `epic-desk/catalog.live.json`  
3. *Or* unlock restricted key scopes (`PACKAGES.md`) and say **“seed catalog”**  

Without this, the site can educate but **cannot cash**.

### Step 3 — Landing app (this repo)

Path: `apps/epic-everywhere/`

- Static HTML/CSS/JS (no GPU, no heavy framework)  
- Hero + problem + ladder + buy buttons (from catalog or placeholders)  
- “How it works” (chat → optional call → video later)  
- Contact / start CS  
- Deploy as Machine `[[apps]]` **or** Vercel project from GitHub  

### Step 4 — Wire Machine app (optional parallel)

Update `kortix.toml` `[[apps]]` to point at this repo’s landing folder when platform supports monorepo root — or keep Vercel as primary public edge.

Current `test-site6` points at an external template; replace with Epic Everywhere when ready.

### Step 5 — Operate (daily)

Epic Desk agent:

1. Pull leads from Slack / site form / X  
2. CS path or package path  
3. Human approve only for package charges  
4. Micro links can be self-serve from site  
5. Memory after wins  

### Step 6 — Phone (Phase 2)

When micro revenue covers ~$20–50/mo:

1. Twilio (or Telnyx) number  
2. Pipedream/OpenAPI connector in `kortix.toml`  
3. Inbound → transcript/summary → agent brief  
4. Sell `phone-15` / `phone-30` links  
5. Human overflow for hard cases  

### Step 7 — Live video tutoring (Phase 3)

1. Daily.co or LiveKit project  
2. After pay → create room → magic link email/SMS  
3. Tutor mode page (checklist + screen share)  
4. Consent flow for minors  
5. Group class calendar  

### Step 8 — Scale desk (Phase 4)

1. Supabase: customers, credits, sessions  
2. Self-serve portal: buy credits, book call/video  
3. Teacher/partner dashboard for school-pilot  

---

## Public GitHub product repo

**https://github.com/Sm0k367/epic-everywhere**

This is the Vercel-importable product surface (landing + docs + epic-desk). Machine monorepo remains the agent brain; secrets stay in dashboards.

## Deploy paths (concrete)

### A. Vercel (recommended public site)

```text
1. Push apps/epic-everywhere to GitHub (this repo or subtree)
2. Vercel → New Project → import repo
3. Root directory: apps/epic-everywhere
4. Framework: Other (static)
5. Deploy → copy URL
6. Optional: custom domain
```

Via executor (when team/project IDs known):

```text
vercel_token_auth.create_deployment
  name, team, project, branch
```

You must create the Vercel project once in the dashboard if it doesn’t exist; agent cannot invent team IDs.

### B. Machine `[[apps]]`

```toml
[[apps]]
slug = "epic-everywhere"
name = "Epic Everywhere"
enabled = true

[apps.source]
type = "git"
repo = "<this-github-repo-url>"
branch = "main"
# root / build settings depend on Machine app support for subdirs
```

Use when Machine hosting is the preferred edge; otherwise Vercel is fine.

### C. Local preview (every change)

```bash
python3 -m http.server 3000 --directory /workspace/apps/epic-everywhere
# open http://localhost:3000
```

---

## Env / secrets (never in git)

| Secret | Where | Used by |
|--------|-------|---------|
| Stripe restricted key | Machine Connectors | executor |
| Slack | Machine Connectors | executor |
| GitHub | Machine Connectors | executor |
| Vercel token | Machine Connectors | executor |
| Payment Link URLs | `catalog.live.json` (public) | site + agent |
| Twilio / Daily (later) | Machine secrets | Phase 2/3 |

Site only needs **public** Payment Link URLs — no Stripe secret on the frontend.

---

## Real-world use case walkthrough (parent)

1. Parent opens `https://<vercel>/`  
2. Clicks **$4.99 Text CS** → Stripe Checkout  
3. Success page: “Email epictechai@gmail.com or DM @EpicTechAI: I paid for text CS — help with kid homework + AI safely”  
4. You or Slack bot forwards to Epic Desk session  
5. Agent runs parent kit in `CS_SCRIPTS.md`  
6. Delivers rules + 3 prompts + workflow  
7. Offers **$25 video tutor** waitlist or **$15 phone** when live  
8. Memory: parent goal + what worked  

**Founder variant:** $9 workflow fix → $1,500 agent-ops-setup.  
**School variant:** free consult chat → $2,500 school-pilot.

---

## What I (the agent) do vs what you do

| Me | You |
|----|-----|
| Build site, docs, agent skills, runbooks | Approve Stripe key scopes / create Payment Links |
| Draft CS replies, quotes, invoices (when scoped) | Approve package charges; brand-sensitive public posts |
| Deploy when Vercel project + git access allow | Own legal entity, domain DNS, Twilio account KYC |
| Remember clients in memory via CR | Merge CRs; set pricing exceptions |

---

## Risk & freeze list

| Risk | Mitigation |
|------|------------|
| Stripe key too restricted | Dashboard Payment Links first |
| No domain yet | Use `*.vercel.app` |
| Phone/video too early | Waitlist + pre-sell only |
| Scope creep | Week 0 = landing + micro + chat CS only |
| GPU cost fantasy | Free LLM tiers only |

---

## Checklist — “we’re live in the real world”

- [ ] Landing URL live  
- [ ] 3+ micro Payment Links live  
- [ ] One paid test purchase (real card or Stripe test if test mode)  
- [ ] One CS resolution documented  
- [ ] Slack channel for CS  
- [ ] X bio/link points at landing  
- [ ] Package path still works for B2B  

Then — and only then — phone. Then video.

---

*Ship the slice. Cash the micro. Tutor later. That’s how this gets built for real.*
