/* Pulse Earth — main app glue */
(function () {
  "use strict";
  const C = window.PULSE_CONFIG;
  const $ = U.$;
  const $$ = U.$$;

  // DOM refs
  const loader   = $("#loader");
  const canvas   = $("#globe");
  const statLive = $("#statLive");
  const statTotal= $("#statTotal");
  const stream   = $("#streamBar");
  const feedList = $("#feedList");
  const msgInput = $("#msgInput");
  const msgCount = $("#msgCount");
  const locHint  = $("#locHint");
  const aboutBtn = $("#aboutBtn");
  const heatBtn  = $("#heatBtn");
  const shareBtn = $("#shareBtn");

  // Init Firebase if configured (so analytics & store can use it)
  try {
    const f = C.firebase;
    if (f.apiKey && f.projectId && f.appId && window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(f);
    }
  } catch (e) { console.warn("Firebase init skipped:", e); }

  Analytics.init();
  Globe.init(canvas);

  setTimeout(() => loader.classList.add("is-hidden"), 700);

  Geo.resolve({ allowPrompt: false }).then((loc) => {
    locHint.innerHTML = `📍 推定位置: <strong>${U.escapeHTML(loc.place)}</strong>`;
  });

  Store.init({
    onPulse: (p) => {
      const meta = C.emotions[p.emotion];
      if (!meta) return;
      Globe.spawnPulse(p.lat, p.lon, meta.color, { big: !!p.self });
      addFeedItem(p);
      if (C.flags.showStreamBar && p.message) addStreamItem(p);
    },
    onCounts: ({ live, total }) => {
      animateNumber(statLive, parseInt(statLive.textContent.replace(/,/g, "") || "0", 10), live, 600);
      animateNumber(statTotal, parseInt(statTotal.textContent.replace(/,/g, "") || "0", 10), total, 800);
    }
  });

  // emotion buttons
  let activeEmotion = null;
  $$(".emo").forEach((btn) => {
    btn.addEventListener("click", () => fire(btn.dataset.emo, btn));
  });
  msgInput.addEventListener("input", () => {
    msgInput.value = msgInput.value.slice(0, C.limits.msgMax);
    msgCount.textContent = `${msgInput.value.length}/${C.limits.msgMax}`;
  });

  async function fire(emotion, btnEl) {
    const loc = await Geo.resolve({ allowPrompt: false });
    const lat = loc.lat + (Math.random() - 0.5) * 0.6;
    const lon = loc.lon + (Math.random() - 0.5) * 0.6;
    const raw = { emotion, message: msgInput.value, lat, lon, place: loc.place };
    const r = Security.validatePulse(raw);
    if (!r.ok) {
      U.toast(r.errors[0], "error");
      Analytics.track("pulse_rejected", { reason: r.errors[0] });
      return;
    }
    Security.markFired();
    activeEmotion = emotion;
    btnEl.classList.add("is-firing");
    setTimeout(() => btnEl.classList.remove("is-firing"), 700);
    haptic();

    try {
      await Store.send(r.data);
      U.toast(`${C.emotions[emotion].face} 地球に灯りました`, "success");
      Analytics.track("pulse_sent", { emotion, hasMsg: !!r.data.message });
      msgInput.value = "";
      msgCount.textContent = `0/${C.limits.msgMax}`;
    } catch (e) {
      U.toast("送信に失敗しました", "error");
      console.error(e);
    }
  }

  function haptic() { try { navigator.vibrate?.(15); } catch {} }

  function addFeedItem(p) {
    const meta = C.emotions[p.emotion]; if (!meta) return;
    const li = document.createElement("li");
    li.className = "feed-item";
    li.innerHTML = `
      <div class="feed-item__face">${meta.face}</div>
      <div class="feed-item__body">
        <div class="feed-item__loc">${U.escapeHTML(p.place || "Earth")} · ${U.fmtTime(p.createdAtMs)}</div>
        <div class="feed-item__msg ${p.message ? "" : "feed-item__msg--empty"}">${
          p.message ? U.escapeHTML(p.message) : meta.label
        }</div>
      </div>`;
    feedList.prepend(li);
    while (feedList.children.length > C.limits.feedMax) feedList.lastChild.remove();
  }

  function addStreamItem(p) {
    const meta = C.emotions[p.emotion]; if (!meta || !p.message) return;
    const span = document.createElement("div");
    span.className = "stream-bar__item";
    span.innerHTML = `<span class="se">${meta.face}</span>${U.escapeHTML(p.message)}<span class="sm">— ${U.escapeHTML(p.place || "Earth")}</span>`;
    stream.appendChild(span);
    setTimeout(() => span.remove(), 14500);
  }

  function animateNumber(el, from, to, ms) {
    const start = performance.now();
    function step(now) {
      const k = Math.min(1, (now - start) / ms);
      const v = Math.round(from + (to - from) * easeOut(k));
      el.textContent = v.toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // modals
  function openModal(id) {
    const m = document.getElementById(id); if (!m) return;
    m.hidden = false; document.body.style.overflow = "hidden";
    Analytics.track("modal_open", { id });
  }
  function closeModal(m) { m.hidden = true; document.body.style.overflow = ""; }

  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) {
      const m = e.target.closest(".modal"); if (m) closeModal(m);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal").forEach((m) => { if (!m.hidden) closeModal(m); });
  });

  aboutBtn.addEventListener("click", () => openModal("aboutModal"));
  const openPrivacy = $("#openPrivacy");
  if (openPrivacy) openPrivacy.addEventListener("click", (e) => {
    e.preventDefault(); closeModal($("#aboutModal")); openModal("privacyModal");
  });

  // heatmap
  heatBtn.addEventListener("click", () => { renderHeat(); openModal("heatModal"); });
  function renderHeat() {
    const stats = Store.todayStats();
    const sum = $("#heatSummary");
    sum.innerHTML = `
      <div class="heat-summary__cell"><div class="heat-summary__num">${stats.total.toLocaleString()}</div><div class="heat-summary__lab">total today</div></div>
      <div class="heat-summary__cell"><div class="heat-summary__num">${stats.live.toLocaleString()}</div><div class="heat-summary__lab">live now</div></div>
    `;
    const max = Math.max(1, ...Object.values(stats.byEmo));
    const bars = $("#heatBars");
    bars.innerHTML = "";
    for (const [k, meta] of Object.entries(C.emotions)) {
      const v = stats.byEmo[k] || 0;
      const pct = (v / max) * 100;
      const row = document.createElement("div");
      row.className = "heat-bar"; row.style.setProperty("--c", meta.color);
      row.innerHTML = `
        <div class="heat-bar__face">${meta.face}</div>
        <div class="heat-bar__rail"><div class="heat-bar__fill" style="width:${pct}%"></div></div>
        <div class="heat-bar__num">${v.toLocaleString()}</div>`;
      bars.appendChild(row);
    }
  }

  // share modal
  shareBtn.addEventListener("click", () => {
    const stats = Store.todayStats();
    const loc = Geo.cached || { place: "Earth" };
    Share.render($("#shareCanvas"), {
      emotion: activeEmotion || "joy",
      message: msgInput.value || (activeEmotion ? "" : "今、世界とつながった。"),
      place: loc.place,
      total: stats.total,
      live: stats.live
    });
    openModal("shareModal");
  });
  $("#shareDownload").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = $("#shareCanvas").toDataURL("image/png");
    a.download = `pulse-earth-${Date.now()}.png`;
    a.click();
    Analytics.track("share_download");
  });
  $("#shareCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      U.toast("URLをコピーしました", "success");
      Analytics.track("share_copy");
    } catch { U.toast("コピーに失敗しました", "error"); }
  });
  const tw = $("#shareTwitter");
  const txt = encodeURIComponent("🌍 世界の感情がリアルタイムで降り注ぐ地球 #PulseEarth\n");
  tw.href = `https://twitter.com/intent/tweet?text=${txt}&url=${encodeURIComponent(location.href)}`;
  tw.addEventListener("click", () => Analytics.track("share_twitter"));

  document.addEventListener("visibilitychange", () => {
    Globe.setPaused(document.hidden);
  });

  // keyboard quick fire (1-8)
  document.addEventListener("keydown", (e) => {
    if (document.activeElement === msgInput) return;
    const idx = parseInt(e.key, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= 8) {
      const btn = $$(".emo")[idx - 1];
      if (btn) btn.click();
    }
  });

  console.log(`%cPulse Earth%c v${C.version} · backend=${Store.backend}`,
    "color:#5ae0e0;font-weight:800;letter-spacing:.2em",
    "color:#7a7f93");
})();
