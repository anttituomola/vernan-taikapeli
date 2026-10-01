'use strict';

// Karkkikello: kiireetön ratsastus karkkileipomossa. Piparkakkukellot
// kerätään sormella tai ohitse ratsastaen. Uuni hehkuu, kun kaikki on koossa.
// Tehtävät: kello (myös puoli- ja varttitunnit) ja lue sana.

var SC_COUNT = 8;
var scClocks = [];
var scOven = { fx: 0.95, x: 0, ready: false };
var scDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];
var sweetclockGinger = null;   // yllätys: piparkakku-ukko, joka kurkistaa keksipuun takaa

function scPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initSweetclock() {
  var i;
  tasks = [makeTask(0.34, 'clock'), makeTask(0.68, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  scClocks = [];
  for (i = 0; i < SC_COUNT; i++) {
    scClocks.push({
      ax: scDefs[i].fx * worldW, ay: groundTop - scDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      hour: 1 + (i * 5 + 3) % 12, minute: (i % 2) * 30
    });
  }
  scOven.x = scOven.fx * worldW;
  scOven.ready = false;
  sweetclockGinger = null;
  sweetclockProps();
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = scPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnSweetclock() {}

function resizeSweetclock(ratio) {
  var i;
  for (i = 0; i < scClocks.length; i++) {
    scClocks[i].ax = scDefs[i].fx * worldW;
    scClocks[i].ay = groundTop - scDefs[i].fy * viewH;
  }
  scOven.x = scOven.fx * worldW;
  sweetclockProps();
}

function collectSweetclock(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#e0a060');
  playNote(660 + countCollected(scClocks) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(scClocks) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(scClocks) === SC_COUNT && !scOven.ready) {
    scOven.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleSweetclockTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < scClocks.length; i++) {
    var it = scClocks[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectSweetclock(it);
      return;
    }
  }
  // Koristeet (keksipuut, uuni) heilahtavat; napautus kävelyttää silti kuten ennen
  propsTap(wx, wy);
  setWalkTarget(px, py);
}

function updateSweetclock(dt) {
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
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#fff3c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < scClocks.length; i++) {
    var it = scClocks[i];
    it.phase += dt * 2;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectSweetclock(it);
    }
  }

  if (scOven.ready && !celebrating && Math.abs(unicorn.x - scOven.x) < viewW * 0.08) {
    startCelebration();
  }

  if (sweetclockGinger) {
    sweetclockGinger.t += dt;
    if (sweetclockGinger.t > 3) sweetclockGinger = null;
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

function sweetclockLayers() {
  return [
    { speed: 0.22, render: renderSweetclockFar },
    { speed: 0.55, render: renderSweetclockMid },
    { speed: 1, render: renderSweetclockNear }
  ];
}
function renderSweetclockBg(b, w, h) {
  renderSweetclockFar(b, w, h);
  renderSweetclockMid(b, w, h);
  renderSweetclockNear(b, w, h);
}
function renderSweetclockFar(b, w, h) { meadowFar(b, w, h, '#ffb8d4', '#ffe4f0', '#f0c8a0'); }
function renderSweetclockMid(b, w, h) { meadowMid(b, w, h, '#f0b878'); }
function renderSweetclockNear(b, w, h) {
  var i, x;
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#f2d4a8');
  ground.addColorStop(1, '#d9a06a');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,220,0.45)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  for (i = 0; i < 6; i++) {
    if (i % 2 === 1) continue; // puut 1, 3 ja 5 ovat tökättäviä koristeita (sweetclockProps)
    x = w * (0.10 + i * 0.16) + (i % 2) * h * 0.03;
    scDrawCookieTree(b, x, groundTop - h * 0.01, h * 0.14);
  }
  for (i = 0; i < 28; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#ff9f3a'][i % 4]);
  }
}

// Keksipuu: runko, keksilatvus suklaahipuin ja maavarjo. Sama piirto
// taustalle ja tökättäville koristeille (origo = juuri).
function scDrawCookieTree(b, x, baseY, s) {
  artShadow(b, x, baseY + s * 0.02, s * 0.4, s * 0.08, 0.14);
  artRoundRect(b, x - s * 0.06, baseY - s * 0.55, s * 0.12, s * 0.57, s * 0.04, '#8a5a30', { lineColor: '#4a2e14', line: Math.max(1.2, s * 0.03) });
  artCircle(b, x, baseY - s * 0.72, s * 0.38, '#e0a060', { lineColor: '#8a5a30', hi: 0.3 });
  artCircle(b, x - s * 0.12, baseY - s * 0.78, s * 0.06, '#a0582a', { line: false });
  artCircle(b, x + s * 0.14, baseY - s * 0.66, s * 0.05, '#a0582a', { line: false });
  artCircle(b, x + s * 0.02, baseY - s * 0.92, s * 0.045, '#a0582a', { line: false });
}

// Uuni (tökättävä koriste, origo = lattia): runko, kansi, luukku ja hehkuva sisus
function scDrawOven(b, x, baseY, s) {
  var lw = Math.max(1.2, s * 0.03), fl = 0.85 + Math.sin(globalT * 9) * 0.1;
  artShadow(b, x, baseY, s * 1.15, s * 0.18, 0.18);
  artRoundRect(b, x - s, baseY - s * 1.6, s * 2, s * 1.6, s * 0.12, '#8a5a3a', { lineColor: '#4a2c18', line: lw });
  artRoundRect(b, x - s * 1.05, baseY - s * 1.72, s * 2.1, s * 0.16, s * 0.05, '#c98b4a', { lineColor: '#6a4020', line: lw });
  artRoundRect(b, x - s * 0.7, baseY - s * 1.15, s * 1.4, s * 0.7, s * 0.08, '#5a3a20', { lineColor: '#2e1a0c', line: lw });
  artRoundRect(b, x - s * 0.55, baseY - s * 1.05, s * 1.1, s * 0.5, s * 0.06, '#ff9f3a', { lineColor: '#b85a10', line: lw, alpha: fl, shadeTo: '#ff6a1a' });
  artGlow(b, x, baseY - s * 0.8, s * 0.6, '#ffb347', 0.35 * fl);
  artRoundRect(b, x - s * 0.3, baseY - s * 0.36, s * 0.6, s * 0.1, s * 0.05, '#c98b4a', { lineColor: '#6a4020', line: lw });
}

// Tökättävät koristeet: keksipuut 1, 3 ja 5 (samat paikat kuin taustan
// puilla) ja uuni piirretään joka ruudulla, jotta ne heilahtavat napautuksesta.
// Kutsutaan myös resize-koukusta.
function sweetclockProps() {
  var i, h = viewH, s = h * 0.14;
  propsReset();
  for (i = 1; i < 6; i += 2) {
    propAdd({
      x: worldW * (0.10 + i * 0.16) + (i % 2) * h * 0.03, y: groundTop - h * 0.01, s: s,
      r: s * 0.6, hy: s * 0.72, amp: 0.1, color: '#e0a060', note: 560 + i * 40,
      draw: function (c, p) { scDrawCookieTree(c, 0, 0, p.s); },
      poke: sweetclockTreePoke
    });
  }
  propAdd({
    x: scOven.x, y: groundTop, s: h * 0.11, r: h * 0.13, hy: h * 0.09, amp: 0.035, color: '#ffb347', note: 880,
    draw: function (c, p) { scDrawOven(c, 0, 0, p.s); },
    poke: function (p) {
      // Uuni kolahtaa, kannen alta pöllähtää höyryä ja kello kilahtaa
      spawnSparkles(p.x, p.y - p.s * 1.75, 8, '#ffffff');
      playNote(1760, 0.05, 0.25, 'triangle', 0.2);
    }
  });
}

// Keksipuusta tipahtaa suklaahippu; joka viides tökkäys kutsuu piparkakku-ukon
// esiin puun viereen vilkuttamaan (yllätys)
function sweetclockTreePoke(p) {
  propDropBall(p.x + (Math.random() - 0.5) * p.s * 0.4, p.y - p.s * 0.7, p.s * 0.06, '#a0582a', p.y + viewH * 0.01);
  if (p.n % 5 === 0 && !sweetclockGinger) {
    sweetclockGinger = { x: p.x + p.s * 0.45, y: p.y, t: 0, s: p.s * 0.26 };
    playNote(784, 0.1, 0.1, 'triangle', 0.2);
    playNote(988, 0.2, 0.1, 'triangle', 0.2);
    playNote(1175, 0.3, 0.25, 'triangle', 0.2);
  }
}

// Piparkakku-ukko: pomppaa esiin, vilkuttaa ja kutistuu pois. Piirretään
// koristeiden taakse, jotta se kurkistaa keksipuun latvuksen takaa.
function sweetclockDrawGinger(c) {
  var g = sweetclockGinger;
  if (!g) return;
  var x = g.x - camX, s = g.s, k, wave, col = '#c47a3a', line = '#7a4420';
  if (x < -s * 5 || x > viewW + s * 5) return;
  k = g.t < 0.5 ? easeOutBack(g.t / 0.5) : (g.t > 2.4 ? Math.max(0, (3 - g.t) / 0.6) : 1);
  if (k <= 0) return;
  wave = Math.sin(g.t * 10) * 0.5;
  artShadow(c, x, g.y, s * 1.2 * k, s * 0.2 * k, 0.16);
  c.save();
  c.translate(x, g.y);
  c.scale(k, k);
  // Jalat, kädet (oikea vilkuttaa), vartalo ja pää; kuorrutteesta napit, silmät ja hymy
  artLimb(c, -s * 0.35, -s * 0.9, -s * 0.55, 0, s * 0.42, col, line);
  artLimb(c, s * 0.35, -s * 0.9, s * 0.55, 0, s * 0.42, col, line);
  artLimb(c, -s * 0.4, -s * 1.5, -s * 1.05, -s * 1.2, s * 0.38, col, line);
  artLimb(c, s * 0.4, -s * 1.5, s * 1.0, -s * 1.5 - wave * s * 1.2, s * 0.38, col, line);
  artBlob(c, 0, -s * 1.15, s * 0.62, s * 0.8, col, { lineColor: line });
  artCircle(c, 0, -s * 2.25, s * 0.55, col, { lineColor: line, hi: 0.25 });
  artCircle(c, 0, -s * 1.3, s * 0.09, '#ffffff', { line: false });
  artCircle(c, 0, -s * 0.95, s * 0.09, '#ffffff', { line: false });
  artEye(c, -s * 0.2, -s * 2.3, s * 0.09, 0, false);
  artEye(c, s * 0.2, -s * 2.3, s * 0.09, 0, false);
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1, s * 0.07);
  c.lineCap = 'round';
  c.beginPath(); c.arc(0, -s * 2.15, s * 0.25, 0.3, Math.PI - 0.3); c.stroke();
  c.restore();
}

// Piparkakkukello: keksi reunaviivalla ja hehkulla, suklaahiput ja kellotaulu
function scDrawCookieClock(c, x, y, s, hour, minute) {
  var i, a;
  artGlow(c, x, y, s * 1.7, '#ffd08a', 0.35);
  artCircle(c, x, y, s, '#e8b878', { lineColor: '#8a5a30', hi: 0.25 });
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3;
    artCircle(c, x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.1, '#a0582a', { line: false });
  }
  drawClockFace(c, x, y, s * 0.72, hour, minute);
}

function drawSweetclock() {
  var i;
  if (!beginPlayWorld()) return;
  sweetclockDrawGinger(ctx);
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (scOven.ready) {
    var bx = scOven.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.1, viewH * 0.01, bx, groundTop - viewH * 0.1, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,180,80,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.1, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < scClocks.length; i++) {
    if (scClocks[i].collected) continue;
    var cy = scClocks[i].ay + Math.sin(scClocks[i].phase) * viewH * 0.012;
    scDrawCookieClock(ctx, scClocks[i].ax - camX, cy, viewH * 0.032, scClocks[i].hour, scClocks[i].minute);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (scOven.ready && !celebrating) drawEdgeArrow(ctx, scOven.x);
  endPlayWorld();
  drawPickupHud(ctx, SC_COUNT, function (i2) { return scClocks[i2] && scClocks[i2].collected; },
    function (c, x, y, s) { scDrawCookieClock(c, x, y, s, 3, 0); });
  drawTaskOverlay(ctx);
}
