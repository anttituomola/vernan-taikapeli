'use strict';

// Majakka: Vuorisaaren kolmas kenttä. Uusi pelimalli: palikkatorni.
// Nosturi heiluu palikkaa ruudun poikki; napautus pudottaa sen. Palikka pysyy,
// jos se osuu riittävästi edellisen päälle, muuten se keikahtaa mereen (ei
// rangaistusta, uusi palikka tulee). Kahdeksan palikkaa ja lopuksi lamppu.
// Kolmen ja kuuden palikan jälkeen avautuu tehtävä. Ei sydämiä.

var LH_BLOCKS = 8;
var lh = {
  stack: [], falling: null, tumbling: [], swing: 0, phase: 'swing',
  bw: 0, bh: 0, baseY: 0, base: { x: 0, w: 0 }, taskAt: {}, lit: false, finishT: 0, beamA: 0,
  bunnies: [{ fx: 0.16, hop: 0 }, { fx: 0.84, hop: 0 }], misses: 0
};

function lhLayout() {
  var i, sc;
  lh.bw = Math.min(viewW * 0.17, viewH * 0.26);
  lh.bh = viewH * 0.068;
  lh.baseY = viewH * 0.86;
  lh.base.w = lh.bw * 1.3;
  lh.base.x = viewW / 2 - lh.base.w / 2;
  for (i = 0; i < lh.stack.length; i++) {
    sc = lh.stack[i];
    sc.x = viewW / 2 + sc.rel * lh.bw;
    sc.w = lh.bw;
    sc.y = lh.baseY - (i + 1) * lh.bh;
  }
}

function lhHook() {
  return { x: viewW / 2 + Math.sin(lh.swing) * viewW * 0.3, y: viewH * 0.19 };
}

function initLighthouse() {
  var i;
  tasks = [makeTask(-5, 'mirror'), makeTask(-5, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  lh.stack = [];
  lh.falling = null;
  lh.tumbling = [];
  lh.swing = 0;
  lh.phase = 'swing';
  lh.taskAt = {};
  lh.lit = false;
  lh.finishT = 0;
  lh.beamA = 0;
  lh.misses = 0;
  for (i = 0; i < lh.bunnies.length; i++) lh.bunnies[i].hop = 0;
  lhLayout();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(784, 0.14, 0.3, 'triangle', 0.35);
}

function respawnLighthouse() {}
function resizeLighthouse() {
  lhLayout();
  if (lh.falling) { lh.falling.x = Math.min(Math.max(lh.falling.x, 0), viewW - lh.bw); lh.falling.w = lh.bw; }
}

function lhTopY() {
  return lh.baseY - lh.stack.length * lh.bh;
}

function handleLighthouseTap(px, py) {
  if (!running || celebrating || puzzleBusy() || lh.phase !== 'swing') return;
  var h = lhHook();
  lh.falling = { x: h.x - lh.bw / 2, y: h.y, vy: 0, w: lh.bw, lamp: lh.stack.length >= LH_BLOCKS };
  lh.phase = 'drop';
  playNote(440, 0, 0.1, 'triangle', 0.3);
}

function lhCheer() {
  var i;
  for (i = 0; i < lh.bunnies.length; i++) lh.bunnies[i].hop = 1;
}

function lhLandBlock(f) {
  var top = lh.stack.length ? lh.stack[lh.stack.length - 1] : lh.base;
  var ov = Math.min(f.x + f.w, top.x + top.w) - Math.max(f.x, top.x);
  var need = f.lamp ? lh.bw * 0.3 : lh.bw * 0.45;
  var cx = f.x + f.w / 2;
  if (ov < need) {
    // Keikahtaa mereen
    lh.tumbling.push({ x: f.x, y: f.y, w: f.w, vx: (cx > top.x + top.w / 2 ? 1 : -1) * viewW * 0.25, vy: -viewH * 0.15, rot: 0, vr: (cx > top.x + top.w / 2 ? 1 : -1) * 4, lamp: f.lamp });
    lh.misses++;
    playNote(260, 0, 0.2, 'sawtooth', 0.15);
    playNote(180, 0.15, 0.3, 'sawtooth', 0.15);
    lh.phase = 'swing';
    return;
  }
  if (f.lamp) {
    lh.lit = true;
    lh.phase = 'done';
    lh.finishT = 2.2;
    spawnSparkles(viewW / 2, lhTopY() - lh.bh, 30, '#ffe27a');
    playNote(523, 0, 0.3, 'triangle', 0.4);
    playNote(659, 0.15, 0.3, 'triangle', 0.4);
    playNote(784, 0.3, 0.3, 'triangle', 0.4);
    playNote(1047, 0.45, 0.6, 'triangle', 0.45);
    lhCheer();
    return;
  }
  lh.stack.push({ x: f.x, y: lhTopY() - lh.bh, w: f.w, rel: (f.x - viewW / 2) / lh.bw, squish: 0.3 });
  spawnSparkles(cx, lhTopY(), 10, '#ffffff');
  playNote(523 + lh.stack.length * 45, 0, 0.2, 'sine', 0.4);
  playNote(784 + lh.stack.length * 45, 0.08, 0.25, 'sine', 0.3);
  lhCheer();
  lh.phase = 'swing';
  if (lh.stack.length === 3 && !lh.taskAt[3]) { lh.taskAt[3] = true; taskStart(tasks[0]); }
  if (lh.stack.length === 6 && !lh.taskAt[6]) { lh.taskAt[6] = true; taskStart(tasks[1]); }
}

function updateLighthouse(dt) {
  var i, f, tb;
  updateTasks(dt);
  var busy = puzzleBusy();
  if (lh.phase === 'swing' && !busy && !celebrating) lh.swing += dt * (1.3 + lh.stack.length * 0.1);
  if (lh.falling && !busy) {
    f = lh.falling;
    f.vy += viewH * 1.7 * dt;
    f.y += f.vy * dt;
    if (f.y + lh.bh >= lhTopY()) {
      lh.falling = null;
      lhLandBlock(f);
    }
  }
  for (i = lh.tumbling.length - 1; i >= 0; i--) {
    tb = lh.tumbling[i];
    tb.vy += viewH * 1.4 * dt;
    tb.x += tb.vx * dt;
    tb.y += tb.vy * dt;
    tb.rot += tb.vr * dt;
    if (tb.y > viewH + lh.bh * 2) {
      spawnSparkles(tb.x + tb.w / 2, viewH * 0.97, 10, '#9fdcff');
      lh.tumbling.splice(i, 1);
    }
  }
  for (i = 0; i < lh.stack.length; i++) if (lh.stack[i].squish > 0) lh.stack[i].squish -= dt;
  for (i = 0; i < lh.bunnies.length; i++) if (lh.bunnies[i].hop > 0) lh.bunnies[i].hop = Math.max(0, lh.bunnies[i].hop - dt * 2.5);
  if (lh.lit) lh.beamA += dt * 1.2;
  if (lh.finishT > 0 && !celebrating) {
    lh.finishT -= dt;
    if (lh.finishT <= 0) startCelebration();
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderLighthouseBg(b, w, h) {
  var i, x, vw = viewW, seaY = h * 0.78;
  var sky = b.createLinearGradient(0, 0, 0, seaY);
  sky.addColorStop(0, '#7fb8ff');
  sky.addColorStop(0.55, '#ffd9a8');
  sky.addColorStop(1, '#ffb27a');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, seaY + 2);
  // Aurinko horisontissa
  var sg = b.createRadialGradient(vw * 0.78, seaY - h * 0.02, h * 0.02, vw * 0.78, seaY - h * 0.02, h * 0.2);
  sg.addColorStop(0, 'rgba(255,240,180,0.95)');
  sg.addColorStop(0.4, 'rgba(255,200,120,0.5)');
  sg.addColorStop(1, 'rgba(255,200,120,0)');
  b.fillStyle = sg;
  b.beginPath(); b.arc(vw * 0.78, seaY - h * 0.02, h * 0.2, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff1c8';
  b.beginPath(); b.arc(vw * 0.78, seaY - h * 0.02, h * 0.06, Math.PI, 0); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 5; i++) cloudShape(b, vw * (0.08 + i * 0.2), h * (0.12 + (i % 2) * 0.08), h * 0.024);
  // Lokit
  b.strokeStyle = '#fff';
  b.lineWidth = Math.max(1.5, h * 0.004);
  for (i = 0; i < 4; i++) {
    x = vw * (0.15 + i * 0.22);
    b.beginPath(); b.moveTo(x - h * 0.02, h * 0.3 + i * h * 0.03); b.quadraticCurveTo(x, h * 0.29 + i * h * 0.03, x + h * 0.02, h * 0.3 + i * h * 0.03); b.stroke();
  }
  // Meri
  var sea = b.createLinearGradient(0, seaY, 0, h);
  sea.addColorStop(0, '#5fb0e8');
  sea.addColorStop(1, '#2a70b8');
  b.fillStyle = sea;
  b.fillRect(0, seaY, w, h - seaY);
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 24; i++) b.fillRect((i * 173.3) % vw, seaY + h * 0.02 + ((i * 41) % Math.round(h * 0.18)), vw * 0.03, Math.max(1, h * 0.003));
  // Kallioluoto tornin alla
  b.fillStyle = '#6b6478';
  b.beginPath();
  b.moveTo(vw * 0.5 - lh.base.w * 1.6, h);
  b.quadraticCurveTo(vw * 0.5 - lh.base.w * 1.2, lh.baseY - h * 0.01, vw * 0.5, lh.baseY - h * 0.02);
  b.quadraticCurveTo(vw * 0.5 + lh.base.w * 1.2, lh.baseY - h * 0.01, vw * 0.5 + lh.base.w * 1.6, h);
  b.closePath(); b.fill();
  b.fillStyle = '#8a8298';
  roundRect(b, lh.base.x, lh.baseY - h * 0.005, lh.base.w, h * 0.05, h * 0.012);
  b.fill();
  // Nosturin palkki
  b.fillStyle = '#5a4a3a';
  b.fillRect(0, h * 0.05, vw, h * 0.022);
  b.fillStyle = '#7a6a5a';
  for (i = 0; i < 12; i++) b.fillRect(vw * (i / 12) + h * 0.01, h * 0.072, h * 0.012, h * 0.02);
  // Laiturit pupuille
  b.fillStyle = '#a9743f';
  b.fillRect(vw * 0.08, lh.baseY + h * 0.02, vw * 0.16, h * 0.02);
  b.fillRect(vw * 0.76, lh.baseY + h * 0.02, vw * 0.16, h * 0.02);
}

function drawLhBlock(c, x, y, w, hh, idx, squish) {
  var red = idx % 2 === 0, sq = Math.max(0, squish || 0);
  var yy = y + sq * hh * 0.15, hh2 = hh - sq * hh * 0.15;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.fillRect(x + 3, yy + 4, w, hh2);
  c.fillStyle = red ? '#ff5f5f' : '#ffffff';
  roundRect(c, x, yy, w, hh2, hh * 0.15);
  c.fill();
  c.fillStyle = red ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)';
  c.fillRect(x + w * 0.06, yy + hh2 * 0.12, w * 0.88, hh2 * 0.18);
  if (!red) {
    c.fillStyle = '#7fd4ff';
    roundRect(c, x + w / 2 - w * 0.09, yy + hh2 * 0.3, w * 0.18, hh2 * 0.5, w * 0.05);
    c.fill();
    c.strokeStyle = '#3a3346';
    c.lineWidth = Math.max(1, hh * 0.03);
    c.stroke();
  }
}

function drawLhLamp(c, x, y, w, hh, lit) {
  // Lasikupu, lamppu ja katto
  c.fillStyle = lit ? 'rgba(255,240,170,0.9)' : 'rgba(210,230,255,0.8)';
  roundRect(c, x + w * 0.15, y, w * 0.7, hh, hh * 0.2);
  c.fill();
  c.fillStyle = '#3a3346';
  c.fillRect(x + w * 0.1, y - hh * 0.05, w * 0.8, hh * 0.12);
  c.beginPath(); c.moveTo(x + w * 0.1, y - hh * 0.05); c.lineTo(x + w * 0.9, y - hh * 0.05); c.lineTo(x + w * 0.5, y - hh * 0.55); c.closePath(); c.fill();
  c.fillStyle = lit ? '#fff6c8' : '#8a8298';
  c.beginPath(); c.arc(x + w / 2, y + hh * 0.55, hh * 0.28, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3a3346';
  c.fillRect(x + w * 0.25, y + hh * 0.35, w * 0.04, hh * 0.65);
  c.fillRect(x + w * 0.71, y + hh * 0.35, w * 0.04, hh * 0.65);
}

function drawLighthouse() {
  var i, sc, h = lhHook(), f, tb;
  if (!drawWorldBg()) return;
  // Valokeila
  if (lh.lit) {
    var lx = viewW / 2, ly = lhTopY() - lh.bh * 0.45, a = lh.beamA;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.sin(a) * 1.1 - Math.PI / 2);
    var bg = ctx.createLinearGradient(0, 0, viewH * 0.9, 0);
    bg.addColorStop(0, 'rgba(255,240,170,0.65)');
    bg.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(viewH * 0.9, -viewH * 0.22); ctx.lineTo(viewH * 0.9, viewH * 0.22); ctx.closePath(); ctx.fill();
    ctx.restore();
    var gl = ctx.createRadialGradient(lx, ly, lh.bh * 0.2, lx, ly, lh.bh * 2.5);
    gl.addColorStop(0, 'rgba(255,245,200,0.7)');
    gl.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(lx, ly, lh.bh * 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // Nosturin köysi ja koukku
  if (lh.phase !== 'done') {
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = Math.max(2, viewH * 0.005);
    ctx.beginPath(); ctx.moveTo(h.x, viewH * 0.072); ctx.lineTo(h.x, h.y - lh.bh * 0.1); ctx.stroke();
    ctx.fillStyle = '#8a8298';
    ctx.beginPath(); ctx.arc(h.x, viewH * 0.06, viewH * 0.012, 0, Math.PI * 2); ctx.fill();
    if (lh.phase === 'swing') {
      ctx.strokeStyle = '#8a8298';
      ctx.lineWidth = Math.max(2, viewH * 0.006);
      ctx.beginPath(); ctx.arc(h.x, h.y - lh.bh * 0.02, lh.bh * 0.12, Math.PI * 1.1, Math.PI * 2.4); ctx.stroke();
      if (lh.stack.length >= LH_BLOCKS) drawLhLamp(ctx, h.x - lh.bw / 2, h.y, lh.bw, lh.bh, false);
      else drawLhBlock(ctx, h.x - lh.bw / 2, h.y, lh.bw, lh.bh, lh.stack.length, 0);
    }
  }
  // Torni
  for (i = 0; i < lh.stack.length; i++) {
    sc = lh.stack[i];
    drawLhBlock(ctx, sc.x, sc.y, sc.w, lh.bh, i, sc.squish);
  }
  if (lh.lit) {
    var top = lh.stack[lh.stack.length - 1];
    drawLhLamp(ctx, top.x, lhTopY() - lh.bh, top.w, lh.bh, true);
  }
  if (lh.falling) {
    f = lh.falling;
    if (f.lamp) drawLhLamp(ctx, f.x, f.y, f.w, lh.bh, false);
    else drawLhBlock(ctx, f.x, f.y, f.w, lh.bh, lh.stack.length, 0);
  }
  for (i = 0; i < lh.tumbling.length; i++) {
    tb = lh.tumbling[i];
    ctx.save();
    ctx.translate(tb.x + tb.w / 2, tb.y + lh.bh / 2);
    ctx.rotate(tb.rot);
    if (tb.lamp) drawLhLamp(ctx, -tb.w / 2, -lh.bh / 2, tb.w, lh.bh, false);
    else drawLhBlock(ctx, -tb.w / 2, -lh.bh / 2, tb.w, lh.bh, lh.stack.length, 0);
    ctx.restore();
  }
  // Prinsessa katsoo laiturilta, puput hurraavat
  drawPrincessFree(ctx, viewW * 0.3, lh.baseY + viewH * 0.02, viewH / 620, 1, 0, false, globalT);
  for (i = 0; i < lh.bunnies.length; i++) {
    var bn = lh.bunnies[i];
    drawBunny(ctx, viewW * bn.fx, lh.baseY + viewH * 0.02, viewH * 0.038, Math.sin(bn.hop * Math.PI) * viewH * 0.03, globalT * 3 + i, false);
  }
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, LH_BLOCKS, function (i2) { return i2 < lh.stack.length; },
    function (c, x, y, s2) { c.fillStyle = '#ff5f5f'; roundRect(c, x - s2 * 0.6, y - s2 * 0.45, s2 * 1.2, s2 * 0.4, s2 * 0.1); c.fill(); c.fillStyle = '#fff'; roundRect(c, x - s2 * 0.6, y, s2 * 1.2, s2 * 0.4, s2 * 0.1); c.fill(); });
  drawTaskOverlay(ctx);
}
