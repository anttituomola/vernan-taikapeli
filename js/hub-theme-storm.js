'use strict';

// Sokkeloteema (ks. hub-themes.js): Myrskyvuori (storm), Kaukamaan viimeinen
// paikka. Ystävällinen myrskyinen vuori: laventelinväriset kalliot, pulleat
// sadepilvet, lätäköt ja kurkkivat pikkusateenkaaret — ei pelottava.
// Käyttää Kaukamaan teemojen yhteisiä paloja (hub-theme-manner.js: sivut,
// horisontti, sankarikoristeen paikka, sironta ja oviaukko).

var HT_STORM_ROCK = '#b3a6dc';
var HT_STORM_LINE = '#5e4f8e';

// Pullea sadepilvi ja sen alla vinot sadeviirut
function htStormCloud(b, x, y, r, rain) {
  var i;
  if (rain) {
    b.strokeStyle = 'rgba(120,140,215,0.55)';
    b.lineWidth = Math.max(1, r * 0.08);
    b.lineCap = 'round';
    for (i = 0; i < 5; i++) {
      b.beginPath();
      b.moveTo(x + (i - 2) * r * 0.45, y + r * 0.6);
      b.lineTo(x + (i - 2) * r * 0.45 - r * 0.15, y + r * (1.2 + (i % 2) * 0.35));
      b.stroke();
    }
  }
  b.fillStyle = '#9a8fc4';
  cloudShape(b, x, y + r * 0.1, r * 0.55);
  b.fillStyle = '#c4bce6';
  cloudShape(b, x, y, r * 0.5);
  artHighlight(b, x - r * 0.3, y - r * 0.45, r * 0.25, r * 0.1, 0.35);
}
// Pieni sateenkaari (kurkkii kiven tai pilven takaa)
function htStormRainbow(b, x, y, r, alpha) {
  var i, bw = r * 0.11;
  b.globalAlpha = alpha === undefined ? 0.85 : alpha;
  b.lineWidth = bw;
  b.lineCap = 'butt';
  for (i = 0; i < 7; i++) {
    b.strokeStyle = RAINBOW_COLORS[i];
    b.beginPath(); b.arc(x, y, r - i * bw, Math.PI, 0); b.stroke();
  }
  b.globalAlpha = 1;
}
function htStormRock(b, x, baseY, s, rnd2) {
  artShadow(b, x, baseY, s * 0.42, s * 0.09, 0.16);
  artBlob(b, x, baseY - s * 0.14, s * 0.36, s * 0.2, HT_STORM_ROCK, { lineColor: HT_STORM_LINE, hi: 0.25 });
  artBlob(b, x + s * 0.12 * (rnd2 < 0.5 ? -1 : 1), baseY - s * 0.32, s * 0.2, s * 0.13, '#c8bdea', { lineColor: HT_STORM_LINE, hi: 0.3 });
}
function htStormPuddle(b, x, baseY, s) {
  artBlob(b, x, baseY - s * 0.04, s * 0.32, s * 0.08, '#a8c4f4', { lineColor: '#6a88c8', line: Math.max(1, s * 0.015) });
  artHighlight(b, x - s * 0.12, baseY - s * 0.06, s * 0.1, s * 0.02, 0.6);
}
function htStormPine(b, x, baseY, s) {
  drawPine(b, x, baseY, s * 0.75, '#6fa08a', false);
}
// Kellokukat
function htStormBells(b, x, baseY, s) {
  var i, bx, by;
  for (i = 0; i < 3; i++) {
    bx = x + (i - 1) * s * 0.1; by = baseY - s * (0.22 + (i % 2) * 0.06);
    artLimb(b, x, baseY, bx, by, s * 0.015, '#5aa84a', false);
    artBlob(b, bx, by + s * 0.03, s * 0.045, s * 0.04, i === 1 ? '#c9a0ff' : '#a98ff0', { lineColor: '#5e3fa0', line: Math.max(1, s * 0.01) });
  }
}
// Seinäruudun ja sivumaiseman koristeet
function htStormProp(b, x, baseY, s, rnd, rnd2) {
  if (rnd < 0.36) htStormRock(b, x, baseY, s, rnd2);
  else if (rnd < 0.58) htStormPine(b, x, baseY, s);
  else if (rnd < 0.7) {
    htStormRock(b, x, baseY, s, rnd2);
    htStormRainbow(b, x, baseY - s * 0.3, s * 0.32, 0.8);
    htStormRock(b, x + s * 0.05, baseY + s * 0.02, s * 0.8, 1 - rnd2);
  } else if (rnd < 0.82) {
    htStormPuddle(b, x, baseY, s);
    htStormBells(b, x + s * 0.3, baseY, s);
  } else htStormBells(b, x, baseY, s * 1.4);
}
// Sankarikoriste: Myrskyvuoren huippu pilvihattuineen ja siksakpolkuineen
function htStormPeak(b, x, baseY, sz) {
  var i, y, px;
  b.beginPath();
  b.moveTo(x - sz * 0.55, baseY);
  b.quadraticCurveTo(x - sz * 0.2, baseY - sz * 0.5, x - sz * 0.04, baseY - sz * 0.95);
  b.lineTo(x + sz * 0.05, baseY - sz * 0.93);
  b.quadraticCurveTo(x + sz * 0.25, baseY - sz * 0.45, x + sz * 0.55, baseY);
  b.closePath();
  artFillPath(b, '#a596d6', baseY - sz, baseY, sz * 0.5, { lineColor: HT_STORM_LINE });
  artHighlight(b, x - sz * 0.15, baseY - sz * 0.6, sz * 0.06, sz * 0.18, 0.25);
  b.strokeStyle = 'rgba(255,240,215,0.85)';
  b.lineWidth = Math.max(1.5, sz * 0.02);
  b.lineCap = 'round';
  b.lineJoin = 'round';
  b.beginPath();
  for (i = 0; i <= 5; i++) {
    y = baseY - sz * 0.05 - i * sz * 0.15;
    px = x + (i % 2 ? 1 : -1) * sz * (0.3 - i * 0.05);
    if (i) b.lineTo(px, y); else b.moveTo(px, y);
  }
  b.stroke();
  htStormCloud(b, x + sz * 0.02, baseY - sz * 0.98, sz * 0.22, true);
  htStormRainbow(b, x + sz * 0.3, baseY - sz * 0.62, sz * 0.18, 0.75);
}
// Toinen sankari: iso pilvi, jonka alle on syntynyt sateenkaari
function htStormRainCloud(b, x, baseY, sz) {
  htStormRainbow(b, x, baseY - sz * 0.05, sz * 0.48, 0.9);
  htStormCloud(b, x - sz * 0.2, baseY - sz * 0.62, sz * 0.3, true);
  htStormRock(b, x - sz * 0.48, baseY, sz * 0.6, 0.3);
  htStormRock(b, x + sz * 0.48, baseY, sz * 0.5, 0.7);
}

HUB_THEMES.storm = {
  sky: ['#a99de0', '#f4ecfc'],
  ground: ['#b9e09a', '#acd78c'],
  earth: '#8676b8',
  path: ['#a596d6', '#efe2ca'],
  arch: '#fff6ea',
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x;
    // Aurinko kurkkii pilven takaa
    htMannerSun(b, w * 0.06, h * 0.15, h * 0.04);
    htStormCloud(b, w * 0.09, h * 0.18, h * 0.05, false);
    for (i = 0; i < 6; i++) htStormCloud(b, w * (0.2 + i * 0.14), h * (0.07 + (i % 3) * 0.04), h * (0.035 + (i % 2) * 0.012), i % 2 === 0);
    hubThemeHills(b, w, h, lay, ['#d8cff2', '#c4b8ea', '#b3a6dc'], 0.07);
    // Kaukaiset pikkusateenkaaret vuorten välissä
    for (i = 0; i < 4; i++) {
      x = i % 2 ? sd.R + (w - sd.R) * (0.3 + (i >> 1) * 0.35) : sd.L * (0.3 + (i >> 1) * 0.35);
      htStormRainbow(b, x, hz - h * 0.02, lay.cell * 0.45, 0.5);
    }
    hubThemeHills(b, w, h, { ox: lay.ox, oy: lay.oy + lay.rows * lay.cell * 0.15, cell: lay.cell, cols: lay.cols, rows: lay.rows }, ['#b8dc98'], 0.03);
    htStormPeak(b, htMannerHeroX(w, lay, false), hz + h * 0.1, hs * 1.1);
    htStormRainCloud(b, htMannerHeroX(w, lay, true), hz + h * 0.1, hs * 0.9);
    htMannerScatter(b, w, h, lay, 20, function (b, x, y, s, i, r) {
      htStormProp(b, x, y, s, r * 0.95, hubHash(i, 11));
    });
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.36) hubThemeTuft(b, px, py, s, '#6fae58');
    else if (rnd < 0.48) drawFlower(b, px, py, s * 0.04, rnd2 < 0.5 ? '#c9a0ff' : '#ffffff');
    else if (rnd < 0.58) artBlob(b, px, py, s * 0.06, s * 0.035, '#c4b8e8', { lineColor: '#7a6aa8', line: Math.max(1, s * 0.012) });
    else if (rnd < 0.64) artBlob(b, px, py, s * 0.09, s * 0.025, '#a8c4f4', { lineColor: '#6a88c8', line: Math.max(1, s * 0.01) });
  },
  wall: htStormProp,
  landmark: function (c, x, y, s, room, st) {
    // Kivikaari, jonka yllä sateenkaari ja pikkupilvi; aukosta näkyy kentän kuva
    var col = room.color || '#9f8fff', base = y + s * 0.34, i;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.22);
    c.lineWidth = s * 0.055;
    c.lineCap = 'butt';
    for (i = 0; i < 7; i++) {
      c.strokeStyle = RAINBOW_COLORS[i];
      c.beginPath(); c.arc(x, y - s * 0.12, s * (0.6 - i * 0.05), Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    }
    artBlob(c, x - s * 0.38, base - s * 0.25, s * 0.14, s * 0.3, HT_STORM_ROCK, { lineColor: HT_STORM_LINE, hi: 0.25 });
    artBlob(c, x + s * 0.38, base - s * 0.25, s * 0.14, s * 0.3, HT_STORM_ROCK, { lineColor: HT_STORM_LINE, hi: 0.25 });
    htMannerOpening(c, x, y, s, room, st, col, 0.3);
    htStormCloud(c, x + s * 0.32, y - s * 0.62, s * 0.14, !st.cleared);
  }
};
