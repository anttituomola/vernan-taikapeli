'use strict';

// Horisontti: merimatka Revontulimaan rantaan. Vene purjehtii itse eteenpäin;
// sormi ohjaa vain ylös ja alas: vene liukuu pehmeästi sormen korkeudelle.
// Jäälautta ei vie sydäntä, vaan vene tömähtää siitä sivuun ja hidastaa hetken.
// Tähdet jotka jäävät taakse tulevat uudelleen eteen. Laituri pysäyttää
// veneen; jäljellä olevat tähdet leijuvat luo.

var VOY_STARS = 8;
var voy = { x: 0, y: 0, vy: 0, bumpT: 0 };
var VOY_SPEED = 0.18;   // purjehdusnopeus, viewW/s
var voyStars = [];
var voyIce = [];
var voyDock = { fx: 0.94, x: 0, ready: false };
var voyFx = { hopT: 0 };   // veneen pomppu tökkäyksestä (vain piirtoon)
var voyStarDefs = [
  { fx: 0.12, fy: 0.56 }, { fx: 0.22, fy: 0.40 }, { fx: 0.30, fy: 0.68 }, { fx: 0.44, fy: 0.44 },
  { fx: 0.55, fy: 0.66 }, { fx: 0.62, fy: 0.40 }, { fx: 0.76, fy: 0.60 }, { fx: 0.86, fy: 0.42 }
];
var voyIceDefs = [
  { fx: 0.18, fy: 0.48, r: 0.055 }, { fx: 0.27, fy: 0.74, r: 0.05 },
  { fx: 0.48, fy: 0.42, r: 0.06 }, { fx: 0.58, fy: 0.76, r: 0.05 },
  { fx: 0.72, fy: 0.48, r: 0.055 }, { fx: 0.82, fy: 0.72, r: 0.05 }
];

// Vene kulkee horisontin alapuolella; yläreuna jättää tilaa HUDille
function voyWaterTop() { return viewH * 0.34; }
function voyWaterBot() { return viewH * 0.80; }

function initVoyage() {
  var i;
  tasks = [makeTask(0.33, 'count'), makeTask(0.64, 'compare')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([]);
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
  voy.y = viewH * 0.56;
  voy.vy = 0;
  voy.bumpT = 0;
  princess.x = voy.x;
  princess.y = voy.y;
  princess.facing = 1;
  checkpoint.x = voy.x;
  checkpoint.y = voy.y;
  voyFx.hopT = 0;
  voySetupProps();
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
  voySetupProps();
}

// Napautus ohjaa venettä pidon kautta kuten ennenkin; koriste saa lisäksi heilahtaa
function handleVoyageTap(px, py) {
  if (!running || puzzleBusy()) return;
  propsTap(px + camX, py);
}

function voyBoatY() { return voy.y + viewH * 0.04; }

// ---------- Revontulimaan yhteiset koristeapurit ----------
// (Käytössä myös saaren muissa kentissä; sopisivat myöhemmin world.js:ään.)
// Lumitupsu putoaa koristeesta, pomppaa kerran ja haihtuu
function voySnowPuff(x, y, r, ground) {
  propDrop({
    x: x, y: y, vx: (Math.random() - 0.5) * viewW * 0.05, vy: -viewH * 0.06, ground: ground, life: 1.4,
    draw: function (c) { artCircle(c, 0, 0, r, '#ffffff', { shadeTo: '#e3d8f5', lineColor: '#b8c8d8', hi: 0.45 }); }
  });
}
// Luminen kuusi: tökkäys heilauttaa ja pudottaa pari lumitupsua oksilta
function voyPineProp(x, baseY, s, color) {
  return propAdd({
    x: x, y: baseY, r: s * 0.45, hy: s * 0.5, color: '#ffffff', note: 440, amp: 0.08,
    draw: function (c) { drawNorthPine(c, 0, 0, s, color); },
    poke: function (p) {
      var k;
      for (k = 0; k < 2; k++) {
        voySnowPuff(p.x + (Math.random() - 0.5) * s * 0.5, p.y - s * (0.45 + Math.random() * 0.3), s * 0.06, p.y - s * 0.03);
      }
    }
  });
}

// Vesipisara veneen tökkäyksestä
function voyDroplet(x, y, ground) {
  propDrop({
    x: x, y: y, vx: (Math.random() - 0.5) * viewW * 0.08, vy: -viewH * (0.12 + Math.random() * 0.08), ground: ground, life: 0.9,
    draw: function (c) { artCircle(c, 0, 0, viewH * 0.008, '#bfe8ff', { lineColor: '#5a9cc0', hi: 0.5 }); }
  });
}

// Hylje kurkistaa jäälautan takaa (yllätys: kolmas tökkäys)
function voyDrawSeal(c, x, y, s) {
  artBlob(c, x, y + s * 0.9, s * 0.7, s * 0.8, '#8fa6b8', { shadeTo: '#5a7284', lineColor: '#3e5466', hi: 0.2 });
  artCircle(c, x, y, s * 0.62, '#9fb6c8', { shadeTo: '#6a8294', lineColor: '#3e5466', hi: 0.3 });
  artEye(c, x - s * 0.22, y - s * 0.08, s * 0.11, 0, false);
  artEye(c, x + s * 0.22, y - s * 0.08, s * 0.11, 0, false);
  artBlob(c, x, y + s * 0.2, s * 0.14, s * 0.1, '#2a3a48', { line: false });
  artBlush(c, x - s * 0.38, y + s * 0.18, s * 0.1);
  artBlush(c, x + s * 0.38, y + s * 0.18, s * 0.1);
}

// Jäälautta koristeena: piirto siirtyy tänne (keinunta ja litistys tökkäyksestä),
// törmäys lasketaan yhä updateVoyage:ssa. Joka kolmas tökkäys: hylje kurkistaa.
function voyIceProp(ice) {
  ice.sealT = 0;
  propAdd({
    x: ice.x, y: ice.y, r: ice.r * 1.4, hy: 0, color: '#c8f0ff', note: 523, amp: 0.1,
    update: function (p, dt) {
      p.y = ice.y;
      if (ice.sealT > 0) ice.sealT -= dt;
    },
    draw: function (c) {
      var r = ice.r * 1.15, up;
      if (ice.sealT > 0) {
        up = easeOutBack(Math.min(1, (2.4 - ice.sealT) / 0.5)) * Math.min(1, ice.sealT / 0.4) * r * 0.75;
        voyDrawSeal(c, r * 0.15, r * 0.1 - up, r * 0.5);
      }
      drawNorthIce(c, 0, 0, r);
    },
    poke: function (p) {
      if (p.n % 3 === 0 && ice.sealT <= 0) {
        ice.sealT = 2.4;
        playNote(330, 0.1, 0.18, 'triangle', 0.25);
        playNote(392, 0.3, 0.22, 'triangle', 0.25);
      }
    }
  });
}

// Tökättävät koristeet: jäälautat, vene (pomppaa ja roiskii), laiturin kuuset
// (lumitupsu) ja kiinnityspaalu (lumihattu hyppää).
function voySetupProps() {
  var i, h = viewH;
  propsReset();
  for (i = 0; i < voyIce.length; i++) voyIceProp(voyIce[i]);
  propAdd({
    x: voy.x, y: voyBoatY(), r: h * 0.1, hy: h * 0.03, color: '#c8f0ff', note: 494,
    draw: function () {},
    update: function (p) { p.x = voy.x; p.y = voyBoatY(); },
    poke: function (p) {
      var k;
      voyFx.hopT = 0.5;
      for (k = 0; k < 3; k++) voyDroplet(p.x + (k - 1) * h * 0.06, p.y + h * 0.04, p.y + h * 0.07);
    }
  });
  voyPineProp(voyDock.x + h * 0.2, h * 0.52, h * 0.16, '#1a3850');
  voyPineProp(voyDock.x + h * 0.32, h * 0.54, h * 0.12, '#245068');
  propAdd({
    x: voyDock.x + h * 0.094, y: h * 0.54, r: h * 0.07, hy: h * 0.17, color: '#ffffff', note: 660, amp: 0.06,
    draw: function (c, p) {
      var hop = p.t >= 0 ? Math.sin(Math.min(1, p.t / 0.45) * Math.PI) * h * 0.03 : 0;
      artRoundRect(c, -h * 0.014, -h * 0.2, h * 0.028, h * 0.2, 4, '#8a5a30', {});
      artBlob(c, 0, -h * 0.22 - hop, h * 0.04, h * 0.02, '#ffffff', { shadeTo: '#e3d8f5', lineColor: '#b8c8d8', hi: 0.4 });
    },
    poke: function (p) { voySnowPuff(p.x + h * 0.02, p.y - h * 0.2, h * 0.012, p.y); }
  });
}

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

// Jäälautta tömäyttää veneen sivuun: roiske, tömähdys ja hetken hitaampi vauhti
function voyBump(ice, dy) {
  var k;
  voy.bumpT = 0.9;
  voy.vy = (dy >= 0 ? 1 : -1) * viewH * 0.45;
  for (k = 0; k < 4; k++) voyDroplet(voy.x + (k - 1.5) * viewH * 0.03, voyBoatY(), voyBoatY() + viewH * 0.05);
  spawnSparkles(voy.x, voyBoatY(), 8, '#d0e8f8');
  artShakeStart(viewH * 0.008, 0.2);
  playNote(220, 0, 0.12, 'triangle', 0.3);
  playNote(165, 0.08, 0.2, 'triangle', 0.25);
}

function updateVoyage(dt) {
  var i, n, dx, dy, busy, blocked, wantY, rr, atEnd;
  updateTasks(dt);
  propsUpdate(dt);
  if (voyFx.hopT > 0) voyFx.hopT -= dt;
  if (voy.bumpT > 0) voy.bumpT -= dt;
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
    // Vene purjehtii itse; tömähdyksen jälkeen hetken hitaammin
    if (!blocked && !atEnd) voy.x += viewW * VOY_SPEED * (voy.bumpT > 0 ? 0.45 : 1) * dt;
    voy.x = Math.min(Math.max(voy.x, voyXMin()), voyXMax());
    atEnd = voyAtDock();
    // Sormi ohjaa vain korkeutta: vaimennettu jousi kohti sormea, ilman sormea
    // vene lipuu hiljalleen paikoilleen (ei kiihdy itsestään mihinkään)
    wantY = holding ? Math.min(Math.max(lastPY, voyWaterTop()), voyWaterBot()) : voy.y;
    voy.vy += ((wantY - voy.y) * 9 - voy.vy * 5) * dt;
    voy.vy = Math.min(Math.max(voy.vy, -viewH * 0.45), viewH * 0.45);
    voy.y += voy.vy * dt;
    if (voy.y < voyWaterTop()) { voy.y = voyWaterTop(); voy.vy = Math.max(0, voy.vy); }
    if (voy.y > voyWaterBot()) { voy.y = voyWaterBot(); voy.vy = Math.min(0, voy.vy); }
    for (i = 0; i < voyIce.length; i++) {
      voyIce[i].t += dt;
      voyIce[i].y = voyIce[i].baseY + Math.sin(voyIce[i].t * 1.3) * viewH * 0.025;
      dx = voy.x - voyIce[i].x; dy = voy.y - voyIce[i].y;
      rr = voyIce[i].r + viewH * 0.04;
      if (voy.bumpT <= 0 && dx * dx + dy * dy < rr * rr) voyBump(voyIce[i], dy);
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
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) voyCollect(n);
    }
  }
  princess.x = voy.x;
  princess.y = voy.y;
  princess.facing = 1;
  followCam(voy.x, dt);
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
// Horisontti on korkealla (VOY_HORIZON): taivaalle jää tilaa revontulelle
var VOY_HORIZON = 0.30;
function renderVoyageFar(b, w, h) {
  var i, x, hz = h * VOY_HORIZON, sky = b.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#061018');
  sky.addColorStop(0.55, '#123048');
  sky.addColorStop(1, '#2a6080');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff8d8';
  for (i = 0; i < 40; i++) {
    x = w * ((i * 0.137 + 0.04) % 1);
    b.globalAlpha = 0.28 + (i % 5) * 0.14;
    b.beginPath(); b.arc(x, h * (0.03 + (i * 0.061) % 0.2), 1.0 + (i % 4) * 0.45, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.82, h * 0.08, h * 0.045, 0.18, '#c8f0ff', '#f4fbff', '#d8eeff');
  fillHillBand(b, w, h, hz + 2, '#1a3848', function (px) {
    return hz - h * 0.035 - Math.sin(px * 0.0016 + 0.4) * h * 0.03 - Math.sin(px * 0.004) * h * 0.012;
  });
  b.fillStyle = 'rgba(236,246,255,0.7)';
  b.beginPath();
  b.moveTo(0, hz - h * 0.045);
  for (x = 0; x <= w; x += 12) b.lineTo(x, hz - h * 0.045 - Math.sin(x * 0.0016 + 0.4) * h * 0.016);
  for (x = w; x >= 0; x -= 12) b.lineTo(x, hz - h * 0.012 - Math.sin(x * 0.0016 + 0.4) * h * 0.01);
  b.closePath(); b.fill();
  for (i = 0; i < 8; i++) {
    drawNorthPine(b, w * (0.04 + i * 0.12), hz - h * 0.004, h * (0.055 + (i % 3) * 0.015), '#142838');
  }
}
function renderVoyageMid(b, w, h) {
  var i, x, hz = h * VOY_HORIZON, water = b.createLinearGradient(0, hz, 0, h);
  water.addColorStop(0, '#5ab8d4');
  water.addColorStop(0.3, '#2e7a9c');
  water.addColorStop(1, '#16405a');
  b.fillStyle = water;
  b.fillRect(0, hz, w, h - hz);
  b.fillStyle = 'rgba(210,240,255,0.2)';
  for (i = 0; i < 16; i++) {
    x = (i * 277.1) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, h * (0.36 + (i % 5) * 0.09), h * 0.11, h * 0.012, 0, 0, Math.PI * 2);
    else b.arc(x, h * 0.45, h * 0.05, 0, Math.PI * 2);
    b.fill();
  }
}
function renderVoyageNear(b, w, h) {
  var i, x, water = b.createLinearGradient(0, h * 0.58, 0, h);
  water.addColorStop(0, 'rgba(42,112,144,0)');
  water.addColorStop(0.25, 'rgba(26,80,104,0.45)');
  water.addColorStop(1, '#122830');
  b.fillStyle = water;
  b.fillRect(0, h * 0.58, w, h * 0.42);
  b.fillStyle = 'rgba(200,236,248,0.16)';
  for (i = 0; i < 10; i++) {
    x = (i * 241.1) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, h * 0.78 + (i % 3) * h * 0.04, h * 0.09, h * 0.014, 0, 0, Math.PI * 2);
    else b.arc(x, h * 0.8, h * 0.04, 0, Math.PI * 2);
    b.fill();
  }
  fillHillBand(b, w, h, h, '#d8e8f4', function (px) {
    var edge = voyDock.x - h * 0.08;
    if (px < edge) return h + 4;
    return h * 0.52 + Math.sin((px - edge) * 0.012) * h * 0.02;
  });
  // Ranta: lumi vaalenee ylhäältä laventeliin, reunaviiva vesirajaan
  b.beginPath();
  b.moveTo(voyDock.x - h * 0.04, h * 0.52);
  b.quadraticCurveTo(voyDock.x + h * 0.18, h * 0.46, w, h * 0.5);
  b.lineTo(w, h); b.lineTo(voyDock.x - h * 0.08, h);
  b.closePath();
  artFillPath(b, '#f4f9ff', h * 0.46, h, h * 0.2, { shadeTo: '#e3d8f5', lineColor: '#9ab4c8', line: Math.max(1.5, h * 0.004) });
  for (i = 0; i < 5; i++) {
    artRoundRect(b, voyDock.x - h * 0.22, h * 0.50 + i * h * 0.018, h * 0.38, h * 0.014, 3, i % 2 ? '#d2b080' : '#b89060', {});
  }
  // Kiinnityspaalu ja laiturin kuuset ovat tökättäviä koristeita (voySetupProps)
}

// Revontuli taivaalla ja sen heijastus vedessä (peilataan horisontin yli).
// Koko ruudun verho näytti veden päällä savulta.
function drawVoyageAurora(c) {
  var hz = viewH * VOY_HORIZON, hh = hz / 0.7;
  c.save();
  c.beginPath(); c.rect(0, 0, viewW, hz); c.clip();
  // Kahdesti piirrettynä verho hehkuu kirkkaammin matalalla taivaalla
  drawAuroraCurtain(c, viewW, hh, globalT, camX);
  drawAuroraCurtain(c, viewW, hh, globalT + 3.1, camX * 1.3);
  c.restore();
  c.save();
  c.beginPath(); c.rect(0, hz, viewW, viewH * 0.4); c.clip();
  c.globalAlpha = 0.45;
  c.translate(0, hz);
  c.scale(1, -0.9);
  c.translate(0, -hz);
  drawAuroraCurtain(c, viewW, hh, globalT, camX);
  c.restore();
}

function drawVoyage() {
  var i, s, ps, miss, hop;
  if (!beginPlayWorld()) return;
  drawVoyageAurora(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < voyStars.length; i++) {
    s = voyStars[i];
    if (s.collected) continue;
    drawStar(ctx, s.ax - camX, s.ay + Math.sin(s.phase) * viewH * 0.01, viewH * 0.028, Math.sin(s.phase) * 0.3, 0.8);
  }
  // Jäälautat, laiturin koristeet ja pudonneet lumitupsut
  propsDraw(ctx);
  if (voyDock.ready) {
    var gx = voyDock.x - camX, gy = viewH * 0.55;
    var glow = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.16);
    glow.addColorStop(0, 'rgba(160,255,210,' + (0.7 + Math.sin(globalT * 4) * 0.2) + ')');
    glow.addColorStop(1, 'rgba(160,255,210,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  ps = viewH / 520;
  hop = voyFx.hopT > 0 ? Math.sin(Math.min(1, (0.5 - voyFx.hopT) / 0.5) * Math.PI) * viewH * 0.03 : 0;
  drawNorthBoat(ctx, voy.x - camX, voyBoatY() - hop, viewH * 0.12);
  drawPrincessFree(ctx, voy.x - camX, voy.y - hop, ps, princess.facing, globalT * 4, true, globalT);
  drawParticlesLayer(ctx);
  if (!celebrating) {
    miss = voyMissedStar();
    if (voyDock.ready) drawEdgeArrow(ctx, voyDock.x);
    else if (miss && miss.ax < camX + viewW * 0.08) drawEdgeArrow(ctx, miss.ax);
  }
  endPlayWorld();
  drawPickupHud(ctx, VOY_STARS, function (k) { return voyStars[k] && voyStars[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawTaskOverlay(ctx);
}
