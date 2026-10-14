'use strict';

// Sokkeloteemat (ks. hub-themes.js): Kaukamaan paikat Porkkanakumpu (carrot),
// Kellopaja (clock), Maalaiskylä (farm) ja Pupula (town). Jokainen on maailmansa
// ainoa vyöhyke, joten teema on täysi: taivas, maisema, laatta, polku ja koristeet.
// Mantereen sokkelot ovat pieniä, joten laatan ympärille jää paljon maisemaa:
// sivuille piirretään sankarikoriste (torni, tehdas, lato, leipomo) ja
// syvyysjärjestyksessä samoja koristeita kuin seinäruuduissa.

// ---------- Yhteiset palat ----------
// Laatan vasen ja oikea reuna maisemassa (vähän marginaalia)
function htMannerSides(lay) {
  return { L: lay.ox - lay.cell * 0.45, R: lay.ox + lay.cols * lay.cell + lay.cell * 0.45 };
}
// Horisontti, jolle sivujen koristeet alkavat
function htMannerHz(lay, h) {
  return lay.oy + lay.rows * lay.cell * 0.3 + h * 0.04;
}
function htMannerSun(b, x, y, r) {
  artGlow(b, x, y, r * 3, '#fff4c8', 0.55);
  artCircle(b, x, y, r, '#ffd84a', { lineColor: '#f0a830', hi: 0.4 });
}
// Sivumaisema: n koristetta vuorotellen laatan vasemmalle ja oikealle puolelle,
// takaa eteen (kauempana pienempiä). Joukossa puita (leaf = lehvästön väri).
// Ensin nurmelle ripotellaan tupsuja ja kukkia. fn(b, x, y, koko, i, rnd)
function htMannerScatter(b, w, h, lay, n, fn, leaf) {
  var s = lay.cell, sd = htMannerSides(lay), hz = htMannerHz(lay, h) + h * 0.05, i, t, x, y, x0, x1, k;
  for (i = 0; i < 70; i++) {
    x = hubHash(i, 41) * w; y = hz + hubHash(41, i) * (h - hz);
    if (x > sd.L - s * 0.2 && x < sd.R + s * 0.2) continue;
    if (i % 4) hubThemeTuft(b, x, y, s * 0.8, 'rgba(60,130,50,0.55)');
    else drawFlower(b, x, y, s * 0.035, ['#ff7bac', '#ffffff', '#ffd24f'][i % 3]);
  }
  for (i = 0; i < n; i++) {
    t = i / Math.max(1, n - 1);
    x0 = i % 2 ? sd.R + s * 0.35 : s * 0.35;
    x1 = i % 2 ? w - s * 0.35 : sd.L - s * 0.35;
    if (x1 <= x0) continue;
    x = x0 + hubHash(i, 17) * (x1 - x0);
    y = hz + t * (h * 0.99 - hz);
    k = s * (0.75 + t * 0.6);
    if (leaf && hubHash(i, 29) < 0.28) {
      artShadow(b, x, y, k * 0.45, k * 0.1, 0.15);
      drawTree(b, x, y, k * (0.6 + hubHash(29, i) * 0.25), 0, { leaf: leaf });
    } else fn(b, x, y, k, i, hubHash(17, i));
  }
}
// Sankarikoristeen paikka: vasemman tai oikean sivun keskellä
function htMannerHeroX(w, lay, right) {
  var sd = htMannerSides(lay);
  return right ? (sd.R + w) / 2 : sd.L / 2;
}
function htMannerHeroSize(w, h, lay) {
  return Math.max(lay.cell * 1.2, Math.min(htMannerSides(lay).L * 0.8, h * 0.26));
}
// Kaukainen peltotilkku rinteessä: pyöreä maa ja rivit pisteitä (porkkanat, vilja)
function htMannerField(b, x, y, fw, fh, soil, dot) {
  var i, k, n;
  artBlob(b, x, y, fw / 2, fh / 2, soil, { lineColor: artShade(soil, -0.25), line: Math.max(1, fh * 0.06) });
  b.fillStyle = dot;
  for (k = -1; k <= 1; k++) {
    n = k ? 5 : 7;
    for (i = 0; i < n; i++) {
      b.beginPath();
      b.arc(x + (i - (n - 1) / 2) * fw * 0.12, y + k * fh * 0.25, Math.max(1.2, fh * 0.1), 0, Math.PI * 2);
      b.fill();
    }
  }
}
// Kentän kuvan oviaukko: kaari (x, y) ympärillä, läpäisty kullankeltainen
function htMannerOpening(c, x, y, s, room, st, rim, aw) {
  aw = s * (aw || 0.33);
  var base = y + s * 0.3, top = y - s * 0.12;
  c.beginPath();
  c.moveTo(x - aw, base); c.lineTo(x - aw, top);
  c.arc(x, top, aw, Math.PI, 0);
  c.lineTo(x + aw, base); c.closePath();
  var g = c.createLinearGradient(0, top - aw, 0, base);
  g.addColorStop(0, st.cleared ? '#fff3c4' : '#fffaf0');
  g.addColorStop(1, st.cleared ? '#ffe08a' : '#f3e6d6');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = rim;
  c.lineWidth = Math.max(2, s * 0.06);
  c.lineJoin = 'round';
  c.stroke();
  drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
}
function htMannerPuff(b, x, y, r) {
  artCircle(b, x, y, r, '#ffffff', { lineColor: '#d8d8e8', line: Math.max(1, r * 0.08) });
  artCircle(b, x + r * 0.9, y - r * 0.5, r * 0.75, '#ffffff', { lineColor: '#d8d8e8', line: Math.max(1, r * 0.08) });
}
function htMannerNote(b, x, y, s, col) {
  b.fillStyle = col;
  b.beginPath();
  if (b.ellipse) b.ellipse(x, y, s * 0.05, s * 0.037, -0.4, 0, Math.PI * 2); else b.arc(x, y, s * 0.045, 0, Math.PI * 2);
  b.fill();
  b.strokeStyle = col;
  b.lineWidth = Math.max(1, s * 0.016);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x + s * 0.045, y); b.lineTo(x + s * 0.045, y - s * 0.16); b.lineTo(x + s * 0.1, y - s * 0.11); b.stroke();
}

// ---------- Porkkanakumpu ----------
function htMannerCarrotTop(b, x, y, s) {
  var k, lw = Math.max(1, s * 0.012);
  for (k = -1; k <= 1; k++) artBlob(b, x + k * s * 0.04, y - s * 0.1, s * 0.032, s * 0.09, '#5fcf55', { rot: k * 0.5, lineColor: '#2f7a2c', line: lw });
  artBlob(b, x, y, s * 0.07, s * 0.045, '#ff8f3a', { lineColor: '#b8541a', line: lw, hi: 0.35 });
}
// Porkkanamaa: multapenkki ja kaksi riviä porkkanoita
function htMannerCarrotPatch(b, x, baseY, s, rnd2) {
  var k;
  artShadow(b, x, baseY, s * 0.52, s * 0.1, 0.15);
  artBlob(b, x, baseY - s * 0.12, s * 0.48, s * 0.17, '#a86c3a', { lineColor: '#5e3a1c', hi: 0.15 });
  for (k = -1; k <= 0; k++) htMannerCarrotTop(b, x + (k + 0.5) * s * 0.3, baseY - s * 0.2, s * 1.7);
  for (k = -1; k <= 1; k++) htMannerCarrotTop(b, x + k * s * 0.28, baseY - s * 0.08, s * 1.9);
  if (rnd2 < 0.3) {
    // Kitkemätön jättiporkkana
    htMannerCarrotTop(b, x + s * 0.02, baseY - s * 0.3, s * 2.6);
  }
}
// Pupun kolo nurmikummussa; kolosta kurkistaa joskus pupu
function htMannerBurrow(b, x, baseY, s, rnd2) {
  artShadow(b, x, baseY, s * 0.5, s * 0.1, 0.15);
  artBlob(b, x, baseY - s * 0.24, s * 0.5, s * 0.34, '#86d06c', { lineColor: '#3f8a3a', hi: 0.3 });
  artBlob(b, x, baseY - s * 0.15, s * 0.24, s * 0.17, '#7a4a28', { lineColor: '#4a2a14' });
  artBlob(b, x, baseY - s * 0.14, s * 0.19, s * 0.13, '#3a2418', { line: false });
  if (rnd2 < 0.55) drawBunny(b, x, baseY - s * 0.2, s * 0.3, 0, rnd2 * 9, true);
  artBlob(b, x, baseY - s * 0.04, s * 0.25, s * 0.05, '#a86c3a', { lineColor: '#5e3a1c' });
  drawFlower(b, x - s * 0.36, baseY - s * 0.32, s * 0.04, '#ffffff');
  drawFlower(b, x + s * 0.33, baseY - s * 0.4, s * 0.035, '#ff9cc8');
}
// Myyränkeko; päällä joskus myyrä
function htMannerMolehill(b, x, baseY, s, rnd2) {
  var i;
  artShadow(b, x, baseY, s * 0.42, s * 0.09, 0.15);
  artBlob(b, x, baseY - s * 0.13, s * 0.36, s * 0.2, '#8a5a30', { lineColor: '#4a2e14', hi: 0.2 });
  b.fillStyle = '#6e4422';
  for (i = 0; i < 5; i++) {
    b.beginPath(); b.arc(x + (i - 2) * s * 0.13, baseY - s * (0.05 + (i % 2) * 0.12), s * 0.03, 0, Math.PI * 2); b.fill();
  }
  if (rnd2 < 0.5) {
    // Myyrä kurkistaa kekonsa huipulta
    artBlob(b, x, baseY - s * 0.32, s * 0.12, s * 0.1, '#6a5a72', { lineColor: '#3a2e44', hi: 0.3 });
    artEye(b, x - s * 0.045, baseY - s * 0.35, s * 0.02, 0, true);
    artEye(b, x + s * 0.045, baseY - s * 0.35, s * 0.02, 0, true);
    artCircle(b, x, baseY - s * 0.3, s * 0.04, '#ff8fbe', { line: false });
    artBlob(b, x, baseY - s * 0.24, s * 0.16, s * 0.04, '#8a5a30', { line: false });
  }
}
// Apilapensas
function htMannerClover(b, x, baseY, s) {
  drawBush(b, x, baseY - s * 0.04, s * 0.32);
  drawFlower(b, x - s * 0.12, baseY - s * 0.36, s * 0.04, '#ffffff');
  drawFlower(b, x + s * 0.2, baseY - s * 0.28, s * 0.04, '#ffb0d8');
}
function htMannerCarrotProp(b, x, baseY, s, rnd, rnd2) {
  if (rnd < 0.3) htMannerCarrotPatch(b, x, baseY, s, rnd2);
  else if (rnd < 0.5) htMannerBurrow(b, x, baseY, s, rnd2);
  else if (rnd < 0.62) htMannerMolehill(b, x, baseY, s, rnd2);
  else if (rnd < 0.78) {
    artShadow(b, x, baseY, s * 0.45, s * 0.1, 0.15);
    drawTree(b, x, baseY, s * (0.62 + rnd2 * 0.18), 0, { leaf: '#79cc5e' });
  } else htMannerClover(b, x, baseY, s);
}
// Jättiporkkana kukkulalla (maamerkki maisemassa)
function htMannerGiantCarrot(b, x, baseY, sz) {
  var k, lw = Math.max(1.5, sz * 0.012);
  for (k = -2; k <= 2; k++) {
    artBlob(b, x + k * sz * 0.07, baseY - sz * 0.82, sz * 0.05, sz * 0.2, '#5fcf55', { rot: k * 0.35, lineColor: '#2f7a2c', line: lw });
  }
  b.beginPath();
  b.moveTo(x - sz * 0.2, baseY - sz * 0.62);
  b.quadraticCurveTo(x - sz * 0.22, baseY - sz * 0.2, x - sz * 0.05, baseY);
  b.lineTo(x + sz * 0.05, baseY);
  b.quadraticCurveTo(x + sz * 0.22, baseY - sz * 0.2, x + sz * 0.2, baseY - sz * 0.62);
  b.quadraticCurveTo(x, baseY - sz * 0.72, x - sz * 0.2, baseY - sz * 0.62);
  artFillPath(b, '#ff8f3a', baseY - sz * 0.7, baseY, sz * 0.2, { lineColor: '#b8541a', line: lw * 1.4 });
  b.strokeStyle = 'rgba(184,84,26,0.6)';
  b.lineWidth = lw;
  for (k = 0; k < 4; k++) {
    b.beginPath(); b.moveTo(x - sz * (0.15 - k * 0.025), baseY - sz * (0.5 - k * 0.12)); b.lineTo(x - sz * (0.04 - k * 0.01), baseY - sz * (0.49 - k * 0.12)); b.stroke();
  }
  artHighlight(b, x - sz * 0.1, baseY - sz * 0.5, sz * 0.04, sz * 0.12, 0.35);
  artBlob(b, x, baseY, sz * 0.3, sz * 0.06, '#a86c3a', { lineColor: '#5e3a1c' });
}
// Pupujen kumpukoti: nurmikumpu, pyöreä ovi, ikkuna ja savupiippu
function htMannerHillHome(b, x, baseY, sz) {
  artShadow(b, x, baseY, sz * 0.6, sz * 0.1, 0.15);
  artLimb(b, x + sz * 0.22, baseY - sz * 0.4, x + sz * 0.22, baseY - sz * 0.62, sz * 0.08, '#c8845a');
  htMannerPuff(b, x + sz * 0.26, baseY - sz * 0.76, sz * 0.06);
  artBlob(b, x, baseY - sz * 0.22, sz * 0.58, sz * 0.4, '#86d06c', { lineColor: '#3f8a3a', hi: 0.3 });
  artCircle(b, x - sz * 0.08, baseY - sz * 0.16, sz * 0.16, '#c87a3a', { lineColor: '#6a3a1a' });
  artCircle(b, x - sz * 0.08, baseY - sz * 0.16, sz * 0.12, '#e8a050', { lineColor: '#8a4a1a' });
  artCircle(b, x - sz * 0.02, baseY - sz * 0.15, sz * 0.02, '#ffd84a', { line: false });
  artCircle(b, x + sz * 0.26, baseY - sz * 0.26, sz * 0.07, '#bfe8ff', { lineColor: '#6a3a1a' });
  drawFlower(b, x - sz * 0.36, baseY - sz * 0.38, sz * 0.03, '#ff9cc8');
  drawFlower(b, x + sz * 0.05, baseY - sz * 0.5, sz * 0.03, '#ffd24f');
  drawFlower(b, x + sz * 0.42, baseY - sz * 0.12, sz * 0.03, '#ffffff');
}

HUB_THEMES.carrot = {
  sky: ['#8fd8ff', '#fff4d8'],
  ground: ['#8fdc6f', '#80d064'],
  earth: '#a8703c',
  path: ['#c0905a', '#f6e2b0'],
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x;
    htMannerSun(b, w * 0.05, h * 0.2, h * 0.04);
    hubThemeClouds(b, w, h, 7);
    hubThemeHills(b, w, h, lay, ['#d4f0bc', '#b2e494', '#9ad87c'], 0.06);
    // Kaukaiset porkkanapellot rinteillä
    for (i = 0; i < 6; i++) {
      x = i % 2 ? sd.R + (w - sd.R) * (0.25 + (i % 3) * 0.25) : sd.L * (0.25 + (i % 3) * 0.25);
      htMannerField(b, x, hz - h * 0.03 + (i % 3) * h * 0.025, lay.cell * 1.5, h * 0.045, '#c8945a', '#5fbf55');
    }
    htMannerGiantCarrot(b, htMannerHeroX(w, lay, false), hz + h * 0.05, hs);
    htMannerHillHome(b, htMannerHeroX(w, lay, true), hz + h * 0.05, hs * 0.8);
    htMannerScatter(b, w, h, lay, 22, function (b, x, y, s, i, r) {
      htMannerCarrotProp(b, x, y, s, r * 0.9, hubHash(i, 3));
    }, '#79cc5e');
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.4) hubThemeTuft(b, px, py, s, '#5fb048');
    else if (rnd < 0.55) {
      // Apilanlehti
      b.fillStyle = '#5fb048';
      b.beginPath();
      b.arc(px - s * 0.03, py, s * 0.03, 0, Math.PI * 2);
      b.arc(px + s * 0.03, py, s * 0.03, 0, Math.PI * 2);
      b.arc(px, py - s * 0.045, s * 0.03, 0, Math.PI * 2);
      b.fill();
    } else if (rnd < 0.66) drawFlower(b, px, py, s * 0.04, rnd2 < 0.5 ? '#ffffff' : '#ffb0d8');
  },
  wall: htMannerCarrotProp,
  landmark: function (c, x, y, s, room, st) {
    // Pupun kolo nurmikummussa: pyöreä aukko, kehä kentän värissä
    var col = room.color || '#ff8f3a';
    artShadow(c, x, y + s * 0.36, s * 0.5, s * 0.1, 0.22);
    artBlob(c, x, y + s * 0.02, s * 0.5, s * 0.4, '#86d06c', { lineColor: '#3f8a3a', hi: 0.3 });
    htMannerCarrotTop(c, x - s * 0.38, y - s * 0.2, s * 1.6);
    htMannerCarrotTop(c, x + s * 0.4, y - s * 0.1, s * 1.6);
    artCircle(c, x, y - s * 0.02, s * 0.36, col, { lineColor: artShade(col, -0.45) });
    artCircle(c, x, y - s * 0.02, s * 0.29, st.cleared ? '#ffe9a0' : '#fff8ea', { lineColor: artShade(col, -0.3), flat: true });
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

// ---------- Kellopaja ----------
// Pystyssä seisova ratas ja sen pikkuratas
function htMannerGears(b, x, baseY, s, rnd2) {
  var cols = ['#e0b45a', '#c8d0dc', '#e08a5a'], k = Math.floor(rnd2 * 3);
  artShadow(b, x, baseY, s * 0.5, s * 0.1, 0.16);
  gearDrawWheel(b, x - s * 0.08, baseY - s * 0.35, s * 0.3, rnd2 * 6, cols[k], 9);
  gearDrawWheel(b, x + s * 0.32, baseY - s * 0.17, s * 0.16, rnd2 * 4, cols[(k + 1) % 3], 6);
}
// Käkikello tolpan päässä; luukusta kurkistaa joskus käki
function htMannerCuckoo(b, x, baseY, s, rnd2) {
  var i, a, wood = rnd2 < 0.5 ? '#a8703c' : '#c87a4a', lw = Math.max(1, s * 0.015);
  artShadow(b, x, baseY, s * 0.3, s * 0.08, 0.16);
  artLimb(b, x, baseY, x, baseY - s * 0.32, s * 0.07, '#8a5a30');
  // Painot ketjuissa
  b.strokeStyle = '#6a4a28'; b.lineWidth = lw;
  b.beginPath(); b.moveTo(x - s * 0.1, baseY - s * 0.32); b.lineTo(x - s * 0.1, baseY - s * 0.2); b.moveTo(x + s * 0.12, baseY - s * 0.32); b.lineTo(x + s * 0.12, baseY - s * 0.14); b.stroke();
  artBlob(b, x - s * 0.1, baseY - s * 0.17, s * 0.03, s * 0.05, '#c08a3a', { lineColor: '#6a4a28' });
  artBlob(b, x + s * 0.12, baseY - s * 0.11, s * 0.03, s * 0.05, '#c08a3a', { lineColor: '#6a4a28' });
  artRoundRect(b, x - s * 0.21, baseY - s * 0.74, s * 0.42, s * 0.42, s * 0.05, wood, { hi: 0.15 });
  b.beginPath();
  b.moveTo(x - s * 0.3, baseY - s * 0.7); b.lineTo(x, baseY - s * 0.98); b.lineTo(x + s * 0.3, baseY - s * 0.7); b.closePath();
  artFillPath(b, '#6a3a1a', baseY - s * 0.98, baseY - s * 0.7, s * 0.2);
  // Lintuluukku
  artRoundRect(b, x - s * 0.06, baseY - s * 0.86, s * 0.12, s * 0.12, s * 0.03, '#3a2010', { line: false });
  if (rnd2 < 0.5) {
    artCircle(b, x, baseY - s * 0.82, s * 0.05, '#ffd84a', { lineColor: '#a87a10' });
    b.fillStyle = '#ff8f3a';
    b.beginPath(); b.moveTo(x + s * 0.04, baseY - s * 0.83); b.lineTo(x + s * 0.09, baseY - s * 0.81); b.lineTo(x + s * 0.04, baseY - s * 0.79); b.fill();
  }
  // Kellotaulu
  artCircle(b, x, baseY - s * 0.5, s * 0.13, '#fffaf0', { lineColor: '#6a3a1a' });
  b.fillStyle = '#6a3a1a';
  for (i = 0; i < 4; i++) {
    a = i * Math.PI / 2;
    b.beginPath(); b.arc(x + Math.cos(a) * s * 0.1, baseY - s * 0.5 + Math.sin(a) * s * 0.1, s * 0.012, 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = '#3a2010'; b.lineWidth = Math.max(1, s * 0.02); b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY - s * 0.5); b.lineTo(x, baseY - s * 0.59); b.moveTo(x, baseY - s * 0.5); b.lineTo(x + s * 0.06, baseY - s * 0.47); b.stroke();
}
// Soittorasia: kansi auki, kampi kyljessä ja nuotteja ilmassa
function htMannerMusicBox(b, x, baseY, s, rnd2) {
  var col = rnd2 < 0.5 ? '#f29ac0' : '#7fd0c8', top = baseY - s * 0.28;
  artShadow(b, x, baseY, s * 0.4, s * 0.08, 0.16);
  b.beginPath();
  b.moveTo(x - s * 0.26, top); b.lineTo(x + s * 0.26, top); b.lineTo(x + s * 0.2, top - s * 0.22); b.lineTo(x - s * 0.32, top - s * 0.22); b.closePath();
  artFillPath(b, artShade(col, -0.1), top - s * 0.22, top, s * 0.2);
  artRoundRect(b, x - s * 0.26, top, s * 0.52, s * 0.26, s * 0.04, col, { hi: 0.2 });
  artRoundRect(b, x - s * 0.26, top + s * 0.08, s * 0.52, s * 0.05, s * 0.02, '#ffd84a', { lineColor: '#a87a10', line: Math.max(1, s * 0.012) });
  // Pyörivä tappitela kannen alla
  artRoundRect(b, x - s * 0.15, top - s * 0.06, s * 0.3, s * 0.07, s * 0.03, '#e0b45a', { lineColor: '#8a6a20', line: Math.max(1, s * 0.012) });
  artLimb(b, x + s * 0.26, top + s * 0.12, x + s * 0.36, top + s * 0.12, s * 0.03, '#c8d0dc');
  artLimb(b, x + s * 0.36, top + s * 0.12, x + s * 0.36, top + s * 0.02, s * 0.03, '#c8d0dc');
  artCircle(b, x + s * 0.36, top + s * 0.01, s * 0.035, '#ff7bac');
  htMannerNote(b, x - s * 0.18, top - s * 0.32, s, '#8a5cb8');
  htMannerNote(b, x + s * 0.12, top - s * 0.42, s, '#e8507a');
}
// Vesiratas: kouru tolpilla kaataa vettä siivikkopyörään
function htMannerWaterWheel(b, x, baseY, s) {
  var i, a, wx = x + s * 0.12, wy = baseY - s * 0.3, r = s * 0.27;
  artShadow(b, x, baseY, s * 0.5, s * 0.1, 0.16);
  artBlob(b, wx, baseY - s * 0.03, s * 0.3, s * 0.06, '#7fc8f0', { lineColor: '#3a7ab0' });
  b.strokeStyle = '#8a5a30'; b.lineWidth = Math.max(2, s * 0.05); b.lineCap = 'round';
  for (i = 0; i < 4; i++) {
    a = i * Math.PI / 4;
    b.beginPath(); b.moveTo(wx - Math.cos(a) * r, wy - Math.sin(a) * r); b.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r); b.stroke();
  }
  b.strokeStyle = '#5a3a1a'; b.lineWidth = Math.max(3, s * 0.08);
  b.beginPath(); b.arc(wx, wy, r, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#c08a50'; b.lineWidth = Math.max(2, s * 0.05);
  b.beginPath(); b.arc(wx, wy, r, 0, Math.PI * 2); b.stroke();
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4 + 0.2;
    artCircle(b, wx + Math.cos(a) * r * 1.08, wy + Math.sin(a) * r * 1.08, s * 0.045, '#a8703c', { lineColor: '#5a3a1a', line: Math.max(1, s * 0.012) });
  }
  artCircle(b, wx, wy, s * 0.05, '#e0b45a', { lineColor: '#5a3a1a' });
  // Kouru ja vesi
  artLimb(b, x - s * 0.4, baseY, x - s * 0.4, baseY - s * 0.56, s * 0.05, '#8a5a30');
  artLimb(b, x - s * 0.52, baseY - s * 0.6, x + s * 0.02, baseY - s * 0.6, s * 0.08, '#a8703c');
  artLimb(b, x - s * 0.5, baseY - s * 0.63, x, baseY - s * 0.63, s * 0.025, '#7fc8f0', false);
  b.strokeStyle = 'rgba(127,200,240,0.9)'; b.lineWidth = Math.max(2, s * 0.05);
  b.beginPath(); b.moveTo(x + s * 0.02, baseY - s * 0.62); b.quadraticCurveTo(x + s * 0.12, baseY - s * 0.62, x + s * 0.14, baseY - s * 0.5); b.stroke();
}
function htMannerClockProp(b, x, baseY, s, rnd, rnd2) {
  if (rnd < 0.28) htMannerGears(b, x, baseY, s, rnd2);
  else if (rnd < 0.48) htMannerCuckoo(b, x, baseY, s, rnd2);
  else if (rnd < 0.64) htMannerMusicBox(b, x, baseY, s, rnd2);
  else if (rnd < 0.78) htMannerWaterWheel(b, x, baseY, s);
  else drawBush(b, x, baseY - s * 0.05, s * 0.27);
}
// Kellotorni: kivitorni, iso kellotaulu ja suippo katto
function htMannerClockTower(b, x, baseY, sz) {
  var i, a, cy = baseY - sz * 0.72, tw = sz * 0.2;
  artShadow(b, x, baseY, sz * 0.3, sz * 0.05, 0.15);
  artRoundRect(b, x - tw, baseY - sz * 0.88, tw * 2, sz * 0.88, sz * 0.02, '#ecdcc0', { lineColor: '#8a6a4a', hi: 0.15 });
  b.beginPath();
  b.moveTo(x - tw * 1.25, baseY - sz * 0.88); b.lineTo(x, baseY - sz * 1.22); b.lineTo(x + tw * 1.25, baseY - sz * 0.88); b.closePath();
  artFillPath(b, '#d8604a', baseY - sz * 1.22, baseY - sz * 0.88, sz * 0.2, { lineColor: '#8a2a1e' });
  artCircle(b, x, baseY - sz * 1.24, sz * 0.025, '#ffd84a', { lineColor: '#a87a10' });
  artCircle(b, x, cy, tw * 0.82, '#fffaf0', { lineColor: '#6a3a1a' });
  b.fillStyle = '#6a3a1a';
  for (i = 0; i < 12; i++) {
    a = i * Math.PI / 6;
    b.beginPath(); b.arc(x + Math.cos(a) * tw * 0.66, cy + Math.sin(a) * tw * 0.66, Math.max(1, tw * 0.05), 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = '#3a2010'; b.lineWidth = Math.max(1.5, tw * 0.08); b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, cy); b.lineTo(x, cy - tw * 0.55); b.moveTo(x, cy); b.lineTo(x + tw * 0.38, cy + tw * 0.1); b.stroke();
  artRoundRect(b, x - tw * 0.3, baseY - sz * 0.42, tw * 0.6, sz * 0.14, tw * 0.3, '#bfe8ff', { lineColor: '#6a3a1a' });
  b.beginPath();
  b.moveTo(x - tw * 0.4, baseY); b.lineTo(x - tw * 0.4, baseY - sz * 0.12); b.arc(x, baseY - sz * 0.12, tw * 0.4, Math.PI, 0); b.lineTo(x + tw * 0.4, baseY); b.closePath();
  artFillPath(b, '#a8703c', baseY - sz * 0.2, baseY, tw * 0.4, { lineColor: '#5a3a1a' });
  gearDrawWheel(b, x + tw, baseY - sz * 0.5, tw * 0.45, 0.3, '#e0b45a', 8);
}
// Lelutehdas: sahakatto, raidalliset piiput ja savupilvet
function htMannerFactory(b, x, baseY, sz) {
  var i, w2 = sz * 0.45, top = baseY - sz * 0.42;
  artShadow(b, x, baseY, sz * 0.55, sz * 0.07, 0.15);
  for (i = 0; i < 2; i++) {
    var cx = x - w2 * 0.5 + i * w2 * 0.9;
    artRoundRect(b, cx - sz * 0.06, top - sz * (0.42 + i * 0.1), sz * 0.12, sz * (0.45 + i * 0.1), sz * 0.02, '#ffffff', { lineColor: '#a8405a' });
    b.fillStyle = '#ff6a8a';
    for (var k = 0; k < 3; k++) b.fillRect(cx - sz * 0.055, top - sz * (0.36 + i * 0.1) + k * sz * 0.12, sz * 0.11, sz * 0.05);
    htMannerPuff(b, cx + sz * 0.02, top - sz * (0.5 + i * 0.1), sz * 0.06);
    htMannerPuff(b, cx + sz * 0.12, top - sz * (0.62 + i * 0.1), sz * 0.045);
  }
  b.beginPath();
  b.moveTo(x - w2, baseY); b.lineTo(x - w2, top);
  for (i = 0; i < 3; i++) {
    b.lineTo(x - w2 + (i + 0.75) * w2 * 2 / 3, top - sz * 0.14);
    b.lineTo(x - w2 + (i + 0.75) * w2 * 2 / 3, top);
  }
  b.lineTo(x + w2, top); b.lineTo(x + w2, baseY); b.closePath();
  artFillPath(b, '#e88a6a', top - sz * 0.14, baseY, sz * 0.3, { lineColor: '#8a3a2a' });
  for (i = 0; i < 3; i++) artRoundRect(b, x - w2 * 0.8 + i * w2 * 0.6, top + sz * 0.08, w2 * 0.36, sz * 0.12, sz * 0.03, '#ffe9a8', { lineColor: '#8a3a2a' });
  artRoundRect(b, x - w2 * 0.22, baseY - sz * 0.16, w2 * 0.44, sz * 0.16, sz * 0.03, '#a8703c', { lineColor: '#5a3a1a' });
  gearDrawWheel(b, x + w2 * 0.62, baseY - sz * 0.1, sz * 0.07, 0.5, '#e0b45a', 8);
  artRoundRect(b, x - w2 * 0.85, baseY - sz * 0.1, sz * 0.09, sz * 0.09, sz * 0.015, '#5fa8d8', { lineColor: '#2a5a8a' });
  artRoundRect(b, x - w2 * 0.6, baseY - sz * 0.08, sz * 0.08, sz * 0.08, sz * 0.015, '#ffd24f', { lineColor: '#a87a10' });
}

HUB_THEMES.clock = {
  sky: ['#ffd6a8', '#fff4e2'],
  ground: ['#b3d98a', '#a6cf7c'],
  earth: '#8a5a30',
  path: ['#8a5a30', '#ecd09a'],
  arch: '#fff0d6',
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i;
    htMannerSun(b, w * 0.95, h * 0.2, h * 0.04);
    hubThemeClouds(b, w, h, 6);
    hubThemeHills(b, w, h, lay, ['#ead8b8', '#cfe0a8', '#b8d792'], 0.05);
    // Puoliksi maahan uponneet jättirattaat kaukana rinteillä
    for (i = 0; i < 4; i++) {
      b.globalAlpha = 0.55;
      gearDrawWheel(b, i % 2 ? sd.R + (w - sd.R) * (0.2 + i * 0.12) : sd.L * (0.85 - i * 0.12), hz - h * 0.02, lay.cell * (0.45 + (i % 2) * 0.2), i, '#d9b070', 10);
      b.globalAlpha = 1;
    }
    htMannerClockTower(b, htMannerHeroX(w, lay, false), hz + h * 0.05, hs);
    htMannerFactory(b, htMannerHeroX(w, lay, true), hz + h * 0.05, hs * 0.95);
    htMannerScatter(b, w, h, lay, 22, function (b, x, y, s, i, r) {
      htMannerClockProp(b, x, y, s, r * 0.9, hubHash(i, 5));
    }, '#8ccf5e');
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.4) hubThemeTuft(b, px, py, s, '#6fa84a');
    else if (rnd < 0.52) {
      // Ruuvi
      artCircle(b, px, py, s * 0.035, '#c8d0dc', { lineColor: '#6a7080', line: Math.max(1, s * 0.012) });
      b.strokeStyle = '#6a7080'; b.lineWidth = Math.max(1, s * 0.012);
      b.beginPath(); b.moveTo(px - s * 0.02, py - s * 0.02); b.lineTo(px + s * 0.02, py + s * 0.02); b.stroke();
    } else if (rnd < 0.6) {
      b.globalAlpha = 0.7;
      gearDrawWheel(b, px, py, s * 0.06, rnd2 * 5, '#d9b070', 7);
      b.globalAlpha = 1;
    } else if (rnd < 0.68) drawFlower(b, px, py, s * 0.035, '#ffd24f');
  },
  wall: htMannerClockProp,
  landmark: function (c, x, y, s, room, st) {
    // Kellotaulu rattaan keskellä; seuraava kenttä pyörittää ratasta
    var col = room.color || '#e0b45a', cy = y - s * 0.04, i, a;
    artShadow(c, x, y + s * 0.4, s * 0.42, s * 0.09, 0.22);
    artLimb(c, x - s * 0.18, y + s * 0.24, x - s * 0.26, y + s * 0.38, s * 0.07, '#8a5a30');
    artLimb(c, x + s * 0.18, y + s * 0.24, x + s * 0.26, y + s * 0.38, s * 0.07, '#8a5a30');
    gearDrawWheel(c, x, cy, s * 0.4, st.next ? globalT * 0.6 : 0.2, col, 12);
    artCircle(c, x, cy, s * 0.32, st.cleared ? '#ffe9a0' : '#fffaf0', { lineColor: artShade(col, -0.45) });
    c.fillStyle = '#fffaf0';
    for (i = 0; i < 12; i++) {
      a = i * Math.PI / 6;
      c.beginPath(); c.arc(x + Math.cos(a) * s * 0.37, cy + Math.sin(a) * s * 0.37, s * (i % 3 ? 0.012 : 0.022), 0, Math.PI * 2); c.fill();
    }
    drawHubRoomIcon(c, room.kind, x, cy, s * 1.05);
  }
};

// ---------- Maalaiskylä ----------
function htMannerAppleTree(b, x, baseY, s, rnd2) {
  var k = s * (0.6 + rnd2 * 0.16), i, ap = [[-0.32, 0.7], [0.26, 0.8], [-0.06, 1.08], [0.42, 0.58], [0.1, 0.9]];
  artShadow(b, x, baseY, s * 0.45, s * 0.1, 0.15);
  drawTree(b, x, baseY, k, 0, { leaf: '#5fc050' });
  for (i = 0; i < ap.length; i++) artCircle(b, x + ap[i][0] * k, baseY - ap[i][1] * k, k * 0.07, '#e8423a', { lineColor: '#8a1a1a', hi: 0.5, line: Math.max(1, k * 0.015) });
}
// Pyöreä heinäpaali päätyä kohti
function htMannerBale(b, x, y, r) {
  artCircle(b, x, y, r, '#f2cf6a', { lineColor: '#a8803a', hi: 0.3 });
  b.strokeStyle = 'rgba(168,128,58,0.7)';
  b.lineWidth = Math.max(1, r * 0.08);
  b.beginPath(); b.arc(x, y, r * 0.65, 0.3, Math.PI * 1.8); b.stroke();
  b.beginPath(); b.arc(x + r * 0.05, y, r * 0.32, 1.5, Math.PI * 2.6); b.stroke();
}
function htMannerBales(b, x, baseY, s, rnd2) {
  artShadow(b, x, baseY, s * 0.5, s * 0.1, 0.16);
  htMannerBale(b, x + s * 0.2, baseY - s * 0.17, s * 0.17);
  htMannerBale(b, x - s * 0.14, baseY - s * 0.21, s * 0.21);
  if (rnd2 < 0.5) htMannerBale(b, x + s * 0.04, baseY - s * 0.5, s * 0.15);
}
// Aita ja auringonkukat
function htMannerFence(b, x, baseY, s, rnd2) {
  var i, fx;
  for (i = 0; i < 2; i++) {
    fx = x + (i ? 0.22 : -0.18) * s;
    artLimb(b, fx, baseY - s * 0.1, fx + (i - 0.5) * s * 0.06, baseY - s * (0.62 + i * 0.1), s * 0.03, '#4fa046');
    artBlob(b, fx + s * 0.08 * (i ? 1 : -1), baseY - s * 0.36, s * 0.07, s * 0.035, '#5fc050', { rot: i ? 0.5 : -0.5 });
    drawFlower(b, fx + (i - 0.5) * s * 0.06, baseY - s * (0.64 + i * 0.1), s * 0.07, '#ffcc33');
    artCircle(b, fx + (i - 0.5) * s * 0.06, baseY - s * (0.64 + i * 0.1), s * 0.055, '#8a5a30', { lineColor: '#5a3a1a' });
  }
  artShadow(b, x, baseY, s * 0.5, s * 0.08, 0.14);
  artLimb(b, x - s * 0.5, baseY - s * 0.26, x + s * 0.5, baseY - s * 0.26, s * 0.05, '#f6efe2', '#a88a6a');
  artLimb(b, x - s * 0.5, baseY - s * 0.12, x + s * 0.5, baseY - s * 0.12, s * 0.05, '#f6efe2', '#a88a6a');
  for (i = 0; i < 4; i++) {
    fx = x + (i - 1.5) * s * 0.3;
    artRoundRect(b, fx - s * 0.04, baseY - s * 0.36, s * 0.08, s * 0.36, s * 0.04, '#ffffff', { lineColor: '#a88a6a', line: Math.max(1, s * 0.015) });
  }
}
// Kanakoppi ja kana
function htMannerCoop(b, x, baseY, s, rnd2) {
  artShadow(b, x, baseY, s * 0.48, s * 0.1, 0.16);
  artRoundRect(b, x - s * 0.24, baseY - s * 0.36, s * 0.4, s * 0.36, s * 0.03, '#e0533f', { lineColor: '#8a2a1e', hi: 0.15 });
  b.beginPath();
  b.moveTo(x - s * 0.3, baseY - s * 0.34); b.lineTo(x - s * 0.04, baseY - s * 0.58); b.lineTo(x + s * 0.22, baseY - s * 0.34); b.closePath();
  artFillPath(b, '#f6efe2', baseY - s * 0.58, baseY - s * 0.34, s * 0.2, { lineColor: '#a88a6a' });
  artCircle(b, x - s * 0.04, baseY - s * 0.17, s * 0.08, '#5a2a1a', { lineColor: '#8a2a1e' });
  // Kana
  var hx = x + s * 0.3, hy = baseY - s * 0.12;
  artBlob(b, hx, hy, s * 0.12, s * 0.1, '#ffffff', { lineColor: '#a8a0b8', hi: 0.4 });
  artCircle(b, hx + s * 0.08, hy - s * 0.12, s * 0.065, '#ffffff', { lineColor: '#a8a0b8' });
  artCircle(b, hx + s * 0.08, hy - s * 0.2, s * 0.03, '#e8423a', { line: false });
  b.fillStyle = '#ffb030';
  b.beginPath(); b.moveTo(hx + s * 0.13, hy - s * 0.13); b.lineTo(hx + s * 0.19, hy - s * 0.11); b.lineTo(hx + s * 0.13, hy - s * 0.09); b.fill();
  artEye(b, hx + s * 0.09, hy - s * 0.13, s * 0.014, 0, false);
}
// Kurpitsat pensaan edessä
function htMannerPumpkins(b, x, baseY, s) {
  var i, px, r;
  drawBush(b, x, baseY - s * 0.12, s * 0.24);
  for (i = 0; i < 2; i++) {
    px = x + (i ? 0.2 : -0.16) * s; r = s * (i ? 0.11 : 0.14);
    artLimb(b, px, baseY - r * 1.7, px + r * 0.2, baseY - r * 2.1, s * 0.03, '#4f8a3a');
    artBlob(b, px, baseY - r, r * 1.25, r, '#ff9a3a', { lineColor: '#b8541a', hi: 0.3 });
    b.strokeStyle = 'rgba(184,84,26,0.6)'; b.lineWidth = Math.max(1, s * 0.012);
    b.beginPath(); b.moveTo(px, baseY - r * 1.9); b.lineTo(px, baseY - r * 0.1); b.stroke();
  }
}
function htMannerFarmProp(b, x, baseY, s, rnd, rnd2) {
  if (rnd < 0.32) htMannerAppleTree(b, x, baseY, s, rnd2);
  else if (rnd < 0.48) htMannerBales(b, x, baseY, s, rnd2);
  else if (rnd < 0.62) htMannerFence(b, x, baseY, s, rnd2);
  else if (rnd < 0.76) htMannerCoop(b, x, baseY, s, rnd2);
  else htMannerPumpkins(b, x, baseY, s);
}
// Punainen lato ja siilo
function htMannerBarn(b, x, baseY, sz) {
  var w2 = sz * 0.32, eave = baseY - sz * 0.42, peak = baseY - sz * 0.72, i, sx = x + w2 + sz * 0.12;
  artShadow(b, x, baseY, sz * 0.6, sz * 0.07, 0.15);
  artRoundRect(b, sx - sz * 0.1, baseY - sz * 0.7, sz * 0.2, sz * 0.7, sz * 0.02, '#c8d0dc', { lineColor: '#6a7080', hi: 0.2 });
  artBlob(b, sx, baseY - sz * 0.7, sz * 0.1, sz * 0.08, '#8a9aaa', { lineColor: '#4a5868' });
  b.strokeStyle = 'rgba(80,90,110,0.4)'; b.lineWidth = Math.max(1, sz * 0.01);
  for (i = 1; i < 5; i++) { b.beginPath(); b.moveTo(sx - sz * 0.1, baseY - i * sz * 0.13); b.lineTo(sx + sz * 0.1, baseY - i * sz * 0.13); b.stroke(); }
  b.beginPath();
  b.moveTo(x - w2, baseY); b.lineTo(x - w2, eave); b.lineTo(x, peak); b.lineTo(x + w2, eave); b.lineTo(x + w2, baseY); b.closePath();
  artFillPath(b, '#e0533f', peak, baseY, sz * 0.3, { lineColor: '#8a2a1e' });
  artLimb(b, x - w2 * 1.15, eave + sz * 0.04, x, peak - sz * 0.03, sz * 0.05, '#6a3a2a');
  artLimb(b, x + w2 * 1.15, eave + sz * 0.04, x, peak - sz * 0.03, sz * 0.05, '#6a3a2a');
  artRoundRect(b, x - sz * 0.07, peak + sz * 0.1, sz * 0.14, sz * 0.12, sz * 0.02, '#f2cf6a', { lineColor: '#ffffff', line: Math.max(1.5, sz * 0.015) });
  artRoundRect(b, x - sz * 0.15, baseY - sz * 0.3, sz * 0.3, sz * 0.3, sz * 0.01, '#c8403a', { lineColor: '#ffffff', line: Math.max(1.5, sz * 0.018) });
  b.strokeStyle = '#ffffff'; b.lineWidth = Math.max(1.5, sz * 0.015);
  b.beginPath();
  b.moveTo(x - sz * 0.15, baseY - sz * 0.3); b.lineTo(x + sz * 0.15, baseY); b.moveTo(x + sz * 0.15, baseY - sz * 0.3); b.lineTo(x - sz * 0.15, baseY);
  b.moveTo(x, baseY - sz * 0.3); b.lineTo(x, baseY);
  b.stroke();
}
// Kuumailmapallo raidoilla
function htMannerBalloon(b, x, y, r, cols) {
  var i;
  b.strokeStyle = '#8a5a30'; b.lineWidth = Math.max(1, r * 0.04);
  b.beginPath(); b.moveTo(x - r * 0.5, y + r * 0.7); b.lineTo(x - r * 0.22, y + r * 1.35); b.moveTo(x + r * 0.5, y + r * 0.7); b.lineTo(x + r * 0.22, y + r * 1.35); b.stroke();
  artRoundRect(b, x - r * 0.25, y + r * 1.32, r * 0.5, r * 0.32, r * 0.06, '#c08a50', { lineColor: '#6a4a28' });
  b.beginPath();
  b.moveTo(x - r * 0.3, y + r * 0.9);
  b.bezierCurveTo(x - r * 1.3, y + r * 0.1, x - r * 1.05, y - r * 1.1, x, y - r * 1.05);
  b.bezierCurveTo(x + r * 1.05, y - r * 1.1, x + r * 1.3, y + r * 0.1, x + r * 0.3, y + r * 0.9);
  b.closePath();
  b.save(); b.clip();
  for (i = 0; i < 5; i++) {
    b.fillStyle = cols[i % cols.length];
    b.beginPath(); if (b.ellipse) b.ellipse(x, y, r * (1.1 - i * 0.22), r * 1.2, 0, 0, Math.PI * 2); b.fill();
  }
  artHighlight(b, x - r * 0.4, y - r * 0.5, r * 0.18, r * 0.35, 0.35);
  b.restore();
  b.strokeStyle = artShade(cols[0], -0.45); b.lineWidth = Math.max(1.5, r * 0.05);
  b.beginPath();
  b.moveTo(x - r * 0.3, y + r * 0.9);
  b.bezierCurveTo(x - r * 1.3, y + r * 0.1, x - r * 1.05, y - r * 1.1, x, y - r * 1.05);
  b.bezierCurveTo(x + r * 1.05, y - r * 1.1, x + r * 1.3, y + r * 0.1, x + r * 0.3, y + r * 0.9);
  b.closePath(); b.stroke();
}
// Rautatie horisontissa ja pieni juna sen päällä
function htMannerTrain(b, w, y, x, k) {
  var i, cols = ['#5fa8d8', '#ffd24f'];
  b.fillStyle = '#a8805a';
  for (i = 0; i < w; i += k * 0.22) b.fillRect(i, y - k * 0.02, k * 0.08, k * 0.07);
  b.strokeStyle = '#7a6a7a'; b.lineWidth = Math.max(1.5, k * 0.025);
  b.beginPath(); b.moveTo(0, y); b.lineTo(w, y); b.moveTo(0, y + k * 0.04); b.lineTo(w, y + k * 0.04); b.stroke();
  // Vaunut
  for (i = 0; i < 2; i++) {
    var cx = x - k * (0.62 + i * 0.5);
    artRoundRect(b, cx - k * 0.2, y - k * 0.3, k * 0.4, k * 0.24, k * 0.04, cols[i], { hi: 0.2 });
    if (i === 0) htMannerBale(b, cx, y - k * 0.36, k * 0.1);
    else { artCircle(b, cx - k * 0.06, y - k * 0.36, k * 0.07, '#ffffff', { lineColor: '#a8a0b8' }); artCircle(b, cx + k * 0.08, y - k * 0.36, k * 0.06, '#ff9a3a'); }
    artCircle(b, cx - k * 0.11, y - k * 0.05, k * 0.06, '#3a3a4a');
    artCircle(b, cx + k * 0.11, y - k * 0.05, k * 0.06, '#3a3a4a');
  }
  // Veturi
  artRoundRect(b, x - k * 0.26, y - k * 0.32, k * 0.34, k * 0.26, k * 0.05, '#e0533f', { hi: 0.2 });
  artRoundRect(b, x - k * 0.28, y - k * 0.5, k * 0.2, k * 0.2, k * 0.03, '#e0533f');
  artRoundRect(b, x - k * 0.25, y - k * 0.46, k * 0.13, k * 0.09, k * 0.02, '#bfe8ff', { line: false });
  artRoundRect(b, x - k * 0.33, y - k * 0.55, k * 0.3, k * 0.06, k * 0.02, '#4a4a6a');
  artRoundRect(b, x + k * 0.02, y - k * 0.46, k * 0.08, k * 0.15, k * 0.02, '#4a4a6a');
  htMannerPuff(b, x + k * 0.1, y - k * 0.58, k * 0.07);
  htMannerPuff(b, x + k * 0.26, y - k * 0.72, k * 0.05);
  artCircle(b, x - k * 0.16, y - k * 0.06, k * 0.08, '#3a3a4a');
  artCircle(b, x + k * 0.02, y - k * 0.05, k * 0.06, '#3a3a4a');
}

HUB_THEMES.farm = {
  sky: ['#9fdcff', '#eef9dc'],
  ground: ['#93d46c', '#86c962'],
  earth: '#9c6b3f',
  path: ['#b48a52', '#f0dca6'],
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x;
    htMannerSun(b, w * 0.2, h * 0.16, h * 0.04);
    hubThemeClouds(b, w, h, 6);
    htMannerBalloon(b, w * 0.93, h * 0.2, h * 0.045, ['#ff7bac', '#ffd24f', '#5fa8d8']);
    htMannerBalloon(b, w * 0.05, h * 0.3, h * 0.028, ['#8ad06a', '#ffffff', '#e0533f']);
    hubThemeHills(b, w, h, lay, ['#d6efbe', '#b6e29a', '#9ed880'], 0.05);
    // Viljapellot rinteillä
    for (i = 0; i < 6; i++) {
      x = i % 2 ? sd.R + (w - sd.R) * (0.25 + (i % 3) * 0.25) : sd.L * (0.25 + (i % 3) * 0.25);
      htMannerField(b, x, hz - h * 0.035 + (i % 3) * h * 0.02, lay.cell * 1.5, h * 0.045, i % 3 ? '#f2d36a' : '#c8945a', i % 3 ? '#e0b040' : '#8ad06a');
    }
    htMannerTrain(b, w, hz + h * 0.04, sd.L * 0.8, Math.min(sd.L * 0.42, h * 0.13));
    htMannerBarn(b, htMannerHeroX(w, lay, true) - hs * 0.08, hz + h * 0.08, hs);
    htMannerScatter(b, w, h, lay, 20, function (b, x, y, s, i, r) {
      htMannerFarmProp(b, x, y, s, r * 0.9, hubHash(i, 7));
    });
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.42) hubThemeTuft(b, px, py, s, '#5fb048');
    else if (rnd < 0.56) drawFlower(b, px, py, s * 0.04, rnd2 < 0.5 ? '#ff7bac' : '#ffffff');
    else if (rnd < 0.64) artBlob(b, px, py, s * 0.05, s * 0.03, '#c8c0b8', { lineColor: '#8a8078', line: Math.max(1, s * 0.012) });
  },
  wall: htMannerFarmProp,
  landmark: function (c, x, y, s, room, st) {
    // Punainen lato: avoin ovi ja katon reuna kentän värissä
    var col = room.color || '#e0533f', base = y + s * 0.34, eave = y - s * 0.24, peak = y - s * 0.66;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.22);
    c.beginPath();
    c.moveTo(x - s * 0.44, base); c.lineTo(x - s * 0.44, eave); c.lineTo(x, peak); c.lineTo(x + s * 0.44, eave); c.lineTo(x + s * 0.44, base); c.closePath();
    artFillPath(c, '#e0533f', peak, base, s * 0.3, { lineColor: '#8a2a1e' });
    artLimb(c, x - s * 0.5, eave + s * 0.05, x, peak - s * 0.03, s * 0.08, col, artShade(col, -0.45));
    artLimb(c, x + s * 0.5, eave + s * 0.05, x, peak - s * 0.03, s * 0.08, col, artShade(col, -0.45));
    htMannerOpening(c, x, y, s, room, st, '#ffffff', 0.32);
    htMannerBale(c, x - s * 0.42, base - s * 0.08, s * 0.09);
  }
};

// ---------- Pupula ----------
// Pupula-talo: pyöreä katto, jonka päällä kaksi korvaa
function htMannerBunnyHouse(b, x, baseY, k, body, roof) {
  var lw = Math.max(1, k * 0.015), i;
  for (i = -1; i <= 1; i += 2) {
    artBlob(b, x + i * k * 0.14, baseY - k * 0.92, k * 0.075, k * 0.25, roof, { rot: i * 0.25, line: lw });
    b.fillStyle = '#ffc4dd';
    b.beginPath(); if (b.ellipse) b.ellipse(x + i * k * 0.14, baseY - k * 0.92, k * 0.035, k * 0.17, i * 0.25, 0, Math.PI * 2); b.fill();
  }
  artRoundRect(b, x - k * 0.3, baseY - k * 0.5, k * 0.6, k * 0.5, k * 0.05, body, { line: lw, hi: 0.15 });
  b.beginPath();
  b.moveTo(x - k * 0.38, baseY - k * 0.44);
  b.quadraticCurveTo(x - k * 0.36, baseY - k * 0.92, x, baseY - k * 0.92);
  b.quadraticCurveTo(x + k * 0.36, baseY - k * 0.92, x + k * 0.38, baseY - k * 0.44);
  b.closePath();
  artFillPath(b, roof, baseY - k * 0.92, baseY - k * 0.44, k * 0.3, { line: lw });
  artHighlight(b, x - k * 0.15, baseY - k * 0.75, k * 0.07, k * 0.04, 0.35);
  artCircle(b, x, baseY - k * 0.6, k * 0.07, '#fff2a8', { lineColor: artShade(roof, -0.45), line: lw });
  // Ovi, ikkuna ja kukkalaatikko
  b.beginPath();
  b.moveTo(x - k * 0.17, baseY); b.lineTo(x - k * 0.17, baseY - k * 0.2); b.arc(x - k * 0.08, baseY - k * 0.2, k * 0.09, Math.PI, 0); b.lineTo(x + k * 0.01, baseY); b.closePath();
  artFillPath(b, '#a8703c', baseY - k * 0.3, baseY, k * 0.1, { line: lw });
  artRoundRect(b, x + k * 0.06, baseY - k * 0.36, k * 0.16, k * 0.14, k * 0.03, '#bfe8ff', { lineColor: artShade(body, -0.45), line: lw });
  artRoundRect(b, x + k * 0.04, baseY - k * 0.22, k * 0.2, k * 0.05, k * 0.015, '#c8845a', { line: lw });
  drawFlower(b, x + k * 0.09, baseY - k * 0.24, k * 0.025, '#ff7bac');
  drawFlower(b, x + k * 0.19, baseY - k * 0.24, k * 0.025, '#ffd24f');
}
var HT_MANNER_TOWN = [['#ffd0b0', '#e8705a'], ['#d8f0c8', '#5fa8d8'], ['#fff0a8', '#c86aa8'], ['#e0d0ff', '#e89a3a'], ['#ffe0ec', '#8a5cb8']];
// Katulyhty kukkaruukun kanssa
function htMannerLamp(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.15);
  artLimb(b, x, baseY, x, baseY - s * 0.7, s * 0.04, '#4a4a6a', '#2a2a3a');
  artGlow(b, x, baseY - s * 0.76, s * 0.22, '#ffe27a', 0.45);
  artRoundRect(b, x - s * 0.07, baseY - s * 0.84, s * 0.14, s * 0.14, s * 0.03, '#fff2a0', { lineColor: '#2a2a3a' });
  b.beginPath(); b.moveTo(x - s * 0.1, baseY - s * 0.83); b.lineTo(x, baseY - s * 0.92); b.lineTo(x + s * 0.1, baseY - s * 0.83); b.closePath();
  artFillPath(b, '#4a4a6a', baseY - s * 0.92, baseY - s * 0.83, s * 0.05, { lineColor: '#2a2a3a' });
  artRoundRect(b, x + s * 0.06, baseY - s * 0.14, s * 0.3, s * 0.14, s * 0.03, '#d8955f', { lineColor: '#7a4a2a' });
  drawFlower(b, x + s * 0.12, baseY - s * 0.17, s * 0.035, '#ff7bac');
  drawFlower(b, x + s * 0.21, baseY - s * 0.2, s * 0.035, '#b678ff');
  drawFlower(b, x + s * 0.3, baseY - s * 0.17, s * 0.035, '#ffd24f');
}
// Pupun muotoon leikattu pensas ruukussa
function htMannerTopiary(b, x, baseY, s) {
  var leaf = '#5fbf55', ln = '#2f7a2c';
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.15);
  artBlob(b, x - s * 0.07, baseY - s * 0.72, s * 0.05, s * 0.14, leaf, { rot: -0.25, lineColor: ln });
  artBlob(b, x + s * 0.07, baseY - s * 0.72, s * 0.05, s * 0.14, leaf, { rot: 0.25, lineColor: ln });
  artCircle(b, x, baseY - s * 0.32, s * 0.19, leaf, { lineColor: ln, hi: 0.25 });
  artCircle(b, x, baseY - s * 0.55, s * 0.12, leaf, { lineColor: ln, hi: 0.25 });
  drawFlower(b, x + s * 0.08, baseY - s * 0.62, s * 0.03, '#ff7bac');
  b.beginPath();
  b.moveTo(x - s * 0.17, baseY - s * 0.16); b.lineTo(x + s * 0.17, baseY - s * 0.16); b.lineTo(x + s * 0.13, baseY); b.lineTo(x - s * 0.13, baseY); b.closePath();
  artFillPath(b, '#d8845a', baseY - s * 0.16, baseY, s * 0.15, { lineColor: '#7a4422' });
}
// Suihkulähde
function htMannerFountain(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.45, s * 0.09, 0.15);
  artBlob(b, x, baseY - s * 0.1, s * 0.42, s * 0.12, '#e8dccc', { lineColor: '#8a7a6a' });
  artBlob(b, x, baseY - s * 0.13, s * 0.34, s * 0.07, '#7fc8f0', { lineColor: '#3a7ab0', line: Math.max(1, s * 0.012) });
  artLimb(b, x, baseY - s * 0.14, x, baseY - s * 0.36, s * 0.06, '#e8dccc', '#8a7a6a');
  artBlob(b, x, baseY - s * 0.37, s * 0.14, s * 0.04, '#e8dccc', { lineColor: '#8a7a6a' });
  b.strokeStyle = 'rgba(127,200,240,0.9)'; b.lineWidth = Math.max(1.5, s * 0.03); b.lineCap = 'round';
  b.beginPath();
  b.moveTo(x, baseY - s * 0.4); b.quadraticCurveTo(x - s * 0.1, baseY - s * 0.62, x - s * 0.2, baseY - s * 0.4);
  b.moveTo(x, baseY - s * 0.4); b.quadraticCurveTo(x + s * 0.1, baseY - s * 0.62, x + s * 0.2, baseY - s * 0.4);
  b.moveTo(x, baseY - s * 0.4); b.lineTo(x, baseY - s * 0.6);
  b.stroke();
  artCircle(b, x, baseY - s * 0.62, s * 0.025, '#bfe8ff', { line: false });
}
function htMannerTownProp(b, x, baseY, s, rnd, rnd2) {
  var pc;
  if (rnd < 0.42) {
    pc = HT_MANNER_TOWN[Math.floor(rnd2 * HT_MANNER_TOWN.length)];
    artShadow(b, x, baseY, s * 0.45, s * 0.09, 0.16);
    htMannerBunnyHouse(b, x, baseY, s * (0.8 + rnd2 * 0.14), pc[0], pc[1]);
  } else if (rnd < 0.56) htMannerLamp(b, x, baseY, s);
  else if (rnd < 0.7) htMannerTopiary(b, x, baseY, s);
  else if (rnd < 0.8) htMannerFountain(b, x, baseY, s);
  else drawBush(b, x, baseY - s * 0.04, s * 0.26);
}
// Leipomo: raitamarkiisi, ikkunassa leipiä, kyltissä rinkeli, piipusta savua
function htMannerBakery(b, x, baseY, sz) {
  var w2 = sz * 0.36, top = baseY - sz * 0.5, i, n = 5;
  artShadow(b, x, baseY, sz * 0.5, sz * 0.07, 0.15);
  artRoundRect(b, x + w2 * 0.4, top - sz * 0.32, sz * 0.1, sz * 0.3, sz * 0.02, '#c8845a', { lineColor: '#7a4422' });
  htMannerPuff(b, x + w2 * 0.55, top - sz * 0.4, sz * 0.06);
  htMannerPuff(b, x + w2 * 0.75, top - sz * 0.52, sz * 0.045);
  b.beginPath();
  b.moveTo(x - w2 * 1.1, top + sz * 0.02); b.quadraticCurveTo(x, top - sz * 0.42, x + w2 * 1.1, top + sz * 0.02); b.closePath();
  artFillPath(b, '#c86aa8', top - sz * 0.22, top, sz * 0.3, { lineColor: '#7a3a6a' });
  artRoundRect(b, x - w2, top, w2 * 2, sz * 0.5, sz * 0.03, '#fff0d8', { lineColor: '#a8805a', hi: 0.15 });
  // Markiisi
  for (i = 0; i < n; i++) {
    var ax = x - w2 * 1.05 + i * w2 * 2.1 / n;
    b.beginPath();
    b.moveTo(ax, top + sz * 0.06); b.lineTo(ax + w2 * 2.1 / n, top + sz * 0.06);
    b.lineTo(ax + w2 * 2.1 / n, top + sz * 0.15); b.arc(ax + w2 * 1.05 / n, top + sz * 0.15, w2 * 1.05 / n, 0, Math.PI);
    b.closePath();
    artFillPath(b, i % 2 ? '#ffffff' : '#ff8fb8', top + sz * 0.06, top + sz * 0.2, sz * 0.05, { lineColor: '#c84a7a', line: Math.max(1, sz * 0.01) });
  }
  artRoundRect(b, x - w2 * 0.85, top + sz * 0.24, w2 * 0.9, sz * 0.18, sz * 0.02, '#bfe8ff', { lineColor: '#a8805a' });
  for (i = 0; i < 3; i++) artBlob(b, x - w2 * 0.7 + i * w2 * 0.3, top + sz * 0.37, sz * 0.045, sz * 0.03, '#d8955f', { lineColor: '#8a4a1a' });
  b.beginPath();
  b.moveTo(x + w2 * 0.25, baseY); b.lineTo(x + w2 * 0.25, top + sz * 0.32); b.arc(x + w2 * 0.55, top + sz * 0.32, w2 * 0.3, Math.PI, 0); b.lineTo(x + w2 * 0.85, baseY); b.closePath();
  artFillPath(b, '#a8703c', top + sz * 0.2, baseY, sz * 0.1, { lineColor: '#5a3a1a' });
  // Rinkelikyltti
  artLimb(b, x, top - sz * 0.12, x, top - sz * 0.02, sz * 0.015, '#4a4a6a', false);
  b.strokeStyle = '#8a4a1a'; b.lineWidth = sz * 0.05; b.lineCap = 'round';
  b.beginPath(); b.arc(x - sz * 0.05, top - sz * 0.2, sz * 0.06, 0, Math.PI * 2); b.arc(x + sz * 0.05, top - sz * 0.2, sz * 0.06, Math.PI, Math.PI * 3); b.stroke();
  b.strokeStyle = '#e8a050'; b.lineWidth = sz * 0.03;
  b.beginPath(); b.arc(x - sz * 0.05, top - sz * 0.2, sz * 0.06, 0, Math.PI * 2); b.arc(x + sz * 0.05, top - sz * 0.2, sz * 0.06, Math.PI, Math.PI * 3); b.stroke();
}
// Viirinauha kahden pisteen välillä
function htMannerBunting(b, x0, x1, y, sag, k) {
  var i, n = Math.max(3, Math.round((x1 - x0) / (k * 0.4))), t, px, py, cols = ['#ff7bac', '#ffd24f', '#5fa8d8', '#8ad06a', '#b678ff'];
  b.strokeStyle = '#8a7a6a'; b.lineWidth = Math.max(1, k * 0.02);
  b.beginPath(); b.moveTo(x0, y); b.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); b.stroke();
  for (i = 0; i < n; i++) {
    t = (i + 0.5) / n;
    px = x0 + (x1 - x0) * t;
    py = y + sag * 4 * t * (1 - t);
    b.beginPath(); b.moveTo(px - k * 0.09, py); b.lineTo(px + k * 0.09, py); b.lineTo(px, py + k * 0.18); b.closePath();
    artFillPath(b, cols[i % cols.length], py, py + k * 0.18, k * 0.08, { line: Math.max(1, k * 0.012) });
  }
}

HUB_THEMES.town = {
  sky: ['#b8e2ff', '#ffeef4'],
  ground: ['#a4dc84', '#97d277'],
  earth: '#a8784a',
  path: ['#b89a88', '#f2e4d6'],
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x, pc, s = lay.cell;
    htMannerSun(b, w * 0.95, h * 0.2, h * 0.04);
    hubThemeClouds(b, w, h, 6);
    hubThemeHills(b, w, h, lay, ['#dcf0cc', '#c0e6a8'], 0.05);
    // Kaukaiset talot rinteillä (haalistettu taivaan suuntaan)
    for (i = 0; i < 10; i++) {
      x = i % 2 ? sd.R + (w - sd.R) * (0.12 + (i >> 1) * 0.19) : sd.L * (0.12 + (i >> 1) * 0.19);
      pc = HT_MANNER_TOWN[i % HT_MANNER_TOWN.length];
      htMannerBunnyHouse(b, x, hz - h * 0.02 + ((i >> 1) % 2) * h * 0.02, s * 0.5, artMix(pc[0], '#e8f4ff', 0.3), artMix(pc[1], '#e8f4ff', 0.3));
    }
    hubThemeHills(b, w, h, { ox: lay.ox, oy: lay.oy + lay.rows * s * 0.12, cell: s, cols: lay.cols, rows: lay.rows }, ['#a8dc90'], 0.03);
    htMannerBunting(b, s * 0.2, sd.L - s * 0.3, hz + h * 0.02, s * 0.3, s);
    htMannerBunting(b, sd.R + s * 0.3, w - s * 0.2, hz + h * 0.02, s * 0.3, s);
    htMannerBakery(b, htMannerHeroX(w, lay, false), hz + h * 0.1, hs);
    htMannerBunnyHouse(b, htMannerHeroX(w, lay, true), hz + h * 0.1, hs * 0.66, '#fff0a8', '#ff8fb8');
    htMannerScatter(b, w, h, lay, 20, function (b, x, y, s, i, r) {
      htMannerTownProp(b, x, y, s, r * 0.9, hubHash(i, 9));
    }, '#6cc45c');
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.36) hubThemeTuft(b, px, py, s, '#5fb048');
    else if (rnd < 0.54) drawFlower(b, px, py, s * 0.04, ['#ff7bac', '#ffd24f', '#b678ff'][Math.floor(rnd2 * 3)]);
    else if (rnd < 0.62) artBlob(b, px, py, s * 0.05, s * 0.03, '#e8dccc', { lineColor: '#a89888', line: Math.max(1, s * 0.012) });
  },
  wall: htMannerTownProp,
  landmark: function (c, x, y, s, room, st) {
    // Pupula-talon ovi: korvakatto kentän värissä, ovesta näkyy kentän kuva
    var col = room.color || '#ff8fb8', base = y + s * 0.34, lw = Math.max(1.5, s * 0.025), i;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.22);
    for (i = -1; i <= 1; i += 2) {
      artBlob(c, x + i * s * 0.16, y - s * 0.7, s * 0.08, s * 0.2, col, { rot: i * 0.3, line: lw });
      c.fillStyle = '#ffc4dd';
      c.beginPath(); if (c.ellipse) c.ellipse(x + i * s * 0.16, y - s * 0.7, s * 0.035, s * 0.13, i * 0.3, 0, Math.PI * 2); c.fill();
    }
    artRoundRect(c, x - s * 0.42, y - s * 0.36, s * 0.84, s * 0.7, s * 0.06, '#fff3e0', { lineColor: '#a8805a', line: lw });
    c.beginPath();
    c.moveTo(x - s * 0.5, y - s * 0.3);
    c.quadraticCurveTo(x - s * 0.46, y - s * 0.78, x, y - s * 0.78);
    c.quadraticCurveTo(x + s * 0.46, y - s * 0.78, x + s * 0.5, y - s * 0.3);
    c.closePath();
    artFillPath(c, col, y - s * 0.78, y - s * 0.3, s * 0.3, { line: lw });
    htMannerOpening(c, x, y + s * 0.02, s, room, st, '#a8703c', 0.3);
    drawFlower(c, x - s * 0.38, base - s * 0.04, s * 0.04, '#ff7bac');
    drawFlower(c, x + s * 0.38, base - s * 0.04, s * 0.04, '#ffd24f');
  }
};
