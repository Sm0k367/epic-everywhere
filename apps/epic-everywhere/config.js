/**
 * Epic Everywhere public config.
 * Paste Stripe Payment Link URLs into `paymentLink` when ready.
 * Keep secrets out of this file — links are public by design.
 */
window.EPIC_CONFIG = {
  brand: "Epic Tech AI",
  contactEmail: "epictechai@gmail.com",
  xUrl: "https://x.com/EpicTechAI",
  successPath: "./success.html",
  skus: [
    {
      id: "human-ticket",
      layer: "micro",
      name: "Human / entry ticket",
      price: "$0.99",
      blurb: "Low-friction entry pass.",
      paymentLink: null
    },
    {
      id: "ai-starter-pack",
      layer: "micro",
      name: "AI Starter Pack",
      price: "$2.99",
      blurb: "10 guided prompts + personal plan.",
      paymentLink: null
    },
    {
      id: "cs-text-burst",
      layer: "micro",
      name: "Text CS Burst (24h)",
      price: "$4.99",
      blurb: "24h text customer success on your setup.",
      paymentLink: null,
      featured: true
    },
    {
      id: "workflow-fix",
      layer: "micro",
      name: "Workflow Fix",
      price: "$9",
      blurb: "One pain → one reusable AI workflow.",
      paymentLink: null
    },
    {
      id: "credit-10",
      layer: "micro",
      name: "Credit Pack 10",
      price: "$10",
      blurb: "Prepaid credits for ongoing help.",
      paymentLink: null
    },
    {
      id: "phone-15",
      layer: "session",
      name: "Phone coaching 15m",
      price: "$15",
      blurb: "Guided AI setup call.",
      paymentLink: null,
      phase: "Phase 2"
    },
    {
      id: "phone-30",
      layer: "session",
      name: "Phone coaching 30m",
      price: "$29",
      blurb: "Deep-dive coaching call.",
      paymentLink: null,
      phase: "Phase 2"
    },
    {
      id: "video-tutor-25",
      layer: "session",
      name: "Live video tutor 25m",
      price: "$25",
      blurb: "Screen-share. Do the task together.",
      paymentLink: null,
      phase: "Phase 3"
    },
    {
      id: "video-tutor-50",
      layer: "session",
      name: "Live video tutor 50m",
      price: "$49",
      blurb: "Project session with reusable pack.",
      paymentLink: null,
      phase: "Phase 3"
    },
    {
      id: "class-seat",
      layer: "session",
      name: "Group class seat",
      price: "$12",
      blurb: "Weekly AI-for-everyone class.",
      paymentLink: null,
      phase: "Phase 3"
    },
    {
      id: "pilot-landing",
      layer: "package",
      name: "Pilot Landing",
      price: "$750",
      blurb: "One-page site + form on Vercel.",
      paymentLink: null
    },
    {
      id: "agent-ops-setup",
      layer: "package",
      name: "Agent Ops Setup",
      price: "$1,500",
      blurb: "Slack + Stripe + agent ops wired.",
      paymentLink: null
    },
    {
      id: "school-pilot",
      layer: "package",
      name: "School Pilot",
      price: "$2,500",
      blurb: "Classroom AI adoption pilot.",
      paymentLink: null
    }
  ]
};
