/* Mirror.world — application bootstrap & UI glue */
(function (g) {
  "use strict";

  var DATA = null;
  var DIST = null;
  var STATE = { questions: [], idx: 0, result: null };

  function boot() {
    Promise.all([
      U.fetchJSON("./data/questions.json"),
      U.fetchJSON("./data/distribution.json")
    ]).then(function (arr) {
      DATA = arr[0];
      DIST = arr[1];
      STATE.questions = DATA.questions.slice();

      VIEWS.renderHero(DIST.active_pool);
      bindHome();
      bindQuiz();
      bindResult();
      handleInitialRoute();
    }).catch(function (err) {
      console.error("[mw] load error", err);
      var el = document.getElementById("heroCount");
      if (el) el.textContent = "—";
      alert("データの読み込みに失敗しました。ページを再読み込みしてください。");
    });
  }

  function handleInitialRoute() {
    var h = (location.hash || "").toLowerCase();
    if (h === "#quiz") { startQuiz(); }
    else if (h === "#result") {
      var r = computeResult();
      if (r && r.answeredCount > 0) showResult(r); else VIEWS.show("home");
    }
    else { VIEWS.show("home"); }
  }

  function bindHome() {
    U.on(document.getElementById("startBtn"), "click", function () {
      MWA.track("home.start_click");
      startQuiz();
    });
  }

  function bindQuiz() {
    U.on(document.getElementById("choiceA"), "click", function () { pick("a"); });
    U.on(document.getElementById("choiceB"), "click", function () { pick("b"); });
    U.on(document.getElementById("skipBtn"),  "click", function () { pick("skip"); });
    U.on(document.getElementById("backBtn"),  "click", function () {
      if (STATE.idx > 0) { STATE.idx--; VIEWS.renderQuestion(STATE); }
      else { VIEWS.show("home"); location.hash = ""; }
    });
    U.on(document.getElementById("resetBtn"), "click", function () {
      if (!confirm("最初から始めますか？回答はリセットされます。")) return;
      STORE.clearAnswers();
      STATE.idx = 0;
      VIEWS.renderQuestion(STATE);
      MWA.track("quiz.reset");
    });

    document.addEventListener("keydown", function (e) {
      var view = U.$('.view[aria-hidden="false"]');
      if (!view || view.getAttribute("data-view") !== "quiz") return;
      if (e.key === "1" || e.key === "ArrowLeft") pick("a");
      else if (e.key === "2" || e.key === "ArrowRight") pick("b");
      else if (e.key === "Backspace") {
        if (STATE.idx > 0) { STATE.idx--; VIEWS.renderQuestion(STATE); }
      }
    });
  }

  function startQuiz() {
    STATE.idx = 0;
    var ans = STORE.readAnswers();
    for (var i = 0; i < STATE.questions.length; i++) {
      if (!ans.hasOwnProperty(STATE.questions[i].id)) { STATE.idx = i; break; }
      if (i === STATE.questions.length - 1) STATE.idx = i;
    }
    location.hash = "#quiz";
    VIEWS.show("quiz");
    VIEWS.renderQuestion(STATE);
    MWA.track("quiz.start");
  }

  function pick(which) {
    var q = STATE.questions[STATE.idx];
    if (!q) return;
    var v = which === "a" ? q.a.v : which === "b" ? q.b.v : 0;
    STORE.setAnswer(q.id, v);
    MWA.track("quiz.answer");
    advance();
  }

  function advance() {
    if (STATE.idx >= STATE.questions.length - 1) {
      finishQuiz();
      return;
    }
    STATE.idx += 1;
    VIEWS.renderQuestion(STATE);
  }

  function computeResult() {
    var ans = STORE.readAnswers();
    var n = 0; for (var k in ans) if (ans.hasOwnProperty(k)) n++;
    if (n === 0) return null;
    var r = ENGINE.score(ans, DATA, DIST);
    r.answeredCount = n;
    return r;
  }

  function finishQuiz() {
    var r = computeResult();
    if (!r) { VIEWS.show("home"); return; }
    STATE.result = r;
    STORE.appendHistory({
      ts: Date.now(),
      code: r.code,
      title: r.title.name,
      oneIn: r.rarity.oneIn
    });
    MWA.track("quiz.finish");
    showResult(r);
  }

  function showResult(r) {
    location.hash = "#result";
    VIEWS.show("result");
    VIEWS.renderResult(r);
  }

  function bindResult() {
    U.on(document.getElementById("restartBtn"), "click", function () {
      STORE.clearAnswers();
      STATE.idx = 0;
      MWA.track("result.restart");
      startQuiz();
    });

    U.on(document.getElementById("shareXBtn"), "click", function () {
      if (!STATE.result) return;
      MWA.track("share.x");
      var r = STATE.result;
      var url = location.origin + location.pathname;
      var text = "わたしは「" + r.title.name + "」。\n世界で " + r.rarity.oneIn.toLocaleString("en-US") + " 人に 1 人しかいないらしい。\nあなたは何タイプ？ " + url + " #MirrorWorld";
      var u = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
      window.open(u, "_blank", "noopener,noreferrer");
    });

    U.on(document.getElementById("shareLineBtn"), "click", function () {
      if (!STATE.result) return;
      MWA.track("share.line");
      var r = STATE.result;
      var url = location.origin + location.pathname;
      var text = "わたしは「" + r.title.name + "」。世界で " + r.rarity.oneIn.toLocaleString("en-US") + " 人に 1 人。\n→ " + url;
      var u = "https://line.me/R/msg/text/?" + encodeURIComponent(text);
      window.open(u, "_blank", "noopener,noreferrer");
    });

    U.on(document.getElementById("copyLinkBtn"), "click", function () {
      MWA.track("share.copy");
      var url = location.origin + location.pathname;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { flash("URL をコピーしました"); });
      } else {
        prompt("この URL をコピーしてください", url);
      }
    });

    U.on(document.getElementById("downloadBtn"), "click", function () {
      MWA.track("share.download");
      var c = document.getElementById("cardCanvas");
      SHARE.download(c, "mirror-world-" + (STATE.result ? STATE.result.code : "card") + ".png");
    });

    U.on(document.getElementById("waitlistBtn"), "click", function (e) {
      e.preventDefault();
      MWA.track("waitlist.open");
      var d = document.getElementById("waitDialog");
      if (d && d.showModal) d.showModal();
      else flash("通知リストは準備中です");
    });

    var form = document.getElementById("waitForm");
    U.on(form, "submit", function (e) {
      var btn = e.submitter || document.activeElement;
      if (!btn || btn.value !== "ok") return;

      var input = document.getElementById("waitEmail");
      var email = input ? String(input.value || "").trim() : "";
      if (!email) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("メールアドレスの形式を確認してください。");
        e.preventDefault(); return;
      }
      MWA.track("waitlist.submit");
      var body = "I'd like early access to Mirror Pro.%0A%0A(my email: " + encodeURIComponent(email) + ")";
      var u = "https://github.com/guttyanneruuuuuu/service10/issues/new?title=" +
              encodeURIComponent("Mirror Pro waitlist") + "&body=" + body;
      window.open(u, "_blank", "noopener,noreferrer");
    });
  }

  var flashEl = null;
  function flash(msg) {
    if (!flashEl) {
      flashEl = document.createElement("div");
      flashEl.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
        "background:rgba(0,0,0,.8);color:#fff;padding:10px 16px;border-radius:99px;font-size:13px;" +
        "z-index:1000;box-shadow:0 6px 20px rgba(0,0,0,.4);transition:opacity .3s ease;opacity:0;";
      document.body.appendChild(flashEl);
    }
    flashEl.textContent = msg;
    flashEl.style.opacity = "1";
    clearTimeout(flashEl._t);
    flashEl._t = setTimeout(function () { flashEl.style.opacity = "0"; }, 1800);
  }

  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").toLowerCase();
    if (h === "#quiz") VIEWS.show("quiz");
    else if (h === "#result") {
      if (STATE.result) VIEWS.show("result");
      else { var r = computeResult(); if (r) showResult(r); else VIEWS.show("home"); }
    }
    else VIEWS.show("home");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
