'use strict';

// Porolaakso: ratsastus. Kolme poroa seuraa; revontulipulssi pelästyttää
// ne kivien taa. Napauta piilossa olevaa poroa. Vie kaikki aitaukseen.
// Ei sydämiä.

var REIN_N = 3;
var reinDeer = [];
var reinRocks = [];
var reinPen = { fx: 0.94, x: 0 };
var reinPulseT = 4.2;
var reinRockDefs = [0.16, 0.30, 0.46, 0.60, 0.74, 0.86];
var reinStart = [{ fx: 0.10, fy: 0.28 }, { fx: 0.14, fy: 0.62 }, { fx: 0.18, fy: 0.45 }];

function reinPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initReindeer() {
  var i;
  tasks = [makeTask(0.36, 'give'), makeTask(0.68, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  reinRocks = [];
  for (i = 0; i < reinRockDefs.length; i++) {
    reinRocks.push({ x: reinRockDefs[i] * worldW, y: groundTop + viewH * 0.02 });
  }
  reinPen.x = reinPen.fx * worldW;
  reinDeer = [];
  for (i = 0; i < REIN_N; i++) {
    reinDeer.push({
      x: reinStart[i].fx * worldW, y: reinPathY(reinStart[i].fy),
      tx: 0, ty: 0, state: 'follow', hop: 0, rock: -1, facing: 1, idleT: 1 + i,
      shakeT: 0, noseT: 0
    });
    reinDeer[i].tx = reinDeer[i].x;
    reinDeer[i].ty = reinDeer[i].y;
  }
  reinPulseT = 4.2;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.22;
  unicorn.y = unicorn.ty = reinPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  reinSetupProps();
  renderBackground();
  playNote(392, 0, 0.22, 'sine', 0.3);
  playNote(523, 0.12, 0.28, 'triangle', 0.3);
}

function respawnReindeer() {}

function resizeReindeer(ratio) {
  var i;
  for (i = 0; i < reinDeer.length; i++) { reinDeer[i].x *= ratio; reinDeer[i].tx *= ratio; }
  for (i = 0; i < reinRocks.length; i++) reinRocks[i].x = reinRockDefs[i] * worldW;
  reinPen.x = reinPen.fx * worldW;
  reinSetupProps();
}

// Tökättävät koristeet: porot (sarvet tärisevät, huurteinen pärskähdys; joka
// kolmas tökkäys sytyttää punaisen kuonon), lumiukko (viides tökkäys aivastaa),
// kota (savurengas) ja lähikuusi (lumitupsu).
function reinSetupProps() {
  var i, h = viewH, w = worldW;
  propsReset();
  for (i = 0; i < reinDeer.length; i++) reinDeerProp(reinDeer[i]);
  voyPineProp(w * 0.05, groundTop, h * 0.14, '#1a3850');
  reinKotaProp(w * 0.88, groundTop + h * 0.01, h * 0.16, 0);
  reinSnowmanProp(w * 0.24, groundTop - h * 0.01, h * 0.08);
}

// Poron osuma-alue seuraa poroa; piilossa oleva poro ei ole tökättävä
// (sen napautus on pelimekaniikkaa ja käsitellään ennen koristeita).
function reinDeerProp(b) {
  propAdd({
    x: b.x, y: b.y, r: viewH * 0.06, hy: viewH * 0.045, color: '#f0d2aa', note: 587,
    draw: function () {},
    update: function (p, dt) {
      p.x = (b.state === 'hid' || b.state === 'hiding') ? -1e6 : b.x;
      p.y = b.y;
      if (b.shakeT > 0) b.shakeT -= dt;
      if (b.noseT > 0) b.noseT -= dt;
    },
    poke: function (p) {
      b.shakeT = 0.7;
      spawnSparkles(b.x + b.facing * viewH * 0.062, b.y - viewH * 0.044, 5, '#ffffff');
      playNote(196, 0, 0.1, 'triangle', 0.2);
      if (p.n % 3 === 0) {
        b.noseT = 2.2;
        playNote(784, 0.1, 0.15, 'sine', 0.25);
        playNote(1047, 0.25, 0.3, 'sine', 0.25);
      }
    }
  });
}

function reinSnowmanProp(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.7, hy: s * 0.25, color: '#ffffff', note: 523, amp: 0.1,
    draw: function (c) { drawNorthSnowman(c, 0, 0, s); },
    poke: function (p) {
      var k;
      if (p.n % 5 === 0) {
        // Aivastus: lumi pöllähtää ja ääni laskee
        for (k = 0; k < 4; k++) voySnowPuff(p.x + (k - 1.5) * s * 0.14, p.y - s * 0.5, s * 0.05, p.y + s * 0.15);
        playNote(880, 0, 0.08, 'sine', 0.2);
        playNote(660, 0.08, 0.08, 'sine', 0.2);
        playNote(330, 0.16, 0.3, 'triangle', 0.3);
      } else voySnowPuff(p.x + (Math.random() - 0.5) * s * 0.3, p.y - s * 0.6, s * 0.05, p.y + s * 0.15);
    }
  });
}

// Sydänpolku savurenkaalle (yllätys muissa kentissä)
function reinHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.4);
  c.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  c.closePath();
}

// Kota: tökkäys puhaltaa savupiipusta renkaan, joka nousee, laajenee ja
// haihtuu. heartEvery > 0: joka n:s rengas on sydän (Revontulimaan yhteinen).
function reinKotaProp(x, baseY, s, heartEvery) {
  propAdd({
    x: x, y: baseY, r: s * 0.6, hy: s * 0.5, color: '#ffd24f', note: 349, amp: 0.05, rings: [],
    draw: function (c, p) {
      var k, rg, ry, rs;
      drawNorthKota(c, 0, 0, s);
      for (k = 0; k < p.rings.length; k++) {
        rg = p.rings[k];
        ry = -s * 1.08 - rg.t * s * 0.5;
        rs = s * (0.07 + rg.t * 0.1);
        c.globalAlpha = Math.max(0, 1 - rg.t / 1.6) * 0.75;
        c.lineCap = 'round';
        if (rg.heart) reinHeartPath(c, Math.sin(rg.t * 2) * s * 0.05, ry, rs);
        else {
          c.beginPath();
          if (c.ellipse) c.ellipse(Math.sin(rg.t * 2) * s * 0.05, ry, rs, rs * 0.45, 0, 0, Math.PI * 2);
          else c.arc(0, ry, rs, 0, Math.PI * 2);
        }
        c.strokeStyle = '#8aa0b4';
        c.lineWidth = Math.max(3, s * 0.06);
        c.stroke();
        c.strokeStyle = '#eef4fa';
        c.lineWidth = Math.max(1.5, s * 0.03);
        c.stroke();
      }
      c.globalAlpha = 1;
    },
    update: function (p, dt) {
      var k;
      for (k = p.rings.length - 1; k >= 0; k--) {
        p.rings[k].t += dt;
        if (p.rings[k].t > 1.6) p.rings.splice(k, 1);
      }
    },
    poke: function (p) {
      var heart = heartEvery > 0 && p.n % heartEvery === 0;
      if (p.rings.length < 4) p.rings.push({ t: 0, heart: heart });
      if (heart) {
        playNote(659, 0, 0.18, 'sine', 0.22);
        playNote(988, 0.14, 0.3, 'sine', 0.22);
      }
    }
  });
}

function reinHomeCount() {
  var i, n = 0;
  for (i = 0; i < reinDeer.length; i++) if (reinDeer[i].state === 'home') n++;
  return n;
}

function reinNearestRock(x) {
  var i, best = 0, bd = 1e9, d;
  for (i = 0; i < reinRocks.length; i++) {
    d = Math.abs(reinRocks[i].x - x);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function reinScare(b) {
  b.state = 'hiding';
  b.rock = reinNearestRock(b.x + (Math.random() - 0.5) * viewW * 0.15);
  b.tx = reinRocks[b.rock].x;
  b.ty = groundTop + viewH * 0.03;
}

function handleReindeerTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, b, dx, dy;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state !== 'hid') continue;
    dx = wx - b.x; dy = py - b.y;
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      b.state = 'follow';
      spawnSparkles(b.x, b.y, 8, '#ffe27a');
      playNote(660, 0, 0.12, 'sine', 0.3);
      return;
    }
  }
  // Ei osunut piilossa olevaan poroon: koriste saa heilahtaa, ratsastus jatkuu kuten ennen
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateReindeer(dt) {
  var i, b, dx, dy, dist, step, busy, spd;
  updateTasks(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  northRideUnicorn(dt, busy);
  if (!busy && !celebrating) {
    reinPulseT -= dt;
    if (reinPulseT <= 0) {
      reinPulseT = 5.2 + Math.random() * 1.4;
      spawnSparkles(unicorn.x, viewH * 0.2, 16, '#7cffc4');
      playNote(330, 0, 0.18, 'sine', 0.25);
      for (i = 0; i < reinDeer.length; i++) {
        b = reinDeer[i];
        if (b.state === 'follow' && Math.abs(b.x - unicorn.x) < viewW * 0.32) reinScare(b);
      }
    }
  }
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    b.hop += dt * 8;
    if (b.state === 'follow') {
      b.tx = Math.max(viewW * 0.08, unicorn.x - unicorn.facing * viewH * (0.14 + i * 0.09));
      b.ty = unicorn.y + (i - 1) * viewH * 0.03;
    } else if (b.state === 'free') {
      b.idleT -= dt;
      if (b.idleT <= 0) {
        b.tx = b.x + (Math.random() - 0.5) * viewW * 0.12;
        b.ty = reinPathY(0.2 + Math.random() * 0.6);
        b.idleT = 1.4 + Math.random();
      }
    }
    dx = b.tx - b.x; dy = b.ty - b.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    spd = b.state === 'hiding' ? viewW * 0.32 : viewW * 0.22;
    if (dist > 4) {
      step = Math.min(spd * dt, dist);
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
      if (Math.abs(dx) > 3) b.facing = dx > 0 ? 1 : -1;
    } else if (b.state === 'hiding') b.state = 'hid';
    if (b.state === 'follow' && Math.abs(b.x - reinPen.x) < viewH * 0.12 && Math.abs(unicorn.x - reinPen.x) < viewH * 0.16) {
      b.state = 'home';
      spawnSparkles(reinPen.x, groundTop, 10, '#ffe27a');
      playNote(784, 0, 0.2, 'triangle', 0.35);
    }
  }
  if (!celebrating && reinHomeCount() === REIN_N) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function reindeerLayers() {
  return [
    { speed: 0.22, render: renderReindeerFar },
    { speed: 0.55, render: renderReindeerMid },
    { speed: 1, render: renderReindeerNear }
  ];
}
function renderReindeerBg(b, w, h) {
  renderReindeerFar(b, w, h); renderReindeerMid(b, w, h); renderReindeerNear(b, w, h);
}
function renderReindeerFar(b, w, h) { renderNorthSky(b, w, h); }
function renderReindeerMid(b, w, h) {
  var i;
  renderNorthHills(b, w, h);
  for (i = 0; i < 6; i++) drawNorthPine(b, w * (0.07 + i * 0.16), groundTop - h * 0.01, h * 0.17, '#1a3850');
}
function renderReindeerNear(b, w, h) {
  var i, x;
  renderNorthGround(b, w, h);
  b.fillStyle = 'rgba(190,215,230,0.4)';
  for (i = 0; i < 18; i++) {
    x = (i * 211.3) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, groundTop + h * 0.07 + (i % 3) * h * 0.018, h * 0.014, h * 0.007, 0, 0, Math.PI * 2);
    else b.arc(x, groundTop + h * 0.08, h * 0.008, 0, Math.PI * 2);
    b.fill();
  }
  // Lähikuusi, kota ja lumiukko ovat tökättäviä koristeita (reinSetupProps)
}

function drawDeerAntler(c, x, y, s, dir) {
  var col = '#d8b888';
  artLimb(c, x, y, x + dir * s * 0.05, y - s * 0.4, s * 0.075, col);
  artLimb(c, x + dir * s * 0.02, y - s * 0.16, x + dir * s * 0.28, y - s * 0.3, s * 0.055, col);
  artLimb(c, x + dir * s * 0.03, y - s * 0.28, x + dir * s * 0.1, y - s * 0.52, s * 0.05, col);
}

// fx (valinnainen): poro-olio, jonka shakeT tärisyttää sarvia ja noseT hehkuttaa kuonon
function drawNorthDeer(c, x, y, s, facing, hop, fx) {
  var body = '#b06a38', cream = '#f0d2aa', shake = fx && fx.shakeT > 0, nose = fx && fx.noseT > 0;
  c.save();
  c.translate(x, y);
  artShadow(c, 0, s * 0.08, s * 1.15, s * 0.28, 0.16);
  c.translate(0, -Math.sin(hop) * s * 0.08);
  c.scale(facing, 1);
  artLimb(c, -s * 0.28, -s * 0.18, -s * 0.36, s * 0.1, s * 0.11, '#8a5228');
  artLimb(c, s * 0.18, -s * 0.16, s * 0.28, s * 0.1, s * 0.11, '#8a5228');
  artLimb(c, -s * 0.1, -s * 0.12, -s * 0.16, s * 0.14, s * 0.12, body);
  artLimb(c, s * 0.36, -s * 0.1, s * 0.4, s * 0.14, s * 0.12, body);
  artCircle(c, -s * 0.52, -s * 0.42, s * 0.1, cream, { hi: 0.3 });
  artBlob(c, 0, -s * 0.4, s * 0.58, s * 0.34, body, { hi: 0.28 });
  artBlob(c, s * 0.06, -s * 0.24, s * 0.3, s * 0.15, cream, { line: false });
  artLimb(c, s * 0.36, -s * 0.5, s * 0.56, -s * 0.74, s * 0.17, body);
  if (shake) {
    c.save();
    c.translate(s * 0.54, -s * 0.84);
    c.rotate(Math.sin(globalT * 40) * 0.18 * Math.min(1, fx.shakeT / 0.3));
    c.translate(-s * 0.54, s * 0.84);
  }
  drawDeerAntler(c, s * 0.46, -s * 0.9, s, -1);
  drawDeerAntler(c, s * 0.62, -s * 0.9, s, 1);
  if (shake) c.restore();
  artBlob(c, s * 0.48, -s * 0.9, s * 0.07, s * 0.13, body, { rot: -0.45 });
  artBlob(c, s * 0.66, -s * 0.9, s * 0.07, s * 0.13, body, { rot: 0.4 });
  artBlob(c, s * 0.58, -s * 0.74, s * 0.24, s * 0.2, body, { hi: 0.3 });
  artBlob(c, s * 0.78, -s * 0.64, s * 0.15, s * 0.11, cream, { hi: 0.25 });
  if (nose) {
    // Yllätys: punainen hehkuva kuono hetken ajan
    artGlow(c, s * 0.88, -s * 0.62, s * 0.16, '#ff3a4a', (0.45 + Math.sin(globalT * 8) * 0.15) * Math.min(1, fx.noseT / 0.4));
    artCircle(c, s * 0.88, -s * 0.62, s * 0.05, '#ff3a4a', { lineColor: '#9a1a28', hi: 0.5 });
  } else artCircle(c, s * 0.88, -s * 0.62, s * 0.04, '#6a3018', { line: false });
  artEye(c, s * 0.6, -s * 0.78, s * 0.055, 0.35, false);
  artBlush(c, s * 0.7, -s * 0.68, s * 0.05);
  c.restore();
}

function drawNorthPen(c, x, y, s) {
  var i, px;
  artShadow(c, x, y + s * 0.12, s * 1.15, s * 0.28, 0.12);
  for (i = 0; i < 3; i++) {
    artRoundRect(c, x - s * 0.55, y - s * 0.52 + i * s * 0.2, s * 1.35, s * 0.07, s * 0.035, '#c48a48', {});
  }
  for (i = 0; i < 4; i++) {
    px = x - s * 0.5 + i * s * 0.38;
    artRoundRect(c, px - s * 0.055, y - s * 0.78, s * 0.11, s * 0.88, s * 0.04, '#a86e38', {});
    artBlob(c, px, y - s * 0.82, s * 0.09, s * 0.055, '#ffffff', { shadeTo: '#e8f0f8', lineColor: '#c8d4e0' });
  }
}

function drawReindeer() {
  var i, r, b, us, hid, hx, hy, order = [];
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  propsDraw(ctx);
  drawNorthPen(ctx, reinPen.x - camX, groundTop + viewH * 0.02, viewH * 0.12);
  us = viewH / 800;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state === 'hid' || b.state === 'hiding') continue;
    order.push({ y: b.y, d: b });
  }
  order.push({ y: unicorn.y, u: true });
  order.sort(function (a, c2) { return a.y - c2.y; });
  for (i = 0; i < order.length; i++) {
    if (order[i].u) {
      drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
    } else {
      b = order[i].d;
      drawNorthDeer(ctx, b.x - camX, b.y, viewH * 0.07, b.facing, b.hop, b);
    }
  }
  for (i = 0; i < reinRocks.length; i++) {
    hid = null;
    for (r = 0; r < reinDeer.length; r++) {
      b = reinDeer[r];
      if ((b.state === 'hid' || b.state === 'hiding') && b.rock === i) hid = b;
    }
    if (hid) {
      drawNorthDeer(ctx, hid.x - camX, hid.y + (hid.state === 'hid' ? viewH * 0.012 : 0),
        viewH * (hid.state === 'hid' ? 0.055 : 0.07), hid.facing, hid.state === 'hid' ? 0 : hid.hop);
    }
    drawNorthRock(ctx, reinRocks[i].x - camX, groundTop + viewH * 0.02, viewH * 0.075);
    if (hid && hid.state === 'hid') {
      hx = hid.x - camX;
      hy = groundTop - viewH * 0.09 + Math.sin(globalT * 3) * viewH * 0.006;
      // Huutomerkki piilossa olevan poron kohdalla: reunaviivalla tarrakirja-ilmeeseen
      artRoundRect(ctx, hx - 3, hy, 6, viewH * 0.028, 3, '#ff5f7e', { lineColor: '#b03050', line: 1.4 });
      artCircle(ctx, hx, hy + viewH * 0.038, 3.5, '#ff5f7e', { lineColor: '#b03050', line: 1.4 });
    }
  }
  drawParticlesLayer(ctx);
  if (!celebrating) {
    hid = null;
    for (i = 0; i < reinDeer.length; i++) {
      if (reinDeer[i].state === 'hid' || reinDeer[i].state === 'hiding') { hid = reinDeer[i]; break; }
    }
    if (hid) drawEdgeArrow(ctx, hid.x);
    else if (reinHomeCount() < REIN_N) drawEdgeArrow(ctx, reinPen.x);
  }
  endPlayWorld();
  drawPickupHud(ctx, REIN_N, function (k) { return reinDeer[k] && reinDeer[k].state === 'home'; },
    function (c, x, y, sz) { drawNorthDeer(c, x, y + sz * 0.3, sz * 0.55, 1, 0); });
  drawTaskOverlay(ctx);
}
