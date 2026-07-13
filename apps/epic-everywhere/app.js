(function () {
  const cfg = window.EPIC_CONFIG || { skus: [] };
  const year = document.getElementById("y");
  if (year) year.textContent = String(new Date().getFullYear());

  function card(sku) {
    const hasLink = Boolean(sku.paymentLink);
    const phase = sku.phase
      ? `<span class="badge phase">${escapeHtml(sku.phase)}</span>`
      : sku.featured
        ? `<span class="badge">Popular</span>`
        : "";
    const href = hasLink
      ? sku.paymentLink
      : `#start`;
    const btnClass = hasLink ? "btn btn-buy" : "btn btn-buy is-waitlist";
    const btnLabel = hasLink
      ? `Buy ${sku.price}`
      : sku.phase
        ? "Waitlist / start form"
        : "Get link · start form";
    return `
      <article class="price-card" data-sku="${escapeHtml(sku.id)}">
        ${phase}
        <h4>${escapeHtml(sku.name)}</h4>
        <div class="amount">${escapeHtml(sku.price)}</div>
        <p>${escapeHtml(sku.blurb)}</p>
        <a class="${btnClass}" href="${escapeAttr(href)}" ${hasLink ? 'target="_blank" rel="noopener noreferrer"' : ""} data-sku-buy="${escapeHtml(sku.id)}">${btnLabel}</a>
      </article>
    `;
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

  function fill(layer, elId) {
    const root = document.getElementById(elId);
    if (!root) return;
    const items = (cfg.skus || []).filter((s) => s.layer === layer);
    root.innerHTML = items.map(card).join("");
  }

  fill("micro", "micro-grid");
  fill("session", "session-grid");
  fill("package", "package-grid");

  document.querySelectorAll("[data-sku-buy]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (el.classList.contains("is-waitlist")) {
        const skuInput = document.querySelector('#start-form [name="sku"]');
        if (skuInput) skuInput.value = el.getAttribute("data-sku-buy") || "";
      }
    });
  });

  const form = document.getElementById("start-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      // Build a useful mailto body; still works if user has no mail client
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get("name") || "";
      const email = data.get("email") || "";
      const role = data.get("role") || "";
      const job = data.get("job") || "";
      const sku = data.get("sku") || "";
      const subject = encodeURIComponent(`Epic Everywhere CS — ${role || "help"}`);
      const body = encodeURIComponent(
        [
          `Name: ${name}`,
          `Email: ${email}`,
          `Role: ${role}`,
          `SKU: ${sku || "(none)"}`,
          "",
          "Job to get done:",
          job,
          "",
          "— sent from epic-everywhere landing"
        ].join("\n")
      );
      window.location.href = `mailto:${cfg.contactEmail || "epictechai@gmail.com"}?subject=${subject}&body=${body}`;
    });
  }

  // Prefill SKU from query ?sku=
  const params = new URLSearchParams(window.location.search);
  const skuParam = params.get("sku");
  if (skuParam && form && form.sku) {
    form.sku.value = skuParam;
  }
})();
