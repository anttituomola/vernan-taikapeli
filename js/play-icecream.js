'use strict';

// Jäätelökoju: kiireetön kenttä ilman sydämiä ja liikkumista. Pupuasiakas
// tilaa kuplassa tötterön, jossa on 2–4 palloa tietyissä väreissä ALHAALTA
// YLÖS — järjestys ratkaisee. Napauta oikea maku astiasta; väärä pallo
// putoaa tiskille. Lopuissa tilauksissa myös koriste (kirsikka tai strösseli).
// Tehtävät avautuvat toisen ja neljännen tilauksen jälkeen.

var ICE_ORDERS = 6;
var ICE_FLAVORS = [
  { id: 'straw', c: '#ff8fb8', hi: '#ffc4dd' },
  { id: 'vanil', c: '#fff3d0', hi: '#ffffff' },
  { id: 'choco', c: '#8a5a30', hi: '#b98a5a' },
  { id: 'mint', c: '#9fe8b8', hi: '#d0ffe0' },
  { id: 'blue', c: '#9fa8ff', hi: '#d0d4ff' }
];
var ICE_TOPS = ['cherry', 'sprinkle'];
var ice = {
  orders: [], served: 0, want: null, got: [], gotTop: false,
  customer: { hop: 0, earT: 0, happyT: 0, inT: 0 },
  serveT: 0, finishT: 0, wrongT: 0, dropT: -1, dropX: 0, dropC: '', taskDelay: 0
};

function iceTubPos(i) {
  return { x: viewW * (0.09 + i * 0.09), y: viewH * 0.5 };
}
function iceTopPos(i) {
  return { x: viewW * (0.14 + i * 0.1), y: viewH * 0.72 };
}
function iceConePos() {
  return { x: viewW * 0.6, y: viewH * 0.66 };
}
function iceCustomerPos() {
  return { x: viewW * 0.85, y: viewH * 0.8 };
}

function iceMakeOrder(n, withTop) {
  var scoops = [], i, prev = -1, k;
  for (i = 0; i < n; i++) {
    do { k = randInt(ICE_FLAVORS.length); } while (k === prev);
    scoops.push(k);
    prev = k;
  }
  return { scoops: scoops, top: withTop ? ICE_TOPS[randInt(ICE_TOPS.length)] : null };
}

function iceNextOrder() {
  ice.want = ice.orders[ice.served];
  ice.got = [];
  ice.gotTop = false;
  ice.customer.inT = 0.8;
  ice.customer.happyT = 0;
  ice.customer.hop = 1;
}

function initIcecream() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'clock')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  ice.orders = [iceMakeOrder(2, false), iceMakeOrder(2, false), iceMakeOrder(3, false), iceMakeOrder(3, false), iceMakeOrder(4, true), iceMakeOrder(4, true)];
  ice.served = 0;
  ice.serveT = 0;
  ice.finishT = 0;
  ice.wrongT = 0;
  ice.dropT = -1;
  ice.taskDelay = 0;
  ice.customer.earT = 0;
  iceNextOrder();
  iceSetupProps();
  princess.x = viewW * 0.45;
  princess.y = viewH * 0.82;
  princess.facing = 1;
  princess.walkPhase = 0;
  renderBackground();
  playNote(659, 0, 0.2, 'triangle', 0.35);
  playNote(784, 0.12, 0.2, 'triangle', 0.35);
  playNote(988, 0.24, 0.3, 'triangle', 0.35);
}

function respawnIcecream() {}
function resizeIcecream() {
  princess.x = viewW * 0.45;
  princess.y = viewH * 0.82;
  iceSetupProps();
}

function iceOrderDone() {
  var cp = iceConePos();
  ice.served++;
  ice.customer.happyT = 1.4;
  ice.serveT = 1.6;
  ice.want = null;
  spawnSparkles(cp.x, cp.y - viewH * 0.16, 20, '#ff9fd0');
  playNote(659, 0, 0.2, 'triangle', 0.35);
  playNote(880, 0.1, 0.25, 'triangle', 0.35);
  playNote(1175, 0.2, 0.3, 'triangle', 0.35);
  if (ice.served === 2 || ice.served === 4) ice.taskDelay = 1.7;
  if (ice.served >= ICE_ORDERS) ice.finishT = 1.2;
}

function handleIcecreamTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, p, dx, dy, want = ice.want;
  if (want && ice.customer.inT <= 0) {
    // Maut
    for (i = 0; i < ICE_FLAVORS.length; i++) {
      p = iceTubPos(i);
      dx = px - p.x; dy = py - p.y;
      if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
        if (ice.got.length < want.scoops.length && want.scoops[ice.got.length] === i) {
          ice.got.push(i);
          var cp = iceConePos();
          spawnSparkles(cp.x, cp.y - viewH * 0.06 - ice.got.length * viewH * 0.045, 10, ICE_FLAVORS[i].hi);
          playNote(700 + ice.got.length * 90, 0, 0.14, 'sine', 0.3);
          if (ice.got.length === want.scoops.length && !want.top) iceOrderDone();
        } else {
          ice.wrongT = 0.5;
          ice.dropT = 0;
          ice.dropX = iceConePos().x + (Math.random() - 0.5) * viewW * 0.08;
          ice.dropC = ICE_FLAVORS[i].c;
          playNote(220, 0, 0.15, 'sine', 0.2);
        }
        return;
      }
    }
    // Koristeet
    for (i = 0; i < ICE_TOPS.length; i++) {
      p = iceTopPos(i);
      dx = px - p.x; dy = py - p.y;
      if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
        if (want.top === ICE_TOPS[i] && ice.got.length === want.scoops.length && !ice.gotTop) {
          ice.gotTop = true;
          playNote(1047, 0, 0.14, 'sine', 0.3);
          iceOrderDone();
        } else {
          ice.wrongT = 0.5;
          playNote(220, 0, 0.15, 'sine', 0.2);
        }
        return;
      }
    }
  }
  p = iceCustomerPos();
  if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
    ice.customer.hop = 1;
    playNote(1300, 0, 0.08, 'sine', 0.25);
    playNote(1600, 0.07, 0.1, 'sine', 0.2);
    return;
  }
  // Koristeet (kyltti, pehmiskone, kello) vain, kun napautus ei osunut peliin
  propsTap(px, py);
}

function updateIcecream(dt) {
  var k = ice.customer;
  updateTasks(dt);
  k.earT += dt * 3;
  if (k.hop > 0) k.hop = Math.max(0, k.hop - dt * 3);
  if (k.inT > 0) k.inT -= dt;
  if (ice.wrongT > 0) ice.wrongT -= dt;
  if (ice.dropT >= 0) { ice.dropT += dt; if (ice.dropT > 1.2) ice.dropT = -1; }
  if (ice.taskDelay > 0) {
    ice.taskDelay -= dt;
    if (ice.taskDelay <= 0) {
      if (ice.served === 2 && !tasks[0].opened) taskStart(tasks[0]);
      else if (ice.served === 4 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (ice.serveT > 0 && !puzzleBusy()) {
    ice.serveT -= dt;
    if (ice.serveT <= 0 && ice.served < ICE_ORDERS) iceNextOrder();
  }
  if (ice.finishT > 0 && !celebrating && !puzzleBusy()) {
    ice.finishT -= dt;
    if (ice.finishT <= 0) startCelebration();
  }
  if (k.happyT > 0) {
    k.happyT -= dt;
    k.hop = Math.abs(Math.sin(globalT * 10));
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function icecreamLayers() {
  return [
    { speed: 0.22, render: renderIcecreamFar },
    { speed: 0.55, render: renderIcecreamMid },
    { speed: 1, render: renderIcecreamNear }
  ];
}
function renderIcecreamBg(b, w, h) {
  renderIcecreamFar(b, w, h);
  renderIcecreamMid(b, w, h);
  renderIcecreamNear(b, w, h);
}
function renderIcecreamFar(b, w, h) {
  var vw = viewW;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#5fa8ff');
  sky.addColorStop(0.55, '#c8ecff');
  sky.addColorStop(1, '#e8f6ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.22, h * 0.14, h * 0.06, 0.22, '#fff4c8', '#fffdf0', '#ffd45a');
  drawCloud(b, vw * 0.12, h * 0.12, h * 0.03, 0.8);
  drawCloud(b, vw * 0.7, h * 0.08, h * 0.025, 0.8);
}
function renderIcecreamMid(b, w, h) {
  var vw = viewW, i, haze = '#c8ecff';
  // Kaukainen maailmanpyörä ja teltta: ei reunaviivaa, sävy kohti taivasta
  b.strokeStyle = 'rgba(255,255,255,0.7)';
  b.lineWidth = h * 0.006;
  b.beginPath(); b.arc(vw * 0.82, h * 0.3, h * 0.13, 0, Math.PI * 2); b.stroke();
  for (i = 0; i < 8; i++) { b.beginPath(); b.moveTo(vw * 0.82, h * 0.3); b.lineTo(vw * 0.82 + Math.cos(i * Math.PI / 4) * h * 0.13, h * 0.3 + Math.sin(i * Math.PI / 4) * h * 0.13); b.stroke(); }
  for (i = 0; i < 8; i++) artCircle(b, vw * 0.82 + Math.cos(i * Math.PI / 4) * h * 0.13, h * 0.3 + Math.sin(i * Math.PI / 4) * h * 0.13, h * 0.012, artMix(maneColors[i % 6], haze, 0.3), { line: false });
  drawFairTent(b, vw * 0.62, h * 0.46, h * 0.12, '#c8323c', '#e8f6ff');
  var gr = b.createLinearGradient(0, h * 0.44, 0, h * 0.6);
  gr.addColorStop(0, '#9fdc7f');
  gr.addColorStop(1, '#6fbb60');
  b.fillStyle = gr;
  b.fillRect(0, h * 0.44, w, h * 0.16);
}
function renderIcecreamNear(b, w, h) {
  var vw = viewW, x, y, lw = Math.max(1.2, h * 0.003);
  // Markiisi: raidat, kaarireuna ja tummempi reunaviiva
  b.fillStyle = '#ff7bac';
  b.fillRect(0, h * 0.14, vw * 0.52, h * 0.09);
  b.fillStyle = '#fff';
  for (x = 0; x < vw * 0.52; x += h * 0.1) b.fillRect(x, h * 0.14, h * 0.05, h * 0.09);
  b.fillStyle = '#ff7bac';
  for (x = h * 0.025; x < vw * 0.52 + h * 0.05; x += h * 0.05) { b.beginPath(); b.arc(x, h * 0.23, h * 0.025, 0, Math.PI); b.fill(); }
  b.fillStyle = '#fff';
  for (x = h * 0.075; x < vw * 0.52; x += h * 0.1) { b.beginPath(); b.arc(x, h * 0.23, h * 0.025, 0, Math.PI); b.fill(); }
  b.strokeStyle = '#c96a92';
  b.lineWidth = lw;
  b.beginPath();
  for (x = h * 0.025; x < vw * 0.52 + h * 0.05; x += h * 0.05) { b.moveTo(x - h * 0.025, h * 0.23); b.arc(x, h * 0.23, h * 0.025, Math.PI, 0, true); }
  b.stroke();
  b.fillStyle = 'rgba(120,40,70,0.25)';
  b.fillRect(0, h * 0.14, vw * 0.52, h * 0.005);
  // Kojun seinä
  b.fillStyle = '#fff6e8';
  b.fillRect(0, h * 0.25, vw * 0.52, h * 0.36);
  b.fillStyle = 'rgba(255,150,190,0.25)';
  for (x = 0; x < vw * 0.52; x += h * 0.08) b.fillRect(x, h * 0.25, h * 0.03, h * 0.36);
  // (Iso jäätelökyltti katoksen päässä on tökättävä koriste, ks. iceSetupProps)
  // Tiski
  var cg = b.createLinearGradient(0, h * 0.6, 0, h);
  cg.addColorStop(0, '#c98b4a');
  cg.addColorStop(1, '#8a5a30');
  b.fillStyle = cg;
  b.fillRect(0, h * 0.6, w, h * 0.4);
  b.fillStyle = '#e8c49a';
  b.fillRect(0, h * 0.6, w, h * 0.025);
  b.fillStyle = 'rgba(90,58,30,0.5)';
  b.fillRect(0, h * 0.625, w, h * 0.004);
  b.fillStyle = 'rgba(0,0,0,0.12)';
  for (y = h * 0.68; y < h; y += h * 0.08) b.fillRect(0, y, w, 2);
  // Makuastioiden hylly
  artRoundRect(b, vw * 0.04, h * 0.53, vw * 0.46, h * 0.05, h * 0.015, '#7fd4ff', { lineColor: '#2a7aa8', line: lw });
  // Tötterön teline
  var cp = iceConePos();
  artRoundRect(b, cp.x - h * 0.06, cp.y - h * 0.02, h * 0.12, h * 0.04, h * 0.012, '#e8eef7', { lineColor: '#9aa6c0', shadeTo: '#d8d0ea', line: lw });
}

function drawIceScoop(c, x, y, r, fl) {
  var g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, fl.hi);
  g.addColorStop(1, fl.c);
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = artShade(fl.c, -0.35);
  c.lineWidth = Math.max(1, r * 0.09);
  c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.08)';
  c.beginPath(); c.arc(x + r * 0.25, y + r * 0.3, r * 0.15, 0, Math.PI * 2); c.fill();
}

function drawIceTop(c, kind, x, y, s) {
  var i;
  if (kind === 'cherry') {
    c.strokeStyle = '#5a8a30';
    c.lineWidth = Math.max(1.5, s * 0.12);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.8, x + s * 0.6, y - s * 1.1); c.stroke();
    var g = c.createRadialGradient(x - s * 0.2, y - s * 0.2, s * 0.05, x, y, s * 0.6);
    g.addColorStop(0, '#ff8f9f');
    g.addColorStop(1, '#c8102e');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, s * 0.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7a0a1e';
    c.lineWidth = Math.max(1, s * 0.08);
    c.stroke();
    artHighlight(c, x - s * 0.22, y - s * 0.24, s * 0.16, s * 0.1, 0.45);
  } else {
    var cols = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];
    for (i = 0; i < 9; i++) {
      c.save();
      c.translate(x + Math.cos(i * 2.3) * s * 0.7, y + Math.sin(i * 1.7) * s * 0.45);
      c.rotate(i * 0.8);
      c.fillStyle = cols[i % 5];
      roundRect(c, -s * 0.22, -s * 0.07, s * 0.44, s * 0.14, s * 0.06);
      c.fill();
      c.restore();
    }
  }
}

// Tötterö: scoops = makuindeksit alhaalta ylös, top = koriste tai null, alpha viimeiselle
function drawIceCone(c, x, y, s, scoops, top, alpha) {
  var i, r = s * 1.05;
  c.beginPath(); c.moveTo(x - s * 0.9, y - s * 0.3); c.lineTo(x + s * 0.9, y - s * 0.3); c.lineTo(x, y + s * 2.2); c.closePath();
  artFillPath(c, '#e8a860', y - s * 0.3, y + s * 2.2, s * 0.9, { lineColor: '#8a5a30', line: Math.max(1, s * 0.09) });
  c.strokeStyle = 'rgba(140,90,40,0.5)';
  c.lineWidth = Math.max(1, s * 0.06);
  for (i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(x - s * 0.8 + i * s * 0.45, y - s * 0.3); c.lineTo(x + s * 0.3 + i * s * 0.1, y + s * 1.6 - i * s * 0.5); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.8 - i * s * 0.45, y - s * 0.3); c.lineTo(x - s * 0.3 - i * s * 0.1, y + s * 1.6 - i * s * 0.5); c.stroke();
  }
  for (i = 0; i < scoops.length; i++) {
    if (i === scoops.length - 1 && alpha !== undefined) c.globalAlpha = alpha;
    drawIceScoop(c, x + (i % 2 ? s * 0.08 : -s * 0.08), y - s * 0.6 - i * r * 1.45, r, ICE_FLAVORS[scoops[i]]);
    c.globalAlpha = 1;
  }
  if (top) drawIceTop(c, top, x, y - s * 0.6 - scoops.length * r * 1.45 + r * 0.6, s * 0.5);
}

function drawIceTub(c, x, y, s, fl, dim, jx) {
  artShadow(c, x + jx, y + s * 1.05, s * 1.2, s * 0.25, 0.18);
  artRoundRect(c, x - s * 1.1 + jx, y - s * 0.3, s * 2.2, s * 1.3, s * 0.2, '#e8eef7', { lineColor: '#9aa6c0', shadeTo: '#d8d0ea' });
  artHighlight(c, x - s * 0.7 + jx, y + s * 0.15, s * 0.16, s * 0.35, 0.3);
  c.globalAlpha = dim ? 0.55 : 1;
  artBlob(c, x + jx, y - s * 0.3, s * 1.0, s * 0.35, fl.c, { lineColor: artShade(fl.c, -0.35), line: Math.max(1, s * 0.07) });
  drawIceScoop(c, x + jx, y - s * 0.7, s * 0.6, fl);
  c.globalAlpha = 1;
}

function drawIceCustomer(c) {
  var k = ice.customer, p = iceCustomerPos(), s = viewH * 0.055;
  var y = p.y - viewH * 0.12;
  var slide = k.inT > 0 ? k.inT / 0.8 : 0;
  var x = p.x + slide * viewW * 0.2;
  drawBunny(c, x, y, s, k.hop * viewH * 0.025, k.earT, false);
  if (k.happyT > 0) {
    drawHeartShape(c, x, y - s * 2.6 - Math.sin(globalT * 4) * s * 0.1, s * 0.25, true);
  } else if (ice.want && k.inT <= 0) {
    var n = ice.want.scoops.length;
    var bh = s * (2.2 + n * 0.55), bw = s * 2.4, bx = x - s * 1.6, by = y - s * 2.6 - bh / 2;
    c.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(c, bx - bw / 2, by - bh / 2, bw, bh, s * 0.4);
    c.fill();
    c.beginPath(); c.moveTo(bx + s * 0.4, by + bh / 2 - 1); c.lineTo(bx + s * 0.95, by + bh / 2 - 1); c.lineTo(bx + s * 1.2, by + bh / 2 + s * 0.5); c.closePath(); c.fill();
    drawIceCone(c, bx, by + bh / 2 - s * 0.9, s * 0.34, ice.want.scoops, ice.want.top, 1);
    // Seuraava pallo korostuu: nuoli sen vierellä
    if (ice.got.length < n) {
      var ay = by + bh / 2 - s * 0.9 - s * 0.34 * 0.6 - ice.got.length * s * 0.34 * 1.05 * 1.45;
      c.fillStyle = '#ffb300';
      c.beginPath(); c.moveTo(bx - s * 0.95 + Math.sin(globalT * 6) * s * 0.05, ay); c.lineTo(bx - s * 0.65, ay - s * 0.18); c.lineTo(bx - s * 0.65, ay + s * 0.18); c.closePath(); c.fill();
    }
  }
}

function drawIcecreamHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * ICE_ORDERS + pad, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < ICE_ORDERS; i++) {
    c.globalAlpha = i < ice.served ? 1 : 0.3;
    drawIceCone(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 2.2, hs * 0.5, ice.orders[i].scoops.slice(0, 2), null, 1);
    c.globalAlpha = 1;
  }
}

function drawIcecream() {
  var i, p, jx;
  if (!beginPlayWorld()) return;
  // Tökättävät koristeet (kyltti, pehmiskone, kello)
  propsDraw(ctx);
  // Makuastiat
  for (i = 0; i < ICE_FLAVORS.length; i++) {
    p = iceTubPos(i);
    jx = 0;
    if (ice.wrongT > 0 && !(ice.want && ice.want.scoops[ice.got.length] === i)) jx = Math.sin(globalT * 40) * viewH * 0.006 * ice.wrongT;
    drawIceTub(ctx, p.x, p.y, viewH * 0.035, ICE_FLAVORS[i], false, jx);
  }
  // Koristeet
  for (i = 0; i < ICE_TOPS.length; i++) {
    p = iceTopPos(i);
    artBlob(ctx, p.x, p.y + viewH * 0.015, viewH * 0.05, viewH * 0.018, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5', alpha: 0.9 });
    drawIceTop(ctx, ICE_TOPS[i], p.x, p.y - viewH * 0.005, viewH * 0.025);
  }
  // Tötterö telineessä
  var cp = iceConePos();
  drawIceCone(ctx, cp.x, cp.y - viewH * 0.06, viewH * 0.042, ice.got, ice.gotTop && ice.want ? ice.want.top : null, 1);
  // Pudonnut pallo
  if (ice.dropT >= 0) {
    var dy = cp.y + viewH * 0.02 + Math.min(1, ice.dropT * 2.5) * viewH * 0.05, sq = 1 - Math.min(0.5, ice.dropT * 0.5);
    ctx.globalAlpha = Math.max(0, 1 - ice.dropT / 1.2);
    artBlob(ctx, ice.dropX, dy, viewH * 0.03 / sq, viewH * 0.03 * sq, ice.dropC, { lineColor: artShade(ice.dropC, -0.35) });
    ctx.globalAlpha = 1;
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawIceCustomer(ctx);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawIcecreamHud(ctx);
  drawTaskOverlay(ctx);
}
