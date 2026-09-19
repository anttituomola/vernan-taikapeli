'use strict';

// Horisontti: merimatka Revontulimaan rantaan. Vene kulkee itse eteenpäin;
// pidä sormea ohjataksesi: vasemmalla palaa, oikealla jatkaa, ylös/alas
// väistää jäitä. Tähdet jotka jäävät taakse tulevat uudelleen eteen.
// Laituri pysäyttää veneen; jäljellä olevat tähdet leijuvat luo.

var VOY_STARS = 8;
var voy = { x: 0, y: 0, vy: 0 };
var voyStars = [];
var voyIce = [];
var voyDock = { fx: 0.94, x: 0, ready: false };
var voyStarDefs = [
  { fx: 0.12, fy: 0.42 }, { fx: 0.22, fy: 0.28 }, { fx: 0.32, fy: 0.50 }, { fx: 0.44, fy: 0.32 },
  { fx: 0.55, fy: 0.48 }, { fx: 0.66, fy: 0.26 }, { fx: 0.76, fy: 0.44 }, { fx: 0.86, fy: 0.30 }
];
var voyIceDefs = [
  { fx: 0.18, fy: 0.36, r: 0.055 }, { fx: 0.28, fy: 0.55, r: 0.05 },
  { fx: 0.48, fy: 0.30, r: 0.06 }, { fx: 0.58, fy: 0.58, r: 0.05 },
  { fx: 0.72, fy: 0.38, r: 0.055 }, { fx: 0.82, fy: 0.56, r: 0.05 }
];

function voyWaterTop() { return viewH * 0.22; }
function voyWaterBot() { return viewH * 0.70; }

function initVoyage() {
  var i;
  tasks = [makeTask(0.33, 'count'), makeTask(0.64, 'compare')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.36, 0.68]);
  voyStars = [];
  for (i = 0; i < VOY_STARS; i++) {
    voyStars.push({
      ax: voyStarDefs[i].fx * worldW, ay: voyStarDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  voyIce = [];
  for (i = 0; i < voyIceDefs.length; i++) {
    voyIce.push({
      x: voyIceDefs[i].fx * worldW, baseY: voyIceDefs[i].fy * viewH,
      y: voyIceDefs[i].fy * viewH, r: voyIceDefs[i].r * viewH, t: i * 0.7
    });
  }
  voyDock.x = voyDock.fx * worldW;
  voyDock.ready = false;
  voy.x = viewW * 0.14;
  voy.y = viewH * 0.46;
  voy.vy = 0;
  princess.x = voy.x;
  princess.y = voy.y;
  princess.facing = 1;
  checkpoint.x = voy.x;
  checkpoint.y = voy.y;
  renderBackground();
  playNote(392, 0, 0.25, 'sine', 0.35);
  playNote(523, 0.14, 0.3, 'triangle', 0.3);
}

function respawnVoyage() {
  voy.x = checkpoint.x;
  voy.y = checkpoint.y;
  voy.vy = 0;
  camX = Math.min(Math.max(voy.x - viewW * 0.3, 0), Math.max(0, worldW - viewW));
  spawnSparkles(voy.x, voy.y, 12, '#c8f0ff');
}

function resizeVoyage(ratio) {
  var i;
  voy.x *= ratio;
  for (i = 0; i < voyStars.length; i++) {
    voyStars[i].ax = voyStarDefs[i].fx * worldW;
    voyStars[i].ay = voyStarDefs[i].fy * viewH;
  }
  for (i = 0; i < voyIce.length; i++) {
    voyIce[i].x = voyIceDefs[i].fx * worldW;
    voyIce[i].baseY = voyIceDefs[i].fy * viewH;
    voyIce[i].y = voyIce[i].baseY;
    voyIce[i].r = voyIceDefs[i].r * viewH;
  }
  voyDock.x = voyDock.fx * worldW;
}

function handleVoyageTap() {}

function voyXMin() { return viewW * 0.1; }
function voyXMax() { return voyDock.x; }
function voyAtDock() { return voy.x >= voyDock.x - viewH * 0.12; }

function voyCollect(s) {
  s.collected = true;
  registerCollected(s);
  spawnSparkles(s.ax, s.ay, 12, '#ffe27a');
  soundStar(countCollected(voyStars));
  if (countCollected(voyStars) === VOY_STARS) voyDock.ready = true;
}

function voyPlaceStar(s, ahead) {
  var top = voyWaterTop() + viewH * 0.04, bot = voyWaterBot() - viewH * 0.04;
  s.ax = Math.min(ahead, voyDock.x - viewW * 0.06);
  s.ay = top + Math.random() * Math.max(24, bot - top);
}

function voyMissedStar() {
  var i;
  for (i = 0; i < voyStars.length; i++) {
    if (!voyStars[i].collected) return voyStars[i];
  }
  return null;
}

function updateVoyage(dt) {
  var i, n, dx, dy, busy, blocked, wantY, wantX, rr, atEnd;
  updateTasks(dt);
  busy = puzzleBusy();
  blocked = false;
  atEnd = voyAtDock();
  if (!busy && !celebrating) {
    for (i = 0; i < tasks.length; i++) {
      n = tasks[i];
      if (n.opened) continue;
      if (voy.x > n.x - viewH * 0.14) {
        voy.x = n.x - viewH * 0.14;
        blocked = true;
        if (!activeTask) taskStart(n);
      }
    }
    if (!blocked) {
      if (holding) {
        wantX = lastPX + camX;
        voy.x += ((wantX > voy.x ? 1 : -1) * viewW * 0.22) * dt;
      } else if (!atEnd) {
        voy.x += viewW * 0.20 * dt;
      }
    }
    voy.x = Math.min(Math.max(voy.x, voyXMin()), voyXMax());
    atEnd = voyAtDock();
    wantY = holding ? lastPY : voy.y;
    voy.vy += ((wantY > voy.y ? 1 : -1) * viewH * 0.7 - voy.vy * 0.8) * dt;
    voy.y += voy.vy * dt;
    voy.y = Math.min(Math.max(voy.y, voyWaterTop()), voyWaterBot());
    for (i = 0; i < voyIce.length; i++) {
      voyIce[i].t += dt;
      voyIce[i].y = voyIce[i].baseY + Math.sin(voyIce[i].t * 1.3) * viewH * 0.025;
      dx = voy.x - voyIce[i].x; dy = voy.y - voyIce[i].y;
      rr = voyIce[i].r + viewH * 0.04;
      if (dx * dx + dy * dy < rr * rr) {
        if (loseHeart()) {
          voy.y += (dy >= 0 ? 1 : -1) * viewH * 0.08;
          spawnSparkles(voy.x, voy.y, 8, '#d0e8f8');
        }
      }
    }
    for (i = 0; i < voyStars.length; i++) {
      n = voyStars[i];
      n.phase += dt * 2;
      if (n.collected) continue;
      if (atEnd) {
        if (n.ax < voy.x - viewW * 0.18 || n.ax > voy.x + viewW * 0.28) {
          voyPlaceStar(n, voy.x + viewW * (0.12 + (i % 3) * 0.08));
          spawnSparkles(n.ax, n.ay, 6, '#ffe27a');
        }
      } else if (n.ax < voy.x - viewW * 0.16) {
        voyPlaceStar(n, voy.x + viewW * (0.32 + Math.random() * 0.22));
      }
      dx = n.ax - voy.x; dy = n.ay - voy.y;
      if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) voyCollect(n);
    }
  }
  princess.x = voy.x;
  princess.y = voy.y;
  if (holding && lastPX + camX < voy.x - 8) princess.facing = -1;
  else princess.facing = 1;
  followCam(voy.x, dt);
  updateCheckpoints(voy.x, voy.y);
  if (voyDock.ready && !celebrating && atEnd) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function voyageLayers() {
  return [
    { speed: 0.22, render: renderVoyageFar },
    { speed: 0.55, render: renderVoyageMid },
    { speed: 1, render: renderVoyageNear }
  ];
}
function renderVoyageBg(b, w, h) {
  renderVoyageFar(b, w, h); renderVoyageMid(b, w, h); renderVoyageNear(b, w, h);
}
function renderVoyageFar(b, w, h) {
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#102038');
  sky.addColorStop(0.4, '#1a4060');
  sky.addColorStop(1, '#2a6a88');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.78, h * 0.14, h * 0.05, 0.22, '#ffe9a0', '#fff8d0', '#ffd24f');
}
function renderVoyageMid(b, w, h) {
  fillHillBand(b, w, h, h * 0.72, '#245a70', function (px) {
    return h * 0.72 - h * 0.04 - Math.sin(px * 0.002) * h * 0.03;
  });
}
function renderVoyageNear(b, w, h) {
  var g = b.createLinearGradient(0, h * 0.68, 0, h);
  g.addColorStop(0, '#3a88a8');
  g.addColorStop(1, '#1a4860');
  b.fillStyle = g;
  b.fillRect(0, h * 0.68, w, h * 0.32);
  b.fillStyle = '#d8eef0';
  b.fillRect(voyDock.x - h * 0.12, h * 0.62, h * 0.28, h * 0.08);
  b.fillStyle = '#8a5a30';
  b.fillRect(voyDock.x + h * 0.08, h * 0.48, h * 0.02, h * 0.16);
}

function drawVoyage() {
  var i, s, ice, ps, miss;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], voyWaterBot());
  for (i = 0; i < voyStars.length; i++) {
    s = voyStars[i];
    if (s.collected) continue;
    drawStar(ctx, s.ax - camX, s.ay + Math.sin(s.phase) * viewH * 0.01, viewH * 0.028, Math.sin(s.phase) * 0.3, 0.8);
  }
  for (i = 0; i < voyIce.length; i++) {
    ice = voyIce[i];
    ctx.fillStyle = 'rgba(230,245,255,0.92)';
    ctx.beginPath();
    ctx.moveTo(ice.x - camX, ice.y + ice.r * 0.4);
    ctx.lineTo(ice.x - camX - ice.r, ice.y + ice.r * 0.5);
    ctx.lineTo(ice.x - camX - ice.r * 0.2, ice.y - ice.r);
    ctx.lineTo(ice.x - camX + ice.r * 0.35, ice.y - ice.r * 0.7);
    ctx.lineTo(ice.x - camX + ice.r, ice.y + ice.r * 0.45);
    ctx.closePath(); ctx.fill();
  }
  if (voyDock.ready) {
    var gx = voyDock.x - camX, gy = viewH * 0.55;
    var glow = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.16);
    glow.addColorStop(0, 'rgba(160,255,210,' + (0.7 + Math.sin(globalT * 4) * 0.2) + ')');
    glow.addColorStop(1, 'rgba(160,255,210,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  ps = viewH / 520;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawBoat(ctx, voy.x - camX, voy.y + viewH * 0.04, viewH * 0.12);
  drawPrincessFree(ctx, voy.x - camX, voy.y, ps, princess.facing, globalT * 4, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (!celebrating) {
    miss = voyMissedStar();
    if (voyDock.ready) drawEdgeArrow(ctx, voyDock.x);
    else if (miss && miss.ax < camX + viewW * 0.08) drawEdgeArrow(ctx, miss.ax);
  }
  endPlayWorld();
  drawPickupHud(ctx, VOY_STARS, function (k) { return voyStars[k] && voyStars[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
