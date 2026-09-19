'use strict';

// Pesäkallio (Kaukamaa, Lohikäärmelaakso): uusi verbi RITSA.
// Prinsessa ruokkii pesissä odottavia lohikäärmeenpoikasia tulimarjoilla:
// paina mihin tahansa, vedä taakse ja päästä irti. Marja lentää kaaressa, ja
// vetäessä haalea pistekaari näyttää lentoradan (kivestä pysähtyvä kaari kertoo
// heti, mihin marja osuisi). Kolme kalliota eli asemaa: ensimmäisellä kaksi
// pesää, toisella kurkkiva poikanen ja pilari jonka yli pitää lobata, kolmannella
// köynnöksessä keinuva pesä, kielekkeen alla oleva pesä (matala heitto) ja
// marjoja varasteleva harakka. Kylläinen poikanen lähtee lentoon ja seuraa
// prinsessaa; lopuksi emolohikäärme herää kallion laella. Ei sydämiä.
// Tehtäväkaaret kallioiden välissä: anna N kappaletta, laske.

var NEST_G = 1.25;         // painovoima (× viewH / s²)
var NEST_VMAX = 1.75;      // laukaisunopeus täydellä vedolla (× viewH / s)
var NEST_PULL = 0.16;      // täyden vedon pituus (× viewH)
var NEST_MIN_PULL = 0.03;  // lyhyempi veto ei laukaise
var NEST_RELOAD = 0.3;
var NEST_WALK = 0.30;      // kävelynopeus asemien välillä (× viewW / s)
var NEST_PEEK_UP = 2.6, NEST_PEEK_DOWN = 1.2;
var NEST_COLORS = ['#7fe0c8', '#c9a0ff', '#ff9d7a', '#8fd4ff', '#ffd66b', '#ff9ec6', '#a8e07a', '#ffb0e0'];
// Asemat: pesät ruudun osuuksina (fx × viewW aseman sisällä, fy × viewH)
var NEST_STATIONS = [
  {
    nests: [{ fx: 0.50, fy: 0.55, want: 2 }, { fx: 0.80, fy: 0.36, want: 2 }],
    stars: [{ fx: 0.40, fy: 0.22 }, { fx: 0.66, fy: 0.16 }]
  },
  {
    nests: [{ fx: 0.44, fy: 0.60, want: 2 }, { fx: 0.66, fy: 0.30, want: 3, peek: true }, { fx: 0.87, fy: 0.50, want: 2 }],
    rocks: [{ fx: 0.78, top: 0.45, w: 0.045 }],
    stars: [{ fx: 0.55, fy: 0.14 }, { fx: 0.82, fy: 0.22 }]
  },
  {
    nests: [{ fx: 0.46, fy: 0.32, want: 3, swing: true }, { fx: 0.72, fy: 0.62, want: 2, overhang: true }, { fx: 0.87, fy: 0.50, want: 2 }],
    magpie: true,
    stars: [{ fx: 0.60, fy: 0.12 }, { fx: 0.30, fy: 0.20 }]
  }
];

var nest = {
  station: 0, walking: false, doneT: 0, finishT: 0, finished: false,
  dragons: [], rocks: [], stars: [], fruits: [], splats: [], hearts: [],
  aim: { active: false, sx: 0, sy: 0, dx: 0, dy: 0 },
  reload: 0, shots: 0, hintT: 0,
  magpie: { state: 'wait', t: 2.5, x: 0, y: 0, carry: null, vx: 0, vy: 0 },
  mother: { awake: false, t: 0 }
};

function nestS() { return viewH * 0.055; }
function nestStationX(k) { return k * viewW; }
function nestPrincessX(k) { return nestStationX(k) + viewW * 0.13; }
function nestFork() {
  return { x: princess.x + viewH * 0.07, y: princess.y - viewH * 0.125 };
}
function nestMotherPos() { return { x: nestStationX(2) + viewW * 0.92, y: viewH * 0.135 }; }

// ---------- Alustus ----------
function nestBuild() {
  var k, i, st, d, s = nestS(), r, idx = 0, m;
  nest.dragons = [];
  nest.rocks = [];
  nest.stars = [];
  for (k = 0; k < NEST_STATIONS.length; k++) {
    st = NEST_STATIONS[k];
    for (i = 0; i < st.nests.length; i++) {
      d = st.nests[i];
      nest.dragons.push({
        st: k, idx: idx, fx: d.fx, fy: d.fy, x: 0, y: 0, want: d.want, fed: 0,
        color: NEST_COLORS[idx % NEST_COLORS.length], state: 'hungry', t: 0,
        peek: !!d.peek, peekT: Math.random() * 2, down: 0,
        swing: !!d.swing, phase: Math.random() * 6, overhang: !!d.overhang,
        fly: false, fx2: 0, fy2: 0, blinkT: Math.random() * 3, flap: 0, bumpT: 0
      });
      idx++;
      if (!d.swing) {
        // Pilari pesän alla: putoava marja läiskähtää siihen
        nest.rocks.push({ kind: 'rect', x0: nestStationX(k) + d.fx * viewW - s * 1.0, x1: nestStationX(k) + d.fx * viewW + s * 1.0, y0: d.fy * viewH + s * 0.5, y1: groundTop + viewH * 0.1 });
      }
      if (d.overhang) {
        nest.rocks.push({ kind: 'ell', x: nestStationX(k) + d.fx * viewW + s * 0.3, y: d.fy * viewH - s * 3.6, rx: s * 3.2, ry: s * 0.75 });
      }
    }
    if (st.rocks) {
      for (i = 0; i < st.rocks.length; i++) {
        r = st.rocks[i];
        nest.rocks.push({ kind: 'rect', x0: nestStationX(k) + (r.fx - r.w / 2) * viewW, x1: nestStationX(k) + (r.fx + r.w / 2) * viewW, y0: r.top * viewH, y1: groundTop + viewH * 0.1 });
      }
    }
    if (st.stars) {
      for (i = 0; i < st.stars.length; i++) {
        nest.stars.push({ x: nestStationX(k) + st.stars[i].fx * viewW, y: st.stars[i].fy * viewH, collected: false, tw: Math.random() * 6 });
      }
    }
  }
  // Emon kieleke aseman 3 oikeassa ylänurkassa
  m = nestMotherPos();
  nest.rocks.push({ kind: 'rect', x0: m.x - viewW * 0.11, x1: m.x + viewW * 0.1, y0: m.y + viewH * 0.02, y1: m.y + viewH * 0.09 });
  nestPlaceDragons();
}

// Pesien paikat maailmassa (keinuva pesä liikkuu joka ruudulla)
function nestPlaceDragons() {
  var i, d, s = nestS(), a, L = viewH * 0.24;
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (d.swing) {
      a = Math.sin(globalT * 1.25 + d.phase) * 0.55;
      d.x = nestStationX(d.st) + d.fx * viewW + Math.sin(a) * L;
      d.y = d.fy * viewH - L + Math.cos(a) * L;
      d.angle = a;
    } else {
      d.x = nestStationX(d.st) + d.fx * viewW;
      d.y = d.fy * viewH;
    }
  }
}

function initNest() {
  var i;
  nest.station = 0;
  nest.walking = false;
  nest.doneT = 0;
  nest.finishT = 0;
  nest.finished = false;
  nest.fruits = [];
  nest.splats = [];
  nest.hearts = [];
  nest.aim.active = false;
  nest.reload = 0;
  nest.shots = 0;
  nest.hintT = 0;
  nest.magpie.state = 'wait';
  nest.magpie.t = 2.5;
  nest.magpie.carry = null;
  nest.mother.awake = false;
  nest.mother.t = 0;
  princess.x = nestPrincessX(0);
  princess.y = groundTop + viewH * 0.03;
  princess.facing = 1;
  princess.walkPhase = 0;
  camX = 0;
  tasks = [makeTask(0.985 * viewW / worldW, 'give'), makeTask(1.985 * viewW / worldW, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  nestBuild();
  renderBackground();
}

function respawnNest() {}
function resizeNest() {
  var i, d, states = [];
  for (i = 0; i < nest.dragons.length; i++) states.push(nest.dragons[i]);
  nestBuild();
  for (i = 0; i < nest.dragons.length && i < states.length; i++) {
    d = nest.dragons[i];
    d.fed = states[i].fed; d.state = states[i].state; d.fly = states[i].fly; d.t = states[i].t;
  }
  princess.x = nestPrincessX(nest.station);
  princess.y = groundTop + viewH * 0.03;
  camX = nestStationX(nest.station);
  nest.fruits = [];
}

// ---------- Apurit ----------
function nestMouth(d) {
  var s = nestS();
  return { x: d.x - s * 1.15, y: d.y - s * 1.4 + d.down, r: s * 1.1 };
}
function nestDragonOpen(d) {
  return d.state === 'hungry' && !d.fly && d.down < nestS() * 0.4;
}
function nestHitRock(x, y, r) {
  var i, k, dx, dy;
  for (i = 0; i < nest.rocks.length; i++) {
    k = nest.rocks[i];
    if (k.kind === 'rect') {
      if (x > k.x0 - r && x < k.x1 + r && y > k.y0 - r && y < k.y1 + r) return k;
    } else {
      dx = (x - k.x) / (k.rx + r);
      dy = (y - k.y) / (k.ry + r);
      if (dx * dx + dy * dy <= 1) return k;
    }
  }
  return null;
}
// Pesä jossa poikanen on piilossa tai kylläinen: marja läiskähtää pesään
function nestHitNest(x, y, r) {
  var i, d, s = nestS(), dx, dy;
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (d.fly || nestDragonOpen(d)) continue;
    dx = x - d.x; dy = y - (d.y - s * 0.3);
    if (dx * dx / (s * s * 2.6) + dy * dy / (s * s * 1.2) <= 1) return d;
  }
  return null;
}
function nestStationDone(k) {
  var i, d;
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (d.st === k && d.fed < d.want) return false;
  }
  return true;
}
function nestLaunchVel(dx, dy) {
  var maxP = NEST_PULL * viewH, len = Math.sqrt(dx * dx + dy * dy), k;
  if (len > maxP) { dx *= maxP / len; dy *= maxP / len; len = maxP; }
  k = NEST_VMAX * viewH / maxP;
  return { vx: -dx * k, vy: -dy * k, px: dx, py: dy, len: len };
}
// Lentoradan ennakko: pisteet kunnes maa, kivi, pesä tai suu
function nestPreview(vx, vy) {
  var f = nestFork(), x = f.x, y = f.y, pts = [], i, d, m, dx, dy, step = 1 / 60, hit = null, j;
  for (i = 0; i < 150; i++) {
    vy += NEST_G * viewH * step;
    x += vx * step;
    y += vy * step;
    if (y > groundTop + viewH * 0.01 || x - camX > viewW * 1.05 || x < camX - viewW * 0.05) break;
    if (nestHitRock(x, y, viewH * 0.012)) break;
    if (nestHitNest(x, y, viewH * 0.012)) break;
    if (i % 3 === 2) pts.push({ x: x, y: y });
    for (j = 0; j < nest.dragons.length; j++) {
      d = nest.dragons[j];
      if (d.st !== nest.station || !nestDragonOpen(d)) continue;
      m = nestMouth(d);
      dx = x - m.x; dy = y - m.y;
      if (dx * dx + dy * dy < m.r * m.r * 0.6) { hit = d; break; }
    }
    if (hit) break;
  }
  return { pts: pts, hit: hit };
}

function soundTwang() {
  playNote(220, 0, 0.08, 'triangle', 0.3);
  playNote(330, 0.05, 0.12, 'triangle', 0.3);
  playNote(520, 0.1, 0.16, 'sine', 0.2);
}
function soundChomp() {
  playNote(160, 0, 0.07, 'square', 0.25);
  playNote(110, 0.07, 0.12, 'square', 0.25);
  playNote(660, 0.16, 0.18, 'triangle', 0.25);
}
function soundSplat() {
  playNote(140, 0, 0.1, 'sawtooth', 0.12);
  playNote(90, 0.06, 0.14, 'sawtooth', 0.1);
}
function soundMagpie() {
  playNote(980, 0, 0.06, 'square', 0.12);
  playNote(880, 0.09, 0.06, 'square', 0.12);
  playNote(1040, 0.2, 0.06, 'square', 0.1);
}
function soundDragonHappy(n) {
  var base = 500 + n * 40;
  playNote(base, 0, 0.14, 'triangle', 0.35);
  playNote(base * 1.25, 0.12, 0.14, 'triangle', 0.35);
  playNote(base * 1.5, 0.24, 0.3, 'triangle', 0.4);
}

// ---------- Syöte ----------
function handleNestTap(px, py) {
  if (!running || celebrating || puzzleBusy() || nest.walking) return;
  nest.aim.active = true;
  nest.aim.sx = px;
  nest.aim.sy = py;
  nest.aim.dx = 0;
  nest.aim.dy = 0;
}

function nestRelease() {
  var a = nest.aim, v, f;
  a.active = false;
  v = nestLaunchVel(a.dx, a.dy);
  if (v.len < NEST_MIN_PULL * viewH || nest.reload > 0) return;
  f = nestFork();
  nest.fruits.push({ x: f.x, y: f.y, vx: v.vx, vy: v.vy, rot: 0, trail: [], age: 0 });
  nest.reload = NEST_RELOAD;
  nest.shots++;
  spawnDust(f.x, f.y, 4, -1);
  soundTwang();
}

// ---------- Päivitys ----------
function updateNest(dt) {
  var i, j, fr, d, m, dx, dy, s = nestS(), busy, k, mp, st;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  nestPlaceDragons();
  if (nest.reload > 0) nest.reload -= dt;

  // Tähtäys: sormi pohjassa vetää, nosto laukaisee
  if (nest.aim.active) {
    if (holding && !busy) {
      nest.aim.dx = lastPX - nest.aim.sx;
      nest.aim.dy = lastPY - nest.aim.sy;
    } else if (busy) {
      nest.aim.active = false;
    } else {
      nestRelease();
    }
  }
  if (nest.shots === 0 && !busy && !nest.walking) nest.hintT += dt;

  // Marjat lennossa
  for (i = nest.fruits.length - 1; i >= 0; i--) {
    fr = nest.fruits[i];
    fr.age += dt;
    fr.trail.push({ x: fr.x, y: fr.y });
    if (fr.trail.length > 9) fr.trail.shift();
    fr.vy += NEST_G * viewH * dt;
    fr.x += fr.vx * dt;
    fr.y += fr.vy * dt;
    fr.rot += dt * 9;
    // Bonustähdet
    for (j = 0; j < nest.stars.length; j++) {
      st = nest.stars[j];
      if (st.collected) continue;
      dx = fr.x - st.x; dy = fr.y - st.y;
      if (dx * dx + dy * dy < s * s * 0.9) {
        st.collected = true;
        artPop(st.x, st.y, s * 0.8, '#ffe27a', 'burst');
        spawnSparkles(st.x, st.y, 14, '#ffe27a');
        soundStar(j);
      }
    }
    // Harakka nappaa marjan
    mp = nest.magpie;
    if (mp.state === 'fly') {
      dx = fr.x - mp.x; dy = fr.y - mp.y;
      if (dx * dx + dy * dy < s * s * 1.1) {
        mp.state = 'steal';
        mp.carry = fr;
        mp.vx = viewW * 0.45;
        mp.vy = -viewH * 0.32;
        nest.fruits.splice(i, 1);
        soundMagpie();
        continue;
      }
    }
    // Suuhun?
    k = null;
    for (j = 0; j < nest.dragons.length; j++) {
      d = nest.dragons[j];
      if (!nestDragonOpen(d)) continue;
      m = nestMouth(d);
      dx = fr.x - m.x; dy = fr.y - m.y;
      if (dx * dx + dy * dy < m.r * m.r) { k = d; break; }
    }
    if (k) {
      nestFeed(k, fr);
      nest.fruits.splice(i, 1);
      continue;
    }
    if (fr.y > groundTop + viewH * 0.01 || nestHitRock(fr.x, fr.y, s * 0.2) || nestHitNest(fr.x, fr.y, s * 0.2)) {
      nestSplat(fr.x, Math.min(fr.y, groundTop + viewH * 0.01));
      d = nestHitNest(fr.x, fr.y, s * 0.2);
      if (d) d.bumpT = 0.4;
      nest.fruits.splice(i, 1);
      continue;
    }
    if (fr.x - camX > viewW * 1.1 || fr.x < camX - viewW * 0.1 || fr.age > 6) nest.fruits.splice(i, 1);
  }

  // Poikaset: kurkistus, pureskelu, lento, räpäytys
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    d.t += dt;
    d.blinkT -= dt;
    if (d.blinkT < -0.15) d.blinkT = 2 + Math.random() * 3;
    if (d.bumpT > 0) d.bumpT -= dt;
    if (d.peek && d.state === 'hungry') {
      d.peekT += dt;
      var cyc = d.peekT % (NEST_PEEK_UP + NEST_PEEK_DOWN);
      var target = cyc < NEST_PEEK_UP ? 0 : s * 1.7;
      d.down += (target - d.down) * Math.min(1, dt * 9);
    }
    if (d.state === 'chomp' && d.t > 0.45) d.state = d.fed >= d.want ? 'full' : 'hungry';
    if (d.state === 'full' && !d.fly && d.t > 0.9) {
      d.fly = true;
      d.fx2 = d.x; d.fy2 = d.y - s * 1.5;
      artPop(d.x, d.y - s * 1.5, s * 1.6, d.color, 'ring');
    }
    if (d.fly) nestFollow(d, i, dt);
  }

  // Harakka (kolmas kallio)
  mp = nest.magpie;
  if (nest.station === 2 && !celebrating) {
    if (mp.state === 'wait') {
      if (!busy) mp.t -= dt;
      if (mp.t <= 0) {
        mp.state = 'fly';
        mp.x = camX + viewW * 1.08;
        mp.y = viewH * (0.38 + Math.random() * 0.12);
        mp.vx = -viewW * 0.30;
        mp.vy = 0;
        soundMagpie();
      }
    } else if (mp.state === 'fly') {
      if (!busy) {
        mp.x += mp.vx * dt;
        mp.y += Math.sin(globalT * 3) * viewH * 0.06 * dt;
      }
      if (mp.x < camX - viewW * 0.1) { mp.state = 'wait'; mp.t = 3.5 + Math.random() * 2; }
    } else if (mp.state === 'steal') {
      mp.x += mp.vx * dt;
      mp.y += mp.vy * dt;
      if (mp.x > camX + viewW * 1.15 || mp.y < -viewH * 0.1) { mp.state = 'wait'; mp.t = 4 + Math.random() * 2; mp.carry = null; }
    }
  }

  // Läiskeet ja sydämet
  for (i = nest.splats.length - 1; i >= 0; i--) {
    nest.splats[i].t += dt;
    if (nest.splats[i].t > 0.7) nest.splats.splice(i, 1);
  }
  for (i = nest.hearts.length - 1; i >= 0; i--) {
    nest.hearts[i].t += dt;
    nest.hearts[i].y -= viewH * 0.12 * dt;
    if (nest.hearts[i].t > 1.4) nest.hearts.splice(i, 1);
  }
  for (i = 0; i < nest.stars.length; i++) nest.stars[i].tw += dt;

  // Asema valmis: hetken tauko, sitten kävely seuraavalle kalliolle
  if (!nest.walking && !celebrating && !busy) {
    if (nest.station < NEST_STATIONS.length - 1 && nestStationDone(nest.station)) {
      nest.doneT += dt;
      if (nest.doneT > 1.1) {
        nest.doneT = 0;
        nest.walking = true;
        nest.aim.active = false;
        playNote(659, 0, 0.12, 'triangle', 0.3);
        playNote(784, 0.1, 0.2, 'triangle', 0.3);
      }
    } else if (nest.station === NEST_STATIONS.length - 1 && nestStationDone(nest.station) && !nest.finished) {
      if (!nest.mother.awake) {
        nest.mother.awake = true;
        nest.mother.t = 0;
        artPop(nestMotherPos().x, nestMotherPos().y - viewH * 0.1, viewH * 0.1, '#ff9ec6', 'burst');
        soundDragonHappy(4);
      }
      nest.finishT += dt;
      if (nest.finishT > 2.0) {
        nest.finished = true;
        startCelebration();
      }
    }
  }
  if (nest.mother.awake) nest.mother.t += dt;
  if (nest.walking) {
    if (!busy) {
      princess.x += NEST_WALK * viewW * dt;
      princess.walkPhase += dt * 11;
      if (princess.x >= nestPrincessX(nest.station + 1)) {
        nest.station++;
        princess.x = nestPrincessX(nest.station);
        nest.walking = false;
        nest.magpie.t = 2.5;
        playNote(523, 0, 0.15, 'triangle', 0.35);
        playNote(659, 0.1, 0.15, 'triangle', 0.35);
        playNote(784, 0.2, 0.3, 'triangle', 0.4);
      }
    }
  }
  var camTarget = Math.min(Math.max(princess.x - viewW * 0.13, 0), Math.max(0, worldW - viewW));
  camX += (camTarget - camX) * Math.min(1, dt * 6);
  if (Math.abs(camTarget - camX) < 0.5) camX = camTarget;
}

function nestFeed(d, fr) {
  var s = nestS(), m = nestMouth(d);
  d.fed++;
  d.state = 'chomp';
  d.t = 0;
  artPop(m.x, m.y, s * 0.9, '#ffffff', 'ring');
  spawnSparkles(m.x, m.y, 10, '#ff8a5a');
  nest.hearts.push({ x: d.x - s * 0.6, y: d.y - s * 2.6, t: 0 });
  soundChomp();
  if (d.fed >= d.want) {
    spawnSparkles(d.x, d.y - s * 1.5, 22, d.color);
    nest.hearts.push({ x: d.x + s * 0.3, y: d.y - s * 2.9, t: -0.2 });
    nest.hearts.push({ x: d.x - s * 1.0, y: d.y - s * 2.7, t: -0.4 });
    soundDragonHappy(d.idx);
  }
}

function nestSplat(x, y) {
  nest.splats.push({ x: x, y: y, t: 0 });
  spawnSparkles(x, y - viewH * 0.01, 6, '#ff6a4a');
  soundSplat();
}

// Kylläinen poikanen lentää prinsessan lähelle ja seuraa häntä; juhlassa
// poikaset kiertävät emoa
function nestFollow(d, i, dt) {
  var s = nestS(), tx, ty, n = 0, j, mp, a;
  for (j = 0; j < i; j++) if (nest.dragons[j].fly) n++;
  if (celebrating || nest.mother.awake) {
    mp = nestMotherPos();
    a = globalT * 1.2 + n * (Math.PI * 2 / 8);
    tx = mp.x - viewW * 0.05 + Math.cos(a) * viewH * 0.22;
    ty = mp.y + viewH * 0.12 + Math.sin(a) * viewH * 0.1;
  } else {
    tx = princess.x - viewW * 0.05 - (n % 3) * viewH * 0.085 + Math.sin(globalT * 1.3 + n) * viewH * 0.01;
    ty = princess.y - viewH * 0.42 + Math.floor(n / 3) * viewH * 0.085 + Math.sin(globalT * 2.2 + n * 1.7) * viewH * 0.015;
  }
  d.fx2 += (tx - d.fx2) * Math.min(1, dt * 3.2);
  d.fy2 += (ty - d.fy2) * Math.min(1, dt * 3.2);
}

// ---------- Piirto: taustakerrokset ----------
var NEST_HAZE = '#f6b58c';
function nestLayers() {
  return [
    { speed: 0.2, render: renderNestFar },
    { speed: 0.55, render: renderNestMid },
    { speed: 1, render: renderNestNear }
  ];
}
function renderNestBg(b, w, h) {
  renderNestFar(b, w, h);
  renderNestMid(b, w, h);
  renderNestNear(b, w, h);
}
function renderNestFar(b, w, h) {
  var i, x, y, sky = b.createLinearGradient(0, 0, 0, h * 0.78);
  sky.addColorStop(0, '#3a2472');
  sky.addColorStop(0.35, '#8a4a90');
  sky.addColorStop(0.65, '#e8825f');
  sky.addColorStop(1, '#ffd39a');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff3d0';
  for (i = 0; i < 40; i++) {
    x = w * ((i * 0.137 + 0.03) % 1);
    y = h * (0.02 + (i * 0.071) % 0.34);
    b.globalAlpha = 0.3 + (i % 4) * 0.15;
    b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.58, h * 0.60, h * 0.085, 0.2, '#ffd9a0', '#fff6dc', '#ffb457');
  // Kaukainen tulivuori ja vuorijono utuisina
  var far = artMix('#6a3d7a', NEST_HAZE, 0.5);
  fillHillBand(b, w, h, groundTop, far, function (px) {
    return groundTop - h * 0.1 - Math.abs(Math.sin(px * 0.0032 + 0.6)) * h * 0.12 - Math.sin(px * 0.009) * h * 0.02;
  });
  var vx = w * 0.4, vy = groundTop - h * 0.02;
  b.fillStyle = artMix('#5a3070', NEST_HAZE, 0.35);
  b.beginPath(); b.moveTo(vx - h * 0.34, vy); b.lineTo(vx - h * 0.05, vy - h * 0.34); b.lineTo(vx + h * 0.05, vy - h * 0.34); b.lineTo(vx + h * 0.34, vy); b.closePath(); b.fill();
  artBlob(b, vx, vy - h * 0.34, h * 0.05, h * 0.016, '#ff9a5a', { line: false });
  b.fillStyle = 'rgba(255,220,230,0.55)';
  cloudShape(b, vx + h * 0.03, vy - h * 0.41, h * 0.02);
  cloudShape(b, vx + h * 0.09, vy - h * 0.48, h * 0.026);
  cloudShape(b, vx + h * 0.17, vy - h * 0.53, h * 0.03);
  fillHillBand(b, w, h, groundTop, artMix('#7a4a6a', NEST_HAZE, 0.3), function (px) {
    return groundTop - h * 0.03 - Math.abs(Math.sin(px * 0.0045 + 2.1)) * h * 0.07;
  });
  // Kaukaiset lohikäärmeet
  for (i = 0; i < 3; i++) drawDragonSilhouette(b, w * (0.15 + i * 0.3), h * (0.2 + (i % 2) * 0.1), h * 0.012, (i % 2) ? 0.6 : -0.4, 'rgba(90,50,110,0.5)');
}
function renderNestMid(b, w, h) {
  var i, x, top, ww;
  var mesa = artMix('#b8604a', NEST_HAZE, 0.3), mesaTop = artMix('#d98a6a', NEST_HAZE, 0.3);
  for (i = 0; i < 9; i++) {
    x = w * (i / 8.5) + (i % 2) * h * 0.1;
    ww = h * (0.14 + (i % 3) * 0.05);
    top = h * (0.50 + (i % 4) * 0.04);
    roundRect(b, x - ww / 2, top, ww, groundTop + h * 0.02 - top, h * 0.03);
    b.fillStyle = mesa;
    b.fill();
    b.fillStyle = mesaTop;
    roundRect(b, x - ww / 2, top, ww, h * 0.035, h * 0.02);
    b.fill();
  }
  fillHillBand(b, w, h, groundTop + h * 0.02, artMix('#c96b4e', NEST_HAZE, 0.2), function (px) {
    return groundTop - h * 0.02 - Math.sin(px * 0.006) * h * 0.025;
  });
}
function renderNestNear(b, w, h) {
  var i, k, x, g, s = nestS(), st, d, r, m, px, py;
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#d98457');
  g.addColorStop(1, '#a04a30');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,210,150,0.35)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  b.fillStyle = 'rgba(120,50,30,0.25)';
  for (i = 0; i < 60; i++) {
    x = (i * 173.7) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, groundTop + h * 0.06 + (i % 5) * h * 0.035, h * 0.02, h * 0.007, 0, 0, Math.PI * 2); else b.arc(x, groundTop + h * 0.08, h * 0.01, 0, Math.PI * 2);
    b.fill();
  }
  // Pilarit pesien alle, irtokivet, kieleke ja emon kieleke
  for (k = 0; k < NEST_STATIONS.length; k++) {
    st = NEST_STATIONS[k];
    for (i = 0; i < st.nests.length; i++) {
      d = st.nests[i];
      px = nestStationX(k) + d.fx * viewW;
      py = d.fy * h;
      if (d.swing) {
        drawNestBough(b, px, d.fy * h - h * 0.24, h);
      } else {
        drawNestPillar(b, px, py + s * 0.5, s * 2.0, groundTop + h * 0.03);
      }
      if (d.overhang) drawNestOverhang(b, px + s * 0.3, py - s * 3.6, s * 3.2, s * 0.75);
    }
    if (st.rocks) {
      for (i = 0; i < st.rocks.length; i++) {
        r = st.rocks[i];
        drawNestPillar(b, nestStationX(k) + r.fx * viewW, r.top * h, r.w * viewW, groundTop + h * 0.03, true);
      }
    }
  }
  m = nestMotherPos();
  drawNestLedge(b, m.x - viewW * 0.11, m.x + viewW * 0.1, m.y + h * 0.02, h * 0.07);
  // Saniaiset, kristallit ja munakivet
  for (i = 0; i < 26; i++) {
    x = (i * 211.3 + 40) % w;
    if (i % 3 === 0) drawNestCrystal(b, x, groundTop + h * 0.015, h * (0.03 + (i % 2) * 0.012));
    else drawNestFern(b, x, groundTop + h * 0.01, h * (0.05 + (i % 4) * 0.012), i);
  }
  for (i = 0; i < 8; i++) {
    x = (i * 631.7 + 300) % w;
    artBlob(b, x, groundTop - h * 0.01, h * 0.022, h * 0.03, '#f4e6d0', { shadeTo: '#c9a98a', lineColor: '#9a7a5a', hi: 0.4 });
    artBlob(b, x - h * 0.006, groundTop - h * 0.02, h * 0.005, h * 0.004, '#c9a0ff', { line: false });
  }
}
function drawNestPillar(b, x, top, w, bottom, plain) {
  var hh = bottom - top, i;
  roundRect(b, x - w / 2, top, w, hh + 4, w * 0.25);
  artFillPath(b, '#b8563c', top, bottom, w * 0.5, { shadeTo: '#7a3020', lineColor: '#5a2014' });
  artBlob(b, x, top + w * 0.02, w * 0.55, w * 0.16, '#e09a7a', { lineColor: '#8a4a30', hi: 0.3 });
  b.fillStyle = 'rgba(60,20,10,0.25)';
  for (i = 1; i < 4; i++) {
    b.beginPath();
    if (b.ellipse) b.ellipse(x + (i % 2 ? -w * 0.15 : w * 0.12), top + hh * (i / 4.5), w * 0.22, w * 0.08, 0, 0, Math.PI * 2); else b.arc(x, top + hh * (i / 4.5), w * 0.1, 0, Math.PI * 2);
    b.fill();
  }
  if (!plain) {
    artBlob(b, x - w * 0.45, top + w * 0.05, w * 0.18, w * 0.12, '#6dbb6a', { line: false });
    artBlob(b, x + w * 0.42, top + w * 0.02, w * 0.16, w * 0.1, '#6dbb6a', { line: false });
  }
}
function drawNestLedge(b, x0, x1, y, hh) {
  roundRect(b, x0, y, x1 - x0 + viewH * 0.2, hh, hh * 0.35);
  artFillPath(b, '#b8563c', y, y + hh, hh * 0.5, { shadeTo: '#7a3020', lineColor: '#5a2014' });
  artBlob(b, (x0 + x1) / 2 + viewH * 0.1, y + hh * 0.06, (x1 - x0) * 0.5 + viewH * 0.1, hh * 0.16, '#e09a7a', { lineColor: '#8a4a30', hi: 0.25 });
  artBlob(b, x0 + hh * 0.3, y + hh * 0.05, hh * 0.35, hh * 0.2, '#6dbb6a', { line: false });
}
function drawNestOverhang(b, x, y, rx, ry) {
  artBlob(b, x, y, rx, ry, '#b8563c', { shadeTo: '#7a3020', lineColor: '#5a2014', hi: 0.2 });
  artBlob(b, x - rx * 0.2, y - ry * 0.5, rx * 0.5, ry * 0.35, '#e09a7a', { line: false });
  artBlob(b, x + rx * 0.55, y - ry * 0.7, ry * 0.5, ry * 0.3, '#6dbb6a', { line: false });
}
function drawNestBough(b, x, pivotY, h) {
  artLimb(b, x - h * 0.2, -h * 0.02, x + h * 0.02, pivotY - h * 0.005, h * 0.03, '#7a4a2a', '#4a2a14');
  artLimb(b, x + h * 0.02, pivotY - h * 0.005, x + h * 0.18, pivotY - h * 0.06, h * 0.022, '#7a4a2a', '#4a2a14');
  artBlob(b, x - h * 0.1, h * 0.04, h * 0.07, h * 0.04, '#5faa62', { line: false });
  artBlob(b, x + h * 0.14, pivotY - h * 0.08, h * 0.06, h * 0.035, '#5faa62', { line: false });
}
function drawNestFern(b, x, baseY, s, seed) {
  var i, a, col = (seed % 2) ? '#5faa62' : '#7cc46f';
  b.strokeStyle = col;
  b.lineCap = 'round';
  for (i = 0; i < 4; i++) {
    a = -Math.PI / 2 + (i - 1.5) * 0.45;
    b.lineWidth = Math.max(2, s * 0.14);
    b.beginPath();
    b.moveTo(x, baseY);
    b.quadraticCurveTo(x + Math.cos(a) * s * 0.6, baseY + Math.sin(a) * s * 0.6 - s * 0.1, x + Math.cos(a) * s * 1.1, baseY + Math.sin(a) * s * 1.0);
    b.stroke();
  }
  b.lineCap = 'butt';
}
function drawNestCrystal(b, x, baseY, s) {
  artGlow(b, x, baseY - s * 0.5, s * 1.6, '#ff8a5a', 0.35);
  b.beginPath(); b.moveTo(x - s * 0.35, baseY); b.lineTo(x - s * 0.15, baseY - s * 1.2); b.lineTo(x + s * 0.15, baseY - s * 0.6); b.lineTo(x + s * 0.4, baseY); b.closePath();
  artFillPath(b, '#ff7a55', baseY - s * 1.2, baseY, s * 0.4, { lineColor: '#b83a20', hi: 0 });
  b.fillStyle = 'rgba(255,255,255,0.45)';
  b.beginPath(); b.moveTo(x - s * 0.22, baseY - s * 0.1); b.lineTo(x - s * 0.15, baseY - s * 1.0); b.lineTo(x - s * 0.08, baseY - s * 0.2); b.closePath(); b.fill();
}

// ---------- Piirto: hahmot ----------
// Lohikäärmeenpoikanen: origo jalkojen alla, katsoo vasemmalle (prinsessaa kohti).
// o: { mouth 0..1, flap -1..1, look, blink, squash, sleep, facing: -1 peilaa oikealle, noShadow }
function drawBabyDragon(c, x, y, s, color, o) {
  o = o || {};
  var dark = artShade(color, -0.45), light = artShade(color, 0.45), flap = o.flap || 0;
  var lo = { lineColor: dark };
  if (!o.noShadow) artShadow(c, x, y + s * 0.1, s * 1.6, s * 0.35, 0.14);
  c.save();
  c.translate(x, y);
  if (o.facing) c.scale(o.facing, 1);
  if (o.squash) artSquash(c, o.squash);
  // Häntä
  c.strokeStyle = dark;
  artLimb(c, s * 0.6, -s * 0.55, s * 1.55, -s * 1.15, s * 0.3, color, dark);
  artBlob(c, s * 1.7, -s * 1.3, s * 0.26, s * 0.22, light, lo);
  // Takasiipi
  c.beginPath();
  c.moveTo(s * 0.15, -s * 1.15); c.lineTo(s * 0.95, -s * 2.0 - flap * s * 0.35); c.lineTo(s * 1.3, -s * 1.05); c.closePath();
  artFillPath(c, artShade(color, -0.15), -s * 2.2, -s * 1.0, s * 0.4, lo);
  // Vartalo ja maha
  artBlob(c, 0, -s * 0.85, s * 0.92, s * 0.85, color, { lineColor: dark, hi: 0.3 });
  artBlob(c, -s * 0.12, -s * 0.66, s * 0.56, s * 0.5, light, { line: false });
  // Jalat
  artBlob(c, -s * 0.42, -s * 0.06, s * 0.3, s * 0.18, color, lo);
  artBlob(c, s * 0.38, -s * 0.06, s * 0.3, s * 0.18, color, lo);
  // Selän piikit
  c.fillStyle = '#ffe9b0';
  c.beginPath(); c.moveTo(s * 0.2, -s * 1.6); c.lineTo(s * 0.35, -s * 1.95); c.lineTo(s * 0.55, -s * 1.5); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(s * 0.55, -s * 1.45); c.lineTo(s * 0.75, -s * 1.75); c.lineTo(s * 0.9, -s * 1.25); c.closePath(); c.fill();
  // Pää, sarvet, kuono
  artCircle(c, -s * 0.55, -s * 1.78, s * 0.7, color, { lineColor: dark, hi: 0.35 });
  artLimb(c, -s * 0.9, -s * 2.3, -s * 1.08, -s * 2.75, s * 0.17, '#ffe9b0', '#c9a05a');
  artLimb(c, -s * 0.42, -s * 2.4, -s * 0.4, -s * 2.85, s * 0.17, '#ffe9b0', '#c9a05a');
  artBlob(c, -s * 1.1, -s * 1.55, s * 0.44, s * 0.34, artShade(color, 0.18), lo);
  c.fillStyle = dark;
  c.beginPath(); c.arc(-s * 1.35, -s * 1.62, s * 0.045, 0, Math.PI * 2); c.arc(-s * 1.2, -s * 1.66, s * 0.045, 0, Math.PI * 2); c.fill();
  // Suu: auki (nälkäinen) tai hymy
  if (o.mouth > 0.05) {
    artBlob(c, -s * 1.15, -s * 1.3 + s * 0.12 * o.mouth, s * 0.28 + s * 0.14 * o.mouth, s * 0.1 + s * 0.3 * o.mouth, '#5a2340', { line: false });
    if (o.mouth > 0.4) artBlob(c, -s * 1.1, -s * 1.12 + s * 0.14 * o.mouth, s * 0.16, s * 0.09, '#ff7a9a', { line: false });
  } else {
    c.strokeStyle = dark;
    c.lineWidth = Math.max(1.2, s * 0.07);
    c.lineCap = 'round';
    c.beginPath(); c.arc(-s * 1.1, -s * 1.42, s * 0.22, 0.3, Math.PI - 0.4); c.stroke();
  }
  // Silmät ja posket
  if (o.sleep) {
    artEye(c, -s * 0.8, -s * 1.95, s * 0.2, 0, true);
    artEye(c, -s * 0.32, -s * 1.9, s * 0.2, 0, true);
  } else {
    artEye(c, -s * 0.8, -s * 1.95, s * 0.2, o.look || -0.4, o.blink);
    artEye(c, -s * 0.32, -s * 1.9, s * 0.2, o.look || -0.4, o.blink);
  }
  artBlush(c, -s * 1.0, -s * 1.72, s * 0.12);
  // Etusiipi
  c.beginPath();
  c.moveTo(s * 0.05, -s * 1.2); c.lineTo(s * 0.6, -s * 2.05 - flap * s * 0.4); c.lineTo(s * 1.05, -s * 1.15); c.closePath();
  artFillPath(c, artShade(color, 0.15), -s * 2.3, -s * 1.0, s * 0.4, lo);
  c.restore();
}
function drawDragonHead(c, x, y, s, color) {
  var dark = artShade(color, -0.45);
  artLimb(c, x - s * 0.35, y - s * 0.7, x - s * 0.5, y - s * 1.15, s * 0.22, '#ffe9b0', '#c9a05a');
  artLimb(c, x + s * 0.25, y - s * 0.75, x + s * 0.3, y - s * 1.2, s * 0.22, '#ffe9b0', '#c9a05a');
  artCircle(c, x, y, s, color, { lineColor: dark, hi: 0.35 });
  artBlob(c, x - s * 0.75, y + s * 0.3, s * 0.55, s * 0.42, artShade(color, 0.18), { lineColor: dark });
  artEye(c, x - s * 0.3, y - s * 0.2, s * 0.26, -0.3, false);
  artEye(c, x + s * 0.32, y - s * 0.15, s * 0.26, -0.3, false);
  artBlush(c, x + s * 0.6, y + s * 0.2, s * 0.16);
}
function drawNestBowl(c, x, y, s, front) {
  var i;
  if (!front) {
    artBlob(c, x, y - s * 0.1, s * 1.55, s * 0.5, '#a56a3a', { shadeTo: '#6a3a1a', lineColor: '#4a2810', hi: 0.15 });
    return;
  }
  artBlob(c, x, y + s * 0.15, s * 1.6, s * 0.55, '#b8783f', { shadeTo: '#7a4520', lineColor: '#4a2810', hi: 0.2 });
  c.strokeStyle = 'rgba(80,40,15,0.55)';
  c.lineWidth = Math.max(1.2, s * 0.07);
  c.lineCap = 'round';
  for (i = 0; i < 6; i++) {
    c.beginPath();
    c.moveTo(x - s * 1.3 + i * s * 0.5, y + s * 0.45 + (i % 2) * s * 0.12);
    c.quadraticCurveTo(x - s * 1.1 + i * s * 0.5, y + s * 0.05, x - s * 0.7 + i * s * 0.5, y + s * 0.3);
    c.stroke();
  }
  c.lineCap = 'butt';
  artBlob(c, x - s * 0.6, y - s * 0.2, s * 0.4, s * 0.12, '#d9a06a', { line: false });
}
function drawBerry(c, x, y, r, rot, glow) {
  if (glow) artGlow(c, x, y, r * 2.6, '#ff8a4a', 0.35);
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artCircle(c, 0, 0, r, '#ff5a3c', { lineColor: '#9a2a14', hi: 0.45 });
  c.fillStyle = '#ffd08a';
  c.beginPath(); c.arc(-r * 0.3, r * 0.2, r * 0.13, 0, Math.PI * 2); c.arc(r * 0.35, r * 0.05, r * 0.12, 0, Math.PI * 2); c.arc(0, r * 0.5, r * 0.11, 0, Math.PI * 2); c.fill();
  artBlob(c, r * 0.1, -r * 0.95, r * 0.45, r * 0.22, '#6dbb6a', { rot: -0.5, lineColor: '#3a7a3a' });
  c.restore();
}
function drawBerryOutline(c, x, y, r) {
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1.2, r * 0.18);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}
function drawMagpie(c, x, y, s, flap, dir, carry) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artBlob(c, s * 1.6, -s * 0.1, s * 0.9, s * 0.18, '#2a2a3a', { rot: 0.2, lineColor: '#111' });
  artBlob(c, 0, 0, s * 1.0, s * 0.55, '#2a2a3a', { lineColor: '#111', hi: 0.15 });
  artBlob(c, -s * 0.1, s * 0.12, s * 0.6, s * 0.3, '#f4f4ff', { line: false });
  c.beginPath(); c.moveTo(-s * 0.2, -s * 0.2); c.lineTo(s * 0.4, -s * 1.1 - flap * s * 0.5); c.lineTo(s * 0.9, -s * 0.1); c.closePath();
  artFillPath(c, '#4a6ad0', -s * 1.2, 0, s * 0.4, { lineColor: '#1a2a6a' });
  artCircle(c, -s * 0.95, -s * 0.35, s * 0.42, '#2a2a3a', { lineColor: '#111' });
  c.fillStyle = '#ffb347';
  c.beginPath(); c.moveTo(-s * 1.3, -s * 0.35); c.lineTo(-s * 1.85, -s * 0.2); c.lineTo(-s * 1.3, -s * 0.12); c.closePath(); c.fill();
  artEye(c, -s * 1.02, -s * 0.45, s * 0.12, -0.5, false);
  c.restore();
  if (carry) drawBerry(c, x - dir * s * 1.4, y + s * 0.3, s * 0.35, 0, false);
}
function drawSlingshot(c, f, s, pouch) {
  var hx = f.x - s * 0.1, hy = f.y + s * 1.3;
  artLimb(c, hx, hy, f.x, f.y, s * 0.22, '#8a5a30', '#4a2a10');
  artLimb(c, f.x, f.y, f.x - s * 0.5, f.y - s * 0.8, s * 0.18, '#8a5a30', '#4a2a10');
  artLimb(c, f.x, f.y, f.x + s * 0.5, f.y - s * 0.8, s * 0.18, '#8a5a30', '#4a2a10');
  c.strokeStyle = '#7a3a2a';
  c.lineWidth = Math.max(2, s * 0.1);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(f.x - s * 0.5, f.y - s * 0.8); c.lineTo(pouch.x - s * 0.15, pouch.y); c.stroke();
  c.beginPath(); c.moveTo(f.x + s * 0.5, f.y - s * 0.8); c.lineTo(pouch.x + s * 0.15, pouch.y); c.stroke();
  c.lineCap = 'butt';
  artRoundRect(c, pouch.x - s * 0.24, pouch.y - s * 0.1, s * 0.48, s * 0.22, s * 0.08, '#5a2a1a', { line: false });
}

// ---------- Piirto: kenttä ----------
function drawNest() {
  var i, j, d, s = nestS(), f, pouch, v, pv, fr, st, sp, k, m, mp, a, hs;
  if (!beginPlayWorld()) return;
  var cx = camX;

  // Keinuvan pesän köynnös
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (!d.swing) continue;
    var pivX = nestStationX(d.st) + d.fx * viewW, pivY = d.fy * viewH - viewH * 0.24;
    artLimb(ctx, pivX - cx, pivY, d.x - cx, d.y - s * 0.6, s * 0.16, '#5faa62', '#2f6a34');
    artLimb(ctx, pivX - cx + s * 0.25, pivY, d.x - cx + s * 0.35, d.y - s * 0.5, s * 0.12, '#5faa62', '#2f6a34');
  }

  // Pesät ja poikaset (pesässä olevat)
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (d.fly) continue;
    var dx = d.x - cx;
    if (dx < -viewW * 0.3 || dx > viewW * 1.3) continue;
    var open = nestDragonOpen(d), mouth = open ? 0.75 + Math.sin(globalT * 3 + i) * 0.2 : 0;
    var squash = d.state === 'chomp' ? Math.sin(Math.min(1, d.t / 0.45) * Math.PI) * 0.16 : (d.state === 'full' ? Math.sin(d.t * 12) * 0.1 * Math.max(0, 1 - d.t) : 0);
    var bump = d.bumpT > 0 ? Math.sin(d.bumpT * 30) * s * 0.06 : 0;
    drawNestBowl(ctx, dx + bump, d.y, s, false);
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx - s * 3, d.y - s * 6, s * 6, s * 6 + s * 0.05);
    ctx.clip();
    drawBabyDragon(ctx, dx + bump, d.y + d.down, s, d.color, {
      mouth: d.state === 'chomp' ? Math.max(0, 0.9 - d.t * 2) : mouth,
      flap: Math.sin(globalT * 5 + i) * 0.3,
      look: -0.4, blink: d.blinkT < 0, squash: squash
    });
    ctx.restore();
    drawNestBowl(ctx, dx + bump, d.y, s, true);
    // Toivotut marjat pesän yllä
    for (j = 0; j < d.want; j++) {
      var bx = dx + (j - (d.want - 1) / 2) * s * 0.7, by = d.y - s * 3.35;
      if (j < d.fed) drawBerry(ctx, bx, by, s * 0.24, 0, false);
      else drawBerryOutline(ctx, bx, by, s * 0.24);
    }
  }

  // Emo kallion laella
  m = nestMotherPos();
  if (m.x - cx < viewW * 1.4) {
    var mo = nest.mother, ms = s * 1.9, mt = mo.t;
    drawBabyDragon(ctx, m.x - cx, m.y + s * 0.5, ms, '#e08aa8', {
      mouth: mo.awake ? 0.35 + Math.sin(mt * 4) * 0.15 : 0,
      flap: mo.awake ? Math.sin(mt * 6) * 0.6 : -0.6,
      look: -0.3, blink: mo.awake ? (mt % 3.5) < 0.12 : false, sleep: !mo.awake,
      squash: mo.awake ? Math.sin(mt * 8) * 0.06 * Math.max(0, 1.5 - mt) : Math.sin(globalT * 1.2) * 0.02
    });
    if (!mo.awake) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold ' + Math.round(ms * 0.5) + 'px ' + UI_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (j = 0; j < 3; j++) {
        var zt = (globalT * 0.6 + j * 0.33) % 1;
        ctx.globalAlpha = (1 - zt) * 0.9;
        ctx.fillText('Z', m.x - cx - ms * 0.9 - zt * ms * 0.5, m.y - ms * 1.6 - zt * ms * 0.9);
      }
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
    }
  }

  // Bonustähdet
  for (i = 0; i < nest.stars.length; i++) {
    st = nest.stars[i];
    if (st.collected) continue;
    drawStar(ctx, st.x - cx, st.y + Math.sin(st.tw) * s * 0.15, s * 0.45, st.tw * 0.3, 0.6);
  }

  // Tehtäväkaaret
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);

  // Prinsessa ja ritsa
  f = nestFork();
  var aiming = nest.aim.active && !nest.walking;
  v = aiming ? nestLaunchVel(nest.aim.dx, nest.aim.dy) : null;
  pouch = { x: f.x - cx + (v ? v.px : 0), y: f.y + (v ? v.py : 0) };
  var fShow = { x: f.x - cx, y: f.y };
  drawPrincessFree(ctx, princess.x - cx, princess.y, viewH / 560, 1, princess.walkPhase, nest.walking, globalT);
  if (!nest.walking) {
    drawSlingshot(ctx, fShow, s * 0.75, pouch);
    if (nest.reload <= 0) drawBerry(ctx, pouch.x, pouch.y - s * 0.05, s * 0.3, 0, true);
  }
  // Ennakkokaari vetäessä
  if (aiming && v && v.len > NEST_MIN_PULL * viewH && nest.reload <= 0) {
    pv = nestPreview(v.vx, v.vy);
    for (i = 0; i < pv.pts.length; i++) {
      a = Math.max(0.15, 0.85 - i * 0.02);
      ctx.fillStyle = pv.hit ? 'rgba(255,240,150,' + a + ')' : 'rgba(255,255,255,' + a * 0.8 + ')';
      ctx.beginPath(); ctx.arc(pv.pts[i].x - cx, pv.pts[i].y, Math.max(2, s * (0.12 - i * 0.0015)), 0, Math.PI * 2); ctx.fill();
    }
    if (pv.hit) {
      m = nestMouth(pv.hit);
      ctx.strokeStyle = 'rgba(255,240,150,' + (0.5 + Math.sin(globalT * 8) * 0.3) + ')';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.beginPath(); ctx.arc(m.x - cx, m.y, m.r * 1.1, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // Ohjevihje ennen ensimmäistä laukausta: käsi vetää taakse ja kaari kasvaa
  if (nest.shots === 0 && !aiming && !nest.walking && !celebrating) {
    var hp = nest.hintT % 3.2, hk, hx, hy, hv;
    if (hp > 0.6 && hp < 2.4) {
      hk = easeInOutSine(Math.min(1, (hp - 0.6) / 1.4));
      hx = f.x - hk * viewH * 0.105;
      hy = f.y + hk * viewH * 0.07;
      hv = nestLaunchVel(hx - f.x, hy - f.y);
      pv = nestPreview(hv.vx, hv.vy);
      ctx.globalAlpha = hp > 2.1 ? (2.4 - hp) / 0.3 : 1;
      for (i = 0; i < pv.pts.length; i += 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(pv.pts[i].x - cx, pv.pts[i].y, Math.max(2, s * 0.1), 0, Math.PI * 2); ctx.fill();
      }
      drawSlingshot(ctx, fShow, s * 0.75, { x: hx - cx, y: hy });
      drawBerry(ctx, hx - cx, hy - s * 0.05, s * 0.3, 0, true);
      drawHand(ctx, hx - cx + s * 0.3, hy + s * 0.6, viewH * 0.03);
      ctx.globalAlpha = 1;
    }
  }

  // Marjat lennossa jälkineen
  for (i = 0; i < nest.fruits.length; i++) {
    fr = nest.fruits[i];
    for (j = 0; j < fr.trail.length; j++) {
      ctx.fillStyle = 'rgba(255,200,120,' + (0.08 + j * 0.05) + ')';
      ctx.beginPath(); ctx.arc(fr.trail[j].x - cx, fr.trail[j].y, s * (0.08 + j * 0.02), 0, Math.PI * 2); ctx.fill();
    }
    drawBerry(ctx, fr.x - cx, fr.y, s * 0.3, fr.rot, true);
  }

  // Lentävät kylläiset poikaset
  for (i = 0; i < nest.dragons.length; i++) {
    d = nest.dragons[i];
    if (!d.fly) continue;
    drawBabyDragon(ctx, d.fx2 - cx, d.fy2 + Math.sin(globalT * 4 + i) * s * 0.2, s * 0.85, d.color, {
      mouth: 0, flap: Math.sin(globalT * 11 + i) * 0.9, look: 0.2, blink: d.blinkT < 0, noShadow: true
    });
  }

  // Harakka
  mp = nest.magpie;
  if (mp.state !== 'wait') drawMagpie(ctx, mp.x - cx, mp.y, s * 0.55, Math.sin(globalT * 14), mp.state === 'steal' ? -1 : 1, mp.state === 'steal');

  // Läiskeet ja sydämet
  for (i = 0; i < nest.splats.length; i++) {
    sp = nest.splats[i];
    k = sp.t / 0.7;
    ctx.fillStyle = 'rgba(255,110,70,' + (0.8 * (1 - k)) + ')';
    for (j = 0; j < 6; j++) {
      a = j * Math.PI / 3 + 0.4;
      ctx.beginPath();
      ctx.arc(sp.x - cx + Math.cos(a) * s * (0.2 + k * 1.1), sp.y + Math.sin(a) * s * (0.1 + k * 0.5) - k * s * 0.4 + k * k * s * 1.2, s * 0.14 * (1 - k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    artBlob(ctx, sp.x - cx, sp.y, s * (0.3 + k * 0.5), s * 0.1, '#ff6a4a', { line: false, alpha: 0.6 * (1 - k) });
  }
  for (i = 0; i < nest.hearts.length; i++) {
    hs = nest.hearts[i];
    if (hs.t < 0) continue;
    ctx.globalAlpha = Math.max(0, 1 - hs.t / 1.4);
    drawHeartShape(ctx, hs.x - cx + Math.sin(hs.t * 5) * s * 0.15, hs.y, s * 0.28 * (0.6 + Math.min(1, hs.t * 3) * 0.4), true);
    ctx.globalAlpha = 1;
  }
  drawParticlesLayer(ctx);
  endPlayWorld();

  // HUD: poikaset
  drawNestHud(ctx);
  drawTaskOverlay(ctx);
}

function drawNestHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, d, n = nest.dragons.length;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * n + pad, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    d = nest.dragons[i];
    c.globalAlpha = d.fed >= d.want ? 1 : 0.3;
    drawDragonHead(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 2.0, hs * 0.85, d.color);
    c.globalAlpha = 1;
  }
}

// Sokkelon ja karttojen kuvake sekä Lohikäärmelaakson maaston koristeet
HUB_ICONS.nest = function (c, x, y, s) {
  drawDragonHead(c, x, y + s * 0.02, s * 0.17, '#7fe0c8');
};
HUB_TILE_DECOR.dragon = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2;
  if (rnd < 0.3) drawNestFern(b, cx + (rnd2 - 0.5) * s * 0.4, y + s * 0.9, s * 0.3, Math.floor(rnd2 * 10));
  else if (rnd < 0.5) drawNestCrystal(b, cx + (rnd2 - 0.5) * s * 0.5, y + s * 0.88, s * 0.16);
  else if (rnd < 0.65) artBlob(b, cx + (rnd2 - 0.5) * s * 0.4, y + s * 0.7, s * 0.12, s * 0.15, '#f4e6d0', { shadeTo: '#c9a98a', lineColor: '#9a7a5a', hi: 0.4 });
  else if (rnd < 0.8) artBlob(b, cx + (rnd2 - 0.5) * s * 0.4, y + s * 0.78, s * 0.22, s * 0.12, '#b8563c', { shadeTo: '#7a3020', lineColor: '#5a2014', hi: 0.2 });
};
