'use strict';

// Linnan finaali: Myrskynoita on vienyt puput linnan saliin.
// 1) Noita: suojapallot välähtävät järjestyksessä — ammu ne sauvalla samassa
//    järjestyksessä (3 kierrosta, sarja pitenee). Salamat pakottavat liikkumaan.
// 2) Häkit: kolme pupua vapautuu tehtävillä.
// 3) Juhla kaikkien ystävien kanssa.

var finale = { phase: 'boss', t: 0, arenaW: 0 };
var boss = {
  x: 0, y: 0, dir: 1, t: 0, round: 0, mode: 'show', seq: [], showIdx: -1, timer: 0,
  litOrb: -1, litT: 0, inputIdx: 0, shakeT: 0, boltT: 3, bolt: null, gone: 0
};
var BOSS_ORBS = 3;
var BOSS_ROUNDS = 3;
var finaleBunnies = [];
var finaleFriends = [];

function initFinale() {
  var i;
  setupRunLevel(9, '#2b1040');
  finale.phase = 'boss';
  finale.t = 0;
  finale.arenaW = Math.min(worldW, viewW * 1.4);
  platforms = [
    { kind: 'ground', x: 0, y: groundTop, w: finale.arenaW },
    { kind: 'ledge', x: finale.arenaW * 0.12, y: groundTop - viewH * 0.2, w: finale.arenaW * 0.14 },
    { kind: 'ledge', x: finale.arenaW * 0.72, y: groundTop - viewH * 0.2, w: finale.arenaW * 0.14 }
  ];
  tasks = [];
  checkpoints = [];
  frogs = [];
  boss.x = finale.arenaW * 0.5;
  boss.y = viewH * 0.3;
  boss.dir = 1;
  boss.t = 0;
  boss.round = 0;
  boss.boltT = 3.5;
  boss.bolt = null;
  boss.gone = 0;
  boss.shakeT = 0;
  bossStartSequence();
  finaleBunnies = [];
  finaleFriends = [];
  resetPrincess(finale.arenaW * 0.2, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(147, 0, 0.5, 'sawtooth', 0.25);
  playNote(196, 0.3, 0.5, 'sawtooth', 0.25);
  playNote(233, 0.6, 0.8, 'triangle', 0.3);
}

function respawnFinale() {
  resetPrincess(checkpoint.x, groundTop);
  boss.bolt = null;
  boss.boltT = 3.5;
  if (finale.phase === 'boss' && boss.mode === 'input') bossStartSequence();
}

function resizeFinale(ratio) {
  princess.x *= ratio;
  finale.arenaW = Math.min(worldW, viewW * 1.4);
  platforms[0].w = finale.arenaW;
  boss.x *= ratio;
  var i;
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * finale.arenaW;
  for (i = 0; i < finaleBunnies.length; i++) finaleBunnies[i].x *= ratio;
}

function bossStartSequence() {
  var i;
  boss.mode = 'show';
  boss.seq = [];
  for (i = 0; i < 3 + boss.round; i++) boss.seq.push(Math.floor(Math.random() * BOSS_ORBS));
  boss.showIdx = -1;
  boss.timer = -0.8;
  boss.litOrb = -1;
  boss.inputIdx = 0;
}

function bossOrbPos(i) {
  // Hidas kiertoliike, jotta sauvan kipinä ehtii osua tähdättyyn palloon
  var a = boss.t * 0.45 + i * Math.PI * 2 / BOSS_ORBS;
  return {
    x: boss.x + Math.cos(a) * viewH * 0.16,
    y: boss.y + Math.sin(a) * viewH * 0.08 + viewH * 0.02
  };
}

function bossOrbHit(i) {
  if (boss.mode !== 'input') {
    playNote(440, 0, 0.08, 'sine', 0.15);
    return;
  }
  boss.litOrb = i;
  boss.litT = 0.35;
  if (i === boss.seq[boss.inputIdx]) {
    playNote(ORB_NOTES[i], 0, 0.3, 'triangle', 0.5);
    boss.inputIdx += 1;
    if (boss.inputIdx >= boss.seq.length) {
      boss.mode = 'hit';
      boss.timer = 0;
      boss.shakeT = 1.2;
      var p = bossOrbPos(0);
      spawnSparkles(boss.x, boss.y, 30, '#ffe27a');
      spawnSparkles(p.x, p.y, 12, '#c9a0ff');
      playNote(523, 0, 0.2, 'triangle', 0.45);
      playNote(784, 0.15, 0.25, 'triangle', 0.45);
      playNote(1047, 0.3, 0.5, 'triangle', 0.5);
    }
  } else {
    // Väärä pallo: noita nauraa ja heittää sammakon, sarja näytetään uudelleen
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    playNote(196, 0.15, 0.12, 'square', 0.2);
    playNote(233, 0.27, 0.12, 'square', 0.2);
    frogs.push({ x: boss.x, y: boss.y + viewH * 0.06, vx: (princess.x > boss.x ? 1 : -1) * viewW * 0.12, vy: viewH * 0.1, bounces: 0, t: 0 });
    bossStartSequence();
    boss.timer = -1.2;
  }
}

function bossDefeated() {
  var i;
  boss.mode = 'gone';
  boss.gone = 0;
  finale.phase = 'cages';
  finale.t = 0;
  tasks = [
    makeTask(0.30, 'minus'),
    makeTask(0.55, 'pattern'),
    makeTask(0.80, 'memory', { seqLen: 4, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) {
    tasks[i].x = tasks[i].fx * finale.arenaW;
    tasks[i].cage = true;
  }
  finaleBunnies = [];
  for (i = 0; i < tasks.length; i++) {
    finaleBunnies.push({ x: tasks[i].x, y: groundTop, freed: false, hopT: i, earT: i });
  }
  soundFanfare();
}

function updateFinale(dt) {
  var i;
  finale.t += dt;
  updateTasks(dt);
  var busy = puzzleBusy();

  platformerStep(dt, { runSp: viewW * 0.24, blockTasks: finale.phase === 'cages' });
  princess.x = Math.min(princess.x, finale.arenaW - viewH * 0.05);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, finale.arenaW - viewW));

  // Noita
  boss.t += dt;
  if (finale.phase === 'boss') {
    boss.x = finale.arenaW * 0.5 + Math.sin(boss.t * 0.5) * finale.arenaW * 0.15;
    boss.dir = Math.cos(boss.t * 0.5) > 0 ? 1 : -1;
    boss.y = viewH * 0.3 + Math.sin(boss.t * 1.7) * viewH * 0.02;
    if (boss.mode === 'show') {
      boss.timer += dt;
      if (boss.timer >= 0) {
        var stepLen = 0.75;
        var step = Math.floor(boss.timer / stepLen);
        if (step < boss.seq.length) {
          var inStep = boss.timer - step * stepLen;
          boss.litOrb = inStep < 0.5 ? boss.seq[step] : -1;
          if (boss.showIdx !== step && inStep < 0.5) {
            boss.showIdx = step;
            playNote(ORB_NOTES[boss.seq[step]], 0, 0.35, 'triangle', 0.4);
          }
        } else {
          boss.litOrb = -1;
          boss.mode = 'input';
          boss.inputIdx = 0;
          playNote(880, 0, 0.1, 'triangle', 0.25);
        }
      }
    } else if (boss.mode === 'hit') {
      boss.timer += dt;
      if (Math.random() < dt * 20) spawnSparkles(boss.x + (Math.random() - 0.5) * viewH * 0.2, boss.y + (Math.random() - 0.5) * viewH * 0.1, 3, '#ffe27a');
      if (boss.timer > 1.3) {
        boss.round += 1;
        if (boss.round >= BOSS_ROUNDS) bossDefeated();
        else bossStartSequence();
      }
    }
    if (boss.litT > 0) boss.litT -= dt;
    if (boss.shakeT > 0) boss.shakeT -= dt;

    // Salama: varoitus maassa, sitten isku. Väistä juoksemalla.
    if (boss.mode === 'show' || boss.mode === 'input') {
      boss.boltT -= dt;
      if (boss.boltT <= 0 && !boss.bolt) {
        boss.bolt = { x: princess.x, t: 0 };
        boss.boltT = 3.0 + Math.random() * 1.2;
        playNote(120, 0, 0.3, 'sawtooth', 0.15);
      }
    }
    if (boss.bolt) {
      boss.bolt.t += dt;
      var boltX = boss.bolt.x;
      if (boss.bolt.t > 0.85 && boss.bolt.t < 1.1) {
        if (Math.abs(princess.x - boltX) < viewH * 0.07 && princess.y > groundTop - viewH * 0.12) {
          // loseHeart voi palauttaa lyhdylle ja nollata salaman (respawnFinale)
          if (loseHeart()) {
            princess.knockVx = (princess.x < boltX ? -1 : 1) * viewW * 0.2;
            spawnSparkles(princess.x, princess.y - viewH * 0.08, 12, '#ffe94f');
          }
        }
      }
      if (boss.bolt && boss.bolt.t > 1.1) boss.bolt = null;
    }

    // Sauvan kipinät osuvat palloihin
    var targets = [];
    for (i = 0; i < BOSS_ORBS; i++) {
      var op = bossOrbPos(i);
      targets.push({ x: op.x, y: op.y, idx: i });
    }
    updateSparksAgainst(dt, targets, viewH * 0.065, function (tg) { bossOrbHit(tg.idx); });
  } else {
    if (boss.mode === 'gone') {
      boss.gone += dt;
      boss.x += boss.dir * viewW * 0.3 * dt;
      boss.y -= viewH * 0.25 * dt;
    }
    // Häkit: avattu tehtävä vapauttaa pupun
    for (i = 0; i < tasks.length; i++) {
      if (tasks[i].opened && !finaleBunnies[i].freed) {
        finaleBunnies[i].freed = true;
        soundBunny();
        spawnSparkles(tasks[i].x, groundTop - viewH * 0.1, 16, '#ff9ec6');
      }
    }
    for (i = 0; i < finaleBunnies.length; i++) {
      var fb = finaleBunnies[i];
      fb.earT += dt * 4;
      if (fb.freed) {
        fb.hopT += dt * 8;
        var lead = princess.x - princess.facing * viewH * (0.12 + i * 0.07);
        fb.x += (lead - fb.x) * Math.min(1, dt * 3);
      }
    }
    var freed = 0;
    for (i = 0; i < finaleBunnies.length; i++) if (finaleBunnies[i].freed) freed++;
    if (finale.phase === 'cages' && freed === finaleBunnies.length && !celebrating) {
      finale.phase = 'party';
      finaleFriends = [
        { kind: 'unicorn', x: finale.arenaW * 0.62 }, { kind: 'owl', x: finale.arenaW * 0.36 },
        { kind: 'frog', x: finale.arenaW * 0.46 }, { kind: 'sheep', x: finale.arenaW * 0.72 },
        { kind: 'fox', x: finale.arenaW * 0.82 }
      ];
      startCelebration();
    }
    for (i = 0; i < sparks.length; i++) { sparks[i].age += dt; sparks[i].x += sparks[i].vx * dt; sparks[i].y += sparks[i].vy * dt; }
    for (i = sparks.length - 1; i >= 0; i--) if (sparks[i].age >= sparks[i].life) sparks.splice(i, 1);
  }

  // Sammakot (vääristä vastauksista)
  for (i = frogs.length - 1; i >= 0; i--) {
    var fr = frogs[i];
    if (busy) continue;
    fr.t += dt;
    fr.vy += viewH * 1.2 * dt;
    fr.x += fr.vx * dt;
    fr.y += fr.vy * dt;
    if (fr.y >= groundTop) {
      fr.y = groundTop;
      fr.bounces += 1;
      if (fr.bounces > 3) { spawnSparkles(fr.x, fr.y, 8, '#9fe08a'); frogs.splice(i, 1); continue; }
      fr.vy = -viewH * 0.5;
      fr.vx = (princess.x > fr.x ? 1 : -1) * viewW * 0.13;
    }
    if (Math.abs(fr.x - princess.x) < viewH * 0.06 && Math.abs(fr.y - (princess.y - viewH * 0.05)) < viewH * 0.1 && !celebrating) {
      frogs.splice(i, 1);
      loseHeart();
    }
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderFinaleBg(b, w, h) {
  var i, x;
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#2b1040');
  wall.addColorStop(0.7, '#4a2a6e');
  wall.addColorStop(1, '#3a2058');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  // Kivimuuri
  b.strokeStyle = 'rgba(255,255,255,0.06)';
  b.lineWidth = 2;
  for (i = 0; i < 12; i++) {
    b.beginPath(); b.moveTo(0, h * 0.06 * i); b.lineTo(w, h * 0.06 * i); b.stroke();
  }
  // Ikkunat yötaivaaseen
  for (i = 0; i < 6; i++) {
    x = w * (0.08 + i * 0.16);
    var wg = b.createLinearGradient(0, h * 0.12, 0, h * 0.42);
    wg.addColorStop(0, '#0b0630');
    wg.addColorStop(1, '#2a1860');
    b.fillStyle = wg;
    b.beginPath();
    b.moveTo(x - h * 0.05, h * 0.42);
    b.lineTo(x - h * 0.05, h * 0.2);
    b.arc(x, h * 0.2, h * 0.05, Math.PI, 0);
    b.lineTo(x + h * 0.05, h * 0.42);
    b.closePath();
    b.fill();
    b.fillStyle = '#fff6c8';
    b.beginPath(); b.arc(x + h * 0.015, h * 0.24, h * 0.006, 0, Math.PI * 2); b.fill();
    b.beginPath(); b.arc(x - h * 0.02, h * 0.31, h * 0.005, 0, Math.PI * 2); b.fill();
  }
  // Liput
  for (i = 0; i < 7; i++) {
    x = w * (0.02 + i * 0.16);
    b.fillStyle = i % 2 ? '#ff6fb0' : '#ffd24f';
    b.beginPath();
    b.moveTo(x - h * 0.03, h * 0.02); b.lineTo(x + h * 0.03, h * 0.02); b.lineTo(x + h * 0.03, h * 0.12); b.lineTo(x, h * 0.16); b.lineTo(x - h * 0.03, h * 0.12);
    b.closePath(); b.fill();
  }
  // Lattia
  var floor = b.createLinearGradient(0, groundTop, 0, h);
  floor.addColorStop(0, '#8a78a8');
  floor.addColorStop(1, '#4e3f68');
  b.fillStyle = floor;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(0,0,0,0.12)';
  for (x = 0; x < w; x += h * 0.12) b.fillRect(x, groundTop, 2, h - groundTop);
  // Punainen matto
  b.fillStyle = '#c0304e';
  b.fillRect(0, groundTop + 4, w, h * 0.06);
  b.fillStyle = '#ffd24f';
  b.fillRect(0, groundTop + 4, w, 3);
  b.fillRect(0, groundTop + 4 + h * 0.06 - 3, w, 3);
  // Kielekkeet
  for (i = 1; i < platforms.length; i++) {
    drawStoneSlab(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05, h);
  }
}

function drawBoss(c) {
  var x = boss.x - camX, y = boss.y, s = viewH * 0.05;
  var shake = boss.shakeT > 0 ? Math.sin(globalT * 40) * s * 0.15 : 0;
  var i;
  if (boss.mode !== 'gone' || boss.gone < 4) {
    c.save();
    c.translate(x + shake, y);
    c.scale(boss.dir, 1);
    // Luuta
    c.strokeStyle = '#8a5a30';
    c.lineWidth = s * 0.18;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 1.6, s * 0.9); c.lineTo(s * 1.1, s * 0.5); c.stroke();
    c.fillStyle = '#c9a25a';
    c.beginPath();
    c.moveTo(-s * 1.5, s * 0.6); c.lineTo(-s * 2.4, s * 0.55); c.lineTo(-s * 2.5, s * 1.3); c.lineTo(-s * 1.6, s * 1.15);
    c.closePath(); c.fill();
    c.fillStyle = '#5a2d82';
    c.beginPath();
    c.moveTo(0, -s * 0.9);
    c.quadraticCurveTo(-s * 1.3, s * 0.2, -s * 1.0, s * 0.8);
    c.lineTo(s * 0.8, s * 0.8);
    c.quadraticCurveTo(s * 0.9, 0, 0, -s * 0.9);
    c.closePath(); c.fill();
    c.fillStyle = '#b8e0a0';
    c.beginPath(); c.arc(0, -s * 1.1, s * 0.45, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.beginPath(); c.arc(s * 0.16, -s * 1.15, s * 0.08, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#333';
    c.lineWidth = s * 0.06;
    c.beginPath(); c.arc(s * 0.1, -s * 0.9, s * 0.15, Math.PI * 1.2, Math.PI * 1.9); c.stroke();
    c.fillStyle = '#2e1a4a';
    c.beginPath();
    c.moveTo(-s * 0.75, -s * 1.38); c.lineTo(s * 0.75, -s * 1.38); c.lineTo(s * 0.1, -s * 2.7);
    c.closePath(); c.fill();
    c.fillRect(-s * 0.9, -s * 1.48, s * 1.8, s * 0.15);
    c.fillStyle = '#ffe27a';
    c.fillRect(-s * 0.32, -s * 1.63, s * 0.64, s * 0.15);
    c.restore();
  }
  if (finale.phase !== 'boss') return;
  // Suojakilvet: jäljellä olevat kierrokset renkaina
  for (i = boss.round; i < BOSS_ROUNDS; i++) {
    c.strokeStyle = 'rgba(200,160,255,' + (0.35 - (i - boss.round) * 0.08) + ')';
    c.lineWidth = viewH * 0.006;
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y + viewH * 0.02, viewH * (0.19 + (i - boss.round) * 0.03), viewH * (0.11 + (i - boss.round) * 0.02), 0, 0, Math.PI * 2);
    else c.arc(x, y, viewH * 0.15, 0, Math.PI * 2);
    c.stroke();
  }
  // Suojapallot
  for (i = 0; i < BOSS_ORBS; i++) {
    var op = bossOrbPos(i);
    var ox = op.x - camX, oy = op.y;
    var lit = boss.litOrb === i && (boss.mode === 'show' || boss.litT > 0);
    var r = viewH * 0.036 * (lit ? 1.3 : 1);
    if (lit) {
      var g = c.createRadialGradient(ox, oy, r * 0.3, ox, oy, r * 2.2);
      g.addColorStop(0, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(ox, oy, r * 2.2, 0, Math.PI * 2); c.fill();
    }
    var og = c.createRadialGradient(ox - r * 0.3, oy - r * 0.3, r * 0.1, ox, oy, r);
    og.addColorStop(0, lit ? '#ffffff' : 'rgba(255,255,255,0.6)');
    og.addColorStop(0.4, ORB_COLORS[i]);
    og.addColorStop(1, ORB_COLORS[i]);
    c.fillStyle = og;
    c.beginPath(); c.arc(ox, oy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = viewH * 0.005;
    c.stroke();
  }
  // Loitsun edistyminen
  var dotR = viewH * 0.011;
  for (i = 0; i < boss.seq.length; i++) {
    c.fillStyle = (boss.mode === 'input' && i < boss.inputIdx) ? '#ffe27a' : (boss.mode === 'show' && i <= boss.showIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)');
    c.beginPath();
    c.arc(x + (i - (boss.seq.length - 1) / 2) * dotR * 3.6, y - viewH * 0.18, dotR, 0, Math.PI * 2);
    c.fill();
  }
}

function drawBolt(c) {
  if (!boss.bolt) return;
  var x = boss.bolt.x - camX;
  var t = boss.bolt.t;
  if (t <= 0.85) {
    var a = 0.25 + Math.sin(globalT * 25) * 0.15;
    c.fillStyle = 'rgba(255,240,120,' + a + ')';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, groundTop + 4, viewH * 0.08, viewH * 0.02, 0, 0, Math.PI * 2);
    else c.arc(x, groundTop, viewH * 0.05, 0, Math.PI * 2);
    c.fill();
    return;
  }
  c.strokeStyle = '#fff6a0';
  c.lineWidth = viewH * 0.012;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x + viewH * 0.02, 0);
  c.lineTo(x - viewH * 0.02, groundTop * 0.3);
  c.lineTo(x + viewH * 0.03, groundTop * 0.55);
  c.lineTo(x - viewH * 0.01, groundTop * 0.8);
  c.lineTo(x, groundTop);
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(0, 0, viewW, viewH);
}

function drawCage(c, t, i) {
  var x = t.x - camX, s = viewH * 0.06;
  var open = t.opened;
  var fb = finaleBunnies[i];
  if (!open && fb) {
    drawBunny(c, x, groundTop, s * 0.9, Math.abs(Math.sin(globalT * 3 + i)) * 4, fb.earT, false);
  }
  c.strokeStyle = open ? 'rgba(200,180,220,0.4)' : '#c9b8e0';
  c.lineWidth = Math.max(2, s * 0.08);
  var cw = s * 2.2, ch = s * 2.4;
  var lift = open ? -ch * 0.9 : 0;
  c.beginPath();
  c.moveTo(x - cw / 2, groundTop + lift);
  c.lineTo(x - cw / 2, groundTop - ch + lift);
  c.arc(x, groundTop - ch + lift, cw / 2, Math.PI, 0);
  c.lineTo(x + cw / 2, groundTop + lift);
  c.stroke();
  var k;
  for (k = 1; k < 5; k++) {
    var bx = x - cw / 2 + cw * k / 5;
    c.beginPath(); c.moveTo(bx, groundTop + lift); c.lineTo(bx, groundTop - ch * 0.75 + lift); c.stroke();
  }
  if (!open) {
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.arc(x, groundTop - ch * 0.4, s * 0.22, 0, Math.PI * 2); c.fill();
  }
}

function drawFriend(c, fr) {
  var x = fr.x - camX;
  var bounce = Math.abs(Math.sin(globalT * 5 + fr.x)) * viewH * 0.02;
  if (fr.kind === 'unicorn') {
    drawUnicorn(c, x, groundTop - bounce, (viewH / 800) * 1.3, -1, globalT * 8, true, globalT);
  } else if (fr.kind === 'owl') {
    var ox = owl.x, oy = owl.y, oa = owl.awake;
    owl.x = fr.x + camX; owl.y = groundTop - viewH * 0.05 - bounce; owl.awake = true; owl.flyT = 0;
    drawOwl(c);
    owl.x = ox; owl.y = oy; owl.awake = oa;
  } else if (fr.kind === 'frog') {
    var fx = frog.x, fy = frog.y, fa = frog.awake;
    frog.x = fr.x + camX; frog.y = groundTop - bounce; frog.awake = true; frog.hopT = 0;
    drawFrog(c);
    frog.x = fx; frog.y = fy; frog.awake = fa;
  } else if (fr.kind === 'sheep') {
    var sx = sheep.x, sy = sheep.y;
    sheep.x = fr.x + camX; sheep.y = groundTop - viewH * 0.06 - bounce;
    drawSheep(c);
    sheep.x = sx; sheep.y = sy;
  } else if (fr.kind === 'fox') {
    var fxx = fox.x, fd = fox.dir;
    fox.x = fr.x + camX; fox.dir = -1;
    drawFox(c);
    fox.x = fxx; fox.dir = fd;
  }
}

function drawFinale() {
  var i;
  if (!drawWorldBg()) return;
  drawBolt(ctx);
  if (finale.phase !== 'boss') {
    for (i = 0; i < tasks.length; i++) drawCage(ctx, tasks[i], i);
    for (i = 0; i < finaleBunnies.length; i++) {
      if (finaleBunnies[i].freed) {
        drawBunny(ctx, finaleBunnies[i].x - camX, groundTop, viewH * 0.045, Math.abs(Math.sin(finaleBunnies[i].hopT)) * viewH * 0.03, finaleBunnies[i].earT, false);
      }
    }
  }
  if (finale.phase === 'party') {
    for (i = 0; i < finaleFriends.length; i++) drawFriend(ctx, finaleFriends[i]);
  }
  drawBoss(ctx);
  for (i = 0; i < frogs.length; i++) drawFrogProjectile(ctx, frogs[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawSparks(ctx);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  // HUD: vapautetut puput
  if (finale.phase !== 'boss') {
    drawPickupHud(ctx, finaleBunnies.length, function (i2) { return finaleBunnies[i2] && finaleBunnies[i2].freed; },
      function (c, x, y, s) { drawBunny(c, x, y + s * 0.4, s * 1.4, 0, 0, true); });
  }
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
