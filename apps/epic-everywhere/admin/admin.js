(function () {
  const KEY = "epic_admin_key";
  const $ = (id) => document.getElementById(id);

  function adminKey() {
    return sessionStorage.getItem(KEY) || "";
  }
  function setKey(k) {
    if (k) sessionStorage.setItem(KEY, k);
    else sessionStorage.removeItem(KEY);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json", "x-admin-key": adminKey() },
      opts.headers || {}
    );
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function render(data) {
    const s = data.stats || {};
    $("stats").innerHTML = [
      ["Users", s.users],
      ["Credits outstanding", s.totalCredits],
      ["Media gens", s.totalMedia],
      ["Ledger rows", s.ledgerEntries],
    ]
      .map(
        ([label, val]) =>
          '<div class="stat"><div class="label">' +
          label +
          '</div><div class="value">' +
          (val ?? "—") +
          "</div></div>"
      )
      .join("");

    $("users-body").innerHTML = (data.users || [])
      .map(
        (u) =>
          "<tr><td>" +
          esc(u.email) +
          '</td><td class="mono">' +
          (u.credits || 0) +
          "</td><td>" +
          (u.mediaCount || 0) +
          '</td><td class="mono">' +
          esc((u.updatedAt || "").slice(0, 19)) +
          "</td></tr>"
      )
      .join("");

    const g = $("admin-gallery");
    const media = data.media || [];
    if (!media.length) {
      g.innerHTML = '<p class="msg">No media yet.</p>';
    } else {
      g.innerHTML = media
        .map(
          (m) =>
            '<a href="' +
            esc(m.url) +
            '" target="_blank" rel="noopener" title="' +
            esc(m.email + " · " + (m.prompt || "")) +
            '"><img src="' +
            esc(m.url) +
            '" alt="" loading="lazy" /></a>'
        )
        .join("");
    }
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  async function load() {
    const data = await api("/api/admin/overview");
    $("gate").classList.add("hidden");
    $("dash").classList.remove("hidden");
    render(data);
  }

  $("unlock").onclick = async () => {
    setKey($("admin-key").value.trim());
    $("gate-msg").textContent = "Checking…";
    try {
      await load();
      $("gate-msg").textContent = "";
    } catch (e) {
      setKey("");
      $("gate-msg").textContent = "Invalid key or API error.";
    }
  };

  $("grant").onclick = async () => {
    $("grant-msg").textContent = "Granting…";
    $("grant-msg").className = "msg";
    try {
      const data = await api("/api/admin/overview", {
        method: "POST",
        body: JSON.stringify({
          email: $("g-email").value,
          credits: Number($("g-credits").value),
        }),
      });
      $("grant-msg").textContent =
        "OK · " + data.email + " now has " + data.credits + " credits";
      $("grant-msg").className = "msg ok";
      await load();
    } catch (e) {
      $("grant-msg").textContent = (e.data && e.data.error) || e.message;
      $("grant-msg").className = "msg err";
    }
  };

  $("refresh").onclick = () => load().catch(() => {});

  if (adminKey()) {
    load().catch(() => {
      setKey("");
      $("gate").classList.remove("hidden");
    });
  }

  // Public health (no key)
  fetch("/api/health")
    .then((r) => r.json())
    .then((h) => {
      const el = $("health-line");
      if (!el) return;
      const bits = [];
      bits.push(h.stripeKey ? "Stripe key ✓" : "Stripe key ✗");
      bits.push(h.stripeWebhookSecret ? "Webhook secret ✓" : "Webhook secret missing (claim still works)");
      bits.push(h.openai ? "OpenAI ✓" : "OpenAI ✗");
      bits.push(h.blob ? "Storage ✓" : "Storage ✗");
      el.textContent = bits.join(" · ");
      el.className = h.stripeWebhookSecret && h.openai ? "msg ok" : "msg";
    })
    .catch(() => {});
})();
