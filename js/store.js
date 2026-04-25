/* Pulse Earth — storage layer (Firebase or local synthetic) */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;
  const COLL = "pulses";
  const TTL = C.limits.pulseTtlMs;

  function isFb() {
    const f = C.firebase;
    return !!(f && f.apiKey && f.projectId && f.appId);
  }

  const pool = [];
  function pushPool(p) {
    pool.push(p);
    const cutoff = Date.now() - TTL;
    while (pool.length && pool[0].createdAtMs < cutoff) pool.shift();
    if (pool.length > 5000) pool.splice(0, pool.length - 5000);
  }

  let listeners = { onPulse: () => {}, onCounts: () => {} };
  function emit(p) { try { listeners.onPulse(p); } catch (e) { console.error(e); } }
  function emitCounts() {
    const live = liveCount();
    const total = pool.length;
    const byEmo = {};
    for (const k of Object.keys(C.emotions)) byEmo[k] = 0;
    for (const p of pool) byEmo[p.emotion] = (byEmo[p.emotion] || 0) + 1;
    listeners.onCounts({ live, total, byEmo });
  }
  function liveCount() {
    const cutoff = Date.now() - 60_000;
    let n = 0;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i].createdAtMs >= cutoff) n++; else break;
    }
    return n;
  }

  function startSynthetic() {
    if (!C.flags.syntheticFeed) return;
    const ratePerMs = C.flags.syntheticRatePerMin / 60000;
    const emoKeys = Object.keys(C.emotions);
    const now = Date.now();
    for (let i = 0; i < 120; i++) {
      const ago = Math.random() * 6 * 3600 * 1000;
      const ek = emoKeys[Math.floor(Math.random() * emoKeys.length)];
      const a = C.anchors[Math.floor(Math.random() * C.anchors.length)];
      pushPool({
        id: U.cuid(), emotion: ek,
        message: Math.random() < 0.35 ? sampleMsg(ek) : "",
        lat: a[0] + (Math.random() - 0.5) * 1.2,
        lon: a[1] + (Math.random() - 0.5) * 1.2,
        place: a[2], createdAtMs: now - ago, synthetic: true
      });
    }
    emitCounts();
    let acc = 0; let last = performance.now();
    function tick(now) {
      const dt = now - last; last = now;
      acc += dt * ratePerMs;
      while (acc >= 1) {
        acc -= 1;
        const ek = emoKeys[Math.floor(Math.random() * emoKeys.length)];
        const a = C.anchors[Math.floor(Math.random() * C.anchors.length)];
        const p = {
          id: U.cuid(), emotion: ek,
          message: Math.random() < 0.4 ? sampleMsg(ek) : "",
          lat: a[0] + (Math.random() - 0.5) * 1.4,
          lon: a[1] + (Math.random() - 0.5) * 1.4,
          place: a[2], createdAtMs: Date.now(), synthetic: true
        };
        pushPool(p); emit(p);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setInterval(emitCounts, 1500);
  }

  function sampleMsg(emotion) {
    const arr = C.emotions[emotion]?.sample || [];
    if (!arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let db = null;
  function ensureFb() {
    if (db) return db;
    if (!firebase.apps.length) firebase.initializeApp(C.firebase);
    db = firebase.firestore();
    return db;
  }
  async function fbSeedAndSubscribe() {
    const _db = ensureFb();
    const since = Date.now() - TTL;
    try {
      const snap = await _db.collection(COLL)
        .where("createdAtMs", ">=", since)
        .orderBy("createdAtMs", "desc")
        .limit(200).get();
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse().forEach(pushPool);
      emitCounts();
    } catch (e) { console.warn("fb seed failed", e); }
    const cursor = Date.now();
    _db.collection(COLL)
      .where("createdAtMs", ">", cursor)
      .orderBy("createdAtMs", "asc")
      .onSnapshot((snap) => {
        snap.docChanges().forEach((ch) => {
          if (ch.type === "added") {
            const p = { id: ch.doc.id, ...ch.doc.data() };
            pushPool(p); emit(p);
          }
        });
        emitCounts();
      }, (err) => console.warn("fb listen failed", err));
  }
  async function fbCreate(p) {
    const _db = ensureFb();
    const ref = await _db.collection(COLL).add({ ...p, createdAtMs: Date.now() });
    return { id: ref.id };
  }

  const Store = {
    backend: isFb() ? "firebase" : "local",
    init(handlers) {
      listeners = Object.assign(listeners, handlers || {});
      if (isFb()) {
        try { fbSeedAndSubscribe(); }
        catch (e) { console.warn("Firebase init failed; using local", e); startSynthetic(); }
      } else {
        startSynthetic();
      }
    },
    async send(p) {
      const local = { id: U.cuid(), ...p, createdAtMs: Date.now(), self: true };
      pushPool(local); emit(local); emitCounts();
      if (isFb()) {
        try { return await fbCreate({ ...p, source: "user" }); }
        catch (e) {
          console.warn("send failed", e);
          U.toast("オフラインのため端末内のみに保存", "");
          return { id: local.id, offline: true };
        }
      }
      return { id: local.id };
    },
    poolSnapshot() { return pool.slice(); },
    todayStats() {
      const cutoff = U.startOfTodayMs();
      const today = pool.filter((p) => p.createdAtMs >= cutoff);
      const byEmo = {};
      for (const k of Object.keys(C.emotions)) byEmo[k] = 0;
      for (const p of today) byEmo[p.emotion] = (byEmo[p.emotion] || 0) + 1;
      return { total: today.length, byEmo, live: liveCount() };
    }
  };
  g.Store = Store;
})(window);
