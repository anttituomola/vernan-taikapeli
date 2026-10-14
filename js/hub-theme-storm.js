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

// ---------- Tökkäysyllätykset ----------
// Samat lajitaulut kuin Kaukamaan muissa teemoissa (hub-theme-manner.js:
// htMannerPokeSetup). Sammakko kurnuttaa kivellä, kuusesta varisee pisaroita,
// sateenkaari kirkastuu, lätäkkö loiskahtaa ja kellokukat soivat; pilvet
// sataa ripsauttavat ja näyttävät pikkusateenkaaren. Joka 3. kerta isompi yllätys.
function htStormPokeKind(rnd) {
  return rnd < 0.36 ? 'rock' : rnd < 0.58 ? 'pine' : rnd < 0.7 ? 'rainbow' : rnd < 0.82 ? 'puddle' : 'bells';
}
function htStormPokeFrog(c, x, y, r, croak) {
  artBlob(c, x, y, r, r * 0.7, '#7fd06a', { lineColor: '#2f7a2c', hi: 0.4 });
  if (croak > 0) artCircle(c, x, y + r * 0.35, r * 0.45 * croak, '#d8f5b0', { lineColor: '#2f7a2c', line: Math.max(1, r * 0.06) });
  artCircle(c, x - r * 0.45, y - r * 0.6, r * 0.3, '#7fd06a', { lineColor: '#2f7a2c' });
  artCircle(c, x + r * 0.45, y - r * 0.6, r * 0.3, '#7fd06a', { lineColor: '#2f7a2c' });
  artEye(c, x - r * 0.45, y - r * 0.62, r * 0.17, 0, false);
  artEye(c, x + r * 0.45, y - r * 0.62, r * 0.17, 0, false);
  c.strokeStyle = '#2f7a2c'; c.lineWidth = Math.max(1, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - r * 0.1, r * 0.45, 0.35, Math.PI - 0.35); c.stroke();
  artBlush(c, x - r * 0.65, y, r * 0.15);
  artBlush(c, x + r * 0.65, y, r * 0.15);
}
// Sadeviirut pilven alta (q = 0..1)
function htStormPokeRain(c, x, y, r, q) {
  if (q < 0) return;
  var i, p, yy;
  c.save();
  c.strokeStyle = 'rgba(110,140,220,0.8)';
  c.lineWidth = Math.max(1, r * 0.08);
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    p = (q * 3 + i * 0.37) % 1;
    yy = y + r * 0.5 + p * r * 1.6;
    c.globalAlpha = (1 - p) * Math.min(1, (1 - q) * 4);
    c.beginPath(); c.moveTo(x + (i - 3) * r * 0.3, yy); c.lineTo(x + (i - 3) * r * 0.3 - r * 0.1, yy + r * 0.3); c.stroke();
  }
  c.restore();
}
// Kellokukat soivat: kukat hehkuvat vuorotellen ja nuotit nousevat
function htStormPokeBells(c, x, baseY, s, k) {
  var i, bx, by, g;
  for (i = 0; i < 3; i++) {
    bx = x + (i - 1) * s * 0.1; by = baseY - s * (0.22 + (i % 2) * 0.06) + s * 0.03;
    g = Math.max(0, Math.sin((k * 3 - i * 0.3) * Math.PI)) * htMannerPokeFade(k, 0.2);
    artGlow(c, bx, by, s * 0.12, '#e8d8ff', 0.9 * g);
    c.save();
    c.globalAlpha *= g;
    c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, s * 0.012); c.lineCap = 'round';
    c.beginPath(); c.arc(bx, by, s * 0.08, -0.6, 0.6); c.stroke();
    c.beginPath(); c.arc(bx, by, s * 0.08, Math.PI - 0.6, Math.PI + 0.6); c.stroke();
    c.restore();
  }
  htMannerPokeNotes(c, x, baseY - s * 0.35, s, k, 3, s * 0.5);
}
function htStormPokeOwl(c, x, y, r, blink) {
  artBlob(c, x - r * 0.55, y - r * 0.85, r * 0.18, r * 0.3, '#a8805a', { rot: -0.4, lineColor: '#5a3a1a' });
  artBlob(c, x + r * 0.55, y - r * 0.85, r * 0.18, r * 0.3, '#a8805a', { rot: 0.4, lineColor: '#5a3a1a' });
  artBlob(c, x, y, r * 0.85, r, '#a8805a', { lineColor: '#5a3a1a', hi: 0.3 });
  artBlob(c, x, y + r * 0.3, r * 0.5, r * 0.55, '#f2e2c4', { line: false });
  artCircle(c, x - r * 0.35, y - r * 0.35, r * 0.3, '#ffffff', { lineColor: '#5a3a1a', line: Math.max(1, r * 0.06) });
  artCircle(c, x + r * 0.35, y - r * 0.35, r * 0.3, '#ffffff', { lineColor: '#5a3a1a', line: Math.max(1, r * 0.06) });
  artEye(c, x - r * 0.35, y - r * 0.35, r * 0.17, 0, blink);
  artEye(c, x + r * 0.35, y - r * 0.35, r * 0.17, 0, blink);
  c.fillStyle = '#ffb030';
  c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.12); c.lineTo(x + r * 0.1, y - r * 0.12); c.lineTo(x, y + r * 0.08); c.fill();
}
function htStormPokeDuck(c, x, y, r, dir) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artBlob(c, 0, 0, r, r * 0.6, '#ffe06a', { lineColor: '#c8a020', hi: 0.4 });
  artCircle(c, r * 0.6, -r * 0.6, r * 0.45, '#ffe06a', { lineColor: '#c8a020' });
  c.fillStyle = '#ff9a3a';
  c.beginPath(); c.moveTo(r * 0.95, -r * 0.65); c.lineTo(r * 1.35, -r * 0.55); c.lineTo(r * 0.95, -r * 0.45); c.fill();
  artEye(c, r * 0.7, -r * 0.72, r * 0.1, 0, false);
  c.restore();
}
var HT_STORM_POKE_FX = {
  rock: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), side = rnd2 < 0.5 ? -1 : 1, fx = x + side * s * 0.08, fy = baseY - s * 0.48, q, croak, pop;
    if (!big) {
      // Sammakko ponnahtaa kivelle ja kurnuttaa
      pop = htMannerPokeBack(Math.min(1, k * 4)) * htMannerPokeFade(k, 0.15);
      croak = Math.max(0, Math.sin((k - 0.2) * Math.PI * 4)) * (k > 0.2 && k < 0.7 ? 1 : 0);
      if (pop > 0.02) htStormPokeFrog(c, fx, fy, s * 0.1 * pop, croak);
      return;
    }
    // Iso: sammakko loikkaa kiven yli kaarena ja pulahtaa nurmelle
    q = Math.min(1, k / 0.75);
    c.save();
    c.globalAlpha *= htMannerPokeFade(k, 0.15);
    htStormPokeFrog(c, x - side * s * 0.45 + side * q * s * 0.9, baseY - s * 0.05 - 4 * q * (1 - q) * s * 0.8, s * 0.1, q >= 1 ? Math.max(0, Math.sin(k * 30)) : 0);
    c.restore();
    htMannerPokeHearts(c, x + side * s * 0.45, baseY - s * 0.3, s, htMannerPokeSeg(k, 0.6, 1), 2, s * 0.3);
  },
  pine: function (c, x, baseY, s, rnd2, k, n) {
    var i, q, px, py, pop;
    // Pisarat varisevat oksilta
    for (i = 0; i < 8; i++) {
      q = htMannerPokeSeg(k, (i % 4) * 0.08, (i % 4) * 0.08 + 0.55);
      if (q < 0) continue;
      px = x + (hubHash(i, 3) - 0.5) * s * 0.5;
      py = baseY - s * (0.35 + hubHash(3, i) * 0.4) + q * q * s * 0.5;
      if (py > baseY) continue;
      c.save();
      c.globalAlpha *= 1 - q * 0.5;
      artBlob(c, px, py, s * 0.02, s * 0.03, '#9fd8ff', { lineColor: '#3a7ab0', line: Math.max(1, s * 0.008) });
      c.restore();
    }
    if (!htMannerPokeBig(n)) return;
    // Iso: pöllö kurkistaa kuusesta ja räpäyttää
    pop = htMannerPokeBack(Math.min(1, htMannerPokeSeg(k, 0.1, 1) * 4)) * htMannerPokeFade(k, 0.15);
    if (k > 0.1 && pop > 0.02) htStormPokeOwl(c, x, baseY - s * 0.45, s * 0.1 * pop, (k > 0.5 && k < 0.56) || (k > 0.62 && k < 0.68));
  },
  rainbow: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3), i, a, q, rx = x + s * 0.3, ry = baseY - s * 0.05;
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    artGlow(c, x, baseY - s * 0.45, s * 0.5, '#fff6d0', 0.6 * g);
    htStormRainbow(c, x, baseY - s * 0.3, s * (0.32 + g * 0.12), g);
    c.restore();
    // Tähtiä kaarella
    for (i = 0; i < 4; i++) {
      a = Math.PI + (i + 0.5) / 4 * Math.PI;
      c.save();
      c.globalAlpha *= g * Math.abs(Math.sin(k * 12 + i));
      htMannerPokeStar(c, x + Math.cos(a) * s * 0.48, baseY - s * 0.3 + Math.sin(a) * s * 0.48, s * 0.035, '#fff6a0');
      c.restore();
    }
    if (!big) return;
    // Iso: kultapata sateenkaaren päässä, kolikot pomppaavat
    c.save();
    c.globalAlpha *= g;
    artBlob(c, rx, ry - s * 0.06, s * 0.11, s * 0.08, '#3a3a4a', { hi: 0.3 });
    artBlob(c, rx, ry - s * 0.13, s * 0.11, s * 0.03, '#ffd84a', { lineColor: '#a87a10' });
    for (i = 0; i < 3; i++) {
      q = htMannerPokeSeg(k, 0.2 + i * 0.12, 0.6 + i * 0.12);
      if (q < 0) continue;
      artCircle(c, rx + (i - 1) * q * s * 0.2, ry - s * 0.14 - 4 * q * (1 - q) * s * 0.35, s * 0.035, '#ffd84a', { lineColor: '#a87a10', hi: 0.5 });
    }
    c.restore();
  },
  puddle: function (c, x, baseY, s, rnd2, k, n) {
    var q;
    htMannerPokeRings(c, x, baseY - s * 0.04, s, htMannerPokeSeg(k, 0, 0.8));
    htMannerPokeDrops(c, x, baseY - s * 0.06, s, htMannerPokeSeg(k, 0, 0.55), 6, s * 0.3);
    htStormPokeBells(c, x + s * 0.3, baseY, s, k);
    if (!htMannerPokeBig(n)) return;
    // Iso: ankanpoikanen uiskentelee lätäkön poikki
    q = htMannerPokeSeg(k, 0.1, 0.95);
    if (q < 0) return;
    c.save();
    c.globalAlpha *= Math.min(1, q * 6) * htMannerPokeFade(q, 0.15);
    htStormPokeDuck(c, x - s * 0.22 + q * s * 0.44, baseY - s * 0.07 - Math.abs(Math.sin(q * 20)) * s * 0.01, s * 0.06, 1);
    c.restore();
  },
  bells: function (c, x, baseY, s, rnd2, k, n) {
    var j, q;
    htStormPokeBells(c, x, baseY, s * 1.4, k);
    if (!htMannerPokeBig(n)) return;
    for (j = 0; j < 2; j++) {
      q = htMannerPokeSeg(k, j * 0.15, j * 0.15 + 0.8);
      if (q < 0) continue;
      c.save();
      c.globalAlpha *= htMannerPokeFade(q, 0.25);
      htMannerPokeButterfly(c, x + (j ? 1 : -1) * Math.sin(q * 5) * s * 0.35, baseY - s * 0.4 - q * s * 0.7, s * 1.2, k * 30 + j, j ? '#c9a0ff' : '#9fd8ff');
      c.restore();
    }
  }
};
var HT_STORM_POKE_SND = {
  rock: function (n) {
    playNote(147, 0.1, 0.12, 'square', 0.08); playNote(131, 0.3, 0.15, 'square', 0.08);
    if (htMannerPokeBig(n)) { playNote(523, 0.05, 0.1, 'triangle', 0.2); playNote(784, 0.2, 0.12, 'triangle', 0.2); playNote(147, 1.6, 0.12, 'square', 0.08); }
  },
  pine: function (n) {
    htMannerPokeTune([1760, 1568, 1976, 1319], 0.07, 'sine', 0.12);
    if (htMannerPokeBig(n)) { playNote(392, 0.5, 0.25, 'sine', 0.25); playNote(330, 0.8, 0.35, 'sine', 0.25); }
  },
  rainbow: function (n) {
    htMannerPokeTune([523, 659, 784, 1047, 1319], 0.07, 'triangle', 0.18);
    if (htMannerPokeBig(n)) htMannerPokeTune([1976, 2637, 1976, 2637], 0.12, 'sine', 0.1, 0.5);
  },
  puddle: function (n) {
    playNote(1200, 0, 0.05, 'sine', 0.15); playNote(800, 0.04, 0.06, 'sine', 0.15);
    htMannerPokeTune([1319, 1568, 1760], 0.15, 'sine', 0.16, 0.2);
    if (htMannerPokeBig(n)) { playNote(523, 0.5, 0.08, 'square', 0.08); playNote(494, 0.65, 0.1, 'square', 0.08); }
  },
  bells: function (n) {
    htMannerPokeTune(htMannerPokeBig(n) ? [1319, 1568, 1760, 2093, 1760, 1568, 1319] : [1319, 1568, 1760], 0.13, 'sine', 0.18);
  }
};
// Pilvi sataa hetken ja näyttää sitten pikkusateenkaaren
function htStormPokeCloudFx(c, x, y, r, k, n, bow) {
  var big = htMannerPokeBig(n), g = Math.sin(Math.max(0, Math.min(1, (k - 0.4) * 3)) * Math.PI / 2) * htMannerPokeFade(k, 0.25), puff = 1 + 0.08 * Math.sin(k * Math.PI * 4) * (1 - k);
  htStormPokeRain(c, x, y, r, htMannerPokeSeg(k, 0, 0.65));
  if (g > 0) htMannerPokeRainbow(c, x + (bow || 0) * r, y + r * 1.7, r * (big ? 1.3 : 0.85) * (0.6 + g * 0.4), g * 0.9);
  c.save();
  c.translate(x, y);
  c.scale(puff, puff);
  htStormCloud(c, 0, 0, r, false);
  c.restore();
  if (big) htMannerPokeHearts(c, x, y - r * 0.5, r * 4, htMannerPokeSeg(k, 0.45, 1), 3, r * 1.5);
}
function htStormPokeCloudSnd(n) {
  htMannerPokeTune([1568, 1319, 1760, 1175], 0.08, 'sine', 0.12);
  htMannerPokeTune(htMannerPokeBig(n) ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047], 0.09, 'triangle', 0.16, 0.8);
}
function htStormPokeCloudSpot(id, x, y, r, bow) {
  return htMannerPokeSpot(id, x, y, r * 1.3, function (c, sp, k) { htStormPokeCloudFx(c, x, y, r, k, sp.n, bow); }, htStormPokeCloudSnd, 2.4);
}
htMannerPokeSetup(HUB_THEMES.storm, '#c9a0ff', htStormPokeKind, HT_STORM_POKE_FX, HT_STORM_POKE_SND, function (w, h, lay) {
  var th = HUB_THEMES.storm, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x;
  var px = htMannerHeroX(w, lay, false), py = hz + h * 0.1, psz = hs * 1.1, rx = htMannerHeroX(w, lay, true), ry = hz + h * 0.1, rsz = hs * 0.9;
  htMannerPokeScatter(list, th, 'storm-s', w, h, lay, 20, null, 0.95, 11);
  // Myrskyvuoren huippu: pilvihattu sataa ja vuoren sateenkaari kirkastuu
  list.push(htMannerPokeSpot('storm-peak', px, py - psz * 0.5, psz * 0.45, function (c, sp, k) {
    var g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3);
    artGlow(c, px + psz * 0.3, py - psz * 0.7, psz * 0.3, '#fff6d0', 0.6 * g);
    htStormRainbow(c, px + psz * 0.3, py - psz * 0.62, psz * (0.18 + g * 0.08), g);
    htStormPokeCloudFx(c, px + psz * 0.02, py - psz * 0.98, psz * 0.22, k, sp.n, 0);
  }, htStormPokeCloudSnd, 2.4));
  // Iso sadepilvi: kova sade ja sitten sateenkaari loistaa
  list.push(htMannerPokeSpot('storm-cloud', rx, ry - rsz * 0.4, rsz * 0.48, function (c, sp, k) {
    var g = Math.sin(Math.max(0, Math.min(1, (k - 0.3) * 3)) * Math.PI / 2) * htMannerPokeFade(k, 0.3);
    artGlow(c, rx, ry - rsz * 0.25, rsz * 0.6, '#fff6d0', 0.5 * g);
    htStormRainbow(c, rx, ry - rsz * 0.05, rsz * (0.48 + g * 0.1), 0.9 * g);
    htStormPokeRain(c, rx - rsz * 0.2, ry - rsz * 0.62, rsz * 0.3, htMannerPokeSeg(k, 0, 0.6));
    htMannerPokeHearts(c, rx, ry - rsz * 0.6, rsz, htMannerPokeSeg(k, 0.35, 1), htMannerPokeBig(sp.n) ? 5 : 2, rsz * 0.5);
  }, htStormPokeCloudSnd, 2.4));
  // Pilvet taivaalla
  for (i = 0; i < 6; i++) list.push(htStormPokeCloudSpot('storm-c' + i, w * (0.2 + i * 0.14), h * (0.07 + (i % 3) * 0.04), h * (0.035 + (i % 2) * 0.012), i % 2 ? -0.4 : 0.4));
  // Aurinkoa peittävä pilvi: aurinko kurkistaa esiin hymyillen
  list.push(htMannerPokeSpot('storm-sun', w * 0.08, h * 0.17, h * 0.07, function (c, sp, k) {
    var up = htMannerPokeHold(k) * h * 0.022;
    htMannerPokeSunFx(c, w * 0.06, h * 0.15 - up, h * 0.04, k, sp.n);
    htStormCloud(c, w * 0.09, h * 0.18, h * 0.05, false);
  }, htMannerPokeSunSnd));
  // Kaukaiset pikkusateenkaaret välkähtävät
  for (i = 0; i < 4; i++) {
    x = i % 2 ? sd.R + (w - sd.R) * (0.3 + (i >> 1) * 0.35) : sd.L * (0.3 + (i >> 1) * 0.35);
    list.push(htStormPokeBowSpot('storm-r' + i, x, hz - h * 0.02, lay.cell * 0.45));
  }
  return list;
});
function htStormPokeBowSpot(id, x, y, r) {
  return htMannerPokeSpot(id, x, y - r * 0.5, r * 0.9, function (c, sp, k) {
    var g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3), i, a;
    htMannerPokeRainbow(c, x, y, r * (1 + g * (htMannerPokeBig(sp.n) ? 0.6 : 0.25)), g);
    for (i = 0; i < 3; i++) {
      a = Math.PI + (i + 0.5) / 3 * Math.PI;
      c.save();
      c.globalAlpha *= g * Math.abs(Math.sin(k * 10 + i * 2));
      htMannerPokeStar(c, x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2, r * 0.12, '#fff6a0');
      c.restore();
    }
  }, function (n) { htMannerPokeTune([659, 784, 988, 1319], 0.08, 'triangle', 0.16); });
}
