'use strict';

// Helmilampi: hyppely lumpeilla, helmet, sammakko ja sauva.

// ---------- Tökättävät koristeet ----------
// Paikat murto-osina; pondPropSync laskee paikan joka ruudulla (resizePond on
// world.js:ssä). p.s = piirtokoko, p.sp = koristeen oma ajastin.
var pondHoldPrev = false;
function pondPropSync(p, dt) {
  p.x = p.fx * worldW;
  p.y = groundTop + p.dy * viewH;
  p.s = p.fs * viewH;
  p.r = p.s * 1.5;
  p.hy = p.s * 1.1;
  if (p.sp > 0) p.sp -= dt;
}

// Osmankäämi: varsi, kaksi lehteä ja tupsu (fluff: tupsu on pöllähtänyt vaaleaksi)
function pondDrawCattail(c, s, fluff) {
  artShadow(c, 0, 0, s * 0.6, s * 0.14, 0.12);
  artLimb(c, 0, 0, -s * 0.5, -s * 1.5, s * 0.08, '#4f9a3a', '#2a5a1a');
  artLimb(c, s * 0.05, -s * 0.3, s * 0.7, -s * 1.7, s * 0.08, '#4f9a3a', '#2a5a1a');
  artLimb(c, 0, 0, s * 0.1, -s * 2.2, s * 0.1, '#4f9a3a', '#2a5a1a');
  artLimb(c, s * 0.1, -s * 2.3, s * 0.12, -s * 2.65, s * 0.07, '#d8c470', '#8a7a30');
  artBlob(c, s * 0.08, -s * 1.75, s * 0.2, s * 0.55, fluff ? '#d8c4a0' : '#7a4a2a', { lineColor: '#3a2210', hi: 0.3 });
}

// Lumpeenkukka lehdellä: terälehdet avautuvat tökkäyksestä (open 0..1)
function pondDrawLily(c, s, open) {
  var i, a, k = 0.8 + open * 0.3;
  artBlob(c, 0, 0, s * 1.3, s * 0.4, '#4faa5a', { lineColor: '#2a6a30' });
  if (open > 0) artGlow(c, 0, -s * 0.35, s * 1.6, '#ffd0e0', open * 0.4);
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3;
    artBlob(c, Math.cos(a) * s * 0.45 * k, -s * 0.35 + Math.sin(a) * s * 0.2 * k, s * 0.42 * k, s * 0.2, '#ffb0d0', { rot: a, lineColor: '#c05080' });
  }
  artCircle(c, 0, -s * 0.35, s * 0.2, '#ffe27a', { lineColor: '#b08a20' });
}

// Lumpeenlehti; sen takaa kurkistaa nukkuva kala (fish 0..1 = kuinka ylhäällä)
function pondDrawPad(c, s, fish) {
  var fy;
  if (fish > 0) {
    fy = -s * 0.3 - fish * s * 0.9;
    c.beginPath(); c.moveTo(s * 0.5, fy); c.lineTo(s * 0.95, fy - s * 0.35); c.lineTo(s * 0.95, fy + s * 0.35); c.closePath();
    artFillPath(c, '#ffb347', fy - s * 0.35, fy + s * 0.35, s * 0.3, { lineColor: '#b06a10' });
    artBlob(c, 0, fy, s * 0.6, s * 0.36, '#ffb347', { lineColor: '#b06a10', hi: 0.3 });
    artEye(c, -s * 0.3, fy - s * 0.08, s * 0.1, 0, true);
    c.fillStyle = '#ffffff';
    c.font = 'bold ' + Math.round(s * 0.4) + 'px sans-serif';
    c.fillText('z', -s * 0.5, fy - s * 0.5);
    c.fillText('z', -s * 0.7, fy - s * 0.85);
  }
  artBlob(c, 0, 0, s * 1.4, s * 0.45, '#5fbf6a', { lineColor: '#2a6a30', hi: 0.2 });
  c.strokeStyle = '#2a6a30';
  c.lineWidth = Math.max(1.2, s * 0.08);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 1.2, -s * 0.25); c.stroke();
}

function pondPropsSetup() {
  var i, defs = [
    { kind: 'cattail', fx: 0.08, fs: 0.04, color: '#d8c470', note: 520 },
    { kind: 'lily', fx: 0.44, fs: 0.04, color: '#ffb0d0', note: 880 },
    { kind: 'pad', fx: 0.60, fs: 0.04, color: '#9fe0a0', note: 660 },
    { kind: 'cattail', fx: 0.92, fs: 0.04, color: '#d8c470', note: 560 }
  ];
  propsReset();
  for (i = 0; i < defs.length; i++) {
    defs[i].dy = 0.005;
    defs[i].sp = 0;
    defs[i].update = pondPropSync;
    if (defs[i].kind === 'cattail') {
      defs[i].draw = function (c, p) { pondDrawCattail(c, p.s, p.sp > 0); };
      defs[i].poke = function (p) {
        // Tupsusta pöllähtää untuvaa
        p.sp = 2.5;
        spawnSparkles(p.x, p.y - p.s * 1.9, 12, '#fff4e0');
      };
    } else if (defs[i].kind === 'lily') {
      defs[i].draw = function (c, p) { pondDrawLily(c, p.s, p.sp > 0 ? Math.sin(Math.min(1, p.sp / 1.5) * Math.PI) : 0); };
      defs[i].poke = function (p) {
        p.sp = 1.5;
        spawnSparkles(p.x, p.y - p.s * 0.5, 8, '#ffd0e0');
      };
    } else {
      defs[i].draw = function (c, p) {
        var k = p.sp > 0 ? Math.min(1, (2.5 - p.sp) / 0.4, p.sp / 0.4) : 0;
        pondDrawPad(c, p.s, k > 0 ? easeOutBack(k) : 0);
      };
      defs[i].poke = function (p) {
        // Roiske; joka kolmas tökkäys herättää lehden alla nukkuvan kalan (yllätys)
        spawnSparkles(p.x, p.y, 8, '#c8f4ff');
        if (p.n % 3 === 0 && p.sp <= 0) {
          p.sp = 2.5;
          playNote(392, 0.1, 0.12, 'triangle', 0.2);
          playNote(523, 0.22, 0.2, 'triangle', 0.2);
        }
      };
    }
    pondPropSync(propAdd(defs[i]), 0);
  }
}

// Juoksukentässä ei ole tap-koukkua: napautus tunnistetaan pidon alkamisesta.
// Sammakko kurnuttaa, muuten tökätään koristetta. Ei pelivaikutusta.
function pondTapCheck() {
  var wx, wy, s;
  if (holding && !pondHoldPrev && running && !celebrating && !puzzleBusy()) {
    wx = holdWorldX; wy = holdSY;
    s = viewH * 0.05;
    if (!frog.awake && Math.hypot(wx - frog.x, wy - (frog.y - s)) < s * 1.6) {
      frog.pokeT = 0.9;
      playNote(196, 0, 0.12, 'square', 0.12);
      playNote(165, 0.12, 0.16, 'square', 0.12);
      spawnSparkles(frog.x, frog.y - s * 1.2, 5, '#b6ff9a');
    } else {
      propsTap(wx, wy);
    }
  }
  pondHoldPrev = holding;
}

function layoutPond() {
  var g = groundTop;
  platforms = [
    { x: 0, y: g, w: worldW },
    { x: worldW * 0.14, y: g - viewH * 0.18, w: worldW * 0.12 },
    { x: worldW * 0.32, y: g - viewH * 0.34, w: worldW * 0.10 },
    { x: worldW * 0.50, y: g - viewH * 0.20, w: worldW * 0.11 },
    { x: worldW * 0.66, y: g - viewH * 0.40, w: worldW * 0.10 },
    { x: worldW * 0.84, y: g - viewH * 0.24, w: worldW * 0.12 }
  ];
  frog.x = platforms[4].x + platforms[4].w * 0.5;
  frog.y = platforms[4].y;
}

function initPond() {
  var i, def;
  tasks = [makeTask(0.32, 'math'), makeTask(0.72, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  layoutPond();
  pearls = [];
  for (i = 0; i < pondDefs.length; i++) {
    def = pondDefs[i];
    pearls.push({
      ax: def.fx * worldW,
      ay: groundTop - def.fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2
    });
  }
  frog.awake = false;
  frog.hopT = 0;
  frog.pokeT = 0;
  pondPropsSetup();
  pondHoldPrev = false;
  princess.x = viewW * 0.12;
  princess.y = groundTop;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = true;
  princess.walkPhase = 0;
  princess.coyote = 0.12;
  renderBackground();
  playNote(392, 0, 0.22, 'triangle', 0.35);
  playNote(523, 0.12, 0.28, 'sine', 0.35);
}

function collectPondPearl(p) {
  p.collected = true;
  spawnSparkles(p.ax, p.ay, 12, '#c8f4ff');
  artPop(p.ax, p.ay, viewH * 0.05, '#c8f4ff', 'ring');
  var idx = pearls.indexOf(p);
  if (idx >= 0) hudBump[idx] = 0.4;
  playNote(698, 0, 0.18, 'sine', 0.4);
  playNote(1047, 0.08, 0.24, 'sine', 0.32);
  if (countCollected(pearls) === PICKUP_COUNT) startCelebration();
}

function updatePond(dt) {
  var i, g = groundTop, pw = viewH * 0.045, runSp = viewW * 0.18;
  updateTasks(dt);
  propsUpdate(dt);
  pondTapCheck();
  if (frog.pokeT > 0) frog.pokeT -= dt;

  if (!celebrating && holding && !puzzleBusy()) {
    var dxh = holdWorldX - princess.x;
    if (Math.abs(dxh) > 10) {
      princess.vx = (dxh > 0 ? 1 : -1) * runSp;
      princess.facing = dxh > 0 ? 1 : -1;
    } else princess.vx = 0;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 6);
    if (Math.abs(princess.vx) < 8) princess.vx = 0;
  }

  princess.x += princess.vx * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  blockPrincessAtTasks();

  if (!frog.awake && Math.abs(princess.x - frog.x) < viewH * 0.07 &&
      Math.abs(princess.y - frog.y) < viewH * 0.08) {
    princess.x = frog.x - viewH * 0.08 * (princess.x < frog.x ? 1 : -1);
    princess.vx = 0;
  }

  princess.vy += viewH * 1.55 * dt;
  if (princess.vy > viewH * 1.05) princess.vy = viewH * 1.05;
  princess.y += princess.vy * dt;
  princess.onGround = false;
  for (i = 0; i < platforms.length; i++) {
    var pl = platforms[i];
    var onX = princess.x > pl.x + pw * 0.2 && princess.x < pl.x + pl.w - pw * 0.2;
    if (onX && princess.vy >= 0 && princess.y >= pl.y && princess.y <= pl.y + viewH * 0.08) {
      princess.y = pl.y;
      princess.vy = 0;
      princess.onGround = true;
    }
  }
  if (princess.y > g) {
    princess.y = g;
    princess.vy = 0;
    princess.onGround = true;
  }
  if (princess.onGround) princess.coyote = 0.14;
  else princess.coyote -= dt;
  if (Math.abs(princess.vx) > 12 && princess.onGround) princess.walkPhase += dt * 8;

  followCam(princess.x, dt);
  frog.hopT += dt * 5;
  if (frog.awake) frog.y -= viewH * 0.16 * dt;

  for (i = 0; i < pearls.length; i++) {
    if (pearls[i].collected) continue;
    pearls[i].phase += dt * 2.4;
    if (Math.abs(pearls[i].ax - princess.x) < viewW * 0.22) {
      pearls[i].ax += ((pearls[i].ax - princess.x) >= 0 ? 1 : -1) * viewW * 0.07 * dt;
    }
    pearls[i].ax = Math.min(Math.max(pearls[i].ax, viewW * 0.04), worldW - viewW * 0.04);
  }

  for (i = sparks.length - 1; i >= 0; i--) {
    var sp = sparks[i];
    sp.age += dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    if (sp.age >= sp.life) { sparks.splice(i, 1); continue; }
    if (!frog.awake) {
      var odx = sp.x - frog.x, ody = sp.y - (frog.y - viewH * 0.05);
      if (odx * odx + ody * ody < viewH * 0.07 * viewH * 0.07) {
        frog.awake = true;
        spawnSparkles(frog.x, frog.y, 12, '#b6ff9a');
        artPop(frog.x, frog.y - viewH * 0.04, viewH * 0.08, '#b6ff9a', 'burst');
        artShakeStart(viewH * 0.008, 0.25);
        playNote(330, 0, 0.15, 'triangle', 0.3);
        sparks.splice(i, 1);
        continue;
      }
    }
    var k;
    for (k = 0; k < pearls.length; k++) {
      if (pearls[k].collected) continue;
      var pdx = sp.x - pearls[k].ax, pdy = sp.y - (pearls[k].ay + Math.sin(pearls[k].phase) * viewH * 0.015);
      if (pdx * pdx + pdy * pdy < viewH * 0.04 * viewH * 0.04) {
        collectPondPearl(pearls[k]);
        sparks.splice(i, 1);
        break;
      }
    }
  }

  updateParticles(dt);
  if (celebrating) {
    celebrateT += dt;
    for (i = 0; i < confetti.length; i++) {
      confetti[i].y += confetti[i].vy * dt;
      confetti[i].x += confetti[i].vx * dt;
      confetti[i].rot += confetti[i].vr * dt;
    }
  }
}

function drawFrog(c) {
  var x = frog.x - camX;
  var y = frog.y - viewH * 0.04 - (frog.awake ? frog.hopT * viewH * 0.04 : Math.abs(Math.sin(frog.hopT)) * 6);
  var s = viewH * 0.05;
  // Tökättynä kurkkupussi pullistuu (kurnutus)
  var croak = frog.pokeT > 0 ? Math.sin(Math.min(1, frog.pokeT / 0.9) * Math.PI) : 0;
  if (!frog.awake) artShadow(c, x, frog.y, s * 1.2, s * 0.28, 0.16);
  c.save();
  c.translate(x, y);
  artLimb(c, -s * 0.45, s * 0.25, -s * 0.7, s * 0.5, s * 0.16, '#4aaa58', false);
  artLimb(c, s * 0.45, s * 0.25, s * 0.7, s * 0.5, s * 0.16, '#4aaa58', false);
  if (croak > 0) artCircle(c, 0, s * 0.42, s * 0.36 * croak, '#c8f0a0', { lineColor: '#4a8a40' });
  artBlob(c, 0, 0, s * 0.8, s * 0.55, '#5ecf6a', { hi: 0.3 });
  artEye(c, -s * 0.28, -s * 0.22, s * 0.18, 0.25, !frog.awake);
  artEye(c, s * 0.28, -s * 0.22, s * 0.18, 0.25, !frog.awake);
  c.restore();
}

function drawPearl(c, x, y, r) {
  artGlow(c, x, y, r * 2.6, '#c8f4ff', 0.45);
  artCircle(c, x, y, r, '#d4f6ff', { shadeTo: '#7ecbe0', hi: 0.5 });
}

function drawPond() {
  var i, hs, pad, bump;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  drawFrog(ctx);
  for (i = 0; i < pearls.length; i++) {
    if (pearls[i].collected) continue;
    drawPearl(
      ctx,
      pearls[i].ax - camX,
      pearls[i].ay + Math.sin(pearls[i].phase) * viewH * 0.015,
      viewH * 0.022
    );
  }
  for (i = 0; i < sparks.length; i++) {
    var a = 1 - sparks[i].age / sparks[i].life;
    artGlow(ctx, sparks[i].x - camX, sparks[i].y, viewH * 0.045, '#c8f4ff', a * 0.7);
  }
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  endPlayWorld();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(10,50,60,0.32)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = pearls[i] && pearls[i].collected ? 1 : 0.28;
    bump = hudBump[i] > 0 ? 1 + Math.sin(Math.PI * hudBump[i] / 0.4) * 0.45 : 1;
    drawPearl(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.85 * bump);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
