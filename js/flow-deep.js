'use strict';

// Meren valtakunta: pelin kolmas ylätason kartta meren pohjassa. Paikat
// (DEEP_PLACES, johdettu WORLDS-rekisterin place-kentästä, region 'deep')
// ovat maailmoja kuten saaret ja Kaukamaan paikat: paikan napautus
// kuljettaa kuplasukellusveneen sinne ja avaa paikan sokkelon.
// Sinne sukelletaan Kaukamaan länsirannikon kuplasukellusveneestä, kun
// Myrskynoita on ystävä (tarinan luku 'kutsu'). Siirtymä on sukellus
// (state 'dive'): vesi tummuu, kalat ja kuplat ohittavat ja Korallikylä
// nousee pohjasta. Vasemman yläkulman pintapoiju vie takaisin Kaukamaalle.
// Tarina: Merikuningattaren kruunusta ovat kadonneet valohelmet, ja meressä
// on hämärää. Jokainen paikka palauttaa kruunuun yhden helmen. Luolan
// mustekala kurkkii kartalla (hänen tarinansa kerrotaan myöhemmin).
//
// Yhteiset piirrot muille meritiedostoille: drawDeepMermaid (merenneito),
// drawDeepSub (kuplasukellusvene ja ratsastajat), drawDeepFish, drawDeepBubble.

var DEEP_DIVE_T = 4.4;
// Hämärät paikat vihjaavat tulevista paikoista; napautus näyttää lukon
var DEEP_FOG = [
  { fx: 0.50, fy: 0.37, size: 0.85 },
  { fx: 0.70, fy: 0.63, size: 0.85 },
  { fx: 0.86, fy: 0.36, size: 0.78 },
  { fx: 0.52, fy: 0.86, size: 0.72 }
];
var deep = {
  state: 'map', t: 0, dir: 1, fanfare: false,
  pawn: { x: 0, y: 0, facing: 1, at: -1, target: null },
  toast: { t: 0, x: 0, y: 0 },
  whaleT: 9
};
var deepBgCanvas = document.createElement('canvas');
var deepBgKey = '';
// Pienet yllätykset: simpukka aukeaa, parvi pyrähtää, valas laulaa, mustekala piiloutuu
var deepFx = { clam: -1, clamN: 0, school: -1, whale: -1, octo: -1, octoN: 0, bubbles: [] };
var deepPearls = { reveal: -1, t: 0 };

// ---------- Alue ja paikat ----------
function deepPlaceByWorld(w) {
  var i;
  for (i = 0; i < DEEP_PLACES.length; i++) if (DEEP_PLACES[i].world === w) return DEEP_PLACES[i];
  return null;
}
function deepPlaceIndex(pl) {
  var i;
  for (i = 0; i < DEEP_PLACES.length; i++) if (DEEP_PLACES[i] === pl) return i;
  return -1;
}
function deepPlaceUnlocked(i) {
  var j = i - 1;
  if (DEEP_PLACES[i] && DEEP_PLACES[i].bonus) return deepUnlocked();
  while (j >= 0 && DEEP_PLACES[j].bonus) j--;
  return j < 0 || islandDone(DEEP_PLACES[j]);
}
// Meren valtakunta aukeaa, kun Myrskynoita on ystävä (tai jos siellä on jo pelattu)
function deepUnlocked() {
  var i;
  if (DEEP_PLACES.length === 0) return false;
  if (storyWorldDone('Myrskyvuori')) return true;
  for (i = 0; i < DEEP_PLACES.length; i++) if (placeStarted(DEEP_PLACES[i])) return true;
  return false;
}
function deepNextPlace() {
  var i;
  for (i = 0; i < DEEP_PLACES.length; i++) {
    if (deepPlaceUnlocked(i) && !islandDone(DEEP_PLACES[i])) return DEEP_PLACES[i];
  }
  return null;
}
function deepPawnSpot(pl) {
  var p = landPlacePos(pl);
  return { x: p.x, y: p.y + p.r * 1.0 };
}
// Pintapoiju: köysi pinnalle, nuolikyltti ylös
function deepSurfacePos() {
  return { x: viewW * 0.2, y: viewH * 0.27, r: viewH * 0.075 };
}
// Kaukamaan kartalla: kuplasukellusvene kelluu länsirannikon meressä
function deepEntryPos() {
  return { x: viewW * 0.075, y: viewH * 0.47, r: viewH * 0.055 };
}
function deepCrownPos() {
  return { x: viewW * 0.86, y: viewH * 0.115, r: viewH * 0.05 };
}
function deepCavePos() {
  return { x: viewW * 0.93, y: viewH * 0.86, r: viewH * 0.09 };
}
function deepClamPos() {
  return { x: viewW * 0.17, y: viewH * 0.90, r: viewH * 0.04 };
}

// ---------- Kruunun valohelmet ----------
// Jokaisen tavallisen paikan vartija palauttaa kruunuun helmen; kruunussa on
// paikka myös tuleville (hämärille) paikoille.
function deepPearlPlaces() {
  var out = [], i;
  for (i = 0; i < DEEP_PLACES.length; i++) if (!DEEP_PLACES[i].final && !DEEP_PLACES[i].bonus) out.push(DEEP_PLACES[i]);
  return out;
}
function deepPearlSlots() { return deepPearlPlaces().length + DEEP_FOG.length; }
function deepPearlsEarned() {
  var n = 0, i, ps = deepPearlPlaces();
  for (i = 0; i < ps.length; i++) if (islandDone(ps[i])) n++;
  return n;
}
function deepPearlsShown() { return storySeen.pearls | 0; }
function deepPearlsCheck() {
  deepPearls.reveal = -1;
  if (deepPearlsEarned() > deepPearlsShown()) {
    deepPearls.reveal = deepPearlsShown();
    deepPearls.t = 0;
    soundFanfare();
  }
}
function deepPearlsUpdate(dt) {
  if (deepPearls.reveal < 0) return;
  deepPearls.t += dt;
  if (deepPearls.t > 2.2) {
    storySeen.pearls = deepPearls.reveal + 1;
    saveProgress();
    deepPearlsCheck();
  }
}

// ---------- Näkymän vaihto ----------
function showDeep(opts) {
  var i, pl, p, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'seaBtn'];
  opts = opts || {};
  if (!opts.dive && storyMaybe('deep', showDeep)) return;
  if (mode !== 'deep' && !opts.dive) fadeStart();
  mode = 'deep';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  document.getElementById('hubChrome').style.display = 'flex';
  setChromeTitle('Meren valtakunta');
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  castleBtnShow();
  document.body.style.background = '#2f7fc8';
  lastTime = 0;
  deep.state = opts.dive ? 'dive' : 'map';
  deep.t = 0;
  deep.dir = opts.dir || 1;
  deep.fanfare = false;
  deep.pawn.target = null;
  deep.toast.t = 0;
  pl = worldRegion(hubWorld) === 'deep' ? deepPlaceByWorld(hubWorld) : null;
  if (pl && !deepPlaceUnlocked(deepPlaceIndex(pl))) pl = null;
  if (pl) {
    deep.pawn.at = deepPlaceIndex(pl);
    p = deepPawnSpot(pl);
  } else {
    deep.pawn.at = -1;
    p = deepSurfacePos();
    p = { x: p.x + p.r * 0.9, y: p.y + p.r * 0.9 };
  }
  deep.pawn.x = p.x;
  deep.pawn.y = p.y;
  deep.pawn.facing = 1;
  if (deep.state === 'map') deepPearlsCheck();
}

// Kaukamaan kartalta: sukellus alas
function deepDive() {
  playNote(392, 0, 0.14, 'sine', 0.3);
  playNote(330, 0.12, 0.14, 'sine', 0.3);
  playNote(262, 0.24, 0.3, 'sine', 0.3);
  showDeep({ dive: true, dir: 1 });
}
// Pintapoijusta: nousu takaisin Kaukamaalle
function deepLeave() {
  deep.state = 'dive';
  deep.dir = -1;
  deep.t = 0;
  deep.fanfare = false;
  playNote(262, 0, 0.12, 'sine', 0.3);
  playNote(392, 0.1, 0.12, 'sine', 0.3);
  playNote(523, 0.2, 0.25, 'sine', 0.3);
}
function deepDiveEnd() {
  var fin, e;
  if (deep.dir > 0) {
    deep.state = 'map';
    deep.t = 0;
    // Peli jatkuu meren pohjasta, kun se avataan seuraavan kerran
    lastIsland = DEEP_PLACES[0].world;
    saveProgress();
    if (!storyMaybe('deep', showDeep)) deepPearlsCheck();
    return;
  }
  // Pintaan: Kaukamaan kartalle, sukellusvene kelluu omalla paikallaan
  fin = landFinalPlace() || LAND_PLACES[LAND_PLACES.length - 1];
  hubWorld = fin.world;
  lastIsland = fin.world;
  saveProgress();
  showLand();
  e = deepEntryPos();
  land.pawn.at = -1;
  land.pawn.target = null;
  land.pawn.x = e.x + e.r * 1.6;
  land.pawn.y = e.y + e.r * 0.6;
}

function deepToastShow(x, y) {
  deep.toast.t = 1.8;
  deep.toast.x = x;
  deep.toast.y = y;
  playNote(392, 0, 0.18, 'triangle', 0.28);
}

// ---------- Kaukamaan kartan sukellusvene ----------
function drawDeepEntry(c) {
  if (!deepUnlocked()) return;
  var e = deepEntryPos(), bob = Math.sin(globalT * 2.3) * e.r * 0.08, i, k;
  var isNext = !landNextPlace() && !!deepNextPlace() && deepPlaceIndex(deepNextPlace()) === 0 && !placeStarted(DEEP_PLACES[0]);
  if (isNext) {
    var gl = c.createRadialGradient(e.x, e.y, e.r * 0.5, e.x, e.y, e.r * 2.4);
    gl.addColorStop(0, 'rgba(160,240,255,' + (0.45 + Math.sin(globalT * 4) * 0.12) + ')');
    gl.addColorStop(1, 'rgba(160,240,255,0)');
    c.fillStyle = gl;
    c.beginPath(); c.arc(e.x, e.y, e.r * 2.4, 0, Math.PI * 2); c.fill();
  }
  // Kuplat nousevat sukellusveneen alta
  for (i = 0; i < 4; i++) {
    k = (globalT * 0.5 + i * 0.25) % 1;
    drawDeepBubble(c, e.x + Math.sin(i * 2.1 + globalT) * e.r * 0.5, e.y + e.r * (1.1 - k * 1.2), e.r * (0.08 + i * 0.02), 1 - k);
  }
  artBlob(c, e.x, e.y + e.r * 0.7 + bob, e.r * 1.2, e.r * 0.22, '#ffffff', { line: false, alpha: 0.35 });
  drawDeepSub(c, e.x, e.y + bob, e.r * 0.8, 1, false);
  if (isNext) drawHintArrow(c, e.x, e.y - e.r * 1.6);
}
function deepEntryTap(px, py) {
  if (!deepUnlocked()) return false;
  var e = deepEntryPos();
  if (Math.hypot(px - e.x, py - e.y) > e.r * 1.5) return false;
  deepDive();
  return true;
}
// Sokkelon lähtöruutu meressä: pintapoiju (satamaruudun vastine)
function drawDeepSign(c, x, y, s) {
  var bob = Math.sin(globalT * 2) * s * 0.03;
  artBlob(c, x, y + s * 0.32, s * 0.4, s * 0.1, '#000000', { line: false, alpha: 0.15 });
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = Math.max(1.5, s * 0.03);
  c.beginPath(); c.moveTo(x, y + s * 0.3); c.quadraticCurveTo(x + s * 0.08, y - s * 0.1, x, y - s * 0.5 + bob); c.stroke();
  artCircle(c, x, y - s * 0.5 + bob, s * 0.13, '#ff6a8a', { hi: 0.4 });
  drawDeepSub(c, x + s * 0.06, y + s * 0.08, s * 0.2, 1, false);
}

// ---------- Syöte ----------
function handleDeepTap(px, py) {
  var i, p, dx, dy, sf;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (deep.state === 'dive') { deepDiveEnd(); return; }
  sf = deepSurfacePos();
  if (Math.hypot(px - sf.x, py - sf.y) <= sf.r * 1.3) { deepLeave(); return; }
  for (i = 0; i < DEEP_PLACES.length; i++) {
    p = landPlacePos(DEEP_PLACES[i]);
    dx = px - p.x; dy = py - p.y;
    if (dx * dx + dy * dy > p.r * p.r * 1.9) continue;
    if (!deepPlaceUnlocked(i)) { deepToastShow(p.x, p.y - p.r * 1.4); return; }
    if (deep.pawn.at === i && !deep.pawn.target) {
      hubEnterIsland(DEEP_PLACES[i].world);
      return;
    }
    deep.pawn.target = DEEP_PLACES[i];
    playNote(523, 0, 0.12, 'sine', 0.3);
    playNote(659, 0.1, 0.16, 'sine', 0.3);
    return;
  }
  for (i = 0; i < DEEP_FOG.length; i++) {
    p = landPlacePos(DEEP_FOG[i]);
    dx = px - p.x; dy = py - p.y;
    if (dx * dx + dy * dy <= p.r * p.r * 1.9) { deepToastShow(p.x, p.y - p.r * 1.4); return; }
  }
  deepFxTap(px, py);
}

// Kartan yllätykset
function deepWhalePos() {
  if (deep.whaleT > 0) return null;
  var t = -deep.whaleT / 16;
  return { x: viewW * (-0.15 + t * 1.3), y: viewH * (0.2 + Math.sin(t * Math.PI * 2) * 0.025) };
}
function deepSchoolPos(t) {
  var per = viewW * 1.4, x = ((t * viewW * 0.05) % per) - viewW * 0.2;
  return { x: x, y: viewH * (0.52 + Math.sin(t * 0.4) * 0.05) };
}
function deepFxTap(px, py) {
  var h = viewH, wp = deepWhalePos(), cp = deepCavePos(), cl = deepClamPos(), sc = deepSchoolPos(globalT), cr = deepCrownPos();
  if (Math.hypot(px - cr.x, py - cr.y) < cr.r * 1.5) {
    playNote(1047, 0, 0.1, 'sine', 0.2); playNote(1319, 0.08, 0.1, 'sine', 0.18); playNote(1568, 0.16, 0.2, 'sine', 0.16);
    deepFx.bubbles.push({ x: cr.x, y: cr.y + cr.r, t: 0, big: true });
    return true;
  }
  if (wp && Math.hypot(px - wp.x, py - wp.y) < h * 0.09) {
    deepFx.whale = 0;
    playNote(147, 0, 0.9, 'sine', 0.25); playNote(196, 0.5, 0.9, 'sine', 0.22); playNote(165, 1.1, 1.2, 'sine', 0.2);
    return true;
  }
  if (Math.hypot(px - cp.x, py - cp.y) < cp.r * 1.3) {
    if (deepFx.octo < 0) {
      deepFx.octo = 0;
      deepFx.octoN++;
      playNote(988, 0, 0.06, 'square', 0.1); playNote(740, 0.07, 0.1, 'square', 0.1);
    }
    return true;
  }
  if (Math.hypot(px - cl.x, py - cl.y) < cl.r * 1.8) {
    if (deepFx.clam < 0) {
      deepFx.clam = 0;
      deepFx.clamN++;
      playNote(523, 0, 0.12, 'triangle', 0.25); playNote(784, 0.12, 0.2, 'triangle', 0.22);
      if (deepFx.clamN % 3 === 0) soundStar(3);
    }
    return true;
  }
  if (Math.abs(px - sc.x) < h * 0.12 && Math.abs(py - sc.y) < h * 0.07) {
    if (deepFx.school < 0) {
      deepFx.school = 0;
      playNote(1175, 0, 0.05, 'sine', 0.15); playNote(1397, 0.04, 0.05, 'sine', 0.15); playNote(1760, 0.08, 0.08, 'sine', 0.15);
    }
    return true;
  }
  // Muualle napautus puhaltaa kuplan
  deepFx.bubbles.push({ x: px, y: py, t: 0 });
  if (deepFx.bubbles.length > 12) deepFx.bubbles.shift();
  playNote(660 + Math.random() * 300, 0, 0.08, 'sine', 0.14);
  return false;
}
function deepFxUpdate(dt) {
  var i;
  if (deepFx.clam >= 0) { deepFx.clam += dt; if (deepFx.clam > 2.2) deepFx.clam = -1; }
  if (deepFx.school >= 0) { deepFx.school += dt; if (deepFx.school > 1.6) deepFx.school = -1; }
  if (deepFx.whale >= 0) { deepFx.whale += dt; if (deepFx.whale > 2.4) deepFx.whale = -1; }
  if (deepFx.octo >= 0) { deepFx.octo += dt; if (deepFx.octo > 3.0) deepFx.octo = -1; }
  for (i = deepFx.bubbles.length - 1; i >= 0; i--) {
    deepFx.bubbles[i].t += dt;
    if (deepFx.bubbles[i].t > 2.5) deepFx.bubbles.splice(i, 1);
  }
}

// ---------- Päivitys ----------
function updateDeep(dt) {
  var s, dx, dy, dist, sp;
  globalT += dt;
  deepFxUpdate(dt);
  deepPearlsUpdate(dt);
  if (deep.toast.t > 0) deep.toast.t -= dt;
  deep.whaleT -= dt;
  if (deep.whaleT < -16) deep.whaleT = 14 + Math.random() * 10;
  if (deep.state === 'dive') {
    deep.t += dt;
    if (!deep.fanfare && deep.t > DEEP_DIVE_T * 0.62) {
      deep.fanfare = true;
      soundFanfare();
    }
    if (deep.t >= DEEP_DIVE_T) deepDiveEnd();
    return;
  }
  if (deep.pawn.target) {
    s = deepPawnSpot(deep.pawn.target);
    dx = s.x - deep.pawn.x;
    dy = s.y - deep.pawn.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    sp = viewH * 0.34 * dt;
    if (dx > 2) deep.pawn.facing = 1;
    else if (dx < -2) deep.pawn.facing = -1;
    if (dist <= sp || dist < 1) {
      deep.pawn.x = s.x;
      deep.pawn.y = s.y;
      deep.pawn.at = deepPlaceIndex(deep.pawn.target);
      deep.pawn.target = null;
      hubEnterIsland(DEEP_PLACES[deep.pawn.at].world);
    } else {
      deep.pawn.x += (dx / dist) * sp;
      deep.pawn.y += (dy / dist) * sp;
    }
  }
}

// ---------- Piirto: kartta ----------
function drawDeep() {
  if (!viewW || !viewH) return;
  if (deep.state === 'dive') { drawDeepDive(); return; }
  renderDeepBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(deepBgCanvas, 0, 0, deepBgCanvas.width, deepBgCanvas.height, 0, 0, viewW, viewH);
  drawDeepRays(ctx, viewW, viewH, globalT, 0.5);
  drawDeepWhale(ctx);
  drawDeepSchool(ctx);
  drawDeepKelpSway(ctx);
  drawDeepCave(ctx);
  drawDeepClam(ctx);
  drawDeepAmbientBubbles(ctx);
  drawDeepCrown(ctx);

  var i, p, pl, nx = deepNextPlace(), left, sf = deepSurfacePos();
  drawDeepSurfaceBuoy(ctx, sf);
  for (i = 0; i < DEEP_FOG.length; i++) drawDeepFog(ctx, landPlacePos(DEEP_FOG[i]), i);
  for (i = 0; i < DEEP_PLACES.length; i++) {
    pl = DEEP_PLACES[i];
    p = landPlacePos(pl);
    if (pl === nx) {
      var gl = ctx.createRadialGradient(p.x, p.y, p.r * 0.9, p.x, p.y, p.r * 1.7);
      gl.addColorStop(0, 'rgba(190,250,255,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
      gl.addColorStop(1, 'rgba(190,250,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    drawDeepPlace(ctx, pl, p, deepPlaceUnlocked(i));
    if (!deepPlaceUnlocked(i)) drawHubLock(ctx, p.x, p.y + p.r * 0.05, p.r * 1.0);
    else if (islandDone(pl)) drawDeepPearl(ctx, p.x + p.r * 0.8, p.y - p.r * 0.85, p.r * 0.15, 1);
    left = deepPlaceUnlocked(i) ? islandUnplayedCount(pl) : 0;
    if (left > 0) drawIslandUnplayed(ctx, p, left);
    if (pl === nx) drawHintArrow(ctx, p.x, p.y - p.r * 1.5);
  }

  // Kuplasukellusvene kuljettaa prinsessaa ja yksisarvista
  var moving = !!deep.pawn.target, bob = Math.sin(globalT * 2.2) * viewH * 0.006;
  drawDeepSub(ctx, deep.pawn.x, deep.pawn.y - viewH * 0.03 + bob, viewH * 0.042, deep.pawn.facing, moving);
  drawDeepTapBubbles(ctx);
  drawStarBalance(ctx, viewH * 0.03, viewH * 0.065);

  if (deep.toast.t > 0) {
    ctx.globalAlpha = Math.min(1, deep.toast.t * 2);
    var tw = viewH * 0.14, th = viewH * 0.11;
    var tx = Math.min(Math.max(deep.toast.x - tw / 2, viewH * 0.02), viewW - tw - viewH * 0.02);
    var ty = Math.max(deep.toast.y - th / 2, viewH * 0.14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, tx, ty, tw, th, viewH * 0.03);
    ctx.fill();
    drawHubLock(ctx, tx + tw / 2, ty + th * 0.55, th * 0.7);
    ctx.globalAlpha = 1;
  }
}

// Paikka: hiekkasärkkä, värikäs kupoli ja huoneiden kuvakkeet
function drawDeepPlace(c, pl, p, unlocked) {
  var room = null, k, xs, col;
  var hub = HUB_WORLDS[pl.world];
  if (hub && hub.order.length) room = hub.rooms[hubRoomChar(hub, hub.order[0])];
  col = unlocked && room ? room.color : '#8fa8c0';
  artBlob(c, p.x, p.y + p.r * 0.3, p.r * 1.4, p.r * 0.5, unlocked ? '#e8d29a' : '#7f9ab4', { line: false, alpha: 0.6 });
  artBlob(c, p.x, p.y + p.r * 0.15, p.r * 1.2, p.r * 0.46, unlocked ? '#f4e2b0' : '#9ab0c6', { lineColor: unlocked ? '#c4a462' : '#6a84a0', hi: 0.2 });
  if (unlocked) {
    // Korallioksat särkän reunoilla
    drawCoral(c, p.x - p.r * 1.0, p.y + p.r * 0.2, p.r * 0.32, '#ff8fa8', false);
    drawCoral(c, p.x + p.r * 1.05, p.y + p.r * 0.22, p.r * 0.26, '#ffb35c', false);
  }
  artCircle(c, p.x, p.y - p.r * 0.25, p.r * 0.7, col, { lineColor: artShade(col, -0.4), hi: 0.35 });
  if (!unlocked) return;
  if (pl.deco && pl.deco.length) {
    xs = pl.deco.length === 1 ? [0] : (pl.deco.length === 2 ? [-0.3, 0.3] : [-0.5, 0, 0.5]);
    for (k = 0; k < pl.deco.length && k < 3; k++) {
      drawHubRoomIcon(c, pl.deco[k], p.x + xs[k] * p.r, p.y - p.r * 0.2, p.r * (pl.deco.length === 1 ? 2.8 : 2.0));
    }
  }
}
// Hämärä paikka: tumma vesipilvi, lukko ja hiljaa leijuvat kuplat
function drawDeepFog(c, p, i) {
  var k;
  c.fillStyle = 'rgba(20,50,100,0.38)';
  for (k = 0; k < 5; k++) {
    c.beginPath();
    c.arc(p.x + (k - 2) * p.r * 0.42 + Math.sin(globalT * 0.4 + k + i) * p.r * 0.06, p.y - p.r * 0.1 + (k % 2) * p.r * 0.25, p.r * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  for (k = 0; k < 2; k++) {
    var b = (globalT * 0.3 + k * 0.5 + i * 0.17) % 1;
    drawDeepBubble(c, p.x + (k - 0.5) * p.r * 0.6, p.y - b * p.r * 1.2, p.r * 0.07, (1 - b) * 0.7);
  }
  c.globalAlpha = 0.5;
  drawHubLock(c, p.x, p.y + p.r * 0.05, p.r * 0.8);
  c.globalAlpha = 1;
}

// Pintapoiju: köysi pinnalta, poiju ja nuolikyltti ylös
function drawDeepSurfaceBuoy(c, sf) {
  var r = sf.r, bob = Math.sin(globalT * 1.8) * r * 0.06;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1.5, r * 0.05);
  c.beginPath();
  c.moveTo(sf.x, 0);
  c.quadraticCurveTo(sf.x + r * 0.2 + Math.sin(globalT) * r * 0.1, sf.y * 0.5, sf.x, sf.y - r * 0.5 + bob);
  c.stroke();
  // Nuolikyltti ylös
  c.beginPath();
  c.moveTo(sf.x, sf.y - r * 1.15 + bob);
  c.lineTo(sf.x + r * 0.55, sf.y - r * 0.55 + bob);
  c.lineTo(sf.x + r * 0.25, sf.y - r * 0.55 + bob);
  c.lineTo(sf.x + r * 0.25, sf.y + r * 0.05 + bob);
  c.lineTo(sf.x - r * 0.25, sf.y + r * 0.05 + bob);
  c.lineTo(sf.x - r * 0.25, sf.y - r * 0.55 + bob);
  c.lineTo(sf.x - r * 0.55, sf.y - r * 0.55 + bob);
  c.closePath();
  artFillPath(c, '#ffd24f', sf.y - r * 1.15 + bob, sf.y + r * 0.05 + bob, r * 0.5, { lineColor: '#b8862a' });
  // Pieni aurinko kyltissä: tuolla ylhäällä on Kaukamaa
  artCircle(c, sf.x, sf.y - r * 0.3 + bob, r * 0.14, '#ff9f3a', { lineColor: '#c86a10' });
  artCircle(c, sf.x, sf.y + r * 0.32 + bob, r * 0.22, '#ff6a8a', { hi: 0.4 });
}

// Merikuningattaren kruunu: helmipaikat sakaroiden päissä
function drawDeepCrown(c) {
  var cr = deepCrownPos(), n = deepPearlSlots(), got = deepPearlsShown(), r = cr.r, i, px, py, k, a;
  var w = r * 2.6, base = cr.y + r * 0.55, top = cr.y - r * 0.2;
  artGlow(c, cr.x, cr.y, r * 2.2, '#bff4ff', 0.12 + got * 0.05);
  c.beginPath();
  c.moveTo(cr.x - w / 2, base);
  for (i = 0; i <= n; i++) {
    px = cr.x - w / 2 + (i / n) * w;
    c.lineTo(px, top + (i % 1) * r);
    if (i < n) c.lineTo(px + w / n / 2, top - r * 0.55 - (Math.abs(i - (n - 1) / 2) < 1 ? r * 0.18 : 0));
  }
  c.lineTo(cr.x + w / 2, base);
  c.closePath();
  artFillPath(c, '#ffd24f', top - r * 0.7, base, r * 0.6, { lineColor: '#b8862a' });
  artRoundRect(c, cr.x - w / 2 - r * 0.08, base - r * 0.2, w + r * 0.16, r * 0.32, r * 0.12, '#ffbf3a', { lineColor: '#b8862a' });
  for (i = 0; i < n; i++) {
    px = cr.x - w / 2 + (i + 0.5) / n * w;
    py = top - r * 0.55 - (Math.abs(i - (n - 1) / 2) < 1 ? r * 0.18 : 0);
    if (i < got) drawDeepPearl(c, px, py, r * 0.2, 1);
    else if (i === deepPearls.reveal) {
      k = easeOutBack(Math.min(1, deepPearls.t / 1.2));
      a = Math.max(0, 1 - deepPearls.t / 1.6);
      drawDeepPearl(c, px, py, r * 0.2 * k, 1);
      if (a > 0) {
        artGlow(c, px, py, r * 1.2 * (1 - a * 0.5), '#ffffff', a * 0.8);
        drawStar(c, px, py - r * 0.4 - (1 - a) * r * 0.8, r * 0.3 * a, globalT * 3, 1);
      }
    } else {
      artCircle(c, px, py, r * 0.16, '#3a5a7a', { lineColor: '#b8862a' });
    }
  }
}
function drawDeepPearl(c, x, y, r, glow) {
  if (glow) artGlow(c, x, y, r * 2.6, '#fff6ff', 0.35 * glow + Math.sin(globalT * 3 + x) * 0.08);
  artCircle(c, x, y, r, '#fdf3ff', { shadeTo: '#e0c8f0', lineColor: '#b89ad0', hi: 0.6 });
}

// Valokeilat pinnalta (myös sukelluksessa ja kenttien taustoissa)
function drawDeepRays(c, w, h, t, alpha) {
  var i, x, a;
  c.save();
  for (i = 0; i < 5; i++) {
    x = w * (0.12 + i * 0.21) + Math.sin(t * 0.3 + i) * w * 0.02;
    a = (0.06 + Math.sin(t * 0.7 + i * 1.7) * 0.03) * alpha;
    var g = c.createLinearGradient(0, 0, 0, h * 0.85);
    g.addColorStop(0, 'rgba(230,252,255,' + (a * 2) + ')');
    g.addColorStop(1, 'rgba(230,252,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - w * 0.03, 0); c.lineTo(x + w * 0.03, 0);
    c.lineTo(x + w * 0.11, h * 0.85); c.lineTo(x - w * 0.01, h * 0.85);
    c.closePath(); c.fill();
  }
  c.restore();
}
function drawDeepWhale(c) {
  var wp = deepWhalePos(), s, k;
  if (!wp) return;
  s = viewH * 0.06;
  c.save();
  c.globalAlpha = 0.45;
  c.fillStyle = '#2a5f96';
  c.beginPath();
  if (c.ellipse) c.ellipse(wp.x, wp.y, s * 2.2, s * 0.8, 0, 0, Math.PI * 2); else c.arc(wp.x, wp.y, s, 0, Math.PI * 2);
  c.fill();
  var tail = Math.sin(globalT * 2) * s * 0.3;
  c.beginPath();
  c.moveTo(wp.x - s * 2.0, wp.y);
  c.lineTo(wp.x - s * 3.0, wp.y - s * 0.7 + tail);
  c.lineTo(wp.x - s * 2.8, wp.y + tail * 0.3);
  c.lineTo(wp.x - s * 3.0, wp.y + s * 0.7 + tail);
  c.closePath(); c.fill();
  c.restore();
  if (deepFx.whale >= 0) {
    // Laulu: soivat renkaat ja nuotit
    k = deepFx.whale / 2.4;
    c.strokeStyle = 'rgba(220,250,255,' + (0.7 * (1 - k)) + ')';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    c.beginPath(); c.arc(wp.x + s * 1.8, wp.y - s * 0.2, s * (0.4 + k * 2), -0.8, 0.8); c.stroke();
    c.beginPath(); c.arc(wp.x + s * 1.8, wp.y - s * 0.2, s * (0.2 + k * 1.3), -0.8, 0.8); c.stroke();
    drawDeepBubble(c, wp.x + s * 1.2, wp.y - s * 0.8 - k * s * 2.5, s * 0.22, 1 - k);
  }
}
function drawDeepSchool(c) {
  var sc = deepSchoolPos(globalT), i, ox, oy, k = deepFx.school >= 0 ? deepFx.school / 1.6 : 0;
  var spread = 1 + Math.sin(k * Math.PI) * 2.2, cols = ['#ffd24f', '#ff9d5c', '#7fe0ff'];
  for (i = 0; i < 8; i++) {
    ox = ((i % 4) - 1.5) * viewH * 0.03 * spread + Math.sin(globalT * 2 + i) * viewH * 0.005;
    oy = (Math.floor(i / 4) - 0.5) * viewH * 0.03 * spread + ((i % 2) * viewH * 0.012);
    drawDeepFish(c, sc.x + ox, sc.y + oy, viewH * 0.012, cols[i % 3], 1, globalT * 6 + i);
  }
}
// Etualan levät heiluvat (taustan levät ovat paikallaan)
function drawDeepKelpSway(c) {
  var spots = [[0.03, 1.0, 0.2], [0.42, 1.02, 0.17], [0.99, 0.62, 0.16], [0.64, 1.02, 0.15]], i;
  for (i = 0; i < spots.length; i++) {
    drawKelp(c, viewW * spots[i][0], viewH * spots[i][1], viewH * spots[i][2], 0, Math.sin(globalT * 0.9 + i * 1.3) * 0.8);
  }
}
// Mustekalan luola: silmät tuijottavat pimeästä, lonkero heiluu.
// Napautus: lonkero vetäytyy ja silmät painuvat kiinni; joka 3. kerta
// luolan perällä välähtää helmien hohde.
function drawDeepCave(c) {
  var cp = deepCavePos(), r = cp.r, k = deepFx.octo >= 0 ? deepFx.octo / 3.0 : -1, hide, blink, i;
  hide = k < 0 ? 0 : Math.min(1, k * 6) * Math.min(1, (1 - k) * 3);
  if (k >= 0 && deepFx.octoN % 3 === 0) {
    for (i = 0; i < 3; i++) artGlow(c, cp.x + (i - 1) * r * 0.25, cp.y + r * 0.15, r * 0.25, '#fff2ff', 0.6 * Math.sin(Math.min(1, k * 2) * Math.PI));
  }
  // Lonkero kiemurtelee luolan suulta
  var tx = cp.x - r * 0.75, ty = cp.y + r * 0.35, ext = 1 - hide, j, px, py, lw;
  if (ext > 0.05) {
    c.lineCap = 'round';
    for (j = 0; j < 2; j++) {
      c.strokeStyle = j === 0 ? '#7a3a8a' : '#c97ad8';
      lw = r * (j === 0 ? 0.2 : 0.13);
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(cp.x - r * 0.3, ty);
      for (i = 1; i <= 8; i++) {
        px = cp.x - r * 0.3 - (i / 8) * r * 0.9 * ext;
        py = ty - Math.sin(i * 0.7 + globalT * 2) * r * 0.12 * (i / 8) - (i / 8) * r * 0.3 * ext;
        c.lineTo(px, py);
      }
      c.stroke();
    }
    for (i = 2; i <= 6; i += 2) artCircle(c, cp.x - r * 0.3 - (i / 8) * r * 0.9 * ext, ty - Math.sin(i * 0.7 + globalT * 2) * r * 0.12 * (i / 8) - (i / 8) * r * 0.3 * ext + r * 0.07, r * 0.035, '#f0c8f4', { line: false });
  }
  // Silmät pimeässä
  blink = (globalT % 4.3) < 0.15 ? 0.1 : 1;
  var eo = (1 - hide) * blink;
  if (eo > 0.05) {
    for (i = -1; i <= 1; i += 2) {
      c.fillStyle = '#fff7c8';
      c.beginPath();
      if (c.ellipse) c.ellipse(cp.x + i * r * 0.18, cp.y + r * 0.02, r * 0.09, r * 0.09 * eo, 0, 0, Math.PI * 2);
      else c.arc(cp.x + i * r * 0.18, cp.y + r * 0.02, r * 0.09 * eo, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#2a1a3a';
      c.beginPath(); c.arc(cp.x + i * r * 0.18 - r * 0.02, cp.y + r * 0.03, r * 0.045 * eo, 0, Math.PI * 2); c.fill();
    }
  }
}
function drawDeepClam(c) {
  var cl = deepClamPos(), r = cl.r, k = deepFx.clam >= 0 ? deepFx.clam / 2.2 : -1, open;
  open = k < 0 ? 0 : Math.min(1, k * 5) * Math.min(1, (1 - k) * 4);
  artShadow(c, cl.x, cl.y + r * 0.35, r * 1.1, r * 0.25, 0.2);
  // Alakuori
  c.beginPath(); c.arc(cl.x, cl.y, r, 0, Math.PI); c.closePath();
  artFillPath(c, '#d8a0d0', cl.y, cl.y + r, r * 0.8, { lineColor: '#8a5a8a' });
  if (open > 0.1) {
    drawDeepPearl(c, cl.x, cl.y - r * 0.15, r * 0.3, open);
    if (deepFx.clamN % 3 === 0) {
      // Pieni rapu kurkistaa kuoren takaa ja vilkuttaa saksea
      artCircle(c, cl.x + r * 0.9, cl.y - r * 0.2 - open * r * 0.4, r * 0.25, '#ff7a5a', { lineColor: '#b0402a' });
      artEye(c, cl.x + r * 0.82, cl.y - r * 0.28 - open * r * 0.4, r * 0.06, 0, false);
      artEye(c, cl.x + r * 0.98, cl.y - r * 0.28 - open * r * 0.4, r * 0.06, 0, false);
    }
  }
  // Yläkuori aukeaa saranasta
  c.save();
  c.translate(cl.x - r, cl.y);
  c.rotate(-open * 0.9);
  c.beginPath(); c.arc(r, 0, r, Math.PI, 0); c.closePath();
  artFillPath(c, '#f0b8e4', -r, 0, r * 0.8, { lineColor: '#8a5a8a' });
  c.strokeStyle = 'rgba(138,90,138,0.5)';
  c.lineWidth = Math.max(1, r * 0.05);
  for (var i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(r, 0); c.lineTo(r + Math.sin(i * 0.5) * r * 0.9, -Math.cos(i * 0.5) * r * 0.9); c.stroke();
  }
  c.restore();
}
function drawDeepAmbientBubbles(c) {
  var i, k, x, y;
  for (i = 0; i < 14; i++) {
    k = (globalT * (0.05 + (i % 4) * 0.012) + i * 0.137) % 1;
    x = viewW * ((i * 0.173 + 0.05) % 1) + Math.sin(globalT + i) * viewH * 0.01;
    y = viewH * (1.02 - k * 1.05);
    drawDeepBubble(c, x, y, viewH * (0.005 + (i % 3) * 0.003), 0.6 * Math.min(1, (1 - k) * 4));
  }
}
function drawDeepTapBubbles(c) {
  var i, b, k;
  for (i = 0; i < deepFx.bubbles.length; i++) {
    b = deepFx.bubbles[i];
    k = b.t / 2.5;
    drawDeepBubble(c, b.x + Math.sin(b.t * 4) * viewH * 0.01, b.y - k * viewH * 0.35, viewH * (b.big ? 0.02 : 0.013) * (1 + k * 0.5), 1 - k);
    if (!b.big) drawDeepBubble(c, b.x + viewH * 0.02, b.y - k * viewH * 0.3 + viewH * 0.02, viewH * 0.007, 1 - k);
  }
}

// Staattinen tausta: vesi, pinnan väreily, kaukaiset kalliot, hiekkapohja,
// korallit, levät, simpukat ja polku paikkojen välillä
function renderDeepBg() {
  var key = viewW + 'x' + viewH + '|' + DEEP_PLACES.length;
  if (deepBgKey === key) return;
  deepBgKey = key;
  deepBgCanvas.width = Math.round(viewW * DPR);
  deepBgCanvas.height = Math.round(viewH * DPR);
  var b = deepBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, i, x, y, k;
  var water = b.createLinearGradient(0, 0, 0, h);
  water.addColorStop(0, '#8fe4f4');
  water.addColorStop(0.35, '#4fb4e0');
  water.addColorStop(1, '#2a6fb8');
  b.fillStyle = water;
  b.fillRect(0, 0, w, h);
  // Pinnan väreily ylhäällä
  b.strokeStyle = 'rgba(255,255,255,0.45)';
  b.lineWidth = Math.max(1.5, h * 0.005);
  for (i = 0; i < 3; i++) {
    b.beginPath();
    for (x = 0; x <= w; x += w / 60) b.lineTo(x, h * (0.015 + i * 0.022) + Math.sin(x / w * 18 + i * 2) * h * 0.006);
    b.stroke();
  }
  // Kaukaiset kalliot ja korallikummut
  var ridge = function (px) { return h * 0.5 - Math.abs(Math.sin(px * 0.004 + 0.4)) * h * 0.12 - Math.sin(px * 0.013) * h * 0.02; };
  fillHillBand(b, w, h, h * 0.75, '#3f88c4', ridge);
  var ridge2 = function (px) { return h * 0.62 - Math.abs(Math.sin(px * 0.006 + 2.1)) * h * 0.08; };
  fillHillBand(b, w, h, h * 0.8, '#3a7cb8', ridge2);
  for (i = 0; i < 9; i++) {
    x = w * (0.05 + i * 0.115);
    drawCoral(b, x, ridge2(x) + h * 0.03, h * (0.04 + (i % 3) * 0.012), artMix(['#ff8fa8', '#ffb35c', '#c99aff'][i % 3], '#3a7cb8', 0.55), true);
  }
  // Hiekkapohja aaltoilevana
  var sand = b.createLinearGradient(0, h * 0.7, 0, h);
  sand.addColorStop(0, '#e9d6a0');
  sand.addColorStop(1, '#d4b878');
  b.fillStyle = sand;
  b.beginPath(); b.moveTo(0, h);
  for (x = 0; x <= w; x += w / 40) b.lineTo(x, h * 0.78 + Math.sin(x / w * 7 + 0.5) * h * 0.03 + Math.sin(x / w * 17) * h * 0.008);
  b.lineTo(w, h); b.closePath(); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 10; i++) {
    x = w * ((i * 0.193 + 0.07) % 1);
    y = h * (0.86 + (i % 3) * 0.04);
    b.beginPath();
    if (b.ellipse) b.ellipse(x, y, h * 0.06, h * 0.01, 0, 0, Math.PI * 2); else b.arc(x, y, h * 0.02, 0, Math.PI * 2);
    b.fill();
  }
  // Levät ja korallit kauempana, meritähdet ja simpukat hiekalla
  for (i = 0; i < 9; i++) {
    x = w * ((i * 0.131 + 0.11) % 1);
    drawKelp(b, x, h * (0.8 + (i % 2) * 0.03), h * (0.12 + (i % 3) * 0.03), 0.35, 0);
  }
  for (i = 0; i < 7; i++) {
    x = w * ((i * 0.157 + 0.2) % 1);
    drawCoral(b, x, h * (0.88 + (i % 2) * 0.05), h * (0.03 + (i % 3) * 0.01), ['#ff8fa8', '#ffb35c', '#c99aff', '#7fe0c8'][i % 4], false);
  }
  for (i = 0; i < 6; i++) {
    x = w * ((i * 0.211 + 0.33) % 1);
    y = h * (0.9 + (i % 2) * 0.05);
    drawDeepStarfish(b, x, y, h * 0.014, ['#ff7a5a', '#ffd24f', '#ff9fc8'][i % 3], i);
  }
  // Mustekalan luolan kallio oikeassa alakulmassa
  var cp = deepCavePos();
  artBlob(b, cp.x + cp.r * 0.2, cp.y + cp.r * 0.25, cp.r * 1.5, cp.r * 1.1, '#5a6f96', { lineColor: '#2f3f60', hi: 0.15 });
  artBlob(b, cp.x, cp.y + cp.r * 0.15, cp.r * 0.62, cp.r * 0.5, '#141c34', { line: false });
  // Polku: pintapoijusta paikkoihin, sitten haaleana hämärään
  var sf = deepSurfacePos(), pts = [{ x: sf.x + sf.r * 0.9, y: sf.y + sf.r * 0.9 }], p;
  for (i = 0; i < DEEP_PLACES.length; i++) if (!DEEP_PLACES[i].bonus) pts.push(deepPawnSpot(DEEP_PLACES[i]));
  for (i = 0; i + 1 < pts.length; i++) drawSeaRoute(b, pts[i], pts[i + 1], 0.75);
  var last = pts[pts.length - 1];
  for (i = 0; i < DEEP_FOG.length; i++) {
    p = landPlacePos(DEEP_FOG[i]);
    drawSeaRoute(b, last, { x: p.x, y: p.y + p.r }, 0.25);
    last = { x: p.x, y: p.y + p.r };
  }
}
function drawDeepStarfish(b, x, y, r, col, seed) {
  var i, a;
  b.beginPath();
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5 + seed;
    b.lineTo(x + Math.cos(a) * r * (i % 2 ? 0.45 : 1), y + Math.sin(a) * r * (i % 2 ? 0.45 : 1) * 0.6);
  }
  b.closePath();
  artFillPath(b, col, y - r, y + r, r, { lineColor: artShade(col, -0.4) });
}

// ---------- Sukellus: vesi tummuu, ja pohja nousee ----------
function drawDeepDive() {
  var t = deep.t, w = viewW, h = viewH, c = ctx, i, x, y, k;
  var p = Math.min(1, t / DEEP_DIVE_T);
  var depth = deep.dir > 0 ? p : 1 - p;
  c.clearRect(0, 0, w, h);
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, artMix('#a8ecff', '#2a6fb8', depth * 0.8));
  g.addColorStop(1, artMix('#4fb4e0', '#123a7a', depth * 0.9));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  drawDeepRays(c, w, h, globalT, 1 - depth * 0.6);
  // Pinta näkyy alussa ylhäällä (nousussa lopussa)
  var surfY = h * 0.18 - depth * h * 1.2;
  if (surfY > -h * 0.2) {
    var sky = c.createLinearGradient(0, surfY - h * 0.5, 0, surfY);
    sky.addColorStop(0, '#8fd0ff');
    sky.addColorStop(1, '#eaf7ff');
    c.fillStyle = sky;
    c.fillRect(0, surfY - h * 0.5, w, h * 0.5);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.moveTo(0, surfY);
    for (x = 0; x <= w; x += w / 40) c.lineTo(x, surfY + Math.sin(x / w * 14 + globalT * 2) * h * 0.008);
    c.lineTo(w, surfY - h * 0.02); c.lineTo(0, surfY - h * 0.02); c.closePath(); c.fill();
    drawBoat(c, w * 0.2, surfY - h * 0.005 + Math.sin(globalT * 2.5) * h * 0.005, h * 0.1);
  }
  // Ohi lipuvat levät ja kalliot (sukeltaessa ne nousevat ylöspäin)
  for (i = 0; i < 6; i++) {
    y = ((i * 0.37 + 0.2) % 1) * h * 1.6 - depth * h * 2.2 + h * 0.4;
    y = ((y % (h * 1.6)) + h * 1.6) % (h * 1.6) - h * 0.2;
    x = i % 2 ? w * 0.05 : w * 0.95;
    artBlob(c, x, y, h * 0.12, h * 0.2, artMix('#3f88c4', '#123a7a', depth * 0.7), { line: false });
    drawKelp(c, x + (i % 2 ? h * 0.05 : -h * 0.05), y - h * 0.12, h * 0.16, 0.3 + depth * 0.4, Math.sin(globalT + i) * 0.6);
  }
  // Kalat uivat ohi
  var cols = ['#ffd24f', '#ff9d5c', '#7fe0ff', '#ff9fc8'];
  for (i = 0; i < 7; i++) {
    k = ((t * (0.12 + (i % 3) * 0.05) + i * 0.17) % 1);
    x = (i % 2 ? k : 1 - k) * w * 1.2 - w * 0.1;
    y = h * (0.25 + (i * 0.11) % 0.6) - (deep.dir > 0 ? 1 : -1) * t * h * 0.03;
    drawDeepFish(c, x, y, h * (0.014 + (i % 3) * 0.004), cols[i % 4], i % 2 ? 1 : -1, globalT * 6 + i);
  }
  // Pohja nousee esiin sukelluksen lopussa: Korallikylän kupolit
  var floorY = h * 1.25 - depth * h * 0.45;
  if (floorY < h) {
    c.fillStyle = artMix('#e9d6a0', '#2a6fb8', 0.25);
    c.beginPath(); c.moveTo(0, h);
    for (x = 0; x <= w; x += w / 30) c.lineTo(x, floorY + Math.sin(x / w * 6) * h * 0.03);
    c.lineTo(w, h); c.closePath(); c.fill();
    var domes = [[0.62, '#ff9fc8'], [0.72, '#4fc8c0'], [0.82, '#ffd24f']];
    for (i = 0; i < domes.length; i++) {
      artCircle(c, w * domes[i][0], floorY - h * 0.02, h * (0.06 - i * 0.008), domes[i][1], { lineColor: artShade(domes[i][1], -0.4), hi: 0.35 });
      artGlow(c, w * domes[i][0], floorY - h * 0.04, h * 0.05, '#fff6c8', 0.3 + Math.sin(globalT * 3 + i) * 0.1);
    }
    drawCoral(c, w * 0.3, floorY + h * 0.02, h * 0.05, '#ff8fa8', false);
    drawCoral(c, w * 0.45, floorY + h * 0.03, h * 0.04, '#c99aff', false);
  }
  // Kuplasukellusvene keskellä, kuplavana
  var sx = w * 0.45 + Math.sin(globalT * 0.8) * w * 0.02, sy = h * 0.5 + Math.sin(globalT * 2) * h * 0.01;
  for (i = 0; i < 6; i++) {
    k = (globalT * 0.9 + i / 6) % 1;
    drawDeepBubble(c, sx - h * 0.1 + Math.sin(i * 1.7 + globalT * 3) * h * 0.02, sy - (deep.dir > 0 ? k : -k * 0.3) * h * 0.35, h * (0.008 + (i % 3) * 0.004), 1 - k);
  }
  drawDeepSub(c, sx, sy, h * 0.085, 1, true);
  drawStarBalance(c, h * 0.03, h * 0.065);
}

// ---------- Yhteiset meripiirrot ----------
function drawDeepBubble(c, x, y, r, alpha) {
  if (alpha <= 0 || r <= 0) return;
  c.save();
  c.globalAlpha = Math.min(1, alpha);
  c.fillStyle = 'rgba(220,250,255,0.18)';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1, r * 0.14);
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2); c.fill();
  c.restore();
}
// Pieni kala: s = rungon puolipituus, dir 1 = oikealle, ph = pyrstön vaihe
function drawDeepFish(c, x, y, s, col, dir, ph) {
  var tw = Math.sin(ph || 0) * s * 0.25;
  c.save();
  c.translate(x, y);
  c.scale(dir || 1, 1);
  c.beginPath();
  c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.5, -s * 0.55 + tw); c.lineTo(-s * 1.5, s * 0.55 + tw); c.closePath();
  artFillPath(c, artShade(col, -0.1), -s * 0.6, s * 0.6, s * 0.5, { lineColor: artShade(col, -0.45) });
  artBlob(c, 0, 0, s, s * 0.62, col, { lineColor: artShade(col, -0.45), hi: 0.4 });
  artEye(c, s * 0.45, -s * 0.12, s * 0.2, 0.3, false);
  c.restore();
}
// Kuplasukellusvene: lasikupu, jossa prinsessa ja yksisarvinen; s = kuvun säde
function drawDeepSub(c, x, y, s, facing, moving) {
  var f = facing || 1, i;
  c.save();
  c.translate(x, y);
  c.scale(f, 1);
  // Potkuri takana
  var spin = Math.sin(globalT * (moving ? 30 : 8));
  artLimb(c, -s * 1.2, s * 0.5, -s * 1.45, s * 0.5, s * 0.14, '#b8862a', '#7a5a1a');
  artBlob(c, -s * 1.5, s * 0.5, s * 0.08, s * 0.35 * Math.abs(spin) + s * 0.05, '#ffd24f', { lineColor: '#b8862a' });
  // Runko
  artBlob(c, 0, s * 0.6, s * 1.3, s * 0.48, '#ff8f9f', { shadeTo: '#e0607a', lineColor: '#a83a52', hi: 0.35 });
  for (i = -1; i <= 1; i++) artCircle(c, i * s * 0.55, s * 0.68, s * 0.12, '#bff4ff', { lineColor: '#a83a52', hi: 0.5 });
  // Lamppu edessä
  artGlow(c, s * 1.35, s * 0.45, s * 0.6, '#fff6c8', 0.45 + Math.sin(globalT * 3) * 0.1);
  artCircle(c, s * 1.25, s * 0.45, s * 0.14, '#fff2a8', { lineColor: '#b8862a' });
  // Ratsastajat kuvun sisällä
  drawUnicorn(c, s * 0.02, s * 0.3, s * 0.0105, 1, globalT * 6, !!moving, globalT);
  // Lasikupu
  c.fillStyle = 'rgba(210,248,255,0.28)';
  c.beginPath(); c.arc(0, 0, s, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(s * 0.98, s * 0.25); c.lineTo(-s * 0.98, s * 0.25); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = Math.max(1.5, s * 0.07);
  c.beginPath(); c.arc(0, 0, s, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = Math.max(1, s * 0.09);
  c.beginPath(); c.arc(0, 0, s * 0.78, Math.PI * 1.2, Math.PI * 1.42); c.stroke();
  // Kupolin nuppi
  artCircle(c, 0, -s * 1.02, s * 0.12, '#ffd24f', { lineColor: '#b8862a' });
  c.restore();
}
// Merenneito: (x, y) = vyötärö, s = mittayksikkö (koko korkeus n. 2,2 s).
// o: { hair, tail, skin, crown, mood ('happy' | 'sad' | 'wow'), t, facing, wave }
function drawDeepMermaid(c, x, y, s, o) {
  o = o || {};
  var hair = o.hair || '#ff9fc8', tail = o.tail || '#4fc8c0', skin = o.skin || '#ffd9c0';
  var t = o.t || 0, f = o.facing || 1, sway = Math.sin(t * 2) * s * 0.12;
  c.save();
  c.translate(x, y);
  c.scale(f, 1);
  // Pyrstö kaartuu alas ja sivulle
  c.beginPath();
  c.moveTo(-s * 0.3, -s * 0.05);
  c.quadraticCurveTo(-s * 0.36, s * 0.6, s * 0.05 + sway, s * 1.1);
  c.lineTo(s * 0.18 + sway, s * 1.05);
  c.quadraticCurveTo(s * 0.32, s * 0.55, s * 0.3, -s * 0.05);
  c.closePath();
  artFillPath(c, tail, -s * 0.05, s * 1.1, s * 0.4, { lineColor: artShade(tail, -0.45) });
  // Suomut
  c.strokeStyle = artRGBA(artShade(tail, -0.3), 0.6);
  c.lineWidth = Math.max(1, s * 0.03);
  for (var i = 0; i < 3; i++) {
    c.beginPath(); c.arc(-s * 0.08 + i * s * 0.1 + sway * (i / 4), s * (0.3 + i * 0.18), s * 0.07, 0, Math.PI); c.stroke();
  }
  // Evä
  artBlob(c, s * 0.0 + sway, s * 1.17, s * 0.26, s * 0.1, artShade(tail, 0.2), { rot: -0.6, lineColor: artShade(tail, -0.45) });
  artBlob(c, s * 0.26 + sway, s * 1.15, s * 0.26, s * 0.1, artShade(tail, 0.2), { rot: 0.6, lineColor: artShade(tail, -0.45) });
  // Hiukset takana
  artBlob(c, 0, -s * 0.66, s * 0.38, s * 0.48, hair, { lineColor: artShade(hair, -0.4) });
  artBlob(c, -s * 0.26, -s * 0.3 + Math.sin(t * 1.6) * s * 0.03, s * 0.13, s * 0.34, hair, { lineColor: artShade(hair, -0.4) });
  artBlob(c, s * 0.26, -s * 0.3 + Math.sin(t * 1.6 + 1) * s * 0.03, s * 0.13, s * 0.34, hair, { lineColor: artShade(hair, -0.4) });
  // Vartalo ja kädet
  var wave = o.wave ? Math.sin(t * 8) * 0.5 : 0;
  artLimb(c, -s * 0.18, -s * 0.42, -s * 0.36, -s * 0.12, s * 0.08, skin, artShade(skin, -0.35));
  artLimb(c, s * 0.18, -s * 0.42, s * 0.38 + wave * s * 0.1, (o.wave ? -s * 0.7 : -s * 0.12) + wave * s * 0.1, s * 0.08, skin, artShade(skin, -0.35));
  artBlob(c, 0, -s * 0.28, s * 0.22, s * 0.28, skin, { lineColor: artShade(skin, -0.35) });
  artCircle(c, -s * 0.09, -s * 0.36, s * 0.08, '#ffb8d8', { lineColor: '#c06a90' });
  artCircle(c, s * 0.09, -s * 0.36, s * 0.08, '#ffb8d8', { lineColor: '#c06a90' });
  // Pää
  artCircle(c, 0, -s * 0.78, s * 0.26, skin, { lineColor: artShade(skin, -0.35) });
  artBlob(c, s * 0.02, -s * 0.97, s * 0.27, s * 0.12, hair, { lineColor: artShade(hair, -0.4) });
  // Kasvot
  var mood = o.mood || 'happy';
  artEye(c, -s * 0.09, -s * 0.78, s * 0.055, 0.2, false);
  artEye(c, s * 0.11, -s * 0.78, s * 0.055, 0.2, false);
  c.fillStyle = 'rgba(255,120,150,0.35)';
  c.beginPath(); c.arc(-s * 0.17, -s * 0.7, s * 0.04, 0, Math.PI * 2); c.arc(s * 0.19, -s * 0.7, s * 0.04, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#a0405a';
  c.lineWidth = Math.max(1, s * 0.025);
  c.beginPath();
  if (mood === 'sad') c.arc(s * 0.01, -s * 0.6, s * 0.06, Math.PI * 1.15, Math.PI * 1.85);
  else if (mood === 'wow') { c.arc(s * 0.01, -s * 0.66, s * 0.035, 0, Math.PI * 2); }
  else c.arc(s * 0.01, -s * 0.7, s * 0.07, Math.PI * 0.2, Math.PI * 0.8);
  c.stroke();
  // Kruunu
  if (o.crown) {
    c.beginPath();
    c.moveTo(-s * 0.18, -s * 1.02);
    c.lineTo(-s * 0.2, -s * 1.2); c.lineTo(-s * 0.09, -s * 1.1); c.lineTo(0, -s * 1.25);
    c.lineTo(s * 0.09, -s * 1.1); c.lineTo(s * 0.2, -s * 1.2); c.lineTo(s * 0.18, -s * 1.02);
    c.closePath();
    artFillPath(c, '#ffd24f', -s * 1.25, -s * 1.02, s * 0.1, { lineColor: '#b8862a' });
    if (o.crown === 'pearls') drawDeepPearl(c, 0, -s * 1.12, s * 0.04, 0);
  }
  c.restore();
}
