'use strict';

// Revontulikettu: saaren vartija. Kettu leikkii piilosta tunturissa: se juoksee
// edelle ja jättää lumeen hohtavat tassunjäljet, jotka näyttävät tien. Sitten
// se kyyristyy lumikinoksen taakse, ja vain korvat ja revontulihännän kärki
// näkyvät. Ratsasta ketun luo (tai napauta sitä): kettu ponnahtaa esiin ja
// antaa revontulikiteen. Neljä tehtäväkaarta matkalla. Kuudennen kiteen
// jälkeen kettu juoksee kalliolle meren rantaan; kun yksisarvinen saapuu,
// ketun häntä pyyhkäisee revontulisillan meren yli itään, Kaukamaalle.

var FOX_STONES = 6;
var foxStones = [];
var foxDoor = { fx: 0.86, x: 0, open: false };    // kallion reuna (nimi säilyy VT-kahvaa varten)
var foxSpotDefs = [0.11, 0.18, 0.30, 0.47, 0.64, 0.78];
// Kettu: tila greet (tervehtii alussa) / run / hide / pop (ponnahtaa esiin) /
// cliff (odottaa kalliolla); spot = nykyinen piilopaikka
var fox = { x: 0, y: 0, tx: 0, state: 'greet', t: 0, spot: -1, facing: 1, ph: 0, printD: 0, printSide: 0, peekT: 0 };
var foxPrints = [];
// Ketun reaktiot tökkäykseen (vain piirtoon)
var foxFx = { yipT: 0, peekT: 0, tailT: 0 };

function foxCliffX() { return foxDoor.fx * worldW; }
function foxHideY() { return groundTop + viewH * 0.035; }

function initFoxguard() {
  var i;
  tasks = [
    makeTask(0.22, 'word'),
    makeTask(0.38, 'lastletter'),
    makeTask(0.56, 'gapsyl'),
    makeTask(0.72, 'memory', { seqLen: 5, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([]);
  foxStones = [];
  for (i = 0; i < FOX_STONES; i++) foxStones.push({ ax: foxSpotDefs[i] * worldW, collected: false });
  foxDoor.x = foxCliffX();
  foxDoor.open = false;
  foxPrints = [];
  fox.x = viewW * 0.36;
  fox.y = foxHideY();
  fox.tx = fox.x;
  fox.state = 'greet';
  fox.t = 0;
  fox.spot = -1;
  fox.facing = -1;
  fox.ph = 0;
  fox.printD = 0;
  fox.peekT = 0;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.08;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  foxFx.yipT = 0; foxFx.peekT = 0; foxFx.tailT = 0;
  foxSetupProps();
  renderBackground();
  playNote(262, 0, 0.35, 'sine', 0.3);
  playNote(392, 0.18, 0.4, 'triangle', 0.3);
}

// Tökättävät koristeet: lähikuuset pudottavat lumitupsun; kettu itse
// äännähtää ja heiluttaa häntää (osuma-alue seuraa kettua, kun se ei piilottele)
function foxSetupProps() {
  var h = viewH, w = worldW;
  propsReset();
  voyPineProp(w * 0.05, groundTop, h * 0.14, '#1a3850');
  voyPineProp(w * 0.26, groundTop, h * 0.15, '#245068');
  voyPineProp(w * 0.52, groundTop, h * 0.16, '#1a3850');
  voyPineProp(w * 0.68, groundTop, h * 0.14, '#245068');
  voyPineProp(w * 0.82, groundTop, h * 0.16, '#1a3850');
  propAdd({
    x: fox.x, y: fox.y, r: h * 0.08, hy: h * 0.05, color: '#ffb060', note: 880, amp: 0,
    draw: function () {},
    update: function (p) {
      p.x = (fox.state === 'greet' || fox.state === 'cliff') ? fox.x : -1e6;
      p.y = fox.y;
    },
    poke: function (p) {
      foxFx.yipT = 0.7;
      foxYip();
      if (p.n % 3 === 0) {
        foxFx.tailT = 1.8;
        spawnSparkles(p.x - h * 0.05, p.y - h * 0.08, 10, '#7cffc4');
        spawnSparkles(p.x - h * 0.06, p.y - h * 0.1, 8, '#c9a0ff');
        playNote(659, 0, 0.3, 'sine', 0.2);
        playNote(988, 0.15, 0.3, 'sine', 0.2);
        playNote(1319, 0.3, 0.5, 'sine', 0.2);
      }
    }
  });
}

function foxYip() {
  playNote(1175, 0, 0.07, 'triangle', 0.22);
  playNote(1568, 0.08, 0.1, 'triangle', 0.2);
}

function respawnFoxguard() {}

function resizeFoxguard(ratio) {
  var i;
  for (i = 0; i < foxStones.length; i++) foxStones[i].ax = foxSpotDefs[i] * worldW;
  foxDoor.x = foxCliffX();
  fox.x *= ratio;
  fox.tx *= ratio;
  fox.y = foxHideY();
  for (i = 0; i < foxPrints.length; i++) foxPrints[i].x *= ratio;
  foxSetupProps();
}

function foxTasksSolved() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return n;
}

// Kettu juoksee seuraavaan piiloon, tai kaikkien kiteiden jälkeen kalliolle
function foxRunNext() {
  fox.spot++;
  fox.state = 'run';
  fox.tx = fox.spot < FOX_STONES ? foxStones[fox.spot].ax : foxCliffX() - viewH * 0.05;
  fox.facing = fox.tx > fox.x ? 1 : -1;
  foxYip();
}

// Löytyi! Kettu ponnahtaa kinoksen takaa ja antaa revontulikiteen
function foxFound() {
  var s = foxStones[fox.spot];
  if (!s || s.collected) return;
  s.collected = true;
  fox.state = 'pop';
  fox.t = 0;
  spawnSparkles(fox.x, fox.y - viewH * 0.1, 14, '#7cffc4');
  spawnSparkles(fox.x, fox.y - viewH * 0.12, 10, '#c9a0ff');
  soundStar(countCollected(foxStones));
  foxYip();
  if (countCollected(foxStones) === FOX_STONES) foxDoor.open = true;
}

function handleFoxguardTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX;
  // Napautus piilossa olevaan kettuun (korvat, häntä tai kinos) löytää sen
  if (fox.state === 'hide' && Math.abs(wx - fox.x) < viewH * 0.14 && Math.abs(py - (fox.y - viewH * 0.05)) < viewH * 0.12) {
    foxFound();
    return;
  }
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateFoxguard(dt) {
  var busy, dx, step, spd, cliff = foxCliffX();
  updateTasks(dt);
  propsUpdate(dt);
  if (foxFx.yipT > 0) foxFx.yipT -= dt;
  if (foxFx.peekT > 0) foxFx.peekT -= dt;
  if (foxFx.tailT > 0) foxFx.tailT -= dt;
  busy = puzzleBusy();
  // Kallion reunalta ei ratsasteta mereen
  unicorn.tx = Math.min(unicorn.tx, cliff - viewH * 0.16);
  if (!celebrating) northRideUnicorn(dt, busy);
  else {
    // Juhlassa kamera liukuu itään, jotta meri ja Kaukamaa näkyvät
    unicorn.moving = false;
    camX += (Math.min(cliff - viewW * 0.38, worldW - viewW) - camX) * Math.min(1, dt * 2);
  }
  unicorn.x = Math.min(unicorn.x, cliff - viewH * 0.16);
  fox.t += dt;
  fox.ph += dt * (fox.state === 'run' ? 14 : 2);
  if (!busy) {
    if (fox.state === 'greet') {
      // Tervehtii hetken (tai kunnes yksisarvinen tulee luo) ja lähtee leikkimään
      if (fox.t > 3.0 || Math.abs(unicorn.x - fox.x) < viewH * 0.25) foxRunNext();
    } else if (fox.state === 'run') {
      dx = fox.tx - fox.x;
      spd = viewW * 0.42;
      step = Math.min(Math.abs(dx), spd * dt);
      fox.x += (dx > 0 ? 1 : -1) * step;
      // Hohtavat tassunjäljet lumeen näyttävät tien
      fox.printD += step;
      if (fox.printD > viewH * 0.07) {
        fox.printD = 0;
        fox.printSide = 1 - fox.printSide;
        foxPrints.push({ x: fox.x, y: fox.y + (fox.printSide ? 1 : -1) * viewH * 0.012, t: 0 });
        if (foxPrints.length > 80) foxPrints.shift();
      }
      if (Math.abs(fox.tx - fox.x) < 2) {
        fox.state = fox.spot < FOX_STONES ? 'hide' : 'cliff';
        fox.facing = fox.spot < FOX_STONES ? -1 : 1;
        fox.t = 0;
      }
    } else if (fox.state === 'hide') {
      // Ratsasta luo: löytyi
      if (!celebrating && Math.abs(unicorn.x - fox.x) < viewH * 0.22) foxFound();
    } else if (fox.state === 'pop') {
      if (fox.t > 0.9) foxRunNext();
    } else if (fox.state === 'cliff') {
      if (!celebrating && unicorn.x > cliff - viewH * 0.4) {
        foxFx.tailT = 0;
        startCelebration();
        playNote(659, 0.3, 0.4, 'sine', 0.25);
        playNote(988, 0.6, 0.4, 'sine', 0.25);
        playNote(1319, 0.9, 0.7, 'sine', 0.25);
      }
    }
  }
  updateFoxPrints(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

function updateFoxPrints(dt) {
  var i;
  for (i = foxPrints.length - 1; i >= 0; i--) {
    foxPrints[i].t += dt;
    if (foxPrints[i].t > 9) foxPrints.splice(i, 1);
  }
}

function foxguardLayers() {
  return [
    { speed: 0.22, render: renderFoxguardFar },
    { speed: 0.55, render: renderFoxguardMid },
    { speed: 1, render: renderFoxguardNear }
  ];
}
function renderFoxguardBg(b, w, h) {
  renderFoxguardFar(b, w, h); renderFoxguardMid(b, w, h); renderFoxguardNear(b, w, h);
}
function renderFoxguardFar(b, w, h) { renderNorthSky(b, w, h); }
function renderFoxguardMid(b, w, h) {
  var i;
  renderNorthHills(b, w, h);
  for (i = 0; i < 4; i++) drawNorthPine(b, w * (0.14 + i * 0.2), groundTop - h * 0.01, h * (0.16 + (i % 2) * 0.04), i % 2 ? '#1a3850' : '#245068');
}
function renderFoxguardNear(b, w, h) {
  // Lähikuuset ovat tökättäviä koristeita; meri ja kallio piirretään päälle (drawFoxSea)
  renderNorthGround(b, w, h);
}

// Itäpää: kallio päättyy mereen, ja horisontissa hohtaa Kaukamaa
function drawFoxSea(c) {
  var cx = foxCliffX() - camX, hz = viewH * 0.6, g, i, mx, glow;
  if (cx > viewW + 10) return;
  g = c.createLinearGradient(0, hz, 0, viewH);
  g.addColorStop(0, '#4a90b8');
  g.addColorStop(0.4, '#2a6a90');
  g.addColorStop(1, '#16405a');
  c.fillStyle = g;
  c.fillRect(cx, hz, viewW - cx + 10, viewH - hz);
  // Kaukamaa: lämmin hehku ja vuorten siluetit horisontissa ruudun oikeassa reunassa
  mx = Math.max(cx + viewH * 0.12, viewW * 0.72);
  glow = c.createRadialGradient(mx + viewH * 0.12, hz, 2, mx + viewH * 0.12, hz, viewH * 0.35);
  glow.addColorStop(0, 'rgba(255,214,150,0.55)');
  glow.addColorStop(1, 'rgba(255,214,150,0)');
  c.fillStyle = glow;
  c.fillRect(mx - viewH * 0.3, hz - viewH * 0.35, viewH * 0.8, viewH * 0.4);
  c.beginPath();
  c.moveTo(mx - viewH * 0.12, hz);
  c.quadraticCurveTo(mx - viewH * 0.02, hz - viewH * 0.09, mx + viewH * 0.06, hz - viewH * 0.05);
  c.quadraticCurveTo(mx + viewH * 0.14, hz - viewH * 0.14, mx + viewH * 0.24, hz - viewH * 0.06);
  c.quadraticCurveTo(mx + viewH * 0.34, hz - viewH * 0.1, viewW + 10, hz - viewH * 0.04);
  c.lineTo(viewW + 10, hz);
  c.closePath();
  artFillPath(c, '#6a6aa8', hz - viewH * 0.14, hz, viewH * 0.06, { shadeTo: '#3e4a80', lineColor: '#2e3460' });
  artBlob(c, mx + viewH * 0.14, hz - viewH * 0.125, viewH * 0.03, viewH * 0.014, '#ffffff', { line: false });
  // Laineet
  c.fillStyle = 'rgba(210,240,255,0.25)';
  for (i = 0; i < 7; i++) {
    c.beginPath();
    if (c.ellipse) c.ellipse(cx + ((i * 173 + globalT * 20) % Math.max(40, viewW - cx)), hz + viewH * (0.06 + (i % 4) * 0.08), viewH * 0.06, viewH * 0.008, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Kallio: lumen reuna putoaa veteen
  c.beginPath();
  c.moveTo(cx - viewH * 0.1, groundTop - viewH * 0.01);
  c.quadraticCurveTo(cx + viewH * 0.02, groundTop - viewH * 0.02, cx + viewH * 0.04, groundTop + viewH * 0.04);
  c.lineTo(cx + viewH * 0.02, viewH);
  c.lineTo(cx - viewH * 0.1, viewH);
  c.closePath();
  artFillPath(c, '#8aa0b2', groundTop, viewH, viewH * 0.1, { shadeTo: '#56708a', lineColor: '#3e5466', hi: 0.12 });
  artBlob(c, cx - viewH * 0.03, groundTop - viewH * 0.005, viewH * 0.08, viewH * 0.025, '#ffffff', { shadeTo: '#dce8f4', lineColor: '#b8c8d8', hi: 0.4 });
}

// Kettu tarrakirja-ilmeessä. pose: 'run' | 'sit'. tail: hännän nosto 0..1
function drawFoxBody(c, x, y, s, facing, pose, ph, tail) {
  var fur = '#e88a3a', dark = '#b85a20', cream = '#fff4e8', sw, hx, hy, ta;
  c.save();
  c.translate(x, y);
  artShadow(c, 0, 0, s * 0.45, s * 0.09, 0.15);
  c.scale(facing, 1);
  ta = -0.3 - tail * 1.3;
  if (pose === 'run') {
    sw = Math.sin(ph) * s * 0.16;
    artLimb(c, -s * 0.24, -s * 0.24, -s * 0.24 - sw, 0, s * 0.07, dark);
    artLimb(c, s * 0.22, -s * 0.24, s * 0.22 + sw, 0, s * 0.07, dark);
    artBlob(c, -s * 0.5, -s * 0.36, s * 0.28, s * 0.12, fur, { rot: ta + Math.sin(ph * 0.5) * 0.15, hi: 0.2 });
    artCircle(c, -s * 0.74, -s * 0.42 + Math.sin(ta) * s * 0.2, s * 0.08, cream, { hi: 0.4 });
    artBlob(c, 0, -s * 0.32 - Math.abs(sw) * 0.2, s * 0.38, s * 0.16, fur, { hi: 0.24 });
    artLimb(c, -s * 0.2, -s * 0.24, -s * 0.2 + sw, 0, s * 0.075, fur);
    artLimb(c, s * 0.24, -s * 0.24, s * 0.24 - sw, 0, s * 0.075, fur);
    hx = s * 0.38; hy = -s * 0.46;
  } else {
    artBlob(c, -s * 0.28, -s * 0.12 - tail * s * 0.3, s * 0.32, s * 0.11, fur, { rot: -0.2 - tail * 1.2, hi: 0.2 });
    artCircle(c, -s * 0.56 + tail * s * 0.2, -s * 0.16 - tail * s * 0.62, s * 0.09, cream, { hi: 0.4 });
    artBlob(c, 0, -s * 0.3, s * 0.22, s * 0.3, fur, { hi: 0.24 });
    artBlob(c, s * 0.08, -s * 0.3, s * 0.11, s * 0.2, cream, { line: false });
    artLimb(c, s * 0.08, -s * 0.2, s * 0.1, 0, s * 0.07, fur);
    artLimb(c, -s * 0.04, -s * 0.2, -s * 0.04, 0, s * 0.07, dark);
    hx = s * 0.08; hy = -s * 0.68;
  }
  artBlob(c, hx - s * 0.08, hy - s * 0.16, s * 0.06, s * 0.11, fur, { rot: -0.35 });
  artBlob(c, hx + s * 0.08, hy - s * 0.16, s * 0.06, s * 0.11, fur, { rot: 0.3 });
  artCircle(c, hx, hy, s * 0.15, fur, { hi: 0.28 });
  artBlob(c, hx + s * 0.14, hy + s * 0.04, s * 0.1, s * 0.06, cream, { line: false });
  artCircle(c, hx + s * 0.23, hy + s * 0.03, s * 0.025, '#4a2810', { line: false });
  artEye(c, hx + s * 0.04, hy - s * 0.03, s * 0.04, 0.3, false);
  artBlush(c, hx + s * 0.06, hy + s * 0.07, s * 0.035);
  c.restore();
}

// Piilossa: kettu kinoksen takana, korvat ja hehkuva hännänpää näkyvät
function drawFoxHiding(c, x, y, s) {
  var peek = Math.max(0, Math.sin(globalT * 2.2)) * s * 0.14, wag = Math.sin(globalT * 6) * s * 0.06, tx, ty;
  // Kettu istuu kinoksen takana; pää nousee välillä kurkistamaan
  drawFoxBody(c, x - s * 0.05, y + s * 0.04 - peek, s, -1, 'sit', 0, 0);
  // Lumikinos ketun edessä
  artBlob(c, x + s * 0.02, y - s * 0.24, s * 0.58, s * 0.33, '#ffffff', { shadeTo: '#d4e4f0', lineColor: '#9ab4c8', hi: 0.4 });
  artBlob(c, x - s * 0.36, y - s * 0.08, s * 0.3, s * 0.18, '#f4f9ff', { shadeTo: '#d4e4f0', lineColor: '#9ab4c8', hi: 0.4 });
  // Hehkuva hännänpää pilkistää kinoksen reunalta ja heiluu
  tx = x + s * 0.66 + wag; ty = y - s * 0.34;
  artGlow(c, tx, ty, s * 0.36, '#7cffc4', 0.5 + Math.sin(globalT * 4) * 0.15);
  artBlob(c, x + s * 0.5, y - s * 0.24, s * 0.2, s * 0.09, '#e88a3a', { rot: -0.7 + wag / s, hi: 0.2 });
  artCircle(c, tx, ty, s * 0.11, '#d8fff0', { shadeTo: '#7cffc4', lineColor: '#2a9a70', hi: 0.5 });
}

// Juhlan revontulisilta: hännästä nouseva kaari meren yli Kaukamaalle.
// Piirretään juhlasateenkaaren päälle, jotta tie erottuu selvästi.
function foxTrailPt(u, sx, sy, mx, my, ex, ey) {
  return {
    x: (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * ex,
    y: (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * ey
  };
}
function drawFoxTrail(c) {
  var k = Math.min(1, celebrateT / 1.8), s = viewH * 0.13;
  var sx = fox.x - camX - s * 0.45, sy = fox.y - s * 0.55;
  var ex = viewW - viewH * 0.06, ey = viewH * 0.5, mx = (sx + ex) / 2, my = -viewH * 0.02;
  var j, n, i, pt, cols = ['#7cffc4', '#c9a0ff', '#8ad8ff'], off;
  if (k <= 0) return;
  n = Math.max(2, Math.round(48 * k));
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (j = 0; j < 3; j++) {
    off = (j - 1) * viewH * 0.022;
    c.beginPath();
    for (i = 0; i <= n; i++) {
      pt = foxTrailPt(i / 48, sx, sy, mx, my + off * 2, ex, ey + off);
      pt.y += Math.sin(i * 0.4 + globalT * 4 + j) * viewH * 0.005;
      if (i === 0) c.moveTo(pt.x, pt.y); else c.lineTo(pt.x, pt.y);
    }
    c.globalAlpha = 0.9;
    c.strokeStyle = artShade(cols[j], -0.35);
    c.lineWidth = viewH * 0.026;
    c.stroke();
    c.strokeStyle = cols[j];
    c.lineWidth = viewH * 0.017;
    c.stroke();
  }
  c.globalAlpha = 1;
  // Kipinätähti kulkee sillan kärjessä ja jää sitten kiitämään sitä pitkin kohti Kaukamaata
  pt = foxTrailPt(k < 1 ? k : (celebrateT * 0.5) % 1, sx, sy, mx, my, ex, ey);
  artGlow(c, pt.x, pt.y, viewH * 0.06, '#ffe27a', 0.6);
  drawStar(c, pt.x, pt.y, viewH * 0.03, globalT * 3, 1);
  c.restore();
}

function drawFoxguard() {
  var i, p, us, a;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  drawFoxSea(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  // Tassunjäljet: revontulenvihreät, haalistuvat hitaasti
  for (i = 0; i < foxPrints.length; i++) {
    p = foxPrints[i];
    a = Math.min(1, (9 - p.t) / 3);
    ctx.globalAlpha = 0.8 * a;
    artGlow(ctx, p.x - camX, p.y, viewH * 0.032, '#7cffc4', 0.6);
    artBlob(ctx, p.x - camX, p.y, viewH * 0.013, viewH * 0.008, '#b8ffe0', { lineColor: '#2a9a70', line: 1.2 });
  }
  ctx.globalAlpha = 1;
  propsDraw(ctx);
  us = viewH / 800;
  if (fox.y < unicorn.y) foxDrawNow(ctx);
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  if (fox.y >= unicorn.y) foxDrawNow(ctx);
  drawParticlesLayer(ctx);
  if (!celebrating) {
    if (fox.state === 'hide' || fox.state === 'cliff' || fox.state === 'run') drawEdgeArrow(ctx, fox.x);
  }
  endPlayWorld();
  if (celebrating) drawFoxTrail(ctx);
  drawPickupHud(ctx, FOX_STONES, function (k) { return foxStones[k] && foxStones[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawTaskOverlay(ctx);
}

function foxDrawNow(c) {
  var s = viewH * 0.13, x = fox.x - camX, y = fox.y, hop, tailUp;
  if (fox.state === 'hide') { drawFoxHiding(c, x, y, s); return; }
  if (fox.state === 'run') {
    hop = Math.abs(Math.sin(fox.ph * 0.5)) * viewH * 0.03;
    drawFoxBody(c, x, y - hop, s, fox.facing, 'run', fox.ph, 0);
    return;
  }
  if (fox.state === 'pop') {
    // Ponnahdus kinoksesta: hyppy ja pyörähdys
    hop = Math.sin(Math.min(1, fox.t / 0.7) * Math.PI) * viewH * 0.12;
    drawFoxBody(c, x, y - hop, s, Math.cos(fox.t * 9) >= 0 ? 1 : -1, 'sit', 0, 0.6);
    return;
  }
  // greet ja cliff: istuu; tökkäys heiluttaa häntää, juhlassa häntä nousee
  tailUp = celebrating ? Math.min(1, celebrateT / 0.6) : (foxFx.yipT > 0 ? 0.5 + Math.sin(globalT * 25) * 0.3 : 0.15 + Math.sin(globalT * 2) * 0.1);
  if (foxFx.tailT > 0) tailUp = 1;
  drawFoxBody(c, x, y - (foxFx.yipT > 0 ? Math.sin(foxFx.yipT * 9) * viewH * 0.01 : 0), s, fox.facing, 'sit', 0, tailUp);
  if (foxFx.tailT > 0 || celebrating) artGlow(c, x - fox.facing * s * 0.3, y - s * 0.7, s * 0.5, '#7cffc4', 0.35);
}
