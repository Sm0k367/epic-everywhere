(function () {
  const cfg = window.EPIC_CONFIG || { skus: [] };

  const year = document.getElementById("y");
  if (year) year.textContent = String(new Date().getFullYear());

  const countEl = document.getElementById("sku-count");
  if (countEl) countEl.textContent = String(cfg.skuCount || (cfg.skus || []).length);

  const linked = (cfg.skus || []).filter((s) => s.paymentLink).length;
  const linkStatus = document.getElementById("link-status");
  if (linkStatus) {
    if (linked > 0) {
      linkStatus.textContent =
        linked + " live Stripe Payment Links · buy opens secure Checkout";
      linkStatus.classList.add("is-live");
    } else {
      linkStatus.textContent =
        "Payment Links pending — buttons open the start form.";
    }
  }

  /* Mobile nav */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  function card(sku) {
    const hasLink = Boolean(sku.paymentLink);
    const phase = sku.phase
      ? '<span class="badge phase">' + escapeHtml(sku.phase) + "</span>"
      : sku.featured
        ? '<span class="badge">Popular</span>'
        : sku.vertical
          ? '<span class="badge vertical">' + escapeHtml(sku.vertical) + "</span>"
          : "";
    const href = hasLink ? sku.paymentLink : "#start";
    const btnClass = hasLink ? "btn btn-buy" : "btn btn-buy is-waitlist";
    const btnLabel = hasLink
      ? "Buy " + sku.price
      : sku.phase
        ? "Waitlist"
        : "Get help";
    return (
      '<article class="price-card" data-sku="' +
      escapeHtml(sku.id) +
      '" data-vertical="' +
      escapeHtml(sku.vertical || "") +
      '" data-layer="' +
      escapeHtml(sku.layer || "") +
      '">' +
      phase +
      "<h4>" +
      escapeHtml(sku.name) +
      "</h4>" +
      '<div class="amount">' +
      escapeHtml(sku.price) +
      "</div>" +
      "<p>" +
      escapeHtml(sku.blurb) +
      "</p>" +
      '<a class="' +
      btnClass +
      '" href="' +
      escapeAttr(href) +
      '" ' +
      (hasLink ? 'target="_blank" rel="noopener noreferrer"' : "") +
      ' data-sku-buy="' +
      escapeHtml(sku.id) +
      '">' +
      btnLabel +
      "</a></article>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function sortSkus(items) {
    return items.slice().sort((a, b) => {
      if (!!b.featured - !!a.featured) return !!b.featured - !!a.featured;
      return (a.amount_cents || 0) - (b.amount_cents || 0);
    });
  }

  function bindBuyClicks() {
    document.querySelectorAll("[data-sku-buy]").forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains("is-waitlist")) {
          const skuInput = document.querySelector('#start-form [name="sku"]');
          if (skuInput) skuInput.value = el.getAttribute("data-sku-buy") || "";
        }
      };
    });
  }

  function fill(layer, elId, verticalFilter) {
    const root = document.getElementById(elId);
    if (!root) return;
    let items = (cfg.skus || []).filter((s) => s.layer === layer);
    if (verticalFilter && verticalFilter !== "all") {
      items = items.filter((s) => (s.vertical || "") === verticalFilter);
    }
    items = sortSkus(items);
    root.innerHTML = items.map(card).join("");
    bindBuyClicks();
  }

  fill("micro", "micro-grid");
  fill("session", "session-grid");
  fill("package", "package-grid");

  const feat = document.getElementById("featured-grid");
  if (feat) {
    const featured = sortSkus((cfg.skus || []).filter((s) => s.featured));
    // Prefer media packs first for mind-blow
    featured.sort((a, b) => {
      const am = (a.vertical === "media") - (b.vertical === "media");
      if (am) return -am;
      return 0;
    });
    feat.innerHTML = featured.map(card).join("");
    bindBuyClicks();
  }

  const chips = document.getElementById("vertical-chips");
  if (chips) {
    const verts = {};
    (cfg.skus || []).forEach((s) => {
      if (s.layer === "micro" && s.vertical) verts[s.vertical] = true;
    });
    const list = ["all"].concat(Object.keys(verts).sort());
    chips.innerHTML = list
      .map(
        (v, i) =>
          '<button type="button" class="chip' +
          (i === 0 ? " is-active" : "") +
          '" data-vertical="' +
          escapeHtml(v) +
          '">' +
          escapeHtml(v) +
          "</button>"
      )
      .join("");
    chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-vertical]");
      if (!btn) return;
      chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      fill("micro", "micro-grid", btn.getAttribute("data-vertical"));
    });
  }

  const dl = document.getElementById("sku-list");
  if (dl) {
    dl.innerHTML = (cfg.skus || [])
      .map(
        (s) =>
          '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + "</option>"
      )
      .join("");
  }

  const form = document.getElementById("start-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const subject = encodeURIComponent(
        "Epic Everywhere CS — " + (data.get("role") || "help")
      );
      const body = encodeURIComponent(
        [
          "Name: " + (data.get("name") || ""),
          "Email: " + (data.get("email") || ""),
          "Role: " + (data.get("role") || ""),
          "SKU: " + (data.get("sku") || "(none)"),
          "",
          "Job to get done:",
          data.get("job") || "",
          "",
          "I agree to Terms / Privacy / Refunds at /legal/",
          "",
          "— sent from epic-everywhere landing",
        ].join("\n")
      );
      window.location.href =
        "mailto:" +
        (cfg.contactEmail || "epictechai@gmail.com") +
        "?subject=" +
        subject +
        "&body=" +
        body;
    });
  }

  const params = new URLSearchParams(window.location.search);
  const skuParam = params.get("sku");
  if (skuParam && form && form.elements.namedItem("sku")) {
    form.elements.namedItem("sku").value = skuParam;
  }

  // Dock active section highlight
  const dock = document.querySelector(".dock");
  if (dock && "IntersectionObserver" in window) {
    const map = {
      pricing: dock.querySelector('a[href="#pricing"]'),
      start: dock.querySelector('a[href="#start"]'),
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const a = map[en.target.id];
          if (a) a.classList.toggle("is-active", en.isIntersecting);
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    ["pricing", "start"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
})();
