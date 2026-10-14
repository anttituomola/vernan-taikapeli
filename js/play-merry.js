'use strict';

// Karuselli (Kaukamaa, Pupula): helppo ajoituskenttä ilman sydämiä. Pupulan
// torilla pyörii karuselli edestä nähtynä: pyöreä lava, raidallinen katos ja
// kuusi eläinistuinta (poni, joutsen, kukko, possu, sammakko, yksisarvinen),
// jotka keinuvat tankojensa varassa ylös ja alas. Jokaisella istuimella on
// värillinen satulahuopa.
//   - Pupujono odottaa edessä. Ensimmäinen pupu seisoo hohtavalla matolla ja
//     pitää lippua, jonka väri on yhden vapaan istuimen väri.
//   - Kun lipun istuin on lähimpänä edessä (matto ja valokeila hehkuvat
//     lipun värisinä), napautus (mihin tahansa) hypäyttää pupun kyytiin.
//   - Väärä istuin edessä: pupu hyppää, huomaa värin, kikattaa ja hyppää
//     takaisin. Ei rangaistusta.
//   - Kyydissä oleva pupu keinuu mukana ja vilkuttaa välillä.
// Kolme kierrosta (MERRY_ROUNDS): 4 pupua hitaasti, 5 vähän nopeammin, 6
// nopeammin ja lippuun tulee myös kuvio (sydän tai tähti), kun huovat
// maalautuvat kolmella värillä ja kahdella kuviolla. Kierroksen lopuksi
// karuselli soittaa pienen sävelmän ja kaikki vilkuttavat; kierrosten välissä
// kyytiläiset hyppäävät iloisina pois ja uusi jono hyppii paikalle.
// Ikkuna: lipun istuin -MERRY_WIN..+MERRY_LATE rad etukohdasta (-30°..+46°,
// myöhäinen napautus armollinen): kierros 1: 2,9 s, kierros 2: 2,3 s,
// kierros 3: 2,1 s. Matto hehkuu koko ikkunan ajan.
// Vihjekäsi ensimmäiselle pupulle ja aina, kun lipun istuin on mennyt kerran
// ohi tai pupu on hypännyt kahdesti väärään. Tökättävät: kissa penkillä
// (3.: kissa kehrää ja kissanpentu kurkkaa), suihkulähde (3.: sateenkaari) ja
// ilmapallomyyjä (3.: sydänpallo karkaa taivaalle).

var MERRY_ROUNDS = [
  { n: 4, period: 11, shapes: false },
  { n: 5, period: 10, shapes: false },
  { n: 6, period: 10, shapes: true }
];
var MERRY_N = 6;
var MERRY_STEP = Math.PI * 2 / 6;
var MERRY_WIN = Math.PI / 6;        // istuin on "edessä", kun se on lähimpänä etukohtaa
var MERRY_LATE = 0.8;               // myöhäinen napautus käy vielä, kun lipun istuin on mennyt näin paljon ohi (rad)
var MERRY_HOP = 0.5;                // kyytiin hypyn kesto (s)
var MERRY_OOPS = 1.15;              // väärän hypyn kesto (s)
var MERRY_READ = 1.8;               // lippu näkyy vähintään näin kauan ennen istuimen tuloa (s)
var MERRY_ANIMALS = ['pony', 'swan', 'rooster', 'pig', 'frog', 'unicorn'];
var MERRY_COLORS = ['#ff6fae', '#4aa8ff', '#ffd23f', '#5fd36b', '#b678ff', '#ff9a3a'];
// Kolmannen kierroksen huovat: vastakkaisilla istuimilla sama väri, eri kuvio
var MERRY_SHAPE_SET = [
  { col: '#4aa8ff', shape: 'heart' }, { col: '#ff6fae', shape: 'star' }, { col: '#ffd23f', shape: 'heart' },
  { col: '#4aa8ff', shape: 'star' }, { col: '#ff6fae', shape: 'heart' }, { col: '#ffd23f', shape: 'star' }
];
var MERRY_CHIME = [1047, 1175, 1319, 1568, 1760, 2093];

var merry = {
  rot: 0, speed: 0, round: 0, state: 'play', stateT: 0,
  seats: [], queue: [], ticket: -1, act: null, leavers: [],
  seated: 0, total: 0, inWin: false, misses: 0, oopsN: 0, tuneT: 0,
  flyaway: [], fountainT: 0, rainbowT: 0, catT: 0, purrT: 0, sellerT: 0, repaintT: 0,
  ticketPop: 0, firstHint: true
};

// ---------- Mitat ----------
function merryGeo() {
  var W = viewW, H = viewH, rx = Math.min(W * 0.34, H * 0.46);
  return {
    W: W, H: H, cx: W * 0.5, rx: rx, ry: rx * 0.2, P: H * 0.66, sk: H * 0.05,
    canY: H * 0.26, topY: H * 0.06, matY: H * 0.88, qy: H * 0.9, sp: H * 0.105, bs: H * 0.055
  };
}
function merryWrap(a) {
  a = a % (Math.PI * 2);
  return a < 0 ? a + Math.PI * 2 : a;
}
// Kulma etukohdasta (-π..π): negatiivinen = tulossa vasemmalta
function merryDelta(i) {
  return merryWrap(merry.rot + i * MERRY_STEP + Math.PI) - Math.PI;
}
function merryOmega() {
  return Math.PI * 2 / MERRY_ROUNDS[merry.round].period;
}
// Istuimen asento: etukohta on kulma 0 (z = 1), edessä istuimet kulkevat oikealle
function merrySeatPose(i, g) {
  var th = merry.rot + i * MERRY_STEP, z = Math.cos(th), sn = Math.sin(th), k = 0.8 + 0.2 * z;
  var base = g.P + z * g.ry * 0.8, s = g.H * 0.105 * k, bob = Math.sin(merry.rot * 4 + i * 2.1) * g.H * 0.02 * k;
  var y = base - g.H * 0.16 * k + bob;
  return {
    z: z, x: g.cx + sn * g.rx * 0.8, base: base, k: k, s: s, y: y, sy: y - s * 0.42,
    face: z >= 0 ? 1 : -1, kx: 0.45 + 0.55 * Math.abs(z), poleTop: g.canY + z * g.ry * 0.8
  };
}
function merryQueueX(slot, g) { return g.cx - slot * g.sp; }

// ---------- Alustus ----------
function initMerry() {
  var i;
  tasks = [];
  camX = 0;
  merry.rot = -MERRY_STEP * 2.3;
  merry.round = 0;
  merry.speed = merryOmega();
  merry.seats = [];
  for (i = 0; i < MERRY_N; i++) merry.seats.push({ animal: MERRY_ANIMALS[i], col: MERRY_COLORS[i], shape: null, rider: null, glow: 0 });
  merry.act = null;
  merry.leavers = [];
  merry.flyaway = [];
  merry.total = 0;
  merry.firstHint = true;
  merry.rainbowT = 0;
  merry.purrT = 0;
  merry.sellerT = 0;
  merry.repaintT = 0;
  merryStartRound(true);
  merrySetupProps();
  renderBackground();
  playNote(784, 0, 0.2, 'sine', 0.3);
  playNote(988, 0.14, 0.2, 'sine', 0.3);
  playNote(1175, 0.28, 0.2, 'sine', 0.3);
  playNote(1568, 0.42, 0.4, 'sine', 0.3);
}
function merryStartRound(first) {
  var i, n = MERRY_ROUNDS[merry.round].n, g = merryGeo(), off = (g.cx + g.H * 0.15) / g.sp;
  merry.state = 'play';
  merry.stateT = 0;
  merry.seated = 0;
  merry.ticket = -1;
  merry.misses = 0;
  merry.oopsN = 0;
  merry.inWin = false;
  if (first || !merry.queue.length) {
    merry.queue = [];
    for (i = 0; i < n; i++) merry.queue.push(merryNewBunny(i, off + i * 0.9));
  }
}
function merryNewBunny(slot, from) {
  return { slot: from, tslot: slot, ph: Math.random() * 6, blink: 2 + Math.random() * 3, ear: Math.random() * 6 };
}
function respawnMerry() {}
function resizeMerry() {
  camX = 0;
  merrySetupProps();
}

// Lippu: vapaa istuin, jonka tuloon etukohtaan on vähintään MERRY_READ s
// (aikaa katsoa lippua), mieluiten ei kovin kaukana, jottei odotus veny.
function merryPickTicket() {
  var i, d, t, w = merryOmega(), cand = [], near = [], best = -1, bt = 1e9;
  for (i = 0; i < MERRY_N; i++) {
    if (merry.seats[i].rider) continue;
    d = merryWrap(-MERRY_WIN - (merry.rot + i * MERRY_STEP));
    t = d / w;
    cand.push(i);
    if (t >= MERRY_READ && t <= MERRY_READ + MERRY_ROUNDS[merry.round].period * 0.55) near.push(i);
    if (t >= MERRY_READ && t < bt) { bt = t; best = i; }
  }
  if (near.length) return near[Math.floor(Math.random() * near.length)];
  if (best >= 0) return best;
  return cand.length ? cand[0] : -1;
}

// ---------- Tökättävät koristeet ----------
function merrySetupProps() {
  var g = merryGeo(), H = g.H, W = g.W, sideL = Math.max(H * 0.12, (g.cx - g.rx) * 0.5), sideR = Math.min(W - H * 0.12, W - (g.cx - g.rx) * 0.5);
  propsReset();
  // Suihkulähde vasemmalla takana
  propAdd({ x: sideL, y: H * 0.62, r: H * 0.1, hy: H * 0.07, amp: 0.05, color: '#8fd8ff', note: 988, draw: merryDrawFountain, poke: merryPokeFountain });
  // Kissa penkillä oikealla takana
  propAdd({ x: sideR, y: H * 0.6, r: H * 0.09, hy: H * 0.06, amp: 0.08, color: '#ffd0a0', note: 698, draw: merryDrawBench, poke: merryPokeCat });
  // Ilmapallomyyjä oikealla edessä
  propAdd({ x: W - H * 0.09, y: H * 0.97, r: H * 0.12, hy: H * 0.17, amp: 0.06, color: '#ff8fc8', note: 1175, layer: 1, draw: merryDrawSeller, poke: merryPokeSeller });
}
function merryPokeFountain(p) {
  var i;
  merry.fountainT = 1;
  for (i = 0; i < 3; i++) propDropBall(p.x + (Math.random() - 0.5) * viewH * 0.06, p.y - viewH * 0.16, viewH * 0.008, '#8fd8ff', p.y + viewH * 0.01, (Math.random() - 0.5) * viewW * 0.12);
  playNote(523, 0, 0.1, 'sine', 0.2);
  playNote(784, 0.06, 0.12, 'sine', 0.18);
  if (p.n % 3 === 0) {
    // Yllätys: suihku nousee korkealle ja sen yllä kaartuu sateenkaari
    merry.rainbowT = 2.6;
    playNote(1047, 0.1, 0.2, 'triangle', 0.25);
    playNote(1319, 0.22, 0.2, 'triangle', 0.25);
    playNote(1568, 0.34, 0.4, 'triangle', 0.28);
  }
}
function merryPokeCat(p) {
  merry.catT = 0.9;
  playNote(740, 0, 0.12, 'triangle', 0.18);
  playNote(560, 0.1, 0.25, 'triangle', 0.16);
  if (p.n % 3 === 0) {
    // Yllätys: kissa kehrää sydämiä ja penkin takaa kurkkaa kissanpentu
    merry.purrT = 3;
    playNote(110, 0.05, 0.6, 'sawtooth', 0.06);
    playNote(880, 0.4, 0.1, 'triangle', 0.15);
    playNote(1047, 0.5, 0.15, 'triangle', 0.15);
  }
}
function merryPokeSeller(p) {
  merry.sellerT = 0.8;
  playNote(1400, 0, 0.06, 'square', 0.06);
  playNote(1600, 0.06, 0.06, 'square', 0.05);
  if (p.n % 3 === 0) {
    // Yllätys: sydänpallo karkaa ja leijuu taivaalle
    merry.flyaway.push({ fx: p.x / viewW, fy: (p.y - viewH * 0.3) / viewH, t: 0, ph: Math.random() * 6 });
    playNote(784, 0.1, 0.2, 'sine', 0.2);
    playNote(1047, 0.25, 0.2, 'sine', 0.2);
    playNote(1568, 0.4, 0.5, 'sine', 0.22);
  }
}

// ---------- Syöte ----------
function handleMerryTap(px, py) {
  var b, i, best = -1, bd = 9, d;
  if (!running || celebrating) return;
  if (propsTap(px, py)) return;
  if (merry.state !== 'play' || merry.act) return;
  b = merry.queue[0];
  if (!b || merry.ticket < 0 || Math.abs(b.slot) > 0.05) return;
  // Istuin lähimpänä etukohtaa
  for (i = 0; i < MERRY_N; i++) {
    d = Math.abs(merryDelta(i));
    if (d < bd) { bd = d; best = i; }
  }
  merry.queue.shift();
  for (i = 0; i < merry.queue.length; i++) merry.queue[i].tslot = i;
  // Lipun istuin edessä tai juuri ohi (myöhäinen napautus käy: MERRY_LATE)
  d = merryDelta(merry.ticket);
  if (d >= -MERRY_WIN && d <= MERRY_LATE && !merry.seats[merry.ticket].rider) {
    merry.act = { kind: 'board', t: 0, seat: merry.ticket, b: b };
    playNote(660, 0, 0.1, 'triangle', 0.22);
    playNote(990, 0.07, 0.12, 'triangle', 0.2);
  } else {
    // Väärä istuin: pupu käy katsomassa ja palaa matolle jonon kärkeen
    merry.queue.unshift(b);
    for (i = 0; i < merry.queue.length; i++) merry.queue[i].tslot = i;
    merry.act = { kind: 'oops', t: 0, seat: best, b: b };
    merry.oopsN++;
    playNote(520, 0, 0.1, 'triangle', 0.2);
  }
}
function merryGiggle() {
  playNote(988, 0, 0.07, 'triangle', 0.18);
  playNote(1175, 0.08, 0.07, 'triangle', 0.18);
  playNote(988, 0.16, 0.07, 'triangle', 0.18);
  playNote(1319, 0.24, 0.1, 'triangle', 0.18);
}
function merryMusicBox(i) {
  var f = MERRY_CHIME[i % MERRY_CHIME.length];
  playNote(f, 0, 0.5, 'sine', 0.22);
  playNote(f * 1.25, 0.1, 0.45, 'sine', 0.16);
  playNote(f * 1.5, 0.2, 0.6, 'sine', 0.14);
  playNote(f * 2, 0.3, 0.7, 'sine', 0.08);
}
// Karusellin sävelmä: lyhyt valssi soittorasiasoundilla (noin 3 s)
function merryTune() {
  var mel = [784, 1047, 1319, 1568, 1319, 1047, 1175, 1397, 1760, 1568, 0, 0, 1319, 1175, 1047, 1568, 1319, 1047];
  var bass = [262, 349, 294, 392, 262, 196];
  var i, b = 0.17;
  for (i = 0; i < mel.length; i++) if (mel[i]) playNote(mel[i], i * b, b * 1.6, 'sine', 0.2);
  for (i = 0; i < bass.length; i++) {
    playNote(bass[i], i * b * 3, b * 1.2, 'triangle', 0.2);
    playNote(bass[i] * 2, i * b * 3 + b, b * 0.6, 'triangle', 0.08);
    playNote(bass[i] * 2, i * b * 3 + b * 2, b * 0.6, 'triangle', 0.08);
  }
}

// ---------- Päivitys ----------
function updateMerry(dt) {
  var i, b, d, target, R = MERRY_ROUNDS[merry.round], g = merryGeo(), was, rate = 1.5;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  merry.stateT += dt;
  // Pyörimisnopeus
  target = R ? merryOmega() : 0;
  if (merry.state === 'tune') target *= 1.5;
  if (merry.state === 'stop' || merry.state === 'off') { target = 0; rate = 2.5; }
  if (merry.state === 'done') target = merryOmega() * 1.2;
  merry.speed += (target - merry.speed) * Math.min(1, dt * rate);
  merry.rot += merry.speed * dt;
  // Jono hyppii paikoilleen
  for (i = 0; i < merry.queue.length; i++) merryStepBunny(merry.queue[i], dt);
  // Kyytiläiset vilkuttavat välillä
  for (i = 0; i < MERRY_N; i++) {
    b = merry.seats[i].rider;
    if (merry.seats[i].glow > 0) merry.seats[i].glow -= dt;
    if (!b) continue;
    b.t += dt;
    b.wave -= dt;
    if (b.wave < -3 - (i % 3)) b.wave = 1.2;
  }
  merryUpdateAct(dt);
  merryUpdateLeavers(dt, g);
  if (merry.ticketPop > 0) merry.ticketPop -= dt;
  if (merry.fountainT > 0) merry.fountainT -= dt;
  if (merry.rainbowT > 0) merry.rainbowT -= dt;
  if (merry.catT > 0) merry.catT -= dt;
  if (merry.purrT > 0) merry.purrT -= dt;
  if (merry.sellerT > 0) merry.sellerT -= dt;
  if (merry.repaintT > 0) merry.repaintT -= dt;
  for (i = merry.flyaway.length - 1; i >= 0; i--) {
    merry.flyaway[i].t += dt;
    if (merry.flyaway[i].t > 7) merry.flyaway.splice(i, 1);
  }
  if (celebrating) return;
  if (merry.state === 'play') {
    b = merry.queue[0];
    // Uusi lippu, kun jonon kärki on matolla
    if (b && !merry.act && merry.ticket < 0 && Math.abs(b.slot) < 0.05) {
      merry.ticket = merryPickTicket();
      merry.ticketPop = 0.5;
      merry.misses = 0;
      merry.oopsN = 0;
      merry.inWin = false;
      playNote(1319, 0, 0.1, 'sine', 0.15);
    }
    // Lipun istuin edessä: matto hehkuu; ohi mennyt kerta laskee vihjeeseen
    was = merry.inWin;
    d = merry.ticket >= 0 ? merryDelta(merry.ticket) : 9;
    merry.inWin = !merry.act && d >= -MERRY_WIN && d <= MERRY_LATE;
    if (was && !merry.inWin && !merry.act && merry.ticket >= 0) merry.misses++;
    if (merry.seated >= R.n && !merry.act) {
      merry.state = 'tune';
      merry.stateT = 0;
      merry.ticket = -1;
      merryTune();
      for (i = 0; i < MERRY_N; i++) if (merry.seats[i].rider) merry.seats[i].rider.wave = 3.2;
    }
  } else if (merry.state === 'tune') {
    if (Math.random() < dt * 6) spawnSparkles(g.cx + (Math.random() - 0.5) * g.rx * 2, g.canY + Math.random() * g.H * 0.05, 3, ['#ffe27a', '#ff8fc8', '#8fd8ff'][Math.floor(Math.random() * 3)]);
    if (merry.stateT > 3.4) {
      merry.stateT = 0;
      if (merry.round + 1 >= MERRY_ROUNDS.length) {
        merry.state = 'done';
        startCelebration();
      } else {
        merry.state = 'stop';
      }
    }
  } else if (merry.state === 'stop') {
    if (merry.stateT > 1.4) {
      merry.state = 'off';
      merry.stateT = 0;
      merryHopOff(g);
    }
  } else if (merry.state === 'off') {
    if (merry.stateT > 0.9 && !merry.queue.length) {
      // Uusi jono hyppii vasemmalta
      var n = MERRY_ROUNDS[merry.round + 1].n, off = (g.cx + g.H * 0.15) / g.sp;
      for (i = 0; i < n; i++) merry.queue.push(merryNewBunny(i, off + i * 0.9));
    }
    if (MERRY_ROUNDS[merry.round + 1].shapes && merry.stateT > 1.5 && merry.repaintT <= 0 && !merry.seats[0].shape) merryRepaint(g);
    if (merry.stateT > 2.8 && !merry.leavers.length) {
      merry.round++;
      merryStartRound(false);
    }
  }
}
function merryStepBunny(b, dt) {
  var d = b.tslot - b.slot, v = 2.6 * dt;
  b.blink -= dt;
  if (b.blink < -0.15) b.blink = 2 + Math.random() * 3;
  if (Math.abs(d) < v) { b.slot = b.tslot; b.ph = 0; return; }
  b.slot += d > 0 ? v : -v;
  b.ph += dt;
}
function merryUpdateAct(dt) {
  var a = merry.act, g, p, s;
  if (!a) return;
  a.t += dt;
  if (a.kind === 'board' && a.t >= MERRY_HOP) {
    g = merryGeo();
    s = merry.seats[a.seat];
    s.rider = { t: 0, wave: 1.0, ear: a.b.ear };
    s.glow = 0.8;
    p = merrySeatPose(a.seat, g);
    spawnSparkles(p.x, p.sy - g.bs, 14, s.col);
    artPop(p.x, p.sy - g.bs * 0.6, g.bs * 1.2, s.col, 'burst');
    merryMusicBox(merry.seated);
    merry.seated++;
    merry.total++;
    merry.ticket = -1;
    merry.firstHint = false;
    merry.act = null;
  } else if (a.kind === 'oops') {
    if (a.t - dt < MERRY_HOP * 0.55 && a.t >= MERRY_HOP * 0.55) {
      merryGiggle();
      merry.ticketPop = 0.6;
    }
    if (a.t >= MERRY_OOPS) merry.act = null;
  }
}
// Kyytiläiset hyppäävät pois karusellin pysähdyttyä ja hyppelevät oikealle
function merryHopOff(g) {
  var i, n = 0, p;
  for (i = 0; i < MERRY_N; i++) {
    if (!merry.seats[i].rider) continue;
    p = merrySeatPose(i, g);
    merry.leavers.push({ seat: i, delay: n * 0.18, t: 0, x0: p.x / g.W, y0: p.sy / g.H, x1: (p.x + g.H * 0.06) / g.W, fx: p.x / g.W, fy: p.sy / g.H, run: false, ear: merry.seats[i].rider.ear });
    n++;
  }
  playNote(784, 0, 0.12, 'triangle', 0.2);
  playNote(1047, 0.12, 0.2, 'triangle', 0.2);
}
function merryUpdateLeavers(dt, g) {
  var i, L, k;
  for (i = merry.leavers.length - 1; i >= 0; i--) {
    L = merry.leavers[i];
    L.t += dt;
    if (L.t < L.delay) continue;
    if (merry.seats[L.seat].rider) {
      merry.seats[L.seat].rider = null;
      playNote(880 + (L.seat % 3) * 110, 0, 0.1, 'triangle', 0.15);
    }
    k = (L.t - L.delay) / 0.55;
    if (k < 1) {
      L.fx = L.x0 + (L.x1 - L.x0) * k;
      L.fy = L.y0 + (g.qy / g.H - L.y0) * k - Math.sin(k * Math.PI) * 0.1;
    } else {
      L.run = true;
      L.fx += dt * g.H * 0.55 / g.W;
      L.fy = g.qy / g.H;
      if (Math.random() < dt * 1.2) spawnSparkles(L.fx * g.W, L.fy * g.H - g.bs * 2.2, 3, '#ff8fc8');
    }
    if (L.fx > 1.15) merry.leavers.splice(i, 1);
  }
}
// Kolmas kierros: huovat maalautuvat kolmella värillä ja kahdella kuviolla
function merryRepaint(g) {
  var i, p;
  merry.repaintT = 1.2;
  for (i = 0; i < MERRY_N; i++) {
    merry.seats[i].col = MERRY_SHAPE_SET[i].col;
    merry.seats[i].shape = MERRY_SHAPE_SET[i].shape;
    merry.seats[i].glow = 1.0;
    p = merrySeatPose(i, g);
    spawnSparkles(p.x, p.y, 10, merry.seats[i].col);
  }
  playNote(1319, 0, 0.15, 'sine', 0.25);
  playNote(1568, 0.1, 0.15, 'sine', 0.25);
  playNote(2093, 0.2, 0.4, 'sine', 0.25);
}

// ---------- Piirto: tausta ----------
function renderMerryBg(b, w, h) {
  var W = viewW, H = h, g, i, x, y, hw, hh, col, roof, j, horizon = H * 0.56, G = merryGeo();
  // Taivas
  g = b.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#8fd0ff');
  g.addColorStop(0.7, '#d4efff');
  g.addColorStop(1, '#fff0e4');
  b.fillStyle = g;
  b.fillRect(0, 0, w, H);
  drawBgSun(b, W * 0.88, H * 0.1, H * 0.045, 1, '#fff4c8', '#fffdf0', '#ffd45a');
  // Kaukaiset kukkulat (ilmaperspektiivi)
  b.fillStyle = artMix('#9fdc8f', '#e8f6ff', 0.55);
  b.beginPath(); b.moveTo(0, horizon);
  for (x = 0; x <= W + 10; x += 10) b.lineTo(x, horizon - H * 0.12 - Math.sin(x / W * 5 + 1) * H * 0.03);
  b.lineTo(W, horizon); b.closePath(); b.fill();
  // Pupulan talot torin laidalla
  for (i = 0; i < 9; i++) {
    x = W * (i + 0.5) / 9 + (i % 2 ? H * 0.01 : -H * 0.01);
    hw = H * (0.06 + (i % 3) * 0.008);
    hh = H * (0.15 + ((i * 7) % 3) * 0.03);
    y = horizon + H * 0.01;
    col = ['#ffd0b0', '#d8f0c8', '#fff0a8', '#e0d0ff', '#ffc8d8', '#c8e8ff'][i % 6];
    roof = ['#e8705a', '#5fa8d8', '#c86aa8', '#e89a3a', '#d8607a', '#6a8ad8'][(i * 5) % 6];
    artRoundRect(b, x - hw, y - hh, hw * 2, hh, H * 0.008, artMix(col, '#e8f6ff', 0.15), { lineColor: artShade(col, -0.4), line: Math.max(1, H * 0.003) });
    b.beginPath(); b.moveTo(x - hw * 1.2, y - hh + H * 0.004); b.lineTo(x, y - hh - H * 0.07); b.lineTo(x + hw * 1.2, y - hh + H * 0.004); b.closePath();
    artFillPath(b, roof, y - hh - H * 0.07, y - hh, H * 0.03, { lineColor: artShade(roof, -0.4), line: Math.max(1, H * 0.003) });
    for (j = 0; j < 2; j++) {
      artRoundRect(b, x - hw * 0.7 + j * hw * 0.85, y - hh + H * 0.03, hw * 0.55, H * 0.035, H * 0.006, '#bfe8ff', { lineColor: '#6a8aa8', line: Math.max(1, H * 0.002) });
      b.fillStyle = 'rgba(255,255,255,0.6)';
      b.fillRect(x - hw * 0.7 + j * hw * 0.85 + hw * 0.08, y - hh + H * 0.035, hw * 0.12, H * 0.012);
    }
    artRoundRect(b, x - hw * 0.22, y - H * 0.06, hw * 0.44, H * 0.06, H * 0.01, '#a86a4a', { lineColor: '#6a3a2a', line: Math.max(1, H * 0.002) });
    // Ikkunalaatikon kukat
    for (j = 0; j < 3; j++) drawFlower(b, x - hw * 0.55 + j * hw * 0.25, y - hh + H * 0.07, H * 0.008, ['#ff7bac', '#ffd24f', '#b678ff'][(i + j) % 3]);
  }
  // Tori: mukulakiveys
  g = b.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, '#f2dcc0');
  g.addColorStop(1, '#e4c4a0');
  b.fillStyle = g;
  b.fillRect(0, horizon, w, H - horizon);
  b.fillStyle = 'rgba(160,120,90,0.18)';
  for (j = 0; j < 14; j++) {
    y = horizon + H * 0.015 + j * H * 0.033;
    for (i = 0; i < 40; i++) {
      x = (i + (j % 2) * 0.5) * W / 26 + ((i * 13 + j * 7) % 5) * H * 0.002;
      b.beginPath();
      if (b.ellipse) b.ellipse(x, y, H * (0.012 + j * 0.0012), H * (0.005 + j * 0.0006), 0, 0, Math.PI * 2);
      else b.arc(x, y, H * 0.008, 0, Math.PI * 2);
      b.fill();
    }
  }
  // Karusellin pyöreä kivetys
  b.save();
  b.beginPath();
  if (b.ellipse) b.ellipse(G.cx, G.P + G.ry * 0.9, G.rx * 1.3, G.ry * 2.2, 0, 0, Math.PI * 2);
  else b.arc(G.cx, G.P + G.ry, G.rx * 1.3, 0, Math.PI * 2);
  b.fillStyle = 'rgba(255,240,220,0.55)';
  b.fill();
  b.strokeStyle = 'rgba(200,150,110,0.35)';
  b.lineWidth = Math.max(2, H * 0.006);
  b.stroke();
  b.restore();
  // Viirinauhat talojen yllä
  for (j = 0; j < 2; j++) {
    var x0 = j ? W * 0.62 : -W * 0.02, x1 = j ? W * 1.02 : W * 0.38, y0 = H * 0.2, sag = H * 0.05, n = 9;
    b.strokeStyle = '#c88a6a';
    b.lineWidth = Math.max(1, H * 0.003);
    b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0); b.stroke();
    for (i = 0; i < n; i++) {
      var t = (i + 0.5) / n;
      x = x0 + (x1 - x0) * t;
      y = y0 + sag * 2 * t * (1 - t) * 2 * 0.5 * 2;
      b.beginPath(); b.moveTo(x - H * 0.014, y); b.lineTo(x + H * 0.014, y); b.lineTo(x, y + H * 0.03); b.closePath();
      artFillPath(b, ['#ff7bac', '#ffd24f', '#7fd4ff', '#8fe38f', '#c9a0ff'][(i + j) % 5], y, y + H * 0.03, H * 0.014, { line: false });
    }
  }
  // Matto karusellin edessä (hehku piirretään joka ruudulla)
  artShadow(b, G.cx, G.matY + H * 0.01, H * 0.11, H * 0.03, 0.15);
}

// ---------- Piirto: koristeet ----------
function merryDrawFountain(c, p) {
  var H = viewH, s = H * 0.09, t = globalT, i, k, hi = merry.rainbowT > 0 ? 1.8 : 1 + Math.max(0, merry.fountainT) * 0.4, x, a;
  artShadow(c, 0, 0, s * 1.3, s * 0.25, 0.15);
  // Allas
  artBlob(c, 0, -s * 0.2, s * 1.2, s * 0.32, '#c8d0e8', { lineColor: '#7a84a8', shadeTo: '#a0a8c8' });
  artBlob(c, 0, -s * 0.32, s * 1.0, s * 0.2, '#6fc8ff', { lineColor: '#4a8ac8', hi: 0.4 });
  // Jalka ja ylempi kuppi
  artRoundRect(c, -s * 0.12, -s * 0.95, s * 0.24, s * 0.65, s * 0.08, '#d8dcf0', { lineColor: '#7a84a8' });
  artBlob(c, 0, -s * 0.95, s * 0.45, s * 0.12, '#c8d0e8', { lineColor: '#7a84a8' });
  // Vesisuihkut
  c.strokeStyle = 'rgba(160,220,255,0.85)';
  c.lineWidth = Math.max(2, s * 0.06);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i += 2) {
    c.beginPath();
    c.moveTo(0, -s * 1.05);
    c.quadraticCurveTo(i * s * 0.5, -s * (1.05 + 0.75 * hi), i * s * 0.85, -s * 0.36);
    c.stroke();
  }
  c.beginPath(); c.moveTo(0, -s * 1.0); c.lineTo(0, -s * (1.0 + 0.6 * hi)); c.stroke();
  // Pisarat
  c.fillStyle = 'rgba(220,245,255,0.9)';
  for (i = 0; i < 6; i++) {
    k = (t * 0.9 + i / 6) % 1;
    x = (i % 2 ? 1 : -1) * s * 0.85 * k;
    c.beginPath(); c.arc(x, -s * (1.05 + 0.75 * hi * Math.sin(k * Math.PI)) + s * 0.69 * k, Math.max(1.5, s * 0.04), 0, Math.PI * 2); c.fill();
  }
  if (merry.rainbowT > 0) {
    a = Math.min(1, merry.rainbowT / 0.5, (2.6 - merry.rainbowT) / 0.4);
    c.globalAlpha = Math.max(0, a) * 0.75;
    c.lineWidth = Math.max(2, s * 0.08);
    var cols = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];
    for (i = 0; i < cols.length; i++) {
      c.strokeStyle = cols[i];
      c.beginPath(); c.arc(0, -s * 0.5, s * (1.6 - i * 0.08), Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    }
    c.globalAlpha = 1;
  }
}
function merryDrawBench(c, p) {
  var H = viewH, s = H * 0.06, purr = merry.purrT > 0, wig = merry.catT > 0 ? Math.sin(merry.catT * 20) : 0, i, k;
  artShadow(c, 0, 0, s * 1.8, s * 0.3, 0.15);
  // Penkki
  artLimb(c, -s * 1.3, -s * 0.6, -s * 1.3, 0, s * 0.14, '#5a5a7a', '#3a3a50');
  artLimb(c, s * 1.3, -s * 0.6, s * 1.3, 0, s * 0.14, '#5a5a7a', '#3a3a50');
  artRoundRect(c, -s * 1.6, -s * 1.55, s * 3.2, s * 0.22, s * 0.08, '#e89a5a', { lineColor: '#8a4a2a' });
  artRoundRect(c, -s * 1.6, -s * 1.22, s * 3.2, s * 0.22, s * 0.08, '#e89a5a', { lineColor: '#8a4a2a' });
  artRoundRect(c, -s * 1.7, -s * 0.72, s * 3.4, s * 0.24, s * 0.08, '#f0a868', { lineColor: '#8a4a2a' });
  // Kissanpentu kurkkaa penkin takaa
  if (purr) {
    k = easeOutBack(Math.min(1, (3 - merry.purrT) / 0.5)) * Math.min(1, merry.purrT / 0.4);
    c.save();
    c.translate(s * 1.0, -s * 1.5 + (1 - k) * s * 0.8);
    bakeDrawCat(c, 0, s * 0.6, s * 0.4, { coat: '#ffc890', line: '#a0602a', face: -1, tail: Math.sin(globalT * 6) });
    c.restore();
  }
  // Kissa nukkuu penkillä; tökkäys herättää
  bakeDrawCat(c, -s * 0.35, -s * 0.72, s * 0.62, { coat: '#c8c0d0', line: '#5a5068', face: 1, tail: wig + Math.sin(globalT * 1.5) * 0.3, sleep: !purr && merry.catT <= 0, blink: purr });
  if (purr) {
    for (i = 0; i < 3; i++) {
      k = ((3 - merry.purrT) * 0.7 + i * 0.33) % 1;
      c.globalAlpha = 1 - k;
      drawHeartShape(c, -s * 0.35 + Math.sin(k * 6 + i) * s * 0.3, -s * 2.0 - k * s * 1.4, s * 0.18, true);
      c.globalAlpha = 1;
    }
  }
}
function merryDrawSeller(c, p) {
  var H = viewH, s = H * 0.06, i, cols = ['#ff6fae', '#4aa8ff', '#ffd23f', '#5fd36b', '#b678ff'], bx, by, sw = merry.sellerT > 0 ? Math.sin(merry.sellerT * 18) * 0.5 : 0;
  // Pallot naruineen kädestä ylös
  for (i = 0; i < cols.length; i++) {
    bx = (i - 2) * s * 0.42 + Math.sin(globalT * 1.3 + i) * s * 0.06 + sw * s * 0.2 * (i % 2 ? 1 : -1);
    by = -s * (3.5 + (i % 2) * 0.45) + Math.sin(globalT * 1.7 + i * 2) * s * 0.06;
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1, s * 0.03);
    c.beginPath(); c.moveTo(s * 0.55, -s * 1.15); c.lineTo(bx, by + s * 0.45); c.stroke();
    drawPartyBalloon(c, bx, by, s * 0.36, cols[i], globalT + i, false);
  }
  drawBunny(c, 0, 0, s * 1.0, 0, globalT * 2, false);
  // Hattu ja käsi narujen kohdalla
  artRoundRect(c, -s * 0.3, -s * 1.95, s * 0.6, s * 0.3, s * 0.08, '#5a7ad8', { lineColor: '#2a3a7a' });
  artBlob(c, 0, -s * 1.66, s * 0.48, s * 0.08, '#5a7ad8', { lineColor: '#2a3a7a' });
  artLimb(c, s * 0.35, -s * 0.65, s * 0.55, -s * 1.1, s * 0.16, '#ffffff', BUNNY_LINE);
}
function merryDrawFlyaway(c) {
  var i, f, x, y, s = viewH * 0.03;
  for (i = 0; i < merry.flyaway.length; i++) {
    f = merry.flyaway[i];
    x = f.fx * viewW + Math.sin(f.t * 1.5 + f.ph) * viewH * 0.04 - f.t * viewH * 0.02;
    y = f.fy * viewH - f.t * viewH * 0.16;
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(f.t * 2) * 0.15);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1, s * 0.06);
    c.beginPath(); c.moveTo(0, s * 0.5); c.quadraticCurveTo(s * 0.3, s * 1.4, -s * 0.1, s * 2.2); c.stroke();
    drawHeartShape(c, 0, 0, s, true);
    c.restore();
  }
}

// ---------- Piirto: eläinistuimet ----------
// Kaikki piirtävät origoon (vartalon keskus), katse oikealle, koko s.
function merryDrawAnimal(c, kind, s, t) {
  var line, body, shade, mane;
  if (kind === 'pony' || kind === 'unicorn') {
    body = kind === 'pony' ? '#ffffff' : '#f4ecff';
    line = kind === 'pony' ? '#a890b8' : '#9a88c8';
    shade = kind === 'pony' ? '#e8dcf0' : '#ddd0f4';
    mane = kind === 'pony' ? ['#ffb84f', '#ff8fa8'] : ['#ff7bac', '#ffd24f', '#6fd6d6', '#b678ff'];
    // Takajalat ojossa, etujalat koukussa (karusellihevosen laukka)
    artLimb(c, -s * 0.35, s * 0.2, -s * 0.6, s * 0.62, s * 0.16, shade, line);
    artLimb(c, -s * 0.55, s * 0.15, -s * 0.95, s * 0.5, s * 0.17, body, line);
    artLimb(c, s * 0.45, s * 0.15, s * 0.82, s * 0.32, s * 0.16, shade, line);
    artLimb(c, s * 0.82, s * 0.32, s * 0.68, s * 0.58, s * 0.15, shade, line);
    artLimb(c, s * 0.55, s * 0.12, s * 0.95, s * 0.22, s * 0.17, body, line);
    artLimb(c, s * 0.95, s * 0.22, s * 0.9, s * 0.5, s * 0.16, body, line);
    // Häntä
    c.lineCap = 'round';
    c.strokeStyle = artShade(mane[0], -0.25);
    c.lineWidth = s * 0.26;
    c.beginPath(); c.moveTo(-s * 0.75, -s * 0.15); c.quadraticCurveTo(-s * 1.2, -s * 0.1, -s * 1.15, s * 0.45); c.stroke();
    c.strokeStyle = mane[0];
    c.lineWidth = s * 0.18;
    c.stroke();
    artBlob(c, 0, 0, s * 0.82, s * 0.42, body, { lineColor: line, shadeTo: shade, hi: 0.4 });
    artLimb(c, s * 0.5, -s * 0.12, s * 0.82, -s * 0.62, s * 0.4, body, line);
    artBlob(c, s * 0.98, -s * 0.72, s * 0.32, s * 0.21, body, { rot: 0.45, lineColor: line, shadeTo: shade });
    artBlob(c, s * 1.18, -s * 0.56, s * 0.17, s * 0.14, body, { lineColor: line, shadeTo: shade });
    c.fillStyle = artShade(line, -0.2);
    c.beginPath(); c.arc(s * 1.26, -s * 0.56, s * 0.03, 0, Math.PI * 2); c.fill();
    // Korva
    c.beginPath(); c.moveTo(s * 0.78, -s * 0.85); c.lineTo(s * 0.8, -s * 1.12); c.lineTo(s * 0.95, -s * 0.9); c.closePath();
    artFillPath(c, body, -s * 1.12, -s * 0.85, s * 0.1, { lineColor: line });
    if (kind === 'unicorn') {
      c.beginPath(); c.moveTo(s * 0.92, -s * 0.9); c.lineTo(s * 1.12, -s * 1.38); c.lineTo(s * 1.05, -s * 0.86); c.closePath();
      artFillPath(c, '#ffe27a', -s * 1.38, -s * 0.86, s * 0.1, { lineColor: '#b8862a' });
    }
    // Harja
    var j;
    for (j = 0; j < 5; j++) artCircle(c, s * (0.48 + j * 0.08), -s * (0.25 + j * 0.15), s * 0.13, mane[j % mane.length], { lineColor: artShade(mane[j % mane.length], -0.35) });
    artEye(c, s * 0.98, -s * 0.78, s * 0.065, 0.5, (t % 4) < 0.12);
    artBlush(c, s * 1.08, -s * 0.62, s * 0.06);
    // Suitset
    c.strokeStyle = '#ff8fc8';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.moveTo(s * 0.86, -s * 0.9); c.lineTo(s * 1.1, -s * 0.48); c.stroke();
  } else if (kind === 'swan') {
    body = '#ffffff'; line = '#9aa0c8'; shade = '#e0e4f4';
    c.beginPath(); c.moveTo(-s * 0.6, -s * 0.1); c.lineTo(-s * 1.1, -s * 0.45); c.lineTo(-s * 0.75, s * 0.15); c.closePath();
    artFillPath(c, body, -s * 0.45, s * 0.15, s * 0.3, { lineColor: line, shadeTo: shade });
    artBlob(c, 0, 0, s * 0.85, s * 0.45, body, { lineColor: line, shadeTo: shade, hi: 0.4 });
    // Kaula: S-kaari
    c.lineCap = 'round';
    c.strokeStyle = line;
    c.lineWidth = s * 0.34;
    c.beginPath(); c.moveTo(s * 0.55, -s * 0.1); c.quadraticCurveTo(s * 1.2, -s * 0.45, s * 0.75, -s * 0.9); c.stroke();
    c.strokeStyle = body;
    c.lineWidth = s * 0.24;
    c.stroke();
    artCircle(c, s * 0.8, -s * 1.02, s * 0.22, body, { lineColor: line, shadeTo: shade });
    c.beginPath(); c.moveTo(s * 0.98, -s * 1.08); c.lineTo(s * 1.32, -s * 0.98); c.lineTo(s * 0.98, -s * 0.9); c.closePath();
    artFillPath(c, '#ff9a3a', -s * 1.08, -s * 0.9, s * 0.1, { lineColor: '#b8601a' });
    artEye(c, s * 0.84, -s * 1.08, s * 0.06, 0.5, (t % 4.3) < 0.12);
    // Siipi
    artBlob(c, -s * 0.15, -s * 0.05, s * 0.5, s * 0.26, '#f4f4ff', { rot: -0.15, lineColor: line, shadeTo: shade });
  } else if (kind === 'rooster') {
    body = '#e8584a'; line = '#8a2a20'; shade = '#b83a30';
    artLimb(c, -s * 0.15, s * 0.35, -s * 0.2, s * 0.62, s * 0.08, '#f0b040', '#a8701e');
    artLimb(c, s * 0.2, s * 0.35, s * 0.25, s * 0.62, s * 0.08, '#f0b040', '#a8701e');
    // Pyrstö
    var tc = ['#5a8ad8', '#5fd36b', '#2a4a8a'], k2;
    for (k2 = 0; k2 < 3; k2++) {
      c.lineCap = 'round';
      c.strokeStyle = artShade(tc[k2], -0.35);
      c.lineWidth = s * 0.22;
      c.beginPath(); c.moveTo(-s * 0.6, -s * 0.1); c.quadraticCurveTo(-s * (1.0 + k2 * 0.1), -s * (0.9 - k2 * 0.2), -s * (1.15 - k2 * 0.05), -s * (0.1 - k2 * 0.25)); c.stroke();
      c.strokeStyle = tc[k2];
      c.lineWidth = s * 0.14;
      c.stroke();
    }
    artBlob(c, 0, 0, s * 0.75, s * 0.48, body, { lineColor: line, shadeTo: shade, hi: 0.35 });
    artBlob(c, s * 0.62, -s * 0.5, s * 0.32, s * 0.4, '#f0b040', { rot: 0.3, lineColor: '#a8701e' });
    artCircle(c, s * 0.8, -s * 0.88, s * 0.24, body, { lineColor: line, shadeTo: shade });
    // Heltta ja kampa
    artCircle(c, s * 0.72, -s * 1.12, s * 0.09, '#ff3a4a', { lineColor: '#8a1a20' });
    artCircle(c, s * 0.84, -s * 1.15, s * 0.1, '#ff3a4a', { lineColor: '#8a1a20' });
    artCircle(c, s * 0.95, -s * 1.08, s * 0.08, '#ff3a4a', { lineColor: '#8a1a20' });
    artBlob(c, s * 1.02, -s * 0.68, s * 0.06, s * 0.1, '#ff3a4a', { lineColor: '#8a1a20' });
    c.beginPath(); c.moveTo(s * 1.0, -s * 0.92); c.lineTo(s * 1.22, -s * 0.84); c.lineTo(s * 1.0, -s * 0.78); c.closePath();
    artFillPath(c, '#ffd23f', -s * 0.92, -s * 0.78, s * 0.08, { lineColor: '#a8801e' });
    artEye(c, s * 0.86, -s * 0.92, s * 0.06, 0.5, (t % 3.9) < 0.12);
  } else if (kind === 'pig') {
    body = '#ffb8c8'; line = '#c8708a'; shade = '#f098b0';
    artLimb(c, -s * 0.5, s * 0.2, -s * 0.7, s * 0.55, s * 0.18, shade, line);
    artLimb(c, s * 0.45, s * 0.2, s * 0.7, s * 0.5, s * 0.18, shade, line);
    artLimb(c, -s * 0.3, s * 0.25, -s * 0.4, s * 0.6, s * 0.18, body, line);
    artLimb(c, s * 0.25, s * 0.25, s * 0.4, s * 0.58, s * 0.18, body, line);
    c.strokeStyle = line;
    c.lineWidth = Math.max(1, s * 0.07);
    c.beginPath(); c.arc(-s * 0.9, -s * 0.12, s * 0.12, 0, Math.PI * 1.6); c.stroke();
    artBlob(c, 0, 0, s * 0.82, s * 0.48, body, { lineColor: line, shadeTo: shade, hi: 0.4 });
    artCircle(c, s * 0.82, -s * 0.38, s * 0.36, body, { lineColor: line, shadeTo: shade });
    c.beginPath(); c.moveTo(s * 0.62, -s * 0.62); c.lineTo(s * 0.6, -s * 0.9); c.lineTo(s * 0.8, -s * 0.7); c.closePath();
    artFillPath(c, body, -s * 0.9, -s * 0.62, s * 0.1, { lineColor: line });
    artBlob(c, s * 1.14, -s * 0.32, s * 0.12, s * 0.15, '#ff9ab4', { lineColor: line });
    c.fillStyle = '#c8708a';
    c.beginPath(); c.arc(s * 1.12, -s * 0.37, s * 0.03, 0, Math.PI * 2); c.arc(s * 1.12, -s * 0.27, s * 0.03, 0, Math.PI * 2); c.fill();
    artEye(c, s * 0.9, -s * 0.5, s * 0.06, 0.5, (t % 4.1) < 0.12);
    artBlush(c, s * 0.9, -s * 0.28, s * 0.07);
  } else {
    // Sammakko pienellä kruunulla
    body = '#7ad86a'; line = '#2a7a3a'; shade = '#4ab04a';
    artBlob(c, -s * 0.5, s * 0.22, s * 0.38, s * 0.24, shade, { lineColor: line });
    artLimb(c, s * 0.4, s * 0.15, s * 0.55, s * 0.55, s * 0.15, body, line);
    artBlob(c, 0, 0, s * 0.8, s * 0.46, body, { lineColor: line, shadeTo: shade, hi: 0.35 });
    artBlob(c, -s * 0.15, s * 0.12, s * 0.45, s * 0.22, '#d8f4b0', { line: false });
    artBlob(c, s * 0.62, -s * 0.32, s * 0.42, s * 0.3, body, { lineColor: line, shadeTo: shade });
    artCircle(c, s * 0.48, -s * 0.66, s * 0.16, body, { lineColor: line });
    artCircle(c, s * 0.82, -s * 0.66, s * 0.16, body, { lineColor: line });
    artEye(c, s * 0.48, -s * 0.68, s * 0.1, 0.4, (t % 4.5) < 0.12);
    artEye(c, s * 0.82, -s * 0.68, s * 0.1, 0.4, (t % 4.5) < 0.12);
    c.strokeStyle = line;
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.arc(s * 0.72, -s * 0.36, s * 0.22, 0.3, Math.PI - 0.6); c.stroke();
    c.beginPath(); c.moveTo(s * 0.5, -s * 0.8); c.lineTo(s * 0.52, -s * 0.98); c.lineTo(s * 0.62, -s * 0.88); c.lineTo(s * 0.7, -s * 1.0); c.lineTo(s * 0.76, -s * 0.84); c.closePath();
    artFillPath(c, '#ffe27a', -s * 1.0, -s * 0.8, s * 0.08, { lineColor: '#b8862a' });
  }
}
function merryShapePath(c, shape, x, y, r) {
  var i, a;
  c.beginPath();
  if (shape === 'heart') {
    c.moveTo(x, y + r * 0.8);
    c.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
    c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.8);
  } else {
    for (i = 0; i < 10; i++) {
      a = i / 10 * Math.PI * 2 - Math.PI / 2;
      c.lineTo(x + Math.cos(a) * r * (i % 2 ? 0.5 : 1.1), y + Math.sin(a) * r * (i % 2 ? 0.5 : 1.1));
    }
  }
  c.closePath();
}
// Satulahuopa ja satula: iso värillinen huopa kyljessä, kuvio keskellä
function merryDrawSaddle(c, s, col, shape, glow) {
  var y = -s * 0.42, line = artShade(col, -0.45), i;
  if (glow > 0) artGlow(c, 0, y + s * 0.1, s * 1.1, col, Math.min(1, glow) * 0.8);
  artRoundRect(c, -s * 0.42, y - s * 0.12, s * 0.84, s * 0.6, s * 0.12, col, { lineColor: line });
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1.5, s * 0.05);
  roundRect(c, -s * 0.34, y - s * 0.05, s * 0.68, s * 0.46, s * 0.08);
  c.stroke();
  // Hapsut
  c.fillStyle = '#ffe27a';
  for (i = 0; i < 5; i++) { c.beginPath(); c.arc(-s * 0.34 + i * s * 0.17, y + s * 0.5, Math.max(1.5, s * 0.05), 0, Math.PI * 2); c.fill(); }
  if (shape) {
    merryShapePath(c, shape, 0, y + s * 0.19, s * 0.16);
    artFillPath(c, '#ffffff', y, y + s * 0.4, s * 0.15, { lineColor: line, flat: true });
  }
  artBlob(c, 0, y - s * 0.12, s * 0.36, s * 0.13, artShade(col, -0.2), { lineColor: line, hi: 0.4 });
}
function merryDrawSeat(c, i, g) {
  var st = merry.seats[i], p = merrySeatPose(i, g), r = st.rider, ws = Math.max(1.5, g.H * 0.008 * p.k), bs;
  // Tanko katoksesta lavaan
  artLimb(c, p.x, p.poleTop, p.x, p.base, ws, '#ffe27a', '#a8801e');
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, ws * 0.3);
  c.beginPath(); c.moveTo(p.x - ws * 0.15, p.poleTop); c.lineTo(p.x - ws * 0.15, p.base); c.stroke();
  artShadow(c, p.x, p.base, p.s * 0.8, p.s * 0.15, 0.12 * p.k);
  // Lipun istuin hohtaa hennosti (helpottaa löytämistä)
  if (i === merry.ticket && merry.state === 'play' && !merry.act) artGlow(c, p.x, p.y, p.s * 1.6, st.col, 0.28 + Math.sin(globalT * 5) * 0.08);
  c.save();
  c.translate(p.x, p.y);
  c.scale(p.face * p.kx, 1);
  merryDrawAnimal(c, st.animal, p.s, globalT + i * 1.3);
  merryDrawSaddle(c, p.s, st.col, st.shape, st.glow);
  c.restore();
  if (p.z < 0) {
    // Takana kulkevat istuimet hieman utuisina
    c.fillStyle = 'rgba(255,240,250,' + (-p.z * 0.18) + ')';
    c.beginPath(); c.arc(p.x, p.y - p.s * 0.2, p.s * 1.3, 0, Math.PI * 2); c.fill();
  }
  if (r) {
    bs = g.bs * p.k * 0.92;
    merryDrawBunny(c, p.x, p.sy + bs * 0.15, bs, { wave: r.wave > 0 || merry.state === 'tune' || merry.state === 'done', ear: r.ear + globalT * 2, side: p.face });
  }
}
// Pupu: drawBunny + vilkuttava tassu ja kikatus
function merryDrawBunny(c, x, y, s, o) {
  drawBunny(c, x, y, s, 0, o.ear || 0, false);
  if (o.wave) {
    var w = Math.sin(globalT * 14) * s * 0.25, sd = o.side || 1;
    artLimb(c, x + sd * s * 0.45, y - s * 0.75, x + sd * s * 0.85, y - s * 1.45 - w, s * 0.17, '#ffffff', BUNNY_LINE);
  }
  if (o.ticket !== undefined && o.ticket >= 0) {
    artLimb(c, x + s * 0.45, y - s * 0.7, x + s * 0.85, y - s * 1.0, s * 0.17, '#ffffff', BUNNY_LINE);
  }
}

// ---------- Piirto: karuselli ----------
function merryDrawPlatform(c, g) {
  var i, a, x, y, z, H = g.H;
  // Helma (lavan etuseinä)
  c.beginPath();
  if (c.ellipse) {
    c.ellipse(g.cx, g.P, g.rx, g.ry, 0, Math.PI, 0, true);
    c.lineTo(g.cx + g.rx, g.P + g.sk);
    c.ellipse(g.cx, g.P + g.sk, g.rx, g.ry, 0, 0, Math.PI, false);
  } else {
    c.rect(g.cx - g.rx, g.P, g.rx * 2, g.ry + g.sk);
  }
  c.closePath();
  artFillPath(c, '#ff8fc8', g.P, g.P + g.ry + g.sk, H * 0.05, { lineColor: '#b04a80', shadeTo: '#e0609a' });
  // Helman valot kiertävät karusellin mukana
  for (i = 0; i < 20; i++) {
    a = -merry.rot * 1 + i * Math.PI * 2 / 20;
    z = Math.cos(a);
    if (z < 0.05) continue;
    x = g.cx + Math.sin(a) * g.rx * 0.97;
    y = g.P + g.sk * 0.55 + z * g.ry;
    artGlow(c, x, y, H * 0.016, '#fff2a0', 0.5);
    artCircle(c, x, y, H * 0.007 * (0.6 + 0.4 * z), (i + Math.floor(globalT * 3)) % 2 ? '#fff6c0' : '#ffe27a', { line: false });
  }
  // Lavan kansi
  artBlob(c, g.cx, g.P, g.rx, g.ry, '#ffe8f2', { lineColor: '#b04a80', shadeTo: '#f4c8dc' });
  c.strokeStyle = 'rgba(200,100,150,0.35)';
  c.lineWidth = Math.max(1, H * 0.004);
  c.beginPath();
  if (c.ellipse) c.ellipse(g.cx, g.P, g.rx * 0.7, g.ry * 0.7, 0, 0, Math.PI * 2); else c.arc(g.cx, g.P, g.rx * 0.7, 0, Math.PI * 2);
  c.stroke();
}
function merryDrawColumn(c, g) {
  var w = g.rx * 0.1, top = g.canY, bot = g.P, i, y, ph = merry.rot * 3;
  artRoundRect(c, g.cx - w / 2, top, w, bot - top, w * 0.3, '#ffe27a', { lineColor: '#a8801e' });
  // Kierreraita, joka "pyörii"
  c.save();
  roundRect(c, g.cx - w / 2, top, w, bot - top, w * 0.3);
  c.clip();
  c.strokeStyle = '#ff8fc8';
  c.lineWidth = w * 0.3;
  for (i = -2; i < 14; i++) {
    y = top + (i + (ph / (Math.PI * 2)) % 1) * w * 1.3;
    c.beginPath(); c.moveTo(g.cx - w, y); c.lineTo(g.cx + w, y + w * 0.9); c.stroke();
  }
  c.restore();
  // Peilikoru keskellä
  artCircle(c, g.cx, (top + bot) * 0.5 - g.H * 0.03, w * 0.6, '#bfe8ff', { lineColor: '#a8801e', hi: 0.6 });
}
function merryDrawCanopy(c, g) {
  var H = g.H, rxc = g.rx * 1.06, ryc = g.ry * 1.06, ax = g.cx, ay = g.topY, i, a0, a1, a, n = 14, step = Math.PI * 2 / n, j, x, y, z, col;
  // Siluetti: kartio, alareuna etupuolen ellipsinkaari
  c.save();
  c.beginPath();
  c.moveTo(ax, ay);
  c.quadraticCurveTo(ax - rxc * 0.55, g.canY - H * 0.08, ax - rxc, g.canY);
  if (c.ellipse) c.ellipse(g.cx, g.canY, rxc, ryc, 0, Math.PI, 0, true); else c.lineTo(ax + rxc, g.canY);
  c.quadraticCurveTo(ax + rxc * 0.55, g.canY - H * 0.08, ax, ay);
  c.closePath();
  artFillPath(c, '#ffffff', ay, g.canY + ryc, H * 0.06, { lineColor: '#b04a80', shadeTo: '#f0e4f4' });
  c.clip();
  // Raidat pyörivät
  for (i = 0; i < n; i += 2) {
    a0 = merryWrap(merry.rot + i * step + Math.PI) - Math.PI;
    a1 = a0 + step;
    a0 = Math.max(a0, -Math.PI / 2);
    a1 = Math.min(a1, Math.PI / 2);
    if (a1 <= a0) continue;
    c.beginPath();
    c.moveTo(ax, ay);
    for (j = 0; j <= 6; j++) {
      a = a0 + (a1 - a0) * j / 6;
      c.lineTo(g.cx + Math.sin(a) * rxc, g.canY + Math.cos(a) * ryc);
    }
    c.closePath();
    c.fillStyle = 'rgba(255,111,174,0.85)';
    c.fill();
  }
  c.restore();
  // Alareunan liehukkeet ja lamput
  for (i = 0; i < n * 2; i++) {
    a = merryWrap(merry.rot + i * step / 2 + Math.PI) - Math.PI;
    z = Math.cos(a);
    if (z < 0) continue;
    x = g.cx + Math.sin(a) * rxc;
    y = g.canY + z * ryc;
    col = i % 2 ? '#ffffff' : '#ff6fae';
    artBlob(c, x, y + H * 0.008, H * 0.022 * (0.4 + 0.6 * z), H * 0.018, col, { lineColor: '#b04a80', line: Math.max(1, H * 0.002) });
    if (i % 2 === 0) {
      artGlow(c, x, y + H * 0.03, H * 0.014, '#fff2a0', 0.6);
      artCircle(c, x, y + H * 0.03, H * 0.006, (i / 2 + Math.floor(globalT * 3)) % 2 ? '#fff6c0' : '#ffe27a', { line: false });
    }
  }
  // Kärki: lippu ja tähti
  artLimb(c, ax, ay, ax, ay - H * 0.04, Math.max(1.5, H * 0.005), '#a8801e', false);
  c.beginPath(); c.moveTo(ax, ay - H * 0.04); c.lineTo(ax + H * 0.045 + Math.sin(globalT * 6) * H * 0.005, ay - H * 0.03); c.lineTo(ax, ay - H * 0.018); c.closePath();
  artFillPath(c, '#5fd36b', ay - H * 0.04, ay - H * 0.018, H * 0.02, { lineColor: '#2a7a3a' });
  drawStar(c, ax, ay, H * 0.022, Math.sin(globalT * 2) * 0.2, 0.4);
}
// Etukohdan valokeila ja matto: hehkuvat lipun värisinä, kun lipun istuin on edessä
function merryDrawSpot(c, g) {
  var col = merry.ticket >= 0 ? merry.seats[merry.ticket].col : '#ffffff', on = merry.inWin, pulse = 0.5 + Math.sin(globalT * 7) * 0.5, gr, w = g.H * 0.09;
  if (merry.state !== 'play') return;
  gr = c.createLinearGradient(0, g.canY, 0, g.P + g.ry);
  gr.addColorStop(0, artRGBA(col, 0));
  gr.addColorStop(1, artRGBA(col, on ? 0.35 + pulse * 0.15 : 0.12));
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(g.cx - w * 0.5, g.canY + g.ry);
  c.lineTo(g.cx + w * 0.5, g.canY + g.ry);
  c.lineTo(g.cx + w, g.P + g.ry);
  c.lineTo(g.cx - w, g.P + g.ry);
  c.closePath();
  c.fill();
}
function merryDrawMat(c, g) {
  var col = merry.ticket >= 0 ? merry.seats[merry.ticket].col : '#ffe27a', on = merry.inWin && merry.state === 'play', pulse = 0.5 + Math.sin(globalT * (on ? 8 : 2.5)) * 0.5, H = g.H;
  artGlow(c, g.cx, g.matY, H * (on ? 0.16 : 0.11), on ? col : '#fff2a0', on ? 0.55 + pulse * 0.3 : 0.25 + pulse * 0.15);
  artBlob(c, g.cx, g.matY, H * 0.1, H * 0.028, on ? col : '#ffd0e4', { lineColor: on ? artShade(col, -0.4) : '#c87aa0', flat: true });
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1.5, H * 0.004);
  c.beginPath();
  if (c.ellipse) c.ellipse(g.cx, g.matY, H * 0.075, H * 0.018, 0, 0, Math.PI * 2); else c.arc(g.cx, g.matY, H * 0.05, 0, Math.PI * 2);
  c.stroke();
  // Pieni porras lavalle
  artRoundRect(c, g.cx - H * 0.05, g.P + g.ry + g.sk - H * 0.012, H * 0.1, H * 0.028, H * 0.008, '#f4c8dc', { lineColor: '#b04a80' });
}
// Lippu pupun tassussa: valkoinen lippu, jossa iso huopa istuimen värissä
function merryDrawTicket(c, x, y, s, idx) {
  var st = merry.seats[idx], pop = merry.ticketPop > 0 ? 1 + Math.sin(merry.ticketPop / 0.5 * Math.PI) * 0.15 : 1, w = s * 2.3, h = s * 1.6, line = artShade(st.col, -0.45);
  c.save();
  c.translate(x, y);
  c.scale(pop, pop);
  c.rotate(-0.06 + Math.sin(globalT * 2) * 0.03);
  artGlow(c, 0, 0, w * 0.9, st.col, merry.inWin ? 0.45 : 0.2);
  artRoundRect(c, -w / 2, -h / 2, w, h, s * 0.2, '#fffaf0', { lineColor: '#c8a878', flat: true });
  c.fillStyle = '#e8d8c0';
  c.beginPath(); c.arc(-w / 2, 0, s * 0.18, -Math.PI / 2, Math.PI / 2); c.arc(w / 2, 0, s * 0.18, Math.PI / 2, Math.PI * 1.5); c.fill();
  c.strokeStyle = 'rgba(200,168,120,0.7)';
  c.setLineDash ? c.setLineDash([s * 0.12, s * 0.1]) : null;
  c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.moveTo(-w * 0.32, -h * 0.4); c.lineTo(-w * 0.32, h * 0.4); c.stroke();
  if (c.setLineDash) c.setLineDash([]);
  artRoundRect(c, -w * 0.24, -h * 0.34, w * 0.62, h * 0.68, s * 0.14, st.col, { lineColor: line });
  if (st.shape) {
    merryShapePath(c, st.shape, w * 0.07, 0, s * 0.3);
    artFillPath(c, '#ffffff', -s * 0.3, s * 0.3, s * 0.3, { lineColor: line, flat: true });
  }
  drawStar(c, -w * 0.41, 0, s * 0.15, 0, 0);
  c.restore();
}
function merryDrawQueue(c, g) {
  var i, b, x, y, hop, k, a = merry.act, p, tx, ty, s = g.bs, first;
  for (i = merry.queue.length - 1; i >= 0; i--) {
    b = merry.queue[i];
    if (a && a.b === b) continue;
    x = merryQueueX(b.slot, g);
    hop = b.ph > 0 ? Math.abs(Math.sin(b.ph * 9)) * g.H * 0.03 : 0;
    first = i === 0 && Math.abs(b.slot) < 0.05 && merry.state === 'play' && !a;
    merryDrawBunny(c, x, g.qy - hop, s, { ear: b.ear + globalT * 2, ticket: first ? merry.ticket : -1 });
    if (first && merry.ticket >= 0) merryDrawTicket(c, x + s * 1.55, g.qy - s * 1.5, s, merry.ticket);
  }
  if (!a) return;
  // Hyppäävä pupu
  b = a.b;
  if (a.kind === 'board') {
    k = Math.min(1, a.t / MERRY_HOP);
    p = merrySeatPose(a.seat, g);
    tx = p.x; ty = p.sy + g.bs * p.k * 0.92 * 0.15;
    x = g.cx + (tx - g.cx) * easeInOutSine(k);
    y = g.qy + (ty - g.qy) * k - Math.sin(k * Math.PI) * g.H * 0.08;
    merryDrawBunny(c, x, y, s * (1 - (1 - p.k * 0.92) * k), { ear: b.ear + globalT * 6 });
  } else {
    // Väärä istuin: hyppy ylös, katse, kikatus ja takaisin
    k = Math.min(1, a.t / MERRY_OOPS);
    var up = Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5), down = k > 0.62 ? (k - 0.62) / 0.38 : 0;
    y = g.qy - g.H * 0.13 * up * (1 - down) - Math.sin(down * Math.PI) * g.H * 0.03;
    x = g.cx + Math.sin(k * Math.PI * 6) * (k > 0.4 && k < 0.65 ? s * 0.1 : 0);
    merryDrawBunny(c, x, y, s, { ear: b.ear + globalT * 12 });
    if (k > 0.35 && k < 0.95) {
      c.font = 'bold ' + Math.round(g.H * 0.04) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.lineWidth = Math.max(2, g.H * 0.006);
      c.strokeStyle = '#ffffff';
      c.fillStyle = '#c0508a';
      c.strokeText('HIHI!', x - s * 1.6, y - s * 2.0);
      c.fillText('HIHI!', x - s * 1.6, y - s * 2.0);
    }
    merryDrawTicket(c, g.cx + s * 1.55, g.qy - s * 1.5, s, merry.ticket);
  }
}
function merryDrawLeavers(c, g) {
  var i, L, hop;
  for (i = 0; i < merry.leavers.length; i++) {
    L = merry.leavers[i];
    if (L.t < L.delay) continue;
    hop = L.run ? Math.abs(Math.sin(L.t * 8)) * g.H * 0.035 : 0;
    merryDrawBunny(c, L.fx * g.W, L.fy * g.H - hop, g.bs, { ear: L.ear + globalT * 8, wave: L.run && (L.seat % 2 === 0) });
  }
}
// Vihjekäsi: napauttaa pupua, kun lipun istuin on edessä
function merryDrawHint(c, g) {
  var b = merry.queue[0], k, s = g.H * 0.07, x, y;
  if (merry.state !== 'play' || merry.act || !b || merry.ticket < 0) return;
  if (!(merry.firstHint || merry.misses > 0 || merry.oopsN >= 2)) return;
  if (!merry.inWin) return;
  k = (globalT * 1.6) % 1;
  x = g.cx + s * 0.1;
  y = g.qy - g.bs * 2.2 - s * 0.7 - (k < 0.5 ? (0.5 - k) * s * 0.6 : 0);
  if (k >= 0.5) {
    c.strokeStyle = 'rgba(255,255,255,' + (1 - (k - 0.5) * 2) + ')';
    c.lineWidth = Math.max(2, g.H * 0.005);
    c.beginPath(); c.arc(g.cx, g.qy - g.bs * 1.1, g.H * (0.03 + (k - 0.5) * 0.12), 0, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 0.9;
  drawHand(c, x, y, s);
  c.globalAlpha = 1;
}

function drawMerry() {
  var c = ctx, g = merryGeo(), order = [], i;
  if (!beginPlayWorld()) return;
  merryDrawFlyaway(c);
  propsDraw(c, 0);
  merryDrawPlatform(c, g);
  for (i = 0; i < MERRY_N; i++) order.push({ i: i, z: Math.cos(merry.rot + i * MERRY_STEP) });
  order.sort(function (a, b) { return a.z - b.z; });
  for (i = 0; i < order.length; i++) if (order[i].z < 0) merryDrawSeat(c, order[i].i, g);
  merryDrawColumn(c, g);
  merryDrawSpot(c, g);
  for (i = 0; i < order.length; i++) if (order[i].z >= 0) merryDrawSeat(c, order[i].i, g);
  merryDrawCanopy(c, g);
  merryDrawMat(c, g);
  merryDrawQueue(c, g);
  merryDrawLeavers(c, g);
  propsDraw(c, 1);
  merryDrawHint(c, g);
  drawParticlesLayer(c);
  endPlayWorld();
  merryDrawHud(c);
}
// HUD: kierrosmerkit ja kierroksen puput (kyydissä = kirkas)
function merryDrawHud(c) {
  var H = viewH, hs = H * 0.022, x0 = hudX(), y = H * 0.011 + hs * 1.7, i, n = MERRY_ROUNDS[merry.round].n, w, x, done;
  w = hs * 1.4 + 3 * hs * 2.2 + hs * 1.2 + n * hs * 3.0;
  drawHudPanel(c, x0, hs * 0.7, w, hs * 3.4, hs);
  for (i = 0; i < 3; i++) {
    x = x0 + hs * 1.8 + i * hs * 2.2;
    done = i < merry.round || (i === merry.round && merry.state !== 'play');
    if (done) drawStar(c, x, y, hs * 0.8, 0, 0.3);
    else artCircle(c, x, y, hs * (i === merry.round ? 0.45 : 0.32), i === merry.round ? '#fff6e0' : 'rgba(255,255,255,0.5)', { lineColor: '#d89ab8', flat: true });
  }
  for (i = 0; i < n; i++) {
    x = x0 + hs * 1.4 + 3 * hs * 2.2 + hs * 1.2 + i * hs * 3.0;
    c.globalAlpha = i < merry.seated || merry.state !== 'play' ? 1 : 0.3;
    drawBunny(c, x, y + hs * 0.35, hs * 1.3, 0, 0, true);
    c.globalAlpha = 1;
  }
}

// ---------- Kartan kuvake ----------
HUB_ICONS.merry = function (c, x, y, s) {
  var i, r = s * 0.26;
  artBlob(c, x, y + r * 0.75, r, r * 0.22, '#ff8fc8', { lineColor: '#b04a80' });
  for (i = -1; i <= 1; i++) artLimb(c, x + i * r * 0.6, y - r * 0.35, x + i * r * 0.6, y + r * 0.7, Math.max(1, r * 0.06), '#ffe27a', '#a8801e');
  c.save();
  c.translate(x, y + r * 0.2);
  merryDrawSaddle(c, r * 0.5, '#4aa8ff', null, 0);
  c.restore();
  c.beginPath(); c.moveTo(x, y - r * 1.05); c.lineTo(x - r * 1.05, y - r * 0.35); c.lineTo(x + r * 1.05, y - r * 0.35); c.closePath();
  artFillPath(c, '#ffffff', y - r * 1.05, y - r * 0.35, r * 0.4, { lineColor: '#b04a80' });
  c.beginPath(); c.moveTo(x, y - r * 1.05); c.lineTo(x - r * 0.5, y - r * 0.35); c.lineTo(x - r * 0.1, y - r * 0.35); c.closePath();
  c.moveTo(x, y - r * 1.05); c.lineTo(x + r * 0.3, y - r * 0.35); c.lineTo(x + r * 0.7, y - r * 0.35); c.closePath();
  c.fillStyle = '#ff6fae';
  c.fill();
  drawStar(c, x, y - r * 1.1, r * 0.2, 0, 0);
};
