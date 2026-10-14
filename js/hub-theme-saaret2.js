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

// ---------- Tökkäysyllätykset (paper, mine, mountain, letters, fair) ----------
// Jokainen seinäkoriste ja maiseman isot kohteet tekevät tökättäessä oman
// pikku temppunsa; joka 3. tökkäys on isompi yllätys. Tehosteet ovat taulussa
// htSaari2PokeFx[nimi](c, x, baseY, s, k, big, o) ja äänet htSaari2PokeSnd[nimi](big, o);
// samat tehosteet palvelevat sekä koristeita (pokeDraw) että maisemaa (spotDraw).

function htSaari2PokeSeg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
function htSaari2PokeTune(notes, step, type, vol, len) {
  for (var i = 0; i < notes.length; i++) if (notes[i]) playNote(notes[i], i * step, len || step * 1.4, type || 'triangle', vol || 0.22);
}

// Väriliitusydän piirtyy viiva kerrallaan (p = 0..1 valmiina)
function htSaari2PokeHeart(c, x, y, r, p, col) {
  var i, t, n = Math.max(2, Math.round(40 * p)), px, py;
  if (p <= 0) return;
  c.strokeStyle = col; c.lineWidth = Math.max(2, r * 0.16); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  for (i = 0; i <= n; i++) {
    t = i / 40 * Math.PI * 2;
    px = x + Math.pow(Math.sin(t), 3) * r;
    py = y - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * r;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.stroke();
  if (p >= 1) { c.closePath(); c.fillStyle = artRGBA(col, 0.4); c.fill(); }
}
// Tähti piirtyy kärki kerrallaan
function htSaari2PokeStarLine(c, x, y, r, p, col) {
  var i, a, n = p * 10, pts = [];
  if (p <= 0) return;
  for (i = 0; i <= 10; i++) {
    a = i / 10 * Math.PI * 2 - Math.PI / 2;
    pts.push([x + Math.cos(a) * (i % 2 ? r * 0.45 : r), y + Math.sin(a) * (i % 2 ? r * 0.45 : r)]);
  }
  c.strokeStyle = col; c.lineWidth = Math.max(2, r * 0.13); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (i = 1; i <= Math.floor(n); i++) c.lineTo(pts[i][0], pts[i][1]);
  if (n < 10) {
    var f = n - Math.floor(n), q = pts[Math.floor(n)], q2 = pts[Math.floor(n) + 1];
    c.lineTo(q[0] + (q2[0] - q[0]) * f, q[1] + (q2[1] - q[1]) * f);
  }
  c.stroke();
  if (p >= 1) { c.closePath(); c.fillStyle = artRGBA(col, 0.45); c.fill(); }
}
// Konfettisuihku pisteestä (k = 0..1)
function htSaari2PokeConfetti(c, x, y, s, k, cnt, seed, power) {
  var i, a, sp, px, py, t = k * 1.6;
  c.globalAlpha = Math.min(1, (1 - k) * 4);
  for (i = 0; i < cnt; i++) {
    a = -Math.PI / 2 + (hubHash(i, seed) - 0.5) * 2.4;
    sp = s * (power || 1.6) * (0.5 + hubHash(seed, i) * 0.6);
    px = x + Math.cos(a) * sp * t + Math.sin(t * 6 + i) * s * 0.05;
    py = y + Math.sin(a) * sp * t + s * 1.4 * t * t;
    c.save(); c.translate(px, py); c.rotate(t * 8 + i);
    c.fillStyle = HTSAARI2_COLORS[i % 6];
    c.fillRect(-s * 0.04, -s * 0.02, s * 0.08, s * 0.04);
    c.restore();
  }
  c.globalAlpha = 1;
}
// Nuotti: pää, varsi ja lippu
function htSaari2PokeNote(c, x, y, sz, col) {
  c.save(); c.translate(x, y); c.rotate(-0.25);
  artBlob(c, 0, 0, sz * 0.32, sz * 0.24, col, { lineColor: artShade(col, -0.5), line: 1 });
  c.restore();
  c.strokeStyle = artShade(col, -0.5); c.lineWidth = Math.max(1.5, sz * 0.1); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + sz * 0.28, y - sz * 0.05); c.lineTo(x + sz * 0.28, y - sz * 0.9);
  c.quadraticCurveTo(x + sz * 0.55, y - sz * 0.7, x + sz * 0.6, y - sz * 0.45); c.stroke();
}
function htSaari2PokeNotes(c, x, y, s, k, cnt, col) {
  for (var i = 0; i < cnt; i++) {
    var t = htSaari2PokeSeg(k, i * 0.12, 0.6 + i * 0.12);
    if (t <= 0 || t >= 1) continue;
    c.globalAlpha = Math.sin(t * Math.PI);
    htSaari2PokeNote(c, x + Math.sin(t * 6 + i * 2) * s * 0.2 + (i - (cnt - 1) / 2) * s * 0.15, y - t * s * 0.9, s * 0.22, col || HTSAARI2_COLORS[(i * 2) % 6]);
  }
  c.globalAlpha = 1;
}
// Puhekupla tekstillä, sc = ponnahdusskaala
function htSaari2PokeBubble(c, x, y, text, sz, col, sc) {
  if (sc <= 0) return;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
  var w = c.measureText(text).width + sz * 0.8, h = sz * 1.35;
  c.beginPath();
  c.moveTo(-sz * 0.2, h / 2 - 2); c.lineTo(-sz * 0.45, h / 2 + sz * 0.45); c.lineTo(sz * 0.15, h / 2 - 2); c.closePath();
  c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = artShade(col, -0.4); c.lineWidth = Math.max(1.5, sz * 0.07); c.stroke();
  artRoundRect(c, -w / 2, -h / 2, w, h, h * 0.4, '#ffffff', { lineColor: artShade(col, -0.4) });
  htSaari2Letter(c, text, 0, sz * 0.04, sz, col, null);
  c.restore();
}
// Perhonen (flap -1..1 siipien asento)
function htSaari2PokeButterfly(c, x, y, r, col, flap) {
  var f = 0.25 + Math.abs(flap) * 0.75;
  artBlob(c, x - r * 0.55 * f, y - r * 0.2, r * 0.6 * f, r * 0.55, col, { lineColor: artShade(col, -0.45), line: 1 });
  artBlob(c, x + r * 0.55 * f, y - r * 0.2, r * 0.6 * f, r * 0.55, col, { lineColor: artShade(col, -0.45), line: 1 });
  artBlob(c, x - r * 0.4 * f, y + r * 0.35, r * 0.4 * f, r * 0.35, artShade(col, 0.2), { line: false });
  artBlob(c, x + r * 0.4 * f, y + r * 0.35, r * 0.4 * f, r * 0.35, artShade(col, 0.2), { line: false });
  artBlob(c, x, y, r * 0.12, r * 0.6, '#4a3a4a', { line: false });
}
// Tähtiräjähdys (säteet + pikkutähti)
function htSaari2PokeBurst(c, x, y, r, k, col) {
  var i, a, d = r * easeOutCubic(k);
  c.globalAlpha = 1 - k;
  c.strokeStyle = col; c.lineWidth = Math.max(2, r * 0.1); c.lineCap = 'round';
  for (i = 0; i < 8; i++) {
    a = i / 8 * Math.PI * 2;
    c.beginPath(); c.moveTo(x + Math.cos(a) * d * 0.5, y + Math.sin(a) * d * 0.5); c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); c.stroke();
  }
  drawStar(c, x, y, r * 0.35 * (1 - k * 0.5), k * 3, 0.5);
  c.globalAlpha = 1;
}
// Kotka lentämässä (flap = siiven asento -1..1, dir = suunta)
function htSaari2PokeEagle(c, x, y, r, flap, dir) {
  var wy = flap * r * 0.7;
  c.save(); c.translate(x, y); c.scale(dir || 1, 1);
  for (var i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(-r * 0.1, 0); c.quadraticCurveTo(i * r * 0.2 - r * 0.1, -wy - r * 0.2, i * r * 1.1, -wy);
    c.quadraticCurveTo(i * r * 0.5, r * 0.15, -r * 0.1, r * 0.15); c.closePath();
    artFillPath(c, '#8a5a34', -Math.abs(wy) - r * 0.3, Math.abs(wy) + r * 0.2, r * 0.3, { lineColor: '#4a2a14', line: Math.max(1, r * 0.06) });
  }
  artBlob(c, 0, r * 0.05, r * 0.45, r * 0.22, '#8a5a34', { lineColor: '#4a2a14', line: Math.max(1, r * 0.06) });
  artCircle(c, r * 0.42, -r * 0.08, r * 0.2, '#ffffff', { lineColor: '#7a7a8a', line: 1 });
  c.fillStyle = '#2a2020'; c.beginPath(); c.arc(r * 0.47, -r * 0.12, r * 0.045, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(r * 0.58, -r * 0.1); c.lineTo(r * 0.75, -r * 0.04); c.lineTo(r * 0.58, 0); c.closePath();
  c.fillStyle = '#ffb83e'; c.fill();
  c.restore();
}
// Lepakko (söpö, suurisilmäinen)
function htSaari2PokeBat(c, x, y, r, flap) {
  var wy = flap * r * 0.6, i;
  for (i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + i * r * 0.6, y - r * 0.5 - wy, x + i * r * 1.3, y - wy);
    c.quadraticCurveTo(x + i * r * 1.0, y + r * 0.1, x + i * r * 0.8, y + r * 0.25 - wy * 0.3);
    c.quadraticCurveTo(x + i * r * 0.5, y + r * 0.05, x, y + r * 0.3); c.closePath();
    artFillPath(c, '#6a4a8a', y - r * 1.1, y + r * 0.6, r * 0.4, { lineColor: '#2a1a3a', line: Math.max(1, r * 0.06) });
  }
  artCircle(c, x, y, r * 0.38, '#7a5a9a', { lineColor: '#2a1a3a', line: Math.max(1, r * 0.06) });
  artEye(c, x - r * 0.13, y - r * 0.04, r * 0.11);
  artEye(c, x + r * 0.13, y - r * 0.04, r * 0.11);
}
// Lumijänis (y = vatsan kohta)
function htSaari2PokeHare(c, x, y, r) {
  artBlob(c, x - r * 0.22, y - r * 1.15, r * 0.15, r * 0.45, '#ffffff', { lineColor: '#8a96b0', rot: -0.2 });
  artBlob(c, x + r * 0.22, y - r * 1.15, r * 0.15, r * 0.45, '#ffffff', { lineColor: '#8a96b0', rot: 0.2 });
  artBlob(c, x - r * 0.22, y - r * 1.1, r * 0.06, r * 0.28, '#ffc0d0', { line: false, rot: -0.2 });
  artBlob(c, x + r * 0.22, y - r * 1.1, r * 0.06, r * 0.28, '#ffc0d0', { line: false, rot: 0.2 });
  artBlob(c, x, y - r * 0.15, r * 0.6, r * 0.55, '#ffffff', { lineColor: '#8a96b0' });
  artEye(c, x - r * 0.2, y - r * 0.25, r * 0.1);
  artEye(c, x + r * 0.2, y - r * 0.25, r * 0.1);
  artCircle(c, x, y - r * 0.08, r * 0.06, '#ff9ec6', { line: false });
  artBlush(c, x - r * 0.35, y - r * 0.02, r * 0.08);
  artBlush(c, x + r * 0.35, y - r * 0.02, r * 0.08);
}
// Jäätelötötterö (y = alimman pallon kohta)
function htSaari2PokeCone(c, x, y, s, scoops, cherry) {
  var i, cols = ['#ff9ec6', '#fff3c4', '#9fffd8', '#b07a54', '#c9a0ff'];
  c.beginPath(); c.moveTo(x - s * 0.13, y); c.lineTo(x + s * 0.13, y); c.lineTo(x, y + s * 0.34); c.closePath();
  artFillPath(c, '#f2b46a', y, y + s * 0.34, s * 0.1, { lineColor: '#9a6430' });
  for (i = 0; i < scoops; i++) artCircle(c, x + (i % 2 ? s * 0.02 : -s * 0.02), y - s * 0.03 - i * s * 0.15, s * 0.12, cols[i % 5], { lineColor: artShade(cols[i % 5], -0.45), hi: 0.4 });
  if (cherry) artCircle(c, x, y - s * 0.03 - scoops * s * 0.15 + s * 0.02, s * 0.06, '#ff3f4f', { hi: 0.5 });
}
// Karkki käärepaperissa
function htSaari2PokeCandy(c, x, y, r, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = artShade(col, 0.25);
  for (var i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(i * r * 0.6, 0); c.lineTo(i * r * 1.3, -r * 0.5); c.lineTo(i * r * 1.3, r * 0.5); c.closePath(); c.fill();
  }
  artCircle(c, 0, 0, r * 0.65, col, { lineColor: artShade(col, -0.45), hi: 0.5, line: 1 });
  c.restore();
}
// Piste viirinauhan kaarella (sama kaava kuin htSaari2Bunting)
function htSaari2PokeBuntPt(x0, y0, x1, y1, sag, t) {
  var mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  return [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1];
}
// Viirinauhan valot vilkkuvat kiertäen (o: x0, y0, x1, y1, sag, n)
function htSaari2PokeLights(c, o, k, fs) {
  var i, p, on;
  c.globalAlpha = Math.min(1, (1 - k) * 4);
  for (i = 0; i < o.n; i++) {
    p = htSaari2PokeBuntPt(o.x0, o.y0, o.x1, o.y1, o.sag, (i + 0.5) / o.n);
    on = (Math.floor(k * 16) + i) % 3 === 0;
    artGlow(c, p[0], p[1] + fs * 0.4, fs * (on ? 1.6 : 0.8), HTSAARI2_COLORS[i % 6], on ? 0.85 : 0.35);
    if (on) artCircle(c, p[0], p[1] + fs * 0.4, fs * 0.28, '#fffbe0', { line: false });
  }
  c.globalAlpha = 1;
}
// Ilotulite: raketti nousee ja räjähtää värikukaksi
function htSaari2PokeFirework(c, x, y, hgt, k, col) {
  var up = htSaari2PokeSeg(k, 0, 0.35), ex = htSaari2PokeSeg(k, 0.35, 1), ty = y - hgt * easeOutCubic(up), i, a;
  if (k <= 0) return;
  if (ex <= 0) {
    artCircle(c, x, ty, hgt * 0.04, '#fff3a0', { line: false });
    c.strokeStyle = 'rgba(255,220,140,0.7)'; c.lineWidth = Math.max(1.5, hgt * 0.02);
    c.beginPath(); c.moveTo(x, ty); c.lineTo(x, ty + hgt * 0.15); c.stroke();
    return;
  }
  c.globalAlpha = 1 - ex;
  for (i = 0; i < 12; i++) {
    a = i / 12 * Math.PI * 2;
    var d = hgt * 0.35 * easeOutCubic(ex);
    artCircle(c, x + Math.cos(a) * d, ty + Math.sin(a) * d + ex * ex * hgt * 0.1, hgt * 0.035, HTSAARI2_COLORS[(i + (col || 0)) % 6], { line: false });
  }
  c.globalAlpha = 1;
}
// Kirjainpalikan kääntö: palauttaa { sx, show, lift } (ki = 0..1)
function htSaari2PokeFlip(ki, ch, nw, s) {
  var f1 = htSaari2PokeSeg(ki, 0, 0.22), f2 = htSaari2PokeSeg(ki, 0.85, 1);
  var r = { sx: Math.abs(Math.cos(f1 * Math.PI)), show: f1 > 0.5 ? nw : ch, lift: Math.sin(f1 * Math.PI) * s * 0.25 + Math.sin(f2 * Math.PI) * s * 0.12 };
  if (f2 > 0) { r.sx = Math.abs(Math.cos(f2 * Math.PI)); r.show = f2 > 0.5 ? ch : nw; }
  r.sx = Math.max(0.05, r.sx);
  return r;
}

var HTSAARI2_POKE_WORDS = { KA: 'KAKKU', LE: 'LELU', PU: 'PUPU', MA: 'MANSIKKA', SO: 'SOKERI', TI: 'TIIKERI', VE: 'VENE', NO: 'NOITA', LU: 'LUMI', HE: 'HEPPA' };

var htSaari2PokeFx = {
  // --- Paperi ---
  // Väriliitupuu piirtää sydämen (iso: kolme sydäntä, omenapuusta putoaa omena)
  tree: function (c, x, baseY, s, k, big, o) {
    var S = o.S, cy = baseY - S * 0.95, p = htSaari2PokeSeg(k, 0, 0.45), up = easeOutCubic(htSaari2PokeSeg(k, 0.45, 1));
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    htSaari2PokeHeart(c, x, cy - S * 0.55 - up * S * 0.35, S * (big ? 0.26 : 0.2), p, '#ff5f7e');
    if (big) {
      htSaari2PokeHeart(c, x - S * 0.45, cy - S * 0.35 - up * S * 0.3, S * 0.13, htSaari2PokeSeg(k, 0.15, 0.5), '#c9a0ff');
      htSaari2PokeHeart(c, x + S * 0.45, cy - S * 0.35 - up * S * 0.3, S * 0.13, htSaari2PokeSeg(k, 0.25, 0.6), '#ffae3c');
      if (o.apples) {
        var f = htSaari2PokeSeg(k, 0.1, 0.5), ay = cy + S * 0.12 + (baseY - S * 0.06 - cy - S * 0.12) * f * f;
        var bo = htSaari2PokeSeg(k, 0.5, 0.9);
        if (f >= 1) ay -= Math.abs(Math.sin(bo * Math.PI * 2)) * S * 0.12 * (1 - bo);
        artCircle(c, x + S * 0.02 + f * S * 0.3 + bo * S * 0.15, ay, S * 0.065, '#ff4f5a', { hi: 0.45 });
      }
    }
    c.globalAlpha = 1;
  },
  // Kynä piirtää tähden (iso: tähdestä tulee kultatähti joka lentää)
  pencil: function (c, x, baseY, s, k, big, o) {
    var S = o.S, sx = x - (o.ang > 0 ? 1 : -1) * S * 0.42, sy = baseY - S * 0.55, p = htSaari2PokeSeg(k, 0, 0.5);
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    if (big && k > 0.5) {
      var t = htSaari2PokeSeg(k, 0.5, 1);
      drawStar(c, sx, sy - t * S * 0.6, S * (0.2 + t * 0.06), t * 5, 1);
    } else htSaari2PokeStarLine(c, sx, sy, S * 0.2, p, o.col);
    c.globalAlpha = 1;
  },
  // Mustepullo roiskahtaa (iso: sateenkaariroiskeet ja mustesydän)
  ink: function (c, x, baseY, s, k, big, o) {
    var kk = s * 0.28, mx = x, my = baseY - kk * 2.15, i, n = big ? 7 : 4, t = htSaari2PokeSeg(k, 0, 0.45);
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.75, 1);
    for (i = 0; i < n; i++) {
      var lx = x + (i - (n - 1) / 2) * s * (big ? 0.2 : 0.24) + (i % 2 ? s * 0.04 : 0), ly = baseY + s * 0.06 + (i % 3) * s * 0.03;
      var col = big ? HTSAARI2_COLORS[i % 6] : '#8a4dff';
      if (t < 1) htSaari2Drop(c, mx + (lx - mx) * t, my + (ly - my) * t - Math.sin(t * Math.PI) * s * 0.5, s * 0.035, col);
      else artBlob(c, lx, ly, s * 0.07 * (1 + htSaari2PokeSeg(k, 0.45, 0.6) * 0.4), s * 0.03, col, { line: false });
    }
    if (big && k > 0.45) drawHeartShape(c, x, baseY - s * 0.15 - htSaari2PokeSeg(k, 0.45, 1) * s * 0.5, s * 0.16, true);
    c.globalAlpha = 1;
  },
  // Sadepilvi sataa ja kukka kasvaa (iso: sateenkaari)
  rain: function (c, x, baseY, s, k, big, o) {
    var cy = baseY - s * 1.05, i, top = cy + s * 0.2, len = baseY - top;
    if (k < 0.75) for (i = 0; i < 10; i++) {
      var dy = ((k * 2.4 + hubHash(i, 3)) % 1) * len;
      htSaari2Drop(c, x + (hubHash(3, i) - 0.5) * s * 0.55, top + dy, s * 0.03, '#5fb0ff');
    }
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    var g = easeOutCubic(htSaari2PokeSeg(k, 0.2, 0.7));
    c.strokeStyle = '#4fa046'; c.lineWidth = Math.max(1.5, s * 0.025); c.lineCap = 'round';
    if (!o.sky) {
    c.beginPath(); c.moveTo(x + s * 0.24, baseY - s * 0.05); c.lineTo(x + s * 0.24, baseY - s * 0.14 - g * s * 0.28); c.stroke();
    drawFlower(c, x + s * 0.24, baseY - s * 0.14 - g * s * 0.28, s * (0.05 + g * 0.05), o.rnd < 0.5 ? '#ff7bac' : '#ffd23e');
    }
    if (big && k > 0.3) {
      var rb = ['#ff5f7e', '#ffae3c', '#ffd23e', '#5fd36b', '#5fb0ff', '#c9a0ff'], q = easeOutCubic(htSaari2PokeSeg(k, 0.3, 0.7));
      c.lineWidth = Math.max(2, s * 0.045); c.lineCap = 'butt';
      for (i = 0; i < 6; i++) {
        c.strokeStyle = rb[i];
        c.beginPath(); c.arc(x, cy + s * 0.3, s * (0.7 - i * 0.045), Math.PI, Math.PI + Math.PI * q); c.stroke();
      }
      c.lineCap = 'round';
    }
    c.globalAlpha = 1;
  },
  // Pensaasta lehahtaa perhonen (iso: kolme)
  bush: function (c, x, baseY, s, k, big, o) {
    var i, n = big ? 3 : 1;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, i * 0.1, 1), dir = i % 2 ? -1 : 1;
      htSaari2PokeButterfly(c, x + dir * Math.sin(t * 3) * s * (0.3 + i * 0.1) + dir * t * s * 0.2, baseY - s * 0.3 - t * s * (0.9 + i * 0.2), s * 0.12, HTSAARI2_COLORS[(i * 2 + 4 + (o.n || 0)) % 6], Math.sin(k * 50 + i));
    }
    c.globalAlpha = 1;
  },
  // Aurinko: säteet pyörähtävät ja aurinko iskee silmää (iso: "HEI!"-kupla)
  sun: function (c, x, y, r, k, big, o) {
    var i, a, rot = easeOutCubic(k) * Math.PI;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    c.strokeStyle = '#ffd23e'; c.lineWidth = Math.max(2, r * 0.12); c.lineCap = 'round';
    for (i = 0; i < 12; i++) {
      a = i / 12 * Math.PI * 2 + rot;
      var L = r * (1.75 + Math.sin(k * Math.PI * 6 + i) * 0.15);
      c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
    }
    if (k > 0.2 && k < 0.6) {
      artCircle(c, x - r * 0.32, y - r * 0.12, r * 0.14, '#ffd84f', { line: false });
      c.strokeStyle = '#7a4a1a'; c.lineWidth = Math.max(1.5, r * 0.07);
      c.beginPath(); c.arc(x - r * 0.32, y - r * 0.16, r * 0.1, 0.3, Math.PI - 0.3); c.stroke();
    }
    if (big) htSaari2PokeBubble(c, x + r * 1.6, y - r * 0.8, 'HEI!', r * 0.5, '#ffae3c', easeOutBack(htSaari2PokeSeg(k, 0, 0.3)));
    c.globalAlpha = 1;
  },

  // --- Kaivos ---
  // Tunneli: lyhty lepattaa, pimeässä vilkkuu silmäpari (iso: lepakko lentää ulos)
  tunnel: function (c, x, baseY, s, k, big, o) {
    var fl = (0.45 + 0.4 * Math.abs(Math.sin(k * 37)) * Math.abs(Math.sin(k * 13 + 1))) * (1 - htSaari2PokeSeg(k, 0.8, 1));
    artGlow(c, x + s * 0.36, baseY - s * 0.43, s * (0.35 + fl * 0.3), '#ffd27a', fl);
    if (!big || k < 0.25) {
      var bl = (k > 0.45 && k < 0.55) ? 0.15 : 1, ey = baseY - s * 0.3;
      c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
      for (var i = -1; i <= 1; i += 2) {
        artBlob(c, x + i * s * 0.06, ey, s * 0.04, s * 0.045 * bl, '#fffbe0', { line: false });
        if (bl > 0.5) artCircle(c, x + i * s * 0.06 + s * 0.01, ey + s * 0.01, s * 0.018, '#2a1a1a', { line: false });
      }
      c.globalAlpha = 1;
    } else {
      var t = htSaari2PokeSeg(k, 0.25, 1);
      c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.85, 1);
      htSaari2PokeBat(c, x - t * s * 0.7 + Math.sin(t * 7) * s * 0.15, baseY - s * 0.35 - t * s * 1.0, s * 0.18, Math.sin(k * 60));
      c.globalAlpha = 1;
    }
  },
  // Kaivosvaunu: pyörät pyörivät ja kyydistä pomppaa jalokivi (iso: kivisuihku)
  cart: function (c, x, baseY, s, k, big, o) {
    var i, sp = (1 - k) * k * 60;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    c.strokeStyle = '#d6dae8'; c.lineWidth = Math.max(1.5, s * 0.02);
    for (i = -1; i <= 1; i += 2) {
      var wx = x + i * s * 0.2, wy = baseY - s * 0.13;
      for (var j = 0; j < 2; j++) {
        var a = sp + j * Math.PI / 2;
        c.beginPath(); c.moveTo(wx - Math.cos(a) * s * 0.06, wy - Math.sin(a) * s * 0.06); c.lineTo(wx + Math.cos(a) * s * 0.06, wy + Math.sin(a) * s * 0.06); c.stroke();
      }
    }
    if (k < 0.4) {
      c.strokeStyle = 'rgba(90,80,100,0.45)'; c.lineWidth = Math.max(1.5, s * 0.025);
      for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - s * (0.5 + i * 0.05), baseY - s * (0.2 + i * 0.12)); c.lineTo(x - s * (0.68 + i * 0.05), baseY - s * (0.2 + i * 0.12)); c.stroke(); }
    }
    var n = big ? 5 : 1;
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, 0.05 + i * 0.05, 0.6 + i * 0.05), dir = (i % 2 ? -1 : 1) * (1 + Math.floor(i / 2) * 0.5);
      var gx = x + dir * t * s * 0.45, gy = baseY - s * 0.55 + (s * 0.5) * t - Math.sin(t * Math.PI) * s * 0.55;
      drawGem(c, gx, gy, s * 0.1, GEM_COLORS[(i + (o.n || 0) + Math.floor(o.rnd * 6)) % 6]);
    }
    c.globalAlpha = 1;
  },
  // Kristalli soi: värirenkaat ja nuotit (iso: sateenkaarirenkaat ja valokiilat)
  crystal: function (c, x, baseY, s, k, big, o) {
    var i, cy = baseY - s * 0.5;
    artGlow(c, x, cy, s * (0.5 + Math.sin(k * Math.PI) * 0.4), o.col, 0.6 * (1 - k));
    for (i = 0; i < 3; i++) {
      var t = htSaari2PokeSeg(k, i * 0.15, 0.6 + i * 0.15);
      if (t <= 0 || t >= 1) continue;
      c.strokeStyle = artRGBA(big ? HTSAARI2_COLORS[(i * 2) % 6] : o.col, 1 - t);
      c.lineWidth = Math.max(2, s * 0.04);
      c.beginPath(); c.arc(x, cy, s * (0.2 + t * 0.6), 0, Math.PI * 2); c.stroke();
    }
    if (big) {
      c.globalAlpha = Math.sin(k * Math.PI) * 0.6;
      for (i = 0; i < 6; i++) {
        var a = i / 6 * Math.PI * 2 + k * 2;
        c.fillStyle = HTSAARI2_COLORS[i];
        c.beginPath(); c.moveTo(x, cy); c.lineTo(x + Math.cos(a - 0.12) * s * 0.9, cy + Math.sin(a - 0.12) * s * 0.9); c.lineTo(x + Math.cos(a + 0.12) * s * 0.9, cy + Math.sin(a + 0.12) * s * 0.9); c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    }
    htSaari2PokeNotes(c, x, cy - s * 0.2, s, k, big ? 3 : 2, artShade(o.col, -0.15));
  },
  // Hakku kilahtaa: kipinät ja jalokivi pomppaa (iso: kivestä nousee iso hehkuva jalokivi)
  pick: function (c, x, baseY, s, k, big, o) {
    var i, a, t = htSaari2PokeSeg(k, 0, 0.3), hx = x + s * 0.06, hy = baseY - s * 0.6;
    if (t < 1) {
      c.strokeStyle = artRGBA('#ffe27a', 1 - t); c.lineWidth = Math.max(1.5, s * 0.03); c.lineCap = 'round';
      for (i = 0; i < 6; i++) {
        a = i / 6 * Math.PI * 2 + 0.3;
        c.beginPath(); c.moveTo(hx + Math.cos(a) * s * 0.06 * (1 + t * 2), hy + Math.sin(a) * s * 0.06 * (1 + t * 2)); c.lineTo(hx + Math.cos(a) * s * 0.12 * (1 + t * 2), hy + Math.sin(a) * s * 0.12 * (1 + t * 2)); c.stroke();
      }
    }
    var gcol = GEM_COLORS[Math.floor(o.rnd2 * 6)];
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    if (big) {
      var g = easeOutBack(htSaari2PokeSeg(k, 0.15, 0.5));
      artGlow(c, x - s * 0.08, baseY - s * 0.45 - g * s * 0.3, s * 0.5 * g, gcol, 0.7);
      drawGem(c, x - s * 0.08, baseY - s * 0.32 - g * s * 0.35, s * (0.07 + g * 0.12), gcol);
      if (k > 0.3) htSaari2PokeBurst(c, x - s * 0.08, baseY - s * 0.67, s * 0.45, htSaari2PokeSeg(k, 0.3, 0.9), '#ffe27a');
    } else {
      var j = htSaari2PokeSeg(k, 0.1, 0.7);
      drawGem(c, x - s * 0.08, baseY - s * 0.32 - Math.sin(j * Math.PI) * s * 0.45, s * 0.08, gcol);
    }
    c.globalAlpha = 1;
  },
  // Majakka välähtää: valokiila pyyhkäisee (iso: kaksi kiilaa ja vilkutus)
  lighthouse: function (c, x, baseY, S, k, big, o) {
    var lx = x, ly = baseY - S * 1.21, i, n = big ? 2 : 1, rot = Math.PI + k * Math.PI * (big ? 4 : 2);
    var fl = (big ? Math.max(0, Math.sin(k * Math.PI * 6)) : Math.sin(k * Math.PI)) * (1 - htSaari2PokeSeg(k, 0.85, 1));
    artGlow(c, lx, ly, S * (0.5 + fl * 0.6), '#fff3a0', 0.5 + fl * 0.4);
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    for (i = 0; i < n; i++) {
      var a = rot + i * Math.PI, L = S * 4, ex = lx + Math.cos(a) * L, ey = ly + Math.sin(a) * L * 0.3;
      var g = c.createLinearGradient(lx, ly, ex, ey);
      g.addColorStop(0, 'rgba(255,248,180,0.8)'); g.addColorStop(1, 'rgba(255,248,180,0)');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(lx, ly);
      c.lineTo(ex - Math.sin(a) * S * 0.6, ey + Math.cos(a) * S * 0.6);
      c.lineTo(ex + Math.sin(a) * S * 0.6, ey - Math.cos(a) * S * 0.6);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  },
  // Purjeveneen vierestä hyppää delfiini (iso: kaksi delfiiniä)
  boat: function (c, x, y, s, k, big, o) {
    var i, n = big ? 2 : 1;
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, i * 0.15, 0.75 + i * 0.15);
      if (t <= 0 || t >= 1) continue;
      var dx = x + s * (0.9 + i * 0.5) - t * s * 0.9, dy = y + s * 0.25 - Math.sin(t * Math.PI) * s * 0.9;
      c.save(); c.translate(dx, dy); c.rotate(-Math.cos(t * Math.PI) * 0.9);
      artBlob(c, 0, 0, s * 0.3, s * 0.11, '#7fa8d8', { lineColor: '#3a5a8a' });
      c.fillStyle = '#5a88c0';
      c.beginPath(); c.moveTo(-s * 0.05, -s * 0.09); c.lineTo(s * 0.05, -s * 0.2); c.lineTo(s * 0.09, -s * 0.08); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(s * 0.26, 0); c.lineTo(s * 0.4, -s * 0.1); c.lineTo(s * 0.4, s * 0.1); c.closePath(); c.fill();
      artCircle(c, -s * 0.18, -s * 0.03, s * 0.025, '#1a2a3a', { line: false });
      c.restore();
    }
    for (i = 0; i < 2; i++) {
      var rt = htSaari2PokeSeg(k, i * 0.35 + 0.1, i * 0.35 + 0.6);
      if (rt <= 0 || rt >= 1) continue;
      c.strokeStyle = artRGBA('#ffffff', 1 - rt); c.lineWidth = 2;
      c.beginPath(); c.ellipse(x + s * (0.9 - i * 0.9), y + s * 0.25, s * 0.3 * (0.4 + rt), s * 0.08 * (0.4 + rt), 0, 0, Math.PI * 2); c.stroke();
    }
  },
  // Taivaan kotka tekee silmukan (iso: kaksi silmukkaa ja laulu)
  bird: function (c, x, y, s, k, big, o) {
    var t = easeInOutSine(k) * Math.PI * 2 * (big ? 2 : 1), R = Math.max(s * 0.5, o.r * (big ? 5 : 4));
    var bx = x + Math.sin(t) * R, by = y - (1 - Math.cos(t)) * R * 0.7;
    htSaari2PokeEagle(c, bx, by, o.r * 1.6, Math.sin(k * 40), Math.cos(t) >= 0 ? 1 : -1);
    if (big) htSaari2PokeNotes(c, x, y - R * 0.5, s, k, 2, '#5a4a6a');
  },

  // --- Vuoret ---
  // Huippu: lumipallot vierivät rinnettä, lipullisessa lippu liehuu (iso: lumihiutaleet)
  peak: function (c, x, baseY, s, k, big, o) {
    var ph = s * (0.95 + o.rnd2 * 0.4), top = baseY - ph, bw = ph * 0.42, i;
    if (o.rnd2 > 0.6) {
      var fy = top, w1 = Math.sin(k * 30) * s * 0.04 * (1 - k), w2 = Math.sin(k * 30 + 1.5) * s * 0.05 * (1 - k);
      c.beginPath(); c.moveTo(x, fy - s * 0.27);
      c.quadraticCurveTo(x + s * 0.09, fy - s * 0.27 + w1, x + s * 0.19, fy - s * 0.21 + w2);
      c.quadraticCurveTo(x + s * 0.09, fy - s * 0.15 + w1, x, fy - s * 0.13); c.closePath();
      artFillPath(c, '#ff5f6e', fy - s * 0.27, fy - s * 0.12, s * 0.06, { lineColor: '#a8303c', line: 1 });
    }
    for (i = 0; i < (big ? 4 : 2); i++) {
      var t = htSaari2PokeSeg(k, i * 0.12, 0.7 + i * 0.08), dir = i % 2 ? 1 : -1;
      if (t <= 0 || t >= 1) continue;
      var px = x + dir * bw * 0.85 * t, py = top + ph * 0.08 + (ph - s * 0.06 - ph * 0.08) * t, r = s * (0.04 + t * 0.06);
      c.globalAlpha = Math.min(1, (1 - t) * 5);
      artCircle(c, px, py - r, r, '#ffffff', { lineColor: '#8a96b0', line: 1 });
      c.fillStyle = '#c8d2e6'; c.beginPath(); c.arc(px + Math.cos(t * 20 * dir) * r * 0.5, py - r + Math.sin(t * 20 * dir) * r * 0.5, r * 0.18, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    if (big) for (i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + k * 2, d = s * 0.6 * easeOutCubic(k);
      c.globalAlpha = 1 - k;
      drawSnowflake(c, x + Math.cos(a) * d, top + Math.sin(a) * d * 0.7, s * 0.07);
      c.globalAlpha = 1;
    }
  },
  // Kuusi: lumi pöllähtää oksilta (iso: punatulkku laulaa latvassa)
  pine: function (c, x, baseY, s, k, big, o) {
    var S = s * (0.9 + o.rnd2 * 0.3), px = x - s * 0.12, i;
    for (i = 0; i < 3; i++) {
      var ty = baseY - S * 0.15 - i * S * 0.27 - S * 0.32, t = htSaari2PokeSeg(k, i * 0.08, 0.5 + i * 0.08);
      if (t <= 0 || t >= 1) continue;
      for (var j = -1; j <= 1; j += 2) artBlob(c, px + j * S * (0.18 - i * 0.03) + j * t * S * 0.08, ty + t * t * (baseY - ty), S * 0.05, S * 0.035, '#ffffff', { lineColor: '#a8b4cc', line: 1 });
    }
    if (big) {
      var q = easeOutBack(htSaari2PokeSeg(k, 0.2, 0.45)) * (1 - htSaari2PokeSeg(k, 0.85, 1)), by = baseY - S * 1.12;
      if (q > 0) {
        c.save(); c.translate(px, by); c.scale(q, q);
        artCircle(c, 0, 0, S * 0.09, '#ff5f4e', { lineColor: '#7a2a24' });
        artCircle(c, 0, -S * 0.08, S * 0.065, '#3a3a4a', { line: false });
        artEye(c, S * 0.025, -S * 0.09, S * 0.025);
        c.fillStyle = '#3a3a4a';
        c.beginPath(); c.moveTo(S * 0.06, -S * 0.07); c.lineTo(S * 0.1, -S * 0.06); c.lineTo(S * 0.06, -S * 0.045); c.closePath(); c.fill();
        c.restore();
      }
      htSaari2PokeNotes(c, px + s * 0.1, by - S * 0.1, s, htSaari2PokeSeg(k, 0.3, 1), 2, '#ff5f4e');
    }
  },
  // Kotkanpesä: kotka lehahtaa lentoon, poikaset piipittävät (iso: kaksi kierrosta ja sulkia)
  nest: function (c, x, baseY, s, k, big, o) {
    var ny = baseY - s * 0.66, t = htSaari2PokeSeg(k, 0, 1), i;
    var a = t * Math.PI * (big ? 3 : 1.5), ex = x + Math.sin(a) * s * 0.7, ey = ny - s * 0.3 - t * s * 1.0 - (1 - Math.cos(a)) * s * 0.15;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.85, 1);
    htSaari2PokeEagle(c, ex, ey, s * 0.3 * (0.7 + Math.min(1, t * 3) * 0.3), Math.sin(k * 45), Math.cos(a) >= 0 ? 1 : -1);
    if (big) for (i = 0; i < 2; i++) {
      var f = htSaari2PokeSeg(k, 0.3 + i * 0.1, 1);
      if (f <= 0) continue;
      c.save(); c.translate(x + (i ? 0.3 : -0.35) * s + Math.sin(f * 8 + i) * s * 0.1, ny - s * 0.8 + f * s * 0.9); c.rotate(Math.sin(f * 8) * 0.6);
      artBlob(c, 0, 0, s * 0.04, s * 0.11, '#c9a070', { lineColor: '#6a4a24', line: 1 });
      c.restore();
    }
    if (k < 0.6) for (i = -1; i <= 1; i += 2) {
      var op = Math.abs(Math.sin(k * 25 + i));
      c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.45, 0.6);
      artCircle(c, x + i * s * 0.12, ny - s * 0.07, s * (0.02 + op * 0.015), '#c0402e', { line: false });
      htSaari2Letter(c, 'piip', x + i * s * 0.3, ny - s * 0.4 - k * s * 0.3, s * 0.13, '#ffa83e', '#ffffff');
    }
    c.globalAlpha = 1;
  },
  // Vuorimaja: savupiipusta tupruttaa ja ikkuna hehkuu (iso: savusydämet)
  hut: function (c, x, baseY, s, k, big, o) {
    var i, cx = x + s * 0.18, cy = baseY - s * 0.74;
    artGlow(c, x - s * 0.13, baseY - s * 0.24, s * 0.3, '#ffd27a', Math.sin(k * Math.PI) * 0.8);
    for (i = 0; i < 5; i++) {
      var t = htSaari2PokeSeg(k, i * 0.1, 0.55 + i * 0.1);
      if (t <= 0 || t >= 1) continue;
      var px = cx + t * s * 0.35 + Math.sin(t * 5 + i) * s * 0.05, py = cy - t * s * 0.9, r = s * (0.06 + t * 0.1);
      c.globalAlpha = 1 - t;
      if (big) drawHeartShape(c, px, py, r * 1.2, true);
      else artCircle(c, px, py, r, '#eef2fa', { lineColor: '#a8b4cc', line: 1 });
      c.globalAlpha = 1;
    }
  },
  // Lohkareen takaa kurkistaa lumijänis (iso: jänis loikkaa yli)
  boulder: function (c, x, baseY, s, k, big, o) {
    var r = s * 0.22;
    if (big) {
      var t = htSaari2PokeSeg(k, 0.05, 0.8);
      if (t > 0 && t < 1) htSaari2PokeHare(c, x - s * 0.5 + t * s * 1.0, baseY - s * 0.05 - Math.sin(t * Math.PI) * s * 0.7, r);
    } else {
      var up = Math.sin(htSaari2PokeSeg(k, 0, 0.9) * Math.PI);
      if (up <= 0) return;
      c.save();
      c.beginPath(); c.rect(x - s * 0.6, baseY - s * 1.6, s * 1.2, s * 1.6 - s * 0.32); c.clip();
      htSaari2PokeHare(c, x - s * 0.12, baseY - s * 0.15 - up * s * 0.35, r);
      c.restore();
    }
  },

  // --- Kirjaimet ---
  // Kirjainpalikka kääntyy ja näyttää uuden kirjaimen (iso: kaikki palikat kääntyvät)
  blocks: function (c, x, baseY, s, k, big, o) {
    var nb = o.rnd2 < 0.5 ? 2 : 3, cols = ['#ff5f7e', '#5fa8ff', '#ffc93e', '#5fd36b', '#c9a0ff'], i;
    for (i = big ? 0 : nb - 1; i < nb; i++) {
      var bx = x + (i === 0 ? -s * 0.22 : i === 1 ? s * 0.22 : 0), by = baseY - (i === 2 ? s * 0.43 : 0), sz = s * 0.43;
      var idx = Math.floor(o.rnd2 * 20) + i, ch = HTSAARI2_ABC.charAt(idx), nw = HTSAARI2_ABC.charAt((idx + (o.n || 1) * (big ? 3 : 1)) % 24);
      var f = htSaari2PokeFlip(htSaari2PokeSeg(k, (nb - 1 - i) * 0.06, 1), ch, nw, s);
      c.save(); c.translate(bx, by - f.lift); c.scale(f.sx, 1);
      htSaari2Block(c, 0, 0, sz * 1.04, cols[(i + Math.floor(o.rnd2 * 5)) % 5], f.show, (i - 1) * 0.06);
      c.restore();
    }
  },
  // Kirjapinon päällä kirja aukeaa ja siitä lentää kirjaimia (iso: kirjainpyörre)
  books: function (c, x, baseY, s, k, big, o) {
    var top = baseY - s * 0.68, op = easeOutBack(htSaari2PokeSeg(k, 0, 0.25)) * (1 - htSaari2PokeSeg(k, 0.85, 1)), i, col = HTSAARI2_COLORS[Math.floor(o.rnd * 6) % 6];
    if (op > 0) {
      c.save(); c.translate(x + s * 0.08, top - s * 0.02); c.scale(op, op);
      for (i = -1; i <= 1; i += 2) {
        c.beginPath(); c.moveTo(0, 0); c.lineTo(i * s * 0.28, -s * 0.06); c.lineTo(i * s * 0.28, s * 0.06); c.lineTo(0, s * 0.1); c.closePath();
        artFillPath(c, col, -s * 0.06, s * 0.1, s * 0.1, { lineColor: artShade(col, -0.5) });
        c.beginPath(); c.moveTo(0, -s * 0.02); c.quadraticCurveTo(i * s * 0.12, -s * 0.1, i * s * 0.25, -s * 0.07); c.lineTo(i * s * 0.25, s * 0.03); c.quadraticCurveTo(i * s * 0.12, 0, 0, s * 0.06); c.closePath();
        artFillPath(c, '#fffaf0', -s * 0.1, s * 0.06, s * 0.1, { lineColor: '#b0a080', line: 1 });
      }
      c.restore();
    }
    var n = big ? 7 : 3;
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, 0.15 + i * 0.06, 0.75 + i * 0.03);
      if (t <= 0 || t >= 1) continue;
      var a = t * Math.PI * (big ? 3 : 1.5) + i * 2.1, rr = s * (0.1 + t * 0.4);
      c.globalAlpha = 1 - t * t;
      htSaari2Letter(c, HTSAARI2_ABC.charAt((i * 7 + (o.n || 0) * 3 + Math.floor(o.rnd * 24)) % 24), x + s * 0.08 + Math.cos(a) * rr, top - s * 0.15 - t * s * 0.9, s * (0.2 + t * 0.12), HTSAARI2_COLORS[i % 6], '#ffffff');
      c.globalAlpha = 1;
    }
  },
  // Kirjainpensas sanoo äänteensä puhekuplassa (iso: sateenkaarikirjain nousee, kukat aukeavat)
  hedge: function (c, x, baseY, s, k, big, o) {
    var lo = o.ch.toLowerCase(), txt = o.ch + lo + lo + '!';
    var sc = easeOutBack(htSaari2PokeSeg(k, 0, 0.25)) * (1 - htSaari2PokeSeg(k, 0.85, 1));
    htSaari2PokeBubble(c, x + s * 0.35, baseY - s * 1.15 - htSaari2PokeSeg(k, 0.3, 1) * s * 0.15, txt, s * 0.24, '#2f7a3a', sc);
    if (big) {
      var t = htSaari2PokeSeg(k, 0.15, 1);
      c.globalAlpha = 1 - t;
      htSaari2Letter(c, o.ch, x, baseY - s * 0.4 - t * s * 0.9, s * (0.6 + t * 0.4), HTSAARI2_COLORS[Math.floor(k * 18) % 6], '#ffffff');
      c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
      for (var i = 0; i < 4; i++) {
        var fs = easeOutBack(htSaari2PokeSeg(k, i * 0.08, 0.3 + i * 0.08));
        if (fs > 0) drawFlower(c, x + (i - 1.5) * s * 0.25, baseY - s * 0.05, s * 0.06 * fs, HTSAARI2_COLORS[i]);
      }
      c.globalAlpha = 1;
    }
  },
  // Tavuviitta: tavusta tulee sana, joka leijuu ylös (iso: sana hyppii sateenkaarena)
  sign: function (c, x, baseY, s, k, big, o) {
    var word = HTSAARI2_POKE_WORDS[o.syl] || (o.syl + o.syl), t = htSaari2PokeSeg(k, 0, 1), i;
    var y = baseY - s * 1.0 - easeOutCubic(t) * s * 0.4, sz = s * 0.3 * easeOutBack(htSaari2PokeSeg(k, 0, 0.25));
    if (sz <= 1) return;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    c.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
    var w = c.measureText(word).width, cx = x - w / 2;
    for (i = 0; i < word.length; i++) {
      c.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
      var cw = c.measureText(word.charAt(i)).width;
      var col = big ? HTSAARI2_COLORS[i % 6] : (i < o.syl.length ? o.col : '#ffffff');
      var jy = big ? Math.sin(k * 20 - i) * s * 0.06 : 0;
      htSaari2Letter(c, word.charAt(i), cx + cw / 2, y + jy, sz, col, artShade(o.col, -0.45));
      cx += cw;
    }
    c.globalAlpha = 1;
  },
  // Puusta leijailee kirjainlehtiä (iso: lintu laulaa latvassa)
  ltree: function (c, x, baseY, s, k, big, o) {
    var S = s * (0.75 + o.rnd2 * 0.2), i;
    for (i = 0; i < 3; i++) {
      var t = htSaari2PokeSeg(k, i * 0.1, 0.8 + i * 0.07);
      if (t <= 0 || t >= 1) continue;
      c.globalAlpha = Math.min(1, (1 - t) * 4);
      c.save(); c.translate(x + (i - 1) * S * 0.25 + Math.sin(t * 7 + i) * S * 0.15, baseY - S * 0.9 + t * S * 0.85); c.rotate(Math.sin(t * 7 + i) * 0.5);
      htSaari2Letter(c, HTSAARI2_ABC.charAt((i * 5 + (o.n || 0)) % 24), 0, 0, S * 0.2, '#5fbf55', '#ffffff');
      c.restore();
      c.globalAlpha = 1;
    }
    if (big) htSaari2PokeNotes(c, x, baseY - S * 1.2, s, k, 3, '#ff7bac');
  },
  // Leija tekee silmukan (iso: kaksi silmukkaa ja kirjaimen äänne)
  kite: function (c, x, y, s, k, big, o) {
    var t = easeInOutSine(k) * Math.PI * 2 * (big ? 2 : 1), R = s * 0.9;
    var kx = x + Math.sin(t) * R, ky = y - (1 - Math.cos(t)) * R;
    c.globalAlpha = 0.7 * (1 - htSaari2PokeSeg(k, 0.7, 1));
    c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(2, s * 0.08); c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - R, R, Math.PI / 2, Math.PI / 2 - Math.min(t, Math.PI * 2 - 0.01), true); c.stroke();
    c.globalAlpha = 1;
    c.save(); c.translate(kx, ky); c.rotate(-t);
    htSaari2Kite(c, 0, 0, s * 1.05, o.col, o.ch);
    c.restore();
    if (big) htSaari2PokeBubble(c, x + s * 1.3, y - s * 1.6, o.ch + o.ch.toLowerCase() + '!', s * 0.6, o.col, easeOutBack(htSaari2PokeSeg(k, 0.1, 0.35)) * (1 - htSaari2PokeSeg(k, 0.85, 1)));
  },
  // Hyllyn kirja nousee ja sen kirjain ponnahtaa isona
  shelf: function (c, x, y, s, k, big, o) {
    var lift = Math.sin(htSaari2PokeSeg(k, 0, 0.8) * Math.PI) * s * 0.5;
    artRoundRect(c, o.bx, y - o.bh - lift, o.bw, o.bh, s * 0.06, o.col, { lineColor: artShade(o.col, -0.5) });
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.fillRect(o.bx + o.bw * 0.15, y - o.bh - lift + s * 0.15, o.bw * 0.7, s * 0.06);
    htSaari2Letter(c, o.ch, o.bx + o.bw / 2, y - o.bh / 2 - lift, s * 0.32, '#ffffff', artShade(o.col, -0.45));
    var t = htSaari2PokeSeg(k, 0.15, 1);
    c.globalAlpha = 1 - t;
    htSaari2Letter(c, o.ch, o.bx + o.bw / 2, y - o.bh - lift - s * 0.4 - t * s * 0.8, s * (0.5 + t * (big ? 0.9 : 0.4)), big ? HTSAARI2_COLORS[Math.floor(k * 18) % 6] : o.col, '#ffffff');
    c.globalAlpha = 1;
  },
  // Palikkatorni (taustalla): A, B ja C kääntyvät uusiksi kirjaimiksi
  tower: function (c, x, y, s, k, big, o) {
    var bl = [[-0.36, 0, '#ff5f7e', 0, -0.04], [0.36, 0, '#5fa8ff', 1, 0.05], [0, -0.7, '#5fd36b', 2, 0.1]], i;
    for (i = 0; i < 3; i++) {
      var nw = HTSAARI2_ABC.charAt((bl[i][3] + (o.n || 1) * 3) % 24);
      var f = htSaari2PokeFlip(htSaari2PokeSeg(k, i * 0.08, 1), 'ABC'.charAt(i), nw, s);
      c.save(); c.translate(x + bl[i][0] * s, y + bl[i][1] * s - f.lift); c.scale(f.sx, 1);
      htSaari2Block(c, 0, 0, s * 0.72, bl[i][2], f.show, bl[i][4]);
      c.restore();
    }
    if (big) htSaari2PokeConfetti(c, x, y - s * 1.4, s, k, 16, 4, 1.2);
  },

  // --- Tivoli ---
  // Teltta: konfettipamaus katolta (iso: pupu kurkistaa ovesta, "TADAA!")
  tent: function (c, x, baseY, s, k, big, o) {
    htSaari2PokeConfetti(c, x, baseY - s * 0.95, s, k, big ? 26 : 14, (o.n || 0) + 3, big ? 2.0 : 1.5);
    if (big) {
      var up = easeOutBack(htSaari2PokeSeg(k, 0.1, 0.35)) * (1 - htSaari2PokeSeg(k, 0.85, 1));
      if (up > 0) {
        c.save(); c.beginPath(); c.rect(x - s * 0.5, baseY - s * 1.4, s, s * 1.4); c.clip();
        htSaari2PokeHare(c, x, baseY + s * 0.2 - up * s * 0.3, s * 0.13);
        c.restore();
      }
      htSaari2PokeBubble(c, x + s * 0.4, baseY - s * 1.25, 'TADAA!', s * 0.2, '#ff5f7e', easeOutBack(htSaari2PokeSeg(k, 0.2, 0.4)) * (1 - htSaari2PokeSeg(k, 0.85, 1)));
    }
  },
  // Ilmapallo karkaa ja poksahtaa tähdiksi (iso: kolme palloa)
  balloons: function (c, x, baseY, s, k, big, o) {
    var i, n = big ? 3 : 1;
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, i * 0.08, 0.75 + i * 0.05), col = HTSAARI2_COLORS[(i * 2 + (o.n || 0) + Math.floor(o.rnd2 * 6)) % 6];
      var bx = x + (i - (n - 1) / 2) * s * 0.25 + Math.sin(t * 6 + i) * s * 0.1, by = baseY - s * 1.0 - t * s * 1.3;
      if (t < 1) {
        c.strokeStyle = 'rgba(110,80,110,0.6)'; c.lineWidth = Math.max(1, s * 0.012);
        c.beginPath(); c.moveTo(bx, by + s * 0.15); c.quadraticCurveTo(bx - s * 0.05, by + s * 0.3, bx + Math.sin(t * 9) * s * 0.05, by + s * 0.42); c.stroke();
        artBlob(c, bx, by, s * 0.13, s * 0.155, col, { hi: 0.5 });
      } else htSaari2PokeBurst(c, bx, by, s * 0.35, htSaari2PokeSeg(k, 0.75 + i * 0.05, 1), col);
    }
  },
  // Jäätelökärrystä nousee tötterö (iso: neljän pallon torni kirsikalla)
  icecart: function (c, x, baseY, s, k, big, o) {
    var up = easeOutBack(htSaari2PokeSeg(k, 0, 0.35));
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    htSaari2PokeCone(c, x - s * 0.16 + up * s * 0.05, baseY - s * 0.75 - up * s * 0.45, s * (0.9 + up * 0.25), big ? 4 : 2, big);
    if (k > 0.3) {
      var t = htSaari2PokeSeg(k, 0.3, 1);
      c.globalAlpha = 1 - t;
      drawHeartShape(c, x + s * 0.25, baseY - s * 1.2 - t * s * 0.5, s * 0.08, true);
    }
    c.globalAlpha = 1;
  },
  // Viirinauhan valot vilkkuvat (iso: ilotulitteet salkojen päistä)
  bunting: function (c, x, baseY, s, k, big, o) {
    htSaari2PokeLights(c, { x0: x - s * 0.42, y0: baseY - s * 0.9, x1: x + s * 0.42, y1: baseY - s * 0.9, sag: s * 0.25, n: 5 }, k, s * 0.12);
    if (big) {
      htSaari2PokeFirework(c, x - s * 0.42, baseY - s * 0.97, s * 1.0, htSaari2PokeSeg(k, 0, 0.8), 0);
      htSaari2PokeFirework(c, x + s * 0.42, baseY - s * 0.97, s * 1.2, htSaari2PokeSeg(k, 0.15, 1), 3);
    } else htSaari2PokeNotes(c, x, baseY - s * 1.0, s, k, 2);
  },
  // Tivolin puusta putoilee karkkeja
  ftree: function (c, x, baseY, s, k, big, o) {
    var S = s * (0.75 + o.rnd2 * 0.2), i, n = big ? 6 : 3;
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    for (i = 0; i < n; i++) {
      var t = htSaari2PokeSeg(k, i * 0.07, 0.55 + i * 0.07);
      if (t <= 0) continue;
      var cx = x + (i - (n - 1) / 2) * S * 0.18, cy = baseY - S * 0.85 + (S * 0.8) * t * t;
      htSaari2PokeCandy(c, cx + t * (i % 2 ? 1 : -1) * S * 0.1, cy, S * 0.05, HTSAARI2_COLORS[(i + (o.n || 0)) % 6], t * 6 + i);
    }
    c.globalAlpha = 1;
  },
  // Maailmanpyörä: valot kiertävät vauhdilla (iso: tähdet kiertävät kehää)
  wheel: function (c, x, y, r, k, big, o) {
    var i, a, sp = easeInOutSine(k) * Math.PI * (big ? 6 : 3);
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.8, 1);
    for (i = 0; i < 16; i++) {
      a = i / 16 * Math.PI * 2 + sp;
      var on = (i + Math.floor(k * 20)) % 2 === 0;
      artGlow(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * (on ? 0.14 : 0.08), HTSAARI2_COLORS[i % 6], on ? 0.9 : 0.4);
      if (on) artCircle(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.035, '#fffbe0', { line: false });
    }
    c.strokeStyle = artRGBA('#ffffff', 0.7 * Math.sin(k * Math.PI)); c.lineWidth = Math.max(2, r * 0.03);
    for (i = 0; i < 8; i++) { a = i * Math.PI / 4 + sp; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); c.stroke(); }
    if (big) for (i = 0; i < 4; i++) {
      a = i / 4 * Math.PI * 2 + sp * 0.5;
      drawStar(c, x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25, r * 0.09, sp, 0.6);
    }
    c.globalAlpha = 1;
  },
  // Karuselli: hevoset keinuvat ja soitto soi (iso: konfettia)
  carousel: function (c, x, baseY, s, k, big, o) {
    var i, cols = ['#ff7bac', '#ffd24f', '#7fd4ff', '#c9a0ff'];
    c.globalAlpha = 1 - htSaari2PokeSeg(k, 0.85, 1);
    for (i = 0; i < 5; i++) {
      var px = x + (i - 2) * s * 0.4, bob = Math.sin(k * Math.PI * 6 + i * 1.3) * s * 0.12 * Math.sin(k * Math.PI);
      artCircle(c, px, baseY - s * 0.35 + bob, s * 0.12, cols[i % 4], { lineColor: artShade(cols[i % 4], -0.45), hi: 0.4 });
      artCircle(c, px + s * 0.07, baseY - s * 0.4 + bob, s * 0.025, '#3a2a2a', { line: false });
    }
    c.globalAlpha = 1;
    htSaari2PokeNotes(c, x, baseY - s * 1.2, s, k, big ? 4 : 3);
    if (big) htSaari2PokeConfetti(c, x, baseY - s * 1.2, s, k, 18, 7, 1.4);
  },
  // Isot tivoliteltat taustalla: viiri liehuu ja konfettia
  fairtent: function (c, x, baseY, s, k, big, o) {
    var w = Math.sin(k * 28) * s * 0.06 * (1 - k);
    c.beginPath(); c.moveTo(x, baseY - s * 1.32); c.quadraticCurveTo(x + s * 0.12, baseY - s * 1.3 + w, x + s * 0.24, baseY - s * 1.25 + w * 1.5);
    c.quadraticCurveTo(x + s * 0.12, baseY - s * 1.18 + w, x, baseY - s * 1.17); c.closePath();
    artFillPath(c, '#ffd24f', baseY - s * 1.32, baseY - s * 1.17, s * 0.08, { lineColor: '#b08a2a', line: 1 });
    htSaari2PokeConfetti(c, x, baseY - s * 1.15, s, k, big ? 26 : 14, (o.n || 0) + 5, big ? 2 : 1.5);
  },
  // Viirinauhat yläkulmissa: valot vilkkuvat
  topbunting: function (c, x, y, s, k, big, o) {
    htSaari2PokeLights(c, o, k, o.fs);
    if (big) htSaari2PokeConfetti(c, x, y + s * 0.3, s, k, 20, 9, 1.2);
  },
  // Leijuva pallo poksahtaa tähdiksi
  pop: function (c, x, y, s, k, big, o) {
    htSaari2PokeBurst(c, x, y, s * (big ? 1.0 : 0.6), k, o.col);
    if (big) htSaari2PokeBubble(c, x, y - s * 0.8, 'POKS!', s * 0.35, o.col, easeOutBack(htSaari2PokeSeg(k, 0, 0.3)) * (1 - htSaari2PokeSeg(k, 0.8, 1)));
  }
};

// Äänet (big = joka 3. tökkäys)
function htSaari2PokeLetterHz(ch) { return 392 * Math.pow(1.06, Math.max(0, HTSAARI2_ABC.indexOf(ch)) % 12); }
var htSaari2PokeSnd = {
  tree: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 1047] : [659, 784], 0.1, 'sine', 0.22); },
  pencil: function (big) { htSaari2PokeTune(big ? [784, 988, 1175, 1568] : [880, 1047, 880], 0.08, 'triangle', 0.18); },
  ink: function (big) { htSaari2PokeTune(big ? [330, 262, 392, 523] : [330, 247], 0.07, 'square', 0.12); },
  rain: function (big) { htSaari2PokeTune(big ? [1175, 988, 1319, 1047, 1568] : [1319, 1175, 1047], 0.09, 'sine', 0.15); },
  bush: function (big) { htSaari2PokeTune(big ? [988, 1175, 1319, 1568] : [1175, 1319], 0.07, 'sine', 0.16); },
  sun: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 659, 1047] : [659, 988], 0.1, 'triangle', 0.2); },
  tunnel: function (big) { htSaari2PokeTune(big ? [220, 330, 1568, 1760] : [196, 247], 0.1, 'triangle', 0.18); },
  cart: function (big) { htSaari2PokeTune(big ? [196, 220, 1319, 1568, 1760, 2093] : [196, 220, 1568], 0.08, 'triangle', 0.18); },
  crystal: function (big, o) {
    var ci = Math.max(0, CRYSTAL_COLORS.indexOf(o.col)), b = [784, 880, 988, 1047, 1175][ci % 5];
    htSaari2PokeTune(big ? [b, b * 1.25, b * 1.5, b * 2] : [b, b * 1.5], 0.12, 'sine', 0.22, 0.6);
  },
  pick: function (big) { htSaari2PokeTune(big ? [1760, 1319, 1568, 2093] : [1760, 1319], 0.06, 'square', 0.1); },
  lighthouse: function (big) { htSaari2PokeTune(big ? [147, 0, 147, 0, 196] : [147], 0.25, 'triangle', 0.3, 0.5); },
  boat: function (big) { htSaari2PokeTune(big ? [392, 523, 659, 784] : [523, 784], 0.1, 'sine', 0.2); },
  bird: function (big) { htSaari2PokeTune(big ? [1568, 1319, 1568, 1319] : [1568, 1319], 0.12, 'sine', 0.15); },
  peak: function (big) { htSaari2PokeTune(big ? [523, 0, 523, 0, 392] : [659, 523, 440], 0.12, 'sine', 0.18); },
  pine: function (big) { htSaari2PokeTune(big ? [988, 1319, 988, 1319, 1568] : [784, 659], 0.09, 'sine', 0.16); },
  nest: function (big) { htSaari2PokeTune(big ? [1397, 1175, 988, 2093, 2349] : [1397, 1175, 2093], 0.1, 'triangle', 0.14); },
  hut: function (big) { htSaari2PokeTune(big ? [392, 494, 587, 784] : [392, 330], 0.12, 'sine', 0.18); },
  boulder: function (big) { htSaari2PokeTune(big ? [523, 784, 1047] : [784, 988], 0.1, 'triangle', 0.18); },
  blocks: function (big, o) {
    var nb = o.rnd2 < 0.5 ? 2 : 3, idx = Math.floor(o.rnd2 * 20) + nb - 1;
    var hz = htSaari2PokeLetterHz(HTSAARI2_ABC.charAt((idx + (o.n || 1) * (big ? 3 : 1)) % 24));
    htSaari2PokeTune(big ? [hz, hz * 1.25, hz * 1.5] : [hz, hz], 0.12, 'triangle', 0.2);
  },
  books: function (big) { htSaari2PokeTune(big ? [659, 784, 880, 1047, 1175, 1319] : [784, 988, 1175], 0.07, 'sine', 0.16); },
  hedge: function (big, o) { var hz = htSaari2PokeLetterHz(o.ch); htSaari2PokeTune(big ? [hz, hz, hz * 1.5, hz * 2] : [hz, hz, hz], 0.13, 'triangle', 0.22, 0.2); },
  sign: function (big, o) { var hz = htSaari2PokeLetterHz(o.syl.charAt(0)); htSaari2PokeTune(big ? [hz, hz * 1.25, hz, hz * 1.5] : [hz, hz * 1.25], 0.16, 'triangle', 0.2); },
  ltree: function (big) { htSaari2PokeTune(big ? [1175, 1319, 1568, 1319, 1760] : [988, 784], 0.1, 'sine', 0.15); },
  kite: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 1047, 784] : [659, 880, 1047], 0.09, 'sine', 0.18); },
  shelf: function (big, o) { var hz = htSaari2PokeLetterHz(o.ch); htSaari2PokeTune(big ? [hz, hz * 1.5, hz * 2] : [hz, hz * 1.5], 0.1, 'triangle', 0.2); },
  tower: function (big) { htSaari2PokeTune(big ? [392, 440, 494, 523, 784] : [392, 440, 494], 0.09, 'triangle', 0.18); },
  tent: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 1047, 0, 1047] : [880, 1319], 0.09, 'square', 0.12); },
  balloons: function (big) { htSaari2PokeTune(big ? [523, 587, 659, 0, 0, 0, 0, 1568, 1760, 2093] : [659, 784, 0, 0, 0, 0, 0, 1568], 0.09, 'sine', 0.16); },
  icecart: function (big) { htSaari2PokeTune(big ? [784, 988, 1175, 1568] : [988, 1175], 0.1, 'triangle', 0.18); },
  bunting: function (big) { htSaari2PokeTune(big ? [262, 392, 0, 0, 1047, 1319, 1568] : [784, 988, 1175], 0.1, 'sine', 0.16); },
  ftree: function (big) { htSaari2PokeTune(big ? [1047, 1175, 1319, 1397, 1568, 1760] : [1319, 1175, 1047], 0.07, 'sine', 0.15); },
  wheel: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 659, 523, 659, 784, 1047] : [523, 659, 784, 1047], 0.12, 'triangle', 0.18); },
  // Karusellin valssi: um-pa-pa
  carousel: function (big) {
    var m = big ? [523, 659, 784, 784, 659, 523, 587, 698, 880, 880, 698, 587] : [523, 659, 784, 784, 659, 523];
    htSaari2PokeTune(m, 0.17, 'triangle', 0.2, 0.25);
    htSaari2PokeTune(big ? [131, 0, 0, 98, 0, 0, 147, 0, 0, 98] : [131, 0, 0, 98], 0.17, 'sine', 0.18, 0.3);
  },
  fairtent: function (big) { htSaari2PokeTune(big ? [523, 659, 784, 1047] : [880, 1319], 0.09, 'square', 0.12); },
  topbunting: function (big) { htSaari2PokeTune(big ? [784, 988, 1175, 1568] : [988, 1175], 0.1, 'sine', 0.16); },
  pop: function (big) { htSaari2PokeTune(big ? [1568, 1760, 2093, 2349] : [1760, 1319], 0.06, 'triangle', 0.16); }
};

// Koristeen laji samoilla kynnyksillä kuin teeman wall-funktio: { fx, o }
function htSaari2PokeKindPaper(rnd, rnd2, s) {
  if (rnd < 0.36) return { fx: 'tree', o: { S: s * (0.85 + rnd2 * 0.25), apples: rnd < 0.2 } };
  if (rnd < 0.52) return { fx: 'pencil', o: { S: s * (0.95 + rnd2 * 0.2), col: HTSAARI2_COLORS[Math.floor(rnd2 * 6)], ang: rnd2 < 0.5 ? 0.3 : -0.3 } };
  if (rnd < 0.66) return { fx: 'ink', o: {} };
  if (rnd < 0.8) return { fx: 'rain', o: { rnd: rnd2 } };
  return { fx: 'bush', o: {} };
}
function htSaari2PokeKindMine(rnd, rnd2) {
  if (rnd < 0.28) return { fx: 'tunnel', o: {} };
  if (rnd < 0.5) return { fx: 'cart', o: { rnd: rnd2 } };
  if (rnd < 0.74) return { fx: 'crystal', o: { col: CRYSTAL_COLORS[Math.floor(rnd2 * CRYSTAL_COLORS.length)] } };
  return { fx: 'pick', o: { rnd2: rnd2 } };
}
function htSaari2PokeKindMountain(rnd, rnd2) {
  if (rnd < 0.34) return { fx: 'peak', o: { rnd2: rnd2 } };
  if (rnd < 0.62) return { fx: 'pine', o: { rnd2: rnd2 } };
  if (rnd < 0.8) return { fx: 'nest', o: {} };
  if (rnd < 0.88) return { fx: 'hut', o: {} };
  return { fx: 'boulder', o: {} };
}
function htSaari2PokeKindLetters(rnd, rnd2) {
  if (rnd < 0.28) return { fx: 'blocks', o: { rnd2: rnd2 } };
  if (rnd < 0.5) return { fx: 'books', o: { rnd: rnd2 } };
  if (rnd < 0.74) return { fx: 'hedge', o: { ch: 'AUVTHMKEÄÖ'.charAt(Math.floor(rnd2 * 10)) } };
  if (rnd < 0.86) return { fx: 'sign', o: { syl: HTSAARI2_SYLL[Math.floor(rnd2 * HTSAARI2_SYLL.length)], col: HTSAARI2_COLORS[Math.floor(rnd2 * 60) % 6] } };
  return { fx: 'ltree', o: { rnd2: rnd2 } };
}
function htSaari2PokeKindFair(rnd, rnd2) {
  if (rnd < 0.32) return { fx: 'tent', o: {} };
  if (rnd < 0.52) return { fx: 'balloons', o: { rnd2: rnd2 } };
  if (rnd < 0.72) return { fx: 'icecart', o: {} };
  if (rnd < 0.88) return { fx: 'bunting', o: {} };
  return { fx: 'ftree', o: { rnd2: rnd2 } };
}

// Kytkee teemaan pokeDraw- ja poke-koukut
function htSaari2PokeHook(th, kindFn, color, dur) {
  th.pokeColor = color;
  th.pokeDur = dur;
  th.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
    var d = kindFn(rnd, rnd2, s);
    d.o.n = n;
    c.save();
    htSaari2PokeFx[d.fx](c, x, baseY, s, k, n % 3 === 0, d.o);
    c.restore();
  };
  th.poke = function (p) {
    var d = kindFn(p.rnd, p.rnd2, p.s), big = p.n % 3 === 0;
    d.o.n = p.n;
    htSaari2PokeSnd[d.fx](big, d.o);
    if (big) spawnSparkles(p.x, p.y - p.s * 0.9, 10, HTSAARI2_COLORS[p.n % 6]);
  };
}
htSaari2PokeHook(HUB_THEMES.paper, htSaari2PokeKindPaper, '#ff7bac', 1.8);
htSaari2PokeHook(HUB_THEMES.mine, htSaari2PokeKindMine, '#ffe27a', 1.8);
htSaari2PokeHook(HUB_THEMES.mountain, htSaari2PokeKindMountain, '#ffffff', 2.0);
htSaari2PokeHook(HUB_THEMES.letters, htSaari2PokeKindLetters, '#5fd36b', 2.0);
htSaari2PokeHook(HUB_THEMES.fair, htSaari2PokeKindFair, '#ff9ec6', 1.8);

// ---------- Maiseman tökättävät kohteet ----------
// Kohde { id, x, y, r, fx, bx, by, s, o }: tehoste piirretään kohtaan (bx, by) koolla s.
// Tökkäyslaskuri kohteittain: joka 3. tökkäys on iso.
var htSaari2PokeSpotN = {};
function htSaari2PokeSpot(list, id, fx, x, y, r, bx, by, s, o) {
  var sp = { id: id, x: x, y: y, r: r, fx: fx, bx: bx, by: by, s: s, o: o || {}, dur: 2.2, big: false };
  sp.sound = function () {
    var n = (htSaari2PokeSpotN[id] || 0) + 1;
    htSaari2PokeSpotN[id] = n;
    sp.big = n % 3 === 0;
    sp.o.n = n;
    htSaari2PokeSnd[fx](sp.big, sp.o);
    spawnSparkles(sp.x, sp.y, sp.big ? 12 : 6, HTSAARI2_COLORS[n % 6]);
  };
  list.push(sp);
}
function htSaari2PokeSpotDraw(c, sp, k, lay) {
  c.save();
  htSaari2PokeFx[sp.fx](c, sp.bx, sp.by, sp.s, k, sp.big, sp.o);
  c.restore();
}

HUB_THEMES.paper.spots = function (w, h, lay) {
  var list = [], i, k, x, y, s = lay.cell, sd = htSaari2Sides(w, lay), by = lay.oy + lay.rows * s * 0.62;
  var sx = sd.L[1] * 0.42 + s * 0.4;
  htSaari2PokeSpot(list, 'sun', 'sun', sx, h * 0.15, s * 1.1, sx, h * 0.15, s * 0.6);
  var cl = [[0.86, 0.1], [0.72, 0.2], [0.15, 0.36], [0.95, 0.32]];
  for (i = 0; i < cl.length; i++) {
    x = w * cl[i][0]; y = h * cl[i][1];
    // Pilvi sataa: rain-tehosteen pilvi on 1,05 s maan yläpuolella
    htSaari2PokeSpot(list, 'cl' + i, 'rain', x, y, s * 0.7, x, y + s * 1.1 * 1.05, s * 1.1, { rnd: i / 4, sky: true });
  }
  for (k = 0; k < 2; k++) {
    var a = k ? sd.R : sd.L, wd = a[1] - a[0];
    if (wd < s) continue;
    for (i = 0; i < 3; i++) {
      x = a[0] + wd * (0.2 + i * 0.32);
      y = by + (i % 2) * s * 1.6 + k * s * 0.6;
      if ((i + k) % 3 === 1) htSaari2PokeSpot(list, 'p' + k + i, 'pencil', x, y - s * 0.8, s * 0.8, x, y, s, { S: s * 1.6, col: k ? '#5fb0ff' : '#ffcf3e', ang: k ? -0.35 : 0.3 });
      else htSaari2PokeSpot(list, 't' + k + i, 'tree', x, y - s * 1.5, s * 0.9, x, y, s, { S: s * 1.7, apples: (i + k) % 2 === 0 });
    }
    x = a[0] + wd * 0.5; y = by + s * 4.2;
    htSaari2PokeSpot(list, 'ink' + k, 'ink', x, y - s * 0.6, s * 0.8, x, y, s * 1.5);
    x = a[0] + wd * (k ? 0.35 : 0.65); y = by - s * 1.6;
    htSaari2PokeSpot(list, 'rc' + k, 'rain', x, y - s * 1.3, s * 0.8, x, y, s * 1.3, { rnd: k });
  }
  return list;
};
HUB_THEMES.paper.spotDraw = htSaari2PokeSpotDraw;

function htSaari2PokeMountainSpots(w, h, lay) {
  var list = [], i, s = lay.cell, sd = htSaari2Sides(w, lay), wd;
  wd = sd.R[1] - sd.R[0];
  if (wd >= s) {
    var lx = sd.R[0] + wd * 0.62, ly = h - s * 0.5;
    htSaari2PokeSpot(list, 'lh', 'lighthouse', lx, ly - s * 1.1, s * 1.3, lx, ly, s * 1.4);
  }
  wd = sd.L[1] - sd.L[0];
  if (wd >= s) {
    var bx = sd.L[0] + wd * 0.4, byy = h - s * 0.6;
    htSaari2PokeSpot(list, 'boat', 'boat', bx, byy - s * 0.4, s * 0.9, bx, byy, s);
  }
  for (i = 0; i < 6; i++) {
    var x = w * (0.06 + hubHash(i, 2) * 0.9), y = h * (0.08 + hubHash(2, i) * 0.22), r = s * (0.12 + (i % 3) * 0.05);
    htSaari2PokeSpot(list, 'b' + i, 'bird', x, y, Math.max(s * 0.6, r * 3), x, y, s, { r: r });
  }
  return list;
}
HUB_THEMES.mine.spots = htSaari2PokeMountainSpots;
HUB_THEMES.mine.spotDraw = htSaari2PokeSpotDraw;
HUB_THEMES.mountain.spots = htSaari2PokeMountainSpots;
HUB_THEMES.mountain.spotDraw = htSaari2PokeSpotDraw;

HUB_THEMES.letters.spots = function (w, h, lay) {
  var list = [], i, k, x, y, s = lay.cell, sd = htSaari2Sides(w, lay), by = lay.oy + lay.rows * s * 0.62;
  var ks = [[0.07, 0.2, 'A'], [0.92, 0.14, 'Ö'], [0.8, 0.34, 'K'], [0.2, 0.42, 'O']];
  for (i = 0; i < ks.length; i++) {
    x = w * ks[i][0]; y = h * ks[i][1];
    htSaari2PokeSpot(list, 'kite' + i, 'kite', x, y, s * 0.6, x, y, s * 0.6, { col: HTSAARI2_COLORS[i * 2 % 6], ch: ks[i][2] });
  }
  for (k = 0; k < 2; k++) {
    var a = k ? sd.R : sd.L, wd = a[1] - a[0];
    if (wd < s) continue;
    x = a[0] + wd * (k ? 0.62 : 0.38); y = by;
    for (i = 0; i < 5; i++) {
      var bh = s * (1.6 + hubHash(i, k) * 0.8), bw = s * 0.42, col = HTSAARI2_COLORS[(i + k * 3) % 6], bx = x + (i - 2.5) * bw;
      htSaari2PokeSpot(list, 'sh' + k + i, 'shelf', bx + bw / 2, y - bh / 2, bw * 0.6, bx + bw / 2, y, s, { bx: bx, bw: bw, bh: bh, col: col, ch: HTSAARI2_ABC.charAt((i * 5 + k * 3) % 24) });
    }
    var tx = a[0] + wd * (k ? 0.22 : 0.78), ty = by + s * 2.6;
    htSaari2PokeSpot(list, 'tw' + k, 'tower', tx, ty - s * 0.7, s * 0.9, tx, ty, s);
    x = a[0] + wd * (k ? 0.7 : 0.3); y = by + s * 4.4;
    htSaari2PokeSpot(list, 'hg' + k, 'hedge', x, y - s * 0.5, s * 0.8, x, y, s * 1.4, { ch: k ? 'Ö' : 'Ä' });
    x = a[0] + wd * (k ? 0.25 : 0.75); y = by + s * 4.7;
    htSaari2PokeSpot(list, 'sg' + k, 'sign', x, y - s * 0.8, s * 0.6, x, y, s * 1.2, { syl: k ? 'PU' : 'KA', col: k ? '#c9a0ff' : '#ff9d5c' });
  }
  return list;
};
HUB_THEMES.letters.spotDraw = htSaari2PokeSpotDraw;

HUB_THEMES.fair.spots = function (w, h, lay) {
  var list = [], i, k, x, y, s = lay.cell, sd = htSaari2Sides(w, lay), hz = lay.oy + lay.rows * s * 0.3, by = lay.oy + lay.rows * s * 0.62;
  var wr = Math.max(s * 1.5, Math.min((sd.R[1] - sd.R[0]) * 0.4, h * 0.2));
  if (sd.R[1] - sd.R[0] > s) {
    x = sd.R[0] + (sd.R[1] - sd.R[0]) * 0.55; y = hz - wr * 0.5;
    htSaari2PokeSpot(list, 'wheel', 'wheel', x, y, wr * 1.05, x, y, wr);
  }
  for (k = 0; k < 2; k++) {
    var a = k ? sd.R : sd.L, wd = a[1] - a[0];
    if (wd < s) continue;
    if (!k) { x = a[0] + wd * 0.5; y = hz + h * 0.1; htSaari2PokeSpot(list, 'car', 'carousel', x, y - s * 0.7, s * 1.3, x, y, s * 1.4); }
    x = a[0] + wd * (k ? 0.25 : 0.2); y = hz + h * 0.16;
    htSaari2PokeSpot(list, 'ft' + k, 'fairtent', x, y - s * 0.6, s * 0.9, x, y, s * 1.1);
    x = a[0] + wd * (k ? 0.7 : 0.3); y = by + s * 1.4;
    htSaari2PokeSpot(list, 'tA' + k, 'tent', x, y - s * 0.9, s * 1.2, x, y, s * 2.2);
    x = a[0] + wd * (k ? 0.3 : 0.75); y = by + s * 4.0;
    htSaari2PokeSpot(list, 'tB' + k, 'tent', x, y - s * 0.75, s * 1.0, x, y, s * 1.8);
    x = a[0] + wd * (k ? 0.75 : 0.25); y = by + s * 6.2;
    htSaari2PokeSpot(list, 'bc' + k, 'balloons', x, y - s * 1.4, s * 0.9, x, y + s * 0.2, s * 1.4, { rnd2: k * 0.4 });
  }
  var bt = [[-s * 0.2, h * 0.02, w * 0.3, h * 0.03], [w * 0.7, h * 0.03, w + s * 0.2, h * 0.02]];
  for (i = 0; i < 2; i++) {
    var o = { x0: bt[i][0], y0: bt[i][1], x1: bt[i][2], y1: bt[i][3], sag: h * 0.07, n: 9, fs: s * 0.26 };
    var mid = htSaari2PokeBuntPt(o.x0, o.y0, o.x1, o.y1, o.sag, 0.5);
    htSaari2PokeSpot(list, 'bt' + i, 'topbunting', mid[0], mid[1], Math.max(s, w * 0.12), mid[0], mid[1], s, o);
  }
  for (i = 0; i < 6; i++) {
    var fx = w * (0.04 + hubHash(i, 11) * 0.92), fy = h * (0.18 + hubHash(11, i) * 0.2);
    if (fx > lay.ox && fx < lay.ox + lay.cols * s) continue;
    htSaari2PokeSpot(list, 'fb' + i, 'pop', fx, fy, s * 0.45, fx, fy, s * 0.5, { col: HTSAARI2_COLORS[i % 6] });
  }
  return list;
};
HUB_THEMES.fair.spotDraw = htSaari2PokeSpotDraw;
