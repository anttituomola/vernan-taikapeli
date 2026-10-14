'use strict';

// Porolaakso: ratsastus. Viisi poroa laiduntaa pitkin laaksoa (kaksi kurkistaa
// kiven takaa, vain sarvet näkyvät). Ratsasta poron luo tai napauta sitä: poro
// pomppaa ja liittyy jonoon yksisarvisen perään. Jono seuraa minne ratsastat;
// aitauksen luona porot hyppäävät yksi kerrallaan sisään. Ei sydämiä, ei
// säikähtelyä: helppo ja pitkä kenttä.

var REIN_N = 5;
var reinDeer = [];
var reinRocks = [];
var reinTrain = [];      // jonossa kulkevat porot liittymisjärjestyksessä
var reinPen = { fx: 0.94, x: 0 };
var reinDefs = [
  { fx: 0.13, fy: 0.35, rock: false }, { fx: 0.25, fy: 0, rock: true },
  { fx: 0.47, fy: 0.62, rock: false }, { fx: 0.58, fy: 0, rock: true },
  { fx: 0.82, fy: 0.45, rock: false }
];
var reinRockDefs = [0.25, 0.40, 0.58, 0.76];

function reinPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}
// Poron laidunpaikka: kiven takana lähellä polun yläreunaa, muuten polulla
function reinHomeSpot(i) {
  var d = reinDefs[i];
  return { x: d.fx * worldW, y: d.rock ? groundTop + viewH * 0.012 : reinPathY(d.fy) };
}

function initReindeer() {
  var i, sp;
  tasks = [makeTask(0.36, 'give'), makeTask(0.68, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  reinRocks = [];
  for (i = 0; i < reinRockDefs.length; i++) {
    reinRocks.push({ x: reinRockDefs[i] * worldW, y: groundTop + viewH * 0.02 });
  }
  reinPen.x = reinPen.fx * worldW;
  reinDeer = [];
  reinTrain = [];
  for (i = 0; i < REIN_N; i++) {
    sp = reinHomeSpot(i);
    reinDeer.push({
      x: sp.x, y: sp.y, tx: sp.x, ty: sp.y, hx: sp.x, hy: sp.y,
      state: reinDefs[i].rock ? 'hid' : 'graze', hop: 0, jumpT: 0, rock: reinDefs[i].rock ? reinNearestRock(sp.x) : -1,
      facing: i % 2 ? -1 : 1, idleT: 1 + i * 0.4, shakeT: 0, noseT: 0, slot: 0
    });
  }
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.08;
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
  var i, sp;
  for (i = 0; i < reinRocks.length; i++) reinRocks[i].x = reinRockDefs[i] * worldW;
  for (i = 0; i < reinDeer.length; i++) {
    sp = reinHomeSpot(i);
    reinDeer[i].hx = sp.x; reinDeer[i].hy = sp.y;
    reinDeer[i].x *= ratio; reinDeer[i].tx *= ratio;
  }
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
  reinSnowmanProp(w * 0.31, groundTop - h * 0.01, h * 0.08);
}

// Poron osuma-alue seuraa poroa; laiduntava tai piilossa oleva poro ei ole
// tökättävä (sen napautus kutsuu poron jonoon ennen koristeita).
function reinDeerProp(b) {
  propAdd({
    x: b.x, y: b.y, r: viewH * 0.06, hy: viewH * 0.045, color: '#f0d2aa', note: 587,
    draw: function () {},
    update: function (p, dt) {
      p.x = (b.state === 'hid' || b.state === 'graze') ? -1e6 : b.x;
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
function reinFoundCount() {
  var i, n = 0;
  for (i = 0; i < reinDeer.length; i++) if (reinDeer[i].state !== 'graze' && reinDeer[i].state !== 'hid') n++;
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

// Poro löytyi: pomppaa ilosta ja liittyy jonon perään
function reinJoin(b) {
  b.state = 'follow';
  b.jumpT = 0.6;
  reinTrain.push(b);
  spawnSparkles(b.x, b.y - viewH * 0.06, 12, '#ffe27a');
  playNote(523 + reinTrain.length * 66, 0, 0.12, 'triangle', 0.3);
  playNote(784 + reinTrain.length * 66, 0.1, 0.2, 'triangle', 0.3);
}

function handleReindeerTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, b, dx, dy, hy;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state !== 'graze' && b.state !== 'hid') continue;
    // Piilossa olevasta porosta näkyvät sarvet kiven yllä: osuma-alue niiden kohdalla
    hy = b.state === 'hid' ? b.y - viewH * 0.06 : b.y - viewH * 0.04;
    dx = wx - b.x; dy = py - hy;
    if (dx * dx + dy * dy < viewH * 0.11 * viewH * 0.11) { reinJoin(b); return; }
  }
  // Ei osunut löytämättömään poroon: koriste saa heilahtaa, ratsastus jatkuu
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateReindeer(dt) {
  var i, b, dx, dy, dist, step, busy, spd, lead, gap, atPen, slot;
  updateTasks(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  // Yksisarvinen pysähtyy aitauksen eteen, jotta porot näkyvät hyppäämässä sisään
  unicorn.tx = Math.min(unicorn.tx, reinPen.x - viewH * 0.24);
  northRideUnicorn(dt, busy);
  atPen = unicorn.x > reinPen.x - viewH * 0.45;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.jumpT > 0) b.jumpT -= dt;
    // Ratsasta lähelle: löytämätön poro huomaa yksisarvisen
    if ((b.state === 'graze' || b.state === 'hid') && !busy && !celebrating &&
        Math.abs(unicorn.x - b.x) < viewH * 0.17 && Math.abs(unicorn.y - b.y) < viewH * 0.16) reinJoin(b);
    if (b.state === 'graze') {
      // Laidunnus: pieniä askelia kotipaikan ympärillä
      b.idleT -= dt;
      if (b.idleT <= 0) {
        b.tx = b.hx + (Math.random() - 0.5) * viewH * 0.2;
        b.ty = Math.min(Math.max(b.hy + (Math.random() - 0.5) * viewH * 0.06, groundTop + viewH * 0.02), groundBottom - viewH * 0.01);
        b.idleT = 1.6 + Math.random() * 1.4;
      }
    }
  }
  // Jono: jokainen poro seuraa edellistä (ensimmäinen yksisarvista)
  slot = 0;
  for (i = 0; i < reinTrain.length; i++) {
    b = reinTrain[i];
    if (b.state !== 'follow') continue;
    if (atPen && !busy && !celebrating) {
      // Aitaus: porot hyppäävät sisään yksi kerrallaan omille paikoilleen
      b.state = 'enter';
      b.slot = reinHomeCount() + slot;
      slot++;
      b.tx = reinPen.x - viewH * 0.05 + (b.slot % 3) * viewH * 0.08;
      b.ty = groundTop + viewH * (0.005 + Math.floor(b.slot / 3) * 0.035);
      b.jumpT = 0.6;
      continue;
    }
    lead = i === 0 ? null : reinTrain[i - 1];
    gap = viewH * (i === 0 ? 0.16 : 0.12);
    if (lead && lead.state === 'follow') {
      b.tx = lead.x - lead.facing * gap;
      b.ty = lead.y + viewH * 0.01;
    } else {
      b.tx = unicorn.x - unicorn.facing * gap;
      b.ty = unicorn.y + viewH * 0.01;
    }
    b.tx = Math.max(viewW * 0.03, b.tx);
    b.ty = Math.min(Math.max(b.ty, groundTop + viewH * 0.01), groundBottom);
  }
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (busy && b.state !== 'graze') continue;
    dx = b.tx - b.x; dy = b.ty - b.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    spd = b.state === 'graze' ? viewW * 0.04 : viewW * 0.3;
    if (b.state === 'hid') spd = 0;
    if (dist > 4 && spd > 0) {
      step = Math.min(spd * dt, dist);
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
      if (Math.abs(dx) > 3) b.facing = dx > 0 ? 1 : -1;
      b.hop += dt * (b.state === 'graze' ? 3 : 9);
    } else if (b.state === 'enter') {
      b.state = 'home';
      b.facing = -1;
      spawnSparkles(b.x, b.y - viewH * 0.05, 12, '#ffe27a');
      playNote(659 + reinHomeCount() * 80, 0, 0.2, 'triangle', 0.35);
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
  var i, r, b, us, hid, hx, hy, order = [], miss, best, jump;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  propsDraw(ctx);
  // Aitauksessa olevat porot piirretään aidan taakse
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state === 'home') drawNorthDeer(ctx, b.x - camX, b.y - Math.abs(Math.sin(globalT * 3 + i)) * viewH * 0.01, viewH * 0.07, b.facing, 0, b);
  }
  drawNorthPen(ctx, reinPen.x - camX, groundTop + viewH * 0.06, viewH * 0.2);
  us = viewH / 800;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state === 'hid' || b.state === 'home') continue;
    order.push({ y: b.y, d: b });
  }
  order.push({ y: unicorn.y, u: true });
  order.sort(function (a, c2) { return a.y - c2.y; });
  for (i = 0; i < order.length; i++) {
    if (order[i].u) {
      drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
    } else {
      b = order[i].d;
      jump = b.jumpT > 0 ? Math.sin((0.6 - b.jumpT) / 0.6 * Math.PI) * viewH * 0.06 : 0;
      drawNorthDeer(ctx, b.x - camX, b.y - jump, viewH * 0.07, b.facing, b.state === 'graze' ? 0 : b.hop, b);
      if (b.state === 'graze') {
        // Laiduntava poro odottaa: sydänkupla pään yllä kertoo, että sen voi hakea
        hx = b.x - camX + b.facing * viewH * 0.05;
        hy = b.y - viewH * 0.15 + Math.sin(globalT * 3 + i) * viewH * 0.006;
        artCircle(ctx, hx, hy, viewH * 0.036, '#ffffff', { lineColor: '#9ab4c8', hi: 0.2 });
        drawHeartShape(ctx, hx, hy + viewH * 0.003, viewH * 0.017, true);
      }
    }
  }
  for (i = 0; i < reinRocks.length; i++) {
    hid = null;
    for (r = 0; r < reinDeer.length; r++) {
      b = reinDeer[r];
      if (b.state === 'hid' && b.rock === i) hid = b;
    }
    if (hid) {
      // Kiven takaa näkyvät sarvet ja korvat: piilo on hauska, ei salaisuus
      drawNorthDeer(ctx, hid.x - camX - hid.facing * viewH * 0.02, hid.y + viewH * 0.01 - Math.abs(Math.sin(globalT * 1.6 + i)) * viewH * 0.012,
        viewH * 0.06, hid.facing, 0, hid);
    }
    drawNorthRock(ctx, reinRocks[i].x - camX, groundTop + viewH * 0.02, viewH * 0.075);
  }
  drawParticlesLayer(ctx);
  if (!celebrating) {
    // Nuoli lähimpään löytämättömään poroon, muuten aitaukselle
    best = null;
    for (i = 0; i < reinDeer.length; i++) {
      miss = reinDeer[i];
      if (miss.state !== 'graze' && miss.state !== 'hid') continue;
      if (!best || Math.abs(miss.x - unicorn.x) < Math.abs(best.x - unicorn.x)) best = miss;
    }
    if (best) drawEdgeArrow(ctx, best.x);
    else drawEdgeArrow(ctx, reinPen.x);
  }
  endPlayWorld();
  drawPickupHud(ctx, REIN_N, function (k) { return k < reinFoundCount(); },
    function (c, x, y, sz) { drawNorthDeer(c, x - sz * 0.3, y + sz * 0.55, sz * 0.9, 1, 0); });
  drawTaskOverlay(ctx);
}
