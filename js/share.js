/* Mirror.world — share-card generator (1200x630) */
(function (g) {
  "use strict";

  var W = 1200, H = 630;

  function draw(canvas, result) {
    if (!canvas || !canvas.getContext) return;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");

    var color = (result && result.title && result.title.color) || "#7c5cff";

    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0c0a1f");
    grad.addColorStop(1, "#1a0e2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var glow = ctx.createRadialGradient(W * 0.78, H * 0.25, 30, W * 0.78, H * 0.25, 520);
    glow.addColorStop(0, withAlpha(color, 0.55));
    glow.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    var glow2 = ctx.createRadialGradient(W * 0.18, H * 0.8, 30, W * 0.18, H * 0.8, 480);
    glow2.addColorStop(0, "rgba(255,91,138,0.40)");
    glow2.addColorStop(1, "rgba(255,91,138,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (var x = 0; x <= W; x += 60) line(ctx, x, 0, x, H);
    for (var y = 0; y <= H; y += 60) line(ctx, 0, y, W, y);

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    roundRect(ctx, 12, 12, W - 24, H - 24, 28); ctx.stroke();

    drawLogo(ctx, 50, 56);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 22px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("mirror.world  ·  3 分の自己分析", W - 50, 78);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "600 22px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText("YOUR TITLE", 60, 200);

    ctx.fillStyle = "#ffffff";
    var name = (result && result.title && result.title.name) || "唯一の存在";
    fitText(ctx, name, 60, 286, W - 120, 76, 56);

    var tag = (result && result.title && result.title.tagline) || "";
    ctx.fillStyle = withAlpha(color, 1);
    ctx.font = "700 30px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText(tag, 60, 340);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    line(ctx, 60, 380, W - 60, 380);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 22px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText("世界で同じ性格の人は", 60, 430);

    var oneIn = (result && result.rarity && result.rarity.oneIn) || 1;
    var worldCount = (result && result.rarity && result.rarity.worldCount) || 1;
    var rarityBig = oneIn.toLocaleString("en-US") + " 人に 1 人";

    ctx.fillStyle = "#ffd166";
    ctx.font = "900 78px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText(rarityBig, 60, 510);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "600 22px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText("世界で約 " + worldCount.toLocaleString("en-US") + " 人", 60, 545);

    var code = (result && result.code) || "";
    ctx.fillStyle = withAlpha(color, 0.20);
    roundRect(ctx, W - 280, H - 110, 220, 56, 18); ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 1.5;
    roundRect(ctx, W - 280, H - 110, 220, 56, 18); ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 26px ui-monospace, 'SFMono-Regular', monospace";
    ctx.textAlign = "center";
    ctx.fillText(code, W - 170, H - 73);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "600 22px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.fillText("guttyanneruuuuuu.github.io/service10/", 60, H - 70);
  }

  function drawLogo(ctx, x, y) {
    var grad = null;
    if (ctx.createConicGradient) {
      try {
        grad = ctx.createConicGradient((-Math.PI * 2) / 3, x + 14, y - 4);
        grad.addColorStop(0, "#ff5b8a");
        grad.addColorStop(0.33, "#7c5cff");
        grad.addColorStop(0.66, "#3da6ff");
        grad.addColorStop(1, "#ff5b8a");
      } catch (_) { grad = null; }
    }
    ctx.fillStyle = grad || "#7c5cff";
    ctx.beginPath(); ctx.arc(x + 14, y - 4, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x + 10, y - 8, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 28px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Mirror.world", x + 38, y + 5);
  }

  function fitText(ctx, text, x, y, maxW, baseSize, minSize) {
    var size = baseSize;
    ctx.font = "900 " + size + "px -apple-system, 'Hiragino Sans', sans-serif";
    while (ctx.measureText(text).width > maxW && size > minSize) {
      size -= 2;
      ctx.font = "900 " + size + "px -apple-system, 'Hiragino Sans', sans-serif";
    }
    ctx.fillText(text, x, y);
  }

  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function withAlpha(hex, a) {
    if (!hex) return "rgba(124,92,255," + a + ")";
    if (hex[0] !== "#") return hex;
    var s = hex.slice(1);
    if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(s, 16);
    var r = (n >> 16) & 255, gn = (n >> 8) & 255, b = n & 255;
    return "rgba(" + r + "," + gn + "," + b + "," + a + ")";
  }

  function download(canvas, filename) {
    try {
      var url = canvas.toDataURL("image/png");
      var a = document.createElement("a");
      a.href = url; a.download = filename || "mirror-world.png";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.warn("download failed", e); }
  }

  g.SHARE = { draw: draw, download: download };
})(window);
