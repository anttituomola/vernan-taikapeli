'use strict';

// Unikello: kiireetön ratsastus iltahämärässä. Unikuut kerätään sormella
// tai ohitse ratsastaen ja viedään nukkumaan. Tehtävät: kello ja lue sana.
// Pensaat ja sänky ovat tökättäviä koristeita (props.js); taivaan kuun
// napautus pudottaa tähdenlennon (yllätys).

var BD_COUNT = 8;
var bdMoons = [];
var bdBed = { fx: 0.95, x: 0, ready: false };
var bdDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];
var bdMoonFar = null;                    // taivaan kuu kaukokerroksessa: { x, y, r, speed } kerroksen koordinaateissa
var bdShoot = { t: -1, x: 0, y: 0 };     // tähdenlento ruutukoordinaateissa

function bdPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initBedtime() {
  var i;
  tasks = [makeTask(0.34, 'clock'), makeTask(0.68, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  bdMoons = [];
  for (i = 0; i < BD_COUNT; i++) {
    bdMoons.push({
      ax: bdDefs[i].fx * worldW, ay: groundTop - bdDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  bdBed.x = bdBed.fx * worldW;
  bdBed.ready = false;
  unicorn.speed = 250;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = bdPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  bdShoot.t = -1;
  bdSetupProps();
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(523, 0.16, 0.35, 'triangle', 0.3);
}

function respawnBedtime() {}

function resizeBedtime(ratio) {
  var i;
  for (i = 0; i < bdMoons.length; i++) {
    bdMoons[i].ax = bdDefs[i].fx * worldW;
    bdMoons[i].ay = groundTop - bdDefs[i].fy * viewH;
  }
  bdBed.x = bdBed.fx * worldW;
  bdSetupProps();
}

function collectBedtime(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#ffe9a0');
  playNote(520 + countCollected(bdMoons) * 40, 0, 0.28, 'sine', 0.35);
  playNote(780 + countCollected(bdMoons) * 40, 0.1, 0.32, 'triangle', 0.28);
  if (countCollected(bdMoons) === BD_COUNT && !bdBed.ready) {
    bdBed.ready = true;
    playNote(392, 0.3, 0.35, 'triangle', 0.35);
    playNote(523, 0.48, 0.4, 'triangle', 0.35);
    playNote(659, 0.66, 0.5, 'sine', 0.35);
  }
}

function handleBedtimeTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < bdMoons.length; i++) {
    var it = bdMoons[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectBedtime(it);
      return;
    }
  }
  // Taivaan kuu (kaukokerros liikkuu kameraa hitaammin): tähdenlento (yllätys)
  if (bdMoonFar) {
    dx = px - (bdMoonFar.x - camX * bdMoonFar.speed);
    dy = py - bdMoonFar.y;
    if (dx * dx + dy * dy < bdMoonFar.r * 1.6 * bdMoonFar.r * 1.6) bdTapMoon(px, py);
  }
  // Koristeet (pensaat, sänky) heilahtavat; ratsastus jatkuu kuten ennen
  propsTap(wx, wy);
  setWalkTarget(px, py);
}

function bdTapMoon(px, py) {
  if (bdShoot.t >= 0) return;
  bdShoot.t = 0;
  bdShoot.x = px;
  bdShoot.y = py;
  spawnSparkles(px + camX, py, 10, '#fff1a8');
  playNote(1568, 0, 0.25, 'sine', 0.2);
  playNote(2093, 0.12, 0.35, 'sine', 0.18);
  playNote(2637, 0.26, 0.5, 'sine', 0.14);
}
function bdUpdateShoot(dt) {
  if (bdShoot.t >= 0) { bdShoot.t += dt; if (bdShoot.t > 1.3) bdShoot.t = -1; }
}
// Tähdenlento: tähti kiitää vasemmalle alas, pyrstö haalenee
function bdDrawShoot(c) {
  if (bdShoot.t < 0) return;
  var k = easeOutCubic(bdShoot.t / 1.3), a = Math.min(1, Math.max(0, 1 - (bdShoot.t - 0.9) / 0.4));
  var x = bdShoot.x - k * viewW * 0.4, y = bdShoot.y + k * viewH * 0.28, s = viewH * 0.014;
  c.save();
  c.globalAlpha = a;
  var g = c.createLinearGradient(x, y, x + s * 10, y - s * 7);
  g.addColorStop(0, 'rgba(255,241,168,0.9)');
  g.addColorStop(1, 'rgba(255,241,168,0)');
  c.strokeStyle = g;
  c.lineWidth = s * 0.9;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 10, y - s * 7); c.stroke();
  drawStar(c, x, y, s, globalT * 6, 0.8);
  c.restore();
}

function updateBedtime(dt) {
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
    unicorn.walkPhase += dt * 9;
    if (Math.random() < dt * 6) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#c8d4ff');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < bdMoons.length; i++) {
    var it = bdMoons[i];
    it.phase += dt * 1.6;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectBedtime(it);
    }
  }

  if (bdBed.ready && !celebrating && Math.abs(unicorn.x - bdBed.x) < viewW * 0.08) {
    startCelebration();
  }

  propsUpdate(dt);
  bdUpdateShoot(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Koristeet (tökättävät) ----------
// Seitsemän pensasta ja sänky piirretään joka ruudulla samoihin paikkoihin,
// joissa ne olivat taustakuvassa.
function bdSetupProps() {
  var i, h = viewH, w = worldW;
  propsReset();
  for (i = 0; i < 7; i++) {
    propAdd({ x: w * (0.06 + i * 0.14), y: groundTop - h * 0.01, r: h * 0.09, hy: h * 0.04, color: '#ffe9a0', amp: 0.1, note: 440 + (i % 4) * 50,
      draw: bdDrawBushProp, poke: bdPokeBush });
  }
  propAdd({ x: bdBed.x, y: groundTop, r: h * 0.11, hy: h * 0.06, color: '#ffe9a0', amp: 0.04, note: 392, glowT: -1,
    draw: bdDrawBedProp, poke: bdPokeBed, update: bdUpdateBed });
}
function bdDrawBushProp(c, p) {
  drawBush(c, 0, 0, viewH * 0.07);
}
// Pensaasta putoaa pieni tähti, joka pomppaa maassa
function bdPokeBush(p) {
  var h = viewH;
  propDrop({ x: p.x + (Math.random() - 0.5) * h * 0.04, y: p.y - h * 0.09, vx: (Math.random() - 0.5) * viewW * 0.05, vy: -h * 0.14, ground: p.y + h * 0.015, life: 2.4,
    draw: bdDrawDropStar });
}
function bdDrawDropStar(c, d) {
  drawStar(c, 0, 0, viewH * 0.012, 0, 0.6);
}

// Sänky maailman lopussa: runko, patja, tyyny ja kuulamppu. Tökkäys pöllyttää
// tyynystä höyheniä ja saa lampun hehkumaan hetkeksi.
function bdDrawBedProp(c, p) {
  var s = viewH * 0.1, g = p.glowT >= 0 ? 1 + Math.sin(Math.min(1, p.glowT / 0.8) * Math.PI) * 0.8 : 1;
  artShadow(c, 0, s * 0.02, s * 1.1, s * 0.16, 0.2);
  artRoundRect(c, -s * 0.95, -s * 0.55, s * 1.9, s * 0.4, s * 0.06, '#8a6a4a', { lineColor: '#4a3220' });
  artRoundRect(c, -s * 0.85, -s * 0.72, s * 1.5, s * 0.28, s * 0.08, '#f4e8ff', { lineColor: '#b9a6d6', shadeTo: '#d8c8f0' });
  artRoundRect(c, s * 0.45, -s * 1.15, s * 0.42, s * 0.7, s * 0.12, '#c9b8f0', { lineColor: '#7a62b0' });
  artGlow(c, -s * 0.55, -s * 0.9, s * 0.6 * g, '#ffe9a0', 0.45);
  artCircle(c, -s * 0.55, -s * 0.9, s * 0.16, '#ffe9a0', { lineColor: '#c9a05a', hi: 0.5 });
}
function bdPokeBed(p) {
  var h = viewH, i;
  p.glowT = 0;
  for (i = 0; i < 2; i++) {
    propDrop({ x: p.x + h * 0.065 + (i - 0.5) * h * 0.02, y: p.y - h * 0.11, vx: (i - 0.5) * viewW * 0.04, vy: -h * 0.16, ground: p.y - h * 0.01, life: 2.4, vr: (i - 0.5) * 5,
      draw: bdDrawFeather });
  }
}
function bdUpdateBed(p, dt) {
  if (p.glowT >= 0) { p.glowT += dt; if (p.glowT > 0.8) p.glowT = -1; }
}
function bdDrawFeather(c, d) {
  var s = viewH * 0.012;
  artBlob(c, 0, 0, s * 0.5, s * 1.1, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  c.strokeStyle = '#c9b3cf';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -s * 1.1); c.lineTo(0, s * 1.1); c.stroke();
}

// ---------- Piirto ----------
function bedtimeLayers() {
  return [
    { speed: 0.22, render: renderBedtimeFar },
    { speed: 0.55, render: renderBedtimeMid },
    { speed: 1, render: renderBedtimeNear }
  ];
}
function renderBedtimeBg(b, w, h) {
  renderBedtimeFar(b, w, h);
  renderBedtimeMid(b, w, h);
  renderBedtimeNear(b, w, h);
}
function renderBedtimeFar(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#1a1448');
  sky.addColorStop(0.55, '#3a2a78');
  sky.addColorStop(1, '#6a4a98');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 18; i++) {
    x = w * ((i * 0.17 + 0.05) % 1);
    drawStar(b, x, h * (0.08 + (i % 5) * 0.07), h * 0.008, i, 0.4);
  }
  // Kuu: paikka talteen napautusta varten (kerros liikkuu kameraa hitaammin)
  bdMoonFar = { x: w * 0.82, y: h * 0.16, r: h * 0.055, speed: 0.22 };
  artGlow(b, w * 0.82, h * 0.16, h * 0.16, '#fff1a8', 0.35);
  b.fillStyle = '#fff1a8';
  b.beginPath(); b.arc(w * 0.82, h * 0.16, h * 0.055, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#3a2a78';
  b.beginPath(); b.arc(w * 0.845, h * 0.14, h * 0.042, 0, Math.PI * 2); b.fill();
  fillHillBand(b, w, h, horizon, '#4a3a70', function (px) {
    return horizon - h * 0.08 - Math.sin(px * 0.002 + 0.4) * h * 0.05;
  });
}
function renderBedtimeMid(b, w, h) { meadowMid(b, w, h, '#5a4a80'); }
// Lähin kerros: maa ja polku. Pensaat ja sänky ovat koristeita (bdSetupProps).
function renderBedtimeNear(b, w, h) {
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#6a5a90');
  ground.addColorStop(1, '#3a2a58');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(200,180,255,0.18)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
}

// Unikuu: hehkuva sirppi reunaviivalla ja Z-kirjain
function bdDrawMoon(c, x, y, s) {
  artGlow(c, x, y, s * 1.6, '#fff0aa', 0.7);
  c.beginPath();
  c.arc(x, y, s, 0.5027, 5.1689, false);
  c.arc(x + s * 0.38, y - s * 0.12, s * 0.78, -1.4928, 0.8811, true);
  c.closePath();
  artFillPath(c, '#fff1a8', y - s, y + s, s, { lineColor: '#c9a05a' });
  artHighlight(c, x - s * 0.5, y - s * 0.25, s * 0.2, s * 0.12, 0.6);
  c.fillStyle = '#fff';
  c.strokeStyle = '#6a4a98';
  c.lineWidth = Math.max(1.5, s * 0.12);
  c.lineJoin = 'round';
  c.font = 'bold ' + Math.round(s * 0.7) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.strokeText('Z', x + s * 0.85, y - s * 0.7);
  c.fillText('Z', x + s * 0.85, y - s * 0.7);
  c.textBaseline = 'alphabetic';
}

function drawBedtime() {
  var i, sx;
  if (!beginPlayWorld()) return;
  bdDrawShoot(ctx);
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (bdBed.ready) {
    var bx = bdBed.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.08, viewH * 0.01, bx, groundTop - viewH * 0.08, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,230,160,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.08, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < bdMoons.length; i++) {
    if (bdMoons[i].collected) continue;
    sx = bdMoons[i].ax - camX;
    if (sx < -viewH * 0.1 || sx > viewW + viewH * 0.1) continue;
    var my = bdMoons[i].ay + Math.sin(bdMoons[i].phase) * viewH * 0.012;
    bdDrawMoon(ctx, sx, my, viewH * 0.028);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (bdBed.ready && !celebrating) drawEdgeArrow(ctx, bdBed.x);
  endPlayWorld();
  drawPickupHud(ctx, BD_COUNT, function (i2) { return bdMoons[i2] && bdMoons[i2].collected; },
    function (c, x, y, s) { bdDrawMoon(c, x, y, s); });
  drawTaskOverlay(ctx);
}
