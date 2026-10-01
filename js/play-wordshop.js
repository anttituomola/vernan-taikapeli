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
  wsSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnWordshop() {}
function resizeWordshop() {
  princess.x = viewW * 0.4;
  princess.y = viewH * 0.8;
  wsSetupProps();
}

// Tökättävät koristeet: tiskin kello (joka kolmas tökkäys sataa kirjaimia),
// työpöydän kukkaruukku ja seinän kirjainmobile.
var WS_CONFETTI = 'ABEIKLMOSTUV';
function wsSetupProps() {
  var h = viewH, vw = viewW;
  propsReset();
  propAdd({
    x: vw * 0.75, y: h * 0.66, r: h * 0.05, hy: h * 0.035, color: '#ffd24f', note: 1319, amp: 0.12,
    draw: function (c) {
      var s = h * 0.028;
      artBlob(c, 0, 0, s * 1.1, s * 0.25, '#a9743f', { lineColor: '#5a3a1e' });
      c.beginPath(); c.arc(0, -s * 0.5, s * 0.9, Math.PI, 0); c.lineTo(s * 0.9, -s * 0.2); c.lineTo(-s * 0.9, -s * 0.2); c.closePath();
      artFillPath(c, '#ffd24f', -s * 1.4, -s * 0.2, s * 0.9, { lineColor: '#b8862a' });
      artCircle(c, 0, -s * 1.45, s * 0.18, '#ffd24f', { lineColor: '#b8862a' });
      artHighlight(c, -s * 0.4, -s * 0.9, s * 0.25, s * 0.15, 0.45);
    },
    poke: function (p) {
      playNote(2093, 0, 0.25, 'sine', 0.25);
      playNote(2637, 0.05, 0.3, 'sine', 0.15);
      if (p.n % 3 === 0) wsLetterConfetti(p.x, p.y - h * 0.08);
    }
  });
  propAdd({
    x: vw * 0.57, y: h * 0.5, r: h * 0.06, hy: h * 0.06, color: '#ff7bac', note: 740, amp: 0.1,
    draw: function (c) {
      var s = h * 0.028;
      artRoundRect(c, -s * 0.7, -s * 0.9, s * 1.4, s * 0.9, s * 0.15, '#c9a0ff', { lineColor: '#7a4fb8' });
      artLimb(c, 0, -s * 0.9, 0, -s * 2.0, Math.max(1.5, s * 0.14), '#5fb356', '#2e7a3a');
      drawFlower(c, 0, -s * 2.15, s * 0.42, '#ff7bac');
    }
  });
  propAdd({
    x: vw * 0.68, y: h * 0.4, r: h * 0.07, hy: h * 0.02, color: '#7fd4ff', note: 988, amp: 0.14,
    draw: function (c, p) {
      var s = h * 0.03, k, cols = ['#ff5f7e', '#ffd24f', '#7fd4ff'], sw = p.t >= 0 ? Math.sin(p.t * 12) * Math.exp(-p.t * 3) : 0;
      c.strokeStyle = '#8a5a30';
      c.lineWidth = Math.max(1.5, s * 0.08);
      c.beginPath(); c.moveTo(0, -s * 4); c.lineTo(0, -s * 2.4); c.moveTo(-s * 1.6, -s * 2.4); c.lineTo(s * 1.6, -s * 2.4); c.stroke();
      for (k = 0; k < 3; k++) {
        var lx = (k - 1) * s * 1.6 + sw * s * 0.4 * (k - 1), ly = -s * 2.4 + s * (1.0 + (k % 2) * 0.5);
        c.beginPath(); c.moveTo((k - 1) * s * 1.6, -s * 2.4); c.lineTo(lx, ly - s * 0.6); c.stroke();
        artCircle(c, lx, ly, s * 0.6, cols[k], { lineColor: artShade(cols[k], -0.4), hi: 0.4 });
        c.fillStyle = '#ffffff';
        readFont(c, s * 0.7);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('AEI'.charAt(k), lx, ly + s * 0.04);
        c.textBaseline = 'alphabetic';
      }
    }
  });
}
// Pieniä kirjaimia sataa kellosta
var wsConfetti = [];
function wsLetterConfetti(x, y) {
  var i;
  wsConfetti = [];
  for (i = 0; i < 10; i++) {
    wsConfetti.push({ x: x, y: y, vx: (Math.random() - 0.5) * viewW * 0.25, vy: -viewH * (0.25 + Math.random() * 0.25), ch: WS_CONFETTI.charAt(randInt(WS_CONFETTI.length)), c: maneColors[i % maneColors.length], t: 0, rot: Math.random() * 6 });
  }
}
function wsConfettiUpdate(dt) {
  var i, f;
  for (i = wsConfetti.length - 1; i >= 0; i--) {
    f = wsConfetti[i];
    f.t += dt;
    f.vy += viewH * 0.8 * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.t > 1.6) wsConfetti.splice(i, 1);
  }
}
function wsConfettiDraw(c) {
  var i, f;
  for (i = 0; i < wsConfetti.length; i++) {
    f = wsConfetti[i];
    c.save();
    c.translate(f.x, f.y);
    c.rotate(f.rot + f.t * 3);
    c.globalAlpha = Math.max(0, 1 - f.t / 1.6);
    c.fillStyle = f.c;
    readFont(c, viewH * 0.035);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(f.ch, 0, 0);
    c.restore();
  }
  c.globalAlpha = 1;
  c.textBaseline = 'alphabetic';
}

function handleWordshopTap(px, py) {
  if (!running || celebrating) return;
  var p = wsCustomerPos();
  if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
    wshop.customer.hop = 1;
    playNote(1300, 0, 0.08, 'sine', 0.25);
    playNote(1600, 0.07, 0.1, 'sine', 0.2);
    return;
  }
  propsTap(px, py);
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
  propsUpdate(dt);
  wsConfettiUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function wordshopLayers() {
  return [
    { speed: 0.22, render: renderWordshopFar },
    { speed: 0.55, render: renderWordshopMid },
    { speed: 1, render: renderWordshopNear }
  ];
}
function renderWordshopBg(b, w, h) {
  renderWordshopFar(b, w, h);
  renderWordshopMid(b, w, h);
  renderWordshopNear(b, w, h);
}
function renderWordshopFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#fbf1ff');
  wall.addColorStop(1, '#e8d6f7');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.82, h * 0.16, h * 0.055, 0.22, '#ffe9c8', '#fffdf0', '#ffd45a');
}
function renderWordshopMid(b, w, h) {
  var i, x, y;
  b.fillStyle = 'rgba(138,43,226,0.08)';
  readFont(b, h * 0.05);
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  for (i = 0; i < 12; i++) for (y = 0; y < 4; y++) {
    x = h * 0.05 + i * h * 0.12 + (y % 2) * h * 0.06;
    b.fillText(RAP_ALPHABET.charAt((i * 3 + y * 7) % RAP_ALPHABET.length), x, h * 0.08 + y * h * 0.12);
  }
  b.textBaseline = 'alphabetic';
}
function renderWordshopNear(b, w, h) {
  var vw = viewW, y, lw = Math.max(1.2, h * 0.003);
  artRoundRect(b, vw * 0.06, h * 0.13, vw * 0.6, h * 0.02, h * 0.008, '#c98b4a', { lineColor: '#7a4a20', line: lw });
  // Työpöytä
  artRoundRect(b, vw * 0.13, h * 0.55, h * 0.02, h * 0.1, h * 0.005, '#8a5a30', { lineColor: '#5a3a1e', line: lw });
  artRoundRect(b, vw * 0.55, h * 0.55, h * 0.02, h * 0.1, h * 0.005, '#8a5a30', { lineColor: '#5a3a1e', line: lw });
  artRoundRect(b, vw * 0.1, h * 0.5, vw * 0.5, h * 0.05, h * 0.012, '#a9743f', { lineColor: '#5a3a1e', line: lw });
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
  artRoundRect(b, vw * 0.71, h * 0.7, vw * 0.24, h * 0.22, h * 0.01, '#a9743f', { lineColor: '#5a3a1e', line: lw });
  artRoundRect(b, vw * 0.7, h * 0.66, vw * 0.26, h * 0.06, h * 0.015, '#8a5a30', { lineColor: '#5a3a1e', line: lw });
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
    artRoundRect(c, x, yy - h / 2, w, h, h * 0.2, '#fff6d8', { lineColor: '#c98b4a', line: Math.max(1.5, h * 0.05) });
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
  if (!beginPlayWorld()) return;
  drawWordshopSigns(ctx);
  propsDraw(ctx);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawWordshopCustomer(ctx);
  wsConfettiDraw(ctx);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, WS_ORDERS, function (i2) { return i2 < wshop.served; },
    function (c, x, y, s2) { c.fillStyle = '#fff6d8'; roundRect(c, x - s2 * 0.7, y - s2 * 0.45, s2 * 1.4, s2 * 0.9, s2 * 0.2); c.fill(); readFont(c, s2 * 0.7); c.fillStyle = '#8a2be2'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', x, y + s2 * 0.05); c.textBaseline = 'alphabetic'; });
  drawTaskOverlay(ctx);
}
