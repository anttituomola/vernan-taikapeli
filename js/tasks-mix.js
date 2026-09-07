'use strict';

// Värien sekoitus: punainen, keltainen ja sininen sekoittuvat oranssiksi,
// vihreäksi ja violetiksi. Käytössä pikkutehtävänä ('mix') ja Taikakeittiössä.

var MIX_PRIMARY = ['R', 'Y', 'B'];
var MIX_COLORS = { R: '#ff4f5e', Y: '#ffe14d', B: '#4aa8ff', RY: '#ff9f3a', YB: '#5fd36b', RB: '#a05ce6', X: '#8a7a6a' };

// Kaadettujen värien avain järjestyksessä R, Y, B (esim. ['B','R'] -> 'RB')
function mixKey(pours) {
  var has = {}, i, k = '';
  for (i = 0; i < pours.length; i++) has[pours[i]] = true;
  for (i = 0; i < MIX_PRIMARY.length; i++) if (has[MIX_PRIMARY[i]]) k += MIX_PRIMARY[i];
  return k;
}

function mixColorOf(key) {
  return MIX_COLORS[key] || MIX_COLORS.X;
}

// Sekoitustila: { target, pour, drops, failT, doneT, splash }
function mixStateNew(target) {
  return { target: target, pour: [], drops: [], failT: 0, doneT: 0, splash: 0 };
}

// Kaato: palauttaa 'same' | 'pour' | 'done' | 'fail'
function mixPour(m, key, fromX, fromY) {
  if (m.failT > 0 || m.doneT > 0) return 'busy';
  if (m.pour.indexOf(key) >= 0) {
    playNote(300, 0, 0.1, 'triangle', 0.2);
    return 'same';
  }
  m.pour.push(key);
  m.drops.push({ x: fromX, y: fromY, t: 0, color: MIX_COLORS[key] });
  m.splash = 0.5;
  playNote(560 + MIX_PRIMARY.indexOf(key) * 130, 0, 0.12, 'sine', 0.3);
  var cur = mixKey(m.pour);
  if (cur === m.target) {
    m.doneT = 0.8;
    playNote(784, 0.3, 0.15, 'triangle', 0.35);
    playNote(1047, 0.45, 0.3, 'triangle', 0.35);
    return 'done';
  }
  if (m.pour.length >= 2 || m.target.length === 1) {
    m.failT = 1.1;
    playNote(170, 0.25, 0.3, 'sawtooth', 0.2);
    return 'fail';
  }
  return 'pour';
}

// Päivitys: tipat lentävät pataan, epäonnistunut sekoitus tyhjenee. Palauttaa true, kun valmis ratkaistu.
function mixUpdate(m, dt) {
  var i;
  for (i = m.drops.length - 1; i >= 0; i--) {
    m.drops[i].t += dt * 2.4;
    if (m.drops[i].t >= 1) m.drops.splice(i, 1);
  }
  if (m.splash > 0) m.splash -= dt;
  if (m.failT > 0) {
    m.failT -= dt;
    if (m.failT <= 0) { m.failT = 0; m.pour = []; }
  }
  if (m.doneT > 0) {
    m.doneT -= dt;
    if (m.doneT <= 0) { m.doneT = 0; return true; }
  }
  return false;
}

// ---------- Tehtävätyyppi 'mix' ----------
function makeMixProblem(t) {
  var pool = t.mixLevel === 2 ? ['RY', 'YB', 'RB'] : ['R', 'Y', 'B', 'RY', 'YB', 'RB'];
  t.orbs = 3;
  return { mix: mixStateNew(pool[randInt(pool.length)]) };
}

function mixCauldronPos() {
  return { x: viewW / 2, y: viewH * 0.74 };
}

function mixTaskTap(t, i) {
  var op = orbPositions(3);
  var r = mixPour(t.data.mix, MIX_PRIMARY[i], op.xs[i], op.y + op.r * 0.6);
  if (r === 'fail') t.shakeT = 0.5;
}

function updateMixTask(t, dt) {
  if (!t.data.mix) return;
  if (mixUpdate(t.data.mix, dt)) taskSolved();
}

// Kohdepullo kuplassa ylhäällä, pata alhaalla ja lentävät tipat
function drawMixOverlay(c, t, shake) {
  var m = t.data.mix;
  if (!m) return;
  var cx = viewW / 2 + shake, cy = viewH * 0.2;
  drawPromptBubble(c, cx, cy, viewH * 0.26, viewH * 0.16);
  drawPotionBottle(c, cx - viewH * 0.045, cy + viewH * 0.01, viewH * 0.042, mixColorOf(m.target));
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(viewH * 0.07) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.fillText('?', cx + viewH * 0.06, cy + viewH * 0.025);
  var p = mixCauldronPos(), key = mixKey(m.pour);
  drawCauldron(c, p.x + shake, p.y, viewH * 0.085, m.failT > 0 ? MIX_COLORS.X : (key ? mixColorOf(key) : null), m.failT > 0, m.splash, m.doneT > 0);
  drawMixDrops(c, m, p.x + shake, p.y - viewH * 0.07);
}

function drawMixDrops(c, m, tx, ty) {
  var i, d, x, y;
  for (i = 0; i < m.drops.length; i++) {
    d = m.drops[i];
    x = d.x + (tx - d.x) * d.t;
    y = d.y + (ty - d.y) * d.t - Math.sin(d.t * Math.PI) * viewH * 0.12;
    c.fillStyle = d.color;
    c.beginPath(); c.arc(x, y, viewH * 0.014, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x - viewH * 0.006, y - viewH * 0.018, viewH * 0.008, 0, Math.PI * 2); c.fill();
  }
}

function drawPotionBottle(c, x, y, s, color) {
  c.fillStyle = 'rgba(230,240,255,0.9)';
  roundRect(c, x - s * 0.8, y - s * 0.5, s * 1.6, s * 1.5, s * 0.4);
  c.fill();
  c.fillStyle = color;
  roundRect(c, x - s * 0.66, y - s * 0.1, s * 1.32, s * 0.95, s * 0.32);
  c.fill();
  c.fillStyle = 'rgba(230,240,255,0.9)';
  c.fillRect(x - s * 0.32, y - s * 1.0, s * 0.64, s * 0.55);
  c.fillStyle = '#a9743f';
  roundRect(c, x - s * 0.4, y - s * 1.3, s * 0.8, s * 0.4, s * 0.12);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  roundRect(c, x - s * 0.6, y - s * 0.3, s * 0.2, s * 0.9, s * 0.1);
  c.fill();
}

// Pata: liquid = neste tai null, failed = pöh-savu, splash = roiske, glow = valmis
function drawCauldron(c, x, y, s, liquid, failed, splash, glow) {
  var i;
  if (glow) {
    var g = c.createRadialGradient(x, y - s * 0.5, s * 0.3, x, y - s * 0.5, s * 2.2);
    g.addColorStop(0, 'rgba(255,240,180,0.55)');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y - s * 0.5, s * 2.2, 0, Math.PI * 2); c.fill();
  }
  // Tuli
  c.fillStyle = '#ffb347';
  for (i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(x + i * s * 0.35 - s * 0.18, y + s * 0.55);
    c.quadraticCurveTo(x + i * s * 0.35, y + s * 0.05 + Math.sin(globalT * 9 + i) * s * 0.08, x + i * s * 0.35 + s * 0.18, y + s * 0.55);
    c.closePath(); c.fill();
  }
  c.fillStyle = '#ffe94f';
  c.beginPath(); c.moveTo(x - s * 0.12, y + s * 0.55); c.quadraticCurveTo(x, y + s * 0.2 + Math.sin(globalT * 11) * s * 0.06, x + s * 0.12, y + s * 0.55); c.closePath(); c.fill();
  // Pata
  c.fillStyle = '#3a3346';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y - s * 0.1, s * 1.05, s * 0.8, 0, 0, Math.PI * 2);
  else c.arc(x, y - s * 0.1, s * 0.9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#4a4460';
  c.fillRect(x - s * 1.15, y - s * 0.75, s * 2.3, s * 0.22);
  // Neste
  if (liquid) {
    c.fillStyle = liquid;
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y - s * 0.62, s * 0.95, s * 0.22, 0, 0, Math.PI * 2);
    else c.arc(x, y - s * 0.62, s * 0.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    for (i = 0; i < 4; i++) {
      var bx = x + Math.sin(globalT * 2 + i * 1.7) * s * 0.6, by = y - s * 0.62 + Math.cos(globalT * 3 + i) * s * 0.08;
      c.beginPath(); c.arc(bx, by, s * (0.05 + (i % 2) * 0.03), 0, Math.PI * 2); c.fill();
    }
    if (splash > 0) {
      c.fillStyle = liquid;
      for (i = 0; i < 6; i++) {
        var a = i / 6 * Math.PI * 2, rr = s * (1.0 - splash) * 0.9;
        c.beginPath(); c.arc(x + Math.cos(a) * rr, y - s * 0.62 - Math.sin(splash * Math.PI) * s * 0.5 + Math.sin(a) * rr * 0.3, s * 0.06, 0, Math.PI * 2); c.fill();
      }
    }
  }
  if (failed) {
    c.fillStyle = 'rgba(120,110,120,0.55)';
    for (i = 0; i < 3; i++) {
      c.beginPath(); c.arc(x + (i - 1) * s * 0.45, y - s * 1.2 - ((globalT * 0.8 + i * 0.3) % 1) * s * 0.8, s * 0.28, 0, Math.PI * 2); c.fill();
    }
  }
  // Jalat
  c.fillStyle = '#2a2436';
  c.fillRect(x - s * 0.7, y + s * 0.5, s * 0.16, s * 0.3);
  c.fillRect(x + s * 0.54, y + s * 0.5, s * 0.16, s * 0.3);
}

// ---------- Rekisteröinti ----------

function orbBottleContent(c, t, i, x, y, r) {
  var used = t.data.mix && t.data.mix.pour.indexOf(MIX_PRIMARY[i]) >= 0;
  if (used) c.globalAlpha = 0.45;
  drawPotionBottle(c, x, y + r * 0.1, r * 0.34, MIX_COLORS[MIX_PRIMARY[i]]);
  c.globalAlpha = 1;
}

function tapMixTask(t, px, py) {
  var i = orbHit(t, px, py);
  if (i < 0) return;
  t.litOrb = i;
  t.litT = 0.3;
  mixTaskTap(t, i);
}

TASK_TYPES.mix = {
  make: makeMixProblem, pitch: 523, tap: tapMixTask, update: updateMixTask,
  draw: function (c, t, shake, op) {
    drawMixOverlay(c, t, shake);
    drawTaskOrbs(c, t, shake, op, orbBottleContent);
  }
};
