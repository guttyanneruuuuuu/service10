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
    const b = new Uint8Array(12);
    crypto.getRandomValues(b);
    return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  U.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  U.fmtN = (n) => Number(n || 0).toLocaleString("ja-JP");

  U.fmtTime = (ms) => {
    const diff = Date.now() - ms;
    if (diff < 5_000)   return "たった今";
    if (diff < 60_000)  return Math.floor(diff / 1000) + "秒前";
    if (diff < 3_600_000)  return Math.floor(diff / 60_000) + "分前";
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "時間前";
    return Math.floor(diff / 86_400_000) + "日前";
  };

  U.startOfTodayMs = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Lat/Lon (degrees) → 3D vector on a sphere of radius r
  U.latLonToVec3 = (lat, lon, r) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z =  r * Math.sin(phi) * Math.sin(theta);
    const y =  r * Math.cos(phi);
    return { x, y, z };
  };

  // Round lat/lon to ~111km grid for privacy
  U.coarseLatLon = (lat, lon) => ({
    lat: Math.round(lat),
    lon: Math.round(lon)
  });

  let toastTimer;
  U.toast = (msg, kind = "") => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast is-show" + (kind ? " is-" + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2800);
  };

  U.makeRng = (seed) => {
    let x = (seed | 0) || 123456789;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return ((x >>> 0) / 4294967296);
    };
  };

  U.sha256 = async (text) => {
    const data = new TextEncoder().encode(String(text));
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  g.U = U;
})(window);
