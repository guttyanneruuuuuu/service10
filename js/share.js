/* Pulse Earth — share-card image generator (1200x630). */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;

  const Share = {};

  Share.draw = function (ctx, opts = {}) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const emotion = opts.emotion || "joy";
    const message = opts.message || "";
    const place = opts.place || "Earth";
    const totalToday = opts.totalToday || 0;
    const emo = C.emotions[emotion] || C.emotions.joy;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#000814");
    bg.addColorStop(0.5, "#06122a");
    bg.addColorStop(1, "#000814");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 1.4;
      ctx.globalAlpha = 0.3 + Math.random() * 0.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const cx = W * 0.78, cy = H * 0.55, r = 220;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
    grd.addColorStop(0, "rgba(70,120,255,0.55)");
    grd.addColorStop(0.5, "rgba(40,80,200,0.25)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#0a1430";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "rgba(120,160,255,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * (0.35 + i * 0.12), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < Math.PI; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * Math.sin(a), r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const px = cx + r * 0.15, py = cy - r * 0.25;
    const dropGrd = ctx.createRadialGradient(px, py, 0, px, py, 80);
    dropGrd.addColorStop(0, emo.color);
    dropGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = dropGrd;
    ctx.beginPath(); ctx.arc(px, py, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = emo.color;
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#5ae0e0";
    ctx.font = "700 22px Inter, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("● PULSE EARTH", 60, 56);

    ctx.fillStyle = "#eef1ff";
    ctx.font = "900 64px 'Zen Kaku Gothic New', sans-serif";
    ctx.fillText("世界の今、", 60, 130);
    ctx.fillText("地球が脈打つ。", 60, 210);

    ctx.font = "120px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
    ctx.fillText(emo.face, 60, 290);

    ctx.fillStyle = "#b6baca";
    ctx.font = "500 26px 'Zen Kaku Gothic New', sans-serif";
    ctx.fillText("from " + place + " — " + emo.label, 60, 430);

    if (message) {
      ctx.fillStyle = "#eef1ff";
      ctx.font = "600 28px 'Zen Kaku Gothic New', sans-serif";
      const text = message.length > 28 ? message.slice(0, 28) + "…" : message;
      ctx.fillText("「" + text + "」", 60, 470);
    }

    ctx.fillStyle = "#7a7f93";
    ctx.font = "500 20px Inter, sans-serif";
    ctx.fillText("今日 " + totalToday.toLocaleString() + " 個の鼓動が降った", 60, 540);

    ctx.fillStyle = "#5ae0e0";
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillText("guttyanneruuuuuu.github.io/service10", 60, 580);
  };

  Share.toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, "image/png", 0.92));

  g.Share = Share;
})(window);
