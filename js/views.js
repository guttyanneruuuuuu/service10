/* Mirror.world — view rendering */
(function (g) {
  "use strict";

  function show(name) {
    U.$$(".view").forEach(function (el) {
      var on = el.getAttribute("data-view") === name;
      el.setAttribute("aria-hidden", on ? "false" : "true");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderHero(activePool) {
    var n = ENGINE.sampleHeroCount(activePool);
    var el = document.getElementById("heroCount");
    if (!el) return;
    var start = 0, end = n;
    var t0 = performance.now(), dur = 1300;
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      var v = Math.round(U.lerp(start, end, p));
      el.textContent = v.toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderQuestion(state) {
    var q = state.questions[state.idx];
    if (!q) return;
    document.getElementById("qtext").textContent = q.text;
    document.getElementById("aLabel").textContent = q.a.label;
    document.getElementById("bLabel").textContent = q.b.label;
    document.getElementById("quizIndex").textContent = String(state.idx + 1);
    document.getElementById("quizTotal").textContent = String(state.questions.length);
    var pct = Math.round((state.idx / state.questions.length) * 100);
    document.getElementById("progressBar").style.width = pct + "%";

    var picked = STORE.getAnswer(q.id);
    var a = document.getElementById("choiceA");
    var b = document.getElementById("choiceB");
    a.classList.toggle("is-picked", picked === q.a.v);
    b.classList.toggle("is-picked", picked === q.b.v);
  }

  function renderResult(result) {
    document.getElementById("resTitle").textContent = result.title.name;
    document.getElementById("resTag").textContent = result.title.tagline + "  ·  " + result.code;

    document.getElementById("rarityRatio").textContent = result.rarity.oneIn.toLocaleString("en-US");
    document.getElementById("rarityCount").textContent = result.rarity.worldCount.toLocaleString("en-US");

    var p = result.rarity.p;
    var rarityScore = Math.min(99, Math.max(5, Math.round((-Math.log10(p)) * 12)));
    setTimeout(function () {
      document.getElementById("rarityBar").style.width = rarityScore + "%";
    }, 80);

    var host = document.getElementById("axesList");
    host.innerHTML = "";
    result.axesView.forEach(function (a) {
      var t = a.t;
      var center = 50;
      var width = Math.abs(t) * 50; // 0..50
      var left  = t >= 0 ? center : (center - width);
      var right = t >= 0 ? (100 - (center + width)) : (100 - center);
      var div = document.createElement("div");
      div.className = "axis";
      div.innerHTML =
        '<div class="axis__head"><span>' + SEC.sanitize(a.labelNeg, 32) + '</span>' +
        '<strong>' + SEC.sanitize(a.name, 32) + '</strong>' +
        '<span>' + SEC.sanitize(a.labelPos, 32) + '</span></div>' +
        '<div class="axis__bar"><span style="left:' + left + '%; right:' + right + '%"></span></div>';
      host.appendChild(div);
    });

    var canvas = document.getElementById("cardCanvas");
    SHARE.draw(canvas, result);
  }

  g.VIEWS = {
    show: show,
    renderHero: renderHero,
    renderQuestion: renderQuestion,
    renderResult: renderResult
  };
})(window);
