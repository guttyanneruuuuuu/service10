/* Pulse Earth — client-side validation & abuse guards */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;

  const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g;
  const BAD = [
    /https?:\/\/\S+/i,
    /(?:t\.me|bit\.ly|onlyfans|xn--)/i,
    /\b(?:viagra|casino|porn|xxx)\b/i,
    /(.)\1{15,}/
  ];

  const Sec = {
    sanitize(s, max) {
      if (s == null) return "";
      let out = String(s).replace(CONTROL, "").replace(/\r?\n/g, " ");
      out = out.trim().replace(/\s{3,}/g, "  ");
      if (typeof max === "number" && out.length > max) out = out.slice(0, max);
      return out;
    },
    looksBad(s) { if (!s) return false; return BAD.some((r) => r.test(s)); },

    validatePulse(raw) {
      const errors = [];
      const allowed = Object.keys(C.emotions);
      if (!allowed.includes(raw.emotion)) errors.push("感情を選んでください。");
      const msg = Sec.sanitize(raw.message, C.limits.msgMax);
      if (msg && Sec.looksBad(msg)) errors.push("メッセージにURLや禁止ワードは使えません。");
      if (typeof raw.lat !== "number" || typeof raw.lon !== "number") errors.push("位置情報が無効です。");
      else if (raw.lat < -90 || raw.lat > 90 || raw.lon < -180 || raw.lon > 180) errors.push("位置情報が範囲外です。");

      const last = Number(localStorage.getItem("pulse:lastAt") || 0);
      const left = C.limits.cooldownMs - (Date.now() - last);
      if (left > 0) errors.push(`連投防止のため、あと${Math.ceil(left/1000)}秒お待ちください。`);

      if (errors.length) return { ok: false, errors };
      return { ok: true, data: { emotion: raw.emotion, message: msg, lat: raw.lat, lon: raw.lon, place: String(raw.place || "").slice(0, 64) } };
    },
    markFired() { try { localStorage.setItem("pulse:lastAt", String(Date.now())); } catch {} }
  };
  g.Security = Sec;
})(window);
