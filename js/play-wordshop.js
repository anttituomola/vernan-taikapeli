'use strict';

// Sanapaja: Kirjainsaaren kolmas kenttä. Pupuasiakas tilaa kuvalla, ja sana
// kootaan tavukorteista (build-tehtävä). Valmis sana ripustetaan kylttinä
// pajan seinälle. Viisi tilausta: ensin 2-tavuisia, sitten 3-tavuisia.
// Ei sydämiä, ei liikkumista.

var WS_ORDERS = 5;
var wshop = { orders: [], served: 0, customer: { inT: 0, happyT: 0, hop: 0, earT: 0 }, serveT: 0, finishT: 0, signs: [], pending: null };

function wsCustomerPos() {
  return { x: viewW * 0.82, y: viewH * 0.8 };
}

function wsNextOrder() {
  var w = wshop.orders[wshop.served];
  var t = makeTask(-5, 'build');
  t.x = -1e6;
  t.presetWord = w;
  tasks = [t];
  wshop.pending = t;
  wshop.customer.inT = 0.8;
  wshop.customer.happyT = 0;
  wshop.customer.hop = 1;
  wshop.serveT = 0;
  wshop.startT = 1.2;
}

function initWordshop() {
  var a = pickDistinct(wordsBySyl(2, 2), 2), b = pickDistinct(wordsBySyl(3, 3), 3);
  level = 29;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  activeTask = null;
  tasks = [];
  wshop.orders = a.concat(b);
  wshop.served = 0;
  wshop.signs = [];
  wshop.finishT = 0;
  wshop.customer.earT = 0;
  wsNextOrder();
  princess.x = viewW * 0.4;
  princess.y = viewH * 0.8;
  princess.facing = 1;
  document.body.style.background = '#f3e6ff';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnWordshop() {}
function resizeWordshop() {
  princess.x = viewW * 0.4;
  princess.y = viewH * 0.8;
}

function handleWordshopTap(px, py) {
  if (!running || celebrating) return;
  var p = wsCustomerPos();
  if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
    wshop.customer.hop = 1;
    playNote(1300, 0, 0.08, 'sine', 0.25);
    playNote(1600, 0.07, 0.1, 'sine', 0.2);
  }
}

function updateWordshop(dt) {
  var k = wshop;
  updateTasks(dt);
  k.customer.earT += dt * 3;
  if (k.customer.hop > 0) k.customer.hop = Math.max(0, k.customer.hop - dt * 3);
  if (k.customer.inT > 0) k.customer.inT -= dt;
  // Tilaus alkaa, kun pupu on saapunut tiskille
  if (k.pending && !activeTask && !k.pending.opened) {
    k.startT -= dt;
    if (k.startT <= 0) taskStart(k.pending);
  }
  if (k.pending && k.pending.opened && !celebrating) {
    // Sana valmis: kyltti seinälle, pupu iloitsee
    k.signs.push({ w: k.pending.word.w, icon: k.pending.word.icon, t: 0 });
    k.served++;
    k.customer.happyT = 1.4;
    k.serveT = 1.6;
    spawnSparkles(viewW * 0.4, viewH * 0.3, 20, '#ffe27a');
    k.pending = null;
    tasks = [];
    if (k.served >= WS_ORDERS) k.finishT = 1.6;
  }
  if (k.serveT > 0) {
    k.serveT -= dt;
    if (k.serveT <= 0 && k.served < WS_ORDERS) wsNextOrder();
  }
  if (k.finishT > 0 && !celebrating) {
    k.finishT -= dt;
    if (k.finishT <= 0) startCelebration();
  }
  if (k.customer.happyT > 0) {
    k.customer.happyT -= dt;
    k.customer.hop = Math.abs(Math.sin(globalT * 10));
  }
  var i;
  for (i = 0; i < k.signs.length; i++) k.signs[i].t += dt;
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderWordshopBg(b, w, h) {
  var vw = viewW, i, x, y;
  var wall = b.createLinearGradient(0, 0, 0, h * 0.62);
  wall.addColorStop(0, '#fbf1ff');
  wall.addColorStop(1, '#e8d6f7');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h * 0.62);
  // Tapetti: kirjaimia haaleana
  b.fillStyle = 'rgba(138,43,226,0.08)';
  readFont(b, h * 0.05);
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  for (i = 0; i < 12; i++) for (y = 0; y < 4; y++) {
    x = h * 0.05 + i * h * 0.12 + (y % 2) * h * 0.06;
    b.fillText(RAP_ALPHABET.charAt((i * 3 + y * 7) % RAP_ALPHABET.length), x, h * 0.08 + y * h * 0.12);
  }
  b.textBaseline = 'alphabetic';
  // Kylttirima
  b.fillStyle = '#c98b4a';
  roundRect(b, vw * 0.06, h * 0.13, vw * 0.6, h * 0.02, h * 0.008);
  b.fill();
  // Työpöytä
  b.fillStyle = '#a9743f';
  roundRect(b, vw * 0.1, h * 0.5, vw * 0.5, h * 0.05, h * 0.012);
  b.fill();
  b.fillRect(vw * 0.13, h * 0.55, h * 0.02, h * 0.1);
  b.fillRect(vw * 0.55, h * 0.55, h * 0.02, h * 0.1);
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
  roundRect(b, vw * 0.7, h * 0.66, vw * 0.26, h * 0.06, h * 0.015);
  b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.71, h * 0.72, vw * 0.24, h * 0.2);
}

function drawWordshopCustomer(c) {
  var k = wshop, p = wsCustomerPos(), s = viewH * 0.055;
  var y = p.y - viewH * 0.12;
  var slide = k.customer.inT > 0 ? k.customer.inT / 0.8 : 0;
  var x = p.x + slide * viewW * 0.2;
  drawBunny(c, x, y, s, k.customer.hop * viewH * 0.025, k.customer.earT, false);
  if (k.customer.happyT > 0) {
    drawHeartShape(c, x, y - s * 2.6 - Math.sin(globalT * 4) * s * 0.1, s * 0.25, true);
  } else if (k.pending && k.customer.inT <= 0) {
    var bx = x - s * 1.4, by = y - s * 2.9;
    c.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(c, bx - s * 1.0, by - s * 0.9, s * 2.0, s * 1.8, s * 0.4);
    c.fill();
    c.beginPath(); c.moveTo(bx + s * 0.5, by + s * 0.85); c.lineTo(bx + s * 0.95, by + s * 0.85); c.lineTo(bx + s * 1.1, by + s * 1.3); c.closePath(); c.fill();
    drawWordIcon(c, k.pending.word ? k.pending.word.icon : k.pending.presetWord.icon, bx, by, s * 0.75);
  }
}

// Valmiit kyltit seinän rimalla: kuva ja sana tavutettuna
function drawWordshopSigns(c) {
  var i, sg, h = viewH * 0.075, w, x = viewW * 0.07, y = viewH * 0.24, drop;
  for (i = 0; i < wshop.signs.length; i++) {
    sg = wshop.signs[i];
    w = wordCardWidth(c, sg.w, h) + h * 0.7;
    // Kyltit rinnakkain rimalla; jos rima loppuu, seuraavat menevät toiselle riville
    if (x + w > viewW * 0.68) { x = viewW * 0.07; y += h * 1.5; }
    drop = Math.min(1, sg.t * 1.5);
    var yy = y - (1 - drop) * viewH * 0.3;
    c.strokeStyle = '#8a5a30';
    c.lineWidth = Math.max(1.5, h * 0.05);
    c.beginPath(); c.moveTo(x + w * 0.5, viewH * 0.15); c.lineTo(x + w * 0.5, yy - h / 2); c.stroke();
    c.fillStyle = '#fff6d8';
    roundRect(c, x, yy - h / 2, w, h, h * 0.2);
    c.fill();
    c.strokeStyle = '#c98b4a';
    c.stroke();
    drawWordIcon(c, sg.icon, x + h * 0.5, yy, h * 0.36);
    readFont(c, h * 0.5);
    c.fillStyle = '#8a2be2';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(sg.w, x + h * 0.95, yy + h * 0.03);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    x += w + h * 0.3;
  }
}

function drawWordshop() {
  if (!drawWorldBg()) return;
  drawWordshopSigns(ctx);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawWordshopCustomer(ctx);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, WS_ORDERS, function (i2) { return i2 < wshop.served; },
    function (c, x, y, s2) { c.fillStyle = '#fff6d8'; roundRect(c, x - s2 * 0.7, y - s2 * 0.45, s2 * 1.4, s2 * 0.9, s2 * 0.2); c.fill(); readFont(c, s2 * 0.7); c.fillStyle = '#8a2be2'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', x, y + s2 * 0.05); c.textBaseline = 'alphabetic'; });
  drawTaskOverlay(ctx);
}
