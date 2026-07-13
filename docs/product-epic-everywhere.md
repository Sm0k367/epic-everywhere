# Product: Epic Everywhere — AI for everyone, paid in micro-steps

**Brand:** Epic Tech AI · **Engine:** Epic Desk  
**Pitch:** Full-service AI customer success that meets people where they are — chat → phone → live video tutoring — paid by micro-transactions so anyone can start.

Contact: epictechai@gmail.com · x.com/@EpicTechAI

---

## Pain we solve

Most people are **not** “using AI in every way.” They hit:

| Barrier | What it feels like |
|---------|-------------------|
| Blank prompt fear | “I don’t know what to ask” |
| Tool chaos | 20 apps, zero workflow |
| No human path | Chatbot loops; no voice/video help |
| Big-ticket only | $50–$200/mo before they trust it |
| Trust / safety | Kids, schools, non-tech adults need a guide |

**Epic Everywhere** removes the first mile: tiny paid steps, real help (text → call → live tutor), then optional bigger packages when they’re hooked.

---

## Positioning

> **Epic Tech AI is full-service AI CS.**  
> We don’t just give you a chatbot. We **onboard you, answer you, call you, and tutor you live** — and you can start for the price of a coffee.

Not “AGI for free.”  
**Guided adoption + support**, monetized in **micro-transactions**, upgraded into **Desk / School / Ops** packages.

---

## Service ladder (how money works)

```
FREE touch          MICRO ($)              SESSIONS ($$)           RETAIN ($$$)
─────────────       ──────────────         ──────────────          ────────────
X / site demo  →    ticket / tip / min  →  phone or video tutor →  Desk / School / Pro
                    ($0.99–$9)             ($15–$49)               ($750–$2,500+)
```

### Layer A — Micro-transactions (volume, low friction)

| SKU | Price | What they get | Pain solved |
|-----|------:|---------------|-------------|
| `human-ticket` | **$0.99** | “Verified human / entry” style access (already in Stripe: AI Open Mic ticket) | Bot noise; commitment-free entry |
| `ai-starter-pack` | **$2.99** | 10 guided prompts + personal “AI starter plan” PDF/chat | Blank-page fear |
| `cs-text-burst` | **$4.99** | 24h text CS: setup help for ChatGPT/Claude/Gemini/phone AI | Stuck alone |
| `workflow-fix` | **$9.00** | One pain → one AI workflow (email, homework, sales, content) | “How do I use this for *my* life?” |
| `credit-10` | **$10.00** | 10 platform credits (1 credit ≈ 1 text resolution or 2 min voice later) | Prepaid micro usage |

**Stripe fit:** Payment Links + existing micro product (`prod_UOA242Qhon0mDP` Open Mic ticket). Meter later with billing meters when scopes allow.

### Layer B — Live help sessions (margin)

| SKU | Price | Channel | What they get |
|-----|------:|---------|----------------|
| `phone-15` | **$15** | Phone (Twilio/Telnyx — Phase 2) | 15 min guided AI setup call |
| `phone-30` | **$29** | Phone | 30 min deep-dive (role: parent, teacher, founder, student) |
| `video-tutor-25` | **$25** | Live video (Daily/LiveKit — Phase 3) | 25 min screen-share tutoring: *do the task with them* |
| `video-tutor-50` | **$49** | Live video | 50 min project session (homework, job app, small business) |
| `class-seat` | **$12** | Group video | 1 seat in weekly “AI for everyone” group class |

### Layer C — Full service / transform (Epic Desk core)

| SKU | Price | What they get |
|-----|------:|---------------|
| `pilot-landing` | **$750** | Site + funnel for *their* AI offer |
| `agent-ops-setup` | **$1,500** | Their Slack/Stripe/agent ops wired |
| `school-pilot` | **$2,500** | School/classroom AI adoption pilot |
| `epic-os-desk` / `pro` | catalog | Ongoing productized OS (existing Stripe products) |

**Upsell rule:** every micro or session ends with *one* clear next step (not a spam menu).

---

## Full-service CS model

Epic Desk CS is not a ticket black hole. It’s a **guided adoption service**.

### Channels (phased)

| Phase | Channel | Who answers | Status |
|-------|---------|-------------|--------|
| **1 — Now** | Chat (this agent) + Slack + email handoff | Epic Desk agent + human escalate | **Build now** |
| **2** | Phone in/out | Agent script + human overflow; Twilio/Telnyx connector | Needs connector + number |
| **3** | Live video tutoring | Daily.co / LiveKit room + calendar; agent co-pilot in room | Needs video + calendar |
| **4** | Omnichannel desk | Unified thread (chat/SMS/phone/video) in Supabase CRM | After 1–3 cashflow |

### CS playbook (every contact)

1. **Identify role** — student / parent / teacher / founder / employee / senior  
2. **Name one job-to-be-done** — “send better emails”, “help kid with math using AI safely”, “automate invoices”  
3. **Do it with them** (not lecture) — copy-paste steps, screen path, or live session  
4. **Micro-charge or credit burn** when value delivered  
5. **Book next** — tip → session → package  
6. **Memory** — what they learned, tools they use, next milestone  

### Safety rails (especially tutoring / schools)

- No exams cheating service; teach *how to learn with AI*  
- Minors: parent/guardian consent path before phone/video  
- Human escalate for medical/legal/crisis  
- Session recording only with explicit consent  
- Keys never in chat logs  

---

## “AI in every way” — coverage map

We don’t boil the ocean. We cover **life domains** with the same CS motion:

| Domain | Micro entry | Session | Package |
|--------|-------------|---------|---------|
| **School / homework** | starter-pack, workflow-fix | video-tutor | school-pilot |
| **Parents** | cs-text-burst | phone-15 | school-pilot family add-on |
| **Job / career** | workflow-fix | video-tutor-50 | agent-ops-setup |
| **Small business** | workflow-fix | phone-30 | pilot-landing → ops-setup |
| **Creators** | human-ticket, credits | video-tutor | Epic OS Desk |
| **Non-tech adults** | phone-15 first | phone-30 | light retain |

**North star metric:** *Weekly active humans who completed one AI-assisted real task* (not chat volume).

---

## Architecture (stay bootstrapped)

```
Customer
   │
   ├─ Web / X / Slack  ──► Epic Desk agent (Machine)
   │                         │
   │                         ├─ free LLM gateway (LiteLLM / free tiers)
   │                         ├─ public-api tools
   │                         ├─ Stripe micro + packages (executor)
   │                         └─ memory (client progress)
   │
   ├─ Phone (P2) ── Twilio/Telnyx ──► same agent scripts + human overflow
   │
   └─ Video (P3) ── Daily/LiveKit room ──► tutor mode + co-pilot panel
```

**Cost doctrine (unchanged):** no bare-metal GPUs; free/cheap inference; charge humans for *attention and outcomes*, not for our H100 fantasy.

### Connectors to add later

| Need | Connector |
|------|-----------|
| Phone | Twilio or Telnyx (Pipedream/OpenAPI) |
| SMS | Twilio |
| Video rooms | Daily.co or LiveKit API |
| Calendar booking | Cal.com / Google Calendar |
| CRM | Supabase (already in stack; re-enable when shared) |
| Email CS | Gmail/Resend |

---

## Money math (why micro works)

Illustrative unit economics (targets, not promises):

| Mix | Example month |
|-----|----------------|
| 200 × $0.99 tickets | $198 |
| 80 × $4.99 text bursts | $399 |
| 40 × $9 workflow fixes | $360 |
| 20 × $25 video sessions | $500 |
| 2 × $1,500 ops setups | $3,000 |
| **Rough top line** | **~$4.4k** |

Micro pays attention cost; packages pay the project.  
**Do not** wait for packages only — micro is the top of funnel *and* cash.

---

## Build phases (what we actually ship)

### Phase 1 — Full-service CS (text) + micro-tx **(NOW)**

- [x] Product doc (this file)  
- [x] Micro SKU ladder in packages/catalog  
- [ ] Stripe Payment Links for $0.99 / $2.99 / $4.99 / $9 / $10 (Dashboard or key unlock)  
- [ ] CS scripts: role → job → steps → pay → next  
- [ ] Slack `#cs` + `#leads` routing  
- [ ] Landing blurb: “AI help from $0.99” on Vercel  

### Phase 2 — Phone CS

- [ ] Buy number (Twilio/Telnyx)  
- [ ] Connector + inbound webhook → agent brief + optional human  
- [ ] SKUs `phone-15` / `phone-30` Payment Links  
- [ ] After-call summary to memory + upsell  

### Phase 3 — Live video tutoring

- [ ] Daily/LiveKit rooms + magic links after pay  
- [ ] Tutor mode UI: shared checklist + “do the task”  
- [ ] Group class calendar (`class-seat`)  
- [ ] School-safe consent flow  

### Phase 4 — Everywhere desk

- [ ] Unified customer record (Supabase)  
- [ ] Credits ledger  
- [ ] Self-serve portal: buy credits, book call/video  
- [ ] Partner/teacher dashboard  

---

## Agent behavior (Epic Desk CS mode)

When user wants help using AI (not a B2B build quote):

1. Detect **CS / tutoring** intent vs **build package** intent  
2. If CS: run micro ladder; don’t jump to $1,500  
3. Deliver value in-thread first (free or credit)  
4. Offer **one** micro SKU if they need more depth  
5. For voice/video requests before Phase 2/3:  
   - Take payment intent + email  
   - Book waitlist / manual call until connector lives  
   - Never fake a live call  

When user is a school/business buying adoption at scale → school-pilot / ops-setup.

---

## Brand line options

- “AI for everyone — start at 99¢.”  
- “Full-service AI CS: chat, call, live tutor.”  
- “We don’t leave you with a chatbot. We get you using AI.”  

---

## Non-goals

- Free unlimited human phone/video (that dies)  
- Doing homework *for* students  
- Training foundation models on DO bare metal  
- Harvesting leaked API keys  

---

## Immediate next actions

1. **You:** create Stripe Payment Links for micro SKUs (or unlock key scopes).  
2. **Agent:** CS scripts + package/catalog update (this PR).  
3. **Together:** first 10 micro sales via X/Slack/network.  
4. **Then:** Twilio number when micro cash covers ~$20–50/mo phone cost.  

---

*Epic Tech AI — full-service AI CS. Micro to start. Voice and video when the money and connectors say go.*
