/* Pulse Earth — analytics (privacy-first, first-party) */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;
  const KEY = "pulse:analytics"; const MAX = 300;
  const perfStart = Date.now();

  function readBuf() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
  function writeBuf(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX))); } catch {} }
  function sid() {
    let s = sessionStorage.getItem("pulse:sid");
    if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("pulse:sid", s); }
    return s;
  }

  const A = {
    init() {
      try {
        if (g.firebase && firebase.apps?.length && C.firebase.measurementId && firebase.analytics) {
          firebase.analytics();
        }
      } catch {}
      A.track("session_start", { lang: navigator.language, w: innerWidth, h: innerHeight });
      window.addEventListener("beforeunload", () => A.track("session_end", { dur: Date.now() - perfStart }));
      window.addEventListener("error", (e) => A.track("js_error", { m: String(e.message).slice(0, 200) }));
    },
    track(name, params = {}) {
      const evt = { n: name, t: Date.now(), s: sid(), p: params };
      const buf = readBuf(); buf.push(evt); writeBuf(buf);
      try {
        if (g.firebase && firebase.apps?.length && C.firebase.measurementId && firebase.analytics) {
          firebase.analytics().logEvent(name, params);
        }
      } catch {}
    },
    snapshot: readBuf
  };
  g.Analytics = A;
})(window);
