'use strict';

// Pankkiholvi: linnan neljäs huone (HOME_ROOMS[3]). Takaseinän pyöreässä
// holvissa säilytetään tähtiä: kultainen nappi vie tähden kukkarosta holviin,
// hopeinen nostaa sen takaisin (pohjassa pitäminen toistaa, yhä nopeammin).
// Holvi kasvattaa korkoa: joka vuorokausi 1 tähti jokaista kymmentä talletettua
// kohden, vähintään 1 (BANK_RATE, BANK_DAY). Holvin kehällä kiertävä aurinko
// näyttää, kuinka pitkällä seuraava korko on. Pankkiin sopivat huonekalut
// ovat HOME_ITEMS-listan lopussa; niiden piirto ja napautus ovat tässä.

var BANK_ROOM = 3;
var BANK_DAY = 24 * 3600 * 1000;   // koron väli millisekunteina
var BANK_RATE = 0.1;               // korko per vuorokausi (pyöristetään, vähintään 1)
var BANK_MAX_DAYS = 7;             // pitkä poissaolo: korkoa enintään näin monelta päivältä
var bankStars = 0;                 // holvissa olevat tähdet
var bankT = 0;                     // korkokellon alku (Date.now()), 0 = holvi tyhjä
var bankUnseen = 0;                // kertynyt korko, jota ei ole vielä näytetty holvissa
var bankHold = null;               // { dir: 1 talletus / -1 nosto, next, rate }
var bankFly = [];                  // lentävät tähdet { x0, y0, x1, y1, t, dur }
var bankShake = { dir: 0, t: 0 };
var bankCeleb = null;              // korkojuhla { n, t }

function bankInterestFor(n) {
  return n > 0 ? Math.max(1, Math.round(n * BANK_RATE)) : 0;
}

// Laske kertynyt korko. Palauttaa lisätyt tähdet.
function bankAccrue(now) {
  var gain = 0, days = 0, g;
  now = now || Date.now();
  if (bankStars <= 0) { bankT = 0; return 0; }
  if (!bankT || bankT > now) {
    // Uusi talletus tai kello siirtynyt taaksepäin: kello alkaa nyt
    bankT = now;
    saveProgress();
    return 0;
  }
  while (now - bankT >= BANK_DAY && days < BANK_MAX_DAYS) {
    g = bankInterestFor(bankStars);
    bankStars += g;
    gain += g;
    bankT += BANK_DAY;
    days++;
  }
  if (now - bankT >= BANK_DAY) bankT = now;
  if (gain) {
    bankUnseen += gain;
    saveProgress();
  }
  return gain;
}

// Kuinka pitkällä seuraava korko on (0..1)
function bankDayFrac() {
  if (bankStars <= 0 || !bankT) return 0;
  return Math.min(1, Math.max(0, (Date.now() - bankT) / BANK_DAY));
}

// ---------- Mitat ----------
// Holvi takaseinällä, napit sen oikealla puolella (kauppaa ja kukkaroa kohti)
function bankVault() {
  var room = homeRoom(), h = viewH;
  var r = h * 0.19;
  var cx = room.x0 + (room.x1 - room.x0) * 0.45;
  var cy = room.wallTop + h * 0.29;
  var bx = Math.min(cx + r + h * 0.15, room.x1 - h * 0.09);
  var br = h * 0.068;
  return {
    cx: cx, cy: cy, r: r,
    dep: { x: bx, y: cy - h * 0.085, r: br },
    wd: { x: bx, y: cy + h * 0.1, r: br }
  };
}
// Kukkaron tähti kaupan yläreunassa (drawStarBalance)
function bankWalletPos() {
  var s = homeShopBox();
  return { x: s.x + viewH * 0.02 + viewH * 0.039, y: s.y + s.head * 0.5 };
}

// ---------- Syöte ----------
// Palauttaa true, jos napautus osui pankin nappiin
function bankTap(px, py) {
  if (homeRoomIdx !== BANK_ROOM) return false;
  var v = bankVault(), dx, dy, b, dir = 0;
  b = v.dep; dx = px - b.x; dy = py - b.y;
  if (dx * dx + dy * dy <= b.r * b.r * 1.5) dir = 1;
  b = v.wd; dx = px - b.x; dy = py - b.y;
  if (!dir && dx * dx + dy * dy <= b.r * b.r * 1.5) dir = -1;
  if (!dir) return false;
  bankStep(dir);
  bankHold = { dir: dir, next: 0.5, rate: 0.4 };
  return true;
}

function bankRelease() {
  bankHold = null;
}

// Yksi tähti holviin (dir 1) tai holvista kukkaroon (dir -1)
function bankStep(dir) {
  var v = bankVault(), w = bankWalletPos();
  var inV = { x: v.cx + (Math.random() - 0.5) * v.r * 0.5, y: v.cy + v.r * 0.35 };
  if (dir > 0) {
    if (starCoins <= 0) { bankRefuse(dir); return; }
    starCoins--;
    bankStars++;
    if (!bankT) bankT = Date.now();
    bankFly.push({ x0: w.x, y0: w.y, x1: inV.x, y1: inV.y, t: 0, dur: 0.55 });
    playNote(988 + Math.min(bankStars, 40) * 6, 0, 0.08, 'sine', 0.22);
    playNote(1319, 0.06, 0.1, 'sine', 0.16);
  } else {
    if (bankStars <= 0) { bankRefuse(dir); return; }
    bankStars--;
    starCoins++;
    if (bankStars === 0) bankT = 0;
    bankFly.push({ x0: inV.x, y0: inV.y, x1: w.x, y1: w.y, t: 0, dur: 0.55 });
    playNote(784, 0, 0.08, 'triangle', 0.22);
    playNote(659, 0.06, 0.1, 'triangle', 0.16);
  }
  saveProgress();
}

function bankRefuse(dir) {
  bankShake.dir = dir;
  bankShake.t = 0.5;
  bankHold = null;
  playNote(196, 0, 0.2, 'triangle', 0.25);
}

// Holviin tultaessa: kertynyt korko lentää näkyviin
function bankOnEnter() {
  bankAccrue();
  bankFly = [];
  bankHold = null;
  if (bankUnseen > 0) {
    bankCeleb = { n: bankUnseen, t: 0 };
    bankUnseen = 0;
    saveProgress();
    soundFanfare();
  } else {
    bankCeleb = null;
  }
}

// ---------- Päivitys ----------
function updateBank(dt) {
  var i, f, v;
  if (bankShake.t > 0) bankShake.t -= dt;
  if (bankHold) {
    bankHold.next -= dt;
    if (bankHold.next <= 0) {
      bankStep(bankHold.dir);
      if (bankHold) {
        bankHold.rate = Math.max(0.07, bankHold.rate * 0.8);
        bankHold.next = bankHold.rate;
      }
    }
  }
  for (i = bankFly.length - 1; i >= 0; i--) {
    f = bankFly[i];
    f.t += dt;
    if (f.t >= f.dur) {
      spawnSparkles(f.x1, f.y1, 4, '#ffe27a');
      bankFly.splice(i, 1);
    }
  }
  if (bankCeleb) {
    bankCeleb.t += dt;
    v = bankVault();
    if (bankCeleb.t < 1.6 && Math.random() < dt * 14) spawnSparkles(v.cx + (Math.random() - 0.5) * v.r, v.cy + (Math.random() - 0.3) * v.r, 3, '#ffe27a');
    if (bankCeleb.t > 3.6) bankCeleb = null;
  }
}

// ---------- Piirto ----------
// Takaseinän koristelevyt ja niitit (tausta, piirretään kerran)
function renderBankWall(b, room, h) {
  var x, y, pw = h * 0.16, ph = h * 0.13, row = 0;
  b.strokeStyle = 'rgba(90,70,40,0.22)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (y = room.wallTop; y < room.floorY - h * 0.04; y += ph, row++) {
    for (x = (row % 2) * pw * 0.5 - pw * 0.5; x < room.x1 + h * 0.02; x += pw) {
      roundRect(b, x + h * 0.004, y + h * 0.004, pw - h * 0.008, ph - h * 0.008, h * 0.01);
      b.stroke();
      b.fillStyle = 'rgba(120,90,50,0.3)';
      b.beginPath(); b.arc(x + h * 0.016, y + h * 0.016, h * 0.004, 0, Math.PI * 2); b.fill();
      b.beginPath(); b.arc(x + pw - h * 0.016, y + h * 0.016, h * 0.004, 0, Math.PI * 2); b.fill();
    }
  }
  // Seinälyhdyt holvin molemmin puolin
  var lx = [room.x0 + (room.x1 - room.x0) * 0.13, room.x0 + (room.x1 - room.x0) * 0.97], i;
  for (i = 0; i < lx.length; i++) {
    x = lx[i];
    if (i === 1 && x > room.x1 - h * 0.04) x = room.x1 - h * 0.04;
    y = room.wallTop + h * 0.1;
    var g = b.createRadialGradient(x, y, h * 0.01, x, y, h * 0.1);
    g.addColorStop(0, 'rgba(255,220,130,0.5)');
    g.addColorStop(1, 'rgba(255,220,130,0)');
    b.fillStyle = g;
    b.beginPath(); b.arc(x, y, h * 0.1, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#8a5a30';
    b.fillRect(x - h * 0.006, y + h * 0.015, h * 0.012, h * 0.04);
    b.fillStyle = '#ffd24f';
    b.beginPath(); b.moveTo(x, y - h * 0.025); b.quadraticCurveTo(x + h * 0.018, y, x, y + h * 0.018); b.quadraticCurveTo(x - h * 0.018, y, x, y - h * 0.025); b.fill();
  }
}

// Tähtikasa holvin sisällä: n tähteä riveittäin alhaalta ylös
function drawBankPile(c, cx, baseY, r, n) {
  var shown = Math.min(n, 45), row = 0, inRow = 0, perRow = 8, sr = r * 0.11, k, x, y;
  for (k = 0; k < shown; k++) {
    if (inRow >= perRow) { row++; inRow = 0; perRow = Math.max(3, perRow - 1); }
    x = cx + (inRow - (perRow - 1) / 2) * sr * 1.7 + (row % 2) * sr * 0.4;
    y = baseY - row * sr * 1.25;
    drawStar(c, x, y, sr, (k * 0.7) % 1 - 0.5, 0);
    inRow++;
  }
}

// Holvi: kultainen kehys, auki kääntynyt ovi, sisällä tähtikasa, yläpuolella
// saldokyltti ja kehällä korkoaurinko
function drawBankVault(c) {
  var v = bankVault(), h = viewH, cx = v.cx, cy = v.cy, r = v.r, i, a;
  // Varjo ja kehys
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.arc(cx + r * 0.04, cy + r * 0.07, r * 1.08, 0, Math.PI * 2); c.fill();
  artCircle(c, cx, cy, r * 1.05, '#d9a93a', { lineColor: '#8a6420', line: Math.max(2, r * 0.03) });
  // Korkorengas: harmaa ura ja kultainen kaari, aurinko kaaren kärjessä
  var frac = bankDayFrac();
  c.strokeStyle = 'rgba(90,60,20,0.35)';
  c.lineWidth = r * 0.07;
  c.beginPath(); c.arc(cx, cy, r * 0.96, 0, Math.PI * 2); c.stroke();
  if (bankStars > 0) {
    a = -Math.PI / 2 + frac * Math.PI * 2;
    c.strokeStyle = '#fff2a8';
    c.beginPath(); c.arc(cx, cy, r * 0.96, -Math.PI / 2, a); c.stroke();
    var sx = cx + Math.cos(a) * r * 0.96, sy = cy + Math.sin(a) * r * 0.96;
    artGlow(c, sx, sy, r * 0.22, '#ffe678', 0.6);
    artCircle(c, sx, sy, r * 0.075, '#ffcf3a', { lineColor: '#d98a00' });
    c.strokeStyle = '#ffb62e';
    c.lineWidth = Math.max(1.5, r * 0.02);
    for (i = 0; i < 8; i++) {
      var ra = i * Math.PI / 4 + globalT;
      c.beginPath();
      c.moveTo(sx + Math.cos(ra) * r * 0.1, sy + Math.sin(ra) * r * 0.1);
      c.lineTo(sx + Math.cos(ra) * r * 0.14, sy + Math.sin(ra) * r * 0.14);
      c.stroke();
    }
  }
  // Sisus: tumma holvi, hyllyt ja tähtikasa
  var ig = c.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r * 0.85);
  ig.addColorStop(0, '#5a4a7a');
  ig.addColorStop(1, '#2a2040');
  c.fillStyle = ig;
  c.beginPath(); c.arc(cx, cy, r * 0.84, 0, Math.PI * 2); c.fill();
  c.save();
  c.beginPath(); c.arc(cx, cy, r * 0.84, 0, Math.PI * 2); c.clip();
  if (bankStars > 0) artGlow(c, cx, cy + r * 0.45, r * (0.5 + Math.min(bankStars, 45) / 45 * 0.6), '#ffe678', 0.45);
  c.fillStyle = '#6a5a8a';
  c.fillRect(cx - r, cy + r * 0.58, r * 2, r * 0.3);
  drawBankPile(c, cx, cy + r * 0.52, r, bankStars);
  c.restore();
  // Auki kääntynyt ovi vasemmalla (sivulta nähtynä kapea)
  var dx = cx - r * 1.12;
  c.fillStyle = '#8a8298';
  c.beginPath();
  if (c.ellipse) c.ellipse(dx, cy, r * 0.2, r * 0.92, 0, 0, Math.PI * 2); else c.rect(dx - r * 0.2, cy - r * 0.9, r * 0.4, r * 1.8);
  c.fill();
  c.fillStyle = '#b9b4c8';
  c.beginPath();
  if (c.ellipse) c.ellipse(dx - r * 0.04, cy, r * 0.15, r * 0.84, 0, 0, Math.PI * 2); else c.rect(dx - r * 0.15, cy - r * 0.84, r * 0.3, r * 1.68);
  c.fill();
  c.strokeStyle = '#6a6278';
  c.lineWidth = Math.max(2, r * 0.035);
  for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(dx - r * 0.12, cy + i * r * 0.3); c.lineTo(dx + r * 0.05, cy + i * r * 0.3); c.stroke(); }
  // Saranat
  c.fillStyle = '#d9a93a';
  c.fillRect(dx + r * 0.1, cy - r * 0.55, r * 0.14, r * 0.12);
  c.fillRect(dx + r * 0.1, cy + r * 0.43, r * 0.14, r * 0.12);
  // Saldokyltti holvin yläpuolella
  var txt = String(bankStars);
  var ts = h * 0.028;
  c.font = 'bold ' + Math.round(ts * 1.6) + 'px ' + UI_FONT;
  var tw = c.measureText(txt).width, pw = ts * 2.8 + tw, py = cy - r * 1.05 - ts * 1.4;
  c.fillStyle = '#fff6d8';
  roundRect(c, cx - pw / 2, py - ts * 1.1, pw, ts * 2.2, ts * 1.1);
  c.fill();
  c.strokeStyle = '#d9a93a';
  c.lineWidth = Math.max(2, h * 0.004);
  c.stroke();
  drawStar(c, cx - pw / 2 + ts * 1.25, py, ts * 0.8, 0, 0.5);
  c.fillStyle = '#7a3cb8';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(txt, cx - pw / 2 + ts * 2.3, py + ts * 0.05);
  c.textBaseline = 'alphabetic';
  // Korkojuhla: "+n" nousee holvista
  if (bankCeleb) {
    var k = bankCeleb.t, al = Math.min(1, (3.6 - k) * 1.5);
    c.globalAlpha = Math.max(0, al);
    var gy = cy - r * 0.2 - Math.min(k, 1) * r * 0.5;
    c.font = 'bold ' + Math.round(h * 0.07) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.lineWidth = h * 0.012;
    c.strokeStyle = '#7a3cb8';
    c.strokeText('+' + bankCeleb.n, cx, gy);
    c.fillStyle = '#ffe27a';
    c.fillText('+' + bankCeleb.n, cx, gy);
    c.globalAlpha = 1;
  }
  drawBankButton(c, v.dep, 1);
  drawBankButton(c, v.wd, -1);
}

// Nappi: kultainen (tähti ja nuoli holviin päin) tai hopeinen (nuoli ulos)
function drawBankButton(c, b, dir) {
  var pressed = bankHold && bankHold.dir === dir;
  var shake = bankShake.t > 0 && bankShake.dir === dir ? Math.sin(globalT * 50) * b.r * 0.08 : 0;
  var x = b.x + shake, y = b.y + (pressed ? b.r * 0.08 : 0), r = b.r;
  var empty = dir > 0 ? starCoins <= 0 : bankStars <= 0;
  c.fillStyle = dir > 0 ? '#b8860b' : '#6a6278';
  c.beginPath(); c.arc(x, y + (pressed ? r * 0.04 : r * 0.12), r, 0, Math.PI * 2); c.fill();
  c.globalAlpha = empty ? 0.55 : 1;
  artCircle(c, x, y, r, dir > 0 ? '#ffd24f' : '#d4d0e0', { lineColor: dir > 0 ? '#b8860b' : '#6a6278' });
  artHighlight(c, x - r * 0.3, y - r * 0.4, r * 0.3, r * 0.18, 0.5);
  drawStar(c, x + dir * r * 0.22, y, r * 0.34, 0, 0);
  // Nuoli: talletus osoittaa vasemmalle (holviin), nosto oikealle (kukkaroon)
  var ax = x - dir * r * 0.3;
  c.fillStyle = dir > 0 ? '#7a4a00' : '#4a4458';
  c.beginPath();
  c.moveTo(ax - dir * r * 0.32, y);
  c.lineTo(ax + dir * r * 0.02, y - r * 0.3);
  c.lineTo(ax + dir * r * 0.02, y + r * 0.3);
  c.closePath();
  c.fill();
  c.fillRect(Math.min(ax, ax + dir * r * 0.2), y - r * 0.1, r * 0.2, r * 0.2);
  c.globalAlpha = 1;
}

// Lentävät tähdet kaaressa kukkaron ja holvin välillä (piirretään kaupan päälle)
function drawBankFly(c) {
  var i, f, k, x, y;
  for (i = 0; i < bankFly.length; i++) {
    f = bankFly[i];
    k = easeInOutSine(f.t / f.dur);
    x = f.x0 + (f.x1 - f.x0) * k;
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    drawStar(c, x, y, viewH * 0.022, k * 4, 0.6);
  }
}

// ---------- Pankin huonekalut ----------
// Palauttaa true, jos tavara on pankkitavara ja piirrettiin
function drawBankItem(c, it, x, y, s) {
  var i, k;
  if (it.id === 'piggybank') {
    var wob = it.coinT > 0 ? Math.sin(it.coinT * 30) * s * 0.02 : 0;
    c.fillStyle = '#e86a9a';
    for (i = -1; i <= 1; i += 2) { c.fillRect(x + i * s * 0.2 - s * 0.05, y - s * 0.14, s * 0.1, s * 0.14); c.fillRect(x + i * s * 0.08 - s * 0.05, y - s * 0.14, s * 0.1, s * 0.14); }
    artBlob(c, x + wob, y - s * 0.34, s * 0.36, s * 0.26, '#ff9ec4', { lineColor: '#c94f7e' });
    artCircle(c, x + s * 0.34 + wob, y - s * 0.34, s * 0.1, '#ff7bac', { lineColor: '#c94f7e' });
    c.fillStyle = '#c94f7e';
    c.beginPath(); c.arc(x + s * 0.32 + wob, y - s * 0.35, s * 0.02, 0, Math.PI * 2); c.arc(x + s * 0.37 + wob, y - s * 0.35, s * 0.02, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.moveTo(x + s * 0.12, y - s * 0.56); c.lineTo(x + s * 0.24, y - s * 0.66); c.lineTo(x + s * 0.26, y - s * 0.52); c.closePath(); c.fill();
    c.fillStyle = '#3a3346';
    c.beginPath(); c.arc(x + s * 0.18 + wob, y - s * 0.42, s * 0.03, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.1 + wob, y - s * 0.6, s * 0.18, s * 0.03);
    c.strokeStyle = '#c94f7e';
    c.lineWidth = Math.max(1.5, s * 0.025);
    c.beginPath(); c.arc(x - s * 0.4, y - s * 0.4, s * 0.05, 0, Math.PI * 1.5); c.stroke();
    if (it.coinT > 0) {
      // Kolikko putoaa rakoon
      var cy = y - s * 0.95 + (1 - it.coinT / 0.6) * s * 0.35;
      drawStar(c, x, cy, s * 0.08, 0, 0.4);
    }
    return true;
  }
  if (it.id === 'keys') {
    c.fillStyle = '#a9743f';
    roundRect(c, x - s * 0.45, y - s * 0.3, s * 0.9, s * 0.25, s * 0.05);
    c.fill();
    var sw = it.swingT > 0 ? Math.sin(globalT * 18) * 0.35 * it.swingT : 0;
    var kc = ['#ffd24f', '#d4d0e0', '#ff9f3a'];
    for (i = 0; i < 3; i++) {
      var kx = x + (i - 1) * s * 0.28, ky = y - s * 0.12;
      c.fillStyle = '#6a6278';
      c.beginPath(); c.arc(kx, ky, s * 0.025, 0, Math.PI * 2); c.fill();
      c.save();
      c.translate(kx, ky);
      c.rotate(sw * (i % 2 ? -1 : 1));
      c.strokeStyle = kc[i];
      c.lineWidth = Math.max(2, s * 0.045);
      c.beginPath(); c.arc(0, s * 0.1, s * 0.07, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(0, s * 0.17); c.lineTo(0, s * 0.44); c.moveTo(0, s * 0.36); c.lineTo(s * 0.08, s * 0.36); c.moveTo(0, s * 0.42); c.lineTo(s * 0.06, s * 0.42); c.stroke();
      c.restore();
    }
    return true;
  }
  if (it.id === 'goldpile') {
    // Kolikkopinot ja tähdet
    var cols = [[-0.28, 3], [0, 5], [0.26, 4]];
    for (i = 0; i < cols.length; i++) {
      for (k = 0; k < cols[i][1]; k++) {
        var gx = x + cols[i][0] * s, gy = y - s * 0.05 - k * s * 0.07;
        c.fillStyle = '#c9971f';
        c.beginPath();
        if (c.ellipse) c.ellipse(gx, gy + s * 0.02, s * 0.13, s * 0.045, 0, 0, Math.PI * 2); else c.arc(gx, gy, s * 0.1, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffd24f';
        c.beginPath();
        if (c.ellipse) c.ellipse(gx, gy, s * 0.13, s * 0.045, 0, 0, Math.PI * 2); else c.arc(gx, gy, s * 0.1, 0, Math.PI * 2);
        c.fill();
      }
    }
    drawStar(c, x - s * 0.13, y - s * 0.12, s * 0.07, 0.3, 0);
    drawStar(c, x + s * 0.14, y - s * 0.4, s * 0.08, -0.2, it.phase > 0 ? 1 : 0.3);
    return true;
  }
  if (it.id === 'moneybags') {
    for (i = 0; i < 2; i++) {
      var mx = x + (i ? s * 0.2 : -s * 0.16), ms = i ? 0.8 : 1;
      artBlob(c, mx, y - s * 0.26 * ms, s * 0.25 * ms, s * 0.25 * ms, '#d9b37a', { lineColor: '#8a6a40' });
      c.fillStyle = '#c9a060';
      c.beginPath(); c.moveTo(mx - s * 0.1 * ms, y - s * 0.5 * ms); c.lineTo(mx + s * 0.1 * ms, y - s * 0.5 * ms); c.lineTo(mx + s * 0.14 * ms, y - s * 0.62 * ms); c.lineTo(mx - s * 0.14 * ms, y - s * 0.62 * ms); c.closePath(); c.fill();
      c.fillStyle = '#ff5f7e';
      c.fillRect(mx - s * 0.11 * ms, y - s * 0.52 * ms, s * 0.22 * ms, s * 0.04 * ms);
      drawStar(c, mx, y - s * 0.24 * ms, s * 0.09 * ms, 0, 0);
    }
    return true;
  }
  if (it.id === 'safe') {
    artRoundRect(c, x - s * 0.36, y - s * 0.72, s * 0.72, s * 0.7, s * 0.06, '#7a8aa8', { lineColor: '#4a5670' });
    c.fillStyle = '#4a5670';
    c.fillRect(x - s * 0.3, y - s * 0.04, s * 0.1, s * 0.04);
    c.fillRect(x + s * 0.2, y - s * 0.04, s * 0.1, s * 0.04);
    if (it.on) {
      // Auki: sisällä jalokiviä ja kultaharkko
      c.fillStyle = '#2a2040';
      c.fillRect(x - s * 0.28, y - s * 0.64, s * 0.56, s * 0.54);
      c.fillStyle = '#ffd24f';
      c.fillRect(x - s * 0.2, y - s * 0.22, s * 0.24, s * 0.1);
      artCircle(c, x + s * 0.12, y - s * 0.2, s * 0.06, '#ff5f7e');
      artCircle(c, x - s * 0.08, y - s * 0.45, s * 0.06, '#5fa8ff');
      artCircle(c, x + s * 0.12, y - s * 0.48, s * 0.05, '#6fd66f');
      c.fillStyle = '#9aa6c0';
      c.fillRect(x - s * 0.42, y - s * 0.66, s * 0.1, s * 0.58);
    } else {
      artCircle(c, x, y - s * 0.38, s * 0.15, '#c9cfe0', { lineColor: '#4a5670' });
      c.strokeStyle = '#4a5670';
      c.lineWidth = Math.max(1.5, s * 0.03);
      for (i = 0; i < 6; i++) {
        var da = i * Math.PI / 3 + (it.phase || 0) * 4;
        c.beginPath(); c.moveTo(x + Math.cos(da) * s * 0.1, y - s * 0.38 + Math.sin(da) * s * 0.1); c.lineTo(x + Math.cos(da) * s * 0.14, y - s * 0.38 + Math.sin(da) * s * 0.14); c.stroke();
      }
      c.fillStyle = '#ffd24f';
      c.fillRect(x + s * 0.2, y - s * 0.44, s * 0.05, s * 0.12);
    }
    return true;
  }
  if (it.id === 'gemcase') {
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.3, y - s * 0.4, s * 0.6, s * 0.4);
    c.fillStyle = '#8a5a30';
    c.fillRect(x - s * 0.34, y - s * 0.44, s * 0.68, s * 0.06);
    var gc = ['#ff5f7e', '#5fa8ff', '#6fd66f', '#c9a0ff'];
    for (i = 0; i < 4; i++) {
      var ex = x + (i - 1.5) * s * 0.13, ey = y - s * 0.52 - (i % 2) * s * 0.05;
      c.fillStyle = gc[i];
      c.beginPath(); c.moveTo(ex, ey - s * 0.06); c.lineTo(ex + s * 0.05, ey); c.lineTo(ex, ey + s * 0.06); c.lineTo(ex - s * 0.05, ey); c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(210,235,255,0.35)';
    c.fillRect(x - s * 0.32, y - s * 0.78, s * 0.64, s * 0.34);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1.5, s * 0.02);
    c.strokeRect(x - s * 0.32, y - s * 0.78, s * 0.64, s * 0.34);
    c.beginPath(); c.moveTo(x - s * 0.24, y - s * 0.74); c.lineTo(x - s * 0.14, y - s * 0.5); c.stroke();
    if (it.spinT > 0) {
      for (i = 0; i < 3; i++) drawStar(c, x + Math.sin(globalT * 7 + i * 2) * s * 0.22, y - s * 0.62 + Math.cos(globalT * 5 + i) * s * 0.1, s * 0.035, globalT * 3, 0.8);
    }
    return true;
  }
  if (it.id === 'counter') {
    // Pankkitiski: puinen tiski, lasiruutu ja kello
    artRoundRect(c, x - s * 0.55, y - s * 0.5, s * 1.1, s * 0.5, s * 0.04, '#c98b4a', { lineColor: '#8a5a30' });
    c.fillStyle = '#8a5a30';
    c.fillRect(x - s * 0.6, y - s * 0.56, s * 1.2, s * 0.07);
    c.fillStyle = '#ffd24f';
    for (i = -1; i <= 1; i++) drawStar(c, x + i * s * 0.3, y - s * 0.26, s * 0.06, 0, 0);
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.52, y - s * 1.0, s * 0.04, s * 0.45);
    c.fillRect(x + s * 0.48, y - s * 1.0, s * 0.04, s * 0.45);
    c.fillStyle = 'rgba(210,235,255,0.25)';
    c.fillRect(x - s * 0.48, y - s * 1.0, s * 0.96, s * 0.44);
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.55, y - s * 1.04, s * 1.1, s * 0.05);
    // Kello tiskillä
    var ring = it.bellT > 0 ? Math.sin(globalT * 40) * 0.2 : 0;
    c.save();
    c.translate(x + s * 0.3, y - s * 0.56);
    c.rotate(ring);
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.arc(0, 0, s * 0.08, Math.PI, 0); c.fill();
    c.fillRect(-s * 0.1, -s * 0.01, s * 0.2, s * 0.02);
    c.beginPath(); c.arc(0, -s * 0.09, s * 0.02, 0, Math.PI * 2); c.fill();
    c.restore();
    return true;
  }
  if (it.id === 'crown') {
    // Kruunu tyynyllä jalustan päällä
    artRoundRect(c, x - s * 0.16, y - s * 0.4, s * 0.32, s * 0.4, s * 0.03, '#c9a0ff', { lineColor: '#7a4fb0' });
    c.fillStyle = '#7a4fb0';
    c.fillRect(x - s * 0.22, y - s * 0.04, s * 0.44, s * 0.04);
    artBlob(c, x, y - s * 0.44, s * 0.26, s * 0.07, '#ff5f7e', { lineColor: '#b8325a' });
    var cg = it.phase > 0 ? 1 : 0.25 + Math.sin(globalT * 2) * 0.1;
    artGlow(c, x, y - s * 0.62, s * 0.35, '#ffe678', cg * 0.5);
    c.fillStyle = '#ffd24f';
    c.beginPath();
    c.moveTo(x - s * 0.2, y - s * 0.5);
    c.lineTo(x - s * 0.22, y - s * 0.76);
    c.lineTo(x - s * 0.1, y - s * 0.62);
    c.lineTo(x, y - s * 0.8);
    c.lineTo(x + s * 0.1, y - s * 0.62);
    c.lineTo(x + s * 0.22, y - s * 0.76);
    c.lineTo(x + s * 0.2, y - s * 0.5);
    c.closePath();
    c.fill();
    c.strokeStyle = '#b8860b';
    c.lineWidth = Math.max(1.5, s * 0.02);
    c.stroke();
    artCircle(c, x, y - s * 0.58, s * 0.035, '#5fa8ff');
    artCircle(c, x - s * 0.12, y - s * 0.56, s * 0.025, '#ff5f7e');
    artCircle(c, x + s * 0.12, y - s * 0.56, s * 0.025, '#6fd66f');
    return true;
  }
  return false;
}

// Pankkitavaran napautus: palauttaa true, jos tavara oli pankkitavara
function bankItemTap(it) {
  var i, s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH;
  if (it.id === 'piggybank') {
    it.coinT = 0.6;
    playNote(1319, 0, 0.06, 'sine', 0.2);
    playNote(262, 0.35, 0.12, 'square', 0.08);
    playNote(220, 0.48, 0.14, 'square', 0.08);
  } else if (it.id === 'keys') {
    it.swingT = 1.2;
    for (i = 0; i < 4; i++) playNote(2000 + i * 180, i * 0.07, 0.06, 'sine', 0.12);
  } else if (it.id === 'goldpile') {
    for (i = 0; i < 5; i++) playNote(1500 + (i % 2) * 300, i * 0.08, 0.07, 'sine', 0.15);
    spawnSparkles(x, y - s * 0.3, 14, '#ffd24f');
  } else if (it.id === 'moneybags') {
    playNote(330, 0, 0.1, 'triangle', 0.2);
    playNote(1319, 0.1, 0.08, 'sine', 0.15);
    spawnSparkles(x, y - s * 0.6, 8, '#ffd24f');
  } else if (it.id === 'safe') {
    it.on = !it.on;
    for (i = 0; i < 3; i++) playNote(1200, i * 0.1, 0.03, 'square', 0.06);
    playNote(it.on ? 784 : 392, 0.35, 0.15, 'triangle', 0.25);
    if (it.on) spawnSparkles(x, y - s * 0.4, 14, '#c9a0ff');
  } else if (it.id === 'gemcase') {
    it.spinT = 1.8;
    playNote(1568, 0, 0.1, 'sine', 0.18);
    playNote(2093, 0.1, 0.16, 'sine', 0.16);
  } else if (it.id === 'counter') {
    it.bellT = 1.0;
    playNote(1760, 0, 0.5, 'sine', 0.3);
    playNote(2637, 0, 0.4, 'sine', 0.1);
  } else if (it.id === 'crown') {
    playNote(784, 0, 0.12, 'sine', 0.25);
    playNote(988, 0.1, 0.12, 'sine', 0.25);
    playNote(1175, 0.2, 0.25, 'sine', 0.25);
    spawnSparkles(x, y - s * 0.7, 16, '#ffe27a');
  } else {
    return false;
  }
  return true;
}

function updateBankItem(it, dt) {
  if (it.coinT > 0) it.coinT -= dt;
  if (it.bellT > 0) it.bellT -= dt;
}
