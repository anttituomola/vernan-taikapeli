'use strict';

// Pupukahvila: kiireetön hoivakenttä ilman sydämiä ja ilman liikkumista.
// Pupuasiakas tilaa evästä kuplassa (kuvalla, ei sanoina); napauta oikea
// eväs hyllyltä tarjottimeen. Ensin yksi eväs per tilaus, lopuksi kaksi.
// Väärä eväs vain ravistaa. Viisi tilausta. Tiskin kello, pöydän kakku ja
// kuppi sekä ikkunan kukkaruukku ovat tökättäviä koristeita (props.js).

var CAFE_ORDERS = 5;
var CAFE_FOODS = ['carrot', 'apple', 'berry'];
var cafe = {
  orders: [], served: 0, want: [], got: [],
  customer: { hop: 0, earT: 0, happyT: 0, inT: 0 },
  serveT: 0, finishT: 0, wrongT: 0
};
var CAFE_WOOD = '#a9743f';
var CAFE_WOOD_LINE = '#5a3a18';

function cafeFoodPos(i) {
  return { x: viewW * (0.14 + i * 0.11), y: viewH * 0.46 };
}
function cafeTrayPos() {
  return { x: viewW * 0.55, y: viewH * 0.72 };
}
function cafeCustomerPos() {
  return { x: viewW * 0.84, y: viewH * 0.78 };
}

function cafeNextOrder() {
  cafe.want = cafe.orders[cafe.served].slice();
  cafe.got = [];
  cafe.customer.inT = 0.8;
  cafe.customer.happyT = 0;
  cafe.customer.hop = 1;
}

function initCafe() {
  var i, k, tmp;
  var singles = [['carrot'], ['apple']], doubles = [['carrot', 'apple'], ['apple', 'berry'], ['carrot', 'berry']];
  for (i = singles.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = singles[i]; singles[i] = singles[k]; singles[k] = tmp; }
  for (i = doubles.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = doubles[i]; doubles[i] = doubles[k]; doubles[k] = tmp; }
  tasks = [];
  cafe.orders = [singles[0], singles[1], doubles[0], doubles[1], doubles[2]];
  cafe.served = 0;
  cafe.serveT = 0;
  cafe.finishT = 0;
  cafe.wrongT = 0;
  cafe.customer.earT = 0;
  cafeNextOrder();
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
  princess.facing = 1;
  princess.walkPhase = 0;
  cafeSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnCafe() {}
function resizeCafe() {
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
  cafeSetupProps();
}

function handleCafeTap(px, py) {
  if (!running || celebrating) return;
  var i, p, dx, dy;
  if (cafe.want.length && cafe.customer.inT <= 0) {
    for (i = 0; i < CAFE_FOODS.length; i++) {
      p = cafeFoodPos(i);
      dx = px - p.x; dy = py - p.y;
      if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
        var f = CAFE_FOODS[i];
        var tp = cafeTrayPos();
        if (cafe.want.indexOf(f) >= 0 && cafe.got.indexOf(f) < 0) {
          cafe.got.push(f);
          spawnSparkles(tp.x, tp.y - viewH * 0.08, 12, '#ffe27a');
          playNote(880, 0, 0.12, 'sine', 0.3);
          playNote(1175, 0.08, 0.15, 'sine', 0.25);
          if (cafe.got.length === cafe.want.length) {
            cafe.served++;
            cafe.customer.happyT = 1.4;
            cafe.serveT = 1.4;
            cafe.want = [];
            spawnSparkles(tp.x, tp.y - viewH * 0.12, 20, '#ff9fd0');
            playNote(659, 0, 0.2, 'triangle', 0.35);
            playNote(880, 0.1, 0.25, 'triangle', 0.35);
            if (cafe.served >= CAFE_ORDERS) cafe.finishT = 0.9;
          }
        } else {
          cafe.wrongT = 0.5;
          playNote(220, 0, 0.15, 'sine', 0.2);
        }
        return;
      }
    }
  }
  // Asiakkaan napautus: hyppy ja iloinen ääni
  p = cafeCustomerPos();
  if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
    cafe.customer.hop = 1;
    playNote(1300, 0, 0.08, 'sine', 0.25);
    playNote(1600, 0.07, 0.1, 'sine', 0.2);
    return;
  }
  // Koristeet (kello, kakku, kuppi, kukkaruukku) vain, kun napautus ei osunut peliin
  propsTap(px + camX, py);
}

function updateCafe(dt) {
  var k = cafe.customer;
  k.earT += dt * 3;
  if (k.hop > 0) k.hop = Math.max(0, k.hop - dt * 3);
  if (k.inT > 0) k.inT -= dt;
  if (cafe.wrongT > 0) cafe.wrongT -= dt;
  if (cafe.serveT > 0) {
    cafe.serveT -= dt;
    if (cafe.serveT <= 0 && cafe.served < CAFE_ORDERS) cafeNextOrder();
  }
  if (cafe.finishT > 0 && !celebrating) {
    cafe.finishT -= dt;
    if (cafe.finishT <= 0) startCelebration();
  }
  if (k.happyT > 0) {
    k.happyT -= dt;
    k.hop = Math.abs(Math.sin(globalT * 10));
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Koristeet (tökättävät) ----------
// Pöytä (vasemmalla lattialla) ja ikkunalauta ovat taustassa; niiden päällä
// olevat kakku, kuppi ja kukkaruukku sekä tiskin kello piirretään joka ruudulla.
function cafeSetupProps() {
  var vw = viewW, h = viewH, tx = vw * 0.15, ty = h * 0.86;
  propsReset();
  propAdd({ x: vw * 0.75, y: h * 0.665, r: h * 0.04, hy: h * 0.025, color: '#ffd24f', amp: 0.1, note: 1760, draw: cafeDrawBell, poke: cafePokeBell });
  propAdd({ x: tx - h * 0.045, y: ty - h * 0.006, r: h * 0.05, hy: h * 0.04, color: '#ff9ec6', amp: 0.08, note: 660, cherryT: -1, candleT: -1,
    draw: cafeDrawCake, poke: cafePokeCake, update: cafeUpdateCake });
  propAdd({ x: tx + h * 0.05, y: ty - h * 0.006, r: h * 0.035, hy: h * 0.02, color: '#fff6e0', amp: 0.1, note: 988, steamT: -1, heart: false,
    draw: cafeDrawCup, poke: cafePokeCup, update: cafeUpdateCup });
  propAdd({ x: vw * 0.62 - h * 0.06, y: h * 0.422, r: h * 0.04, hy: h * 0.045, color: '#ff7bac', amp: 0.12, note: 880, draw: cafeDrawPot, poke: cafePokePot });
}

// Tiskikello: jalusta, kupu ja nuppi. Soi kirkkaasti; asiakas hypähtää.
function cafeDrawBell(c, p) {
  var s = viewH * 0.03;
  artShadow(c, 0, s * 0.1, s * 1.2, s * 0.25, 0.16);
  artRoundRect(c, -s * 1.0, -s * 0.22, s * 2.0, s * 0.26, s * 0.1, '#5a3a18', { lineColor: '#2e1c08' });
  c.beginPath(); c.arc(0, -s * 0.2, s * 0.85, Math.PI, 0); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.05, -s * 0.2, s * 0.85, { lineColor: '#a67a10' });
  artHighlight(c, -s * 0.35, -s * 0.7, s * 0.25, s * 0.14, 0.5);
  artCircle(c, 0, -s * 1.12, s * 0.16, '#5a3a18', { lineColor: '#2e1c08' });
}
function cafePokeBell(p) {
  playNote(2637, 0.08, 0.6, 'sine', 0.14);
  cafe.customer.hop = 1;
}

// Kakku lautasella: kaksi kerrosta, kermaa ja kirsikka. Kirsikka pomppaa
// tökkäyksestä; viidennellä kerralla kakkuun syttyy kynttilä (yllätys).
function cafeDrawCake(c, p) {
  var s = viewH * 0.03, lift = 0, fl;
  if (p.cherryT >= 0) lift = Math.sin(Math.min(1, p.cherryT / 0.5) * Math.PI) * s * 1.2;
  artBlob(c, 0, 0, s * 1.5, s * 0.35, '#f7f0ff', { lineColor: '#b9a6cc', shadeTo: '#e3d8f5' });
  artRoundRect(c, -s * 1.1, -s * 1.1, s * 2.2, s * 1.1, s * 0.25, '#ffb3c6', { lineColor: '#b85a78' });
  artRoundRect(c, -s * 0.75, -s * 1.85, s * 1.5, s * 0.8, s * 0.22, '#ffd1dc', { lineColor: '#b85a78' });
  artBlob(c, 0, -s * 1.85, s * 0.8, s * 0.22, '#fffaf0', { lineColor: '#d9b8a0' });
  artCircle(c, 0, -s * 2.15 - lift, s * 0.22, '#ff4d5e', { lineColor: '#8a1a28', hi: 0.5 });
  if (p.candleT >= 0) {
    fl = 1 + Math.sin(globalT * 25) * 0.15;
    artRoundRect(c, s * 0.37, -s * 2.6, s * 0.16, s * 0.75, s * 0.06, '#7fd4ff', { lineColor: '#2a7ab8' });
    artGlow(c, s * 0.45, -s * 2.8, s * 0.7 * fl, '#ffb347', 0.5);
    artBlob(c, s * 0.45, -s * 2.78, s * 0.12, s * 0.22 * fl, '#ffe94f', { lineColor: '#ff8f3a' });
  }
}
function cafePokeCake(p) {
  p.cherryT = 0;
  if (p.n % 5 === 0 && p.candleT < 0) {
    p.candleT = 0;
    spawnSparkles(p.x + viewH * 0.013, p.y - viewH * 0.08, 10, '#ffe27a');
    playNote(1047, 0.05, 0.2, 'triangle', 0.25);
    playNote(1319, 0.15, 0.2, 'triangle', 0.25);
    playNote(1568, 0.25, 0.4, 'triangle', 0.25);
  }
}
function cafeUpdateCake(p, dt) {
  if (p.cherryT >= 0) { p.cherryT += dt; if (p.cherryT > 0.5) p.cherryT = -1; }
  if (p.candleT >= 0) { p.candleT += dt; if (p.candleT > 4) p.candleT = -1; }
}

// Kaakaokuppi tassilla: höyryää tökkäyksestä, joka kolmas höyry on sydän.
function cafeDrawCup(c, p) {
  var s = viewH * 0.022, i, k, a, yy;
  artBlob(c, 0, 0, s * 1.3, s * 0.3, '#f7f0ff', { lineColor: '#b9a6cc', shadeTo: '#e3d8f5' });
  artRoundRect(c, -s * 0.8, -s * 1.3, s * 1.6, s * 1.3, s * 0.3, '#fff6e0', { lineColor: '#b89a74', shadeTo: '#e8d6c0' });
  c.strokeStyle = '#b89a74';
  c.lineWidth = Math.max(1.5, s * 0.22);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 0.95, -s * 0.72, s * 0.35, -Math.PI / 2, Math.PI / 2); c.stroke();
  artBlob(c, 0, -s * 1.3, s * 0.62, s * 0.16, '#7a4a2a', { line: false });
  if (p.steamT >= 0) {
    k = p.steamT / 1.4;
    a = 0.7 * (1 - k);
    yy = -s * 1.6 - k * s * 2.2;
    if (p.heart) {
      c.globalAlpha = a;
      drawHeartShape(c, 0, yy - s * 0.4, s * 0.55, true);
      c.globalAlpha = 1;
    } else {
      for (i = 0; i < 3; i++) artCircle(c, (i - 1) * s * 0.45 + Math.sin(globalT * 4 + i) * s * 0.15, yy - (i % 2) * s * 0.3, s * 0.22, '#ffffff', { line: false, alpha: a });
    }
  }
}
function cafePokeCup(p) {
  p.steamT = 0;
  p.heart = p.n % 3 === 0;
  if (p.heart) {
    playNote(1319, 0.05, 0.25, 'sine', 0.2);
    playNote(1760, 0.15, 0.3, 'sine', 0.2);
  }
}
function cafeUpdateCup(p, dt) {
  if (p.steamT >= 0) { p.steamT += dt; if (p.steamT > 1.4) p.steamT = -1; }
}

// Kukkaruukku ikkunalaudalla: heilahtaa ja pudottaa terälehden
function cafeDrawPot(c, p) {
  var s = viewH * 0.022;
  c.beginPath(); c.moveTo(-s * 0.9, -s * 1.3); c.lineTo(s * 0.9, -s * 1.3); c.lineTo(s * 0.65, 0); c.lineTo(-s * 0.65, 0); c.closePath();
  artFillPath(c, '#d9825a', -s * 1.3, 0, s * 0.9, { lineColor: '#7a4028' });
  artRoundRect(c, -s * 1.0, -s * 1.55, s * 2.0, s * 0.35, s * 0.1, '#e0916a', { lineColor: '#7a4028' });
  artLimb(c, 0, -s * 1.5, 0, -s * 2.6, s * 0.14, '#5fbf55', '#2f7a3a');
  artBlob(c, -s * 0.35, -s * 2.0, s * 0.35, s * 0.16, '#5fbf55', { rot: -0.6, lineColor: '#2f7a3a' });
  drawFlower(c, 0, -s * 2.9, s * 0.34, p.color);
}
function cafePokePot(p) {
  propDropBall(p.x + (Math.random() - 0.5) * viewH * 0.02, p.y - viewH * 0.06, viewH * 0.006, p.color, p.y, (Math.random() - 0.5) * viewW * 0.03);
}

// ---------- Piirto ----------
function cafeLayers() {
  return [
    { speed: 0.22, render: renderCafeFar },
    { speed: 0.55, render: renderCafeMid },
    { speed: 1, render: renderCafeNear }
  ];
}
function renderCafeBg(b, w, h) {
  renderCafeFar(b, w, h);
  renderCafeMid(b, w, h);
  renderCafeNear(b, w, h);
}
function renderCafeFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#ffe8f0');
  wall.addColorStop(1, '#f7d2c4');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.62, h * 0.22, h * 0.055, 0.22, '#fff4c8', '#fffdf0', '#ffd45a');
}
// Keskikerros: tapettiraidat ja viirinauha (ei reunaviivaa, kevyt usva seinän väriin)
function renderCafeMid(b, w, h) {
  var i, x, y;
  b.fillStyle = 'rgba(255,255,255,0.4)';
  for (i = 0; i < 14; i++) b.fillRect(i * h * 0.12, 0, h * 0.04, h * 0.62);
  b.strokeStyle = 'rgba(160,110,90,0.5)';
  b.lineWidth = 2;
  b.beginPath(); b.moveTo(0, h * 0.10); b.quadraticCurveTo(w * 0.5, h * 0.2, w, h * 0.10); b.stroke();
  var flagColors = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];
  for (i = 0; i < 10; i++) {
    x = w * (0.05 + i * 0.1);
    y = h * 0.10 + Math.sin(Math.PI * (0.05 + i * 0.1)) * h * 0.085;
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + h * 0.035, y); b.lineTo(x + h * 0.0175, y + h * 0.05); b.closePath();
    artFillPath(b, artMix(flagColors[i % flagColors.length], '#ffe8f0', 0.15), y, y + h * 0.05, h * 0.02, { line: false });
  }
}
function renderCafeNear(b, w, h) {
  var vw = viewW, y;
  var wx = vw * 0.62, wy = h * 0.30, ww = h * 0.2, wh = h * 0.22;
  // Ikkuna: kehys, taivas, kukkula, pilvi ja ristikko
  artRoundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02, CAFE_WOOD, { lineColor: CAFE_WOOD_LINE });
  var sky = b.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#dff3ff');
  b.fillStyle = sky;
  b.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  b.save();
  b.beginPath(); b.rect(wx - ww / 2, wy - wh / 2, ww, wh); b.clip();
  drawCloud(b, wx - ww * 0.22, wy - wh * 0.22, h * 0.012, 0.9);
  b.beginPath(); b.arc(wx, wy + wh * 0.62, ww * 0.6, Math.PI, 0); b.closePath();
  artFillPath(b, '#7fcf68', wy + wh * 0.62 - ww * 0.6, wy + wh * 0.62, ww * 0.6, { line: false });
  b.restore();
  artLimb(b, wx, wy - wh / 2, wx, wy + wh / 2, h * 0.012, CAFE_WOOD, CAFE_WOOD_LINE);
  artLimb(b, wx - ww / 2, wy, wx + ww / 2, wy, h * 0.012, CAFE_WOOD, CAFE_WOOD_LINE);
  // Ikkunalauta (kukkaruukku on koriste sen päällä)
  artRoundRect(b, wx - ww / 2 - h * 0.03, wy + wh / 2 + h * 0.012, ww + h * 0.06, h * 0.014, h * 0.004, CAFE_WOOD, { lineColor: CAFE_WOOD_LINE });
  // Hylly eväille
  artRoundRect(b, vw * 0.08, h * 0.52, vw * 0.36, h * 0.03, h * 0.01, '#c98b4a', { lineColor: CAFE_WOOD_LINE });
  artRoundRect(b, vw * 0.10, h * 0.55, h * 0.02, h * 0.05, h * 0.006, CAFE_WOOD, { lineColor: CAFE_WOOD_LINE });
  artRoundRect(b, vw * 0.42, h * 0.55, h * 0.02, h * 0.05, h * 0.006, CAFE_WOOD, { lineColor: CAFE_WOOD_LINE });
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.62, 0, h);
  floor.addColorStop(0, '#e8c49a');
  floor.addColorStop(1, '#c99a68');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.62, w, h * 0.38);
  b.fillStyle = 'rgba(120,70,30,0.2)';
  for (y = h * 0.68; y < h; y += h * 0.07) b.fillRect(0, y, w, 2);
  // Pieni kahvilapöytä vasemmalla (kakku ja kuppi ovat koristeita sen päällä)
  var tx = vw * 0.15, ty = h * 0.86;
  artShadow(b, tx, ty + h * 0.1, h * 0.09, h * 0.02, 0.14);
  artLimb(b, tx, ty, tx, ty + h * 0.09, h * 0.016, '#8a5a30', '#4a2c12');
  artBlob(b, tx, ty + h * 0.095, h * 0.045, h * 0.012, '#8a5a30', { lineColor: '#4a2c12' });
  artBlob(b, tx, ty, h * 0.1, h * 0.028, '#fff4f8', { lineColor: '#c9a6b8', shadeTo: '#f0d8e4', hi: 0.4 });
  // Tiski tarjoittimelle ja asiakkaalle
  artRoundRect(b, vw * 0.47, h * 0.72, vw * 0.16, h * 0.2, h * 0.01, CAFE_WOOD, { lineColor: '#4a2c12' });
  artRoundRect(b, vw * 0.46, h * 0.66, vw * 0.18, h * 0.06, h * 0.015, '#8a5a30', { lineColor: '#4a2c12' });
  artHighlight(b, vw * 0.49, h * 0.675, vw * 0.02, h * 0.005, 0.25);
  artRoundRect(b, vw * 0.73, h * 0.72, vw * 0.22, h * 0.2, h * 0.01, CAFE_WOOD, { lineColor: '#4a2c12' });
  artRoundRect(b, vw * 0.72, h * 0.66, vw * 0.24, h * 0.06, h * 0.015, '#8a5a30', { lineColor: '#4a2c12' });
  artHighlight(b, vw * 0.76, h * 0.675, vw * 0.025, h * 0.005, 0.25);
}

// Eväät: porkkana, omena ja marjaterttu tarrakirjan ilmeellä
function cafeDrawFood(c, kind, x, y, s) {
  var i, offs;
  if (kind === 'carrot') {
    c.beginPath();
    c.moveTo(x - s * 0.45, y - s * 0.3);
    c.quadraticCurveTo(x - s * 0.3, y + s * 0.6, x, y + s);
    c.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s * 0.45, y - s * 0.3);
    c.closePath();
    artFillPath(c, '#ff8f3a', y - s * 0.3, y + s, s * 0.45, { lineColor: '#b85a14' });
    c.strokeStyle = 'rgba(180,90,20,0.5)';
    c.lineWidth = s * 0.06;
    for (i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(x - s * 0.28 + i * s * 0.02, y - s * 0.1 + i * s * 0.3); c.lineTo(x + s * 0.28 - i * s * 0.02, y - s * 0.1 + i * s * 0.3); c.stroke();
    }
    artHighlight(c, x - s * 0.2, y - s * 0.05, s * 0.08, s * 0.28, 0.3);
    for (i = -1; i <= 1; i++) artBlob(c, x + i * s * 0.22, y - s * 0.55, s * 0.12, s * 0.32, '#5fd36b', { rot: i * 0.5, lineColor: '#2f7a3a' });
  } else if (kind === 'apple') {
    artUnion(c, function (cc, px, py, ss) {
      cc.beginPath();
      cc.arc(px - s * 0.25, py + s * 0.1, ss, 0, Math.PI * 2);
      cc.arc(px + s * 0.25, py + s * 0.1, ss, 0, Math.PI * 2);
    }, x, y, s * 0.55, y - s * 0.45, y + s * 0.65, '#ff4d5e', { lineColor: '#8a1a28' });
    artHighlight(c, x - s * 0.35, y - s * 0.15, s * 0.16, s * 0.1, 0.5);
    c.strokeStyle = '#8a5a30';
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - s * 0.35); c.quadraticCurveTo(x + s * 0.1, y - s * 0.6, x + s * 0.05, y - s * 0.75); c.stroke();
    artBlob(c, x + s * 0.28, y - s * 0.6, s * 0.26, s * 0.12, '#5fd36b', { rot: -0.5, lineColor: '#2f7a3a' });
  } else {
    offs = [[-0.35, 0.25], [0.35, 0.25], [0, -0.3]];
    for (i = 0; i < offs.length; i++) artCircle(c, x + offs[i][0] * s, y + offs[i][1] * s, s * 0.42, '#6f5cff', { lineColor: '#3a2a9a', hi: 0.45 });
    c.beginPath(); c.moveTo(x, y - s * 0.72); c.lineTo(x - s * 0.2, y - s * 0.5); c.lineTo(x + s * 0.2, y - s * 0.5); c.closePath();
    artFillPath(c, '#5fd36b', y - s * 0.72, y - s * 0.5, s * 0.2, { lineColor: '#2f7a3a' });
  }
}

// Puhekupla: valkoinen, laventeliin varjostettu, reunaviiva ja häntä alas oikealle
function cafeDrawBubble(c, bx, by, bw, s) {
  c.beginPath(); c.moveTo(bx + s * 0.4, by + s * 0.8); c.lineTo(bx + s * 0.85, by + s * 0.8); c.lineTo(bx + s * 1.0, by + s * 1.2); c.closePath();
  artFillPath(c, '#ffffff', by + s * 0.6, by + s * 1.2, s * 0.4, { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  artRoundRect(c, bx - bw / 2, by - s * 0.85, bw, s * 1.7, s * 0.4, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
}

function drawCafeCustomer(c) {
  var k = cafe.customer, p = cafeCustomerPos(), s = viewH * 0.055;
  var y = p.y - viewH * 0.12;
  var slide = k.inT > 0 ? k.inT / 0.8 : 0;
  var x = p.x + slide * viewW * 0.2;
  drawBunny(c, x, y, s, k.hop * viewH * 0.025, k.earT, false);
  if (k.happyT > 0) {
    drawHeartShape(c, x, y - s * 2.6 - Math.sin(globalT * 4) * s * 0.1, s * 0.25, true);
  } else if (cafe.want.length && k.inT <= 0) {
    // Tilauskupla: pupu näyttää haluamansa eväät kuvina
    var n = cafe.want.length, i;
    var bw = s * (1.4 + n * 0.9), bx = x - s * 1.2, by = y - s * 3.0;
    cafeDrawBubble(c, bx, by, bw, s);
    for (i = 0; i < n; i++) {
      var fx2 = bx - (n - 1) * s * 0.45 + i * s * 0.9;
      if (cafe.got.indexOf(cafe.want[i]) >= 0) c.globalAlpha = 0.3;
      cafeDrawFood(c, cafe.want[i], fx2, by + s * 0.05, s * 0.42);
      c.globalAlpha = 1;
    }
  }
}

// Tilausrivi HUDiin: tarjoillut tilaukset kirkkaina, tulevat haaleina
function drawCafeHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * CAFE_ORDERS + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < CAFE_ORDERS; i++) {
    var order = cafe.orders[i] || ['carrot'];
    var first = order[0];
    c.globalAlpha = i < cafe.served ? 1 : 0.3;
    cafeDrawFood(c, first, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 0.55);
    c.globalAlpha = 1;
  }
}

function drawCafe() {
  var i, p;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  // Eväät hyllyllä
  for (i = 0; i < CAFE_FOODS.length; i++) {
    p = cafeFoodPos(i);
    var used = cafe.got.indexOf(CAFE_FOODS[i]) >= 0;
    c_glow(ctx, p.x, p.y, viewH * 0.075, used ? 0.15 : 0.4);
    var jx = 0;
    if (cafe.wrongT > 0 && cafe.want.indexOf(CAFE_FOODS[i]) < 0) jx = Math.sin(globalT * 40) * viewH * 0.006 * cafe.wrongT;
    ctx.globalAlpha = used ? 0.5 : 1;
    cafeDrawFood(ctx, CAFE_FOODS[i], p.x + jx, p.y, viewH * 0.045);
    ctx.globalAlpha = 1;
  }
  // Tarjotin ja kerätyt eväät
  var tp = cafeTrayPos();
  artBlob(ctx, tp.x, tp.y, viewH * 0.075, viewH * 0.02, '#e8eef7', { lineColor: '#9aa6b8', shadeTo: '#cfd8e8', hi: 0.4 });
  for (i = 0; i < cafe.got.length; i++) {
    cafeDrawFood(ctx, cafe.got[i], tp.x - (cafe.got.length - 1) * viewH * 0.025 + i * viewH * 0.05, tp.y - viewH * 0.035, viewH * 0.03);
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawCafeCustomer(ctx);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawCafeHud(ctx);
  drawTaskOverlay(ctx);
}
