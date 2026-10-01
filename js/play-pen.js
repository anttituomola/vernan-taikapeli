'use strict';

// Taikakynä: saaren ensimmäinen kenttä, rauhallinen harjoituskenttä ilman
// vihollisia. Pohjassa pitäminen kävelyttää prinsessaa sormea kohti; rotkon
// reunalle hän pysähtyy. Kynänappi ottaa kynän käteen, ja silloin piirretään
// siltoja ja ramppeja. Mustepullot täyttävät musteen. Sydämet käytössä vain
// rotkoon putoamisessa. Ydin: pen-core.js.
//
// Tässä tiedostossa ovat myös Taikakynän saaren yhteiset tarrat ja tökkäyksen
// tunnistus (penTapPoll, penDrawBottle, penDrawCrayon, penFlowerDraw), joita
// play-rain, play-bunnybridge, play-orchard ja play-scribble käyttävät.

var PEN_BOTTLES = 8;
var penBottles = [];
var penGround = [[0.0, 0.14], [0.19, 0.34], [0.40, 0.55], [0.60, 0.74], [0.80, 1.0]];
var penRaised = { 2: 0.22 };   // segmentti 2 on korkea tasanne (osuus viewH:sta)
var penFrame = { fx: 0.96, x: 0, open: false };
var penBottleDefs = [
  { fx: 0.07, fy: 0.10 }, { fx: 0.165, fy: 0.40 }, { fx: 0.26, fy: 0.12 }, { fx: 0.37, fy: 0.30 },
  { fx: 0.47, fy: 0.36 }, { fx: 0.575, fy: 0.12 }, { fx: 0.67, fy: 0.44 }, { fx: 0.90, fy: 0.12 }
];
var penDoodle = null;   // yllätys: hymynaama piirtyy paperille (joka 5. tökkäys liituun)

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
  for (i = 0; i < penBottles.length; i++) {
    penBottles[i].ax = penBottleDefs[i].fx * worldW;
    penBottles[i].ay = groundTop - penBottleDefs[i].fy * viewH;
  }
}

function initPen() {
  var i;
  penCoreReset();
  penBottles = [];
  for (i = 0; i < PEN_BOTTLES; i++) penBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  layoutPen();
  tasks = [makeTask(0.30, 'shadow'), makeTask(0.66, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.37, 0.77]);
  penFrame.open = false;
  penDoodle = null;
  penProps();
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(784, 0.12, 0.3, 'triangle', 0.35);
}

function respawnPen() {
  resetPrincess(checkpoint.x, penGroundYAt(checkpoint.x));
  princess.facing = penDir = 1;
  penStun = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizePen(ratio) {
  var i;
  princess.x *= ratio;
  layoutPen();
  penProps();
  penCoreResize(ratio);
}

function penFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var rx = penPitEdgeX(penGround, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, penGroundYAt(rx));
    penStun = 0;
    spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#c9a0ff');
  }
}

function collectPenBottle(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(700 + countCollected(penBottles) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(penBottles) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(penBottles) === PEN_BOTTLES && !penFrame.open) {
    penFrame.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function updatePen(dt) {
  var i, tp;
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);
  if (!busy && !celebrating) penPrincessStep(dt, { onFall: penFell });
  blockPrincessAtTasks();

  for (i = 0; i < penBottles.length; i++) {
    var d = penBottles[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectPenBottle(d);
  }

  if (penFrame.open && !celebrating && Math.abs(princess.x - penFrame.x) < viewH * 0.07) {
    startCelebration();
  }

  tp = penTapPoll();
  if (tp) propsTap(tp.x, tp.y);
  propsUpdate(dt);
  if (penDoodle) {
    penDoodle.t += dt;
    if (penDoodle.t > 7) penDoodle = null;
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Saaren yhteiset: tökkäyksen tunnistus ----------
// worlds.js ohjaa kynäkenttien napautuksen suoraan penStartiin, joten koristeiden
// tökkäys luetaan pitotilasta ruutupäivityksessä. Palauttaa maailmakoordinaatit
// kerran per sormen laskeutuminen; ei koskaan kynätilassa (viivat), ei tehtävän
// tai juhlan aikana. Kävely jatkuu entiseen tapaan, tökkäys on vain koriste.
var penTapSeenG = -1;
function penTapPoll() {
  if (!holding) { penTapSeenG = -1; return null; }
  if (holdStartG === penTapSeenG) return null;
  penTapSeenG = holdStartG;
  if (penMode || !running || celebrating || puzzleBusy() || globalT - holdStartG > 0.5) return null;
  return { x: holdWorldX, y: holdSY };
}

// ---------- Saaren yhteiset tarrat ----------
// Mustepullo: hehku, lasipullo (valkoinen sävyttyy laventeliin), muste, kaula
// ja korkki. Sama kuva kerättävänä ja HUD-kuvakkeena. ink = musteen väri.
function penDrawBottle(c, x, y, s, ink) {
  var lw = Math.max(1.2, s * 0.09), glass = { lineColor: '#7a5aa8', line: lw, shadeTo: '#e3d8f5' };
  ink = ink || '#8a4dff';
  artGlow(c, x, y, s * 1.9, '#c9a0ff', 0.45);
  artRoundRect(c, x - s * 0.35, y - s * 1.0, s * 0.7, s * 0.6, s * 0.1, '#efe6ff', glass);
  artRoundRect(c, x - s * 0.8, y - s * 0.5, s * 1.6, s * 1.4, s * 0.35, '#efe6ff', glass);
  artRoundRect(c, x - s * 0.62, y - s * 0.02, s * 1.24, s * 0.76, s * 0.28, ink, { line: false });
  artRoundRect(c, x - s * 0.42, y - s * 1.25, s * 0.84, s * 0.4, s * 0.12, '#a9743f', { lineColor: '#6a4a28', line: lw });
  artHighlight(c, x - s * 0.45, y - s * 0.05, s * 0.12, s * 0.4, 0.6);
}

// Vahaliitu makaa paperilla (origo = paperin pinta). p.col väri, p.s pituus.
// Tökkäys pyöräyttää liidun vuorotellen eteen ja takaisin.
function penDrawCrayon(c, p) {
  var s = p.s, h = s * 0.28, lw = Math.max(1.2, s * 0.03), col = p.col, line = artShade(col, -0.45);
  artShadow(c, 0, 0, s * 0.55, s * 0.08, 0.14);
  c.save();
  c.translate(p.ox || 0, -h * 0.5);
  c.beginPath(); c.moveTo(s * 0.4, -h * 0.5); c.lineTo(s * 0.62, 0); c.lineTo(s * 0.4, h * 0.5); c.closePath();
  artFillPath(c, col, -h * 0.5, h * 0.5, h * 0.5, { lineColor: line, line: lw });
  artRoundRect(c, -s * 0.6, -h * 0.5, s * 1.0, h, h * 0.2, col, { lineColor: line, line: lw });
  artRoundRect(c, -s * 0.42, -h * 0.5, s * 0.5, h, h * 0.2, '#fff6e0', { lineColor: line, line: lw, shadeTo: '#e3d8f5' });
  artHighlight(c, -s * 0.3, -h * 0.25, s * 0.18, h * 0.12, 0.45);
  c.restore();
}
function penCrayonPoke(p) {
  p.vroll = (p.n % 2 ? 1 : -1) * p.s * 1.8;
  playNote(330, 0, 0.1, 'triangle', 0.15);
  if (p.doodle && p.n % 5 === 0) {
    // Yllätys: joka viides tökkäys piirtää hymynaaman paperille liidun väriin
    penDoodle = { x: p.x + p.s * 1.1, y: p.y - viewH * 0.09, s: viewH * 0.035, t: 0, col: p.col };
    playNote(784, 0.1, 0.12, 'sine', 0.25);
    playNote(988, 0.22, 0.12, 'sine', 0.25);
    playNote(1319, 0.34, 0.25, 'sine', 0.25);
  }
}
function penCrayonUpdate(p, dt) {
  if (!p.vroll) return;
  p.ox = (p.ox || 0) + p.vroll * dt;
  p.vroll *= Math.pow(0.03, dt);
  if (Math.abs(p.vroll) < p.s * 0.02) p.vroll = 0;
}

// Paperikukka varrella (origo = juuri). p.col terälehtien väri, p.s koko.
// Tökkäys pyöräyttää kukan ympäri; pyörintä hidastuu itsestään.
function penFlowerDraw(c, p) {
  var s = p.s, i, a;
  artShadow(c, 0, 0, s * 1.2, s * 0.3, 0.12);
  artLimb(c, 0, 0, 0, -s * 2.4, s * 0.3, '#6fb35a', '#3f7a35');
  artBlob(c, s * 0.5, -s * 1.2, s * 0.55, s * 0.28, '#6fb35a', { rot: -0.5, lineColor: '#3f7a35' });
  c.save();
  c.translate(0, -s * 2.6);
  c.rotate(p.ang || 0);
  c.beginPath();
  for (i = 0; i < 5; i++) {
    a = i / 5 * Math.PI * 2;
    c.moveTo(Math.cos(a) * s + s * 0.8, Math.sin(a) * s);
    c.arc(Math.cos(a) * s, Math.sin(a) * s, s * 0.8, 0, Math.PI * 2);
  }
  artFillPath(c, p.col, -s * 1.8, s * 1.8, s, { lineColor: artShade(p.col, -0.4), line: Math.max(1.2, s * 0.14) });
  artCircle(c, 0, 0, s * 0.65, '#fff3b0', { lineColor: '#d9a23a', line: Math.max(1, s * 0.1), hi: 0.4 });
  c.restore();
}
function penFlowerPoke(p) {
  p.spin = (p.spin || 0) + 10;
}
function penFlowerUpdate(p, dt) {
  if (!p.spin) return;
  p.ang = (p.ang || 0) + p.spin * dt;
  p.spin *= Math.pow(0.05, dt);
  if (p.spin < 0.05) p.spin = 0;
}

// ---------- Tämän kentän koristeet ----------
// Paperipilvi (origo = keskipiste): valkoinen, varjopuoli laventeliin.
function penCloudDraw(c, p) {
  var s = p.s;
  artUnion(c, cloudPath, 0, 0, s, -s * 1.4, s * 1.1, '#ffffff', { lineColor: '#b8a8d8', line: Math.max(1.2, s * 0.08), shadeTo: '#e3d8f5' });
  artHighlight(c, -s * 0.6, -s * 0.5, s * 0.5, s * 0.22, 0.6);
}
function penCloudPoke(p) {
  // Pilvi pöllähtää: valkoista pölyä ja pehmeä huokaus
  spawnSparkles(p.x, p.y, 10, '#ffffff');
  artPop(p.x, p.y, p.s * 2.2, '#e3d8f5', 'burst');
  playNote(520, 0, 0.18, 'sine', 0.12);
}

// Taulunkehys, kentän maali (origo = jalusta). Valkoinen taulu sävyttyy laventeliin.
function penDrawFrame(c) {
  var h = viewH, fw = h * 0.16, fh = h * 0.22, lw = Math.max(1.2, h * 0.004);
  artShadow(c, 0, 0, fw * 0.6, h * 0.015, 0.14);
  artRoundRect(c, -h * 0.01, -h * 0.05, h * 0.02, h * 0.05, h * 0.005, '#7a5a30', { lineColor: '#4a3418', line: lw });
  artRoundRect(c, -fw / 2 - h * 0.015, -fh - h * 0.05, fw + h * 0.03, fh + h * 0.03, h * 0.01, '#a9743f', { lineColor: '#6a4a28', line: lw });
  artRoundRect(c, -fw / 2, -fh - h * 0.035, fw, fh, h * 0.004, '#fffaf0', { lineColor: '#d8c8a0', line: lw, shadeTo: '#e3d8f5' });
}

// Tökättävät koristeet: kaksi liitua, paperikukka, paperipilvi ja taulunkehys.
// Kutsutaan myös resize-koukusta (paikat osuuksina).
function penProps() {
  var h = viewH;
  propsReset();
  propAdd({ x: worldW * 0.10, y: penSegY(0), s: h * 0.07, r: h * 0.05, hy: h * 0.012, amp: 0.1, col: '#ff5f5f', color: '#ff8a8a', note: 480, doodle: true,
    draw: penDrawCrayon, poke: penCrayonPoke, update: penCrayonUpdate });
  propAdd({ x: worldW * 0.235, y: penSegY(1), s: h * 0.02, r: h * 0.05, hy: h * 0.05, amp: 0.12, col: '#ff7bac', color: '#ff7bac', note: 620,
    draw: penFlowerDraw, poke: penFlowerPoke, update: penFlowerUpdate });
  propAdd({ x: worldW * 0.50, y: penSegY(2), s: h * 0.07, r: h * 0.05, hy: h * 0.012, amp: 0.1, col: '#5fa8ff', color: '#8ac4ff', note: 540, doodle: true,
    draw: penDrawCrayon, poke: penCrayonPoke, update: penCrayonUpdate });
  propAdd({ x: worldW * 0.44, y: h * 0.17, s: h * 0.03, r: h * 0.06, hy: 0, amp: 0.05, color: '#ffffff', note: 700,
    draw: penCloudDraw, poke: penCloudPoke });
  propAdd({ x: penFrame.x, y: groundTop, r: h * 0.1, hy: h * 0.16, amp: 0.04, color: '#ffe27a', note: 740, draw: penDrawFrame });
}

// Yllätyshymiö: piirtyy vaiheittain (ympyrä, silmät, suu) ja haalistuu pois
function penDrawDoodle(c) {
  var d = penDoodle;
  if (!d) return;
  var x = d.x - camX, y = d.y, s = d.s, k = Math.min(1, d.t / 1.2);
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.globalAlpha = d.t > 6 ? Math.max(0, 7 - d.t) : 1;
  c.strokeStyle = d.col;
  c.fillStyle = d.col;
  c.lineWidth = Math.max(2, s * 0.14);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k * 1.6)); c.stroke();
  if (k > 0.65) { c.beginPath(); c.arc(x - s * 0.35, y - s * 0.25, s * 0.1, 0, Math.PI * 2); c.fill(); }
  if (k > 0.75) { c.beginPath(); c.arc(x + s * 0.35, y - s * 0.25, s * 0.1, 0, Math.PI * 2); c.fill(); }
  if (k > 0.85) { c.beginPath(); c.arc(x, y + s * 0.1, s * 0.5, 0.3, Math.PI - 0.3); c.stroke(); }
  c.globalAlpha = 1;
  c.lineCap = 'butt';
}

// ---------- Piirto ----------
function penLayers() { return paperLayers({}, renderPenNear); }
function renderPenBg(b, w, h) {
  renderPaperFar(b, w, h, {});
  renderPaperMid(b, w, h, {});
  renderPenNear(b, w, h);
}
function renderPenNear(b, w, h) {
  // Taulunkehys on tökättävä koriste (penProps), joten sitä ei piirretä taustaan
  renderPaperNear(b, w, h, penGround, penSegY);
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

function drawPen() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  penDrawDoodle(ctx);
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], penGroundYAt(checkpoints[i].x));
  drawPenFrameGlow(ctx);
  for (i = 0; i < penBottles.length; i++) {
    if (penBottles[i].collected) continue;
    penDrawBottle(ctx, penBottles[i].ax - camX, penBottles[i].ay + Math.sin(penBottles[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  drawPenBubblesLayer(ctx);
  drawPenPrincess(ctx);
  drawParticlesLayer(ctx);
  if (penFrame.open && !celebrating) drawEdgeArrow(ctx, penFrame.x);
  endPlayWorld();
  drawPickupHud(ctx, PEN_BOTTLES, function (i2) { return penBottles[i2] && penBottles[i2].collected; },
    function (c, x, y, s2) { penDrawBottle(c, x, y, s2 * 0.75); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
