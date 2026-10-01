'use strict';

// Kaivos: Vuorisaaren ensimmäinen kenttä. Uusi pelimalli: ruudukkokaivos.
// Napauta ruutua, ja prinsessa kaivaa tunnelin sinne (kivi ei murru, kierrä).
// Kuusi jalokiveä kerätään, arkut avaavat tehtävän, ja ovi aukeaa kun kivet on koossa.
// Ei sydämiä: rauhallinen kenttä yhdellä ruudulla (ei kameraa).

// S alku, d multa, r kivi, g jalokivi mullassa, c arkku (tehtävä), E ovi
var MINE_MAP = [
  'Sdddrdddddrd',
  'drdgdrdgddrd',
  'ddddrdddrddd',
  'rgdcddrdgdcd',
  'ddrdddddddrd',
  'dgddrdgdddrE'
];
var MINE_GEMS = 6;
var MINE_DIG_T = 0.3, MINE_MOVE_T = 0.16;
var mine = {
  grid: [], cols: 0, rows: 0, cell: 0, ox: 0, oy: 0,
  p: { c: 0, r: 0, x: 0, y: 0, path: [], t: 0, digging: false, stepDig: false, facing: 1 },
  gems: 0, open: false, shakeT: 0, shakeX: 0, shakeY: 0, lampT: 0
};

function mineBuild() {
  var r, c, ch, chest = 0;
  mine.grid = [];
  mine.rows = MINE_MAP.length;
  mine.cols = MINE_MAP[0].length;
  for (r = 0; r < mine.rows; r++) {
    mine.grid.push([]);
    for (c = 0; c < mine.cols; c++) {
      ch = MINE_MAP[r].charAt(c);
      mine.grid[r].push({
        ch: ch, dug: ch === 'S', rock: ch === 'r', exit: ch === 'E',
        gem: ch === 'g', gemColor: GEM_COLORS[(r * 3 + c) % GEM_COLORS.length],
        chest: ch === 'c' ? chest++ : -1, phase: Math.random() * Math.PI * 2
      });
      if (ch === 'S') { mine.p.c = c; mine.p.r = r; }
    }
  }
}

function mineLayout() {
  var areaTop = viewH * 0.17, areaH = viewH * 0.80;
  mine.cell = Math.min(viewW * 0.94 / mine.cols, areaH / mine.rows);
  mine.ox = (viewW - mine.cell * mine.cols) / 2;
  mine.oy = areaTop + (areaH - mine.cell * mine.rows) / 2;
  var p = mineCenter(mine.p.c, mine.p.r);
  mine.p.x = p.x;
  mine.p.y = p.y;
}

function mineCenter(c, r) {
  return { x: mine.ox + (c + 0.5) * mine.cell, y: mine.oy + (r + 0.5) * mine.cell };
}

function mineCellAt(px, py) {
  var c = Math.floor((px - mine.ox) / mine.cell), r = Math.floor((py - mine.oy) / mine.cell);
  if (c < 0 || r < 0 || c >= mine.cols || r >= mine.rows) return null;
  return { c: c, r: r };
}

function mineWalkable(c, r) {
  if (r < 0 || r >= mine.rows || c < 0 || c >= mine.cols) return false;
  var t = mine.grid[r][c];
  if (t.rock) return false;
  if (t.exit && !mine.open) return false;
  return true;
}

// Leveyshaku: multa saa kaivaa, kivi estää. Palauttaa askeleet (ilman lähtöruutua).
function mineBfs(sc, sr, tc, tr) {
  if (!mineWalkable(tc, tr) || (sc === tc && sr === tr)) return [];
  var key = function (c, r) { return r * 64 + c; };
  var q = [{ c: sc, r: sr }], prev = {}, qi = 0, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], d, cur, nc, nr, k;
  prev[key(sc, sr)] = null;
  while (qi < q.length) {
    cur = q[qi++];
    if (cur.c === tc && cur.r === tr) break;
    for (d = 0; d < 4; d++) {
      nc = cur.c + dirs[d][0];
      nr = cur.r + dirs[d][1];
      if (!mineWalkable(nc, nr)) continue;
      k = key(nc, nr);
      if (prev[k] !== undefined) continue;
      prev[k] = cur;
      q.push({ c: nc, r: nr });
    }
  }
  if (prev[key(tc, tr)] === undefined) return [];
  var path = [], step = { c: tc, r: tr };
  while (step) { path.push(step); step = prev[key(step.c, step.r)]; }
  path.reverse();
  path.shift();
  return path;
}

function initMine() {
  var i;
  // Arkkujen tehtävät käynnistetään käsin (x kauas, jotta kaari ei laukea itsestään)
  tasks = [makeTask(-5, 'sort'), makeTask(-5, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  mineBuild();
  mine.p.path = [];
  mine.p.t = 0;
  mine.p.digging = false;
  mine.p.facing = 1;
  mine.gems = 0;
  mine.open = false;
  mine.shakeT = 0;
  mine.lampT = 0;
  mineLayout();
  mineSetupProps();
  renderBackground();
  playNote(330, 0, 0.25, 'triangle', 0.3);
  playNote(494, 0.14, 0.3, 'triangle', 0.3);
}

function respawnMine() {}
function resizeMine() { mineLayout(); mineSetupProps(); }

// Tökättävät koristeet tukipalkilla ruudukon yläpuolella: kaivosvaunu (joka
// kolmas tökkäys pudottaa kultaisen jalokiven) ja nukkuva lepakko (viides
// tökkäys herättää sen silmänisku ja lepatus).
function mineSetupProps() {
  var h = viewH, vw = viewW;
  propsReset();
  propAdd({
    x: vw * 0.86, y: h * 0.145, r: h * 0.05, hy: h * 0.03, color: '#ffd24f', note: 440, amp: 0.06,
    draw: function (c, p) {
      var s = h * 0.03, roll = p.t >= 0 ? Math.sin(p.t * 10) * Math.exp(-p.t * 3) * s * 0.4 : 0, gold = p.t >= 0 && p.n % 3 === 0;
      c.save();
      c.translate(roll, 0);
      artCircle(c, -s * 0.6, -s * 0.2, s * 0.26, '#4a3a2a', { lineColor: '#2a1a10' });
      artCircle(c, s * 0.6, -s * 0.2, s * 0.26, '#4a3a2a', { lineColor: '#2a1a10' });
      c.beginPath(); c.moveTo(-s * 1.1, -s * 1.3); c.lineTo(s * 1.1, -s * 1.3); c.lineTo(s * 0.8, -s * 0.35); c.lineTo(-s * 0.8, -s * 0.35); c.closePath();
      artFillPath(c, '#8a6a4a', -s * 1.3, -s * 0.35, s * 0.9, { lineColor: '#4a3020' });
      drawGem(c, -s * 0.35, -s * 1.35, s * 0.32, GEM_COLORS[0]);
      drawGem(c, s * 0.3, -s * 1.4, s * 0.3, GEM_COLORS[2]);
      c.restore();
      if (gold) {
        var k = Math.min(1, p.t / 1.4);
        artGlow(c, s * 1.6, -s * 2.0 - k * s * 1.2, s * 0.8, '#ffe27a', 0.6 * (1 - k));
        drawGem(c, s * 1.6, -s * 2.0 - k * s * 1.2, s * 0.4, '#ffd24f');
      }
    },
    poke: function (p) {
      playNote(330, 0, 0.1, 'square', 0.12);
      if (p.n % 3 === 0) { playNote(1319, 0.1, 0.2, 'sine', 0.3); playNote(1760, 0.2, 0.3, 'sine', 0.25); }
    }
  });
  propAdd({
    x: vw * 0.68, y: h * 0.165, r: h * 0.05, hy: -h * 0.04, color: '#c9a0ff', note: 1760, amp: 0.1,
    draw: function (c, p) {
      var s = h * 0.022, awake = p.t >= 0, flap = awake ? Math.sin(p.t * 30) * 0.5 : 0, wink = awake && p.n % 5 === 0;
      // Roikkuu palkista pää alaspäin: jalat, siivet kääreenä, pää
      artLimb(c, -s * 0.3, 0, -s * 0.2, s * 0.6, Math.max(1.5, s * 0.15), '#5a4a7a', '#2e2440');
      artLimb(c, s * 0.3, 0, s * 0.2, s * 0.6, Math.max(1.5, s * 0.15), '#5a4a7a', '#2e2440');
      artBlob(c, -s * 0.9 - flap * s, s * 1.6, s * 0.8, s * 1.1, '#6a5a9a', { lineColor: '#2e2440', rot: -0.3 - flap });
      artBlob(c, s * 0.9 + flap * s, s * 1.6, s * 0.8, s * 1.1, '#6a5a9a', { lineColor: '#2e2440', rot: 0.3 + flap });
      artBlob(c, 0, s * 1.5, s * 0.75, s * 1.0, '#7a6aa8', { lineColor: '#2e2440', hi: 0.25 });
      artCircle(c, 0, s * 2.5, s * 0.6, '#8a7ab8', { lineColor: '#2e2440' });
      c.beginPath(); c.moveTo(-s * 0.5, s * 2.2); c.lineTo(-s * 0.7, s * 1.5); c.lineTo(-s * 0.2, s * 2.0); c.closePath();
      artFillPath(c, '#8a7ab8', s * 1.5, s * 2.2, s * 0.3, { lineColor: '#2e2440' });
      c.beginPath(); c.moveTo(s * 0.5, s * 2.2); c.lineTo(s * 0.7, s * 1.5); c.lineTo(s * 0.2, s * 2.0); c.closePath();
      artFillPath(c, '#8a7ab8', s * 1.5, s * 2.2, s * 0.3, { lineColor: '#2e2440' });
      artEye(c, -s * 0.22, s * 2.55, s * 0.14, 0, !awake || wink);
      artEye(c, s * 0.22, s * 2.55, s * 0.14, 0, !awake);
      if (!awake) {
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.font = 'bold ' + Math.round(s * 0.9) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.fillText('z', s * 1.3, s * 1.0 - Math.sin(globalT * 2) * s * 0.3);
      }
    },
    poke: function (p) {
      playNote(1760, 0, 0.06, 'square', 0.08);
      playNote(2200, 0.05, 0.06, 'square', 0.06);
      if (p.n % 5 === 0) playNote(1047, 0.15, 0.2, 'sine', 0.2);
    }
  });
}

function mineBonk(cell) {
  mine.shakeT = 0.35;
  mine.shakeX = cell.c;
  mine.shakeY = cell.r;
  playNote(160, 0, 0.12, 'square', 0.18);
  playNote(120, 0.08, 0.15, 'square', 0.15);
  var p = mineCenter(cell.c, cell.r);
  spawnSparkles(p.x, p.y, 5, '#9a9ab0');
}

function handleMineTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var cell = mineCellAt(px, py);
  if (!cell) { propsTap(px, py); return; }
  var t = mine.grid[cell.r][cell.c];
  if (t.rock) { mineBonk(cell); return; }
  if (t.exit && !mine.open) {
    mineBonk(cell);
    playNote(392, 0.1, 0.18, 'triangle', 0.25);
    return;
  }
  var path = mineBfs(mine.p.c, mine.p.r, cell.c, cell.r);
  if (path.length === 0) return;
  mine.p.path = path;
  mine.p.t = 0;
  playNote(660, 0, 0.06, 'sine', 0.2);
}

function mineArrive(t) {
  var p = mine.p, pos = mineCenter(p.c, p.r);
  if (t.gem) {
    t.gem = false;
    mine.gems++;
    spawnSparkles(pos.x, pos.y, 16, t.gemColor);
    playNote(880 + mine.gems * 60, 0, 0.25, 'sine', 0.4);
    playNote(1320 + mine.gems * 60, 0.08, 0.3, 'sine', 0.3);
    if (mine.gems >= MINE_GEMS && !mine.open) {
      mine.open = true;
      playNote(523, 0.3, 0.3, 'triangle', 0.4);
      playNote(659, 0.45, 0.3, 'triangle', 0.4);
      playNote(784, 0.6, 0.5, 'triangle', 0.4);
    }
  }
  if (t.chest >= 0 && tasks[t.chest] && !tasks[t.chest].opened) {
    p.path = [];
    taskStart(tasks[t.chest]);
  }
  if (t.exit && mine.open && !celebrating) {
    p.path = [];
    startCelebration();
  }
}

function updateMine(dt) {
  var p = mine.p, i, t, next, from, to, dur, k;
  updateTasks(dt);
  var busy = puzzleBusy();
  if (mine.shakeT > 0) mine.shakeT -= dt;
  mine.lampT += dt;
  propsUpdate(dt);

  // Avattu arkku tyhjenee
  for (i = 0; i < mine.rows; i++) {
    for (k = 0; k < mine.cols; k++) {
      t = mine.grid[i][k];
      if (t.chest >= 0 && tasks[t.chest] && tasks[t.chest].opened) {
        t.chest = -1;
        var cp = mineCenter(k, i);
        spawnSparkles(cp.x, cp.y, 18, '#ffe27a');
      }
    }
  }

  if (p.path.length > 0 && !busy && !celebrating) {
    next = p.path[0];
    t = mine.grid[next.r][next.c];
    from = mineCenter(p.c, p.r);
    to = mineCenter(next.c, next.r);
    if (next.c !== p.c) p.facing = next.c > p.c ? 1 : -1;
    if (p.t === 0) p.stepDig = !t.dug;   // askeleen alussa päätetään, kaivetaanko
    dur = (p.stepDig ? MINE_DIG_T : 0) + MINE_MOVE_T;
    p.t += dt;
    if (p.stepDig && p.t < MINE_DIG_T) {
      // Kaivaminen: prinsessa pysyy ruudussaan, multaa lentää
      p.digging = true;
      p.x = from.x + p.facing * mine.cell * 0.12 + Math.sin(globalT * 40) * mine.cell * 0.03;
      p.y = from.y;
      if (Math.random() < dt * 22) spawnSparkles(to.x + (Math.random() - 0.5) * mine.cell * 0.5, to.y + (Math.random() - 0.5) * mine.cell * 0.5, 2, Math.random() < 0.5 ? '#8a5a30' : '#6b4424');
      if (Math.random() < dt * 6) playNote(220 + Math.random() * 60, 0, 0.05, 'square', 0.08);
    } else {
      if (!t.dug) {
        t.dug = true;
        spawnSparkles(to.x, to.y, 8, '#a97a4a');
      }
      p.digging = false;
      var mt = Math.min(1, Math.max(0, p.t - (p.stepDig ? MINE_DIG_T : 0)) / MINE_MOVE_T);
      p.x = from.x + (to.x - from.x) * mt;
      p.y = from.y + (to.y - from.y) * mt;
      if (p.t >= dur) {
        p.c = next.c;
        p.r = next.r;
        p.x = to.x;
        p.y = to.y;
        p.t = 0;
        p.path.shift();
        mineArrive(t);
      }
    }
  } else {
    p.digging = false;
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function mineLayers() {
  return [
    { speed: 0.22, render: renderMineFar },
    { speed: 0.55, render: renderMineMid },
    { speed: 1, render: renderMineNear }
  ];
}
function renderMineBg(b, w, h) {
  renderMineFar(b, w, h);
  renderMineMid(b, w, h);
  renderMineNear(b, w, h);
}
function renderMineFar(b, w, h) {
  var rock = b.createLinearGradient(0, 0, 0, h);
  rock.addColorStop(0, '#3a2c3e');
  rock.addColorStop(1, '#1e1622');
  b.fillStyle = rock;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, h * 0.08, h * 0.05, 0.22, '#ffe9a0', '#fff8d0', '#ffc45a');
}
function renderMineMid(b, w, h) {
  var i, x, y, vw = viewW;
  b.strokeStyle = 'rgba(0,0,0,0.25)';
  b.lineWidth = Math.max(1, h * 0.004);
  for (i = 0; i < 30; i++) {
    x = (i * 173.7) % vw;
    y = (i * 97.3) % h;
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + h * 0.04, y + h * 0.06); b.lineTo(x + h * 0.02, y + h * 0.11); b.stroke();
  }
  for (i = 0; i < 10; i++) {
    x = (i * 233.1) % vw;
    y = h * 0.02 + ((i * 71) % Math.round(h * 0.12));
    drawCrystal(b, x, y, h * 0.014, CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]);
  }
}
function renderMineNear(b, w, h) {
  var i, x, vw = viewW, lw = Math.max(1.2, h * 0.003);
  for (i = 0; i < 9; i++) {
    x = vw * (0.04 + i * 0.115);
    artRoundRect(b, x - h * 0.01, h * 0.145, h * 0.02, h * 0.035, h * 0.004, '#5a3a1e', { lineColor: '#2e1a0a', line: lw });
  }
  artRoundRect(b, -h * 0.01, h * 0.145, vw + h * 0.02, h * 0.02, h * 0.005, '#6a4a2a', { lineColor: '#2e1a0a', line: lw });
  // Ruudukon kehys
  artRoundRect(b, mine.ox - mine.cell * 0.12, mine.oy - mine.cell * 0.12, mine.cell * mine.cols + mine.cell * 0.24, mine.cell * mine.rows + mine.cell * 0.24, mine.cell * 0.15, '#4a3a2a', { lineColor: '#241a10', line: lw });
}

function drawMineTile(c, t, x, y, s, shake) {
  var i, sx = x + shake;
  if (t.rock) {
    artRoundRect(c, sx - s * 0.48, y - s * 0.48, s * 0.96, s * 0.96, s * 0.22, '#6b6478', { lineColor: '#3a3346', hi: 0.2 });
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath(); c.arc(sx + s * 0.18, y + s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill();
    return;
  }
  if (t.exit) {
    c.fillStyle = '#2a1a10';
    c.fillRect(sx - s * 0.5, y - s * 0.5, s, s);
    c.beginPath();
    c.moveTo(sx - s * 0.3, y + s * 0.48);
    c.lineTo(sx - s * 0.3, y - s * 0.1);
    c.arc(sx, y - s * 0.1, s * 0.3, Math.PI, 0);
    c.lineTo(sx + s * 0.3, y + s * 0.48);
    c.closePath();
    if (mine.open) {
      c.fillStyle = 'rgba(255,240,180,' + (0.75 + Math.sin(globalT * 4) * 0.2) + ')';
      c.fill();
      c.strokeStyle = '#b8862a';
      c.lineWidth = Math.max(1.2, s * 0.04);
      c.stroke();
    } else {
      artFillPath(c, '#5a3a24', y - s * 0.4, y + s * 0.48, s * 0.3, { lineColor: '#2a1a10' });
      drawHubLock(c, sx, y + s * 0.05, s * 0.5);
    }
    return;
  }
  if (t.dug) {
    c.fillStyle = '#241a14';
    c.fillRect(sx - s * 0.5, y - s * 0.5, s, s);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.beginPath(); c.arc(sx + s * 0.2, y + s * 0.25, s * 0.08, 0, Math.PI * 2); c.fill();
    return;
  }
  // Multa
  c.fillStyle = '#7a5230';
  c.fillRect(sx - s * 0.5, y - s * 0.5, s, s);
  c.fillStyle = 'rgba(0,0,0,0.18)';
  for (i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(sx + Math.sin(t.phase + i * 2.1) * s * 0.3, y + Math.cos(t.phase * 1.3 + i * 1.7) * s * 0.3, s * 0.06, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  c.lineWidth = 1;
  c.strokeRect(sx - s * 0.5, y - s * 0.5, s, s);
  if (t.chest >= 0) {
    artRoundRect(c, sx - s * 0.3, y - s * 0.12, s * 0.6, s * 0.36, s * 0.06, '#a9743f', { lineColor: '#4a2a10' });
    artRoundRect(c, sx - s * 0.32, y - s * 0.28, s * 0.64, s * 0.2, s * 0.08, '#8a5a30', { lineColor: '#4a2a10' });
    artRoundRect(c, sx - s * 0.06, y - s * 0.12, s * 0.12, s * 0.16, s * 0.03, '#ffd24f', { lineColor: '#b8862a' });
    drawStar(c, sx + s * 0.3, y - s * 0.32, s * 0.09, globalT * 2, 0.6);
  }
}

function drawMinePrincess(c) {
  var p = mine.p, s = mine.cell * 0.95 / 58;
  // Kypärälamppu hehkuu
  var g = c.createRadialGradient(p.x, p.y - mine.cell * 0.5, mine.cell * 0.05, p.x, p.y - mine.cell * 0.5, mine.cell * 1.6);
  g.addColorStop(0, 'rgba(255,240,180,0.35)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(p.x, p.y - mine.cell * 0.5, mine.cell * 1.6, 0, Math.PI * 2); c.fill();
  drawPrincessFree(c, p.x, p.y + mine.cell * 0.45, s, p.facing, globalT * 10, p.path.length > 0 && !p.digging, globalT);
  // Hakku
  if (p.digging) {
    var a = -0.6 + Math.sin(globalT * 40) * 0.5;
    c.save();
    c.translate(p.x + p.facing * mine.cell * 0.22, p.y - mine.cell * 0.05);
    c.scale(p.facing, 1);
    c.rotate(a);
    artLimb(c, 0, 0, 0, -mine.cell * 0.42, Math.max(2, mine.cell * 0.05), '#a9743f', '#5a3a1e');
    c.beginPath(); c.moveTo(-mine.cell * 0.2, -mine.cell * 0.42); c.lineTo(mine.cell * 0.2, -mine.cell * 0.42); c.lineTo(0, -mine.cell * 0.3); c.closePath();
    artFillPath(c, '#c8c8d8', -mine.cell * 0.42, -mine.cell * 0.3, mine.cell * 0.15, { lineColor: '#5a5a70' });
    c.restore();
  }
}

function drawMine() {
  var r, k, t, pos, s = mine.cell, shake, i;
  if (!beginPlayWorld()) return;
  for (r = 0; r < mine.rows; r++) {
    for (k = 0; k < mine.cols; k++) {
      t = mine.grid[r][k];
      pos = mineCenter(k, r);
      shake = (mine.shakeT > 0 && mine.shakeX === k && mine.shakeY === r) ? Math.sin(globalT * 50) * s * 0.06 * mine.shakeT : 0;
      drawMineTile(ctx, t, pos.x, pos.y, s, shake);
    }
  }
  drawMinePrincess(ctx);
  // Hämärä lampun ympärillä (kevyempi kuin luolassa, jotta reitti näkyy); jalokivet kimaltavat sen läpi
  var dg = ctx.createRadialGradient(mine.p.x, mine.p.y - s * 0.4, s * 1.4, mine.p.x, mine.p.y - s * 0.4, s * 4.5);
  dg.addColorStop(0, 'rgba(5,4,20,0)');
  dg.addColorStop(0.6, 'rgba(5,4,20,0.3)');
  dg.addColorStop(1, 'rgba(5,4,20,0.55)');
  ctx.fillStyle = dg;
  ctx.fillRect(0, 0, viewW, viewH);
  propsDraw(ctx);
  for (r = 0; r < mine.rows; r++) {
    for (k = 0; k < mine.cols; k++) {
      t = mine.grid[r][k];
      if (!t.gem) continue;
      pos = mineCenter(k, r);
      var tw = 0.55 + Math.sin(globalT * 3 + t.phase) * 0.45;
      drawGem(ctx, pos.x, pos.y, s * 0.26, t.gemColor);
      ctx.globalAlpha = tw;
      drawStar(ctx, pos.x + s * 0.2, pos.y - s * 0.24, s * 0.07, globalT * 2, 0);
      ctx.globalAlpha = 1;
    }
  }
  if (mine.open) {
    // Ovi hohtaa pimeän läpi
    for (r = 0; r < mine.rows; r++) for (k = 0; k < mine.cols; k++) if (mine.grid[r][k].exit) {
      pos = mineCenter(k, r);
      var g = ctx.createRadialGradient(pos.x, pos.y, s * 0.1, pos.x, pos.y, s * 1.4);
      g.addColorStop(0, 'rgba(255,240,180,' + (0.55 + Math.sin(globalT * 4) * 0.15) + ')');
      g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, s * 1.4, 0, Math.PI * 2); ctx.fill();
      if (!celebrating) drawStar(ctx, pos.x, pos.y - s * 0.75, s * 0.18, globalT, 1);
    }
  }
  drawParticlesLayer(ctx);
  endPlayWorld();
  i = 0;
  drawPickupHud(ctx, MINE_GEMS, function (i2) { return i2 < mine.gems; },
    function (c, x, y, s2) { drawGem(c, x, y, s2 * 0.9, GEM_COLORS[(i++) % GEM_COLORS.length]); });
  drawTaskOverlay(ctx);
}
