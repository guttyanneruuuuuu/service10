/* Mirror.world — privacy-first analytics */
(function (g) {
  "use strict";
  const C = g.MIRROR_CONFIG;
  const KEY = "mw:analytics";
  const MAX = 300;

  function readBuf() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
  function writeBuf(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); } catch {} }
  function sid() {
    let s = sessionStorage.getItem("mw:sid");
    if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("mw:sid", s); }
    return s;
  }

  const start = Date.now();
  const A = {
    init() {
      try {
        if (g.firebase && firebase.apps?.length && C.firebase.measurementId && firebase.analytics) {
          firebase.analytics();
        }
      } catch {}
      A.track("session_start", { lang: navigator.language, ua: navigator.userAgent.slice(0, 100), w: innerWidth, h: innerHeight });
      addEventListener("beforeunload", () => A.track("session_end", { dur: Date.now() - start }));
      addEventListener("error", (e) => A.track("js_error", { m: String(e.message).slice(0, 200) }));
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
