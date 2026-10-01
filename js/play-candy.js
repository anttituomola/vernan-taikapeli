'use strict';

// Karkkilaakso: tasohyppely vaahtokarkkitasoilla. Osa tasoista pomputtaa
// korkealle, kuulakarkit vierivät maassa ja kuiluissa on limonadia. Sydämet käytössä.

var CANDY_COUNT = 10;
var candies = [];
var gumballs = [];
var candyGround = [[0.0, 0.18], [0.21, 0.40], [0.43, 0.62], [0.65, 0.84], [0.87, 1.0]];
var candyDoor = { fx: 0.965, x: 0, open: false };
var candyLiquidY = 0;
var candyDefs = [
  { fx: 0.08, fy: 0.30 }, { fx: 0.195, fy: 0.30 }, { fx: 0.24, fy: 0.46 }, { fx: 0.32, fy: 0.34 },
  { fx: 0.415, fy: 0.30 }, { fx: 0.52, fy: 0.32 }, { fx: 0.58, fy: 0.46 }, { fx: 0.635, fy: 0.30 },
  { fx: 0.74, fy: 0.34 }, { fx: 0.80, fy: 0.46 }
];
var CANDY_COLORS = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff'];
var candyTapSeen = 0;     // viimeksi käsitelty kosketuksen alkuhetki (juoksukentällä ei ole tap-koukkua)

function layoutCandy() {
  var g = groundTop, i, seg;
  platforms = [];
  for (i = 0; i < candyGround.length; i++) {
    seg = candyGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: g, w: (seg[1] - seg[0]) * worldW });
  }
  platforms.push({ kind: 'ledge', x: worldW * 0.10, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.30, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.50, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.72, y: g - viewH * 0.20, w: worldW * 0.05 });
  // Pomppivat vaahtokarkit: niiltä pääsee korkealla oleviin karkkeihin
  platforms.push({ kind: 'bounce', x: worldW * 0.24 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  platforms.push({ kind: 'bounce', x: worldW * 0.58 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  platforms.push({ kind: 'bounce', x: worldW * 0.80 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  candyLiquidY = g + viewH * 0.06;
  candyDoor.x = candyDoor.fx * worldW;
  candyProps();
}

function initCandy() {
  var i;
  layoutCandy();
  tasks = [makeTask(0.34, 'puzzle'), makeTask(0.70, 'shadow')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.45, 0.78]);
  candies = [];
  for (i = 0; i < CANDY_COUNT; i++) {
    candies.push({
      ax: candyDefs[i].fx * worldW, ay: groundTop - candyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: CANDY_COLORS[i % CANDY_COLORS.length]
    });
  }
  gumballs = [
    { zA: 0.22, zB: 0.39, x: 0.30 * worldW, dir: 1, rot: 0, spin: 0, pokeT: 0, color: '#5fa8ff' },
    { zA: 0.66, zB: 0.83, x: 0.74 * worldW, dir: -1, rot: 0, spin: 0, pokeT: 0, color: '#ff5f7e' }
  ];
  candyDoor.open = false;
  candyTapSeen = holdStartG;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(659, 0, 0.2, 'triangle', 0.35);
  playNote(880, 0.1, 0.2, 'triangle', 0.35);
  playNote(1047, 0.2, 0.3, 'triangle', 0.35);
}

function respawnCandy() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function respawnCandyPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < candyGround.length; i++) {
    var end = candyGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  resetPrincess(best > 0 ? best - viewH * 0.09 : checkpoint.x, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffb3d9');
}

function resizeCandy(ratio) {
  var i;
  princess.x *= ratio;
  layoutCandy();
  for (i = 0; i < candies.length; i++) {
    candies[i].ax = candyDefs[i].fx * worldW;
    candies[i].ay = groundTop - candyDefs[i].fy * viewH;
  }
  for (i = 0; i < gumballs.length; i++) gumballs[i].x *= ratio;
}

function collectCandy(cd) {
  cd.collected = true;
  registerCollected(cd);
  spawnSparkles(cd.ax, cd.ay, 14, cd.color);
  playNote(800 + countCollected(candies) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1200 + countCollected(candies) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(candies) === CANDY_COUNT && !candyDoor.open) {
    candyDoor.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function candyFell() {
  spawnSparkles(princess.x, candyLiquidY, 14, '#ffb3d9');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) respawnCandyPitEdge();
}

function updateCandy(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();
  candyPollTap();

  platformerStep(dt, {
    runSp: viewW * 0.22,
    fallY: candyLiquidY,
    onFall: function () { candyFell(); },
    onBounce: function (pl) {
      pl.squish = 0.3;
      playNote(523, 0, 0.1, 'sine', 0.3);
      playNote(1047, 0.06, 0.2, 'sine', 0.3);
      spawnSparkles(princess.x, pl.y, 8, '#ffffff');
    }
  });
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce' && platforms[i].squish > 0) platforms[i].squish -= dt;
  }
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < candies.length; i++) {
    var cd = candies[i];
    if (cd.collected) continue;
    cd.phase += dt * 2;
    var dx = cd.ax - princess.x, dy = (cd.ay + Math.sin(cd.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectCandy(cd);
  }

  // Kuulakarkit vierivät maassa: hyppää yli
  for (i = 0; i < gumballs.length; i++) {
    var gb = gumballs[i];
    if (gb.pokeT > 0) { gb.pokeT -= dt; gb.spin += dt * 14 * gb.dir; } // tökätty: pyörähtää vauhdilla (koriste)
    if (!busy && !celebrating) {
      gb.x += gb.dir * viewW * 0.07 * dt;
      gb.rot += gb.dir * dt * 4;
      if (gb.x < gb.zA * worldW) { gb.x = gb.zA * worldW; gb.dir = 1; }
      if (gb.x > gb.zB * worldW) { gb.x = gb.zB * worldW; gb.dir = -1; }
    }
    if (!celebrating && Math.abs(gb.x - princess.x) < viewH * 0.06 && princess.y > groundTop - viewH * 0.07) {
      if (loseHeart()) {
        princess.knockVx = (princess.x < gb.x ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.3;
      }
    }
  }

  if (candyDoor.open && !celebrating && Math.abs(princess.x - candyDoor.x) < viewH * 0.07) {
    startCelebration();
  }

  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function candyLayers() {
  return [
    { speed: 0.22, render: renderCandyFar },
    { speed: 0.55, render: renderCandyMid },
    { speed: 1, render: renderCandyNear }
  ];
}
function renderCandyBg(b, w, h) {
  renderCandyFar(b, w, h);
  renderCandyMid(b, w, h);
  renderCandyNear(b, w, h);
}
function renderCandyFar(b, w, h) {
  var i;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ffb8dd');
  sky.addColorStop(0.55, '#ffeef7');
  sky.addColorStop(1, '#ffe4c8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.2, h * 0.16, h * 0.065, 0.22, '#fff0c8', '#ffffff', '#ffd45a');
  for (i = 0; i < 8; i++) drawCloud(b, w * (0.04 + i * 0.125), h * (0.1 + (i % 3) * 0.07), h * 0.03, 0.8);
}
function renderCandyMid(b, w, h) {
  var i, x, horizon = h * 0.66;
  for (i = 0; i < 9; i++) {
    x = w * (0.05 + i * 0.115);
    var r = h * (0.12 + (i % 3) * 0.04);
    b.beginPath(); b.arc(x, horizon + r * 0.3, r, Math.PI, 0); b.closePath();
    // Kaukaiset karkkikukkulat sävytetään taivaaseen (ilmaperspektiivi), ei reunaviivaa
    artFillPath(b, artMix(i % 2 ? '#ffb3d9' : '#c9a0ff', '#ffeef7', 0.3), horizon - r, horizon + r * 0.3, r, { line: false });
  }
}
function renderCandyNear(b, w, h) {
  var i, x, seg;
  var liq = b.createLinearGradient(0, groundTop, 0, h);
  liq.addColorStop(0, '#ff9ec6');
  liq.addColorStop(1, '#d94f8a');
  b.fillStyle = liq;
  b.fillRect(0, groundTop + h * 0.03, w, h - groundTop);
  b.fillStyle = 'rgba(255,255,255,0.5)';
  for (i = 0; i < 60; i++) {
    x = (i * 131.3) % w;
    b.beginPath(); b.arc(x, groundTop + h * 0.06 + ((i * 41) % Math.max(1, (h - groundTop - h * 0.08))), h * 0.005 + (i % 3) * h * 0.003, 0, Math.PI * 2); b.fill();
  }
  for (i = 0; i < candyGround.length; i++) {
    seg = candyGround[i];
    drawBiscuitSlab(b, seg[0] * w, groundTop, (seg[1] - seg[0]) * w, h - groundTop, h);
  }
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'ledge') drawMarshmallow(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.055, false, 0);
  }
  for (i = 0; i < 10; i++) {
    if (i % 4 === 0) continue; // puut 0, 4 ja 8 ovat tökättäviä koristeita (candyProps)
    x = w * (0.03 + i * 0.1) + (i % 2) * h * 0.06;
    drawLollipopTree(b, x, groundTop, h * (0.14 + (i % 3) * 0.03), CANDY_COLORS[i % CANDY_COLORS.length], 0);
  }
}

// Keksilaatta: kaksisävyinen täyttö reunaviivalla, vaalea kuorrute yläreunassa
function drawBiscuitSlab(b, x, y, w, hh, h) {
  var i, rr = Math.min(h * 0.015, w / 4);
  roundRect(b, x, y, w, hh, rr);
  artFillPath(b, '#e8c58f', y, y + h * 0.5, Math.min(w, hh) / 2, { lineColor: '#8a5a30', line: Math.max(1.2, h * 0.004), shadeTo: '#b8895a' });
  b.fillStyle = '#fff2d6';
  roundRect(b, x + rr * 0.3, y + h * 0.004, w - rr * 0.6, h * 0.02, h * 0.008);
  b.fill();
  b.fillStyle = 'rgba(120,70,30,0.25)';
  for (i = 0; i < w / (h * 0.06); i++) {
    b.beginPath(); b.arc(x + h * 0.03 + i * h * 0.06, y + h * 0.04, h * 0.004, 0, Math.PI * 2); b.fill();
  }
}

// Vaahtokarkki: valkoinen varjostetaan laventeliin, pomppiva on pinkki ja
// strösselöity. squish litistää (pelkkä piirto).
function drawMarshmallow(b, x, y, w, hh, bouncy, squish) {
  var sq = 1 - squish, top = y - hh * 0.4 * (1 - sq), i;
  var cols = ['#ffe27a', '#6fd66f', '#5fa8ff'];
  artRoundRect(b, x, top, w, hh * sq, hh * 0.45, bouncy ? '#ffb3d9' : '#ffffff',
    bouncy ? { lineColor: '#c9608f' } : { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  b.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(b, x + w * 0.1, top + hh * sq * 0.08, w * 0.8, hh * sq * 0.18, hh * 0.09);
  b.fill();
  if (bouncy) {
    for (i = 0; i < 3; i++) {
      artCircle(b, x + w * (0.25 + i * 0.25), top + hh * sq * 0.55, hh * 0.1, cols[i], { lineColor: artShade(cols[i], -0.45), line: Math.max(1, hh * 0.03) });
    }
  }
}

// Tikkaripuu: tikku, kierrekarkki ja maavarjo. spin kiertää kierrettä
// (tökätty puu pyörähtää). Sama piirto taustalle ja koristeille.
function drawLollipopTree(b, x, baseY, s, color, spin) {
  var a, r, px, py, cy = baseY - s - s * 0.35;
  spin = spin || 0;
  artShadow(b, x, baseY + s * 0.02, s * 0.3, s * 0.07, 0.14);
  artLimb(b, x, baseY, x, baseY - s, s * 0.1, '#ffffff', '#d8b8d0');
  artCircle(b, x, cy, s * 0.4, color, { lineColor: artShade(color, -0.45), hi: 0.3 });
  b.strokeStyle = 'rgba(255,255,255,0.75)';
  b.lineWidth = s * 0.07;
  b.lineCap = 'round';
  b.beginPath();
  for (a = 0; a < Math.PI * 4; a += 0.2) {
    r = s * 0.05 + a / (Math.PI * 4) * s * 0.3;
    px = x + Math.cos(a + spin) * r;
    py = cy + Math.sin(a + spin) * r;
    if (a === 0) b.moveTo(px, py); else b.lineTo(px, py);
  }
  b.stroke();
}

// Tökättävät koristeet: tikkaripuut 0, 4 ja 8 sekä karkkiovi piirretään joka
// ruudulla taustan sijaan, jotta ne heilahtavat napautuksesta. Paikat ovat
// samat kuin taustan puilla; kutsutaan layoutCandysta (init ja resize).
function candyProps() {
  var i, h = viewH, s;
  propsReset();
  for (i = 0; i < 10; i += 4) {
    s = h * (0.14 + (i % 3) * 0.03);
    propAdd({
      x: worldW * (0.03 + i * 0.1) + (i % 2) * h * 0.06, y: groundTop, s: s, col: CANDY_COLORS[i % CANDY_COLORS.length],
      r: s * 0.6, hy: s * 1.35, color: CANDY_COLORS[i % CANDY_COLORS.length], note: 620 + i * 30, spin: 0, spinV: 0,
      draw: function (c, p) { drawLollipopTree(c, 0, 0, p.s, p.col, p.spin); },
      update: function (p, dt) {
        if (p.spinV > 0.01) { p.spin += p.spinV * dt; p.spinV *= Math.max(0, 1 - dt * 2.2); }
      },
      poke: function (p) {
        // Tikkari pyörähtää ja sirottelee pari karkkia maahan
        var j;
        p.spinV = 9;
        spawnSparkles(p.x, p.y - p.s * 1.35, 10, '#ffffff');
        for (j = 0; j < 2; j++) {
          propDropBall(p.x + (j - 0.5) * p.s * 0.5, p.y - p.s * 1.2, p.s * 0.06, CANDY_COLORS[(p.n + j) % CANDY_COLORS.length], p.y + viewH * 0.01);
        }
      }
    });
  }
  propAdd({
    x: candyDoor.x, y: groundTop, r: h * 0.14, hy: h * 0.13, amp: 0.05, color: '#ff8fc0', note: 1047, peek: 0,
    draw: candyDrawDoor,
    update: function (p, dt) { if (p.peek > 0) { p.peek += dt; if (p.peek > 2.2) p.peek = 0; } },
    poke: candyDoorPoke
  });
}

function candyDoorPoke(p) {
  // Ovikello kilisee; joka kolmas tökkäys raottaa oven ja kuulakarkkipupu kurkistaa (yllätys)
  playNote(1568, 0, 0.1, 'triangle', 0.18);
  playNote(2093, 0.1, 0.14, 'triangle', 0.16);
  if (p.n % 3 === 0 && !(p.peek > 0)) {
    p.peek = 0.001;
    playNote(660, 0.35, 0.1, 'sine', 0.2);
    playNote(880, 0.45, 0.18, 'sine', 0.2);
  }
}

// Karkkiovi (origo = kynnys): kehys, ovi, kahva ja karkkilyhdyt
function candyDrawDoor(c, p) {
  var h = viewH, dw = h * 0.12, dh = h * 0.24, lw = Math.max(1.2, h * 0.004), k;
  artShadow(c, 0, 0, dw * 0.9, dw * 0.16, 0.16);
  artRoundRect(c, -dw * 0.7, -dh * 1.1, dw * 1.4, dh * 1.1, dw * 0.3, '#ff8fc0', { lineColor: '#b8467e', line: lw });
  artRoundRect(c, -dw / 2, -dh, dw, dh, dw * 0.4, '#b8467e', { lineColor: '#7a2a52', line: lw });
  artCircle(c, dw * 0.3, -dh * 0.5, dw * 0.07, '#ffe27a', { lineColor: '#b8862a', line: lw });
  if (p.peek > 0) {
    k = p.peek < 0.5 ? easeOutBack(p.peek / 0.5) : (p.peek > 1.7 ? Math.max(0, (2.2 - p.peek) / 0.5) : 1);
    c.save();
    roundRect(c, -dw / 2, -dh, dw, dh, dw * 0.4);
    c.clip();
    c.fillStyle = '#4a1a3a';
    c.fillRect(dw * 0.5 - dw * 0.5 * k, -dh, dw, dh);
    drawBunny(c, dw * 0.62 - dw * 0.46 * k, -dh * 0.5, dw * 0.6, 0, globalT * 4, true);
    c.restore();
  }
  artCircle(c, -dw * 0.56, -dh * 1.0, dw * 0.1, '#6fd66f', { lineColor: '#2f7a2f', line: lw, hi: 0.4 });
  artCircle(c, dw * 0.56, -dh * 1.0, dw * 0.1, '#5fa8ff', { lineColor: '#2a5aa0', line: lw, hi: 0.4 });
}

// Juoksukentällä ei ole omaa napautuskoukkua: uusi kosketus tunnistetaan
// otteen alkuhetkestä (hyppyalueen napautukset eivät tule tänne). Kuulakarkki
// hypähtää, vaahtokarkki litistyy ja koristeet heilahtavat: pelkkää koristetta.
function candyPollTap() {
  if (holdStartG === candyTapSeen) return;
  candyTapSeen = holdStartG;
  if (!running || celebrating || puzzleBusy()) return;
  var wx = holdSX + camX, wy = holdSY, i, gb, pl;
  for (i = 0; i < gumballs.length; i++) {
    gb = gumballs[i];
    if (Math.hypot(wx - gb.x, wy - (groundTop - viewH * 0.035)) < viewH * 0.06) {
      gb.pokeT = 0.6;
      playNote(900 + i * 120, 0, 0.08, 'sine', 0.2);
      playNote(1350 + i * 120, 0.08, 0.1, 'sine', 0.15);
      spawnSparkles(gb.x, groundTop - viewH * 0.05, 6, gb.color);
      return;
    }
  }
  for (i = 0; i < platforms.length; i++) {
    pl = platforms[i];
    if (pl.kind === 'bounce' && wx > pl.x - viewH * 0.02 && wx < pl.x + pl.w + viewH * 0.02 && Math.abs(wy - pl.y) < viewH * 0.06) {
      pl.squish = 0.3;
      playNote(523, 0, 0.1, 'sine', 0.25);
      playNote(1047, 0.06, 0.15, 'sine', 0.2);
      spawnSparkles(pl.x + pl.w / 2, pl.y, 6, '#ffffff');
      return;
    }
  }
  propsTap(wx, wy);
}

function drawCandy(c, x, y, s, color, phase) {
  artGlow(c, x, y, s * 1.5, color, 0.35);
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(phase) * 0.2);
  artLimb(c, 0, s * 0.3, 0, s * 1.3, Math.max(1.5, s * 0.16), '#ffffff', '#d8b8d0');
  artCircle(c, 0, 0, s * 0.75, color, { lineColor: artShade(color, -0.45), hi: 0.3 });
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, s * 0.12);
  c.beginPath(); c.arc(0, 0, s * 0.42, 0, Math.PI * 1.4); c.stroke();
  c.beginPath(); c.arc(0, 0, s * 0.15, Math.PI, Math.PI * 2.2); c.stroke();
  c.restore();
}

function drawGumball(c, gb) {
  var x = gb.x - camX, r = viewH * 0.035;
  if (x < -r * 3 || x > viewW + r * 3) return;
  // Tökätty kuulakarkki hypähtää (pelkkä piirto, osuma-alue ei muutu)
  var hop = gb.pokeT > 0 ? Math.sin(Math.min(1, gb.pokeT / 0.6) * Math.PI) * r * 0.8 : 0, y = groundTop - r - hop;
  artShadow(c, x, groundTop, r * 1.1, r * 0.25, 0.18 * (1 - hop / (r * 2)));
  artCircle(c, x, y, r, gb.color, { lineColor: artShade(gb.color, -0.45), hi: 0.45 });
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, r * 0.12);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, r * 0.6, gb.rot + gb.spin, gb.rot + gb.spin + Math.PI * 0.8); c.stroke();
}

function drawCandyDoorGlow(c) {
  var x = candyDoor.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var dw = h * 0.12, dh = h * 0.24;
  if (candyDoor.open) {
    var g = c.createLinearGradient(0, groundTop - dh, 0, groundTop);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.8 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,200,220,0.6)');
    c.fillStyle = g;
    roundRect(c, x - dw / 2, groundTop - dh, dw, dh, dw * 0.4);
    c.fill();
    drawStar(c, x, groundTop - dh * 1.35, h * 0.035, globalT, 1);
  }
}

function drawCandy_() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce') {
      drawMarshmallow(ctx, platforms[i].x - camX, platforms[i].y, platforms[i].w, viewH * 0.06, true, Math.max(0, platforms[i].squish));
    }
  }
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < candies.length; i++) {
    if (candies[i].collected) continue;
    drawCandy(ctx, candies[i].ax - camX, candies[i].ay + Math.sin(candies[i].phase) * viewH * 0.012, viewH * 0.024, candies[i].color, candies[i].phase);
  }
  for (i = 0; i < gumballs.length; i++) drawGumball(ctx, gumballs[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  drawCandyDoorGlow(ctx);
  if (candyDoor.open && !celebrating) drawEdgeArrow(ctx, candyDoor.x);
  endPlayWorld();
  drawPickupHud(ctx, CANDY_COUNT, function (i2) { return candies[i2] && candies[i2].collected; },
    function (c, x, y, s) { drawCandy(c, x, y - s * 0.3, s * 0.9, '#ff5f7e', 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
