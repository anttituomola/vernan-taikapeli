'use strict';

// Sokkeloteemat (ks. hub-themes.js): Karkkisaari (ranta, karkkimaa, arvoitusten
// torni) ja Kuutamosaari (riutta, yömetsä, pilvet, kuu).

// ---------- Yhteiset palat ----------
// Aaltoviiva (laineet, hiekan väreily)
function htSaari1Wave(b, x, y, w, amp, color, lw) {
  var k;
  b.strokeStyle = color;
  b.lineWidth = lw;
  b.lineCap = 'round';
  b.beginPath();
  b.moveTo(x, y);
  for (k = 1; k <= 4; k++) b.quadraticCurveTo(x + w * (k - 0.5) / 4, y + (k % 2 ? -amp : amp), x + w * k / 4, y);
  b.stroke();
}
// Meritähti: pyöreäkärkinen viisisakarainen tähti ja nystyrät
function htSaari1Starfish(b, x, y, r, color, rot) {
  var i, a, rr;
  b.beginPath();
  for (i = 0; i <= 10; i++) {
    a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5;
    rr = i % 2 ? r * 0.45 : r;
    if (i === 0) b.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else b.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  b.closePath();
  artFillPath(b, color, y - r, y + r, r, {});
  b.fillStyle = 'rgba(255,255,255,0.6)';
  for (i = 0; i < 5; i++) {
    a = (rot || 0) - Math.PI / 2 + i * Math.PI * 0.4;
    b.beginPath(); b.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, Math.max(0.8, r * 0.09), 0, Math.PI * 2); b.fill();
  }
}
// Hehkuva tulikärpänen / tähtipölyhiukkanen
function htSaari1Spark(b, x, y, r, color) {
  artGlow(b, x, y, r * 4, color, 0.55);
  b.fillStyle = '#ffffff';
  b.beginPath(); b.arc(x, y, r * 0.6, 0, Math.PI * 2); b.fill();
}
// Pilven polku pyöreistä palloista (artUnion-ääriviivaa varten)
function htSaari1CloudPath(b, x, y, s) {
  b.beginPath();
  b.arc(x - s * 0.55, y, s * 0.45, 0, Math.PI * 2);
  b.arc(x + s * 0.55, y + s * 0.05, s * 0.4, 0, Math.PI * 2);
  b.arc(x, y - s * 0.25, s * 0.6, 0, Math.PI * 2);
  b.rect(x - s * 0.55, y, s * 1.1, s * 0.4);
}
function htSaari1Cloud(b, x, y, s) {
  artUnion(b, htSaari1CloudPath, x, y, s, y - s * 0.85, y + s * 0.45, '#ffffff', { shadeTo: '#c9c6f0', lineColor: '#8e8ccc' });
  artHighlight(b, x - s * 0.2, y - s * 0.55, s * 0.25, s * 0.1, 0.6);
}

// ---------- Karkkisaari: Ranta (lähtövyöhyke) ----------
function htSaari1Sandcastle(b, x, baseY, s) {
  var sand = '#f2c879', line = '#b07d3a', i, tx;
  artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.16);
  artRoundRect(b, x - s * 0.3, baseY - s * 0.26, s * 0.6, s * 0.26, s * 0.04, sand, { lineColor: line });
  for (i = -1; i <= 1; i += 2) {
    tx = x + i * s * 0.22;
    artRoundRect(b, tx - s * 0.1, baseY - s * 0.48, s * 0.2, s * 0.46, s * 0.04, sand, { lineColor: line });
    b.fillStyle = sand;
    b.fillRect(tx - s * 0.1, baseY - s * 0.54, s * 0.06, s * 0.07);
    b.fillRect(tx + s * 0.04, baseY - s * 0.54, s * 0.06, s * 0.07);
  }
  b.beginPath(); b.arc(x, baseY - s * 0.02, s * 0.08, Math.PI, 0); b.closePath();
  artFillPath(b, '#a5743a', baseY - s * 0.1, baseY, s * 0.08, { line: false });
  // Lippu tornissa
  artLimb(b, x + s * 0.22, baseY - s * 0.5, x + s * 0.22, baseY - s * 0.72, Math.max(1, s * 0.02), '#8a5a30', false);
  b.beginPath(); b.moveTo(x + s * 0.22, baseY - s * 0.72); b.lineTo(x + s * 0.36, baseY - s * 0.67); b.lineTo(x + s * 0.22, baseY - s * 0.62); b.closePath();
  artFillPath(b, '#ff6f9c', baseY - s * 0.72, baseY - s * 0.62, s * 0.06, {});
  drawShell(b, x - s * 0.36, baseY - s * 0.04, s * 0.06, '#ffd6e8');
}
function htSaari1BeachBall(b, x, baseY, s, rnd) {
  var r = s * 0.17, cy = baseY - r, i, cols = ['#ff5f7e', '#ffd23e', '#5fa8ff'];
  artShadow(b, x, baseY, r * 1.2, r * 0.3, 0.18);
  artCircle(b, x, cy, r, '#ffffff', { shadeTo: '#dcd6f0', lineColor: '#8a7aa8' });
  b.save();
  b.beginPath(); b.arc(x, cy, r, 0, Math.PI * 2); b.clip();
  for (i = 0; i < 3; i++) {
    b.fillStyle = cols[i];
    b.beginPath(); b.moveTo(x, cy); b.arc(x, cy, r, rnd * 6 + i * Math.PI * 2 / 3, rnd * 6 + i * Math.PI * 2 / 3 + Math.PI / 3); b.closePath(); b.fill();
  }
  b.restore();
  b.strokeStyle = '#8a7aa8'; b.lineWidth = Math.max(1.2, r * 0.08);
  b.beginPath(); b.arc(x, cy, r, 0, Math.PI * 2); b.stroke();
  artHighlight(b, x - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.18, 0.6);
  // Ämpäri ja lapio vieressä
  var bx = x + s * 0.3;
  b.beginPath(); b.moveTo(bx - s * 0.1, baseY - s * 0.2); b.lineTo(bx + s * 0.1, baseY - s * 0.2); b.lineTo(bx + s * 0.07, baseY); b.lineTo(bx - s * 0.07, baseY); b.closePath();
  artFillPath(b, '#5fd3a0', baseY - s * 0.2, baseY, s * 0.1, {});
  b.strokeStyle = '#2f8a66'; b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.arc(bx, baseY - s * 0.2, s * 0.09, Math.PI, 0); b.stroke();
}
function htSaari1Parasol(b, x, baseY, s, rnd) {
  var col = rnd < 0.5 ? '#ff7bac' : '#ffb84f', top = baseY - s * 0.62, i;
  artShadow(b, x + s * 0.1, baseY, s * 0.45, s * 0.1, 0.16);
  // Pyyhe
  artRoundRect(b, x - s * 0.36, baseY - s * 0.1, s * 0.5, s * 0.12, s * 0.03, '#7fd4ff', { lineColor: '#3a8ab8' });
  b.fillStyle = 'rgba(255,255,255,0.7)';
  b.fillRect(x - s * 0.28, baseY - s * 0.1, s * 0.06, s * 0.12);
  b.fillRect(x - s * 0.08, baseY - s * 0.1, s * 0.06, s * 0.12);
  artLimb(b, x + s * 0.02, baseY, x + s * 0.06, top, Math.max(1.5, s * 0.035), '#ffffff', '#9a8ab0');
  b.beginPath();
  b.moveTo(x + s * 0.06 - s * 0.4, top + s * 0.12);
  b.quadraticCurveTo(x + s * 0.06, top - s * 0.3, x + s * 0.06 + s * 0.4, top + s * 0.12);
  for (i = 3; i >= 0; i--) b.quadraticCurveTo(x + s * 0.06 + s * (i * 0.2 - 0.3), top + s * 0.02, x + s * 0.06 + s * (i * 0.2 - 0.4), top + s * 0.12);
  b.closePath();
  artFillPath(b, col, top - s * 0.18, top + s * 0.12, s * 0.4, {});
  b.save(); b.clip();
  b.fillStyle = 'rgba(255,255,255,0.75)';
  b.beginPath(); b.moveTo(x + s * 0.06, top - s * 0.2); b.lineTo(x - s * 0.14, top + s * 0.14); b.lineTo(x + s * 0.02, top + s * 0.14); b.closePath(); b.fill();
  b.beginPath(); b.moveTo(x + s * 0.06, top - s * 0.2); b.lineTo(x + s * 0.18, top + s * 0.14); b.lineTo(x + s * 0.32, top + s * 0.14); b.closePath(); b.fill();
  b.restore();
}

HUB_THEMES.beach = {
  sky: ['#86d0ff', '#fff1d6'],
  ground: ['#f7e2ac', '#f0d494'],
  earth: '#d49a5a',
  path: ['#d29a5c', '#fff4d8'],
  backdrop: function (b, w, h, lay) {
    var i, x, y, hz = lay.oy + lay.rows * lay.cell * 0.25, slabL = lay.ox - lay.cell, slabR = lay.ox + (lay.cols + 1) * lay.cell;
    // Aurinko ja pilvet
    artGlow(b, w * 0.1, h * 0.1, h * 0.16, '#fff4c8', 0.7);
    artCircle(b, w * 0.1, h * 0.1, h * 0.05, '#ffe066', { lineColor: '#f0a830', hi: 0.4 });
    hubThemeClouds(b, w, h, 7);
    // Kaukainen karkkisaari horisontissa
    b.fillStyle = '#ffc6e0';
    b.beginPath(); b.moveTo(w * 0.72, hz); b.quadraticCurveTo(w * 0.83, hz - h * 0.11, w * 0.97, hz); b.closePath(); b.fill();
    b.fillStyle = '#ffb0d4';
    b.beginPath(); b.moveTo(w * 0.8, hz); b.quadraticCurveTo(w * 0.88, hz - h * 0.07, w * 1.02, hz); b.closePath(); b.fill();
    for (i = 0; i < 3; i++) {
      x = w * (0.8 + i * 0.05);
      b.fillStyle = '#fff'; b.fillRect(x - 1, hz - h * (0.09 + i % 2 * 0.02), 2, h * 0.04);
      b.fillStyle = ['#ff8fb8', '#ffd27a', '#a8e0ff'][i];
      b.beginPath(); b.arc(x, hz - h * (0.1 + i % 2 * 0.02), h * 0.014, 0, Math.PI * 2); b.fill();
    }
    // Meri
    var sg = b.createLinearGradient(0, hz, 0, h);
    sg.addColorStop(0, '#5cc4ea');
    sg.addColorStop(1, '#2f9fd6');
    b.fillStyle = sg;
    b.fillRect(0, hz, w, h - hz);
    for (i = 0; i < 26; i++) {
      x = hubHash(i, 2) * w; y = hz + h * 0.03 + hubHash(2, i) * (h - hz) * 0.8;
      htSaari1Wave(b, x, y, h * 0.05, h * 0.006, 'rgba(255,255,255,0.45)', Math.max(1.5, h * 0.004));
    }
    // Purjevene
    x = w * 0.12; y = hz + h * 0.12;
    b.beginPath(); b.moveTo(x - h * 0.04, y); b.lineTo(x + h * 0.04, y); b.lineTo(x + h * 0.025, y + h * 0.018); b.lineTo(x - h * 0.025, y + h * 0.018); b.closePath();
    artFillPath(b, '#c0703c', y, y + h * 0.018, h * 0.03, {});
    b.beginPath(); b.moveTo(x, y - h * 0.002); b.lineTo(x, y - h * 0.07); b.lineTo(x + h * 0.035, y - h * 0.008); b.closePath();
    artFillPath(b, '#ffffff', y - h * 0.07, y, h * 0.03, { shadeTo: '#e0dcf4', lineColor: '#8a7aa8' });
    // Hiekkarannat laatan sivuilla palmuineen
    for (i = 0; i < 2; i++) {
      var sx = i ? w : 0;
      b.beginPath(); if (b.ellipse) b.ellipse(sx, h * 0.95, w * 0.26, h * 0.32, 0, 0, Math.PI * 2);
      artFillPath(b, '#f7e2ac', h * 0.63, h, h * 0.2, { line: false });
      htSaari1Wave(b, sx + (i ? -w * 0.26 : w * 0.02), h * 0.66, w * 0.24, h * 0.01, 'rgba(255,255,255,0.7)', Math.max(2, h * 0.006));
    }
    for (i = 0; i < 8; i++) {
      x = i < 4 ? w * (0.02 + i * 0.05) : w * (0.98 - (i - 4) * 0.05);
      if (x > slabL && x < slabR) continue;
      y = h * (0.8 + (i % 3) * 0.06);
      if (i % 2) drawPalm(b, x, y, h * 0.11);
      else htSaari1Starfish(b, x, y - h * 0.01, h * 0.016, '#ff9a6b', i);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.35) htSaari1Wave(b, x + s * 0.15, y + s * (0.3 + rnd2 * 0.4), s * 0.6, s * 0.04, 'rgba(190,140,70,0.3)', Math.max(1, s * 0.03));
    else if (rnd < 0.5) drawShell(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.3 + rnd * 0.5), s * 0.06, rnd2 < 0.5 ? '#ffd6e8' : '#ffe9b8');
    else if (rnd < 0.6) htSaari1Starfish(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.6, s * 0.07, rnd2 < 0.5 ? '#ff9a6b' : '#ff7bac', rnd);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.38) drawPalm(b, x, baseY, s * (0.72 + rnd2 * 0.2));
    else if (rnd < 0.58) htSaari1Sandcastle(b, x, baseY, s);
    else if (rnd < 0.76) htSaari1BeachBall(b, x - s * 0.1, baseY, s, rnd2);
    else htSaari1Parasol(b, x, baseY, s, rnd2);
  }
};

// ---------- Karkkisaari: Karkkimaa ----------
function htSaari1Gumdrop(b, x, baseY, s, color) {
  var i;
  b.beginPath();
  b.moveTo(x - s, baseY);
  b.bezierCurveTo(x - s, baseY - s * 1.5, x + s, baseY - s * 1.5, x + s, baseY);
  b.closePath();
  artFillPath(b, color, baseY - s * 1.1, baseY, s, { hi: 0.4 });
  artHighlight(b, x - s * 0.4, baseY - s * 0.7, s * 0.22, s * 0.12, 0.5);
  b.fillStyle = 'rgba(255,255,255,0.75)';
  for (i = 0; i < 5; i++) b.fillRect(x + (hubHash(i, s | 0) - 0.5) * s * 1.2, baseY - s * (0.2 + hubHash(s | 0, i) * 0.7), Math.max(1, s * 0.08), Math.max(1, s * 0.08));
}
function htSaari1Cane(b, x, baseY, s, flip) {
  var hx = x + flip * s * 0.12, ty = baseY - s * 0.6;
  b.lineCap = 'round';
  b.beginPath();
  b.moveTo(x, baseY);
  b.lineTo(x, ty);
  b.arc(hx, ty, s * 0.12, Math.PI, flip > 0 ? Math.PI * 2 : Math.PI, flip < 0);
  b.lineTo(x + flip * s * 0.24, ty + s * 0.08);
  b.strokeStyle = '#b8345a'; b.lineWidth = s * 0.11; b.stroke();
  b.strokeStyle = '#ffffff'; b.lineWidth = s * 0.075; b.stroke();
  b.setLineDash([s * 0.06, s * 0.06]);
  b.strokeStyle = '#ff4f6e'; b.stroke();
  b.setLineDash([]);
}
function htSaari1Cupcake(b, x, baseY, s, color) {
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.16);
  b.beginPath(); b.moveTo(x - s * 0.2, baseY - s * 0.24); b.lineTo(x + s * 0.2, baseY - s * 0.24); b.lineTo(x + s * 0.15, baseY); b.lineTo(x - s * 0.15, baseY); b.closePath();
  artFillPath(b, '#7fd4ff', baseY - s * 0.24, baseY, s * 0.2, {});
  b.strokeStyle = 'rgba(255,255,255,0.6)'; b.lineWidth = Math.max(1, s * 0.02);
  var i;
  for (i = -2; i <= 2; i++) { b.beginPath(); b.moveTo(x + i * s * 0.07, baseY - s * 0.22); b.lineTo(x + i * s * 0.055, baseY - s * 0.02); b.stroke(); }
  artCircle(b, x - s * 0.12, baseY - s * 0.3, s * 0.12, color, {});
  artCircle(b, x + s * 0.12, baseY - s * 0.3, s * 0.12, color, {});
  artCircle(b, x, baseY - s * 0.4, s * 0.15, color, { hi: 0.4 });
  artCircle(b, x, baseY - s * 0.58, s * 0.06, '#ff3f5e', { hi: 0.5 });
}

HUB_THEMES.candy = {
  sky: ['#ffc6e6', '#fff0f6'],
  ground: ['#ffc4df', '#ffb2d6'],
  earth: '#c47a9a',
  path: ['#e08ab0', '#fff6fb'],
  floor: function (b, x, y, s, rnd, rnd2) {
    var i, px, py, cols = ['#ff5f7e', '#ffd23e', '#6fd66f', '#5fa8ff', '#b678ff', '#ffffff'];
    b.lineCap = 'round';
    b.lineWidth = Math.max(1.5, s * 0.045);
    for (i = 0; i < 4; i++) {
      px = x + s * hubHash(i + 11, rnd * 97 | 0);
      py = y + s * hubHash(rnd2 * 89 | 0, i + 5);
      b.strokeStyle = cols[(i + (rnd * 6 | 0)) % 6];
      b.beginPath(); b.moveTo(px, py); b.lineTo(px + s * 0.06 * Math.cos(i * 1.7 + rnd * 9), py + s * 0.06 * Math.sin(i * 1.7 + rnd * 9)); b.stroke();
    }
    if (rnd < 0.18) {
      // Kääreeseen kääritty karamelli
      px = x + s * (0.25 + rnd2 * 0.5); py = y + s * 0.6;
      b.beginPath(); b.moveTo(px - s * 0.06, py); b.lineTo(px - s * 0.13, py - s * 0.05); b.lineTo(px - s * 0.13, py + s * 0.05); b.closePath();
      b.moveTo(px + s * 0.06, py); b.lineTo(px + s * 0.13, py - s * 0.05); b.lineTo(px + s * 0.13, py + s * 0.05); b.closePath();
      artFillPath(b, '#ffd23e', py - s * 0.05, py + s * 0.05, s * 0.05, {});
      artBlob(b, px, py, s * 0.07, s * 0.05, '#ff7bac', { hi: 0.5 });
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.4) drawLollipopTree(b, x, baseY, s * (0.62 + rnd2 * 0.14), CANDY_COLORS[Math.floor(rnd2 * CANDY_COLORS.length)], rnd * 6);
    else if (rnd < 0.62) {
      artShadow(b, x, baseY, s * 0.5, s * 0.09, 0.15);
      htSaari1Gumdrop(b, x - s * 0.2, baseY, s * 0.27, CANDY_COLORS[Math.floor(rnd2 * 5)]);
      htSaari1Gumdrop(b, x + s * 0.24, baseY, s * 0.21, CANDY_COLORS[Math.floor(rnd2 * 5 + 2) % 5]);
      htSaari1Gumdrop(b, x + s * 0.02, baseY + s * 0.03, s * 0.16, CANDY_COLORS[Math.floor(rnd2 * 5 + 4) % 5]);
    } else if (rnd < 0.8) {
      artShadow(b, x, baseY, s * 0.35, s * 0.07, 0.15);
      htSaari1Cane(b, x - s * 0.2, baseY, s * 1.35, 1);
      htSaari1Cane(b, x + s * 0.26, baseY, s * 1.05, -1);
    } else htSaari1Cupcake(b, x, baseY, s * 1.45, rnd2 < 0.5 ? '#fff0f6' : '#ffd0e6');
  }
};

// ---------- Karkkisaari: Arvoitusten torni ----------
function htSaari1Rune(b, x, y, r, kind, color) {
  artGlow(b, x, y, r * 2.4, color, 0.6);
  b.strokeStyle = color;
  b.lineWidth = Math.max(1.5, r * 0.28);
  b.lineCap = 'round'; b.lineJoin = 'round';
  b.beginPath();
  if (kind === 0) { b.arc(x, y - r * 0.25, r * 0.45, Math.PI * 1.05, Math.PI * 2.3); b.lineTo(x, y + r * 0.3); b.moveTo(x, y + r * 0.75); b.lineTo(x, y + r * 0.76); }
  else if (kind === 1) { b.moveTo(x, y - r); b.lineTo(x + r * 0.8, y + r * 0.6); b.lineTo(x - r * 0.8, y + r * 0.6); b.closePath(); }
  else { b.moveTo(x - r * 0.6, y - r * 0.6); b.lineTo(x + r * 0.6, y + r * 0.6); b.moveTo(x + r * 0.6, y - r * 0.6); b.lineTo(x - r * 0.6, y + r * 0.6); }
  b.stroke();
}
function htSaari1Pillar(b, x, baseY, s, rnd) {
  var st = '#d6ccf6', line = '#5a4a8f', h = s * (0.85 + rnd * 0.25);
  artShadow(b, x, baseY, s * 0.36, s * 0.08, 0.22);
  artRoundRect(b, x - s * 0.25, baseY - s * 0.13, s * 0.5, s * 0.15, s * 0.04, artShade(st, -0.1), { lineColor: line });
  artRoundRect(b, x - s * 0.18, baseY - h, s * 0.36, h - s * 0.1, s * 0.05, st, { lineColor: line });
  b.strokeStyle = 'rgba(90,74,143,0.18)';
  b.lineWidth = Math.max(1, s * 0.03);
  b.beginPath(); b.moveTo(x - s * 0.08, baseY - h + s * 0.06); b.lineTo(x - s * 0.08, baseY - s * 0.16); b.stroke();
  artRoundRect(b, x - s * 0.24, baseY - h - s * 0.1, s * 0.48, s * 0.13, s * 0.04, artShade(st, 0.15), { lineColor: line });
  htSaari1Rune(b, x, baseY - h * 0.55, s * 0.1, Math.floor(rnd * 30) % 3, ['#3fd0f0', '#ffb820', '#ff6fd0'][Math.floor(rnd * 17) % 3]);
}
function htSaari1Hedge(b, x, baseY, s, rnd) {
  var leaf = '#5cc070', line = '#23663a', i;
  artShadow(b, x, baseY, s * 0.55, s * 0.09, 0.2);
  artRoundRect(b, x - s * 0.5, baseY - s * 0.55, s * 1.0, s * 0.57, s * 0.16, leaf, { lineColor: line });
  b.fillStyle = 'rgba(255,255,255,0.2)';
  for (i = 0; i < 7; i++) { b.beginPath(); b.arc(x + (i - 3) * s * 0.13, baseY - s * 0.44 + (i % 2) * s * 0.08, s * 0.05, 0, Math.PI * 2); b.fill(); }
  b.fillStyle = 'rgba(20,80,40,0.18)';
  for (i = 0; i < 5; i++) { b.beginPath(); b.arc(x + (i - 2) * s * 0.18, baseY - s * 0.14 + (i % 2) * s * 0.06, s * 0.045, 0, Math.PI * 2); b.fill(); }
  if (rnd < 0.5) {
    // Topiaaripallo päällä
    artLimb(b, x, baseY - s * 0.55, x, baseY - s * 0.68, s * 0.06, '#8a5a30', '#4a2e14');
    artCircle(b, x, baseY - s * 0.8, s * 0.17, leaf, { lineColor: line, hi: 0.3 });
  } else {
    drawFlower(b, x - s * 0.24, baseY - s * 0.38, s * 0.055, '#ff9ee8');
    drawFlower(b, x + s * 0.06, baseY - s * 0.25, s * 0.05, '#ffe27a');
    drawFlower(b, x + s * 0.3, baseY - s * 0.4, s * 0.05, '#ffffff');
  }
}
function htSaari1GemStand(b, x, baseY, s, rnd) {
  var st = '#d6ccf6', line = '#5a4a8f';
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.2);
  b.beginPath(); b.moveTo(x - s * 0.22, baseY); b.lineTo(x - s * 0.11, baseY - s * 0.42); b.lineTo(x + s * 0.11, baseY - s * 0.42); b.lineTo(x + s * 0.22, baseY); b.closePath();
  artFillPath(b, st, baseY - s * 0.42, baseY, s * 0.2, { lineColor: line });
  artRoundRect(b, x - s * 0.19, baseY - s * 0.5, s * 0.38, s * 0.1, s * 0.04, artShade(st, 0.15), { lineColor: line });
  drawGem(b, x, baseY - s * 0.68, s * 0.17, GEM_COLORS[Math.floor(rnd * GEM_COLORS.length)]);
}
// Pikkutorni suippokattoineen ja kysymysmerkkilippuineen
function htSaari1Turret(b, x, baseY, s, rnd) {
  var st = '#e4dcfa', line = '#5a4a8f', roof = ['#8a5cd0', '#ff7bac', '#5fa8ff'][Math.floor(rnd * 3)], top = baseY - s * 0.62;
  artShadow(b, x, baseY, s * 0.34, s * 0.08, 0.22);
  artRoundRect(b, x - s * 0.2, top, s * 0.4, s * 0.64, s * 0.05, st, { lineColor: line });
  b.beginPath(); b.moveTo(x - s * 0.27, top + s * 0.02); b.lineTo(x + s * 0.27, top + s * 0.02); b.lineTo(x, top - s * 0.34); b.closePath();
  artFillPath(b, roof, top - s * 0.34, top, s * 0.27, {});
  b.beginPath(); b.moveTo(x - s * 0.08, baseY); b.lineTo(x - s * 0.08, baseY - s * 0.18); b.arc(x, baseY - s * 0.18, s * 0.08, Math.PI, 0); b.lineTo(x + s * 0.08, baseY); b.closePath();
  artFillPath(b, '#7a5ab0', baseY - s * 0.26, baseY, s * 0.08, { line: false });
  artGlow(b, x, top + s * 0.18, s * 0.16, '#ffe27a', 0.6);
  artRoundRect(b, x - s * 0.05, top + s * 0.11, s * 0.1, s * 0.14, s * 0.05, '#ffe9a0', { lineColor: line });
}

HUB_THEMES.tower = {
  ground: ['#b9ace6', '#ab9edd'],
  earth: '#6e5ca8',
  path: ['#7a68b8', '#f1ebff'],
  arch: '#efe4f7',
  floor: function (b, x, y, s, rnd, rnd2) {
    // Epäsäännölliset laattakivet
    var i, px, py;
    for (i = 0; i < 2; i++) {
      px = x + s * (0.2 + hubHash(i + 3, rnd * 50 | 0) * 0.6);
      py = y + s * (0.25 + hubHash(rnd2 * 50 | 0, i + 3) * 0.55);
      artBlob(b, px, py, s * (0.13 + rnd * 0.05), s * 0.08, '#c8bdf0', { line: false, flat: true });
      b.strokeStyle = 'rgba(90,74,143,0.2)'; b.lineWidth = Math.max(1, s * 0.02);
      b.beginPath(); if (b.ellipse) b.ellipse(px, py, s * (0.13 + rnd * 0.05), s * 0.08, 0, 0, Math.PI); b.stroke();
    }
    if (rnd < 0.15) htSaari1Rune(b, x + s * (0.25 + rnd2 * 0.5), y + s * 0.55, s * 0.06, Math.floor(rnd2 * 3), '#ffffff');
    else if (rnd < 0.4) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.85, s, '#7fbf88');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.3) htSaari1Pillar(b, x, baseY, s, rnd2);
    else if (rnd < 0.62) htSaari1Hedge(b, x, baseY, s, rnd2);
    else if (rnd < 0.8) htSaari1Turret(b, x, baseY, s, rnd2);
    else htSaari1GemStand(b, x, baseY, s, rnd2);
  },
  // Pieni arvoitustorni: pyöreä ikkuna kehystää kentän kuvan
  landmark: function (c, x, y, s, room, st) {
    var stone = '#d8cef5', line = '#4a3a80', col = room.color || '#8a5cb8', base = y + s * 0.36, i;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.24);
    // Torniruumis
    artRoundRect(c, x - s * 0.36, y - s * 0.42, s * 0.72, base - y + s * 0.42, s * 0.06, stone, { lineColor: line });
    c.fillStyle = stone;
    for (i = 0; i < 4; i++) {
      roundRect(c, x - s * 0.36 + i * s * 0.2, y - s * 0.52, s * 0.12, s * 0.12, s * 0.02);
      artFillPath(c, stone, y - s * 0.52, y - s * 0.4, s * 0.06, { lineColor: line });
    }
    // Kivisaumat
    c.strokeStyle = 'rgba(74,58,128,0.25)';
    c.lineWidth = Math.max(1, s * 0.02);
    for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - s * 0.34, base - s * (0.06 + i * 0.28)); c.lineTo(x + s * 0.34, base - s * (0.06 + i * 0.28)); c.stroke(); }
    // Lippu
    artLimb(c, x + s * 0.24, y - s * 0.52, x + s * 0.24, y - s * 0.82, Math.max(1.2, s * 0.025), '#8a5a30', false);
    c.beginPath(); c.moveTo(x + s * 0.24, y - s * 0.82); c.lineTo(x + s * 0.44, y - s * 0.75); c.lineTo(x + s * 0.24, y - s * 0.68); c.closePath();
    artFillPath(c, st.cleared ? '#ffd23e' : col, y - s * 0.82, y - s * 0.68, s * 0.08, {});
    // Pyöreä ikkuna kentän värisellä kehyksellä
    if (st.next) artGlow(c, x, y, s * 0.5, '#fff0a0', 0.4 + Math.sin(globalT * 4) * 0.15);
    artCircle(c, x, y - s * 0.02, s * 0.3, col, { lineColor: artShade(col, -0.45) });
    var g = c.createRadialGradient(x, y - s * 0.06, s * 0.02, x, y, s * 0.25);
    g.addColorStop(0, st.cleared ? '#fff8d0' : artShade(col, 0.8));
    g.addColorStop(1, st.cleared ? '#ffd86a' : artShade(col, 0.45));
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y - s * 0.02, s * 0.25, 0, Math.PI * 2); c.fill();
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

// ---------- Kuutamosaari: Riutta (lähtövyöhyke) ----------
function htSaari1Anemone(b, x, baseY, s, color) {
  var i, a, tx, ty;
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.16);
  for (i = 0; i < 7; i++) {
    a = -Math.PI / 2 + (i - 3) * 0.32;
    tx = x + Math.cos(a) * s * 0.3; ty = baseY - s * 0.14 + Math.sin(a) * s * 0.3;
    artLimb(b, x + (i - 3) * s * 0.03, baseY - s * 0.12, tx, ty, s * 0.06, color, artShade(color, -0.45));
    artCircle(b, tx, ty, s * 0.04, artShade(color, 0.4), { line: false });
  }
  artBlob(b, x, baseY - s * 0.07, s * 0.15, s * 0.09, '#8a5ab8', { hi: 0.3 });
}
function htSaari1Rock(b, x, baseY, s, color) {
  artShadow(b, x, baseY, s * 0.32, s * 0.07, 0.18);
  artBlob(b, x, baseY - s * 0.12, s * 0.28, s * 0.16, color, { hi: 0.3 });
  artBlob(b, x + s * 0.18, baseY - s * 0.07, s * 0.14, s * 0.09, artShade(color, -0.08), {});
}

HUB_THEMES.reef = {
  sky: ['#232a86', '#7d6ad8'],
  ground: ['#4ab4da', '#3fa6d0'],
  earth: '#5a5aa0',
  path: ['#d0a04e', '#fff3c8'],
  arch: '#e8f4ff',
  backdrop: function (b, w, h, lay) {
    var i, x, y, hz = lay.oy + lay.rows * lay.cell * 0.3, slabL = lay.ox - lay.cell, slabR = lay.ox + (lay.cols + 1) * lay.cell;
    // Tähdet ja ystävällinen kuu
    for (i = 0; i < 46; i++) {
      x = hubHash(i, 9) * w; y = hubHash(9, i) * hz * 0.95;
      if (i % 6 === 0) drawStar(b, x, y, h * 0.008, i, 0.4);
      else { b.fillStyle = 'rgba(255,255,240,' + (0.5 + hubHash(i, i) * 0.5) + ')'; b.beginPath(); b.arc(x, y, h * (0.002 + hubHash(i, 4) * 0.002), 0, Math.PI * 2); b.fill(); }
    }
    var mx = w * 0.86, my = h * 0.13, mr = h * 0.06;
    artGlow(b, mx, my, mr * 3.2, '#fff4c8', 0.45);
    artCircle(b, mx, my, mr, '#fff6d2', { shadeTo: '#f0dc9a', lineColor: '#c8a858', hi: 0.4 });
    artCircle(b, mx + mr * 0.3, my + mr * 0.25, mr * 0.18, '#f0dc9a', { line: false });
    artCircle(b, mx - mr * 0.35, my - mr * 0.1, mr * 0.12, '#f0dc9a', { line: false });
    b.fillStyle = 'rgba(255,255,255,0.35)';
    for (i = 0; i < 4; i++) cloudShape(b, w * (0.08 + i * 0.27), h * (0.07 + (i % 2) * 0.06), h * 0.016);
    // Kaukaiset saaret ja meri
    b.fillStyle = '#3c3c9a';
    b.beginPath(); b.moveTo(w * 0.02, hz); b.quadraticCurveTo(w * 0.12, hz - h * 0.09, w * 0.25, hz); b.closePath(); b.fill();
    for (i = 0; i < 4; i++) drawPine(b, w * (0.07 + i * 0.04), hz - h * (0.03 + (i % 2) * 0.02), h * 0.05, '#34358c', true);
    var sg = b.createLinearGradient(0, hz, 0, h);
    sg.addColorStop(0, '#3a62d0');
    sg.addColorStop(1, '#2440a0');
    b.fillStyle = sg;
    b.fillRect(0, hz, w, h - hz);
    // Kuun kimallus vedessä
    for (i = 0; i < 9; i++) {
      b.fillStyle = 'rgba(255,240,190,' + (0.55 - i * 0.04) + ')';
      roundRect(b, mx - h * (0.05 - i * 0.003) + (i % 2) * h * 0.02, hz + h * (0.015 + i * 0.028), h * (0.1 - i * 0.006), h * 0.008, h * 0.004); b.fill();
    }
    for (i = 0; i < 22; i++) {
      x = hubHash(i, 5) * w; y = hz + h * 0.04 + hubHash(5, i) * (h - hz) * 0.85;
      htSaari1Wave(b, x, y, h * 0.045, h * 0.005, 'rgba(190,210,255,0.3)', Math.max(1.5, h * 0.004));
    }
    // Rannat laatan sivuilla: hiekkaa, korallia ja simpukoita
    for (i = 0; i < 2; i++) {
      b.beginPath(); if (b.ellipse) b.ellipse(i ? w : 0, h * 0.97, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
      artFillPath(b, '#8f8acb', h * 0.69, h, h * 0.2, { line: false });
    }
    for (i = 0; i < 8; i++) {
      x = i < 4 ? w * (0.025 + i * 0.05) : w * (0.975 - (i - 4) * 0.05);
      if (x > slabL && x < slabR) continue;
      y = h * (0.83 + (i % 3) * 0.05);
      if (i % 3 === 0) drawCoral(b, x, y, h * 0.03, i < 4 ? '#ff7a9c' : '#ffb46b');
      else if (i % 3 === 1) drawReefPearl(b, x, y - h * 0.02, h * 0.012);
      else htSaari1Starfish(b, x, y - h * 0.01, h * 0.016, '#ffb46b', i);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    // Valon väreily ja kuplat
    htSaari1Wave(b, x + s * 0.12, y + s * (0.25 + rnd * 0.5), s * 0.5, s * 0.04, 'rgba(255,255,255,0.28)', Math.max(1, s * 0.03));
    if (rnd2 < 0.3) {
      b.strokeStyle = 'rgba(255,255,255,0.6)'; b.lineWidth = Math.max(1, s * 0.02);
      b.beginPath(); b.arc(x + s * 0.75, y + s * 0.3, s * 0.05, 0, Math.PI * 2); b.stroke();
      b.beginPath(); b.arc(x + s * 0.68, y + s * 0.18, s * 0.03, 0, Math.PI * 2); b.stroke();
    } else if (rnd2 < 0.42) htSaari1Starfish(b, x + s * (0.2 + rnd * 0.6), y + s * 0.7, s * 0.07, '#ffb46b', rnd2 * 9);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var pinks = ['#ff7a9c', '#ffb46b', '#c98aff'];
    if (rnd < 0.32) drawCoral(b, x, baseY, s * (0.36 + rnd2 * 0.1), pinks[Math.floor(rnd2 * 3)]);
    else if (rnd < 0.52) {
      drawKelp(b, x - s * 0.15, baseY, s * (0.7 + rnd2 * 0.2));
      drawKelp(b, x + s * 0.15, baseY, s * 0.55);
    } else if (rnd < 0.74) htSaari1Anemone(b, x, baseY, s * 1.4, rnd2 < 0.5 ? '#ff9ecf' : '#7fe0c0');
    else {
      htSaari1Rock(b, x, baseY, s * 1.3, '#8a90d0');
      htSaari1Starfish(b, x - s * 0.04, baseY - s * 0.3, s * 0.13, rnd2 < 0.5 ? '#ff9a6b' : '#ffd23e', rnd2 * 4);
      if (rnd2 < 0.5) drawReefPearl(b, x + s * 0.3, baseY - s * 0.08, s * 0.05);
    }
  }
};

// ---------- Kuutamosaari: Yömetsä ----------
function htSaari1Lantern(b, x, baseY, s) {
  var ly = baseY - s * 0.52;
  artShadow(b, x, baseY, s * 0.18, s * 0.05, 0.2);
  artLimb(b, x, baseY, x, ly - s * 0.06, s * 0.05, '#5a4a6a', '#2a2036');
  artLimb(b, x, ly - s * 0.06, x + s * 0.14, ly - s * 0.06, s * 0.035, '#5a4a6a', '#2a2036');
  artGlow(b, x + s * 0.14, ly + s * 0.08, s * 0.38, '#ffd86a', 0.6);
  artRoundRect(b, x + s * 0.07, ly, s * 0.14, s * 0.17, s * 0.04, '#ffe9a0', { lineColor: '#8a5a20' });
  b.fillStyle = '#fff8dc';
  b.beginPath(); b.arc(x + s * 0.14, ly + s * 0.09, s * 0.035, 0, Math.PI * 2); b.fill();
  artRoundRect(b, x + s * 0.06, ly - s * 0.03, s * 0.16, s * 0.04, s * 0.02, '#5a4a6a', { lineColor: '#2a2036' });
}
function htSaari1GlowShroom(b, x, baseY, s, color) {
  artGlow(b, x, baseY - s * 0.6, s * 1.6, color, 0.45);
  artRoundRect(b, x - s * 0.12, baseY - s * 0.5, s * 0.24, s * 0.5, s * 0.1, '#eef0ff', { lineColor: '#6a6aa8' });
  b.beginPath(); b.arc(x, baseY - s * 0.45, s * 0.42, Math.PI, 0); b.closePath();
  artFillPath(b, color, baseY - s * 0.87, baseY - s * 0.45, s * 0.42, {});
  b.fillStyle = 'rgba(255,255,255,0.75)';
  b.beginPath(); b.arc(x - s * 0.16, baseY - s * 0.6, s * 0.07, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + s * 0.14, baseY - s * 0.7, s * 0.06, 0, Math.PI * 2); b.fill();
}

HUB_THEMES.nightwood = {
  ground: ['#4166a4', '#3a5e9a'],
  earth: '#3f3f7a',
  path: ['#d0a04e', '#fff3c8'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.45) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.35 + rnd * 0.5), s, '#5f86c4');
    if (rnd2 < 0.25) htSaari1Spark(b, x + s * (0.2 + rnd * 0.6), y + s * (0.2 + rnd2 * 1.2), s * 0.03, '#e6ff9a');
    else if (rnd2 < 0.35) drawFlower(b, x + s * (0.2 + rnd * 0.6), y + s * 0.7, s * 0.04, '#c9a0ff');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.5) {
      drawPine(b, x, baseY, s * (0.95 + rnd2 * 0.25), rnd2 < 0.5 ? '#3a6aae' : '#2f5c9e');
      htSaari1Spark(b, x + s * (rnd2 - 0.5) * 0.7, baseY - s * (0.4 + rnd * 0.6), s * 0.03, '#e6ff9a');
    } else if (rnd < 0.72) {
      drawPine(b, x - s * 0.2, baseY, s * 0.8, '#3a6aae');
      htSaari1Lantern(b, x + s * 0.1, baseY, s * 1.3);
    } else {
      artShadow(b, x, baseY, s * 0.35, s * 0.07, 0.2);
      htSaari1GlowShroom(b, x - s * 0.14, baseY, s * 0.5, rnd2 < 0.5 ? '#7fd4ff' : '#ff9ee8');
      htSaari1GlowShroom(b, x + s * 0.24, baseY, s * 0.34, rnd2 < 0.5 ? '#c9a0ff' : '#9fffd8');
    }
  }
};

// ---------- Kuutamosaari: Pilvet ----------
HUB_THEMES.clouds = {
  density: 0.8,
  ground: ['#8c9ce6', '#8293de'],
  earth: '#6a6ab8',
  path: ['#d0a04e', '#fff3c8'],
  floor: function (b, x, y, s, rnd, rnd2) {
    b.fillStyle = 'rgba(255,255,255,0.35)';
    if (rnd < 0.4) cloudShape(b, x + s * (0.3 + rnd2 * 0.4), y + s * 0.7, s * 0.06);
    if (rnd2 < 0.35) drawStar(b, x + s * (0.2 + rnd * 0.6), y + s * (0.2 + rnd2), s * 0.05, rnd, 0.4);
    else if (rnd2 < 0.6) { b.fillStyle = 'rgba(255,255,255,0.8)'; b.beginPath(); b.arc(x + s * rnd, y + s * rnd2, s * 0.02, 0, Math.PI * 2); b.fill(); }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    artShadow(b, x, baseY, s * 0.5, s * 0.09, 0.16);
    s *= 0.85 + rnd2 * 0.25;
    if (rnd < 0.35) {
      // Pilvipino
      htSaari1Cloud(b, x, baseY - s * 0.18, s * 0.4);
      htSaari1Cloud(b, x + (rnd2 - 0.5) * s * 0.25, baseY - s * 0.55, s * 0.27);
      drawStar(b, x + s * 0.34, baseY - s * 0.75, s * 0.09, rnd2, 0.6);
    } else if (rnd < 0.7 || rnd2 < 0.6) {
      // Pilvi, jonka päällä tähti tikussa
      artLimb(b, x + s * 0.05, baseY - s * 0.35, x + s * 0.05, baseY - s * 0.68, Math.max(1.5, s * 0.035), '#ffffff', '#8e8ccc');
      drawStar(b, x + s * 0.05, baseY - s * 0.74, s * 0.14, 0, 0.7);
      htSaari1Cloud(b, x, baseY - s * 0.2, s * 0.4);
    } else {
      // Pieni sateenkaari pilvien välissä
      var i, cols = ['#ff7bac', '#ffd23e', '#7fe0a0', '#7fd4ff'];
      b.lineCap = 'butt';
      for (i = 0; i < 4; i++) {
        b.strokeStyle = cols[i]; b.lineWidth = s * 0.065;
        b.beginPath(); b.arc(x, baseY - s * 0.16, s * (0.44 - i * 0.065), Math.PI, 0); b.stroke();
      }
      htSaari1Cloud(b, x - s * 0.36, baseY - s * 0.14, s * 0.22);
      htSaari1Cloud(b, x + s * 0.36, baseY - s * 0.14, s * 0.22);
    }
  }
};

// ---------- Kuutamosaari: Kuu ----------
HUB_THEMES.moon = {
  ground: ['#c4bce4', '#b8afdc'],
  earth: '#5a5490',
  path: ['#d0a04e', '#fff3c8'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.45) {
      var cx = x + s * (0.25 + rnd2 * 0.5), cy = y + s * (0.3 + rnd * 0.8), r = s * (0.08 + rnd2 * 0.06);
      b.fillStyle = 'rgba(70,60,130,0.22)';
      b.beginPath(); if (b.ellipse) b.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2); b.fill();
      b.strokeStyle = 'rgba(255,255,255,0.35)'; b.lineWidth = Math.max(1, s * 0.02);
      b.beginPath(); if (b.ellipse) b.ellipse(cx, cy, r, r * 0.55, 0, 0.1, Math.PI * 0.9); b.stroke();
    } else if (rnd < 0.6) drawMoonStone(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.65, s * 0.04);
    else if (rnd < 0.68) drawStar(b, x + s * rnd2, y + s * 0.3, s * 0.04, rnd, 0.3);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var i;
    if (rnd < 0.4) {
      // Kuukivet
      artShadow(b, x, baseY, s * 0.45, s * 0.09, 0.2);
      artBlob(b, x - s * 0.1, baseY - s * 0.26, s * 0.32, s * 0.27, '#e4e2ff', { shadeTo: '#a8a2d6', lineColor: '#5a5490', hi: 0.4 });
      artBlob(b, x + s * 0.24, baseY - s * 0.12, s * 0.2, s * 0.15, '#d4d0f6', { shadeTo: '#a8a2d6', lineColor: '#5a5490' });
      artBlob(b, x - s * 0.16, baseY - s * 0.3, s * 0.08, s * 0.045, '#b8b2e4', { line: false, flat: true });
    } else if (rnd < 0.75) {
      // Kidekimppu
      artShadow(b, x, baseY, s * 0.35, s * 0.07, 0.2);
      for (i = -1; i <= 1; i++) drawCrystal(b, x + i * s * 0.2, baseY - s * (0.24 + (i === 0 ? 0.1 : 0)), s * (i === 0 ? 0.3 : 0.2), CRYSTAL_COLORS[Math.floor(rnd2 * 5 + i + 1) % 5]);
    } else {
      // Kuukivipaasi ja tähti
      artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.2);
      drawMoonStone(b, x, baseY - s * 0.2, s * 0.2);
      drawMoonStone(b, x + s * 0.3, baseY - s * 0.09, s * 0.1);
      drawStar(b, x - s * 0.28, baseY - s * 0.6, s * 0.1, rnd2, 0.6);
    }
  },
  // Kuunsirppi kehystää kentän kuvan; läpäisty hohtaa kultaisena
  landmark: function (c, x, y, s, room, st) {
    var col = st.cleared ? '#ffe27a' : '#fff6d2', line = '#b8963a', r = s * 0.48, cy = y - s * 0.06;
    artShadow(c, x, y + s * 0.38, s * 0.42, s * 0.09, 0.24);
    if (st.next || st.cleared) artGlow(c, x, cy, r * 1.5, '#fff0a0', st.next ? 0.45 + Math.sin(globalT * 4) * 0.15 : 0.35);
    // Kivijalusta
    artBlob(c, x, y + s * 0.3, s * 0.36, s * 0.1, '#d4d0f6', { shadeTo: '#a8a2d6', lineColor: '#5a5490' });
    // Sirppi: iso ympyrä, josta leikataan oikealta pois
    c.beginPath();
    c.arc(x, cy, r, Math.PI * 0.32, Math.PI * 1.68);
    c.arc(x + r * 0.55, cy, r * 0.78, Math.PI * 1.32, Math.PI * 0.68, true);
    c.closePath();
    artFillPath(c, col, cy - r, cy + r, r, { lineColor: line });
    artHighlight(c, x - r * 0.65, cy - r * 0.3, r * 0.1, r * 0.25, 0.5);
    // Kuvan levy sirpin syleilyssä
    // Levy kentän värissä (valkoinen pilvi- tai kuukuva erottuu), läpäistyllä kultareunus
    var rc = room.color || '#8a5cb8';
    artCircle(c, x + s * 0.06, cy, s * 0.27, st.cleared ? '#ffd23e' : '#fff6d2', { lineColor: line });
    artCircle(c, x + s * 0.06, cy, s * 0.22, artShade(rc, -0.15), { line: false });
    drawHubRoomIcon(c, room.kind, x + s * 0.06, cy, s * 1.05);
  }
};
