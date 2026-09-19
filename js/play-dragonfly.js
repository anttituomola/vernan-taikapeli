'use strict';

// Tulilento (Kaukamaa, Lohikäärmelaakso): uusi verbi TULIHENGITYS.
// Prinsessa lentää lohikäärmeenpoikasella laavakanjonissa yössä: pidä pohjassa
// lentääksesi sormea kohti, ja tulinappi (tai toinen sormi / vasen alakulma)
// puhaltaa tulta eteenpäin. Tulella sytytetään kahdeksan soihtua, sulatetaan
// kolme jääporttia (kaksi puhallusta) ja hajotetaan tuhkapilviä. Liekkejä on
// kolme; ne palautuvat ajan kanssa, ja tulimarja täyttää ne heti. Laava
// alhaalla, kivipilarit ja tuhkapilvet vievät sydämen. Lopussa lohikäärmeiden
// rovio: kun kaikki soihdut palavat, se hehkuu — sytytä se.
// Tehtävät: vähennys, puuttuva ruutu.

var FLY_FLAMES = 3;
var FLY_RECHARGE = 2.2;        // sekuntia per liekki
var FLY_CONE = 0.30;           // liekin pituus (× viewW)
var FLY_CONE_ANG = 0.42;       // liekin puolikulma (rad)
var FLY_BURST_T = 0.6;
var FLY_TORCHES = [
  { fx: 0.10, fy: 0.34 }, { fx: 0.19, fy: 0.62 }, { fx: 0.27, fy: 0.26 }, { fx: 0.41, fy: 0.56 },
  { fx: 0.49, fy: 0.28 }, { fx: 0.62, fy: 0.62 }, { fx: 0.73, fy: 0.32 }, { fx: 0.87, fy: 0.52 }
];
var FLY_GATES = [0.34, 0.58, 0.81];
// Pilarit: pohjasta nousevat kivet ja katosta laskeutuvat tippukivet (korkeus × viewH)
var FLY_PILLARS = [
  { fx: 0.15, top: false, h: 0.34 }, { fx: 0.23, top: true, h: 0.36 }, { fx: 0.37, top: false, h: 0.30 },
  { fx: 0.45, top: true, h: 0.40 }, { fx: 0.53, top: false, h: 0.40 }, { fx: 0.67, top: true, h: 0.34 },
  { fx: 0.76, top: false, h: 0.36 }, { fx: 0.91, top: true, h: 0.30 }
];
var FLY_CLOUDS = [0.30, 0.50, 0.70, 0.86];
var FLY_BERRIES = [{ fx: 0.21, fy: 0.40 }, { fx: 0.43, fy: 0.30 }, { fx: 0.60, fy: 0.42 }, { fx: 0.78, fy: 0.58 }, { fx: 0.93, fy: 0.30 }];
var FLY_DRAGON = '#7fe0c8';

var fly = {
  torches: [], gates: [], pillars: [], clouds: [], berries: [],
  flames: FLY_FLAMES, flameT: 0, bursts: [], steam: [],
  brazier: { fx: 0.955, x: 0, y: 0, lit: false, t: 0 },
  bumpT: 0, lavaT: 0, finishT: 0, flap: 0
};

function flyS() { return viewH * 0.07; }
function flyLavaY() { return groundTop + viewH * 0.02; }

// ---------- Alustus ----------
function flyBuild() {
  var i, s = viewH * 0.09;
  fly.torches = [];
  for (i = 0; i < FLY_TORCHES.length; i++) {
    fly.torches.push({ x: FLY_TORCHES[i].fx * worldW, y: FLY_TORCHES[i].fy * viewH, lit: false, collected: false, t: 0,
      onRestore: function (t) { t.lit = false; } });
  }
  fly.gates = [];
  for (i = 0; i < FLY_GATES.length; i++) fly.gates.push({ x: FLY_GATES[i] * worldW, hp: 2, open: false, meltT: 0, crackT: 0 });
  fly.pillars = [];
  for (i = 0; i < FLY_PILLARS.length; i++) {
    var p = FLY_PILLARS[i], hh = p.h * viewH;
    fly.pillars.push({ x0: p.fx * worldW - s / 2, x1: p.fx * worldW + s / 2, y0: p.top ? 0 : flyLavaY() - hh, y1: p.top ? hh : flyLavaY() + viewH, top: p.top });
  }
  fly.clouds = [];
  for (i = 0; i < FLY_CLOUDS.length; i++) {
    fly.clouds.push({ fx: FLY_CLOUDS[i], x: FLY_CLOUDS[i] * worldW, baseY: viewH * (0.30 + (i % 2) * 0.22), y: 0, amp: viewH * (0.06 + (i % 2) * 0.05), t: i * 1.9, f: 0.9 + (i % 3) * 0.3, gone: 0 });
  }
  fly.berries = [];
  for (i = 0; i < FLY_BERRIES.length; i++) fly.berries.push({ x: FLY_BERRIES[i].fx * worldW, y: FLY_BERRIES[i].fy * viewH, collected: false, phase: i * 1.3 });
  fly.brazier.x = fly.brazier.fx * worldW;
  fly.brazier.y = viewH * 0.50;
}

function initDragonfly() {
  var i;
  tasks = [makeTask(0.25, 'minus'), makeTask(0.69, 'matrix')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.38, 0.66]);
  flyBuild();
  fly.flames = FLY_FLAMES;
  fly.flameT = 0;
  fly.bursts = [];
  fly.steam = [];
  fly.brazier.lit = false;
  fly.brazier.t = 0;
  fly.bumpT = 0;
  fly.finishT = 0;
  princess.x = viewW * 0.12;
  princess.y = viewH * 0.42;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(392, 0, 0.2, 'triangle', 0.3);
  playNote(523, 0.12, 0.25, 'triangle', 0.3);
  playNote(659, 0.24, 0.35, 'triangle', 0.35);
}

function respawnDragonfly() {
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = viewH * 0.42;
  princess.vx = 0;
  princess.vy = 0;
  fly.flames = FLY_FLAMES;
  fly.bursts = [];
  spawnSparkles(princess.x, princess.y, 14, '#ffe27a');
}

function resizeDragonfly(ratio) {
  var i, lit = [], gates = [];
  for (i = 0; i < fly.torches.length; i++) lit.push(fly.torches[i].lit);
  for (i = 0; i < fly.gates.length; i++) gates.push(fly.gates[i]);
  flyBuild();
  for (i = 0; i < fly.torches.length && i < lit.length; i++) fly.torches[i].lit = lit[i];
  for (i = 0; i < fly.gates.length && i < gates.length; i++) { fly.gates[i].open = gates[i].open; fly.gates[i].hp = gates[i].hp; }
  princess.x *= ratio;
  princess.y = Math.min(princess.y, flyLavaY() - viewH * 0.1);
}

// ---------- Tuli ----------
// Yhteinen kutsu tulinapista, toisesta sormesta ja vasemmasta alakulmasta
function tryFire() {
  var p = phaseNow();
  if (!running || celebrating || puzzleBusy() || !p.usesFire || !p.fire) return;
  p.fire();
}
function flyMouth() {
  var s = flyS();
  return { x: princess.x + princess.facing * s * 1.7, y: princess.y - s * 0.75 };
}
function flyFire() {
  var m;
  if (fly.flames < 1) {
    // Liekit loppu: pieni savupöllähdys
    m = flyMouth();
    spawnDust(m.x, m.y, 5, -princess.facing);
    playNote(180, 0, 0.12, 'triangle', 0.15);
    fly.bumpT = 0.4;
    return;
  }
  fly.flames--;
  fly.bursts.push({ t: 0, hits: [] });
  playNote(110, 0, 0.3, 'sawtooth', 0.22);
  playNote(160, 0.05, 0.35, 'sawtooth', 0.16);
  playNote(660, 0.02, 0.12, 'triangle', 0.18);
  playNote(880, 0.1, 0.2, 'triangle', 0.14);
}
function flyTorchesLit() {
  var i, n = 0;
  for (i = 0; i < fly.torches.length; i++) if (fly.torches[i].lit) n++;
  return n;
}
function flyBrazierReady() {
  return flyTorchesLit() === fly.torches.length;
}
// Onko piste liekkikeilassa (keila kasvaa puhalluksen alussa)
function flyInCone(px, py, k, r) {
  var m = flyMouth(), dx = (px - m.x) * princess.facing, dy = py - m.y, L = FLY_CONE * viewW * k;
  r = r || viewH * 0.04;
  if (dx < -r || dx > L + r) return false;
  // Keila levenee kulman mukaan; kohteen säde lasketaan mukaan
  return Math.abs(dy) < Math.max(dx, 0) * Math.tan(FLY_CONE_ANG) + r + viewH * 0.02;
}
function flyLightTorch(t) {
  var idx = fly.torches.indexOf(t);
  t.lit = true;
  t.collected = true;
  t.t = 0;
  registerCollected(t);
  artPop(t.x, t.y - viewH * 0.03, viewH * 0.05, '#ffd24f', 'burst');
  spawnSparkles(t.x, t.y - viewH * 0.03, 14, '#ffb347');
  playNote(660 + idx * 50, 0, 0.22, 'sine', 0.4);
  playNote(990 + idx * 50, 0.08, 0.3, 'triangle', 0.32);
  if (flyBrazierReady()) {
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}
function flyHitGate(g) {
  g.hp--;
  g.crackT = 0.4;
  playNote(520, 0, 0.08, 'square', 0.18);
  playNote(390, 0.06, 0.12, 'square', 0.14);
  if (g.hp <= 0) {
    g.open = true;
    g.meltT = 0.7;
    flySteam(g.x, viewH * 0.45, 22);
    playNote(300, 0, 0.3, 'sine', 0.25);
    playNote(450, 0.1, 0.4, 'sine', 0.2);
  }
}
function flySteam(x, y, n) {
  var i;
  for (i = 0; i < n; i++) {
    if (fly.steam.length > 80) fly.steam.shift();
    fly.steam.push({ x: x + (Math.random() - 0.5) * viewH * 0.1, y: y + (Math.random() - 0.5) * viewH * 0.5, vx: (Math.random() - 0.5) * viewH * 0.1, vy: -viewH * (0.05 + Math.random() * 0.12), t: 0, life: 0.9 + Math.random() * 0.6, r: viewH * (0.015 + Math.random() * 0.02) });
  }
}

// ---------- Päivitys ----------
function updateDragonfly(dt) {
  var i, j, s = flyS(), R = s * 0.85, busy, b, k, t, g, c, m, dx, dy;
  updateTasks(dt);
  busy = puzzleBusy();
  if (fly.bumpT > 0) fly.bumpT -= dt;
  fly.lavaT += dt;

  // Lento: sormea kohti; irti päästettynä lohikäärme liitää ja vajoaa hitaasti
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.6 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.75 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
    fly.flap += dt * 10;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.6);
    princess.vy += viewH * 0.28 * dt;
    fly.flap += dt * 5;
  }
  if (princess.vx > viewW * 0.30) princess.vx = viewW * 0.30;
  if (princess.vx < -viewW * 0.30) princess.vx = -viewW * 0.30;
  if (princess.vy > viewH * 0.5) princess.vy = viewH * 0.5;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;
  if (!busy && !celebrating) {
    princess.x += princess.vx * dt;
    princess.y += princess.vy * dt;
  }
  princess.x = Math.min(Math.max(princess.x, R * 1.5), worldW - R * 1.5);
  if (princess.y < viewH * 0.12) { princess.y = viewH * 0.12; if (princess.vy < 0) princess.vy = 0; }
  // Laava
  if (princess.y > flyLavaY() - s * 0.9) {
    princess.y = flyLavaY() - s * 0.9;
    princess.vy = -viewH * 0.45;
    if (!celebrating && loseHeart()) {
      spawnSparkles(princess.x, flyLavaY(), 16, '#ff9a3a');
      artShakeStart(viewH * 0.01, 0.3);
    }
  }
  blockPrincessAtTasks();
  updateCheckpoints(princess.x, princess.y);

  // Kivipilarit
  for (i = 0; i < fly.pillars.length; i++) {
    k = fly.pillars[i];
    if (princess.x + R > k.x0 && princess.x - R < k.x1 && princess.y + R * 0.8 > k.y0 && princess.y - R * 0.8 < k.y1) {
      var cx = (k.x0 + k.x1) / 2;
      if (!celebrating && loseHeart()) {
        spawnSparkles(princess.x, princess.y, 12, '#c9a98a');
        artShakeStart(viewH * 0.008, 0.25);
      }
      princess.vx = (princess.x < cx ? -1 : 1) * viewW * 0.22;
      princess.x = princess.x < cx ? k.x0 - R : k.x1 + R;
      if (k.top) { princess.vy = viewH * 0.3; princess.y = Math.max(princess.y, k.y1 + R * 0.5); }
      else { princess.vy = -viewH * 0.3; princess.y = Math.min(princess.y, k.y0 - R * 0.5); }
    }
  }
  // Jääportit tukkivat kanjonin, kunnes ne on sulatettu
  for (i = 0; i < fly.gates.length; i++) {
    g = fly.gates[i];
    if (g.crackT > 0) g.crackT -= dt;
    if (g.meltT > 0) g.meltT -= dt;
    if (g.open) continue;
    if (princess.x + R > g.x - s * 0.4 && princess.x < g.x + s) {
      princess.x = g.x - s * 0.4 - R;
      if (princess.vx > 0) {
        princess.vx = -viewW * 0.08;
        if (fly.bumpT <= 0) { fly.bumpT = 0.6; playNote(240, 0, 0.1, 'triangle', 0.2); spawnSparkles(g.x - s * 0.3, princess.y, 5, '#cfefff'); }
      }
    }
  }
  // Tuhkapilvet ajelehtivat; osuma vie sydämen
  for (i = 0; i < fly.clouds.length; i++) {
    c = fly.clouds[i];
    c.t += dt;
    c.y = c.baseY + Math.sin(c.t * c.f) * c.amp;
    if (c.gone > 0) { c.gone -= dt; continue; }
    dx = c.x - princess.x; dy = c.y - princess.y;
    if (!celebrating && dx * dx + dy * dy < viewH * 0.085 * viewH * 0.085) {
      if (loseHeart()) {
        princess.vx = (dx > 0 ? -1 : 1) * viewW * 0.25;
        princess.vy = viewH * 0.25;
        spawnSparkles(princess.x, princess.y, 12, '#8a8a9a');
      }
    }
  }
  // Tulimarjat täyttävät liekit
  for (i = 0; i < fly.berries.length; i++) {
    b = fly.berries[i];
    b.phase += dt * 2;
    if (b.collected) continue;
    dx = b.x - princess.x; dy = b.y - princess.y;
    if (!busy && !celebrating && dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
      b.collected = true;
      fly.flames = FLY_FLAMES;
      fly.flameT = 0;
      artPop(b.x, b.y, viewH * 0.05, '#ff8a4a', 'burst');
      spawnSparkles(b.x, b.y, 14, '#ff6a4a');
      playNote(784, 0, 0.15, 'sine', 0.35);
      playNote(1175, 0.08, 0.25, 'sine', 0.3);
      playNote(1568, 0.16, 0.3, 'triangle', 0.25);
    }
  }
  // Liekit palautuvat
  if (fly.flames < FLY_FLAMES) {
    fly.flameT += dt;
    if (fly.flameT >= FLY_RECHARGE) { fly.flameT = 0; fly.flames++; playNote(1047, 0, 0.1, 'sine', 0.15); }
  }
  // Puhallukset: keila osuu soihtuihin, portteihin, pilviin ja rovioon
  for (i = fly.bursts.length - 1; i >= 0; i--) {
    b = fly.bursts[i];
    b.t += dt;
    k = Math.min(1, b.t / 0.22);
    if (b.t < FLY_BURST_T * 0.8) {
      for (j = 0; j < fly.torches.length; j++) {
        t = fly.torches[j];
        if (!t.lit && flyInCone(t.x, t.y - viewH * 0.02, k)) flyLightTorch(t);
      }
      for (j = 0; j < fly.gates.length; j++) {
        g = fly.gates[j];
        if (!g.open && b.hits.indexOf(g) < 0 && flyInCone(g.x, princess.y - s * 0.75, k, viewH * 0.1)) { b.hits.push(g); flyHitGate(g); }
      }
      for (j = 0; j < fly.clouds.length; j++) {
        c = fly.clouds[j];
        if (c.gone <= 0 && flyInCone(c.x, c.y, k, viewH * 0.05)) {
          c.gone = 7;
          spawnDust(c.x, c.y, 14, 0);
          artPop(c.x, c.y, viewH * 0.06, '#c8c8d8', 'ring');
          playNote(200, 0, 0.2, 'triangle', 0.2);
        }
      }
      if (flyBrazierReady() && !fly.brazier.lit && flyInCone(fly.brazier.x, fly.brazier.y - viewH * 0.04, k, viewH * 0.07)) {
        fly.brazier.lit = true;
        fly.brazier.t = 0;
        artPop(fly.brazier.x, fly.brazier.y - viewH * 0.06, viewH * 0.12, '#ffd24f', 'burst');
        spawnSparkles(fly.brazier.x, fly.brazier.y - viewH * 0.06, 30, '#ffb347');
        soundFanfare();
      }
    }
    if (Math.random() < dt * 30) {
      m = flyMouth();
      spawnSparkles(m.x + princess.facing * Math.random() * FLY_CONE * viewW * k, m.y + (Math.random() - 0.5) * viewH * 0.06, 1, Math.random() < 0.5 ? '#ffb347' : '#ff6a2a');
    }
    if (b.t >= FLY_BURST_T) fly.bursts.splice(i, 1);
  }
  if (fly.brazier.lit) {
    fly.brazier.t += dt;
    if (!celebrating && fly.brazier.t > 1.4) startCelebration();
  }
  for (i = fly.steam.length - 1; i >= 0; i--) {
    t = fly.steam[i];
    t.t += dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    if (t.t > t.life) fly.steam.splice(i, 1);
  }
  for (i = 0; i < fly.torches.length; i++) if (fly.torches[i].lit) fly.torches[i].t += dt;

  followCam(princess.x, dt);
  if (Math.random() < dt * 6) spawnSparkles(princess.x - princess.facing * s * 1.2, princess.y + s * 0.3, 1, '#ffd6a0');
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto: taustakerrokset ----------
var FLY_HAZE = '#4a2a5a';
function dragonflyLayers() {
  return [
    { speed: 0.2, render: renderDragonflyFar },
    { speed: 0.55, render: renderDragonflyMid },
    { speed: 1, render: renderDragonflyNear }
  ];
}
function renderDragonflyBg(b, w, h) {
  renderDragonflyFar(b, w, h);
  renderDragonflyMid(b, w, h);
  renderDragonflyNear(b, w, h);
}
function renderDragonflyFar(b, w, h) {
  var i, x, y, sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#080820');
  sky.addColorStop(0.45, '#2a1650');
  sky.addColorStop(0.8, '#5a2a5a');
  sky.addColorStop(1, '#8a3a3a');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff6d8';
  for (i = 0; i < 70; i++) {
    x = w * ((i * 0.1371 + 0.02) % 1);
    y = h * (0.02 + (i * 0.0713) % 0.5);
    b.globalAlpha = 0.25 + (i % 5) * 0.15;
    b.beginPath(); b.arc(x, y, 0.8 + (i % 3) * 0.7, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.7, h * 0.16, h * 0.06, 0.2, '#c8d4ff', '#fdfdff', '#d8e0ff');
  // Kaukaiset tulivuoret hehkuvin huipuin
  var far = artMix('#2a1040', FLY_HAZE, 0.4);
  for (i = 0; i < 6; i++) {
    x = w * (0.05 + i * 0.18);
    var vh = h * (0.16 + (i % 3) * 0.05), base = h * 0.62;
    b.fillStyle = far;
    b.beginPath(); b.moveTo(x - h * 0.22, base); b.lineTo(x - h * 0.03, base - vh); b.lineTo(x + h * 0.03, base - vh); b.lineTo(x + h * 0.22, base); b.closePath(); b.fill();
    artGlow(b, x, base - vh, h * 0.06, '#ff7a3a', 0.45);
    artBlob(b, x, base - vh, h * 0.03, h * 0.01, '#ff9a5a', { line: false });
  }
  fillHillBand(b, w, h, h * 0.62, artMix('#3a1a48', FLY_HAZE, 0.25), function (px) {
    return h * 0.60 - Math.abs(Math.sin(px * 0.004 + 1.2)) * h * 0.05;
  });
}
function renderDragonflyMid(b, w, h) {
  var i, x, wall = b.createLinearGradient(0, h * 0.4, 0, h);
  wall.addColorStop(0, artMix('#4a2438', FLY_HAZE, 0.2));
  wall.addColorStop(0.75, '#5a2a30');
  wall.addColorStop(1, '#a04a2a');
  fillHillBand(b, w, h, h * 0.55, wall, function (px) {
    return h * 0.52 - Math.abs(Math.sin(px * 0.0027 + 0.5)) * h * 0.14 - Math.sin(px * 0.011) * h * 0.02;
  });
  b.fillStyle = 'rgba(0,0,0,0.18)';
  for (i = 0; i < 40; i++) {
    x = (i * 233.7) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, h * (0.6 + (i % 5) * 0.06), h * 0.05, h * 0.02, 0, 0, Math.PI * 2); else b.arc(x, h * 0.7, h * 0.02, 0, Math.PI * 2);
    b.fill();
  }
  // Laavan kajo seinän alaosassa
  var glow = b.createLinearGradient(0, h * 0.7, 0, h);
  glow.addColorStop(0, 'rgba(255,120,40,0)');
  glow.addColorStop(1, 'rgba(255,140,50,0.45)');
  b.fillStyle = glow;
  b.fillRect(0, h * 0.7, w, h * 0.3);
}
function renderDragonflyNear(b, w, h) {
  var i, x, k, lavaY = flyLavaY(), s = viewH * 0.09;
  // Laavajoki
  var lava = b.createLinearGradient(0, lavaY, 0, h);
  lava.addColorStop(0, '#ffd45a');
  lava.addColorStop(0.15, '#ff8a2a');
  lava.addColorStop(1, '#a02a10');
  b.fillStyle = lava;
  b.fillRect(0, lavaY, w, h - lavaY);
  b.fillStyle = 'rgba(80,10,0,0.35)';
  for (i = 0; i < 50; i++) {
    x = (i * 311.3) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, lavaY + h * 0.06 + (i % 4) * h * 0.04, h * (0.03 + (i % 3) * 0.02), h * 0.012, 0, 0, Math.PI * 2); else b.arc(x, lavaY + h * 0.08, h * 0.02, 0, Math.PI * 2);
    b.fill();
  }
  // Pilarit ja tippukivet: alhaalta laavan valo, ylhäältä varjo
  for (i = 0; i < FLY_PILLARS.length; i++) {
    k = FLY_PILLARS[i];
    x = k.fx * worldW;
    if (k.top) drawFlyStalactite(b, x, k.h * viewH, s);
    else drawFlyPillar(b, x, lavaY - k.h * viewH, lavaY + h * 0.05, s);
  }
  // Soihtujen tangot ja porttien pielet
  for (i = 0; i < FLY_TORCHES.length; i++) {
    x = FLY_TORCHES[i].fx * worldW;
    drawFlyTorchPole(b, x, FLY_TORCHES[i].fy * viewH, viewH * 0.045);
  }
  for (i = 0; i < FLY_GATES.length; i++) {
    x = FLY_GATES[i] * worldW;
    artRoundRect(b, x - s * 0.55, h * 0.04, s * 0.32, lavaY - h * 0.02, s * 0.1, '#5a3a3a', { shadeTo: '#2a1a1a', lineColor: '#1a0a0a' });
    artRoundRect(b, x + s * 0.23, h * 0.04, s * 0.32, lavaY - h * 0.02, s * 0.1, '#5a3a3a', { shadeTo: '#2a1a1a', lineColor: '#1a0a0a' });
    artBlob(b, x - s * 0.39, h * 0.05, s * 0.2, s * 0.08, '#ffffff', { shadeTo: '#c8e0f0', line: false });
    artBlob(b, x + s * 0.39, h * 0.05, s * 0.2, s * 0.08, '#ffffff', { shadeTo: '#c8e0f0', line: false });
  }
  // Rovion kallio
  var bx = fly.brazier.fx * worldW, by = viewH * 0.5;
  drawFlyPillar(b, bx, by + s * 0.2, lavaY + h * 0.05, s * 2.2);
  artBlob(b, bx, by + s * 0.2, s * 1.3, s * 0.2, '#6a3a3a', { shadeTo: '#3a1a1a', lineColor: '#1a0a0a' });
}
function drawFlyPillar(b, x, top, bottom, w) {
  roundRect(b, x - w / 2, top, w, bottom - top, w * 0.3);
  artFillPath(b, '#7a3a3a', top, bottom, w * 0.5, { shadeTo: '#c85a30', lineColor: '#2a0a0a' });
  artBlob(b, x, top + w * 0.02, w * 0.5, w * 0.14, '#4a2a2a', { line: false });
  b.fillStyle = 'rgba(0,0,0,0.2)';
  b.beginPath();
  if (b.ellipse) b.ellipse(x - w * 0.15, top + (bottom - top) * 0.4, w * 0.18, w * 0.08, 0, 0, Math.PI * 2); else b.arc(x, top + (bottom - top) * 0.4, w * 0.1, 0, Math.PI * 2);
  b.fill();
}
function drawFlyStalactite(b, x, hh, w) {
  b.beginPath();
  b.moveTo(x - w * 0.6, -4);
  b.lineTo(x + w * 0.6, -4);
  b.lineTo(x + w * 0.35, hh * 0.6);
  b.quadraticCurveTo(x + w * 0.1, hh, x, hh);
  b.quadraticCurveTo(x - w * 0.1, hh, x - w * 0.35, hh * 0.6);
  b.closePath();
  artFillPath(b, '#3a1a2a', 0, hh, w * 0.5, { shadeTo: '#7a3a3a', lineColor: '#1a0a12' });
  artBlob(b, x, hh - w * 0.05, w * 0.12, w * 0.06, '#ff8a4a', { line: false, alpha: 0.6 });
}
function drawFlyTorchPole(b, x, y, s) {
  artLimb(b, x, y + s * 4.2, x, y + s * 0.5, s * 0.28, '#5a3a2a', '#2a1a10');
  artBlob(b, x, y + s * 4.2, s * 1.1, s * 0.3, '#6a3a3a', { shadeTo: '#3a1a1a', lineColor: '#1a0a0a' });
  artBlob(b, x, y + s * 0.3, s * 0.9, s * 0.45, '#8a6a3a', { shadeTo: '#4a3018', lineColor: '#2a1a08', hi: 0.2 });
}

// ---------- Piirto: hahmot ja tuli ----------
function drawFlyTorch(c, t) {
  var x = t.x - camX, y = t.y, s = viewH * 0.045, i, f;
  if (x < -s * 4 || x > viewW + s * 4) return;
  if (t.lit) {
    artGlow(c, x, y - s * 0.6, s * 3.2, '#ffb347', 0.45 + Math.sin(globalT * 7 + t.x) * 0.08);
    for (i = 0; i < 3; i++) {
      f = Math.sin(globalT * 9 + i * 2 + t.x);
      artBlob(c, x + f * s * 0.12, y - s * (0.9 + i * 0.35) - Math.abs(f) * s * 0.2, s * (0.55 - i * 0.14), s * (0.75 - i * 0.18), i === 0 ? '#ff6a2a' : (i === 1 ? '#ffb347' : '#fff0a0'), { line: false });
    }
  } else {
    artBlob(c, x, y - s * 0.2, s * 0.45, s * 0.3, '#3a2a2a', { line: false });
    c.strokeStyle = 'rgba(255,255,255,' + (0.25 + Math.sin(globalT * 3 + t.x) * 0.12) + ')';
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.beginPath(); c.arc(x, y - s * 0.6, s * 0.9, 0, Math.PI * 2); c.stroke();
  }
}
function drawFlyGate(c, g) {
  var x = g.x - camX, s = viewH * 0.09, top = viewH * 0.06, bottom = flyLavaY(), i, rows, hh, a;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (g.open && g.meltT <= 0) return;
  a = g.open ? Math.max(0, g.meltT / 0.7) : 1;
  rows = 7;
  hh = (bottom - top) / rows;
  c.globalAlpha = a * 0.92;
  for (i = 0; i < rows; i++) {
    var off = (i % 2) * s * 0.12 - s * 0.06, drop = g.open ? (1 - a) * viewH * 0.3 * (1 + (i % 3) * 0.3) : 0;
    artRoundRect(c, x - s * 0.34 + off, top + i * hh + drop, s * 0.68, hh * 0.92, hh * 0.25, '#bfe8ff', { shadeTo: '#6ab8e8', lineColor: '#3a86b8', hi: 0.4 });
  }
  if (g.hp < 2 && !g.open) {
    c.strokeStyle = 'rgba(30,80,120,0.7)';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.1, top + hh * 1.2); c.lineTo(x + s * 0.12, top + hh * 2.4); c.lineTo(x - s * 0.05, top + hh * 3.6); c.lineTo(x + s * 0.18, top + hh * 5.0);
    c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.12, top + hh * 2.4); c.lineTo(x + s * 0.3, top + hh * 2.1); c.stroke();
  }
  if (g.crackT > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (g.crackT * 1.2) + ')';
    c.fillRect(x - s * 0.34, top, s * 0.68, bottom - top);
  }
  c.globalAlpha = 1;
}
function drawFlyCloud(c, cl) {
  var x = cl.x - camX, y = cl.y, s = viewH * 0.04;
  if (cl.gone > 0 || x < -s * 6 || x > viewW + s * 6) return;
  c.fillStyle = '#3a3a4a';
  cloudShape(c, x, y, s);
  c.fillStyle = 'rgba(255,120,60,0.35)';
  cloudShape(c, x + s * 0.2, y + s * 0.5, s * 0.55);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  cloudShape(c, x - s * 0.3, y - s * 0.5, s * 0.5);
  artEye(c, x - s * 0.5, y - s * 0.1, s * 0.22, -0.3, false);
  artEye(c, x + s * 0.4, y - s * 0.15, s * 0.22, -0.3, false);
}
function drawFlyFire(c, b) {
  var m = flyMouth(), k = Math.min(1, b.t / 0.22), fade = Math.max(0, 1 - Math.max(0, b.t - FLY_BURST_T * 0.55) / (FLY_BURST_T * 0.45));
  var L = FLY_CONE * viewW * k, i, n = 7, x0 = m.x - camX, y0 = m.y, f = princess.facing, px, py, r, col;
  // Liekki piirretään valoa lisäävästi, jotta se hehkuu tummaa kanjonia vasten
  c.save();
  c.globalCompositeOperation = 'lighter';
  artGlow(c, x0 + f * L * 0.45, y0, L * 0.6, '#ff8a3a', 0.35 * fade);
  for (i = 0; i < n; i++) {
    var u = (i + 0.5) / n;
    px = x0 + f * L * u;
    py = y0 + Math.sin(globalT * 26 + i * 1.7) * L * FLY_CONE_ANG * u * 0.6;
    r = L * (0.07 + u * 0.16) * (0.8 + Math.sin(globalT * 30 + i) * 0.2);
    col = u < 0.35 ? '#fff4b0' : (u < 0.7 ? '#ffb347' : '#ff6a2a');
    artBlob(c, px, py, r, r * 0.75, col, { line: false, alpha: fade * (0.95 - u * 0.4) });
  }
  for (i = 0; i < 3; i++) {
    px = x0 + f * L * (0.3 + i * 0.25);
    py = y0 - Math.abs(Math.sin(globalT * 20 + i * 2.1)) * L * 0.1;
    artBlob(c, px, py, L * 0.05, L * 0.04, '#ffffff', { line: false, alpha: fade * 0.7 });
  }
  c.restore();
}
function drawFlyDragonRider(c) {
  var s = flyS(), x = princess.x - camX, y = princess.y, tilt = Math.max(-0.35, Math.min(0.35, princess.vy / viewH * 0.5)) * princess.facing;
  var flap = Math.sin(fly.flap);
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) c.globalAlpha = 0.45;
  drawBabyDragon(c, 0, s * 0.95, s, FLY_DRAGON, { mouth: fly.bursts.length ? 0.9 : 0, flap: flap, look: 0.3, blink: (globalT % 4.1) < 0.12, facing: -princess.facing, noShadow: true });
  c.save();
  c.scale(princess.facing, 1);
  drawRiderPrincess(c, s * 0.1, -s * 0.75, s * 0.032, globalT, true);
  c.restore();
  c.restore();
  c.globalAlpha = 1;
}
function drawFlyFlameIcon(c, x, y, s, on) {
  c.globalAlpha = on ? 1 : 0.28;
  artBlob(c, x, y + s * 0.2, s * 0.7, s * 0.85, '#ff6a2a', { lineColor: '#a83a10', line: on ? undefined : false });
  artBlob(c, x + s * 0.05, y + s * 0.4, s * 0.38, s * 0.5, '#ffd24f', { line: false });
  c.globalAlpha = 1;
}
function drawFlyTorchIcon(c, x, y, s) {
  artLimb(c, x, y + s * 1.1, x, y, s * 0.3, '#5a3a2a', '#2a1a10');
  artBlob(c, x, y - s * 0.6, s * 0.5, s * 0.7, '#ff6a2a', { line: false });
  artBlob(c, x, y - s * 0.5, s * 0.25, s * 0.35, '#ffd24f', { line: false });
}

function drawDragonfly() {
  var i, s = flyS(), b, k, t, c = ctx, hs, lavaY = flyLavaY(), x, target = null;
  if (!beginPlayWorld()) return;
  // Laavan hehku ja kuplat
  var lg = c.createLinearGradient(0, lavaY - viewH * 0.14, 0, lavaY);
  lg.addColorStop(0, 'rgba(255,140,50,0)');
  lg.addColorStop(1, 'rgba(255,160,60,' + (0.28 + Math.sin(fly.lavaT * 2.2) * 0.06) + ')');
  c.fillStyle = lg;
  c.fillRect(0, lavaY - viewH * 0.14, viewW, viewH * 0.14);
  for (i = 0; i < 8; i++) {
    k = (fly.lavaT * 0.35 + i * 0.13) % 1;
    x = ((i * 0.131 + 0.05) * viewW * 2 - camX * 0.9) % (viewW + 40) - 20;
    if (x < 0) x += viewW + 40;
    artBlob(c, x, lavaY + viewH * 0.03 - k * viewH * 0.02, viewH * 0.012 * (1 - k * 0.5), viewH * 0.008, '#ffe27a', { line: false, alpha: 1 - k });
  }
  for (i = 0; i < tasks.length; i++) drawTaskArch(c, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(c, checkpoints[i]);
  for (i = 0; i < fly.torches.length; i++) drawFlyTorch(c, fly.torches[i]);
  // Rovio
  b = fly.brazier;
  x = b.x - camX;
  if (x > -viewH * 0.3 && x < viewW + viewH * 0.3) {
    var ready = flyBrazierReady();
    artBlob(c, x, b.y, s * 1.1, s * 0.5, '#5a3a3a', { shadeTo: '#2a1a1a', lineColor: '#1a0a0a', hi: 0.1 });
    for (i = 0; i < 4; i++) artLimb(c, x - s * 0.8 + i * s * 0.53, b.y - s * 0.1, x - s * 0.5 + i * s * 0.4, b.y - s * 0.75, s * 0.18, '#6a4a2a', '#2a1a10');
    if (b.lit) {
      artGlow(c, x, b.y - s * 1.2, s * 5, '#ffb347', 0.5);
      for (i = 0; i < 4; i++) {
        k = Math.sin(globalT * 8 + i * 1.9);
        artBlob(c, x + k * s * 0.25 + (i - 1.5) * s * 0.25, b.y - s * (1.2 + i * 0.4) - Math.abs(k) * s * 0.3, s * (0.8 - i * 0.16), s * (1.0 - i * 0.2), i < 1 ? '#ff6a2a' : (i < 3 ? '#ffb347' : '#fff0a0'), { line: false });
      }
    } else if (ready) {
      artGlow(c, x, b.y - s * 0.8, s * 3, '#ffd24f', 0.35 + Math.sin(globalT * 5) * 0.15);
      c.strokeStyle = 'rgba(255,240,160,' + (0.5 + Math.sin(globalT * 6) * 0.3) + ')';
      c.lineWidth = Math.max(2, s * 0.08);
      c.beginPath(); c.arc(x, b.y - s * 0.8, s * 1.4, 0, Math.PI * 2); c.stroke();
    }
  }
  for (i = 0; i < fly.gates.length; i++) drawFlyGate(c, fly.gates[i]);
  for (i = 0; i < fly.berries.length; i++) {
    t = fly.berries[i];
    if (t.collected) continue;
    drawBerry(c, t.x - camX, t.y + Math.sin(t.phase) * viewH * 0.015, viewH * 0.024, Math.sin(t.phase * 0.5) * 0.2, true);
  }
  for (i = 0; i < fly.clouds.length; i++) drawFlyCloud(c, fly.clouds[i]);
  drawFlyDragonRider(c);
  for (i = 0; i < fly.bursts.length; i++) drawFlyFire(c, fly.bursts[i]);
  for (i = 0; i < fly.steam.length; i++) {
    t = fly.steam[i];
    c.fillStyle = 'rgba(240,248,255,' + (0.6 * (1 - t.t / t.life)) + ')';
    c.beginPath(); c.arc(t.x - camX, t.y, t.r * (1 + t.t), 0, Math.PI * 2); c.fill();
  }
  drawParticlesLayer(c);
  // Opastenuoli: seuraava sammunut soihtu tai rovio
  if (!celebrating) {
    for (i = 0; i < fly.torches.length; i++) if (!fly.torches[i].lit) { target = fly.torches[i].x; break; }
    if (target === null && !fly.brazier.lit) target = fly.brazier.x;
    if (target !== null) drawEdgeArrow(c, target);
  }
  endPlayWorld();
  drawPickupHud(c, fly.torches.length, function (i2) { return fly.torches[i2] && fly.torches[i2].lit; }, drawFlyTorchIcon);
  hs = viewH * 0.022;
  for (i = 0; i < FLY_FLAMES; i++) drawFlyFlameIcon(c, hudX() + hs * 1.6 + i * hs * 2.4, hs * 1.4 + hs * 4.6, hs * 0.9, i < fly.flames);
  drawHearts(c);
  drawTaskOverlay(c);
}

HUB_ICONS.dragonfly = function (c, x, y, s) {
  artBlob(c, x, y + s * 0.02, s * 0.11, s * 0.14, '#ff6a2a', { line: false });
  artBlob(c, x, y + s * 0.05, s * 0.06, s * 0.08, '#ffd24f', { line: false });
  drawDragonHead(c, x - s * 0.13, y - s * 0.04, s * 0.11, '#7fe0c8');
};
