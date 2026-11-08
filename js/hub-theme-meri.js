'use strict';

// Sokkeloteema (ks. hub-themes.js): Korallikylä (coral), Meren valtakunnan
// merenneitojen kylä meren pohjassa. Koko ruutu on veden alla: ylhäällä vaalea
// vesi, pinnan väreily ja valokeilat, alhaalla hiekkapohja. Laatta on hiekkaa,
// polku helmiäislaattoja. Seinäruuduissa korallit, levät, simpukat, meritähdet
// ja merenneitojen kupolitalot. Sivuilla sankarikoristeina Merikuningattaren
// palatsi ja kalliolla vilkuttava merenneito; kaukana pinnan lähellä lipuu
// kuplasukellusvene. Käyttää Kaukamaan teemojen yhteisiä paloja
// (hub-theme-manner.js: sivut, horisontti, oviaukko ja tökkäykset) sekä
// meripiirtoja (flow-deep.js: drawDeep*, play-reef.js: drawKelp, drawCoral).
//
// Tökkäykset (joka 3. isompi yllätys): koralli puhaltaa kuplia (iso: kala
// syöksähtää esiin), levästä pyrähtää kala (iso: parvi), simpukka aukeaa ja
// helmi välkkyy (iso: helmi nousee hehkuen), meritähti vilkuttaa (iso:
// pyörähtää ja pullistuu), kupolitalon ikkunat syttyvät ja pikku merenneito kurkistaa.

HUB_TILE_COLORS.coral = ['#f2dfae', '#e9d29c'];
var HT_MERI_CORALS = ['#ff8fa8', '#ffb46b', '#c98bff', '#ff7bc0'];
var HT_MERI_DOMES = ['#ffc8dc', '#bff0e8', '#e2d4ff', '#ffe0b8'];
var HT_MERI_STARS = ['#ff9a6b', '#ffd23e', '#ff7bac'];
var HT_MERI_FISH = ['#ffd23e', '#7fd4ff', '#ff9ecf', '#9ff0a8'];
var HT_MERI_HAIR = ['#ffb84f', '#ff9fc8', '#c89aff', '#7fd8ff'];

// ---------- Piirtopalat ----------
// Simpukka edestä: kuori ja kansi; open 0..1 nostaa kannen ja paljastaa helmen
function htMeriClam(c, x, baseY, r, col, open, glow) {
  var y0 = baseY - r * 0.32, lid = open * r * 0.55, i, a, line = artShade(col, -0.45);
  if (!open) artShadow(c, x, baseY, r * 1.1, r * 0.22, 0.16);
  if (open > 0) {
    artBlob(c, x, y0 - lid * 0.35, r * 0.97, r * 0.22 + lid * 0.4, '#ffd8ea', { lineColor: line, flat: true });
    drawDeepPearl(c, x, y0 - r * 0.08 - lid * 0.25, r * 0.22, glow || 0);
  }
  // Alakuori (kulho)
  c.beginPath(); c.ellipse(x, y0, r, r * 0.34, 0, 0, Math.PI); c.closePath();
  artFillPath(c, col, y0, y0 + r * 0.34, r, { lineColor: line });
  // Kansi: viuhka uurteineen
  c.save();
  c.translate(x, y0 - lid);
  c.scale(1, 1 - open * 0.35);
  c.beginPath(); c.ellipse(0, 0, r, r * 0.62, 0, Math.PI, Math.PI * 2); c.closePath();
  artFillPath(c, artShade(col, 0.12), -r * 0.62, 0, r, { lineColor: line });
  c.strokeStyle = artRGBA(line, 0.45);
  c.lineWidth = Math.max(1, r * 0.05);
  for (i = 1; i < 6; i++) {
    a = Math.PI + i * Math.PI / 6;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.56); c.stroke();
  }
  c.restore();
}
// Meritähti kivellä (face: kasvot tökkäyksessä)
function htMeriStarRock(b, x, baseY, s, rnd2) {
  artShadow(b, x, baseY, s * 0.32, s * 0.07, 0.15);
  artBlob(b, x, baseY - s * 0.1, s * 0.3, s * 0.13, '#a8b8d0', { lineColor: '#5e6e8a', hi: 0.25 });
  drawDeepStarfish(b, x - s * 0.03, baseY - s * 0.26, s * 0.15, HT_MERI_STARS[Math.floor(rnd2 * 3)], 0.2);
}
// Merenneidon kupolitalo: pyöreä kupoli, simpukkatorni ja helmi huipulla
function htMeriDome(b, x, baseY, r, col, lit) {
  var line = artShade(col, -0.45), wy = baseY - r * 0.6;
  artShadow(b, x, baseY, r * 1.15, r * 0.2, 0.16);
  // Kierresimpukkatorni
  b.beginPath();
  b.moveTo(x - r * 0.16, baseY - r * 0.92); b.lineTo(x, baseY - r * 1.42); b.lineTo(x + r * 0.16, baseY - r * 0.92); b.closePath();
  artFillPath(b, '#fff0d8', baseY - r * 1.42, baseY - r * 0.92, r * 0.2, { lineColor: '#b89a6a' });
  b.strokeStyle = 'rgba(184,154,106,0.7)';
  b.lineWidth = Math.max(1, r * 0.04);
  b.beginPath(); b.moveTo(x - r * 0.1, baseY - r * 1.05); b.lineTo(x + r * 0.08, baseY - r * 1.15); b.moveTo(x - r * 0.06, baseY - r * 1.22); b.lineTo(x + r * 0.05, baseY - r * 1.29); b.stroke();
  // Kupoli
  b.beginPath(); b.ellipse(x, baseY, r, r, 0, Math.PI, Math.PI * 2); b.closePath();
  artFillPath(b, col, baseY - r, baseY, r, { lineColor: line });
  artHighlight(b, x - r * 0.45, baseY - r * 0.65, r * 0.22, r * 0.12, 0.45);
  // Kupolin kaistaleet
  b.strokeStyle = artRGBA(line, 0.3);
  b.lineWidth = Math.max(1, r * 0.04);
  b.beginPath(); b.ellipse(x, baseY, r * 0.5, r, 0, Math.PI * 1.15, Math.PI * 1.85); b.stroke();
  // Pyöreä ikkuna ja ovikaari
  if (lit) artGlow(b, x + r * 0.42, wy, r * 0.5, '#fff2a8', 0.7 * lit);
  artCircle(b, x + r * 0.42, wy, r * 0.17, lit ? '#fff2a8' : '#bfefff', { lineColor: line, hi: 0.5 });
  b.beginPath();
  b.moveTo(x - r * 0.42, baseY); b.lineTo(x - r * 0.42, baseY - r * 0.4);
  b.arc(x - r * 0.24, baseY - r * 0.4, r * 0.18, Math.PI, 0);
  b.lineTo(x - r * 0.06, baseY); b.closePath();
  artFillPath(b, lit ? '#ffe08a' : '#3a7a9a', baseY - r * 0.6, baseY, r * 0.2, { lineColor: line });
  drawDeepPearl(b, x, baseY - r * 1.48, r * 0.09, 0);
}
// Seinäruudun ja sivumaiseman koristeet
function htMeriPropKind(rnd) {
  return rnd < 0.26 ? 'coral' : rnd < 0.46 ? 'kelp' : rnd < 0.62 ? 'clam' : rnd < 0.76 ? 'star' : 'dome';
}
function htMeriProp(b, x, baseY, s, rnd, rnd2) {
  var kind = htMeriPropKind(rnd);
  if (kind === 'coral') {
    drawCoral(b, x, baseY, s * (0.32 + rnd2 * 0.1), HT_MERI_CORALS[Math.floor(rnd2 * 4)], 0);
    if (rnd2 > 0.55) drawCoral(b, x + s * 0.32, baseY + s * 0.02, s * 0.18, HT_MERI_CORALS[Math.floor(rnd2 * 7) % 4], 0);
  } else if (kind === 'kelp') {
    artShadow(b, x, baseY, s * 0.25, s * 0.06, 0.14);
    drawKelp(b, x, baseY, s * (0.85 + rnd2 * 0.3), 0, (rnd2 - 0.5) * 0.6);
  } else if (kind === 'clam') htMeriClam(b, x, baseY, s * 0.3, rnd2 < 0.5 ? '#f0a8d0' : '#c8b0f0', 0);
  else if (kind === 'star') htMeriStarRock(b, x, baseY, s, rnd2);
  else htMeriDome(b, x, baseY, s * 0.38, HT_MERI_DOMES[Math.floor(rnd2 * 4)], 0);
}
// Sankari: Merikuningattaren palatsi (helmiäisseinät, simpukkatornit, helmet)
function htMeriPalace(b, x, baseY, sz, glow) {
  var wall = '#ffd6e8', line = '#b0608a', roof = '#7fd8e0', i, tx, th;
  if (glow) artGlow(b, x, baseY - sz * 0.45, sz * 0.75, '#fff6ff', 0.5 * glow);
  artShadow(b, x, baseY, sz * 0.6, sz * 0.1, 0.18);
  for (i = -1; i <= 1; i++) {
    tx = x + i * sz * 0.32;
    th = i ? sz * 0.62 : sz * 0.85;
    artRoundRect(b, tx - sz * 0.09, baseY - th, sz * 0.18, th, sz * 0.04, i ? artShade(wall, -0.05) : wall, { lineColor: line });
    b.beginPath();
    b.moveTo(tx - sz * 0.13, baseY - th + sz * 0.02); b.lineTo(tx, baseY - th - sz * 0.24); b.lineTo(tx + sz * 0.13, baseY - th + sz * 0.02); b.closePath();
    artFillPath(b, roof, baseY - th - sz * 0.24, baseY - th, sz * 0.12, { lineColor: '#3a8a9a' });
    b.strokeStyle = 'rgba(58,138,154,0.6)';
    b.lineWidth = Math.max(1, sz * 0.012);
    b.beginPath();
    b.moveTo(tx - sz * 0.08, baseY - th - sz * 0.04); b.lineTo(tx + sz * 0.07, baseY - th - sz * 0.09);
    b.moveTo(tx - sz * 0.045, baseY - th - sz * 0.13); b.lineTo(tx + sz * 0.04, baseY - th - sz * 0.16);
    b.stroke();
    drawDeepPearl(b, tx, baseY - th - sz * 0.27, sz * 0.035, glow || 0);
    artCircle(b, tx, baseY - th + sz * 0.16, sz * 0.045, glow ? '#fff2a8' : '#bfefff', { lineColor: line });
  }
  // Keskirakennus ja kaariovi
  artRoundRect(b, x - sz * 0.3, baseY - sz * 0.42, sz * 0.6, sz * 0.42, sz * 0.06, wall, { lineColor: line });
  b.fillStyle = 'rgba(255,255,255,0.45)';
  for (i = 0; i < 7; i++) { b.beginPath(); b.arc(x - sz * 0.27 + i * sz * 0.09, baseY - sz * 0.42, sz * 0.03, 0, Math.PI * 2); b.fill(); }
  b.beginPath();
  b.moveTo(x - sz * 0.09, baseY); b.lineTo(x - sz * 0.09, baseY - sz * 0.17);
  b.arc(x, baseY - sz * 0.17, sz * 0.09, Math.PI, 0);
  b.lineTo(x + sz * 0.09, baseY); b.closePath();
  artFillPath(b, glow ? '#ffe08a' : '#4a8aaa', baseY - sz * 0.26, baseY, sz * 0.1, { lineColor: line });
  drawCoral(b, x - sz * 0.5, baseY + sz * 0.02, sz * 0.16, '#ff8fa8', 0);
  drawCoral(b, x + sz * 0.52, baseY + sz * 0.02, sz * 0.13, '#ffb46b', 0);
}
// Sankari: merenneito vilkuttaa kalliolta polulle päin
function htMeriMermaidRock(b, x, baseY, sz, o) {
  artShadow(b, x, baseY, sz * 0.5, sz * 0.09, 0.18);
  artBlob(b, x + sz * 0.05, baseY - sz * 0.13, sz * 0.46, sz * 0.18, '#93a8c4', { lineColor: '#56688a', hi: 0.25 });
  drawCoral(b, x + sz * 0.38, baseY, sz * 0.12, '#c98bff', 0);
  drawDeepMermaid(b, x, baseY - sz * 0.5, sz * 0.26, o || { t: 0, hair: '#ffb84f', tail: '#b88aff', wave: true, facing: -1 });
}
// Pinnan väreily ylhäällä
function htMeriSurface(b, w, h) {
  var i, x, k, y;
  b.fillStyle = 'rgba(255,255,255,0.28)';
  b.beginPath(); b.moveTo(0, 0);
  for (x = 0; x <= w; x += w / 40) b.lineTo(x, h * 0.03 + Math.sin(x / w * 23) * h * 0.008);
  b.lineTo(w, 0); b.closePath(); b.fill();
  b.lineCap = 'round';
  for (k = 0; k < 3; k++) {
    b.strokeStyle = 'rgba(255,255,255,' + (0.5 - k * 0.13) + ')';
    b.lineWidth = Math.max(1.5, h * (0.005 - k * 0.001));
    y = h * (0.05 + k * 0.035);
    for (i = 0; i < 9 - k * 2; i++) {
      x = w * (((i * 0.29 + k * 0.17) % 1));
      b.beginPath();
      b.moveTo(x, y);
      b.quadraticCurveTo(x + w * 0.02, y - h * 0.008, x + w * 0.04, y);
      b.quadraticCurveTo(x + w * 0.06, y + h * 0.008, x + w * 0.08, y);
      b.stroke();
    }
  }
}
function htMeriSubPos(w, h, lay) {
  var hz = htMannerHz(lay, h);
  return { x: htMannerHeroX(w, lay, true) - lay.cell * 0.2, y: Math.max(h * 0.14, hz * 0.5), r: Math.max(h * 0.022, lay.cell * 0.22) };
}

HUB_THEMES.coral = {
  sky: ['#b4f0f8', '#3a98c8'],
  ground: ['#f2dfae', '#e9d29c'],
  earth: '#c49a78',
  path: ['#b89ac8', '#fbeefa'],
  arch: '#fff4fa',
  density: 0.62,
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x, y, sp, g;
    htMeriSurface(b, w, h);
    drawDeepRays(b, w, h, 0, 1.3);
    // Leijuvat hiukkaset ja kaukainen kalaparvi
    b.fillStyle = 'rgba(255,255,255,0.45)';
    for (i = 0; i < 30; i++) {
      b.beginPath(); b.arc(hubHash(i, 61) * w, h * 0.06 + hubHash(61, i) * hz, h * (0.002 + hubHash(i, 7) * 0.002), 0, Math.PI * 2); b.fill();
    }
    for (i = 0; i < 6; i++) drawDeepFish(b, w * 0.08 + (i % 3) * h * 0.035, h * 0.2 + Math.floor(i / 3) * h * 0.03 + (i % 2) * h * 0.012, h * 0.008, '#5ab0d8', 1, i);
    // Kaukainen riutta horisontissa
    for (i = 0; i < 2; i++) {
      b.fillStyle = i ? '#5aaed0' : '#74c0dc';
      b.beginPath(); b.moveTo(0, h);
      for (x = 0; x <= w; x += w / 36) b.lineTo(x, hz - h * (0.03 - i * 0.03) - Math.abs(Math.sin(x / w * (7 + i * 4) + i)) * h * 0.035);
      b.lineTo(w, h); b.closePath(); b.fill();
    }
    for (i = 0; i < 14; i++) {
      x = ((i + 0.5) / 14) * w;
      if (i % 2) drawKelp(b, x, hz + h * 0.02, h * (0.07 + (i % 3) * 0.02), 0.6, 0);
      else drawCoral(b, x, hz + h * 0.025, h * 0.025, HT_MERI_CORALS[i % 4], 0.55);
    }
    // Hiekkapohja aaltoilevalla reunalla
    y = hz + h * 0.04;
    g = b.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, '#f4e4b8');
    g.addColorStop(1, '#e2c48e');
    b.fillStyle = g;
    b.beginPath(); b.moveTo(0, h);
    for (x = 0; x <= w; x += w / 36) b.lineTo(x, y + Math.sin(x / w * 9) * h * 0.008);
    b.lineTo(w, h); b.closePath(); b.fill();
    b.strokeStyle = 'rgba(190,150,90,0.35)';
    b.lineWidth = Math.max(1, h * 0.003);
    for (i = 0; i < 40; i++) {
      x = hubHash(i, 43) * w; y = hz + h * 0.07 + hubHash(43, i) * (h - hz);
      if (x > sd.L - lay.cell * 0.2 && x < sd.R + lay.cell * 0.2) continue;
      b.beginPath(); b.arc(x, y, lay.cell * 0.12, Math.PI * 1.2, Math.PI * 1.8); b.stroke();
    }
    // Kuplasukellusvene kaukana pinnan lähellä
    sp = htMeriSubPos(w, h, lay);
    drawDeepBubble(b, sp.x - sp.r * 1.9, sp.y + sp.r * 0.2, sp.r * 0.18, 0.8);
    drawDeepBubble(b, sp.x - sp.r * 2.3, sp.y - sp.r * 0.3, sp.r * 0.12, 0.7);
    drawDeepSub(b, sp.x, sp.y, sp.r, 1, false);
    htMeriPalace(b, htMannerHeroX(w, lay, false), hz + h * 0.14, hs * 1.05, 0);
    htMeriMermaidRock(b, htMannerHeroX(w, lay, true), hz + h * 0.16, hs * 0.95);
    // Hiekan pikkusimpukat ja kivet
    for (i = 0; i < 26; i++) {
      x = hubHash(i, 47) * w; y = hz + h * 0.09 + hubHash(47, i) * (h - hz);
      if (x > sd.L - lay.cell * 0.2 && x < sd.R + lay.cell * 0.2) continue;
      if (i % 3) artBlob(b, x, y, lay.cell * 0.05, lay.cell * 0.03, '#d8c8b8', { line: false });
      else htMeriFloorShell(b, x, y, lay.cell * 0.06, i % 2 ? '#ffb8d0' : '#fff0e0');
    }
    htMeriScatter(b, w, h, lay, 12);
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.35) {
      b.strokeStyle = 'rgba(190,150,90,0.35)';
      b.lineWidth = Math.max(1, s * 0.025);
      b.beginPath(); b.arc(px, py, s * 0.12, Math.PI * 1.2, Math.PI * 1.8); b.stroke();
    } else if (rnd < 0.45) htMeriFloorShell(b, px, py, s * 0.06, rnd2 < 0.5 ? '#ffb8d0' : '#fff0e0');
    else if (rnd < 0.55) artBlob(b, px, py, s * 0.05, s * 0.03, '#d0c0b0', { line: false });
    else if (rnd < 0.58) drawDeepStarfish(b, px, py, s * 0.07, HT_MERI_STARS[Math.floor(rnd2 * 3)], rnd2);
  },
  wall: htMeriProp,
  landmark: function (c, x, y, s, room, st) {
    // Simpukkaportti: iso viuhkasimpukka kaarena, huipulla helmi
    var col = room.color || '#ff9fc8', base = y + s * 0.34, fy = y - s * 0.1, i, a, r = s * 0.58;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.18);
    c.beginPath(); c.moveTo(x - r, fy + s * 0.1); c.arc(x, fy + s * 0.1, r, Math.PI, 0); c.closePath();
    artFillPath(c, '#ffd0e4', fy - r, fy + s * 0.1, r, { lineColor: '#b0608a' });
    c.strokeStyle = 'rgba(176,96,138,0.45)';
    c.lineWidth = Math.max(1, s * 0.025);
    for (i = 1; i < 8; i++) {
      a = Math.PI + i * Math.PI / 8;
      c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.45, fy + s * 0.1 + Math.sin(a) * r * 0.45); c.lineTo(x + Math.cos(a) * r * 0.96, fy + s * 0.1 + Math.sin(a) * r * 0.96); c.stroke();
    }
    htMannerOpening(c, x, y, s, room, st, col, 0.3);
    drawDeepPearl(c, x, fy - r + s * 0.06, s * 0.07, st.cleared || st.next ? 1 : 0);
  }
};
function htMeriFloorShell(b, x, y, r, col) {
  b.beginPath(); b.moveTo(x, y + r * 0.4); b.arc(x, y + r * 0.4, r, Math.PI * 1.1, Math.PI * 1.9); b.closePath();
  artFillPath(b, col, y - r * 0.6, y + r * 0.4, r, { lineColor: artShade(col, -0.4), line: Math.max(1, r * 0.15) });
}
// Sivumaiseman koristeet takaa eteen (samat paikat kuin tökkäyskohteet)
function htMeriScatter(b, w, h, lay, n) {
  var s = lay.cell, sd = htMannerSides(lay), hz = htMannerHz(lay, h) + h * 0.05, i, t, x, y, x0, x1, k;
  for (i = 0; i < n; i++) {
    t = i / Math.max(1, n - 1);
    x0 = i % 2 ? sd.R + s * 0.35 : s * 0.35;
    x1 = i % 2 ? w - s * 0.35 : sd.L - s * 0.35;
    if (x1 <= x0) continue;
    x = x0 + hubHash(i, 17) * (x1 - x0);
    y = hz + t * (h * 0.99 - hz);
    k = s * (0.75 + t * 0.6);
    htMeriProp(b, x, y, k, hubHash(17, i), hubHash(i, 11));
  }
}

// ---------- Tökkäysyllätykset ----------
// Kuplia nousee heiluen
function htMeriPokeBubbles(c, x, y, s, k, n, rise) {
  var i, q;
  for (i = 0; i < n; i++) {
    q = htMannerPokeSeg(k, i * 0.08, i * 0.08 + 0.7);
    if (q < 0) continue;
    drawDeepBubble(c, x + Math.sin(q * 7 + i * 2) * s * 0.06 + (i % 3 - 1) * s * 0.08, y - q * rise, s * (0.03 + (i % 3) * 0.012) * (0.6 + q * 0.6), 1 - q * q);
  }
}
// Kala pyrähtää kohdasta (x, y) kaarena sivulle
function htMeriPokeDart(c, x, y, s, q, dir, col, r) {
  if (q < 0) return;
  var e = htMannerPokeEase(q), fx = x + dir * e * s * 0.9, fy = y - Math.sin(e * Math.PI) * s * 0.35 - e * s * 0.15;
  c.save();
  c.globalAlpha *= htMannerPokeFade(q, 0.25);
  drawDeepFish(c, fx, fy, r, col, dir, q * 30);
  c.restore();
}
var HT_MERI_POKE_FX = {
  coral: function (c, x, baseY, s, rnd2, k, n) {
    var cs = s * (0.32 + rnd2 * 0.1), i;
    for (i = -1; i <= 1; i++) htMeriPokeBubbles(c, x + i * cs * 0.6, baseY - cs * (1 - Math.abs(i) * 0.25), s, k - (i + 1) * 0.06, 3, s * 0.8);
    if (htMannerPokeBig(n)) htMeriPokeDart(c, x, baseY - cs * 0.5, s, htMannerPokeSeg(k, 0.05, 0.8), rnd2 < 0.5 ? 1 : -1, '#ffd23e', s * 0.08);
  },
  kelp: function (c, x, baseY, s, rnd2, k, n) {
    var j, dir = rnd2 < 0.5 ? 1 : -1, m = htMannerPokeBig(n) ? 3 : 1;
    for (j = 0; j < m; j++) htMeriPokeDart(c, x, baseY - s * (0.45 + j * 0.15), s, htMannerPokeSeg(k, j * 0.1, j * 0.1 + 0.7), dir, HT_MERI_FISH[(j + n) % 4], s * (0.08 - j * 0.012));
    htMeriPokeBubbles(c, x, baseY - s * 0.5, s, k, 3, s * 0.6);
  },
  clam: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), op = htMannerPokeHold(k), r = s * 0.3, q, py, g;
    htMeriClam(c, x, baseY, r, rnd2 < 0.5 ? '#f0a8d0' : '#c8b0f0', op, op);
    // Helmi välkkyy (iso: nousee hehkuen ja palaa)
    q = htMannerPokeSeg(k, 0.2, 0.75);
    if (q >= 0) {
      g = Math.sin(q * Math.PI);
      if (big) {
        py = baseY - r * 0.4 - g * s * 0.55;
        artGlow(c, x, py, r * 0.9, '#fff6ff', 0.7 * g);
        drawDeepPearl(c, x, py, r * 0.24, 1);
        htMannerPokeHearts(c, x, py - r * 0.3, s, q, 3, s * 0.4);
      } else htMannerPokeStar(c, x + r * 0.25, baseY - r * 0.7, r * 0.15 * g, '#fffbe0');
    }
  },
  star: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), col = HT_MERI_STARS[Math.floor(rnd2 * 3)], q = big ? htMannerPokeSeg(k, 0, 0.6) : -1, sx = x - s * 0.03, sy = baseY - s * 0.26, hop = 0, rot = 0, r = s * 0.15, wv;
    // Iso: pyörähtää paikallaan ja pullistuu (peittää kiven tähden)
    if (q >= 0) { hop = Math.sin(q * Math.PI) * 0.25; rot = htMannerPokeEase(q) * Math.PI * 2; }
    c.save();
    c.translate(sx, sy);
    c.rotate(rot);
    c.scale(1.08 + hop, 1.08 + hop);
    // Vilkuttava käsi: oikea yläsakara heilahtaa
    wv = Math.sin(k * 22) * 0.35 * htMannerPokeFade(k, 0.3);
    drawDeepStarfish(c, 0, 0, r, col, 0.2 + wv * 0.15);
    artEye(c, -r * 0.18, -r * 0.08, r * 0.12, 0, k > 0.45 && k < 0.5);
    artEye(c, r * 0.14, -r * 0.08, r * 0.12, 0, k > 0.45 && k < 0.5);
    c.strokeStyle = '#7a3a2a';
    c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath(); c.arc(-r * 0.02, r * 0.05, r * 0.12, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    c.restore();
    if (big) htMannerPokeHearts(c, sx, sy - s * 0.2, s, htMannerPokeSeg(k, 0.35, 1), 3, s * 0.4);
  },
  dome: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), r = s * 0.38, up = htMannerPokeHold(k), dx = x - r * 0.24, dy = baseY - r * 0.3;
    var lit = Math.sin(Math.min(1, k * 4) * Math.PI / 2) * htMannerPokeFade(k, 0.25);
    htMeriDome(c, x, baseY, r, HT_MERI_DOMES[Math.floor(rnd2 * 4)], lit);
    // Pikku merenneito kurkistaa ovesta ja vilkuttaa
    c.save();
    c.beginPath(); c.rect(dx - r * 0.5, baseY - r * 1.6, r, r * 1.6); c.clip();
    drawDeepMermaid(c, dx, dy + r * 0.6 - up * r * (big ? 0.75 : 0.5), r * 0.32, { t: globalT, hair: HT_MERI_HAIR[Math.floor(rnd2 * 4)], tail: '#4fc8c0', wave: up > 0.5, mood: big ? 'wow' : 'happy' });
    c.restore();
    htMeriPokeBubbles(c, x, baseY - r * 1.5, s, k, big ? 5 : 2, s * 0.6);
    if (big) htMannerPokeHearts(c, x, baseY - r * 1.2, s, htMannerPokeSeg(k, 0.3, 1), 3, s * 0.45);
  }
};
function htMeriPokeBubbleSnd(m, d0) {
  for (var i = 0; i < m; i++) playNote(600 + i * 220 + Math.random() * 80, (d0 || 0) + i * 0.07, 0.07, 'sine', 0.12);
}
var HT_MERI_POKE_SND = {
  coral: function (n) {
    htMeriPokeBubbleSnd(4);
    if (htMannerPokeBig(n)) htMannerPokeTune([784, 988, 1319], 0.07, 'triangle', 0.15, 0.25);
  },
  kelp: function (n) {
    htMannerPokeTune([1175, 1568], 0.06, 'sine', 0.14);
    if (htMannerPokeBig(n)) htMannerPokeTune([1319, 1568, 1760, 2093], 0.06, 'sine', 0.12, 0.2);
  },
  clam: function (n) {
    playNote(330, 0, 0.12, 'triangle', 0.2);
    htMannerPokeTune(htMannerPokeBig(n) ? [1047, 1319, 1568, 2093, 2637] : [1568, 2093], 0.08, 'sine', 0.14, 0.18);
  },
  star: function (n) {
    htMannerPokeTune([659, 784, 659], 0.08, 'triangle', 0.16);
    if (htMannerPokeBig(n)) htMannerPokeTune([523, 784, 1047, 1568], 0.07, 'sine', 0.13, 0.3);
  },
  dome: function (n) {
    htMannerPokeTune([880, 1109, 1319], 0.08, 'sine', 0.14);
    if (htMannerPokeBig(n)) { htMannerPokeTune([1319, 1109, 1319, 1760], 0.08, 'triangle', 0.13, 0.3); htMeriPokeBubbleSnd(3, 0.6); }
  }
};
htMannerPokeSetup(HUB_THEMES.coral, '#d8f6ff', htMeriPropKind, HT_MERI_POKE_FX, HT_MERI_POKE_SND, function (w, h, lay) {
  var th = HUB_THEMES.coral, list = [], hz = htMannerHz(lay, h), hs = htMannerHeroSize(w, h, lay), sp = htMeriSubPos(w, h, lay), i;
  var px = htMannerHeroX(w, lay, false), py = hz + h * 0.14, psz = hs * 1.05, mx = htMannerHeroX(w, lay, true), my = hz + h * 0.16, msz = hs * 0.95;
  // Palatsi: ikkunat ja ovi syttyvät, helmet hehkuvat (iso: kuplia torneista ja sydämiä)
  list.push(htMannerPokeSpot('coral-palace', px, py - psz * 0.45, psz * 0.55, function (c, s, k) {
    var g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3), j;
    c.globalAlpha = g;
    htMeriPalace(c, px, py, psz, 1);
    c.globalAlpha = 1;
    if (htMannerPokeBig(s.n)) for (j = -1; j <= 1; j++) htMeriPokeBubbles(c, px + j * psz * 0.32, py - psz * (j ? 0.9 : 1.12), psz, htMannerPokeSeg(k, 0.1 + (j + 1) * 0.05, 1), 4, psz * 0.5);
    htMannerPokeHearts(c, px, py - psz * 0.6, psz, htMannerPokeSeg(k, 0.2, 1), htMannerPokeBig(s.n) ? 4 : 2, psz * 0.4);
  }, function (n) { htMannerPokeTune([523, 659, 784, 1047, 1319, 1568], 0.08, 'triangle', 0.16); }, 2.4));
  // Merenneito: vilkuttaa iloisesti (iso: nostaa helmen, joka hehkuu)
  list.push(htMannerPokeSpot('coral-mermaid', mx, my - msz * 0.55, msz * 0.4, function (c, s, k) {
    var big = htMannerPokeBig(s.n), q = htMannerPokeHold(k), hy = my - msz * 0.5 - msz * 0.26 * 0.9;
    drawDeepMermaid(c, mx, my - msz * 0.5, msz * 0.26, { t: globalT, hair: '#ffb84f', tail: '#b88aff', wave: true, facing: -1, mood: big ? 'wow' : 'happy' });
    if (big) {
      artGlow(c, mx + msz * 0.1, hy - q * msz * 0.25, msz * 0.2, '#fff6ff', 0.8 * q);
      drawDeepPearl(c, mx + msz * 0.1, hy - q * msz * 0.25, msz * 0.05 * q, 1);
    }
    htMeriPokeBubbles(c, mx, my - msz * 0.7, msz, k, 3, msz * 0.5);
    htMannerPokeHearts(c, mx, my - msz * 0.85, msz, htMannerPokeSeg(k, 0.2, 1), big ? 4 : 2, msz * 0.4);
  }, function (n) { htMannerPokeTune(htMannerPokeBig(n) ? [784, 988, 1175, 1568, 1976] : [988, 1175, 1319], 0.09, 'sine', 0.15); }, 2.2));
  // Kuplasukellusvene: lamppu välähtää, kuplia potkurista (iso: ympyräkuplat ja sydämet)
  list.push(htMannerPokeSpot('coral-sub', sp.x, sp.y, sp.r * 1.6, function (c, s, k) {
    var g = Math.sin(Math.min(1, k * 4) * Math.PI);
    artGlow(c, sp.x + sp.r * 1.4, sp.y + sp.r * 0.45, sp.r * 1.4, '#fff6c8', 0.7 * Math.max(0, g));
    drawDeepSub(c, sp.x + htMannerPokeHold(k) * sp.r * 0.4, sp.y, sp.r, 1, true);
    htMeriPokeBubbles(c, sp.x - sp.r * 1.6, sp.y + sp.r * 0.5, sp.r * 4, k, 5, sp.r * 3);
    if (htMannerPokeBig(s.n)) htMannerPokeHearts(c, sp.x, sp.y - sp.r, sp.r * 4, htMannerPokeSeg(k, 0.2, 1), 3, sp.r * 2);
  }, function (n) { htMeriPokeBubbleSnd(5); if (htMannerPokeBig(n)) htMannerPokeTune([659, 880, 1109, 1319], 0.09, 'triangle', 0.14, 0.3); }, 2.2));
  // Sivumaiseman koristeet sankarien jälkeen: palatsi ja merenneito voittavat päällekkäisyydessä
  htMannerPokeScatter(list, th, 'coral-s', w, h, lay, 12, null, 1, 11);
  // Pinnan väreily: valorengas ja kimalle (iso: kala pyrähtää pinnan alta)
  for (i = 0; i < 4; i++) list.push(htMeriSurfaceSpot('coral-sf' + i, w * (0.12 + i * 0.25), h * 0.06, h * 0.05));
  return list;
});
function htMeriSurfaceSpot(id, x, y, r) {
  return htMannerPokeSpot(id, x, y, r * 1.4, function (c, sp, k) {
    var j, p;
    c.save();
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1.5, r * 0.06);
    for (j = 0; j < 3; j++) {
      p = k * 1.6 - j * 0.3;
      if (p <= 0 || p >= 1) continue;
      c.globalAlpha = 0.85 * (1 - p);
      c.beginPath(); c.ellipse(x, y, r * (0.3 + p * 1.4), r * (0.08 + p * 0.3), 0, 0, Math.PI * 2); c.stroke();
    }
    c.restore();
    htMannerPokeStar(c, x + r * 0.5, y + r * 0.3, r * 0.15 * Math.sin(Math.min(1, k * 2) * Math.PI), '#fffbe0');
    if (htMannerPokeBig(sp.n)) htMeriPokeDart(c, x - r, y + r * 1.2, r * 2.4, htMannerPokeSeg(k, 0.1, 0.8), 1, HT_MERI_FISH[sp.n % 4], r * 0.22);
  }, function (n) { htMannerPokeTune([1568, 1319, 1760], 0.07, 'sine', 0.12); }, 1.8);
}
