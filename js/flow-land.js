'use strict';

// Kaukamaa: saariston takainen manner, pelin toinen ylätason kartta.
// Paikat (LAND_PLACES, johdettu WORLDS-rekisterin place-kentästä) ovat
// maailmoja kuten saaret: paikan napautus kävelyttää yksisarvisen sinne ja
// avaa paikan sokkelon. Länsirannan satamasta vene vie takaisin saaristoon.
// Mantereelle pääsee saaristokartan itäreunan avomerimerkistä, kun kultatähti
// loistaa sateenkaaren huipulla (Tivolisaaren vartija läpäisty). Siirtymä on
// lyhyt purjehdus (state 'sail'): vene avomerellä, delfiinit, ja manner nousee
// usvasta. Napautus ohittaa purjehduksen.
// Tarina: kultatähden säde osoittaa itään avomerelle, jossa kartalla
// näkymätön maa odottaa — siellä asuvat lohikäärmeet.

var LAND_SAIL_T = 4.0;
// Usvaiset paikat vihjaavat tulevista alueista; napautus näyttää lukon.
var LAND_FOG = [
  { fx: 0.60, fy: 0.42, size: 0.75 },
  { fx: 0.84, fy: 0.64, size: 0.85 },
  { fx: 0.52, fy: 0.84, size: 0.7 }
];
var land = {
  state: 'map', t: 0, dir: 1, fanfare: false,
  pawn: { x: 0, y: 0, facing: 1, walkPhase: 0, at: -1, target: null },
  toast: { t: 0, x: 0, y: 0 },
  dragonT: 6
};
var landBgCanvas = document.createElement('canvas');
var landBgKey = '';

// ---------- Alue ja paikat ----------
function worldRegion(w) {
  var wi = WORLD_INFO[w];
  return wi && wi.region ? wi.region : 'sea';
}
function placeByWorld(w) {
  var i;
  for (i = 0; i < LAND_PLACES.length; i++) if (LAND_PLACES[i].world === w) return LAND_PLACES[i];
  return null;
}
function placeIndex(pl) {
  var i;
  for (i = 0; i < LAND_PLACES.length; i++) if (LAND_PLACES[i] === pl) return i;
  return -1;
}
function placeUnlocked(i) {
  return i === 0 || islandDone(LAND_PLACES[i - 1]);
}
// Onko paikassa jo pelattu jotain (vanha tallennus tai suora linkki)
function placeStarted(pl) {
  var hub = HUB_WORLDS[pl.world], ch;
  if (!hub) return false;
  for (ch in hub.rooms) if (hub.rooms[ch].kind && hubCleared[hub.rooms[ch].kind]) return true;
  return false;
}
function landUnlocked() {
  var i;
  if (LAND_PLACES.length === 0) return false;
  if (rainbowEarned() > RAINBOW_COLORS.length) return true;
  for (i = 0; i < LAND_PLACES.length; i++) if (placeStarted(LAND_PLACES[i])) return true;
  return false;
}
function landNextPlace() {
  var i;
  for (i = 0; i < LAND_PLACES.length; i++) {
    if (placeUnlocked(i) && !islandDone(LAND_PLACES[i])) return LAND_PLACES[i];
  }
  return null;
}
function landPlacePos(pl) {
  return { x: viewW * pl.fx, y: viewH * pl.fy, r: viewH * 0.105 * pl.size };
}
function landPawnSpot(pl) {
  var p = landPlacePos(pl);
  return { x: p.x, y: p.y + p.r * 1.05 };
}
function landHarbor() {
  return { x: viewW * 0.10, y: viewH * 0.74, r: viewH * 0.09 };
}
// Avomerimerkki saaristokartan itäreunassa
function seaExitPos() {
  return { x: viewW * 0.955, y: viewH * 0.66, r: viewH * 0.05 };
}

// ---------- Näkymän vaihto ----------
function showLand(opts) {
  var i, pl, p, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'seaBtn'];
  opts = opts || {};
  mode = 'land';
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
  land.state = opts.sail ? 'sail' : 'map';
  land.t = 0;
  land.dir = opts.dir || 1;
  land.fanfare = false;
  land.pawn.target = null;
  land.toast.t = 0;
  pl = worldRegion(hubWorld) === 'land' ? placeByWorld(hubWorld) : null;
  if (pl && !placeUnlocked(placeIndex(pl))) pl = null;
  if (pl) {
    land.pawn.at = placeIndex(pl);
    p = landPawnSpot(pl);
  } else {
    land.pawn.at = -1;
    p = landHarbor();
    p = { x: p.x + p.r * 0.9, y: p.y - p.r * 0.35 };
  }
  land.pawn.x = p.x;
  land.pawn.y = p.y;
  land.pawn.facing = 1;
}

// Vene lähtee mantereelta takaisin saaristoon
function landLeave() {
  land.state = 'sail';
  land.dir = -1;
  land.t = 0;
  land.fanfare = false;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.16, 'triangle', 0.3);
}

function landSailEnd() {
  if (land.dir > 0) {
    land.state = 'map';
    land.t = 0;
    return;
  }
  seaArriveFromLand();
}

// Paluu saaristoon: vene ilmestyy avomerimerkin kohdalle ja lipuu viimeiselle
// avatulle saarelle ilman, että saaren sokkelo aukeaa itsestään.
function seaArriveFromLand() {
  var isl = ISLANDS[0], i, e;
  for (i = ISLANDS.length - 1; i >= 0; i--) if (islandUnlocked(i)) { isl = ISLANDS[i]; break; }
  hubWorld = isl.world;
  lastIsland = isl.world;
  saveProgress();
  showSea();
  e = seaExitPos();
  seaBoat.x = e.x;
  seaBoat.y = e.y + e.r * 0.8;
  seaBoat.facing = -1;
  seaBoat.target = isl;
  seaBoat.moving = true;
  seaBoat.enterOnArrive = false;
}

function landToastShow(x, y) {
  land.toast.t = 1.8;
  land.toast.x = x;
  land.toast.y = y;
  playNote(392, 0, 0.18, 'triangle', 0.28);
}

// ---------- Syöte ----------
function handleLandTap(px, py) {
  var i, p, dx, dy, h;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (land.state === 'sail') {
    landSailEnd();
    return;
  }
  h = landHarbor();
  dx = px - h.x; dy = py - h.y;
  if (dx * dx + dy * dy <= h.r * h.r * 1.6) {
    landLeave();
    return;
  }
  for (i = 0; i < LAND_PLACES.length; i++) {
    p = landPlacePos(LAND_PLACES[i]);
    dx = px - p.x; dy = py - p.y;
    if (dx * dx + dy * dy > p.r * p.r * 1.9) continue;
    if (!placeUnlocked(i)) { landToastShow(p.x, p.y - p.r * 1.4); return; }
    if (land.pawn.at === i && !land.pawn.target) {
      hubEnterIsland(LAND_PLACES[i].world);
      return;
    }
    land.pawn.target = LAND_PLACES[i];
    playNote(523, 0, 0.12, 'triangle', 0.3);
    playNote(659, 0.1, 0.16, 'triangle', 0.3);
    return;
  }
  for (i = 0; i < LAND_FOG.length; i++) {
    p = landPlacePos(LAND_FOG[i]);
    dx = px - p.x; dy = py - p.y;
    if (dx * dx + dy * dy <= p.r * p.r * 1.9) { landToastShow(p.x, p.y - p.r * 1.4); return; }
  }
}

// ---------- Päivitys ----------
function updateLand(dt) {
  var s, dx, dy, dist, sp;
  globalT += dt;
  if (land.toast.t > 0) land.toast.t -= dt;
  land.dragonT -= dt;
  if (land.dragonT < -9) land.dragonT = 7 + Math.random() * 6;
  if (land.state === 'sail') {
    land.t += dt;
    if (!land.fanfare && land.t > 1.4) {
      land.fanfare = true;
      soundFanfare();
    }
    if (land.t >= LAND_SAIL_T) landSailEnd();
    return;
  }
  if (land.pawn.target) {
    s = landPawnSpot(land.pawn.target);
    dx = s.x - land.pawn.x;
    dy = s.y - land.pawn.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    sp = viewH * 0.34 * dt;
    if (dx > 2) land.pawn.facing = 1;
    else if (dx < -2) land.pawn.facing = -1;
    if (dist <= sp || dist < 1) {
      land.pawn.x = s.x;
      land.pawn.y = s.y;
      land.pawn.at = placeIndex(land.pawn.target);
      land.pawn.target = null;
      hubEnterIsland(LAND_PLACES[land.pawn.at].world);
    } else {
      land.pawn.x += (dx / dist) * sp;
      land.pawn.y += (dy / dist) * sp;
      land.pawn.walkPhase += dt * 9;
    }
  }
}

// ---------- Piirto: kartta ----------
function drawLand() {
  if (!viewW || !viewH) return;
  if (land.state === 'sail') { drawLandSail(); return; }
  renderLandBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(landBgCanvas, 0, 0, landBgCanvas.width, landBgCanvas.height, 0, 0, viewW, viewH);
  drawLandSkyDragon(ctx);
  drawLandSeaWaves(ctx);

  var i, p, pl, nx = landNextPlace(), left, h = landHarbor();
  // Satama ja vene länsirannalla
  var bob = Math.sin(globalT * 2.5) * viewH * 0.005;
  drawBoat(ctx, h.x, h.y + bob, viewH * 0.09);

  for (i = 0; i < LAND_FOG.length; i++) {
    p = landPlacePos(LAND_FOG[i]);
    drawLandFog(ctx, p);
  }
  for (i = 0; i < LAND_PLACES.length; i++) {
    pl = LAND_PLACES[i];
    p = landPlacePos(pl);
    if (pl === nx) {
      var gl = ctx.createRadialGradient(p.x, p.y, p.r * 0.9, p.x, p.y, p.r * 1.7);
      gl.addColorStop(0, 'rgba(255,230,140,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
      gl.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    drawLandPlace(ctx, pl, p, placeUnlocked(i));
    if (!placeUnlocked(i)) {
      drawHubLock(ctx, p.x, p.y + p.r * 0.05, p.r * 1.0);
    } else if (islandDone(pl)) {
      drawStar(ctx, p.x + p.r * 0.8, p.y - p.r * 0.85, p.r * 0.17, globalT * 0.5, 0.9);
    }
    left = placeUnlocked(i) ? islandUnplayedCount(pl) : 0;
    if (left > 0) drawIslandUnplayed(ctx, p, left);
    if (pl === nx) drawHintArrow(ctx, p.x, p.y - p.r * 1.5);
  }

  // Prinsessa ratsastaa yksisarvisella paikkojen välillä
  var moving = !!land.pawn.target;
  drawUnicorn(ctx, land.pawn.x, land.pawn.y, viewH * 0.00056, land.pawn.facing, land.pawn.walkPhase, moving, globalT);
  drawStarBalance(ctx, viewH * 0.03, viewH * 0.065);

  if (land.toast.t > 0) {
    ctx.globalAlpha = Math.min(1, land.toast.t * 2);
    var tw = viewH * 0.14, th = viewH * 0.11;
    var tx = Math.min(Math.max(land.toast.x - tw / 2, viewH * 0.02), viewW - tw - viewH * 0.02);
    var ty = Math.max(land.toast.y - th / 2, viewH * 0.14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, tx, ty, tw, th, viewH * 0.03);
    ctx.fill();
    drawHubLock(ctx, tx + tw / 2, ty + th * 0.55, th * 0.7);
    ctx.globalAlpha = 1;
  }
}

// Paikka: laakson värilaikku, kehys ja alueen huoneiden kuvakkeet
function drawLandPlace(c, pl, p, unlocked) {
  var room = null, k, xs, col;
  var hub = HUB_WORLDS[pl.world];
  if (hub && hub.order.length) room = hub.rooms[hubRoomChar(hub, hub.order[0])];
  col = unlocked && room ? room.color : '#b9c6d6';
  artBlob(c, p.x, p.y + p.r * 0.25, p.r * 1.35, p.r * 0.55, unlocked ? '#e8c27a' : '#c4ccd8', { line: false, alpha: 0.55 });
  artBlob(c, p.x, p.y + p.r * 0.1, p.r * 1.15, p.r * 0.5, unlocked ? '#f4d99a' : '#d4dae4', { lineColor: unlocked ? '#c49a52' : '#a8b2c0', hi: 0.2 });
  artCircle(c, p.x, p.y - p.r * 0.25, p.r * 0.7, col, { lineColor: artShade(col, -0.4), hi: 0.35 });
  if (!unlocked) return;
  if (pl.deco && pl.deco.length) {
    xs = pl.deco.length === 1 ? [0] : (pl.deco.length === 2 ? [-0.3, 0.3] : [-0.5, 0, 0.5]);
    for (k = 0; k < pl.deco.length && k < 3; k++) {
      drawHubRoomIcon(c, pl.deco[k], p.x + xs[k] * p.r, p.y - p.r * 0.2, p.r * (pl.deco.length === 1 ? 2.8 : 2.0));
    }
  }
}
function hubRoomChar(hub, kind) {
  var ch;
  for (ch in hub.rooms) if (hub.rooms[ch].kind === kind) return ch;
  return null;
}

function drawLandFog(c, p) {
  var i;
  c.fillStyle = 'rgba(240,246,255,0.62)';
  for (i = 0; i < 5; i++) {
    c.beginPath();
    c.arc(p.x + (i - 2) * p.r * 0.42 + Math.sin(globalT * 0.4 + i) * p.r * 0.05, p.y - p.r * 0.1 + (i % 2) * p.r * 0.25, p.r * 0.42, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 0.55;
  drawHubLock(c, p.x, p.y + p.r * 0.05, p.r * 0.8);
  c.globalAlpha = 1;
}

// Lohikäärme liitää taivaalla silloin tällöin
function drawLandSkyDragon(c) {
  if (land.dragonT > 0) return;
  var t = -land.dragonT / 9, x = viewW * (1.1 - t * 1.25), y = viewH * (0.12 + Math.sin(t * Math.PI * 2) * 0.04);
  var s = viewH * 0.028;
  c.globalAlpha = 0.8;
  drawDragonSilhouette(c, x, y, s, Math.sin(globalT * 6), '#7a5aa8');
  c.globalAlpha = 1;
}
function drawDragonSilhouette(c, x, y, s, flap, color) {
  c.fillStyle = color;
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 1.1, s * 0.45, 0, 0, Math.PI * 2); else c.arc(x, y, s * 0.6, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.arc(x - s * 1.2, y - s * 0.2, s * 0.42, 0, Math.PI * 2); c.fill();
  c.beginPath();
  c.moveTo(x + s * 0.9, y); c.quadraticCurveTo(x + s * 2.0, y - s * 0.3, x + s * 2.6, y + s * 0.4);
  c.quadraticCurveTo(x + s * 1.9, y + s * 0.1, x + s * 0.9, y + s * 0.3); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(x - s * 0.4, y - s * 0.1); c.lineTo(x - s * 0.1, y - s * 1.5 - flap * s * 0.6); c.lineTo(x + s * 1.2, y - s * 0.9 - flap * s * 0.4); c.lineTo(x + s * 0.5, y); c.closePath(); c.fill();
}

function drawLandSeaWaves(c) {
  var i, x, y, w, coast = viewW * 0.17;
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = Math.max(1.5, viewH * 0.005);
  c.lineCap = 'round';
  for (i = 0; i < 6; i++) {
    w = viewH * 0.04;
    x = coast * 0.15 + ((globalT * viewH * 0.02 + i * coast * 0.31) % (coast * 0.7));
    y = viewH * (0.36 + i * 0.1) + Math.sin(globalT * 1.6 + i) * viewH * 0.006;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.quadraticCurveTo(x - w / 4, y - w * 0.18, x, y);
    c.quadraticCurveTo(x + w / 4, y + w * 0.18, x + w / 2, y);
    c.stroke();
  }
  c.lineCap = 'butt';
}

// Staattinen tausta: taivas, vuoret ja tulivuori, meri länsireunalla, niityt,
// joki, metsiköt, polku paikkojen välillä
function renderLandBg() {
  var key = viewW + 'x' + viewH + '|' + LAND_PLACES.length;
  if (landBgKey === key) return;
  landBgKey = key;
  landBgCanvas.width = Math.round(viewW * DPR);
  landBgCanvas.height = Math.round(viewH * DPR);
  var b = landBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, horizon = h * 0.30, i, x, y, k;

  // Taivas
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#8fc8ff');
  sky.addColorStop(1, '#f2f4ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  drawBgSun(b, w * 0.86, h * 0.10, h * 0.045, 0.22, '#fff4c8', '#fffdf0', '#ffd45a');
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.2, h * 0.09, h * 0.022);
  cloudShape(b, w * 0.5, h * 0.06, h * 0.026);
  cloudShape(b, w * 0.68, h * 0.14, h * 0.02);

  // Kaukaiset vuoret ja tulivuori
  var ridge = function (px) { return horizon - h * 0.05 - Math.abs(Math.sin(px * 0.0045 + 0.7)) * h * 0.09 - Math.sin(px * 0.011) * h * 0.02; };
  fillHillBand(b, w, h, horizon + h * 0.06, '#8f86c4', ridge);
  b.fillStyle = 'rgba(255,255,255,0.75)';
  for (i = 0; i < 12; i++) {
    x = w * (0.02 + i * 0.085);
    y = ridge(x);
    b.beginPath(); b.moveTo(x - h * 0.02, y + h * 0.028); b.lineTo(x, y - h * 0.002); b.lineTo(x + h * 0.02, y + h * 0.026); b.closePath(); b.fill();
  }
  // Tulivuori: tumma kartio, hehkuva suu ja savupilvi
  var vx = w * 0.78, vy = horizon + h * 0.04;
  b.beginPath(); b.moveTo(vx - h * 0.16, vy + h * 0.03); b.lineTo(vx - h * 0.035, vy - h * 0.17); b.lineTo(vx + h * 0.035, vy - h * 0.17); b.lineTo(vx + h * 0.16, vy + h * 0.03); b.closePath();
  artFillPath(b, '#7a5a8a', vy - h * 0.17, vy + h * 0.03, h * 0.1, { lineColor: '#5a3f6a' });
  artBlob(b, vx, vy - h * 0.17, h * 0.035, h * 0.012, '#ff8a4a', { line: false });
  b.fillStyle = 'rgba(230,220,240,0.85)';
  cloudShape(b, vx + h * 0.02, vy - h * 0.22, h * 0.018);
  cloudShape(b, vx + h * 0.06, vy - h * 0.27, h * 0.022);

  // Maa: niitty, joka tummuu alaspäin
  var grass = b.createLinearGradient(0, horizon, 0, h);
  grass.addColorStop(0, '#b8e392');
  grass.addColorStop(0.5, '#93d476');
  grass.addColorStop(1, '#6fb85e');
  b.fillStyle = grass;
  b.fillRect(0, horizon, w, h - horizon);
  // Kukkulat vaaleampana
  b.fillStyle = 'rgba(255,255,255,0.14)';
  for (i = 0; i < 7; i++) {
    x = w * (0.2 + i * 0.13);
    y = h * (0.40 + (i % 3) * 0.18);
    b.beginPath();
    if (b.ellipse) b.ellipse(x, y, h * 0.14, h * 0.06, 0, 0, Math.PI * 2); else b.arc(x, y, h * 0.08, 0, Math.PI * 2);
    b.fill();
  }
  // Joki vuorilta mereen
  b.strokeStyle = '#8fd4ff';
  b.lineWidth = h * 0.028;
  b.lineCap = 'round';
  b.beginPath();
  b.moveTo(w * 0.70, horizon + h * 0.03);
  b.bezierCurveTo(w * 0.62, h * 0.45, w * 0.40, h * 0.40, w * 0.36, h * 0.56);
  b.bezierCurveTo(w * 0.32, h * 0.72, w * 0.25, h * 0.7, w * 0.17, h * 0.66);
  b.stroke();
  b.strokeStyle = 'rgba(255,255,255,0.55)';
  b.lineWidth = h * 0.006;
  b.stroke();

  // Meri länsireunalla ja hiekkaranta
  var coast = function (py) { return w * 0.16 + Math.sin(py * 0.012) * w * 0.02 + Math.sin(py * 0.031 + 1) * w * 0.01; };
  b.fillStyle = '#f0dba0';
  b.beginPath(); b.moveTo(0, horizon);
  for (y = horizon; y <= h; y += 6) b.lineTo(coast(y) + w * 0.018, y);
  b.lineTo(0, h); b.closePath(); b.fill();
  var sea = b.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#7fcbff');
  sea.addColorStop(1, '#3f8fd6');
  b.fillStyle = sea;
  b.beginPath(); b.moveTo(0, horizon);
  for (y = horizon; y <= h; y += 6) b.lineTo(coast(y), y);
  b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.35)';
  b.beginPath(); b.moveTo(0, horizon);
  for (y = horizon; y <= h; y += 6) b.lineTo(coast(y) - w * 0.008, y);
  for (y = h; y >= horizon; y -= 6) b.lineTo(coast(y) - w * 0.02, y);
  b.closePath(); b.fill();
  // Laituri satamassa
  var hb = landHarbor();
  b.fillStyle = '#a97a4a';
  b.fillRect(hb.x - hb.r * 0.2, hb.y - hb.r * 0.12, hb.r * 1.5, hb.r * 0.16);
  b.fillStyle = '#8a5a30';
  b.fillRect(hb.x + hb.r * 0.2, hb.y, hb.r * 0.1, hb.r * 0.3);
  b.fillRect(hb.x + hb.r * 1.1, hb.y, hb.r * 0.1, hb.r * 0.3);

  // Metsiköt
  var groves = [[0.26, 0.40], [0.47, 0.32], [0.30, 0.86], [0.70, 0.82], [0.93, 0.44], [0.58, 0.60], [0.86, 0.92]];
  for (i = 0; i < groves.length; i++) {
    for (k = 0; k < 4; k++) {
      x = w * groves[i][0] + (k - 1.5) * h * 0.035 + ((i + k) % 2) * h * 0.012;
      y = h * groves[i][1] + (k % 2) * h * 0.02;
      drawTree(b, x, y, h * 0.045 + (k % 2) * h * 0.008);
    }
  }
  for (i = 0; i < 18; i++) {
    x = w * ((i * 0.137 + 0.22) % 0.8) + w * 0.18;
    y = h * (0.36 + ((i * 0.29) % 0.6));
    drawFlower(b, x, y, h * 0.007, i % 3 === 0 ? '#ff7bac' : (i % 3 === 1 ? '#ffe27a' : '#c9a0ff'));
  }

  // Polku: satamasta paikkoihin, sitten haaleana usvaan
  var pts = [{ x: hb.x + hb.r * 0.9, y: hb.y - hb.r * 0.35 }], p;
  for (i = 0; i < LAND_PLACES.length; i++) pts.push(landPawnSpot(LAND_PLACES[i]));
  for (i = 0; i + 1 < pts.length; i++) drawSeaRoute(b, pts[i], pts[i + 1], 0.85);
  if (LAND_FOG.length > 0) {
    p = landPlacePos(LAND_FOG[0]);
    drawSeaRoute(b, pts[pts.length - 1], { x: p.x, y: p.y + p.r }, 0.3);
  }
}

// ---------- Purjehdus: avomeri ja usvasta nouseva manner ----------
function drawLandSail() {
  var t = land.t, w = viewW, h = viewH, horizon = h * 0.38, i, x, y, k, dir = land.dir;
  var c = ctx;
  c.clearRect(0, 0, w, h);
  var sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#6aa8ee');
  sky.addColorStop(0.6, '#c8e4ff');
  sky.addColorStop(1, '#fff0d8');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon + 2);
  artGlow(c, w * 0.5, horizon - h * 0.02, h * 0.3, '#ffe0a0', 0.45);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 4; i++) cloudShape(c, ((w * (0.15 + i * 0.27) - t * dir * w * 0.05) % (w * 1.2) + w * 1.2) % (w * 1.2) - w * 0.1, h * (0.08 + (i % 2) * 0.09), h * 0.024);

  // Manner (tai saaristo) nousee usvasta
  var k0 = Math.max(0, Math.min(1, (t - 0.9) / 2.3)), ease = easeOutCubic(k0);
  var lx = dir > 0 ? w * (1.15 - ease * 0.62) : w * (-0.15 + ease * 0.62);
  var la = Math.min(1, k0 * 1.6);
  if (la > 0) {
    c.globalAlpha = la;
    if (dir > 0) drawSailContinent(c, lx, horizon, h, ease);
    else drawSailIslands(c, lx, horizon, h);
    c.globalAlpha = 1;
  }
  // Usva horisontissa
  c.fillStyle = 'rgba(255,255,255,' + (0.7 - ease * 0.5) + ')';
  for (i = 0; i < 9; i++) cloudShape(c, w * (i / 8) + Math.sin(globalT + i) * h * 0.01, horizon - h * 0.01 + (i % 2) * h * 0.02, h * 0.03);

  // Meri
  var sea = c.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#8ed4ff');
  sea.addColorStop(0.5, '#4fa8ee');
  sea.addColorStop(1, '#2f7fc8');
  c.fillStyle = sea;
  c.fillRect(0, horizon, w, h - horizon);
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = Math.max(1.5, h * 0.005);
  c.lineCap = 'round';
  for (i = 0; i < 16; i++) {
    var ww = h * (0.05 + (i % 3) * 0.02);
    x = (((-t * dir * w * (0.12 + (i % 4) * 0.04)) + i * w * 0.173) % (w + ww * 2) + (w + ww * 2)) % (w + ww * 2) - ww;
    y = horizon + h * 0.05 + (i % 7) * h * 0.08 + Math.sin(globalT * 1.6 + i) * h * 0.006;
    c.beginPath();
    c.moveTo(x - ww / 2, y);
    c.quadraticCurveTo(x - ww / 4, y - ww * 0.18, x, y);
    c.quadraticCurveTo(x + ww / 4, y + ww * 0.18, x + ww / 2, y);
    c.stroke();
  }
  c.lineCap = 'butt';

  // Delfiinit hyppäävät
  for (k = 0; k < 2; k++) {
    var t0 = 0.5 + k * 1.3, dt0 = t - t0;
    if (dt0 > 0 && dt0 < 1.1) {
      var f = dt0 / 1.1;
      var dx = w * (0.62 + k * 0.15) - dir * f * w * 0.16;
      var dy = h * 0.72 - Math.sin(f * Math.PI) * h * 0.16;
      drawDolphin(c, dx, dy, h * 0.03, dir, (f - 0.5) * 2.4);
      if (f < 0.15 || f > 0.85) {
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.beginPath(); c.arc(w * (0.62 + k * 0.15) - dir * (f < 0.5 ? 0 : w * 0.16), h * 0.72, h * 0.02 * (f < 0.5 ? f / 0.15 : (1 - f) / 0.15), 0, Math.PI * 2); c.fill();
      }
    }
  }

  // Vene keskellä, vanavesi
  var bx = w * 0.45, by = h * 0.68 + Math.sin(globalT * 2.5) * h * 0.008;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  if (c.ellipse) c.ellipse(bx - dir * h * 0.16, by + h * 0.04, h * 0.18, h * 0.02, 0, 0, Math.PI * 2); else c.arc(bx, by + h * 0.04, h * 0.05, 0, Math.PI * 2);
  c.fill();
  drawBoatWithRider(c, bx, by, h * 0.14, dir, true);
  // Lokit
  for (i = 0; i < 3; i++) {
    x = w * (0.2 + i * 0.3) + Math.sin(globalT * 0.5 + i) * w * 0.04;
    y = h * (0.12 + i * 0.05) + Math.sin(globalT * 1.1 + i * 2) * h * 0.02;
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1.5, h * 0.004);
    c.beginPath();
    c.moveTo(x - h * 0.02, y); c.quadraticCurveTo(x - h * 0.01, y - h * 0.012 * (1 + Math.sin(globalT * 8 + i)), x, y);
    c.quadraticCurveTo(x + h * 0.01, y - h * 0.012 * (1 + Math.sin(globalT * 8 + i)), x + h * 0.02, y);
    c.stroke();
  }
  drawStarBalance(c, h * 0.03, h * 0.065);
}

function drawSailContinent(c, x, horizon, h, k) {
  var w = viewW, i;
  var haze = artMix('#6a5aa0', '#fff0d8', 0.55 - k * 0.35);
  // Vuorijono
  c.fillStyle = haze;
  c.beginPath();
  c.moveTo(x - w * 0.05, horizon + h * 0.02);
  for (i = 0; i <= 12; i++) {
    var px = x - w * 0.05 + i * w * 0.075;
    var py = horizon - h * (0.06 + Math.abs(Math.sin(i * 1.7)) * 0.11);
    c.lineTo(px, py);
  }
  c.lineTo(x + w * 0.9, horizon + h * 0.02);
  c.closePath(); c.fill();
  // Tulivuori savupilvineen
  var vx = x + w * 0.42;
  c.fillStyle = artMix('#5a3f6a', '#fff0d8', 0.45 - k * 0.3);
  c.beginPath(); c.moveTo(vx - h * 0.15, horizon + h * 0.02); c.lineTo(vx - h * 0.03, horizon - h * 0.2); c.lineTo(vx + h * 0.03, horizon - h * 0.2); c.lineTo(vx + h * 0.15, horizon + h * 0.02); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,140,80,' + (0.5 * k) + ')';
  c.beginPath(); c.arc(vx, horizon - h * 0.2, h * 0.025, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(240,230,245,0.8)';
  cloudShape(c, vx + h * 0.03, horizon - h * 0.26 - Math.sin(globalT) * h * 0.005, h * 0.018);
  // Vihreä ranta
  c.fillStyle = artMix('#7fc860', '#fff0d8', 0.4 - k * 0.3);
  c.beginPath();
  c.moveTo(x - w * 0.05, horizon + h * 0.02);
  for (i = 0; i <= 10; i++) c.lineTo(x - w * 0.05 + i * w * 0.09, horizon - h * (0.01 + Math.abs(Math.sin(i * 2.3)) * 0.035));
  c.lineTo(x + w * 0.9, horizon + h * 0.02);
  c.closePath(); c.fill();
  c.fillStyle = artMix('#f0dba0', '#fff0d8', 0.3);
  c.fillRect(x - w * 0.05, horizon - h * 0.004, w * 0.95, h * 0.024);
  // Lohikäärme kaartaa vuorten yllä
  drawDragonSilhouette(c, vx - h * 0.25 + Math.sin(globalT * 0.7) * h * 0.06, horizon - h * 0.3 + Math.cos(globalT * 0.9) * h * 0.02, h * 0.018, Math.sin(globalT * 6), 'rgba(90,60,120,' + (0.6 * k) + ')');
}

function drawSailIslands(c, x, horizon, h) {
  var i, w = viewW;
  for (i = 0; i < 4; i++) {
    var ix = x + w * (0.05 + i * 0.16), r = h * (0.05 + (i % 2) * 0.02);
    c.fillStyle = artMix('#7fcf68', '#fff0d8', 0.35);
    c.beginPath(); c.arc(ix, horizon + h * 0.005, r, Math.PI, 0); c.fill();
    c.fillStyle = artMix('#f2dfa6', '#fff0d8', 0.3);
    c.fillRect(ix - r, horizon - h * 0.002, r * 2, h * 0.02);
    if (i === 1) drawCastle(c, ix, horizon + h * 0.005, r * 1.1);
    else drawTree(c, ix, horizon + h * 0.005, r * 0.7);
  }
  drawSeaRainbowMini(c, x + w * 0.3, horizon, h);
}
function drawSeaRainbowMini(c, cx, cy, h) {
  var i, bw = h * 0.008, R0 = h * 0.12;
  c.lineCap = 'butt';
  for (i = 0; i < RAINBOW_COLORS.length && i < rainbowShown; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.lineWidth = bw;
    c.globalAlpha = 0.7;
    c.beginPath(); c.arc(cx, cy, R0 - i * bw, Math.PI, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 1;
}

function drawDolphin(c, x, y, s, dir, tilt) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.rotate(-tilt * 0.6);
  artBlob(c, 0, 0, s * 1.5, s * 0.55, '#8fb8d8', { shadeTo: '#5d86ab', lineColor: '#3f6a90', hi: 0.3 });
  artBlob(c, s * 1.5, -s * 0.05, s * 0.55, s * 0.3, '#8fb8d8', { shadeTo: '#5d86ab', lineColor: '#3f6a90' });
  c.beginPath(); c.moveTo(-s * 0.2, -s * 0.4); c.lineTo(s * 0.3, -s * 1.15); c.lineTo(s * 0.6, -s * 0.35); c.closePath();
  artFillPath(c, '#7aa6cc', -s * 1.15, -s * 0.35, s * 0.4, { lineColor: '#3f6a90' });
  c.beginPath(); c.moveTo(-s * 1.4, 0); c.lineTo(-s * 2.0, -s * 0.5); c.lineTo(-s * 1.9, s * 0.45); c.closePath();
  artFillPath(c, '#7aa6cc', -s * 0.5, s * 0.45, s * 0.4, { lineColor: '#3f6a90' });
  artEye(c, s * 1.0, -s * 0.15, s * 0.12, 0.3, false);
  c.restore();
}

// ---------- Saaristokartan avomerimerkki ----------
// Poiju, jossa on nuolikyltti ja pieni vuori: "tänne päin on lisää maailmaa".
function drawSeaExit(c) {
  if (!landUnlocked()) return;
  var e = seaExitPos(), r = e.r, bob = Math.sin(globalT * 2.2) * r * 0.08;
  var isNext = !seaNextIsland() && !islandDone(LAND_PLACES[0]);
  if (isNext) {
    var gl = c.createRadialGradient(e.x, e.y, r * 0.5, e.x, e.y, r * 2.4);
    gl.addColorStop(0, 'rgba(255,230,140,' + (0.4 + Math.sin(globalT * 4) * 0.12) + ')');
    gl.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = gl;
    c.beginPath(); c.arc(e.x, e.y, r * 2.4, 0, Math.PI * 2); c.fill();
  }
  // Kaukainen maa usvassa horisontin takana
  c.globalAlpha = 0.35 + Math.sin(globalT * 0.8) * 0.08;
  c.fillStyle = '#9c8fc8';
  c.beginPath(); c.moveTo(e.x - r * 1.2, e.y - r * 2.2); c.lineTo(e.x - r * 0.4, e.y - r * 3.3); c.lineTo(e.x + r * 0.3, e.y - r * 2.6); c.lineTo(e.x + r * 0.9, e.y - r * 3.6); c.lineTo(e.x + r * 1.8, e.y - r * 2.2); c.closePath(); c.fill();
  c.globalAlpha = 1;
  // Poiju
  artBlob(c, e.x, e.y + r * 0.9 + bob, r * 0.9, r * 0.22, '#7ec8e8', { line: false, alpha: 0.35 });
  artBlob(c, e.x, e.y + r * 0.55 + bob, r * 0.75, r * 0.35, '#ff6a5a', { hi: 0.3 });
  artRoundRect(c, e.x - r * 0.12, e.y - r * 1.5 + bob, r * 0.24, r * 2.0, r * 0.1, '#8a5a30', {});
  // Nuolikyltti itään
  c.beginPath();
  c.moveTo(e.x - r * 0.9, e.y - r * 1.5 + bob);
  c.lineTo(e.x + r * 0.5, e.y - r * 1.5 + bob);
  c.lineTo(e.x + r * 1.0, e.y - r * 1.05 + bob);
  c.lineTo(e.x + r * 0.5, e.y - r * 0.6 + bob);
  c.lineTo(e.x - r * 0.9, e.y - r * 0.6 + bob);
  c.closePath();
  artFillPath(c, '#ffd24f', e.y - r * 1.5 + bob, e.y - r * 0.6 + bob, r * 0.5, { lineColor: '#b8862a' });
  // Kyltissä pieni vuori ja lohikäärmeen pää
  c.fillStyle = '#7a5aa8';
  c.beginPath(); c.moveTo(e.x - r * 0.7, e.y - r * 0.75 + bob); c.lineTo(e.x - r * 0.35, e.y - r * 1.35 + bob); c.lineTo(e.x, e.y - r * 0.75 + bob); c.closePath(); c.fill();
  if (HUB_ICONS.nest) HUB_ICONS.nest(c, e.x + r * 0.35, e.y - r * 1.02 + bob, r * 1.7);
  if (isNext) drawHintArrow(c, e.x, e.y - r * 2.5);
}

// Sokkelon lähtöruutu mantereella: tienviitta polun päässä (satamaruudun vastine)
function drawLandSign(c, x, y, s) {
  artBlob(c, x, y + s * 0.3, s * 0.42, s * 0.12, '#000000', { line: false, alpha: 0.15 });
  artRoundRect(c, x - s * 0.05, y - s * 0.4, s * 0.1, s * 0.72, s * 0.04, '#8a5a30', {});
  c.beginPath();
  c.moveTo(x - s * 0.02, y - s * 0.42); c.lineTo(x + s * 0.3, y - s * 0.42); c.lineTo(x + s * 0.3, y - s * 0.22); c.lineTo(x - s * 0.02, y - s * 0.22); c.lineTo(x - s * 0.14, y - s * 0.32); c.closePath();
  artFillPath(c, '#ffd24f', y - s * 0.42, y - s * 0.22, s * 0.2, { lineColor: '#b8862a' });
  c.beginPath();
  c.moveTo(x + s * 0.02, y - s * 0.16); c.lineTo(x - s * 0.28, y - s * 0.16); c.lineTo(x - s * 0.28, y + s * 0.04); c.lineTo(x + s * 0.02, y + s * 0.04); c.lineTo(x + s * 0.14, y - s * 0.06); c.closePath();
  artFillPath(c, '#7fd4ff', y - s * 0.16, y + s * 0.04, s * 0.2, { lineColor: '#3a86b8' });
  drawBoat(c, x - s * 0.13, y - s * 0.03, s * 0.2);
  c.fillStyle = '#7a5aa8';
  c.beginPath(); c.moveTo(x + s * 0.04, y - s * 0.25); c.lineTo(x + s * 0.14, y - s * 0.39); c.lineTo(x + s * 0.24, y - s * 0.25); c.closePath(); c.fill();
}
