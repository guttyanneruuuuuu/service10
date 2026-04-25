/* Mirror.world — storage layer.
 *
 * Tracks aggregate counts of "qid:choice" → count. Used to compute
 * how rare a user's specific choice is.
 *
 * Backend: Firebase Firestore if configured, else local + bootstrap baseline.
 *
 * Public API:
 *   Store.init()
 *   Store.recordSession(answers, result)  // increment counts, store anonymous record
 *   Store.choicePct(qid, key) -> 0..1     // global probability of that choice
 *   Store.totalSessions() -> number
 *   Store.recentResults(n) -> [ { titleSlug, rarity, ts } ... ]
 */
(function (g) {
  "use strict";
  const C = g.MIRROR_CONFIG;
  const Q = g.MIRROR_QUESTIONS;

  function isFb() {
    const f = C.firebase;
    return !!(f && f.apiKey && f.projectId && f.appId);
  }

  // ---- Local store ----
  const KEY_COUNTS  = "mw:counts";   // { "qid:key": count }
  const KEY_TOTAL   = "mw:totalSessions";
  const KEY_RECENT  = "mw:recentResults"; // [{ slug, rarity, ts, c, e }]

  function readLocal(key, fb) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fb)); }
    catch { return fb; }
  }
  function writeLocal(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // Bootstrap baseline counts so first user already gets meaningful percentages.
  function bootstrap() {
    if (localStorage.getItem("mw:bootstrapped") === "1") return;
    const seedSize = 5_000;
    const counts = {};
    for (const q of Q) {
      let allocated = 0;
      // distribute seedSize per question by baseline weights
      const choices = q.choices.map((c) => ({ k: c.key, b: c.baseline || 1/q.choices.length }));
      const sum = choices.reduce((a, c) => a + c.b, 0);
      for (let i = 0; i < choices.length - 1; i++) {
        const v = Math.round(seedSize * (choices[i].b / sum));
        counts[`${q.id}:${choices[i].k}`] = v;
        allocated += v;
      }
      counts[`${q.id}:${choices[choices.length - 1].k}`] = seedSize - allocated;
    }
    writeLocal(KEY_COUNTS, counts);
    writeLocal(KEY_TOTAL, seedSize);
    localStorage.setItem("mw:bootstrapped", "1");
  }

  // ---- Firebase ----
  let db = null;
  function ensureFb() {
    if (db) return db;
    if (!firebase.apps.length) firebase.initializeApp(C.firebase);
    db = firebase.firestore();
    return db;
  }

  // cached aggregate (loaded on init)
  let aggregate = { counts: {}, total: 0, recent: [] };

  async function loadAggregate() {
    if (!isFb()) {
      bootstrap();
      aggregate.counts = readLocal(KEY_COUNTS, {});
      aggregate.total  = Number(readLocal(KEY_TOTAL, 0)) || 0;
      aggregate.recent = readLocal(KEY_RECENT, []);
      return;
    }
    try {
      const _db = ensureFb();
      const meta = await _db.collection("aggregate").doc("global").get();
      if (meta.exists) {
        const d = meta.data();
        aggregate.counts = d.counts || {};
        aggregate.total = d.total || 0;
      } else {
        bootstrap();
        aggregate.counts = readLocal(KEY_COUNTS, {});
        aggregate.total  = Number(readLocal(KEY_TOTAL, 0)) || 0;
      }
      const snap = await _db.collection("recentResults").orderBy("ts", "desc").limit(10).get();
      aggregate.recent = snap.docs.map((d) => d.data());
    } catch (e) {
      console.warn("Falling back to local aggregate", e);
      bootstrap();
      aggregate.counts = readLocal(KEY_COUNTS, {});
      aggregate.total  = Number(readLocal(KEY_TOTAL, 0)) || 0;
      aggregate.recent = readLocal(KEY_RECENT, []);
    }
  }

  async function recordSessionFB(answers, result) {
    const _db = ensureFb();
    const batch = _db.batch();
    const meta = _db.collection("aggregate").doc("global");

    // increment per-choice counters atomically
    const incs = { total: firebase.firestore.FieldValue.increment(1) };
    for (const a of answers) {
      incs[`counts.${a.qid}:${a.key}`] = firebase.firestore.FieldValue.increment(1);
    }
    batch.set(meta, incs, { merge: true });

    // store anonymous result
    const recRef = _db.collection("recentResults").doc();
    batch.set(recRef, {
      slug: result.titleSlug,
      rarity: result.rarity,
      title: result.title,
      face: result.face,
      color: result.color,
      ts: Date.now(),
      c: result.code   // 7-axis fingerprint, no PII
    });
    await batch.commit();
  }

  function recordSessionLocal(answers, result) {
    const counts = readLocal(KEY_COUNTS, {});
    let total = Number(readLocal(KEY_TOTAL, 0)) || 0;
    for (const a of answers) {
      const k = `${a.qid}:${a.key}`;
      counts[k] = (counts[k] || 0) + 1;
    }
    total += 1;
    writeLocal(KEY_COUNTS, counts);
    writeLocal(KEY_TOTAL, total);

    const recent = readLocal(KEY_RECENT, []);
    recent.unshift({
      slug: result.titleSlug, rarity: result.rarity,
      title: result.title, face: result.face, color: result.color,
      ts: Date.now(), c: result.code
    });
    writeLocal(KEY_RECENT, recent.slice(0, 30));

    aggregate.counts = counts;
    aggregate.total = total;
    aggregate.recent = recent;
  }

  const Store = {
    backend: isFb() ? "firebase" : "local",

    async init() {
      await loadAggregate();
    },

    async recordSession(answers, result) {
      if (isFb()) {
        try { await recordSessionFB(answers, result); }
        catch (e) { console.warn("Firebase write failed; saving local", e); recordSessionLocal(answers, result); }
      } else {
        recordSessionLocal(answers, result);
      }
      // also keep last result locally for share modal etc.
      try { localStorage.setItem("mw:lastResult", JSON.stringify(result)); } catch {}
    },

    /* probability that a random user picked this option, in [0,1].
       Uses Laplace smoothing so percentages never crash to 0/1. */
    choicePct(qid, key) {
      const q = Q.find((x) => x.id === qid);
      if (!q) return 0;
      let denom = 0;
      let num = 0;
      const alpha = 1; // smoothing
      for (const c of q.choices) {
        const v = aggregate.counts[`${qid}:${c.key}`] || 0;
        denom += v + alpha;
        if (c.key === key) num = v + alpha;
      }
      return denom ? num / denom : 0;
    },

    totalSessions() { return aggregate.total || 0; },
    recentResults(n) { return (aggregate.recent || []).slice(0, n || 10); },

    /* Compute compatibility (0..1) between two answer sets (same length+order assumed). */
    compatibility(a, b) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0) return 0;
      let common = 0; let total = 0;
      const map = {};
      for (const x of a) map[x.qid] = x.key;
      for (const y of b) {
        if (map[y.qid] !== undefined) {
          total++;
          if (map[y.qid] === y.key) common++;
        }
      }
      return total ? common / total : 0;
    }
  };

  g.Store = Store;
})(window);
