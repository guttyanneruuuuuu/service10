/* Mirror.world — local persistence (localStorage) */
(function (g) {
  "use strict";

  var ANS_KEY  = "mw.answers.v1";
  var HIST_KEY = "mw.history.v1";
  var ID_KEY   = "mw.uid.v1";

  function getUid() {
    try {
      var u = localStorage.getItem(ID_KEY);
      if (!u) {
        u = U.uid();
        localStorage.setItem(ID_KEY, u);
      }
      return u;
    } catch (_) { return "anon"; }
  }

  function readAnswers() {
    try {
      var v = localStorage.getItem(ANS_KEY);
      if (!v) return {};
      var p = JSON.parse(v);
      return p && typeof p === "object" ? p : {};
    } catch (_) { return {}; }
  }
  function writeAnswers(o) {
    try { localStorage.setItem(ANS_KEY, JSON.stringify(o || {})); } catch (_) {}
  }
  function clearAnswers() {
    try { localStorage.removeItem(ANS_KEY); } catch (_) {}
  }

  function setAnswer(qid, value) {
    var a = readAnswers();
    a[qid] = value;
    writeAnswers(a);
  }
  function getAnswer(qid) {
    var a = readAnswers();
    return a.hasOwnProperty(qid) ? a[qid] : null;
  }

  function readHistory() {
    try {
      var v = localStorage.getItem(HIST_KEY);
      if (!v) return [];
      var p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch (_) { return []; }
  }
  function appendHistory(rec) {
    var h = readHistory();
    h.push(rec);
    if (h.length > 50) h = h.slice(h.length - 50);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); } catch (_) {}
  }

  g.STORE = {
    getUid: getUid,
    setAnswer: setAnswer,
    getAnswer: getAnswer,
    readAnswers: readAnswers,
    clearAnswers: clearAnswers,
    appendHistory: appendHistory,
    readHistory: readHistory
  };
})(window);
