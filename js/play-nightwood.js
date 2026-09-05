'use strict';

// Kuutamometsä: ratsastus yömetsässä. Kiiltomadot vilkkuvat ja ne saa kiinni
// vain kun ne loistavat. Pöllöt huhuilevat varoituksen ja syöksyvät sitten
// polulle. Sydämet käytössä.

var GLOW_COUNT = 8;
var glowBugs = [];
var owls = [];
var moonGate = { fx: 0.96, x: 0, open: false };
var glowDefs = [
  { fx: 0.08, fy: 0.14, off: 0.0 }, { fx: 0.17, fy: 0.26, off: 0.9 }, { fx: 0.27, fy: 0.12, off: 1.8 }, { fx: 0.41, fy: 0.24, off: 0.4 },
  { fx: 0.50, fy: 0.10, off: 1.3 }, { fx: 0.62, fy: 0.28, off: 2.2 }, { fx: 0.74, fy: 0.14, off: 0.7 }, { fx: 0.87, fy: 0.22, off: 1.6 }
];
var owlDefs = [{ fx: 0.20 }, { fx: 0.52 }, { fx: 0.82 }];
var GLOW_ON = 1.5, GLOW_CYCLE = 2.9;

function glowLit(g) {
  return (g.t % GLOW_CYCLE) < GLOW_ON;
}

function layoutNightwood() {
  var i;
  for (i = 0; i < glowBugs.length; i++) {
    glowBugs[i].ax = glowDefs[i].fx * worldW;
    glowBugs[i].ay = groundTop - glowDefs[i].fy * viewH;
  }
  for (i = 0; i < owls.length; i++) {
    owls[i].px = owlDefs[i].fx * worldW;
    owls[i].py = viewH * 0.30;
  }
  moonGate.x = moonGate.fx * worldW;
}

function initNightwood() {
  var i;
  level = 14;
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
  heartsReset();
  tasks = [makeTask(0.35, 'memory', { seqLen: 4, orbs: 4 }), makeTask(0.68, 'odd')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.74]);
  glowBugs = [];
  for (i = 0; i < GLOW_COUNT; i++) glowBugs.push({ ax: 0, ay: 0, collected: false, t: glowDefs[i].off, phase: Math.random() * Math.PI * 2 });
  owls = [];
  for (i = 0; i < owlDefs.length; i++) owls.push({ px: 0, py: 0, x: 0, y: 0, state: 'sleep', timer: 3 + i * 1.5, diveT: 0, tx: 0, ty: 0, hit: false });
  layoutNightwood();
  for (i = 0; i < owls.length; i++) { owls[i].x = owls[i].px; owls[i].y = owls[i].py; }
  moonGate.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2 - viewH * 0.04;
  unicorn.facing = 1;
  unicorn.moving = false;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  document.body.style.background = '#0b1030';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(330, 0, 0.35, 'sine', 0.3);
  playNote(494, 0.18, 0.35, 'triangle', 0.3);
}

function respawnNightwood() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2 - viewH * 0.04;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeNightwood(ratio) {
  var i;
  layoutNightwood();
  for (i = 0; i < owls.length; i++) { owls[i].x *= ratio; owls[i].tx *= ratio; }
}

function collectGlow(g) {
  g.collected = true;
  registerCollected(g);
  spawnSparkles(g.ax, g.ay, 14, '#d9ff7a');
  playNote(900 + countCollected(glowBugs) * 45, 0, 0.25, 'sine', 0.4);
  playNote(1350 + countCollected(glowBugs) * 45, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(glowBugs) === GLOW_COUNT && !moonGate.open) {
    moonGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function glowPos(g) {
  return { x: g.ax + Math.sin(g.phase) * viewH * 0.03, y: g.ay + Math.cos(g.phase * 1.3) * viewH * 0.02 };
}

function handleNightwoodTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy, p;
  for (i = 0; i < glowBugs.length; i++) {
    var g = glowBugs[i];
    if (g.collected) continue;
    p = glowPos(g);
    dx = wx - p.x;
    dy = py - p.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      if (glowLit(g)) collectGlow(g);
      else { spawnSparkles(p.x, p.y, 4, '#6b7a99'); playNote(220, 0, 0.1, 'triangle', 0.2); }
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateNightwood(dt) {
  var i, dx, dy, dist, step;
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
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#c9b3ff');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);
  updateCheckpoints(unicorn.x, unicorn.y);

  // Kiiltomadot vilkkuvat; ratsastamalla läpi saa kiinni vain loistavan
  for (i = 0; i < glowBugs.length; i++) {
    var g = glowBugs[i];
    if (g.collected) continue;
    if (!busy) g.t += dt;
    g.phase += dt * 1.5;
    var gp = glowPos(g);
    var gdx = gp.x - unicorn.x, gdy = gp.y - (unicorn.y - viewH * 0.1);
    if (glowLit(g) && gdx * gdx + gdy * gdy < viewH * 0.07 * viewH * 0.07) collectGlow(g);
  }

  // Pöllöt: uni -> huhuilu (varoitus) -> syöksy polulle -> takaisin oksalle
  for (i = 0; i < owls.length; i++) {
    var o = owls[i];
    if (busy || celebrating) continue;
    if (o.state === 'sleep') {
      o.timer -= dt;
      if (o.timer <= 0) {
        if (Math.abs(unicorn.x - o.px) < viewW * 0.4) {
          o.state = 'hoot';
          o.timer = 1.2;
          playNote(294, 0, 0.25, 'sine', 0.3);
          playNote(247, 0.3, 0.35, 'sine', 0.3);
        } else {
          o.timer = 1.2;
        }
      }
    } else if (o.state === 'hoot') {
      o.timer -= dt;
      if (o.timer <= 0) {
        o.state = 'dive';
        o.diveT = 0;
        o.hit = false;
        o.tx = unicorn.x;
        o.ty = unicorn.y - viewH * 0.06;
        playNote(880, 0, 0.3, 'sawtooth', 0.08);
      }
    } else if (o.state === 'dive') {
      o.diveT += dt * 1.3;
      var s = o.diveT < 1 ? Math.sin(o.diveT * Math.PI / 2) : Math.sin(Math.max(0, 2 - o.diveT) * Math.PI / 2);
      o.x = o.px + (o.tx - o.px) * s;
      o.y = o.py + (o.ty - o.py) * s;
      var odx = o.x - unicorn.x, ody = o.y - (unicorn.y - viewH * 0.08);
      if (!o.hit && odx * odx + ody * ody < viewH * 0.08 * viewH * 0.08) {
        o.hit = true;
        if (loseHeart()) {
          var push = unicorn.x < o.tx ? -1 : 1;
          unicorn.tx = Math.min(Math.max(unicorn.x + push * viewW * 0.1, viewW * 0.05), worldW - viewW * 0.03);
          unicorn.ty = unicorn.y;
          spawnSparkles(unicorn.x, unicorn.y - viewH * 0.08, 10, '#c9a97a');
        }
      }
      if (o.diveT >= 2) {
        o.state = 'sleep';
        o.x = o.px; o.y = o.py;
        o.timer = 4.5 + Math.random() * 3;
      }
    }
  }

  if (moonGate.open && !celebrating && Math.abs(unicorn.x - moonGate.x) < viewH * 0.09) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderNightwoodBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#070a24');
  sky.addColorStop(0.7, '#1b2a5a');
  sky.addColorStop(1, '#2a3f78');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, groundTop + 2);
  b.fillStyle = '#ffffff';
  for (i = 0; i < 120; i++) {
    x = (i * 197.3) % w;
    var sy = ((i * 89) % Math.round(h * 0.55));
    b.globalAlpha = 0.4 + ((i * 7) % 6) / 10;
    b.beginPath(); b.arc(x, sy, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  // Kuu
  var mx = w * 0.5, my = h * 0.16, mr = h * 0.075;
  var mg = b.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
  mg.addColorStop(0, 'rgba(255,245,200,0.5)');
  mg.addColorStop(1, 'rgba(255,245,200,0)');
  b.fillStyle = mg;
  b.beginPath(); b.arc(mx, my, mr * 3, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff6c8';
  b.beginPath(); b.arc(mx, my, mr, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(200,190,150,0.3)';
  b.beginPath(); b.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.2, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.14, 0, Math.PI * 2); b.fill();
  // Kaukaiset kukkulat ja kuusirivit
  b.fillStyle = '#121a44';
  for (i = 0; i < 9; i++) {
    x = w * (i / 8);
    b.beginPath(); b.arc(x, groundTop - h * 0.05, h * (0.14 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  for (i = 0; i < 26; i++) {
    x = w * (0.01 + i * 0.039) + (i % 2) * h * 0.02;
    drawPine(b, x, groundTop - h * 0.02, h * (0.22 + (i % 3) * 0.06), i % 2 ? '#0e1538' : '#16204a');
  }
  // Polku
  var path = b.createLinearGradient(0, groundTop, 0, groundBottom);
  path.addColorStop(0, '#31507a');
  path.addColorStop(0.5, '#3c5f8f');
  path.addColorStop(1, '#2a4468');
  b.fillStyle = path;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = '#1a2a52';
  b.fillRect(0, groundBottom, w, h - groundBottom);
  // Hohtavat sienet polun reunoilla
  for (i = 0; i < 22; i++) {
    x = (i * 311.7) % w;
    var my2 = i % 2 ? groundTop + h * 0.02 : groundBottom - h * 0.01;
    var gg = b.createRadialGradient(x, my2 - h * 0.02, h * 0.005, x, my2 - h * 0.02, h * 0.05);
    gg.addColorStop(0, 'rgba(150,230,255,0.5)');
    gg.addColorStop(1, 'rgba(150,230,255,0)');
    b.fillStyle = gg;
    b.beginPath(); b.arc(x, my2 - h * 0.02, h * 0.05, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#d9e8ff';
    b.fillRect(x - h * 0.005, my2 - h * 0.025, h * 0.01, h * 0.025);
    b.fillStyle = '#7fd4ff';
    b.beginPath(); b.arc(x, my2 - h * 0.025, h * 0.016, Math.PI, 0); b.fill();
  }
  drawMoonGateFrame(b, moonGate.x, groundTop - h * 0.02, h);
}

function drawPine(b, x, baseY, s, color) {
  var i;
  b.fillStyle = color;
  b.fillRect(x - s * 0.05, baseY - s * 0.2, s * 0.1, s * 0.2);
  for (i = 0; i < 3; i++) {
    var ty = baseY - s * 0.15 - i * s * 0.27;
    var tw = s * (0.42 - i * 0.1);
    b.beginPath();
    b.moveTo(x - tw, ty); b.lineTo(x + tw, ty); b.lineTo(x, ty - s * 0.4);
    b.closePath(); b.fill();
  }
}

function drawMoonGateFrame(b, x, baseY, h) {
  var s = h * 0.12;
  b.fillStyle = '#4a4470';
  b.fillRect(x - s * 0.75, baseY - s * 1.6, s * 0.25, s * 1.6);
  b.fillRect(x + s * 0.5, baseY - s * 1.6, s * 0.25, s * 1.6);
  b.beginPath(); b.arc(x, baseY - s * 1.6, s * 0.75, Math.PI, 0); b.lineTo(x + s * 0.5, baseY - s * 1.6); b.arc(x, baseY - s * 1.6, s * 0.5, 0, Math.PI, true); b.closePath(); b.fill();
}

function drawGlowBug(c, x, y, s, lit, t) {
  if (lit) {
    var g = c.createRadialGradient(x, y, s * 0.2, x, y, s * 2.2);
    g.addColorStop(0, 'rgba(220,255,140,0.9)');
    g.addColorStop(1, 'rgba(220,255,140,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, s * 2.2, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath();
  if (c.ellipse) { c.ellipse(x - s * 0.5, y - s * 0.4, s * 0.55, s * 0.25, -0.5 + Math.sin(t * 20) * 0.2, 0, Math.PI * 2); c.ellipse(x + s * 0.5, y - s * 0.4, s * 0.55, s * 0.25, 0.5 - Math.sin(t * 20) * 0.2, 0, Math.PI * 2); }
  else { c.arc(x - s * 0.5, y - s * 0.4, s * 0.3, 0, Math.PI * 2); c.arc(x + s * 0.5, y - s * 0.4, s * 0.3, 0, Math.PI * 2); }
  c.fill();
  c.fillStyle = lit ? '#e8ff7a' : '#4a5570';
  c.beginPath(); c.arc(x, y + s * 0.15, s * 0.42, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a2a3a';
  c.beginPath(); c.arc(x, y - s * 0.3, s * 0.3, 0, Math.PI * 2); c.fill();
}

function drawNightOwl(c, o) {
  var x = o.x - camX, y = o.y, s = viewH * 0.045;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var awake = o.state !== 'sleep';
  c.save();
  c.translate(x, y);
  if (o.state === 'dive') {
    c.fillStyle = '#6b4a2a';
    c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(-s * 1.9, -s * 0.8); c.lineTo(-s * 0.6, s * 0.5); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(s * 1.9, -s * 0.8); c.lineTo(s * 0.6, s * 0.5); c.closePath(); c.fill();
  }
  c.fillStyle = '#8a6a44';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.75, s, 0, 0, Math.PI * 2);
  else c.arc(0, 0, s * 0.85, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#c9a97a';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, s * 0.25, s * 0.45, s * 0.6, 0, 0, Math.PI * 2);
  else c.arc(0, s * 0.25, s * 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#8a6a44';
  c.beginPath(); c.moveTo(-s * 0.6, -s * 0.6); c.lineTo(-s * 0.4, -s * 1.15); c.lineTo(-s * 0.1, -s * 0.7); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(s * 0.6, -s * 0.6); c.lineTo(s * 0.4, -s * 1.15); c.lineTo(s * 0.1, -s * 0.7); c.closePath(); c.fill();
  if (awake) {
    var glow = o.state === 'hoot' ? 0.6 + Math.sin(globalT * 16) * 0.4 : 1;
    c.fillStyle = 'rgba(255,230,120,' + glow + ')';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.13, 0, Math.PI * 2); c.fill();
  } else {
    c.strokeStyle = '#3a2a1a';
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.fillStyle = '#ffb84f';
  c.beginPath(); c.moveTo(-s * 0.12, -s * 0.1); c.lineTo(s * 0.12, -s * 0.1); c.lineTo(0, s * 0.12); c.closePath(); c.fill();
  c.restore();
  // Oksa
  if (o.state !== 'dive') {
    c.strokeStyle = '#3a2a1a';
    c.lineWidth = Math.max(3, s * 0.2);
    c.beginPath(); c.moveTo(x - s * 1.6, y + s * 1.05); c.lineTo(x + s * 1.6, y + s * 0.95); c.stroke();
  }
}

function drawMoonGateGlow(c) {
  var x = moonGate.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  var baseY = groundTop - h * 0.02;
  if (moonGate.open) {
    var g = c.createLinearGradient(0, baseY - s * 2.2, 0, baseY);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(200,220,255,0.5)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, baseY - s * 1.6, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, baseY); c.lineTo(x - s * 0.5, baseY); c.closePath(); c.fill();
    drawStar(c, x, baseY - s * 2.7, h * 0.035, globalT, 1);
  } else {
    c.fillStyle = 'rgba(20,30,70,0.8)';
    c.beginPath(); c.arc(x, baseY - s * 1.6, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, baseY); c.lineTo(x - s * 0.5, baseY); c.closePath(); c.fill();
  }
}

function drawNightwood() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawMoonGateGlow(ctx);
  for (i = 0; i < owls.length; i++) if (owls[i].state !== 'dive') drawNightOwl(ctx, owls[i]);
  for (i = 0; i < glowBugs.length; i++) {
    if (glowBugs[i].collected) continue;
    var gp = glowPos(glowBugs[i]);
    drawGlowBug(ctx, gp.x - camX, gp.y, viewH * 0.018, glowLit(glowBugs[i]), globalT + i);
  }
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < owls.length; i++) if (owls[i].state === 'dive') drawNightOwl(ctx, owls[i]);
  drawParticlesLayer(ctx);
  if (moonGate.open && !celebrating) drawEdgeArrow(ctx, moonGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, GLOW_COUNT, function (i2) { return glowBugs[i2] && glowBugs[i2].collected; },
    function (c, x, y, s) { drawGlowBug(c, x, y, s * 0.75, true, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
