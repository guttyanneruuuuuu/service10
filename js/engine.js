/* Mirror.world — scoring engine */
(function (g) {
  "use strict";

  function rightTail(z) { return 1 - U.normalCdf(z); }

  function score(answers, data, dist) {
    var scores = {};
    var axes = Object.keys(data.axes);
    axes.forEach(function (k) { scores[k] = { sum: 0, count: 0, t: 0 }; });

    data.questions.forEach(function (q) {
      var v = answers[q.id];
      if (v === undefined || v === null) return;
      if (typeof v !== "number") v = Number(v);
      if (isNaN(v)) return;
      v = Math.max(-1, Math.min(1, v));
      var s = scores[q.axis];
      if (!s) return;
      s.sum += v;
      s.count += 1;
    });

    axes.forEach(function (k) {
      var s = scores[k];
      s.t = s.count > 0 ? s.sum / s.count : 0;
    });

    var perAxisP = {};
    var letters = {};
    var jointP = 1;

    axes.forEach(function (k) {
      var s = scores[k];
      var meta = dist.axes[k] || { ratio_pos: 0.5, sigma: 0.6 };
      var sigma = meta.sigma || 0.6;
      var rPos = meta.ratio_pos;
      var t = s.t;
      var posSide = t >= 0;
      var sideShare = posSide ? rPos : (1 - rPos);

      var z = Math.abs(t) / sigma;
      var tail = rightTail(z);
      var pAxis = sideShare * Math.max(0.02, Math.min(1, 2 * tail + 0.04));
      pAxis = Math.max(0.02, Math.min(0.98, pAxis));

      perAxisP[k] = pAxis;
      jointP *= pAxis;

      switch (k) {
        case "E": letters.E = posSide ? "E" : "I"; break;
        case "N": letters.N = posSide ? "N" : "S"; break;
        case "T": letters.T = posSide ? "T" : "F"; break;
        case "J": letters.J = posSide ? "J" : "P"; break;
        case "R": letters.R = posSide ? "R" : "S"; break;
        case "C": letters.C = posSide ? "C" : "S"; break;
      }
    });

    var mbti = (letters.E || "I") + (letters.N || "S") + (letters.T || "F") + (letters.J || "P");
    var rcSuffix = (letters.R || "S") + (letters.C || "S");
    if (rcSuffix === "SS") rcSuffix = "PS";
    var code = mbti + "-" + rcSuffix;

    var titles = dist.titles || [];
    var title = titles.find(function (x) { return x.code === code; });
    if (!title) title = titles.find(function (x) { return x.code.indexOf(mbti) === 0; });
    if (!title) title = { code: code, name: "唯一の存在", tagline: "あなたは分類されない種類のレアです", color: "#7c5cff" };

    var minP = 1 / 200000000;
    var maxP = 0.6;
    var p = Math.max(minP, Math.min(maxP, jointP));
    var pool = (dist.active_pool || 4500000000);
    var worldCount = Math.max(1, Math.round(pool * p));
    var oneIn = Math.round(1 / p);

    var axesView = axes.map(function (k) {
      return {
        axis: k,
        name: data.axes[k].name,
        labelPos: data.axes[k].pos,
        labelNeg: data.axes[k].neg,
        t: scores[k].t
      };
    });

    return {
      scores: scores,
      letters: letters,
      code: code,
      title: title,
      perAxisP: perAxisP,
      rarity: { p: p, worldCount: worldCount, oneIn: oneIn },
      axesView: axesView
    };
  }

  function sampleHeroCount(activePool) {
    var d = new Date();
    var seed = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    var x = Math.sin(seed) * 100000;
    var frac = x - Math.floor(x);
    var mult = 0.6 + frac * 1.6;
    var base = (activePool || 4500000000) / 1000000;
    return Math.round(base * mult);
  }

  g.ENGINE = { score: score, sampleHeroCount: sampleHeroCount };
})(window);
