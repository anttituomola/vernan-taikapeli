'use strict';

// Alustus, kartta, vaiheen käynnistys
// ---------- Pelin alustus ----------
function initGame() {
  stars = [];
  bunnies = [];
  particles = [];
  confetti = [];
  celebrating = false;
  celebrateT = 0;
  var i;
  for (i = 0; i < STAR_COUNT; i++) {
    var sax = starDefs[i].fx * worldW;
    var say = starY(starDefs[i]);
    stars.push({
      ax: sax, ay: say, ox: 0, oy: 0, px: sax, py: say,
      collected: false,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  for (i = 0; i < BUNNY_COUNT; i++) {
    bunnies.push({
      bushX: bushDefs[i].fx * worldW,
      x: bushDefs[i].fx * worldW,
      y: groundTop + 10,
      state: 'hidden',
      peek: 0.12,          // paljonko pupu näkyy pensaan takaa (0..1)
      phase: 'waiting',
      phaseT: Math.random() * 1.5,
      waitTime: 1.0 + Math.random() * 1.5,
      hopT: Math.random() * Math.PI * 2,
      earT: Math.random() * Math.PI * 2
    });
  }
  gates = [makeGate(0.40, 4, 3), makeGate(0.72, 5, 4)];
  for (i = 0; i < gates.length; i++) gates[i].x = gates[i].fx * worldW;
  activeGate = null;
  tasks = [makeTask(0.24, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;

  clouds = [
    { zA: 0.06, zB: 0.28, fy: 0.34, x: 0.15 * worldW, dir: 1, dropT: 3.0, warnT: 0 },
    { zA: 0.44, zB: 0.64, fy: 0.30, x: 0.55 * worldW, dir: -1, dropT: 4.0, warnT: 0 }
  ];
  drops = [];
  invulnT = 0;
  troll.x = 0.63 * worldW;
  troll.dir = 1;
  troll.cooldown = 0;
  troll.bounceT = 0;
  troll.stillT = 0;
  holding = false;
  goalReady = false;
  unicorn.speed = 265;
  unicorn.x = viewW * 0.10;
  unicorn.y = (groundTop + groundBottom) / 2;
  unicorn.tx = unicorn.x;
  unicorn.ty = unicorn.y;
  unicorn.facing = 1;
  unicorn.moving = false;
  camX = 0;
  level = 1;
  document.body.style.background = '#cfe9ff';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
}

function skipTo(kind) {
  var p = PHASES[kind] || PHASES.start;
  hubPlaying = kind;
  p.init();
}

function markPhaseCleared() {
  var k;
  for (k in PHASES) {
    if (PHASES[k].level === level) hubCleared[k] = true;
  }
}

function hubNextKind() {
  var i;
  for (i = 0; i < HUB_ORDER.length; i++) {
    if (!hubCleared[HUB_ORDER[i]]) return HUB_ORDER[i];
  }
  return null;
}

function hubFindByKind(kind) {
  var ch;
  for (ch in HUB_ROOMS) {
    if (HUB_ROOMS[ch].kind === kind) return hubFind(ch);
  }
  return null;
}

function beginPlay(kind) {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  mode = 'play';
  document.getElementById('hubChrome').style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
  skipTo(kind);
  resize();
  running = true;
  lastTime = 0;
  playNote(784, 0, 0.3, 'triangle', 0.4);
  playNote(1047, 0.12, 0.4, 'triangle', 0.4);
}

function showHub() {
  var pos;
  mode = 'hub';
  running = false;
  holding = false;
  celebrating = false;
  document.getElementById('hubChrome').style.display = 'flex';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#ffd6ec';
  lastTime = 0;
  hubPawn.path = [];
  if (hubPlaying && !hubCleared[hubPlaying] && hubApproach) {
    pos = hubFindByKind(hubPlaying);
    if (pos && hubPawn.c === pos.c && hubPawn.r === pos.r) {
      hubPawn.c = hubApproach.c;
      hubPawn.r = hubApproach.r;
    }
  }
  hubPlaying = null;
}

function hubWalkable(ch) {
  return ch && ch !== '#';
}

function hubAt(c, r) {
  if (r < 0 || r >= HUB_MAP.length) return '#';
  if (c < 0 || c >= HUB_MAP[r].length) return '#';
  return HUB_MAP[r].charAt(c);
}

function hubFind(ch) {
  var r, c;
  for (r = 0; r < HUB_MAP.length; r++) {
    c = HUB_MAP[r].indexOf(ch);
    if (c >= 0) return { c: c, r: r };
  }
  return { c: 1, r: 1 };
}

function hubLayout() {
  var rows = HUB_MAP.length;
  var cols = HUB_MAP[0].length;
  var top = viewH * 0.15;
  var bot = viewH * 0.03;
  var cell = Math.min((viewW * 0.92) / cols, (viewH - top - bot) / rows);
  var ox = (viewW - cell * cols) / 2;
  var oy = top + (viewH - top - bot - cell * rows) / 2;
  return { rows: rows, cols: cols, cell: cell, ox: ox, oy: oy };
}

function hubCenter(c, r, lay) {
  return {
    x: lay.ox + (c + 0.5) * lay.cell,
    y: lay.oy + (r + 0.5) * lay.cell
  };
}

function hubPixelCell(px, py, lay) {
  var c = Math.floor((px - lay.ox) / lay.cell);
  var r = Math.floor((py - lay.oy) / lay.cell);
  if (c < 0 || r < 0 || c >= lay.cols || r >= lay.rows) return null;
  return { c: c, r: r };
}

function hubIsGate(ch) {
  var room = HUB_ROOMS[ch];
  return !!(room && room.kind && !hubCleared[room.kind]);
}

function hubBfs(sc, sr, tc, tr) {
  if (!hubWalkable(hubAt(tc, tr))) return [];
  if (sc === tc && sr === tr) return [];
  var key = function (c, r) { return r * 32 + c; };
  var q = [{ c: sc, r: sr }];
  var prev = {};
  prev[key(sc, sr)] = null;
  var qi = 0;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (qi < q.length) {
    var cur = q[qi++];
    if (cur.c === tc && cur.r === tr) break;
    if (hubIsGate(hubAt(cur.c, cur.r)) && (cur.c !== sc || cur.r !== sr)) continue;
    var d;
    for (d = 0; d < 4; d++) {
      var nc = cur.c + dirs[d][0];
      var nr = cur.r + dirs[d][1];
      if (!hubWalkable(hubAt(nc, nr))) continue;
      var k = key(nc, nr);
      if (prev[k] !== undefined) continue;
      prev[k] = cur;
      q.push({ c: nc, r: nr });
    }
  }
  if (prev[key(tc, tr)] === undefined) return [];
  var path = [];
  var step = { c: tc, r: tr };
  while (step) {
    path.push(step);
    step = prev[key(step.c, step.r)];
  }
  path.reverse();
  path.shift();
  return path;
}

function hubBfsToNearestGate(sc, sr) {
  var best = [], bestLen = 1e9, i, pos, p;
  for (i = 0; i < HUB_ORDER.length; i++) {
    if (hubCleared[HUB_ORDER[i]]) continue;
    pos = hubFindByKind(HUB_ORDER[i]);
    if (!pos) continue;
    p = hubBfs(sc, sr, pos.c, pos.r);
    if (p.length > 0 && p.length < bestLen) {
      best = p;
      bestLen = p.length;
    }
  }
  return best;
}

function hubRoute(sc, sr, tc, tr) {
  var path = hubBfs(sc, sr, tc, tr);
  if (sc === tc && sr === tr) return [];
  if (path.length > 0) return path;
  return hubBfsToNearestGate(sc, sr);
}

function hubArrive(ch) {
  var room = HUB_ROOMS[ch];
  if (room) {
    if (room.kind && hubCleared[room.kind]) return;
    if (room.kind) {
      beginPlay(room.kind);
      return;
    }
    hubToast.kind = 'lock';
    hubToast.t = 1.8;
    playNote(392, 0, 0.18, 'triangle', 0.28);
    return;
  }
  if (ch === 'G') {
    hubToast.kind = 'castle';
    hubToast.t = 2.2;
    playNote(659, 0, 0.22, 'triangle', 0.4);
    playNote(784, 0.12, 0.28, 'triangle', 0.4);
    playNote(1047, 0.24, 0.4, 'triangle', 0.45);
  }
}

function handleHubTap(px, py) {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var lay = hubLayout();
  var cell = hubPixelCell(px, py, lay);
  if (!cell || !hubWalkable(hubAt(cell.c, cell.r))) return;
  if (cell.c === hubPawn.c && cell.r === hubPawn.r && hubPawn.path.length === 0) {
    hubArrive(hubAt(cell.c, cell.r));
    return;
  }
  hubPawn.path = hubRoute(hubPawn.c, hubPawn.r, cell.c, cell.r);
}

function updateHub(dt) {
  globalT += dt;
  if (hubToast.t > 0) hubToast.t -= dt;
  var lay = hubLayout();
  if (hubPawn.path.length > 0) {
    var next = hubPawn.path[0];
    var p = hubCenter(next.c, next.r, lay);
    var dx = p.x - hubPawn.x;
    var dy = p.y - hubPawn.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dx > 4) hubPawn.facing = 1;
    else if (dx < -4) hubPawn.facing = -1;
    var sp = lay.cell * 3.2 * dt;
    if (dist <= sp || dist < 2) {
      var prevC = hubPawn.c, prevR = hubPawn.r;
      hubPawn.c = next.c;
      hubPawn.r = next.r;
      hubPawn.x = p.x;
      hubPawn.y = p.y;
      hubPawn.path.shift();
      if (hubPawn.path.length === 0) {
        var landed = hubAt(hubPawn.c, hubPawn.r);
        if (hubIsGate(landed)) hubApproach = { c: prevC, r: prevR };
        hubArrive(landed);
      }
    } else {
      hubPawn.x += (dx / dist) * sp;
      hubPawn.y += (dy / dist) * sp;
      hubPawn.walkPhase += dt * 9;
    }
  } else {
    var stay = hubCenter(hubPawn.c, hubPawn.r, lay);
    hubPawn.x = stay.x;
    hubPawn.y = stay.y;
  }
}

function drawHubRoomIcon(c, kind, x, y, s) {
  var i, a;
  if (kind === 'start') {
    c.fillStyle = '#6d3b1e';
    c.fillRect(x - s * 0.07, y - s * 0.02, s * 0.14, s * 0.2);
    c.fillStyle = '#2f8a3e';
    c.beginPath();
    c.arc(x, y - s * 0.14, s * 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4fb356';
    c.beginPath();
    c.arc(x - s * 0.1, y - s * 0.08, s * 0.14, 0, Math.PI * 2);
    c.arc(x + s * 0.1, y - s * 0.08, s * 0.14, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'garden') {
    drawFlower(c, x, y - s * 0.04, s * 0.09, '#ffe27a');
  } else if (kind === 'ice') {
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, s * 0.045);
    c.beginPath();
    for (i = 0; i < 6; i++) {
      a = i * Math.PI / 3;
      c.moveTo(x, y - s * 0.04);
      c.lineTo(x + Math.cos(a) * s * 0.18, y - s * 0.04 + Math.sin(a) * s * 0.18);
    }
    c.stroke();
  } else if (kind === 'pond') {
    c.fillStyle = '#5ed46a';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
    else c.arc(x, y, s * 0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ff7bac';
    c.beginPath();
    c.arc(x, y, s * 0.045, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'sky') {
    c.fillStyle = '#ffe9a0';
    c.beginPath();
    c.arc(x, y - s * 0.04, s * 0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7a5cff';
    c.beginPath();
    c.arc(x + s * 0.07, y - s * 0.06, s * 0.13, 0, Math.PI * 2);
    c.fill();
  }
}

function drawHubLock(c, x, y, s) {
  c.strokeStyle = '#6b5a80';
  c.lineWidth = Math.max(2, s * 0.12);
  c.beginPath();
  c.arc(x, y - s * 0.15, s * 0.22, Math.PI, 0);
  c.stroke();
  c.fillStyle = '#c9b3e0';
  roundRect(c, x - s * 0.28, y - s * 0.12, s * 0.56, s * 0.42, s * 0.08);
  c.fill();
}

function drawHub() {
  if (!viewW || !viewH) return;
  var lay = hubLayout();
  var g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, '#ffd6ec');
  g.addColorStop(0.55, '#d6b3ff');
  g.addColorStop(1, '#b3e0ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);

  var r, c, ch, x, y, s, room, i;
  s = lay.cell;
  for (r = 0; r < lay.rows; r++) {
    for (c = 0; c < lay.cols; c++) {
      ch = hubAt(c, r);
      x = lay.ox + c * s;
      y = lay.oy + r * s;
      if (ch === '#') {
        ctx.fillStyle = (c + r) % 2 === 0 ? '#4fb356' : '#3ea04a';
        roundRect(ctx, x + s * 0.04, y + s * 0.04, s * 0.92, s * 0.92, s * 0.22);
        ctx.fill();
        if ((c * 13 + r * 7) % 5 === 0) {
          drawFlower(ctx, x + s * 0.5, y + s * 0.42, s * 0.08, (c + r) % 2 ? '#ff7bac' : '#ffe27a');
        }
      } else {
        ctx.fillStyle = '#f7e4b0';
        roundRect(ctx, x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76, s * 0.18);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        roundRect(ctx, x + s * 0.22, y + s * 0.22, s * 0.56, s * 0.22, s * 0.1);
        ctx.fill();
      }
    }
  }

  var nextKind = hubNextKind();
  for (r = 0; r < lay.rows; r++) {
    for (c = 0; c < lay.cols; c++) {
      ch = hubAt(c, r);
      x = lay.ox + (c + 0.5) * s;
      y = lay.oy + (r + 0.5) * s;
      room = HUB_ROOMS[ch];
      if (ch === 'G') {
        drawCastle(ctx, x, y + s * 0.32, s * 0.85);
      } else if (ch === 'S') {
        ctx.fillStyle = 'rgba(255,126,172,0.45)';
        ctx.beginPath();
        ctx.arc(x, y + Math.sin(globalT * 3) * s * 0.04, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (room) {
        var isCleared = !!(room.kind && hubCleared[room.kind]);
        var isNext = room.kind && room.kind === nextKind;
        var rad = s * (isNext ? 0.30 + Math.sin(globalT * 4) * 0.03 : 0.28);
        ctx.fillStyle = isCleared ? '#c5b8d0' : (room.kind ? room.color : '#d5c6ea');
        ctx.beginPath();
        ctx.arc(x, y - s * 0.02, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isCleared ? '#e8dfef' : '#fff';
        ctx.lineWidth = s * 0.05;
        ctx.stroke();
        if (!room.kind) drawHubLock(ctx, x, y - s * 0.02, s);
        else {
          if (isCleared) ctx.globalAlpha = 0.4;
          drawHubRoomIcon(ctx, room.kind, x, y - s * 0.02, s);
          ctx.globalAlpha = 1;
        }
        if (isCleared) {
          drawStar(ctx, x + s * 0.2, y - s * 0.22, s * 0.11, 0, 0.85);
        }
      }
    }
  }

  for (i = 0; i < 10; i++) {
    var fx = ((globalT * (18 + i) + i * 70) % (viewW + 40)) - 20;
    var fy = viewH * 0.18 + (i % 3) * viewH * 0.08;
    ctx.globalAlpha = 0.35 + Math.sin(globalT * 2 + i) * 0.15;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  var moving = hubPawn.path.length > 0;
  drawPrincessFree(
    ctx, hubPawn.x, hubPawn.y + lay.cell * 0.22,
    lay.cell / 70, hubPawn.facing, hubPawn.walkPhase, moving, globalT
  );

  if (hubToast.t > 0 && hubToast.kind) {
    ctx.globalAlpha = Math.min(1, hubToast.t * 2);
    var tw = viewH * 0.16, th = viewH * 0.12;
    roundRect(ctx, (viewW - tw) / 2, viewH * 0.08, tw, th, viewH * 0.03);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    if (hubToast.kind === 'castle') {
      drawCastle(ctx, viewW / 2, viewH * 0.08 + th * 0.92, th * 0.85);
    } else {
      drawHubLock(ctx, viewW / 2, viewH * 0.08 + th * 0.55, th * 0.7);
    }
    ctx.globalAlpha = 1;
  }
}

