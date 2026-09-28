'use strict';

// Hiekkapyörre (Kaukamaa, Aurinkodyynit): alueen vartija. Yhdistää alueen kaksi
// verbiä: LIUKU (Dyynilasku) ja ETSINTÄ (Aarrevarpu). Kiukkuinen pyörremyrsky
// hajotti karavaanin ja hautasi sen taikalampun. Joka kierroksessa:
//  1) Liuku: pyörre ajaa takaa dyyneillä. Pidä pohjassa alamäessä, päästä irti
//     ennen harjaa. Kiinni saanut pyörre ja kaktukset vievät sydämen.
//  2) Etsintä: keitaalla pyörre on haudannut lampun hiekkaan. Taikavarpu jättää
//     lämpöjäljen, paikallaan pito lähettää Fenni-ketun kaivamaan. Pyörre kerää
//     voimaa (rengas sen ympärillä): kun rengas täyttyy, se puhaltaa, vie sydämen
//     ja hautaa lampun uuteen paikkaan. Skorpionit pistävät. Löydetty lamppu
//     ampuu valonsäteen pyörteeseen: osuma!
// Kolme kierrosta: pidempi rata, nopeampi pyörre, enemmän kaktuksia ja
// skorpioneja, lyhyempi lämmön kantama ja lyhyempi puhallusväli. Kolmas osuma
// rauhoittaa pyörteen lempeäksi tuulihengeksi. Tehtävät osumien välissä.
// Liukuvaihe lainaa Dyynilaskun maaston, laudan ja kameran (dune-olio ja
// duneStep/duneY/drawDuneGround): vain yksi kenttä on kerrallaan käynnissä.

// hills: dyynejä, amp: korkeus × viewH, speed: pyörteen nopeus × viewW / s,
// cacti: kaktuksia, range: lämmön kantama × viewW, scorp: skorpioneja,
// charge: puhalluksen latausaika (s), gust: tuulenpuuskan väli (s, 0 = ei)
var WHIRL_ROUNDS = [
  { hills: 4, amp: [0.14, 0.2], speed: 0.42, cacti: 1, range: 0.5, scorp: 1, charge: 20, gust: 0 },
  { hills: 5, amp: [0.16, 0.24], speed: 0.48, cacti: 2, range: 0.42, scorp: 2, charge: 17, gust: 7 },
  { hills: 6, amp: [0.18, 0.27], speed: 0.55, cacti: 2, range: 0.36, scorp: 3, charge: 14, gust: 5 }
];
var WHIRL_HALF = [0.38, 0.56];  // dyynin puolikkaan leveys × viewW
var WHIRL_LAG = 0.85;           // pyörre pysyy enintään näin kaukana takana × viewW
var WHIRL_CATCH = 0.1;          // kiinni, kun väli on alle tämän × viewW
var WHIRL_FADE = 0.6;           // vaiheiden välinen häivytys (s)

var whirl = {
  round: 0, hits: 0, phase: 'ride', state: 'rest', t: 0, fade: 0, fadeTo: null,
  arenaX: 0, wx: 0, cacti: [], restT: 0, heldOnce: false,
  lamp: null, scorps: [], trail: [], holes: [], rod: { x: 0, y: 0, on: false, heat: 0, danger: 0 },
  stillT: 0, stillX: 0, stillY: 0, armed: true, fox: null, charge: 0, gustT: 0, gust: 0, blowT: 0,
  tickT: 0, dug: false, beamT: 0, hurtW: 0, wig: 0, calmT: 0, taskDelay: -1, gen: 0
};

// ---------- Liukuvaihe: rata ----------
function whirlBuild() {
  var W = viewW, h = viewH, R = WHIRL_ROUNDS[whirl.round], pts = [], x, k, base = h * DUNE_BASE, yP = h * DUNE_PLATEAU, amp, big = false;
  pts.push({ x: -W * 1.5, y: yP });
  x = W * 0.55;
  pts.push({ x: x, y: yP });
  for (k = 0; k < R.hills; k++) {
    big = Math.random() < 0.55 ? !big : big;
    amp = duneRand(R.amp) * h * (big ? 1 : 0.75);
    x += duneRand(WHIRL_HALF) * W;
    pts.push({ x: x, y: base - Math.random() * h * 0.03, valley: true });
    x += duneRand(WHIRL_HALF) * W * (big ? 1 : 0.85);
    pts.push({ x: x, y: base - amp, peak: true });
  }
  x += duneRand(WHIRL_HALF) * W;
  pts.push({ x: x, y: base - Math.random() * h * 0.03, valley: true });
  x += W * 0.6;
  pts.push({ x: x, y: yP });
  whirl.arenaX = x;
  pts.push({ x: x + W * 3, y: yP });
  dune.pts = pts;
  whirlSeedCacti(R);
}
// Kaktukset kohtiin, joiden yli hyvä lasku lentää reilusti (kuten Dyynilaskussa)
function whirlSeedCacti(R) {
  var W = viewW, h = viewH, p = { x: W * 0.3, y: 0, vx: 0.35 * W, vy: 0, ground: true }, dt = 1 / 120, n, ev, cur = null, flights = [], i, f;
  p.y = duneY(p.x);
  for (n = 0; n < 60 * 120 && p.x < whirl.arenaX; n++) {
    ev = duneStep(p, duneBotHold(p), dt);
    if (ev && ev.launch) cur = { pts: [] };
    if (!p.ground && cur) cur.pts.push({ x: p.x, y: p.y, gy: duneY(p.x) });
    if (ev && ev.land && cur) { if (cur.pts.length > 20) flights.push(cur); cur = null; }
  }
  for (i = flights.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), tmp = flights[i]; flights[i] = flights[k]; flights[k] = tmp; }
  whirl.cacti = [];
  for (i = 0; i < flights.length && whirl.cacti.length < R.cacti; i++) {
    f = flights[i];
    var mid = f.pts[Math.floor(f.pts.length * 0.45)];
    if (!mid || mid.gy - mid.y < h * 0.12) continue;
    if (whirl.cacti.some(function (c) { return Math.abs(c.x - mid.x) < W * 0.6; })) continue;
    whirl.cacti.push({ x: mid.x, hit: 0 });
  }
}
function whirlRideStart() {
  var p = dune.p;
  whirlBuild();
  whirl.phase = 'ride';
  whirl.state = 'rest';
  whirl.t = 0;
  whirl.restT = 0;
  p.x = viewW * 0.3; p.y = duneY(p.x); p.vx = 0; p.vy = 0; p.ground = true; p.ang = 0;
  dune.cam = p.x - viewW * 0.3;
  dune.trail = [];
  whirl.wx = p.x - viewW * 1.1;
}

// ---------- Etsintävaihe ----------
function whirlArea() {
  return { x0: viewW * 0.2, x1: viewW * 0.95, y0: viewH * 0.34, y1: viewH * 0.93 };
}
function whirlPos(pad) {
  var A = whirlArea();
  return { x: A.x0 + pad + Math.random() * (A.x1 - A.x0 - pad * 2), y: A.y0 + pad + Math.random() * (A.y1 - A.y0 - pad * 2) };
}
function whirlBury() {
  var R = WHIRL_ROUNDS[whirl.round], h = viewH, A = whirlArea(), i, p, tries, lamp;
  lamp = whirlPos(h * 0.09);
  // Ei edellisen lampun paikalle
  if (whirl.lamp) {
    for (tries = 0; tries < 30 && Math.hypot(lamp.x - whirl.lamp.x, lamp.y - whirl.lamp.y) < viewW * 0.25; tries++) lamp = whirlPos(h * 0.09);
  }
  whirl.lamp = { x: lamp.x, y: lamp.y, found: false, t: 0 };
  whirl.scorps = [];
  for (i = 0; i < R.scorp; i++) {
    tries = 0;
    do {
      // Ensimmäinen skorpioni lampun lähelle, muut minne tahansa
      if (i === 0) {
        var ang = Math.random() * Math.PI * 2, d = h * (0.2 + Math.random() * 0.1);
        p = { x: lamp.x + Math.cos(ang) * d, y: lamp.y + Math.sin(ang) * d * 0.8 };
      } else p = whirlPos(h * 0.06);
      tries++;
    } while (tries < 60 && (p.x < A.x0 + h * 0.05 || p.x > A.x1 - h * 0.05 || p.y < A.y0 + h * 0.05 || p.y > A.y1 - h * 0.05 ||
      Math.hypot(p.x - lamp.x, p.y - lamp.y) < h * 0.18 || whirl.scorps.some(function (s) { return Math.hypot(s.x - p.x, s.y - p.y) < h * 0.2; })));
    whirl.scorps.push({ x: p.x, y: p.y, gone: false, out: 0 });
  }
  whirl.trail = [];
  whirl.holes = [];
  whirl.charge = 0;
  whirl.gustT = R.gust || 0;
  whirl.gust = 0;
  whirl.armed = true;
  whirl.stillT = 0;
  whirl.gen++;
}
function whirlDigStart() {
  whirl.phase = 'dig';
  whirl.state = 'dig';
  whirl.t = 0;
  whirl.lamp = null;
  whirl.fox = { x: viewW * 0.12, y: viewH * 0.9, tx: 0, ty: 0, state: 'sit', t: 0, facing: 1, target: null };
  whirlBury();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}
function whirlHeat(x, y) {
  var L = whirl.lamp, d;
  if (!L || L.found) return 0;
  d = Math.hypot(x - L.x, y - L.y);
  if (d < DOWSE_HIT * viewH) return 1;
  return Math.max(0, 1 - d / (WHIRL_ROUNDS[whirl.round].range * viewW)) * 0.95;
}
function whirlDanger(x, y) {
  var i, s, best = 0;
  for (i = 0; i < whirl.scorps.length; i++) {
    s = whirl.scorps[i];
    if (s.gone) continue;
    best = Math.max(best, Math.max(0, 1 - Math.hypot(x - s.x, y - s.y) / (DOWSE_SENSE * viewH)));
  }
  return best;
}
// Pyörteen paikka etsintävaiheessa: leijuu taivaanrannassa ja keinuu
function whirlSkyPos() {
  var k = whirl.hurtW > 0 ? Math.sin(globalT * 40) * viewH * 0.01 : 0;
  return { x: viewW * (0.58 + Math.sin(globalT * 0.5) * 0.18) + k, y: viewH * 0.2 };
}

// ---------- Alustus ----------
function initWhirl() {
  var i;
  tasks = [makeTask(-5, 'sort'), makeTask(-5, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  whirl.round = 0;
  whirl.hits = 0;
  whirl.fade = 0;
  whirl.fadeTo = null;
  whirl.heldOnce = false;
  whirl.dug = false;
  whirl.beamT = 0;
  whirl.hurtW = 0;
  whirl.calmT = 0;
  whirl.taskDelay = -1;
  whirl.lamp = null;
  whirl.fox = null;
  whirlRideStart();
  renderBackground();
}
function respawnWhirl() {
  // Sydämet loppu: vaihe alkaa alusta (liuku radan alusta, etsintä uudella lampulla)
  if (whirl.phase === 'ride') whirlRideStart();
  else whirlBury();
}
function resizeWhirl() {
  camX = 0;
  if (whirl.phase === 'ride') whirlRideStart();
}
function handleWhirlTap(px, py) {
  var f = whirl.fox, sp;
  if (whirl.phase === 'ride') {
    if (whirl.state === 'rest' && !puzzleBusy() && whirl.taskDelay <= 0 && whirl.restT > 0.4 && !whirl.fadeTo) whirlGo();
    return;
  }
  whirl.armed = true;
  whirl.stillT = 0;
  whirl.stillX = px; whirl.stillY = py;
  if (f && f.state === 'sit' && Math.hypot(px - f.x, py - (f.y - viewH * 0.04)) < viewH * 0.07) {
    f.state = 'hop'; f.t = 0;
    playNote(988, 0, 0.08, 'sine', 0.25);
  }
  sp = whirlSkyPos();
  if (Math.hypot(px - sp.x, py - sp.y) < viewH * 0.12) {
    // Pyörre murisee napautuksesta
    whirl.wig = 0.5;
    playNote(130, 0, 0.2, 'sawtooth', 0.1);
    playNote(110, 0.1, 0.2, 'sawtooth', 0.08);
  }
}
function whirlGo() {
  var p = dune.p;
  whirl.state = 'ride';
  whirl.t = 0;
  p.vx = 0.35 * viewW;
  whirl.wx = p.x - viewW * WHIRL_LAG;
  playNote(523, 0, 0.1, 'triangle', 0.3);
  playNote(784, 0.08, 0.16, 'triangle', 0.3);
}

// ---------- Päivitys ----------
function updateWhirl(dt) {
  var busy;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  if (whirl.hurtW > 0) whirl.hurtW -= dt;
  if (whirl.wig > 0) whirl.wig -= dt;
  if (whirl.blowT > 0) whirl.blowT -= dt;
  for (var i = 0; i < whirl.cacti.length; i++) if (whirl.cacti[i].hit > 0) whirl.cacti[i].hit -= dt;
  for (i = 0; i < whirl.scorps.length; i++) if (whirl.scorps[i].out > 0) whirl.scorps[i].out -= dt;
  busy = puzzleBusy();
  if (whirl.taskDelay > 0 && !busy) {
    whirl.taskDelay -= dt;
    if (whirl.taskDelay <= 0) {
      if (whirl.hits === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (whirl.hits === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Häivytys vaiheesta toiseen
  if (whirl.fadeTo) {
    whirl.fade += dt / WHIRL_FADE;
    if (whirl.fade >= 1 && busy === false && whirl.taskDelay <= 0) {
      var to = whirl.fadeTo;
      whirl.fadeTo = null;
      if (to === 'dig') whirlDigStart(); else whirlRideStart();
    }
    return;
  }
  if (whirl.fade > 0) whirl.fade = Math.max(0, whirl.fade - dt / WHIRL_FADE);
  if (busy || celebrating) { whirl.rod.on = false; return; }
  whirl.t += dt;
  if (whirl.phase === 'ride') whirlUpdateRide(dt);
  else whirlUpdateDig(dt);
}

function whirlUpdateRide(dt) {
  var p = dune.p, W = viewW, h = viewH, R = WHIRL_ROUNDS[whirl.round], n, ev, i;
  if (whirl.state === 'rest') {
    whirl.restT += dt;
    return;
  }
  if (whirl.state === 'arrive') {
    var rest = whirl.arenaX + W * 0.45;
    p.x += (rest - p.x) * Math.min(1, dt * 3);
    p.y = duneY(p.x);
    p.ang += (0 - p.ang) * Math.min(1, dt * 6);
    dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 3);
    whirl.wx += (p.x - W * 0.7 - whirl.wx) * Math.min(1, dt * 1.5);
    if (whirl.t > 1.2) { whirl.fadeTo = 'dig'; whirl.fade = 0; }
    return;
  }
  if (holding) whirl.heldOnce = true;
  for (n = 0; n < 4; n++) {
    ev = duneStep(p, holding, dt / 4);
    if (ev && ev.land) duneLanded(ev);
    if (ev && ev.launch) playNote(660, 0, 0.12, 'sine', 0.18);
  }
  var ta = p.ground ? Math.atan(duneSlope(p.x)) : Math.atan2(p.vy, p.vx);
  p.ang += (ta - p.ang) * Math.min(1, dt * (p.ground ? 14 : 5));
  dune.cam += (p.x - W * (0.3 - Math.min(0.08, p.vx / W * 0.05)) - dune.cam) * Math.min(1, dt * 5);
  if (p.ground && p.vx > W * 0.6 && Math.random() < dt * 25) spawnDust(p.x, p.y, 1, 1);
  dune.trail.push({ x: p.x, y: p.y, t: globalT, fast: p.vx > W * 0.95 });
  while (dune.trail.length && globalT - dune.trail[0].t > 0.35) dune.trail.shift();
  // Kaktukset
  for (i = 0; i < whirl.cacti.length; i++) {
    var ca = whirl.cacti[i];
    if (Math.abs(ca.x - p.x) < h * 0.05 && p.y > duneY(ca.x) - h * 0.09 && ca.hit <= 0 && hurtT <= 0) {
      ca.hit = 0.6;
      artShakeStart(h * 0.012, 0.3);
      spawnSparkles(p.x, p.y - h * 0.05, 10, '#7ac25a');
      p.vx *= 0.6;
      loseHeart();
      if (whirl.phase !== 'ride' || whirl.state !== 'ride') return;
    }
  }
  // Pyörre ajaa takaa
  whirl.wx += R.speed * W * dt;
  whirl.wx = Math.max(whirl.wx, p.x - W * WHIRL_LAG);
  if (p.x - whirl.wx < W * WHIRL_CATCH && hurtT <= 0) {
    artShakeStart(h * 0.015, 0.4);
    playNote(140, 0, 0.3, 'sawtooth', 0.12);
    p.vx = Math.max(p.vx, W * 0.6);
    if (p.ground) { p.ground = false; p.vy = -h * 0.5; }
    whirl.wx = p.x - W * 0.5;
    loseHeart();
    if (whirl.phase !== 'ride' || whirl.state !== 'ride') return;
  }
  if (p.x >= whirl.arenaX + W * 0.05 && p.ground) {
    whirl.state = 'arrive';
    whirl.t = 0;
    hearts = HEART_MAX;
    spawnSparkles(p.x, p.y - h * 0.15, 14, '#7fd4ff');
    playNote(659, 0, 0.18, 'triangle', 0.35);
    playNote(988, 0.1, 0.3, 'triangle', 0.35);
  }
}

function whirlUpdateDig(dt) {
  var R = WHIRL_ROUNDS[whirl.round], A = whirlArea(), h = viewH, W = viewW, rod = whirl.rod, f = whirl.fox, i;
  whirlUpdateFox(dt);
  if (whirl.state === 'hit') {
    whirl.lamp.t += dt;
    if (whirl.lamp.t > 0.6 && whirl.beamT === 0) {
      // Lamppu ampuu valonsäteen pyörteeseen
      whirl.beamT = 1.2;
      whirl.hurtW = 1.2;
      whirl.hits++;
      var sp = whirlSkyPos();
      artPop(sp.x, sp.y, h * 0.15, '#fff2a0', 'ring');
      spawnSparkles(sp.x, sp.y, 26, '#fff2a0');
      artShakeStart(h * 0.012, 0.4);
      playNote(1047, 0, 0.12, 'triangle', 0.35);
      playNote(1319, 0.1, 0.15, 'triangle', 0.35);
      playNote(1760, 0.22, 0.3, 'triangle', 0.35);
      playNote(160, 0.1, 0.4, 'sawtooth', 0.1);
    }
    if (whirl.beamT > 0) whirl.beamT = Math.max(1e-6, whirl.beamT - dt);
    if (whirl.lamp.t > 2.4) {
      if (whirl.hits >= WHIRL_ROUNDS.length) {
        whirl.state = 'won';
        whirl.t = 0;
        soundFanfare();
      } else {
        whirl.round++;
        whirl.beamT = 0;
        if (whirl.hits === 1 || whirl.hits === 2) whirl.taskDelay = 0.4;
        whirl.fadeTo = 'ride';
        whirl.fade = 0;
      }
    }
    return;
  }
  if (whirl.state === 'won') {
    whirl.calmT += dt;
    if (whirl.calmT > 2.6 && !celebrating) startCelebration();
    return;
  }
  // Pyörre kerää voimaa ja puhaltaa
  whirl.charge += dt / R.charge;
  if (whirl.charge >= 1) {
    whirl.blowT = 1.0;
    artShakeStart(h * 0.015, 0.5);
    playNote(180, 0, 0.5, 'sawtooth', 0.12);
    playNote(120, 0.2, 0.5, 'sawtooth', 0.1);
    spawnDust(whirl.lamp.x, whirl.lamp.y, 12, 1);
    var gen = whirl.gen;
    loseHeart();
    // Sydämet loppuivat -> respawn hautasi jo uuden lampun
    if (whirl.gen === gen) whirlBury();
    return;
  }
  if (R.gust) {
    whirl.gustT -= dt;
    if (whirl.gustT <= 0) { whirl.gustT = R.gust * (0.8 + Math.random() * 0.4); whirl.gust = 1.2; playNote(200, 0, 0.5, 'sine', 0.08); }
  }
  if (whirl.gust > 0) {
    whirl.gust -= dt;
    for (i = 0; i < whirl.trail.length; i++) { whirl.trail[i].x += W * 0.02 * dt; whirl.trail[i].t -= dt * 4; }
  }
  for (i = whirl.trail.length - 1; i >= 0; i--) if (globalT - whirl.trail[i].t > DOWSE_TRAIL_LIFE) whirl.trail.splice(i, 1);

  rod.on = holding && lastPX > A.x0 - h * 0.05 && lastPX < A.x1 + h * 0.05 && lastPY > A.y0 - h * 0.05 && lastPY < A.y1 + h * 0.05;
  if (rod.on) {
    rod.x = Math.max(A.x0, Math.min(A.x1, lastPX));
    rod.y = Math.max(A.y0, Math.min(A.y1, lastPY));
    rod.heat = whirlHeat(rod.x, rod.y);
    rod.danger = whirlDanger(rod.x, rod.y);
    var last = whirl.trail[whirl.trail.length - 1];
    if (!last || Math.hypot(last.x - rod.x, last.y - rod.y) > h * 0.022) {
      whirl.trail.push({ x: rod.x, y: rod.y, heat: rod.heat, danger: rod.danger, t: globalT });
      if (whirl.trail.length > 400) whirl.trail.shift();
    }
    whirl.tickT -= dt;
    if (whirl.tickT <= 0) {
      whirl.tickT = 0.55 - rod.heat * 0.45;
      playNote(440 + rod.heat * 660, 0, 0.05, 'sine', 0.12 + rod.heat * 0.1);
      if (rod.danger > 0.3) playNote(150, 0, 0.08, 'sawtooth', 0.05 + rod.danger * 0.06);
    }
    if (Math.hypot(lastPX - whirl.stillX, lastPY - whirl.stillY) > h * 0.03) {
      whirl.stillX = lastPX; whirl.stillY = lastPY; whirl.stillT = 0; whirl.armed = true;
    } else if (whirl.armed && f.state !== 'run' && f.state !== 'dig') {
      whirl.stillT += dt;
      if (whirl.stillT >= DOWSE_STILL) {
        f.target = { x: rod.x, y: rod.y };
        f.tx = rod.x - h * 0.05; f.ty = rod.y + h * 0.02;
        f.facing = f.tx >= f.x ? 1 : -1;
        f.state = 'run'; f.t = 0;
        whirl.armed = false;
        whirl.dug = true;
        playNote(740, 0, 0.06, 'sine', 0.2);
      }
    }
  } else {
    whirl.stillT = 0;
  }
}

function whirlUpdateFox(dt) {
  var f = whirl.fox, dx, dy, d, sp = viewW * 1.1;
  if (!f) return;
  f.t += dt;
  if (f.state === 'run') {
    dx = f.tx - f.x; dy = f.ty - f.y; d = Math.hypot(dx, dy);
    if (d < sp * dt) { f.x = f.tx; f.y = f.ty; f.state = 'dig'; f.t = 0; }
    else { f.x += dx / d * sp * dt; f.y += dy / d * sp * dt; }
  } else if (f.state === 'dig') {
    if (Math.random() < dt * 20) spawnDust(f.target.x, f.target.y, 1, f.facing);
    if (f.t >= DOWSE_DIG_T) {
      f.state = 'sit'; f.t = 0;
      if (whirl.phase === 'dig' && whirl.state === 'dig') whirlResolveDig(f.target.x, f.target.y);
    }
  } else if (f.state === 'hop') {
    if (f.t > 0.5) { f.state = 'sit'; f.t = 0; }
  }
}

function whirlResolveDig(x, y) {
  var h = viewH, i, s, gen = whirl.gen, L = whirl.lamp;
  for (i = 0; i < whirl.scorps.length; i++) {
    s = whirl.scorps[i];
    if (s.gone) continue;
    if (Math.hypot(x - s.x, y - s.y) < DOWSE_SCORP_R * h) {
      s.gone = true;
      s.out = 1.2;
      artShakeStart(h * 0.01, 0.3);
      spawnSparkles(s.x, s.y, 10, '#c0402a');
      playNote(220, 0, 0.15, 'sawtooth', 0.15);
      loseHeart();
      if (whirl.gen !== gen) return;
    }
  }
  if (Math.hypot(x - L.x, y - L.y) < DOWSE_HIT * h) {
    L.found = true;
    L.t = 0;
    whirl.state = 'hit';
    whirl.beamT = 0;
    whirl.rod.on = false;
    artPop(L.x, L.y, h * 0.08, '#ffd24f', 'burst');
    spawnSparkles(L.x, L.y - h * 0.04, 22, '#ffd24f');
    playNote(784, 0, 0.1, 'triangle', 0.35);
    playNote(1047, 0.1, 0.12, 'triangle', 0.35);
  } else {
    whirl.holes.push({ x: x, y: y, heat: whirlHeat(x, y) });
    spawnDust(x, y, 8, 0);
    playNote(262, 0, 0.12, 'triangle', 0.22);
  }
}

// ---------- Piirto ----------
function renderWhirlBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#e89a5a');
  g.addColorStop(0.45, '#f5c890');
  g.addColorStop(1, '#ffe2b0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.85, h * 0.14, h * 0.07, 0.1, '#ffd0a0', '#fff4e0', '#ff9a50');
  b.fillStyle = artMix('#c07048', '#f5c890', 0.5);
  for (i = 0; i < 3; i++) {
    x = vw * (0.15 + i * 0.33);
    b.beginPath();
    b.moveTo(x - h * 0.2, h * 0.62); b.lineTo(x - h * 0.12, h * 0.49); b.lineTo(x + h * 0.09, h * 0.49); b.lineTo(x + h * 0.17, h * 0.62);
    b.closePath(); b.fill();
  }
}

// Pyörremyrsky: kiertyvä suppilo, kasvot ja lentävää roinaa. calm 0..1 muuttaa sen tuulihengeksi.
function drawWhirlSpirit(c, x, y, s, calm, charge) {
  var i, rows = 7, t = globalT * (6 - calm * 4), wig = whirl.wig > 0 ? Math.sin(globalT * 40) * s * 0.05 : 0;
  var col = artMix('#c89060', '#bfe8ff', calm), dark = artMix('#8a5a30', '#6aa8d8', calm);
  x += wig;
  if (charge > 0 && calm < 0.5) artGlow(c, x, y, s * (1.3 + charge * 0.8), '#ff8a40', 0.2 + charge * 0.35);
  for (i = rows - 1; i >= 0; i--) {
    var k = i / (rows - 1), ry = y - s * 0.9 + k * s * 1.8, rx = s * (1.0 - k * 0.72);
    var sway = Math.sin(t * 0.7 + k * 3) * s * 0.12 * k;
    artBlob(c, x + sway, ry, rx, s * 0.16, i % 2 ? col : artShade(col, 0.08), { lineColor: dark });
    // Kiertyvät raidat
    c.strokeStyle = artRGBA('#ffffff', 0.35 + calm * 0.2);
    c.lineWidth = Math.max(1.5, s * 0.025);
    c.beginPath(); c.ellipse(x + sway, ry, rx * 0.8, s * 0.09, 0, t + i, t + i + 2.2); c.stroke();
  }
  // Roina kiertää
  if (calm < 0.6) {
    for (i = 0; i < 4; i++) {
      var a = t * 0.8 + i * Math.PI / 2, ox = Math.cos(a) * s * 1.15, oy = Math.sin(a) * s * 0.25 - s * 0.3 + i * s * 0.2;
      c.globalAlpha = 1 - calm;
      if (i % 2) artCircle(c, x + ox, y + oy, s * 0.07, '#8a6a4a', { line: false });
      else artBlob(c, x + ox, y + oy, s * 0.1, s * 0.04, '#6aa84a', { line: false, rot: a });
      c.globalAlpha = 1;
    }
  }
  // Kasvot
  var fy = y - s * 0.5, hurt = whirl.hurtW > 0;
  artEye(c, x - s * 0.25, fy, s * 0.12, 0, hurt || Math.sin(globalT * 1.3) > 0.97);
  artEye(c, x + s * 0.25, fy, s * 0.12, 0, hurt || Math.sin(globalT * 1.3) > 0.97);
  c.strokeStyle = '#4a2a18';
  c.lineWidth = Math.max(2, s * 0.05);
  c.lineCap = 'round';
  if (calm < 0.5) {
    // Kiukkuiset kulmat ja suu
    c.beginPath(); c.moveTo(x - s * 0.4, fy - s * 0.22); c.lineTo(x - s * 0.12, fy - s * 0.14); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.4, fy - s * 0.22); c.lineTo(x + s * 0.12, fy - s * 0.14); c.stroke();
    c.beginPath(); c.arc(x, fy + s * 0.32, s * 0.14, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  } else {
    c.beginPath(); c.arc(x, fy + s * 0.12, s * 0.16, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    artBlush(c, x - s * 0.38, fy + s * 0.12, s * 0.08);
    artBlush(c, x + s * 0.38, fy + s * 0.12, s * 0.08);
  }
  // Latausrengas
  if (charge > 0 && calm < 0.5) {
    c.strokeStyle = charge > 0.75 ? 'rgba(255,90,60,0.95)' : 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(3, s * 0.06);
    c.beginPath(); c.arc(x, y, s * 1.25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge); c.stroke();
  }
}

// Taikalamppu (karavaanin aarre)
function drawWhirlLamp(c, x, y, s, glow) {
  if (glow > 0) artGlow(c, x, y - s * 0.3, s * (1.2 + glow), '#fff2a0', 0.4 + glow * 0.3);
  artShadow(c, x, y + s * 0.3, s * 0.7, s * 0.14);
  artRoundRect(c, x - s * 0.25, y + s * 0.1, s * 0.5, s * 0.14, s * 0.06, '#e0a020', { lineColor: '#8a5a10' });
  c.beginPath();
  c.moveTo(x - s * 0.55, y); c.quadraticCurveTo(x, y + s * 0.3, x + s * 0.55, y);
  c.quadraticCurveTo(x + s * 0.3, y - s * 0.3, x, y - s * 0.3); c.quadraticCurveTo(x - s * 0.3, y - s * 0.3, x - s * 0.55, y); c.closePath();
  artFillPath(c, '#ffc83a', y - s * 0.3, y + s * 0.2, s * 0.5, { lineColor: '#8a5a10' });
  // Nokka ja kahva
  c.strokeStyle = '#c08a10';
  c.lineWidth = Math.max(2, s * 0.1);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + s * 0.45, y - s * 0.02); c.quadraticCurveTo(x + s * 0.8, y - s * 0.05, x + s * 0.95, y - s * 0.3); c.stroke();
  c.beginPath(); c.arc(x - s * 0.6, y - s * 0.02, s * 0.18, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
  artCircle(c, x, y - s * 0.36, s * 0.1, '#ff7bac', { lineColor: '#b83a6a' });
}

function drawWhirlRide(c) {
  var W = viewW, h = viewH, p = dune.p, i;
  drawDuneFar(c, 0.15, 0.7, 0.08, artMix('#e0a070', '#f5c890', 0.45), 1.3);
  drawDuneFar(c, 0.35, 0.76, 0.09, artMix('#f3c074', '#ffe2b0', 0.25), 0.9);
  c.save();
  c.translate(-dune.cam, 0);
  // Keidas radan päässä
  var ax = whirl.arenaX, yP = h * DUNE_PLATEAU;
  if (ax < dune.cam + W * 1.6) {
    drawPalm(c, ax + W * 0.25, yP + h * 0.01, h * 0.26);
    drawPalm(c, ax + W * 0.8, yP + h * 0.01, h * 0.3);
  }
  drawDuneGround(c);
  if (ax < dune.cam + W * 1.6) artBlob(c, ax + W * 0.6, yP + h * 0.04, h * 0.2, h * 0.03, '#4fc3e0', { lineColor: '#2a8ab0', hi: 0.4 });
  for (i = 0; i < whirl.cacti.length; i++) {
    var ca = whirl.cacti[i];
    if (ca.x < dune.cam - W * 0.1 || ca.x > dune.cam + W * 1.1) continue;
    duneDrawCactus(c, ca.x, duneY(ca.x) + h * 0.01, h * 0.1, ca.hit);
  }
  if (dune.trail.length > 1) {
    c.lineCap = 'round';
    for (i = 1; i < dune.trail.length; i++) {
      var a = 1 - (globalT - dune.trail[i].t) / 0.35;
      c.strokeStyle = dune.trail[i].fast ? 'rgba(255,230,120,' + (a * 0.8) + ')' : 'rgba(255,255,255,' + (a * 0.45) + ')';
      c.lineWidth = h * 0.012 * a;
      c.beginPath(); c.moveTo(dune.trail[i - 1].x, dune.trail[i - 1].y - h * 0.01); c.lineTo(dune.trail[i].x, dune.trail[i].y - h * 0.01); c.stroke();
    }
  }
  if (!(hurtT > 0 && Math.sin(globalT * 30) > 0)) duneDrawRider(c, p.x, p.y, p.ang, holding && whirl.state === 'ride');
  // Pyörre takana: iso suppilo, joka näkyy kun se on lähellä
  var wy = Math.min(h * 0.62, duneY(Math.max(whirl.wx, dune.pts[0].x)) - h * 0.28);
  drawWhirlSpirit(c, whirl.wx, wy, h * 0.24, 0, 0);
  c.restore();
  // Hiekkapöly pyörteen edessä ruudun reunalla
  var sx = whirl.wx - dune.cam;
  if (sx > -W * 0.3) {
    var g = c.createLinearGradient(sx - W * 0.25, 0, sx + W * 0.1, 0);
    g.addColorStop(0, 'rgba(190,130,80,0.55)');
    g.addColorStop(1, 'rgba(220,170,110,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, Math.max(0, sx + W * 0.1), h);
  }
  if (whirl.state === 'rest' && whirl.restT > 0.8 && !puzzleBusy() && whirl.taskDelay <= 0) {
    var k = (globalT % 1.2) / 1.2;
    drawHand(c, W * 0.62, h * 0.4 + Math.abs(Math.sin(k * Math.PI)) * h * 0.05, h * 0.045);
  }
}

function drawWhirlDig(c) {
  var W = viewW, h = viewH, A = whirlArea(), i, p, a, sp = whirlSkyPos(), L = whirl.lamp;
  // Kaivualue
  var g = c.createLinearGradient(0, A.y0, 0, A.y1);
  g.addColorStop(0, '#f7d696');
  g.addColorStop(1, '#eab86a');
  c.fillStyle = g;
  roundRect(c, A.x0 - h * 0.03, A.y0 - h * 0.02, A.x1 - A.x0 + h * 0.06, A.y1 - A.y0 + h * 0.04, h * 0.06);
  c.fill();
  c.strokeStyle = 'rgba(160,100,40,0.35)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.setLineDash([h * 0.02, h * 0.015]);
  c.stroke();
  c.setLineDash([]);
  drawPalm(c, W * 0.06, h * 0.62, h * 0.28);
  for (i = 0; i < whirl.holes.length; i++) {
    p = whirl.holes[i];
    artBlob(c, p.x, p.y, h * 0.045, h * 0.02, '#b07838', { lineColor: '#8a5a28' });
    artGlow(c, p.x, p.y, h * 0.05, dowseHeatColor(p.heat), 0.55);
  }
  for (i = 0; i < whirl.trail.length; i++) {
    p = whirl.trail[i];
    a = Math.max(0, 1 - (globalT - p.t) / DOWSE_TRAIL_LIFE);
    if (a <= 0) continue;
    if (p.heat >= 1) { c.globalAlpha = 0.4 + a * 0.6; drawStar(c, p.x, p.y, h * 0.02, globalT * 2 + i, 0.8); c.globalAlpha = 1; continue; }
    artCircle(c, p.x, p.y, h * 0.011, dowseHeatColor(p.heat), { line: false, alpha: 0.35 + a * 0.55 });
    if (p.danger > 0.3) {
      c.strokeStyle = 'rgba(255,60,40,' + (a * p.danger * 0.8) + ')';
      c.lineWidth = Math.max(1.5, h * 0.004);
      c.beginPath(); c.arc(p.x, p.y, h * 0.018, 0, Math.PI * 2); c.stroke();
    }
  }
  for (i = 0; i < whirl.scorps.length; i++) {
    var s = whirl.scorps[i];
    if (s.out > 0) { c.globalAlpha = Math.min(1, s.out / 0.3); drawDowseScorp(c, s.x + (1.2 - s.out) * W * 0.1, s.y, h * 0.06, globalT); c.globalAlpha = 1; }
  }
  drawPrincessFree(c, W * 0.1, h * 0.8, h / 500, 1, 0, false, globalT);
  // Lamppu nousee ja ampuu säteen
  var calm = whirl.state === 'won' ? Math.min(1, whirl.calmT / 1.5) : 0;
  if (L && L.found) {
    var rise = easeOutBack(Math.min(1, L.t / 0.6));
    var lx = L.x, ly = L.y - rise * h * 0.08;
    if (whirl.beamT > 0 || whirl.state === 'won') {
      c.strokeStyle = 'rgba(255,245,180,0.5)';
      c.lineWidth = h * 0.05;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(lx + h * 0.06, ly - h * 0.03); c.lineTo(sp.x, sp.y); c.stroke();
      c.strokeStyle = '#fffbe0';
      c.lineWidth = h * 0.015;
      c.stroke();
    }
    drawWhirlLamp(c, lx, ly, h * 0.07, rise);
  }
  drawWhirlSpirit(c, sp.x, sp.y, h * 0.13 * (1 - whirl.hits * 0.12), calm, whirl.state === 'dig' ? whirl.charge : 0);
  drawDowseFox(c, whirl.fox);
  if (whirl.state === 'dig' && whirl.rod.on) drawDowseRod(c, whirl.rod, whirl.armed ? whirl.stillT : 0);
  if (whirl.gust > 0 || whirl.blowT > 0) {
    var ga = Math.min(0.6, Math.max(whirl.gust, whirl.blowT));
    c.strokeStyle = 'rgba(255,255,255,' + ga + ')';
    c.lineWidth = Math.max(2, h * 0.006);
    c.lineCap = 'round';
    for (i = 0; i < 6; i++) {
      var gy = h * (0.38 + i * 0.1), gx = ((globalT * W * 0.8 + i * W * 0.37) % (W * 1.3)) - W * 0.15;
      c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + W * 0.06, gy - h * 0.02, gx + W * 0.12, gy); c.stroke();
    }
  }
  if (whirl.blowT > 0) {
    c.fillStyle = 'rgba(230,180,110,' + (whirl.blowT * 0.5) + ')';
    c.fillRect(0, 0, W, h);
  }
  if (!whirl.dug && whirl.state === 'dig' && whirl.t > 1.2 && !holding) {
    var k = (whirl.t % 2.4) / 2.4;
    drawHand(c, W * (0.35 + Math.min(1, k * 1.6) * 0.3), h * 0.6, h * 0.045);
  }
  // Rauhoittunut tuulihenki ja karavaani
  if (whirl.state === 'won') {
    c.globalAlpha = calm;
    duneDrawCamel(c, W * 0.8, h * 0.9, h * 0.0022);
    c.globalAlpha = 1;
  }
}

function drawWhirl() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  if (whirl.phase === 'ride') drawWhirlRide(c); else drawWhirlDig(c);
  camX = whirl.phase === 'ride' ? dune.cam : 0;
  drawParticlesLayer(c);
  endPlayWorld();
  camX = 0;
  if (whirl.fadeTo || whirl.fade > 0) {
    c.fillStyle = 'rgba(245,200,144,' + Math.min(1, whirl.fade) + ')';
    c.fillRect(0, 0, viewW, viewH);
  }
  drawWhirlHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: osumat taikalamppuina
function drawWhirlHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = WHIRL_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 3.4 * n + hs, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    c.globalAlpha = i < whirl.hits ? 1 : 0.3;
    drawWhirlLamp(c, left + hs * 2 + i * hs * 3.4, pad * 0.5 + hs * 2.1, hs * 1.3, i < whirl.hits ? 0.3 : 0);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.whirl = function (c, x, y, s) {
  var i;
  for (i = 3; i >= 0; i--) {
    var k = i / 3;
    artBlob(c, x, y - s * 0.16 + k * s * 0.3, s * (0.2 - k * 0.13), s * 0.04, i % 2 ? '#c89060' : '#d8a070', { lineColor: '#8a5a30' });
  }
  artEye(c, x - s * 0.05, y - s * 0.12, s * 0.025, 0, false);
  artEye(c, x + s * 0.05, y - s * 0.12, s * 0.025, 0, false);
  drawWhirlLamp(c, x + s * 0.2, y + s * 0.14, s * 0.07, 0.3);
};
