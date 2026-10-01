'use strict';

// Kuutamotaivas: lennä sormea kohti, kerää kuut, väistä tuulenpuuskia.

// ---------- Tökättävät koristeet ----------
// Paikat murto-osina; skyPropSync laskee paikan joka ruudulla (resizeSky on
// world.js:ssä). p.s = piirtokoko, p.sp = koristeen oma ajastin (haukotus, hehku).
function skyPropSync(p, dt) {
  p.x = p.fx * worldW;
  p.y = groundTop + p.dy * viewH;
  p.s = p.fs * viewH;
  p.r = p.s * 2.2;
  p.hy = p.s * 0.3;
  if (p.sp > 0) p.sp -= dt;
}

// Uninen pilvi: pilvimuoto laventelivarjolla, kiinni olevat silmät ja suu,
// joka haukottelee tökkäyksestä (yawn 0..1)
function skyDrawPuff(c, s, yawn) {
  artUnion(c, cloudPath, 0, 0, s, -s * 1.4, s * 1.1, '#ffffff', { shadeTo: '#e3d8f5', lineColor: '#b9a8d8' });
  artEye(c, -s * 0.4, -s * 0.1, s * 0.16, 0, true);
  artEye(c, s * 0.4, -s * 0.1, s * 0.16, 0, true);
  if (yawn > 0) {
    artBlob(c, 0, s * 0.4, s * 0.18 + yawn * s * 0.1, s * 0.1 + yawn * s * 0.3, '#6a4a7a', { line: false });
  } else {
    c.strokeStyle = '#6a4a7a';
    c.lineWidth = Math.max(1.2, s * 0.08);
    c.lineCap = 'round';
    c.beginPath(); c.arc(0, s * 0.3, s * 0.2, 0.3, Math.PI - 0.3); c.stroke();
  }
  artBlush(c, -s * 0.75, s * 0.2, s * 0.14);
  artBlush(c, s * 0.75, s * 0.2, s * 0.14);
}

// Leijuva paperilyhty: naru, hehku, runko, kannet ja tupsu (lit 0..1)
function skyDrawLantern(c, s, lit) {
  var col = lit > 0 ? '#ffd27a' : '#ffb347';
  artLimb(c, 0, -s * 2.4, 0, -s * 1.5, s * 0.06, '#e3d8f5', '#8a7aa8');
  artGlow(c, 0, -s * 0.8, s * (1.8 + lit * 1.2), '#ffd45a', 0.35 + lit * 0.35);
  artRoundRect(c, -s * 0.5, -s * 1.5, s, s * 1.4, s * 0.3, col, { lineColor: '#b05a10' });
  artRoundRect(c, -s * 0.35, -s * 1.62, s * 0.7, s * 0.16, s * 0.05, '#7a3a4e', { lineColor: '#3a1a28' });
  artRoundRect(c, -s * 0.35, -s * 0.14, s * 0.7, s * 0.16, s * 0.05, '#7a3a4e', { lineColor: '#3a1a28' });
  artLimb(c, 0, 0, 0, s * 0.5, s * 0.1, '#ff5f7e', '#8a2a3e');
  artHighlight(c, -s * 0.2, -s * 1.1, s * 0.12, s * 0.3, 0.4);
}

function skyPropsSetup() {
  var i, defs = [
    { kind: 'puff', fx: 0.14, fs: 0.028, color: '#ffffff', note: 440 },
    { kind: 'lantern', fx: 0.44, fs: 0.03, color: '#ffd45a', note: 988 },
    { kind: 'puff', fx: 0.60, fs: 0.026, color: '#ffffff', note: 494 },
    { kind: 'puff', fx: 0.90, fs: 0.03, color: '#ffffff', note: 392 }
  ];
  propsReset();
  for (i = 0; i < defs.length; i++) {
    defs[i].sp = 0;
    defs[i].update = skyPropSync;
    if (defs[i].kind === 'puff') {
      defs[i].dy = 0.025;
      defs[i].draw = function (c, p) { skyDrawPuff(c, p.s, p.sp > 0 ? Math.sin(Math.min(1, p.sp / 1.2) * Math.PI) : 0); };
      defs[i].poke = skyPuffPoke;
    } else {
      defs[i].dy = -0.03;
      defs[i].draw = function (c, p) { skyDrawLantern(c, p.s, p.sp > 0 ? Math.min(1, p.sp) : 0); };
      defs[i].poke = function (p) {
        p.sp = 1.5;
        playNote(1319, 0.1, 0.25, 'sine', 0.18);
        playNote(1760, 0.22, 0.3, 'sine', 0.14);
      };
    }
    skyPropSync(propAdd(defs[i]), 0);
  }
}

// Pilvi haukottelee ja pöllähtää; joka viides tökkäys sataa tähtiä (yllätys)
function skyPuffPoke(p) {
  var k, s = p.s;
  p.sp = 1.2;
  spawnSparkles(p.x, p.y - s * 0.5, 8, '#ffffff');
  if (p.n % 5 === 0) {
    playNote(1047, 0, 0.12, 'triangle', 0.2);
    playNote(1319, 0.1, 0.12, 'triangle', 0.2);
    playNote(1568, 0.2, 0.25, 'triangle', 0.2);
    for (k = 0; k < 5; k++) {
      propDrop({
        x: p.x + (k - 2) * s * 0.6, y: p.y - s * 1.2, vx: (k - 2) * viewW * 0.02, vy: -viewH * (0.15 + Math.random() * 0.1),
        ground: p.y + s * 1.5, life: 2.2, r: s * 0.3,
        draw: function (c, d) { drawStar(c, 0, 0, d.r, 0, 1); }
      });
    }
  }
}

function initSky() {
  var i, def;
  tasks = [makeTask(0.28, 'memory'), makeTask(0.66, 'odd')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  moons = [];
  for (i = 0; i < skyDefs.length; i++) {
    def = skyDefs[i];
    moons.push({
      ax: def.fx * worldW,
      ay: groundTop - def.fy * viewH,
      by: groundTop - def.fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2
    });
  }
  gusts = [
    { x: worldW * 0.36, y: viewH * 0.4, t: 0, dir: 1 },
    { x: worldW * 0.74, y: viewH * 0.32, t: 1.2, dir: -1 }
  ];
  sheep.x = worldW * 0.55;
  sheep.y = viewH * 0.42;
  sheep.awake = false;
  sheep.flyT = 0;
  sheep.pokeT = 0;
  skyPropsSetup();
  princess.x = viewW * 0.14;
  princess.y = groundTop - viewH * 0.18;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.35);
  playNote(784, 0.14, 0.32, 'triangle', 0.35);
}

function collectMoon(m) {
  m.collected = true;
  spawnSparkles(m.ax, m.ay, 14, '#ffe9a0');
  artPop(m.ax, m.ay, viewH * 0.05, '#ffe9a0', 'ring');
  var idx = moons.indexOf(m);
  if (idx >= 0) hudBump[idx] = 0.4;
  playNote(784, 0, 0.18, 'sine', 0.4);
  playNote(1175, 0.08, 0.26, 'triangle', 0.3);
  if (countCollected(moons) === PICKUP_COUNT) startCelebration();
}

function updateSky(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);

  if (!celebrating && holding && !puzzleBusy()) {
    var tx = holdWorldX;
    var ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.55 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.7 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.28) princess.vx = viewW * 0.28;
  if (princess.vx < -viewW * 0.28) princess.vx = -viewW * 0.28;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;

  princess.x += princess.vx * dt;
  princess.y += princess.vy * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();

  if (!sheep.awake && Math.abs(princess.x - sheep.x) < viewH * 0.1 &&
      Math.abs(princess.y - sheep.y) < viewH * 0.1) {
    princess.x = sheep.x - viewH * 0.12 * (princess.x < sheep.x ? 1 : -1);
    princess.vx = 0;
  }
  if (sheep.awake) {
    sheep.flyT += dt;
    sheep.y -= viewH * 0.12 * dt;
  }
  if (sheep.pokeT > 0) sheep.pokeT -= dt;

  for (i = 0; i < gusts.length; i++) {
    gusts[i].t += dt;
    if (!celebrating && Math.abs(princess.x - gusts[i].x) < viewW * 0.1) {
      princess.vx += gusts[i].dir * viewW * 0.22 * dt * (0.6 + Math.sin(gusts[i].t * 3) * 0.4);
    }
  }

  for (i = 0; i < moons.length; i++) {
    var m = moons[i];
    if (m.collected) continue;
    m.phase += dt * 2;
    m.ay = m.by + Math.sin(m.phase) * viewH * 0.018;
    var mx = m.ax + Math.sin(m.phase * 0.7) * viewW * 0.01;
    var dx = mx - princess.x, dy = m.ay - princess.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectMoon(m);
  }

  followCam(princess.x, dt);
  princess.walkPhase += dt * 6;
  propsUpdate(dt);
  updateParticles(dt);
  if (Math.random() < dt * 6) {
    spawnSparkles(princess.x - princess.facing * 20, princess.y, 1, '#d9b3ff');
  }
  if (celebrating) {
    celebrateT += dt;
    for (i = 0; i < confetti.length; i++) {
      confetti[i].y += confetti[i].vy * dt;
      confetti[i].x += confetti[i].vx * dt;
      confetti[i].rot += confetti[i].vr * dt;
    }
  }
}

function handleSkyTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < moons.length; i++) {
    if (moons[i].collected) continue;
    dx = wx - moons[i].ax;
    dy = py - moons[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
      collectMoon(moons[i]);
      return;
    }
  }
  if (!sheep.awake) {
    dx = wx - sheep.x;
    dy = py - sheep.y;
    if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
      sheep.awake = true;
      spawnSparkles(sheep.x, sheep.y, 12, '#fff6c8');
      artPop(sheep.x, sheep.y, viewH * 0.08, '#fff6c8', 'burst');
      artShakeStart(viewH * 0.008, 0.25);
      playNote(392, 0, 0.2, 'triangle', 0.3);
      return;
    }
  } else if (Math.hypot(wx - sheep.x, py - sheep.y) < viewH * 0.08) {
    // Hereillä oleva lammas määkäisee tökkäyksestä (pelkkä koriste)
    sheep.pokeT = 0.7;
    playNote(330, 0, 0.14, 'sawtooth', 0.12);
    playNote(294, 0.14, 0.2, 'sawtooth', 0.1);
    spawnSparkles(sheep.x, sheep.y - viewH * 0.04, 5, '#fff6c8');
    return;
  }
  // Napautus ei osunut peliin: koristeet heilahtavat (lento jatkuu kuten ennen)
  propsTap(wx, py);
}

function drawMoonGem(c, x, y, r) {
  artGlow(c, x, y, r * 2.8, '#ffe9a0', 0.5);
  artCircle(c, x, y, r, '#ffe9a0', { shadeTo: '#e8c060', hi: 0.4 });
  artCircle(c, x + r * 0.32, y - r * 0.08, r * 0.72, '#2a1860', { line: false });
}

function drawSheep(c) {
  var x = sheep.x - camX, y = sheep.y, s = viewH * 0.055;
  // Määkäisy: pieni pomppu ja suu auki
  var baa = sheep.pokeT > 0 ? Math.sin(Math.min(1, sheep.pokeT / 0.7) * Math.PI) : 0;
  artShadow(c, x, y + s * 0.45, s * 1.3, s * 0.28, 0.14);
  c.save();
  c.translate(x, y - baa * s * 0.2);
  artCircle(c, -s * 0.35, s * 0.05, s * 0.38, '#fff8ee', { shadeTo: '#e0d4f0' });
  artCircle(c, s * 0.35, s * 0.08, s * 0.36, '#fff8ee', { shadeTo: '#e0d4f0' });
  artCircle(c, 0, -s * 0.12, s * 0.48, '#fff8ee', { shadeTo: '#e0d4f0', hi: 0.3 });
  artCircle(c, s * 0.42, -s * 0.05, s * 0.22, '#fff8ee', { shadeTo: '#e0d4f0' });
  artEye(c, -s * 0.12, 0, s * 0.1, 0.25, !sheep.awake);
  artEye(c, s * 0.18, 0, s * 0.1, 0.25, !sheep.awake);
  if (baa > 0) artBlob(c, s * 0.05, s * 0.22, s * 0.07, s * 0.05 + baa * s * 0.08, '#6a4a7a', { line: false });
  c.restore();
}

function drawSky() {
  var i, hs, pad, bump;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < gusts.length; i++) {
    // Puuska: tumma reunaviiva ja vaalea pyörre päällä
    ctx.globalAlpha = 0.28 + Math.sin(gusts[i].t * 3) * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gusts[i].x - camX - 30, gusts[i].y);
    ctx.bezierCurveTo(gusts[i].x - camX, gusts[i].y - 20, gusts[i].x - camX + 10, gusts[i].y + 20, gusts[i].x - camX + 40, gusts[i].y);
    ctx.strokeStyle = '#6f98c8';
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.strokeStyle = '#e8f4ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (!sheep.awake || sheep.y > -40) drawSheep(ctx);
  for (i = 0; i < moons.length; i++) {
    if (moons[i].collected) continue;
    drawMoonGem(ctx, moons[i].ax - camX, moons[i].ay, viewH * 0.03);
  }
  drawPrincessFree(
    ctx, princess.x - camX, princess.y,
    viewH / 520, princess.facing, princess.walkPhase, true, globalT
  );
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  endPlayWorld();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(20,10,50,0.4)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = moons[i] && moons[i].collected ? 1 : 0.28;
    bump = hudBump[i] > 0 ? 1 + Math.sin(Math.PI * hudBump[i] / 0.4) * 0.45 : 1;
    drawMoonGem(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.9 * bump);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
