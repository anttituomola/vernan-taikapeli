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

// ---------- Tökkäysyllätykset: yhteiset palat ----------
// Koristeiden pokeDraw ja maiseman spotDraw käyttävät näitä (myös metsä,
// hub-themes.js). Kaikki piirretään kohdan (x, baseY, S) suhteen ja häivytetään
// loppuun mennessä (k = 1). Joka 3. tökkäys (n % 3 === 0) on isompi yllätys.
var HT_LINNA_POKE_DUR = 2.2;
// Häivytys: täysi näkyvyys kohtaan a0 asti, sitten nollaan k = 1:ssä
function htLinnaPokeFade(k, a0) {
  a0 = a0 || 0.72;
  return k < a0 ? 1 : Math.max(0, (1 - k) / (1 - a0));
}
function htLinnaPokeEase(u) {
  u = Math.max(0, Math.min(1, u));
  return u * u * (3 - 2 * u);
}
// Pysyvä näennäissatunnainen 0..1 (sama joka ruudulla)
function htLinnaPokeHash(i, seed) {
  var v = Math.sin(i * 12.9898 + seed * 78.233 + 1.7) * 43758.5453;
  return v - Math.floor(v);
}
// Esiin pomppaaminen: 0 -> 1 alussa, 1 -> 0 lopussa (a = esiintulo, b = piiloutuminen)
function htLinnaPokePop(k, a, b) {
  return htLinnaPokeEase(k / a) - htLinnaPokeEase((k - b) / (1 - b));
}
// Putoava esine: kiihtyvä pudotus ja pieni pomppu maassa (u = 0..1)
function htLinnaPokeDropY(u, y0, y1) {
  if (u <= 0) return y0;
  if (u < 0.35) return y0 + (y1 - y0) * (u / 0.35) * (u / 0.35);
  if (u < 0.6) return y1 - Math.sin((u - 0.35) / 0.25 * Math.PI) * (y1 - y0) * 0.22;
  return y1;
}
// Moottorin heilahdus samana muunnoksena, jotta kasvot ym. pysyvät koristeen päällä
function htLinnaPokeWobble(c, x, baseY, k, dur) {
  var kw = Math.min(1, k * dur / HUB_POKE_T), sq = Math.sin(kw * Math.PI * 3) * 0.14 * (1 - kw);
  c.translate(x, baseY);
  c.rotate(Math.sin(kw * Math.PI * 4) * 0.08 * (1 - kw));
  c.scale(1 - sq, 1 + sq);
  c.translate(-x, -baseY);
}
// Kasvot (kivi, aurinko, auringonkukka, pilvi): r = kasvojen säde.
// wink: oikea silmä iskee kesken; happy: silmät iloisina kaarina
function htLinnaPokeFace(c, x, y, r, k, wink, happy) {
  var open = k > 0.06, w = wink && k > 0.3 && k < 0.6;
  c.strokeStyle = '#4a3040';
  c.lineWidth = Math.max(1.2, r * 0.09);
  c.lineCap = 'round';
  if (happy) {
    c.beginPath(); c.arc(x - r * 0.38, y - r * 0.08, r * 0.15, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(x + r * 0.38, y - r * 0.08, r * 0.15, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    artEye(c, x - r * 0.38, y - r * 0.15, r * 0.2, 0, !open);
    artEye(c, x + r * 0.38, y - r * 0.15, r * 0.2, 0, !open || w);
  }
  c.strokeStyle = '#4a3040';
  c.lineWidth = Math.max(1.2, r * 0.09);
  c.beginPath(); c.arc(x, y + r * 0.08, r * 0.3, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
  artBlush(c, x - r * 0.62, y + r * 0.15, r * 0.16);
  artBlush(c, x + r * 0.62, y + r * 0.15, r * 0.16);
}
// Pikkulintu: r = vartalon säde, flap -1..1 siiven asento, dir 1 = katsoo oikealle
function htLinnaPokeBird(c, x, y, r, flap, dir, body, belly) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artBlob(c, -r * 0.95, -r * 0.05, r * 0.5, r * 0.2, artShade(body, -0.1), { rot: -0.35 });
  artCircle(c, 0, 0, r, body, {});
  artBlob(c, r * 0.2, r * 0.3, r * 0.6, r * 0.45, belly, { line: false });
  artCircle(c, r * 0.7, -r * 0.6, r * 0.55, body, { hi: 0.35 });
  c.beginPath(); c.moveTo(r * 1.15, -r * 0.7); c.lineTo(r * 1.55, -r * 0.55); c.lineTo(r * 1.15, -r * 0.42); c.closePath();
  c.fillStyle = '#ffb03a'; c.fill();
  c.fillStyle = '#2a2a3a';
  c.beginPath(); c.arc(r * 0.85, -r * 0.7, r * 0.1, 0, Math.PI * 2); c.fill();
  artBlob(c, -r * 0.1, -r * 0.15 - flap * r * 0.35, r * 0.62, r * 0.28, artShade(body, -0.15), { rot: -0.25 - flap * 0.7 });
  c.restore();
}
// Lintu lähtee lentoon (x0, y0):sta; ilmestyy pompsahtaen ja lentää kaarena pois
function htLinnaPokeBirdFly(c, x0, y0, r, k, dir, body, belly) {
  var u = Math.max(0, (k - 0.12) / 0.88), sc = Math.min(1, k / 0.1);
  var bx = x0 + dir * u * u * r * 16, by = y0 - u * r * 11 + Math.sin(u * Math.PI * 4) * r * 0.8;
  htLinnaPokeBird(c, bx, by, r * (0.4 + sc * 0.6), k < 0.12 ? 0 : Math.sin(k * 70), dir, body, belly);
}
// Putoavat lehdet latvuksesta
function htLinnaPokeLeaves(c, x, y, spread, fall, k, n, color, seed) {
  var i, h, u;
  for (i = 0; i < n; i++) {
    h = htLinnaPokeHash(i, seed);
    u = Math.max(0, k - h * 0.15);
    var lc = i % 3 === 0 ? '#ffd24f' : i % 3 === 1 ? artShade(color, 0.3) : color;
    artBlob(c, x + (h - 0.5) * spread + Math.sin(u * 9 + i * 2) * spread * 0.12, y + u * fall * (0.6 + h * 0.5),
      spread * 0.08, spread * 0.042, lc, { rot: Math.sin(u * 7 + i) * 1.3, lineColor: artShade(lc, -0.35) });
  }
}
// Omena / marja: punainen pallo, varsi ja lehti
function htLinnaPokeApple(c, x, y, r, color) {
  artCircle(c, x, y, r, color || '#ff5a5a', { hi: 0.45 });
  c.strokeStyle = '#7a5030';
  c.lineWidth = Math.max(1, r * 0.18);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y - r * 0.8); c.lineTo(x + r * 0.1, y - r * 1.3); c.stroke();
  artBlob(c, x + r * 0.45, y - r * 1.15, r * 0.35, r * 0.17, '#5fb055', { rot: -0.5, line: false });
}
// Sydän, joka nousee ja kasvaa
function htLinnaPokeHeartRise(c, x, y, size, k, delay) {
  var u = Math.max(0, (k - (delay || 0)) / (1 - (delay || 0)));
  if (u <= 0) return;
  drawHeartShape(c, x + Math.sin(u * 8) * size * 0.4, y - u * size * 4, size * (0.4 + Math.min(1, u * 4) * 0.6), true);
}
// Nuotti
function htLinnaPokeNote(c, x, y, r, color) {
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.2, r * 0.3);
  c.lineCap = 'round';
  c.beginPath(); c.ellipse(x, y, r, r * 0.75, -0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x + r * 0.85, y - r * 0.2); c.lineTo(x + r * 0.85, y - r * 3); c.quadraticCurveTo(x + r * 1.9, y - r * 2.4, x + r * 1.8, y - r * 1.5); c.stroke();
}
// Nuotteja nousee kohdasta (x, y)
function htLinnaPokeNotes(c, x, y, r, k, n) {
  var i, u, cols = ['#ff7bac', '#8a5cff', '#3fa0e0'];
  for (i = 0; i < n; i++) {
    u = k - i * 0.15;
    if (u <= 0) continue;
    htLinnaPokeNote(c, x + Math.sin(u * 6 + i) * r * 2 + (i - 1) * r * 1.5, y - u * r * 12, r, cols[i % 3]);
  }
}
// Perhonen lepattaa ylös
function htLinnaPokeFlutter(c, x, y, S, k, i, color) {
  var bx = x + Math.sin(k * 5 + i * 2.1) * S * 0.3 + (i - 1) * S * 0.25 * k;
  var by = y - k * S * 1.1 - i * S * 0.06;
  drawButterfly(c, bx, by, S * 0.16 * Math.min(1, k * 6 + 0.2), k * 6 + i, color);
}
// Mehiläinen: raidallinen pallo ja väpättävät siivet
function htLinnaPokeBee(c, x, y, r, t) {
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.9, r * 0.45, r * (0.25 + Math.abs(Math.sin(t * 60)) * 0.35), -0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + r * 0.3, y - r * 0.9, r * 0.45, r * (0.25 + Math.abs(Math.cos(t * 60)) * 0.35), 0.3, 0, Math.PI * 2); c.fill();
  artBlob(c, x, y, r, r * 0.72, '#ffd23e', { lineColor: '#7a5a10', hi: 0.4 });
  c.fillStyle = '#3a2e20';
  c.fillRect(x - r * 0.25, y - r * 0.65, r * 0.18, r * 1.3);
  c.fillRect(x + r * 0.2, y - r * 0.6, r * 0.18, r * 1.2);
  c.beginPath(); c.arc(x + r * 0.75, y - r * 0.1, r * 0.1, 0, Math.PI * 2); c.fill();
}
// Neljän sakaran tuike
function htLinnaPokeTwinkle(c, x, y, r, color) {
  c.fillStyle = color || '#ffffff';
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}
// Sateenkaari, joka kasvaa kaarena (x, y) keskipiste
function htLinnaPokeRainbow(c, x, y, R, grow) {
  var i, cols = ['#ff6b6b', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.5, R * 0.07);
  for (i = 0; i < cols.length; i++) {
    c.strokeStyle = cols[i];
    c.beginPath(); c.arc(x, y, R * (1 - i * 0.07), Math.PI, Math.PI + Math.PI * Math.max(0.01, grow)); c.stroke();
  }
}
// Vesipisarat suihkuavat kaarina (x, y):sta
function htLinnaPokeSplash(c, x, y, S, k, n, color, seed) {
  var i, h, t, px, py;
  for (i = 0; i < n; i++) {
    h = htLinnaPokeHash(i, seed);
    t = k * 1.3 - h * 0.1;
    if (t <= 0) continue;
    px = x + (h - 0.5) * S * 1.3 * t;
    py = y - S * (1.1 + htLinnaPokeHash(i + 9, seed) * 0.6) * t + S * 2.6 * t * t;
    if (py > y + S * 0.15) continue;
    artCircle(c, px, py, S * 0.03, color, { line: false, hi: 0.5 });
  }
}
// Pupu pilkistää esiin (kasvot), alaosa leikattu clipY:n kohdalta
function htLinnaPokePeek(c, x, clipY, size, k) {
  var u = htLinnaPokePop(k, 0.18, 0.7);
  c.save();
  c.beginPath(); c.rect(x - size * 3, clipY - size * 4, size * 6, size * 4); c.clip();
  drawBunny(c, x, clipY + size * 1.15 - u * size * 1.25, size, 0, k * 22, true);
  c.restore();
}
// Pupu loikkii x0:sta x1:een (hops loikkaa); y = maan taso, hopH = loikan korkeus
function htLinnaPokeHopBunny(c, x0, x1, y, size, u, hops, hopH) {
  u = Math.max(0, Math.min(1, u));
  var ph = (u * hops) % 1, bx = x0 + (x1 - x0) * u;
  c.save();
  c.translate(bx, y);
  c.scale(x1 < x0 ? -1 : 1, 1);
  drawBunny(c, 0, 0, size, Math.sin(ph * Math.PI) * (hopH || size * 1.1), u * 30, false);
  c.restore();
}
// Lepakko
function htLinnaPokeBat(c, x, y, r, flap) {
  var f = flap * r * 0.6;
  c.fillStyle = '#6a4a9a';
  c.strokeStyle = '#3a2860';
  c.lineWidth = Math.max(1, r * 0.1);
  c.beginPath();
  c.moveTo(x - r * 0.4, y);
  c.quadraticCurveTo(x - r * 1.2, y - r * 0.4 - f, x - r * 2, y - f);
  c.quadraticCurveTo(x - r * 1.6, y + r * 0.1 - f * 0.5, x - r * 1.5, y + r * 0.45 - f * 0.4);
  c.quadraticCurveTo(x - r * 1, y + r * 0.1, x - r * 0.4, y + r * 0.4);
  c.moveTo(x + r * 0.4, y);
  c.quadraticCurveTo(x + r * 1.2, y - r * 0.4 - f, x + r * 2, y - f);
  c.quadraticCurveTo(x + r * 1.6, y + r * 0.1 - f * 0.5, x + r * 1.5, y + r * 0.45 - f * 0.4);
  c.quadraticCurveTo(x + r * 1, y + r * 0.1, x + r * 0.4, y + r * 0.4);
  c.fill(); c.stroke();
  artCircle(c, x, y + r * 0.1, r * 0.55, '#7a5aaa', { lineColor: '#3a2860' });
  c.fillStyle = '#7a5aaa';
  c.beginPath(); c.moveTo(x - r * 0.4, y - r * 0.2); c.lineTo(x - r * 0.3, y - r * 0.85); c.lineTo(x - r * 0.05, y - r * 0.35); c.fill();
  c.beginPath(); c.moveTo(x + r * 0.4, y - r * 0.2); c.lineTo(x + r * 0.3, y - r * 0.85); c.lineTo(x + r * 0.05, y - r * 0.35); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x - r * 0.18, y, r * 0.12, 0, Math.PI * 2); c.arc(x + r * 0.18, y, r * 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1a40';
  c.beginPath(); c.arc(x - r * 0.16, y + r * 0.02, r * 0.06, 0, Math.PI * 2); c.arc(x + r * 0.2, y + r * 0.02, r * 0.06, 0, Math.PI * 2); c.fill();
}
// Sudenkorento: pitkä vartalo ja läpikuultavat siivet
function htLinnaPokeDragonfly(c, x, y, r, t, dir) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.fillStyle = 'rgba(220,245,255,0.75)';
  var fl = 0.2 + Math.abs(Math.sin(t * 50)) * 0.25;
  c.beginPath(); c.ellipse(-r * 0.1, -r * 0.35, r * 0.75, r * fl, -0.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(r * 0.15, -r * 0.35, r * 0.7, r * fl, 0.5 + Math.PI, 0, Math.PI * 2); c.fill();
  artLimb(c, -r * 1.1, r * 0.1, r * 0.2, 0, r * 0.18, '#3fb6c8');
  artCircle(c, r * 0.35, 0, r * 0.22, '#2f8fb0', { hi: 0.5 });
  c.restore();
}
// Kala (hyppää lammesta): rot = kallistus
function htLinnaPokeFish(c, x, y, r, rot, color) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.5, -r * 0.55); c.lineTo(-r * 1.5, r * 0.55); c.closePath();
  artFillPath(c, artShade(color, -0.1), -r * 0.55, r * 0.55, r * 0.5, {});
  artBlob(c, 0, 0, r, r * 0.6, color, { hi: 0.4 });
  c.fillStyle = '#2a2a3a';
  c.beginPath(); c.arc(r * 0.5, -r * 0.12, r * 0.12, 0, Math.PI * 2); c.fill();
  c.restore();
}
// Hyppäävä kala ja roiskeet: kaari x0:sta x1:een, korkeus hgt
function htLinnaPokeFishJump(c, x0, x1, y, hgt, r, k, color) {
  var u = Math.max(0, Math.min(1, (k - 0.08) / 0.6));
  if (u > 0 && u < 1) htLinnaPokeFish(c, x0 + (x1 - x0) * u, y - Math.sin(u * Math.PI) * hgt, r, (u - 0.5) * 2.4 * (x1 > x0 ? 1 : -1) + (x1 > x0 ? 0 : Math.PI), color);
  htLinnaPokeRipple(c, x0, y, r * 2, k * 2);
  htLinnaPokeRipple(c, x1, y, r * 2, (k - 0.62) * 2);
}
// Laajeneva rengas veden pinnalla (u = 0..1)
function htLinnaPokeRipple(c, x, y, R, u) {
  if (u <= 0 || u >= 1) return;
  c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - u)) + ')';
  c.lineWidth = Math.max(1, R * 0.08);
  c.beginPath(); c.ellipse(x, y, R * (0.3 + u), R * (0.3 + u) * 0.35, 0, 0, Math.PI * 2); c.stroke();
}
// Siili tepsuttaa
function htLinnaPokeHedgehog(c, x, y, r, step, dir) {
  var i;
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artShadow(c, 0, 0, r * 1.1, r * 0.25, 0.18);
  c.fillStyle = '#7a5236';
  c.beginPath();
  for (i = 0; i <= 8; i++) {
    var a = Math.PI + i / 8 * Math.PI, rr = i % 2 ? r * 1.15 : r * 0.9;
    c.lineTo(Math.cos(a) * rr - r * 0.1, Math.sin(a) * rr * 0.9 - r * 0.15);
  }
  c.closePath(); c.fill();
  artBlob(c, -r * 0.1, -r * 0.35, r * 0.85, r * 0.55, '#9a6a44', { lineColor: '#5a3a20' });
  artBlob(c, r * 0.65, -r * 0.25, r * 0.4, r * 0.3, '#f0d0a8', { lineColor: '#9a6a44', rot: 0.2 });
  c.fillStyle = '#2a1a10';
  c.beginPath(); c.arc(r * 1.02, -r * 0.2, r * 0.09, 0, Math.PI * 2); c.arc(r * 0.6, -r * 0.35, r * 0.07, 0, Math.PI * 2); c.fill();
  artCircle(c, -r * 0.35, -r * 0.02 + Math.max(0, Math.sin(step)) * -r * 0.1, r * 0.13, '#5a3a20', { line: false });
  artCircle(c, r * 0.3, -r * 0.02 + Math.max(0, -Math.sin(step)) * -r * 0.1, r * 0.13, '#5a3a20', { line: false });
  c.restore();
}
// Pöllö: iso pää, isot silmät, korvatupsut; flap null = istuu
function htLinnaPokeOwl(c, x, y, r, k, flap) {
  if (flap !== null) {
    artBlob(c, x - r * 0.9, y - r * flap * 0.5, r * 0.7, r * 0.3, '#7a5a3a', { rot: -0.4 - flap * 0.6 });
    artBlob(c, x + r * 0.9, y - r * flap * 0.5, r * 0.7, r * 0.3, '#7a5a3a', { rot: 0.4 + flap * 0.6 });
  }
  c.fillStyle = '#8a6a4a';
  c.beginPath(); c.moveTo(x - r * 0.75, y - r * 0.5); c.lineTo(x - r * 0.55, y - r * 1.1); c.lineTo(x - r * 0.25, y - r * 0.7); c.fill();
  c.beginPath(); c.moveTo(x + r * 0.75, y - r * 0.5); c.lineTo(x + r * 0.55, y - r * 1.1); c.lineTo(x + r * 0.25, y - r * 0.7); c.fill();
  artBlob(c, x, y, r * 0.85, r, '#9a7a5a', { lineColor: '#5a4030', hi: 0.3 });
  artBlob(c, x, y + r * 0.3, r * 0.5, r * 0.55, '#e8d4b0', { line: false });
  artEye(c, x - r * 0.33, y - r * 0.3, r * 0.28, 0, k > 0.45 && k < 0.52);
  artEye(c, x + r * 0.33, y - r * 0.3, r * 0.28, 0, k > 0.45 && k < 0.52);
  c.fillStyle = '#ffb03a';
  c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.08); c.lineTo(x + r * 0.1, y - r * 0.08); c.lineTo(x, y + r * 0.12); c.fill();
}
// Savupallo (savupiippu, lumipöllähdys)
function htLinnaPokePuffs(c, x, y, r, k, n, color) {
  var i, u;
  for (i = 0; i < n; i++) {
    u = k * 1.2 - i * 0.18;
    if (u <= 0 || u > 1) continue;
    c.fillStyle = artRGBA(color, 0.85 * (1 - u));
    cloudShape(c, x + Math.sin(u * 4 + i) * r * 0.8 + u * r * 1.2, y - u * r * 6, r * (0.5 + u * 0.8));
  }
}

// Äänet
function htLinnaPokeTweet(d) {
  d = d || 0;
  playNote(2093, d, 0.06, 'sine', 0.18);
  playNote(2637, d + 0.08, 0.06, 'sine', 0.16);
  playNote(2349, d + 0.16, 0.08, 'sine', 0.16);
}
function htLinnaPokeChime(base, d) {
  var i, m = [1, 1.25, 1.5, 2];
  for (i = 0; i < m.length; i++) playNote(base * m[i], (d || 0) + i * 0.08, 0.3, 'sine', 0.22);
}
function htLinnaPokePlop(d) {
  playNote(330, d || 0, 0.1, 'sine', 0.3);
  playNote(247, (d || 0) + 0.08, 0.12, 'sine', 0.22);
}
function htLinnaPokeBuzz() {
  playNote(196, 0, 0.5, 'sawtooth', 0.05);
  playNote(208, 0.05, 0.45, 'sawtooth', 0.04);
}
function htLinnaPokeSplashSnd(d) {
  d = d || 0;
  playNote(1175, d, 0.08, 'sine', 0.2);
  playNote(880, d + 0.05, 0.08, 'sine', 0.2);
  playNote(587, d + 0.1, 0.12, 'sine', 0.2);
}

// Maiseman tökättävä kohde: id yksilöi laskurin (joka 3. napautus isompi yllätys)
var htLinnaPokeSpotN = {};
function htLinnaPokeSpot(id, kind, x, y, r, size, snd) {
  return {
    id: id, kind: kind, x: x, y: y, r: r, size: size, n: 0,
    sound: function () {
      this.n = htLinnaPokeSpotN[id] = (htLinnaPokeSpotN[id] || 0) + 1;
      if (snd) snd(this, this.n % 3 === 0);
    }
  };
}
// Onko ympyrä laatan ulkopuolella (laatan päällä ei tarjota maisemakohteita)
function htLinnaPokeOutside(lay, x, y, r) {
  var pad = lay.cell * 0.3;
  return x + r < lay.ox - pad || x - r > lay.ox + lay.cols * lay.cell + pad ||
    y + r < lay.oy - pad || y - r > lay.oy + lay.rows * lay.cell + lay.cell * 0.8;
}
// Pilvet samoissa kohdissa kuin hubThemeClouds
function htLinnaPokeCloudSpots(band, w, h, n, out) {
  var i, cx, cy, cs;
  for (i = 0; i < n; i++) {
    cx = w * (0.04 + ((i * 0.37) % 1) * 0.92);
    cy = h * (0.05 + (i % 3) * 0.045);
    cs = h * (0.018 + (i % 2) * 0.008);
    out.push(htLinnaPokeSpot(band + '-cloud' + i, 'cloud', cx, cy, cs * 2.4, cs, function (sp, big) {
      htLinnaPokeChime(big ? 784 : 587);
    }));
  }
}
// Kummut: pupu loikkaa esiin laatan vasemmalla ja oikealla puolella
function htLinnaPokeHillSpots(band, w, h, lay, out) {
  var lx = (lay.ox - lay.cell * 0.4) / 2, rx = (lay.ox + lay.cols * lay.cell + lay.cell * 0.4 + w) / 2, y = h * 0.86, r = Math.min(h * 0.08, lx * 0.9);
  if (r < h * 0.03) return;
  if (htLinnaPokeOutside(lay, lx, y, r)) out.push(htLinnaPokeSpot(band + '-hillL', 'hill', lx, y, r, r, function () { soundBunny(); }));
  if (htLinnaPokeOutside(lay, rx, y, r)) out.push(htLinnaPokeSpot(band + '-hillR', 'hill', rx, y, r, r, function () { soundBunny(); }));
}
// Pilvi: iloiset kasvot ja sadekuuro; isolla kerralla sateenkaari
function htLinnaPokeCloudFx(c, sp, k) {
  var x = sp.x, y = sp.y, cs = sp.size, i, ph, big = sp.n % 3 === 0;
  c.save();
  c.globalAlpha = htLinnaPokeFade(k);
  if (big) htLinnaPokeRainbow(c, x + cs * 3, y + cs * 4, cs * 4, htLinnaPokeEase(k / 0.4));
  c.fillStyle = '#7fc0f0';
  for (i = 0; i < 7; i++) {
    ph = (k * 3 + htLinnaPokeHash(i, 3)) % 1;
    if (k < 0.08) continue;
    c.beginPath(); c.ellipse(x + (i - 3) * cs * 0.5, y + cs * (0.9 + ph * 3), cs * 0.09, cs * 0.18, 0, 0, Math.PI * 2); c.fill();
  }
  htLinnaPokeFace(c, x, y + cs * 0.1, cs * 0.9, k, false, true);
  c.restore();
}
// Kumpu: pupu loikkii poikki, isolla kerralla kaksi pupua ja sydän
function htLinnaPokeHillFx(c, sp, k) {
  var big = sp.n % 3 === 0, R = sp.size, dir = sp.x < viewW / 2 ? 1 : -1;
  c.save();
  c.globalAlpha = htLinnaPokeFade(k, 0.8);
  htLinnaPokeHopBunny(c, sp.x - dir * R, sp.x + dir * R, sp.y, R * 0.28, k * 1.1, 3);
  if (big) {
    htLinnaPokeHopBunny(c, sp.x - dir * R * 1.4, sp.x + dir * R * 0.6, sp.y + R * 0.15, R * 0.2, k * 1.1 - 0.08, 4);
    htLinnaPokeHeartRise(c, sp.x, sp.y - R * 0.5, R * 0.12, k, 0.5);
  }
  c.restore();
}
// Puu (koriste tai kaukainen puu): lehdet varisevat, omena putoaa; iso: lintu lentää pois
function htLinnaPokeTreeFx(c, x, baseY, S, k, big, leaf, seed, fruit) {
  var top = baseY - S * 0.92, i, na = big ? 3 : 1;
  htLinnaPokeLeaves(c, x, top - S * 0.1, S * 1.1, S * 0.95, k, big ? 8 : 5, leaf, seed);
  if (fruit) {
    for (i = 0; i < na; i++) {
      htLinnaPokeApple(c, x + (na === 1 ? (seed - 0.5) * S * 0.5 : (i - 1) * S * 0.34), htLinnaPokeDropY(k * 1.2 - i * 0.08, top + S * 0.05, baseY - S * 0.08), S * 0.085, fruit);
    }
  }
  if (big) htLinnaPokeBirdFly(c, x + S * 0.1, top - S * 0.3, S * 0.11, k, seed < 0.5 ? -1 : 1, '#7fb0ff', '#fff3d8');
}
// Mökki: savupiipusta pölähtää savua, isolla kerralla sydän ja ikkunaan valo
function htLinnaPokeCottageFx(c, x, baseY, S, k, big, sleepy) {
  var w = S * 0.36, h = S * 0.3, chx = x + w * 0.18 + S * 0.035, chy = baseY - h - S * 0.2, i;
  if (big || sleepy) artGlow(c, x + w * 0.2, baseY - h * 0.55, S * 0.16, '#ffe68a', 0.9 * htLinnaPokePop(k, 0.1, 0.7));
  if (sleepy && !big) {
    c.fillStyle = 'rgba(120,100,180,0.85)';
    c.textAlign = 'center';
    for (i = 0; i < 3; i++) {
      var u = k * 1.3 - i * 0.2;
      if (u <= 0 || u > 1) continue;
      c.font = 'bold ' + Math.round(S * (0.1 + i * 0.04)) + 'px ' + UI_FONT;
      c.fillText('z', chx + S * 0.1 + u * S * 0.3 + Math.sin(u * 6) * S * 0.05, chy - u * S * 0.6);
    }
  } else htLinnaPokePuffs(c, chx, chy, S * 0.05, k, big ? 2 : 4, '#ffffff');
  if (big) htLinnaPokeHeartRise(c, chx, chy - S * 0.05, S * 0.07, k, 0.12);
}
// Marjapensas: marjat ponnahtavat ja pomppivat maahan; isolla kerralla siili tepsuttaa esiin
function htLinnaPokeBerryFx(c, x, baseY, S, k, big, berry, seed) {
  var i, u, bx;
  for (i = 0; i < 3; i++) {
    u = k * 1.3 - i * 0.1;
    if (u <= 0) continue;
    bx = x + (i - 1) * S * 0.25 * Math.min(1, u * 2) + (i - 1) * S * 0.1;
    var y = u < 0.3 ? baseY - S * 0.3 - Math.sin(u / 0.3 * Math.PI * 0.5) * S * 0.25 : htLinnaPokeDropY((u - 0.3) * 1.4, baseY - S * 0.55, baseY - S * 0.05);
    artCircle(c, bx, y, S * 0.05, berry, { hi: 0.5 });
  }
  if (big) {
    var hu = htLinnaPokeEase(k / 0.45), dir = seed < 0.5 ? 1 : -1;
    htLinnaPokeHedgehog(c, x + dir * S * (0.05 + hu * 0.45), baseY + S * 0.02, S * 0.13, k * 30, dir);
    htLinnaPokeHeartRise(c, x + dir * S * 0.55, baseY - S * 0.25, S * 0.06, k, 0.45);
  }
}
// Perhoset ja mehiläinen kukista
function htLinnaPokeFlowerFx(c, x, y, S, k, big, cols) {
  var i, nb = big ? 3 : 1;
  for (i = 0; i < nb; i++) htLinnaPokeFlutter(c, x + (i - 1) * S * 0.2, y, S, Math.max(0, k * 1.1 - i * 0.07), i, cols[i % cols.length]);
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
  },
  // Tökkäys: kukkapenkistä perhosia, muotopuusta laulava lintu, aidanteesta
  // pilkistää pupu (iso: loikkaa yli), suihkulähde roiskuu (iso: sateenkaari)
  pokeColor: '#ff9ad0',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.4) { playNote(1047, 0.1, 0.1, 'sine', 0.18); playNote(1319, 0.2, 0.1, 'sine', 0.16); if (big) htLinnaPokeChime(784, 0.3); }
    else if (p.rnd < 0.62) { htLinnaPokeTweet(0.15); if (big) htLinnaPokeTweet(0.5); }
    else if (p.rnd < 0.82) soundBunny();
    else { htLinnaPokeSplashSnd(0.05); if (big) htLinnaPokeChime(659, 0.3); }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, u;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.4) {
      S = s * 1.45;
      htLinnaPokeFlowerFx(c, x, baseY - S * 0.35, S, k, big, [HT_LINNA_GARDEN_COLS[Math.floor(rnd2 * 5)], '#ffd24f', '#7fd4ff']);
    } else if (rnd < 0.62) {
      // Lintu pompsahtaa muotopuun latvaan ja laulaa; iso: lentää pois
      S = s * 1.9;
      if (big) htLinnaPokeBirdFly(c, x, baseY - S * 0.75, S * 0.06, k, rnd2 < 0.5 ? 1 : -1, '#ffb84f', '#fff3d8');
      else {
        u = htLinnaPokePop(k, 0.12, 0.75);
        htLinnaPokeBird(c, x, baseY - S * 0.68 - u * S * 0.06 - Math.abs(Math.sin(k * 14)) * S * 0.02, S * 0.06 * Math.max(0.01, u), 0, rnd2 < 0.5 ? 1 : -1, '#ffb84f', '#fff3d8');
      }
      htLinnaPokeNotes(c, x + S * 0.08, baseY - S * 0.8, S * 0.025, k, big ? 3 : 2);
    } else if (rnd < 0.82) {
      S = s * 1.4;
      if (big) {
        htLinnaPokeHopBunny(c, x - S * 0.6, x + S * 0.6, baseY - S * 0.05, S * 0.16, k * 1.25, 1, S * 0.45);
        htLinnaPokeHeartRise(c, x + S * 0.6, baseY - S * 0.3, S * 0.05, k, 0.6);
      } else htLinnaPokePeek(c, x + (rnd2 - 0.5) * S * 0.4, baseY - S * 0.28, S * 0.13, k);
    } else {
      S = s * 1.65;
      if (big) htLinnaPokeRainbow(c, x, baseY - S * 0.3, S * 0.5, htLinnaPokeEase(k / 0.35));
      htLinnaPokeSplash(c, x, baseY - S * 0.55, S * (big ? 0.7 : 0.5), k, big ? 16 : 10, '#9fe0ff', rnd2);
      htLinnaPokeRipple(c, x, baseY - S * 0.16, S * 0.25, k * 2);
    }
    c.restore();
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
  },
  // Tökkäys: kuusesta varisee lunta (iso: punatulkku lentää), lumiukko punastuu
  // ja hymyilee (iso: heittää lumipallon), kristallit kilisevät ja tuikkivat
  // (iso: lumihiutale kohoaa), kinoksesta pilkistää lumipupu (iso: loikkaa esiin)
  pokeColor: '#bfe9ff',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.45) { htLinnaPokeChime(1319, 0.05); if (big) htLinnaPokeTweet(0.35); }
    else if (p.rnd < 0.62) { playNote(523, 0.05, 0.15, 'triangle', 0.25); playNote(784, 0.18, 0.2, 'triangle', 0.22); if (big) htLinnaPokePlop(0.7); }
    else if (p.rnd < 0.8) { htLinnaPokeChime(1047, 0); if (big) htLinnaPokeChime(1568, 0.35); }
    else soundBunny();
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, i, u;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.45) {
      S = s * 1.8;
      var fx = x - s * 0.1;
      for (i = 0; i < (big ? 7 : 4); i++) {
        u = k * 1.3 - htLinnaPokeHash(i, rnd2) * 0.25;
        if (u <= 0) continue;
        artBlob(c, fx + (htLinnaPokeHash(i + 4, rnd2) - 0.5) * S * 0.5, htLinnaPokeDropY(u, baseY - S * (0.2 + (i % 3) * 0.2), baseY - S * 0.04), S * 0.05, S * 0.035, '#ffffff', { lineColor: '#9fbfdc' });
      }
      for (i = 0; i < 3; i++) drawSnowflake(c, fx + Math.sin(k * 4 + i * 2) * S * 0.3, baseY - S * (0.7 - k * 0.5) - i * S * 0.1, S * 0.03);
      if (big) htLinnaPokeBirdFly(c, fx + S * 0.05, baseY - S * 0.45, S * 0.06, k, rnd2 < 0.5 ? 1 : -1, '#7a8494', '#ff6a5a');
    } else if (rnd < 0.62) {
      S = s * 1.9;
      // Posket ja hiilihymy heilahduksen mukana
      c.save();
      htLinnaPokeWobble(c, x, baseY, k, HT_LINNA_POKE_DUR);
      artBlush(c, x - S * 0.075, baseY - S * 0.385, S * 0.028);
      artBlush(c, x + S * 0.085, baseY - S * 0.385, S * 0.028);
      c.fillStyle = '#3a2e40';
      for (i = 0; i < 5; i++) {
        var a = Math.PI * (0.25 + i * 0.125);
        c.beginPath(); c.arc(x + Math.cos(a) * S * 0.06, baseY - S * 0.38 + Math.sin(a) * S * 0.035, S * 0.011, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      if (big) {
        // Lumipallo lentää kaarena keppikädestä ja pöllähtää maahan
        u = Math.max(0, Math.min(1, (k - 0.1) / 0.45));
        var dir = rnd2 < 0.5 ? 1 : -1, sx = x + dir * S * 0.25, sy = baseY - S * 0.42;
        if (u < 1) artCircle(c, sx + dir * u * S * 0.6, sy + (S * 0.42) * u * u - Math.sin(u * Math.PI) * S * 0.25, S * 0.045, '#ffffff', { lineColor: '#7a9ec0' });
        else htLinnaPokePuffs(c, sx + dir * S * 0.6, baseY - S * 0.02, S * 0.04, (k - 0.55) / 0.45 * 0.9, 3, '#ffffff');
      }
      for (i = 0; i < 4; i++) drawSnowflake(c, x + Math.cos(k * 3 + i * 1.6) * S * 0.3, baseY - S * 0.4 + Math.sin(k * 3 + i * 1.6) * S * 0.2, S * 0.025);
    } else if (rnd < 0.8) {
      S = s * 1.7;
      artGlow(c, x, baseY - S * 0.25, S * 0.6, '#bfe9ff', 0.7 * htLinnaPokePop(k, 0.08, 0.5));
      for (i = 0; i < 5; i++) {
        var tw = Math.max(0, Math.sin(k * 9 + i * 1.7));
        htLinnaPokeTwinkle(c, x + Math.cos(i * 1.3) * S * 0.3, baseY - S * 0.3 + Math.sin(i * 1.9) * S * 0.2, S * 0.06 * tw, '#ffffff');
      }
      if (big) {
        u = htLinnaPokeEase(k / 0.6);
        c.save();
        c.translate(x, baseY - S * 0.4 - u * S * 0.6);
        c.rotate(k * 4);
        drawSnowflake(c, 0, 0, S * (0.04 + u * 0.08));
        c.restore();
      }
    } else {
      S = s * 1.4;
      if (big) {
        htLinnaPokeHopBunny(c, x, x + (rnd2 < 0.5 ? 1 : -1) * S * 0.55, baseY - S * 0.02, S * 0.15, k * 1.3, 2, S * 0.3);
        htLinnaPokePuffs(c, x, baseY - S * 0.12, S * 0.05, k, 3, '#ffffff');
      } else htLinnaPokePeek(c, x + s * 0.1, baseY - S * 0.16, S * 0.12, k);
    }
    c.restore();
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
  },
  // Tökkäys: sammakko nappaa kielellään kärpäsen / lumme aukeaa ja sudenkorento
  // käy (iso: kala hyppää), kaislikosta lehahtaa sudenkorento (iso: kaksi ja
  // nuijien haituvia), pajusta kurkistaa pöllö (iso: lentää pois)
  pokeColor: '#a8f0ff',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.45) {
      if (p.rnd2 < 0.5) { playNote(150, 0.35, 0.09, 'square', 0.12); playNote(130, 0.48, 0.12, 'square', 0.12); }
      else htLinnaPokeChime(880, 0.05);
      if (big) htLinnaPokeSplashSnd(0.2);
    } else if (p.rnd < 0.72) { htLinnaPokeBuzz(); if (big) htLinnaPokeChime(1047, 0.3); }
    else { playNote(392, 0.1, 0.25, 'sine', 0.3); playNote(330, 0.42, 0.4, 'sine', 0.3); }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, i, u, cy;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.45) {
      S = s * 1.25;
      cy = baseY - S * 0.14;
      if (rnd2 < 0.5) {
        // Kärpänen pörrää, sammakon kieli nappaa sen
        var fx = x + S * 0.17, fy = cy + S * 0.02, tx = fx - S * 0.28, ty = fy - S * 0.38;
        u = k < 0.2 ? 0 : k < 0.3 ? (k - 0.2) / 0.1 : k < 0.4 ? 1 - (k - 0.3) / 0.1 : 0;
        if (k < 0.3) {
          var bx = tx + Math.sin(k * 40) * S * 0.04, by = ty + Math.cos(k * 33) * S * 0.03;
          c.fillStyle = 'rgba(255,255,255,0.8)';
          c.beginPath(); c.ellipse(bx - S * 0.015, by - S * 0.02, S * 0.02, S * 0.012, -0.5, 0, Math.PI * 2); c.ellipse(bx + S * 0.015, by - S * 0.02, S * 0.02, S * 0.012, 0.5, 0, Math.PI * 2); c.fill();
          artCircle(c, bx, by, S * 0.018, '#3a3a4a', { line: false });
        }
        if (u > 0) {
          c.strokeStyle = '#ff6f8e';
          c.lineWidth = Math.max(1.5, S * 0.025);
          c.lineCap = 'round';
          c.beginPath(); c.moveTo(fx, fy - S * 0.07); c.lineTo(fx + (tx - fx) * u, fy - S * 0.07 + (ty - fy + S * 0.07) * u); c.stroke();
        }
        if (k > 0.42) htLinnaPokeHeartRise(c, fx, fy - S * 0.2, S * 0.05, k, 0.42);
      } else {
        // Lumpeenkukka hehkuu, sudenkorento käy kukalla
        artGlow(c, x + S * 0.17, cy - S * 0.03, S * 0.2, '#ffd0e4', 0.8 * htLinnaPokePop(k, 0.1, 0.6));
        u = htLinnaPokeEase(k / 0.35);
        htLinnaPokeDragonfly(c, x + S * 0.17 + (1 - u) * S * 0.6 + (k > 0.6 ? (k - 0.6) * S * 1.5 : 0), cy - S * 0.15 - (1 - u) * S * 0.4 - (k > 0.6 ? (k - 0.6) * S : 0), S * 0.09, k, -1);
      }
      if (big) htLinnaPokeFishJump(c, x - S * 0.25, x + S * 0.05, cy + S * 0.02, S * 0.4, S * 0.06, k, '#ff9d5c');
      htLinnaPokeRipple(c, x + S * 0.17, cy + S * 0.02, S * 0.15, k * 2.5);
    } else if (rnd < 0.72) {
      S = s * 1.7;
      for (i = 0; i < (big ? 2 : 1); i++) {
        u = Math.max(0, k - i * 0.1);
        htLinnaPokeDragonfly(c, x + (i ? -1 : 1) * (Math.sin(u * 7) * S * 0.12 + u * S * 0.5), baseY - S * 0.55 - u * S * 0.6 + Math.sin(u * 13) * S * 0.04, S * 0.07, k + i, i ? -1 : 1);
      }
      if (big) {
        // Nuijien haituvat leijailevat
        for (i = 0; i < 8; i++) {
          u = k * 1.2 - htLinnaPokeHash(i, rnd2) * 0.2;
          if (u <= 0) continue;
          artCircle(c, x + (htLinnaPokeHash(i + 3, rnd2) - 0.5) * S * 0.4 + Math.sin(u * 5 + i) * S * 0.12 + u * S * 0.2, baseY - S * 0.5 - u * S * 0.5, S * 0.015, '#fff8e8', { line: false });
        }
      }
    } else {
      S = s * 1.75;
      var ox = x + (rnd2 - 0.5) * S * 0.15, oy = baseY - S * 0.62;
      if (big) {
        u = Math.max(0, (k - 0.25) / 0.75);
        htLinnaPokeOwl(c, ox + u * u * S * 1.2 * (rnd2 < 0.5 ? 1 : -1), oy - u * S * 0.9, S * 0.09 * htLinnaPokeEase(k / 0.1), k, k > 0.25 ? Math.sin(k * 50) : null);
        htLinnaPokeLeaves(c, x, oy, S * 0.6, S * 0.55, k, 6, '#7fcf8a', rnd2);
      } else htLinnaPokeOwl(c, ox, oy, S * 0.09 * htLinnaPokePop(k, 0.1, 0.78), k, null);
    }
    c.restore();
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
  },
  // Tökkäys: kristallit välähtävät ja soivat (iso: jalokivi kohoaa pyörien),
  // tippukivien takaa lehahtaa lepakko (iso: kolme), hehkusienet puhaltavat
  // valoitiöitä (iso: enemmän ja sienet saavat kasvot)
  pokeColor: '#d8b8ff',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.4) { htLinnaPokeChime(880, 0); if (big) htLinnaPokeChime(1319, 0.35); }
    else if (p.rnd < 0.68) {
      playNote(1760, 0.1, 0.05, 'square', 0.06); playNote(1976, 0.18, 0.05, 'square', 0.06);
      if (big) { playNote(1568, 0.3, 0.05, 'square', 0.06); playNote(1865, 0.38, 0.05, 'square', 0.06); }
    } else { playNote(523, 0.05, 0.3, 'sine', 0.2); playNote(659, 0.2, 0.3, 'sine', 0.18); if (big) playNote(784, 0.35, 0.4, 'sine', 0.18); }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, i, u, col;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.4) {
      S = s * 1.75;
      col = CRYSTAL_COLORS[Math.floor(rnd2 * CRYSTAL_COLORS.length)];
      artGlow(c, x, baseY - S * 0.28, S * 0.75, col, 0.85 * htLinnaPokePop(k, 0.06, 0.45));
      for (i = 0; i < 6; i++) {
        htLinnaPokeTwinkle(c, x + Math.cos(i * 1.1 + 0.4) * S * 0.32, baseY - S * 0.3 + Math.sin(i * 2.3) * S * 0.22, S * 0.06 * Math.max(0, Math.sin(k * 10 + i * 1.3)), '#ffffff');
      }
      if (big) {
        u = htLinnaPokeEase(k / 0.55);
        c.save();
        c.translate(x, baseY - S * 0.55 - u * S * 0.55);
        c.scale(Math.cos(k * 12), 1);
        artGlow(c, 0, 0, S * 0.2, col, 0.7);
        drawCrystal(c, 0, 0, S * 0.1, col);
        c.restore();
      }
    } else if (rnd < 0.68) {
      S = s * 1.6;
      for (i = 0; i < (big ? 3 : 1); i++) {
        u = Math.max(0, k * 1.15 - i * 0.1);
        var dir = (i + (rnd2 < 0.5 ? 0 : 1)) % 2 ? -1 : 1;
        htLinnaPokeBat(c, x + (i - 1) * S * 0.12 * (big ? 1 : 0) + dir * (u * S * 0.8 + Math.sin(u * 9) * S * 0.08), baseY - S * 0.45 - u * S * 0.9 + Math.sin(u * 14) * S * 0.04, S * 0.06 * Math.min(1, u * 8 + 0.1), Math.sin(k * 45 + i));
      }
    } else {
      S = s * 1.8;
      col = rnd2 < 0.5 ? '#6fe0d8' : '#c9a0ff';
      for (i = 0; i < (big ? 16 : 8); i++) {
        u = k * 1.15 - htLinnaPokeHash(i, rnd2) * 0.15;
        if (u <= 0) continue;
        var px = x + (htLinnaPokeHash(i + 5, rnd2) - 0.5) * S * 0.45 + Math.sin(u * 6 + i) * S * 0.08, py = baseY - S * 0.4 - u * S * 0.9;
        artGlow(c, px, py, S * 0.05, col, 0.8);
        artCircle(c, px, py, S * 0.012, '#ffffff', { line: false });
      }
      if (big) {
        c.save();
        htLinnaPokeWobble(c, x, baseY, k, HT_LINNA_POKE_DUR);
        htLinnaPokeFace(c, x - S * 0.14, baseY - S * 0.1, S * 0.055, k, false, true);
        htLinnaPokeFace(c, x + S * 0.16, baseY - S * 0.065, S * 0.038, k, false, true);
        c.restore();
      }
    }
    c.restore();
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
    // Aurinko (ei drawBgSunia: se rekisteröisi tökättävän auringon). Paikka on
    // sama kuin sokkelon yleisellä tökättävällä auringolla (hubFxTapOutside),
    // jotta sen silmänisku osuu tämän auringon päälle
    var sx = w * 0.9, sy = h * 0.1, sr = h * 0.05, sg = b.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
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
  // Tökkäys: marjat ponnahtavat (iso: siili tepsuttaa esiin), mökin piipusta
  // savua tai unisia z-kirjaimia (iso: sydän ja ikkunaan valo), pupulle sydän
  // (iso: poikanen loikkaa viereen), auringonkukalla käy mehiläinen (iso: kukka
  // hymyilee ja mehiläisiä on kaksi), kukkamättäästä perhosia
  pokeColor: '#ffb0d0',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.32) { htLinnaPokePlop(0.3); if (big) soundBunny(); }
    else if (p.rnd < 0.42) { playNote(659, 0.1, 0.2, 'sine', 0.2); playNote(523, 0.3, 0.25, 'sine', 0.18); if (big) htLinnaPokeChime(784, 0.4); }
    else if (p.rnd < 0.58) { soundBunny(); if (big) htLinnaPokeChime(880, 0.3); }
    else if (p.rnd < 0.74) { htLinnaPokeBuzz(); if (big) htLinnaPokeChime(659, 0.3); }
    else { playNote(1047, 0.1, 0.1, 'sine', 0.18); playNote(1319, 0.2, 0.1, 'sine', 0.16); }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, i, u;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.32) {
      S = s * 1.6;
      htLinnaPokeBerryFx(c, x, baseY, S, k, big, rnd2 < 0.5 ? '#e8456a' : '#6a7fe0', rnd2);
    } else if (rnd < 0.42) {
      S = s * 1.7;
      htLinnaPokeCottageFx(c, x, baseY, S, k, big, rnd2 < 0.5);
    } else if (rnd < 0.58) {
      S = s * 1.6;
      var hy = baseY - S * 0.24 * 1.05;
      if (big) {
        u = htLinnaPokePop(k, 0.12, 0.8);
        htLinnaPokeHopBunny(c, x + S * 0.12, x + S * 0.12, baseY + S * 0.02, S * 0.13 * Math.max(0.05, u), k * 2, 3);
        htLinnaPokeHeartRise(c, x + S * 0.05, hy - S * 0.2, S * 0.05, k, 0.15);
      }
      htLinnaPokeHeartRise(c, x - S * 0.04, hy - S * 0.15, S * 0.06, k, 0);
    } else if (rnd < 0.74) {
      S = s * 1.9;
      var hx = x, hyy = baseY - S * 0.52;
      if (big) {
        c.save();
        htLinnaPokeWobble(c, x, baseY, k, HT_LINNA_POKE_DUR);
        htLinnaPokeFace(c, hx, hyy, S * 0.06, k, true, false);
        c.restore();
      }
      for (i = 0; i < (big ? 2 : 1); i++) {
        var a = k * 9 + i * Math.PI;
        htLinnaPokeBee(c, hx + Math.cos(a) * S * 0.24, hyy + Math.sin(a) * S * 0.12 - S * 0.04, S * 0.035 * Math.min(1, k * 8), k + i);
      }
    } else {
      S = s * 1.6;
      htLinnaPokeFlowerFx(c, x, baseY - S * 0.25, S, k, big, ['#ff7bac', '#c9a0ff', '#ffe27a']);
      if (big) htLinnaPokeBee(c, x + Math.cos(k * 8) * S * 0.25, baseY - S * 0.3 + Math.sin(k * 8) * S * 0.1, S * 0.03 * Math.min(1, k * 8), k);
    }
    c.restore();
  },
  // Hoivasaaren maisema: pilvistä sataa, mökkien piipuista savua ja sydämiä,
  // marjapensaista marjoja, puista omenoita ja kummuilla pupuja (aurinko iskee
  // silmää sokkelon omalla aurinkotökkäyksellä)
  spotDur: 2.4,
  spots: function (w, h, lay) {
    var out = [], i, x, by, S, left = lay.ox - lay.cell, right = lay.ox + (lay.cols + 1) * lay.cell;
    for (i = 0; i < 16; i++) {
      x = (i / 15) * w;
      by = lay.oy + lay.rows * lay.cell * 0.3 + h * 0.22 + (i % 3) * h * 0.05;
      if (x > left && x < right) continue;
      if (i % 4 === 1) {
        S = h * 0.12;
        out.push(htLinnaPokeSpot('meadow-cottage' + i, i % 8 === 1 ? 'sleepy' : 'cottage', x, by - S * 0.25, S * 0.4, S, function (sp, big) {
          playNote(659, 0.1, 0.2, 'sine', 0.2); playNote(523, 0.3, 0.25, 'sine', 0.18);
        }));
      } else if (i % 4 === 3) {
        S = h * 0.09;
        out.push(htLinnaPokeSpot('meadow-berry' + i, i % 8 === 3 ? 'berryR' : 'berryB', x, by - S * 0.22, S * 0.45, S, function (sp, big) {
          htLinnaPokePlop(0.3); if (big) soundBunny();
        }));
      } else {
        S = h * (0.06 + (i % 3) * 0.015);
        out.push(htLinnaPokeSpot('meadow-tree' + i, 'tree', x, by - S * 0.9, S * 0.8, S, function (sp, big) {
          htLinnaPokePlop(0.35); if (big) htLinnaPokeTweet(0.2);
        }));
      }
      out[out.length - 1].by = by;
    }
    htLinnaPokeCloudSpots('meadow', w, h, 5, out);
    htLinnaPokeHillSpots('meadow', w, h, lay, out);
    return out;
  },
  spotDraw: function (c, sp, k, lay) {
    var big = sp.n % 3 === 0;
    if (sp.kind === 'cloud') { htLinnaPokeCloudFx(c, sp, k); return; }
    if (sp.kind === 'hill') { htLinnaPokeHillFx(c, sp, k); return; }
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (sp.kind === 'tree') htLinnaPokeTreeFx(c, sp.x, sp.by, sp.size, k, big, '#86cf6a', htLinnaPokeHash(sp.x, 1), '#ff5a5a');
    else if (sp.kind === 'cottage' || sp.kind === 'sleepy') htLinnaPokeCottageFx(c, sp.x, sp.by, sp.size, k, big, sp.kind === 'sleepy');
    else htLinnaPokeBerryFx(c, sp.x, sp.by, sp.size, k, big, sp.kind === 'berryR' ? '#e8456a' : '#6a7fe0', htLinnaPokeHash(sp.x, 2));
    c.restore();
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
  },
  // Tökkäys: käkkyräpuusta varisee lehtiä ja kurkistaa pöllö (iso: lentää pois),
  // kaislikosta lehahtaa tulikärpästen parvi (iso: sammakko loikkaa lätäkköön),
  // sienistä pöllähtää itiöpilvi (iso: sienet saavat kasvot)
  pokeColor: '#e6ff96',
  pokeDur: HT_LINNA_POKE_DUR,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.42) { playNote(392, 0.15, 0.25, 'sine', 0.3); playNote(330, 0.47, 0.4, 'sine', 0.3); }
    else if (p.rnd < 0.7) {
      htLinnaPokeChime(1175, 0);
      if (big) { playNote(150, 0.3, 0.09, 'square', 0.12); playNote(130, 0.43, 0.12, 'square', 0.12); htLinnaPokeSplashSnd(0.75); }
    } else { htLinnaPokePlop(0.05); if (big) { playNote(150, 0.35, 0.09, 'square', 0.12); playNote(130, 0.48, 0.12, 'square', 0.12); } }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, S, i, u, dir = rnd2 < 0.5 ? -1 : 1;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.42) {
      S = s * 1.8;
      htLinnaPokeLeaves(c, x, baseY - S * 0.6, S * 0.6, S * 0.6, k, big ? 7 : 4, '#5c8a4a', rnd2);
      var ox = x + dir * S * 0.02, oy = baseY - S * 0.62;
      if (big) {
        u = Math.max(0, (k - 0.25) / 0.75);
        htLinnaPokeOwl(c, ox - dir * u * u * S * 1.1, oy - u * S * 0.8, S * 0.09 * htLinnaPokeEase(k / 0.1), k, k > 0.25 ? Math.sin(k * 50) : null);
      } else htLinnaPokeOwl(c, ox, oy, S * 0.09 * htLinnaPokePop(k, 0.1, 0.78), k, null);
    } else if (rnd < 0.7) {
      S = s * 1.6;
      for (i = 0; i < 7; i++) {
        u = k * 1.1 - i * 0.03;
        if (u <= 0) continue;
        var a = u * 4 + i * 0.9, px = x + S * 0.2 + Math.cos(a) * S * (0.1 + u * 0.3), py = baseY - S * 0.45 - u * S * 0.5 + Math.sin(a * 1.3) * S * 0.12;
        artGlow(c, px, py, S * 0.07, '#e6ff96', 0.85);
        artCircle(c, px, py, S * 0.015, '#fbffd8', { line: false });
      }
      if (big) {
        // Sammakko loikkaa kaarena lätäkköön, roiske
        u = Math.max(0, Math.min(1, k / 0.5));
        var fx = x - dir * S * 0.55 + dir * u * S * 0.5, fy = baseY - S * 0.05 - Math.sin(u * Math.PI) * S * 0.35;
        artBlob(c, fx, fy - S * 0.04, S * 0.06, S * 0.045, '#6fd26a', { hi: 0.35 });
        artCircle(c, fx - S * 0.03, fy - S * 0.085, S * 0.022, '#6fd26a', {});
        artCircle(c, fx + S * 0.03, fy - S * 0.085, S * 0.022, '#6fd26a', {});
        c.fillStyle = '#2a2a3a';
        c.beginPath(); c.arc(fx - S * 0.03, fy - S * 0.088, S * 0.009, 0, Math.PI * 2); c.arc(fx + S * 0.03, fy - S * 0.088, S * 0.009, 0, Math.PI * 2); c.fill();
        if (k > 0.5) htLinnaPokeSplash(c, x - dir * S * 0.05, baseY - S * 0.05, S * 0.4, (k - 0.5) * 1.6, 8, '#9fd8c8', rnd2);
        htLinnaPokeRipple(c, x - dir * S * 0.05, baseY - S * 0.05, S * 0.2, (k - 0.5) * 2);
      }
    } else {
      S = s * 1.8;
      htLinnaPokePuffs(c, x - S * 0.1, baseY - S * 0.4, S * 0.05, k, big ? 5 : 3, rnd2 < 0.5 ? '#ffa890' : '#c9a0ff');
      if (big) {
        c.save();
        htLinnaPokeWobble(c, x, baseY, k, HT_LINNA_POKE_DUR);
        htLinnaPokeFace(c, x - S * 0.1, baseY - S * 0.13, S * 0.05, k, true, false);
        htLinnaPokeFace(c, x + S * 0.17, baseY - S * 0.08, S * 0.035, k, false, true);
        c.restore();
      }
    }
    c.restore();
  }
};
