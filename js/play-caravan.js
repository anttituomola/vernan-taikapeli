'use strict';

// Kamelikaravaani (Kaukamaa, Aurinkodyynit): laskukenttä raahaamalla.
// Hiekkamyrsky hajotti karavaanin kuormat. Jokaisen kamelin kyltissä on luku,
// ja kameli jaksaa kantaa juuri sen verran: raahaa lattian numerosäkkejä
// kamelin selkään, kunnes säkkien summa on sama kuin kyltin luku. Liian painava
// kuorma saa kamelin istahtamaan (sydän), ja viimeksi nostettu säkki putoaa
// takaisin. Oikea kuorma: kameli nousee iloisena ja on valmis matkaan.
// Neljä arvottua, kovenevaa kierrosta: yksi kameli; kaksi kamelia; kaksi
// kamelia ja kolmen säkin kuorma; kolme kamelia, joista yksi on liian raskas
// (säkkejä pitää ottaa pois = vähennys). Toisesta kierroksesta alkaen
// hiekkamyrsky lähestyy oikealta: jos se ehtii kameleille, sydän menee ja
// kierros arvotaan uudestaan. Virheetön kierros antaa kultaisen säkin.
// Tehtävät toisen ja kolmannen kierroksen jälkeen: maksa, vähennys.

// camels: kunkin kamelin ratkaisun säkkien määrä (pre = valmiiksi liian
// raskas: selässä pre säkkiä, joista osa pitää ottaa pois); lo/hi: kyltin
// luvun rajat; vmax: suurin säkki; extra: hämäyssäkit; time: myrskyn saapuminen (s)
var CARAVAN_ROUNDS = [
  { camels: [{ n: 2 }], lo: 5, hi: 7, vmax: 4, extra: 2, time: 0 },
  { camels: [{ n: 2 }, { n: 2 }], lo: 6, hi: 8, vmax: 5, extra: 2, time: 70 },
  { camels: [{ n: 3 }, { n: 2 }], lo: 7, hi: 10, vmax: 5, extra: 2, time: 75 },
  { camels: [{ pre: 3 }, { n: 2 }, { n: 3 }], lo: 6, hi: 10, vmax: 5, extra: 1, time: 90 }
];
var CARAVAN_SACK_COLORS = ['#d9b27a', '#c9a06a', '#e0bc88', '#cfa870'];
var CARAVAN_BLANKETS = ['#ff7bac', '#5fa8ff', '#ffd24f'];
var CARAVAN_WALK_T = 1.4;   // kamelien sisään- ja uloskävely
var CARAVAN_MAX_LOAD = 4;   // säkkejä selässä enintään

var caravan = {
  round: 0, state: 'intro', t: 0, R: null, camels: [], sacks: [], drag: null,
  storm: 0, flawless: true, gold: [], taskDelay: -1, hintT: 0, dropped: false, gen: 0
};

// Kamelin mittakaava: kolme kamelia mahtuu rinnakkain
function caravanS() {
  var n = caravan.camels.length || 1;
  return Math.min(viewH * 0.0034, viewW * (n === 3 ? 0.25 : 0.3) / 150);
}
function caravanBaseY() { return viewH * 0.6; }
function caravanSackR() { return Math.min(viewH * 0.058, viewW * 0.034); }
function caravanCamelX(i, n) {
  var span = n === 1 ? 0 : n === 2 ? 0.3 : 0.25;
  return viewW * (0.42 + (i - (n - 1) / 2) * span);
}
function caravanSlotX(i, n) {
  var gap = Math.min(viewW * 0.085, viewW * 0.66 / Math.max(1, n));
  return viewW * 0.42 + (i - (n - 1) / 2) * gap;
}
function caravanSlotY() { return viewH * 0.855; }
// Kamelin selän säkkipaikat (kyssän kahta puolta)
function caravanBackPos(cm, k, n) {
  var s = caravanS(), x = cm.x + (cm.walk || 0), y = caravanBaseY() - s * 70 + cm.kneel * s * 26;
  var gap = caravanOnR() * 1.5, x0 = x - (n - 1) * gap / 2;
  return { x: x0 + k * gap, y: y - Math.abs(k - (n - 1) / 2) * -s * 4 };
}
// Selässä olevat säkit ovat kamelin kokoisia
function caravanOnR() { return Math.min(caravanSackR(), caravanS() * 14); }
function caravanSum(cm) {
  var i, n = 0;
  for (i = 0; i < cm.sacks.length; i++) n += cm.sacks[i].v;
  return n;
}

// ---------- Arvonta ----------
function caravanRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
// n säkkiä, joiden summa on lo..hi ja kukin 1..vmax; ykkösiä enintään yksi
function caravanPartition(n, lo, hi, vmax) {
  var tries, i, vals, sum, ones;
  for (tries = 0; tries < 200; tries++) {
    vals = []; sum = 0; ones = 0;
    for (i = 0; i < n; i++) {
      vals.push(caravanRandInt(1, vmax));
      sum += vals[i];
      if (vals[i] === 1) ones++;
    }
    if (sum >= lo && sum <= hi && ones <= 1) return { vals: vals, sum: sum };
  }
  vals = [];
  for (i = 0; i < n; i++) vals.push(Math.min(vmax, Math.ceil(lo / n)));
  return { vals: vals, sum: vals.reduce(function (a, b) { return a + b; }, 0) };
}
function caravanShuffle(a) {
  var i, j, t;
  for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
// Kierroksen kamelit ja säkit. Ratkaisu rakennetaan ensin, joten kierros
// ratkeaa aina; yksittäinen säkki ei koskaan yksin täytä kylttiä.
function caravanGenerate(R) {
  var camels = [], ground = [], i, k, d, p, target, pre, rem, n = R.camels.length, used = {};
  for (i = 0; i < n; i++) {
    d = R.camels[i];
    if (d.pre) {
      // Liian raskas kameli: selässä pre säkkiä, yksi niistä pitää ottaa pois
      for (k = 0; k < 50; k++) {
        p = caravanPartition(d.pre, R.lo + 2, R.hi + 4, R.vmax);
        rem = caravanRandInt(0, d.pre - 1);
        target = p.sum - p.vals[rem];
        if (target >= R.lo && target <= R.hi && p.vals[rem] >= 2) break;
      }
      pre = p.vals;
    } else {
      for (k = 0; k < 50; k++) {
        p = caravanPartition(d.n, R.lo, R.hi, R.vmax);
        if (!used[p.sum] || k > 40) break;
      }
      target = p.sum;
      pre = [];
      for (k = 0; k < p.vals.length; k++) ground.push(p.vals[k]);
    }
    used[target] = true;
    camels.push({ target: target, pre: pre });
  }
  for (i = 0; i < R.extra; i++) ground.push(caravanRandInt(2, R.vmax));
  return { camels: camels, ground: caravanShuffle(ground) };
}

// ---------- Alustus ----------
function initCaravan() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  caravan.round = 0;
  caravan.gold = [];
  caravan.taskDelay = -1;
  caravan.hintT = 0;
  caravan.dropped = false;
  caravan.gen = 0;
  princess.x = viewW * 0.04;
  princess.y = viewH * 0.95;
  princess.facing = 1;
  caravanStartRound();
  caravanSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

// Tökättävät koristeet oikeassa laidassa, säkkimaton ja kamelien ulkopuolella:
// teltta (heilahtaa; joka kolmas tökkäys kurkistuttaa pupun oviaukosta),
// taatelikori (taateli hyppää korista) ja kivellä nukkuva kissa (haukottelee).
// Kamelit ääntelevät jo napautuksesta (handleCaravanTap).
function caravanSetupProps() {
  var W = viewW, h = viewH;
  propsReset();
  propAdd({
    x: W * 0.9, y: h * 0.64, r: h * 0.1, hy: h * 0.07, color: '#ffb04f', note: 494, amp: 0.06, bunnyT: 0,
    update: function (p, dt) { if (p.bunnyT > 0) p.bunnyT -= dt; },
    draw: function (c, p) {
      var s = h * 0.09;
      artShadow(c, 0, s * 0.05, s * 1.3, s * 0.15, 0.15);
      c.beginPath(); c.moveTo(-s * 1.2, 0); c.lineTo(0, -s * 1.5); c.lineTo(s * 1.2, 0); c.closePath();
      artFillPath(c, '#ffb04f', -s * 1.5, 0, s, { lineColor: '#8a4a20' });
      c.fillStyle = 'rgba(200,60,40,0.5)';
      c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(0, -s * 1.5); c.lineTo(-s * 0.35, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(s * 0.6, 0); c.lineTo(0, -s * 1.5); c.lineTo(s * 1.0, 0); c.closePath(); c.fill();
      c.fillStyle = '#4a2a18';
      c.beginPath(); c.moveTo(-s * 0.3, 0); c.lineTo(0, -s * 0.8); c.lineTo(s * 0.3, 0); c.closePath(); c.fill();
      if (p.bunnyT > 0) drawBunny(c, 0, -s * 0.3, s * 0.3 * Math.min(1, p.bunnyT * 3, (2 - p.bunnyT) * 4), 0, globalT * 8, true);
      c.strokeStyle = '#6a3a18';
      c.lineWidth = Math.max(1.5, s * 0.04);
      c.beginPath(); c.moveTo(0, -s * 1.5); c.lineTo(0, -s * 1.85); c.stroke();
      c.fillStyle = '#5fa8ff';
      c.beginPath(); c.moveTo(0, -s * 1.85); c.lineTo(s * 0.35 + Math.sin(globalT * 6) * s * 0.04, -s * 1.75); c.lineTo(0, -s * 1.65); c.closePath(); c.fill();
    },
    poke: function (p) {
      if (p.n % 3 === 0) {
        p.bunnyT = 2;
        playNote(784, 0.15, 0.1, 'sine', 0.22);
        playNote(988, 0.27, 0.14, 'sine', 0.22);
      }
    }
  });
  propAdd({
    x: W * 0.84, y: h * 0.93, r: h * 0.06, hy: h * 0.045, color: '#d9a860', note: 587,
    draw: function (c) {
      var s = h * 0.045;
      artShadow(c, 0, s * 0.05, s * 1.1, s * 0.2, 0.15);
      artCircle(c, -s * 0.35, -s * 0.95, s * 0.28, '#8a4a20', { lineColor: '#4a2810' });
      artCircle(c, s * 0.3, -s * 1.0, s * 0.28, '#a05a28', { lineColor: '#4a2810' });
      artCircle(c, 0, -s * 1.15, s * 0.28, '#8a4a20', { lineColor: '#4a2810' });
      c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.0, -s * 1.0); c.lineTo(s * 1.0, -s * 1.0); c.lineTo(s * 0.8, 0); c.closePath();
      artFillPath(c, '#d9a860', -s, 0, s, { lineColor: '#7a5028' });
      c.strokeStyle = 'rgba(120,80,40,0.5)';
      c.lineWidth = Math.max(1, s * 0.06);
      c.beginPath(); c.moveTo(-s * 0.95, -s * 0.66); c.lineTo(s * 0.95, -s * 0.66); c.moveTo(-s * 0.88, -s * 0.33); c.lineTo(s * 0.88, -s * 0.33); c.stroke();
      artRoundRect(c, -s * 1.05, -s * 1.15, s * 2.1, s * 0.25, s * 0.08, '#c08a48', { lineColor: '#7a5028' });
    },
    poke: function (p) {
      var s = h * 0.045;
      propDropBall(p.x + (Math.random() - 0.5) * s, p.y - s * 1.4, s * 0.26, '#8a4a20', p.y - s * 0.2, (Math.random() - 0.5) * W * 0.12);
    }
  });
  propAdd({
    x: W * 0.94, y: h * 0.86, r: h * 0.06, hy: h * 0.04, color: '#ffd9b8', note: 660, amp: 0.05, yawnT: 0,
    update: function (p, dt) { if (p.yawnT > 0) p.yawnT -= dt; },
    draw: function (c, p) { caravanDrawCat(c, 0, 0, h * 0.03, p.yawnT > 0); },
    poke: function (p) {
      p.yawnT = 0.9;
      playNote(660, 0.05, 0.12, 'sine', 0.18);
      playNote(880, 0.15, 0.25, 'sine', 0.16);
    }
  });
}
// Kerällä nukkuva kissa kivellä: origo kiven alla; yawn avaa suun ja silmät
function caravanDrawCat(c, x, y, s, yawn) {
  artBlob(c, x, y - s * 0.4, s * 1.5, s * 0.75, '#c9a070', { lineColor: '#8a6a40', hi: 0.3 });
  artBlob(c, x, y - s * 1.2, s * 1.0, s * 0.55, '#9a9aa8', { shadeTo: '#6a6a78', lineColor: '#44444e', hi: 0.25 });
  artLimb(c, x + s * 0.8, y - s * 1.1, x + s * 1.3, y - s * 1.7, s * 0.2, '#9a9aa8', '#44444e');
  artCircle(c, x - s * 0.7, y - s * 1.55, s * 0.42, '#9a9aa8', { lineColor: '#44444e' });
  c.fillStyle = '#9a9aa8';
  c.beginPath(); c.moveTo(x - s * 1.05, y - s * 1.7); c.lineTo(x - s * 0.95, y - s * 2.15); c.lineTo(x - s * 0.7, y - s * 1.9); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.35, y - s * 1.7); c.lineTo(x - s * 0.45, y - s * 2.15); c.lineTo(x - s * 0.7, y - s * 1.9); c.closePath(); c.fill();
  artEye(c, x - s * 0.85, y - s * 1.6, s * 0.07, 0, !yawn);
  artEye(c, x - s * 0.55, y - s * 1.6, s * 0.07, 0, !yawn);
  if (yawn) artBlob(c, x - s * 0.7, y - s * 1.35, s * 0.1, s * 0.13, '#c0505a', { line: false });
}
function caravanStartRound() {
  var R = CARAVAN_ROUNDS[caravan.round], G = caravanGenerate(R), i, k, cm, n = G.camels.length, sk;
  caravan.R = R;
  caravan.gen++;
  caravan.camels = [];
  caravan.sacks = [];
  caravan.drag = null;
  caravan.storm = 0;
  caravan.flawless = true;
  caravan.state = 'enter';
  caravan.t = 0;
  for (i = 0; i < n; i++) {
    cm = {
      idx: i, target: G.camels[i].target, x: caravanCamelX(i, n), walk: -viewW, sacks: [],
      done: false, kneel: 0, sitT: 0, shakeT: 0, happyT: 0, blinkT: Math.random() * 3,
      grunt: 0, blanket: CARAVAN_BLANKETS[i % CARAVAN_BLANKETS.length], heavy: G.camels[i].pre.length > 0
    };
    for (k = 0; k < G.camels[i].pre.length; k++) {
      sk = caravanMakeSack(G.camels[i].pre[k]);
      sk.on = cm;
      cm.sacks.push(sk);
      caravan.sacks.push(sk);
    }
    caravan.camels.push(cm);
  }
  for (i = 0; i < G.ground.length; i++) {
    sk = caravanMakeSack(G.ground[i]);
    sk.slot = i;
    caravan.sacks.push(sk);
  }
  caravan.slots = caravan.sacks.length;
  caravanReslot();
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    sk.appear = -i * 0.08;
    caravanSackHome(sk, true);
  }
}
function caravanMakeSack(v) {
  return { v: v, on: null, slot: -1, x: 0, y: 0, back: null, appear: 1, wob: 0, color: CARAVAN_SACK_COLORS[v % CARAVAN_SACK_COLORS.length] };
}
// Lattian säkit järjestetään riviin; pois otetut vievät vapaan paikan
function caravanReslot() {
  var i, used = {}, sk, free = 0;
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    if (!sk.on && sk.slot >= 0) used[sk.slot] = true;
  }
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    if (!sk.on && sk.slot < 0) {
      while (used[free]) free++;
      sk.slot = free;
      used[free] = true;
    }
  }
}
function caravanSackHome(sk, snap) {
  var p, list;
  if (sk.on) {
    list = sk.on.sacks;
    p = caravanBackPos(sk.on, list.indexOf(sk), list.length);
  } else {
    p = { x: caravanSlotX(sk.slot, caravan.slots), y: caravanSlotY() };
  }
  sk.hx = p.x; sk.hy = p.y;
  if (snap) { sk.x = p.x; sk.y = p.y; }
}
function respawnCaravan() {
  // Sydämet loppu: kierros arvotaan uudestaan
  caravanStartRound();
  caravan.state = 'play';
  for (var i = 0; i < caravan.camels.length; i++) caravan.camels[i].walk = 0;
}
function resizeCaravan() {
  var i, n = caravan.camels.length;
  camX = 0;
  for (i = 0; i < n; i++) caravan.camels[i].x = caravanCamelX(i, n);
  for (i = 0; i < caravan.sacks.length; i++) caravanSackHome(caravan.sacks[i], true);
  princess.x = viewW * 0.04;
  princess.y = viewH * 0.95;
  caravanSetupProps();
}

// ---------- Syöte ----------
function caravanCamelHit(cm, px, py) {
  var s = caravanS(), x = cm.x + (cm.walk || 0), y = caravanBaseY();
  var dx = (px - x) / (s * 62), dy = (py - (y - s * 60)) / (s * 55);
  return dx * dx + dy * dy <= 1;
}
function handleCaravanTap(px, py) {
  var i, sk, d, bd = 1e9, best = null, r = caravanSackR() * 1.35, cm;
  if (!running || celebrating || puzzleBusy()) return;
  if (caravan.state !== 'play') { propsTap(px, py); return; }
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    if (sk.back || (sk.on && sk.on.done)) continue;
    d = Math.hypot(px - sk.x, py - sk.y);
    if (d < r && d < bd) { bd = d; best = sk; }
  }
  if (best) {
    caravan.drag = best;
    if (best.on) {
      cm = best.on;
      cm.sacks.splice(cm.sacks.indexOf(best), 1);
      best.on = null;
      best.slot = -1;
      for (i = 0; i < cm.sacks.length; i++) caravanSackHome(cm.sacks[i]);
      if (cm.heavy && caravanSum(cm) <= cm.target) cm.sitT = 0;
      playNote(520, 0, 0.08, 'sine', 0.2);
    } else {
      playNote(880, 0, 0.08, 'sine', 0.2);
    }
    return;
  }
  // Kameliin voi napauttaa: se ääntelee ja räpäyttää
  for (i = 0; i < caravan.camels.length; i++) {
    cm = caravan.camels[i];
    if (caravanCamelHit(cm, px, py)) {
      cm.grunt = 0.6;
      playNote(160 + i * 30, 0, 0.18, 'sawtooth', 0.12);
      playNote(120 + i * 30, 0.12, 0.22, 'sawtooth', 0.1);
      return;
    }
  }
  // Koristeet (teltta, kori, kissa) vain, kun napautus ei osunut säkkiin eikä kameliin
  propsTap(px, py);
}
function caravanDrop(sk) {
  var i, cm, target = null, sum;
  for (i = 0; i < caravan.camels.length; i++) {
    cm = caravan.camels[i];
    if (!cm.done && caravanCamelHit(cm, sk.x, sk.y + caravanSackR() * 0.5)) { target = cm; break; }
  }
  if (!target || target.sacks.length >= CARAVAN_MAX_LOAD) {
    caravanToGround(sk);
    return;
  }
  sk.on = target;
  sk.slot = -1;
  target.sacks.push(sk);
  for (i = 0; i < target.sacks.length; i++) caravanSackHome(target.sacks[i]);
  caravan.dropped = true;
  sum = caravanSum(target);
  playNote(420 + sum * 40, 0, 0.16, 'triangle', 0.3);
  if (sum > target.target) caravanOverload(target, sk);
}
function caravanToGround(sk) {
  sk.on = null;
  sk.slot = -1;
  caravanReslot();
  caravanSackHome(sk);
  sk.back = { x0: sk.x, y0: sk.y, t: 0 };
}
// Liian painava: kameli istahtaa, sydän menee, viimeinen säkki putoaa
function caravanOverload(cm, sk) {
  var gen = caravan.gen;
  cm.sitT = 1.1;
  cm.shakeT = 0.6;
  caravan.flawless = false;
  artShakeStart(viewH * 0.008, 0.3);
  playNote(180, 0.05, 0.25, 'sawtooth', 0.18);
  playNote(130, 0.25, 0.35, 'sawtooth', 0.15);
  cm.dropSack = sk;
  cm.dropT = 0.7;
  loseHeart();
  if (caravan.gen !== gen) cm.dropSack = null;
}

// ---------- Päivitys ----------
function updateCaravan(dt) {
  var i, cm, sk, k, busy, allDone, R = caravan.R, s = caravanS();
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  caravan.t += dt;
  // Raahaus
  if (caravan.drag) {
    sk = caravan.drag;
    if (holding && !busy) {
      sk.x += (lastPX - sk.x) * Math.min(1, dt * 18);
      sk.y += (lastPY - caravanSackR() * 0.9 - sk.y) * Math.min(1, dt * 18);
    } else {
      caravan.drag = null;
      caravanDrop(sk);
    }
  }
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    sk.appear = Math.min(1, sk.appear + dt * 2.5);
    if (sk.wob > 0) sk.wob -= dt;
    if (sk === caravan.drag) continue;
    if (sk.back) {
      sk.back.t += dt;
      k = easeOutCubic(Math.min(1, sk.back.t / 0.45));
      sk.x = sk.back.x0 + (sk.hx - sk.back.x0) * k;
      sk.y = sk.back.y0 + (sk.hy - sk.back.y0) * k - Math.sin(k * Math.PI) * viewH * 0.06;
      if (sk.back.t >= 0.45) sk.back = null;
    } else {
      caravanSackHome(sk);
      sk.x += (sk.hx - sk.x) * Math.min(1, dt * 12);
      sk.y += (sk.hy - sk.y) * Math.min(1, dt * 12);
    }
  }
  // Kamelit
  allDone = caravan.camels.length > 0;
  for (i = 0; i < caravan.camels.length; i++) {
    cm = caravan.camels[i];
    cm.blinkT -= dt;
    if (cm.blinkT < -0.15) cm.blinkT = 2 + Math.random() * 3;
    if (cm.grunt > 0) cm.grunt -= dt;
    if (cm.shakeT > 0) cm.shakeT -= dt;
    if (cm.happyT > 0) cm.happyT -= dt;
    if (cm.sitT > 0) cm.sitT -= dt;
    // Liian raskas kameli istuu, kunnes kuorma kevenee
    var sit = cm.sitT > 0 || (cm.heavy && !cm.done && caravanSum(cm) > cm.target);
    cm.kneel += ((sit ? 1 : 0) - cm.kneel) * Math.min(1, dt * 6);
    if (cm.dropSack && cm.dropT > 0) {
      cm.dropT -= dt;
      if (cm.dropT <= 0) {
        k = cm.sacks.indexOf(cm.dropSack);
        if (k >= 0) {
          cm.sacks.splice(k, 1);
          caravanToGround(cm.dropSack);
          playNote(300, 0, 0.1, 'triangle', 0.2);
        }
        cm.dropSack = null;
      }
    }
    // Oikea kuorma: kameli on valmis
    if (!cm.done && !cm.dropSack && caravan.state === 'play' && caravanSum(cm) === cm.target && caravan.drag === null) {
      cm.done = true;
      cm.happyT = 1.2;
      artPop(cm.x, caravanBaseY() - s * 110, viewH * 0.06, '#6fd66f', 'burst');
      spawnSparkles(cm.x, caravanBaseY() - s * 100, 16, '#ffe27a');
      playNote(659, 0, 0.14, 'triangle', 0.35);
      playNote(880, 0.1, 0.14, 'triangle', 0.35);
      playNote(1047, 0.2, 0.25, 'triangle', 0.35);
    }
    if (!cm.done) allDone = false;
  }
  if (caravan.state === 'enter') {
    k = easeOutCubic(Math.min(1, caravan.t / CARAVAN_WALK_T));
    for (i = 0; i < caravan.camels.length; i++) caravan.camels[i].walk = -viewW * (1 - k);
    if (caravan.t >= CARAVAN_WALK_T) { caravan.state = 'play'; caravan.t = 0; }
  } else if (caravan.state === 'play') {
    if (!busy && !celebrating) {
      if (caravan.round === 0 && !caravan.dropped) caravan.hintT += dt;
      if (R.time > 0) {
        caravan.storm += dt / R.time;
        if (caravan.storm >= 1) caravanStormHit();
      }
    }
    if (allDone) caravanRoundDone();
  } else if (caravan.state === 'leave') {
    k = Math.min(1, caravan.t / CARAVAN_WALK_T);
    for (i = 0; i < caravan.camels.length; i++) caravan.camels[i].walk = -viewW * k * k;
    caravan.storm = Math.max(0, caravan.storm - dt * 0.8);
    if (caravan.t >= CARAVAN_WALK_T) {
      if (caravan.taskDelay > 0 && !busy) {
        caravan.taskDelay -= dt;
        if (caravan.taskDelay <= 0) {
          if (caravan.round === 1) taskStart(tasks[0]);
          else if (caravan.round === 2) taskStart(tasks[1]);
        }
      } else if (!busy) {
        caravan.round++;
        caravanStartRound();
      }
    }
  } else if (caravan.state === 'won') {
    k = Math.min(1, caravan.t / (CARAVAN_WALK_T * 1.5));
    for (i = 0; i < caravan.camels.length; i++) caravan.camels[i].walk = -viewW * 0.25 * k;
    if (caravan.t > 1.2 && !celebrating) startCelebration();
  }
}
function caravanRoundDone() {
  caravan.gold.push(caravan.flawless);
  caravan.t = 0;
  soundFanfare();
  if (caravan.round + 1 >= CARAVAN_ROUNDS.length) {
    caravan.state = 'won';
    return;
  }
  caravan.state = 'leave';
  caravan.taskDelay = caravan.round === 1 || caravan.round === 2 ? 0.4 : -1;
  if (caravan.flawless) spawnSparkles(hudX() + viewH * 0.05, viewH * 0.04, 12, '#ffd24f');
}
// Myrsky ehti kameleille: sydän menee ja kuormat hajoavat, kierros arvotaan uudestaan
function caravanStormHit() {
  var gen = caravan.gen;
  artShakeStart(viewH * 0.012, 0.5);
  playNote(110, 0, 0.5, 'sawtooth', 0.15);
  caravan.flawless = false;
  loseHeart();
  if (caravan.gen !== gen) return;
  caravanStartRound();
  caravan.state = 'play';
  for (var i = 0; i < caravan.camels.length; i++) caravan.camels[i].walk = 0;
}

// ---------- Piirto: tausta ----------
function renderCaravanBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), x, i;
  g.addColorStop(0, '#5ec8e8');
  g.addColorStop(0.42, '#ffe2b0');
  g.addColorStop(1, '#f0c078');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.14, h * 0.12, h * 0.06, 0.1, '#fff0b0', '#fffbe8', '#ffd24f');
  // Kaukaiset dyynit kahdessa kerroksessa
  b.fillStyle = artMix('#f0b878', '#ffe2b0', 0.5);
  b.beginPath(); b.moveTo(0, h * 0.42);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.36 - Math.sin(x / vw * 6 + 1) * 0.03));
  b.lineTo(vw, h * 0.45); b.lineTo(0, h * 0.45); b.closePath(); b.fill();
  b.fillStyle = artMix('#eaa860', '#ffe2b0', 0.25);
  b.beginPath(); b.moveTo(0, h * 0.5);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.44 - Math.sin(x / vw * 4 + 2.5) * 0.035));
  b.lineTo(vw, h * 0.52); b.lineTo(0, h * 0.52); b.closePath(); b.fill();
  // Keidas vasemmalla taivaanrannassa: sinne karavaani on menossa
  artBlob(b, vw * 0.06, h * 0.455, h * 0.1, h * 0.014, '#7fd4ff', { line: false });
  drawPalm(b, vw * 0.03, h * 0.46, h * 0.1);
  drawPalm(b, vw * 0.1, h * 0.46, h * 0.08);
  // Lähin hiekka
  g = b.createLinearGradient(0, h * 0.5, 0, h);
  g.addColorStop(0, '#f7d696');
  g.addColorStop(1, '#e6b064');
  b.fillStyle = g;
  b.beginPath(); b.moveTo(0, h * 0.53);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.51 - Math.sin(x / vw * 3) * 0.02));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Säkkien lastauspaikka: kulunut matto
  artRoundRect(b, vw * 0.08, h * 0.79, vw * 0.68, h * 0.14, h * 0.03, '#c0503a', { shadeTo: '#8a3020', lineColor: '#6a2418', hi: 0.1 });
  b.strokeStyle = 'rgba(255,220,140,0.6)';
  b.lineWidth = Math.max(2, h * 0.005);
  b.setLineDash([h * 0.015, h * 0.012]);
  roundRect(b, vw * 0.09, h * 0.8, vw * 0.66, h * 0.12, h * 0.025);
  b.stroke();
  b.setLineDash([]);
  // Väreet ja kivet
  b.strokeStyle = 'rgba(190,130,60,0.25)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 26; i++) {
    x = vw * ((i * 0.618) % 1);
    var y = h * (0.55 + ((i * 0.377) % 1) * 0.22);
    b.beginPath(); b.moveTo(x - h * 0.03, y); b.quadraticCurveTo(x, y - h * 0.01, x + h * 0.03, y); b.stroke();
  }
  // Oikean laidan kivi, kori ja teltta ovat tökättäviä koristeita (caravanSetupProps)
}

// ---------- Piirto: kameli, säkki, myrsky ----------
function caravanDrawCamel(c, cm) {
  var s = caravanS(), x = cm.x + (cm.walk || 0), by = caravanBaseY(), kn = cm.kneel, i;
  var walking = caravan.state === 'enter' || caravan.state === 'leave' || caravan.state === 'won';
  var step = walking ? Math.sin(globalT * 10 + cm.idx) : 0;
  var shake = cm.shakeT > 0 ? Math.sin(globalT * 50) * s * 3 : 0;
  var hop = cm.happyT > 0 ? Math.abs(Math.sin(cm.happyT * 8)) * s * 10 : 0;
  var y = by - hop;
  var bodyY = y - s * 50 + kn * s * 26;
  var leg = s * 48 * (1 - kn * 0.6);
  x += shake;
  artShadow(c, x, by + s * 4, s * 62, s * 10, 0.2);
  c.save();
  c.translate(x, 0);
  // Takajalat varjosävyllä
  artLimb(c, s * 30, bodyY + s * 10, s * 34 - step * s * 8, bodyY + s * 10 + leg, s * 9, '#c9955a', '#8a5a30');
  artLimb(c, -s * 26, bodyY + s * 10, -s * 30 + step * s * 8, bodyY + s * 10 + leg, s * 9, '#c9955a', '#8a5a30');
  artLimb(c, s * 22, bodyY + s * 12, s * 22 + step * s * 8, bodyY + s * 12 + leg, s * 9.5, '#e8b070', '#8a5a30');
  artLimb(c, -s * 34, bodyY + s * 12, -s * 34 - step * s * 8, bodyY + s * 12 + leg, s * 9.5, '#e8b070', '#8a5a30');
  // Häntä
  artLimb(c, s * 44, bodyY - s * 4, s * 50, bodyY + s * 20, s * 3, '#c9955a', '#8a5a30');
  // Runko ja kyssä
  artBlob(c, 0, bodyY, s * 48, s * 22, '#e8b070', { shadeTo: '#c9955a', lineColor: '#8a5a30', hi: 0.25 });
  artBlob(c, s * 2, bodyY - s * 18, s * 24, s * 18, '#e8b070', { shadeTo: '#c9955a', lineColor: '#8a5a30', hi: 0.3 });
  // Satulapeite
  artRoundRect(c, -s * 26, bodyY - s * 14, s * 54, s * 20, s * 8, cm.blanket, { shadeTo: artShade(cm.blanket, -0.35), lineColor: artShade(cm.blanket, -0.5), hi: 0.2 });
  c.fillStyle = '#fff5d8';
  for (i = 0; i < 5; i++) {
    c.beginPath(); c.arc(-s * 20 + i * s * 10.5, bodyY + s * 6, s * 2.2, 0, Math.PI * 2); c.fill();
  }
  // Kaula ja pää (vasemmalle)
  var nod = cm.grunt > 0 ? Math.sin(cm.grunt * 18) * s * 3 : 0;
  var headDrop = kn * s * 10;
  artLimb(c, -s * 38, bodyY - s * 6, -s * 56, bodyY - s * 40 + headDrop + nod, s * 12, '#e8b070', '#8a5a30');
  artBlob(c, -s * 64, bodyY - s * 46 + headDrop + nod, s * 17, s * 11, '#e8b070', { shadeTo: '#c9955a', lineColor: '#8a5a30', hi: 0.3 });
  artBlob(c, -s * 58, bodyY - s * 58 + headDrop + nod, s * 4, s * 6, '#d9a060', { lineColor: '#8a5a30' });
  c.restore();
  // Kasvot: pää on vasemmalla, keitaan suuntaan
  var hx = x - 64 * s, hy = bodyY - s * 46 + headDrop + nod;
  artEye(c, hx + 2 * s, hy - s * 3, s * 3.6, -1, cm.blinkT < 0 || kn > 0.6);
  if (cm.happyT > 0 || cm.done) {
    c.strokeStyle = '#6a4020';
    c.lineWidth = Math.max(1.5, s * 1.4);
    c.beginPath(); c.arc(hx - 8 * s, hy + s * 3, s * 4, 0.2, Math.PI - 0.2); c.stroke();
  } else if (kn > 0.4 || cm.grunt > 0) {
    artBlob(c, hx - 9 * s, hy + s * 5, s * 3, s * 2.5, '#6a3020', { line: false });
  }
  artBlush(c, hx + 4 * s, hy + s * 4, s * 3);
  // Kyltti kaulassa: kuorman luku
  var sx = x - 54 * s, sy = bodyY + s * 8 + headDrop * 0.3;
  var ok = cm.done, bad = cm.shakeT > 0 || (cm.heavy && !cm.done && caravanSum(cm) > cm.target);
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(1, s * 0.8);
  c.beginPath(); c.moveTo(sx - s * 8, sy - s * 12); c.lineTo(sx, sy - s * 4); c.lineTo(sx + s * 8, sy - s * 12); c.stroke();
  artCircle(c, sx, sy + s * 6, s * 13, ok ? '#6fd66f' : bad ? '#ff7a6a' : '#fff4d0', { lineColor: ok ? '#2f8a3a' : bad ? '#a03020' : '#8a5a30', hi: 0.35 });
  c.fillStyle = ok ? '#fff' : bad ? '#fff' : '#6a3a10';
  c.font = 'bold ' + Math.round(s * 16) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(cm.target + '', sx, sy + s * 7);
  c.textBaseline = 'alphabetic';
  if (ok) {
    // Tupsu ja tähti: valmis matkaan
    artGlow(c, x, bodyY - s * 40, s * 50, '#ffe27a', 0.25 + Math.sin(globalT * 4) * 0.1);
  }
}
function caravanDrawSack(c, x, y, r, v, color, alpha, lifted) {
  var i, cols, row, dx, dy, dr;
  if (alpha !== undefined) c.globalAlpha = alpha;
  if (!lifted) artShadow(c, x, y + r * 0.95, r * 0.95, r * 0.22, 0.18);
  // Säkki: pyöreä pohja, kurottu suu
  c.beginPath();
  c.moveTo(x - r * 0.35, y - r * 0.7);
  c.quadraticCurveTo(x - r * 1.05, y - r * 0.2, x - r * 0.9, y + r * 0.55);
  c.quadraticCurveTo(x - r * 0.8, y + r, x, y + r);
  c.quadraticCurveTo(x + r * 0.8, y + r, x + r * 0.9, y + r * 0.55);
  c.quadraticCurveTo(x + r * 1.05, y - r * 0.2, x + r * 0.35, y - r * 0.7);
  c.closePath();
  artFillPath(c, color, y - r * 0.7, y + r, r, { lineColor: '#7a5028' });
  artBlob(c, x, y - r * 0.82, r * 0.42, r * 0.2, artShade(color, 0.1), { lineColor: '#7a5028' });
  c.strokeStyle = '#b04a2a';
  c.lineWidth = Math.max(1.5, r * 0.1);
  c.beginPath(); c.moveTo(x - r * 0.38, y - r * 0.62); c.lineTo(x + r * 0.38, y - r * 0.62); c.stroke();
  // Luku ja pisteet
  c.fillStyle = '#5a3010';
  c.font = 'bold ' + Math.round(r * 0.95) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(v + '', x, y + r * 0.05);
  c.textBaseline = 'alphabetic';
  cols = v <= 3 ? v : Math.ceil(v / 2);
  dr = r * 0.09;
  for (i = 0; i < v; i++) {
    row = v <= 3 ? 0 : Math.floor(i / cols);
    dx = (i % cols - (Math.min(cols, v - row * cols) - 1) / 2) * dr * 2.8;
    dy = y + r * 0.6 + row * dr * 2.4 - (v > 3 ? dr * 1.2 : 0);
    c.fillStyle = '#b04a2a';
    c.beginPath(); c.arc(x + dx, dy, dr, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
function caravanDrawStorm(c) {
  var R = caravan.R, h = viewH, W = viewW, p = caravan.storm, x, i, y, a;
  if (!R || R.time <= 0) return;
  // Myrskyrintama liukuu oikealta kohti kameleita
  x = W * (1.12 - p * 0.3);
  var g = c.createLinearGradient(x - W * 0.08, 0, x + W * 0.1, 0);
  g.addColorStop(0, 'rgba(200,140,80,0)');
  g.addColorStop(0.5, 'rgba(190,130,70,' + (0.55 + p * 0.3) + ')');
  g.addColorStop(1, 'rgba(160,100,50,0.9)');
  c.fillStyle = g;
  c.fillRect(x - W * 0.08, 0, W * 0.4, h);
  c.strokeStyle = 'rgba(255,230,190,0.5)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    y = h * (0.12 + i * 0.12);
    a = globalT * 3 + i * 1.7;
    c.beginPath();
    c.arc(x + W * 0.04 + Math.sin(a) * W * 0.015, y, h * (0.03 + (i % 3) * 0.012), a, a + 3.6);
    c.stroke();
  }
  // Varoitus, kun myrsky on lähellä
  if (p > 0.75) {
    c.globalAlpha = 0.5 + Math.sin(globalT * 10) * 0.3;
    c.fillStyle = '#ff5f3a';
    c.font = 'bold ' + Math.round(h * 0.07) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.fillText('!', x - W * 0.02, h * 0.3);
    c.globalAlpha = 1;
  }
}

function drawCaravan() {
  var c = ctx, i, sk, cm, r = caravanSackR(), s = caravanS();
  if (!beginPlayWorld()) return;
  caravanDrawStorm(c);
  propsDraw(c);
  drawPrincessFree(c, princess.x, princess.y, viewH / 560, 1, 0, false, globalT);
  for (i = 0; i < caravan.camels.length; i++) caravanDrawCamel(c, caravan.camels[i]);
  // Kohdekorostus raahatessa
  if (caravan.drag) {
    for (i = 0; i < caravan.camels.length; i++) {
      cm = caravan.camels[i];
      if (cm.done || cm.sacks.length >= CARAVAN_MAX_LOAD) continue;
      c.strokeStyle = 'rgba(255,240,160,' + (0.5 + Math.sin(globalT * 6) * 0.3) + ')';
      c.lineWidth = Math.max(2, s * 1.2);
      c.beginPath();
      if (c.ellipse) c.ellipse(cm.x + cm.walk, caravanBaseY() - s * 60, s * 62, s * 55, 0, 0, Math.PI * 2);
      else c.arc(cm.x + cm.walk, caravanBaseY() - s * 60, s * 58, 0, Math.PI * 2);
      c.stroke();
    }
  }
  for (i = 0; i < caravan.sacks.length; i++) {
    sk = caravan.sacks[i];
    if (sk === caravan.drag || sk.appear <= 0) continue;
    var sc = easeOutBack(Math.max(0, sk.appear));
    var ox = sk.on ? (sk.on.shakeT > 0 ? Math.sin(globalT * 50) * s * 3 : 0) : 0;
    caravanDrawSack(c, sk.x + ox, sk.y, (sk.on ? caravanOnR() : r) * sc, sk.v, sk.color, 1, !!sk.on);
  }
  if (caravan.drag) {
    sk = caravan.drag;
    artShadow(c, sk.x, sk.y + r * 2.2, r * 0.9, r * 0.22, 0.12);
    caravanDrawSack(c, sk.x, sk.y, r * 1.12, sk.v, sk.color, 1, true);
  }
  // Vihje: käsi vie ensimmäisen säkin kamelin selkään
  if (caravan.round === 0 && !caravan.dropped && !caravan.drag && caravan.state === 'play' && caravan.hintT > 2) {
    var hp = (caravan.hintT - 2) % 3.4, g0 = null;
    for (i = 0; i < caravan.sacks.length; i++) if (!caravan.sacks[i].on) { g0 = caravan.sacks[i]; break; }
    cm = caravan.camels[0];
    if (g0 && cm && hp < 2.0) {
      var kk = easeInOutSine(Math.min(1, hp / 1.6)), tp = caravanBackPos(cm, 0, 1);
      var hx = g0.hx + (tp.x - g0.hx) * kk, hy = g0.hy + (tp.y - g0.hy) * kk;
      c.globalAlpha = hp > 1.7 ? (2.0 - hp) / 0.3 : 0.85;
      if (kk > 0.05) caravanDrawSack(c, hx, hy, r, g0.v, g0.color, c.globalAlpha, true);
      drawHand(c, hx + r * 0.5, hy + r * 1.1, r * 0.9);
      c.globalAlpha = 1;
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawCaravanHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}
// HUD: kierrokset säkkeinä, kultainen = virheetön kierros; myrskymittari
function drawCaravanHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = CARAVAN_ROUNDS.length, done;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * n + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    done = i < caravan.gold.length;
    caravanDrawSack(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.6, hs * 1.1, i + 1,
      done && caravan.gold[i] ? '#ffd24f' : '#d9b27a', done ? 1 : 0.3, true);
  }
  var R = caravan.R;
  if (R && R.time > 0 && caravan.state === 'play') {
    var bx = viewW * 0.66, bw = viewW * 0.22, by = pad * 0.5 + hs * 1.1;
    c.fillStyle = 'rgba(255,255,255,0.45)';
    roundRect(c, bx, by, bw, hs * 1.2, hs * 0.6);
    c.fill();
    c.fillStyle = caravan.storm > 0.75 ? '#ff7a4a' : '#c89060';
    roundRect(c, bx, by, Math.max(hs * 1.2, bw * Math.min(1, caravan.storm)), hs * 1.2, hs * 0.6);
    c.fill();
    // Kameli vasemmalla, pyörre oikealla
    artCircle(c, bx - hs * 0.9, by + hs * 0.6, hs * 0.7, '#e8b070', { lineColor: '#8a5a30' });
    c.strokeStyle = '#8a5a30';
    c.lineWidth = Math.max(1.5, hs * 0.2);
    c.beginPath(); c.arc(bx + bw + hs * 0.9, by + hs * 0.6, hs * 0.6, globalT * 4, globalT * 4 + 4.5); c.stroke();
  }
}

HUB_ICONS.caravan = function (c, x, y, s) {
  caravanDrawSack(c, x - s * 0.12, y + s * 0.04, s * 0.13, 3, '#d9b27a', 1, false);
  caravanDrawSack(c, x + s * 0.14, y + s * 0.06, s * 0.11, 2, '#e0bc88', 1, false);
};
