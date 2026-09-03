'use strict';

// Koko, tausta ja maisemapiirto
// ---------- Koko ja tausta ----------
var bgCanvas = document.createElement('canvas');
var bgScale = 1;

function resize() {
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.round(viewW * DPR);
  canvas.height = Math.round(viewH * DPR);
  canvas.style.width = viewW + 'px';
  canvas.style.height = viewH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  var oldWorldW = worldW;
  worldW = Math.min(viewW * 5, 8000);
  groundTop = viewH * 0.74;
  groundBottom = viewH * 0.94;

  // Skaalataan liikkuvat oliot uuteen maailmaan (esim. näytön kääntö)
  var ratio = oldWorldW > 0 ? worldW / oldWorldW : 1;
  unicorn.x *= ratio;
  unicorn.tx *= ratio;
  camX *= ratio;

  // Kaikille vaiheille yhteiset: tehtäväkaaret, portit, tarkistuspisteet
  var i;
  for (i = 0; i < gates.length; i++) gates[i].x = gates[i].fx * worldW;
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  for (i = 0; i < checkpoints.length; i++) checkpoints[i].x = checkpoints[i].fx * worldW;
  checkpoint.x *= ratio;
  unicorn.y = Math.min(Math.max(unicorn.y, groundTop), groundBottom);
  unicorn.ty = Math.min(Math.max(unicorn.ty, groundTop), groundBottom);

  var p = phaseNow();
  if (p.resize) p.resize(ratio);
  if (mode === 'play') ambientInit(p.ambient);

  renderBackground();
}

function resizeForest(ratio) {
  var i;
  for (i = 0; i < stars.length; i++) {
    stars[i].ax = starDefs[i].fx * worldW;
    stars[i].ay = starY(starDefs[i]);
    stars[i].ox = 0; stars[i].oy = 0;
    stars[i].px = stars[i].ax; stars[i].py = stars[i].ay;
  }
  for (i = 0; i < clouds.length; i++) clouds[i].x *= ratio;
  for (i = 0; i < drops.length; i++) drops[i].x *= ratio;
  troll.x *= ratio;
  for (i = 0; i < bunnies.length; i++) {
    bunnies[i].bushX = bushDefs[i].fx * worldW;
    if (bunnies[i].state === 'hidden') {
      bunnies[i].x = bunnies[i].bushX;
      bunnies[i].y = groundTop + 10;
    } else {
      bunnies[i].x *= ratio;
    }
  }
}

function resizeGarden(ratio) {
  var i;
  princess.x *= ratio;
  layoutLevel2();
  for (i = 0; i < butterflies.length; i++) {
    butterflies[i].ax = butterflyDefs[i].fx * worldW;
    butterflies[i].ay = groundTop - butterflyDefs[i].fy * viewH;
  }
  for (i = 0; i < sparks.length; i++) sparks[i].x *= ratio;
}

function resizeIce(ratio) {
  var i;
  for (i = 0; i < flakes.length; i++) {
    flakes[i].ax = iceDefs[i].fx * worldW;
    flakes[i].ay = groundTop - iceDefs[i].fy * viewH;
  }
  fox.x *= ratio;
}

function resizePond(ratio) {
  var i;
  princess.x *= ratio;
  layoutPond();
  for (i = 0; i < pearls.length; i++) {
    pearls[i].ax = pondDefs[i].fx * worldW;
    pearls[i].ay = groundTop - pondDefs[i].fy * viewH;
  }
  for (i = 0; i < sparks.length; i++) sparks[i].x *= ratio;
}

function resizeSky(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < moons.length; i++) {
    moons[i].ax = skyDefs[i].fx * worldW;
    moons[i].by = groundTop - skyDefs[i].fy * viewH;
    moons[i].ay = moons[i].by;
  }
  sheep.x *= ratio;
}

function renderBackground() {
  if (worldW < 1 || viewH < 1) return;
  // Piirretään koko maailman tausta kerran valmiiksi -> kevyt piirtää joka ruudulla.
  // Vanhojen laitteiden canvas-raja ~4096 px: iso maailma piirretään
  // pienennettynä ja skaalataan ruudulle piirrettäessä.
  bgScale = Math.min(1, 4000 / worldW);
  bgCanvas.width = Math.round(worldW * bgScale);
  bgCanvas.height = Math.round(viewH * bgScale);
  var b = bgCanvas.getContext('2d');
  b.setTransform(bgScale, 0, 0, bgScale, 0, 0);
  phaseNow().renderBg(b, worldW, viewH);
}

function renderForestBg(b, w, h) {
  var horizon = h * 0.68;
  var i, x;

  // Taivas
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#8ed3ff');
  sky.addColorStop(0.6, '#c9ecff');
  sky.addColorStop(1, '#ffeef8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);

  // Aurinko
  var sunX = w * 0.12, sunY = h * 0.16, sunR = h * 0.07;
  var sg = b.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  sg.addColorStop(0, 'rgba(255,236,150,1)');
  sg.addColorStop(0.4, 'rgba(255,220,110,0.85)');
  sg.addColorStop(1, 'rgba(255,220,110,0)');
  b.fillStyle = sg;
  b.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
  b.fillStyle = '#ffe27a';
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();

  // Pilvet
  b.fillStyle = 'rgba(255,255,255,0.92)';
  for (i = 0; i < 7; i++) {
    x = w * (0.05 + i * 0.14);
    var cy = h * (0.10 + (i % 3) * 0.07);
    var cs = h * 0.030 + (i % 2) * h * 0.012;
    cloudShape(b, x, cy, cs);
  }

  // Kaukaiset kukkulat
  b.fillStyle = '#bfe3b0';
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) {
    b.lineTo(x, horizon - Math.sin(x * 0.004) * h * 0.05 - h * 0.03);
  }
  b.lineTo(w, horizon); b.closePath(); b.fill();

  // Linna maailman lopussa
  drawCastle(b, w * 0.955, horizon, h * 0.30);

  // Nurmi
  var grass = b.createLinearGradient(0, horizon, 0, h);
  grass.addColorStop(0, '#9fdc7f');
  grass.addColorStop(1, '#5cbb52');
  b.fillStyle = grass;
  b.fillRect(0, horizon, w, h - horizon);

  // Polku
  b.fillStyle = '#f0d9a8';
  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) {
    b.lineTo(x, groundTop + Math.sin(x * 0.01) * 6);
  }
  b.lineTo(w, groundBottom + 8);
  for (x = w; x >= 0; x -= 12) {
    b.lineTo(x, groundBottom + 8 + Math.sin(x * 0.013) * 6);
  }
  b.closePath(); b.fill();

  // Puut polun taakse
  for (i = 0; i < 12; i++) {
    x = w * (0.04 + i * 0.085) + (i % 3) * 18;
    drawTree(b, x, horizon + h * 0.02, h * (0.10 + (i % 3) * 0.02));
  }

  // Kukkia
  var flowerColors = ['#ff7bac', '#ffd24f', '#b78bff', '#ff9d5c', '#7fd4ff'];
  for (i = 0; i < 60; i++) {
    x = (i * 137.5) % w;
    var fy2 = horizon + h * 0.03 + ((i * 53) % Math.max(1, (groundTop - horizon - h * 0.05)));
    drawFlower(b, x, fy2, h * 0.008, flowerColors[i % flowerColors.length]);
  }

  // Pensaat (pupujen piilot)
  for (i = 0; i < bushDefs.length; i++) {
    drawBush(b, bushDefs[i].fx * w, groundTop + 12, h * 0.055);
  }
}

function renderGardenBg(b, w, h) {
  var horizon = h * 0.70;
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#1a1448');
  sky.addColorStop(0.55, '#3a2a78');
  sky.addColorStop(1, '#7a4ea8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);

  var moonX = w * 0.18, moonY = h * 0.16, moonR = h * 0.07;
  var mg = b.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 2.4);
  mg.addColorStop(0, 'rgba(255,244,200,0.95)');
  mg.addColorStop(0.45, 'rgba(255,230,160,0.35)');
  mg.addColorStop(1, 'rgba(255,230,160,0)');
  b.fillStyle = mg;
  b.fillRect(moonX - moonR * 2.4, moonY - moonR * 2.4, moonR * 4.8, moonR * 4.8);
  b.fillStyle = '#fff6c8';
  b.beginPath(); b.arc(moonX, moonY, moonR, 0, Math.PI * 2); b.fill();

  b.fillStyle = 'rgba(255,255,220,0.9)';
  for (i = 0; i < 40; i++) {
    x = (i * 211.3) % w;
    b.beginPath();
    b.arc(x, h * (0.06 + (i % 7) * 0.07), 1.2 + (i % 3), 0, Math.PI * 2);
    b.fill();
  }

  b.fillStyle = '#2a3a5c';
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 10) {
    b.lineTo(x, horizon - Math.sin(x * 0.005) * h * 0.06 - h * 0.04);
  }
  b.lineTo(w, horizon); b.closePath(); b.fill();

  drawCastle(b, w * 0.06, horizon, h * 0.22);

  var grass = b.createLinearGradient(0, horizon, 0, h);
  grass.addColorStop(0, '#3d8a55');
  grass.addColorStop(1, '#245c38');
  b.fillStyle = grass;
  b.fillRect(0, horizon, w, h - horizon);

  var nightFlowers = ['#ff7bac', '#c9a0ff', '#ffd24f', '#7fd4ff'];
  for (i = 0; i < 50; i++) {
    x = (i * 167.7) % w;
    drawFlower(b, x, horizon + h * 0.04 + (i % 5) * h * 0.02, h * 0.009, nightFlowers[i % nightFlowers.length]);
  }

  for (i = 1; i < platforms.length; i++) {
    drawLedge(b, platforms[i].x, platforms[i].y, platforms[i].w, h);
  }
}

function drawLedge(b, x, y, w, h) {
  var cap = h * 0.028;
  var stem = h * 0.09;
  b.fillStyle = '#6d3b1e';
  b.fillRect(x + w * 0.42, y, w * 0.16, stem);
  var g = b.createLinearGradient(x, y - cap, x, y + cap * 0.4);
  g.addColorStop(0, '#f2a0d4');
  g.addColorStop(1, '#c45aa0');
  b.fillStyle = g;
  b.beginPath();
  if (b.ellipse) b.ellipse(x + w / 2, y, w / 2, cap, 0, 0, Math.PI * 2);
  else b.arc(x + w / 2, y, w / 2, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = '#ffe27a';
  b.beginPath();
  b.arc(x + w * 0.25, y - cap * 0.2, cap * 0.35, 0, Math.PI * 2); b.fill();
  b.beginPath();
  b.arc(x + w * 0.7, y - cap * 0.15, cap * 0.28, 0, Math.PI * 2); b.fill();
}

function cloudShape(b, x, y, s) {
  b.beginPath();
  b.arc(x, y, s * 1.2, 0, Math.PI * 2);
  b.arc(x + s * 1.4, y + s * 0.2, s * 0.9, 0, Math.PI * 2);
  b.arc(x - s * 1.4, y + s * 0.25, s * 0.85, 0, Math.PI * 2);
  b.arc(x + s * 0.5, y - s * 0.6, s * 0.8, 0, Math.PI * 2);
  b.fill();
}
function drawCastle(b, x, baseY, size) {
  var tw = size * 0.22;
  b.fillStyle = '#e8d5f2';
  b.fillRect(x - size * 0.4, baseY - size * 0.55, size * 0.8, size * 0.55);
  var towers = [-0.4, 0, 0.4];
  for (var i = 0; i < towers.length; i++) {
    var tx = x + towers[i] * size;
    var th = size * (i === 1 ? 0.95 : 0.7);
    b.fillStyle = '#dcc3ee';
    b.fillRect(tx - tw / 2, baseY - th, tw, th);
    b.fillStyle = '#c286e0';
    b.beginPath();
    b.moveTo(tx - tw * 0.75, baseY - th);
    b.lineTo(tx + tw * 0.75, baseY - th);
    b.lineTo(tx, baseY - th - size * 0.28);
    b.closePath(); b.fill();
    b.fillStyle = '#8a5cb8';
    b.fillRect(tx - tw * 0.12, baseY - th + size * 0.12, tw * 0.24, size * 0.14);
  }
  b.fillStyle = '#a76fd0';
  b.beginPath();
  b.moveTo(x - size * 0.1, baseY);
  b.lineTo(x + size * 0.1, baseY);
  b.lineTo(x + size * 0.1, baseY - size * 0.3);
  b.arc(x, baseY - size * 0.3, size * 0.1, 0, Math.PI, true);
  b.closePath(); b.fill();
  // Lippu
  b.strokeStyle = '#8a5cb8'; b.lineWidth = 2;
  b.beginPath();
  b.moveTo(x, baseY - size * 0.95 - size * 0.28);
  b.lineTo(x, baseY - size * 1.15 - size * 0.28);
  b.stroke();
  b.fillStyle = '#ff7bac';
  b.beginPath();
  b.moveTo(x, baseY - size * 1.15 - size * 0.28);
  b.lineTo(x + size * 0.18, baseY - size * 1.09 - size * 0.28);
  b.lineTo(x, baseY - size * 1.03 - size * 0.28);
  b.closePath(); b.fill();
}
function drawTree(b, x, baseY, s) {
  b.fillStyle = '#9c6b3f';
  b.fillRect(x - s * 0.08, baseY - s * 0.5, s * 0.16, s * 0.55);
  var lg = b.createRadialGradient(x, baseY - s * 0.9, s * 0.1, x, baseY - s * 0.9, s * 0.75);
  lg.addColorStop(0, '#8fd977');
  lg.addColorStop(1, '#4ea84f');
  b.fillStyle = lg;
  b.beginPath();
  b.arc(x, baseY - s * 0.9, s * 0.55, 0, Math.PI * 2);
  b.arc(x - s * 0.35, baseY - s * 0.65, s * 0.4, 0, Math.PI * 2);
  b.arc(x + s * 0.35, baseY - s * 0.65, s * 0.4, 0, Math.PI * 2);
  b.fill();
}
function drawFlower(b, x, y, s, color) {
  b.fillStyle = color;
  for (var i = 0; i < 5; i++) {
    var a = (i / 5) * Math.PI * 2;
    b.beginPath();
    b.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, 0, Math.PI * 2);
    b.fill();
  }
  b.fillStyle = '#fff3b0';
  b.beginPath(); b.arc(x, y, s * 0.7, 0, Math.PI * 2); b.fill();
}
function drawBush(b, x, baseY, s) {
  var g = b.createRadialGradient(x, baseY - s * 0.6, s * 0.2, x, baseY - s * 0.6, s * 1.4);
  g.addColorStop(0, '#7ccb62');
  g.addColorStop(1, '#3f9a44');
  b.fillStyle = g;
  b.beginPath();
  b.arc(x, baseY - s * 0.5, s, 0, Math.PI * 2);
  b.arc(x - s * 0.9, baseY - s * 0.3, s * 0.7, 0, Math.PI * 2);
  b.arc(x + s * 0.9, baseY - s * 0.3, s * 0.7, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = '#ff7bac';
  b.beginPath(); b.arc(x - s * 0.5, baseY - s * 0.9, s * 0.12, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + s * 0.6, baseY - s * 0.6, s * 0.12, 0, Math.PI * 2); b.fill();
}

function renderIceBg(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#3d6ea8');
  sky.addColorStop(0.5, '#6a9cc8');
  sky.addColorStop(1, '#9ec4dc');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  b.fillStyle = 'rgba(90,50,140,0.22)';
  b.beginPath();
  b.moveTo(0, h * 0.18);
  for (x = 0; x <= w; x += 16) b.lineTo(x, h * 0.16 + Math.sin(x * 0.006) * h * 0.08);
  b.lineTo(w, 0); b.lineTo(0, 0); b.fill();
  b.fillStyle = '#3a6f94';
  b.fillRect(0, horizon, w, h - horizon);
  b.fillStyle = '#4d86ad';
  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 14) b.lineTo(x, groundTop + Math.sin(x * 0.02) * 5);
  b.lineTo(w, groundBottom + 6);
  b.lineTo(0, groundBottom + 6);
  b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = 2;
  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 14) b.lineTo(x, groundTop + Math.sin(x * 0.02) * 5);
  b.stroke();
  drawCastle(b, w * 0.955, horizon, h * 0.28);
  b.fillStyle = '#dbefff';
  for (i = 0; i < 10; i++) {
    x = w * (0.06 + i * 0.09);
    cloudShape(b, x, horizon - h * 0.02, h * 0.04);
  }
}

function renderPondBg(b, w, h) {
  var horizon = h * 0.62, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#7ad8ff');
  sky.addColorStop(1, '#c5f3e2');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  var water = b.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, '#3ec6c0');
  water.addColorStop(1, '#0a5a62');
  b.fillStyle = water;
  b.fillRect(0, horizon, w, h - horizon);
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 18; i++) {
    x = (i * 211) % w;
    b.fillRect(x, horizon + ((i * 37) % (h - horizon - 20)), w * 0.04, 3);
  }
  for (i = 1; i < platforms.length; i++) {
    drawLilyPad(b, platforms[i].x, platforms[i].y, platforms[i].w, h);
  }
  drawCastle(b, w * 0.95, horizon, h * 0.22);
}

function drawLilyPad(b, x, y, w, h) {
  var cx = x + w / 2, rw = w / 2, rh = h * 0.03;
  b.fillStyle = '#2f8a3e';
  b.beginPath();
  if (b.ellipse) b.ellipse(cx, y, rw, rh, 0, 0, Math.PI * 2);
  else b.arc(cx, y, rw * 0.7, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = '#5ed46a';
  b.beginPath();
  if (b.ellipse) b.ellipse(cx - rw * 0.12, y - rh * 0.15, rw * 0.72, rh * 0.72, 0, 0, Math.PI * 2);
  else b.arc(cx, y, rw * 0.5, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = '#ff7bac';
  b.beginPath();
  b.arc(cx, y, h * 0.012, 0, Math.PI * 2);
  b.fill();
}

function renderSkyBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b0630');
  sky.addColorStop(0.55, '#2a1860');
  sky.addColorStop(1, '#5a3488');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 90; i++) {
    x = (i * 173.3) % w;
    var y = (i * 97.1) % (h * 0.7);
    b.globalAlpha = 0.35 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, y, 1.4 + (i % 3), 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 9; i++) {
    cloudShape(b, w * (0.05 + i * 0.11), h * (0.62 + (i % 2) * 0.08), h * 0.035);
  }
  drawCastle(b, w * 0.94, h * 0.58, h * 0.26);
}

