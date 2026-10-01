'use strict';

// Merenpohja: uidaan sormea kohti (↑ = potku ylöspäin), helmet kerätään
// simpukoista, meduusat pistävät ja virtaukset työntävät. Sydämet käytössä.

var PEARL_COUNT = 8;
var reefPearls = [];
var jellies = [];
var currents = [];
var chest = { fx: 0.95, x: 0, open: false };
// fy = korkeus ruudun yläreunasta (osuus viewH:sta); vesi ulottuu 0.14 … 0.91
var pearlDefs = [
  { fx: 0.08, fy: 0.58 }, { fx: 0.17, fy: 0.28 }, { fx: 0.27, fy: 0.76 }, { fx: 0.40, fy: 0.32 },
  { fx: 0.50, fy: 0.70 }, { fx: 0.60, fy: 0.24 }, { fx: 0.73, fy: 0.74 }, { fx: 0.86, fy: 0.36 }
];
var jellyDefs = [
  { fx: 0.22, baseY: 0.48, amp: 0.20, phase: 0, speed: 0.9 },
  { fx: 0.45, baseY: 0.42, amp: 0.24, phase: 2, speed: 1.1 },
  { fx: 0.56, baseY: 0.62, amp: 0.16, phase: 1, speed: 1.0 },
  { fx: 0.80, baseY: 0.46, amp: 0.24, phase: 3, speed: 1.2 }
];
var currentDefs = [{ fx: 0.36, fy: 0.5, dir: -1 }, { fx: 0.70, fy: 0.36, dir: 1 }];
var REEF_CORALS = ['#ff7a9c', '#ffb46b', '#c98bff', '#6fe0d0'];
var REEF_WATER = '#2a90c8'; // keskiveden sävy: kaukaiset koristeet sävytetään tähän
// Taustarivistön (16 korallia ja levää) jäsenet, jotka piirretään tökättävinä
// koristeina taustan sijaan: 3 ja 9 ovat leviä, 6 ja 12 koralleja
var REEF_PROP_IDX = [3, 6, 9, 12];
// Pikkukalat uiskentelevat paikallaan ja pyrähtävät karkuun tökättäessä
var reefFishDefs = [
  { fx: 0.13, fy: 0.44, color: '#ffb46b' }, { fx: 0.40, fy: 0.56, color: '#6fe0d0' },
  { fx: 0.64, fy: 0.56, color: '#ff7a9c' }, { fx: 0.90, fy: 0.52, color: '#c98bff' }
];
var reefFish = [];
var reefBubbles = []; // tökätyn levän ja kalan kuplat
var reefWhale = null; // yllätys: hehkuva valas lipuu kaukana (levän 5. tökkäys)

function reefFloorY() {
  return groundBottom - viewH * 0.03;
}

function layoutReef() {
  var i;
  for (i = 0; i < reefPearls.length; i++) {
    reefPearls[i].ax = pearlDefs[i].fx * worldW;
    reefPearls[i].ay = pearlDefs[i].fy * viewH;
  }
  for (i = 0; i < jellies.length; i++) {
    jellies[i].x = jellyDefs[i].fx * worldW;
    jellies[i].baseY = jellyDefs[i].baseY * viewH;
    jellies[i].amp = jellyDefs[i].amp * viewH;
  }
  for (i = 0; i < currents.length; i++) {
    currents[i].x = currentDefs[i].fx * worldW;
    currents[i].y = currentDefs[i].fy * viewH;
  }
  for (i = 0; i < reefFish.length; i++) {
    reefFish[i].baseX = reefFishDefs[i].fx * worldW;
    reefFish[i].baseY = reefFishDefs[i].fy * viewH;
    reefFish[i].x = reefFish[i].baseX;
    reefFish[i].y = reefFish[i].baseY;
  }
  chest.x = chest.fx * worldW;
  reefProps();
}

function initReef() {
  var i;
  tasks = [makeTask(0.32, 'pairs', { pairs: 4 }), makeTask(0.64, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.46, 0.78]);
  reefPearls = [];
  for (i = 0; i < PEARL_COUNT; i++) reefPearls.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  jellies = [];
  for (i = 0; i < jellyDefs.length; i++) jellies.push({ x: 0, y: 0, baseY: 0, amp: 0, phase: jellyDefs[i].phase, speed: jellyDefs[i].speed, pokeT: 0 });
  currents = [];
  for (i = 0; i < currentDefs.length; i++) currents.push({ x: 0, y: 0, dir: currentDefs[i].dir, t: i });
  reefFish = [];
  for (i = 0; i < reefFishDefs.length; i++) reefFish.push({ x: 0, y: 0, baseX: 0, baseY: 0, color: reefFishDefs[i].color, dir: i % 2 ? -1 : 1, dartT: 0, phase: i * 1.7 });
  reefBubbles = [];
  reefWhale = null;
  layoutReef();
  chest.open = false;
  princess.x = viewW * 0.10;
  princess.y = viewH * 0.5;
  princess.vx = 0;
  princess.vy = 0;
  princess.knockVx = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(523, 0.15, 0.3, 'sine', 0.3);
  playNote(659, 0.3, 0.4, 'triangle', 0.3);
}

function respawnReef() {
  princess.x = checkpoint.x;
  princess.y = viewH * 0.5;
  princess.vx = 0;
  princess.vy = 0;
  princess.knockVx = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#cfefff');
}

function resizeReef(ratio) {
  princess.x *= ratio;
  layoutReef();
}

function collectReefPearl(p) {
  p.collected = true;
  registerCollected(p);
  spawnSparkles(p.ax, p.ay, 14, '#ffffff');
  playNote(880 + countCollected(reefPearls) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(reefPearls) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(reefPearls) === PEARL_COUNT && !chest.open) {
    chest.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleReefTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < reefPearls.length; i++) {
    if (reefPearls[i].collected) continue;
    dx = wx - reefPearls[i].ax;
    dy = py - reefPearls[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
      collectReefPearl(reefPearls[i]);
      return;
    }
  }
  // Meduusa pomppaa ja kala pyrähtää karkuun tökkäyksestä (pelkkä koriste);
  // koristeet heilahtavat. Uinti jatkuu sormen mukana kuten ennen.
  for (i = 0; i < jellies.length; i++) {
    if (Math.hypot(wx - jellies[i].x, py - jellies[i].y) < viewH * 0.07) {
      jellies[i].pokeT = 0.8;
      playNote(660, 0, 0.1, 'sine', 0.15);
      playNote(990, 0.08, 0.14, 'sine', 0.12);
      spawnSparkles(jellies[i].x, jellies[i].y, 5, '#ffb0e0');
      reefBubble(jellies[i].x, jellies[i].y - viewH * 0.04, viewH * 0.008);
      return;
    }
  }
  for (i = 0; i < reefFish.length; i++) {
    if (Math.hypot(wx - reefFish[i].x, py - reefFish[i].y) < viewH * 0.05) {
      reefFish[i].dartT = 0.7;
      reefFish[i].dir = wx > reefFish[i].x ? -1 : 1;
      playNote(1400, 0, 0.06, 'square', 0.08);
      playNote(1900, 0.05, 0.06, 'square', 0.06);
      reefBubble(reefFish[i].x, reefFish[i].y, viewH * 0.006);
      reefBubble(reefFish[i].x, reefFish[i].y - viewH * 0.02, viewH * 0.004);
      return;
    }
  }
  propsTap(wx, py);
}

function updateReef(dt) {
  var i, pw = viewH * 0.045, floorY = reefFloorY();
  updateTasks(dt);
  var busy = puzzleBusy();

  // Uinti: kiihdytys sormea kohti, vesi jarruttaa, hiljainen vajoaminen
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.42 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.55 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 2.0);
    princess.vy *= Math.max(0, 1 - dt * 2.0);
    princess.vy += viewH * 0.05 * dt;
  }
  if (princess.knockVx) {
    princess.vx += princess.knockVx * dt * 6;
    princess.knockVx *= Math.max(0, 1 - dt * 5);
    if (Math.abs(princess.knockVx) < 5) princess.knockVx = 0;
  }
  if (princess.vx > viewW * 0.24) princess.vx = viewW * 0.24;
  if (princess.vx < -viewW * 0.24) princess.vx = -viewW * 0.24;
  if (princess.vy > viewH * 0.45) princess.vy = viewH * 0.45;
  if (princess.vy < -viewH * 0.6) princess.vy = -viewH * 0.6;

  princess.x += princess.vx * dt;
  princess.y += princess.vy * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  if (princess.y < viewH * 0.16) { princess.y = viewH * 0.16; if (princess.vy < 0) princess.vy = 0; }
  if (princess.y > floorY) { princess.y = floorY; if (princess.vy > 0) princess.vy = 0; }
  blockPrincessAtTasks();

  // Virtaukset työntävät sivulle
  for (i = 0; i < currents.length; i++) {
    var cu = currents[i];
    cu.t += dt;
    if (!busy && !celebrating && Math.abs(princess.x - cu.x) < viewW * 0.08 && Math.abs(princess.y - cu.y) < viewH * 0.2) {
      princess.vx += cu.dir * viewW * 0.35 * dt;
    }
  }

  // Meduusat kelluvat ylös–alas
  for (i = 0; i < jellies.length; i++) {
    var j = jellies[i];
    if (!busy) j.phase += dt * j.speed;
    if (j.pokeT > 0) j.pokeT -= dt;
    j.y = j.baseY + Math.sin(j.phase) * j.amp;
    var jdx = j.x - princess.x, jdy = j.y - (princess.y - viewH * 0.08);
    if (!celebrating && jdx * jdx + jdy * jdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        princess.knockVx = (princess.x < j.x ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.2;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ff9ecf');
      }
    }
  }

  for (i = 0; i < reefPearls.length; i++) {
    var p = reefPearls[i];
    if (p.collected) continue;
    p.phase += dt * 2;
    var dx = p.ax - princess.x, dy = p.ay - (princess.y - viewH * 0.07);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectReefPearl(p);
  }

  if (chest.open && !celebrating && Math.abs(princess.x - chest.x) < viewH * 0.1 && princess.y > floorY - viewH * 0.22) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  princess.walkPhase += dt * 5;
  if (Math.random() < dt * 3) spawnSparkles(princess.x - princess.facing * viewH * 0.03, princess.y - viewH * 0.14, 1, '#dff6ff');
  reefUpdateFish(dt);
  reefUpdateBubbles(dt);
  if (reefWhale) {
    reefWhale.t += dt;
    if (reefWhale.t > 9) reefWhale = null;
    else if (Math.random() < dt * 2) reefBubble(camX + reefWhaleX() + viewH * 0.05, viewH * 0.27, viewH * 0.005);
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// Pikkukalat: leijuvat kotipaikkansa ympärillä, tökättynä pyrähtävät poispäin ja palaavat
function reefUpdateFish(dt) {
  var i, f, tx;
  for (i = 0; i < reefFish.length; i++) {
    f = reefFish[i];
    f.phase += dt;
    if (f.dartT > 0) {
      f.dartT -= dt;
      f.x += f.dir * viewW * 0.3 * dt;
    } else {
      tx = f.baseX + Math.sin(f.phase * 0.6) * viewH * 0.03;
      if (Math.abs(tx - f.x) > viewH * 0.012) f.dir = tx > f.x ? 1 : -1;
      f.x += (tx - f.x) * Math.min(1, dt * 1.5);
    }
    f.y = f.baseY + Math.sin(f.phase * 1.3) * viewH * 0.012;
  }
}

// Kuplat nousevat kiemurrellen pintaa kohti
function reefBubble(x, y, r) {
  if (reefBubbles.length > 30) reefBubbles.shift();
  reefBubbles.push({ x: x, y: y, r: r, t: 0, vy: viewH * 0.08 + r * 5, ph: Math.random() * 6 });
}
function reefUpdateBubbles(dt) {
  var i, b;
  for (i = reefBubbles.length - 1; i >= 0; i--) {
    b = reefBubbles[i];
    b.t += dt;
    b.y -= b.vy * dt;
    b.x += Math.sin(b.t * 4 + b.ph) * viewH * 0.03 * dt;
    if (b.y < viewH * 0.15 || b.t > 4) reefBubbles.splice(i, 1);
  }
}
function reefDrawBubbles(c) {
  var i, b, sx;
  for (i = 0; i < reefBubbles.length; i++) {
    b = reefBubbles[i];
    sx = b.x - camX;
    if (sx < -b.r * 2 || sx > viewW + b.r * 2) continue;
    c.fillStyle = 'rgba(220,245,255,0.35)';
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(1, b.r * 0.2);
    c.beginPath(); c.arc(sx, b.y, b.r, 0, Math.PI * 2); c.fill(); c.stroke();
    artHighlight(c, sx - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, b.r * 0.18, 0.7);
  }
}

// ---------- Piirto ----------
function reefLayers() {
  return [
    { speed: 0.22, render: renderReefFar },
    { speed: 0.55, render: renderReefMid },
    { speed: 1, render: renderReefNear }
  ];
}
function renderReefBg(b, w, h) {
  renderReefFar(b, w, h);
  renderReefMid(b, w, h);
  renderReefNear(b, w, h);
}
function renderReefFar(b, w, h) {
  var i, x;
  var water = b.createLinearGradient(0, 0, 0, h);
  water.addColorStop(0, '#7ad4f0');
  water.addColorStop(0.45, '#2a90c8');
  water.addColorStop(1, '#0b3a6b');
  b.fillStyle = water;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, -h * 0.02, h * 0.08, 0.22, '#c8f4ff', '#ffffff', '#fff8c8');
  b.fillStyle = 'rgba(255,255,255,0.07)';
  for (i = 0; i < 14; i++) {
    x = w * (0.03 + i * 0.075);
    b.beginPath();
    b.moveTo(x, 0); b.lineTo(x + h * 0.08, 0); b.lineTo(x + h * 0.32, h * 0.8); b.lineTo(x + h * 0.1, h * 0.8);
    b.closePath(); b.fill();
  }
  // Kaukaiset kivikummut veden sävyyn uponneina (ei reunaviivaa)
  for (i = 0; i < 5; i++) {
    x = w * (0.05 + i * 0.22);
    reefDrawRock(b, x, h * 0.86, h * (0.07 + (i % 2) * 0.03), 0.72);
  }
}
function renderReefMid(b, w, h) {
  var i, x;
  // Keskietäisyyden korallit ja levät: veteen sävytetyt siluetit ilman reunaviivaa
  for (i = 0; i < 9; i++) {
    x = w * (0.04 + i * 0.115);
    if (i % 3 === 1) drawKelp(b, x, h * 0.9, h * (0.12 + (i % 2) * 0.04), 0.5);
    else drawCoral(b, x, h * 0.9, h * (0.05 + (i % 2) * 0.015), artMix(REEF_CORALS[i % 4], REEF_WATER, 0.5), true);
  }
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 18; i++) {
    x = (i * 233.7) % w;
    var fy = h * (0.2 + ((i * 53) % 50) / 100);
    b.beginPath();
    if (b.ellipse) b.ellipse(x, fy, h * 0.018, h * 0.009, 0, 0, Math.PI * 2);
    else b.arc(x, fy, h * 0.012, 0, Math.PI * 2);
    b.fill();
    b.beginPath(); b.moveTo(x - h * 0.016, fy); b.lineTo(x - h * 0.03, fy - h * 0.01); b.lineTo(x - h * 0.03, fy + h * 0.01); b.closePath(); b.fill();
  }
}
function renderReefNear(b, w, h) {
  var i, x, floorY = groundBottom - h * 0.03;
  var sand = b.createLinearGradient(0, floorY, 0, h);
  sand.addColorStop(0, '#e8d5a3');
  sand.addColorStop(1, '#b89a66');
  b.fillStyle = sand;
  b.beginPath();
  b.moveTo(0, floorY);
  for (x = 0; x <= w; x += 16) b.lineTo(x, floorY + Math.sin(x * 0.01) * h * 0.008);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Hiekan elämää: kivet, simpukankuoret, merivuokot ja meritähdet
  for (i = 0; i < 4; i++) reefDrawRock(b, w * (0.11 + i * 0.25), floorY + h * 0.03, h * (0.035 + (i % 2) * 0.012));
  for (i = 0; i < 5; i++) reefDrawShell(b, w * (0.05 + i * 0.2) + (i % 2) * h * 0.04, floorY + h * 0.05 + (i % 3) * h * 0.01, h * 0.014, REEF_CORALS[(i + 1) % 4]);
  for (i = 0; i < 3; i++) reefDrawAnemone(b, w * (0.3 + i * 0.27), floorY + h * 0.015, h * 0.035, i % 2 ? '#ff8ab0' : '#c98bff');
  reefDrawStarfish(b, w * 0.46, floorY + h * 0.06, h * 0.025, '#ffb46b', 0.3);
  reefDrawStarfish(b, w * 0.76, floorY + h * 0.065, h * 0.022, '#ff7a9c', 1.2);
  for (i = 0; i < 16; i++) {
    if (REEF_PROP_IDX.indexOf(i) >= 0) continue; // tökättävät koristeet piirretään joka ruudulla (reefProps)
    x = w * (0.02 + i * 0.062) + (i % 3) * h * 0.03;
    if (i % 2 === 0) drawCoral(b, x, floorY + h * 0.01, h * (0.07 + (i % 3) * 0.02), REEF_CORALS[i % 4]);
    else drawKelp(b, x, floorY + h * 0.01, h * (0.16 + (i % 3) * 0.05));
  }
  drawChestFrame(b, chest.x, floorY, h);
}

// Koralli: kolme pyöreäpäistä oksaa reunaviivalla, nupit ja tyvikumpu.
// far = kaukainen: ei reunaviivaa eikä varjoa (väri sävytetty jo veteen)
function drawCoral(b, x, baseY, s, color, far) {
  var i, tx, ty, line = far ? false : artShade(color, -ART.lineDark), o = far ? { line: false } : {};
  if (!far) artShadow(b, x, baseY + s * 0.04, s * 0.7, s * 0.12, 0.14);
  for (i = -1; i <= 1; i++) {
    tx = x + i * s * 0.6;
    ty = baseY - s * (1 - Math.abs(i) * 0.25);
    artLimb(b, x, baseY - s * 0.1, tx, ty, s * 0.22, color, line);
    artCircle(b, tx, ty, s * 0.16, artShade(color, 0.25), far ? o : { hi: 0.4 });
  }
  b.beginPath(); b.arc(x, baseY, s * 0.34, Math.PI, 0); b.closePath();
  artFillPath(b, color, baseY - s * 0.34, baseY, s * 0.34, o);
}

// Levä: kaksi aaltoilevaa vartta reunaviivalla ja lehtisoikiot.
// far = sävytys veteen (0..1, ei reunaviivaa), sway = heilunta (-1..1; vain koristeena)
function drawKelp(b, x, baseY, s, far, sway) {
  var i, k, px, py, w = sway || 0, lw = Math.max(2, s * 0.06);
  var col = far ? artMix('#3fae78', REEF_WATER, far) : '#3fae78';
  var leaf = far ? artMix('#62cf96', REEF_WATER, far) : '#62cf96';
  b.lineCap = 'round';
  b.lineJoin = 'round';
  for (k = -1; k <= 1; k += 2) {
    b.beginPath();
    b.moveTo(x + k * s * 0.05, baseY);
    for (i = 1; i <= 6; i++) {
      b.lineTo(x + k * s * 0.05 + Math.sin(i * 1.1 + k + w) * s * 0.08 + w * (i / 6) * s * 0.12, baseY - (i / 6) * s);
    }
    if (!far) {
      b.strokeStyle = '#1d6a46';
      b.lineWidth = lw + Math.max(ART.lineMin, lw * 0.16) * 2;
      b.stroke();
    }
    b.strokeStyle = col;
    b.lineWidth = lw;
    b.stroke();
    for (i = 2; i <= 4; i += 2) {
      px = x + k * s * 0.05 + Math.sin(i * 1.1 + k + w) * s * 0.08 + w * (i / 6) * s * 0.12;
      py = baseY - (i / 6) * s;
      artBlob(b, px + k * s * 0.09, py, s * 0.1, s * 0.04, leaf, { rot: k * 0.5, line: far ? false : undefined, lineColor: '#1d6a46' });
    }
  }
}

// Arkku: pyöristetty runko ja kansi, kultainen vanne ja lukko
function drawChestFrame(b, x, floorY, h) {
  var s = h * 0.09, lw = Math.max(1.2, s * 0.05);
  artShadow(b, x, floorY + s * 0.03, s * 0.95, s * 0.16, 0.16);
  artRoundRect(b, x - s * 0.7, floorY - s * 0.75, s * 1.4, s * 0.75, s * 0.1, '#8a5428', { lineColor: '#4a2a10', line: lw });
  artRoundRect(b, x - s * 0.72, floorY - s * 1.05, s * 1.44, s * 0.4, s * 0.15, '#6a3e1a', { lineColor: '#4a2a10', line: lw });
  artRoundRect(b, x - s * 0.72, floorY - s * 0.73, s * 1.44, s * 0.1, s * 0.03, '#ffd24f', { lineColor: '#9a7a1a', line: lw * 0.8 });
  artRoundRect(b, x - s * 0.1, floorY - s * 0.8, s * 0.2, s * 0.28, s * 0.05, '#ffd24f', { lineColor: '#9a7a1a', line: lw * 0.8 });
  artHighlight(b, x - s * 0.4, floorY - s * 0.95, s * 0.25, s * 0.06, 0.25);
}

// Hiekan koristeet (taustaan): kivi, simpukankuori, merivuokko ja meritähti
function reefDrawRock(c, x, y, s, far) {
  if (far) artBlob(c, x, y, s, s * 0.6, artMix('#6a7a8a', REEF_WATER, far), { line: false });
  else artBlob(c, x, y, s, s * 0.6, '#8a9aaa', { lineColor: '#3a4a5a', hi: 0.25 });
}
function reefDrawShell(c, x, y, s, color) {
  var i, line = artShade(color, -0.4);
  c.beginPath(); c.moveTo(x - s, y); c.arc(x, y, s, Math.PI, 0); c.closePath();
  artFillPath(c, color, y - s, y, s, { lineColor: line });
  c.strokeStyle = artRGBA(line, 0.5);
  c.lineWidth = Math.max(1, s * 0.08);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + i * s * 0.55, y - s * 0.8 + Math.abs(i) * s * 0.25); c.stroke();
  }
}
function reefDrawAnemone(c, x, y, s, color) {
  var i, a, line = artShade(color, -0.45);
  for (i = 0; i < 5; i++) {
    a = -Math.PI * 0.85 + i * Math.PI * 0.175;
    artLimb(c, x, y, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.2, color, line);
    artCircle(c, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.14, artShade(color, 0.3), { lineColor: line });
  }
  artBlob(c, x, y, s * 0.35, s * 0.16, artShade(color, -0.1), { lineColor: line });
}
function reefDrawStarfish(c, x, y, s, color, rot) {
  var i, a, line = artShade(color, -0.45);
  for (i = 0; i < 5; i++) {
    a = rot + i * Math.PI * 2 / 5;
    artLimb(c, x, y, x + Math.cos(a) * s, y + Math.sin(a) * s * 0.7, s * 0.3, color, line);
  }
  artCircle(c, x, y, s * 0.3, artShade(color, 0.2), { lineColor: line, hi: 0.4 });
}

// Tökättävät koristeet: kaksi levää ja kaksi korallia taustarivistöstä,
// simpukka (avautuu, 3. tökkäys näyttää kultahelmen) ja meritähti (kääntyy).
// Paikat ovat samat kuin taustan rivistössä; kutsutaan myös resize-koukusta.
function reefProps() {
  var i, idx, h = viewH, floorY = reefFloorY();
  propsReset();
  for (i = 0; i < REEF_PROP_IDX.length; i++) {
    idx = REEF_PROP_IDX[i];
    if (idx % 2 === 0) {
      propAdd({
        x: worldW * (0.02 + idx * 0.062) + (idx % 3) * h * 0.03, y: floorY + h * 0.01, s: h * (0.07 + (idx % 3) * 0.02),
        r: h * 0.07, hy: h * 0.05, amp: 0.1, color: REEF_CORALS[idx % 4], note: 520 + idx * 30,
        draw: function (c, p) { drawCoral(c, 0, 0, p.s, p.t >= 0 && p.t < 0.3 ? artShade(p.color, 0.3) : p.color); },
        poke: function (p) { reefBubble(p.x, p.y - p.s, h * 0.006); }
      });
    } else {
      propAdd({
        x: worldW * (0.02 + idx * 0.062) + (idx % 3) * h * 0.03, y: floorY + h * 0.01, s: h * (0.16 + (idx % 3) * 0.05),
        r: h * 0.08, hy: h * 0.1, amp: 0.05, color: '#62cf96', note: 440 + idx * 30,
        draw: function (c, p) {
          var k = p.t >= 0 ? Math.exp(-p.t * 1.5) : 0;
          drawKelp(c, 0, 0, p.s, false, Math.sin(globalT * 1.6 + p.x) * (0.25 + k * 0.9));
        },
        poke: reefKelpPoke
      });
    }
  }
  propAdd({
    x: worldW * 0.12, y: floorY + h * 0.015, s: h * 0.035, r: h * 0.06, hy: h * 0.03, amp: 0.08,
    color: '#eac6ff', note: 700, openT: 0, gold: 0,
    draw: reefDrawClam,
    update: function (p, dt) { if (p.openT > 0) p.openT -= dt; if (p.gold > 0) p.gold -= dt; },
    poke: reefClamPoke
  });
  propAdd({
    x: worldW * 0.83, y: floorY + h * 0.05, s: h * 0.03, r: h * 0.05, hy: 0, amp: 0.12, color: '#ff8a5c', note: 640,
    draw: function (c, p) {
      var k = p.t >= 0 ? 1 - easeOutCubic(p.t / 1.2) : 0;
      reefDrawStarfish(c, 0, 0, p.s, '#ff8a5c', 0.6 + (p.n - k) * Math.PI * 2 / 5);
    }
  });
}

// Levä vapauttaa kuplia; joka viides tökkäys houkuttelee valaan kaukaa (yllätys)
function reefKelpPoke(p) {
  var i;
  for (i = 0; i < 4; i++) reefBubble(p.x + (Math.random() - 0.5) * p.s * 0.3, p.y - p.s * (0.3 + i * 0.2), viewH * (0.004 + Math.random() * 0.006));
  if (p.n % 5 === 0 && !reefWhale) {
    reefWhale = { t: 0 };
    playNote(165, 0, 0.9, 'sine', 0.25);
    playNote(220, 0.5, 1.2, 'sine', 0.2);
    playNote(196, 1.3, 1.0, 'triangle', 0.15);
  }
}

// Simpukka avautuu hetkeksi; kolmannella tökkäyksellä sisällä hehkuu kultahelmi
function reefClamPoke(p) {
  p.openT = 2.2;
  reefBubble(p.x, p.y - p.s * 1.2, viewH * 0.006);
  reefBubble(p.x + p.s * 0.3, p.y - p.s, viewH * 0.004);
  if (p.n === 3) {
    p.gold = 2.2;
    spawnSparkles(p.x, p.y - p.s * 0.8, 16, '#ffd24f');
    artPop(p.x, p.y - p.s * 0.8, p.s * 2, '#ffd24f', 'burst');
    playNote(1047, 0.1, 0.25, 'triangle', 0.3);
    playNote(1319, 0.25, 0.25, 'triangle', 0.3);
    playNote(1568, 0.4, 0.5, 'triangle', 0.3);
  }
}

// Simpukka (origo = hiekka): litteä alakuori, saranasta kääntyvä kansi ja helmi sisällä
function reefDrawClam(c, p) {
  var s = p.s, i, line = '#8a4ab0';
  var open = p.openT > 0 ? Math.min(1, Math.sin(Math.min(1, p.openT / 2.2) * Math.PI) * 1.8) : 0;
  artShadow(c, 0, s * 0.05, s * 1.3, s * 0.2, 0.16);
  artBlob(c, 0, -s * 0.5, s, s * 0.5, '#d9a7ff', { lineColor: line });
  if (open > 0.05) {
    if (p.gold > 0) artGlow(c, s * 0.1, -s * 0.8, s * 1.5, '#ffd24f', 0.55);
    artCircle(c, s * 0.1, -s * 0.8, s * 0.3, p.gold > 0 ? '#ffd24f' : '#ffffff',
      p.gold > 0 ? { lineColor: '#9a7a1a', hi: 0.6 } : { shadeTo: '#e3d8f5', lineColor: '#b8a8d8', hi: 0.6 });
  }
  c.save();
  c.translate(-s, -s * 0.5);
  c.rotate(-open * 1.2);
  c.beginPath(); c.moveTo(0, 0); c.arc(s, 0, s, Math.PI, 0); c.closePath();
  artFillPath(c, '#eac6ff', -s, 0, s, { lineColor: line, shadeTo: '#c9a0e8' });
  c.strokeStyle = artRGBA(line, 0.45);
  c.lineWidth = Math.max(1, s * 0.08);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(s, 0); c.lineTo(s + i * s * 0.5, -s * 0.85 + Math.abs(i) * s * 0.25); c.stroke();
  }
  artHighlight(c, s * 0.6, -s * 0.6, s * 0.25, s * 0.12, 0.45);
  c.restore();
}

// Avonainen simpukka, jossa helmi (keräiltävä; sama kuva HUD:ssa)
function drawReefPearl(c, x, y, r) {
  var i, line = '#b04a84';
  artGlow(c, x, y, r * 2.2, '#ffffff', 0.4);
  c.beginPath(); c.arc(x, y + r * 0.9, r * 1.3, Math.PI, 0); c.closePath();
  artFillPath(c, '#ff9ecf', y - r * 0.4, y + r * 2.2, r * 1.3, { lineColor: line });
  c.beginPath(); c.moveTo(x - r * 1.3, y + r * 0.9); c.arc(x, y - r * 0.4, r * 1.3, Math.PI * 1.05, Math.PI * 1.95); c.closePath();
  artFillPath(c, '#ffc9e3', y - r * 1.7, y + r * 0.9, r * 1.3, { lineColor: line, shadeTo: '#f0a8d0' });
  c.strokeStyle = artRGBA(line, 0.4);
  c.lineWidth = Math.max(1, r * 0.1);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(x, y + r * 0.9); c.lineTo(x + i * r * 0.55, y - r * 1.35 + Math.abs(i) * r * 0.3); c.stroke();
  }
  artCircle(c, x, y, r, '#ffffff', { shadeTo: '#e3d8f5', lineColor: '#b8a8d8', hi: 0.6 });
}

// Pikkukala: pyrstö, soikea vartalo ja silmä; tökättynä pyrstö huiskii vauhdikkaammin
function reefDrawFish(c, f) {
  var x = f.x - camX, y = f.y, s = viewH * 0.02, d = f.dir, line = artShade(f.color, -0.45);
  if (x < -s * 4 || x > viewW + s * 4) return;
  var wag = Math.sin(globalT * (f.dartT > 0 ? 22 : 8) + f.phase) * s * 0.25;
  c.beginPath();
  c.moveTo(x - d * s * 0.7, y);
  c.lineTo(x - d * s * 1.6, y - s * 0.6 + wag);
  c.lineTo(x - d * s * 1.6, y + s * 0.6 + wag);
  c.closePath();
  artFillPath(c, f.color, y - s * 0.6, y + s * 0.6, s * 0.6, { lineColor: line });
  artBlob(c, x, y, s, s * 0.62, f.color, { lineColor: line, hi: 0.35 });
  artEye(c, x + d * s * 0.5, y - s * 0.15, s * 0.17, d * 0.5, false);
}

// Meduusa: kello reunaviivalla ja kiillolla, lonkerot, silmät ja posket.
// Tökättynä pomppaa ylös ja kello pullistuu (pelkkä koriste, osuma-alue ei muutu).
function drawJelly(c, j) {
  var x = j.x - camX, y = j.y, r = viewH * 0.05, i, bx, line = '#a84a8a';
  if (x < -r * 3 || x > viewW + r * 3) return;
  var poke = j.pokeT > 0 ? Math.sin(Math.min(1, j.pokeT / 0.8) * Math.PI) : 0;
  y -= poke * r * 0.8;
  var br = r * (1 + Math.sin(j.phase * 2) * 0.05 + poke * 0.15);
  var blink = Math.sin(j.phase * 1.7) > 0.96;
  c.lineCap = 'round';
  c.beginPath();
  for (i = -2; i <= 2; i++) {
    bx = x + i * r * 0.35;
    c.moveTo(bx, y + r * 0.3);
    c.quadraticCurveTo(bx + Math.sin(globalT * 3 + i) * r * 0.4, y + r * 1.2, bx + Math.sin(globalT * 2 + i) * r * 0.3, y + r * 1.9);
  }
  c.strokeStyle = 'rgba(168,74,138,0.5)';
  c.lineWidth = Math.max(2, r * 0.12) + ART.lineMin * 2;
  c.stroke();
  c.strokeStyle = 'rgba(255,170,225,0.9)';
  c.lineWidth = Math.max(2, r * 0.12);
  c.stroke();
  artGlow(c, x, y, r * 1.6, '#ff9ed8', 0.25);
  c.beginPath(); c.arc(x, y, br, Math.PI, 0); c.lineTo(x + br, y + r * 0.3); c.lineTo(x - br, y + r * 0.3); c.closePath();
  artFillPath(c, '#ff9ed8', y - br, y + r * 0.3, br, { lineColor: line, alpha: 0.92 });
  artHighlight(c, x - br * 0.4, y - br * 0.5, br * 0.3, br * 0.15, 0.5);
  artEye(c, x - r * 0.3, y - r * 0.15, r * 0.12, 0, blink);
  artEye(c, x + r * 0.3, y - r * 0.15, r * 0.12, 0, blink);
  artBlush(c, x - r * 0.6, y + r * 0.05, r * 0.1);
  artBlush(c, x + r * 0.6, y + r * 0.05, r * 0.1);
}

// Yllätys: hehkuva valas lipuu kaukana vasemmalta oikealle (ruutukoordinaatit)
function reefWhaleX() {
  return -viewH * 0.4 + (reefWhale.t / 9) * (viewW + viewH * 0.8);
}
function reefDrawWhale(c) {
  if (!reefWhale) return;
  var x = reefWhaleX(), y = viewH * 0.32 + Math.sin(reefWhale.t * 1.3) * viewH * 0.02, s = viewH * 0.09;
  var col = artMix('#1b4f82', REEF_WATER, 0.35), tail = Math.sin(reefWhale.t * 3) * 0.3;
  artGlow(c, x, y, s * 2, '#bfe8ff', 0.3);
  artBlob(c, x - s * 1.7, y - s * 0.25, s * 0.45, s * 0.18, col, { line: false, rot: -0.7 + tail });
  artBlob(c, x - s * 1.7, y + s * 0.05, s * 0.45, s * 0.18, col, { line: false, rot: 0.5 + tail });
  artBlob(c, x, y, s * 1.5, s * 0.6, col, { line: false });
  artBlob(c, x + s * 0.2, y + s * 0.45, s * 0.9, s * 0.2, artMix('#bfe8ff', REEF_WATER, 0.4), { line: false, flat: true });
  artCircle(c, x + s * 0.95, y - s * 0.15, s * 0.07, '#dff6ff', { line: false });
}

function drawCurrentStream(c, cu) {
  var x = cu.x - camX, i;
  if (x < -viewW * 0.2 || x > viewW * 1.2) return;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 12; i++) {
    var t = (cu.t * 0.6 + i / 12) % 1;
    var bx = x + (t - 0.5) * viewW * 0.16 * cu.dir;
    var by = cu.y + Math.sin(t * Math.PI * 4 + i) * viewH * 0.08 + (i % 3 - 1) * viewH * 0.05;
    c.beginPath(); c.arc(bx, by, viewH * 0.006 + (i % 2) * viewH * 0.004, 0, Math.PI * 2); c.fill();
  }
}

function drawChestGlow(c) {
  var x = chest.x - camX, floorY = reefFloorY(), s = viewH * 0.09;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (chest.open) {
    var g = c.createRadialGradient(x, floorY - s * 0.8, s * 0.1, x, floorY - s * 0.8, s * 2);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.7 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, floorY - s * 0.8, s * 2, 0, Math.PI * 2); c.fill();
    drawStar(c, x, floorY - s * 1.6, viewH * 0.035, globalT, 1);
  }
}

function drawReef() {
  var i, floorY = reefFloorY();
  if (!beginPlayWorld()) return;
  reefDrawWhale(ctx);
  propsDraw(ctx);
  for (i = 0; i < currents.length; i++) drawCurrentStream(ctx, currents[i]);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], floorY);
  drawChestGlow(ctx);
  reefDrawBubbles(ctx);
  for (i = 0; i < reefPearls.length; i++) {
    if (reefPearls[i].collected) continue;
    drawReefPearl(ctx, reefPearls[i].ax - camX, reefPearls[i].ay + Math.sin(reefPearls[i].phase) * viewH * 0.01, viewH * 0.022);
  }
  for (i = 0; i < reefFish.length; i++) reefDrawFish(ctx, reefFish[i]);
  for (i = 0; i < jellies.length; i++) drawJelly(ctx, jellies[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (chest.open && !celebrating) drawEdgeArrow(ctx, chest.x);
  endPlayWorld();
  drawPickupHud(ctx, PEARL_COUNT, function (i2) { return reefPearls[i2] && reefPearls[i2].collected; },
    function (c, x, y, s) { drawReefPearl(c, x, y, s * 0.7); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
