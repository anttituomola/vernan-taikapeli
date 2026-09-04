'use strict';

// Jaettu tasohyppelyfysiikka uusille kentille (luola, finaali).
// Alusta: { x, y, w, kind }  kind: 'ground' | 'ledge' | 'mover'
// Liikkuva alusta lisäksi: baseX, range, speed, phase, vx (lasketaan).
// Prinsessa kulkee mukana, kun seisoo liikkuvalla alustalla.

function moverStep(pl, dt) {
  pl.phase += dt * pl.speed;
  var nx = pl.baseX + Math.sin(pl.phase) * pl.range;
  pl.vx = (nx - pl.x) / Math.max(dt, 0.0001);
  pl.x = nx;
}

// opts: { runSp, gravity, jumpTasks (bool: pysäytä kaariin), fallY, onFall }
function platformerStep(dt, opts) {
  var i, pw = viewH * 0.045;
  var runSp = opts.runSp || viewW * 0.22;

  if (!celebrating && holding && !puzzleBusy()) {
    var dxh = holdWorldX - princess.x;
    if (Math.abs(dxh) > 10) {
      princess.vx = (dxh > 0 ? 1 : -1) * runSp;
      princess.facing = dxh > 0 ? 1 : -1;
    } else {
      princess.vx = 0;
    }
  } else {
    princess.vx *= Math.max(0, 1 - dt * 7);
    if (Math.abs(princess.vx) < 8) princess.vx = 0;
  }
  if (princess.knockVx) {
    princess.vx += princess.knockVx;
    princess.knockVx *= Math.max(0, 1 - dt * 6);
    if (Math.abs(princess.knockVx) < 5) princess.knockVx = 0;
  }

  princess.x += princess.vx * dt;
  if (princess.carrier) princess.x += princess.carrier.vx * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  if (opts.blockTasks !== false) blockPrincessAtTasks();

  princess.vy += (opts.gravity || viewH * 1.65) * dt;
  if (princess.vy > viewH * 1.05) princess.vy = viewH * 1.05;
  princess.y += princess.vy * dt;

  princess.onGround = false;
  princess.carrier = null;
  for (i = 0; i < platforms.length; i++) {
    var pl = platforms[i];
    var onX = princess.x > pl.x + pw * 0.2 && princess.x < pl.x + pl.w - pw * 0.2;
    if (onX && princess.vy >= 0 && princess.y >= pl.y && princess.y <= pl.y + viewH * 0.08) {
      princess.y = pl.y;
      princess.vy = 0;
      princess.onGround = true;
      if (pl.kind === 'mover') princess.carrier = pl;
      if (pl.kind === 'bounce') {
        // Pomppiva taso heittää korkeammalle kuin oma hyppy
        princess.vy = -viewH * 1.15;
        princess.onGround = false;
        princess.coyote = 0;
        if (opts.onBounce) opts.onBounce(pl);
      }
    }
  }
  if (opts.fallY !== undefined && princess.y > opts.fallY) {
    if (opts.onFall) opts.onFall();
  }
  if (princess.onGround) princess.coyote = 0.14;
  else princess.coyote -= dt;
  if (Math.abs(princess.vx) > 12 && princess.onGround) princess.walkPhase += dt * 10;
}

function resetPrincess(x, y) {
  princess.x = x;
  princess.y = y;
  princess.vx = 0;
  princess.vy = 0;
  princess.knockVx = 0;
  princess.carrier = null;
  princess.onGround = true;
  princess.coyote = 0.12;
}

// Yhteiset nappien ja tilan alustukset run-tyyppiselle kentälle
function setupRunLevel(lvl, bgColor) {
  level = lvl;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  activeTask = null;
  heartsReset();
  document.body.style.background = bgColor;
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
}

function updateSparksAgainst(dt, targets, radius, onHit) {
  var i, k;
  for (i = sparks.length - 1; i >= 0; i--) {
    var sp = sparks[i];
    sp.age += dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    if (sp.age >= sp.life) { sparks.splice(i, 1); continue; }
    for (k = 0; k < targets.length; k++) {
      var tg = targets[k];
      if (tg.collected || tg.stunT > 0) continue;
      var dx = sp.x - tg.x, dy = sp.y - tg.y;
      if (dx * dx + dy * dy < radius * radius) {
        onHit(tg);
        sparks.splice(i, 1);
        break;
      }
    }
  }
}

function drawSparks(c, color) {
  var i;
  for (i = 0; i < sparks.length; i++) {
    var sp = sparks[i];
    var a = 1 - sp.age / sp.life;
    var sg = c.createRadialGradient(sp.x - camX, sp.y, 2, sp.x - camX, sp.y, viewH * 0.04);
    sg.addColorStop(0, 'rgba(255,255,200,' + a + ')');
    sg.addColorStop(1, color || 'rgba(200,140,255,0)');
    c.fillStyle = sg;
    c.beginPath();
    c.arc(sp.x - camX, sp.y, viewH * 0.04, 0, Math.PI * 2);
    c.fill();
  }
}

function drawParticlesLayer(c) {
  var i;
  for (i = 0; i < particles.length; i++) {
    c.globalAlpha = 1 - particles[i].age / particles[i].life;
    c.fillStyle = particles[i].color;
    c.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  c.globalAlpha = 1;
}

function updateConfetti(dt) {
  var i;
  if (!celebrating) return;
  celebrateT += dt;
  for (i = 0; i < confetti.length; i++) {
    confetti[i].y += confetti[i].vy * dt;
    confetti[i].x += confetti[i].vx * dt;
    confetti[i].rot += confetti[i].vr * dt;
    if (confetti[i].y > viewH + 20) { confetti[i].y = -20; confetti[i].x = Math.random() * viewW; }
  }
}

// Pieni keräilyrivi HUDiin: drawItem(c, x, y, s, filled)
function drawPickupHud(c, count, collectedFn, drawItem) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * count + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < count; i++) {
    c.globalAlpha = collectedFn(i) ? 1 : 0.25;
    drawItem(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.9);
    c.globalAlpha = 1;
  }
}
