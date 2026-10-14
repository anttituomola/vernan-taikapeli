'use strict';

// Sokkeloteemat (ks. hub-themes.js): Linnasaaren vyöhykkeet metsän alapuolella
// (puutarha, jää, lampi, luola, niitty, suo) ja Hoivasaari (niitty koko saarena).
// Vierekkäiset vyöhykkeet erottuvat maan värillä ja koristeilla, mutta pysyvät
// samassa pehmeässä pastellisävyssä metsän kanssa.

// ---------- Yhteiset palat ----------
// Pieni vesilätäkkö kiiltoineen (lampi, suo)
function htLinnaPuddle(b, x, y, rx, ry, color) {
  artBlob(b, x, y, rx, ry, color, { lineColor: artShade(color, -0.3) });
  b.strokeStyle = 'rgba(255,255,255,0.55)';
  b.lineWidth = Math.max(1, ry * 0.18);
  b.lineCap = 'round';
  b.beginPath(); b.ellipse(x - rx * 0.15, y - ry * 0.1, rx * 0.5, ry * 0.4, 0, Math.PI * 1.1, Math.PI * 1.6); b.stroke();
}
// Kaisla: varsi ja ruskea nuija
function htLinnaCattail(b, x, baseY, h, lean) {
  var tx = x + lean * h * 0.25, ty = baseY - h;
  b.strokeStyle = '#3f7f3a';
  b.lineWidth = Math.max(1.2, h * 0.05);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY); b.quadraticCurveTo(x, baseY - h * 0.5, tx, ty); b.stroke();
  artBlob(b, tx + lean * h * 0.03, ty + h * 0.16, h * 0.07, h * 0.15, '#9a5a32', { rot: lean * 0.25 });
}
// Lehtiruoho kaislan juurella
function htLinnaBlades(b, x, baseY, h, color) {
  var k;
  b.strokeStyle = color;
  b.lineWidth = Math.max(1.2, h * 0.07);
  b.lineCap = 'round';
  for (k = -2; k <= 2; k++) {
    b.beginPath(); b.moveTo(x + k * h * 0.08, baseY);
    b.quadraticCurveTo(x + k * h * 0.12, baseY - h * 0.5, x + k * h * 0.3, baseY - h * (0.75 - Math.abs(k) * 0.12)); b.stroke();
  }
}
// Sieni: jalka ja pyöreä lakki pilkuilla. glow: hehkuva luolasieni
function htLinnaShroom(b, x, baseY, s, cap, glow) {
  if (glow) artGlow(b, x, baseY - s * 0.75, s * 1.3, cap, 0.45);
  artRoundRect(b, x - s * 0.17, baseY - s * 0.6, s * 0.34, s * 0.6, s * 0.12, '#fff3e0', { lineColor: '#b89a7a' });
  b.beginPath(); b.arc(x, baseY - s * 0.55, s * 0.5, Math.PI, 0); b.quadraticCurveTo(x, baseY - s * 0.42, x - s * 0.5, baseY - s * 0.55); b.closePath();
  artFillPath(b, cap, baseY - s * 1.05, baseY - s * 0.5, s * 0.5, {});
  artCircle(b, x - s * 0.2, baseY - s * 0.78, s * 0.08, '#ffffff', { line: false });
  artCircle(b, x + s * 0.17, baseY - s * 0.68, s * 0.07, '#ffffff', { line: false });
  artCircle(b, x + s * 0.02, baseY - s * 0.92, s * 0.05, '#ffffff', { line: false });
}
// Pikku kukka varrella (kukkapenkit, niitty)
function htLinnaStemFlower(b, x, baseY, h, color) {
  b.strokeStyle = '#4f9a42';
  b.lineWidth = Math.max(1, h * 0.08);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY); b.lineTo(x, baseY - h); b.stroke();
  drawFlower(b, x, baseY - h, h * 0.22, color);
}
// Marjapensas: kolme lehväpalloa ja marjoja
function htLinnaBerryBush(b, x, baseY, s, berry) {
  var leaf = '#4fae55', i;
  artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.15);
  artCircle(b, x - s * 0.2, baseY - s * 0.14, s * 0.17, leaf, {});
  artCircle(b, x + s * 0.2, baseY - s * 0.14, s * 0.17, leaf, {});
  artCircle(b, x, baseY - s * 0.24, s * 0.22, leaf, { hi: 0.3 });
  for (i = 0; i < 6; i++) {
    artCircle(b, x + Math.cos(i * 2.4) * s * (0.12 + (i % 3) * 0.06), baseY - s * 0.2 + Math.sin(i * 2.4) * s * 0.1, s * 0.045, berry, { hi: 0.5 });
  }
}
// Mökki: seinä, harjakatto, pyöreä ikkuna ja ovi. sleepy: ikkunassa uninen valo ja zZ
function htLinnaCottage(b, x, baseY, s, roof, sleepy) {
  var w = s * 0.36, h = s * 0.3, line = '#8a6448';
  artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.16);
  artRoundRect(b, x - w / 2, baseY - h, w, h, s * 0.03, '#fbe8cc', { lineColor: line });
  // Savupiippu ennen kattoa, jotta katto peittää sen juuren
  artRoundRect(b, x + w * 0.18, baseY - h - s * 0.2, s * 0.07, s * 0.14, s * 0.02, '#c98a6a', { lineColor: line });
  b.beginPath(); b.moveTo(x - w * 0.68, baseY - h + s * 0.02); b.quadraticCurveTo(x, baseY - h - s * 0.3, x + w * 0.68, baseY - h + s * 0.02); b.closePath();
  artFillPath(b, roof, baseY - h - s * 0.24, baseY - h, s * 0.2, {});
  artRoundRect(b, x - w * 0.36, baseY - h * 0.62, w * 0.24, h * 0.62, w * 0.12, '#a5704c', { lineColor: line });
  artCircle(b, x + w * 0.2, baseY - h * 0.55, s * 0.055, sleepy ? '#ffe9a0' : '#bfe6ff', { lineColor: line });
  if (sleepy) {
    b.fillStyle = 'rgba(120,100,180,0.75)';
    b.font = 'bold ' + Math.round(s * 0.12) + 'px ' + UI_FONT;
    b.textAlign = 'center';
    b.fillText('z', x + w * 0.42, baseY - h - s * 0.24);
    b.font = 'bold ' + Math.round(s * 0.09) + 'px ' + UI_FONT;
    b.fillText('z', x + w * 0.62, baseY - h - s * 0.34);
  } else {
    b.fillStyle = 'rgba(255,255,255,0.7)';
    cloudShape(b, x + w * 0.3, baseY - h - s * 0.3, s * 0.035);
  }
}

// ---------- Puutarha ----------
var HT_LINNA_GARDEN_COLS = ['#ff7bac', '#c9a0ff', '#ffd24f', '#7fd4ff', '#ff9d5c'];
function htLinnaFlowerBed(b, x, baseY, s, rnd) {
  var i, w = s * 0.82;
  artShadow(b, x, baseY, s * 0.48, s * 0.08, 0.15);
  // Puureunus ja multa
  artRoundRect(b, x - w / 2, baseY - s * 0.14, w, s * 0.14, s * 0.05, '#c98f5a', { lineColor: '#7a5030' });
  artBlob(b, x, baseY - s * 0.15, w * 0.46, s * 0.06, '#7a5236', { line: false });
  for (i = 0; i < 5; i++) {
    htLinnaStemFlower(b, x - w * 0.38 + i * w * 0.19, baseY - s * 0.15, s * (0.16 + ((i + Math.floor(rnd * 7)) % 3) * 0.05), HT_LINNA_GARDEN_COLS[(i + Math.floor(rnd * 5)) % 5]);
  }
}
function htLinnaTopiary(b, x, baseY, s) {
  var leaf = '#4fae55';
  artShadow(b, x, baseY, s * 0.24, s * 0.06, 0.16);
  artLimb(b, x, baseY - s * 0.15, x, baseY - s * 0.32, s * 0.04, '#8a5a34');
  b.beginPath(); b.moveTo(x - s * 0.13, baseY - s * 0.18); b.lineTo(x + s * 0.13, baseY - s * 0.18); b.lineTo(x + s * 0.1, baseY); b.lineTo(x - s * 0.1, baseY); b.closePath();
  artFillPath(b, '#e07a5a', baseY - s * 0.18, baseY, s * 0.12, {});
  artCircle(b, x, baseY - s * 0.38, s * 0.15, leaf, { hi: 0.3 });
  artCircle(b, x, baseY - s * 0.6, s * 0.1, leaf, { hi: 0.3 });
}
function htLinnaHedge(b, x, baseY, s) {
  var leaf = '#58b25a';
  artShadow(b, x, baseY, s * 0.5, s * 0.08, 0.15);
  artRoundRect(b, x - s * 0.44, baseY - s * 0.3, s * 0.88, s * 0.3, s * 0.13, leaf, { hi: 0.3 });
  artCircle(b, x - s * 0.22, baseY - s * 0.22, s * 0.035, '#ffffff', { line: false });
  artCircle(b, x + s * 0.12, baseY - s * 0.16, s * 0.035, '#ffd24f', { line: false });
  artCircle(b, x + s * 0.3, baseY - s * 0.24, s * 0.035, '#ff7bac', { line: false });
}
function htLinnaFountain(b, x, baseY, s) {
  var stone = '#e8e2f2', line = '#8a82a8', water = '#7fd0f5';
  artShadow(b, x, baseY, s * 0.48, s * 0.08, 0.16);
  // Allas
  b.beginPath(); b.moveTo(x - s * 0.42, baseY - s * 0.16); b.lineTo(x + s * 0.42, baseY - s * 0.16); b.quadraticCurveTo(x + s * 0.4, baseY, x + s * 0.3, baseY); b.lineTo(x - s * 0.3, baseY); b.quadraticCurveTo(x - s * 0.4, baseY, x - s * 0.42, baseY - s * 0.16); b.closePath();
  artFillPath(b, stone, baseY - s * 0.16, baseY, s * 0.2, { lineColor: line });
  artBlob(b, x, baseY - s * 0.16, s * 0.4, s * 0.06, water, { lineColor: line });
  // Pylväs ja yläkulho
  artRoundRect(b, x - s * 0.04, baseY - s * 0.44, s * 0.08, s * 0.3, s * 0.03, stone, { lineColor: line });
  artBlob(b, x, baseY - s * 0.44, s * 0.16, s * 0.05, stone, { lineColor: line });
  // Vesikaaret
  b.strokeStyle = water;
  b.lineWidth = Math.max(1.5, s * 0.035);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY - s * 0.5); b.quadraticCurveTo(x, baseY - s * 0.68, x - s * 0.22, baseY - s * 0.22); b.stroke();
  b.beginPath(); b.moveTo(x, baseY - s * 0.5); b.quadraticCurveTo(x, baseY - s * 0.68, x + s * 0.22, baseY - s * 0.22); b.stroke();
  artCircle(b, x, baseY - s * 0.62, s * 0.05, '#c8f0ff', { lineColor: '#5fa8d8' });
}

HUB_THEMES.garden = {
  ground: ['#93d672', '#86cd68'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.45) drawFlower(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.25 + rnd * 0.6), s * 0.05, HT_LINNA_GARDEN_COLS[Math.floor(rnd2 * 5)]);
    else if (rnd < 0.7) {
      // Askelkivi
      artBlob(b, x + s * (0.25 + rnd2 * 0.5), y + s * (0.3 + rnd * 0.5), s * 0.08, s * 0.05, '#ede6d6', { lineColor: '#b8ad96' });
    } else hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.8, s, '#5aaa4a');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.4) htLinnaFlowerBed(b, x, baseY, s * 1.45, rnd2);
    else if (rnd < 0.62) htLinnaTopiary(b, x, baseY, s * 1.9);
    else if (rnd < 0.82) htLinnaHedge(b, x, baseY, s * 1.4);
    else htLinnaFountain(b, x, baseY, s * 1.65);
  }
};

// ---------- Jää ----------
// Lumikuusi: kolme kerrosta, jokaisen alareunassa lumikinos
function htLinnaSnowFir(b, x, baseY, s) {
  var i, ty, tw, k;
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.18);
  artRoundRect(b, x - s * 0.04, baseY - s * 0.14, s * 0.08, s * 0.14, s * 0.02, '#7a5236', {});
  for (i = 0; i < 3; i++) {
    ty = baseY - s * 0.1 - i * s * 0.2;
    tw = s * (0.3 - i * 0.07);
    b.beginPath(); b.moveTo(x - tw, ty); b.quadraticCurveTo(x, ty + s * 0.04, x + tw, ty); b.lineTo(x, ty - s * 0.3); b.closePath();
    artFillPath(b, '#3f9a78', ty - s * 0.3, ty, tw, {});
    b.fillStyle = '#ffffff';
    for (k = -1; k <= 1; k++) {
      b.beginPath(); b.arc(x + k * tw * 0.55, ty - s * 0.01, tw * 0.28, Math.PI, 0); b.fill();
    }
  }
  b.beginPath(); b.moveTo(x, baseY - s * 0.71); b.lineTo(x + s * 0.06, baseY - s * 0.6); b.lineTo(x - s * 0.06, baseY - s * 0.6); b.closePath();
  b.fill();
}
function htLinnaSnowman(b, x, baseY, s, scarf) {
  var o = { lineColor: '#7a9ec0', shadeTo: '#cfe2f5' };
  artShadow(b, x, baseY, s * 0.26, s * 0.06, 0.18);
  b.strokeStyle = '#7a5236';
  b.lineWidth = Math.max(1.2, s * 0.025);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x - s * 0.1, baseY - s * 0.3); b.lineTo(x - s * 0.26, baseY - s * 0.4); b.moveTo(x + s * 0.1, baseY - s * 0.3); b.lineTo(x + s * 0.25, baseY - s * 0.42); b.stroke();
  artCircle(b, x, baseY - s * 0.15, s * 0.16, '#ffffff', o);
  artCircle(b, x, baseY - s * 0.4, s * 0.12, '#ffffff', { lineColor: o.lineColor, shadeTo: o.shadeTo, hi: 0.5 });
  artRoundRect(b, x - s * 0.12, baseY - s * 0.31, s * 0.24, s * 0.05, s * 0.025, scarf, {});
  artRoundRect(b, x + s * 0.03, baseY - s * 0.3, s * 0.05, s * 0.12, s * 0.02, scarf, {});
  b.fillStyle = '#3a2e40';
  b.beginPath(); b.arc(x - s * 0.04, baseY - s * 0.43, s * 0.018, 0, Math.PI * 2); b.arc(x + s * 0.045, baseY - s * 0.43, s * 0.018, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.moveTo(x, baseY - s * 0.4); b.lineTo(x + s * 0.11, baseY - s * 0.38); b.lineTo(x, baseY - s * 0.37); b.closePath();
  b.fillStyle = '#ff8a3a'; b.fill();
  artRoundRect(b, x - s * 0.08, baseY - s * 0.6, s * 0.16, s * 0.1, s * 0.02, '#5a4a8a', {});
  artRoundRect(b, x - s * 0.12, baseY - s * 0.52, s * 0.24, s * 0.03, s * 0.015, '#5a4a8a', {});
}
function htLinnaIceCrystals(b, x, baseY, s, rnd) {
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.14);
  artGlow(b, x, baseY - s * 0.25, s * 0.4, '#bfe9ff', 0.5);
  drawCrystal(b, x - s * 0.15, baseY - s * 0.16, s * 0.17, '#7cc8f5');
  drawCrystal(b, x + s * 0.15, baseY - s * 0.14, s * 0.15, rnd < 0.5 ? '#9fd8ff' : '#b8a8f5');
  drawCrystal(b, x, baseY - s * 0.27, s * 0.28, '#94d4fa');
}
// Lumikinos ja tähtisäihke
function htLinnaSnowDrift(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.42, s * 0.06, 0.12);
  artBlob(b, x - s * 0.15, baseY - s * 0.08, s * 0.24, s * 0.1, '#ffffff', { lineColor: '#9fbfdc', shadeTo: '#d6e8f8' });
  artBlob(b, x + s * 0.14, baseY - s * 0.1, s * 0.22, s * 0.13, '#ffffff', { lineColor: '#9fbfdc', shadeTo: '#d6e8f8', hi: 0.5 });
  drawSnowflake(b, x + s * 0.05, baseY - s * 0.42, s * 0.08);
}

HUB_THEMES.ice = {
  ground: ['#eef7ff', '#dcecfb'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.4) artBlob(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.35 + rnd * 0.5), s * 0.16, s * 0.05, '#ffffff', { line: false });
    else if (rnd < 0.6) {
      // Jäälaatta kiiltoineen
      artBlob(b, x + s * (0.3 + rnd2 * 0.4), y + s * 0.6, s * 0.14, s * 0.07, '#cbe6fb', { lineColor: '#a6cdea' });
      artHighlight(b, x + s * (0.27 + rnd2 * 0.4), y + s * 0.58, s * 0.05, s * 0.015, 0.8);
    } else if (rnd < 0.72) drawSnowflake(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.4, s * 0.05);
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.45) {
      htLinnaSnowFir(b, x - s * 0.1, baseY, s * 1.8);
      if (rnd2 < 0.5) htLinnaSnowFir(b, x + s * 0.3, baseY + s * 0.03, s * 1.05);
    } else if (rnd < 0.62) htLinnaSnowman(b, x, baseY, s * 1.9, rnd2 < 0.5 ? '#ff6f8e' : '#5fa8ff');
    else if (rnd < 0.8) htLinnaIceCrystals(b, x, baseY, s * 1.7, rnd2);
    else htLinnaSnowDrift(b, x, baseY, s * 1.4);
  }
};

// ---------- Lampi ----------
var HT_LINNA_WATER = '#6cc8e0';
function htLinnaLilyPool(b, x, baseY, s, rnd) {
  var cy = baseY - s * 0.14;
  // Ruohoinen reunus, vesi ja kaislat takareunassa
  artBlob(b, x, cy + s * 0.02, s * 0.5, s * 0.21, '#6fc06a', { line: false });
  htLinnaPuddle(b, x, cy, s * 0.45, s * 0.17, HT_LINNA_WATER);
  htLinnaCattail(b, x - s * 0.36, cy - s * 0.08, s * 0.42, -0.3);
  htLinnaCattail(b, x - s * 0.26, cy - s * 0.1, s * 0.5, 0.1);
  htLinnaPad(b, x - s * 0.16, cy + s * 0.02, s * 0.12);
  htLinnaPad(b, x + s * 0.17, cy + s * 0.03, s * 0.14);
  if (rnd < 0.5) {
    // Sammakko lumpeenlehdellä
    var fx = x + s * 0.17, fy = cy + s * 0.02;
    artBlob(b, fx, fy - s * 0.06, s * 0.09, s * 0.07, '#6fd26a', { hi: 0.35 });
    artCircle(b, fx - s * 0.05, fy - s * 0.13, s * 0.035, '#6fd26a', {});
    artCircle(b, fx + s * 0.05, fy - s * 0.13, s * 0.035, '#6fd26a', {});
    b.fillStyle = '#2a2a3a';
    b.beginPath(); b.arc(fx - s * 0.05, fy - s * 0.135, s * 0.014, 0, Math.PI * 2); b.arc(fx + s * 0.05, fy - s * 0.135, s * 0.014, 0, Math.PI * 2); b.fill();
  } else {
    // Lumpeenkukka
    artCircle(b, x + s * 0.17, cy - s * 0.02, s * 0.065, '#ffb0d0', {});
    artCircle(b, x + s * 0.17, cy - s * 0.05, s * 0.035, '#ffe27a', { line: false });
  }
}
// Lumpeenlehti: pyöreä lehti, josta puuttuu kiila
function htLinnaPad(b, x, y, r) {
  b.beginPath(); b.moveTo(x, y); b.ellipse(x, y, r, r * 0.5, 0, -1.2, Math.PI * 2 - 1.6); b.closePath();
  artFillPath(b, '#4fbf55', y - r * 0.5, y + r * 0.5, r, { lineColor: '#2a7a34' });
}
function htLinnaReedClump(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.3, s * 0.06, 0.14);
  htLinnaPuddle(b, x, baseY - s * 0.04, s * 0.3, s * 0.08, HT_LINNA_WATER);
  htLinnaBlades(b, x, baseY - s * 0.02, s * 0.3, '#4f9e45');
  htLinnaCattail(b, x - s * 0.12, baseY - s * 0.03, s * 0.55, -0.4);
  htLinnaCattail(b, x + s * 0.02, baseY - s * 0.03, s * 0.66, 0.1);
  htLinnaCattail(b, x + s * 0.16, baseY - s * 0.03, s * 0.48, 0.5);
}
function htLinnaWillow(b, x, baseY, s) {
  var k;
  drawTree(b, x, baseY, s * 0.62, 0, { leaf: '#7fcf8a', trunk: '#8a6a4a' });
  // Riippuvat oksat
  b.strokeStyle = '#5fb070';
  b.lineWidth = Math.max(1.2, s * 0.03);
  b.lineCap = 'round';
  for (k = -2; k <= 2; k++) {
    b.beginPath(); b.moveTo(x + k * s * 0.12, baseY - s * 0.5); b.quadraticCurveTo(x + k * s * 0.15, baseY - s * 0.3, x + k * s * 0.13, baseY - s * (0.18 + Math.abs(k) * 0.04)); b.stroke();
  }
}

HUB_THEMES.pond = {
  ground: ['#8ed8a8', '#7fcf9c'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.3) htLinnaPuddle(b, x + s * (0.3 + rnd2 * 0.4), y + s * (0.4 + rnd * 0.4), s * 0.13, s * 0.06, HT_LINNA_WATER);
    else if (rnd < 0.6) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.4 + rnd * 0.5), s, '#4fa86a');
    else if (rnd < 0.7) artBlob(b, x + s * (0.2 + rnd2 * 0.6), y + s * 0.7, s * 0.06, s * 0.04, '#d8d2c4', { lineColor: '#9a9284' });
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.45) htLinnaLilyPool(b, x, baseY, s * 1.25, rnd2);
    else if (rnd < 0.72) htLinnaReedClump(b, x, baseY, s * 1.7);
    else htLinnaWillow(b, x, baseY, s * 1.75);
  }
};

// ---------- Luola ----------
var HT_LINNA_ROCK = '#8a7cb8';
function htLinnaStalagmites(b, x, baseY, s, rnd) {
  var i, px = [-0.22, 0.02, 0.24], ph = [0.34, 0.56, 0.28], pw = [0.12, 0.16, 0.11];
  artShadow(b, x, baseY, s * 0.42, s * 0.07, 0.2);
  for (i = 0; i < 3; i++) {
    var sx = x + px[i] * s, h = ph[(i + Math.floor(rnd * 3)) % 3] * s, w = pw[i] * s;
    b.beginPath(); b.moveTo(sx - w, baseY); b.quadraticCurveTo(sx - w * 0.5, baseY - h * 0.5, sx - w * 0.12, baseY - h);
    b.quadraticCurveTo(sx, baseY - h - w * 0.2, sx + w * 0.12, baseY - h); b.quadraticCurveTo(sx + w * 0.5, baseY - h * 0.5, sx + w, baseY); b.closePath();
    artFillPath(b, HT_LINNA_ROCK, baseY - h, baseY, w, { lineColor: '#4a3e72' });
    artHighlight(b, sx - w * 0.35, baseY - h * 0.45, w * 0.18, h * 0.15, 0.25);
  }
}
function htLinnaCrystalCluster(b, x, baseY, s, rnd) {
  var col = CRYSTAL_COLORS[Math.floor(rnd * CRYSTAL_COLORS.length)], col2 = CRYSTAL_COLORS[Math.floor(rnd * 7) % CRYSTAL_COLORS.length];
  artGlow(b, x, baseY - s * 0.25, s * 0.55, col, 0.45);
  artBlob(b, x, baseY - s * 0.04, s * 0.32, s * 0.08, HT_LINNA_ROCK, { lineColor: '#4a3e72' });
  drawCrystal(b, x - s * 0.17, baseY - s * 0.17, s * 0.17, col2);
  drawCrystal(b, x + s * 0.17, baseY - s * 0.15, s * 0.15, col2);
  drawCrystal(b, x, baseY - s * 0.3, s * 0.3, col);
}
function htLinnaGlowShrooms(b, x, baseY, s, rnd) {
  var cap = rnd < 0.5 ? '#6fe0d8' : '#c9a0ff';
  artShadow(b, x, baseY, s * 0.32, s * 0.06, 0.2);
  htLinnaShroom(b, x - s * 0.14, baseY, s * 0.36, cap, true);
  htLinnaShroom(b, x + s * 0.16, baseY, s * 0.24, cap, true);
  htLinnaShroom(b, x + s * 0.02, baseY + s * 0.02, s * 0.16, artShade(cap, 0.3), false);
}

HUB_THEMES.cave = {
  ground: ['#a596cc', '#988abf'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.4) artBlob(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.4 + rnd * 0.45), s * 0.07, s * 0.045, '#8577b0', { lineColor: '#5f5290' });
    else if (rnd < 0.62) {
      var gx = x + s * (0.2 + rnd2 * 0.6), gy = y + s * (0.3 + rnd * 0.5), gc = CRYSTAL_COLORS[Math.floor(rnd2 * CRYSTAL_COLORS.length)];
      artGlow(b, gx, gy, s * 0.14, gc, 0.6);
      artCircle(b, gx, gy, s * 0.025, '#ffffff', { line: false });
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.4) htLinnaCrystalCluster(b, x, baseY, s * 1.75, rnd2);
    else if (rnd < 0.68) htLinnaStalagmites(b, x, baseY, s * 1.6, rnd2);
    else htLinnaGlowShrooms(b, x, baseY, s * 1.8, rnd2);
  }
};

// ---------- Niitty (Linnasaaren vasen alakulma ja koko Hoivasaari) ----------
function htLinnaSunflower(b, x, baseY, s) {
  var i, a;
  artShadow(b, x, baseY, s * 0.2, s * 0.05, 0.14);
  b.strokeStyle = '#4f9a42';
  b.lineWidth = Math.max(1.5, s * 0.04);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY); b.lineTo(x, baseY - s * 0.48); b.stroke();
  artBlob(b, x + s * 0.07, baseY - s * 0.2, s * 0.07, s * 0.035, '#5fb055', { rot: -0.5 });
  artBlob(b, x - s * 0.07, baseY - s * 0.3, s * 0.07, s * 0.035, '#5fb055', { rot: 0.5 });
  for (i = 0; i < 10; i++) {
    a = i * Math.PI / 5;
    artBlob(b, x + Math.cos(a) * s * 0.1, baseY - s * 0.52 + Math.sin(a) * s * 0.1, s * 0.06, s * 0.03, '#ffd23e', { rot: a, lineColor: '#d09018' });
  }
  artCircle(b, x, baseY - s * 0.52, s * 0.065, '#9a5a32', {});
}
function htLinnaMeadowBunny(b, x, baseY, s, rnd) {
  htLinnaStemFlower(b, x + s * 0.24, baseY, s * 0.18, rnd < 0.5 ? '#ff7bac' : '#ffe27a');
  drawBunny(b, x - s * 0.04, baseY, s * 0.24, 0, rnd * 3, false);
  // Porkkana pupun vieressä
  b.beginPath(); b.moveTo(x - s * 0.34, baseY - s * 0.02); b.lineTo(x - s * 0.24, baseY - s * 0.06); b.lineTo(x - s * 0.36, baseY - s * 0.1); b.closePath();
  artFillPath(b, '#ff9a3a', baseY - s * 0.1, baseY, s * 0.05, {});
  artBlob(b, x - s * 0.39, baseY - s * 0.07, s * 0.035, s * 0.02, '#5fb055', { line: false });
}
function htLinnaFlowerPatch(b, x, baseY, s, rnd) {
  var i, cols = ['#ff7bac', '#ffe27a', '#c9a0ff', '#ff9d5c', '#7fd4ff'];
  artShadow(b, x, baseY, s * 0.34, s * 0.05, 0.1);
  htLinnaBlades(b, x, baseY, s * 0.22, '#5fb055');
  for (i = 0; i < 4; i++) htLinnaStemFlower(b, x + (i - 1.5) * s * 0.16, baseY, s * (0.18 + (i % 2) * 0.1), cols[(i + Math.floor(rnd * 5)) % 5]);
}

HUB_THEMES.meadow = {
  // Hoivasaari: lempeä aamutaivas, kumpuja, mökkejä ja marjapensaita
  sky: ['#ffe3ef', '#fff6dc'],
  ground: ['#9fdc7e', '#93d272'],
  earth: '#b07e52',
  path: ['#d19a72', '#fdebd0'],
  backdrop: function (b, w, h, lay) {
    var i, x, by, left = lay.ox - lay.cell, right = lay.ox + (lay.cols + 1) * lay.cell;
    // Aurinko (ei drawBgSunia: se rekisteröisi tökättävän auringon)
    var sx = w * 0.87, sy = h * 0.18, sr = h * 0.05, sg = b.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
    artGlow(b, sx, sy, sr * 3, '#fff1b8', 0.7);
    sg.addColorStop(0, '#fffdf0');
    sg.addColorStop(1, '#ffd45a');
    b.fillStyle = sg;
    b.beginPath(); b.arc(sx, sy, sr, 0, Math.PI * 2); b.fill();
    hubThemeClouds(b, w, h, 5);
    hubThemeHills(b, w, h, lay, ['#e6f2cf', '#c9e8ac', '#addc90'], 0.04);
    for (i = 0; i < 16; i++) {
      x = (i / 15) * w;
      by = lay.oy + lay.rows * lay.cell * 0.3 + h * 0.22 + (i % 3) * h * 0.05;
      if (x > left && x < right) continue;
      if (i % 4 === 1) htLinnaCottage(b, x, by, h * 0.12, ['#ff9ab8', '#c9a0ff', '#ffb36b'][i % 3], i % 8 === 1);
      else if (i % 4 === 3) htLinnaBerryBush(b, x, by, h * 0.09, i % 8 === 3 ? '#e8456a' : '#6a7fe0');
      else drawTree(b, x, by, h * (0.06 + (i % 3) * 0.015), 0.3, { leaf: '#86cf6a' });
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.4) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.3 + rnd * 0.6), s, '#62b24e');
    else if (rnd < 0.62) drawFlower(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.25 + rnd * 0.55), s * 0.05, ['#ff7bac', '#ffe27a', '#c9a0ff', '#ffffff'][Math.floor(rnd2 * 4)]);
    else if (rnd < 0.68) {
      // Pikkusydän apilan lehtenä
      b.fillStyle = '#ff9ab8';
      drawHeartShape(b, x + s * (0.25 + rnd2 * 0.5), y + s * 0.6, s * 0.05, true);
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.32) htLinnaBerryBush(b, x, baseY, s * 1.6, rnd2 < 0.5 ? '#e8456a' : '#6a7fe0');
    else if (rnd < 0.42) htLinnaCottage(b, x, baseY, s * 1.7, ['#ff9ab8', '#c9a0ff', '#ffb36b'][Math.floor(rnd2 * 3)], rnd2 < 0.5);
    else if (rnd < 0.58) htLinnaMeadowBunny(b, x, baseY, s * 1.6, rnd2);
    else if (rnd < 0.74) htLinnaSunflower(b, x, baseY, s * 1.9);
    else htLinnaFlowerPatch(b, x, baseY, s * 1.6, rnd2);
  },
  // Kenttä on hoitolamökki: kentän kuva pyöreässä ovessa, läpäistyssä lämmin valo
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#ff9ab8', line = '#8a6448', base = y + s * 0.36, w = s * 0.96, top = y - s * 0.38;
    var wallCol = artMix(col, '#fff6ea', 0.78), dy = y - s * 0.02;
    if (st.next) artGlow(c, x, y - s * 0.2, s * 0.85, '#ffe68a', 0.5);
    artShadow(c, x, base + s * 0.02, s * 0.6, s * 0.12, 0.22);
    // Savupiippu, seinä ja katto kentän värillä
    artRoundRect(c, x + w * 0.24, top - s * 0.36, s * 0.12, s * 0.26, s * 0.03, '#c98a6a', { lineColor: line });
    artRoundRect(c, x - w / 2, top, w, base - top, s * 0.1, wallCol, { lineColor: artShade(col, -0.45) });
    c.beginPath(); c.moveTo(x - w * 0.64, top + s * 0.1); c.quadraticCurveTo(x - w * 0.2, top - s * 0.3, x, top - s * 0.46);
    c.quadraticCurveTo(x + w * 0.2, top - s * 0.3, x + w * 0.64, top + s * 0.1); c.closePath();
    artFillPath(c, col, top - s * 0.46, top + s * 0.1, s * 0.3, { lineColor: artShade(col, -0.45) });
    artHighlight(c, x - w * 0.24, top - s * 0.1, s * 0.12, s * 0.035, 0.45);
    // Pyöreä ikkuna, jossa kentän kuva: läpäistyssä lämmin valo
    var ig = c.createRadialGradient(x, dy, s * 0.05, x, dy, s * 0.34);
    ig.addColorStop(0, st.cleared ? '#fff6cc' : '#ffffff');
    ig.addColorStop(1, st.cleared ? '#ffd877' : '#efe4f7');
    c.beginPath(); c.arc(x, dy, s * 0.33, 0, Math.PI * 2);
    c.fillStyle = ig; c.fill();
    c.strokeStyle = artShade(col, -0.35);
    c.lineWidth = Math.max(2, s * 0.06);
    c.stroke();
    // Kynnys ja kukat seinän vieressä
    artRoundRect(c, x - w * 0.6, base - s * 0.06, w * 1.2, s * 0.09, s * 0.04, '#e3c79c', { lineColor: line });
    drawFlower(c, x - w * 0.6, base - s * 0.1, s * 0.045, '#ff7bac');
    drawFlower(c, x + w * 0.6, base - s * 0.1, s * 0.045, '#ffe27a');
    // Läpäisty: savupiipusta nousee sydän
    if (st.cleared) drawHeartShape(c, x + w * 0.3, top - s * 0.5, s * 0.09, true);
    drawHubRoomIcon(c, room.kind, x, dy, s * 1.05);
  }
};

// ---------- Suo ----------
function htLinnaTwistedTree(b, x, baseY, s, rnd) {
  var trunk = '#6e5a46', leaf = '#5c8a4a', k, dir = rnd < 0.5 ? -1 : 1;
  artShadow(b, x, baseY, s * 0.36, s * 0.07, 0.2);
  b.beginPath();
  b.moveTo(x - s * 0.1, baseY);
  b.quadraticCurveTo(x - s * 0.02 + dir * s * 0.12, baseY - s * 0.25, x - s * 0.04 - dir * s * 0.06, baseY - s * 0.5);
  b.lineTo(x + s * 0.04 - dir * s * 0.06, baseY - s * 0.5);
  b.quadraticCurveTo(x + s * 0.06 + dir * s * 0.12, baseY - s * 0.25, x + s * 0.1, baseY);
  b.closePath();
  artFillPath(b, trunk, baseY - s * 0.5, baseY, s * 0.08, {});
  artLimb(b, x - dir * s * 0.04, baseY - s * 0.38, x + dir * s * 0.24, baseY - s * 0.5, s * 0.035, trunk);
  artBlob(b, x - dir * s * 0.12, baseY - s * 0.58, s * 0.24, s * 0.15, leaf, {});
  artBlob(b, x + dir * s * 0.2, baseY - s * 0.55, s * 0.17, s * 0.11, leaf, {});
  artBlob(b, x + dir * s * 0.02, baseY - s * 0.68, s * 0.2, s * 0.13, leaf, { hi: 0.25 });
  // Roikkuva naava
  b.strokeStyle = '#9ab878';
  b.lineWidth = Math.max(1.2, s * 0.025);
  b.lineCap = 'round';
  for (k = 0; k < 4; k++) {
    var mx = x - s * 0.24 + k * s * 0.15;
    b.beginPath(); b.moveTo(mx, baseY - s * 0.5); b.quadraticCurveTo(mx + s * 0.02, baseY - s * 0.4, mx, baseY - s * (0.3 + (k % 2) * 0.06)); b.stroke();
  }
}
function htLinnaSwampReeds(b, x, baseY, s) {
  htLinnaPuddle(b, x, baseY - s * 0.05, s * 0.36, s * 0.1, '#5c9a8a');
  htLinnaBlades(b, x - s * 0.05, baseY - s * 0.03, s * 0.3, '#4a7a3a');
  htLinnaCattail(b, x - s * 0.16, baseY - s * 0.04, s * 0.5, -0.35);
  htLinnaCattail(b, x + s * 0.04, baseY - s * 0.04, s * 0.62, 0.15);
  // Tulikärpänen
  artGlow(b, x + s * 0.26, baseY - s * 0.48, s * 0.12, '#e6ff96', 0.85);
  artCircle(b, x + s * 0.26, baseY - s * 0.48, s * 0.02, '#fbffd8', { line: false });
}
function htLinnaToadstools(b, x, baseY, s, rnd) {
  artShadow(b, x, baseY, s * 0.32, s * 0.06, 0.18);
  artBlob(b, x, baseY - s * 0.04, s * 0.3, s * 0.07, '#6a8a4a', { lineColor: '#3f5a2a' });
  htLinnaShroom(b, x - s * 0.1, baseY - s * 0.04, s * 0.34, rnd < 0.5 ? '#e8705a' : '#b07ae0', false);
  htLinnaShroom(b, x + s * 0.17, baseY - s * 0.02, s * 0.22, '#f0a050', false);
}

HUB_THEMES.swamp = {
  ground: ['#76a868', '#6b9c5e'],
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.3) htLinnaPuddle(b, x + s * (0.3 + rnd2 * 0.4), y + s * (0.4 + rnd * 0.4), s * 0.14, s * 0.06, '#5c9a8a');
    else if (rnd < 0.6) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.4 + rnd * 0.5), s, '#4a7a3a');
    else if (rnd < 0.7) {
      artGlow(b, x + s * rnd2, y + s * 0.3, s * 0.1, '#e6ff96', 0.7);
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.42) htLinnaTwistedTree(b, x, baseY, s * 1.8, rnd2);
    else if (rnd < 0.7) htLinnaSwampReeds(b, x, baseY, s * 1.6);
    else htLinnaToadstools(b, x, baseY, s * 1.8, rnd2);
  }
};
