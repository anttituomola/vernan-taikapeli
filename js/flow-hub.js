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
    if (PHASES[k].level === level) {
      hubCleared[k] = true;
      if (k === 'finale') finaleDone = true;
    }
  }
  saveProgress();
}

function hubNextKind() {
  var i;
  var ord = hubOrder();
  for (i = 0; i < ord.length; i++) {
    if (!hubCleared[ord[i]]) return ord[i];
  }
  return null;
}

function hubFindByKind(kind) {
  var ch;
  var rooms = hubRooms();
  for (ch in rooms) {
    if (rooms[ch].kind === kind) return hubFind(ch);
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
  ambientInit(PHASES[kind] ? PHASES[kind].ambient : null);
  startIntro(kind);
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
  hubOffer = null;
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
  var m = hubMap();
  if (r < 0 || r >= m.length) return '#';
  if (c < 0 || c >= m[r].length) return '#';
  return m[r].charAt(c);
}

function hubFind(ch) {
  var r, c;
  var m = hubMap();
  for (r = 0; r < m.length; r++) {
    c = m[r].indexOf(ch);
    if (c >= 0) return { c: c, r: r };
  }
  return { c: 1, r: 1 };
}

function hubLayout() {
  var rows = hubMap().length;
  var cols = hubMap()[0].length;
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
  var room = hubRooms()[ch];
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
  var ord = hubOrder();
  for (i = 0; i < ord.length; i++) {
    if (hubCleared[ord[i]]) continue;
    pos = hubFindByKind(ord[i]);
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
  var room = hubRooms()[ch];
  if (ch === 'B') {
    // Satama: vene vie saaristokartalle
    showSea();
    return;
  }
  if (room) {
    if (room.kind && hubCleared[room.kind]) {
      // Läpäisty huone: tarjoa uusintaa puhekuplassa; muualle napautus ohittaa
      hubOfferShow([{ act: 'replay', kind: room.kind }]);
      return;
    }
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
    // Linna: finaali aukeaa, kun kaikki huoneet on läpäisty; sen jälkeen sen voi
    // pelata uudestaan. Seuraavalle saarelle mennään satamasta (B).
    if (!hubNextKind() && !finaleDone) {
      beginPlay('finale');
      return;
    }
    if (finaleDone) {
      hubOfferShow([{ act: 'replay', kind: 'finale' }]);
      return;
    }
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
  if (hubOffer) {
    var hit = hubOfferHit(px, py, lay);
    hubOffer = null;
    if (hit) {
      hubOfferAct(hit);
      return;
    }
  }
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
  } else if (kind === 'cave') {
    c.fillStyle = '#8fd3ff';
    c.beginPath();
    c.moveTo(x, y - s * 0.24);
    c.lineTo(x + s * 0.12, y - s * 0.08);
    c.lineTo(x + s * 0.08, y + s * 0.16);
    c.lineTo(x - s * 0.08, y + s * 0.16);
    c.lineTo(x - s * 0.12, y - s * 0.08);
    c.closePath();
    c.fill();
  } else if (kind === 'swamp') {
    c.fillStyle = '#c8ffb0';
    c.beginPath();
    c.arc(x, y - s * 0.02, s * 0.14, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#eafff0';
    c.beginPath();
    c.arc(x - s * 0.04, y - s * 0.06, s * 0.06, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'beach') {
    drawShell(c, x, y, s * 0.16, '#ffd6e8');
  } else if (kind === 'candy') {
    c.strokeStyle = '#fff';
    c.lineWidth = Math.max(2, s * 0.04);
    c.beginPath(); c.moveTo(x, y + s * 0.02); c.lineTo(x, y + s * 0.24); c.stroke();
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.arc(x, y - s * 0.06, s * 0.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(x, y - s * 0.06, s * 0.08, 0, Math.PI * 1.5); c.stroke();
  } else if (kind === 'tower') {
    c.fillStyle = '#c9b8e0';
    c.fillRect(x - s * 0.1, y - s * 0.12, s * 0.2, s * 0.32);
    c.fillStyle = '#8a5cb8';
    c.beginPath(); c.moveTo(x - s * 0.14, y - s * 0.12); c.lineTo(x + s * 0.14, y - s * 0.12); c.lineTo(x, y - s * 0.3); c.closePath(); c.fill();
    c.fillStyle = '#ffe27a';
    c.fillRect(x - s * 0.03, y + s * 0.02, s * 0.06, s * 0.08);
  } else if (kind === 'reef') {
    drawReefPearl(c, x, y, s * 0.13);
  } else if (kind === 'nightwood') {
    var ng = c.createRadialGradient(x, y, s * 0.02, x, y, s * 0.2);
    ng.addColorStop(0, 'rgba(230,255,150,0.95)');
    ng.addColorStop(1, 'rgba(230,255,150,0)');
    c.fillStyle = ng;
    c.beginPath(); c.arc(x, y, s * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8ff7a';
    c.beginPath(); c.arc(x, y + s * 0.02, s * 0.07, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.arc(x - s * 0.08, y - s * 0.05, s * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(x + s * 0.08, y - s * 0.05, s * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else if (kind === 'clouds') {
    c.fillStyle = '#ffffff';
    cloudShape(c, x, y + s * 0.05, s * 0.08);
    drawStar(c, x + s * 0.1, y - s * 0.17, s * 0.07, 0, 0);
  } else if (kind === 'moon') {
    c.fillStyle = '#fff1a8';
    c.beginPath(); c.arc(x, y, s * 0.17, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b5fb0';
    c.beginPath(); c.arc(x + s * 0.07, y - s * 0.03, s * 0.14, 0, Math.PI * 2); c.fill();
  } else if (kind === 'bridge') {
    var cols = ['#ff5f7e', '#ffe94f', '#5fa8ff'];
    c.lineWidth = Math.max(2, s * 0.05);
    for (i = 0; i < cols.length; i++) {
      c.strokeStyle = cols[i];
      c.beginPath();
      c.arc(x, y + s * 0.1, s * (0.22 - i * 0.05), Math.PI, 0);
      c.stroke();
    }
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
  renderHubBg(lay);
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(hubBgCanvas, 0, 0, hubBgCanvas.width, hubBgCanvas.height, 0, 0, viewW, viewH);

  var r, c, ch, x, y, s, room, i;
  s = lay.cell;
  var nextKind = hubNextKind();
  for (r = 0; r < lay.rows; r++) {
    for (c = 0; c < lay.cols; c++) {
      ch = hubAt(c, r);
      x = lay.ox + (c + 0.5) * s;
      y = lay.oy + (r + 0.5) * s;
      room = hubRooms()[ch];
      if (ch === 'B') {
        drawHarbor(ctx, x, y, s);
        if (seaHarborHint()) drawHintArrow(ctx, x, y - s * 0.95);
      } else if (ch === 'G') {
        var castleReady = !nextKind && !finaleDone;
        if (castleReady || finaleDone) {
          var gr = ctx.createRadialGradient(x, y, s * 0.1, x, y, s * 0.9);
          gr.addColorStop(0, 'rgba(255,230,140,' + (castleReady ? 0.6 + Math.sin(globalT * 4) * 0.2 : 0.4) + ')');
          gr.addColorStop(1, 'rgba(255,230,140,0)');
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(x, y, s * 0.9, 0, Math.PI * 2); ctx.fill();
        }
        drawCastle(ctx, x, y + s * 0.42, s * 1.05);
        if (finaleDone) drawStar(ctx, x, y - s * 0.55, s * 0.16, globalT * 0.5, 0.9);
        if (castleReady) drawHintArrow(ctx, x, y - s * 1.1);
      } else if (room) {
        drawHubMedallion(ctx, room, x, y, s, !!(room.kind && hubCleared[room.kind]), room.kind === nextKind);
      }
    }
  }

  // Kiiltomadot / kimalteet
  for (i = 0; i < 14; i++) {
    var fx = ((globalT * (14 + i * 3) + i * 97) % (viewW + 40)) - 20;
    var fy = viewH * (0.2 + (i % 5) * 0.15) + Math.sin(globalT * 1.5 + i) * viewH * 0.02;
    ctx.globalAlpha = 0.4 + Math.sin(globalT * 3 + i) * 0.3;
    ctx.fillStyle = i % 3 === 0 ? '#ffe27a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(fx, fy, 2 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Prinsessa ratsastaa yksisarvisella
  var moving = hubPawn.path.length > 0;
  var us = lay.cell / 150;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  if (ctx.ellipse) ctx.ellipse(hubPawn.x, hubPawn.y + lay.cell * 0.4, lay.cell * 0.34, lay.cell * 0.08, 0, 0, Math.PI * 2);
  else ctx.arc(hubPawn.x, hubPawn.y + lay.cell * 0.4, lay.cell * 0.2, 0, Math.PI * 2);
  ctx.fill();
  drawUnicorn(ctx, hubPawn.x, hubPawn.y + lay.cell * 0.4, us, hubPawn.facing, hubPawn.walkPhase, moving, globalT);

  if (hubOffer) drawHubOffer(ctx, lay);

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


// ---------- Kartan ilme ----------
// Staattinen maasto, polku, mökki ja linna piirretään kerran omalle canvasille.
var hubBgCanvas = document.createElement('canvas');
var hubBgKey = '';

function hubHash(c, r) {
  var h = ((c + 1) * 73856093) ^ ((r + 1) * 19349663);
  h = (h ^ (h >>> 13)) * 1274126177;
  return (((h ^ (h >>> 16)) >>> 0) % 1000) / 1000;
}

// Maaston vyöhyke rivin (ja alarivillä sarakkeen) mukaan: vastaa huoneiden teemoja
function hubBand(c, r) {
  if (hubWorld === 3) {
    if (r <= 2) return 'reef';
    if (r <= 4) return 'nightwood';
    return c >= 8 ? 'moon' : 'clouds';
  }
  if (hubWorld === 2) {
    if (r <= 2) return 'beach';
    if (r <= 4) return 'candy';
    return 'tower';
  }
  if (r <= 2) return 'forest';
  if (r <= 4) return 'garden';
  if (r <= 6) return 'ice';
  if (r <= 8) return 'pond';
  if (r <= 10) return 'cave';
  return c < 5 ? 'meadow' : 'swamp';
}

var HUB_TILE_COLORS = {
  forest: ['#5dbb5a', '#52ad52'],
  garden: ['#7cc86a', '#6fbb60'],
  ice: ['#e4f4ff', '#d2eafc'],
  pond: ['#5fc7d8', '#4fb8cc'],
  cave: ['#4a3f7a', '#3f3568'],
  meadow: ['#8fd97a', '#7fcc6c'],
  swamp: ['#3e6e4a', '#356240'],
  beach: ['#f3dfae', '#e9d09a'],
  candy: ['#ffb3d9', '#ffc4e2'],
  tower: ['#4a3f7a', '#3f3568'],
  reef: ['#3aa7d9', '#3399cc'],
  nightwood: ['#232a5e', '#1e2454'],
  clouds: ['#c9dcff', '#bcd2fb'],
  moon: ['#3a3560', '#332e58']
};

function drawMushroomTile(b, x, baseY, s) {
  b.fillStyle = '#fff3e0';
  b.fillRect(x - s * 0.18, baseY - s * 0.5, s * 0.36, s * 0.5);
  b.fillStyle = '#ff5f5f';
  b.beginPath(); b.arc(x, baseY - s * 0.5, s * 0.55, Math.PI, 0); b.fill();
  b.fillStyle = '#fff';
  b.beginPath(); b.arc(x - s * 0.2, baseY - s * 0.7, s * 0.09, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + s * 0.18, baseY - s * 0.62, s * 0.08, 0, Math.PI * 2); b.fill();
}

function drawHubTile(b, band, x, y, s, c, r) {
  var rnd = hubHash(c, r), rnd2 = hubHash(r, c);
  var cols = HUB_TILE_COLORS[band];
  var cx = x + s / 2, cy = y + s / 2;
  b.fillStyle = cols[(c + r) % 2];
  b.fillRect(x, y, s + 1, s + 1);
  if (band === 'forest') {
    if (rnd < 0.6) drawTree(b, cx + (rnd2 - 0.5) * s * 0.3, y + s * 0.95, s * 0.6);
    else drawFlower(b, cx + (rnd2 - 0.5) * s * 0.4, cy, s * 0.07, rnd2 < 0.5 ? '#ff7bac' : '#ffe27a');
  } else if (band === 'garden') {
    var gcols = ['#ff7bac', '#c9a0ff', '#ffd24f', '#7fd4ff'];
    drawFlower(b, x + s * 0.3, y + s * 0.35, s * 0.08, gcols[Math.floor(rnd * 4)]);
    drawFlower(b, x + s * 0.7, y + s * 0.65, s * 0.07, gcols[Math.floor(rnd2 * 4)]);
    if (rnd > 0.6) drawMushroomTile(b, x + s * 0.5, y + s * 0.9, s * 0.2);
  } else if (band === 'ice') {
    b.fillStyle = 'rgba(255,255,255,0.75)';
    b.beginPath();
    if (b.ellipse) b.ellipse(cx + (rnd - 0.5) * s * 0.3, y + s * 0.82, s * 0.34, s * 0.12, 0, 0, Math.PI * 2);
    else b.arc(cx, y + s * 0.8, s * 0.2, 0, Math.PI * 2);
    b.fill();
    if (rnd2 < 0.5) drawSnowflake(b, cx + (rnd - 0.5) * s * 0.4, y + s * 0.42, s * 0.15);
  } else if (band === 'pond') {
    b.strokeStyle = 'rgba(255,255,255,0.4)';
    b.lineWidth = Math.max(1, s * 0.03);
    b.beginPath();
    b.arc(cx + (rnd - 0.5) * s * 0.4, cy + (rnd2 - 0.5) * s * 0.4, s * 0.2, Math.PI * 1.1, Math.PI * 1.9);
    b.stroke();
    if (rnd < 0.45) {
      b.fillStyle = '#4fb356';
      b.beginPath();
      if (b.ellipse) b.ellipse(cx, cy + s * 0.15, s * 0.24, s * 0.12, 0, 0, Math.PI * 2);
      else b.arc(cx, cy + s * 0.15, s * 0.16, 0, Math.PI * 2);
      b.fill();
      b.fillStyle = '#ff7bac';
      b.beginPath(); b.arc(cx, cy + s * 0.15, s * 0.05, 0, Math.PI * 2); b.fill();
    }
  } else if (band === 'cave') {
    b.fillStyle = '#5a4f8f';
    b.beginPath(); b.arc(cx + (rnd - 0.5) * s * 0.5, y + s * 0.85, s * 0.22, Math.PI, 0); b.fill();
    if (rnd2 < 0.55) drawCrystal(b, cx + (rnd - 0.5) * s * 0.4, cy - s * 0.05, s * 0.14, CRYSTAL_COLORS[Math.floor(rnd * CRYSTAL_COLORS.length)]);
  } else if (band === 'meadow') {
    drawFlower(b, x + s * 0.32, y + s * 0.4, s * 0.07, rnd < 0.5 ? '#ff7bac' : '#ffe27a');
    drawFlower(b, x + s * 0.7, y + s * 0.68, s * 0.07, rnd2 < 0.5 ? '#c9a0ff' : '#ff9d5c');
    if (rnd > 0.7) {
      var i;
      b.lineWidth = Math.max(1, s * 0.035);
      for (i = 0; i < 3; i++) {
        b.strokeStyle = maneColors[i * 2];
        b.beginPath(); b.arc(cx, y + s * 0.75, s * (0.28 - i * 0.05), Math.PI, 0); b.stroke();
      }
    }
  } else if (band === 'beach') {
    b.strokeStyle = 'rgba(90,170,210,0.6)';
    b.lineWidth = Math.max(1, s * 0.04);
    b.beginPath(); b.moveTo(x + s * 0.1, y + s * 0.3 + rnd * s * 0.2); b.quadraticCurveTo(x + s * 0.5, y + s * 0.2 + rnd * s * 0.2, x + s * 0.9, y + s * 0.3 + rnd * s * 0.2); b.stroke();
    if (rnd2 < 0.5) drawShell(b, cx + (rnd - 0.5) * s * 0.4, y + s * 0.72, s * 0.12, rnd < 0.5 ? '#ffd6e8' : '#ffe9b8');
    else if (rnd2 < 0.75) drawPalm(b, cx, y + s * 0.95, s * 0.5);
  } else if (band === 'candy') {
    drawLollipopTree(b, x + s * 0.3, y + s * 0.95, s * 0.4, CANDY_COLORS[Math.floor(rnd * CANDY_COLORS.length)]);
    if (rnd2 < 0.5) drawMushroomTile(b, x + s * 0.7, y + s * 0.9, s * 0.18);
  } else if (band === 'tower') {
    b.fillStyle = '#5a4f8f';
    b.beginPath(); b.arc(cx + (rnd - 0.5) * s * 0.5, y + s * 0.85, s * 0.22, Math.PI, 0); b.fill();
    if (rnd2 < 0.5) drawGem(b, cx + (rnd - 0.5) * s * 0.4, cy, s * 0.14, GEM_COLORS[Math.floor(rnd * GEM_COLORS.length)]);
  } else if (band === 'reef') {
    b.strokeStyle = 'rgba(255,255,255,0.35)';
    b.lineWidth = Math.max(1, s * 0.04);
    b.beginPath(); b.moveTo(x + s * 0.1, y + s * 0.35 + rnd * s * 0.2); b.quadraticCurveTo(x + s * 0.5, y + s * 0.25 + rnd * s * 0.2, x + s * 0.9, y + s * 0.35 + rnd * s * 0.2); b.stroke();
    if (rnd2 < 0.4) drawReefPearl(b, cx + (rnd - 0.5) * s * 0.4, y + s * 0.7, s * 0.09);
    else if (rnd2 < 0.7) drawKelp(b, cx + (rnd - 0.5) * s * 0.3, y + s * 0.95, s * 0.55);
    else if (rnd2 < 0.85) drawCoral(b, cx, y + s * 0.95, s * 0.3, rnd < 0.5 ? '#ff7a9c' : '#ffb46b');
  } else if (band === 'nightwood') {
    drawPine(b, cx + (rnd - 0.5) * s * 0.3, y + s * 0.95, s * 0.65, rnd2 < 0.5 ? '#16204a' : '#0e1538');
    if (rnd2 < 0.45) {
      var fg2 = b.createRadialGradient(x + s * 0.72, y + s * 0.35, s * 0.01, x + s * 0.72, y + s * 0.35, s * 0.14);
      fg2.addColorStop(0, 'rgba(230,255,150,0.95)');
      fg2.addColorStop(1, 'rgba(230,255,150,0)');
      b.fillStyle = fg2;
      b.beginPath(); b.arc(x + s * 0.72, y + s * 0.35, s * 0.14, 0, Math.PI * 2); b.fill();
    }
  } else if (band === 'clouds') {
    b.fillStyle = 'rgba(255,255,255,0.92)';
    cloudShape(b, cx + (rnd - 0.5) * s * 0.3, y + s * 0.62, s * 0.11);
    if (rnd2 < 0.45) drawStar(b, x + s * 0.75, y + s * 0.28, s * 0.07, 0, 0);
  } else if (band === 'moon') {
    b.fillStyle = 'rgba(200,200,240,0.25)';
    b.beginPath(); b.arc(cx + (rnd - 0.5) * s * 0.5, cy + (rnd2 - 0.5) * s * 0.4, s * 0.16, 0, Math.PI * 2); b.fill();
    if (rnd2 < 0.5) drawMoonStone(b, cx + (rnd - 0.5) * s * 0.4, y + s * 0.7, s * 0.1);
  } else {
    b.strokeStyle = '#8bbf6a';
    b.lineWidth = Math.max(1, s * 0.05);
    b.lineCap = 'round';
    var k;
    for (k = 0; k < 3; k++) {
      var rx = x + s * (0.25 + k * 0.25) + (rnd - 0.5) * s * 0.1;
      b.beginPath(); b.moveTo(rx, y + s * 0.95); b.lineTo(rx + s * 0.06, y + s * (0.45 + (k % 2) * 0.15)); b.stroke();
    }
    if (rnd2 < 0.3) {
      var wg = b.createRadialGradient(cx, cy - s * 0.1, s * 0.02, cx, cy - s * 0.1, s * 0.2);
      wg.addColorStop(0, 'rgba(220,255,200,0.9)');
      wg.addColorStop(1, 'rgba(220,255,200,0)');
      b.fillStyle = wg;
      b.beginPath(); b.arc(cx, cy - s * 0.1, s * 0.2, 0, Math.PI * 2); b.fill();
    }
  }
}

function drawCottage(b, x, baseY, s) {
  b.fillStyle = '#f5deb3';
  b.fillRect(x - s * 0.32, baseY - s * 0.42, s * 0.64, s * 0.42);
  b.fillStyle = '#c0504d';
  b.beginPath();
  b.moveTo(x - s * 0.42, baseY - s * 0.42);
  b.lineTo(x, baseY - s * 0.8);
  b.lineTo(x + s * 0.42, baseY - s * 0.42);
  b.closePath(); b.fill();
  b.fillStyle = '#8a5cb8';
  b.fillRect(x - s * 0.09, baseY - s * 0.26, s * 0.18, s * 0.26);
  b.fillStyle = '#ffe27a';
  b.fillRect(x + s * 0.12, baseY - s * 0.34, s * 0.12, s * 0.12);
}

function renderHubBg(lay) {
  var key = viewW + 'x' + viewH + '|' + hubWorld;
  if (hubBgKey === key) return;
  hubBgKey = key;
  hubBgCanvas.width = Math.round(viewW * DPR);
  hubBgCanvas.height = Math.round(viewH * DPR);
  var b = hubBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var s = lay.cell, r, c, ch, x, y, i;

  // Taivas ja aurinko
  var g = b.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, '#ffd6ec');
  g.addColorStop(0.5, '#d6b3ff');
  g.addColorStop(1, '#b3e0ff');
  b.fillStyle = g;
  b.fillRect(0, 0, viewW, viewH);
  var sunX = viewW * 0.9, sunY = viewH * 0.1, sunR = viewH * 0.06;
  var sg = b.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 3);
  sg.addColorStop(0, 'rgba(255,240,180,0.9)');
  sg.addColorStop(1, 'rgba(255,240,180,0)');
  b.fillStyle = sg;
  b.fillRect(sunX - sunR * 3, sunY - sunR * 3, sunR * 6, sunR * 6);
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 6; i++) cloudShape(b, viewW * (0.05 + i * 0.18), viewH * (0.06 + (i % 2) * 0.05), viewH * 0.02);

  // Karttalauta
  var pad = s * 0.45;
  var bx = lay.ox - pad, by = lay.oy - pad, bw = lay.cols * s + pad * 2, bh = lay.rows * s + pad * 2;
  b.fillStyle = 'rgba(0,0,0,0.12)';
  roundRect(b, bx + s * 0.12, by + s * 0.16, bw, bh, s * 0.6);
  b.fill();
  b.fillStyle = '#f7ead2';
  roundRect(b, bx, by, bw, bh, s * 0.6);
  b.fill();
  b.strokeStyle = '#d9b98a';
  b.lineWidth = Math.max(2, s * 0.08);
  b.stroke();

  // Maasto
  b.save();
  roundRect(b, lay.ox, lay.oy, lay.cols * s, lay.rows * s, s * 0.35);
  b.clip();
  for (r = 0; r < lay.rows; r++) {
    for (c = 0; c < lay.cols; c++) {
      drawHubTile(b, hubBand(c, r), lay.ox + c * s, lay.oy + r * s, s, c, r);
    }
  }

  // Polku yhtenäisenä tienä: reunus ja päällyste
  var passes = [['#b8965e', 0.7], ['#f3e2b3', 0.54]];
  var p, cx, cy;
  for (p = 0; p < passes.length; p++) {
    b.strokeStyle = passes[p][0];
    b.lineWidth = s * passes[p][1];
    b.lineCap = 'round';
    b.lineJoin = 'round';
    for (r = 0; r < lay.rows; r++) {
      for (c = 0; c < lay.cols; c++) {
        ch = hubAt(c, r);
        if (!hubWalkable(ch)) continue;
        cx = lay.ox + (c + 0.5) * s;
        cy = lay.oy + (r + 0.5) * s;
        b.beginPath(); b.moveTo(cx, cy); b.lineTo(cx + 0.01, cy); b.stroke();
        if (hubWalkable(hubAt(c + 1, r))) { b.beginPath(); b.moveTo(cx, cy); b.lineTo(cx + s, cy); b.stroke(); }
        if (hubWalkable(hubAt(c, r + 1))) { b.beginPath(); b.moveTo(cx, cy); b.lineTo(cx, cy + s); b.stroke(); }
      }
    }
  }
  // Kivet tiellä
  b.fillStyle = 'rgba(180,150,100,0.45)';
  for (r = 0; r < lay.rows; r++) {
    for (c = 0; c < lay.cols; c++) {
      ch = hubAt(c, r);
      if (!hubWalkable(ch) || hubRooms()[ch] || ch === 'G' || ch === 'B') continue;
      cx = lay.ox + (c + 0.5) * s;
      cy = lay.oy + (r + 0.5) * s;
      for (i = 0; i < 3; i++) {
        var hh = hubHash(c * 3 + i, r * 5 + i);
        var hv = hubHash(r * 7 + i, c * 2 + i);
        b.beginPath();
        b.arc(cx + (hh - 0.5) * s * 0.5, cy + (hv - 0.5) * s * 0.4, s * 0.035, 0, Math.PI * 2);
        b.fill();
      }
    }
  }
  b.restore();

  // Mökki sataman vieressä (vain maailmassa 1)
  if (hubWorld === 1) {
    var st = hubFind('B');
    drawCottage(b, lay.ox + (st.c + 1.5) * s, lay.oy + (st.r - 0.5) * s + s * 0.42, s * 0.85);
  }
}

function drawHubMedallion(c, room, x, y, s, isCleared, isNext) {
  var rad = s * (isNext ? 0.36 + Math.sin(globalT * 4) * 0.02 : 0.34);
  if (isNext) {
    var gl = c.createRadialGradient(x, y, rad * 0.8, x, y, rad * 1.9);
    gl.addColorStop(0, 'rgba(255,230,140,0.55)');
    gl.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = gl;
    c.beginPath(); c.arc(x, y, rad * 1.9, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath(); c.arc(x + s * 0.03, y + s * 0.06, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = isCleared ? '#d9cfe6' : '#ffe27a';
  c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = isCleared ? '#c5b8d0' : room.color;
  c.beginPath(); c.arc(x, y, rad * 0.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.arc(x - rad * 0.3, y - rad * 0.38, rad * 0.26, 0, Math.PI * 2); c.fill();
  if (isCleared) c.globalAlpha = 0.5;
  drawHubRoomIcon(c, room.kind, x, y, s * 1.15);
  c.globalAlpha = 1;
  if (isCleared) drawStar(c, x + rad * 0.72, y - rad * 0.72, s * 0.13, 0, 0.9);
  if (isNext) drawHintArrow(c, x, y - rad * 2.2);
}

// ---------- Uusintakupla ----------
// Kun nappula saapuu läpäistyyn huoneeseen (tai linnaan finaalin jälkeen), yksisarvinen
// "ehdottaa" puhekuplassa: ↻ pelaa uudestaan, vene = maailma 2. Muualle napautus sulkee kuplan
// ja nappula lähtee matkaan, eli läpäistyn huoneen voi aina ohittaa.
function hubOfferShow(items) {
  hubOffer = { c: hubPawn.c, r: hubPawn.r, items: items, t: 0 };
  playNote(784, 0, 0.1, 'triangle', 0.3);
  playNote(1047, 0.08, 0.16, 'triangle', 0.3);
}

function hubOfferButtons(lay) {
  var res = [], i;
  if (!hubOffer) return res;
  var s = lay.cell;
  var rad = Math.max(s * 0.7, viewH * 0.055);
  var base = hubCenter(hubOffer.c, hubOffer.r, lay);
  var dir = hubOffer.c > lay.cols / 2 ? -1 : 1;
  var cx = base.x + dir * (s * 0.95 + rad);
  var cy = base.y - s * 0.3;
  for (i = 0; i < hubOffer.items.length; i++) {
    res.push({ x: cx + dir * i * rad * 2.3, y: cy, rad: rad, item: hubOffer.items[i], dir: dir, base: base });
  }
  return res;
}

function hubOfferHit(px, py, lay) {
  var bs = hubOfferButtons(lay), i, dx, dy;
  for (i = 0; i < bs.length; i++) {
    dx = px - bs[i].x;
    dy = py - bs[i].y;
    if (dx * dx + dy * dy <= bs[i].rad * bs[i].rad * 1.35) return bs[i].item;
  }
  return null;
}

function hubOfferAct(item) {
  if (item.act === 'replay') {
    hubApproach = null;
    beginPlay(item.kind);
  }
}

function drawHubOffer(c, lay) {
  var bs = hubOfferButtons(lay), i, b;
  if (bs.length === 0) return;
  var rad = bs[0].rad;
  var pad = rad * 1.18;
  var minX = 1e9, maxX = -1e9;
  for (i = 0; i < bs.length; i++) {
    minX = Math.min(minX, bs[i].x);
    maxX = Math.max(maxX, bs[i].x);
  }
  var bx = minX - pad, by = bs[0].y - pad, bw = maxX - minX + pad * 2, bh = pad * 2;
  var tailX = bs[0].dir > 0 ? bx : bx + bw;
  var tipX = bs[0].base.x + bs[0].dir * lay.cell * 0.3;
  var tipY = bs[0].base.y + lay.cell * 0.05;
  // Puhekuplan varjo, pohja ja häntä nappulaa kohti
  c.fillStyle = 'rgba(0,0,0,0.22)';
  roundRect(c, bx + rad * 0.06, by + rad * 0.1, bw, bh, pad * 0.5);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.96)';
  roundRect(c, bx, by, bw, bh, pad * 0.5);
  c.fill();
  c.beginPath();
  c.moveTo(tailX, by + bh * 0.42);
  c.lineTo(tailX, by + bh * 0.78);
  c.lineTo(tipX, tipY);
  c.closePath();
  c.fill();
  c.strokeStyle = '#f5b3d2';
  c.lineWidth = Math.max(2, rad * 0.08);
  roundRect(c, bx, by, bw, bh, pad * 0.5);
  c.stroke();

  for (i = 0; i < bs.length; i++) {
    b = bs[i];
    var pr = b.rad * 0.86 * (1 + Math.sin(globalT * 4 + i) * 0.03);
    var col = '#8a4dff', ring = '#6b2ed1';
    if (b.item.act === 'boat') { col = '#4fa3ff'; ring = '#2c6fc4'; }
    else if (b.item.kind !== 'finale') {
      var room = hubRoomByKind(b.item.kind);
      if (room) col = room.color;
      ring = 'rgba(0,0,0,0.25)';
    }
    c.fillStyle = ring;
    c.beginPath(); c.arc(b.x, b.y + pr * 0.12, pr, 0, Math.PI * 2); c.fill();
    c.fillStyle = col;
    c.beginPath(); c.arc(b.x, b.y, pr, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.arc(b.x - pr * 0.3, b.y - pr * 0.35, pr * 0.28, 0, Math.PI * 2); c.fill();
    if (b.item.act === 'boat') {
      drawBoat(c, b.x, b.y + pr * 0.3, pr * 1.25);
    } else {
      drawReplayArrow(c, b.x, b.y, pr * 0.55);
      if (b.item.kind === 'finale') drawStar(c, b.x, b.y, pr * 0.16, globalT, 0);
    }
  }
}

// Pyöreä "uudestaan"-nuoli ↻
function drawReplayArrow(c, x, y, r) {
  var a1 = Math.PI * 0.2, a2 = Math.PI * 1.7;
  c.strokeStyle = '#fff';
  c.lineCap = 'round';
  c.lineWidth = Math.max(2.5, r * 0.32);
  c.beginPath();
  c.arc(x, y, r, a1, a2);
  c.stroke();
  var ex = x + Math.cos(a2) * r, ey = y + Math.sin(a2) * r;
  var tx = -Math.sin(a2), ty = Math.cos(a2);
  var hs = r * 0.62;
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(ex + tx * hs * 0.9, ey + ty * hs * 0.9);
  c.lineTo(ex - ty * hs * 0.75, ey + tx * hs * 0.75);
  c.lineTo(ex + ty * hs * 0.75, ey - tx * hs * 0.75);
  c.closePath();
  c.fill();
  c.lineCap = 'butt';
}

// ---------- Saaren vaihto ----------
// Saaristokartalta saaren sokkeloon: nappula aloittaa satamasta (B)
function hubEnterIsland(w) {
  var pos, lay, cpos;
  hubWorld = w;
  hubBgKey = '';
  hubPlaying = null;
  hubApproach = null;
  lastIsland = w;
  saveProgress();
  showHub();
  pos = hubFind('B');
  hubPawn.c = pos.c;
  hubPawn.r = pos.r;
  hubPawn.facing = 1;
  lay = hubLayout();
  cpos = hubCenter(pos.c, pos.r, lay);
  hubPawn.x = cpos.x;
  hubPawn.y = cpos.y;
  playNote(523, 0, 0.15, 'triangle', 0.35);
  playNote(659, 0.1, 0.15, 'triangle', 0.35);
  playNote(784, 0.2, 0.3, 'triangle', 0.4);
}

// Satama: laituri ja vene
function drawHarbor(c, x, y, s) {
  var i;
  c.fillStyle = 'rgba(120,200,240,0.55)';
  c.beginPath(); c.arc(x, y + s * 0.2, s * 0.48, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#a97a4a';
  for (i = 0; i < 3; i++) c.fillRect(x - s * 0.42 + i * s * 0.3, y - s * 0.02, s * 0.24, s * 0.1);
  c.fillRect(x - s * 0.44, y - s * 0.03, s * 0.9, s * 0.05);
  drawBoat(c, x, y + s * 0.22, s * 0.7);
}

function drawBoat(c, x, y, s) {
  c.fillStyle = '#8a5a30';
  c.beginPath();
  c.moveTo(x - s * 0.5, y);
  c.quadraticCurveTo(x, y + s * 0.45, x + s * 0.5, y);
  c.lineTo(x + s * 0.42, y - s * 0.12);
  c.lineTo(x - s * 0.42, y - s * 0.12);
  c.closePath();
  c.fill();
  c.strokeStyle = '#5a3a1e';
  c.lineWidth = Math.max(1.5, s * 0.05);
  c.beginPath(); c.moveTo(x, y - s * 0.12); c.lineTo(x, y - s * 0.75); c.stroke();
  c.fillStyle = '#ff7bac';
  c.beginPath();
  c.moveTo(x + s * 0.03, y - s * 0.72);
  c.lineTo(x + s * 0.42, y - s * 0.3);
  c.lineTo(x + s * 0.03, y - s * 0.2);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(120,200,240,0.5)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y + s * 0.08, s * 0.7, s * 0.1, 0, 0, Math.PI * 2);
  else c.arc(x, y + s * 0.08, s * 0.4, 0, Math.PI * 2);
  c.fill();
}
