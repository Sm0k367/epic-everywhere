(function () {
  const TOKEN_KEY = "epic_studio_token";
  const $ = (id) => document.getElementById(id);

  function token() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      opts.headers || {}
    );
    if (token()) headers.Authorization = "Bearer " + token();
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

  function showApp(user, media) {
    $("auth-panel").classList.add("hidden");
    $("app-panel").classList.remove("hidden");
    $("logout").hidden = false;
    $("credits-pill").hidden = false;
    $("credit-count").textContent = String(user.credits || 0);
    $("user-email").textContent = user.email;
    renderGallery(media || []);
  }

  function showAuth() {
    $("auth-panel").classList.remove("hidden");
    $("app-panel").classList.add("hidden");
    $("logout").hidden = true;
    $("credits-pill").hidden = true;
  }

  function renderGallery(items) {
    const g = $("gallery");
    if (!items.length) {
      g.innerHTML = '<p class="msg">No media yet — generate something unforgettable.</p>';
      return;
    }
    g.innerHTML = items
      .map(
        (m) =>
          '<a href="' +
          m.url +
          '" target="_blank" rel="noopener"><img src="' +
          m.url +
          '" alt="" loading="lazy" /></a>'
      )
      .join("");
  }

  $("send-code").onclick = async () => {
    const authMsg = $("auth-msg");
    authMsg.textContent = "Sending…";
    authMsg.className = "msg";
    try {
      const data = await api("/api/auth/start", {
        method: "POST",
        body: JSON.stringify({ email: $("email").value }),
      });
      if (data.debugCode) {
        $("code").value = data.debugCode;
        authMsg.textContent = "Dev code ready — tap Verify.";
        authMsg.className = "msg ok";
      } else {
        authMsg.textContent = data.message || "Code sent.";
        authMsg.className = "msg ok";
      }
    } catch (e) {
      authMsg.textContent = (e.data && e.data.error) || e.message;
      authMsg.className = "msg err";
    }
  };

  $("verify").onclick = async () => {
    const authMsg = $("auth-msg");
    authMsg.textContent = "Verifying…";
    try {
      const data = await api("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          email: $("email").value,
          code: $("code").value,
        }),
      });
      setToken(data.token);
      const me = await api("/api/me");
      showApp(me.user, me.media);
      authMsg.textContent = "";
    } catch (e) {
      authMsg.textContent = (e.data && e.data.error) || e.message;
      authMsg.className = "msg err";
    }
  };

  $("logout").onclick = () => {
    setToken("");
    showAuth();
  };

  $("gen").onclick = async () => {
    const genMsg = $("gen-msg");
    genMsg.textContent = "Generating…";
    genMsg.className = "msg";
    $("preview-img").classList.add("hidden");
    $("preview-empty").classList.remove("hidden");
    try {
      const data = await api("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: $("prompt").value,
          kind: $("kind").value,
        }),
      });
      $("credit-count").textContent = String(data.credits || 0);
      if (data.media && data.media.url) {
        $("preview-img").src = data.media.url;
        $("preview-img").classList.remove("hidden");
        $("preview-empty").classList.add("hidden");
      }
      genMsg.textContent =
        "Done · spent " + ((data.media && data.media.cost) || 1) + " credit(s).";
      genMsg.className = "msg ok";
      const me = await api("/api/me");
      renderGallery(me.media);
    } catch (e) {
      if (e.status === 402) {
        genMsg.innerHTML =
          'You\'re out of creates. <a href="../#create">Unlock more access</a> with this email, then come back.';
      } else {
        genMsg.textContent =
          (e.data && (e.data.detail || e.data.error)) || e.message;
      }
      genMsg.className = "msg err";
    }
  };

  (async function boot() {
    if (!token()) return showAuth();
    try {
      const me = await api("/api/me");
      showApp(me.user, me.media);
    } catch {
      setToken("");
      showAuth();
    }
  })();
})();
