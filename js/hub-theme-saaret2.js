'use strict';

// Sokkeloteemat (ks. hub-themes.js): Taikakynän saari (paper), Vuorisaari
// (mine + mountain), Kirjainsaari (letters) ja Tivolisaari (fair).

// ---------- Yhteiset palat ----------
var HTSAARI2_COLORS = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff', '#ff9d5c'];

// Laatan vasen ja oikea sivualue maisemalle: [alku, loppu] kummallekin puolelle
function htSaari2Sides(w, lay) {
  var gap = lay.cell * 0.6, right = lay.ox + lay.cols * lay.cell + gap;
  return { L: [0, Math.max(0, lay.ox - gap)], R: [Math.min(w, right), w] };
}

// Pallorykelmä yhtenä tarrana: yhteinen reunaviiva ympäri, sisällä ei saumoja.
// pts = [[x, y, r], ...]
function htSaari2Puffs(b, pts, color, line, hi) {
  var i, p, y0 = 1e9, y1 = -1e9;
  b.beginPath();
  for (i = 0; i < pts.length; i++) {
    p = pts[i];
    b.moveTo(p[0] + p[2], p[1]);
    b.arc(p[0], p[1], p[2], 0, Math.PI * 2);
    y0 = Math.min(y0, p[1] - p[2]); y1 = Math.max(y1, p[1] + p[2]);
  }
  b.strokeStyle = line || artShade(color, -0.45);
  b.lineWidth = Math.max(ART.lineMin, (y1 - y0) * 0.05) * 2;
  b.lineJoin = 'round';
  b.stroke();
  artFillPath(b, color, y0, y1, 1, { line: false });
  if (hi) artHighlight(b, pts[0][0], y0 + (y1 - y0) * 0.3, pts[0][2] * 0.35, pts[0][2] * 0.18, 0.4);
}

// Väriliituviivoitus nykyisen leikkauksen sisään (vinot vedot)
function htSaari2Hatch(b, x0, y0, x1, y1, color, step) {
  var x, hgt = y1 - y0;
  b.strokeStyle = color;
  b.lineWidth = Math.max(1, step * 0.3);
  b.lineCap = 'round';
  b.beginPath();
  for (x = x0 - hgt; x < x1; x += step) { b.moveTo(x, y1); b.lineTo(x + hgt * 0.7, y0); }
  b.stroke();
}

// Väriliitumuoto: tarratäyttö + viivoitus muodon sisällä
function htSaari2Crayon(b, pathFn, color, x0, y0, x1, y1) {
  var r = Math.min(x1 - x0, y1 - y0) / 2;
  pathFn();
  artFillPath(b, color, y0, y1, r, { lineColor: artShade(color, -0.5), line: Math.max(1.2, r * 0.09) });
  b.save();
  pathFn();
  b.clip();
  htSaari2Hatch(b, x0, y0, x1, y1, artRGBA(artShade(color, -0.18), 0.55), Math.max(3, r * 0.16));
  b.restore();
}

// Käsin piirretyn näköinen soikio (hiukan aaltoileva reuna)
function htSaari2Wobble(b, x, y, rx, ry, seed) {
  var i, n = 12, pts = [], a, k;
  for (i = 0; i < n; i++) {
    a = i / n * Math.PI * 2;
    k = 1 + Math.sin(i * 2.7 + seed * 9) * 0.07;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  b.beginPath();
  b.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  for (i = 1; i <= n; i++) {
    var p = pts[i % n], q = pts[(i + 1) % n];
    b.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  b.closePath();
}

// Pisara (sade, kynän muste)
function htSaari2Drop(b, x, y, r, color) {
  b.beginPath();
  b.moveTo(x, y - r * 2);
  b.bezierCurveTo(x + r * 1.3, y - r * 0.2, x + r, y + r, x, y + r);
  b.bezierCurveTo(x - r, y + r, x - r * 1.3, y - r * 0.2, x, y - r * 2);
  artFillPath(b, color, y - r * 2, y + r, r);
}

// Iso ystävällinen kirjain reunaviivalla
function htSaari2Letter(b, ch, x, y, size, fill, line) {
  b.font = 'bold ' + Math.round(size) + 'px ' + UI_FONT;
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  b.lineJoin = 'round';
  if (line) {
    b.strokeStyle = line;
    b.lineWidth = Math.max(1.5, size * 0.12);
    b.strokeText(ch, x, y);
  }
  b.fillStyle = fill;
  b.fillText(ch, x, y);
  b.textBaseline = 'alphabetic';
}

// Lintu taivaalla (kaksi kaarta)
function htSaari2Bird(b, x, y, r, color) {
  b.strokeStyle = color;
  b.lineWidth = Math.max(1.5, r * 0.25);
  b.lineCap = 'round';
  b.beginPath();
  b.arc(x - r, y, r, Math.PI * 1.15, Math.PI * 1.85);
  b.arc(x + r, y, r, Math.PI * 1.15, Math.PI * 1.85);
  b.stroke();
}

// ---------- Taikakynän saari: piirustuspaperi ----------
// Väriliitupuu (omenoineen tai ilman)
function htSaari2DoodleTree(b, x, baseY, s, seed, apples) {
  var cy = baseY - s * 0.95, i;
  var leaf = apples ? '#7fd06a' : ['#9ddc6e', '#62c79a', '#ffb3d0', '#8fd86e'][Math.floor((seed % 1) * 3.99)];
  artShadow(b, x, baseY, s * 0.34, s * 0.07, 0.14);
  b.beginPath();
  b.moveTo(x - s * 0.07, baseY); b.lineTo(x - s * 0.045, baseY - s * 0.62);
  b.lineTo(x + s * 0.045, baseY - s * 0.62); b.lineTo(x + s * 0.08, baseY); b.closePath();
  artFillPath(b, '#b9824f', baseY - s * 0.62, baseY, s * 0.07, { lineColor: '#6b4426' });
  htSaari2Crayon(b, function () { htSaari2Wobble(b, x, cy, s * 0.42, s * 0.37, seed); }, leaf, x - s * 0.42, cy - s * 0.4, x + s * 0.42, cy + s * 0.4);
  if (apples) {
    var ap = [[-0.22, -0.08], [0.18, -0.16], [0.02, 0.12], [-0.05, -0.24], [0.26, 0.1]];
    for (i = 0; i < ap.length; i++) {
      artCircle(b, x + ap[i][0] * s, cy + ap[i][1] * s, s * 0.065, '#ff4f5a', { hi: 0.45 });
    }
  } else {
    artHighlight(b, x - s * 0.15, cy - s * 0.18, s * 0.1, s * 0.05, 0.35);
  }
}

// Kynä pystyssä kärki maassa, kallellaan; maassa kiemura jonka se piirsi
function htSaari2Pencil(b, x, baseY, s, col, ang) {
  var w = s * 0.1, L = s * 1.0, tip = s * 0.22;
  b.strokeStyle = artRGBA('#6a6f8a', 0.55);
  b.lineWidth = Math.max(1.2, s * 0.025);
  b.lineCap = 'round';
  b.beginPath();
  b.moveTo(x - s * 0.4, baseY - s * 0.02);
  b.bezierCurveTo(x - s * 0.3, baseY - s * 0.14, x - s * 0.12, baseY + s * 0.08, x - s * 0.2, baseY - s * 0.04);
  b.bezierCurveTo(x - s * 0.26, baseY - s * 0.1, x - s * 0.06, baseY - s * 0.1, x, baseY);
  b.stroke();
  artShadow(b, x + s * 0.12, baseY, s * 0.3, s * 0.06, 0.15);
  b.save();
  b.translate(x, baseY);
  b.rotate(ang);
  b.beginPath(); b.moveTo(0, 0); b.lineTo(-w, -tip); b.lineTo(w, -tip); b.closePath();
  artFillPath(b, '#f6cf9f', -tip, 0, w, { lineColor: '#8a5a30' });
  b.beginPath(); b.moveTo(0, 0); b.lineTo(-w * 0.38, -tip * 0.38); b.lineTo(w * 0.38, -tip * 0.38); b.closePath();
  b.fillStyle = '#4a4a5a'; b.fill();
  b.beginPath(); b.rect(-w, -L, w * 2, L - tip);
  artFillPath(b, col, -L, -tip, w, { lineColor: artShade(col, -0.45) });
  b.fillStyle = 'rgba(255,255,255,0.35)';
  b.fillRect(-w * 0.55, -L, w * 0.35, L - tip);
  artRoundRect(b, -w * 1.08, -L - s * 0.1, w * 2.16, s * 0.11, s * 0.02, '#cfd2dc', { lineColor: '#7a7e8c' });
  artRoundRect(b, -w, -L - s * 0.25, w * 2, s * 0.17, w * 0.7, '#ff9ec6', { lineColor: '#b0577a' });
  b.restore();
}

// Mustepullo ja sulkakynä
function htSaari2Ink(b, x, baseY, s) {
  var k = s * 0.28, y = baseY - k * 0.9;
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.18);
  artBlob(b, x + k * 0.55, y - k * 2.0, k * 0.32, k * 1.25, '#ff9ec6', { rot: 0.45, lineColor: '#b0577a', hi: 0.3 });
  b.strokeStyle = '#b0577a';
  b.lineWidth = Math.max(1, k * 0.08);
  b.beginPath(); b.moveTo(x + k * 0.05, y - k * 0.9); b.lineTo(x + k * 1.05, y - k * 3.0); b.stroke();
  drawInkBottle(b, x, y, k);
  htSaari2Drop(b, x - k * 1.3, baseY - k * 0.3, k * 0.22, '#8a4dff');
}

// Sadepilvi hymyineen, sen alla lätäkkö ja kukka
function htSaari2RainCloud(b, x, baseY, s, rnd) {
  var cy = baseY - s * 1.05, i;
  artBlob(b, x, baseY - s * 0.02, s * 0.32, s * 0.07, '#a9d6ff', { lineColor: '#5f8fc0' });
  drawFlower(b, x + s * 0.24, baseY - s * 0.14, s * 0.05, rnd < 0.5 ? '#ff7bac' : '#ffd23e');
  b.strokeStyle = '#4fa046'; b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.moveTo(x + s * 0.24, baseY - s * 0.1); b.lineTo(x + s * 0.22, baseY); b.stroke();
  for (i = 0; i < 3; i++) htSaari2Drop(b, x + (i - 1) * s * 0.17, cy + s * (0.38 + (i % 2) * 0.16), s * 0.035, '#5fb0ff');
  htSaari2Puffs(b, [[x, cy - s * 0.05, s * 0.2], [x - s * 0.22, cy + s * 0.04, s * 0.15], [x + s * 0.22, cy + s * 0.04, s * 0.15]], '#d7e2f4', '#7f8fb0', true);
  b.fillStyle = '#4a4a6a';
  b.beginPath(); b.arc(x - s * 0.07, cy + s * 0.02, s * 0.02, 0, Math.PI * 2); b.arc(x + s * 0.07, cy + s * 0.02, s * 0.02, 0, Math.PI * 2); b.fill();
  b.strokeStyle = '#4a4a6a'; b.lineWidth = Math.max(1, s * 0.018);
  b.beginPath(); b.arc(x, cy + s * 0.06, s * 0.05, 0.2, Math.PI - 0.2); b.stroke();
}

// Väriliituaurinko hymyineen
function htSaari2Sun(b, x, y, r) {
  var i, a;
  b.strokeStyle = '#ffae3c';
  b.lineWidth = Math.max(2, r * 0.1);
  b.lineCap = 'round';
  for (i = 0; i < 12; i++) {
    a = i / 12 * Math.PI * 2;
    b.beginPath();
    b.moveTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25);
    b.lineTo(x + Math.cos(a + 0.08) * r * (i % 2 ? 1.55 : 1.7), y + Math.sin(a + 0.08) * r * (i % 2 ? 1.55 : 1.7));
    b.stroke();
  }
  htSaari2Crayon(b, function () { htSaari2Wobble(b, x, y, r, r, 0.3); }, '#ffd84f', x - r, y - r, x + r, y + r);
  b.fillStyle = '#7a4a1a';
  b.beginPath(); b.arc(x - r * 0.32, y - r * 0.12, r * 0.08, 0, Math.PI * 2); b.arc(x + r * 0.32, y - r * 0.12, r * 0.08, 0, Math.PI * 2); b.fill();
  b.strokeStyle = '#7a4a1a'; b.lineWidth = Math.max(1.5, r * 0.07);
  b.beginPath(); b.arc(x, y + r * 0.05, r * 0.38, 0.35, Math.PI - 0.35); b.stroke();
  artBlush(b, x - r * 0.55, y + r * 0.2, r * 0.13);
  artBlush(b, x + r * 0.55, y + r * 0.2, r * 0.13);
}

HUB_THEMES.paper = {
  sky: ['#fffaf0', '#f6ecd6'],
  ground: ['#fffdf6', '#f7efdc'],
  earth: '#d2b98f',
  path: ['#a58bd6', '#fff3b0'],
  backdrop: function (b, w, h, lay) {
    var i, x, y, k, s = lay.cell, sd = htSaari2Sides(w, lay), hz = lay.oy + lay.rows * s * 0.35;
    // Vihon viivat ja marginaali
    b.strokeStyle = 'rgba(110,150,220,0.22)';
    b.lineWidth = 1.5;
    b.beginPath();
    for (y = h * 0.06; y < h; y += s * 0.55) { b.moveTo(0, y); b.lineTo(w, y); }
    b.stroke();
    b.strokeStyle = 'rgba(235,100,110,0.35)';
    b.beginPath(); b.moveTo(w * 0.04, 0); b.lineTo(w * 0.04, h); b.stroke();
    // Aurinko ja pilvet
    htSaari2Sun(b, sd.L[1] * 0.42 + s * 0.4, h * 0.15, s * 0.6);
    var cl = [[0.86, 0.1], [0.72, 0.2], [0.15, 0.36], [0.95, 0.32]];
    for (i = 0; i < cl.length; i++) {
      x = w * cl[i][0]; y = h * cl[i][1];
      htSaari2Puffs(b, [[x, y, s * 0.32], [x - s * 0.36, y + s * 0.1, s * 0.22], [x + s * 0.36, y + s * 0.1, s * 0.24]], '#ffffff', '#9fb4d8');
    }
    // Väriliitukukkulat
    var hills = ['#d6f0b8', '#b6e397', '#9bd67e'];
    for (k = 0; k < hills.length; k++) {
      b.beginPath(); b.moveTo(-10, h + 10);
      for (x = -10; x <= w + 10; x += w / 40) b.lineTo(x, hz + k * h * 0.13 - Math.sin(x / w * (5 + k * 3) + k * 1.7) * h * 0.05);
      b.lineTo(w + 10, h + 10); b.closePath();
      artFillPath(b, hills[k], hz + k * h * 0.13 - h * 0.05, h, s, { lineColor: artShade(hills[k], -0.35), line: 2.5 });
    }
    // Sivuille omenapuita, sadepilvi, kynä ja mustepullo
    var by = lay.oy + lay.rows * s * 0.62;
    for (k = 0; k < 2; k++) {
      var a = k ? sd.R : sd.L, wd = a[1] - a[0];
      if (wd < s) continue;
      for (i = 0; i < 3; i++) {
        x = a[0] + wd * (0.2 + i * 0.32);
        y = by + (i % 2) * s * 1.6 + k * s * 0.6;
        if ((i + k) % 3 === 1) htSaari2Pencil(b, x, y, s * 1.6, k ? '#5fb0ff' : '#ffcf3e', k ? -0.35 : 0.3);
        else htSaari2DoodleTree(b, x, y, s * 1.7, i * 0.3 + k * 0.5, (i + k) % 2 === 0);
      }
      htSaari2Ink(b, a[0] + wd * 0.5, by + s * 4.2, s * 1.5);
      htSaari2RainCloud(b, a[0] + wd * (k ? 0.35 : 0.65), by - s * 1.6, s * 1.3, k);
      for (i = 0; i < 5; i++) drawFlower(b, a[0] + wd * hubHash(i, k + 4), by + s * (2.5 + hubHash(k, i) * 4), s * 0.08, HTSAARI2_COLORS[(i + k) % 6]);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    // Vihon viivat laatassakin
    b.strokeStyle = 'rgba(110,150,220,0.22)';
    b.lineWidth = Math.max(1, s * 0.02);
    b.beginPath();
    b.moveTo(x, y + s * 0.25); b.lineTo(x + s, y + s * 0.25);
    b.moveTo(x, y + s * 0.75); b.lineTo(x + s, y + s * 0.75);
    b.stroke();
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.5), col = HTSAARI2_COLORS[Math.floor(rnd2 * 6)];
    if (rnd < 0.14) drawStar(b, px, py, s * 0.07, rnd2, 0);
    else if (rnd < 0.26) { b.fillStyle = '#ff7bac'; drawHeartShape(b, px, py, s * 0.06, true); }
    else if (rnd < 0.38) {
      b.strokeStyle = artRGBA(col, 0.8); b.lineWidth = Math.max(1, s * 0.025); b.lineCap = 'round';
      b.beginPath();
      for (var i = 0; i < 18; i++) { var a = i * 0.7, rr = s * 0.006 * i; b.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); }
      b.stroke();
    } else if (rnd < 0.6) hubThemeTuft(b, px, py, s, '#6cc45c');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.36) htSaari2DoodleTree(b, x, baseY, s * (0.85 + rnd2 * 0.25), rnd2, rnd < 0.2);
    else if (rnd < 0.52) htSaari2Pencil(b, x, baseY, s * (0.95 + rnd2 * 0.2), HTSAARI2_COLORS[Math.floor(rnd2 * 6)], rnd2 < 0.5 ? 0.3 : -0.3);
    else if (rnd < 0.66) htSaari2Ink(b, x, baseY, s);
    else if (rnd < 0.8) htSaari2RainCloud(b, x, baseY, s, rnd2);
    else {
      // Väriliitupensas kukkineen
      artShadow(b, x, baseY, s * 0.36, s * 0.07, 0.14);
      htSaari2Crayon(b, function () { htSaari2Wobble(b, x, baseY - s * 0.22, s * 0.36, s * 0.24, rnd2); }, '#8fd86e', x - s * 0.36, baseY - s * 0.46, x + s * 0.36, baseY + s * 0.02);
      drawFlower(b, x - s * 0.14, baseY - s * 0.3, s * 0.06, '#ff7bac');
      drawFlower(b, x + s * 0.16, baseY - s * 0.2, s * 0.06, '#ffd23e');
    }
  }
};

// ---------- Vuorisaari: kaivos ja lumihuiput ----------
// Vuorijono: huiput lumilakkeineen. o: { col, snow, line }
function htSaari2Peaks(b, x0, x1, baseY, hgt, n, seed, o) {
  var i;
  for (i = 0; i < n; i++) {
    var px = x0 + (x1 - x0) * (i + 0.5) / n + (hubHash(i, seed) - 0.5) * (x1 - x0) / n * 0.6;
    var ph = hgt * (0.65 + hubHash(seed, i) * 0.35);
    htSaari2Peak(b, px, baseY, ph, o);
  }
}
function htSaari2Peak(b, px, baseY, ph, o) {
  var bw = ph * (o.wr || 0.95);
  var path = function () {
    b.beginPath();
    b.moveTo(px - bw, baseY);
    b.lineTo(px - ph * 0.12, baseY - ph * 0.94);
    b.quadraticCurveTo(px, baseY - ph * 1.04, px + ph * 0.12, baseY - ph * 0.94);
    b.lineTo(px + bw, baseY);
    b.closePath();
  };
  path();
  artFillPath(b, o.col, baseY - ph, baseY, ph * 0.3, o.line ? { lineColor: o.line, line: Math.max(1.5, ph * 0.025) } : { line: false });
  b.save();
  path();
  b.clip();
  // Lumilakki aaltoilevalla alareunalla
  var sy = baseY - ph * 0.62, k;
  b.beginPath();
  b.moveTo(px - bw, baseY - ph * 1.1);
  b.lineTo(px - bw, sy);
  for (k = -3; k <= 3; k++) b.quadraticCurveTo(px + (k - 0.5) * ph * 0.13, sy + ph * (k % 2 ? 0.1 : -0.02), px + k * ph * 0.13, sy + ph * 0.03);
  b.lineTo(px + bw, sy);
  b.lineTo(px + bw, baseY - ph * 1.1);
  b.closePath();
  b.fillStyle = o.snow;
  b.fill();
  // Varjopuoli
  b.fillStyle = 'rgba(40,50,110,0.12)';
  b.beginPath(); b.moveTo(px, baseY - ph * 1.02); b.lineTo(px + bw, baseY); b.lineTo(px + bw * 0.15, baseY); b.closePath(); b.fill();
  b.restore();
}

// Majakka kalliosaarella
function htSaari2Lighthouse(b, x, baseY, s) {
  var i, line = '#7a2f3a';
  artBlob(b, x, baseY, s * 0.6, s * 0.16, '#9a9ab0', { lineColor: '#5a5a70' });
  b.beginPath();
  b.moveTo(x - s * 0.22, baseY - s * 0.05); b.lineTo(x - s * 0.14, baseY - s * 1.1);
  b.lineTo(x + s * 0.14, baseY - s * 1.1); b.lineTo(x + s * 0.22, baseY - s * 0.05); b.closePath();
  artFillPath(b, '#fff6ee', baseY - s * 1.1, baseY, s * 0.2, { lineColor: line });
  b.save(); b.clip();
  for (i = 0; i < 3; i++) { b.fillStyle = '#ff5f6e'; b.fillRect(x - s * 0.3, baseY - s * (0.32 + i * 0.32), s * 0.6, s * 0.16); }
  b.restore();
  artGlow(b, x, baseY - s * 1.25, s * 0.55, '#fff3a0', 0.7);
  artRoundRect(b, x - s * 0.11, baseY - s * 1.32, s * 0.22, s * 0.22, s * 0.04, '#ffe27a', { lineColor: '#b08a2a' });
  b.beginPath(); b.moveTo(x - s * 0.17, baseY - s * 1.31); b.lineTo(x + s * 0.17, baseY - s * 1.31); b.lineTo(x, baseY - s * 1.5); b.closePath();
  artFillPath(b, '#ff5f6e', baseY - s * 1.5, baseY - s * 1.31, s * 0.1, { lineColor: line });
}

// Lumilakkinen kuusi
function htSaari2SnowPine(b, x, baseY, s) {
  var i;
  drawPine(b, x, baseY, s, '#3f8f62');
  for (i = 0; i < 3; i++) {
    var ty = baseY - s * 0.15 - i * s * 0.27 - s * 0.36;
    artBlob(b, x, ty + s * 0.04, s * (0.12 - i * 0.02), s * 0.04, '#ffffff', { line: false });
  }
}

function htSaari2MountainBackdrop(b, w, h, lay) {
  var i, x, s = lay.cell, sd = htSaari2Sides(w, lay), hz = lay.oy + lay.rows * s * 0.3;
  hubThemeClouds(b, w, h, 6);
  htSaari2Peaks(b, -s, w + s, hz + h * 0.1, h * 0.36, 7, 3, { col: '#bccbea', snow: '#f6f9ff' });
  // Meri alhaalla, majakka ja purjevene kaukana
  var sea = h * 0.8, g = b.createLinearGradient(0, sea, 0, h);
  g.addColorStop(0, '#8fd3f0'); g.addColorStop(1, '#4fa8d8');
  b.fillStyle = g; b.fillRect(0, sea, w, h - sea);
  b.strokeStyle = 'rgba(255,255,255,0.6)'; b.lineWidth = 2; b.lineCap = 'round';
  for (i = 0; i < 22; i++) {
    x = hubHash(i, 9) * w; var y = sea + s * 0.3 + hubHash(9, i) * (h - sea - s * 0.4);
    b.beginPath(); b.arc(x, y, s * 0.18, Math.PI * 1.15, Math.PI * 1.85); b.stroke();
  }
  // Lähemmät huiput sivuilla
  for (i = 0; i < 2; i++) {
    var a = i ? sd.R : sd.L, wd = a[1] - a[0];
    if (wd < s) continue;
    htSaari2Peaks(b, a[0] - s * 0.5, a[1] + s * 0.5, sea + s * 0.2, h * 0.42, 2, 5 + i, { col: '#93a6d2', snow: '#ffffff', line: '#5d6c9c' });
    var px;
    for (px = 0; px < 4; px++) htSaari2SnowPine(b, a[0] + wd * (0.12 + px * 0.25), sea + s * (0.1 + (px % 2) * 0.25), s * (1.1 + (px % 2) * 0.3));
    if (i) htSaari2Lighthouse(b, a[0] + wd * 0.62, h - s * 0.5, s * 1.4);
    else {
      // Purjevene
      var bx = a[0] + wd * 0.4, byy = h - s * 0.6;
      b.beginPath(); b.moveTo(bx - s * 0.5, byy); b.lineTo(bx + s * 0.5, byy); b.lineTo(bx + s * 0.35, byy + s * 0.22); b.lineTo(bx - s * 0.35, byy + s * 0.22); b.closePath();
      artFillPath(b, '#c97a4a', byy, byy + s * 0.22, s * 0.2, { lineColor: '#7a4422' });
      b.beginPath(); b.moveTo(bx, byy - s * 0.05); b.lineTo(bx, byy - s * 0.95); b.lineTo(bx + s * 0.45, byy - s * 0.1); b.closePath();
      artFillPath(b, '#ffffff', byy - s * 0.95, byy, s * 0.3, { lineColor: '#7f8fb0', shadeTo: '#dfe6ff' });
    }
  }
  // Kotkat liitävät
  for (i = 0; i < 6; i++) htSaari2Bird(b, w * (0.06 + hubHash(i, 2) * 0.9), h * (0.08 + hubHash(2, i) * 0.22), s * (0.12 + (i % 3) * 0.05), '#5a4a6a');
}

// Kaivosvaunu kiskonpätkällä, täynnä jalokiviä
function htSaari2Cart(b, x, baseY, s, rnd) {
  var i, top = baseY - s * 0.5;
  artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.2);
  artRoundRect(b, x - s * 0.48, baseY - s * 0.05, s * 0.96, s * 0.05, s * 0.02, '#8a8a9a', { lineColor: '#4a4a5a' });
  for (i = 0; i < 4; i++) artRoundRect(b, x - s * 0.42 + i * s * 0.26, baseY - s * 0.06, s * 0.1, s * 0.08, s * 0.02, '#8a5a34', { lineColor: '#4a3020' });
  for (i = 0; i < 4; i++) drawGem(b, x + (i - 1.5) * s * 0.16, top - s * 0.04 - (i % 2) * s * 0.06, s * 0.1, GEM_COLORS[(i + Math.floor(rnd * 6)) % 6]);
  b.beginPath();
  b.moveTo(x - s * 0.4, top); b.lineTo(x + s * 0.4, top); b.lineTo(x + s * 0.3, baseY - s * 0.16); b.lineTo(x - s * 0.3, baseY - s * 0.16); b.closePath();
  artFillPath(b, '#7f8aa8', top, baseY - s * 0.16, s * 0.3, { lineColor: '#3f4660' });
  artRoundRect(b, x - s * 0.43, top - s * 0.03, s * 0.86, s * 0.07, s * 0.03, '#a8b2cc', { lineColor: '#3f4660' });
  b.fillStyle = '#3f4660';
  for (i = -1; i <= 1; i++) { b.beginPath(); b.arc(x + i * s * 0.2, top + s * 0.12, s * 0.025, 0, Math.PI * 2); b.fill(); }
  artCircle(b, x - s * 0.2, baseY - s * 0.13, s * 0.08, '#4a4a5a', { lineColor: '#22222e' });
  artCircle(b, x + s * 0.2, baseY - s * 0.13, s * 0.08, '#4a4a5a', { lineColor: '#22222e' });
}

// Tukipuut ja tunnelin suu kalliossa; lyhty kyljessä
function htSaari2Tunnel(b, x, baseY, s, lit) {
  var wood = '#a8743f', wl = '#5a3a1e';
  artShadow(b, x, baseY, s * 0.5, s * 0.08, 0.18);
  htSaari2Puffs(b, [[x, baseY - s * 0.42, s * 0.42], [x - s * 0.32, baseY - s * 0.2, s * 0.24], [x + s * 0.32, baseY - s * 0.2, s * 0.24]], '#9a8a7a', '#5a4a3e');
  b.beginPath();
  b.moveTo(x - s * 0.2, baseY); b.lineTo(x - s * 0.2, baseY - s * 0.42); b.arc(x, baseY - s * 0.42, s * 0.2, Math.PI, 0); b.lineTo(x + s * 0.2, baseY); b.closePath();
  var g = b.createLinearGradient(0, baseY - s * 0.62, 0, baseY);
  g.addColorStop(0, lit ? '#ffcf7a' : '#3a2a26'); g.addColorStop(1, lit ? '#a8642e' : '#1e1614');
  b.fillStyle = g; b.fill();
  artRoundRect(b, x - s * 0.27, baseY - s * 0.62, s * 0.08, s * 0.62, s * 0.02, wood, { lineColor: wl });
  artRoundRect(b, x + s * 0.19, baseY - s * 0.62, s * 0.08, s * 0.62, s * 0.02, wood, { lineColor: wl });
  artRoundRect(b, x - s * 0.34, baseY - s * 0.7, s * 0.68, s * 0.1, s * 0.02, wood, { lineColor: wl });
  artGlow(b, x + s * 0.36, baseY - s * 0.42, s * 0.22, '#ffd27a', 0.7);
  artRoundRect(b, x + s * 0.31, baseY - s * 0.5, s * 0.1, s * 0.13, s * 0.03, '#ffe27a', { lineColor: '#6a4a1e' });
}

HUB_THEMES.mine = {
  sky: ['#9fd4ff', '#eaf6ff'],
  ground: ['#a98a68', '#977a5c'],
  earth: '#6e5340',
  path: ['#6b4a2e', '#ecd6a8'],
  backdrop: htSaari2MountainBackdrop,
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.5);
    if (rnd < 0.3) {
      artBlob(b, px, py, s * 0.07, s * 0.045, '#8a7a6a', { lineColor: '#5a4a3e' });
      artBlob(b, px + s * 0.09, py + s * 0.03, s * 0.045, s * 0.03, '#7a6a5a', { lineColor: '#5a4a3e' });
    } else if (rnd < 0.45) drawGem(b, px, py, s * 0.06, GEM_COLORS[Math.floor(rnd2 * 6)]);
    else if (rnd < 0.6) {
      b.strokeStyle = 'rgba(60,40,30,0.3)'; b.lineWidth = Math.max(1, s * 0.02);
      b.beginPath(); b.moveTo(px - s * 0.12, py); b.lineTo(px - s * 0.02, py - s * 0.04); b.lineTo(px + s * 0.03, py + s * 0.03); b.lineTo(px + s * 0.12, py - s * 0.02); b.stroke();
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var i;
    if (rnd < 0.28) htSaari2Tunnel(b, x, baseY, s, false);
    else if (rnd < 0.5) htSaari2Cart(b, x, baseY, s, rnd2);
    else if (rnd < 0.74) {
      // Kristalliryhmä kiven päällä
      artShadow(b, x, baseY, s * 0.36, s * 0.07, 0.2);
      artBlob(b, x, baseY - s * 0.1, s * 0.34, s * 0.14, '#8a7a6a', { lineColor: '#5a4a3e' });
      var cc = CRYSTAL_COLORS[Math.floor(rnd2 * CRYSTAL_COLORS.length)];
      artGlow(b, x, baseY - s * 0.45, s * 0.5, cc, 0.45);
      drawCrystal(b, x - s * 0.17, baseY - s * 0.38, s * 0.2, cc);
      drawCrystal(b, x + s * 0.16, baseY - s * 0.34, s * 0.17, cc);
      drawCrystal(b, x, baseY - s * 0.55, s * 0.3, cc);
    } else {
      // Kivikasa ja hakku
      artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.2);
      artLimb(b, x + s * 0.05, baseY - s * 0.05, x + s * 0.3, baseY - s * 0.62, s * 0.06, '#b07a44', '#5a3a1e');
      b.beginPath(); b.moveTo(x + s * 0.06, baseY - s * 0.62); b.quadraticCurveTo(x + s * 0.3, baseY - s * 0.78, x + s * 0.54, baseY - s * 0.55);
      b.quadraticCurveTo(x + s * 0.3, baseY - s * 0.66, x + s * 0.06, baseY - s * 0.62); b.closePath();
      artFillPath(b, '#c3c8d6', baseY - s * 0.75, baseY - s * 0.55, s * 0.1, { lineColor: '#4a4e60' });
      var rk = [[-0.22, -0.12, 0.17], [0.05, -0.1, 0.15], [-0.08, -0.3, 0.14]];
      for (i = 0; i < rk.length; i++) artCircle(b, x + rk[i][0] * s, baseY + rk[i][1] * s, rk[i][2] * s, i === 2 ? '#a0907e' : '#8a7a6a', { lineColor: '#5a4a3e', hi: 0.25 });
      drawGem(b, x - s * 0.08, baseY - s * 0.32, s * 0.07, GEM_COLORS[Math.floor(rnd2 * 6)]);
    }
  },
  // Kaivoksen kenttä: tunnelin suu tukipuineen, lyhdyn valaisema
  landmark: function (c, x, y, s, room, st) {
    var base = y + s * 0.34, wood = '#a8743f', wl = '#5a3a1e', col = room.color || '#8a5cb8';
    artShadow(c, x, base + s * 0.02, s * 0.5, s * 0.1, 0.22);
    htSaari2Puffs(c, [[x, y - s * 0.12, s * 0.48], [x - s * 0.38, y + s * 0.12, s * 0.26], [x + s * 0.38, y + s * 0.12, s * 0.26]], '#9a8a7a', '#5a4a3e');
    c.beginPath();
    c.moveTo(x - s * 0.3, base); c.lineTo(x - s * 0.3, y - s * 0.12); c.arc(x, y - s * 0.12, s * 0.3, Math.PI, 0); c.lineTo(x + s * 0.3, base); c.closePath();
    var g = c.createLinearGradient(0, y - s * 0.42, 0, base);
    g.addColorStop(0, st.cleared ? '#fff3c4' : '#fffaf0');
    g.addColorStop(1, st.cleared ? '#ffd56a' : artMix('#f3e2c0', col, 0.25));
    c.fillStyle = g; c.fill();
    artRoundRect(c, x - s * 0.4, y - s * 0.32, s * 0.1, base - y + s * 0.32, s * 0.03, wood, { lineColor: wl });
    artRoundRect(c, x + s * 0.3, y - s * 0.32, s * 0.1, base - y + s * 0.32, s * 0.03, wood, { lineColor: wl });
    artRoundRect(c, x - s * 0.48, y - s * 0.44, s * 0.96, s * 0.13, s * 0.03, col, { lineColor: artShade(col, -0.45) });
    artRoundRect(c, x - s * 0.44, base - s * 0.05, s * 0.88, s * 0.08, s * 0.03, '#8a8a9a', { lineColor: '#4a4a5a' });
    artGlow(c, x - s * 0.48, y - s * 0.14, s * 0.2, '#ffd27a', 0.7);
    artRoundRect(c, x - s * 0.53, y - s * 0.22, s * 0.1, s * 0.13, s * 0.03, '#ffe27a', { lineColor: '#6a4a1e' });
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

HUB_THEMES.mountain = {
  sky: HUB_THEMES.mine.sky,
  backdrop: htSaari2MountainBackdrop,
  ground: ['#e4eef9', '#d4e2f2'],
  earth: '#7f8aa8',
  path: ['#8a6a48', '#f2e2c0'],
  arch: '#e8f2ff',
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.5);
    if (rnd < 0.3) artBlob(b, px, py, s * 0.16, s * 0.05, '#ffffff', { line: false });
    else if (rnd < 0.45) {
      artBlob(b, px, py, s * 0.07, s * 0.05, '#9aa6c0', { lineColor: '#5d6c9c' });
      artBlob(b, px, py - s * 0.035, s * 0.05, s * 0.018, '#ffffff', { line: false });
    } else if (rnd < 0.55) drawSnowflake(b, px, py, s * 0.06);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.34) {
      artShadow(b, x, baseY, s * 0.5, s * 0.08, 0.18);
      htSaari2Peak(b, x, baseY, s * (0.95 + rnd2 * 0.4), { col: '#97a8d0', snow: '#ffffff', line: '#5d6c9c', wr: 0.42 });
      if (rnd2 > 0.6) {
        b.strokeStyle = '#5a3a1e'; b.lineWidth = Math.max(1, s * 0.025);
        var fy = baseY - s * (0.95 + rnd2 * 0.4);
        b.beginPath(); b.moveTo(x, fy); b.lineTo(x, fy - s * 0.25); b.stroke();
        b.beginPath(); b.moveTo(x, fy - s * 0.25); b.lineTo(x + s * 0.16, fy - s * 0.2); b.lineTo(x, fy - s * 0.14); b.closePath();
        artFillPath(b, '#ff5f6e', fy - s * 0.25, fy - s * 0.14, s * 0.06, { lineColor: '#a8303c', line: 1 });
      }
    } else if (rnd < 0.62) {
      htSaari2SnowPine(b, x - s * 0.12, baseY, s * (0.9 + rnd2 * 0.3));
      if (rnd2 < 0.5) htSaari2SnowPine(b, x + s * 0.24, baseY + s * 0.02, s * 0.6);
    } else if (rnd < 0.8) {
      // Kotkanpesä kalliopylvään päällä: pesässä kaksi poikasta
      artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.2);
      htSaari2Puffs(b, [[x, baseY - s * 0.42, s * 0.24], [x - s * 0.2, baseY - s * 0.14, s * 0.2], [x + s * 0.2, baseY - s * 0.16, s * 0.19]], '#97a8d0', '#5d6c9c');
      artBlob(b, x + s * 0.18, baseY - s * 0.3, s * 0.1, s * 0.035, '#ffffff', { line: false });
      var ny = baseY - s * 0.66, i;
      for (i = -1; i <= 1; i += 2) {
        var cx = x + i * s * 0.12, cy = ny - s * 0.12 - (i > 0 ? s * 0.02 : 0);
        artCircle(b, cx, cy, s * 0.14, '#fff0b8', { lineColor: '#a8864a', hi: 0.4 });
        b.fillStyle = '#3a2a2a';
        b.beginPath(); b.arc(cx - s * 0.05, cy - s * 0.02, s * 0.025, 0, Math.PI * 2); b.arc(cx + s * 0.05, cy - s * 0.02, s * 0.025, 0, Math.PI * 2); b.fill();
        b.beginPath(); b.moveTo(cx - s * 0.035, cy + s * 0.02); b.lineTo(cx + s * 0.035, cy + s * 0.02); b.lineTo(cx, cy + s * 0.07); b.closePath();
        artFillPath(b, '#ffa83e', cy, cy + s * 0.07, s * 0.03, { lineColor: '#a8642e', line: 1 });
      }
      artBlob(b, x, ny + s * 0.02, s * 0.3, s * 0.09, '#b07a44', { lineColor: '#5a3a1e' });
      b.strokeStyle = '#7a4a24'; b.lineWidth = Math.max(1, s * 0.02);
      b.beginPath(); b.moveTo(x - s * 0.25, ny); b.lineTo(x + s * 0.22, ny + s * 0.06); b.moveTo(x - s * 0.2, ny + s * 0.07); b.lineTo(x + s * 0.27, ny - s * 0.01); b.stroke();
    } else if (rnd < 0.88) {
      // Punainen vuorimaja lumikatolla
      artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.2);
      artRoundRect(b, x - s * 0.3, baseY - s * 0.4, s * 0.6, s * 0.4, s * 0.04, '#e0584e', { lineColor: '#7a2a24' });
      b.strokeStyle = 'rgba(120,40,36,0.4)'; b.lineWidth = Math.max(1, s * 0.015);
      b.beginPath(); b.moveTo(x - s * 0.3, baseY - s * 0.27); b.lineTo(x + s * 0.3, baseY - s * 0.27); b.moveTo(x - s * 0.3, baseY - s * 0.14); b.lineTo(x + s * 0.3, baseY - s * 0.14); b.stroke();
      artRoundRect(b, x - s * 0.2, baseY - s * 0.3, s * 0.14, s * 0.12, s * 0.02, '#ffe9a8', { lineColor: '#7a2a24' });
      artRoundRect(b, x + s * 0.05, baseY - s * 0.24, s * 0.13, s * 0.24, s * 0.03, '#8a4a2a', { lineColor: '#4a2414' });
      artRoundRect(b, x + s * 0.14, baseY - s * 0.72, s * 0.08, s * 0.18, s * 0.02, '#8a7a6a', { lineColor: '#4a3e34' });
      b.beginPath(); b.moveTo(x - s * 0.42, baseY - s * 0.36); b.lineTo(x, baseY - s * 0.72); b.lineTo(x + s * 0.42, baseY - s * 0.36);
      b.quadraticCurveTo(x, baseY - s * 0.46, x - s * 0.42, baseY - s * 0.36); b.closePath();
      artFillPath(b, '#ffffff', baseY - s * 0.72, baseY - s * 0.36, s * 0.3, { lineColor: '#7f8fb0', shadeTo: '#d6e2f6' });
    } else {
      // Lumipeitteiset lohkareet
      artShadow(b, x, baseY, s * 0.4, s * 0.07, 0.18);
      artBlob(b, x - s * 0.12, baseY - s * 0.16, s * 0.24, s * 0.17, '#9aa6c0', { lineColor: '#5d6c9c' });
      artBlob(b, x + s * 0.2, baseY - s * 0.1, s * 0.16, s * 0.11, '#a8b4cc', { lineColor: '#5d6c9c' });
      artBlob(b, x - s * 0.12, baseY - s * 0.3, s * 0.18, s * 0.06, '#ffffff', { line: false });
      artBlob(b, x + s * 0.2, baseY - s * 0.19, s * 0.11, s * 0.04, '#ffffff', { line: false });
    }
  }
};

// ---------- Kirjainsaari: aakkospuutarha ----------
var HTSAARI2_ABC = 'ABCDEFGHIJKLMNOPRSTUVYÄÖ';
var HTSAARI2_SYLL = ['KA', 'LE', 'PU', 'MA', 'SO', 'TI', 'VE', 'NO', 'LU', 'HE'];

// Kirjainkuutio (puupalikka), rot kallistus
function htSaari2Block(b, x, baseY, sz, color, ch, rot) {
  b.save();
  b.translate(x, baseY - sz / 2);
  b.rotate(rot || 0);
  artRoundRect(b, -sz / 2, -sz / 2, sz, sz, sz * 0.16, color, { lineColor: artShade(color, -0.5) });
  artRoundRect(b, -sz * 0.36, -sz * 0.36, sz * 0.72, sz * 0.72, sz * 0.12, '#fffaf0', { line: false, flat: true });
  htSaari2Letter(b, ch, 0, sz * 0.03, sz * 0.62, artShade(color, -0.2), null);
  b.restore();
}

// Kirjapino (vaakatasossa)
function htSaari2Books(b, x, baseY, s, rnd) {
  var i, y = baseY, bw, col;
  artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.18);
  for (i = 0; i < 4; i++) {
    bw = s * (0.86 - i * 0.09);
    col = HTSAARI2_COLORS[(i * 2 + Math.floor(rnd * 6)) % 6];
    var bx = x - bw / 2 + (i % 2 ? s * 0.04 : -s * 0.03);
    artRoundRect(b, bx, y - s * 0.17, bw, s * 0.17, s * 0.04, col, { lineColor: artShade(col, -0.5) });
    b.fillStyle = '#fff6e0';
    b.fillRect(bx + bw - s * 0.09, y - s * 0.13, s * 0.06, s * 0.1);
    b.fillStyle = 'rgba(255,255,255,0.55)';
    b.fillRect(bx + s * 0.1, y - s * 0.11, s * 0.05, s * 0.05);
    y -= s * 0.17;
  }
  artCircle(b, x - s * 0.06, y - s * 0.08, s * 0.08, '#ff4f5a', { hi: 0.45 });
  b.strokeStyle = '#6b4426'; b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.moveTo(x - s * 0.06, y - s * 0.15); b.lineTo(x - s * 0.04, y - s * 0.2); b.stroke();
}

// Kirjaimen muotoinen pensasaita kukkineen
function htSaari2Hedge(b, x, baseY, s, ch, flower) {
  artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.18);
  artBlob(b, x, baseY - s * 0.03, s * 0.38, s * 0.07, '#9c6b3f', { lineColor: '#5a3a1e' });
  var sz = s * 1.05, cy = baseY - s * 0.4;
  b.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  b.lineJoin = 'round';
  b.strokeStyle = '#2f7a3a'; b.lineWidth = sz * 0.2; b.strokeText(ch, x, cy);
  b.strokeStyle = '#5fbf55'; b.lineWidth = sz * 0.1; b.strokeText(ch, x, cy);
  var g = b.createLinearGradient(0, cy - sz * 0.4, 0, cy + sz * 0.4);
  g.addColorStop(0, '#8fe07a'); g.addColorStop(1, '#4fae4a');
  b.fillStyle = g; b.fillText(ch, x, cy);
  b.textBaseline = 'alphabetic';
  drawFlower(b, x - s * 0.18, cy - s * 0.22, s * 0.045, flower);
  drawFlower(b, x + s * 0.2, cy + s * 0.05, s * 0.045, flower);
}

// Tavuviitta
function htSaari2Sign(b, x, baseY, s, syl, col) {
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.18);
  artRoundRect(b, x - s * 0.04, baseY - s * 0.8, s * 0.08, s * 0.8, s * 0.03, '#a8743f', { lineColor: '#5a3a1e' });
  var y = baseY - s * 0.82, l = x - s * 0.36, r = x + s * 0.3;
  b.beginPath();
  b.moveTo(l + s * 0.05, y); b.lineTo(r, y); b.lineTo(r + s * 0.14, y + s * 0.15); b.lineTo(r, y + s * 0.3); b.lineTo(l + s * 0.05, y + s * 0.3);
  b.quadraticCurveTo(l, y + s * 0.3, l, y + s * 0.25); b.lineTo(l, y + s * 0.05); b.quadraticCurveTo(l, y, l + s * 0.05, y); b.closePath();
  artFillPath(b, col, y, y + s * 0.3, s * 0.15, { lineColor: artShade(col, -0.5) });
  htSaari2Letter(b, syl, x - s * 0.02, y + s * 0.16, s * 0.24, '#ffffff', artShade(col, -0.45));
  hubThemeTuft(b, x - s * 0.15, baseY, s, '#4fa046');
}

// Leija kirjaimineen (taustalle)
function htSaari2Kite(b, x, y, s, col, ch) {
  var i;
  b.strokeStyle = artRGBA('#7a5a8a', 0.6); b.lineWidth = 1.5;
  b.beginPath(); b.moveTo(x, y + s * 0.7);
  for (i = 1; i <= 6; i++) b.lineTo(x + Math.sin(i * 1.3) * s * 0.18, y + s * 0.7 + i * s * 0.22);
  b.stroke();
  for (i = 1; i <= 3; i++) artBlob(b, x + Math.sin(i * 2 * 1.3) * s * 0.18, y + s * 0.7 + i * 2 * s * 0.22, s * 0.08, s * 0.05, HTSAARI2_COLORS[(i + 2) % 6], { line: false });
  b.beginPath(); b.moveTo(x, y - s * 0.7); b.lineTo(x + s * 0.5, y - s * 0.05); b.lineTo(x, y + s * 0.7); b.lineTo(x - s * 0.5, y - s * 0.05); b.closePath();
  artFillPath(b, col, y - s * 0.7, y + s * 0.7, s * 0.4, { lineColor: artShade(col, -0.45) });
  htSaari2Letter(b, ch, x, y + s * 0.02, s * 0.6, '#ffffff', artShade(col, -0.4));
}

HUB_THEMES.letters = {
  sky: ['#bfe4ff', '#fff3dc'],
  ground: ['#a6dc88', '#98d17a'],
  earth: '#9c6b3f',
  path: ['#c98a52', '#fff0c8'],
  backdrop: function (b, w, h, lay) {
    var i, k, x, y, s = lay.cell, sd = htSaari2Sides(w, lay);
    hubThemeClouds(b, w, h, 6);
    hubThemeHills(b, w, h, lay, ['#d6eec0', '#b6e09a', '#98d17a'], 0.05);
    var ks = [[0.07, 0.2, 'A'], [0.92, 0.14, 'Ö'], [0.8, 0.34, 'K'], [0.2, 0.42, 'O']];
    for (i = 0; i < ks.length; i++) htSaari2Kite(b, w * ks[i][0], h * ks[i][1], s * 0.6, HTSAARI2_COLORS[i * 2 % 6], ks[i][2]);
    var by = lay.oy + lay.rows * s * 0.62;
    for (k = 0; k < 2; k++) {
      var a = k ? sd.R : sd.L, wd = a[1] - a[0];
      if (wd < s) continue;
      for (i = 0; i < 3; i++) drawTree(b, a[0] + wd * (0.15 + i * 0.35), by - s * (1.6 + (i % 2) * 0.5), s * 1.3, 0.35);
      // Iso kirjahylly: pystykirjoja selkämyksineen
      x = a[0] + wd * (k ? 0.62 : 0.38); y = by;
      for (i = 0; i < 5; i++) {
        var bh = s * (1.6 + hubHash(i, k) * 0.8), bw = s * 0.42, col = HTSAARI2_COLORS[(i + k * 3) % 6], bx = x + (i - 2.5) * bw;
        artRoundRect(b, bx, y - bh, bw, bh, s * 0.06, col, { lineColor: artShade(col, -0.5) });
        b.fillStyle = 'rgba(255,255,255,0.6)';
        b.fillRect(bx + bw * 0.15, y - bh + s * 0.15, bw * 0.7, s * 0.06);
        b.fillRect(bx + bw * 0.15, y - s * 0.2, bw * 0.7, s * 0.06);
        htSaari2Letter(b, HTSAARI2_ABC.charAt((i * 5 + k * 3) % 24), bx + bw / 2, y - bh / 2, s * 0.32, '#ffffff', artShade(col, -0.45));
      }
      // Palikkatorni ja kirjainpensaat
      var tx = a[0] + wd * (k ? 0.22 : 0.78), ty = by + s * 2.6;
      htSaari2Block(b, tx - s * 0.36, ty, s * 0.7, '#ff5f7e', 'A', -0.04);
      htSaari2Block(b, tx + s * 0.36, ty, s * 0.7, '#5fa8ff', 'B', 0.05);
      htSaari2Block(b, tx, ty - s * 0.7, s * 0.7, '#5fd36b', 'C', 0.1);
      htSaari2Hedge(b, a[0] + wd * (k ? 0.7 : 0.3), by + s * 4.4, s * 1.4, k ? 'Ö' : 'Ä', '#ff7bac');
      htSaari2Sign(b, a[0] + wd * (k ? 0.25 : 0.75), by + s * 4.7, s * 1.2, k ? 'PU' : 'KA', k ? '#c9a0ff' : '#ff9d5c');
      for (i = 0; i < 6; i++) drawFlower(b, a[0] + wd * hubHash(i, k + 7), by + s * (1.2 + hubHash(k + 7, i) * 6), s * 0.08, HTSAARI2_COLORS[(i + k) % 6]);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.55);
    if (rnd < 0.3) hubThemeTuft(b, px, py, s, '#5fae4c');
    else if (rnd < 0.45) drawFlower(b, px, py, s * 0.05, HTSAARI2_COLORS[Math.floor(rnd2 * 6)]);
    else if (rnd < 0.58) htSaari2Letter(b, HTSAARI2_ABC.charAt(Math.floor(rnd2 * 24)), px, py, s * 0.26, 'rgba(255,255,255,0.55)', null);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var ch = HTSAARI2_ABC.charAt(Math.floor(rnd2 * 24));
    if (rnd < 0.28) {
      artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.18);
      var n = rnd2 < 0.5 ? 2 : 3, cols = ['#ff5f7e', '#5fa8ff', '#ffc93e', '#5fd36b', '#c9a0ff'], i;
      for (i = 0; i < n; i++) {
        htSaari2Block(b, x + (i === 0 ? -s * 0.22 : i === 1 ? s * 0.22 : 0), baseY - (i === 2 ? s * 0.43 : 0), s * 0.43, cols[(i + Math.floor(rnd2 * 5)) % 5], HTSAARI2_ABC.charAt(Math.floor(rnd2 * 20) + i), (i - 1) * 0.06);
      }
    } else if (rnd < 0.5) htSaari2Books(b, x, baseY, s, rnd2);
    else if (rnd < 0.74) htSaari2Hedge(b, x, baseY, s * 1.0, 'AUVTHMKEÄÖ'.charAt(Math.floor(rnd2 * 10)), HTSAARI2_COLORS[Math.floor(rnd * 60) % 6]);
    else if (rnd < 0.86) htSaari2Sign(b, x, baseY, s, HTSAARI2_SYLL[Math.floor(rnd2 * HTSAARI2_SYLL.length)], HTSAARI2_COLORS[Math.floor(rnd2 * 60) % 6]);
    else drawTree(b, x, baseY, s * (0.75 + rnd2 * 0.2), 0, { leaf: '#7fcf5f' });
  }
};

// ---------- Tivolisaari: telttoja, palloja ja karuselli ----------
// Raidallinen teltta tarratyylillä
function htSaari2Tent(b, x, baseY, s, col) {
  var i, line = artShade(col, -0.45), wt = baseY - s * 0.42, hw = s * 0.36;
  artShadow(b, x, baseY, s * 0.46, s * 0.08, 0.2);
  b.beginPath(); b.rect(x - hw, wt, hw * 2, baseY - wt);
  artFillPath(b, col, wt, baseY, s * 0.3, { lineColor: line });
  b.save(); b.beginPath(); b.rect(x - hw, wt, hw * 2, baseY - wt); b.clip();
  b.fillStyle = 'rgba(255,248,235,0.9)';
  for (i = 0; i < 3; i++) b.fillRect(x - hw + s * 0.06 + i * s * 0.24, wt, s * 0.12, baseY - wt);
  b.restore();
  b.beginPath(); b.moveTo(x - s * 0.13, baseY); b.lineTo(x, wt + s * 0.1); b.lineTo(x + s * 0.13, baseY); b.closePath();
  b.fillStyle = artShade(col, -0.55); b.fill();
  htSaari2Roof(b, x, wt, s * 0.46, s * 0.5, col, line);
}
// Teltan katto raitoineen ja kaarevine helmoineen
function htSaari2Roof(b, x, by, hw, hgt, col, line) {
  var i, n = 6, top = by - hgt;
  line = line || artShade(col, -0.45);
  var path = function () {
    b.beginPath();
    b.moveTo(x - hw, by);
    b.quadraticCurveTo(x - hw * 0.35, by - hgt * 0.45, x, top);
    b.quadraticCurveTo(x + hw * 0.35, by - hgt * 0.45, x + hw, by);
    for (i = n; i > 0; i--) b.arc(x - hw + (i - 0.5) * hw * 2 / n, by, hw / n, 0, Math.PI);
    b.closePath();
  };
  path();
  artFillPath(b, col, top, by, hw * 0.6, { lineColor: line });
  b.save(); path(); b.clip();
  b.fillStyle = 'rgba(255,248,235,0.9)';
  for (i = 0; i < n; i += 2) {
    b.beginPath(); b.moveTo(x, top); b.lineTo(x - hw * 1.1 + i * hw * 2.2 / n, by + hw * 0.4); b.lineTo(x - hw * 1.1 + (i + 1) * hw * 2.2 / n, by + hw * 0.4); b.closePath(); b.fill();
  }
  b.restore();
  b.strokeStyle = line; b.lineWidth = Math.max(1.2, hw * 0.05);
  b.beginPath(); b.moveTo(x, top); b.lineTo(x, top - hgt * 0.3); b.stroke();
  b.beginPath(); b.moveTo(x, top - hgt * 0.3); b.lineTo(x + hgt * 0.32, top - hgt * 0.22); b.lineTo(x, top - hgt * 0.12); b.closePath();
  artFillPath(b, '#ffd24f', top - hgt * 0.3, top - hgt * 0.12, hgt * 0.1, { lineColor: '#b08a2a' });
}

// Ilmapallo narulla
function htSaari2Balloon(b, x, y, r, col, ax, ay) {
  b.strokeStyle = 'rgba(110,80,110,0.6)'; b.lineWidth = Math.max(1, r * 0.08);
  b.beginPath(); b.moveTo(x, y + r * 1.15); b.quadraticCurveTo(x + r * 0.4, (y + ay) / 2, ax, ay); b.stroke();
  b.beginPath(); b.moveTo(x - r * 0.15, y + r * 1.25); b.lineTo(x + r * 0.15, y + r * 1.25); b.lineTo(x, y + r * 1.05); b.closePath();
  b.fillStyle = artShade(col, -0.3); b.fill();
  artBlob(b, x, y, r, r * 1.18, col, { hi: 0.5 });
}

// Viirinauha kahden pisteen välillä
function htSaari2Bunting(b, x0, y0, x1, y1, sag, n, fs) {
  var i, t, px, py, mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  b.strokeStyle = '#8a5a7a'; b.lineWidth = Math.max(1, fs * 0.08);
  b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo(mx, my, x1, y1); b.stroke();
  for (i = 0; i < n; i++) {
    t = (i + 0.5) / n;
    px = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1;
    py = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1;
    b.beginPath(); b.moveTo(px - fs * 0.5, py); b.lineTo(px + fs * 0.5, py); b.lineTo(px, py + fs * 1.1); b.closePath();
    var col = HTSAARI2_COLORS[i % 6];
    artFillPath(b, col, py, py + fs * 1.1, fs * 0.5, { lineColor: artShade(col, -0.45), line: Math.max(1, fs * 0.08) });
  }
}

// Maailmanpyörä (taustalle)
function htSaari2Wheel(b, x, y, r) {
  var i, a, col;
  b.strokeStyle = '#6a4a8a'; b.lineWidth = Math.max(3, r * 0.06); b.lineCap = 'round';
  b.beginPath(); b.moveTo(x - r * 0.7, y + r * 1.25); b.lineTo(x, y); b.lineTo(x + r * 0.7, y + r * 1.25); b.stroke();
  b.strokeStyle = '#b05a9a'; b.lineWidth = Math.max(4, r * 0.07);
  b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#ff9ec6'; b.lineWidth = Math.max(2, r * 0.035);
  b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#ffffff';
  b.beginPath(); b.arc(x, y, r * 0.86, 0, Math.PI * 2); b.stroke();
  b.lineWidth = Math.max(1, r * 0.018);
  b.strokeStyle = 'rgba(176,90,154,0.6)';
  for (i = 0; i < 8; i++) { a = i * Math.PI / 4; b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); b.stroke(); }
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4 + 0.2; col = HTSAARI2_COLORS[i % 6];
    var gx = x + Math.cos(a) * r, gy = y + Math.sin(a) * r;
    artRoundRect(b, gx - r * 0.12, gy, r * 0.24, r * 0.2, r * 0.06, col, { lineColor: artShade(col, -0.45) });
  }
  artCircle(b, x, y, r * 0.1, '#ffd24f', { lineColor: '#b08a2a' });
}

HUB_THEMES.fair = {
  sky: ['#ffd8ea', '#fff4d6'],
  ground: ['#a6dc86', '#97d277'],
  earth: '#a8744a',
  path: ['#d0607a', '#fff0d0'],
  backdrop: function (b, w, h, lay) {
    var i, k, s = lay.cell, sd = htSaari2Sides(w, lay), hz = lay.oy + lay.rows * s * 0.3;
    hubThemeClouds(b, w, h, 6);
    // Maailmanpyörä oikealla, karuselli vasemmalla
    var wr = Math.max(s * 1.5, Math.min((sd.R[1] - sd.R[0]) * 0.4, h * 0.2));
    if (sd.R[1] - sd.R[0] > s) htSaari2Wheel(b, sd.R[0] + (sd.R[1] - sd.R[0]) * 0.55, hz - wr * 0.5, wr);
    hubThemeHills(b, w, h, lay, ['#d8f0c0', '#bde6a2', '#a6dc86'], 0.04);
    var by = lay.oy + lay.rows * s * 0.62;
    for (k = 0; k < 2; k++) {
      var a = k ? sd.R : sd.L, wd = a[1] - a[0];
      if (wd < s) continue;
      if (!k) drawCarousel(b, a[0] + wd * 0.5, hz + h * 0.1, s * 1.4, '#ffe6f0');
      drawFairTent(b, a[0] + wd * (k ? 0.25 : 0.2), hz + h * 0.16, s * 1.1, k ? '#7a3cb8' : '#c8323c', '#ffe6f0');
      htSaari2Tent(b, a[0] + wd * (k ? 0.7 : 0.3), by + s * 1.4, s * 2.2, k ? '#5fa8ff' : '#ff5f7e');
      htSaari2Tent(b, a[0] + wd * (k ? 0.3 : 0.75), by + s * 4.0, s * 1.8, k ? '#ff9d5c' : '#c9a0ff');
      // Ilmapalloryppäät
      var bx = a[0] + wd * (k ? 0.75 : 0.25), byy = by + s * 6.2;
      for (i = 0; i < 4; i++) htSaari2Balloon(b, bx + (i - 1.5) * s * 0.42, byy - s * (1.4 + (i % 2) * 0.35), s * 0.26, HTSAARI2_COLORS[(i + k * 2) % 6], bx, byy);
      artRoundRect(b, bx - s * 0.12, byy - s * 0.05, s * 0.24, s * 0.16, s * 0.04, '#a8743f', { lineColor: '#5a3a1e' });
      for (i = 0; i < 6; i++) drawFlower(b, a[0] + wd * hubHash(i, k + 2), by + s * (2.4 + hubHash(k + 2, i) * 5), s * 0.08, HTSAARI2_COLORS[(i + k) % 6]);
    }
    // Viirinauhat yläkulmissa ja leijuvat pallot
    htSaari2Bunting(b, -s * 0.2, h * 0.02, w * 0.3, h * 0.03, h * 0.07, 9, s * 0.26);
    htSaari2Bunting(b, w * 0.7, h * 0.03, w + s * 0.2, h * 0.02, h * 0.07, 9, s * 0.26);
    for (i = 0; i < 6; i++) {
      var fx = w * (0.04 + hubHash(i, 11) * 0.92), fy = h * (0.18 + hubHash(11, i) * 0.2);
      if (fx > lay.ox && fx < lay.ox + lay.cols * s) continue;
      htSaari2Balloon(b, fx, fy, s * 0.22, HTSAARI2_COLORS[i % 6], fx - s * 0.1, fy + s * 0.9);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.55), i;
    if (rnd < 0.3) {
      for (i = 0; i < 3; i++) {
        b.fillStyle = HTSAARI2_COLORS[(i + Math.floor(rnd2 * 6)) % 6];
        b.save(); b.translate(px + (i - 1) * s * 0.1, py + Math.sin(i * 2.3) * s * 0.06); b.rotate(i + rnd2 * 3);
        b.fillRect(-s * 0.025, -s * 0.012, s * 0.05, s * 0.024); b.restore();
      }
    } else if (rnd < 0.5) hubThemeTuft(b, px, py, s, '#5fae4c');
    else if (rnd < 0.6) drawFlower(b, px, py, s * 0.05, HTSAARI2_COLORS[Math.floor(rnd2 * 6)]);
    else if (rnd < 0.66) {
      artRoundRect(b, px - s * 0.08, py - s * 0.05, s * 0.16, s * 0.1, s * 0.02, '#ffd24f', { lineColor: '#b08a2a', line: 1 });
      b.fillStyle = '#b08a2a'; b.beginPath(); b.arc(px, py, s * 0.02, 0, Math.PI * 2); b.fill();
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var i;
    if (rnd < 0.32) htSaari2Tent(b, x, baseY, s, ['#ff5f7e', '#5fa8ff', '#c9a0ff', '#ff9d5c'][Math.floor(rnd2 * 4)]);
    else if (rnd < 0.52) {
      artShadow(b, x, baseY, s * 0.25, s * 0.05, 0.18);
      for (i = 0; i < 3; i++) htSaari2Balloon(b, x + (i - 1) * s * 0.2, baseY - s * (0.92 + (i % 2) * 0.22), s * 0.13, HTSAARI2_COLORS[(i * 2 + Math.floor(rnd2 * 6)) % 6], x, baseY - s * 0.12);
      artRoundRect(b, x - s * 0.07, baseY - s * 0.14, s * 0.14, s * 0.14, s * 0.04, '#a8743f', { lineColor: '#5a3a1e' });
    } else if (rnd < 0.72) {
      // Jäätelökärry päivänvarjoineen
      artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.2);
      b.strokeStyle = '#8a8a9a'; b.lineWidth = Math.max(1.5, s * 0.03);
      b.beginPath(); b.moveTo(x + s * 0.05, baseY - s * 0.4); b.lineTo(x + s * 0.05, baseY - s * 1.0); b.stroke();
      artRoundRect(b, x - s * 0.36, baseY - s * 0.44, s * 0.72, s * 0.32, s * 0.06, '#7fd4ff', { lineColor: '#3a7aa8' });
      b.fillStyle = 'rgba(255,255,255,0.75)'; b.fillRect(x - s * 0.36, baseY - s * 0.33, s * 0.72, s * 0.07);
      artCircle(b, x - s * 0.2, baseY - s * 0.1, s * 0.08, '#5a5a6a', { lineColor: '#2a2a3a' });
      artCircle(b, x + s * 0.2, baseY - s * 0.1, s * 0.08, '#5a5a6a', { lineColor: '#2a2a3a' });
      b.beginPath(); b.moveTo(x - s * 0.24, baseY - s * 0.6); b.lineTo(x - s * 0.08, baseY - s * 0.6); b.lineTo(x - s * 0.16, baseY - s * 0.43); b.closePath();
      artFillPath(b, '#f2b46a', baseY - s * 0.6, baseY - s * 0.43, s * 0.08, { lineColor: '#9a6430' });
      artCircle(b, x - s * 0.16, baseY - s * 0.64, s * 0.08, rnd2 < 0.5 ? '#ff9ec6' : '#fff3c4', { lineColor: '#b0577a', hi: 0.4 });
      htSaari2Roof(b, x + s * 0.05, baseY - s * 0.9, s * 0.42, s * 0.24, rnd2 < 0.5 ? '#ff5f7e' : '#5fd36b', null);
    } else if (rnd < 0.88) {
      // Viirinauha kahden salon välissä
      artShadow(b, x, baseY, s * 0.46, s * 0.06, 0.16);
      for (i = -1; i <= 1; i += 2) {
        artRoundRect(b, x + i * s * 0.42 - s * 0.03, baseY - s * 0.95, s * 0.06, s * 0.95, s * 0.02, '#fff6e8', { lineColor: '#8a5a7a' });
        artCircle(b, x + i * s * 0.42, baseY - s * 0.97, s * 0.05, '#ffd24f', { lineColor: '#b08a2a' });
      }
      htSaari2Bunting(b, x - s * 0.42, baseY - s * 0.9, x + s * 0.42, baseY - s * 0.9, s * 0.25, 5, s * 0.12);
      hubThemeTuft(b, x - s * 0.1, baseY, s, '#5fae4c');
      drawFlower(b, x + s * 0.12, baseY - s * 0.06, s * 0.05, '#ff7bac');
    } else drawTree(b, x, baseY, s * (0.75 + rnd2 * 0.2), 0, { leaf: '#7fcf5f' });
  },
  // Kentän sirkusteltta: oviaukossa kentän kuva
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#ff5f7e', line = artShade(col, -0.45), base = y + s * 0.34, wt = y - s * 0.46, hw = s * 0.44, i;
    artShadow(c, x, base + s * 0.02, s * 0.52, s * 0.1, 0.22);
    c.beginPath(); c.rect(x - hw, wt, hw * 2, base - wt);
    artFillPath(c, col, wt, base, s * 0.3, { lineColor: line });
    c.save(); c.beginPath(); c.rect(x - hw, wt, hw * 2, base - wt); c.clip();
    c.fillStyle = 'rgba(255,248,235,0.85)';
    for (i = 0; i < 4; i++) c.fillRect(x - hw + s * 0.05 + i * s * 0.24, wt, s * 0.12, base - wt);
    c.restore();
    // Oviaukko
    c.beginPath();
    c.moveTo(x - s * 0.31, base); c.lineTo(x - s * 0.31, y - s * 0.1); c.arc(x, y - s * 0.1, s * 0.31, Math.PI, 0); c.lineTo(x + s * 0.31, base); c.closePath();
    var g = c.createLinearGradient(0, y - s * 0.42, 0, base);
    g.addColorStop(0, st.cleared ? '#fff3c4' : '#fffaf0');
    g.addColorStop(1, st.cleared ? '#ffd56a' : '#ffe9d6');
    c.fillStyle = g; c.fill();
    c.strokeStyle = line; c.lineWidth = Math.max(1.2, s * 0.03); c.stroke();
    // Sivuun sidotut verhot
    for (i = -1; i <= 1; i += 2) {
      c.beginPath();
      c.moveTo(x + i * s * 0.31, y - s * 0.1 - s * 0.2); c.lineTo(x + i * s * 0.31, base);
      c.quadraticCurveTo(x + i * s * 0.26, y + s * 0.05, x + i * s * 0.12, y - s * 0.36);
      c.closePath();
      artFillPath(c, '#ffd24f', y - s * 0.4, base, s * 0.1, { lineColor: '#b08a2a' });
    }
    htSaari2Roof(c, x, wt, s * 0.54, s * 0.4, col, line);
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};
