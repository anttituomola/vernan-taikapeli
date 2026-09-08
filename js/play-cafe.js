'use strict';

// Pupukahvila: kiireetön hoivakenttä ilman sydämiä ja ilman liikkumista.
// Pupuasiakas tilaa evästä kuplassa (kuvalla, ei sanoina); napauta oikea
// eväs hyllyltä tarjottimeen. Ensin yksi eväs per tilaus, lopuksi kaksi.
// Väärä eväs vain ravistaa. Viisi tilausta.

var CAFE_ORDERS = 5;
var CAFE_FOODS = ['carrot', 'apple', 'berry'];
var cafe = {
  orders: [], served: 0, want: [], got: [],
  customer: { hop: 0, earT: 0, happyT: 0, inT: 0 },
  serveT: 0, finishT: 0, wrongT: 0
};

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
  var singles = ['carrot', 'apple'], doubles = [['carrot', 'apple'], ['apple', 'berry'], ['carrot', 'berry']];
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
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnCafe() {}
function resizeCafe() {
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
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
  }
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
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderCafeBg(b, w, h) {
  var vw = viewW, i, x, y;
  var wall = b.createLinearGradient(0, 0, 0, h * 0.62);
  wall.addColorStop(0, '#ffe8f0');
  wall.addColorStop(1, '#f7d2c4');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h * 0.62);
  // Juovikkaat tapetin raidat
  b.fillStyle = 'rgba(255,255,255,0.4)';
  for (i = 0; i < 14; i++) b.fillRect(i * h * 0.12, 0, h * 0.04, h * 0.62);
  // Lipputulo
  b.strokeStyle = 'rgba(160,110,90,0.5)';
  b.lineWidth = 2;
  b.beginPath(); b.moveTo(0, h * 0.10); b.quadraticCurveTo(w * 0.5, h * 0.2, w, h * 0.10); b.stroke();
  var flagColors = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];
  for (i = 0; i < 10; i++) {
    x = w * (0.05 + i * 0.1);
    y = h * 0.10 + Math.sin(Math.PI * (0.05 + i * 0.1)) * h * 0.085;
    b.fillStyle = flagColors[i % flagColors.length];
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + h * 0.035, y); b.lineTo(x + h * 0.0175, y + h * 0.05); b.closePath(); b.fill();
  }
  // Ikkuna
  var wx = vw * 0.62, wy = h * 0.30, ww = h * 0.2, wh = h * 0.22;
  b.fillStyle = '#a9743f';
  roundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02);
  b.fill();
  var sky = b.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#dff3ff');
  b.fillStyle = sky;
  b.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  b.fillStyle = '#7fcf68';
  b.beginPath(); b.arc(wx, wy + wh * 0.62, ww * 0.6, Math.PI, 0); b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(wx - h * 0.006, wy - wh / 2, h * 0.012, wh);
  b.fillRect(wx - ww / 2, wy - h * 0.006, ww, h * 0.012);
  // Hylly eväille
  b.fillStyle = '#c98b4a';
  roundRect(b, vw * 0.08, h * 0.52, vw * 0.36, h * 0.03, h * 0.01);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.10, h * 0.55, h * 0.02, h * 0.05);
  b.fillRect(vw * 0.42, h * 0.55, h * 0.02, h * 0.05);
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.62, 0, h);
  floor.addColorStop(0, '#e8c49a');
  floor.addColorStop(1, '#c99a68');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.62, w, h * 0.38);
  b.fillStyle = 'rgba(120,70,30,0.2)';
  for (y = h * 0.68; y < h; y += h * 0.07) b.fillRect(0, y, w, 2);
  // Tiski tarjoittimelle ja asiakkaalle
  b.fillStyle = '#8a5a30';
  roundRect(b, vw * 0.46, h * 0.66, vw * 0.18, h * 0.06, h * 0.015);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.47, h * 0.72, vw * 0.16, h * 0.2);
  b.fillStyle = '#8a5a30';
  roundRect(b, vw * 0.72, h * 0.66, vw * 0.24, h * 0.06, h * 0.015);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.73, h * 0.72, vw * 0.22, h * 0.2);
}

function cafeDrawFood(c, kind, x, y, s) {
  var i;
  if (kind === 'carrot') {
    c.fillStyle = '#ff8f3a';
    c.beginPath();
    c.moveTo(x - s * 0.45, y - s * 0.3);
    c.quadraticCurveTo(x - s * 0.3, y + s * 0.6, x, y + s);
    c.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s * 0.45, y - s * 0.3);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(180,90,20,0.5)';
    c.lineWidth = s * 0.06;
    for (i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(x - s * 0.28 + i * s * 0.02, y - s * 0.1 + i * s * 0.3); c.lineTo(x + s * 0.28 - i * s * 0.02, y - s * 0.1 + i * s * 0.3); c.stroke();
    }
    c.fillStyle = '#5fd36b';
    for (i = -1; i <= 1; i++) {
      c.beginPath();
      if (c.ellipse) c.ellipse(x + i * s * 0.22, y - s * 0.55, s * 0.12, s * 0.32, i * 0.5, 0, Math.PI * 2);
      else c.arc(x + i * s * 0.22, y - s * 0.55, s * 0.16, 0, Math.PI * 2);
      c.fill();
    }
  } else if (kind === 'apple') {
    c.fillStyle = '#ff4d5e';
    c.beginPath(); c.arc(x - s * 0.25, y + s * 0.1, s * 0.55, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + s * 0.25, y + s * 0.1, s * 0.55, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(x - s * 0.35, y - s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#8a5a30';
    c.lineWidth = s * 0.09;
    c.beginPath(); c.moveTo(x, y - s * 0.35); c.quadraticCurveTo(x + s * 0.1, y - s * 0.6, x + s * 0.05, y - s * 0.75); c.stroke();
    c.fillStyle = '#5fd36b';
    c.beginPath();
    if (c.ellipse) c.ellipse(x + s * 0.28, y - s * 0.6, s * 0.26, s * 0.12, -0.5, 0, Math.PI * 2);
    else c.arc(x + s * 0.28, y - s * 0.6, s * 0.16, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = '#6f5cff';
    var offs = [[-0.35, 0.25], [0.35, 0.25], [0, -0.3]];
    for (i = 0; i < offs.length; i++) {
      c.beginPath(); c.arc(x + offs[i][0] * s, y + offs[i][1] * s, s * 0.42, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (i = 0; i < offs.length; i++) {
      c.beginPath(); c.arc(x + offs[i][0] * s - s * 0.12, y + offs[i][1] * s - s * 0.12, s * 0.1, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#5fd36b';
    c.beginPath(); c.moveTo(x, y - s * 0.72); c.lineTo(x - s * 0.2, y - s * 0.5); c.lineTo(x + s * 0.2, y - s * 0.5); c.closePath(); c.fill();
  }
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
    c.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(c, bx - bw / 2, by - s * 0.85, bw, s * 1.7, s * 0.4);
    c.fill();
    c.beginPath(); c.moveTo(bx + s * 0.4, by + s * 0.8); c.lineTo(bx + s * 0.85, by + s * 0.8); c.lineTo(bx + s * 1.0, by + s * 1.2); c.closePath(); c.fill();
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
    var first = typeof order === 'string' ? order : order[0];
    c.globalAlpha = i < cafe.served ? 1 : 0.3;
    cafeDrawFood(c, first, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 0.55);
    c.globalAlpha = 1;
  }
}

function drawCafe() {
  var i, p;
  if (!drawWorldBg()) return;
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
  ctx.fillStyle = '#e8eef7';
  ctx.beginPath();
  if (ctx.ellipse) ctx.ellipse(tp.x, tp.y, viewH * 0.075, viewH * 0.02, 0, 0, Math.PI * 2);
  else ctx.arc(tp.x, tp.y, viewH * 0.06, 0, Math.PI * 2);
  ctx.fill();
  for (i = 0; i < cafe.got.length; i++) {
    cafeDrawFood(ctx, cafe.got[i], tp.x - (cafe.got.length - 1) * viewH * 0.025 + i * viewH * 0.05, tp.y - viewH * 0.035, viewH * 0.03);
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawCafeCustomer(ctx);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawCafeHud(ctx);
  drawTaskOverlay(ctx);
}
