'use strict';

// Taikakeittiö: Hoivasaaren vartija. Pupuasiakkaat tilaavat värillisiä
// taikajuomia; kaada pullosta värit pataan niin, että sekoitus vastaa tilausta.
// Punainen + keltainen = oranssi, keltainen + sininen = vihreä, punainen +
// sininen = violetti. Väärä sekoitus pöhähtää ja tyhjenee. Ei sydämiä, ei
// liikkumista: pelkkiä napautuksia.

var K_ORDERS = 6;
var kitchen = { mix: null, orders: [], served: 0, customer: { x: 0, hop: 0, earT: 0, happyT: 0, inT: 0 }, serveT: 0, finishT: 0 };

function kBottlePos(i) {
  return { x: viewW * (0.14 + i * 0.11), y: viewH * 0.46 };
}
function kCauldronPos() {
  return { x: viewW * 0.55, y: viewH * 0.72 };
}
function kCustomerPos() {
  return { x: viewW * 0.84, y: viewH * 0.78 };
}

function kNextOrder() {
  kitchen.mix = mixStateNew(kitchen.orders[kitchen.served]);
  kitchen.customer.inT = 0.8;
  kitchen.customer.happyT = 0;
  kitchen.customer.hop = 1;
}

function initKitchen() {
  var i, k, tmp, prim = ['R', 'Y', 'B'], sec = ['RY', 'YB', 'RB', 'RY', 'YB', 'RB'];
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  tasks = [];
  activeTask = null;
  // Tilaukset: ensin kaksi perusväriä, sitten sekoitukset
  for (i = prim.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = prim[i]; prim[i] = prim[k]; prim[k] = tmp; }
  for (i = sec.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = sec[i]; sec[i] = sec[k]; sec[k] = tmp; }
  kitchen.orders = [prim[0], prim[1], sec[0], sec[1], sec[2], sec[3]];
  kitchen.served = 0;
  kitchen.serveT = 0;
  kitchen.finishT = 0;
  kitchen.customer.earT = 0;
  kNextOrder();
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
  princess.facing = 1;
  princess.walkPhase = 0;
  document.body.style.background = '#f7e6d2';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnKitchen() {}
function resizeKitchen() {
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
}

function handleKitchenTap(px, py) {
  if (!running || celebrating || !kitchen.mix) return;
  var i, p, dx, dy;
  for (i = 0; i < 3; i++) {
    p = kBottlePos(i);
    dx = px - p.x; dy = py - p.y;
    if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
      var cp = kCauldronPos();
      var r = mixPour(kitchen.mix, MIX_PRIMARY[i], p.x, p.y + viewH * 0.04);
      if (r === 'fail') spawnSparkles(cp.x, cp.y - viewH * 0.1, 10, '#8a7a6a');
      return;
    }
  }
  // Asiakkaan napautus: hyppy ja tilaus kuuluu uudestaan
  p = kCustomerPos();
  if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
    kitchen.customer.hop = 1;
    playNote(1300, 0, 0.08, 'sine', 0.25);
    playNote(1600, 0.07, 0.1, 'sine', 0.2);
  }
}

function updateKitchen(dt) {
  var k = kitchen, cp = kCauldronPos();
  k.customer.earT += dt * 3;
  if (k.customer.hop > 0) k.customer.hop = Math.max(0, k.customer.hop - dt * 3);
  if (k.customer.inT > 0) k.customer.inT -= dt;
  if (k.mix && !celebrating) {
    if (mixUpdate(k.mix, dt)) {
      // Tarjoilu: juoma valmis, pupu iloitsee
      k.served++;
      k.customer.happyT = 1.4;
      k.serveT = 1.4;
      spawnSparkles(cp.x, cp.y - viewH * 0.12, 20, mixColorOf(k.mix.target));
      k.mix = null;
      if (k.served >= K_ORDERS) k.finishT = 0.9;
    }
  }
  if (k.serveT > 0) {
    k.serveT -= dt;
    if (k.serveT <= 0 && k.served < K_ORDERS) kNextOrder();
  }
  if (k.finishT > 0 && !celebrating) {
    k.finishT -= dt;
    if (k.finishT <= 0) startCelebration();
  }
  if (k.customer.happyT > 0) {
    k.customer.happyT -= dt;
    k.customer.hop = Math.abs(Math.sin(globalT * 10));
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderKitchenBg(b, w, h) {
  var vw = viewW, i, x, y;
  var wall = b.createLinearGradient(0, 0, 0, h * 0.62);
  wall.addColorStop(0, '#fff1dc');
  wall.addColorStop(1, '#f5d9bd');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h * 0.62);
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 12; i++) for (y = 0; y < 5; y++) {
    x = h * 0.05 + i * h * 0.12 + (y % 2) * h * 0.06;
    b.beginPath(); b.arc(x, h * 0.06 + y * h * 0.11, h * 0.012, 0, Math.PI * 2); b.fill();
  }
  // Ikkuna
  var wx = vw * 0.62, wy = h * 0.26, ww = h * 0.22, wh = h * 0.24;
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
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, wx - ww * 0.2, wy - wh * 0.2, h * 0.014);
  b.fillStyle = '#a9743f';
  b.fillRect(wx - h * 0.006, wy - wh / 2, h * 0.012, wh);
  b.fillRect(wx - ww / 2, wy - h * 0.006, ww, h * 0.012);
  // Hylly pulloille
  b.fillStyle = '#c98b4a';
  roundRect(b, vw * 0.08, h * 0.52, vw * 0.36, h * 0.03, h * 0.01);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.10, h * 0.55, h * 0.02, h * 0.05);
  b.fillRect(vw * 0.42, h * 0.55, h * 0.02, h * 0.05);
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.62, 0, h);
  floor.addColorStop(0, '#e2b98a');
  floor.addColorStop(1, '#c48f5c');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.62, w, h * 0.38);
  b.fillStyle = 'rgba(120,70,30,0.2)';
  for (y = h * 0.68; y < h; y += h * 0.07) b.fillRect(0, y, w, 2);
  b.fillStyle = '#c9a0ff';
  b.fillRect(0, h * 0.6, w, h * 0.025);
  // Tiski asiakkaalle
  b.fillStyle = '#8a5a30';
  roundRect(b, vw * 0.72, h * 0.66, vw * 0.24, h * 0.06, h * 0.015);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.73, h * 0.72, vw * 0.22, h * 0.2);
}

function drawKitchenCustomer(c) {
  var k = kitchen, p = kCustomerPos(), s = viewH * 0.055;
  var y = p.y - viewH * 0.12;
  var slide = k.customer.inT > 0 ? k.customer.inT / 0.8 : 0;
  var x = p.x + slide * viewW * 0.2;
  drawBunny(c, x, y, s, k.customer.hop * viewH * 0.025, k.customer.earT, false);
  if (k.customer.happyT > 0) {
    drawHeartShape(c, x, y - s * 2.6 - Math.sin(globalT * 4) * s * 0.1, s * 0.25, true);
  } else if (k.mix && k.customer.inT <= 0) {
    // Tilauskupla: pupu näyttää haluamansa juoman
    var bx = x - s * 1.4, by = y - s * 2.9;
    c.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(c, bx - s * 1.0, by - s * 0.9, s * 2.0, s * 1.8, s * 0.4);
    c.fill();
    c.beginPath(); c.moveTo(bx + s * 0.5, by + s * 0.85); c.lineTo(bx + s * 0.95, by + s * 0.85); c.lineTo(bx + s * 1.1, by + s * 1.3); c.closePath(); c.fill();
    drawPotionBottle(c, bx, by + s * 0.15, s * 0.55, mixColorOf(k.mix.target));
  }
}

function drawKitchen() {
  var i, p, k = kitchen;
  if (!drawWorldBg()) return;
  // Pullot hyllyllä
  for (i = 0; i < 3; i++) {
    p = kBottlePos(i);
    var used = k.mix && k.mix.pour.indexOf(MIX_PRIMARY[i]) >= 0;
    c_glow(ctx, p.x, p.y, viewH * 0.075, used ? 0.15 : 0.4);
    ctx.globalAlpha = used ? 0.5 : 1;
    drawPotionBottle(ctx, p.x, p.y, viewH * 0.05, MIX_COLORS[MIX_PRIMARY[i]]);
    ctx.globalAlpha = 1;
  }
  var cp = kCauldronPos();
  var key = k.mix ? mixKey(k.mix.pour) : '';
  var liquid = k.mix ? (k.mix.failT > 0 ? MIX_COLORS.X : (key ? mixColorOf(key) : null)) : (k.serveT > 0 ? null : null);
  drawCauldron(ctx, cp.x, cp.y, viewH * 0.1, liquid, !!(k.mix && k.mix.failT > 0), k.mix ? k.mix.splash : 0, !!(k.mix && k.mix.doneT > 0));
  if (k.mix) drawMixDrops(ctx, k.mix, cp.x, cp.y - viewH * 0.08);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawKitchenCustomer(ctx);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawKitchenHud(ctx);
  drawTaskOverlay(ctx);
}

// Tilausrivi HUDiin: tarjoillut juomat värillisinä, tulevat haaleina
function drawKitchenHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * K_ORDERS + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < K_ORDERS; i++) {
    c.globalAlpha = i < kitchen.served ? 1 : 0.3;
    drawPotionBottle(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 0.55, mixColorOf(kitchen.orders[i] || 'R'));
    c.globalAlpha = 1;
  }
}

function c_glow(c, x, y, r, a) {
  var g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}
