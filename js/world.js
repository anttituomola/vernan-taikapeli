'use strict';

// Koko, tausta ja maisemapiirto
// ---------- Koko ja tausta ----------
// Tausta esirenderöidään kerroksiksi (parallaksi): kerros, jonka speed < 1, on
// kapeampi ja liikkuu kameran mukana hitaammin -> syvyysvaikutelma. bgCanvas on
// aina pääkerros (speed 1) vanhojen kutsujen yhteensopivuuden vuoksi.
var bgCanvas = document.createElement('canvas');
var bgScale = 1;
var bgLayers = [];          // [{ canvas, scale, speed, w }] takimmaisesta etummaiseen
var bgExtraCanvases = [];
// Aurinko/kuu taustakerroksessa valosäteitä varten: { x (kerroksen koordinaatti), y, r, speed }
var bgSun = null;

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
  var p = phaseNow();
  var defs = p.renderBgLayers ? p.renderBgLayers() : null;
  if (!defs) defs = [{ speed: 1, render: function (b, w, h) { p.renderBg(b, w, h); } }];
  bgLayers = [];
  bgSun = null;
  var extra = 0, i, def, lw, cv, sc, b;
  for (i = 0; i < defs.length; i++) {
    def = defs[i];
    // Kerroksen leveys: ruutu + maailman ylimenevä osa kerroksen nopeudella
    lw = def.speed >= 1 ? worldW : viewW + (worldW - viewW) * def.speed;
    if (def.speed >= 1) {
      cv = bgCanvas;
    } else {
      if (!bgExtraCanvases[extra]) bgExtraCanvases[extra] = document.createElement('canvas');
      cv = bgExtraCanvases[extra];
      extra++;
    }
    sc = Math.min(1, 4000 / lw);
    cv.width = Math.round(lw * sc);
    cv.height = Math.round(viewH * sc);
    b = cv.getContext('2d');
    b.setTransform(sc, 0, 0, sc, 0, 0);
    def.render(b, lw, viewH);
    if (def.speed >= 1) bgScale = sc;
    bgLayers.push({ canvas: cv, scale: sc, speed: def.speed, w: lw });
  }
}

// Metsä kolmessa kerroksessa: kaukainen (taivas, aurinko, kukkulat), keski
// (utuinen puurivi) ja lähin (nurmi, polku, puut, kukat, pensaat, linna).
var FOREST_SKY_TOP = '#7cc9ff';
var FOREST_HAZE = '#dff0ff';
function forestLayers() {
  return [
    { speed: 0.22, render: renderForestFar },
    { speed: 0.55, render: renderForestMid },
    { speed: 1, render: renderForestNear }
  ];
}
function renderForestBg(b, w, h) {
  renderForestFar(b, w, h);
  renderForestMid(b, w, h);
  renderForestNear(b, w, h);
}
function renderForestFar(b, w, h) {
  var horizon = h * 0.68;
  var i, x;

  // Taivas
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, FOREST_SKY_TOP);
  sky.addColorStop(0.6, '#c9ecff');
  sky.addColorStop(1, '#fff0f6');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);

  // Aurinko
  var sunX = w * 0.18, sunY = h * 0.17, sunR = h * 0.075;
  bgSun = { x: sunX, y: sunY, r: sunR, speed: 0.22 };
  artGlow(b, sunX, sunY, sunR * 3.2, '#ffdc78', 0.55);
  var sg = b.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.3, sunR * 0.1, sunX, sunY, sunR);
  sg.addColorStop(0, '#fff8c8');
  sg.addColorStop(1, '#ffd45a');
  b.fillStyle = sg;
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();

  // Kaukaiset pilvet (haaleat)
  for (i = 0; i < 9; i++) {
    x = w * (0.04 + i * 0.115);
    var cy = h * (0.09 + (i % 3) * 0.075);
    var cs = h * 0.026 + (i % 2) * h * 0.012;
    drawCloud(b, x, cy, cs, 0.8);
  }

  // Kaukaiset kukkulat kahdessa rivissä, sävytetty kohti taivasta (ilmaperspektiivi)
  b.fillStyle = artMix('#9fd489', FOREST_HAZE, 0.55);
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) b.lineTo(x, horizon - h * 0.07 - Math.sin(x * 0.0022 + 1.2) * h * 0.06 - Math.sin(x * 0.0071) * h * 0.015);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = artMix('#8fcc7a', FOREST_HAZE, 0.32);
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) b.lineTo(x, horizon - h * 0.025 - Math.sin(x * 0.0035) * h * 0.045);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
}
function renderForestMid(b, w, h) {
  var horizon = h * 0.68;
  var i, x;
  // Utuinen puurivi horisontissa
  var haze = 0.28;
  for (i = 0; i < 26; i++) {
    x = w * (0.01 + i * 0.039) + (i % 3) * h * 0.02;
    var ts = h * (0.075 + (i % 4) * 0.012);
    drawTree(b, x, horizon + h * 0.012, ts, haze);
  }
  // Nurmen kaistale puiden juurelle, jotta rivi ei leiju
  b.fillStyle = artMix('#8fd479', FOREST_HAZE, 0.2);
  b.beginPath();
  b.moveTo(0, horizon + h * 0.012);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.012 - Math.sin(x * 0.004) * h * 0.012);
  b.lineTo(w, horizon + h * 0.03); b.lineTo(0, horizon + h * 0.03); b.closePath(); b.fill();
}
function renderForestNear(b, w, h) {
  var horizon = h * 0.68;
  var i, x;

  // Nurmi (läpinäkyvä horisontin yläpuolella -> kaukaiset kerrokset näkyvät)
  var grass = b.createLinearGradient(0, horizon, 0, h);
  grass.addColorStop(0, '#a4e084');
  grass.addColorStop(0.5, '#7fcc63');
  grass.addColorStop(1, '#4fae49');
  b.fillStyle = grass;
  b.beginPath();
  b.moveTo(0, horizon + h * 0.02);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.02 - Math.sin(x * 0.003 + 0.5) * h * 0.012);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();

  // Linna maailman lopussa
  drawCastle(b, w * 0.955, horizon + h * 0.02, h * 0.30);

  // Polku reunaviivalla
  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) b.lineTo(x, groundTop + Math.sin(x * 0.01) * 6);
  b.lineTo(w, groundBottom + 8);
  for (x = w; x >= 0; x -= 12) b.lineTo(x, groundBottom + 8 + Math.sin(x * 0.013) * 6);
  b.closePath();
  var pg = b.createLinearGradient(0, groundTop, 0, groundBottom);
  pg.addColorStop(0, '#f6e4b8');
  pg.addColorStop(1, '#e2c28c');
  b.fillStyle = pg;
  b.fill();
  b.strokeStyle = 'rgba(120,90,40,0.35)';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.stroke();
  // Polun kiviä
  b.fillStyle = 'rgba(160,130,80,0.25)';
  for (i = 0; i < 40; i++) {
    x = (i * 331.7) % w;
    var py = groundTop + 10 + ((i * 97) % Math.max(1, (groundBottom - groundTop - 16)));
    b.beginPath();
    if (b.ellipse) b.ellipse(x, py, h * 0.008 + (i % 3) * h * 0.003, h * 0.004 + (i % 2) * h * 0.002, 0, 0, Math.PI * 2);
    else b.arc(x, py, h * 0.006, 0, Math.PI * 2);
    b.fill();
  }

  // Puut polun taakse
  for (i = 0; i < 12; i++) {
    x = w * (0.04 + i * 0.085) + (i % 3) * 18;
    drawTree(b, x, horizon + h * 0.03, h * (0.11 + (i % 3) * 0.02), 0);
  }

  // Kukkia
  var flowerColors = ['#ff7bac', '#ffd24f', '#b78bff', '#ff9d5c', '#7fd4ff'];
  for (i = 0; i < 60; i++) {
    x = (i * 137.5) % w;
    var fy2 = horizon + h * 0.04 + ((i * 53) % Math.max(1, (groundTop - horizon - h * 0.06)));
    drawFlower(b, x, fy2, h * 0.009, flowerColors[i % flowerColors.length]);
  }
  // Ruohotupsuja
  b.strokeStyle = 'rgba(60,140,60,0.5)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.lineCap = 'round';
  for (i = 0; i < 90; i++) {
    x = (i * 211.3) % w;
    var gy = horizon + h * 0.03 + ((i * 71) % Math.max(1, (groundTop - horizon - h * 0.05)));
    b.beginPath();
    b.moveTo(x, gy); b.lineTo(x - h * 0.006, gy - h * 0.014);
    b.moveTo(x, gy); b.lineTo(x + h * 0.004, gy - h * 0.016);
    b.stroke();
  }

  // Pensaat (pupujen piilot)
  for (i = 0; i < bushDefs.length; i++) {
    drawBush(b, bushDefs[i].fx * w, groundTop + 12, h * 0.055);
  }
}

// Puutarha kolmessa kerroksessa: kaukainen yötaivas/kuu/kukkulat, keski
// (utuinen pensasaita) ja lähin (nurmi, polku, puut, sienitasot, linna).
var GARDEN_HAZE = '#5a4a98';
var GARDEN_TREE = { leaf: '#3d8a52', trunk: '#6a4a32', haze: GARDEN_HAZE };
function gardenLayers() {
  return [
    { speed: 0.22, render: renderGardenFar },
    { speed: 0.55, render: renderGardenMid },
    { speed: 1, render: renderGardenNear }
  ];
}
function renderGardenBg(b, w, h) {
  renderGardenFar(b, w, h);
  renderGardenMid(b, w, h);
  renderGardenNear(b, w, h);
}
function renderGardenFar(b, w, h) {
  var horizon = h * 0.70;
  var i, x;

  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#141038');
  sky.addColorStop(0.55, '#3a2478');
  sky.addColorStop(1, '#8a58b8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);

  var moonX = w * 0.20, moonY = h * 0.15, moonR = h * 0.075;
  bgSun = { x: moonX, y: moonY, r: moonR, speed: 0.22 };
  artGlow(b, moonX, moonY, moonR * 3.4, '#fff4c8', 0.55);
  var mg = b.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
  mg.addColorStop(0, '#ffffff');
  mg.addColorStop(1, '#ffe9a8');
  b.fillStyle = mg;
  b.beginPath(); b.arc(moonX, moonY, moonR, 0, Math.PI * 2); b.fill();

  b.fillStyle = 'rgba(255,255,230,0.9)';
  for (i = 0; i < 50; i++) {
    x = (i * 211.3) % w;
    b.beginPath();
    b.arc(x, h * (0.05 + (i % 8) * 0.065), 1.1 + (i % 3) * 0.7, 0, Math.PI * 2);
    b.fill();
  }

  for (i = 0; i < 7; i++) {
    x = w * (0.08 + i * 0.14);
    if (Math.abs(x - moonX) < moonR * 3.2) continue;
    drawCloud(b, x, h * (0.10 + (i % 3) * 0.06), h * 0.022 + (i % 2) * h * 0.01, 0.35);
  }

  b.fillStyle = artMix('#3a3a6e', GARDEN_HAZE, 0.5);
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) b.lineTo(x, horizon - h * 0.07 - Math.sin(x * 0.002 + 0.8) * h * 0.055 - Math.sin(x * 0.007) * h * 0.012);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = artMix('#2e4a5c', GARDEN_HAZE, 0.28);
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) b.lineTo(x, horizon - h * 0.02 - Math.sin(x * 0.0032 + 1.4) * h * 0.04);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
}
function renderGardenMid(b, w, h) {
  var horizon = h * 0.70;
  var i, x;
  for (i = 0; i < 22; i++) {
    x = w * (0.01 + i * 0.046) + (i % 3) * h * 0.018;
    drawTree(b, x, horizon + h * 0.01, h * (0.07 + (i % 4) * 0.012), 0.32, GARDEN_TREE);
  }
  b.fillStyle = artMix('#3d7a52', GARDEN_HAZE, 0.22);
  b.beginPath();
  b.moveTo(0, horizon + h * 0.01);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.01 - Math.sin(x * 0.004 + 0.6) * h * 0.01);
  b.lineTo(w, horizon + h * 0.03); b.lineTo(0, horizon + h * 0.03); b.closePath(); b.fill();
}
function renderGardenNear(b, w, h) {
  var horizon = h * 0.70;
  var i, x;

  var grass = b.createLinearGradient(0, horizon, 0, h);
  grass.addColorStop(0, '#4a9a62');
  grass.addColorStop(0.55, '#348250');
  grass.addColorStop(1, '#1e5a36');
  b.fillStyle = grass;
  b.beginPath();
  b.moveTo(0, horizon + h * 0.015);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.015 - Math.sin(x * 0.003 + 0.4) * h * 0.012);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();

  drawCastle(b, w * 0.06, horizon + h * 0.015, h * 0.26);

  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) b.lineTo(x, groundTop + Math.sin(x * 0.01 + 0.7) * 5);
  b.lineTo(w, groundBottom + 8);
  for (x = w; x >= 0; x -= 12) b.lineTo(x, groundBottom + 8 + Math.sin(x * 0.012) * 5);
  b.closePath();
  var pg = b.createLinearGradient(0, groundTop, 0, groundBottom);
  pg.addColorStop(0, '#e8d8f2');
  pg.addColorStop(1, '#c8b0d8');
  b.fillStyle = pg;
  b.fill();
  b.strokeStyle = 'rgba(90,50,120,0.35)';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.stroke();
  b.fillStyle = 'rgba(140,100,170,0.22)';
  for (i = 0; i < 36; i++) {
    x = (i * 331.7) % w;
    var py = groundTop + 10 + ((i * 97) % Math.max(1, (groundBottom - groundTop - 16)));
    b.beginPath();
    if (b.ellipse) b.ellipse(x, py, h * 0.007 + (i % 3) * h * 0.003, h * 0.004, 0, 0, Math.PI * 2);
    else b.arc(x, py, h * 0.005, 0, Math.PI * 2);
    b.fill();
  }

  for (i = 0; i < 10; i++) {
    x = w * (0.14 + i * 0.09) + (i % 2) * 16;
    drawTree(b, x, horizon + h * 0.025, h * (0.11 + (i % 3) * 0.018), 0, GARDEN_TREE);
    if (i % 3 === 1) drawGardenLantern(b, x + h * 0.028, horizon - h * 0.04, h * 0.028);
  }

  var nightFlowers = ['#ff7bac', '#c9a0ff', '#ffd24f', '#7fd4ff'];
  for (i = 0; i < 55; i++) {
    x = (i * 167.7) % w;
    var fy2 = horizon + h * 0.035 + ((i * 53) % Math.max(1, (groundTop - horizon - h * 0.05)));
    drawFlower(b, x, fy2, h * 0.009, nightFlowers[i % nightFlowers.length]);
  }
  b.strokeStyle = 'rgba(40,100,55,0.5)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.lineCap = 'round';
  for (i = 0; i < 70; i++) {
    x = (i * 211.3) % w;
    var gy = horizon + h * 0.03 + ((i * 71) % Math.max(1, (groundTop - horizon - h * 0.05)));
    b.beginPath();
    b.moveTo(x, gy); b.lineTo(x - h * 0.006, gy - h * 0.014);
    b.moveTo(x, gy); b.lineTo(x + h * 0.004, gy - h * 0.016);
    b.stroke();
  }

  for (i = 0; i < 6; i++) {
    drawBush(b, w * (0.18 + i * 0.15), groundTop + 10, h * 0.048);
  }

  for (i = 1; i < platforms.length; i++) {
    drawLedge(b, platforms[i].x, platforms[i].y, platforms[i].w, h);
  }
}

function drawLedge(b, x, y, w, h) {
  var cap = h * 0.042;
  var stem = h * 0.09;
  var lw = Math.max(1.2, h * 0.004);
  var sw = Math.max(w * 0.16, h * 0.04);
  var sx = x + w / 2 - sw / 2;
  b.beginPath();
  b.rect(sx, y, sw, stem);
  artFillPath(b, '#8a4e28', y, y + stem, sw / 2, { lineColor: '#5a3018', line: lw });
  b.beginPath();
  if (b.ellipse) b.ellipse(x + w / 2, y, w / 2, cap, 0, 0, Math.PI * 2);
  else b.arc(x + w / 2, y, w / 2, 0, Math.PI * 2);
  artFillPath(b, '#e878b8', y - cap, y + cap * 0.35, cap, { lineColor: '#a04878', line: lw });
  artCircle(b, x + w * 0.28, y - cap * 0.2, cap * 0.28, '#ffe27a', { line: false, hi: 0.4 });
  artCircle(b, x + w * 0.62, y - cap * 0.08, cap * 0.22, '#ffe27a', { line: false });
  artCircle(b, x + w * 0.78, y - cap * 0.18, cap * 0.16, '#ffe27a', { line: false });
}
function drawGardenLantern(b, x, y, s) {
  artGlow(b, x, y + s * 0.2, s * 2.4, '#ffd45a', 0.5);
  b.strokeStyle = '#6a4a28';
  b.lineWidth = Math.max(1.2, s * 0.1);
  b.lineCap = 'round';
  b.beginPath();
  b.moveTo(x, y - s * 0.55);
  b.lineTo(x, y - s * 0.12);
  b.stroke();
  artRoundRect(b, x - s * 0.28, y - s * 0.12, s * 0.56, s * 0.7, s * 0.1, '#ffd45a', { lineColor: '#c48620' });
  artHighlight(b, x - s * 0.08, y + s * 0.05, s * 0.12, s * 0.16, 0.4);
}

function cloudShape(b, x, y, s) {
  b.beginPath();
  b.arc(x, y, s * 1.2, 0, Math.PI * 2);
  b.arc(x + s * 1.4, y + s * 0.2, s * 0.9, 0, Math.PI * 2);
  b.arc(x - s * 1.4, y + s * 0.25, s * 0.85, 0, Math.PI * 2);
  b.arc(x + s * 0.5, y - s * 0.6, s * 0.8, 0, Math.PI * 2);
  b.fill();
}
// Pilvi kevyellä reunaviivalla
function drawCloud(b, x, y, s, alpha) {
  b.globalAlpha = alpha === undefined ? 1 : alpha;
  b.fillStyle = '#b9dcf5';
  cloudShape(b, x, y + s * 0.12, s * 1.06);
  var g = b.createLinearGradient(0, y - s * 1.4, 0, y + s * 1.1);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e6f2fc');
  b.fillStyle = g;
  cloudShape(b, x, y, s);
  b.globalAlpha = 1;
}
function drawCastle(b, x, baseY, size) {
  var tw = size * 0.22;
  var wall = '#e8d5f2', tower = '#dcc3ee', roof = '#c286e0', lineC = '#9a6fc4';
  var lw = Math.max(1.2, size * 0.012);
  var i;
  // Muuri
  b.beginPath(); b.rect(x - size * 0.4, baseY - size * 0.55, size * 0.8, size * 0.55);
  artFillPath(b, wall, baseY - size * 0.55, baseY, size * 0.2, { lineColor: lineC, line: lw });
  // Muurin sakarat
  b.fillStyle = wall;
  for (i = -3; i <= 3; i++) b.fillRect(x + i * size * 0.115 - size * 0.035, baseY - size * 0.62, size * 0.07, size * 0.08);
  var towers = [-0.4, 0, 0.4];
  for (i = 0; i < towers.length; i++) {
    var tx = x + towers[i] * size;
    var th = size * (i === 1 ? 0.95 : 0.7);
    b.beginPath(); b.rect(tx - tw / 2, baseY - th, tw, th);
    artFillPath(b, tower, baseY - th, baseY, tw / 2, { lineColor: lineC, line: lw });
    // Katto
    b.beginPath();
    b.moveTo(tx - tw * 0.78, baseY - th);
    b.lineTo(tx + tw * 0.78, baseY - th);
    b.lineTo(tx, baseY - th - size * 0.3);
    b.closePath();
    artFillPath(b, roof, baseY - th - size * 0.3, baseY - th, tw, { lineColor: lineC, line: lw });
    // Ikkuna
    b.fillStyle = '#7a4fb0';
    roundRect(b, tx - tw * 0.13, baseY - th + size * 0.12, tw * 0.26, size * 0.15, tw * 0.13);
    b.fill();
    b.fillStyle = '#ffe9a8';
    roundRect(b, tx - tw * 0.08, baseY - th + size * 0.14, tw * 0.16, size * 0.09, tw * 0.08);
    b.fill();
  }
  // Portti
  b.beginPath();
  b.moveTo(x - size * 0.1, baseY);
  b.lineTo(x - size * 0.1, baseY - size * 0.3);
  b.arc(x, baseY - size * 0.3, size * 0.1, Math.PI, 0);
  b.lineTo(x + size * 0.1, baseY);
  b.closePath();
  artFillPath(b, '#a76fd0', baseY - size * 0.4, baseY, size * 0.1, { lineColor: lineC, line: lw });
  // Lippu
  b.strokeStyle = lineC; b.lineWidth = Math.max(1.5, size * 0.015);
  b.beginPath();
  b.moveTo(x, baseY - size * 0.95 - size * 0.30);
  b.lineTo(x, baseY - size * 1.17 - size * 0.30);
  b.stroke();
  b.beginPath();
  b.moveTo(x, baseY - size * 1.17 - size * 0.30);
  b.lineTo(x + size * 0.19, baseY - size * 1.1 - size * 0.30);
  b.lineTo(x, baseY - size * 1.03 - size * 0.30);
  b.closePath();
  artFillPath(b, '#ff7bac', baseY - size * 1.47, baseY - size * 1.33, size * 0.08, { line: Math.max(1, size * 0.01) });
}
// Puu: runko ja kolme lehvästöpalloa. haze 0..1 sävyttää kohti taivasta (kaukainen puu).
// pal: { leaf, trunk, haze } vaihtaa paletin (yöpuutarha, suo…).
function drawTree(b, x, baseY, s, haze, pal) {
  haze = haze || 0;
  pal = pal || {};
  var hazeCol = pal.haze || FOREST_HAZE;
  var trunk = artMix(pal.trunk || '#9c6b3f', hazeCol, haze);
  var leaf = artMix(pal.leaf || '#6cc45c', hazeCol, haze);
  var lineOpts = haze > 0 ? { line: false } : {};
  b.beginPath(); b.rect(x - s * 0.08, baseY - s * 0.55, s * 0.16, s * 0.58);
  artFillPath(b, trunk, baseY - s * 0.55, baseY, s * 0.08, lineOpts);
  artCircle(b, x - s * 0.36, baseY - s * 0.66, s * 0.4, leaf, lineOpts);
  artCircle(b, x + s * 0.36, baseY - s * 0.66, s * 0.4, leaf, lineOpts);
  artCircle(b, x, baseY - s * 0.92, s * 0.56, leaf, haze > 0 ? { line: false } : { hi: 0.3 });
}
function drawFlower(b, x, y, s, color) {
  var i;
  b.beginPath();
  for (i = 0; i < 5; i++) {
    var a = (i / 5) * Math.PI * 2;
    b.moveTo(x + Math.cos(a) * s + s * 0.8, y + Math.sin(a) * s);
    b.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, 0, Math.PI * 2);
  }
  b.fillStyle = color;
  b.fill();
  b.strokeStyle = artShade(color, -0.3);
  b.lineWidth = Math.max(0.8, s * 0.15);
  b.stroke();
  b.fillStyle = '#fff3b0';
  b.beginPath(); b.arc(x, y, s * 0.7, 0, Math.PI * 2); b.fill();
}
function drawBush(b, x, baseY, s) {
  var leaf = '#5fbf55';
  artShadow(b, x, baseY + s * 0.1, s * 1.7, s * 0.35, 0.14);
  artCircle(b, x - s * 0.9, baseY - s * 0.3, s * 0.7, leaf, {});
  artCircle(b, x + s * 0.9, baseY - s * 0.3, s * 0.7, leaf, {});
  artCircle(b, x, baseY - s * 0.5, s, leaf, { hi: 0.3 });
  artCircle(b, x - s * 0.5, baseY - s * 0.9, s * 0.13, '#ff7bac', {});
  artCircle(b, x + s * 0.6, baseY - s * 0.6, s * 0.13, '#ff7bac', {});
}

function drawBgSun(b, x, y, r, speed, glow, inner, outer) {
  bgSun = { x: x, y: y, r: r, speed: speed || 0.22 };
  artGlow(b, x, y, r * 3.2, glow || '#fff4c8', 0.5);
  var sg = b.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  sg.addColorStop(0, inner || '#fffdf0');
  sg.addColorStop(1, outer || '#ffd45a');
  b.fillStyle = sg;
  b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
}

function fillHillBand(b, w, h, horizon, color, waveFn) {
  var x;
  b.fillStyle = color;
  b.beginPath();
  b.moveTo(0, horizon);
  for (x = 0; x <= w; x += 8) b.lineTo(x, waveFn(x));
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
}

function meadowFar(b, w, h, c0, c1, haze) {
  var horizon = h * 0.68, i, x, sunX = w * 0.78;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, c0);
  sky.addColorStop(0.55, c1);
  sky.addColorStop(1, '#f4fff8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, sunX, h * 0.16, h * 0.07, 0.22);
  for (i = 0; i < 8; i++) {
    x = w * (0.04 + i * 0.12);
    if (Math.abs(x - sunX) < h * 0.2) continue;
    drawCloud(b, x, h * (0.10 + (i % 3) * 0.06), h * 0.024 + (i % 2) * h * 0.01, 0.8);
  }
  haze = haze || '#c8e8b8';
  fillHillBand(b, w, h, horizon, artMix(haze, '#ffffff', 0.35), function (px) {
    return horizon - h * 0.09 - Math.sin(px * 0.002 + 0.4) * h * 0.06 - Math.sin(px * 0.007) * h * 0.02;
  });
  fillHillBand(b, w, h, horizon, artMix(haze, '#ffffff', 0.12), function (px) {
    return horizon - h * 0.03 - Math.sin(px * 0.0034 + 1.1) * h * 0.04;
  });
}
function meadowMid(b, w, h, hill) {
  var i, x;
  hill = hill || '#a7dd8f';
  fillHillBand(b, w, h, groundTop + h * 0.05, hill, function (px) {
    return groundTop + h * 0.01 - Math.sin(px * 0.004) * h * 0.03;
  });
  b.fillStyle = hill;
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.10 + (i % 3) * 0.035), Math.PI, 0); b.fill();
  }
}
function meadowNearGrass(b, w, h) {
  var grass = b.createLinearGradient(0, groundTop, 0, h);
  grass.addColorStop(0, '#8fd97a');
  grass.addColorStop(1, '#5fb356');
  b.fillStyle = grass;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,180,0.45)';
  if (typeof groundBottom === 'number') {
    b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  }
}

var ICE_HAZE = '#d4eaf8';
var ICE_TREE = { leaf: '#e4f4f2', trunk: '#8a6848', haze: ICE_HAZE };
function iceLayers() {
  return [
    { speed: 0.22, render: renderIceFar },
    { speed: 0.55, render: renderIceMid },
    { speed: 1, render: renderIceNear }
  ];
}
function renderIceBg(b, w, h) {
  renderIceFar(b, w, h);
  renderIceMid(b, w, h);
  renderIceNear(b, w, h);
}
function renderIceFar(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#4a88c8');
  sky.addColorStop(0.55, '#b4dcff');
  sky.addColorStop(1, '#f4fbff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);

  var sunX = w * 0.78, sunY = h * 0.16, sunR = h * 0.07;
  bgSun = { x: sunX, y: sunY, r: sunR, speed: 0.22 };
  artGlow(b, sunX, sunY, sunR * 3.2, '#fff4c8', 0.5);
  var sg = b.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.3, sunR * 0.1, sunX, sunY, sunR);
  sg.addColorStop(0, '#fffdf0');
  sg.addColorStop(1, '#ffe08a');
  b.fillStyle = sg;
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();

  for (i = 0; i < 8; i++) {
    x = w * (0.04 + i * 0.12);
    if (Math.abs(x - sunX) < sunR * 3) continue;
    drawCloud(b, x, h * (0.10 + (i % 3) * 0.06), h * 0.024 + (i % 2) * h * 0.01, 0.75);
  }

  fillHillBand(b, w, h, horizon, artMix('#c8dcec', ICE_HAZE, 0.45), function (x) {
    return horizon - h * 0.10 - Math.sin(x * 0.002 + 0.4) * h * 0.07 - Math.sin(x * 0.007) * h * 0.02;
  });
  fillHillBand(b, w, h, horizon, artMix('#dceaf4', ICE_HAZE, 0.22), function (x) {
    return horizon - h * 0.03 - Math.sin(x * 0.0034 + 1.1) * h * 0.045;
  });
}
function renderIceMid(b, w, h) {
  var horizon = h * 0.68, i, x;
  for (i = 0; i < 22; i++) {
    x = w * (0.01 + i * 0.046) + (i % 3) * h * 0.016;
    drawTree(b, x, horizon + h * 0.01, h * (0.07 + (i % 4) * 0.012), 0.3, ICE_TREE);
  }
  b.fillStyle = artMix('#e8f4fa', ICE_HAZE, 0.18);
  b.beginPath();
  b.moveTo(0, horizon + h * 0.01);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.01 - Math.sin(x * 0.004) * h * 0.01);
  b.lineTo(w, horizon + h * 0.03); b.lineTo(0, horizon + h * 0.03); b.closePath(); b.fill();
}
function renderIceNear(b, w, h) {
  var horizon = h * 0.68, i, x;
  var snow = b.createLinearGradient(0, horizon, 0, h);
  snow.addColorStop(0, '#f4fbff');
  snow.addColorStop(0.55, '#d4e8f4');
  snow.addColorStop(1, '#a8c8dc');
  b.fillStyle = snow;
  b.beginPath();
  b.moveTo(0, horizon + h * 0.02);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.02 - Math.sin(x * 0.003 + 0.4) * h * 0.012);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();

  drawCastle(b, w * 0.955, horizon + h * 0.02, h * 0.28);

  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) b.lineTo(x, groundTop + Math.sin(x * 0.012) * 5);
  b.lineTo(w, groundBottom + 8);
  for (x = w; x >= 0; x -= 12) b.lineTo(x, groundBottom + 8 + Math.sin(x * 0.014) * 5);
  b.closePath();
  var pg = b.createLinearGradient(0, groundTop, 0, groundBottom);
  pg.addColorStop(0, '#eef8ff');
  pg.addColorStop(1, '#b8d4e8');
  b.fillStyle = pg;
  b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.7)';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.stroke();
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 36; i++) {
    x = (i * 331.7) % w;
    var py = groundTop + 10 + ((i * 97) % Math.max(1, (groundBottom - groundTop - 16)));
    b.beginPath();
    if (b.ellipse) b.ellipse(x, py, h * 0.008 + (i % 3) * h * 0.003, h * 0.004, 0, 0, Math.PI * 2);
    else b.arc(x, py, h * 0.005, 0, Math.PI * 2);
    b.fill();
  }

  for (i = 0; i < 10; i++) {
    x = w * (0.05 + i * 0.09) + (i % 2) * 14;
    drawTree(b, x, horizon + h * 0.025, h * (0.10 + (i % 3) * 0.018), 0, ICE_TREE);
  }
  b.strokeStyle = 'rgba(255,255,255,0.7)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.lineCap = 'round';
  for (i = 0; i < 70; i++) {
    x = (i * 211.3) % w;
    var gy = horizon + h * 0.03 + ((i * 71) % Math.max(1, (groundTop - horizon - h * 0.05)));
    b.beginPath();
    b.moveTo(x, gy); b.lineTo(x - h * 0.005, gy - h * 0.012);
    b.moveTo(x, gy); b.lineTo(x + h * 0.004, gy - h * 0.014);
    b.stroke();
  }
}

var POND_HAZE = '#9ed4d0';
var POND_TREE = { leaf: '#3d9a58', trunk: '#6a4830', haze: POND_HAZE };
function pondLayers() {
  return [
    { speed: 0.22, render: renderPondFar },
    { speed: 0.55, render: renderPondMid },
    { speed: 1, render: renderPondNear }
  ];
}
function renderPondBg(b, w, h) {
  renderPondFar(b, w, h);
  renderPondMid(b, w, h);
  renderPondNear(b, w, h);
}
function renderPondFar(b, w, h) {
  var horizon = h * 0.62, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#4ec4f0');
  sky.addColorStop(0.55, '#a8ecf0');
  sky.addColorStop(1, '#e4fff4');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);

  var sunX = w * 0.18, sunY = h * 0.16, sunR = h * 0.07;
  bgSun = { x: sunX, y: sunY, r: sunR, speed: 0.22 };
  artGlow(b, sunX, sunY, sunR * 3.2, '#fff4c0', 0.5);
  var sg = b.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.3, sunR * 0.1, sunX, sunY, sunR);
  sg.addColorStop(0, '#fff8d0');
  sg.addColorStop(1, '#ffd45a');
  b.fillStyle = sg;
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();

  for (i = 0; i < 7; i++) {
    x = w * (0.08 + i * 0.14);
    if (Math.abs(x - sunX) < sunR * 3) continue;
    drawCloud(b, x, h * (0.10 + (i % 3) * 0.055), h * 0.022 + (i % 2) * h * 0.01, 0.7);
  }

  fillHillBand(b, w, h, horizon, artMix('#6cb89a', POND_HAZE, 0.5), function (x) {
    return horizon - h * 0.06 - Math.sin(x * 0.0022 + 0.6) * h * 0.05 - Math.sin(x * 0.007) * h * 0.012;
  });
  fillHillBand(b, w, h, horizon, artMix('#4a9a78', POND_HAZE, 0.28), function (x) {
    return horizon - h * 0.018 - Math.sin(x * 0.0034 + 1.3) * h * 0.035;
  });
}
function renderPondMid(b, w, h) {
  var horizon = h * 0.62, i, x;
  for (i = 0; i < 20; i++) {
    x = w * (0.01 + i * 0.05) + (i % 3) * h * 0.016;
    drawTree(b, x, horizon + h * 0.012, h * (0.07 + (i % 4) * 0.012), 0.3, POND_TREE);
  }
  b.fillStyle = artMix('#4aaa72', POND_HAZE, 0.2);
  b.beginPath();
  b.moveTo(0, horizon + h * 0.01);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.01 - Math.sin(x * 0.004 + 0.5) * h * 0.01);
  b.lineTo(w, horizon + h * 0.03); b.lineTo(0, horizon + h * 0.03); b.closePath(); b.fill();
}
function renderPondNear(b, w, h) {
  var horizon = h * 0.62, i, x;
  var water = b.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, '#5ed4c8');
  water.addColorStop(0.5, '#2aa8a8');
  water.addColorStop(1, '#0a5a68');
  b.fillStyle = water;
  b.beginPath();
  b.moveTo(0, horizon + h * 0.01);
  for (x = 0; x <= w; x += 10) b.lineTo(x, horizon + h * 0.01 - Math.sin(x * 0.003) * h * 0.01);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();

  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 18; i++) {
    x = (i * 211) % w;
    b.fillRect(x, horizon + ((i * 37) % (h - horizon - 20)), w * 0.035, 3);
  }

  drawCastle(b, w * 0.95, horizon + h * 0.01, h * 0.24);

  b.strokeStyle = 'rgba(20,80,50,0.55)';
  b.lineWidth = Math.max(1.2, h * 0.004);
  b.lineCap = 'round';
  for (i = 0; i < 80; i++) {
    x = (i * 137.5) % w;
    var ry = horizon + h * 0.03 + ((i * 53) % Math.max(1, (groundTop - horizon - h * 0.04)));
    b.beginPath();
    b.moveTo(x, ry);
    b.lineTo(x + (i % 2 ? 5 : -4), ry - h * 0.05);
    b.stroke();
  }

  for (i = 1; i < platforms.length; i++) {
    drawLilyPad(b, platforms[i].x, platforms[i].y, platforms[i].w, h);
  }
}

function drawLilyPad(b, x, y, w, h) {
  var cx = x + w / 2, rw = w / 2, rh = h * 0.032;
  var lw = Math.max(1.2, h * 0.004);
  b.beginPath();
  if (b.ellipse) b.ellipse(cx, y, rw, rh, 0, 0, Math.PI * 2);
  else b.arc(cx, y, rw * 0.7, 0, Math.PI * 2);
  artFillPath(b, '#3aaa4a', y - rh, y + rh, rh, { lineColor: '#226830', line: lw });
  artCircle(b, cx - rw * 0.18, y - rh * 0.2, rw * 0.28, '#6ed46a', { line: false, hi: 0.35 });
  artCircle(b, cx, y, h * 0.012, '#ff7bac', {});
}

var SKY_HAZE = '#4a3088';
function skyLayers() {
  return [
    { speed: 0.22, render: renderSkyFar },
    { speed: 0.55, render: renderSkyMid },
    { speed: 1, render: renderSkyNear }
  ];
}
function renderSkyBg(b, w, h) {
  renderSkyFar(b, w, h);
  renderSkyMid(b, w, h);
  renderSkyNear(b, w, h);
}
function renderSkyFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b0630');
  sky.addColorStop(0.55, '#2a1860');
  sky.addColorStop(1, '#6a3a98');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);

  var moonX = w * 0.22, moonY = h * 0.16, moonR = h * 0.075;
  bgSun = { x: moonX, y: moonY, r: moonR, speed: 0.22 };
  artGlow(b, moonX, moonY, moonR * 3.4, '#fff4c8', 0.55);
  var mg = b.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
  mg.addColorStop(0, '#ffffff');
  mg.addColorStop(1, '#ffe9a8');
  b.fillStyle = mg;
  b.beginPath(); b.arc(moonX, moonY, moonR, 0, Math.PI * 2); b.fill();

  b.fillStyle = 'rgba(255,246,200,0.9)';
  for (i = 0; i < 70; i++) {
    x = (i * 173.3) % w;
    if (Math.abs(x - moonX) < moonR * 2) continue;
    b.globalAlpha = 0.35 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, (i * 97.1) % (h * 0.55), 1.2 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;

  fillHillBand(b, w, h, h * 0.72, artMix('#3a2470', SKY_HAZE, 0.45), function (x) {
    return h * 0.72 - h * 0.08 - Math.sin(x * 0.002 + 0.5) * h * 0.06;
  });
}
function renderSkyMid(b, w, h) {
  var i, x;
  for (i = 0; i < 10; i++) {
    x = w * (0.04 + i * 0.1);
    drawCloud(b, x, h * (0.48 + (i % 3) * 0.06), h * 0.03 + (i % 2) * h * 0.012, 0.28);
  }
  fillHillBand(b, w, h, h * 0.78, artMix('#5a3488', SKY_HAZE, 0.22), function (x) {
    return h * 0.78 - h * 0.03 - Math.sin(x * 0.0032 + 1.2) * h * 0.04;
  });
}
function renderSkyNear(b, w, h) {
  var i, x;
  for (i = 0; i < 11; i++) {
    x = w * (0.03 + i * 0.09);
    drawCloud(b, x, h * (0.64 + (i % 2) * 0.07), h * 0.038 + (i % 3) * h * 0.008, 0.92);
  }
  drawCastle(b, w * 0.94, h * 0.62, h * 0.26);
}

// Revontulimaan jaettu taivas, hohtokaari ja lumeen piirretyt tunturit
function renderNorthSky(b, w, h) {
  var i, x, sky = b.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, '#081428');
  sky.addColorStop(0.45, '#123048');
  sky.addColorStop(1, '#1a3a50');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff8d0';
  for (i = 0; i < 28; i++) {
    x = w * ((i * 0.11 + 0.03) % 1);
    b.globalAlpha = 0.35 + (i % 4) * 0.15;
    b.beginPath(); b.arc(x, h * (0.05 + (i % 7) * 0.06), 1.1 + (i % 3) * 0.5, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.82, h * 0.12, h * 0.045, 0.22, '#c8f0ff', '#f4fbff', '#d0e8ff');
}
function renderNorthHills(b, w, h) {
  fillHillBand(b, w, h, h * 0.62, '#1a3850', function (px) {
    return h * 0.62 - h * 0.08 - Math.sin(px * 0.0018 + 0.4) * h * 0.05;
  });
  fillHillBand(b, w, h, h * 0.70, '#245068', function (px) {
    return h * 0.70 - h * 0.04 - Math.sin(px * 0.0026 + 1.1) * h * 0.035;
  });
}
function renderNorthGround(b, w, h) {
  var g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#d8eef8');
  g.addColorStop(1, '#b0d0e0');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,255,255,0.55)';
  b.fillRect(0, groundTop + h * 0.015, w, Math.max(0, groundBottom - groundTop - h * 0.02));
}
function drawAuroraCurtain(c, w, h, t, cam) {
  var i, x0, cols = ['rgba(80,255,170,0.22)', 'rgba(120,200,255,0.18)', 'rgba(180,120,255,0.16)'];
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (i = 0; i < 3; i++) {
    x0 = ((Math.sin(t * (0.22 + i * 0.07) + i) * 0.5 + 0.5) * 0.7 + 0.1) * w - (cam || 0) * 0.22;
    c.strokeStyle = cols[i];
    c.lineWidth = h * (0.09 - i * 0.018);
    c.beginPath();
    c.moveTo(x0 - h * 0.4, h * 0.04);
    c.quadraticCurveTo(x0 + Math.sin(t * 0.8 + i) * h * 0.2, h * 0.22, x0 + h * 0.15, h * 0.42);
    c.stroke();
  }
  c.restore();
}
function northRideUnicorn(dt, busy) {
  var dx = unicorn.tx - unicorn.x, dy = unicorn.ty - unicorn.y;
  var dist = Math.sqrt(dx * dx + dy * dy), step;
  if (dist > 6 && !celebrating && !busy) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 10;
  } else unicorn.moving = false;
  followCam(unicorn.x, dt);
}
function northGateAt(fx) {
  return { fx: fx, x: fx * worldW, open: false };
}

