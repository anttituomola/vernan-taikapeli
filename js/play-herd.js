'use strict';

// Pupupaimen: kolme pupua seuraa yksisarvista niityllä. Pöllön huuto pelästyttää
// lähellä olevat puput pensaisiin piiloon; piiloutunut pupu kootaan napauttamalla.
// Kaikki kolme viedään pupukoloon. Ei sydämiä: kiireetön hoivakenttä.

var HERD_N = 3;
var herdBunnies = [];
var herdBushes = [];
var herdOwls = [];
var herdBurrow = { fx: 0.95, x: 0 };
var herdBushDefs = [0.12, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.86];
var herdOwlDefs = [{ fx: 0.30 }, { fx: 0.58 }, { fx: 0.80 }];
var herdStartDefs = [{ fx: 0.06, fy: 0.25 }, { fx: 0.10, fy: 0.75 }, { fx: 0.14, fy: 0.5 }];

function herdPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function layoutHerd() {
  var i;
  herdBushes = [];
  for (i = 0; i < herdBushDefs.length; i++) herdBushes.push({ x: herdBushDefs[i] * worldW, y: groundTop - viewH * 0.01 });
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].px = herdOwlDefs[i].fx * worldW; herdOwls[i].py = viewH * 0.3; }
  herdBurrow.x = herdBurrow.fx * worldW;
}

function initHerd() {
  var i;
  level = 21;
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
  tasks = [makeTask(0.36, 'word', { maxSyl: 2 }), makeTask(0.70, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  herdOwls = [];
  for (i = 0; i < herdOwlDefs.length; i++) herdOwls.push({ px: 0, py: 0, x: 0, y: 0, state: 'sleep', timer: 4 + i * 1.5, diveT: 0, tx: 0, ty: 0, scared: false });
  layoutHerd();
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].x = herdOwls[i].px; herdOwls[i].y = herdOwls[i].py; }
  herdBunnies = [];
  for (i = 0; i < HERD_N; i++) {
    herdBunnies.push({ x: herdStartDefs[i].fx * worldW, y: herdPathY(herdStartDefs[i].fy), tx: 0, ty: 0, state: 'free', hop: 0, earT: i, idleT: 1 + i, bush: -1, facing: 1 });
    herdBunnies[i].tx = herdBunnies[i].x; herdBunnies[i].ty = herdBunnies[i].y;
  }
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = herdPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  document.body.style.background = '#c9f0ff';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnHerd() {}

function resizeHerd(ratio) {
  var i;
  layoutHerd();
  for (i = 0; i < herdBunnies.length; i++) { herdBunnies[i].x *= ratio; herdBunnies[i].tx *= ratio; }
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].x *= ratio; herdOwls[i].tx *= ratio; }
}

function herdHomeCount() {
  var i, n = 0;
  for (i = 0; i < herdBunnies.length; i++) if (herdBunnies[i].state === 'home') n++;
  return n;
}

function herdNearestBush(x) {
  var i, best = 0, bd = 1e9;
  for (i = 0; i < herdBushes.length; i++) {
    var d = Math.abs(herdBushes[i].x - x);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// Pupu pelästyy: juoksee lähimpään pensaaseen piiloon
function herdScare(b) {
  b.state = 'hiding';
  b.bush = herdNearestBush(b.x + (Math.random() - 0.5) * viewW * 0.2);
  b.tx = herdBushes[b.bush].x;
  b.ty = groundTop + viewH * 0.02;
  b.hop = 1;
  spawnSparkles(b.x, b.y - viewH * 0.1, 6, '#ffffff');
}

function herdRejoin(b) {
  b.state = 'follow';
  b.hop = 1;
  spawnSparkles(b.x, b.y - viewH * 0.12, 12, '#ff7bac');
  playNote(988, 0, 0.1, 'sine', 0.3);
  playNote(1319, 0.08, 0.15, 'sine', 0.3);
}

function handleHerdTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, b, dx, dy;
  for (i = 0; i < herdBunnies.length; i++) {
    b = herdBunnies[i];
    if (b.state !== 'hiding' && b.state !== 'free') continue;
    dx = wx - b.x;
    dy = py - (b.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      herdRejoin(b);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateHerd(dt) {
  var i, dx, dy, dist, step, b, o;
  updateTasks(dt);
  var busy = puzzleBusy();

  dx = unicorn.tx - unicorn.x;
  dy = unicorn.ty - unicorn.y;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !busy) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 10;
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#fff3c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  // Pöllöt: uni -> huhuilu -> syöksy; syöksy ei satuta, mutta pelästyttää puput lähellä
  for (i = 0; i < herdOwls.length; i++) {
    o = herdOwls[i];
    if (busy || celebrating) continue;
    if (o.state === 'sleep') {
      o.timer -= dt;
      if (o.timer <= 0) {
        if (Math.abs(unicorn.x - o.px) < viewW * 0.4) {
          o.state = 'hoot';
          o.timer = 1.2;
          playNote(294, 0, 0.25, 'sine', 0.3);
          playNote(247, 0.3, 0.35, 'sine', 0.3);
        } else o.timer = 1.2;
      }
    } else if (o.state === 'hoot') {
      o.timer -= dt;
      if (o.timer <= 0) {
        o.state = 'dive';
        o.diveT = 0;
        o.scared = false;
        o.tx = unicorn.x;
        o.ty = unicorn.y - viewH * 0.06;
        playNote(880, 0, 0.3, 'sawtooth', 0.08);
      }
    } else if (o.state === 'dive') {
      o.diveT += dt * 1.3;
      var s = o.diveT < 1 ? Math.sin(o.diveT * Math.PI / 2) : Math.sin(Math.max(0, 2 - o.diveT) * Math.PI / 2);
      o.x = o.px + (o.tx - o.px) * s;
      o.y = o.py + (o.ty - o.py) * s;
      if (!o.scared && o.diveT > 0.8) {
        o.scared = true;
        var k, n = 0;
        for (k = 0; k < herdBunnies.length; k++) {
          b = herdBunnies[k];
          if (b.state === 'follow' && Math.abs(b.x - o.tx) < viewW * 0.35) { herdScare(b); n++; }
        }
        if (n > 0) { playNote(1500, 0, 0.08, 'sine', 0.25); playNote(1200, 0.08, 0.1, 'sine', 0.25); }
      }
      if (o.diveT >= 2) {
        o.state = 'sleep';
        o.x = o.px; o.y = o.py;
        o.timer = 5 + Math.random() * 3;
      }
    }
  }

  // Puput
  var slot = 0;
  for (i = 0; i < herdBunnies.length; i++) {
    b = herdBunnies[i];
    b.earT += dt * 3;
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 2.5);
    if (b.state === 'home') continue;
    if (b.state === 'free') {
      b.idleT -= dt;
      if (b.idleT <= 0) { b.idleT = 1.5 + Math.random() * 2; b.hop = 1; }
      dx = unicorn.x - b.x; dy = unicorn.y - b.y;
      if (dx * dx + dy * dy < viewW * 0.12 * viewW * 0.12) herdRejoin(b);
      continue;
    }
    if (b.state === 'follow') {
      b.tx = unicorn.x - unicorn.facing * viewW * (0.07 + slot * 0.05);
      b.ty = Math.min(Math.max(unicorn.y + (slot - 1) * viewH * 0.035, groundTop), groundBottom);
      slot++;
      // Kolo: seuraaja hyppää sisään perillä
      if (Math.abs(unicorn.x - herdBurrow.x) < viewW * 0.1 && Math.abs(b.x - herdBurrow.x) < viewW * 0.16) {
        b.state = 'home';
        spawnSparkles(b.x, b.y - viewH * 0.08, 14, '#ffe27a');
        playNote(880 + herdHomeCount() * 120, 0, 0.2, 'sine', 0.35);
        playNote(1320 + herdHomeCount() * 120, 0.1, 0.3, 'sine', 0.3);
        if (herdHomeCount() === herdBunnies.length) startCelebration();
        continue;
      }
    }
    dx = b.tx - b.x; dy = b.ty - b.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    var sp = (b.state === 'hiding' ? viewW * 0.4 : viewW * 0.26) * dt;
    if (dist > 6 && !busy && !celebrating) {
      if (sp > dist) sp = dist;
      b.x += (dx / dist) * sp;
      b.y += (dy / dist) * sp;
      if (Math.abs(dx) > 4) b.facing = dx > 0 ? 1 : -1;
      b.hop = Math.abs(Math.sin(globalT * 9 + i));
    }
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderHerdBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#9fdcff');
  sky.addColorStop(1, '#e8f7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, groundTop + 2);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 9; i++) cloudShape(b, w * (0.05 + i * 0.11), h * (0.1 + (i % 3) * 0.07), h * 0.03);
  b.fillStyle = '#a7dd8f';
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.12 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  var grass = b.createLinearGradient(0, groundTop, 0, h);
  grass.addColorStop(0, '#8fd97a');
  grass.addColorStop(1, '#5fb356');
  b.fillStyle = grass;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,180,0.45)';
  b.fillRect(0, groundTop + h * 0.02, w, groundBottom - groundTop - h * 0.02);
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
  }
  for (i = 0; i < herdBushes.length; i++) drawBush(b, herdBushes[i].x, herdBushes[i].y, h * 0.09);
  // Pupukolo
  var bx = herdBurrow.x, s = h * 0.1;
  b.fillStyle = '#8a6a44';
  b.beginPath(); b.arc(bx, groundTop + h * 0.02, s * 0.95, Math.PI, 0); b.fill();
  b.fillStyle = '#3a2a1a';
  b.beginPath(); b.arc(bx, groundTop + h * 0.02, s * 0.62, Math.PI, 0); b.fill();
  b.fillStyle = '#fff6c8';
  roundRect(b, bx + s * 0.9, groundTop - s * 1.4, s * 0.7, s * 0.4, s * 0.08);
  b.fill();
  b.fillStyle = '#c98b4a';
  b.fillRect(bx + s * 1.2, groundTop - s * 1.0, s * 0.08, s * 1.0);
  drawBunny(b, bx + s * 1.25, groundTop - s * 1.05, s * 0.16, 0, 0, true);
}

function drawHerdBunny(c, b) {
  var x = b.x - camX, y = b.y, s = viewH * 0.04;
  if (x < -s * 4 || x > viewW + s * 4) return;
  if (b.state === 'hiding' && Math.abs(b.x - b.tx) < 8) {
    // Piilossa pensaan takana: korvat ja huutomerkki näkyvät
    drawBunny(c, x, y - viewH * 0.02, s * 0.8, 0, b.earT, true);
    c.fillStyle = '#ff5f7e';
    c.fillRect(x - s * 0.08, y - s * 2.4 - Math.sin(globalT * 3) * s * 0.1, s * 0.16, s * 0.5);
    c.beginPath(); c.arc(x, y - s * 1.75 - Math.sin(globalT * 3) * s * 0.1, s * 0.1, 0, Math.PI * 2); c.fill();
    return;
  }
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 0.8, s * 0.2, 0, 0, Math.PI * 2);
  else c.arc(x, y, s * 0.5, 0, Math.PI * 2);
  c.fill();
  drawBunny(c, x, y, s, b.hop * viewH * 0.025, b.earT, false);
  if (b.state === 'follow') drawHeartShape(c, x, y - s * 2.3 + Math.sin(globalT * 3) * s * 0.1, s * 0.14, true);
}

function drawHerd() {
  var i, order = [];
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < herdOwls.length; i++) if (herdOwls[i].state !== 'dive') drawNightOwl(ctx, herdOwls[i]);
  // Puput ja yksisarvinen syvyysjärjestyksessä
  for (i = 0; i < herdBunnies.length; i++) if (herdBunnies[i].state !== 'home') order.push({ y: herdBunnies[i].y, b: herdBunnies[i] });
  order.push({ y: unicorn.y, u: true });
  order.sort(function (a, b) { return a.y - b.y; });
  var us = viewH / 800;
  for (i = 0; i < order.length; i++) {
    if (order[i].u) drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
    else drawHerdBunny(ctx, order[i].b);
  }
  for (i = 0; i < herdOwls.length; i++) if (herdOwls[i].state === 'dive') drawNightOwl(ctx, herdOwls[i]);
  drawParticlesLayer(ctx);
  // Nuoli: piilossa olevaan pupuun tai koloon
  if (!celebrating) {
    var hid = null, allFollow = true;
    for (i = 0; i < herdBunnies.length; i++) {
      if (herdBunnies[i].state === 'hiding' || herdBunnies[i].state === 'free') { allFollow = false; if (!hid) hid = herdBunnies[i]; }
    }
    if (hid) drawEdgeArrow(ctx, hid.x);
    else if (allFollow && herdHomeCount() < herdBunnies.length) drawEdgeArrow(ctx, herdBurrow.x);
  }
  drawCelebrateLayer();
  drawPickupHud(ctx, HERD_N, function (i2) { return herdBunnies[i2] && herdBunnies[i2].state === 'home'; },
    function (c, x, y, s2) { drawBunny(c, x, y + s2 * 0.3, s2 * 0.9, 0, 0, true); });
  drawTaskOverlay(ctx);
}
