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
// ang: pyörän kierto (tökkäystehoste piirtää pyörivän pyörän ilman varjoa)
function htMannerWaterWheel(b, x, baseY, s, ang) {
  var i, a, wx = x + s * 0.12, wy = baseY - s * 0.3, r = s * 0.27, a0 = ang || 0;
  if (ang === undefined) artShadow(b, x, baseY, s * 0.5, s * 0.1, 0.16);
  artBlob(b, wx, baseY - s * 0.03, s * 0.3, s * 0.06, '#7fc8f0', { lineColor: '#3a7ab0' });
  b.strokeStyle = '#8a5a30'; b.lineWidth = Math.max(2, s * 0.05); b.lineCap = 'round';
  for (i = 0; i < 4; i++) {
    a = i * Math.PI / 4 + a0;
    b.beginPath(); b.moveTo(wx - Math.cos(a) * r, wy - Math.sin(a) * r); b.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r); b.stroke();
  }
  b.strokeStyle = '#5a3a1a'; b.lineWidth = Math.max(3, s * 0.08);
  b.beginPath(); b.arc(wx, wy, r, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#c08a50'; b.lineWidth = Math.max(2, s * 0.05);
  b.beginPath(); b.arc(wx, wy, r, 0, Math.PI * 2); b.stroke();
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4 + 0.2 + a0;
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
  htMannerTrainCars(b, x, y, k);
}
// Veturi ja vaunut ilman kiskoja (tökkäystehoste piirtää junan uudelleen)
function htMannerTrainCars(b, x, y, k) {
  var i, cols = ['#5fa8d8', '#ffd24f'];
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

// ---------- Tökkäysyllätykset ----------
// Seinäkoristeet (pokeDraw/poke) ja maiseman kohteet (spots/spotDraw) reagoivat
// napautukseen kukin omalla tavallaan. Teemalla on lajitaulut:
//   htKind(rnd)  -> lajin nimi (samat rajat kuin wall-funktiossa)
//   htFx[laji](c, x, baseY, s, rnd2, k, n, wob)  tehoste; wob = heilahduksen kesto
//                (koristeeseen kiinnittyvät osat heilahtavat mukana) tai 0 maisemassa
//   htSnd[laji](n, rnd2)  ääni napautuksen hetkellä
// Joka 3. tökkäys (n % 3 === 0) on isompi yllätys. Maiseman kohteet laskevat
// tökkäyksensä htMannerPokeSpotN:ään (kohteen id:n mukaan).
var HT_MANNER_POKE_DUR = 2;
var htMannerPokeSpotN = {};

function htMannerPokeBig(n) { return n % 3 === 0; }
function htMannerPokeEase(q) { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); }
// Häivytys: 1, kunnes viimeinen osuus a alkaa
function htMannerPokeFade(k, a) { a = a || 0.2; return k > 1 - a ? Math.max(0, (1 - k) / a) : 1; }
// Vaihe 0..1 välillä [k0, k1], muuten -1
function htMannerPokeSeg(k, k0, k1) { return k < k0 || k > k1 ? -1 : (k - k0) / (k1 - k0); }
// Nousu, pito ja lasku (0 -> 1 -> 0)
function htMannerPokeHold(k) {
  return k < 0.18 ? htMannerPokeEase(k / 0.18) : k > 0.78 ? htMannerPokeEase((1 - k) / 0.22) : 1;
}
// Ponnahdus esiin pienellä ylityksellä
function htMannerPokeBack(q) {
  q = Math.max(0, Math.min(1, q));
  return Math.max(0, 1 + 2.7 * Math.pow(q - 1, 3) + 1.7 * Math.pow(q - 1, 2));
}
// Sama heilahdus kuin moottorin drawHubProps: kiinnittyvät osat liikkuvat koristeen mukana
function htMannerPokeWob(c, x, baseY, k, wob) {
  if (!wob) return;
  var q = Math.min(1, k * wob / HUB_POKE_T), sq = Math.sin(q * Math.PI * 3) * 0.14 * (1 - q);
  c.translate(x, baseY);
  c.rotate(Math.sin(q * Math.PI * 4) * 0.08 * (1 - q));
  c.scale(1 - sq, 1 + sq);
  c.translate(-x, -baseY);
}
function htMannerPokeTune(fs, gap, type, vol, d0) {
  for (var i = 0; i < fs.length; i++) if (fs[i]) playNote(fs[i], (d0 || 0) + i * gap, gap * 1.3, type || 'triangle', vol || 0.2);
}
// Nousevat sydämet (savu, tuoksu, ilo)
function htMannerPokeHearts(c, x, y, s, k, n, rise) {
  var i, q, st = Math.min(0.12, 0.4 / n);
  for (i = 0; i < n; i++) {
    q = htMannerPokeSeg(k, i * st, i * st + 0.6);
    if (q < 0) continue;
    c.save();
    c.globalAlpha *= 1 - q * q;
    drawHeartShape(c, x + Math.sin(q * 6 + i * 2.1) * s * 0.1 + (i % 2 ? 1 : -1) * s * 0.04, y - q * rise, s * 0.14 * (0.6 + q * 0.6), true);
    c.restore();
  }
}
// Nousevat höyrypallot
function htMannerPokePuffs(c, x, y, s, k, n, rise) {
  var i, q, st = Math.min(0.14, 0.4 / n);
  for (i = 0; i < n; i++) {
    q = htMannerPokeSeg(k, i * st, i * st + 0.6);
    if (q < 0) continue;
    c.save();
    c.globalAlpha *= 1 - q;
    htMannerPuff(c, x + q * s * 0.15 + Math.sin(i * 1.7) * s * 0.04, y - q * rise, s * (0.04 + q * 0.06));
    c.restore();
  }
}
// Nousevat nuotit
var HT_MANNER_NOTE_COLS = ['#8a5cb8', '#e8507a', '#3a8ad8', '#2fa86a', '#f08a20'];
function htMannerPokeNotes(c, x, y, s, k, n, rise) {
  var i, q, st = Math.min(0.1, 0.45 / n);
  for (i = 0; i < n; i++) {
    q = htMannerPokeSeg(k, i * st, i * st + 0.5);
    if (q < 0) continue;
    c.save();
    c.globalAlpha *= 1 - q * q;
    htMannerNote(c, x + Math.sin(q * 4 + i) * s * 0.14 + (i % 2 ? 0.07 : -0.07) * s, y - q * rise, s * (1.1 - q * 0.3), HT_MANNER_NOTE_COLS[i % 5]);
    c.restore();
  }
}
// Vesipisarat kaarena ylös ja alas (q = 0..1)
function htMannerPokeDrops(c, x, y, s, q, n, hgt, col) {
  if (q < 0) return;
  var i, dx;
  c.save();
  c.globalAlpha *= 1 - q * q;
  for (i = 0; i < n; i++) {
    dx = (i / Math.max(1, n - 1) - 0.5) * 2;
    artCircle(c, x + dx * s * 0.4 * q, y - 4 * q * (1 - q) * hgt * (1 - Math.abs(dx) * 0.35) + q * q * s * 0.05, s * 0.04, col || '#9fd8ff', { lineColor: '#3a7ab0', line: Math.max(1, s * 0.008) });
  }
  c.restore();
}
// Laajenevat renkaat vedessä
function htMannerPokeRings(c, x, y, s, q) {
  if (q < 0) return;
  var j, p;
  c.save();
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1, s * 0.015);
  for (j = 0; j < 2; j++) {
    p = q * 1.4 - j * 0.4;
    if (p <= 0 || p >= 1) continue;
    c.globalAlpha = 0.9 * (1 - p);
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * (0.08 + p * 0.3), s * (0.02 + p * 0.07), 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}
// Lentävät multapalat (q = 0..1)
function htMannerPokeClods(c, x, y, s, q, n, col) {
  if (q < 0 || q >= 1) return;
  var i, a;
  c.fillStyle = col;
  for (i = 0; i < n; i++) {
    a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
    c.beginPath();
    c.arc(x + Math.cos(a) * q * s * 0.4, y + Math.sin(a) * q * s * 0.35 + q * q * s * 0.35, s * 0.035 * (1 - q * 0.6), 0, Math.PI * 2);
    c.fill();
  }
}
function htMannerPokeRainbow(c, x, y, r, alpha) {
  var i, bw = r * 0.11;
  c.save();
  c.globalAlpha *= alpha;
  c.lineWidth = bw;
  c.lineCap = 'butt';
  for (i = 0; i < 7; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.beginPath(); c.arc(x, y, r - i * bw, Math.PI, 0); c.stroke();
  }
  c.restore();
}
// Porkkana: varsi kohdassa (x, y), kärki alaspäin (rot kiertää)
function htMannerPokeCarrot(c, x, y, len, rot) {
  var w = len * 0.34, lw = Math.max(1, len * 0.04), k;
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  for (k = -1; k <= 1; k++) artBlob(c, k * w * 0.3, -len * 0.2, w * 0.18, len * 0.24, '#5fcf55', { rot: k * 0.45, lineColor: '#2f7a2c', line: lw });
  c.beginPath();
  c.moveTo(-w * 0.5, 0);
  c.quadraticCurveTo(-w * 0.4, len * 0.55, 0, len);
  c.quadraticCurveTo(w * 0.4, len * 0.55, w * 0.5, 0);
  c.quadraticCurveTo(0, -len * 0.08, -w * 0.5, 0);
  artFillPath(c, '#ff8f3a', -len * 0.05, len, w * 0.5, { lineColor: '#b8541a', line: lw });
  artHighlight(c, -w * 0.16, len * 0.25, w * 0.07, len * 0.14, 0.4);
  c.restore();
}
function htMannerPokeButterfly(c, x, y, s, flap, col) {
  var f = 0.25 + Math.abs(Math.sin(flap)) * 0.75, lw = Math.max(1, s * 0.01), ln = artShade(col, -0.45);
  artBlob(c, x - s * 0.05 * f, y - s * 0.02, s * 0.05 * f, s * 0.045, col, { lineColor: ln, line: lw });
  artBlob(c, x + s * 0.05 * f, y - s * 0.02, s * 0.05 * f, s * 0.045, col, { lineColor: ln, line: lw });
  artBlob(c, x - s * 0.035 * f, y + s * 0.03, s * 0.035 * f, s * 0.03, artShade(col, 0.2), { lineColor: ln, line: lw });
  artBlob(c, x + s * 0.035 * f, y + s * 0.03, s * 0.035 * f, s * 0.03, artShade(col, 0.2), { lineColor: ln, line: lw });
  artLimb(c, x, y - s * 0.04, x, y + s * 0.05, s * 0.018, '#4a3a5a', false);
}
// Lintu sivulta (dir = 1 oikealle)
function htMannerPokeBird(c, x, y, s, flap, col, dir) {
  var f = Math.sin(flap), ln = artShade(col, -0.45);
  c.save();
  c.translate(x, y);
  c.scale(dir || 1, 1);
  artBlob(c, 0, 0, s * 0.08, s * 0.055, col, { lineColor: ln, line: Math.max(1, s * 0.012), hi: 0.4 });
  artCircle(c, s * 0.07, -s * 0.04, s * 0.04, col, { lineColor: ln, line: Math.max(1, s * 0.012) });
  c.fillStyle = '#ffb030';
  c.beginPath(); c.moveTo(s * 0.105, -s * 0.05); c.lineTo(s * 0.15, -s * 0.035); c.lineTo(s * 0.105, -s * 0.02); c.fill();
  artEye(c, s * 0.08, -s * 0.05, s * 0.012, 0, false);
  c.beginPath();
  c.moveTo(-s * 0.05, -s * 0.02); c.lineTo(s * 0.03, -s * 0.02); c.lineTo(-s * 0.03, -s * 0.02 - f * s * 0.1); c.closePath();
  artFillPath(c, artShade(col, -0.15), -s * 0.12, 0, s * 0.05, { lineColor: ln, line: Math.max(1, s * 0.01) });
  c.restore();
}
function htMannerPokeLadybug(c, x, y, r) {
  artCircle(c, x + r * 0.8, y, r * 0.5, '#2a2a3a', { line: false });
  artCircle(c, x, y, r, '#e8423a', { lineColor: '#5a1a1a', line: Math.max(1, r * 0.15), hi: 0.5 });
  c.fillStyle = '#2a2a3a';
  c.fillRect(x - r * 0.04, y - r, r * 0.08, r * 2);
  c.beginPath(); c.arc(x - r * 0.45, y - r * 0.2, r * 0.2, 0, Math.PI * 2); c.arc(x + r * 0.45, y + r * 0.25, r * 0.2, 0, Math.PI * 2); c.fill();
}
function htMannerPokeFish(c, x, y, r, rot, col) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.4, -r * 0.5); c.lineTo(-r * 1.4, r * 0.5); c.closePath();
  artFillPath(c, artShade(col, -0.1), -r * 0.5, r * 0.5, r * 0.4, { line: Math.max(1, r * 0.1) });
  artBlob(c, 0, 0, r, r * 0.6, col, { line: Math.max(1, r * 0.1), hi: 0.45 });
  artEye(c, r * 0.45, -r * 0.12, r * 0.18, 0, false);
  c.restore();
}
function htMannerPokeBee(c, x, y, s, flap) {
  var f = Math.abs(Math.sin(flap));
  c.save();
  c.globalAlpha *= 0.75;
  artBlob(c, x - s * 0.02, y - s * 0.05, s * 0.03, s * (0.02 + f * 0.025), '#ffffff', { lineColor: '#9ab8d8', line: Math.max(1, s * 0.008) });
  artBlob(c, x + s * 0.02, y - s * 0.05, s * 0.03, s * (0.02 + f * 0.025), '#ffffff', { lineColor: '#9ab8d8', line: Math.max(1, s * 0.008) });
  c.restore();
  artBlob(c, x, y, s * 0.055, s * 0.038, '#ffd24f', { lineColor: '#5a3a1a', line: Math.max(1, s * 0.012), hi: 0.4 });
  c.strokeStyle = '#3a2a1a'; c.lineWidth = Math.max(1, s * 0.014);
  c.beginPath(); c.moveTo(x - s * 0.01, y - s * 0.034); c.lineTo(x - s * 0.01, y + s * 0.034); c.moveTo(x + s * 0.02, y - s * 0.03); c.lineTo(x + s * 0.02, y + s * 0.03); c.stroke();
  artEye(c, x + s * 0.04, y - s * 0.008, s * 0.01, 0, false);
}
// Perhoset lehvästöstä (puut kaikissa teemoissa)
function htMannerPokeTreeFx(c, x, baseY, s, rnd2, k, n) {
  var big = htMannerPokeBig(n), m = big ? 3 : 1, j, q, cols = ['#ff9cc8', '#ffd24f', '#9fd8ff'];
  for (j = 0; j < m; j++) {
    q = htMannerPokeSeg(k, j * 0.1, j * 0.1 + 0.8);
    if (q < 0) continue;
    c.save();
    c.globalAlpha *= htMannerPokeFade(q, 0.25);
    htMannerPokeButterfly(c, x + Math.sin(q * 5 + j * 2) * s * 0.35 + (j - 1) * s * 0.1, baseY - s * 0.6 - q * s * 0.8, s * 1.6, k * 30 + j, cols[(j + n) % 3]);
    c.restore();
  }
}
function htMannerPokeTreeSnd(n) {
  htMannerPokeTune(htMannerPokeBig(n) ? [1319, 1568, 1760, 2093, 1760, 2093] : [1319, 1568, 1760], 0.07, 'sine', 0.13);
}
// Lintu lehahtaa pensaasta
function htMannerPokeBirdFx(c, x, baseY, s, rnd2, k, n) {
  var big = htMannerPokeBig(n), m = big ? 2 : 1, j, q, dir;
  for (j = 0; j < m; j++) {
    q = htMannerPokeSeg(k, j * 0.15, j * 0.15 + 0.8);
    if (q < 0) continue;
    dir = (rnd2 < 0.5) === (j === 0) ? 1 : -1;
    c.save();
    c.globalAlpha *= htMannerPokeFade(q, 0.25);
    htMannerPokeBird(c, x + dir * q * s * 0.9, baseY - s * 0.25 - q * s * 0.8 + Math.sin(q * Math.PI * 3) * s * 0.05, s * 1.6, k * 40 + j, j ? '#ff8fb8' : '#5fa8d8', dir);
    c.restore();
  }
}
function htMannerPokeBirdSnd(n) {
  playNote(2093, 0.05, 0.05, 'sine', 0.12); playNote(2349, 0.13, 0.06, 'sine', 0.12);
  if (htMannerPokeBig(n)) { playNote(2093, 0.4, 0.05, 'sine', 0.12); playNote(2637, 0.48, 0.08, 'sine', 0.12); }
}
// Aurinko: pyörivät säteet, hymy ja silmänisku
function htMannerPokeSunFx(c, x, y, r, k, n) {
  var i, a, f = htMannerPokeFade(k, 0.3) * Math.min(1, k * 6), r1;
  c.save();
  c.globalAlpha *= f;
  artGlow(c, x, y, r * 3.2, '#fff4c8', 0.6);
  c.fillStyle = '#ffd84a';
  c.strokeStyle = '#f0a830';
  c.lineWidth = Math.max(1, r * 0.06);
  for (i = 0; i < 10; i++) {
    a = i * Math.PI / 5 + k * Math.PI;
    r1 = r * (1.55 + 0.2 * Math.sin(k * 20 + i));
    c.beginPath();
    c.moveTo(x + Math.cos(a - 0.14) * r * 1.15, y + Math.sin(a - 0.14) * r * 1.15);
    c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    c.lineTo(x + Math.cos(a + 0.14) * r * 1.15, y + Math.sin(a + 0.14) * r * 1.15);
    c.closePath(); c.fill(); c.stroke();
  }
  artCircle(c, x, y, r, '#ffd84a', { lineColor: '#f0a830', hi: 0.4 });
  artEye(c, x - r * 0.32, y - r * 0.12, r * 0.13, 0, false);
  artEye(c, x + r * 0.32, y - r * 0.12, r * 0.13, 0, k > 0.4 && k < 0.6);
  c.strokeStyle = '#a86a10'; c.lineWidth = Math.max(1, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.arc(x, y + r * 0.1, r * 0.35, 0.2, Math.PI - 0.2); c.stroke();
  artBlush(c, x - r * 0.55, y + r * 0.2, r * 0.13);
  artBlush(c, x + r * 0.55, y + r * 0.2, r * 0.13);
  c.restore();
  if (htMannerPokeBig(n)) htMannerPokeHearts(c, x, y - r, r * 6, k, 4, r * 2.5);
}
function htMannerPokeSunSnd(n) {
  htMannerPokeTune(htMannerPokeBig(n) ? [784, 988, 1175, 1568, 1976] : [784, 1047, 1319], 0.09, 'sine', 0.15);
}

// Maiseman kohde, joka laskee omat tökkäyksensä
function htMannerPokeSpot(id, x, y, r, draw, snd, dur) {
  return {
    id: id, x: x, y: y, r: r, dur: dur || HT_MANNER_POKE_DUR, draw: draw, n: 0,
    sound: function () {
      this.n = htMannerPokeSpotN[id] = (htMannerPokeSpotN[id] || 0) + 1;
      if (snd) snd(this.n);
    }
  };
}
function htMannerPokeSunSpot(id, x, y, r) {
  return htMannerPokeSpot(id, x, y, r * 1.5, function (c, sp, k) { htMannerPokeSunFx(c, x, y, r, k, sp.n); }, htMannerPokeSunSnd);
}
// Sivumaiseman koristeet kohteiksi: samat paikat kuin htMannerScatter (etummaiset ensin)
function htMannerPokeScatter(list, th, id, w, h, lay, n, leaf, rmul, hk) {
  var s = lay.cell, sd = htMannerSides(lay), hz = htMannerHz(lay, h) + h * 0.05, i, t, x, y, x0, x1, sz, kind;
  for (i = n - 1; i >= 0; i--) {
    t = i / Math.max(1, n - 1);
    x0 = i % 2 ? sd.R + s * 0.35 : s * 0.35;
    x1 = i % 2 ? w - s * 0.35 : sd.L - s * 0.35;
    if (x1 <= x0) continue;
    x = x0 + hubHash(i, 17) * (x1 - x0);
    y = hz + t * (h * 0.99 - hz);
    sz = s * (0.75 + t * 0.6);
    kind = leaf && hubHash(i, 29) < 0.28 ? 'tree' : th.htKind(hubHash(17, i) * rmul);
    if (th.htFx[kind]) list.push(htMannerPokeScatterSpot(th, id + i, kind, x, y, sz, hubHash(i, hk)));
  }
}
function htMannerPokeScatterSpot(th, id, kind, x, y, sz, rnd2) {
  return htMannerPokeSpot(id, x, y - sz * 0.35, sz * 0.45, function (c, sp, k) {
    th.htFx[kind](c, x, y, sz, rnd2, k, sp.n, 0);
  }, function (n) { if (th.htSnd[kind]) th.htSnd[kind](n, rnd2); });
}
// Kytkee lajitaulut teemaan
function htMannerPokeSetup(th, color, kind, fx, snd, spots) {
  th.pokeColor = color;
  th.pokeDur = HT_MANNER_POKE_DUR;
  th.htKind = kind;
  th.htFx = fx;
  th.htSnd = snd;
  th.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
    var f = fx[kind(rnd)];
    if (!f) return;
    c.save();
    f(c, x, baseY, s, rnd2, k, n, th.pokeDur);
    c.restore();
  };
  th.poke = function (p) {
    var f = snd[kind(p.rnd)];
    if (f) f(p.n, p.rnd2);
  };
  th.spots = spots;
  th.spotDraw = function (c, sp, k, lay) {
    if (!sp.draw) return;
    c.save();
    sp.draw(c, sp, k, lay);
    c.restore();
  };
}

// --- Porkkanakumpu: porkkana ponnahtaa maasta, pupu kurkistaa, myyrä nousee ---
function htMannerPokeCarrotKind(rnd) {
  return rnd < 0.3 ? 'patch' : rnd < 0.5 ? 'burrow' : rnd < 0.62 ? 'mole' : rnd < 0.78 ? 'tree' : 'clover';
}
// Porkkana loikkaa maasta, pyörähtää ja jää nurmelle
function htMannerPokeCarrotJump(c, px, y0, s, q, dir, hgt) {
  var t = Math.min(1, q / 0.7);
  htMannerPokeClods(c, px, y0, s, Math.min(1, q * 3), 4, '#7a4a28');
  c.save();
  c.globalAlpha *= htMannerPokeFade(q, 0.15);
  htMannerPokeCarrot(c, px + dir * t * s * 0.3, y0 - 4 * t * (1 - t) * hgt + t * s * 0.1, s * 0.3, dir * htMannerPokeEase(t) * Math.PI * 2.5);
  c.restore();
}
function htMannerPokeMole(c, x, baseY, s, up, k, flower) {
  var hy = baseY - s * 0.36 - up * s * 0.2, top = baseY - s * 0.28, i, wave;
  artBlob(c, x, (hy + top) / 2, s * 0.1, (top - hy) / 2 + s * 0.05, '#6a5a72', { lineColor: '#3a2e44' });
  artBlob(c, x, hy, s * 0.13, s * 0.11, '#6a5a72', { lineColor: '#3a2e44', hi: 0.3 });
  artEye(c, x - s * 0.045, hy - s * 0.03, s * 0.022, 0, false);
  artEye(c, x + s * 0.045, hy - s * 0.03, s * 0.022, 0, false);
  artCircle(c, x, hy + s * 0.025, s * 0.04, '#ff8fbe', { line: false });
  for (i = -1; i <= 1; i += 2) {
    wave = i > 0 ? Math.sin(k * 25) * s * 0.04 * up : 0;
    artCircle(c, x + i * s * 0.12, hy + s * 0.08 - wave, s * 0.035, '#ffb0c8', { lineColor: '#a85a7a', line: Math.max(1, s * 0.01) });
  }
  if (flower) drawFlower(c, x + s * 0.05, hy - s * 0.11, s * 0.045, '#ff7bac');
  artBlob(c, x, top + s * 0.01, s * 0.16, s * 0.045, '#8a5a30', { line: false });
}
var HT_MANNER_POKE_CARROT_FX = {
  patch: function (c, x, baseY, s, rnd2, k, n) {
    var j, q;
    if (htMannerPokeBig(n)) {
      // Isossa yllätyksessä kolmen porkkanan suihku ja sydämiä
      for (j = 0; j < 3; j++) {
        q = htMannerPokeSeg(k, j * 0.12, j * 0.12 + 0.75);
        if (q >= 0) htMannerPokeCarrotJump(c, x + (j - 1) * s * 0.28, baseY - s * 0.12, s, q, j - 1 || 0.5, s * 1.1);
      }
      htMannerPokeHearts(c, x, baseY - s * 0.7, s, k, 3, s * 0.6);
    } else {
      htMannerPokeCarrotJump(c, x + (n % 3 === 1 ? -0.15 : 0.15) * s, baseY - s * 0.12, s, k, n % 3 === 1 ? -1 : 1, s * 0.8);
    }
  },
  burrow: function (c, x, baseY, s, rnd2, k, n, wob) {
    var t, ph, hp;
    if (!htMannerPokeBig(n)) {
      // Pupu nousee kolosta kurkistamaan ja painuu takaisin
      htMannerPokeWob(c, x, baseY, k, wob);
      c.save();
      c.beginPath(); c.rect(x - s, baseY - s * 2.5, s * 2, s * 2.4); c.clip();
      drawBunny(c, x, baseY - s * 0.2 - htMannerPokeHold(k) * s * 0.26, s * 0.3, 0, k * 20, true);
      c.restore();
      htMannerPokeHearts(c, x, baseY - s * 0.85, s, htMannerPokeSeg(k, 0.2, 1), 2, s * 0.4);
      return;
    }
    // Iso: pupu loikkii kolosta ulos nurmelle
    t = Math.min(1, k / 0.7);
    ph = t * 2;
    hp = ph - Math.floor(ph);
    c.save();
    c.globalAlpha *= htMannerPokeFade(k, 0.2);
    drawBunny(c, x + t * s * 0.5, baseY - s * 0.14 + t * s * 0.2, s * 0.2, t < 1 ? Math.sin(hp * Math.PI) * s * 0.3 : 0, k * 25, false);
    c.restore();
    htMannerPokeHearts(c, x + s * 0.5, baseY - s * 0.6, s, htMannerPokeSeg(k, 0.4, 1), 3, s * 0.4);
  },
  mole: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), up = big ? Math.abs(Math.sin(k * Math.PI * 3)) * htMannerPokeFade(k, 0.12) : htMannerPokeHold(k);
    htMannerPokeWob(c, x, baseY, k, wob);
    htMannerPokeMole(c, x, baseY, s, up, k, big);
    htMannerPokeClods(c, x, baseY - s * 0.32, s, htMannerPokeSeg(k, 0, 0.35), 5, '#6e4422');
    if (big) {
      htMannerPokeClods(c, x, baseY - s * 0.32, s, htMannerPokeSeg(k, 0.33, 0.66), 5, '#6e4422');
      htMannerPokeHearts(c, x, baseY - s * 0.75, s, k, 3, s * 0.5);
    }
  },
  tree: htMannerPokeTreeFx,
  clover: function (c, x, baseY, s, rnd2, k, n) {
    var t, a, cy, i, g;
    if (!htMannerPokeBig(n)) {
      // Leppäkerttu kipittää pensaan yli
      t = htMannerPokeEase(k / 0.9);
      a = Math.PI - t * Math.PI;
      c.save();
      c.globalAlpha *= htMannerPokeFade(k, 0.12);
      htMannerPokeLadybug(c, x + Math.cos(a) * s * 0.3, baseY - s * 0.22 - Math.sin(a) * s * 0.2, s * 0.06);
      c.restore();
      return;
    }
    // Iso: hehkuva neliapila nousee pensaasta
    g = htMannerPokeBack(Math.min(1, k * 2.5)) * htMannerPokeFade(k, 0.2);
    cy = baseY - s * 0.45 - htMannerPokeEase(k * 1.5) * s * 0.3;
    c.save();
    c.globalAlpha *= htMannerPokeFade(k, 0.2);
    artGlow(c, x, cy, s * 0.4, '#fff6a0', 0.7);
    artLimb(c, x, cy, x + s * 0.03, cy + s * 0.2 * g, s * 0.025, '#3f8a3a', false);
    for (i = 0; i < 4; i++) {
      a = i * Math.PI / 2 + k * 3;
      artCircle(c, x + Math.cos(a) * s * 0.06 * g, cy + Math.sin(a) * s * 0.06 * g, s * 0.055 * g, '#5fcf55', { lineColor: '#2f7a2c', hi: 0.4 });
    }
    c.restore();
  }
};
var HT_MANNER_POKE_CARROT_SND = {
  patch: function (n) {
    if (htMannerPokeBig(n)) htMannerPokeTune([523, 659, 784, 1047], 0.1, 'triangle', 0.22);
    else { playNote(392, 0, 0.07, 'square', 0.1); playNote(784, 0.06, 0.12, 'sine', 0.25); }
  },
  burrow: function (n) {
    soundBunny();
    if (htMannerPokeBig(n)) htMannerPokeTune([659, 0, 784, 0, 988], 0.12, 'triangle', 0.2, 0.3);
  },
  mole: function (n) {
    htMannerPokeTune(htMannerPokeBig(n) ? [262, 392, 262, 392, 262, 523] : [262, 392], 0.11, 'triangle', 0.25);
  },
  tree: htMannerPokeTreeSnd,
  clover: function (n) {
    if (htMannerPokeBig(n)) htMannerPokeTune([1047, 1319, 1568, 2093], 0.1, 'sine', 0.18);
    else htMannerPokeTune([1175, 0, 1319, 0, 1175], 0.08, 'sine', 0.13);
  }
};
// Kaukainen porkkanapelto: porkkanat hyppivät rivistä
function htMannerPokeFieldCarrots(c, x, y, fw, fh, k) {
  var j, q;
  for (j = 0; j < 5; j++) {
    q = htMannerPokeSeg(k, j * 0.08, j * 0.08 + 0.6);
    if (q < 0) continue;
    htMannerPokeCarrot(c, x + (j - 2) * fw * 0.17, y - 4 * q * (1 - q) * fh * 2.4, fh * 0.7, q * Math.PI * 2);
  }
}
htMannerPokeSetup(HUB_THEMES.carrot, '#ff8f3a', htMannerPokeCarrotKind, HT_MANNER_POKE_CARROT_FX, HT_MANNER_POKE_CARROT_SND, function (w, h, lay) {
  var th = HUB_THEMES.carrot, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x, y;
  var gx = htMannerHeroX(w, lay, false), gy = hz + h * 0.05, hx = htMannerHeroX(w, lay, true), hy = hz + h * 0.05, hsz = hs * 0.8;
  htMannerPokeScatter(list, th, 'carrot-s', w, h, lay, 22, '#79cc5e', 0.9, 3);
  // Jättiporkkana: pupu loikkii sen ohi, isossa porkkanasade
  list.push(htMannerPokeSpot('carrot-giant', gx, gy - hs * 0.4, hs * 0.42, function (c, sp, k) {
    var t = htMannerPokeSeg(k, 0, 0.85), j, q;
    artGlow(c, gx, gy - hs * 0.85, hs * 0.35, '#fff6a0', 0.6 * htMannerPokeFade(k, 0.4));
    if (t >= 0) drawBunny(c, gx - hs * 0.45 + t * hs * 0.9, gy + hs * 0.06, hs * 0.12, Math.abs(Math.sin(t * Math.PI * 3)) * hs * 0.15, k * 25, false);
    if (htMannerPokeBig(sp.n)) {
      for (j = 0; j < 6; j++) {
        q = htMannerPokeSeg(k, j * 0.07, j * 0.07 + 0.55);
        if (q < 0) continue;
        c.save();
        c.globalAlpha *= htMannerPokeFade(q, 0.2);
        htMannerPokeCarrot(c, gx + (j - 2.5) * hs * 0.18, gy - hs * 1.1 + q * hs * 1.05, hs * 0.14, q * 6 + j);
        c.restore();
      }
    }
    htMannerPokeHearts(c, gx, gy - hs * 0.6, hs, htMannerPokeSeg(k, 0.5, 1), 2, hs * 0.3);
  }, function (n) { soundBunny(); htMannerPokeTune(htMannerPokeBig(n) ? [523, 659, 784, 1047, 1319, 1568] : [659, 784, 988], 0.12, 'triangle', 0.18, 0.2); }));
  // Kumpukoti: ovi avautuu ja pupu kurkistaa, piipusta sydämiä
  list.push(htMannerPokeSpot('carrot-home', hx, hy - hsz * 0.25, hsz * 0.5, function (c, sp, k) {
    var dx = hx - hsz * 0.08, dy = hy - hsz * 0.16, op = htMannerPokeHold(k);
    artGlow(c, hx + hsz * 0.26, hy - hsz * 0.26, hsz * 0.18, '#ffe27a', 0.8 * op);
    artCircle(c, hx + hsz * 0.26, hy - hsz * 0.26, hsz * 0.07, artMix('#bfe8ff', '#ffe9a0', op), { lineColor: '#6a3a1a' });
    c.save();
    c.beginPath(); c.arc(dx, dy, hsz * 0.12, 0, Math.PI * 2); c.clip();
    c.globalAlpha *= op;
    c.fillStyle = '#3a2418'; c.fillRect(dx - hsz * 0.12, dy - hsz * 0.12, hsz * 0.24, hsz * 0.24);
    drawBunny(c, dx, dy + hsz * 0.18 - op * hsz * 0.18, hsz * 0.2, 0, k * 20, true);
    c.restore();
    htMannerPokeHearts(c, hx + hsz * 0.22, hy - hsz * 0.66, hsz * 1.5, k, htMannerPokeBig(sp.n) ? 5 : 3, hsz * 0.7);
  }, function (n) { playNote(659, 0, 0.25, 'sine', 0.22); playNote(523, 0.25, 0.35, 'sine', 0.22); if (htMannerPokeBig(n)) soundBunny(); }));
  // Kaukaiset porkkanapellot
  for (i = 0; i < 6; i++) {
    x = i % 2 ? sd.R + (w - sd.R) * (0.25 + (i % 3) * 0.25) : sd.L * (0.25 + (i % 3) * 0.25);
    y = hz - h * 0.03 + (i % 3) * h * 0.025;
    list.push(htMannerPokeFieldSpot('carrot-f' + i, x, y, lay.cell * 1.5, h * 0.045));
  }
  list.push(htMannerPokeSunSpot('carrot-sun', w * 0.05, h * 0.2, h * 0.04));
  return list;
});
function htMannerPokeFieldSpot(id, x, y, fw, fh) {
  return htMannerPokeSpot(id, x, y, Math.max(fw * 0.5, fh * 1.5), function (c, sp, k) {
    htMannerPokeFieldCarrots(c, x, y, fw, fh, k);
  }, function (n) { htMannerPokeTune([784, 880, 988, 1047, 1175], 0.06, 'sine', 0.14); });
}

// --- Kellopaja: ratas pyörii, käki kukkuu, soittorasia soi, vesiratas loiskii ---
function htMannerPokeClockKind(rnd) {
  return rnd < 0.28 ? 'gears' : rnd < 0.48 ? 'cuckoo' : rnd < 0.64 ? 'musicbox' : rnd < 0.78 ? 'wheel' : 'bush';
}
// Kellotaulun viisarit (kierto a; a = 0 = koristeen oma asento)
function htMannerPokeHands(c, x, y, ml, hl, ha, a, lw) {
  c.strokeStyle = '#3a2010'; c.lineWidth = lw; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y); c.lineTo(x + Math.cos(-Math.PI / 2 + a * 2) * ml, y + Math.sin(-Math.PI / 2 + a * 2) * ml);
  c.moveTo(x, y); c.lineTo(x + Math.cos(ha + a) * hl, y + Math.sin(ha + a) * hl);
  c.stroke();
}
function htMannerPokeCuckooBird(c, bx, by, r, open) {
  artBlob(c, bx - r * 0.9, by + r * 0.2, r * 0.45, r * 0.2, '#e0a020', { rot: 0.4, lineColor: '#a87a10' });
  artCircle(c, bx, by, r, '#ffd84a', { lineColor: '#a87a10', hi: 0.4 });
  artBlob(c, bx - r * 0.2, by + r * 0.25, r * 0.45, r * 0.28, '#f0b030', { lineColor: '#a87a10', line: Math.max(1, r * 0.08) });
  c.fillStyle = '#ff8f3a';
  c.beginPath();
  c.moveTo(bx + r * 0.75, by - r * 0.25); c.lineTo(bx + r * 1.5, by - r * (open ? 0.35 : 0.08)); c.lineTo(bx + r * 0.75, by - r * 0.02);
  if (open) { c.lineTo(bx + r * 1.4, by + r * 0.25); c.lineTo(bx + r * 0.75, by + r * 0.1); }
  c.closePath(); c.fill();
  artEye(c, bx + r * 0.35, by - r * 0.3, r * 0.2, 0, false);
}
var HT_MANNER_POKE_CLOCK_FX = {
  gears: function (c, x, baseY, s, rnd2, k, n, wob) {
    var cols = ['#e0b45a', '#c8d0dc', '#e08a5a'], j = Math.floor(rnd2 * 3), big = htMannerPokeBig(n), a = htMannerPokeEase(k / 0.85) * Math.PI * 2 * (big ? 3 : 1);
    htMannerPokeWob(c, x, baseY, k, wob);
    gearDrawWheel(c, x - s * 0.08, baseY - s * 0.35, s * 0.3, rnd2 * 6 + a, cols[j], 9);
    gearDrawWheel(c, x + s * 0.32, baseY - s * 0.17, s * 0.16, rnd2 * 4 - a * 1.5, cols[(j + 1) % 3], 6);
    if (big) htMannerPokeHearts(c, x - s * 0.08, baseY - s * 0.7, s, k, 3, s * 0.5);
  },
  cuckoo: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), reps = big ? 3 : 1, ph = Math.min(0.999, k / 0.9) * reps, f = ph - Math.floor(ph), dy = baseY - s * 0.82, out, r, bx, by, i;
    htMannerPokeWob(c, x, baseY, k, wob);
    if (big) {
      // Viisarit pyörähtävät ympäri
      artCircle(c, x, baseY - s * 0.5, s * 0.13, '#fffaf0', { lineColor: '#6a3a1a' });
      c.fillStyle = '#6a3a1a';
      for (i = 0; i < 4; i++) { c.beginPath(); c.arc(x + Math.cos(i * Math.PI / 2) * s * 0.1, baseY - s * 0.5 + Math.sin(i * Math.PI / 2) * s * 0.1, s * 0.012, 0, Math.PI * 2); c.fill(); }
      htMannerPokeHands(c, x, baseY - s * 0.5, s * 0.09, s * 0.067, 0.4636, htMannerPokeEase(k / 0.9) * Math.PI * 2, Math.max(1, s * 0.02));
    }
    if (k >= 0.9) return;
    out = f < 0.2 ? htMannerPokeEase(f / 0.2) : f > 0.8 ? htMannerPokeEase((1 - f) / 0.2) : 1;
    if (out < 0.02) return;
    // Luukku auki, käki jousen päässä
    artRoundRect(c, x - s * 0.15, dy - s * 0.06, s * 0.07, s * 0.12, s * 0.02, '#c87a4a', { lineColor: '#6a3a1a', line: Math.max(1, s * 0.01) });
    bx = x + out * s * 0.12; by = dy + out * s * 0.06; r = s * 0.06 * (1 + out * 0.9);
    c.strokeStyle = '#a8a8b8'; c.lineWidth = Math.max(1, s * 0.012);
    c.beginPath(); c.moveTo(x, dy);
    for (i = 1; i <= 4; i++) c.lineTo(x + (bx - x) * i / 4 + (i % 2 ? 1 : -1) * s * 0.015, dy + (by - dy) * i / 4);
    c.stroke();
    htMannerPokeCuckooBird(c, bx, by, r, (f > 0.3 && f < 0.45) || (f > 0.55 && f < 0.75));
    if (f > 0.3) htMannerPokeNotes(c, bx + s * 0.1, by - s * 0.05, s * 0.8, (f - 0.3) / 0.7, 2, s * 0.3);
  },
  musicbox: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), top = baseY - s * 0.28, up, sc;
    htMannerPokeNotes(c, x, top - s * 0.25, s, k, big ? 7 : 5, s * 0.7);
    if (!big) return;
    // Iso: pieni pupuballerina nousee kannelle ja pyörii
    htMannerPokeWob(c, x, baseY, k, wob);
    up = htMannerPokeHold(k);
    sc = Math.cos(k * Math.PI * 8);
    c.save();
    c.translate(x - s * 0.02, top - s * 0.06 - up * s * 0.12);
    c.scale(0.4 + 0.6 * Math.abs(sc), 1);
    c.globalAlpha *= Math.min(1, up * 2);
    artLimb(c, 0, s * 0.08, 0, -s * 0.06, s * 0.02, '#c8d0dc', false);
    artBlob(c, 0, -s * 0.07, s * 0.1, s * 0.035, '#ff9cc8', { lineColor: '#c84a7a', line: Math.max(1, s * 0.01) });
    artBlob(c, 0, -s * 0.12, s * 0.035, s * 0.05, '#ffffff', { lineColor: '#8a7a9a', line: Math.max(1, s * 0.01) });
    drawBunny(c, 0, -s * 0.2, s * 0.12, 0, k * 20, true);
    c.restore();
  },
  wheel: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), wx = x + s * 0.12, q;
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    htMannerWaterWheel(c, x, baseY, s, htMannerPokeEase(k / 0.9) * Math.PI * 2 * (big ? 2 : 1));
    c.restore();
    htMannerPokeRings(c, wx, baseY - s * 0.03, s, htMannerPokeSeg(k, 0, 0.8));
    htMannerPokeDrops(c, wx + s * 0.1, baseY - s * 0.08, s, htMannerPokeSeg(k, 0.02, 0.55), 6, s * 0.35);
    htMannerPokeDrops(c, wx - s * 0.05, baseY - s * 0.08, s, htMannerPokeSeg(k, 0.3, 0.85), 5, s * 0.28);
    if (big) {
      // Kala hyppää altaasta
      q = htMannerPokeSeg(k, 0.2, 0.8);
      if (q >= 0) htMannerPokeFish(c, wx - s * 0.25 + q * s * 0.5, baseY - s * 0.05 - 4 * q * (1 - q) * s * 0.6, s * 0.07, (q - 0.5) * 2.4, '#ff9a3a');
      htMannerPokeDrops(c, wx + s * 0.25, baseY - s * 0.05, s, htMannerPokeSeg(k, 0.78, 1), 5, s * 0.2);
    }
  },
  bush: function (c, x, baseY, s, rnd2, k, n) {
    // Vedettävä leluhiiri kurvailee pensaan alta
    var big = htMannerPokeBig(n), t = Math.min(1, k / 0.85), dir = rnd2 < 0.5 ? -1 : 1, mx, face = dir, my;
    if (big) { mx = x + dir * Math.sin(t * Math.PI) * s * 0.55; if (t > 0.5) face = -dir; }
    else mx = x + dir * htMannerPokeEase(t) * s * 0.5;
    my = baseY + s * 0.04 - Math.abs(Math.sin(k * 30)) * s * 0.015;
    c.save();
    c.globalAlpha *= htMannerPokeFade(k, 0.15);
    c.translate(mx, my);
    c.scale(face * 1.5, 1.5);
    c.strokeStyle = '#8a7a9a'; c.lineWidth = Math.max(1, s * 0.012); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.1, -s * 0.05); c.quadraticCurveTo(-s * 0.2, -s * 0.12, -s * 0.18, -s * 0.02); c.stroke();
    artBlob(c, 0, -s * 0.06, s * 0.1, s * 0.065, '#c8c0d8', { lineColor: '#5a5070', hi: 0.4 });
    artCircle(c, s * 0.04, -s * 0.12, s * 0.035, '#ffc4dd', { lineColor: '#5a5070', line: Math.max(1, s * 0.01) });
    artEye(c, s * 0.07, -s * 0.07, s * 0.014, 0, false);
    artCircle(c, s * 0.1, -s * 0.05, s * 0.015, '#ff8fbe', { line: false });
    c.scale(Math.cos(k * 25), 1);
    artLimb(c, 0, -s * 0.12, 0, -s * 0.16, s * 0.015, '#a87a10', false);
    artBlob(c, 0, -s * 0.18, s * 0.04, s * 0.025, '#e0b45a', { lineColor: '#a87a10', line: Math.max(1, s * 0.01) });
    c.restore();
    if (big) htMannerPokeHearts(c, mx, baseY - s * 0.3, s, htMannerPokeSeg(k, 0.3, 1), 2, s * 0.3);
  },
  tree: htMannerPokeTreeFx
};
var HT_MANNER_POKE_CLOCK_SND = {
  gears: function (n) {
    var i, m = htMannerPokeBig(n) ? 12 : 6;
    for (i = 0; i < m; i++) playNote(i % 2 ? 2000 : 1600, i * 0.1, 0.03, 'square', 0.05);
    if (htMannerPokeBig(n)) playNote(1568, m * 0.1, 0.4, 'sine', 0.2);
  },
  cuckoo: function (n) {
    var reps = htMannerPokeBig(n) ? 3 : 1, L = 0.9 * HT_MANNER_POKE_DUR / reps, r;
    for (r = 0; r < reps; r++) {
      playNote(784, (r + 0.3) * L, 0.18, 'sine', 0.3);
      playNote(622, (r + 0.55) * L, 0.28, 'sine', 0.3);
    }
  },
  musicbox: function (n) {
    if (htMannerPokeBig(n)) htMannerPokeTune([1047, 1047, 1568, 1568, 1760, 1760, 1568], 0.2, 'sine', 0.18);
    else htMannerPokeTune([1568, 1319, 1568, 1976, 1760], 0.16, 'sine', 0.18);
  },
  wheel: function (n) {
    playNote(1200, 0, 0.05, 'sine', 0.15); playNote(800, 0.04, 0.06, 'sine', 0.15); playNote(1500, 0.14, 0.04, 'sine', 0.1);
    if (htMannerPokeBig(n)) { playNote(330, 0.4, 0.1, 'sine', 0.25); playNote(660, 0.48, 0.12, 'sine', 0.2); playNote(1200, 1.55, 0.05, 'sine', 0.15); }
  },
  bush: function (n) {
    var i;
    for (i = 0; i < 4; i++) playNote(900, i * 0.06, 0.025, 'square', 0.07);
    htMannerPokeTune(htMannerPokeBig(n) ? [784, 988, 1175, 988, 784] : [784, 988, 1175], 0.08, 'triangle', 0.16, 0.3);
  },
  tree: htMannerPokeTreeSnd
};
htMannerPokeSetup(HUB_THEMES.clock, '#ffd84a', htMannerPokeClockKind, HT_MANNER_POKE_CLOCK_FX, HT_MANNER_POKE_CLOCK_SND, function (w, h, lay) {
  var th = HUB_THEMES.clock, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i;
  var tx = htMannerHeroX(w, lay, false), ty = hz + h * 0.05, fx = htMannerHeroX(w, lay, true), fy = hz + h * 0.05, fsz = hs * 0.95;
  htMannerPokeScatter(list, th, 'clock-s', w, h, lay, 22, '#8ccf5e', 0.9, 5);
  // Kellotorni: viisarit pyörähtävät ja kello lyö
  list.push(htMannerPokeSpot('clock-tower', tx, ty - hs * 0.6, hs * 0.38, function (c, sp, k) {
    var tw = hs * 0.2, cy = ty - hs * 0.72, i, a, big = htMannerPokeBig(sp.n), e = htMannerPokeEase(k / 0.9) * Math.PI * 2 * (big ? 2 : 1);
    artCircle(c, tx, cy, tw * 0.82, '#fffaf0', { lineColor: '#6a3a1a' });
    c.fillStyle = '#6a3a1a';
    for (i = 0; i < 12; i++) {
      a = i * Math.PI / 6;
      c.beginPath(); c.arc(tx + Math.cos(a) * tw * 0.66, cy + Math.sin(a) * tw * 0.66, Math.max(1, tw * 0.05), 0, Math.PI * 2); c.fill();
    }
    htMannerPokeHands(c, tx, cy, tw * 0.55, Math.hypot(0.38, 0.1) * tw, Math.atan2(0.1, 0.38), e, Math.max(1.5, tw * 0.08));
    gearDrawWheel(c, tx + tw, ty - hs * 0.5, tw * 0.45, 0.3 - e, '#e0b45a', 8);
    htMannerPokeNotes(c, tx + tw * 1.6, ty - hs * 0.95, hs * 0.8, k, big ? 6 : 3, hs * 0.3);
    if (big) htMannerPokeHearts(c, tx, cy - tw, hs, htMannerPokeSeg(k, 0.3, 1), 3, hs * 0.5);
  }, function (n) {
    var i, m = htMannerPokeBig(n) ? 4 : 2;
    for (i = 0; i < m; i++) { playNote(392, 0.1 + i * 0.45, 0.5, 'sine', 0.3); playNote(784, 0.1 + i * 0.45, 0.4, 'triangle', 0.08); }
  }, 2.2));
  // Lelutehdas: piipuista sydänsavua, ovesta ponnahtaa leluja
  list.push(htMannerPokeSpot('clock-factory', fx, fy - fsz * 0.3, fsz * 0.5, function (c, sp, k) {
    var w2 = fsz * 0.45, top = fy - fsz * 0.42, i, cx, q, big = htMannerPokeBig(sp.n), tx2, ty2;
    for (i = 0; i < 2; i++) {
      cx = fx - w2 * 0.5 + i * w2 * 0.9;
      htMannerPokeHearts(c, cx, top - fsz * (0.48 + i * 0.1), fsz * 1.2, htMannerPokeSeg(k, i * 0.1, 1), big ? 5 : 3, fsz * 0.5);
    }
    for (i = 0; i < (big ? 4 : 2); i++) {
      q = htMannerPokeSeg(k, 0.15 + i * 0.1, 0.75 + i * 0.06);
      if (q < 0) continue;
      tx2 = fx + (i % 2 ? 1 : -1) * q * fsz * (0.25 + i * 0.06);
      ty2 = fy - fsz * 0.06 - 4 * q * (1 - q) * fsz * 0.35;
      c.save();
      c.globalAlpha *= htMannerPokeFade(q, 0.2);
      if (i % 3 === 0) artCircle(c, tx2, ty2, fsz * 0.045, '#ff5a7a', { lineColor: '#8a2a3a', hi: 0.5 });
      else if (i % 3 === 1) artRoundRect(c, tx2 - fsz * 0.04, ty2 - fsz * 0.04, fsz * 0.08, fsz * 0.08, fsz * 0.015, '#5fa8d8', { lineColor: '#2a5a8a' });
      else htMannerPokeStar(c, tx2, ty2, fsz * 0.05, '#ffd24f');
      c.restore();
    }
  }, function (n) {
    playNote(1175, 0, 0.3, 'sine', 0.14); playNote(1397, 0, 0.3, 'sine', 0.1);
    htMannerPokeTune(htMannerPokeBig(n) ? [523, 659, 784, 1047] : [523, 659], 0.12, 'triangle', 0.18, 0.4);
  }));
  // Kaukaiset jättirattaat pyörähtävät
  for (i = 0; i < 4; i++) list.push(htMannerPokeGearSpot('clock-g' + i, i % 2 ? sd.R + (w - sd.R) * (0.2 + i * 0.12) : sd.L * (0.85 - i * 0.12), hz - h * 0.02, lay.cell * (0.45 + (i % 2) * 0.2), i));
  list.push(htMannerPokeSunSpot('clock-sun', w * 0.95, h * 0.2, h * 0.04));
  return list;
});
function htMannerPokeGearSpot(id, x, y, r, ang) {
  return htMannerPokeSpot(id, x, y, r * 1.1, function (c, sp, k) {
    c.globalAlpha *= 0.8 * htMannerPokeFade(k, 0.1);
    gearDrawWheel(c, x, y, r, ang + htMannerPokeEase(k / 0.9) * Math.PI * 2 * (htMannerPokeBig(sp.n) ? 2 : 1), '#e0b45a', 10);
  }, function (n) { var i; for (i = 0; i < 6; i++) playNote(i % 2 ? 1800 : 1400, i * 0.12, 0.03, 'square', 0.05); });
}
// Pieni viisisakarainen tähti (lelu)
function htMannerPokeStar(c, x, y, r, col) {
  var i, a;
  c.beginPath();
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5;
    c.lineTo(x + Math.cos(a) * r * (i % 2 ? 0.45 : 1), y + Math.sin(a) * r * (i % 2 ? 0.45 : 1));
  }
  c.closePath();
  artFillPath(c, col, y - r, y + r, r, { lineColor: artShade(col, -0.45) });
}

// --- Maalaiskylä: omena putoaa, kana munii, paali kierii, kurpitsa pomppii ---
function htMannerPokeFarmKind(rnd) {
  return rnd < 0.32 ? 'apple' : rnd < 0.48 ? 'bales' : rnd < 0.62 ? 'fence' : rnd < 0.76 ? 'coop' : 'pumpkin';
}
var HT_MANNER_POKE_APPLES = [[-0.32, 0.7], [0.26, 0.8], [-0.06, 1.08], [0.42, 0.58], [0.1, 0.9]];
function htMannerPokeApple(c, x, y, r, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  artLimb(c, 0, -r * 0.8, r * 0.15, -r * 1.3, Math.max(1, r * 0.18), '#6a4a28', false);
  artBlob(c, r * 0.45, -r * 1.15, r * 0.35, r * 0.18, '#5fc050', { rot: -0.4, lineColor: '#2f7a2c', line: Math.max(1, r * 0.1) });
  artCircle(c, 0, 0, r, '#e8423a', { lineColor: '#8a1a1a', hi: 0.5, line: Math.max(1, r * 0.15) });
  c.restore();
}
function htMannerPokeEgg(c, x, y, r, col, crack) {
  artBlob(c, x, y, r * 0.8, r, col, { lineColor: col === '#fff8ec' ? '#b8a888' : '#a87a10', hi: 0.5 });
  if (crack) {
    c.strokeStyle = '#8a6a30'; c.lineWidth = Math.max(1, r * 0.1); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - r * 0.75, y - r * 0.1); c.lineTo(x - r * 0.35, y - r * 0.3); c.lineTo(x, y - r * 0.05); c.lineTo(x + r * 0.35, y - r * 0.3); c.lineTo(x + r * 0.75, y - r * 0.1); c.stroke();
  }
}
var HT_MANNER_POKE_FARM_FX = {
  apple: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), kk = s * (0.6 + rnd2 * 0.16), gy = baseY - s * 0.02, j, a, q, f, b, ax, ay, y, dir, r = kk * 0.11;
    for (j = 0; j < (big ? 3 : 1); j++) {
      a = HT_MANNER_POKE_APPLES[(n + j * 2) % 5];
      q = htMannerPokeSeg(k, j * 0.12, j * 0.12 + 0.8);
      if (q < 0) continue;
      ax = x + a[0] * kk; ay = baseY - a[1] * kk; dir = a[0] < 0 ? -1 : 1;
      f = Math.min(1, q / 0.35);
      b = q > 0.35 ? (q - 0.35) / 0.65 : 0;
      y = ay + (gy - r - ay) * f * f - Math.abs(Math.sin(b * Math.PI * 2)) * (1 - b) * s * 0.12;
      c.save();
      c.globalAlpha *= htMannerPokeFade(q, 0.15);
      htMannerPokeApple(c, ax + dir * b * s * 0.25, y, r, dir * b * 3);
      c.restore();
    }
    if (big) htMannerPokeHearts(c, x, baseY - kk * 1.2, s, htMannerPokeSeg(k, 0.3, 1), 3, s * 0.4);
  },
  bales: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), t = Math.min(1, k / 0.85), dir = rnd2 < 0.5 ? 1 : -1, r = s * 0.13, px, py, i, a, q;
    px = x + dir * (0.05 + t * (big ? 0.9 : 0.6)) * s;
    py = baseY - r - (1 - htMannerPokeEase(t * 3)) * s * 0.35 - Math.abs(Math.sin(t * Math.PI * (big ? 3 : 2))) * (1 - t) * s * (big ? 0.3 : 0.15);
    // Olkia lentää
    q = htMannerPokeSeg(k, 0, 0.5);
    if (q >= 0) {
      c.strokeStyle = 'rgba(200,150,50,' + (1 - q) + ')'; c.lineWidth = Math.max(1, s * 0.015); c.lineCap = 'round';
      for (i = 0; i < 6; i++) {
        a = -Math.PI / 2 + (i - 2.5) * 0.5;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * q * s * 0.4, baseY - s * 0.4 + Math.sin(a) * q * s * 0.3 + q * q * s * 0.3);
        c.lineTo(x + Math.cos(a + 0.6) * q * s * 0.4 + s * 0.04, baseY - s * 0.4 + Math.sin(a) * q * s * 0.3 + q * q * s * 0.3 + s * 0.03);
        c.stroke();
      }
    }
    c.save();
    c.globalAlpha *= htMannerPokeFade(k, 0.15);
    artShadow(c, px, baseY, r * 1.1, r * 0.25, 0.15);
    c.translate(px, py);
    c.rotate(dir * (px - x) / r);
    htMannerBale(c, 0, 0, r);
    c.restore();
    if (big) htMannerPokeHearts(c, px, py - r * 1.5, s, htMannerPokeSeg(k, 0.5, 1), 2, s * 0.3);
  },
  fence: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), i, cx, cy, j, q;
    if (big) {
      // Auringonkukat hymyilevät
      c.save();
      htMannerPokeWob(c, x, baseY, k, wob);
      c.globalAlpha *= Math.min(1, k * 5) * htMannerPokeFade(k, 0.2);
      for (i = 0; i < 2; i++) {
        cx = x + (i ? 0.22 : -0.18) * s + (i - 0.5) * s * 0.06;
        cy = baseY - s * (0.64 + i * 0.1);
        artEye(c, cx - s * 0.02, cy - s * 0.012, s * 0.013, 0, false);
        artEye(c, cx + s * 0.02, cy - s * 0.012, s * 0.013, 0, false);
        c.strokeStyle = '#3a2010'; c.lineWidth = Math.max(1, s * 0.012); c.lineCap = 'round';
        c.beginPath(); c.arc(cx, cy + s * 0.008, s * 0.022, 0.3, Math.PI - 0.3); c.stroke();
      }
      c.restore();
    }
    // Mehiläiset pörräävät kukkien ympäri
    for (j = 0; j < (big ? 3 : 1); j++) {
      q = htMannerPokeSeg(k, j * 0.08, j * 0.08 + 0.84);
      if (q < 0) continue;
      c.save();
      c.globalAlpha *= htMannerPokeFade(q, 0.15) * Math.min(1, q * 8);
      htMannerPokeBee(c, x + s * 0.02 + Math.sin(q * Math.PI * 4 + j * 2) * s * 0.32, baseY - s * 0.72 + Math.sin(q * Math.PI * 8 + j) * s * 0.08 - q * s * 0.2, s * 1.6, k * 60 + j);
      c.restore();
    }
  },
  coop: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), hx = x + s * 0.3, hy = baseY - s * 0.12, open = (k > 0.04 && k < 0.12) || (k > 0.17 && k < 0.26), q, ex, ey, er, cq;
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    if (open) {
      // Kana kotkottaa: nokka auki
      c.fillStyle = '#ffb030';
      c.beginPath();
      c.moveTo(hx + s * 0.13, hy - s * 0.15); c.lineTo(hx + s * 0.21, hy - s * 0.16); c.lineTo(hx + s * 0.13, hy - s * 0.12);
      c.lineTo(hx + s * 0.2, hy - s * 0.07); c.lineTo(hx + s * 0.13, hy - s * 0.1); c.closePath(); c.fill();
    }
    c.restore();
    if (k < 0.3) htMannerPokeNotes(c, hx + s * 0.2, hy - s * 0.2, s * 0.7, k / 0.3, 2, s * 0.2);
    // Muna pulpahtaa kanan alta
    q = htMannerPokeSeg(k, 0.3, 1);
    if (q < 0) return;
    er = s * 0.085 * htMannerPokeBack(Math.min(1, q * 3));
    ex = hx - s * 0.1 - htMannerPokeEase(q * 2) * s * 0.08;
    ey = baseY + s * 0.02 - er;
    c.save();
    c.globalAlpha *= htMannerPokeFade(q, 0.15);
    if (big) artGlow(c, ex, ey, s * 0.2, '#fff4a0', 0.7);
    if (big && q > 0.45) {
      // Kultamunasta kuoriutuu tipu
      cq = Math.min(1, (q - 0.45) * 4);
      htMannerPokeEgg(c, ex, ey + er * 0.2, er * 0.95, '#ffd84a', true);
      artCircle(c, ex, ey - er * 0.4 - cq * er * 0.7, er * 0.65, '#fff27a', { lineColor: '#c8a020', hi: 0.4 });
      artEye(c, ex - er * 0.2, ey - er * 0.5 - cq * er * 0.7, er * 0.12, 0, false);
      artEye(c, ex + er * 0.2, ey - er * 0.5 - cq * er * 0.7, er * 0.12, 0, false);
      c.fillStyle = '#ff9a3a';
      c.beginPath(); c.moveTo(ex - er * 0.12, ey - er * 0.3 - cq * er * 0.7); c.lineTo(ex + er * 0.12, ey - er * 0.3 - cq * er * 0.7); c.lineTo(ex, ey - er * 0.15 - cq * er * 0.7); c.fill();
      artBlob(c, ex, ey + er * 0.35, er * 0.85, er * 0.55, '#ffd84a', { lineColor: '#a87a10' });
    } else htMannerPokeEgg(c, ex, ey, er, big ? '#ffd84a' : '#fff8ec', false);
    c.restore();
    if (big) htMannerPokeHearts(c, ex, ey - s * 0.2, s, htMannerPokeSeg(k, 0.6, 1), 2, s * 0.3);
  },
  pumpkin: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), i = n % 2, px = x + (i ? 0.2 : -0.16) * s, r = s * (i ? 0.11 : 0.14), d = 1 - k, sc, sq, f;
    sc = 1 + (big ? 0.55 : 0.25) * Math.abs(Math.sin(k * Math.PI * 3)) * d;
    sq = 0.12 * Math.sin(k * Math.PI * 6) * d;
    f = Math.min(1, k * 6) * htMannerPokeFade(k, 0.2);
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    c.translate(px, baseY);
    c.scale(sc * (1 + sq), sc * (1 - sq));
    artLimb(c, 0, -r * 1.7, r * 0.2, -r * 2.1, s * 0.03, '#4f8a3a');
    artBlob(c, 0, -r, r * 1.25, r, '#ff9a3a', { lineColor: '#b8541a', hi: 0.3 });
    c.strokeStyle = 'rgba(184,84,26,0.6)'; c.lineWidth = Math.max(1, s * 0.012);
    c.beginPath(); c.moveTo(-r * 0.55, -r * 1.85); c.quadraticCurveTo(-r * 0.75, -r, -r * 0.55, -r * 0.15); c.moveTo(r * 0.55, -r * 1.85); c.quadraticCurveTo(r * 0.75, -r, r * 0.55, -r * 0.15); c.stroke();
    // Ystävällinen naama
    c.globalAlpha *= f;
    artEye(c, -r * 0.4, -r * 1.15, r * 0.16, 0, false);
    artEye(c, r * 0.4, -r * 1.15, r * 0.16, 0, false);
    c.strokeStyle = '#7a3a10'; c.lineWidth = Math.max(1, r * 0.1); c.lineCap = 'round';
    c.beginPath(); c.arc(0, -r * 0.85, r * 0.35, 0.3, Math.PI - 0.3); c.stroke();
    artBlush(c, -r * 0.75, -r * 0.8, r * 0.14);
    artBlush(c, r * 0.75, -r * 0.8, r * 0.14);
    c.restore();
    if (big) htMannerPokeHearts(c, px, baseY - r * 3, s, htMannerPokeSeg(k, 0.2, 1), 3, s * 0.4);
  }
};
var HT_MANNER_POKE_FARM_SND = {
  apple: function (n) {
    var j, d;
    playNote(1760, 0, 0.04, 'sine', 0.08);
    for (j = 0; j < (htMannerPokeBig(n) ? 3 : 1); j++) {
      d = (j * 0.12 + 0.8 * 0.35) * HT_MANNER_POKE_DUR;
      playNote(262, d, 0.1, 'triangle', 0.3); playNote(392, d + 0.18, 0.08, 'triangle', 0.18);
    }
  },
  bales: function (n) {
    var i;
    for (i = 0; i < 6; i++) playNote(150 + i * 20, i * 0.1, 0.08, 'triangle', 0.22);
    if (htMannerPokeBig(n)) htMannerPokeTune([392, 523, 659, 784], 0.1, 'triangle', 0.18, 0.7);
  },
  fence: function (n) {
    var i, m = htMannerPokeBig(n) ? 10 : 6;
    for (i = 0; i < m; i++) playNote(i % 2 ? 233 : 220, i * 0.08, 0.08, 'sawtooth', 0.04);
    if (htMannerPokeBig(n)) htMannerPokeTune([784, 988, 1175], 0.1, 'sine', 0.15, 0.85);
  },
  coop: function (n) {
    playNote(660, 0.08, 0.06, 'square', 0.09); playNote(587, 0.18, 0.07, 'square', 0.09); playNote(700, 0.36, 0.08, 'square', 0.09);
    playNote(880, 0.62, 0.08, 'sine', 0.25); playNote(1175, 0.68, 0.1, 'sine', 0.2);
    if (htMannerPokeBig(n)) { playNote(1568, 0.72, 0.3, 'sine', 0.12); playNote(2093, 1.3, 0.06, 'sine', 0.15); playNote(2349, 1.4, 0.06, 'sine', 0.15); playNote(2093, 1.55, 0.06, 'sine', 0.15); }
  },
  pumpkin: function (n) {
    playNote(196, 0, 0.12, 'triangle', 0.3); playNote(294, 0.08, 0.12, 'triangle', 0.25); playNote(392, 0.36, 0.1, 'triangle', 0.2);
    if (htMannerPokeBig(n)) htMannerPokeTune([523, 659, 784, 1047], 0.09, 'triangle', 0.18, 0.6);
  }
};
// Kuumailmapallo nousee: alkuperäinen paikka peitetään taivaalla
function htMannerPokeBalloonSpot(id, x, y, r, cols, sky) {
  return htMannerPokeSpot(id, x, y, r * 1.5, function (c, sp, k) {
    var big = htMannerPokeBig(sp.n), up = htMannerPokeHold(k) * r * (big ? 3 : 1.6), g, fl;
    g = c.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    c.fillStyle = g;
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y + r * 0.28, r * 1.28, r * 1.48, 0, 0, Math.PI * 2);
    c.fill();
    htMannerBalloon(c, x + Math.sin(k * Math.PI * 2) * r * 0.2, y - up, r, cols);
    fl = Math.abs(Math.sin(k * 30)) * htMannerPokeHold(k);
    artGlow(c, x + Math.sin(k * Math.PI * 2) * r * 0.2, y - up + r * 0.95, r * 0.5, '#ffb030', 0.8 * fl);
    if (big) htMannerPokeHearts(c, x, y - up - r * 1.1, r * 7, htMannerPokeSeg(k, 0.15, 1), 4, r * 2);
  }, function (n) {
    playNote(110, 0, 0.35, 'sawtooth', 0.05);
    htMannerPokeTune(htMannerPokeBig(n) ? [523, 659, 784, 1047, 1319] : [523, 659, 784], 0.12, 'sine', 0.15, 0.2);
  }, 2.4);
}
htMannerPokeSetup(HUB_THEMES.farm, '#ff7bac', htMannerPokeFarmKind, HT_MANNER_POKE_FARM_FX, HT_MANNER_POKE_FARM_SND, function (w, h, lay) {
  var th = HUB_THEMES.farm, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay);
  var tx = sd.L * 0.8, ty = hz + h * 0.04, tk = Math.min(sd.L * 0.42, h * 0.13), bx = htMannerHeroX(w, lay, true) - hs * 0.08, by = hz + h * 0.08;
  htMannerPokeScatter(list, th, 'farm-s', w, h, lay, 20, null, 0.9, 7);
  // Juna: tuuttaa, nytkähtää ja puksuttaa höyrypalloja
  list.push(htMannerPokeSpot('farm-train', tx - tk * 0.6, ty - tk * 0.25, tk * 0.75, function (c, sp, k) {
    var big = htMannerPokeBig(sp.n), dx = Math.sin(k * Math.PI * 10) * tk * 0.03 * (1 - k) + Math.sin(Math.min(1, k / 0.9) * Math.PI) * tk * (big ? 0.12 : 0.05);
    htMannerTrainCars(c, tx + dx, ty, tk);
    if (big) htMannerPokeHearts(c, tx + dx + tk * 0.06, ty - tk * 0.62, tk * 2.5, k, 5, tk * 0.9);
    else htMannerPokePuffs(c, tx + dx + tk * 0.06, ty - tk * 0.62, tk * 1.4, k, 4, tk * 0.8);
  }, function (n) {
    var i, m = htMannerPokeBig(n) ? 3 : 2;
    for (i = 0; i < m; i++) { playNote(523, i * 0.35, 0.25, 'square', 0.07); playNote(659, i * 0.35, 0.25, 'square', 0.05); }
    for (i = 0; i < 6; i++) playNote(180, 0.9 + i * 0.12, 0.05, 'triangle', 0.15);
  }, 2.2));
  // Lato: ovi aukeaa ja lehmä kurkistaa ammuen
  list.push(htMannerPokeSpot('farm-barn', bx, by - hs * 0.3, hs * 0.42, function (c, sp, k) {
    var op = htMannerPokeHold(k), cx = bx, cy = by - hs * 0.12 - op * hs * 0.04, r = hs * 0.09;
    c.save();
    c.globalAlpha *= op;
    artRoundRect(c, bx - hs * 0.15, by - hs * 0.3, hs * 0.3, hs * 0.3, hs * 0.01, '#4a2a1a', { lineColor: '#ffffff', line: Math.max(1.5, hs * 0.018) });
    c.beginPath(); c.rect(bx - hs * 0.15, by - hs * 0.3, hs * 0.3, hs * 0.3); c.clip();
    cy += (1 - op) * hs * 0.2;
    artBlob(c, cx - r * 1.1, cy - r * 0.7, r * 0.4, r * 0.2, '#ffffff', { rot: -0.4, lineColor: '#5a5a6a' });
    artBlob(c, cx + r * 1.1, cy - r * 0.7, r * 0.4, r * 0.2, '#ffffff', { rot: 0.4, lineColor: '#5a5a6a' });
    artBlob(c, cx, cy, r, r * 1.05, '#ffffff', { lineColor: '#5a5a6a', hi: 0.4 });
    artBlob(c, cx - r * 0.45, cy - r * 0.45, r * 0.3, r * 0.25, '#3a3a4a', { line: false });
    artBlob(c, cx, cy + r * 0.55, r * 0.7, r * 0.42, '#ffb8c8', { lineColor: '#c86a8a' });
    artCircle(c, cx - r * 0.25, cy + r * 0.55, r * 0.08, '#c86a8a', { line: false });
    artCircle(c, cx + r * 0.25, cy + r * 0.55, r * 0.08, '#c86a8a', { line: false });
    artEye(c, cx - r * 0.35, cy - r * 0.1, r * 0.14, 0, k > 0.45 && k < 0.52);
    artEye(c, cx + r * 0.35, cy - r * 0.1, r * 0.14, 0, k > 0.45 && k < 0.52);
    c.restore();
    htMannerPokeNotes(c, bx + hs * 0.15, by - hs * 0.32, hs * 0.8, htMannerPokeSeg(k, 0.15, 1), 2, hs * 0.3);
    if (htMannerPokeBig(sp.n)) htMannerPokeHearts(c, bx, by - hs * 0.6, hs, htMannerPokeSeg(k, 0.2, 1), 4, hs * 0.4);
  }, function (n) {
    playNote(165, 0.2, 0.25, 'triangle', 0.35); playNote(147, 0.4, 0.5, 'triangle', 0.35);
    if (htMannerPokeBig(n)) { playNote(165, 1.0, 0.25, 'triangle', 0.35); playNote(131, 1.2, 0.5, 'triangle', 0.35); }
  }, 2.2));
  list.push(htMannerPokeBalloonSpot('farm-b0', w * 0.93, h * 0.2, h * 0.045, ['#ff7bac', '#ffd24f', '#5fa8d8'], th.sky));
  list.push(htMannerPokeBalloonSpot('farm-b1', w * 0.05, h * 0.3, h * 0.028, ['#8ad06a', '#ffffff', '#e0533f'], th.sky));
  list.push(htMannerPokeSunSpot('farm-sun', w * 0.2, h * 0.16, h * 0.04));
  return list;
});

// --- Pupula: ikkunaan syttyy valo ja pupu vilkuttaa, lyhty hehkuu, suihkulähde loiskii ---
function htMannerPokeTownKind(rnd) {
  return rnd < 0.42 ? 'house' : rnd < 0.56 ? 'lamp' : rnd < 0.7 ? 'topiary' : rnd < 0.8 ? 'fountain' : 'bush';
}
// Pupula-talo (koko kk): ikkunaan syttyy valo, pupu vilkuttaa; isossa pupu loikkaa ovesta
function htMannerPokeHouse(c, x, baseY, kk, k, n, wob) {
  var big = htMannerPokeBig(n), wx = x + kk * 0.06, wy = baseY - kk * 0.36, ww = kk * 0.16, wh = kk * 0.14, lit = htMannerPokeFade(k, 0.2) * Math.min(1, k * 6), up = htMannerPokeHold(k), q, t;
  c.save();
  htMannerPokeWob(c, x, baseY, k, wob);
  artGlow(c, wx + ww / 2, wy + wh / 2, kk * 0.3, '#ffe27a', 0.6 * lit);
  c.save();
  c.globalAlpha *= lit;
  artRoundRect(c, wx, wy, ww, wh, kk * 0.03, '#ffe9a0', { lineColor: '#a8805a', line: Math.max(1, kk * 0.015) });
  roundRect(c, wx, wy, ww, wh, kk * 0.03);
  c.clip();
  drawBunny(c, wx + ww / 2, wy + wh + kk * 0.06 - up * kk * 0.1, kk * 0.14, 0, k * 20, true);
  artCircle(c, wx + ww * 0.88, wy + wh * 0.55 - Math.abs(Math.sin(k * 18)) * wh * 0.25 * up, kk * 0.025, '#ffffff', { lineColor: '#8a7a9a', line: Math.max(1, kk * 0.008) });
  c.restore();
  if (big) {
    // Ovi aukeaa
    c.save();
    c.globalAlpha *= up;
    c.beginPath();
    c.moveTo(x - kk * 0.17, baseY); c.lineTo(x - kk * 0.17, baseY - kk * 0.2); c.arc(x - kk * 0.08, baseY - kk * 0.2, kk * 0.09, Math.PI, 0); c.lineTo(x + kk * 0.01, baseY); c.closePath();
    c.fillStyle = '#4a2a1a'; c.fill();
    c.restore();
  }
  c.restore();
  if (!big) return;
  q = htMannerPokeSeg(k, 0.15, 1);
  if (q < 0) return;
  t = Math.min(1, q / 0.75);
  c.save();
  c.globalAlpha *= htMannerPokeFade(q, 0.2);
  drawBunny(c, x - kk * 0.08 - t * kk * 0.35, baseY + kk * 0.03, kk * 0.12, t < 1 ? Math.abs(Math.sin(t * Math.PI * 3)) * kk * 0.15 : 0, k * 25, false);
  c.restore();
  htMannerPokeHearts(c, x - kk * 0.3, baseY - kk * 0.45, kk, htMannerPokeSeg(k, 0.4, 1), 3, kk * 0.4);
}
function htMannerPokeHouseSnd(n) {
  playNote(659, 0, 0.25, 'sine', 0.22); playNote(523, 0.25, 0.35, 'sine', 0.22);
  if (htMannerPokeBig(n)) { soundBunny(); htMannerPokeTune([784, 0, 988, 0, 1175], 0.1, 'triangle', 0.18, 0.5); }
}
var HT_MANNER_POKE_LAMP_COLS = ['#ff9cc8', '#9fd8ff', '#b8f08a', '#ffe27a', '#d8b0ff'];
var HT_MANNER_POKE_TOPI = [[-0.12, -0.3], [0.13, -0.36], [0.02, -0.2], [-0.07, -0.55], [0.1, -0.5], [-0.04, -0.72]];
var HT_MANNER_POKE_TOWN_FX = {
  house: function (c, x, baseY, s, rnd2, k, n, wob) {
    htMannerPokeHouse(c, x, baseY, s * (0.8 + rnd2 * 0.14), k, n, wob);
  },
  lamp: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), ly = baseY - s * 0.77, a = Math.min(1, k * 5) * htMannerPokeFade(k, 0.35), col = big ? HT_MANNER_POKE_LAMP_COLS[Math.floor(k * 10) % 5] : '#ffe27a', j, m = big ? 6 : 3, an, rr;
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    c.globalAlpha *= a;
    artGlow(c, x, ly, s * (0.4 + 0.08 * Math.sin(k * 14)), col, 0.75);
    artRoundRect(c, x - s * 0.07, baseY - s * 0.84, s * 0.14, s * 0.14, s * 0.03, artMix(col, '#ffffff', 0.4), { lineColor: '#2a2a3a' });
    c.restore();
    // Tulikärpäset kiertävät lyhtyä
    for (j = 0; j < m; j++) {
      an = k * Math.PI * 2 * (1 + j * 0.15) + j * Math.PI * 2 / m;
      rr = s * (0.22 + 0.06 * Math.sin(k * 7 + j));
      c.save();
      c.globalAlpha *= a;
      artGlow(c, x + Math.cos(an) * rr, ly + Math.sin(an) * rr * 0.6 - k * s * 0.1, s * 0.06, '#fff6a0', 0.9);
      artCircle(c, x + Math.cos(an) * rr, ly + Math.sin(an) * rr * 0.6 - k * s * 0.1, s * 0.015, '#fffbd0', { line: false });
      c.restore();
    }
  },
  topiary: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), j, q, g, side = rnd2 < 0.5 ? -1 : 1, up;
    c.save();
    htMannerPokeWob(c, x, baseY, k, wob);
    for (j = 0; j < (big ? 6 : 4); j++) {
      q = htMannerPokeSeg(k, j * 0.06, 1);
      if (q < 0) continue;
      g = htMannerPokeBack(Math.min(1, q * 3)) * htMannerPokeFade(k, 0.2);
      if (g > 0.05) drawFlower(c, x + HT_MANNER_POKE_TOPI[j][0] * s, baseY + HT_MANNER_POKE_TOPI[j][1] * s, s * 0.045 * g, ['#ff7bac', '#ffd24f', '#b678ff'][j % 3]);
    }
    c.restore();
    if (!big) return;
    // Oikea pupu kurkistaa ruukun takaa
    up = htMannerPokeHold(k);
    c.save();
    c.beginPath(); c.rect(x - s, baseY - s * 2, s * 2, s * 2 - s * 0.02); c.clip();
    drawBunny(c, x + side * s * 0.24, baseY + s * 0.04 - up * s * 0.18, s * 0.17, 0, k * 25, true);
    c.restore();
  },
  fountain: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), top = baseY - s * 0.4, hgt = s * (big ? 0.95 : 0.55), up = Math.sin(Math.min(1, k / 0.2) * Math.PI / 2) * htMannerPokeFade(k, 0.4), w;
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(127,200,240,0.9)'; c.lineWidth = Math.max(2, s * 0.06);
    c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - hgt * up); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - hgt * up); c.stroke();
    c.restore();
    for (w = 0; w < 3; w++) htMannerPokeDrops(c, x, top - hgt * up * 0.9, s, htMannerPokeSeg(k, w * 0.2, w * 0.2 + 0.5), 7, s * 0.2);
    htMannerPokeRings(c, x, baseY - s * 0.13, s * 0.8, htMannerPokeSeg(k, 0, 0.9));
    if (big) htMannerPokeRainbow(c, x, baseY - s * 0.3, s * 0.48, 0.85 * Math.min(1, Math.max(0, k - 0.2) * 4) * htMannerPokeFade(k, 0.25));
  },
  bush: htMannerPokeBirdFx,
  tree: htMannerPokeTreeFx
};
var HT_MANNER_POKE_TOWN_SND = {
  house: htMannerPokeHouseSnd,
  lamp: function (n) {
    if (htMannerPokeBig(n)) htMannerPokeTune([1047, 1319, 1568, 2093, 1568, 2093], 0.1, 'sine', 0.15);
    else { playNote(1319, 0, 0.15, 'sine', 0.18); playNote(1568, 0.1, 0.2, 'sine', 0.15); }
  },
  topiary: function (n) {
    htMannerPokeTune(htMannerPokeBig(n) ? [988, 1175, 1319, 1568, 1760, 2093] : [988, 1175, 1319, 1568], 0.07, 'sine', 0.16);
    if (htMannerPokeBig(n)) soundBunny();
  },
  fountain: function (n) {
    playNote(1200, 0, 0.05, 'sine', 0.15); playNote(800, 0.04, 0.06, 'sine', 0.15); playNote(1500, 0.14, 0.04, 'sine', 0.1); playNote(1100, 0.3, 0.04, 'sine', 0.1);
    if (htMannerPokeBig(n)) htMannerPokeTune([784, 988, 1175, 1568], 0.1, 'sine', 0.16, 0.5);
  },
  bush: htMannerPokeBirdSnd,
  tree: htMannerPokeTreeSnd
};
htMannerPokeSetup(HUB_THEMES.town, '#ffb0d8', htMannerPokeTownKind, HT_MANNER_POKE_TOWN_FX, HT_MANNER_POKE_TOWN_SND, function (w, h, lay) {
  var th = HUB_THEMES.town, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), s = lay.cell, i, x, y;
  var bkx = htMannerHeroX(w, lay, false), bky = hz + h * 0.1, hhx = htMannerHeroX(w, lay, true), hhy = hz + h * 0.1, hsz = hs * 0.66;
  htMannerPokeScatter(list, th, 'town-s', w, h, lay, 20, '#6cc45c', 0.9, 9);
  // Leipomo: piipusta sydänhöyryä, ikkunasta tuoksukiemuroita; isossa sämpylä pomppaa ovesta
  list.push(htMannerPokeSpot('town-bakery', bkx, bky - hs * 0.35, hs * 0.5, function (c, sp, k) {
    var w2 = hs * 0.36, top = bky - hs * 0.5, j, q, wx = bkx - w2 * 0.4, sx, t;
    htMannerPokeHearts(c, bkx + w2 * 0.4 + hs * 0.05, top - hs * 0.36, hs * 1.4, k, htMannerPokeBig(sp.n) ? 5 : 3, hs * 0.6);
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(1.5, hs * 0.015); c.lineCap = 'round';
    for (j = 0; j < 3; j++) {
      q = htMannerPokeSeg(k, j * 0.12, j * 0.12 + 0.7);
      if (q < 0) continue;
      c.globalAlpha = Math.sin(q * Math.PI);
      sx = wx + (j - 1) * w2 * 0.3;
      c.beginPath();
      for (t = 0; t <= 1; t += 0.1) c.lineTo(sx + Math.sin(t * 9 + q * 6) * hs * 0.025, top + hs * 0.22 - (q * 0.3 + t * 0.2) * hs);
      c.stroke();
    }
    c.restore();
    if (htMannerPokeBig(sp.n)) {
      q = htMannerPokeSeg(k, 0.2, 0.9);
      if (q >= 0) {
        c.save();
        c.globalAlpha *= htMannerPokeFade(q, 0.2);
        artBlob(c, bkx + w2 * 0.55 + q * hs * 0.3, bky - hs * 0.05 - Math.abs(Math.sin(q * Math.PI * 2)) * hs * 0.25 * (1 - q * 0.5), hs * 0.06, hs * 0.04, '#e0a050', { lineColor: '#8a4a1a', hi: 0.5 });
        c.restore();
      }
    }
  }, function (n) {
    htMannerPokeTune([523, 659, 784], 0.15, 'sine', 0.18);
    if (htMannerPokeBig(n)) { soundBunny(); htMannerPokeTune([1047, 1319, 1568], 0.1, 'triangle', 0.16, 0.5); }
  }));
  list.push(htMannerPokeSpot('town-home', hhx, hhy - hsz * 0.45, hsz * 0.55, function (c, sp, k) {
    htMannerPokeHouse(c, hhx, hhy, hsz, k, sp.n, 0);
  }, htMannerPokeHouseSnd));
  // Kaukaiset talot: ikkunoihin syttyy valo
  for (i = 0; i < 10; i++) {
    x = i % 2 ? sd.R + (w - sd.R) * (0.12 + (i >> 1) * 0.19) : sd.L * (0.12 + (i >> 1) * 0.19);
    y = hz - h * 0.02 + ((i >> 1) % 2) * h * 0.02;
    list.push(htMannerPokeHouseSpot('town-h' + i, x, y, s * 0.5));
  }
  list.push(htMannerPokeSunSpot('town-sun', w * 0.95, h * 0.2, h * 0.04));
  return list;
});
function htMannerPokeHouseSpot(id, x, y, kk) {
  return htMannerPokeSpot(id, x, y - kk * 0.45, kk * 0.55, function (c, sp, k) {
    htMannerPokeHouse(c, x, y, kk, k, sp.n, 0);
  }, htMannerPokeHouseSnd);
}
