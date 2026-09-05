'use strict';

// Taikakynä (prototyyppi): pohjassa pitäminen kävelyttää prinsessaa sormea
// kohti kuten muissa kentissä; rotkon reunalle hän pysähtyy. Kynänappi ottaa
// kynän käteen (myös automaattisesti, kun reunaa vasten pusertaa), ja silloin
// sormella piirretään siltoja ja ramppeja, joita pitkin hän kulkee. Muste on
// rajallinen ja palautuu ajan kanssa; viivat haihtuvat. Ympyrä myrskypilven
// ympärille vangitsee sen kuplaan. Sydämet käytössä.

var PEN_DROPS = 8;
var penDrops = [];
var penStrokes = [];   // { pts: [{x, y}], age, len }
var penBubbles = [];   // { x, y, r, age }
var penClouds = [];
var penCur = null;     // parhaillaan piirrettävä viiva
var penInk = 0, penInkMax = 0;
var penWait = false, penWaitT = 0, penStun = 0, penDir = 1;
var penMode = false, penAutoT = 0;   // kynä kädessä / reunaa vasten pusertamisen aika
var penGround = [[0.0, 0.14], [0.19, 0.34], [0.40, 0.55], [0.60, 0.74], [0.80, 1.0]];
var penRaised = { 2: 0.22 };   // segmentti 2 on korkea tasanne (osuus viewH:sta)
var penFrame = { fx: 0.96, x: 0, open: false };
var penDropDefs = [
  { fx: 0.07, fy: 0.10 }, { fx: 0.165, fy: 0.40 }, { fx: 0.26, fy: 0.12 }, { fx: 0.37, fy: 0.30 },
  { fx: 0.47, fy: 0.36 }, { fx: 0.575, fy: 0.12 }, { fx: 0.67, fy: 0.44 }, { fx: 0.90, fy: 0.12 }
];
var penCloudDefs = [{ zA: 0.21, zB: 0.33, fx: 0.27 }, { zA: 0.61, zB: 0.73, fx: 0.67 }];
var PEN_LIFE = 8, PEN_BUBBLE = 6, PEN_STEP = 0.07, PEN_SLOPE = 1.4, PEN_DROP = 0.4;

function penSegY(i) {
  return groundTop - (penRaised[i] || 0) * viewH;
}

function layoutPen() {
  var i, seg;
  platforms = [];
  for (i = 0; i < penGround.length; i++) {
    seg = penGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: penSegY(i), w: (seg[1] - seg[0]) * worldW });
  }
  penFrame.x = penFrame.fx * worldW;
  for (i = 0; i < penDrops.length; i++) {
    penDrops[i].ax = penDropDefs[i].fx * worldW;
    penDrops[i].ay = groundTop - penDropDefs[i].fy * viewH;
  }
}

function initPen() {
  var i;
  setupRunLevel(17, '#fdf6e3');
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('penBtn').style.display = 'block';
  document.getElementById('penBtn').className = '';
  penMode = false;
  penAutoT = 0;
  penDrops = [];
  for (i = 0; i < PEN_DROPS; i++) penDrops.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  penClouds = [];
  for (i = 0; i < penCloudDefs.length; i++) {
    penClouds.push({ zA: penCloudDefs[i].zA, zB: penCloudDefs[i].zB, x: penCloudDefs[i].fx * worldW, y: groundTop - viewH * 0.13, dir: 1, bubbleT: 0, t: i });
  }
  layoutPen();
  tasks = [makeTask(0.30, 'shadow'), makeTask(0.66, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.37, 0.77]);
  penStrokes = [];
  penBubbles = [];
  penCur = null;
  penInkMax = viewW * 1.6;
  penInk = penInkMax;
  penWait = false;
  penWaitT = 0;
  penStun = 0;
  penDir = 1;
  penFrame.open = false;
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(784, 0.12, 0.3, 'triangle', 0.35);
}

function penGroundYAt(x) {
  var i, best = groundTop + viewH;
  for (i = 0; i < platforms.length; i++) {
    if (x >= platforms[i].x && x <= platforms[i].x + platforms[i].w && platforms[i].y < best) best = platforms[i].y;
  }
  return best > groundTop + viewH * 0.5 ? groundTop : best;
}

function respawnPen() {
  resetPrincess(checkpoint.x, penGroundYAt(checkpoint.x));
  princess.facing = penDir = 1;
  penStun = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function respawnPenPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < penGround.length; i++) {
    var end = penGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  var rx = best > 0 ? best - viewH * 0.09 : checkpoint.x;
  resetPrincess(rx, penGroundYAt(rx));
  penStun = 0;
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#c9a0ff');
}

function resizePen(ratio) {
  var i;
  princess.x *= ratio;
  layoutPen();
  for (i = 0; i < penClouds.length; i++) { penClouds[i].x *= ratio; penClouds[i].y = groundTop - viewH * 0.13; }
  for (i = 0; i < penStrokes.length; i++) {
    var k;
    for (k = 0; k < penStrokes[i].pts.length; k++) penStrokes[i].pts[k].x *= ratio;
  }
  penInkMax = viewW * 1.6;
  penInk = Math.min(penInk, penInkMax);
}

// ---------- Kynä ----------
function penSetMode(on) {
  penMode = !!on;
  penCur = null;
  document.getElementById('penBtn').className = penMode ? 'on' : '';
  if (penMode) {
    spawnSparkles(princess.x, princess.y - viewH * 0.25, 8, '#c9a0ff');
    playNote(880, 0, 0.08, 'sine', 0.25);
    playNote(1175, 0.06, 0.12, 'sine', 0.25);
  } else {
    playNote(660, 0, 0.08, 'triangle', 0.22);
  }
}

function penToggle() {
  if (!running || celebrating || puzzleBusy()) return;
  penSetMode(!penMode);
}

function penStart(px, py) {
  if (!running || celebrating || puzzleBusy() || !penMode) return;
  penCur = { pts: [{ x: px + camX, y: py }], age: 0, len: 0 };
}

function penMove(px, py) {
  if (!penCur) return;
  var last = penCur.pts[penCur.pts.length - 1];
  var wx = px + camX, dx = wx - last.x, dy = py - last.y, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 5) return;
  if (penInk <= 0) return;
  var use = Math.min(d, penInk);
  if (use < d) { wx = last.x + dx * use / d; py = last.y + dy * use / d; }
  penInk -= use;
  penCur.len += use;
  penCur.pts.push({ x: wx, y: py });
  if (penCur.pts.length % 4 === 0) spawnSparkles(wx, py, 1, '#c9a0ff');
  if (penCur.pts.length === 2) playNote(660, 0, 0.05, 'sine', 0.12);
}

function penEnd() {
  var s = penCur;
  penCur = null;
  if (!s) return;
  if (s.len < viewH * 0.02) {
    // Pelkkä napautus: ei viivaa, muste takaisin
    penInk = Math.min(penInkMax, penInk + s.len);
    return;
  }
  if (penIsLoop(s)) { penCastBubble(s); return; }
  penStrokes.push(s);
  playNote(880, 0, 0.12, 'sine', 0.2);
}

function penBox(s) {
  var i, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (i = 0; i < s.pts.length; i++) {
    minX = Math.min(minX, s.pts[i].x); maxX = Math.max(maxX, s.pts[i].x);
    minY = Math.min(minY, s.pts[i].y); maxY = Math.max(maxY, s.pts[i].y);
  }
  return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, w: maxX - minX, h: maxY - minY };
}

// Ympyrä: alku ja loppu lähellä toisiaan, laatikko riittävän iso molempiin suuntiin
function penIsLoop(s) {
  if (s.pts.length < 10) return false;
  var b = penBox(s);
  if (b.w < viewH * 0.07 || b.h < viewH * 0.07) return false;
  var a = s.pts[0], z = s.pts[s.pts.length - 1];
  var dx = a.x - z.x, dy = a.y - z.y;
  return Math.sqrt(dx * dx + dy * dy) < Math.max(b.w, b.h) * 0.3 && s.len > viewH * 0.2;
}

function penCastBubble(s) {
  var b = penBox(s), i, trapped = false;
  var cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, r = Math.max(b.w, b.h) / 2;
  for (i = 0; i < penClouds.length; i++) {
    var cl = penClouds[i];
    if (cl.x > b.minX - r * 0.2 && cl.x < b.maxX + r * 0.2 && cl.y > b.minY - r * 0.2 && cl.y < b.maxY + r * 0.2) {
      cl.bubbleT = PEN_BUBBLE;
      penBubbles.push({ x: cl.x, y: cl.y, r: Math.max(r, viewH * 0.09), age: 0 });
      trapped = true;
    }
  }
  if (trapped) {
    spawnSparkles(cx, cy, 16, '#c9f0ff');
    playNote(784, 0, 0.15, 'sine', 0.3);
    playNote(1175, 0.1, 0.25, 'sine', 0.3);
  } else {
    // Tyhjä kupla poksahtaa heti
    penBubbles.push({ x: cx, y: cy, r: r, age: PEN_BUBBLE - 0.6 });
    spawnSparkles(cx, cy, 8, '#c9f0ff');
    playNote(392, 0, 0.1, 'sine', 0.2);
  }
}

// Pinnat kohdassa x: maa ja piirretyt viivat (kupla-viivoja ei ole listassa)
function penSurfaces(x) {
  var res = [], i, k, pl, s, a, b2, y, slope;
  for (i = 0; i < platforms.length; i++) {
    pl = platforms[i];
    if (x >= pl.x && x <= pl.x + pl.w) res.push({ y: pl.y, slope: 0 });
  }
  for (i = 0; i < penStrokes.length; i++) {
    s = penStrokes[i];
    for (k = 0; k + 1 < s.pts.length; k++) {
      a = s.pts[k]; b2 = s.pts[k + 1];
      if (Math.abs(b2.x - a.x) < 0.5) continue;
      if (x < Math.min(a.x, b2.x) || x > Math.max(a.x, b2.x)) continue;
      y = a.y + (x - a.x) * (b2.y - a.y) / (b2.x - a.x);
      slope = Math.abs((b2.y - a.y) / (b2.x - a.x));
      res.push({ y: y, slope: slope });
    }
  }
  return res;
}

// Prinsessan askel: kävelee, seuraa pintaa, pysähtyy rotkon reunalle tai putoaa
function penStep(dt) {
  var pw = viewH * 0.045, i, c, best, oldY, newY, cands;
  if (penStun > 0) penStun -= dt;
  if (!princess.onGround) {
    princess.vy += viewH * 1.4 * dt;
    if (princess.vy > viewH * 1.05) princess.vy = viewH * 1.05;
    oldY = princess.y;
    newY = princess.y + princess.vy * dt;
    cands = penSurfaces(princess.x);
    best = null;
    for (i = 0; i < cands.length; i++) {
      c = cands[i];
      if (c.slope <= PEN_SLOPE && c.y >= oldY - 1 && c.y <= newY && (!best || c.y < best.y)) best = c;
    }
    if (best) {
      princess.y = best.y;
      princess.vy = 0;
      princess.onGround = true;
    } else {
      princess.y = newY;
      if (princess.y > groundTop + viewH * 0.12) penFell();
    }
    return;
  }
  // Onko jalkojen alla yhä pintaa? Haihtunut silta pudottaa, vaikka seisoisi paikallaan
  var here = penSurfaces(princess.x), supported = false;
  for (i = 0; i < here.length; i++) {
    if (here[i].slope <= PEN_SLOPE && Math.abs(here[i].y - princess.y) <= viewH * 0.02) { supported = true; break; }
  }
  if (!supported) {
    princess.onGround = false;
    princess.vy = 0;
    return;
  }
  if (penStun > 0) return;
  // Kävely: pidä pohjassa, prinsessa kulkee sormea kohti (kuten muissa kentissä)
  var dxh = holdWorldX - princess.x;
  var walking = holding && !penMode && Math.abs(dxh) > 10;
  if (!walking) {
    if (penWait) penWaitT += dt;
    penAutoT = 0;
    return;
  }
  penDir = dxh > 0 ? 1 : -1;
  princess.facing = penDir;
  var nx = princess.x + penDir * Math.min(viewW * 0.16 * dt, Math.abs(dxh));
  if (nx < pw) nx = pw;
  if (nx > worldW - pw) nx = worldW - pw;
  cands = penSurfaces(nx);
  best = null;
  for (i = 0; i < cands.length; i++) {
    c = cands[i];
    if (c.slope <= PEN_SLOPE && Math.abs(c.y - princess.y) <= viewH * PEN_STEP && (!best || c.y < best.y)) best = c;
  }
  if (best) {
    princess.x = nx;
    princess.y = best.y;
    princess.walkPhase += dt * 10;
    penWait = false;
    penWaitT = 0;
    return;
  }
  // Pudotus alemmalle pinnalle, jos sellainen on kohtuullisen lähellä
  var drop = null;
  for (i = 0; i < cands.length; i++) {
    c = cands[i];
    if (c.slope <= PEN_SLOPE && c.y > princess.y && c.y - princess.y <= viewH * PEN_DROP && (!drop || c.y < drop.y)) drop = c;
  }
  if (drop) {
    princess.x = nx;
    princess.onGround = false;
    princess.vy = 0;
    penWait = false;
    return;
  }
  // Rotko: pysähdy reunalle; reunaa vasten pusertaminen ottaa kynän esiin
  if (!penWait) { penWait = true; penWaitT = 0; }
  penWaitT += dt;
  penAutoT += dt;
  if (!penMode && penAutoT > 0.6) penSetMode(true);
}

function penFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) respawnPenPitEdge();
}

function collectPenDrop(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(700 + countCollected(penDrops) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(penDrops) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(penDrops) === PEN_DROPS && !penFrame.open) {
    penFrame.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function updatePen(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();
  penInk = Math.min(penInkMax, penInk + viewW * 0.22 * dt);

  for (i = penStrokes.length - 1; i >= 0; i--) {
    penStrokes[i].age += dt;
    if (penStrokes[i].age > PEN_LIFE) penStrokes.splice(i, 1);
  }
  for (i = penBubbles.length - 1; i >= 0; i--) {
    penBubbles[i].age += dt;
    if (penBubbles[i].age > PEN_BUBBLE) penBubbles.splice(i, 1);
  }

  // Myrskypilvet liikkuvat pään korkeudella; kuplassa oleva ei liiku eikä satuta
  for (i = 0; i < penClouds.length; i++) {
    var cl = penClouds[i];
    cl.t += dt;
    if (cl.bubbleT > 0) { cl.bubbleT -= dt; continue; }
    if (!busy && !celebrating) {
      cl.x += cl.dir * viewW * 0.05 * dt;
      if (cl.x < cl.zA * worldW) { cl.x = cl.zA * worldW; cl.dir = 1; }
      if (cl.x > cl.zB * worldW) { cl.x = cl.zB * worldW; cl.dir = -1; }
    }
    var cdx = cl.x - princess.x, cdy = cl.y - (princess.y - viewH * 0.1);
    if (!celebrating && cdx * cdx + cdy * cdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        penStun = 0.8;
        princess.x = Math.max(viewH * 0.05, princess.x - penDir * viewW * 0.04);
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#9aa0b8');
      }
    }
  }

  if (!busy && !celebrating) penStep(dt);
  blockPrincessAtTasks();

  for (i = 0; i < penDrops.length; i++) {
    var d = penDrops[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectPenDrop(d);
  }

  if (penFrame.open && !celebrating && Math.abs(princess.x - penFrame.x) < viewH * 0.07) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderPenBg(b, w, h) {
  var i, x, seg, y;
  b.fillStyle = '#fdf6e3';
  b.fillRect(0, 0, w, h);
  // Ruutupaperi
  b.strokeStyle = 'rgba(120,100,160,0.08)';
  b.lineWidth = 1;
  for (y = 0; y < h; y += h * 0.06) { b.beginPath(); b.moveTo(0, y); b.lineTo(w, y); b.stroke(); }
  for (x = 0; x < w; x += h * 0.06) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, h); b.stroke(); }
  // Lyijykynäaurinko ja -pilvet
  b.strokeStyle = '#7a6a8a';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.beginPath(); b.arc(w * 0.08, h * 0.16, h * 0.06, 0, Math.PI * 2); b.stroke();
  for (i = 0; i < 8; i++) {
    var a = i * Math.PI / 4;
    b.beginPath(); b.moveTo(w * 0.08 + Math.cos(a) * h * 0.075, h * 0.16 + Math.sin(a) * h * 0.075); b.lineTo(w * 0.08 + Math.cos(a) * h * 0.1, h * 0.16 + Math.sin(a) * h * 0.1); b.stroke();
  }
  b.fillStyle = 'rgba(255,255,255,0.6)';
  for (i = 0; i < 9; i++) {
    x = w * (0.1 + i * 0.105);
    y = h * (0.12 + (i % 3) * 0.08);
    cloudShape(b, x, y, h * 0.028);
    b.beginPath();
    b.arc(x, y, h * 0.034, 0, Math.PI * 2); b.arc(x + h * 0.04, y + h * 0.006, h * 0.025, 0, Math.PI * 2); b.arc(x - h * 0.04, y + h * 0.007, h * 0.024, 0, Math.PI * 2);
    b.stroke();
  }
  // Kukkulat viivoina
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.12 + (i % 3) * 0.04), Math.PI * 1.1, Math.PI * 1.9); b.stroke();
  }
  // Rotkot: revitty paperi
  b.fillStyle = '#e4d8bd';
  b.fillRect(0, groundTop + h * 0.02, w, h - groundTop);
  // Maa ja tasanne
  for (i = 0; i < penGround.length; i++) {
    seg = penGround[i];
    drawPaperGround(b, seg[0] * w, penSegY(i), (seg[1] - seg[0]) * w, h);
  }
  drawPenFrame(b, penFrame.x, groundTop, h);
}

function drawPaperGround(b, x, y, w, h) {
  var i;
  b.fillStyle = '#f6ead0';
  b.fillRect(x, y, w, h - y);
  b.strokeStyle = '#7a6a8a';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.beginPath(); b.moveTo(x, y); b.lineTo(x + w, y); b.stroke();
  b.beginPath(); b.moveTo(x, y); b.lineTo(x, h); b.moveTo(x + w, y); b.lineTo(x + w, h); b.stroke();
  b.strokeStyle = 'rgba(120,100,160,0.25)';
  for (i = 0; i < w / (h * 0.05); i++) {
    var hx = x + h * 0.02 + i * h * 0.05;
    b.beginPath(); b.moveTo(hx, y + h * 0.02); b.lineTo(hx + h * 0.025, y + h * 0.06); b.stroke();
  }
}

function drawPenFrame(b, x, baseY, h) {
  var fw = h * 0.16, fh = h * 0.22;
  b.fillStyle = '#a9743f';
  roundRect(b, x - fw / 2 - h * 0.015, baseY - fh - h * 0.05, fw + h * 0.03, fh + h * 0.03, h * 0.01);
  b.fill();
  b.fillStyle = '#fffaf0';
  b.fillRect(x - fw / 2, baseY - fh - h * 0.035, fw, fh);
  b.fillStyle = '#7a5a30';
  b.fillRect(x - h * 0.01, baseY - h * 0.05, h * 0.02, h * 0.05);
}

function drawPenGlyph(c, x, y, s, color) {
  c.save();
  c.translate(x, y);
  c.rotate(-Math.PI / 4);
  c.fillStyle = color || '#8a4dff';
  roundRect(c, -s * 0.16, -s * 0.6, s * 0.32, s * 0.9, s * 0.1);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-s * 0.16, -s * 0.15, s * 0.32, s * 0.12);
  c.fillStyle = '#4a2a7a';
  c.beginPath(); c.moveTo(-s * 0.16, s * 0.3); c.lineTo(s * 0.16, s * 0.3); c.lineTo(0, s * 0.62); c.closePath(); c.fill();
  c.restore();
}

function drawInkDrop(c, x, y, s) {
  c.fillStyle = '#8a4dff';
  c.beginPath();
  c.moveTo(x, y - s * 1.1);
  c.quadraticCurveTo(x + s * 0.9, y + s * 0.1, x + s * 0.55, y + s * 0.6);
  c.arc(x, y + s * 0.4, s * 0.62, Math.PI * 0.2, Math.PI * 0.8);
  c.quadraticCurveTo(x - s * 0.9, y + s * 0.1, x, y - s * 1.1);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.arc(x - s * 0.2, y + s * 0.25, s * 0.18, 0, Math.PI * 2); c.fill();
}

function drawPenStroke(c, s, alpha, live) {
  var i;
  if (s.pts.length < 2) return;
  c.globalAlpha = alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = live ? '#b07dff' : '#8a4dff';
  c.lineWidth = Math.max(4, viewH * 0.018);
  c.beginPath();
  c.moveTo(s.pts[0].x - camX, s.pts[0].y);
  for (i = 1; i < s.pts.length; i++) c.lineTo(s.pts[i].x - camX, s.pts[i].y);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = Math.max(1.5, viewH * 0.006);
  c.stroke();
  c.globalAlpha = 1;
  c.lineCap = 'butt';
  c.lineJoin = 'miter';
}

function drawPenCloud(c, cl) {
  var x = cl.x - camX, y = cl.y, r = viewH * 0.04;
  if (x < -r * 4 || x > viewW + r * 4) return;
  var bubbled = cl.bubbleT > 0;
  c.fillStyle = bubbled ? '#c9c4dc' : '#7d7a99';
  cloudShape(c, x, y, r * 0.55);
  c.strokeStyle = '#4a4560';
  c.lineWidth = Math.max(1.5, r * 0.08);
  c.beginPath(); c.arc(x, y, r * 0.66, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28, y - r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#222';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.1, r * 0.07, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28, y - r * 0.1, r * 0.07, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#222';
  c.lineWidth = Math.max(1.5, r * 0.07);
  c.beginPath();
  if (bubbled) c.arc(x, y + r * 0.15, r * 0.22, 0.2, Math.PI - 0.2);
  else c.arc(x, y + r * 0.45, r * 0.22, Math.PI + 0.3, Math.PI * 2 - 0.3);
  c.stroke();
  if (!bubbled) {
    c.fillStyle = '#ffe94f';
    c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.5); c.lineTo(x + r * 0.15, y + r * 0.5); c.lineTo(x, y + r * 1.0); c.closePath(); c.fill();
  }
}

function drawPenBubble(c, bb) {
  var x = bb.x - camX, a = bb.age > PEN_BUBBLE - 0.6 ? Math.max(0, (PEN_BUBBLE - bb.age) / 0.6) : 1;
  var r = bb.r * (1 + Math.sin(globalT * 3) * 0.03);
  c.globalAlpha = a;
  c.fillStyle = 'rgba(180,230,255,0.25)';
  c.beginPath(); c.arc(x, bb.y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.stroke();
  c.beginPath(); c.arc(x - r * 0.35, bb.y - r * 0.35, r * 0.18, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill();
  c.globalAlpha = 1;
}

function drawPenInk(c) {
  var w = viewH * 0.3, h = viewH * 0.026, x = viewW / 2 - w / 2, y = viewH * 0.115;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, x - h * 1.6, y - h * 0.5, w + h * 2.2, h * 2, h);
  c.fill();
  drawPenGlyph(c, x - h * 0.6, y + h * 0.5, h * 1.3);
  c.fillStyle = 'rgba(138,77,255,0.2)';
  roundRect(c, x + h * 0.4, y, w - h * 0.4, h, h * 0.5);
  c.fill();
  var f = Math.max(0, Math.min(1, penInk / penInkMax));
  if (f > 0.02) {
    c.fillStyle = f < 0.25 ? '#ff7bac' : '#8a4dff';
    roundRect(c, x + h * 0.4, y, (w - h * 0.4) * f, h, h * 0.5);
    c.fill();
  }
}

function drawPenFrameGlow(c) {
  var x = penFrame.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var fw = h * 0.16, fh = h * 0.22, top = groundTop - fh - h * 0.035;
  if (penFrame.open) {
    var cols = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'], i;
    c.lineWidth = fh * 0.06;
    for (i = 0; i < cols.length; i++) {
      c.strokeStyle = cols[i];
      c.beginPath(); c.arc(x, top + fh * 0.95, fw * (0.42 - i * 0.055), Math.PI, 0); c.stroke();
    }
    var g = c.createRadialGradient(x, top + fh / 2, fh * 0.2, x, top + fh / 2, fh * 1.4);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, top + fh / 2, fh * 1.4, 0, Math.PI * 2); c.fill();
    drawStar(c, x, top - h * 0.06, h * 0.035, globalT, 1);
  } else {
    c.strokeStyle = 'rgba(120,100,160,0.35)';
    c.lineWidth = Math.max(1.5, h * 0.004);
    c.beginPath(); c.arc(x, top + fh * 0.95, fw * 0.4, Math.PI, 0); c.stroke();
  }
}

function drawPenWaitHint(c) {
  if (!penWait || penMode || penWaitT < 1.2 || celebrating || puzzleBusy()) return;
  var x = princess.x - camX + viewH * 0.09, y = princess.y - viewH * 0.36 + Math.sin(globalT * 3) * viewH * 0.01, s = viewH * 0.045;
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.9, y + s * 0.9, s * 0.25, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 1.3, y + s * 1.4, s * 0.14, 0, Math.PI * 2); c.fill();
  drawPenGlyph(c, x, y, s * 0.9);
}

function drawPen() {
  var i, s, a;
  if (!drawWorldBg()) return;
  for (i = 0; i < penStrokes.length; i++) {
    s = penStrokes[i];
    a = s.age > PEN_LIFE - 1 ? Math.max(0, PEN_LIFE - s.age) : 1;
    drawPenStroke(ctx, s, a, false);
  }
  if (penCur) drawPenStroke(ctx, penCur, 1, true);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], penGroundYAt(checkpoints[i].x));
  drawPenFrameGlow(ctx);
  for (i = 0; i < penDrops.length; i++) {
    if (penDrops[i].collected) continue;
    drawInkDrop(ctx, penDrops[i].ax - camX, penDrops[i].ay + Math.sin(penDrops[i].phase) * viewH * 0.012, viewH * 0.022);
  }
  for (i = 0; i < penClouds.length; i++) drawPenCloud(ctx, penClouds[i]);
  for (i = 0; i < penBubbles.length; i++) drawPenBubble(ctx, penBubbles[i]);
  var moving = princess.onGround && holding && !penMode && !penWait && penStun <= 0 && !puzzleBusy() && !celebrating && Math.abs(holdWorldX - princess.x) > 10;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  // Kynä kädessä: kynä leijuu prinsessan vierellä
  if (penMode && !celebrating) drawPenGlyph(ctx, princess.x - camX + princess.facing * viewH * 0.07, princess.y - viewH * 0.24 + Math.sin(globalT * 3) * viewH * 0.008, viewH * 0.04);
  drawPenWaitHint(ctx);
  drawParticlesLayer(ctx);
  if (penFrame.open && !celebrating) drawEdgeArrow(ctx, penFrame.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, PEN_DROPS, function (i2) { return penDrops[i2] && penDrops[i2].collected; },
    function (c, x, y, s2) { drawInkDrop(c, x, y - s2 * 0.2, s2 * 0.8); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
