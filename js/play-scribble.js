'use strict';

// Sotkumörkö: Taikakynän saaren vartija. Portit aukeavat, kun piirrät portin
// näyttämän muodon (ympyrä, kolmio, neliö), ja lopuksi mörkö rauhoitetaan
// piirtämällä salama (siksak). Mörkö heittää tahroja, jotka vangitaan
// ympyrällä kun ne vielä leijuvat. Sydämet käytössä. Ydin: pen-core.js.

var scGround = [[0.0, 0.18], [0.22, 0.46], [0.50, 0.68], [0.72, 1.0]];
var scGates = [];
var scGateDefs = [{ fx: 0.30, shape: 'circle' }, { fx: 0.56, shape: 'triangle' }, { fx: 0.78, shape: 'square' }];
var scMonster = { fx: 0.90, x: 0, y: 0, calm: false, throwT: 3, phase: 0, hitT: 0 };
var scBlots = [];
var scDoor = { fx: 0.965, x: 0, open: false };
var scBottles = [];
var scBottleDefs = [{ fx: 0.08, fy: 0.10 }, { fx: 0.20, fy: 0.34 }, { fx: 0.48, fy: 0.34 }, { fx: 0.70, fy: 0.34 }];
var scShake = { t: 0, gate: null };
var SC_SHAPES = ['circle', 'triangle', 'square', 'zigzag'];

function layoutScribble() {
  var i, seg;
  platforms = [];
  for (i = 0; i < scGround.length; i++) {
    seg = scGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: groundTop, w: (seg[1] - seg[0]) * worldW });
  }
  for (i = 0; i < scGates.length; i++) scGates[i].x = scGateDefs[i].fx * worldW;
  scMonster.x = scMonster.fx * worldW;
  scMonster.y = viewH * 0.3;
  scDoor.x = scDoor.fx * worldW;
  for (i = 0; i < scBottles.length; i++) {
    scBottles[i].ax = scBottleDefs[i].fx * worldW;
    scBottles[i].ay = groundTop - scBottleDefs[i].fy * viewH;
  }
}

function initScribble() {
  var i;
  setupRunLevel(20, '#f2ecf7');
  penCoreReset();
  penHooks.onStroke = scribbleOnStroke;
  penHooks.bubbleTargets = function () {
    var res = [], k;
    for (k = 0; k < scBlots.length; k++) if (scBlots[k].state === 'hover') res.push(scBlots[k]);
    return res;
  };
  scGates = [];
  for (i = 0; i < scGateDefs.length; i++) scGates.push({ x: 0, shape: scGateDefs[i].shape, open: false, glow: 0 });
  scBottles = [];
  for (i = 0; i < scBottleDefs.length; i++) scBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  scBlots = [];
  scMonster.calm = false;
  scMonster.throwT = 3;
  scMonster.hitT = 0;
  scDoor.open = false;
  scShake.t = 0;
  layoutScribble();
  tasks = [makeTask(0.40, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.34, 0.60, 0.82]);
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(294, 0, 0.35, 'sine', 0.3);
  playNote(370, 0.18, 0.35, 'triangle', 0.3);
  playNote(440, 0.36, 0.45, 'triangle', 0.3);
}

function respawnScribble() {
  resetPrincess(checkpoint.x, groundTop);
  princess.facing = penDir = 1;
  penStun = 0;
  scBlots = [];
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeScribble(ratio) {
  var i;
  princess.x *= ratio;
  layoutScribble();
  for (i = 0; i < scBlots.length; i++) scBlots[i].x *= ratio;
  penCoreResize(ratio);
}

function scFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var rx = penPitEdgeX(scGround, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, groundTop);
    penStun = 0;
  }
}

// Seuraava avaamaton portti; kaikkien jälkeen mörkö (salama)
function scNextGate() {
  var i;
  for (i = 0; i < scGates.length; i++) if (!scGates[i].open) return scGates[i];
  if (!scMonster.calm) return { shape: 'zigzag', x: scMonster.x, monster: true };
  return null;
}

function scOpenGate(gate, s) {
  var i;
  // Onnistunut taikamuoto antaa musteensa takaisin
  if (s) penInk = Math.min(penInkMax, penInk + s.len);
  if (gate.monster) {
    scMonster.calm = true;
    scMonster.hitT = 1.2;
    scBlots = [];
    scDoor.open = true;
    spawnSparkles(scMonster.x, scMonster.y, 30, '#ffe27a');
    playNote(523, 0, 0.2, 'triangle', 0.4);
    playNote(659, 0.15, 0.2, 'triangle', 0.4);
    playNote(784, 0.3, 0.2, 'triangle', 0.4);
    playNote(1047, 0.45, 0.6, 'triangle', 0.45);
    return;
  }
  gate.open = true;
  gate.glow = 1.5;
  for (i = 0; i < scGates.length; i++) if (scGates[i] === gate) scGates[i].open = true;
  spawnSparkles(gate.x, groundTop - viewH * 0.25, 20, '#ffe27a');
  playNote(659, 0, 0.15, 'sine', 0.35);
  playNote(880, 0.1, 0.2, 'sine', 0.35);
  playNote(1175, 0.2, 0.35, 'sine', 0.35);
}

// Viiva päättyi: muoto avaa portin, ympyrä vangitsee tahran, muu viiva on silta
function scribbleOnStroke(s) {
  var kind = penClassify(s);
  var gate = scNextGate();
  if (kind === 'line') return false;
  if (kind === 'circle' && penLoopTargets(s).length > 0) return false;
  if (gate && kind === gate.shape && princess.x > gate.x - viewW * 0.7) {
    scOpenGate(gate, s);
    return true;
  }
  if (kind === 'circle') return false;
  if (gate) {
    scShake.t = 0.6;
    scShake.gate = gate;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    spawnSparkles(s.pts[0].x, s.pts[0].y, 6, '#9aa0b8');
  }
  return kind !== 'zigzag';
}

function collectScBottle(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(800, 0, 0.2, 'sine', 0.35);
  playNote(1200, 0.08, 0.25, 'sine', 0.3);
}

function updateScribble(dt) {
  var i, gate = scNextGate();
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);
  if (scShake.t > 0) scShake.t -= dt;
  for (i = 0; i < scGates.length; i++) if (scGates[i].glow > 0) scGates[i].glow -= dt;
  if (scMonster.hitT > 0) scMonster.hitT -= dt;
  scMonster.phase += dt;
  scMonster.y = viewH * 0.3 + Math.sin(scMonster.phase * 1.5) * viewH * 0.02;

  // Seinä: avaamaton portti tai mörkö pysäyttää
  var wallX;
  if (gate && !gate.monster) wallX = gate.x - viewH * 0.09;
  else if (gate && gate.monster) wallX = scMonster.x - viewH * 0.3;
  if (!busy && !celebrating) penPrincessStep(dt, { onFall: scFell, wallX: wallX });
  blockPrincessAtTasks();

  // Mörkö heittää tahroja, jotka leijuvat hetken (vangittavia) ja sitten putoavat
  if (!scMonster.calm && !busy && !celebrating && princess.x > worldW * 0.3) {
    scMonster.throwT -= dt;
    if (scMonster.throwT <= 0) {
      scMonster.throwT = 2.4 + Math.random() * 1.2;
      var bx = princess.x + (Math.random() - 0.5) * viewW * 0.3;
      bx = Math.min(Math.max(bx, viewH * 0.1), worldW - viewH * 0.1);
      scBlots.push({ x: bx, y: viewH * 0.22, vy: 0, state: 'hover', t: 1.2, bubbleT: 0, wob: Math.random() * 6 });
      playNote(150, 0, 0.2, 'sawtooth', 0.08);
    }
  }
  for (i = scBlots.length - 1; i >= 0; i--) {
    var bl = scBlots[i];
    if (busy) continue;
    if (bl.bubbleT > 0) {
      spawnSparkles(bl.x, bl.y, 12, '#c9f0ff');
      playNote(1047, 0, 0.12, 'sine', 0.25);
      scBlots.splice(i, 1);
      continue;
    }
    if (bl.state === 'hover') {
      bl.t -= dt;
      bl.wob += dt * 4;
      if (bl.t <= 0) { bl.state = 'fall'; bl.vy = viewH * 0.2; }
      continue;
    }
    bl.vy += viewH * 1.1 * dt;
    var oldY = bl.y, newY = bl.y + bl.vy * dt;
    var hit = penFallHit(bl.x, oldY, newY);
    if (hit) {
      spawnSparkles(bl.x, hit.y, 10, hit.ground ? '#5a5a7a' : '#c9a0ff');
      playNote(hit.ground ? 180 : 520, 0, 0.1, 'sine', 0.15);
      scBlots.splice(i, 1);
      continue;
    }
    bl.y = newY;
    var hdx = bl.x - princess.x, hdy = bl.y - (princess.y - viewH * 0.1);
    if (!celebrating && hdx * hdx + hdy * hdy < viewH * 0.065 * viewH * 0.065) {
      if (loseHeart()) {
        penStun = 0.7;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#5a5a7a');
      }
      scBlots.splice(i, 1);
      continue;
    }
    if (bl.y > viewH + 20) scBlots.splice(i, 1);
  }

  for (i = 0; i < scBottles.length; i++) {
    var d = scBottles[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectScBottle(d);
  }

  if (scDoor.open && !celebrating && Math.abs(princess.x - scDoor.x) < viewH * 0.08) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderScribbleBg(b, w, h) {
  var i, x;
  renderPaperScene(b, w, h, scGround, null, { paper: '#f4eef8', sky: 'rgba(120,100,160,0.08)', sun: false, hill1: '#d9d0e8', hill2: '#c9bde0' });
  // Sotkuisia töhryjä taivaalla mörön lähellä
  b.strokeStyle = 'rgba(90,74,122,0.18)';
  b.lineWidth = Math.max(2, h * 0.006);
  for (i = 0; i < 6; i++) {
    x = w * (0.7 + i * 0.05);
    b.beginPath();
    b.moveTo(x, h * (0.1 + (i % 3) * 0.05));
    b.bezierCurveTo(x + h * 0.06, h * 0.25, x - h * 0.05, h * 0.3, x + h * 0.04, h * 0.4);
    b.stroke();
  }
  // Ovi lopussa
  var s = h * 0.12, gx = scDoor.x;
  b.fillStyle = '#8f8fc0';
  b.fillRect(gx - s * 0.8, groundTop - s * 1.7, s * 0.28, s * 1.7);
  b.fillRect(gx + s * 0.52, groundTop - s * 1.7, s * 0.28, s * 1.7);
  b.beginPath(); b.arc(gx, groundTop - s * 1.7, s * 0.8, Math.PI, 0); b.lineTo(gx + s * 0.52, groundTop - s * 1.7); b.arc(gx, groundTop - s * 1.7, s * 0.52, 0, Math.PI, true); b.closePath(); b.fill();
}

// Muotosymboli: ympyrä, kolmio, neliö tai salama (siksak)
function drawShapeSymbol(c, shape, x, y, s, color, dashed) {
  c.strokeStyle = color;
  c.lineWidth = Math.max(2.5, s * 0.14);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (dashed && c.setLineDash) c.setLineDash([s * 0.25, s * 0.18]);
  c.beginPath();
  if (shape === 'circle') {
    c.arc(x, y, s, 0, Math.PI * 2);
  } else if (shape === 'triangle') {
    c.moveTo(x, y - s); c.lineTo(x + s * 0.95, y + s * 0.7); c.lineTo(x - s * 0.95, y + s * 0.7); c.closePath();
  } else if (shape === 'square') {
    c.rect(x - s * 0.85, y - s * 0.85, s * 1.7, s * 1.7);
  } else {
    c.moveTo(x + s * 0.3, y - s * 1.1); c.lineTo(x - s * 0.4, y - s * 0.1); c.lineTo(x + s * 0.2, y); c.lineTo(x - s * 0.3, y + s * 1.1);
  }
  c.stroke();
  if (c.setLineDash) c.setLineDash([]);
  c.lineCap = 'butt';
  c.lineJoin = 'miter';
}

function drawScGate(c, g) {
  var x = g.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  var shake = scShake.gate === g && scShake.t > 0 ? Math.sin(globalT * 50) * h * 0.008 : 0;
  var spread = g.open ? s * 0.55 : 0;
  c.fillStyle = '#8a4dff';
  roundRect(c, x - s * 0.7 - spread + shake, groundTop - s * 1.8, s * 0.3, s * 1.8, s * 0.1);
  c.fill();
  roundRect(c, x + s * 0.4 + spread + shake, groundTop - s * 1.8, s * 0.3, s * 1.8, s * 0.1);
  c.fill();
  if (!g.open) {
    c.fillStyle = 'rgba(138,77,255,0.18)';
    c.fillRect(x - s * 0.4 + shake, groundTop - s * 1.8, s * 0.8, s * 1.8);
  }
  // Muotokortti portin päällä: piirrä tämä
  var near = Math.abs(princess.x - g.x) < viewW * 0.45 && !g.open;
  var pulse = near ? 1 + Math.sin(globalT * 4) * 0.06 : 1;
  c.fillStyle = g.open ? 'rgba(200,255,200,0.9)' : 'rgba(255,255,255,0.95)';
  roundRect(c, x - s * 0.55 * pulse + shake, groundTop - s * 3.0 - s * 0.55 * pulse, s * 1.1 * pulse, s * 1.1 * pulse, s * 0.2);
  c.fill();
  drawShapeSymbol(c, g.shape, x + shake, groundTop - s * 3.0, s * 0.33 * pulse, g.open ? '#4fb356' : '#8a4dff', !g.open);
  if (g.glow > 0) drawStar(c, x, groundTop - s * 3.9, h * 0.03, globalT, Math.min(1, g.glow));
}

function drawScMonster(c) {
  var m = scMonster, x = m.x - camX, y = m.y, r = viewH * 0.12, i;
  if (x < -r * 3 || x > viewW + r * 3) return;
  var calm = m.calm;
  var shake = scShake.gate && scShake.gate.monster && scShake.t > 0 ? Math.sin(globalT * 50) * viewH * 0.008 : 0;
  x += shake;
  // Sotkupallo: monta töhryviivaa
  c.strokeStyle = calm ? '#c9a0ff' : '#4a4560';
  c.lineWidth = Math.max(3, r * 0.1);
  c.lineCap = 'round';
  for (i = 0; i < 9; i++) {
    var a1 = i * 0.7 + m.phase * (calm ? 0.3 : 1.2), a2 = a1 + 2.4;
    c.beginPath();
    c.moveTo(x + Math.cos(a1) * r * 0.9, y + Math.sin(a1) * r * 0.75);
    c.bezierCurveTo(x + Math.cos(a1 + 1) * r * 1.1, y + Math.sin(a1 + 1) * r * 1.0, x + Math.cos(a2 - 1) * r * 0.5, y + Math.sin(a2 - 1) * r * 0.6, x + Math.cos(a2) * r * 0.9, y + Math.sin(a2) * r * 0.75);
    c.stroke();
  }
  c.fillStyle = calm ? 'rgba(201,160,255,0.55)' : 'rgba(74,69,96,0.75)';
  c.beginPath(); c.arc(x, y, r * 0.7, 0, Math.PI * 2); c.fill();
  // Silmät ja suu
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.12, r * 0.18, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28, y - r * 0.12, r * 0.18, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#222';
  c.beginPath(); c.arc(x - r * 0.28 + (calm ? 0 : Math.sin(m.phase * 3) * r * 0.05), y - r * 0.12, r * 0.08, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28 + (calm ? 0 : Math.sin(m.phase * 3) * r * 0.05), y - r * 0.12, r * 0.08, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#222';
  c.lineWidth = Math.max(2, r * 0.06);
  c.beginPath();
  if (calm) c.arc(x, y + r * 0.18, r * 0.25, 0.2, Math.PI - 0.2);
  else { c.moveTo(x - r * 0.25, y + r * 0.35); c.lineTo(x - r * 0.1, y + r * 0.25); c.lineTo(x + r * 0.05, y + r * 0.35); c.lineTo(x + r * 0.25, y + r * 0.25); }
  c.stroke();
  c.lineCap = 'butt';
  if (!calm) {
    // Salamakortti mörön yllä, kun portit on avattu
    var g = scNextGate();
    if (g && g.monster) {
      var s = viewH * 0.12, pulse = 1 + Math.sin(globalT * 4) * 0.06;
      c.fillStyle = 'rgba(255,255,255,0.95)';
      roundRect(c, x - s * 0.55 * pulse, y - r * 1.5 - s * 0.55 * pulse, s * 1.1 * pulse, s * 1.1 * pulse, s * 0.2);
      c.fill();
      drawShapeSymbol(c, 'zigzag', x, y - r * 1.5, s * 0.33 * pulse, '#ffb300', true);
    }
  } else if (m.hitT > 0) {
    drawStar(c, x, y - r * 1.3, viewH * 0.05, globalT * 3, 1);
  }
}

function drawScBlot(c, bl) {
  var x = bl.x - camX, y = bl.y, s = viewH * 0.028;
  if (x < -s * 4 || x > viewW + s * 4) return;
  if (bl.state === 'hover') {
    y += Math.sin(bl.wob) * viewH * 0.01;
    c.fillStyle = 'rgba(74,69,96,0.25)';
    c.beginPath(); c.arc(x, y, s * 1.5 + Math.sin(bl.wob * 2) * s * 0.2, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = 'rgba(74,69,96,0.5)';
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 1.8); c.lineTo(x + s * 0.3, y - s * 1.8); c.lineTo(x + s * 0.15, y); c.lineTo(x - s * 0.15, y); c.closePath(); c.fill();
  }
  c.fillStyle = '#4a4560';
  c.beginPath(); c.arc(x, y, s * 0.7, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.5, y + s * 0.35, s * 0.32, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.55, y + s * 0.25, s * 0.28, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - s * 0.22, y - s * 0.15, s * 0.16, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.22, y - s * 0.15, s * 0.16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#222';
  c.beginPath(); c.arc(x - s * 0.22, y - s * 0.15, s * 0.07, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.22, y - s * 0.15, s * 0.07, 0, Math.PI * 2); c.fill();
}

function drawScDoorGlow(c) {
  var x = scDoor.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = scDoor.open ? 'rgba(255,245,200,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')' : 'rgba(40,30,70,0.8)';
  c.beginPath(); c.arc(x, groundTop - s * 1.7, s * 0.52, Math.PI, 0); c.lineTo(x + s * 0.52, groundTop); c.lineTo(x - s * 0.52, groundTop); c.closePath(); c.fill();
  if (scDoor.open) drawStar(c, x, groundTop - s * 2.9, h * 0.035, globalT, 1);
}

// Muotorivi HUDiin: avatut portit värillä, avaamattomat haaleina
function drawScShapeHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, done;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * SC_SHAPES.length + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < SC_SHAPES.length; i++) {
    done = i < scGates.length ? scGates[i].open : scMonster.calm;
    c.globalAlpha = done ? 1 : 0.3;
    drawShapeSymbol(c, SC_SHAPES[i], left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.75, done ? '#4fb356' : '#8a4dff', false);
    c.globalAlpha = 1;
  }
}

function drawScribble() {
  var i;
  if (!drawWorldBg()) return;
  drawScMonster(ctx);
  drawScDoorGlow(ctx);
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < scGates.length; i++) drawScGate(ctx, scGates[i]);
  for (i = 0; i < scBottles.length; i++) {
    if (scBottles[i].collected) continue;
    drawInkBottle(ctx, scBottles[i].ax - camX, scBottles[i].ay + Math.sin(scBottles[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  drawPenPrincess(ctx);
  for (i = 0; i < scBlots.length; i++) drawScBlot(ctx, scBlots[i]);
  drawPenBubblesLayer(ctx);
  drawParticlesLayer(ctx);
  if (scDoor.open && !celebrating) drawEdgeArrow(ctx, scDoor.x);
  drawCelebrateLayer();
  drawScShapeHud(ctx);
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
