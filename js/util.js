/* Pulse Earth — Util */
(function (g) {
  "use strict";
  const U = {};
  U.$  = (s, r = document) => r.querySelector(s);
  U.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  U.escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
  U.cuid = () => {
    const b = new Uint8Array(12); crypto.getRandomValues(b);
    return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  U.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  U.lerp = (a, b, t) => a + (b - a) * t;

  let toastTimer;
  U.toast = (msg, kind = "") => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast is-show" + (kind ? " is-" + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2600);
  };

  U.latLonToVec3 = (lat, lon, r) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x: -r * Math.sin(phi) * Math.cos(theta),
      y:  r * Math.cos(phi),
      z:  r * Math.sin(phi) * Math.sin(theta)
    };
  };
  U.coarseLatLon = (lat, lon, step = 1) => ({
    lat: Math.round(lat / step) * step,
    lon: Math.round(lon / step) * step
  });
  U.startOfTodayMs = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); };
  U.fmtTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  g.U = U;
})(window);
