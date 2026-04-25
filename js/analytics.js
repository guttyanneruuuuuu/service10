/* Mirror.world — privacy-first analytics
 * Anonymous counters in localStorage. No IP / UA / cookies.
 */
(function (g) {
  "use strict";

  var KEY = "mw.metrics.v1";

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (!v) return { events: {}, started: Date.now() };
      var p = JSON.parse(v);
      if (!p || typeof p !== "object") return { events: {}, started: Date.now() };
      if (!p.events) p.events = {};
      return p;
    } catch (_) { return { events: {}, started: Date.now() }; }
  }
  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (_) {}
  }

  function track(name, props) {
    if (!name) return;
    name = String(name).slice(0, 40);
    var bag = read();
    bag.events[name] = (bag.events[name] || 0) + 1;
    write(bag);

    var url = g.MIRROR_BEACON_URL;
    if (url && navigator.sendBeacon) {
      try {
        var body = JSON.stringify({
          n: name,
          p: props || null,
          ts: Date.now(),
          path: location.pathname,
          ref: document.referrer ? new URL(document.referrer).hostname : ""
        });
        navigator.sendBeacon(url, body);
      } catch (_) {}
    }

    if (g.MIRROR_DEBUG) console.log("[mw]", name, props || "");
  }

  function snapshot() { return read(); }

  setTimeout(function () { track("pv"); }, 50);

  g.MWA = { track: track, snapshot: snapshot };
})(window);
