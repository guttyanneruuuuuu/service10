/* Mirror.world — small utilities */
(function (g) {
  "use strict";

  var U = {};

  U.$  = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  U.on = function (el, type, fn, opts) {
    if (!el) return;
    el.addEventListener(type, fn, opts || false);
  };

  U.fmt = function (n) {
    if (n == null || isNaN(n)) return "—";
    return Math.round(n).toLocaleString("en-US");
  };

  U.fmtJP = function (n) {
    if (n == null || isNaN(n)) return "—";
    n = Math.round(n);
    if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, "") + "億";
    if (n >= 10000)     return (n / 10000).toFixed(1).replace(/\.?0+$/, "") + "万";
    return n.toLocaleString("en-US");
  };

  U.clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

  U.lerp = function (a, b, t) { return a + (b - a) * t; };

  U.uid = function () {
    var s = "abcdefghijklmnopqrstuvwxyz0123456789";
    var out = "";
    if (g.crypto && g.crypto.getRandomValues) {
      var arr = new Uint8Array(16);
      g.crypto.getRandomValues(arr);
      for (var i = 0; i < 16; i++) out += s[arr[i] % s.length];
    } else {
      for (var j = 0; j < 16; j++) out += s[Math.floor(Math.random() * s.length)];
    }
    return out;
  };

  U.fetchJSON = function (path) {
    return fetch(path, { credentials: "omit", cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("fetch " + path + " failed: " + r.status);
        return r.json();
      });
  };

  U.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Standard normal CDF (Abramowitz & Stegun)
  U.normalCdf = function (z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989422804 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };

  g.U = U;
})(window);
