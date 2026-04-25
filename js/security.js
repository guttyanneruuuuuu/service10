/* Mirror.world — security hardening (client-side) */
(function (g) {
  "use strict";

  // Prevent file drag-drops navigating to file
  ["dragover", "drop"].forEach(function (ev) {
    g.addEventListener(ev, function (e) { e.preventDefault(); }, false);
  });

  // Disable context-menu on the share canvas
  document.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.id === "cardCanvas") e.preventDefault();
  });

  // Strip risky chars from email field
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t || t.id !== "waitEmail") return;
    t.value = String(t.value || "").replace(/[\s<>"'`\\]/g, "").slice(0, 120);
  });

  // Anti-clickjacking
  try {
    if (g.top !== g.self) {
      try { g.top.location = g.self.location; }
      catch (_) { document.documentElement.innerHTML = ""; }
    }
  } catch (_) {}

  function sanitize(s, max) {
    s = String(s == null ? "" : s);
    s = s.replace(/[<>]/g, "");
    if (max && s.length > max) s = s.slice(0, max);
    return s;
  }

  g.SEC = { sanitize: sanitize };
})(window);
