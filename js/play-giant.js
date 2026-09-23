'use strict';

// Tulivuoren jätti (Kaukamaa, Lohikäärmelaakso): alueen vartija. Yhdistää
// saaren kaksi verbiä: RITSA ja TULIHENGITYS. Tulivuoren kraatterissa nukkuu
// Kivijätti, joka herää ja heittää laavakiviä prinsessaa kohti. Kun kivi
// lentää lähelle (oranssi rengas), tulinappi puhaltaa Mintun tulipallon, joka
// sulattaa kiven — ohi mennyt kivi vie sydämen. Heittojen jälkeen jätin
// kyljessä välähtää kristalli-ikkuna (arvottu paikka) hetkeksi: ammu siihen
// tulimarja ritsalla. Kolme kierrosta: enemmän kiviä, nopeammin, lyhyempi
// ikkuna. Kolmas osuma lämmittää jätin sydämen, ja se rauhoittuu ystäväksi.
// Tehtävät kierrosten välissä: kuviosarja, muistiloitsu 5/4.

var GIANT_ROUNDS = [
  { rocks: 2, gap: 1.5, flight: 2.0, window: 3.0 },
  { rocks: 3, gap: 1.2, flight: 1.7, window: 2.4 },
  { rocks: 4, gap: 1.0, flight: 1.5, window: 1.9 }
];
var GIANT_FIRE_RANGE = 0.34;    // tulipallon kantama (× viewW) Mintun suusta
var GIANT_FIRE_CD = 0.45;
// Ikkunat ovat vartalon etureunassa (prinsessan puolella), jotta marja pääsee niihin
var GIANT_WINDOWS = [
  { dx: -0.075, dy: 0.06 },     // vatsa
  { dx: -0.12, dy: -0.13 },     // olkapää
  { dx: -0.055, dy: -0.30 }     // otsa
];

var giant = {
  state: 'sleep', t: 0, round: 0, hits: 0,
  rocks: [], fireballs: [], shards: [], thrown: 0, nextThrow: 0,
  win: -1, winT: 0, fireCd: 0, melted: 0,
  aim: { active: false, sx: 0, sy: 0, dx: 0, dy: 0 }, reload: 0, shots: 0, hintT: 0,
  fruits: [], splats: [], taskDelay: 0, armT: 0, hurtT: 0, eyeGlow: 0, calmT: 0
};

function giantS() { return viewH * 0.23; }
function giantPos() { return { x: viewW * 0.72, y: groundTop - giantS() * 0.95 }; }
function giantWindowPos(i) {
  var g = giantPos(), s = giantS(), w = GIANT_WINDOWS[i];
  return { x: g.x + w.dx * viewW, y: g.y + w.dy * viewH, r: s * 0.2 };
}
function giantFork() { return { x: princess.x + viewH * 0.07, y: princess.y - viewH * 0.125 }; }
function giantMinttu() { return { x: princess.x - viewH * 0.11, y: groundTop + viewH * 0.02 }; }
function giantMouth() { var m = giantMinttu(), s = viewH * 0.055; return { x: m.x + s * 1.7, y: m.y - s * 1.5 }; }

// ---------- Alustus ----------
function initGiant() {
  var i;
  tasks = [makeTask(-5, 'pattern'), makeTask(-5, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  giant.state = 'sleep';
  giant.t = 0;
  giant.round = 0;
  giant.hits = 0;
  giant.rocks = [];
  giant.fireballs = [];
  giant.shards = [];
  giant.fruits = [];
  giant.splats = [];
  giant.thrown = 0;
  giant.nextThrow = 0;
  giant.win = -1;
  giant.winT = 0;
  giant.fireCd = 0;
  giant.melted = 0;
  giant.aim.active = false;
  giant.reload = 0;
  giant.shots = 0;
  giant.hintT = 0;
  giant.taskDelay = 0;
  giant.armT = 0;
  giant.hurtT = 0;
  giant.eyeGlow = 0;
  giant.calmT = 0;
  princess.x = viewW * 0.20;
  princess.y = groundTop + viewH * 0.03;
  princess.facing = 1;
  camX = 0;
  renderBackground();
  playNote(196, 0, 0.5, 'triangle', 0.3);
  playNote(147, 0.3, 0.7, 'triangle', 0.3);
}
function respawnGiant() {
  // Sydämet loppu: kierros alkaa alusta heitoista
  giant.rocks = [];
  giant.fireballs = [];
  giant.fruits = [];
  giant.state = 'tell';
  giant.t = 0;
  giant.win = -1;
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}
function resizeGiant() {
  princess.x = viewW * 0.20;
  princess.y = groundTop + viewH * 0.03;
  camX = 0;
}

// ---------- Tuli: Minttu sulattaa lähellä olevan kiven ----------
function giantRockInRange(r) {
  var m = giantMouth(), dx = r.x - m.x, dy = r.y - m.y;
  return dx * dx + dy * dy < GIANT_FIRE_RANGE * viewW * GIANT_FIRE_RANGE * viewW;
}
function giantFire() {
  var i, r, best = null, bd = 1e9, m = giantMouth(), dx, dy, d;
  if (giant.fireCd > 0) return;
  giant.fireCd = GIANT_FIRE_CD;
  for (i = 0; i < giant.rocks.length; i++) {
    r = giant.rocks[i];
    if (r.dead || !giantRockInRange(r)) continue;
    dx = r.x - m.x; dy = r.y - m.y; d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = r; }
  }
  if (!best) {
    // Ei kiveä kantamalla: pieni pöllähdys
    spawnDust(m.x, m.y, 5, -1);
    playNote(180, 0, 0.12, 'triangle', 0.15);
    return;
  }
  best.targeted = true;
  giant.fireballs.push({ x: m.x, y: m.y, target: best, t: 0 });
  playNote(110, 0, 0.25, 'sawtooth', 0.2);
  playNote(660, 0.02, 0.12, 'triangle', 0.18);
  playNote(880, 0.1, 0.2, 'triangle', 0.14);
}

// ---------- Ritsa ----------
function handleGiantTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  giant.aim.active = true;
  giant.aim.sx = px;
  giant.aim.sy = py;
  giant.aim.dx = 0;
  giant.aim.dy = 0;
}
function giantRelease() {
  var a = giant.aim, v, f;
  a.active = false;
  v = nestLaunchVel(a.dx, a.dy);
  if (v.len < NEST_MIN_PULL * viewH || giant.reload > 0) return;
  f = giantFork();
  giant.fruits.push({ x: f.x, y: f.y, vx: v.vx, vy: v.vy, rot: 0, trail: [], age: 0 });
  giant.reload = NEST_RELOAD;
  giant.shots++;
  soundTwang();
}
// Osuuko piste jätin kivivartaloon (ellipsi + pää)
function giantHitBody(x, y, r) {
  var g = giantPos(), s = giantS(), w, dx, dy;
  // Avoimen ikkunan lähellä kivi ei estä: marja pääsee ikkunaan asti
  if (giant.win >= 0 && giant.state === 'window') {
    w = giantWindowPos(giant.win);
    dx = x - w.x; dy = y - w.y;
    if (dx * dx + dy * dy < w.r * w.r * 2.6) return false;
  }
  dx = (x - g.x) / (s * 0.62 + r); dy = (y - g.y) / (s * 0.9 + r);
  if (dx * dx + dy * dy <= 1) return true;
  dx = x - (g.x + s * 0.1); dy = y - (g.y - s * 1.2);
  return dx * dx + dy * dy <= (s * 0.55 + r) * (s * 0.55 + r);
}
function giantPreview(vx, vy) {
  var f = giantFork(), x = f.x, y = f.y, pts = [], i, step = 1 / 60, w, dx, dy, hit = false;
  for (i = 0; i < 150; i++) {
    vy += NEST_G * viewH * step;
    x += vx * step;
    y += vy * step;
    if (y > groundTop + viewH * 0.01 || x > viewW * 1.05 || x < -viewW * 0.05) break;
    if (giant.win >= 0) {
      w = giantWindowPos(giant.win);
      dx = x - w.x; dy = y - w.y;
      if (dx * dx + dy * dy < w.r * w.r * 0.6) { hit = true; break; }
    }
    if (giantHitBody(x, y, viewH * 0.012)) break;
    if (i % 3 === 2) pts.push({ x: x, y: y });
  }
  return { pts: pts, hit: hit };
}

// ---------- Päivitys ----------
function updateGiant(dt) {
  var i, j, r, fb, fr, busy, R = GIANT_ROUNDS[Math.min(giant.round, GIANT_ROUNDS.length - 1)], w, dx, dy, s = giantS(), k, m;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (giant.fireCd > 0) giant.fireCd -= dt;
  if (giant.reload > 0) giant.reload -= dt;
  if (giant.hurtT > 0) giant.hurtT -= dt;
  if (giant.taskDelay > 0 && !busy) {
    giant.taskDelay -= dt;
    if (giant.taskDelay <= 0) {
      if (giant.hits === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (giant.hits === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Tähtäys
  if (giant.aim.active) {
    if (holding && !busy) { giant.aim.dx = lastPX - giant.aim.sx; giant.aim.dy = lastPY - giant.aim.sy; }
    else if (busy) giant.aim.active = false;
    else giantRelease();
  }
  if (giant.shots === 0 && giant.win >= 0 && !busy) giant.hintT += dt;

  // Jätin tilakone
  if (!busy && !celebrating) giant.t += dt;
  if (giant.state === 'sleep') {
    if (giant.t > 1.8) { giant.state = 'wake'; giant.t = 0; artShakeStart(viewH * 0.012, 0.8); playNote(80, 0, 0.8, 'sawtooth', 0.25); playNote(60, 0.3, 1.0, 'sawtooth', 0.2); }
  } else if (giant.state === 'wake') {
    giant.eyeGlow = Math.min(1, giant.t / 1.0);
    if (giant.t > 1.4) { giant.state = 'tell'; giant.t = 0; }
  } else if (giant.state === 'tell') {
    // Käsi nousee: varoitus ennen heittoja
    giant.armT = Math.min(1, giant.t / 0.9);
    if (giant.t > 1.0) { giant.state = 'volley'; giant.t = 0; giant.thrown = 0; giant.nextThrow = 0.1; }
  } else if (giant.state === 'volley') {
    giant.nextThrow -= dt;
    if (giant.thrown < R.rocks && giant.nextThrow <= 0 && !busy) {
      giantThrow(R);
      giant.thrown++;
      giant.nextThrow = R.gap;
    }
    if (giant.thrown >= R.rocks && giant.rocks.length === 0) {
      giant.state = 'window';
      giant.t = 0;
      giant.armT = 0;
      giant.win = Math.floor(Math.random() * GIANT_WINDOWS.length);
      giant.winT = R.window;
      w = giantWindowPos(giant.win);
      artPop(w.x, w.y, w.r * 2, '#7fd4ff', 'ring');
      playNote(1047, 0, 0.15, 'sine', 0.35);
      playNote(1319, 0.1, 0.25, 'sine', 0.3);
    }
  } else if (giant.state === 'window') {
    if (!busy) giant.winT -= dt;
    if (giant.winT <= 0) {
      // Ikkuna sulkeutui: uudet heitot
      giant.win = -1;
      giant.state = 'tell';
      giant.t = 0;
      playNote(300, 0, 0.2, 'triangle', 0.2);
    }
  } else if (giant.state === 'hurt') {
    if (giant.t > 1.3) {
      if (giant.hits >= GIANT_ROUNDS.length) { giant.state = 'calm'; giant.t = 0; giant.calmT = 0; soundFanfare(); }
      else { giant.round = giant.hits; giant.state = 'tell'; giant.t = 0; }
    }
  } else if (giant.state === 'calm') {
    giant.calmT += dt;
    if (giant.calmT > 2.4 && !celebrating) startCelebration();
  }

  // Laavakivet lentävät kaaressa prinsessaa kohti
  for (i = giant.rocks.length - 1; i >= 0; i--) {
    r = giant.rocks[i];
    if (busy) continue;
    r.t += dt;
    k = Math.min(1, r.t / r.flight);
    r.x = r.x0 + (r.x1 - r.x0) * k;
    r.y = r.y0 + (r.y1 - r.y0) * k - Math.sin(k * Math.PI) * r.arc;
    r.rot += dt * 3;
    if (k >= 1) {
      // Maahan: lähellä prinsessaa vie sydämen
      giantShatter(r, Math.abs(r.x - princess.x) < viewW * 0.14);
      giant.rocks.splice(i, 1);
    }
  }
  // Tulipallot lentävät kohteeseensa
  for (i = giant.fireballs.length - 1; i >= 0; i--) {
    fb = giant.fireballs[i];
    fb.t += dt;
    r = fb.target;
    if (giant.rocks.indexOf(r) < 0) { giant.fireballs.splice(i, 1); continue; }
    dx = r.x - fb.x; dy = r.y - fb.y;
    var dist = Math.sqrt(dx * dx + dy * dy), sp = viewW * 1.3 * dt;
    if (dist <= sp) {
      giantMelt(r);
      giant.rocks.splice(giant.rocks.indexOf(r), 1);
      giant.fireballs.splice(i, 1);
    } else {
      fb.x += dx / dist * sp;
      fb.y += dy / dist * sp;
      if (Math.random() < dt * 30) spawnSparkles(fb.x, fb.y, 1, Math.random() < 0.5 ? '#ffb347' : '#ff6a2a');
    }
  }
  // Marjat lennossa: ikkunaan osuma, muuten läiskähdys
  for (i = giant.fruits.length - 1; i >= 0; i--) {
    fr = giant.fruits[i];
    fr.age += dt;
    fr.trail.push({ x: fr.x, y: fr.y });
    if (fr.trail.length > 9) fr.trail.shift();
    fr.vy += NEST_G * viewH * dt;
    fr.x += fr.vx * dt;
    fr.y += fr.vy * dt;
    fr.rot += dt * 9;
    if (giant.win >= 0 && giant.state === 'window') {
      w = giantWindowPos(giant.win);
      dx = fr.x - w.x; dy = fr.y - w.y;
      if (dx * dx + dy * dy < w.r * w.r) { giantHit(w); giant.fruits.splice(i, 1); continue; }
    }
    if (fr.y > groundTop + viewH * 0.01 || giantHitBody(fr.x, fr.y, viewH * 0.012)) {
      giant.splats.push({ x: fr.x, y: Math.min(fr.y, groundTop + viewH * 0.01), t: 0 });
      spawnSparkles(fr.x, fr.y, 6, '#ff6a4a');
      soundSplat();
      giant.fruits.splice(i, 1);
      continue;
    }
    if (fr.x > viewW * 1.1 || fr.x < -viewW * 0.1 || fr.age > 6) giant.fruits.splice(i, 1);
  }
  for (i = giant.splats.length - 1; i >= 0; i--) { giant.splats[i].t += dt; if (giant.splats[i].t > 0.7) giant.splats.splice(i, 1); }
  for (i = giant.shards.length - 1; i >= 0; i--) {
    m = giant.shards[i];
    m.t += dt;
    m.x += m.vx * dt; m.y += m.vy * dt; m.vy += viewH * 1.2 * dt;
    if (m.t > 0.8) giant.shards.splice(i, 1);
  }
}

function giantThrow(R) {
  var g = giantPos(), s = giantS(), tx = princess.x + (Math.random() - 0.5) * viewW * 0.12, hand = { x: g.x - s * 0.7, y: g.y - s * 1.1 };
  giant.rocks.push({ x0: hand.x, y0: hand.y, x1: tx, y1: groundTop + viewH * 0.02, x: hand.x, y: hand.y, t: 0, flight: R.flight, arc: viewH * (0.32 + Math.random() * 0.12), rot: Math.random() * 6, r: viewH * 0.038, targeted: false });
  playNote(220, 0, 0.15, 'sawtooth', 0.2);
  playNote(160, 0.08, 0.2, 'sawtooth', 0.15);
}
function giantShatter(r, hurt) {
  var i;
  for (i = 0; i < 7; i++) giant.shards.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * viewW * 0.3, vy: -Math.random() * viewH * 0.5, t: 0, s: r.r * (0.25 + Math.random() * 0.3) });
  spawnSparkles(r.x, r.y, 10, '#ff8a3a');
  artShakeStart(viewH * 0.008, 0.3);
  if (hurt && loseHeart()) {
    spawnSparkles(princess.x, princess.y - viewH * 0.1, 12, '#ff6a4a');
  } else {
    playNote(140, 0, 0.15, 'sawtooth', 0.2);
  }
}
function giantMelt(r) {
  giant.melted++;
  artPop(r.x, r.y, r.r * 2.2, '#ffb347', 'burst');
  spawnSparkles(r.x, r.y, 18, '#ffe27a');
  playNote(880, 0, 0.14, 'sine', 0.35);
  playNote(1175, 0.08, 0.22, 'triangle', 0.3);
}
function giantHit(w) {
  giant.hits++;
  giant.state = 'hurt';
  giant.t = 0;
  giant.hurtT = 1.2;
  giant.win = -1;
  giant.rocks = [];
  artPop(w.x, w.y, w.r * 3, '#7fd4ff', 'burst');
  spawnSparkles(w.x, w.y, 26, '#c8f0ff');
  artShakeStart(viewH * 0.015, 0.5);
  playNote(523, 0, 0.2, 'triangle', 0.4);
  playNote(784, 0.12, 0.25, 'triangle', 0.4);
  playNote(1047, 0.25, 0.4, 'triangle', 0.45);
  if (giant.hits === 1 || giant.hits === 2) giant.taskDelay = 1.5;
}

// ---------- Piirto: tausta ----------
function giantLayers() {
  return [
    { speed: 0.3, render: renderGiantFar },
    { speed: 1, render: renderGiantNear }
  ];
}
function renderGiantBg(b, w, h) {
  renderGiantFar(b, w, h);
  renderGiantNear(b, w, h);
}
function renderGiantFar(b, w, h) {
  var i, x, vw = viewW, sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1a0a2a');
  sky.addColorStop(0.5, '#5a2040');
  sky.addColorStop(0.8, '#c85a3a');
  sky.addColorStop(1, '#ffb050');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff3d0';
  for (i = 0; i < 40; i++) {
    x = vw * ((i * 0.137 + 0.03) % 1);
    b.globalAlpha = 0.25 + (i % 4) * 0.15;
    b.beginPath(); b.arc(x, h * (0.02 + (i * 0.071) % 0.3), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, vw * 0.3, h * 0.2, h * 0.05, 0.3, '#ffd9a0', '#fff6dc', '#ffb457');
  // Kraatterin reunat ja savu
  fillHillBand(b, w, h, h * 0.62, artMix('#5a2a3a', '#ffb050', 0.25), function (px) {
    return h * 0.58 - Math.abs(Math.sin(px * 0.004 + 0.8)) * h * 0.1;
  });
  b.fillStyle = 'rgba(255,200,180,0.35)';
  for (i = 0; i < 5; i++) cloudShape(b, vw * (0.55 + i * 0.1), h * (0.3 - i * 0.04), h * (0.02 + i * 0.008));
}
function renderGiantNear(b, w, h) {
  var i, x, g, vw = viewW;
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#6a3a3a');
  g.addColorStop(1, '#2a1418');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  // Laavarailot maassa
  for (i = 0; i < 9; i++) {
    x = vw * (0.05 + i * 0.11);
    artGlow(b, x, groundTop + h * 0.06 + (i % 3) * h * 0.04, h * 0.04, '#ff8a3a', 0.4);
    b.strokeStyle = '#ff9a4a';
    b.lineWidth = Math.max(2, h * 0.006);
    b.lineCap = 'round';
    b.beginPath(); b.moveTo(x - h * 0.03, groundTop + h * 0.05 + (i % 3) * h * 0.04); b.lineTo(x + h * 0.01, groundTop + h * 0.07 + (i % 3) * h * 0.04); b.lineTo(x + h * 0.04, groundTop + h * 0.055 + (i % 3) * h * 0.04); b.stroke();
  }
  b.fillStyle = 'rgba(255,200,160,0.12)';
  b.fillRect(0, groundTop + h * 0.015, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  // Kivet ja kristallit reunoilla
  for (i = 0; i < 4; i++) {
    x = vw * (0.04 + i * 0.05);
    artBlob(b, x, groundTop - h * 0.01, h * (0.03 + (i % 2) * 0.02), h * 0.025, '#7a4a4a', { shadeTo: '#3a1a1a', lineColor: '#2a0a0a', hi: 0.2 });
  }
  drawNestCrystal(b, vw * 0.1, groundTop + h * 0.01, h * 0.05);
  drawNestCrystal(b, vw * 0.94, groundTop + h * 0.01, h * 0.06);
}

// ---------- Piirto: jätti ----------
function drawGiantBody(c) {
  var g = giantPos(), s = giantS(), st = giant.state, i, w, calm = st === 'calm', sleep = st === 'sleep';
  var hurt = giant.hurtT > 0 ? Math.sin(giant.hurtT * 30) * s * 0.03 : 0;
  var x = g.x + hurt, y = g.y, arm = giant.armT, body = calm ? '#8a7a6a' : '#6a5a5a', dark = '#3a2a2a';
  var breathe = Math.sin(globalT * (sleep ? 1.2 : 2.4)) * 0.01;
  artShadow(c, x, groundTop + viewH * 0.02, s * 1.0, s * 0.18, 0.25);
  c.save();
  c.translate(x, y);
  c.scale(1 - breathe, 1 + breathe);
  // Jalat
  artBlob(c, -s * 0.4, s * 0.85, s * 0.3, s * 0.22, body, { lineColor: dark, shadeTo: '#4a3a3a' });
  artBlob(c, s * 0.42, s * 0.85, s * 0.3, s * 0.22, body, { lineColor: dark, shadeTo: '#4a3a3a' });
  // Heittokäsi (vasen, prinsessaa kohti): nousee varoitukseksi
  artLimb(c, -s * 0.5, -s * 0.3, -s * 0.7 - arm * s * 0.2, s * 0.35 - arm * s * 1.5, s * 0.26, body, dark);
  if (arm > 0.05 && st !== 'hurt') {
    artCircle(c, -s * 0.7 - arm * s * 0.2, s * 0.3 - arm * s * 1.5, s * 0.16 * arm, '#ff8a3a', { lineColor: '#7a2a10', hi: 0.4 });
    artGlow(c, -s * 0.7 - arm * s * 0.2, s * 0.3 - arm * s * 1.5, s * 0.5 * arm, '#ff8a3a', 0.4);
  }
  // Vartalo
  artBlob(c, 0, 0, s * 0.62, s * 0.9, body, { lineColor: dark, shadeTo: '#4a3a3a', hi: 0.15 });
  // Sammalta ja halkeamia
  artBlob(c, -s * 0.25, -s * 0.6, s * 0.25, s * 0.1, '#5faa62', { line: false });
  artBlob(c, s * 0.3, s * 0.4, s * 0.18, s * 0.08, '#5faa62', { line: false });
  c.strokeStyle = calm ? 'rgba(255,200,120,0.8)' : 'rgba(255,120,60,' + (0.35 + giant.eyeGlow * 0.4) + ')';
  c.lineWidth = Math.max(2, s * 0.03);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.1, s * 0.5); c.lineTo(s * 0.05, s * 0.3); c.lineTo(-s * 0.05, s * 0.1); c.stroke();
  c.beginPath(); c.moveTo(s * 0.35, -s * 0.5); c.lineTo(s * 0.45, -s * 0.2); c.stroke();
  // Toinen käsi
  artLimb(c, s * 0.5, -s * 0.3, s * 0.85, s * 0.45, s * 0.26, body, dark);
  // Pää
  artCircle(c, s * 0.1, -s * 1.2, s * 0.55, body, { lineColor: dark, shadeTo: '#4a3a3a', hi: 0.2 });
  artBlob(c, s * 0.1, -s * 1.7, s * 0.3, s * 0.12, '#5faa62', { line: false });
  // Silmät: nukkuessa viivat, hereillä hehkuvat, rauhoittuneena lempeät
  if (sleep) {
    artEye(c, -s * 0.1, -s * 1.25, s * 0.09, 0, true);
    artEye(c, s * 0.28, -s * 1.25, s * 0.09, 0, true);
  } else if (calm) {
    artEye(c, -s * 0.1, -s * 1.25, s * 0.1, -0.4, (globalT % 3.3) < 0.12);
    artEye(c, s * 0.28, -s * 1.25, s * 0.1, -0.4, (globalT % 3.3) < 0.12);
    artBlush(c, -s * 0.25, -s * 1.05, s * 0.08);
    artBlush(c, s * 0.42, -s * 1.05, s * 0.08);
    c.strokeStyle = dark; c.lineWidth = Math.max(2, s * 0.03);
    c.beginPath(); c.arc(s * 0.1, -s * 1.05, s * 0.18, 0.3, Math.PI - 0.3); c.stroke();
  } else {
    artGlow(c, -s * 0.1, -s * 1.25, s * 0.22, '#ff8a3a', 0.5 * giant.eyeGlow);
    artGlow(c, s * 0.28, -s * 1.25, s * 0.22, '#ff8a3a', 0.5 * giant.eyeGlow);
    artCircle(c, -s * 0.1, -s * 1.25, s * 0.09, artMix('#7a5a5a', '#ffb347', giant.eyeGlow), { lineColor: dark });
    artCircle(c, s * 0.28, -s * 1.25, s * 0.09, artMix('#7a5a5a', '#ffb347', giant.eyeGlow), { lineColor: dark });
    c.strokeStyle = dark; c.lineWidth = Math.max(2, s * 0.03);
    c.beginPath(); c.moveTo(-s * 0.05, -s * 0.98); c.lineTo(s * 0.25, -s * 0.98); c.stroke();
  }
  c.restore();
  // Kristalli-ikkunat: himmeät kiviluukut, avoin ikkuna hehkuu
  for (i = 0; i < GIANT_WINDOWS.length; i++) {
    w = giantWindowPos(i);
    if (giant.win === i && st === 'window') {
      var k = Math.max(0, giant.winT / GIANT_ROUNDS[Math.min(giant.round, 2)].window);
      artGlow(c, w.x + hurt, w.y, w.r * 3, '#7fd4ff', 0.5 + Math.sin(globalT * 8) * 0.2);
      artCircle(c, w.x + hurt, w.y, w.r, '#bfe8ff', { lineColor: '#3a86b8', shadeTo: '#5fa8ff', hi: 0.5 });
      drawScaleGem(c, w.x + hurt, w.y, w.r * 0.55, '#7fd4ff');
      // Aikarengas: ikkuna sulkeutuu, kun kaari kutistuu
      c.strokeStyle = '#ffffff';
      c.lineWidth = Math.max(2, w.r * 0.14);
      c.beginPath(); c.arc(w.x + hurt, w.y, w.r * 1.3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
    } else if (calm) {
      artCircle(c, w.x + hurt, w.y, w.r * 0.8, '#ffd24f', { lineColor: '#b8862a', hi: 0.4 });
    } else {
      artCircle(c, w.x + hurt, w.y, w.r * 0.8, '#5a4a4a', { lineColor: '#2a1a1a', hi: 0.1 });
    }
  }
  if (calm) {
    // Sydän lämpenee: sydämiä leijuu
    for (i = 0; i < 4; i++) {
      var ht = (giant.calmT * 0.6 + i * 0.25) % 1;
      c.globalAlpha = 1 - ht;
      drawHeartShape(c, x + Math.sin(ht * 6 + i) * s * 0.2 + (i - 1.5) * s * 0.2, y - s * 0.2 - ht * s * 1.2, s * 0.08, true);
      c.globalAlpha = 1;
    }
  }
}
function drawGiantRock(c, r) {
  var g = 1 - Math.min(1, r.t / r.flight);
  artGlow(c, r.x, r.y, r.r * 2.2, '#ff8a3a', 0.45);
  c.save();
  c.translate(r.x, r.y);
  c.rotate(r.rot);
  artBlob(c, 0, 0, r.r, r.r * 0.85, '#5a3a3a', { lineColor: '#2a1010', shadeTo: '#3a2020', hi: 0.15 });
  c.strokeStyle = '#ff9a4a';
  c.lineWidth = Math.max(2, r.r * 0.14);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r.r * 0.5, -r.r * 0.2); c.lineTo(-r.r * 0.1, r.r * 0.1); c.lineTo(r.r * 0.4, -r.r * 0.3); c.stroke();
  c.beginPath(); c.moveTo(-r.r * 0.2, r.r * 0.5); c.lineTo(r.r * 0.2, r.r * 0.3); c.stroke();
  c.restore();
  if (giantRockInRange(r) && !r.targeted) {
    // Kantamalla: oranssi rengas kertoo että nyt voi puhaltaa
    c.strokeStyle = 'rgba(255,180,80,' + (0.6 + Math.sin(globalT * 10) * 0.3) + ')';
    c.lineWidth = Math.max(2, r.r * 0.18);
    c.beginPath(); c.arc(r.x, r.y, r.r * 1.7, 0, Math.PI * 2); c.stroke();
  }
}

function drawGiant() {
  var i, c = ctx, s = viewH * 0.055, f, v, pouch, pv, fr, sp, k, a, m = giantMinttu(), w;
  if (!beginPlayWorld()) return;
  drawGiantBody(c);
  for (i = 0; i < tasks.length; i++) drawTaskArch(c, tasks[i]);
  // Prinsessa, ritsa ja Minttu
  f = giantFork();
  var aiming = giant.aim.active;
  v = aiming ? nestLaunchVel(giant.aim.dx, giant.aim.dy) : null;
  pouch = { x: f.x + (v ? v.px : 0), y: f.y + (v ? v.py : 0) };
  drawBabyDragon(c, m.x, m.y, s * 1.1, '#7fe0c8', { mouth: giant.fireballs.length ? 0.8 : 0, flap: Math.sin(globalT * 5) * 0.25, look: 0.4, blink: (globalT % 4.1) < 0.12, facing: -1 });
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) c.globalAlpha = 0.45;
  drawPrincessFree(c, princess.x, princess.y, viewH / 560, 1, 0, false, globalT);
  c.globalAlpha = 1;
  drawSlingshot(c, f, s * 0.75, pouch);
  if (giant.reload <= 0) drawFireBerry(c, pouch.x, pouch.y - s * 0.05, s * 0.3, 0, true);
  if (aiming && v && v.len > NEST_MIN_PULL * viewH && giant.reload <= 0) {
    pv = giantPreview(v.vx, v.vy);
    for (i = 0; i < pv.pts.length; i++) {
      a = Math.max(0.15, 0.85 - i * 0.02);
      c.fillStyle = pv.hit ? 'rgba(255,240,150,' + a + ')' : 'rgba(255,255,255,' + a * 0.8 + ')';
      c.beginPath(); c.arc(pv.pts[i].x, pv.pts[i].y, Math.max(2, s * (0.12 - i * 0.0015)), 0, Math.PI * 2); c.fill();
    }
  }
  // Vihje ensimmäisessä ikkunassa: käsi vetää ritsaa
  if (giant.shots === 0 && giant.win >= 0 && giant.state === 'window' && !aiming) {
    var hp = giant.hintT % 3.0;
    if (hp > 0.4 && hp < 2.2) {
      k = easeInOutSine(Math.min(1, (hp - 0.4) / 1.4));
      var hx = f.x - k * viewH * 0.1, hy = f.y + k * viewH * 0.06;
      c.globalAlpha = hp > 1.9 ? (2.2 - hp) / 0.3 : 1;
      drawHand(c, hx + s * 0.3, hy + s * 0.6, viewH * 0.03);
      c.globalAlpha = 1;
    }
  }
  // Laavakivet, tulipallot, marjat
  for (i = 0; i < giant.rocks.length; i++) drawGiantRock(c, giant.rocks[i]);
  for (i = 0; i < giant.fireballs.length; i++) {
    var fb = giant.fireballs[i];
    artGlow(c, fb.x, fb.y, s * 1.2, '#ff8a3a', 0.6);
    artBlob(c, fb.x, fb.y, s * 0.42, s * 0.36, '#ffb347', { line: false });
    artBlob(c, fb.x, fb.y, s * 0.24, s * 0.2, '#fff4b0', { line: false });
  }
  for (i = 0; i < giant.fruits.length; i++) {
    fr = giant.fruits[i];
    for (k = 0; k < fr.trail.length; k++) {
      c.fillStyle = 'rgba(255,200,120,' + (0.08 + k * 0.05) + ')';
      c.beginPath(); c.arc(fr.trail[k].x, fr.trail[k].y, s * (0.08 + k * 0.02), 0, Math.PI * 2); c.fill();
    }
    drawFireBerry(c, fr.x, fr.y, s * 0.3, fr.rot, true);
  }
  for (i = 0; i < giant.shards.length; i++) {
    sp = giant.shards[i];
    c.globalAlpha = 1 - sp.t / 0.8;
    artBlob(c, sp.x, sp.y, sp.s, sp.s * 0.8, '#5a3a3a', { lineColor: '#2a1010' });
    c.globalAlpha = 1;
  }
  for (i = 0; i < giant.splats.length; i++) {
    sp = giant.splats[i];
    k = sp.t / 0.7;
    artBlob(c, sp.x, sp.y, s * (0.3 + k * 0.5), s * 0.1, '#ff6a4a', { line: false, alpha: 0.6 * (1 - k) });
  }
  drawParticlesLayer(c);
  endPlayWorld();
  // HUD: jätin sydämen lämpö (osumat) ja sulatetut kivet
  drawGiantHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}
function drawGiantHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * GIANT_ROUNDS.length + pad + hs * 5.5, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < GIANT_ROUNDS.length; i++) {
    c.globalAlpha = i < giant.hits ? 1 : 0.3;
    drawScaleGem(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 1.1, '#7fd4ff');
    c.globalAlpha = 1;
  }
  var fx = left + pad * 0.5 + hs * 3.2 * GIANT_ROUNDS.length + hs * 1.2;
  artBlob(c, fx, pad * 0.5 + hs * 2.0, hs * 0.6, hs * 0.75, '#ff6a2a', { lineColor: '#a83a10' });
  artBlob(c, fx + hs * 0.05, pad * 0.5 + hs * 2.2, hs * 0.32, hs * 0.42, '#ffd24f', { line: false });
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(hs * 1.6) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(String(giant.melted), fx + hs * 1.1, pad * 0.5 + hs * 1.95);
  c.textBaseline = 'alphabetic';
}

HUB_ICONS.giant = function (c, x, y, s) {
  artBlob(c, x, y + s * 0.04, s * 0.13, s * 0.17, '#6a5a5a', { lineColor: '#3a2a2a', shadeTo: '#4a3a3a' });
  artCircle(c, x + s * 0.02, y - s * 0.17, s * 0.1, '#6a5a5a', { lineColor: '#3a2a2a' });
  artBlob(c, x + s * 0.02, y - s * 0.26, s * 0.06, s * 0.025, '#5faa62', { line: false });
  artCircle(c, x - s * 0.02, y - s * 0.18, s * 0.02, '#ffb347', { line: false });
  artCircle(c, x + s * 0.06, y - s * 0.18, s * 0.02, '#ffb347', { line: false });
  drawScaleGem(c, x, y + s * 0.05, s * 0.05, '#7fd4ff');
};
