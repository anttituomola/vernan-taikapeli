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

// ---------- Tökkäysyllätykset (Karkkisaari ja Kuutamosaari) ----------
// Jokainen seinäkoriste tekee tökätessä oman temppunsa ja joka 3. tökkäys on
// isompi yllätys. Lajike päätellään samoilla rnd-rajoilla kuin teeman wall-funktiossa.
// Maiseman kohteet (spots) ovat samoissa paikoissa, joihin backdrop ne piirtää.

// Häivytys: täysi alussa, hiipuu viimeisellä neljänneksellä
function htSaari1PokeFade(k) { return k < 0.75 ? 1 : Math.max(0, (1 - k) / 0.25); }
// Hyppykaari 0 -> 1 -> 0
function htSaari1PokeHop(k) { return Math.sin(Math.max(0, Math.min(1, k)) * Math.PI); }
// Sävelkulku: taajuudet peräkkäin
function htSaari1PokeTune(notes, step, type, vol) {
  var i;
  for (i = 0; i < notes.length; i++) playNote(notes[i], i * step, step * 1.4, type || 'triangle', vol || 0.24);
}
// Kala (dir: 1 = oikealle)
function htSaari1PokeFish(c, x, y, r, color, rot, dir) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  c.scale(dir || 1, 1);
  c.beginPath(); c.moveTo(-r * 0.7, 0); c.lineTo(-r * 1.45, -r * 0.55); c.lineTo(-r * 1.45, r * 0.55); c.closePath();
  artFillPath(c, artShade(color, -0.12), -r * 0.55, r * 0.55, r * 0.5, {});
  artBlob(c, 0, 0, r, r * 0.62, color, { hi: 0.4 });
  artEye(c, r * 0.45, -r * 0.12, r * 0.2, 0.5, false);
  c.restore();
}
// Pikkurapu, sakset heiluvat (wave 0..1)
function htSaari1PokeCrab(c, x, y, r, wave) {
  var i, line = '#a8343a';
  for (i = -1; i <= 1; i += 2) {
    artLimb(c, x + i * r * 0.7, y - r * 0.5, x + i * r * 1.15, y - r * (0.9 + wave * 0.5), r * 0.16, '#ff6a5a', line);
    artCircle(c, x + i * r * 1.2, y - r * (1.0 + wave * 0.5), r * 0.26, '#ff7a6a', { lineColor: line });
    artLimb(c, x + i * r * 0.25, y - r * 0.85, x + i * r * 0.3, y - r * 1.25, r * 0.08, '#ff6a5a', line);
  }
  artBlob(c, x, y - r * 0.5, r * 0.85, r * 0.5, '#ff6a5a', { lineColor: line, hi: 0.4 });
  artEye(c, x - r * 0.3, y - r * 1.3, r * 0.17, 0, false);
  artEye(c, x + r * 0.3, y - r * 1.3, r * 0.17, 0, false);
  artBlush(c, x - r * 0.4, y - r * 0.45, r * 0.13);
  artBlush(c, x + r * 0.4, y - r * 0.45, r * 0.13);
}
// Kupla
function htSaari1PokeBubble(c, x, y, r) {
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1, r * 0.2);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2); c.fill();
}
// Sävelmerkki
function htSaari1PokeNote(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath(); if (c.ellipse) c.ellipse(x, y, r, r * 0.75, -0.4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = color; c.lineWidth = Math.max(1, r * 0.3); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + r * 0.85, y); c.lineTo(x + r * 0.85, y - r * 3); c.quadraticCurveTo(x + r * 1.8, y - r * 2.4, x + r * 1.9, y - r * 1.6); c.stroke();
}
// Sydän
function htSaari1PokeHeart(c, x, y, r, color) {
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.4, y, x - r * 0.8, y - r * 1.1, x, y - r * 0.35);
  c.bezierCurveTo(x + r * 0.8, y - r * 1.1, x + r * 1.4, y, x, y + r * 0.9);
  c.closePath();
  artFillPath(c, color, y - r, y + r, r, { hi: 0.4 });
}
// Kääreeseen kääritty karamelli
function htSaari1PokeWrapped(c, x, y, r, color, rot) {
  c.save();
  c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.6, -r * 0.7); c.lineTo(-r * 1.6, r * 0.7); c.closePath();
  c.moveTo(r * 0.8, 0); c.lineTo(r * 1.6, -r * 0.7); c.lineTo(r * 1.6, r * 0.7); c.closePath();
  artFillPath(c, '#ffd23e', -r * 0.7, r * 0.7, r * 0.7, {});
  artBlob(c, 0, 0, r, r * 0.75, color, { hi: 0.5 });
  c.restore();
}
// Tulikärpäsparvi kiertää pistettä (cx, cy)
function htSaari1PokeFlies(c, cx, cy, rad, k, n, color) {
  var i, a, rr;
  for (i = 0; i < n; i++) {
    a = i * Math.PI * 2 / n + k * 5 + Math.sin(k * 7 + i) * 0.4;
    rr = rad * (0.3 + 0.7 * Math.min(1, k * 3)) * (0.8 + (i % 3) * 0.15);
    htSaari1Spark(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7 - k * rad * 0.4, rad * 0.06 * (1 + 0.4 * Math.sin(k * 20 + i * 2)), color);
  }
}
// Avaruuspupu: vihreä pää, pitkät korvat ja antennit (sleepy = silmät kiinni)
function htSaari1PokeAlien(c, x, y, r, sleepy, wave) {
  var i, line = '#3a8a4a';
  artLimb(c, x, y - r * 0.7, x, y - r * 1.75, r * 0.07, '#9fef8a', line);
  htSaari1Spark(c, x, y - r * 1.8, r * 0.16, '#ffe27a');
  for (i = -1; i <= 1; i += 2) {
    c.save();
    c.translate(x + i * r * 0.42, y - r * 0.6);
    c.rotate(i * (0.25 + wave * 0.35));
    artBlob(c, 0, -r * 0.55, r * 0.26, r * 0.6, '#9fef8a', { lineColor: line });
    artBlob(c, 0, -r * 0.5, r * 0.12, r * 0.42, '#ffb0d0', { line: false, flat: true });
    c.restore();
  }
  artCircle(c, x, y, r * 0.85, '#aef59a', { lineColor: line, hi: 0.4 });
  if (sleepy) {
    c.strokeStyle = '#2e4a2e'; c.lineWidth = Math.max(1, r * 0.1); c.lineCap = 'round';
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(x + i * r * 0.32, y - r * 0.15, r * 0.16, 0.2, Math.PI - 0.2); c.stroke(); }
  } else {
    artEye(c, x - r * 0.32, y - r * 0.15, r * 0.2, 0, false);
    artEye(c, x + r * 0.32, y - r * 0.15, r * 0.2, 0, false);
  }
  artBlush(c, x - r * 0.52, y + r * 0.18, r * 0.14);
  artBlush(c, x + r * 0.52, y + r * 0.18, r * 0.14);
  c.strokeStyle = '#2e4a2e'; c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath(); c.arc(x, y + r * 0.2, r * 0.18, 0.3, Math.PI - 0.3); c.stroke();
}
// Maiseman kohteen napautus: laskee kohteen tökkäykset (sp.n; joka 3. isompi) ja soittaa sävelkulun.
// Kutsutaan kohteen sound-koukkuna, jolloin this = kohde.
var htSaari1PokeSpotTaps = {};
function htSaari1PokeSpotTap(sp, notes) {
  var key = sp.id + Math.round(sp.x) + '_' + Math.round(sp.y);
  sp.n = htSaari1PokeSpotTaps[key] = (htSaari1PokeSpotTaps[key] || 0) + 1;
  htSaari1PokeTune(sp.n % 3 === 0 ? notes.concat([notes[0] * 2, notes[notes.length - 1] * 2]) : notes, 0.08, 'sine', 0.22);
}
// Kasvot (silmät ja hymy); blink = vasen silmä vinkkaa
function htSaari1PokeFace(c, x, y, r, blink) {
  artEye(c, x - r * 0.45, y - r * 0.1, r * 0.25, 0, blink);
  artEye(c, x + r * 0.45, y - r * 0.1, r * 0.25, 0, false);
  c.strokeStyle = '#4a3020'; c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round';
  c.beginPath(); c.arc(x, y + r * 0.15, r * 0.3, 0.3, Math.PI - 0.3); c.stroke();
}
// Vesirengas (0..1)
function htSaari1PokeRing(c, x, y, r, rk) {
  if (rk < 0 || rk > 1) return;
  c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - rk)) + ')';
  c.lineWidth = Math.max(1, r * 0.1);
  c.beginPath(); if (c.ellipse) c.ellipse(x, y, r * (0.3 + rk * 0.8), r * (0.1 + rk * 0.25), 0, 0, Math.PI * 2); c.stroke();
}
// Kala hyppää vedestä kaarena ja molskahtaa takaisin (maiseman meri)
function htSaari1PokeFishJump(c, x, y, r, k, color) {
  var q = Math.min(1, k * 1.25), i, dk = k * 3 - 2.1;
  htSaari1PokeRing(c, x - r * 1.5, y, r, k * 3);
  htSaari1PokeRing(c, x + r * 1.5, y, r, k * 3 - 2);
  if (q < 1) htSaari1PokeFish(c, x + (q - 0.5) * r * 3, y - htSaari1PokeHop(q) * r * 2.2, r * 0.5, color, (q - 0.5) * 2.2, 1);
  if (dk > 0 && dk < 1) {
    c.fillStyle = 'rgba(255,255,255,' + (1 - dk) + ')';
    for (i = 0; i < 5; i++) { c.beginPath(); c.arc(x + r * 1.5 + (i - 2) * r * 0.25 * (1 + dk), y - htSaari1PokeHop(dk) * r * (0.5 + (i % 2) * 0.3), r * 0.08, 0, Math.PI * 2); c.fill(); }
  }
}
// Meritähti heiluttaa sakaroitaan ja vinkkaa; sydän nousee (big: kolme sydäntä)
function htSaari1PokeStarWave(c, x, y, r, k, color, rot0, big) {
  var i, q, sw = Math.sin(k * Math.PI * 6) * 0.35 * (1 - k), grow = 1.3 + htSaari1PokeHop(Math.min(1, k * 3)) * 0.15 * (1 - k);
  c.save();
  c.globalAlpha *= Math.min(1, (1 - k) * 6);
  htSaari1Starfish(c, x, y, r * grow, color, (rot0 || 0) + sw);
  htSaari1PokeFace(c, x, y, r * 0.55, k > 0.4 && k < 0.55);
  for (i = 0; i < (big ? 3 : 1); i++) {
    q = k * 1.3 - i * 0.15;
    if (q > 0 && q < 1) htSaari1PokeHeart(c, x + Math.sin(q * 7 + i * 2) * r * 0.8, y - r * 1.4 - q * r * 3, r * 0.4, '#ff7bac');
  }
  c.restore();
}
// ----- Ranta -----
function htSaari1PokeBallBody(c, x, cy, r, rot) {
  var i, cols = ['#ff5f7e', '#ffd23e', '#5fa8ff'];
  artCircle(c, x, cy, r, '#ffffff', { shadeTo: '#dcd6f0', lineColor: '#8a7aa8' });
  c.save();
  c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.clip();
  for (i = 0; i < 3; i++) {
    c.fillStyle = cols[i];
    c.beginPath(); c.moveTo(x, cy); c.arc(x, cy, r, rot + i * Math.PI * 2 / 3, rot + i * Math.PI * 2 / 3 + Math.PI / 3); c.closePath(); c.fill();
  }
  c.restore();
  c.strokeStyle = '#8a7aa8'; c.lineWidth = Math.max(1.2, r * 0.08);
  c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.stroke();
  artHighlight(c, x - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.18, 0.6);
}
function htSaari1PokeIceCream(c, x, y, r, scoops, n) {
  var i, cols = ['#ffb0d0', '#fff2c0', '#a8e8c8', '#c8a0ff', '#8fd3ff'];
  c.beginPath(); c.moveTo(x - r * 0.55, y - r * 1.4); c.lineTo(x + r * 0.55, y - r * 1.4); c.lineTo(x, y); c.closePath();
  artFillPath(c, '#e8b060', y - r * 1.4, y, r * 0.5, { lineColor: '#a0702a' });
  for (i = 0; i < scoops; i++) artCircle(c, x + (i % 2 ? r * 0.1 : -r * 0.05), y - r * (1.6 + i * 0.75), r * 0.62, cols[(n + i) % cols.length], { hi: 0.5 });
  artCircle(c, x + r * 0.1, y - r * (2.25 + (scoops - 1) * 0.75), r * 0.18, '#ff3f5e', { hi: 0.5 });
}
// Purjevene (sama muoto kuin backdropissa; flip = -1 kääntää)
function htSaari1PokeBoat(c, x, y, h, flip) {
  c.save(); c.translate(x, y); c.scale(flip, 1);
  c.beginPath(); c.moveTo(-h * 0.04, 0); c.lineTo(h * 0.04, 0); c.lineTo(h * 0.025, h * 0.018); c.lineTo(-h * 0.025, h * 0.018); c.closePath();
  artFillPath(c, '#c0703c', 0, h * 0.018, h * 0.03, {});
  c.beginPath(); c.moveTo(0, -h * 0.002); c.lineTo(0, -h * 0.07); c.lineTo(h * 0.035, -h * 0.008); c.closePath();
  artFillPath(c, '#ffffff', -h * 0.07, 0, h * 0.03, { shadeTo: '#e0dcf4', lineColor: '#8a7aa8' });
  c.restore();
}
// Aurinko tai kuu: säteet pyörähtävät ja kasvot vinkkaavat
function htSaari1PokeSunFace(c, x, y, r, k, col) {
  var i, an, fade = htSaari1PokeHop(k);
  c.save();
  c.strokeStyle = col; c.globalAlpha = 0.9 * fade; c.lineWidth = Math.max(2, r * 0.14); c.lineCap = 'round';
  for (i = 0; i < 8; i++) {
    an = i * Math.PI / 4 + k * 2;
    c.beginPath(); c.moveTo(x + Math.cos(an) * r * 1.3, y + Math.sin(an) * r * 1.3); c.lineTo(x + Math.cos(an) * r * (1.7 + fade * 0.6), y + Math.sin(an) * r * (1.7 + fade * 0.6)); c.stroke();
  }
  c.globalAlpha = Math.min(1, fade * 1.6);
  htSaari1PokeFace(c, x, y, r, k > 0.35 && k < 0.55);
  artBlush(c, x - r * 0.55, y + r * 0.15, r * 0.14);
  artBlush(c, x + r * 0.55, y + r * 0.15, r * 0.14);
  c.restore();
}

HUB_THEMES.beach.pokeColor = '#ffe27a';
HUB_THEMES.beach.pokeDur = 1.6;
HUB_THEMES.beach.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q;
  c.save();
  if (rnd < 0.38) {
    // Palmu: kookospähkinä putoaa ja kierii (iso: kolme pähkinää ja rapu vilkuttaa)
    var ps = s * (0.72 + rnd2 * 0.2), gy = baseY - ps * 0.07, kk, cx, cy, sx, dir;
    c.globalAlpha = a;
    if (big) htSaari1PokeCrab(c, x - ps * 0.38 + Math.sin(k * 9) * ps * 0.05, baseY + ps * 0.04, ps * 0.13 * Math.min(1, k * 4), Math.abs(Math.sin(k * 14)));
    for (i = 0; i < (big ? 3 : 1); i++) {
      kk = k * 1.3 - i * 0.14;
      if (kk < 0) continue;
      sx = x + ps * (0.1 - i * 0.07); dir = i === 1 ? -1 : 1;
      if (kk < 0.3) { cx = sx; cy = baseY - ps * 0.95 + (gy - baseY + ps * 0.95) * (kk / 0.3) * (kk / 0.3); }
      else {
        q = Math.min(1, (kk - 0.3) / 0.6);
        cx = sx + dir * ps * 0.45 * q;
        cy = gy - Math.abs(Math.sin(q * Math.PI * 2)) * ps * 0.14 * (1 - q);
        if (kk < 0.45) drawStar(c, cx, cy - ps * 0.15, ps * 0.05, kk * 20, 0.6);
      }
      artCircle(c, cx, cy, ps * 0.07, '#8a5a30', { lineColor: '#4a2e14', hi: 0.3 });
    }
  } else if (rnd < 0.58) {
    // Hiekkalinna: lippu liehuu isona (iso: sateenkaarilippu, rapu kurkkaa ovesta, konfettia)
    var fx = x + s * 0.22, fy = baseY - s * 0.74, L = s * (big ? 0.3 : 0.22), fh = s * 0.13, wv;
    var fcol = big ? ['#ff6f9c', '#ffd23e', '#5fd3a0', '#5fa8ff'][Math.floor(k * 12) % 4] : '#ff6f9c';
    c.globalAlpha = a;
    c.beginPath(); c.moveTo(fx, fy);
    for (i = 1; i <= 6; i++) { wv = Math.sin(k * 25 - i) * s * 0.03 * i / 6; c.lineTo(fx + L * i / 6, fy + wv + fh * 0.4 * i / 6); }
    for (i = 6; i >= 0; i--) { wv = Math.sin(k * 25 - i) * s * 0.03 * i / 6; c.lineTo(fx + L * i / 6, fy + fh + wv - fh * 0.4 * i / 6); }
    c.closePath();
    artFillPath(c, fcol, fy, fy + fh, L * 0.5, {});
    if (big) {
      c.save();
      c.beginPath(); c.arc(x, baseY - s * 0.02, s * 0.085, Math.PI, 0); c.closePath(); c.clip();
      htSaari1PokeCrab(c, x, baseY + s * 0.1 - htSaari1PokeHop(k) * s * 0.1, s * 0.07, Math.abs(Math.sin(k * 12)));
      c.restore();
      q = Math.min(1, k * 1.5);
      for (i = 0; i < 12; i++) {
        c.fillStyle = ['#ff6f9c', '#ffd23e', '#5fd3a0', '#5fa8ff'][i % 4];
        c.fillRect(x + (i % 2 ? 0.22 : -0.22) * s + Math.cos(i * 1.3) * s * 0.45 * q, baseY - s * 0.55 - Math.abs(Math.sin(i * 0.7 + 0.5)) * s * 0.6 * q + q * q * s * 0.45, s * 0.045, s * 0.045);
      }
    }
  } else if (rnd < 0.76) {
    // Rantapallo pomppii (iso: korkea loikka ja ämpäristä roiskahdus).
    // Alkuperäinen pallo peitetään hiekalla; pallo palaa samaan asentoon k=1.
    var bx = x - s * 0.1, r = s * 0.17, hgt = big ? htSaari1PokeHop(k) * s * 1.1 : Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * s * 0.7;
    c.fillStyle = '#f4dba0';
    c.beginPath(); c.arc(bx, baseY - r, r * 1.22, 0, Math.PI * 2); c.fill();
    artShadow(c, bx, baseY, r * 1.2 * (1 - hgt / (s * 2.2)), r * 0.3, 0.18);
    htSaari1PokeBallBody(c, bx, baseY - r - hgt, r, rnd2 * 6 + k * Math.PI * 4);
    if (big && k > 0.15) {
      c.globalAlpha = a;
      q = Math.min(1, (k - 0.15) * 2);
      c.fillStyle = '#7fd4ff';
      for (i = 0; i < 6; i++) { c.beginPath(); c.arc(x + s * 0.2 + (i - 2.5) * s * 0.06 * (1 + q * 2), baseY - s * 0.22 - htSaari1PokeHop(q) * s * (0.25 + (i % 3) * 0.1), s * 0.03, 0, Math.PI * 2); c.fill(); }
    }
  } else {
    // Aurinkovarjo: pyyhkeelle ilmestyy jäätelö (iso: kolme palloa ja sydämiä)
    var ix = x - s * 0.11, iy = baseY - s * 0.07, pop = Math.min(1, k * 5);
    c.globalAlpha = a;
    c.save(); c.translate(ix, iy); c.scale(pop, pop);
    htSaari1PokeIceCream(c, 0, 0, s * 0.09, big ? 3 : 1, n);
    c.restore();
    if (big) for (i = 0; i < 3; i++) {
      q = k * 1.4 - i * 0.15;
      if (q > 0 && q < 1) htSaari1PokeHeart(c, ix + Math.sin(q * 6 + i) * s * 0.15, iy - s * 0.5 - q * s * 0.6, s * 0.06, '#ff7bac');
    }
  }
  c.restore();
};
HUB_THEMES.beach.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.38) {
    htSaari1PokeTune([1047, 880, 740, 622], 0.06, 'sine', 0.2);
    playNote(196, 0.32, 0.15, 'triangle', 0.32);
    if (big) htSaari1PokeTune([523, 659, 523, 659], 0.09, 'square', 0.06);
  } else if (p.rnd < 0.58) htSaari1PokeTune(big ? [523, 659, 784, 1047, 784, 1047] : [659, 784], 0.1, 'triangle', 0.24);
  else if (p.rnd < 0.76) {
    playNote(262, 0, 0.12, 'sine', 0.3);
    playNote(392, 0.04, 0.1, 'sine', 0.2);
    if (big) playNote(330, 0.9, 0.12, 'sine', 0.26);
    else { playNote(330, 0.4, 0.1, 'sine', 0.22); playNote(392, 0.75, 0.08, 'sine', 0.16); }
  } else htSaari1PokeTune(big ? [784, 988, 1175, 1568] : [784, 988], 0.09, 'sine', 0.24);
};
HUB_THEMES.beach.spots = function (w, h, lay) {
  var i, x, y, hz = lay.oy + lay.rows * lay.cell * 0.25, slabL = lay.ox - lay.cell, slabR = lay.ox + (lay.cols + 1) * lay.cell, list = [];
  var snd = function (notes) { return function () { htSaari1PokeSpotTap(this, notes); }; };
  list.push({ id: 'sun', x: w * 0.1, y: h * 0.1, r: h * 0.08, h: h, dur: 1.8, sound: snd([1047, 1319, 1568]) });
  if (w * 0.12 + h * 0.07 < slabL) list.push({ id: 'boat', x: w * 0.12, y: hz + h * 0.09, r: h * 0.07, h: h, hz: hz, dur: 3, sound: snd([523, 659, 784, 659]) });
  list.push({ id: 'isle', x: w * 0.85, y: hz - h * 0.06, r: h * 0.08, h: h, dur: 2.2, sound: snd([784, 1047, 1319, 1047, 1568]) });
  if (slabL > h * 0.12) list.push({ id: 'sea', x: slabL * 0.5, y: hz + h * 0.22, r: h * 0.07, h: h, dur: 1.6, col: '#ff9a6b', sound: snd([392, 523, 784]) });
  if (w - slabR > h * 0.12) list.push({ id: 'sea', x: (slabR + w) * 0.5, y: hz + h * 0.12, r: h * 0.07, h: h, dur: 1.6, col: '#ffd23e', sound: snd([440, 587, 880]) });
  for (i = 0; i < 8; i++) {
    x = i < 4 ? w * (0.02 + i * 0.05) : w * (0.98 - (i - 4) * 0.05);
    if (x > slabL && x < slabR) continue;
    y = h * (0.8 + (i % 3) * 0.06);
    if (i % 2) list.push({ id: 'palm', x: x, y: y - h * 0.07, bx: x, by: y, r: h * 0.07, h: h, dur: 1.6, sound: snd([988, 784, 587, 196]) });
    else list.push({ id: 'star', x: x, y: y - h * 0.01, r: h * 0.04, h: h, rot: i, dur: 1.6, sound: snd([659, 880, 1175]) });
  }
  return list;
};
HUB_THEMES.beach.spotDraw = function (c, sp, k, lay) {
  var h = sp.h, a = htSaari1PokeFade(k), i, q;
  c.save();
  if (sp.id === 'sun') htSaari1PokeSunFace(c, sp.x, sp.y, h * 0.05, k, '#ffe27a');
  else if (sp.id === 'boat') {
    // Vene purjehtii lenkin ja palaa paikalleen: alkuperäinen peitetään merellä
    var bx = sp.x, by = sp.y + h * 0.03, sg = c.createLinearGradient(0, sp.hz, 0, h);
    sg.addColorStop(0, '#5cc4ea'); sg.addColorStop(1, '#2f9fd6');
    c.save();
    c.beginPath(); c.rect(bx - h * 0.05, by - h * 0.078, h * 0.1, h * 0.1); c.clip();
    c.fillStyle = sg; c.fillRect(bx - h * 0.06, by - h * 0.09, h * 0.12, h * 0.12);
    for (i = 0; i < 26; i++) htSaari1Wave(c, hubHash(i, 2) * viewW, sp.hz + h * 0.03 + hubHash(2, i) * (h - sp.hz) * 0.8, h * 0.05, h * 0.006, 'rgba(255,255,255,0.45)', Math.max(1.5, h * 0.004));
    c.restore();
    q = Math.sin(k * Math.PI * 2);
    htSaari1PokeBoat(c, bx + q * h * 0.09, by + Math.sin(k * Math.PI * 10) * h * 0.004 * (1 - k), h, Math.cos(k * Math.PI * 2) >= 0 ? 1 : -1);
    c.globalAlpha = a * 0.8;
    for (i = 0; i < 3; i++) htSaari1Wave(c, bx + q * h * 0.09 - h * 0.015 - (Math.cos(k * Math.PI * 2) >= 0 ? 1 : -1) * (h * 0.045 + i * h * 0.022), by + h * 0.022 + i * h * 0.005, h * 0.03, h * 0.003, '#ffffff', Math.max(1, h * 0.003));
  } else if (sp.id === 'isle') {
    // Karkkisaaren ilotulitus (joka 3.: viisi rakettia)
    for (i = 0; i < (sp.n % 3 === 0 ? 5 : 3); i++) {
      q = k * 1.6 - i * 0.15;
      if (q < 0 || q > 1) continue;
      var fx = sp.x + ((i % 3) - 1 + (i > 2 ? 0.5 : 0)) * h * 0.06, fy = sp.y - h * 0.05 - (i % 2) * h * 0.03 - (i > 2 ? h * 0.04 : 0), j, col = ['#ff8fb8', '#ffd27a', '#a8e0ff', '#b8f0a0', '#d0a8ff'][i], e;
      if (q < 0.3) htSaari1Spark(c, fx, sp.y + h * 0.05 - (sp.y + h * 0.05 - fy) * q / 0.3, h * 0.004, col);
      else {
        e = (q - 0.3) / 0.7;
        c.globalAlpha = 1 - e;
        for (j = 0; j < 10; j++) htSaari1Spark(c, fx + Math.cos(j * 0.63) * h * 0.07 * e, fy + Math.sin(j * 0.63) * h * 0.07 * e + e * e * h * 0.03, h * 0.005, col);
        c.globalAlpha = 1;
      }
    }
  } else if (sp.id === 'sea') {
    htSaari1PokeFishJump(c, sp.x, sp.y, h * 0.035, k, sp.col);
    if (sp.n % 3 === 0) htSaari1PokeFishJump(c, sp.x - h * 0.05, sp.y + h * 0.02, h * 0.03, Math.max(0, k * 1.2 - 0.2), '#ff7bac');
  }
  else if (sp.id === 'palm') {
    // Kookospähkinä putoaa ja kierii (joka 3.: kolme pähkinää eri suuntiin)
    var ph = h * 0.11, gy = sp.by - ph * 0.04, cx, cy, kk, dir;
    c.globalAlpha = a;
    for (i = 0; i < (sp.n % 3 === 0 ? 3 : 1); i++) {
      kk = k * 1.25 - i * 0.12;
      if (kk < 0) continue;
      dir = i === 1 ? -1 : 1;
      cx = sp.bx + ph * (0.1 - i * 0.05);
      if (kk < 0.3) cy = sp.by - ph * 0.96 + (gy - sp.by + ph * 0.96) * (kk / 0.3) * (kk / 0.3);
      else { q = Math.min(1, (kk - 0.3) / 0.7); cx += dir * ph * 0.5 * q; cy = gy - Math.abs(Math.sin(q * Math.PI * 2)) * ph * 0.15 * (1 - q); }
      if (kk > 0.28 && kk < 0.45) drawStar(c, cx, cy - ph * 0.15, ph * 0.05, kk * 20, 0.6);
      artCircle(c, cx, cy, ph * 0.065, '#8a5a30', { lineColor: '#4a2e14', hi: 0.3 });
    }
  } else if (sp.id === 'star') htSaari1PokeStarWave(c, sp.x, sp.y, h * 0.016, k, '#ff9a6b', sp.rot, sp.n % 3 === 0);
  c.restore();
};
// ----- Karkkimaa -----
function htSaari1PokeMint(c, x, y, r, rot) {
  var i;
  artCircle(c, x, y, r, '#ffffff', { lineColor: '#b8345a' });
  c.fillStyle = '#ff4f6e';
  for (i = 0; i < 4; i++) {
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.88, rot + i * Math.PI / 2, rot + i * Math.PI / 2 + Math.PI / 4); c.closePath(); c.fill();
  }
  artHighlight(c, x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.18, 0.6);
}
HUB_THEMES.candy.pokeColor = '#ff9ee8';
HUB_THEMES.candy.pokeDur = 1.6;
HUB_THEMES.candy.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q, px, py;
  c.save();
  c.globalAlpha = a;
  if (rnd < 0.4) {
    // Tikkaripuu kimaltaa ja pudottaa kääretyn karkin (iso: kolme karkkia ja tähtirengas)
    var ls = s * (0.62 + rnd2 * 0.14), hy = baseY - ls * 1.35, col = CANDY_COLORS[Math.floor(rnd2 * CANDY_COLORS.length)];
    artGlow(c, x, hy, ls * (0.7 + htSaari1PokeHop(k) * 0.4), '#ffffff', 0.5 * htSaari1PokeHop(k));
    for (i = 0; i < (big ? 8 : 5); i++) drawStar(c, x + Math.cos(k * 6 + i * Math.PI * 2 / (big ? 8 : 5)) * ls * (big ? 0.62 : 0.5), hy + Math.sin(k * 6 + i * Math.PI * 2 / (big ? 8 : 5)) * ls * (big ? 0.62 : 0.5), ls * 0.06, k * 4 + i, 0.4);
    for (i = 0; i < (big ? 3 : 1); i++) {
      q = Math.min(1, k * 1.5 - i * 0.12);
      if (q <= 0) continue;
      var dir = [1, -1, 0.5][i];
      px = x + dir * ls * 0.6 * q;
      py = hy + (baseY - ls * 0.08 - hy) * q - htSaari1PokeHop(q) * ls * 0.5;
      htSaari1PokeWrapped(c, px, py, ls * 0.08, CANDY_COLORS[(Math.floor(rnd2 * 5) + i + 1) % 5], q * 8 * dir);
    }
  } else if (rnd < 0.62) {
    // Kumikarkki loikkaa keosta (iso: kasvoilla ja kolme loikkaa)
    var gcol = CANDY_COLORS[Math.floor(rnd2 * 5 + 4) % 5], hops = big ? 3 : 1, hk = Math.min(1, k * 1.3), hi = Math.min(hops - 1, Math.floor(hk * hops)), hf = hk * hops - hi;
    px = x + s * 0.02 + s * 0.42 * Math.min(1, hk * 1.5) * (hi % 2 ? -1 : 1) * (hops > 1 ? 0.8 : 1);
    py = baseY - s * 0.15 + s * 0.17 * Math.min(1, hk * 2) - htSaari1PokeHop(hf) * s * (big ? 0.45 : 0.35);
    var sq = hf < 0.1 || hf > 0.9 ? 0.8 : 1;
    c.save(); c.translate(px, py); c.scale(1 / sq, sq);
    htSaari1Gumdrop(c, 0, 0, s * 0.13, gcol);
    if (big) htSaari1PokeFace(c, 0, -s * 0.07, s * 0.1, hf > 0.4 && hf < 0.6);
    c.restore();
    for (i = 0; i < 6; i++) {
      c.fillStyle = '#ffffff';
      c.fillRect(x + Math.cos(i) * s * 0.35 * k, baseY - s * 0.3 - Math.sin(i * 2) * s * 0.3 * k, s * 0.03, s * 0.03);
    }
  } else if (rnd < 0.8) {
    // Karkkikepit soivat kuin kellot (iso: piparminttu vierii esiin)
    for (i = 0; i < (big ? 4 : 2); i++) {
      q = k * 1.2 - i * 0.12;
      if (q <= 0 || q > 1) continue;
      px = i % 2 ? x + s * 0.4 : x - s * 0.08;
      py = baseY - (i % 2 ? s * 0.68 : s * 0.85);
      htSaari1PokeNote(c, px + Math.sin(q * 8) * s * 0.06, py - q * s * 0.6, s * 0.06, ['#ff4f6e', '#b678ff', '#5fa8ff', '#ffb84f'][i]);
    }
    if (big) {
      q = Math.min(1, k * 1.4);
      htSaari1PokeMint(c, x + s * 0.05 + Math.sin(q * Math.PI) * s * 0.4, baseY - s * 0.1, s * 0.1, q * 9);
    }
  } else {
    // Kuppikakun kirsikka hyppää (iso: korkea voltti ja nonparelli-suihku)
    var S = s * 1.45, fr = rnd2 < 0.5 ? '#fff0f6' : '#ffd0e6', ch = baseY - S * 0.58, jump = htSaari1PokeHop(k) * S * (big ? 0.95 : 0.5);
    c.globalAlpha = 1;
    if (jump > S * 0.03) artBlob(c, x, ch + S * 0.02, S * 0.07, S * 0.05, fr, { lineColor: artShade(fr, -0.45) });
    if (big && k > 0.1) {
      c.globalAlpha = a;
      q = Math.min(1, (k - 0.1) * 1.6);
      for (i = 0; i < 12; i++) {
        c.fillStyle = CANDY_COLORS[i % 5];
        c.save();
        c.translate(x + Math.cos(i * 0.52 + 3.4) * S * 0.45 * q, ch - Math.abs(Math.sin(i * 0.52 + 3.4)) * S * 0.5 * q + q * q * S * 0.35);
        c.rotate(i + q * 6);
        c.fillRect(-S * 0.025, -S * 0.008, S * 0.05, S * 0.016);
        c.restore();
      }
      c.globalAlpha = 1;
    }
    c.save();
    c.translate(x, ch - jump);
    c.rotate(big ? k * Math.PI * 2 : Math.sin(k * Math.PI * 4) * 0.3);
    artLimb(c, 0, -S * 0.04, S * 0.04, -S * 0.12, Math.max(1, S * 0.012), '#5a8a30', false);
    artCircle(c, 0, 0, S * 0.06, '#ff3f5e', { hi: 0.5 });
    c.restore();
  }
  c.restore();
};
HUB_THEMES.candy.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.4) htSaari1PokeTune(big ? [1319, 1568, 1760, 2093, 1760, 2093] : [1319, 1568, 2093], 0.07, 'sine', 0.2);
  else if (p.rnd < 0.62) { playNote(330, 0, 0.1, 'sine', 0.3); playNote(523, 0.05, 0.12, 'sine', 0.24); if (big) { playNote(392, 0.45, 0.1, 'sine', 0.26); playNote(587, 0.85, 0.12, 'sine', 0.26); } }
  else if (p.rnd < 0.8) htSaari1PokeTune(big ? [1047, 1319, 1568, 1319, 1047, 784] : [1047, 1568], 0.12, 'triangle', 0.22);
  else htSaari1PokeTune(big ? [523, 784, 1047, 1568] : [659, 988], 0.1, 'sine', 0.24);
};

// ----- Arvoitusten torni -----
// Perhonen (flap 0..1 siipien asento)
function htSaari1PokeButterfly(c, x, y, r, flap, color) {
  var w = 0.3 + Math.abs(Math.sin(flap * Math.PI)) * 0.7;
  c.save(); c.translate(x, y); c.scale(w, 1);
  artBlob(c, -r * 0.55, -r * 0.3, r * 0.55, r * 0.45, color, { rot: -0.4 });
  artBlob(c, r * 0.55, -r * 0.3, r * 0.55, r * 0.45, color, { rot: 0.4 });
  artBlob(c, -r * 0.4, r * 0.35, r * 0.35, r * 0.3, artShade(color, 0.3), { rot: 0.4 });
  artBlob(c, r * 0.4, r * 0.35, r * 0.35, r * 0.3, artShade(color, 0.3), { rot: -0.4 });
  c.restore();
  artLimb(c, x, y - r * 0.5, x, y + r * 0.5, r * 0.18, '#4a3a60', false);
}
HUB_THEMES.tower.pokeColor = '#c9a0ff';
HUB_THEMES.tower.pokeDur = 1.7;
HUB_THEMES.tower.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q, an;
  c.save();
  c.globalAlpha = a;
  if (rnd < 0.3) {
    // Pylvään riimu hehkuu ja kohoaa ilmaan (iso: kolme riimua kiertää pylvästä)
    var h = s * (0.85 + rnd2 * 0.25), ry = baseY - h * 0.55, kind = Math.floor(rnd2 * 30) % 3, rcol = ['#3fd0f0', '#ffb820', '#ff6fd0'][Math.floor(rnd2 * 17) % 3];
    artGlow(c, x, ry, s * 0.35, rcol, 0.7 * htSaari1PokeHop(k));
    htSaari1Rune(c, x, ry, s * 0.1, kind, rcol);
    if (big) {
      for (i = 0; i < 3; i++) {
        an = k * Math.PI * 3 + i * Math.PI * 2 / 3;
        htSaari1Rune(c, x + Math.cos(an) * s * 0.42, baseY - h - s * 0.2 + Math.sin(an) * s * 0.12 - htSaari1PokeHop(k) * s * 0.15, s * 0.08, i, ['#3fd0f0', '#ffb820', '#ff6fd0'][i]);
      }
    } else htSaari1Rune(c, x, ry - k * s * 0.9, s * (0.1 + k * 0.05), kind, rcol);
  } else if (rnd < 0.62) {
    if (big) {
      // Pupu kurkistaa pensaan takaa
      var top = baseY - s * 0.53, pk = k < 0.2 ? k / 0.2 : (k > 0.8 ? (1 - k) / 0.2 : 1);
      c.globalAlpha = 1;
      c.save();
      c.beginPath(); c.rect(x - s, top - s * 1.2, s * 2, s * 1.2); c.clip();
      drawBunny(c, x + (rnd2 < 0.5 ? s * 0.3 : 0), top + s * 0.3 - pk * s * 0.42, s * 0.26, 0, k * 12, true);
      c.restore();
    } else {
      // Perhonen lepattaa pensaasta
      var bfx = x + Math.sin(k * 5) * s * 0.3 + k * s * 0.3, bfy = baseY - s * 0.5 - k * s * 1.0;
      htSaari1PokeButterfly(c, bfx, bfy, s * 0.09, k * 9, ['#ff9ee8', '#ffe27a', '#7fd4ff'][n % 3]);
    }
    for (i = 0; i < 4; i++) {
      q = Math.min(1, k * 1.6);
      artBlob(c, x + (i - 1.5) * s * 0.25 * (1 + q), baseY - s * 0.5 - htSaari1PokeHop(q) * s * 0.3 + q * s * 0.3, s * 0.05, s * 0.025, '#7fd88a', { rot: i + q * 4 });
    }
  } else if (rnd < 0.8) {
    // Tornin ikkuna syttyy ja katolta nousee tähti (iso: pöllö vilkuttaa ikkunassa)
    var tp = baseY - s * 0.62, wy = tp + s * 0.18;
    artGlow(c, x, wy, s * (0.3 + htSaari1PokeHop(k) * 0.25), '#ffe27a', 0.8);
    if (big) {
      c.globalAlpha = 1;
      artRoundRect(c, x - s * 0.05, tp + s * 0.11, s * 0.1, s * 0.14, s * 0.05, '#7a5ab0', { lineColor: '#5a4a8f' });
      artEye(c, x - s * 0.022, wy - s * 0.01, s * 0.022, Math.sin(k * 6), k > 0.45 && k < 0.55);
      artEye(c, x + s * 0.022, wy - s * 0.01, s * 0.022, Math.sin(k * 6), k > 0.45 && k < 0.55);
      c.fillStyle = '#ffb820';
      c.beginPath(); c.moveTo(x - s * 0.012, wy + s * 0.02); c.lineTo(x + s * 0.012, wy + s * 0.02); c.lineTo(x, wy + s * 0.04); c.closePath(); c.fill();
      c.globalAlpha = a;
      for (i = 0; i < 5; i++) drawStar(c, x + Math.cos(i * 1.26 - 1.57) * s * 0.5 * k, tp - s * 0.36 + Math.sin(i * 1.26 - 1.57) * s * 0.5 * k, s * 0.05, k * 5, 0.5);
    } else drawStar(c, x, tp - s * 0.38 - k * s * 0.6, s * 0.07, k * 6, 0.7);
  } else {
    // Jalokivi kohoaa ja säihkyy (iso: pikkujalokivet kiertävät)
    var gcol = GEM_COLORS[Math.floor(rnd2 * GEM_COLORS.length)], gy = baseY - s * 0.68 - htSaari1PokeHop(k) * s * 0.2;
    c.save();
    c.translate(x, gy);
    c.rotate(k * 2);
    c.fillStyle = artRGBA(gcol, 0.35);
    for (i = 0; i < 8; i++) {
      c.beginPath(); c.moveTo(0, 0);
      c.arc(0, 0, s * (0.4 + htSaari1PokeHop(k) * 0.25), i * Math.PI / 4, i * Math.PI / 4 + 0.2);
      c.closePath(); c.fill();
    }
    c.restore();
    drawGem(c, x, gy, s * 0.17, gcol);
    if (big) for (i = 0; i < 5; i++) {
      an = k * Math.PI * 4 + i * Math.PI * 0.4;
      drawGem(c, x + Math.cos(an) * s * 0.42, gy + Math.sin(an) * s * 0.18, s * 0.06, GEM_COLORS[(i + 1) % GEM_COLORS.length]);
    }
  }
  c.restore();
};
HUB_THEMES.tower.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.3) htSaari1PokeTune(big ? [523, 659, 784, 988, 1175] : [659, 988], 0.1, 'sine', 0.22);
  else if (p.rnd < 0.62) { if (big) { soundBunny(); } else htSaari1PokeTune([1175, 1319, 1175, 1568], 0.06, 'sine', 0.16); }
  else if (p.rnd < 0.8) { if (big) { playNote(392, 0, 0.25, 'sine', 0.3); playNote(330, 0.3, 0.35, 'sine', 0.3); } else htSaari1PokeTune([784, 1175], 0.1, 'triangle', 0.2); }
  else htSaari1PokeTune(big ? [1568, 1319, 1568, 2093, 2637] : [1568, 2093], 0.07, 'sine', 0.2);
};
// ----- Riutta -----
// Vuokkokala: oranssi kala valkoisin raidoin
function htSaari1PokeClown(c, x, y, r, rot, dir) {
  var i;
  htSaari1PokeFish(c, x, y, r, '#ff8a3a', rot, dir);
  c.save();
  c.translate(x, y); c.rotate(rot || 0); c.scale(dir || 1, 1);
  c.beginPath(); if (c.ellipse) c.ellipse(0, 0, r * 0.98, r * 0.6, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.95)';
  for (i = 0; i < 2; i++) c.fillRect(-r * (0.55 - i * 0.6) - r * 0.09, -r, r * 0.18, r * 2);
  c.restore();
}
// Kuplajono (kuplat nousevat pisteestä)
function htSaari1PokeBubbles(c, x, y, s, k, n, seed) {
  var i, q;
  for (i = 0; i < n; i++) {
    q = k * 1.4 - i * 0.12;
    if (q <= 0 || q >= 1) continue;
    htSaari1PokeBubble(c, x + Math.sin(q * 9 + i + seed) * s * 0.06, y - q * s * 1.1, s * (0.03 + (i % 3) * 0.012) * (1 + q * 0.4));
  }
}
HUB_THEMES.reef.pokeColor = '#bfe8ff';
HUB_THEMES.reef.pokeDur = 1.8;
HUB_THEMES.reef.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q;
  c.save();
  c.globalAlpha = a;
  if (rnd < 0.32) {
    // Koralli puhaltaa kuplia (iso: pikkukala syöksähtää korallista)
    var cs = s * (0.36 + rnd2 * 0.1);
    for (i = -1; i <= 1; i++) htSaari1PokeBubbles(c, x + i * cs * 0.6, baseY - cs * (1 - Math.abs(i) * 0.25), s, k - (i + 1) * 0.06, big ? 4 : 3, i * 3);
    if (big) {
      q = Math.min(1, k * 1.3);
      htSaari1PokeFish(c, x + q * s * 0.9 - s * 0.1, baseY - cs * 0.6 - Math.sin(q * Math.PI * 2) * s * 0.35 - q * s * 0.3, s * 0.11, '#ffd23e', -Math.cos(q * Math.PI * 2) * 0.7, 1);
    }
  } else if (rnd < 0.52) {
    // Kala uiskentelee levän läpi (iso: kolmen kalan parvi)
    for (i = 0; i < (big ? 3 : 1); i++) {
      q = Math.min(1, k * 1.2 - i * 0.08);
      if (q <= 0) continue;
      htSaari1PokeFish(c, x - s * 0.7 + q * s * 1.4, baseY - s * (0.4 + i * 0.18) + Math.sin(q * 12 + i) * s * 0.04, s * (0.1 - i * 0.015), ['#7fd4ff', '#ff9ecf', '#ffd23e'][(i + n) % 3], Math.cos(q * 12 + i) * 0.15, 1);
    }
    htSaari1PokeBubbles(c, x + s * 0.1, baseY - s * 0.4, s, k, 3, 1);
  } else if (rnd < 0.74) {
    // Vuokkokala kurkkaa vuokon lonkeroista (iso: kaksi kalaa ja sydän)
    var as = s * 1.4, cy0 = baseY - as * 0.15, pk = htSaari1PokeHop(Math.min(1, k * 1.15));
    c.save();
    c.beginPath(); c.rect(x - s, baseY - as * 1.2, s * 2, as * 0.93); c.clip();
    htSaari1PokeClown(c, x - (big ? s * 0.12 : 0), cy0 - pk * as * 0.45, s * 0.11, -0.3 + Math.sin(k * 20) * 0.15, 1);
    if (big) htSaari1PokeClown(c, x + s * 0.14, cy0 - htSaari1PokeHop(Math.min(1, k * 1.15 - 0.1)) * as * 0.4, s * 0.09, 0.3 - Math.sin(k * 20) * 0.15, -1);
    c.restore();
    if (big && k > 0.3) htSaari1PokeHeart(c, x, baseY - as * 0.7 - (k - 0.3) * s * 0.6, s * 0.07, '#ff7bac');
  } else {
    // Kiven meritähti vilkuttaa (iso: sydämiä ja helmi välkähtää)
    htSaari1PokeStarWave(c, x - s * 0.04, baseY - s * 0.3, s * 0.13, k, rnd2 < 0.5 ? '#ff9a6b' : '#ffd23e', rnd2 * 4, big);
    if (big && rnd2 < 0.5) drawStar(c, x + s * 0.3, baseY - s * 0.1, s * 0.07 * htSaari1PokeHop(k), k * 6, 1);
  }
  c.restore();
};
HUB_THEMES.reef.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.32) htSaari1PokeTune(big ? [523, 659, 784, 1047, 1319] : [784, 1047, 1319], 0.08, 'sine', 0.18);
  else if (p.rnd < 0.52) htSaari1PokeTune(big ? [587, 698, 880, 1175] : [698, 880], 0.1, 'triangle', 0.2);
  else if (p.rnd < 0.74) htSaari1PokeTune(big ? [523, 784, 659, 1047] : [659, 988], 0.12, 'sine', 0.24);
  else htSaari1PokeTune(big ? [880, 1109, 1319, 1760] : [880, 1319], 0.09, 'triangle', 0.2);
};
HUB_THEMES.reef.spots = function (w, h, lay) {
  var i, x, y, hz = lay.oy + lay.rows * lay.cell * 0.3, slabL = lay.ox - lay.cell, slabR = lay.ox + (lay.cols + 1) * lay.cell, list = [];
  var snd = function (notes) { return function () { htSaari1PokeSpotTap(this, notes); }; };
  // Huom: kuu on yhteisen aurinkonapautuksen (hubFxTapOutside) alueella, joten sille ei ole omaa kohdetta
  if (w * 0.2 < slabL) list.push({ id: 'sky', x: w * 0.13, y: h * 0.17, r: h * 0.07, h: h, dur: 1.6, sound: snd([1568, 1319, 1047, 1568]) });
  if (w * 0.22 < slabL) list.push({ id: 'owl', x: w * 0.12, y: hz - h * 0.045, r: h * 0.05, h: h, dur: 2, sound: snd([392, 330, 392, 330]) });
  list.push({ id: 'glint', x: w * 0.86, y: hz + h * 0.09, r: h * 0.07, h: h, dur: 1.8, sound: snd([659, 880, 1319]) });
  if (slabL > h * 0.12) list.push({ id: 'sea', x: slabL * 0.5, y: hz + h * 0.2, r: h * 0.07, h: h, dur: 1.6, col: '#c9a0ff', sound: snd([392, 523, 784]) });
  for (i = 0; i < 8; i++) {
    x = i < 4 ? w * (0.025 + i * 0.05) : w * (0.975 - (i - 4) * 0.05);
    if (x > slabL && x < slabR) continue;
    y = h * (0.83 + (i % 3) * 0.05);
    if (i % 3 === 0) list.push({ id: 'coral', x: x, y: y - h * 0.03, bx: x, by: y, r: h * 0.045, h: h, dur: 1.8, sound: snd([784, 1047, 1319]) });
    else if (i % 3 === 1) list.push({ id: 'pearl', x: x, y: y - h * 0.02, r: h * 0.035, h: h, dur: 1.6, sound: snd([1319, 1568, 2093]) });
    else list.push({ id: 'star', x: x, y: y - h * 0.01, r: h * 0.04, h: h, rot: i, dur: 1.6, sound: snd([659, 880, 1175]) });
  }
  return list;
};
HUB_THEMES.reef.spotDraw = function (c, sp, k, lay) {
  var h = sp.h, a = htSaari1PokeFade(k), big = sp.n % 3 === 0, i, q, sx, sy;
  c.save();
  c.globalAlpha = a;
  if (sp.id === 'sky') {
    // Tähdenlento (joka 3.: kolme)
    for (i = 0; i < (big ? 3 : 1); i++) {
      q = Math.min(1, k * 1.5 - i * 0.2);
      if (q <= 0 || q >= 1) continue;
      sx = sp.x - h * 0.1 + q * h * 0.25 + i * h * 0.03; sy = sp.y - h * 0.06 + q * h * 0.12 - i * h * 0.03;
      var tg = c.createLinearGradient(sx - h * 0.1, sy - h * 0.05, sx, sy);
      tg.addColorStop(0, 'rgba(255,240,180,0)'); tg.addColorStop(1, 'rgba(255,240,180,0.9)');
      c.strokeStyle = tg; c.lineWidth = h * 0.008; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx - h * 0.1, sy - h * 0.05); c.lineTo(sx, sy); c.stroke();
      drawStar(c, sx, sy, h * 0.014, q * 8, 0.8);
    }
  } else if (sp.id === 'owl') {
    // Pöllön silmät välähtävät saaren kuusikossa
    var op = htSaari1PokeHop(Math.min(1, k * 1.2)), blink = (k > 0.35 && k < 0.42) || (big && k > 0.6 && k < 0.66);
    artGlow(c, sp.x, sp.y, h * 0.04, '#fff0a0', 0.5 * op);
    c.globalAlpha = a * op;
    for (i = -1; i <= 1; i += 2) {
      if (blink) { c.strokeStyle = '#ffe27a'; c.lineWidth = h * 0.003; c.beginPath(); c.moveTo(sp.x + i * h * 0.012 - h * 0.008, sp.y); c.lineTo(sp.x + i * h * 0.012 + h * 0.008, sp.y); c.stroke(); }
      else { artCircle(c, sp.x + i * h * 0.012, sp.y, h * 0.009, '#ffe27a', { line: false }); c.fillStyle = '#222'; c.beginPath(); c.arc(sp.x + i * h * 0.012, sp.y, h * 0.004, 0, Math.PI * 2); c.fill(); }
    }
  } else if (sp.id === 'glint') {
    // Kuun sillalla välkettä ja kuukala hyppää
    for (i = 0; i < 6; i++) drawStar(c, sp.x + Math.sin(i * 2.3) * h * 0.05, sp.y + Math.cos(i * 1.7) * h * 0.04, h * 0.01 * htSaari1PokeHop(k * 1.5 - i * 0.08), i, 0.8);
    htSaari1PokeFishJump(c, sp.x, sp.y, h * 0.035, k, big ? '#ffe27a' : '#fff6d2');
  } else if (sp.id === 'sea') {
    htSaari1PokeFishJump(c, sp.x, sp.y, h * 0.035, k, sp.col);
    if (big) htSaari1PokeFishJump(c, sp.x - h * 0.05, sp.y + h * 0.02, h * 0.03, Math.max(0, k * 1.2 - 0.2), '#7fe0c0');
  } else if (sp.id === 'coral') {
    for (i = -1; i <= 1; i++) htSaari1PokeBubbles(c, sp.bx + i * h * 0.018, sp.by - h * 0.03 * (1 - Math.abs(i) * 0.25), h * 0.09, k - (i + 1) * 0.06, big ? 5 : 3, i);
    if (big) htSaari1PokeFish(c, sp.bx - h * 0.03 + k * h * 0.08, sp.by - h * 0.05 - htSaari1PokeHop(k) * h * 0.03, h * 0.012, '#ffd23e', 0, sp.bx < viewW / 2 ? 1 : -1);
  } else if (sp.id === 'pearl') {
    artGlow(c, sp.x, sp.y, h * 0.04 * (1 + htSaari1PokeHop(k)), '#ffffff', 0.7);
    for (i = 0; i < (big ? 6 : 3); i++) drawStar(c, sp.x + Math.cos(i * 1.05 + k * 3) * h * 0.035 * k * 1.3, sp.y - h * 0.01 + Math.sin(i * 1.05 + k * 3) * h * 0.03 * k * 1.3, h * 0.008, k * 6, 0.6);
  } else if (sp.id === 'star') htSaari1PokeStarWave(c, sp.x, sp.y, h * 0.016, k, '#ffb46b', sp.rot, big);
  c.restore();
};

// ----- Yömetsä -----
HUB_THEMES.nightwood.pokeColor = '#e6ff9a';
HUB_THEMES.nightwood.pokeDur = 1.9;
HUB_THEMES.nightwood.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q;
  c.save();
  c.globalAlpha = a;
  if (rnd < 0.5) {
    // Kuusesta pöllähtää tulikärpäsparvi (iso: pöllö avaa silmänsä oksilla)
    var ps = s * (0.95 + rnd2 * 0.25);
    if (big) {
      var ey = baseY - ps * 0.5, op = Math.min(1, k * 5), bl = k > 0.45 && k < 0.53;
      c.globalAlpha = a * op;
      for (i = -1; i <= 1; i += 2) {
        artGlow(c, x + i * ps * 0.08, ey, ps * 0.1, '#fff0a0', 0.5);
        if (bl) artEye(c, x + i * ps * 0.08, ey, ps * 0.055, 0, true);
        else { artCircle(c, x + i * ps * 0.08, ey, ps * 0.065, '#ffe27a', { lineColor: '#8a5a20' }); artEye(c, x + i * ps * 0.08, ey, ps * 0.04, Math.sin(k * 6), false); }
      }
      c.fillStyle = '#ffb820';
      c.beginPath(); c.moveTo(x - ps * 0.025, ey + ps * 0.05); c.lineTo(x + ps * 0.025, ey + ps * 0.05); c.lineTo(x, ey + ps * 0.09); c.closePath(); c.fill();
      c.globalAlpha = a;
    }
    htSaari1PokeFlies(c, x, baseY - ps * 0.55, s * (big ? 0.75 : 0.55), k, big ? 10 : 6, '#e6ff9a');
  } else if (rnd < 0.72) {
    // Lyhty loistaa kirkkaammin ja houkuttelee tulikärpäset (iso: sävelet leijuvat)
    var L = s * 1.3, lx = x + s * 0.1 + L * 0.14, ly = baseY - L * 0.44;
    artGlow(c, lx, ly, L * (0.4 + htSaari1PokeHop(k) * (big ? 0.6 : 0.35)), '#ffd86a', 0.7);
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(lx, ly, L * 0.04 * (1 + htSaari1PokeHop(k) * 0.5), 0, Math.PI * 2); c.fill();
    htSaari1PokeFlies(c, lx, ly, s * 0.45 * (1.2 - k * 0.5), k, big ? 9 : 5, '#fff0a0');
    if (big) for (i = 0; i < 3; i++) {
      q = k * 1.3 - i * 0.2;
      if (q > 0 && q < 1) htSaari1PokeNote(c, lx + (i - 1) * s * 0.25 + Math.sin(q * 8) * s * 0.05, ly - s * 0.3 - q * s * 0.6, s * 0.06, '#ffe9a0');
    }
  } else {
    // Hohtosienet pöllyttävät valoitiöitä (iso: isoon sieneen tulee kasvot)
    var S1 = s * 0.5, cols = rnd2 < 0.5 ? ['#7fd4ff', '#c9a0ff'] : ['#ff9ee8', '#9fffd8'];
    for (i = 0; i < (big ? 12 : 7); i++) {
      q = Math.min(1, k * 1.3 - (i % 4) * 0.08);
      if (q <= 0) continue;
      htSaari1Spark(c, x + (i % 2 ? s * 0.24 : -s * 0.14) + Math.sin(i * 2.1 + q * 4) * s * 0.25 * q, baseY - s * (i % 2 ? 0.3 : 0.42) - q * s * (0.5 + (i % 3) * 0.2), s * 0.03, cols[i % 2]);
    }
    if (big) {
      c.globalAlpha = Math.min(1, k * 6) * a;
      htSaari1PokeFace(c, x - s * 0.14, baseY - S1 * 0.62, S1 * 0.32, k > 0.5 && k < 0.6);
      artBlush(c, x - s * 0.14 - S1 * 0.22, baseY - S1 * 0.55, S1 * 0.05);
      artBlush(c, x - s * 0.14 + S1 * 0.22, baseY - S1 * 0.55, S1 * 0.05);
    }
  }
  c.restore();
};
HUB_THEMES.nightwood.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.5) { if (big) { playNote(392, 0.1, 0.25, 'sine', 0.3); playNote(330, 0.4, 0.35, 'sine', 0.3); } else htSaari1PokeTune([1568, 1760, 2093], 0.06, 'sine', 0.14); }
  else if (p.rnd < 0.72) htSaari1PokeTune(big ? [659, 784, 988, 1175, 1319] : [784, 1175], 0.1, 'triangle', 0.2);
  else htSaari1PokeTune(big ? [392, 523, 659, 784, 1047] : [523, 784], 0.08, 'sine', 0.22);
};

// ----- Pilvet -----
HUB_THEMES.clouds.pokeColor = '#ffffff';
HUB_THEMES.clouds.pokeDur = 1.8;
HUB_THEMES.clouds.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q, S = s * (0.85 + rnd2 * 0.25), cols = ['#ff7bac', '#ffd23e', '#7fe0a0', '#7fd4ff'];
  c.save();
  c.globalAlpha = a;
  if (rnd < 0.35) {
    // Sadepilvi nousee pinosta ja sataa (iso: sateen jälkeen sateenkaari)
    var cy = baseY - S * 0.9 - Math.min(1, k * 4) * S * 0.2;
    if (big && k > 0.35) {
      q = Math.min(1, (k - 0.35) * 3);
      c.lineCap = 'butt';
      for (i = 0; i < 4; i++) {
        c.strokeStyle = cols[i]; c.lineWidth = S * 0.05;
        c.beginPath(); c.arc(x, cy + S * 0.3, S * (0.5 - i * 0.05), Math.PI, Math.PI + Math.PI * q); c.stroke();
      }
    }
    for (i = 0; i < 8; i++) {
      q = (k * 3 + i * 0.37) % 1;
      if (k > 0.85) continue;
      c.fillStyle = '#7fc8ff';
      c.beginPath(); c.arc(x + (i - 3.5) * S * 0.07, cy + S * 0.1 + q * S * 0.45, S * 0.022, 0, Math.PI * 2); c.fill();
    }
    htSaari1Cloud(c, x, cy, S * 0.2);
  } else if (rnd < 0.7 || rnd2 < 0.6) {
    // Tikkutähti pyörähtää ja säihkyy (iso: tähdenlento lähtee ja palaa)
    var tx = x + S * 0.05, ty = baseY - S * 0.74;
    drawStar(c, tx, ty, S * 0.16 * (1 + htSaari1PokeHop(k) * 0.25), k * Math.PI * 2.4, 1);
    for (i = 0; i < 6; i++) drawStar(c, tx + Math.cos(i * 1.05 + k * 2) * S * 0.45 * k, ty + Math.sin(i * 1.05 + k * 2) * S * 0.45 * k, S * 0.04, k * 6, 0.4);
    if (big) {
      var an = k * Math.PI * 2, sx = tx + Math.sin(an) * S * 0.6, sy = ty - S * 0.3 - (1 - Math.cos(an)) * S * 0.4;
      for (i = 1; i <= 5; i++) {
        c.globalAlpha = a * (1 - i / 6);
        htSaari1Spark(c, tx + Math.sin(an - i * 0.12) * S * 0.6, ty - S * 0.3 - (1 - Math.cos(an - i * 0.12)) * S * 0.4, S * 0.03, '#fff0a0');
      }
      c.globalAlpha = a;
      drawStar(c, sx, sy, S * 0.1, k * 12, 0.8);
    }
  } else {
    // Sateenkaari soi kaista kerrallaan (iso: sydämiä nousee)
    var on = Math.floor(k * 8) % 4;
    c.lineCap = 'butt';
    for (i = 0; i < 4; i++) {
      c.strokeStyle = i === on ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.15)';
      c.lineWidth = S * 0.065;
      c.beginPath(); c.arc(x, baseY - S * 0.16, S * (0.44 - i * 0.065), Math.PI, 0); c.stroke();
    }
    artGlow(c, x, baseY - S * 0.4, S * 0.6, cols[on], 0.35);
    if (big) for (i = 0; i < 4; i++) {
      q = k * 1.3 - i * 0.12;
      if (q > 0 && q < 1) htSaari1PokeHeart(c, x + (i - 1.5) * S * 0.22 + Math.sin(q * 6 + i) * S * 0.05, baseY - S * 0.5 - q * S * 0.7, S * 0.06, cols[i]);
    }
  }
  c.restore();
};
HUB_THEMES.clouds.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.35) { htSaari1PokeTune([1568, 1319, 1175, 1568, 1319], 0.09, 'sine', 0.14); if (big) htSaari1PokeTune([523, 659, 784, 1047], 0.12, 'triangle', 0.22); }
  else if (p.rnd < 0.7 || p.rnd2 < 0.6) htSaari1PokeTune(big ? [1047, 1319, 1568, 2093, 1568, 2093] : [1319, 1760], 0.08, 'sine', 0.2);
  else htSaari1PokeTune(big ? [523, 587, 659, 784, 880, 1047] : [523, 659, 784, 1047], 0.11, 'triangle', 0.2);
};

// ----- Kuu -----
// Pieni lentävä lautanen
function htSaari1PokeUfo(c, x, y, r, k) {
  var i;
  artBlob(c, x, y - r * 0.25, r * 0.45, r * 0.4, '#bff4ff', { lineColor: '#4a6a9a', hi: 0.6 });
  artBlob(c, x, y, r, r * 0.3, '#c9c4e8', { lineColor: '#4a4a80', hi: 0.4 });
  for (i = -1; i <= 1; i++) artCircle(c, x + i * r * 0.5, y + r * 0.05, r * 0.08, ['#ffe27a', '#ff9ee8', '#9fffd8'][(i + 1 + Math.floor(k * 12)) % 3], { line: false });
}
HUB_THEMES.moon.pokeColor = '#fff6d2';
HUB_THEMES.moon.pokeDur = 2;
HUB_THEMES.moon.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, a = htSaari1PokeFade(k), i, q;
  c.save();
  if (rnd < 0.4) {
    // Uninen avaruuspupu kurkkaa kuukiven takaa (iso: herää ja loikkaa vilkuttaen)
    var ax = x - s * 0.1, pk = big ? htSaari1PokeHop(k) : (k < 0.25 ? k / 0.25 : (k > 0.8 ? (1 - k) / 0.2 : 1)), ay = baseY - s * 0.25 - pk * s * (big ? 0.75 : 0.42);
    c.save();
    c.beginPath();
    c.rect(x - s * 1.2, baseY - s * 2, s * 2.4, s * 2);
    if (c.ellipse) {
      c.moveTo(ax + s * 0.32, baseY - s * 0.26); c.ellipse(ax, baseY - s * 0.26, s * 0.32, s * 0.27, 0, 0, Math.PI * 2);
      c.moveTo(x + s * 0.44, baseY - s * 0.12); c.ellipse(x + s * 0.24, baseY - s * 0.12, s * 0.2, s * 0.15, 0, 0, Math.PI * 2);
    }
    c.clip('evenodd');
    htSaari1PokeAlien(c, ax, ay, s * 0.17, !big, big ? Math.abs(Math.sin(k * 12)) : 0);
    c.restore();
    c.globalAlpha = a;
    if (!big) {
      c.fillStyle = '#ffffff';
      c.font = 'bold ' + Math.round(s * 0.16) + 'px Fredoka, sans-serif';
      for (i = 0; i < 2; i++) {
        q = k * 1.4 - 0.3 - i * 0.2;
        if (q > 0 && q < 1) { c.globalAlpha = a * (1 - q); c.fillText('z', ax + s * 0.2 + q * s * 0.25, ay - s * 0.3 - q * s * 0.35); }
      }
    } else for (i = 0; i < 5; i++) drawStar(c, ax + Math.cos(i * 1.26) * s * 0.45 * k, ay - s * 0.2 + Math.sin(i * 1.26) * s * 0.35 * k, s * 0.05, k * 6, 0.5);
  } else if (rnd < 0.75) {
    // Kiteet helähtävät soimaan vuorotellen (iso: valopylväät nousevat kiteistä)
    c.globalAlpha = a;
    for (i = -1; i <= 1; i++) {
      var kx = x + i * s * 0.2, ky = baseY - s * (0.24 + (i === 0 ? 0.1 : 0)), ks = s * (i === 0 ? 0.3 : 0.2), col = CRYSTAL_COLORS[Math.floor(rnd2 * 5 + i + 1) % 5];
      q = htSaari1PokeHop(Math.min(1, Math.max(0, k * 2.2 - (i + 1) * 0.35)));
      if (big) {
        var bg = c.createLinearGradient(0, ky - ks - s * 1.2 * htSaari1PokeHop(k), 0, ky - ks);
        bg.addColorStop(0, artRGBA(col, 0)); bg.addColorStop(1, artRGBA(col, 0.55));
        c.fillStyle = bg;
        c.fillRect(kx - ks * 0.3, ky - ks - s * 1.2 * htSaari1PokeHop(k), ks * 0.6, s * 1.2 * htSaari1PokeHop(k));
      }
      if (q > 0.01) {
        artGlow(c, kx, ky, ks * 1.6, col, 0.8 * q);
        drawStar(c, kx, ky - ks, s * 0.06 * q, k * 4, 0.6);
      }
    }
  } else {
    // Tähti välkkyy ja kuukivi hehkuu (iso: lentävä lautanen käy kurkkaamassa)
    c.globalAlpha = a;
    artGlow(c, x, baseY - s * 0.2, s * 0.5, '#dfe8ff', 0.6 * htSaari1PokeHop(k));
    drawStar(c, x - s * 0.28, baseY - s * 0.6 - htSaari1PokeHop(k) * s * 0.15, s * 0.1 * (1 + htSaari1PokeHop(k) * 0.4), k * Math.PI * 2, 1);
    if (big) {
      var ux = x - s * 0.9 + k * s * 1.8, uy = baseY - s * 1.05 + Math.sin(k * 10) * s * 0.04;
      if (k > 0.35 && k < 0.65) {
        var bk = htSaari1PokeHop((k - 0.35) / 0.3);
        c.fillStyle = 'rgba(200,255,220,' + (0.35 * bk) + ')';
        c.beginPath(); c.moveTo(ux - s * 0.06, uy); c.lineTo(ux + s * 0.06, uy); c.lineTo(ux + s * 0.25, baseY - s * 0.05); c.lineTo(ux - s * 0.25, baseY - s * 0.05); c.closePath(); c.fill();
      }
      htSaari1PokeUfo(c, ux, uy, s * 0.22, k);
    }
  }
  c.restore();
};
HUB_THEMES.moon.poke = function (p) {
  var big = p.n % 3 === 0;
  if (p.rnd < 0.4) { if (big) htSaari1PokeTune([392, 523, 659, 784, 1047], 0.09, 'square', 0.08); else htSaari1PokeTune([330, 294, 262], 0.25, 'sine', 0.16); }
  else if (p.rnd < 0.75) htSaari1PokeTune(big ? [1047, 1319, 1568, 2093] : [1319, 1568, 2093], 0.16, 'sine', 0.18);
  else if (big) { htSaari1PokeTune([880, 1175, 880, 1175, 880, 1175], 0.1, 'sine', 0.12); }
  else htSaari1PokeTune([1568, 2093], 0.08, 'sine', 0.18);
};
