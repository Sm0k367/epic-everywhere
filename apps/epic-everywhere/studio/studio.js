(function () {
  const TOKEN_KEY = "epic_studio_token";

  const $ = (id) => document.getElementById(id);
  const authPanel = $("auth-panel");
  const appPanel = $("app-panel");
  const authMsg = $("auth-msg");
  const genMsg = $("gen-msg");

  function token() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
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
    authPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    $("logout").hidden = false;
    $("credit-count").textContent = String(user.credits || 0);
    $("user-email").textContent = user.email;
    renderGallery(media || []);
  }

  function showAuth() {
    authPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    $("logout").hidden = true;
  }

  function renderGallery(items) {
    const g = $("gallery");
    if (!items.length) {
      g.innerHTML = '<p class="msg">No media yet — generate something.</p>';
      return;
    }
    g.innerHTML = items
      .map(function (m) {
        return (
          '<a href="' +
          m.url +
          '" target="_blank" rel="noopener"><img src="' +
          m.url +
          '" alt="" loading="lazy" /></a>'
        );
      })
      .join("");
  }

  $("send-code").onclick = async function () {
    authMsg.textContent = "Sending…";
    authMsg.className = "msg";
    try {
      const data = await api("/api/auth/start", {
        method: "POST",
        body: JSON.stringify({ email: $("email").value }),
      });
      if (data.debugCode) {
        $("code").value = data.debugCode;
        authMsg.textContent = "Dev code filled in: " + data.debugCode;
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

  $("verify").onclick = async function () {
    authMsg.textContent = "Verifying…";
    try {
      const data = await api("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email: $("email").value, code: $("code").value }),
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

  $("logout").onclick = function () {
    setToken("");
    showAuth();
  };

  $("gen").onclick = async function () {
    genMsg.textContent = "Generating…";
    genMsg.className = "msg";
    $("preview").classList.add("hidden");
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
        $("preview").classList.remove("hidden");
      }
      genMsg.textContent = "Done. Spent " + (data.media && data.media.cost) + " credit(s).";
      genMsg.className = "msg ok";
      const me = await api("/api/me");
      renderGallery(me.media);
    } catch (e) {
      if (e.status === 402) {
        genMsg.innerHTML =
          'Not enough credits. <a href="../#pricing">Buy a pack</a> with this email, then refresh.';
      } else {
        genMsg.textContent = (e.data && (e.data.detail || e.data.error)) || e.message;
      }
      genMsg.className = "msg err";
    }
  };

  // boot
  (async function () {
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
