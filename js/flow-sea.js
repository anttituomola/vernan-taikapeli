'use strict';

// Saaristokartta: pelin ylin navigaatio. Jokainen saari on yksi maailma (sokkelo),
// ja vene kulkee saarten välillä. Saaren viimeinen huone (finaleKind) on saaren
// vartija: sen läpäisy palauttaa yhden sateenkaaren värin kartan yläreunaan.
// Tarina: Myrskynoidan myrsky huuhtoi sateenkaaren värit merelle, väri per saari.
// Saaret (ISLANDS) johdetaan js/worlds.js:n WORLDS-rekisteristä.
// Sumuiset saaret vihjaavat tulevista maailmoista. Sateenkaaren 7 väriä ovat
// kaikki käytössä; kahdeksas saari (Tivolisaari) kruunaa kaaren kultatähdellä.
// Yhdeksäs saari (Revontulimaa) ei lisää kaistetta.
var SEA_FOG = [];
var RAINBOW_COLORS = ['#ff5a5a', '#ff9f3a', '#ffe14d', '#5fd36b', '#4aa8ff', '#6f5cff', '#c46bff'];

// exit: vene matkalla itäreunan avomerimerkille (Kaukamaa, flow-land.js);
// enterOnArrive false = saapuminen saarelle ei avaa sokkeloa (paluu mantereelta)
var seaBoat = { x: 0, y: 0, island: 1, target: null, facing: 1, moving: false, exit: false, enterOnArrive: true };
var seaReveal = null;               // { idx, t }: sateenkaaren värin paljastus
var seaToast = { t: 0, x: 0, y: 0 };
var seaBgCanvas = document.createElement('canvas');
var seaBgKey = '';

function islandByWorld(w) {
  var i;
  for (i = 0; i < ISLANDS.length; i++) if (ISLANDS[i].world === w) return ISLANDS[i];
  return null;
}
function islandIndex(isl) {
  var i;
  for (i = 0; i < ISLANDS.length; i++) if (ISLANDS[i] === isl) return i;
  return -1;
}
function islandDone(isl) {
  return !!(isl && hubCleared[isl.finaleKind]);
}
function islandUnplayedCount(isl) {
  var hub = isl && HUB_WORLDS[isl.world], ch, n = 0;
  if (!hub || !hub.rooms) return 0;
  for (ch in hub.rooms) {
    if (hub.rooms[ch].kind && !hubCleared[hub.rooms[ch].kind]) n++;
  }
  return n;
}
function islandUnlocked(i) {
  return i === 0 || islandDone(ISLANDS[i - 1]);
}
function rainbowEarned() {
  var n = 0, i, cap = RAINBOW_COLORS.length + 1;
  for (i = 0; i < ISLANDS.length; i++) if (islandDone(ISLANDS[i])) n++;
  return n > cap ? cap : n;
}
function seaNextIsland() {
  var i;
  for (i = 0; i < ISLANDS.length; i++) {
    if (islandUnlocked(i) && !islandDone(ISLANDS[i])) return ISLANDS[i];
  }
  return null;
}
// Sokkelon satamaruutu vilkuttaa, kun tämä saari on valmis ja toisella saarella on tekemistä
function seaHarborHint() {
  var cur = islandByWorld(hubWorld);
  var nx = seaNextIsland();
  return !!(cur && islandDone(cur) && nx && nx.world !== hubWorld);
}
function seaIslandPos(isl) {
  return { x: viewW * isl.fx, y: viewH * isl.fy, r: viewH * 0.12 * isl.size };
}
function seaHarbor(isl) {
  var p = seaIslandPos(isl);
  return { x: p.x, y: p.y + p.r * 1.02 };
}

function showSea() {
  var isl, h, i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'seaBtn'];
  if (mode !== 'sea') fadeStart();
  mode = 'sea';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  document.getElementById('hubChrome').style.display = 'flex';
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  document.getElementById('castleBtn').style.display = 'block';
  document.body.style.background = '#8fd0ff';
  lastTime = 0;
  isl = islandByWorld(hubWorld);
  if (!isl || !islandUnlocked(islandIndex(isl))) { isl = ISLANDS[0]; hubWorld = 1; }
  seaBoat.island = isl.world;
  seaBoat.target = null;
  seaBoat.moving = false;
  h = seaHarbor(isl);
  seaBoat.x = h.x;
  seaBoat.y = h.y;
  seaReveal = null;
  if (rainbowEarned() > rainbowShown) {
    seaReveal = { idx: rainbowShown, t: 0 };
    soundFanfare();
  }
}

function seaToastShow(p) {
  seaToast.t = 1.8;
  seaToast.x = p.x;
  seaToast.y = p.y - p.r * 1.5;
  playNote(392, 0, 0.18, 'triangle', 0.28);
}

function handleSeaTap(px, py) {
  var i, p, dx, dy, isl = null, idx = -1;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  for (i = 0; i < ISLANDS.length; i++) {
    p = seaIslandPos(ISLANDS[i]);
    dx = px - p.x;
    dy = py - (p.y + p.r * 0.15);
    if (dx * dx + dy * dy <= p.r * p.r * 1.8) { isl = ISLANDS[i]; idx = i; break; }
  }
  if (!isl && landUnlocked()) {
    p = seaExitPos();
    dx = px - p.x;
    dy = py - (p.y - p.r * 0.6);
    if (dx * dx + dy * dy <= p.r * p.r * 6) {
      if (seaBoat.exit) return;
      seaBoat.target = null;
      seaBoat.exit = true;
      seaBoat.moving = true;
      playNote(523, 0, 0.12, 'triangle', 0.3);
      playNote(659, 0.1, 0.16, 'triangle', 0.3);
      playNote(784, 0.2, 0.2, 'triangle', 0.3);
      return;
    }
  }
  if (!isl) {
    for (i = 0; i < SEA_FOG.length; i++) {
      p = seaIslandPos(SEA_FOG[i]);
      dx = px - p.x;
      dy = py - p.y;
      if (dx * dx + dy * dy <= p.r * p.r * 1.8) { seaToastShow(p); return; }
    }
    seaFxTap(px, py);
    return;
  }
  if (!islandUnlocked(idx)) {
    seaToastShow(p);
    return;
  }
  if (seaBoat.island === isl.world && !seaBoat.moving) {
    hubEnterIsland(isl.world);
    return;
  }
  seaBoat.target = isl;
  seaBoat.moving = true;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.16, 'triangle', 0.3);
}

function updateSea(dt) {
  globalT += dt;
  seaFxUpdate(dt);
  if (seaToast.t > 0) seaToast.t -= dt;
  if (seaReveal) {
    seaReveal.t += dt;
    if (seaReveal.t > 2.4) {
      if (rainbowEarned() > seaReveal.idx) rainbowShown = seaReveal.idx + 1;
      saveProgress();
      if (rainbowEarned() > rainbowShown) {
        seaReveal = { idx: rainbowShown, t: 0 };
        soundFanfare();
      } else {
        seaReveal = null;
      }
    }
  }
  if (seaBoat.target || seaBoat.exit) {
    var h;
    if (seaBoat.exit) {
      h = seaExitPos();
      h = { x: h.x, y: h.y + h.r * 0.8 };
    } else {
      h = seaHarbor(seaBoat.target);
    }
    var dx = h.x - seaBoat.x, dy = h.y - seaBoat.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var sp = viewH * 0.32 * dt;
    if (dx > 2) seaBoat.facing = 1;
    else if (dx < -2) seaBoat.facing = -1;
    if (dist <= sp || dist < 1) {
      seaBoat.x = h.x;
      seaBoat.y = h.y;
      if (seaBoat.exit) {
        // Avomerelle: purjehdus Kaukamaalle
        seaBoat.exit = false;
        seaBoat.moving = false;
        showLand({ sail: true, dir: 1 });
        return;
      }
      seaBoat.island = seaBoat.target.world;
      seaBoat.target = null;
      seaBoat.moving = false;
      if (seaBoat.enterOnArrive === false) seaBoat.enterOnArrive = true;
      else hubEnterIsland(seaBoat.island);
    } else {
      seaBoat.x += (dx / dist) * sp;
      seaBoat.y += (dy / dist) * sp;
    }
  }
}

// ---------- Piirto ----------
function drawSea() {
  if (!viewW || !viewH) return;
  renderSeaBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(seaBgCanvas, 0, 0, seaBgCanvas.width, seaBgCanvas.height, 0, 0, viewW, viewH);
  drawSeaWaves(ctx);
  drawSeaRainbow(ctx);
  drawSeaRainbowTouch(ctx);
  drawMapSun(ctx);

  var i, p, isl, nx = seaNextIsland(), left;
  for (i = 0; i < ISLANDS.length; i++) {
    isl = ISLANDS[i];
    p = seaIslandPos(isl);
    if (!islandUnlocked(i)) {
      ctx.fillStyle = 'rgba(200,212,235,0.78)';
      islandBlob(ctx, p.x, p.y, p.r * 1.12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.42, 0, Math.PI * 2); ctx.fill();
      drawHubLock(ctx, p.x, p.y + p.r * 0.02, p.r * 1.05);
    } else if (islandDone(isl)) {
      drawStar(ctx, p.x + p.r * 0.8, p.y - p.r * 0.85, p.r * 0.16, globalT * 0.5, 0.9);
    }
    left = islandUnlocked(i) ? islandUnplayedCount(isl) : 0;
    if (left > 0) drawIslandUnplayed(ctx, p, left);
    if (isl === nx) {
      var gl = ctx.createRadialGradient(p.x, p.y, p.r * 0.9, p.x, p.y, p.r * 1.6);
      gl.addColorStop(0, 'rgba(255,230,140,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
      gl.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.6, 0, Math.PI * 2); ctx.fill();
      drawHintArrow(ctx, p.x, p.y - p.r * 1.45);
    }
  }

  drawSeaExit(ctx);
  drawSeaFx(ctx);

  // Vene ja ratsastajat
  var bob = Math.sin(globalT * 2.5) * viewH * 0.005;
  drawBoatWithRider(ctx, seaBoat.x, seaBoat.y + bob, viewH * 0.1, seaBoat.facing, seaBoat.moving);
  drawStarBalance(ctx, viewH * 0.03, viewH * 0.065);

  if (seaReveal) drawRevealSparkles(ctx);

  if (seaToast.t > 0) {
    ctx.globalAlpha = Math.min(1, seaToast.t * 2);
    var tw = viewH * 0.14, th = viewH * 0.11;
    var tx = Math.min(Math.max(seaToast.x - tw / 2, viewH * 0.02), viewW - tw - viewH * 0.02);
    var ty = Math.max(seaToast.y - th / 2, viewH * 0.14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, tx, ty, tw, th, viewH * 0.03);
    ctx.fill();
    drawHubLock(ctx, tx + tw / 2, ty + th * 0.55, th * 0.7);
    ctx.globalAlpha = 1;
  }
}

// ---------- Pienet yllätykset kartoilla ----------
// Aurinko hymyilee ja räpäyttää napautuksesta (sama kaikilla kartoilla),
// sateenkaari soi väri kerrallaan, meressä hyppii kala (joka seitsemäs
// napautus nostaa valaan) ja pilvestä tulee pieni sadekuuro.
var mapSun = { t0: -10, x: 0, y: 0, r: 0, fromBg: false };
var seaFx = { rainbow: -1, fish: [], whale: null, rain: null, taps: 0 };
var SEA_RAINBOW_NOTES = [523, 587, 659, 698, 784, 880, 988];
var SEA_CLOUDS = [[0.3, 0.2, 0.024], [0.78, 0.15, 0.03], [0.93, 0.27, 0.022]];

function seaSunPos() { return { x: viewW * 0.12, y: viewH * 0.17, r: viewH * 0.05 }; }
function seaRainbowGeom() { return { cx: viewW * 0.5, cy: viewH * 0.40, bw: viewH * 0.021, R0: viewH * 0.27 }; }

function mapSunTap(px, py, x, y, r) {
  if (Math.hypot(px - x, py - y) > r * 2.2) return false;
  mapSun.t0 = globalT;
  mapSun.fromBg = false;
  mapSun.x = x; mapSun.y = y; mapSun.r = r;
  playNote(1047, 0, 0.12, 'sine', 0.3);
  playNote(1319, 0.1, 0.18, 'sine', 0.3);
  return true;
}
// Kentän aurinko tai kuu (bgSun taustakerroksessa) hymyilee napautuksesta
function bgSunPoke(px, py) {
  if (!bgSun || mode !== 'play') return false;
  var sx = bgSun.x - camX * bgSun.speed;
  if (Math.hypot(px - sx, py - bgSun.y) > bgSun.r * 1.6) return false;
  mapSun.t0 = globalT;
  mapSun.fromBg = true;
  playNote(1047, 0, 0.12, 'sine', 0.3);
  playNote(1319, 0.1, 0.18, 'sine', 0.3);
  return true;
}
function drawMapSun(c) {
  var k = (globalT - mapSun.t0) / 1.4, s = mapSun, i, a, fade;
  if (k < 0 || k > 1) return;
  if (s.fromBg) {
    if (!bgSun || mode !== 'play') return;
    s = { x: bgSun.x - camX * bgSun.speed, y: bgSun.y, r: bgSun.r };
  }
  fade = Math.sin(k * Math.PI);
  // Säteet pyörähtävät
  c.strokeStyle = 'rgba(255,230,120,' + (0.9 * fade) + ')';
  c.lineWidth = Math.max(2, s.r * 0.12);
  c.lineCap = 'round';
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4 + k * 1.2;
    c.beginPath();
    c.moveTo(s.x + Math.cos(a) * s.r * 1.3, s.y + Math.sin(a) * s.r * 1.3);
    c.lineTo(s.x + Math.cos(a) * s.r * (1.7 + k * 0.8), s.y + Math.sin(a) * s.r * (1.7 + k * 0.8));
    c.stroke();
  }
  // Kasvot häivähtävät esiin: toinen silmä räpäyttää
  c.globalAlpha = Math.min(1, fade * 1.6);
  artEye(c, s.x - s.r * 0.3, s.y - s.r * 0.1, s.r * 0.12, 0, false);
  artEye(c, s.x + s.r * 0.3, s.y - s.r * 0.1, s.r * 0.12, 0, k > 0.3 && k < 0.5);
  artBlush(c, s.x - s.r * 0.5, s.y + s.r * 0.15, s.r * 0.12);
  artBlush(c, s.x + s.r * 0.5, s.y + s.r * 0.15, s.r * 0.12);
  c.strokeStyle = '#c8901e';
  c.lineWidth = Math.max(1.5, s.r * 0.08);
  c.beginPath(); c.arc(s.x, s.y + s.r * 0.1, s.r * 0.35, 0.2, Math.PI - 0.2); c.stroke();
  c.globalAlpha = 1;
}

function seaFxTap(px, py) {
  var s = seaSunPos(), g = seaRainbowGeom(), i, d, cx, cy, horizon = viewH * 0.36;
  if (mapSunTap(px, py, s.x, s.y, s.r)) return true;
  // Sateenkaari: etäisyys keskipisteestä osuu kaistoille
  d = Math.hypot(px - g.cx, py - g.cy);
  if (py < g.cy && d > g.R0 - g.bw * 7.5 && d < g.R0 + g.bw) {
    if (seaFx.rainbow < 0) {
      seaFx.rainbow = 0;
      for (i = 0; i < SEA_RAINBOW_NOTES.length; i++) playNote(SEA_RAINBOW_NOTES[i], i * 0.14, 0.3, 'triangle', 0.3);
    }
    return true;
  }
  for (i = 0; i < SEA_CLOUDS.length; i++) {
    cx = viewW * SEA_CLOUDS[i][0];
    cy = viewH * SEA_CLOUDS[i][1];
    if (Math.hypot(px - cx, py - cy) < viewH * SEA_CLOUDS[i][2] * 3) {
      seaFx.rain = { x: cx, y: cy + viewH * SEA_CLOUDS[i][2] * 1.2, t: 0 };
      playNote(392, 0, 0.1, 'sine', 0.2);
      playNote(330, 0.1, 0.12, 'sine', 0.2);
      return true;
    }
  }
  if (py > horizon + viewH * 0.03) {
    seaFx.taps++;
    if (seaFx.taps % 7 === 0 && !seaFx.whale) {
      seaFx.whale = { x: px, y: py, t: 0 };
      playNote(110, 0, 0.6, 'sine', 0.35);
      playNote(165, 0.3, 0.6, 'sine', 0.25);
    } else {
      if (seaFx.fish.length > 4) seaFx.fish.shift();
      seaFx.fish.push({ x: px, y: py, t: 0, dir: Math.random() < 0.5 ? -1 : 1, c: Math.floor(Math.random() * 3) });
      playNote(880, 0, 0.08, 'sine', 0.2);
      playNote(1175, 0.06, 0.1, 'sine', 0.15);
    }
    return true;
  }
  return false;
}
function seaFxUpdate(dt) {
  var i;
  if (seaFx.rainbow >= 0) { seaFx.rainbow += dt; if (seaFx.rainbow > 1.6) seaFx.rainbow = -1; }
  if (seaFx.rain) { seaFx.rain.t += dt; if (seaFx.rain.t > 1.4) seaFx.rain = null; }
  if (seaFx.whale) { seaFx.whale.t += dt; if (seaFx.whale.t > 3.2) seaFx.whale = null; }
  for (i = seaFx.fish.length - 1; i >= 0; i--) {
    seaFx.fish[i].t += dt;
    if (seaFx.fish[i].t > 1.0) seaFx.fish.splice(i, 1);
  }
}
// Pieni kala (myös Kaukamaan joessa)
function drawMapFish(c, x, y, s, dir, color, tilt) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.rotate(tilt);
  c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(-s * 1.5, -s * 0.55); c.lineTo(-s * 1.5, s * 0.55); c.closePath();
  artFillPath(c, color, -s * 0.55, s * 0.55, s * 0.4, { lineColor: artShade(color, -0.45) });
  artBlob(c, 0, 0, s, s * 0.55, color, { lineColor: artShade(color, -0.45), hi: 0.35 });
  artEye(c, s * 0.45, -s * 0.1, s * 0.14, 0.3, false);
  c.restore();
}
// Kalan hyppy kaaressa pisteestä (x, y) suuntaan dir; k 0..1
function drawMapFishJump(c, x, y, k, dir, color) {
  var h = viewH, fx = x + dir * k * h * 0.12, fy = y - Math.sin(k * Math.PI) * h * 0.1;
  if (k < 0.12 || k > 0.88) {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.arc(k < 0.5 ? x : x + dir * h * 0.12, y, h * 0.015 * (k < 0.5 ? k / 0.12 : (1 - k) / 0.12), 0, Math.PI * 2);
    c.fill();
  }
  drawMapFish(c, fx, fy, h * 0.016, dir, color, -(k - 0.5) * 2.2);
}
function drawSeaFx(c) {
  var i, f, k, fx, fy, w, h = viewH, cols = ['#ff9d5c', '#7fd4ff', '#ffd24f'];
  for (i = 0; i < seaFx.fish.length; i++) {
    f = seaFx.fish[i];
    drawMapFishJump(c, f.x, f.y, f.t / 1.0, f.dir, cols[f.c]);
  }
  if (seaFx.whale) {
    w = seaFx.whale;
    k = w.t / 3.2;
    var rise = Math.sin(Math.min(1, k * 1.25) * Math.PI);
    var wy = w.y + h * 0.05 - rise * h * 0.06, ws = h * 0.07;
    c.save();
    c.beginPath(); c.rect(0, 0, viewW, w.y + h * 0.012); c.clip();   // pinnan alapuoli jää veteen
    artBlob(c, w.x, wy, ws * 1.6, ws * 0.7, '#5a7aa8', { lineColor: '#2f4a70', shadeTo: '#3f5c88', hi: 0.25 });
    artBlob(c, w.x + ws * 1.7, wy - ws * 0.15, ws * 0.5, ws * 0.3, '#5a7aa8', { lineColor: '#2f4a70', rot: -0.4 });
    artEye(c, w.x - ws * 0.9, wy - ws * 0.15, ws * 0.1, -0.3, false);
    c.restore();
    if (rise > 0.9) {
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = Math.max(2, h * 0.005);
      c.lineCap = 'round';
      for (i = -1; i <= 1; i++) {
        c.beginPath();
        c.moveTo(w.x - ws * 0.3, wy - ws * 0.6);
        c.quadraticCurveTo(w.x - ws * 0.3 + i * ws * 0.4, wy - ws * 1.4, w.x - ws * 0.3 + i * ws * 0.7, wy - ws * 1.1);
        c.stroke();
      }
    }
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1.5, h * 0.004);
    c.beginPath();
    if (c.ellipse) c.ellipse(w.x + ws * 0.3, w.y + h * 0.012, ws * 2.2 * (0.6 + rise * 0.4), ws * 0.25, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (seaFx.rain) {
    var r = seaFx.rain;
    c.fillStyle = 'rgba(120,190,255,0.85)';
    for (i = 0; i < 6; i++) {
      k = r.t * 1.2 + i * 0.17;
      if (k > 1.2) continue;
      fx = r.x + (i - 2.5) * h * 0.012;
      fy = r.y + (k % 1) * h * 0.1;
      c.beginPath(); c.arc(fx, fy, h * 0.004, 0, Math.PI * 2); c.fill();
    }
  }
}
function drawSeaRainbowTouch(c) {
  if (seaFx.rainbow < 0) return;
  var g = seaRainbowGeom(), i, a, r, k = seaFx.rainbow / 1.6, n = RAINBOW_COLORS.length;
  for (i = 0; i < n; i++) {
    r = g.R0 - i * g.bw - g.bw / 2;
    a = Math.PI + Math.min(1, Math.max(0, k * 1.3 - i * 0.07)) * Math.PI;
    if (a <= Math.PI) continue;
    c.globalAlpha = 1 - k;
    drawStar(c, g.cx + Math.cos(a) * r, g.cy + Math.sin(a) * r, g.bw * 0.9, globalT * 4 + i, 0.8);
  }
  c.globalAlpha = 1;
}

function drawSeaWaves(c) {
  var i, x, y, w;
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1.5, viewH * 0.005);
  c.lineCap = 'round';
  for (i = 0; i < 14; i++) {
    w = viewH * (0.05 + (i % 3) * 0.015);
    x = ((globalT * viewH * (0.03 + (i % 4) * 0.01) + i * viewW * 0.173) % (viewW + w * 2)) - w;
    y = viewH * (0.42 + (i % 7) * 0.08) + Math.sin(globalT * 1.6 + i) * viewH * 0.006;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.quadraticCurveTo(x - w / 4, y - w * 0.18, x, y);
    c.quadraticCurveTo(x + w / 4, y + w * 0.18, x + w / 2, y);
    c.stroke();
  }
  c.lineCap = 'butt';
}

// Sateenkaari taivaalla: kerätyt värit täytetään, muut ovat vaaleita kaaria
function drawSeaRainbow(c) {
  var cx = viewW * 0.5, cy = viewH * 0.40, bw = viewH * 0.021, R0 = viewH * 0.27, i, r;
  c.lineCap = 'butt';
  for (i = 0; i < RAINBOW_COLORS.length; i++) {
    r = R0 - i * bw - bw / 2;
    c.lineWidth = bw * 0.96;
    c.strokeStyle = '#ffffff';
    c.globalAlpha = 0.28;
    c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI * 2); c.stroke();
    if (i < rainbowShown || (seaReveal && i === seaReveal.idx)) {
      c.strokeStyle = RAINBOW_COLORS[i];
      c.globalAlpha = i < rainbowShown ? 0.92 : Math.min(0.92, seaReveal.t / 1.3) * 0.92;
      c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI * 2); c.stroke();
    }
  }
  c.globalAlpha = 1;
  // Kultatähti kaaren huipulla: kahdeksannen saaren vartija
  var goldN = RAINBOW_COLORS.length;
  if (rainbowShown > goldN || (seaReveal && seaReveal.idx === goldN)) {
    c.globalAlpha = rainbowShown > goldN ? 1 : Math.min(1, seaReveal.t / 1.3);
    drawStar(c, cx, cy - R0 - bw * 0.6, viewH * 0.045, Math.sin(globalT * 0.8) * 0.2, 0.9);
    c.globalAlpha = 1;
  }
  c.fillStyle = 'rgba(255,255,255,0.95)';
  cloudShape(c, cx - R0 + bw * 1.5, cy - bw * 0.5, viewH * 0.03);
  cloudShape(c, cx + R0 - bw * 1.5, cy - bw * 0.5, viewH * 0.03);
}

function drawRevealSparkles(c) {
  var cx = viewW * 0.5, cy = viewH * 0.40, bw = viewH * 0.021, R0 = viewH * 0.27;
  var r = R0 - seaReveal.idx * bw - bw / 2, k, a, t = seaReveal.t;
  if (seaReveal.idx >= RAINBOW_COLORS.length) {
    for (k = 0; k < 8; k++) {
      a = t * 2 + k * Math.PI / 4;
      c.globalAlpha = Math.max(0, 1 - t / 2.4);
      drawStar(c, cx + Math.cos(a) * bw * 4, cy - R0 - bw * 0.6 + Math.sin(a) * bw * 4, bw * 0.8, globalT * 3 + k, 0.8);
    }
    c.globalAlpha = 1;
    return;
  }
  for (k = 0; k < 7; k++) {
    a = Math.PI + ((t * 0.55 + k / 7) % 1) * Math.PI;
    c.globalAlpha = Math.max(0, 1 - t / 2.4);
    drawStar(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, bw * 0.9, globalT * 3 + k, 0.8);
  }
  c.globalAlpha = 1;
}

function drawHull(c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s * 0.5, y);
  c.quadraticCurveTo(x, y + s * 0.45, x + s * 0.5, y);
  c.lineTo(x + s * 0.42, y - s * 0.12);
  c.lineTo(x - s * 0.42, y - s * 0.12);
  c.closePath();
  artFillPath(c, '#a9743f', y - s * 0.12, y + s * 0.4, s * 0.25, { lineColor: '#5a3a1e' });
}

function drawBoatWithRider(c, x, y, s, facing, moving) {
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  drawBoat(c, 0, 0, s);
  drawUnicorn(c, -s * 0.05, -s * 0.02, s * 0.0042, 1, globalT * 7, moving, globalT);
  drawHull(c, 0, 0, s);
  c.restore();
}

function islandBlob(c, x, y, r) {
  c.beginPath();
  c.moveTo(x + r * 0.85, y); c.arc(x, y, r * 0.85, 0, Math.PI * 2);
  c.moveTo(x - r * 0.55 + r * 0.55, y + r * 0.1); c.arc(x - r * 0.55, y + r * 0.1, r * 0.55, 0, Math.PI * 2);
  c.moveTo(x + r * 0.6 + r * 0.5, y + r * 0.05); c.arc(x + r * 0.6, y + r * 0.05, r * 0.5, 0, Math.PI * 2);
  c.moveTo(x + r * 0.1 + r * 0.6, y + r * 0.3); c.arc(x + r * 0.1, y + r * 0.3, r * 0.6, 0, Math.PI * 2);
}

function drawIslandUnplayed(c, p, n) {
  var x = p.x - p.r * 0.78, y = p.y - p.r * 0.88;
  var s = p.r * (0.22 + Math.sin(globalT * 4) * 0.025);
  var g = c.createRadialGradient(x, y, s * 0.2, x, y, s * 1.8);
  g.addColorStop(0, 'rgba(255,230,120,0.85)');
  g.addColorStop(1, 'rgba(255,230,120,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, s * 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffe27a';
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = Math.max(1.5, s * 0.12);
  c.stroke();
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(s * 1.15) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), x, y + s * 0.06);
  c.textBaseline = 'alphabetic';
}

function drawIsland(b, isl, foggy) {
  var p = seaIslandPos(isl), i, k, xs;
  b.fillStyle = foggy ? 'rgba(200,220,235,0.35)' : 'rgba(190,240,255,0.6)';
  islandBlob(b, p.x, p.y, p.r * 1.3);
  b.fill();
  // Tarrakirja-ääriviiva: sama muoto tummana hieman suurempana alle
  b.fillStyle = foggy ? '#95a4b8' : '#c8a35e';
  islandBlob(b, p.x, p.y, p.r * 1.05);
  b.fill();
  b.fillStyle = foggy ? '#b9c6d6' : '#f2dfa6';
  islandBlob(b, p.x, p.y, p.r);
  b.fill();
  b.fillStyle = foggy ? '#8f9fb3' : '#4f9a40';
  islandBlob(b, p.x, p.y - p.r * 0.12, p.r * 0.8);
  b.fill();
  b.fillStyle = foggy ? '#a7b6c8' : '#7fcf68';
  islandBlob(b, p.x, p.y - p.r * 0.12, p.r * 0.76);
  b.fill();
  if (!foggy) {
    b.fillStyle = 'rgba(255,255,255,0.22)';
    islandBlob(b, p.x - p.r * 0.1, p.y - p.r * 0.3, p.r * 0.36);
    b.fill();
  }
  if (foggy) {
    b.fillStyle = 'rgba(240,246,255,0.55)';
    for (i = 0; i < 5; i++) {
      b.beginPath();
      b.arc(p.x + (i - 2) * p.r * 0.45, p.y - p.r * 0.1 + (i % 2) * p.r * 0.25, p.r * 0.42, 0, Math.PI * 2);
      b.fill();
    }
    return;
  }
  if (isl.deco === 'castle') {
    drawTree(b, p.x - p.r * 0.62, p.y + p.r * 0.2, p.r * 0.5);
    drawTree(b, p.x + p.r * 0.7, p.y + p.r * 0.25, p.r * 0.45);
    drawCastle(b, p.x, p.y + p.r * 0.1, p.r * 1.0);
    drawFlower(b, p.x - p.r * 0.3, p.y + p.r * 0.45, p.r * 0.08, '#ff7bac');
    drawFlower(b, p.x + p.r * 0.35, p.y + p.r * 0.5, p.r * 0.08, '#ffe27a');
  } else if (isl.deco && isl.deco.length) {
    xs = isl.deco.length === 1 ? [0.02] : (isl.deco.length === 2 ? [-0.35, 0.4] : [-0.6, 0.02, 0.64]);
    for (k = 0; k < isl.deco.length && k < 3; k++) {
      drawHubRoomIcon(b, isl.deco[k], p.x + xs[k] * p.r, p.y - p.r * 0.1 + (k === 1 ? -p.r * 0.22 : p.r * 0.08), p.r * 1.9);
    }
  }
}

function drawSeaRoute(b, a, c2, alpha) {
  var dx = c2.x - a.x, dy = c2.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
  var step = viewH * 0.03, n = Math.floor(dist / step), i, t;
  b.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  for (i = 1; i < n; i++) {
    t = i / n;
    b.beginPath();
    b.arc(a.x + dx * t, a.y + dy * t + Math.sin(t * Math.PI) * -viewH * 0.03, viewH * 0.005, 0, Math.PI * 2);
    b.fill();
  }
}

function renderSeaBg() {
  var key = viewW + 'x' + viewH + '|' + (landUnlocked() ? 'L' : '');
  if (seaBgKey === key) return;
  seaBgKey = key;
  seaBgCanvas.width = Math.round(viewW * DPR);
  seaBgCanvas.height = Math.round(viewH * DPR);
  var b = seaBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, horizon = h * 0.36, i, x, y;

  // Taivas ja aurinko
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#a9dcff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  var sg = b.createRadialGradient(w * 0.12, h * 0.17, h * 0.02, w * 0.12, h * 0.17, h * 0.15);
  sg.addColorStop(0, 'rgba(255,245,180,0.95)');
  sg.addColorStop(0.35, 'rgba(255,235,140,0.55)');
  sg.addColorStop(1, 'rgba(255,235,140,0)');
  b.fillStyle = sg;
  b.beginPath(); b.arc(w * 0.12, h * 0.17, h * 0.15, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff6c8';
  b.beginPath(); b.arc(w * 0.12, h * 0.17, h * 0.05, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.3, h * 0.2, h * 0.024);
  cloudShape(b, w * 0.78, h * 0.15, h * 0.03);
  cloudShape(b, w * 0.93, h * 0.27, h * 0.022);

  // Kaukaiset kukkulat horisontissa
  b.fillStyle = '#a9d9c3';
  for (i = 0; i < 9; i++) {
    x = w * (i / 8) + (i % 2) * w * 0.03;
    b.beginPath();
    b.arc(x, horizon + h * 0.012, h * (0.018 + (i % 3) * 0.008), Math.PI, Math.PI * 2);
    b.fill();
  }

  // Meri
  var sea = b.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#8ed4ff');
  sea.addColorStop(0.5, '#5db3f0');
  sea.addColorStop(1, '#3f8fd6');
  b.fillStyle = sea;
  b.fillRect(0, horizon, w, h - horizon);
  b.strokeStyle = 'rgba(255,255,255,0.14)';
  b.lineWidth = Math.max(1, h * 0.004);
  for (y = horizon + h * 0.04; y < h; y += h * 0.055) {
    b.beginPath();
    for (x = -10; x <= w + 10; x += 12) {
      var wy = y + Math.sin(x / (h * 0.08) + y) * h * 0.005;
      if (x === -10) b.moveTo(x, wy); else b.lineTo(x, wy);
    }
    b.stroke();
  }

  // Reitit saarten välillä (viimeisestä sumuun haaleana)
  for (i = 0; i + 1 < ISLANDS.length; i++) drawSeaRoute(b, seaHarbor(ISLANDS[i]), seaHarbor(ISLANDS[i + 1]), 0.55);
  if (SEA_FOG.length > 0 && ISLANDS.length > 0) {
    var fp = seaIslandPos(SEA_FOG[0]);
    drawSeaRoute(b, seaHarbor(ISLANDS[ISLANDS.length - 1]), { x: fp.x, y: fp.y + fp.r }, 0.22);
  }
  // Reitti avomerimerkille (Kaukamaa), kun se on auki
  if (landUnlocked() && ISLANDS.length > 0) {
    var ep = seaExitPos();
    drawSeaRoute(b, seaHarbor(ISLANDS[ISLANDS.length - 1]), { x: ep.x, y: ep.y + ep.r * 0.8 }, 0.55);
  }

  // Saaret
  for (i = 0; i < SEA_FOG.length; i++) drawIsland(b, SEA_FOG[i], true);
  for (i = 0; i < ISLANDS.length; i++) drawIsland(b, ISLANDS[i], false);
}
