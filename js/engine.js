/* Mirror.world — rarity & profile engine.
 *
 * Computes:
 *   - For each answer: how rare is it globally? (1/p)
 *   - Combined rarity = product of (1/p) capped per-question, bounded
 *     to a sensible range (1 .. worldPopulation).
 *   - 7-axis personality vector → mapped to a "title" + face emoji + color.
 *
 * The title catalogue is hand-tuned: we project the vector into a small
 * library of poetic Japanese archetypes so every user gets a memorable label.
 */
(function (g) {
  "use strict";

  const C = g.MIRROR_CONFIG;
  const QUESTIONS = g.MIRROR_QUESTIONS;
  const AXIS_DIM = 7;

  const TITLES = [
    // axisVector signature, display
    { v: [ 0.7, 0.2, 0.5,-0.4, 0.6, 0.5,-0.5], face: "🦊", color: "#ff9a3c", title: "孤高の戦略家",   desc: "感情より構造で世界を捉え、誰よりも先に答えにたどり着く。" },
    { v: [-0.6, 0.7, 0.3, 0.4, 0.2,-0.2,-0.3], face: "🌸", color: "#ff6ec7", title: "心を揺らす詩人", desc: "他人の機微に敏感で、その感情が言葉になって溢れる。" },
    { v: [ 0.6,-0.6, 0.8, 0.0, 0.8, 0.7,-0.7], face: "⚡️", color: "#ffd166", title: "嵐を呼ぶ理想家", desc: "社会の常識を疑い、新しい現実を創ろうとする推進力の塊。" },
    { v: [-0.4,-0.5,-0.7, 0.3,-0.2,-0.6, 0.6], face: "🌙", color: "#7a5cff", title: "真夜中の哲学者", desc: "静けさの中で世界の意味を問い続ける、深い湖のような人。" },
    { v: [ 0.2, 0.6, 0.8, 0.6, 0.4, 0.6,-0.4], face: "✨", color: "#5ae0e0", title: "星屑の旅人",     desc: "未知への憧れが行動原理。立ち止まることが一番の苦痛。" },
    { v: [ 0.8,-0.7,-0.3,-0.2, 0.7,-0.6, 0.4], face: "🗡", color: "#7aa6ff", title: "氷の刃",         desc: "感情を制御し、目的のために最短距離を選ぶ研ぎ澄まされた知性。" },
    { v: [-0.8, 0.8, 0.2, 0.7,-0.3, 0.4,-0.5], face: "🔥", color: "#ff5a7a", title: "情熱の炎",       desc: "感情こそ生命力。人を巻き込み、瞬間を最大限に燃やす。" },
    { v: [ 0.0, 0.0,-0.8, 0.7,-0.5, 0.7, 0.5], face: "🍵", color: "#a8d8a8", title: "穏やかな観察者", desc: "波風を立てず、世界を静かに眺める達人。実は誰より深い。" },
    { v: [ 0.5,-0.8, 0.6,-0.7, 0.8, 0.5,-0.8], face: "🦅", color: "#ffb46b", title: "孤独な開拓者",   desc: "群れない、迎合しない、誰も歩いていない場所を歩く。" },
    { v: [-0.5, 0.5,-0.5, 0.6,-0.7, 0.7, 0.7], face: "🌷", color: "#ff8fb1", title: "日常の魔法使い", desc: "今ここに幸せを見つける天才。当たり前の風景が宝物に変わる。" },
    { v: [ 0.4, 0.0, 0.3,-0.5, 0.5,-0.7, 0.0], face: "🛠", color: "#9aa1b2", title: "黙々の建築家",   desc: "派手さはいらない。手を動かし、形にする。それが信条。" },
    { v: [-0.3,-0.3, 0.7, 0.5, 0.3, 0.8,-0.5], face: "🦋", color: "#b58cff", title: "夢幻の蝶",       desc: "現実と空想の境界をひらひらと舞う、捕まえられない自由人。" },
    { v: [ 0.2, 0.7,-0.4,-0.4,-0.2,-0.6, 0.6], face: "🐢", color: "#9adcff", title: "やさしき沈黙",   desc: "口数は少なくても、誰よりも長く一緒にいてくれる温かい存在。" },
    { v: [ 0.8, 0.2, 0.0,-0.6, 0.6, 0.7,-0.6], face: "🧠", color: "#7a5cff", title: "未来の設計者",   desc: "今ではなく10年後を生きている。世界を1つの方程式として捉える。" },
    { v: [-0.6, 0.4, 0.5, 0.7, 0.0, 0.0,-0.5], face: "🎭", color: "#ff6ec7", title: "感情の演者",     desc: "あらゆる感情を全身で演じきる。生きるとはドラマだ、と知っている。" },
    { v: [ 0.7,-0.6,-0.6, 0.5,-0.6, 0.6, 0.7], face: "📚", color: "#ffd166", title: "図書館の番人",   desc: "知識と秩序を愛する。1人の時間こそ自分を取り戻すサンクチュアリ。" }
  ];

  /* ---- Compute axis vector from answers ---- */
  function buildVector(answers) {
    const v = new Array(AXIS_DIM).fill(0);
    let counts = new Array(AXIS_DIM).fill(0);
    for (const a of answers) {
      const q = QUESTIONS.find((x) => x.id === a.qid);
      if (!q) continue;
      const c = q.choices.find((x) => x.key === a.key);
      if (!c || c.axis == null) continue;
      v[c.axis] += c.weight || 0;
      counts[c.axis] += 1;
    }
    // normalize per-axis: average and clamp to [-1,1]
    for (let i = 0; i < AXIS_DIM; i++) {
      if (counts[i] > 0) v[i] = U.clamp(v[i] / counts[i], -1, 1);
    }
    return v;
  }

  /* cosine similarity */
  function cos(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    if (na === 0 || nb === 0) return 0;
    return dot / Math.sqrt(na * nb);
  }

  function pickTitle(vec) {
    let best = TITLES[0]; let bestScore = -2;
    for (const t of TITLES) {
      const s = cos(vec, t.v);
      if (s > bestScore) { bestScore = s; best = t; }
    }
    return { ...best, similarity: bestScore };
  }

  /* ---- Rarity calc ---- */
  function calcRarity(answers) {
    /* product of 1/p, but each factor capped to keep things sane.
       (Without cap, pathological data → astronomically big rarities) */
    let logRarity = 0;
    for (const a of answers) {
      const p = U.clamp(g.Store.choicePct(a.qid, a.key), 0.005, 0.97);
      const inv = 1 / p;
      // damp: take 0.7 power so 10 questions don't blow up
      logRarity += Math.log(inv) * 0.55;
    }
    let rarity = Math.exp(logRarity);
    rarity = U.clamp(rarity, 1, C.limits.worldPopulation);
    return Math.round(rarity);
  }

  /* ---- Public API ---- */
  const Engine = {
    AXIS_DIM,
    process(answers) {
      const vec = buildVector(answers);
      const t = pickTitle(vec);
      const rarity = calcRarity(answers);
      const titleSlug = (t.title || "mirror").replace(/\s+/g, "-");
      const code = vec.map((x) => Math.round(x * 9)).join(""); // -9..9 per axis

      const sameWorld = Math.round(C.limits.worldPopulation / rarity);

      // breakdown per question for the result page
      const breakdown = answers.map((a) => {
        const q = QUESTIONS.find((x) => x.id === a.qid);
        const c = q.choices.find((x) => x.key === a.key);
        const pct = g.Store.choicePct(a.qid, a.key);
        return {
          qid: a.qid, q: q.q,
          chosen: c.text,
          pct: Math.round(pct * 1000) / 10
        };
      });

      return {
        vec, code,
        rarity, sameWorld,
        title: t.title, titleSlug,
        face: t.face, color: t.color,
        desc: t.desc,
        breakdown
      };
    },

    vectorOf: buildVector,
    pickTitle,
    /* Build a tag list, e.g. ["論理 / 感情: 論理寄り", "個人主義寄り"] */
    descriptors(vec) {
      const labels = [
        ["感情的", "論理的"],
        ["個人主義", "集団主義"],
        ["未知好き", "安定志向"],
        ["禁欲家", "快楽家"],
        ["現実家", "理想家"],
        ["夢想家", "実行家"],
        ["カオス", "秩序"]
      ];
      const out = [];
      for (let i = 0; i < AXIS_DIM; i++) {
        const v = vec[i] || 0;
        if (Math.abs(v) < 0.25) continue;
        out.push(v > 0 ? labels[i][1] : labels[i][0]);
      }
      return out.slice(0, 4);
    },

    titlesCatalogue() { return TITLES.slice(); }
  };

  g.Engine = Engine;
})(window);
