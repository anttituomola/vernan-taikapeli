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
var NW_SKY = '#2a3f78';            // taivaan alareuna: kaukaiset kuuset sävytetään tähän
var NW_PINE_IDX = [1, 4, 7];       // lähirivistön (10 kuusta) tökättävät kuuset
var NW_SHROOM_IDX = [5, 14];       // hehkusienistä (22) tökättävät
var nwHiddenOwl = null;            // yllätys: piilopöllö kurkistaa kuusen latvasta (5. tökkäys)

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
  nwProps();
}

function initNightwood() {
  var i;
  tasks = [makeTask(0.35, 'memory', { seqLen: 4, orbs: 4 }), makeTask(0.68, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.74]);
  glowBugs = [];
  for (i = 0; i < GLOW_COUNT; i++) glowBugs.push({ ax: 0, ay: 0, collected: false, t: glowDefs[i].off, phase: Math.random() * Math.PI * 2 });
  owls = [];
  for (i = 0; i < owlDefs.length; i++) owls.push({ px: 0, py: 0, x: 0, y: 0, state: 'sleep', timer: 3 + i * 1.5, diveT: 0, tx: 0, ty: 0, hit: false, pokeT: 0 });
  nwHiddenOwl = null;
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
  // Oksalla istuva pöllö avaa silmänsä ja huhuilee hiljaa tökkäyksestä (pelkkä
  // koriste, ei muuta pöllön tilaa); koristeet heilahtavat ja ratsastus jatkuu
  for (i = 0; i < owls.length; i++) {
    if (owls[i].state !== 'dive' && Math.hypot(wx - owls[i].x, py - owls[i].y) < viewH * 0.07) {
      owls[i].pokeT = 0.9;
      playNote(392, 0, 0.14, 'sine', 0.15);
      playNote(330, 0.16, 0.2, 'sine', 0.15);
      spawnSparkles(owls[i].x, owls[i].y - viewH * 0.04, 5, '#c9a97a');
      break;
    }
  }
  propsTap(wx, py);
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
    if (o.pokeT > 0) o.pokeT -= dt;
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

  if (nwHiddenOwl) {
    nwHiddenOwl.t += dt;
    if (nwHiddenOwl.t > 3.2) nwHiddenOwl = null;
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function nightwoodLayers() {
  return [
    { speed: 0.22, render: renderNightwoodFar },
    { speed: 0.55, render: renderNightwoodMid },
    { speed: 1, render: renderNightwoodNear }
  ];
}
function renderNightwoodBg(b, w, h) {
  renderNightwoodFar(b, w, h);
  renderNightwoodMid(b, w, h);
  renderNightwoodNear(b, w, h);
}
function renderNightwoodFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#070a24');
  sky.addColorStop(0.7, '#1b2a5a');
  sky.addColorStop(1, '#2a3f78');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#ffffff';
  for (i = 0; i < 120; i++) {
    x = (i * 197.3) % w;
    var sy = ((i * 89) % Math.round(h * 0.55));
    b.globalAlpha = 0.4 + ((i * 7) % 6) / 10;
    b.beginPath(); b.arc(x, sy, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.5, h * 0.16, h * 0.075, 0.22, '#fff6c8', '#ffffff', '#ffe9a8');
  fillHillBand(b, w, h, groundTop - h * 0.05, '#121a44', function (x) {
    return groundTop - h * 0.12 - Math.sin(x * 0.002) * h * 0.04;
  });
}
function renderNightwoodMid(b, w, h) {
  var i, x;
  // Kaukaiset kuuset: taivaan sävyyn hälvennetyt siluetit ilman reunaviivaa
  for (i = 0; i < 26; i++) {
    x = w * (0.01 + i * 0.039) + (i % 2) * h * 0.02;
    drawPine(b, x, groundTop - h * 0.02, h * (0.22 + (i % 3) * 0.06), artMix(i % 2 ? '#0e1538' : '#16204a', NW_SKY, 0.3), true);
  }
}
function renderNightwoodNear(b, w, h) {
  var i, x;
  var path = b.createLinearGradient(0, groundTop, 0, groundBottom);
  path.addColorStop(0, '#31507a');
  path.addColorStop(0.5, '#3c5f8f');
  path.addColorStop(1, '#2a4468');
  b.fillStyle = path;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = '#1a2a52';
  b.fillRect(0, groundBottom, w, h - groundBottom);
  for (i = 0; i < 10; i++) {
    if (NW_PINE_IDX.indexOf(i) >= 0) continue; // tökättävät kuuset piirretään joka ruudulla (nwProps)
    x = w * (0.04 + i * 0.1);
    drawPine(b, x, groundTop - h * 0.01, h * (0.18 + (i % 3) * 0.04), i % 2 ? '#1a2a58' : '#243868');
  }
  for (i = 0; i < 22; i++) {
    if (NW_SHROOM_IDX.indexOf(i) >= 0) continue;
    x = (i * 311.7) % w;
    nwDrawMushroom(b, x, i % 2 ? groundTop + h * 0.02 : groundBottom - h * 0.01, h, 0.45);
  }
  drawMoonGateFrame(b, moonGate.x, groundTop - h * 0.02, h);
}

// Hehkusieni (origo = juuri): hehku, jalka ja pyöreä lakki. glow = hehkun voimakkuus
function nwDrawMushroom(b, x, y, h, glow) {
  artGlow(b, x, y - h * 0.02, h * 0.05, '#7fd4ff', glow);
  artRoundRect(b, x - h * 0.005, y - h * 0.025, h * 0.01, h * 0.025, h * 0.003, '#d9e8ff', { lineColor: '#6a7aa8', shadeTo: '#b8c4e8' });
  artCircle(b, x, y - h * 0.025, h * 0.016, '#7fd4ff', { lineColor: '#2a6a98', hi: 0.4 });
}

// Kuusi: runko ja kolme kerrosta reunaviivalla (vaalea ylä, tumma ala).
// far = kaukainen: ei reunaviivaa eikä varjoa, runko puun väriin
function drawPine(b, x, baseY, s, color, far) {
  var i, ty, tw, o = far ? { line: false } : {};
  if (!far) artShadow(b, x, baseY + s * 0.02, s * 0.4, s * 0.07, 0.16);
  artRoundRect(b, x - s * 0.05, baseY - s * 0.22, s * 0.1, s * 0.22, s * 0.03, far ? color : '#4a3324', far ? o : { lineColor: '#241810' });
  for (i = 0; i < 3; i++) {
    ty = baseY - s * 0.15 - i * s * 0.27;
    tw = s * (0.42 - i * 0.1);
    b.beginPath();
    b.moveTo(x - tw, ty); b.quadraticCurveTo(x, ty + s * 0.05, x + tw, ty); b.lineTo(x, ty - s * 0.4);
    b.closePath();
    artFillPath(b, color, ty - s * 0.4, ty, tw, o);
  }
}

// Kuuportti: kaksi pylvästä ja kaari reunaviivoin
function drawMoonGateFrame(b, x, baseY, h) {
  var s = h * 0.12, lw = Math.max(1.2, s * 0.05), col = '#5a5488', line = '#2a2446';
  artShadow(b, x, baseY + s * 0.02, s, s * 0.12, 0.2);
  artRoundRect(b, x - s * 0.75, baseY - s * 1.6, s * 0.25, s * 1.6, s * 0.06, col, { lineColor: line, line: lw });
  artRoundRect(b, x + s * 0.5, baseY - s * 1.6, s * 0.25, s * 1.6, s * 0.06, col, { lineColor: line, line: lw });
  b.beginPath(); b.arc(x, baseY - s * 1.6, s * 0.75, Math.PI, 0); b.lineTo(x + s * 0.5, baseY - s * 1.6); b.arc(x, baseY - s * 1.6, s * 0.5, 0, Math.PI, true); b.closePath();
  artFillPath(b, col, baseY - s * 2.35, baseY - s * 1.6, s * 0.75, { lineColor: line, line: lw });
  artHighlight(b, x - s * 0.3, baseY - s * 2.2, s * 0.18, s * 0.06, 0.25);
}

// Tökättävät koristeet: kolme lähikuusta ja kaksi hehkusientä piirretään joka
// ruudulla taustan sijaan. Paikat samat kuin taustassa; kutsutaan myös resize-koukusta.
function nwProps() {
  var i, idx, h = viewH;
  propsReset();
  for (i = 0; i < NW_PINE_IDX.length; i++) {
    idx = NW_PINE_IDX[i];
    propAdd({
      x: worldW * (0.04 + idx * 0.1), y: groundTop - h * 0.01, s: h * (0.18 + (idx % 3) * 0.04),
      r: h * 0.08, hy: h * (0.18 + (idx % 3) * 0.04) * 0.6, amp: 0.06, color: '#7fd4ff', note: 380 + idx * 40,
      pine: idx % 2 ? '#1a2a58' : '#243868',
      draw: function (c, p) { drawPine(c, 0, 0, p.s, p.pine); },
      poke: nwPinePoke
    });
  }
  for (i = 0; i < NW_SHROOM_IDX.length; i++) {
    idx = NW_SHROOM_IDX[i];
    propAdd({
      x: (idx * 311.7) % worldW, y: idx % 2 ? groundTop + h * 0.02 : groundBottom - h * 0.01,
      r: h * 0.05, hy: h * 0.02, amp: 0.2, color: '#7fd4ff', note: 880,
      draw: function (c, p) { nwDrawMushroom(c, 0, 0, h, p.t >= 0 && p.t < 0.5 ? 0.9 : 0.45); },
      poke: function (p) { spawnSparkles(p.x, p.y - h * 0.03, 8, '#bfe8ff'); }
    });
  }
}

// Kuusesta putoaa käpy; joka viides tökkäys herättää piilopöllön latvasta (yllätys)
function nwPinePoke(p) {
  var h = viewH;
  propDropBall(p.x + (Math.random() - 0.5) * p.s * 0.4, p.y - p.s * 0.5, p.s * 0.045, '#6b4a2a', p.y + h * 0.02);
  if (p.n % 5 === 0 && !nwHiddenOwl) {
    nwHiddenOwl = { x: p.x, y: p.y - p.s * 0.78, t: 0 };
    playNote(294, 0.4, 0.25, 'sine', 0.3);
    playNote(247, 0.7, 0.35, 'sine', 0.3);
  }
}

// Piilopöllö: pieni pää kurkistaa latvasta, räpäyttää silmiään ja katoaa
function nwDrawHiddenOwl(c) {
  var o = nwHiddenOwl;
  if (!o) return;
  var x = o.x - camX, s = viewH * 0.02, k = o.t > 2.7 ? 1 - (o.t - 2.7) / 0.5 : easeOutBack(o.t / 0.4);
  var y = o.y + (1 - k) * s * 2, blink = o.t > 1.2 && o.t < 1.4;
  if (x < -s * 4 || x > viewW + s * 4) return;
  artBlob(c, x, y, s * 0.9, s * 0.8, '#8a6a44', { lineColor: '#3a2a1a' });
  c.beginPath(); c.moveTo(x - s * 0.7, y - s * 0.4); c.lineTo(x - s * 0.5, y - s * 1.1); c.lineTo(x - s * 0.15, y - s * 0.6); c.closePath();
  artFillPath(c, '#8a6a44', y - s * 1.1, y - s * 0.4, s * 0.3, { lineColor: '#3a2a1a' });
  c.beginPath(); c.moveTo(x + s * 0.7, y - s * 0.4); c.lineTo(x + s * 0.5, y - s * 1.1); c.lineTo(x + s * 0.15, y - s * 0.6); c.closePath();
  artFillPath(c, '#8a6a44', y - s * 1.1, y - s * 0.4, s * 0.3, { lineColor: '#3a2a1a' });
  artEye(c, x - s * 0.33, y - s * 0.1, s * 0.3, 0, blink);
  artEye(c, x + s * 0.33, y - s * 0.1, s * 0.3, 0, blink);
  c.fillStyle = '#ffb84f';
  c.beginPath(); c.moveTo(x - s * 0.12, y + s * 0.2); c.lineTo(x + s * 0.12, y + s * 0.2); c.lineTo(x, y + s * 0.42); c.closePath(); c.fill();
}

// Kiiltomato: hehku, siivet (laventeliin varjostettu valkoinen), vartalo ja pää
function drawGlowBug(c, x, y, s, lit, t) {
  if (lit) artGlow(c, x, y, s * 2.2, '#dcff8c', 0.9);
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.strokeStyle = 'rgba(200,190,230,0.7)';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath();
  if (c.ellipse) { c.ellipse(x - s * 0.5, y - s * 0.4, s * 0.55, s * 0.25, -0.5 + Math.sin(t * 20) * 0.2, 0, Math.PI * 2); c.ellipse(x + s * 0.5, y - s * 0.4, s * 0.55, s * 0.25, 0.5 - Math.sin(t * 20) * 0.2, 0, Math.PI * 2); }
  else { c.arc(x - s * 0.5, y - s * 0.4, s * 0.3, 0, Math.PI * 2); c.arc(x + s * 0.5, y - s * 0.4, s * 0.3, 0, Math.PI * 2); }
  c.fill();
  c.stroke();
  artCircle(c, x, y + s * 0.15, s * 0.42, lit ? '#e8ff7a' : '#4a5570', { lineColor: lit ? '#8a9a2a' : '#262c3c', hi: 0.4 });
  artCircle(c, x, y - s * 0.3, s * 0.3, '#3a3a4e', { lineColor: '#1a1a24', hi: 0.3 });
}

// Pöllö: oksa, siivet (syöksyssä), vartalo, vatsa, korvatupsut, silmät ja nokka.
// Tökättynä (o.pokeT) nukkuva pöllö avaa silmänsä hetkeksi ja kohottautuu.
function drawNightOwl(c, o) {
  var x = o.x - camX, y = o.y, s = viewH * 0.045, line = '#3a2a1a', body = '#8a6a44';
  if (x < -s * 4 || x > viewW + s * 4) return;
  var poke = o.pokeT > 0 ? Math.sin(Math.min(1, o.pokeT / 0.9) * Math.PI) : 0;
  var awake = o.state !== 'sleep' || poke > 0.15;
  c.save();
  c.translate(x, y - poke * s * 0.25);
  if (o.state === 'dive') {
    c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(-s * 1.9, -s * 0.8); c.lineTo(-s * 0.6, s * 0.5); c.closePath();
    artFillPath(c, '#6b4a2a', -s * 0.8, s * 0.5, s * 0.6, { lineColor: line });
    c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(s * 1.9, -s * 0.8); c.lineTo(s * 0.6, s * 0.5); c.closePath();
    artFillPath(c, '#6b4a2a', -s * 0.8, s * 0.5, s * 0.6, { lineColor: line });
  }
  artBlob(c, 0, 0, s * 0.75, s, body, { lineColor: line });
  artBlob(c, 0, s * 0.25, s * 0.45, s * 0.6, '#c9a97a', { lineColor: '#7a5a34', line: Math.max(1, s * 0.05) });
  c.beginPath(); c.moveTo(-s * 0.6, -s * 0.6); c.lineTo(-s * 0.4, -s * 1.15); c.lineTo(-s * 0.1, -s * 0.7); c.closePath();
  artFillPath(c, body, -s * 1.15, -s * 0.6, s * 0.3, { lineColor: line });
  c.beginPath(); c.moveTo(s * 0.6, -s * 0.6); c.lineTo(s * 0.4, -s * 1.15); c.lineTo(s * 0.1, -s * 0.7); c.closePath();
  artFillPath(c, body, -s * 1.15, -s * 0.6, s * 0.3, { lineColor: line });
  if (awake) {
    var glow = o.state === 'hoot' ? 0.6 + Math.sin(globalT * 16) * 0.4 : 1;
    c.fillStyle = 'rgba(255,230,120,' + glow + ')';
    c.strokeStyle = line;
    c.lineWidth = Math.max(1.2, s * 0.06);
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.13, 0, Math.PI * 2); c.fill();
    artHighlight(c, -s * 0.36, -s * 0.42, s * 0.06, s * 0.04, 0.6);
    artHighlight(c, s * 0.24, -s * 0.42, s * 0.06, s * 0.04, 0.6);
  } else {
    c.strokeStyle = line;
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.lineCap = 'round';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.beginPath(); c.moveTo(-s * 0.12, -s * 0.1); c.lineTo(s * 0.12, -s * 0.1); c.lineTo(0, s * 0.12); c.closePath();
  artFillPath(c, '#ffb84f', -s * 0.1, s * 0.12, s * 0.12, { lineColor: '#9a6a1a', line: Math.max(1, s * 0.04) });
  c.restore();
  // Oksa
  if (o.state !== 'dive') artLimb(c, x - s * 1.6, y + s * 1.05, x + s * 1.6, y + s * 0.95, s * 0.2, '#5a3f26', line);
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
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  nwDrawHiddenOwl(ctx);
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
  endPlayWorld();
  drawPickupHud(ctx, GLOW_COUNT, function (i2) { return glowBugs[i2] && glowBugs[i2].collected; },
    function (c, x, y, s) { drawGlowBug(c, x, y, s * 0.75, true, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
