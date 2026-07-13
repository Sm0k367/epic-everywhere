(function () {
  const cfg = window.EPIC_CONFIG || { skus: [] };
  const year = document.getElementById("y");
  if (year) year.textContent = String(new Date().getFullYear());

  const countEl = document.getElementById("sku-count");
  if (countEl) {
    countEl.textContent = String(cfg.skuCount || (cfg.skus || []).length);
  }

  const linked = (cfg.skus || []).filter(function (s) {
    return s.paymentLink;
  }).length;
  const linkStatus = document.getElementById("link-status");
  if (linkStatus) {
    if (linked > 0) {
      linkStatus.textContent =
        linked + " live Stripe Payment Links · remaining use start form until seeded";
      linkStatus.classList.add("is-live");
    } else {
      linkStatus.textContent =
        "Stripe Payment Links not seeded yet — buy buttons open the start form. See epic-desk/STRIPE_SETUP.md";
    }
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
        ? "Waitlist / start form"
        : "Reserve · start form";
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
    return items.slice().sort(function (a, b) {
      if (!!b.featured - !!a.featured) return !!b.featured - !!a.featured;
      return (a.amount_cents || 0) - (b.amount_cents || 0);
    });
  }

  function fill(layer, elId, verticalFilter) {
    const root = document.getElementById(elId);
    if (!root) return;
    let items = (cfg.skus || []).filter(function (s) {
      return s.layer === layer;
    });
    if (verticalFilter && verticalFilter !== "all") {
      items = items.filter(function (s) {
        return (s.vertical || "") === verticalFilter;
      });
    }
    items = sortSkus(items);
    root.innerHTML = items.map(card).join("");
    bindBuyClicks();
  }

  function bindBuyClicks() {
    document.querySelectorAll("[data-sku-buy]").forEach(function (el) {
      el.onclick = function () {
        if (el.classList.contains("is-waitlist")) {
          const skuInput = document.querySelector('#start-form [name="sku"]');
          if (skuInput) skuInput.value = el.getAttribute("data-sku-buy") || "";
        }
      };
    });
  }

  fill("micro", "micro-grid");
  fill("session", "session-grid");
  fill("package", "package-grid");

  // Featured strip
  const feat = document.getElementById("featured-grid");
  if (feat) {
    const featured = sortSkus(
      (cfg.skus || []).filter(function (s) {
        return s.featured;
      })
    );
    feat.innerHTML = featured.map(card).join("");
    bindBuyClicks();
  }

  // Vertical filter chips for micro
  const chips = document.getElementById("vertical-chips");
  if (chips) {
    const verts = {};
    (cfg.skus || []).forEach(function (s) {
      if (s.layer === "micro" && s.vertical) verts[s.vertical] = true;
    });
    const list = ["all"].concat(Object.keys(verts).sort());
    chips.innerHTML = list
      .map(function (v, i) {
        return (
          '<button type="button" class="chip' +
          (i === 0 ? " is-active" : "") +
          '" data-vertical="' +
          escapeHtml(v) +
          '">' +
          escapeHtml(v) +
          "</button>"
        );
      })
      .join("");
    chips.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-vertical]");
      if (!btn) return;
      chips.querySelectorAll(".chip").forEach(function (c) {
        c.classList.remove("is-active");
      });
      btn.classList.add("is-active");
      fill("micro", "micro-grid", btn.getAttribute("data-vertical"));
    });
  }

  // SKU datalist for form
  const dl = document.getElementById("sku-list");
  if (dl) {
    dl.innerHTML = (cfg.skus || [])
      .map(function (s) {
        return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + "</option>";
      })
      .join("");
  }

  const form = document.getElementById("start-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get("name") || "";
      const email = data.get("email") || "";
      const role = data.get("role") || "";
      const job = data.get("job") || "";
      const sku = data.get("sku") || "";
      const subject = encodeURIComponent("Epic Everywhere CS — " + (role || "help"));
      const body = encodeURIComponent(
        [
          "Name: " + name,
          "Email: " + email,
          "Role: " + role,
          "SKU: " + (sku || "(none)"),
          "",
          "Job to get done:",
          job,
          "",
          "I agree to Terms / Privacy / Refunds at /legal/",
          "",
          "— sent from epic-everywhere landing"
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
})();
