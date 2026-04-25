/* Mirror.world — input validation & rate limit */
(function (g) {
  "use strict";
  const C = g.MIRROR_CONFIG;
  const Q = g.MIRROR_QUESTIONS;

  const Sec = {
    /* Validate a single submitted answer payload */
    validateAnswer(qid, choiceKey) {
      const q = Q.find((x) => x.id === qid);
      if (!q) return { ok: false, error: "unknown_question" };
      const c = q.choices.find((x) => x.key === choiceKey);
      if (!c) return { ok: false, error: "unknown_choice" };
      return { ok: true };
    },

    /* Check device-level cooldown between full sessions */
    sessionAllowed() {
      const last = Number(localStorage.getItem("mw:lastSession") || 0);
      const left = C.limits.cooldownMs - (Date.now() - last);
      if (left > 0) return { ok: false, secondsLeft: Math.ceil(left / 1000) };
      return { ok: true };
    },

    markSession() {
      try { localStorage.setItem("mw:lastSession", String(Date.now())); } catch {}
    },

    sanitizeEmail(s) {
      const v = String(s || "").trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
      return v;
    }
  };

  g.Security = Sec;
})(window);
