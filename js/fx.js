'use strict';

// Kipinät ja konfetti
// ---------- Hiukkaset ----------
function spawnSparkles(x, y, n, color) {
  for (var i = 0; i < n; i++) {
    if (particles.length > 120) break;
    var a = Math.random() * Math.PI * 2;
    var sp = 40 + Math.random() * 120;
    particles.push({
      x: x, y: y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      life: 0.7 + Math.random() * 0.5, age: 0,
      size: 3 + Math.random() * 4,
      color: color || '#ffe27a'
    });
  }
}
function spawnConfetti() {
  var colors = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff', '#ff9ec6'];
  for (var i = 0; i < 80; i++) {
    confetti.push({
      x: Math.random() * viewW,
      y: -20 - Math.random() * viewH,
      vy: 60 + Math.random() * 90,
      vx: (Math.random() - 0.5) * 40,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 6,
      size: 5 + Math.random() * 6,
      color: colors[i % colors.length]
    });
  }
}

function countCollected(arr) {
  var n = 0, i;
  for (i = 0; i < arr.length; i++) if (arr[i].collected) n++;
  return n;
}

function followCam(x, dt) {
  var targetCam = x - viewW / 2;
  targetCam = Math.min(Math.max(targetCam, 0), Math.max(0, worldW - viewW));
  camX += (targetCam - camX) * Math.min(1, dt * 4);
}

function hudX() {
  return viewH * 0.12;
}

function drawWorldBg() {
  if (!bgCanvas.width || !viewW || !viewH) return false;
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(bgCanvas, 0, 0, bgCanvas.width, bgCanvas.height, -camX, 0, worldW, viewH);
  return true;
}

function blockPrincessAtTasks() {
  var i, lim;
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x > princess.x - 8) {
      lim = tasks[i].x - viewH * 0.09;
      if (princess.x > lim) {
        princess.x = lim;
        princess.vx = 0;
      }
    }
  }
}

function updateParticles(dt) {
  var i;
  for (i = particles.length - 1; i >= 0; i--) {
    particles[i].age += dt;
    if (particles[i].age >= particles[i].life) { particles.splice(i, 1); continue; }
    particles[i].x += particles[i].vx * dt;
    particles[i].y += particles[i].vy * dt;
    particles[i].vy += 60 * dt;
  }
}

// Kultainen nuoli ruudun laidassa, kun kohde on näkymän ulkopuolella
function drawEdgeArrow(c, targetX) {
  var sx = targetX - camX;
  var margin = viewW * 0.05;
  if (sx >= margin && sx <= viewW - margin) return;
  var dir = sx < margin ? -1 : 1;
  var ax = dir < 0 ? viewH * 0.10 : viewW - viewH * 0.10;
  var ay = viewH * 0.42;
  var pulse = 1 + Math.sin(globalT * 4) * 0.12;
  var r = viewH * 0.034 * pulse;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath(); c.arc(ax, ay, r * 1.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffb300';
  c.beginPath();
  c.moveTo(ax + dir * r, ay);
  c.lineTo(ax - dir * r * 0.6, ay - r * 0.85);
  c.lineTo(ax - dir * r * 0.2, ay);
  c.lineTo(ax - dir * r * 0.6, ay + r * 0.85);
  c.closePath();
  c.fill();
}

function drawCelebrateLayer() {
  var i;
  if (!celebrating) return;
  drawRainbow(ctx);
  for (i = 0; i < confetti.length; i++) {
    var cf = confetti[i];
    ctx.save();
    ctx.translate(cf.x, cf.y);
    ctx.rotate(cf.rot);
    ctx.fillStyle = cf.color;
    ctx.fillRect(-cf.size / 2, -cf.size / 3, cf.size, cf.size * 0.66);
    ctx.restore();
  }
}

