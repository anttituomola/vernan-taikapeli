'use strict';

// Linnakartta: Vernan kodin oma karttanäkymä yhtenä maisemana. Oikealla linna
// on leikattu auki kuin nukkekoti: tornihuone ylhäällä, keittiö ja sali maan
// tasalla ja pankkiholvi kukkulan sisällä maan alla. Vasemmalla linnan piha
// jatkuu samassa järjestyksessä kuin huoneiden ovet: keittiön ovesta
// puutarhaan, puutarhan portista kanatarhaan ja kanatarhan takaportista
// kukkulan ponitalliin. Ulkoalueet piirretään suoraan niitylle ilman omaa
// taivasta. Huoneen napautus vie huoneeseen (showHome).
//
// Linna kasvaa seikkailun mukana (CONTEXT.md, "Linna kasvaa"): huone aukeaa,
// kun sen maailman vartija on läpäisty. Lukittu huone näyttää vartijan
// merkin ja lukon. Vanha tallennus (castleAllOpen) pitää kaikki auki.

var castleFrom = 'sea';      // 'sea' tai 'land': minne vene-nappi palaa
var castleBgCanvas = document.createElement('canvas');
var castleBgKey = '';
var castleNew = [];          // juuri auenneet huoneet: { idx, t }
var castleShake = { idx: -1, t: 0 };

// Huoneen avaava maailma (HOME_ROOMS-indeksin mukaan)
var CASTLE_UNLOCK = ['Linnasaari', 'Kuutamosaari', 'Karkkisaari', 'Vuorisaari', 'Hoivasaari', 'Maalaiskylä', 'Tivolisaari'];

function castleRoomOpen(idx) {
  return castleAllOpen || storyWorldDone(CASTLE_UNLOCK[idx]);
}
function castleUnlockKind(idx) {
  var i, w;
  for (i = 0; i < WORLDS.length; i++) {
    w = WORLDS[i];
    if (w.name === CASTLE_UNLOCK[idx]) return (w.island || w.place).finaleKind;
  }
  return null;
}
// Linnanappi näkyy kartoilla vasta, kun sali on vapautettu
function castleBtnShow() {
  document.getElementById('castleBtn').style.display = castleRoomOpen(0) ? 'block' : 'none';
}

function showCastle(from) {
  var i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'castleBtn'];
  if (from) castleFrom = from;
  if (mode !== 'castle') fadeStart();
  mode = 'castle';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  homeDrag = null;
  bankHold = null;
  document.getElementById('hubChrome').style.display = 'none';
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('seaBtn').style.display = 'block';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#bfe6ff';
  lastTime = 0;
  castleBgKey = '';
  bankAccrue();
  // Juuri auenneet huoneet välkähtävät (vanhassa tallennuksessa ei juhlita)
  castleNew = [];
  var fresh = false;
  for (i = 0; i < HOME_ROOMS.length; i++) {
    if (!castleRoomOpen(i) || storySeen['huone' + i]) continue;
    storySeen['huone' + i] = true;
    fresh = true;
    if (!castleAllOpen) castleNew.push({ idx: i, t: 0 });
  }
  if (fresh) saveProgress();
  if (castleNew.length) soundFanfare();
}

function castleBack() {
  if (castleFrom === 'land' && landUnlocked()) showLand();
  else showSea();
}

// ---------- Asettelu ----------
// u = mittayksikkö (näytön korkeus, kapealla näytöllä leveys / 1,6).
// rooms: { idx, x, y, w, h, out } — out = ulkoalue (piirretään paljaana niitylle).
function castleLayout() {
  var w = viewW, h = viewH, u = Math.min(h, w / 1.6);
  var rr = homeRoom(), asp = (rr.x1 - rr.x0) / (rr.bottom - rr.wallTop);
  var fyRel = (rr.floorY - rr.wallTop) / (rr.bottom - rr.wallTop);
  var gy = h * 0.66;
  var pw = u * 0.25, ph = pw / asp, gap = u * 0.03, m = u * 0.03;
  var cx = w - u * 0.05 - m - pw - gap / 2;
  var floorTop = gy - ph - u * 0.015;
  var tw = u * 0.2, th = tw / asp;
  var towerY = floorTop - m * 1.8 - th;
  var vw = u * 0.23, vh = vw / asp;
  var castleL = cx - pw - gap / 2 - m, castleR = cx + pw + gap / 2 + m;
  // Ulkoalueet: puutarha linnan vieressä, kanatarha sen vasemmalla
  var free = castleL - u * 0.04;
  var ow = Math.min(u * 0.44, free / 1.9), oh = ow / asp;
  var yardX = castleL - u * 0.02 - ow;
  var coopX = Math.max(u * 0.01, yardX - ow * 0.98);
  var outY = gy - oh * fyRel;
  // Ponitalli kukkulalla kanatarhan ja puutarhan takana, hieman pienempänä
  var sw = ow * 0.78, sh = sw / asp, hillY = gy - u * 0.16;
  var stX = coopX + ow * 0.42;
  return {
    u: u, gy: gy, m: m, cx: cx, castleL: castleL, castleR: castleR, floorTop: floorTop,
    fyRel: fyRel, hillY: hillY,
    rooms: [
      { idx: 0, x: cx + gap / 2, y: floorTop, w: pw, h: ph },
      { idx: 1, x: cx - tw / 2, y: towerY, w: tw, h: th },
      { idx: 2, x: cx - gap / 2 - pw, y: floorTop, w: pw, h: ph },
      { idx: 3, x: cx - vw / 2, y: gy + u * 0.06, w: vw, h: vh },
      { idx: 4, x: yardX, y: outY, w: ow, h: oh, out: true },
      { idx: 5, x: coopX, y: outY, w: ow, h: oh, out: true },
      { idx: 6, x: stX, y: hillY - sh * fyRel, w: sw, h: sh, out: true }
    ],
    book: { x: castleL - u * 0.005, y: gy + u * 0.2, s: u * 0.06 },
    pawn: { x: coopX + ow * 0.62, y: gy + u * 0.23 }
  };
}
function castleSunPos() { return { x: viewW * 0.36, y: viewH * 0.13, r: viewH * 0.05 }; }
function castleRoomRect(lay, idx) {
  var i;
  for (i = 0; i < lay.rooms.length; i++) if (lay.rooms[i].idx === idx) return lay.rooms[i];
  return null;
}
// Napautusalue: ulkoalueilla vain maa ja rakennukset (ei yläreunan taivasta)
function castleHit(r, px, py, lay) {
  var pad = viewH * 0.015;
  if (r.out) {
    var top = r.y + r.h * lay.fyRel * 0.35;
    return px >= r.x && px <= r.x + r.w && py >= top && py <= r.y + r.h * 0.92;
  }
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad * 3 && py <= r.y + r.h + pad;
}

function handleCastleTap(px, py) {
  var lay = castleLayout(), i, r, order = [3, 0, 2, 1, 4, 5, 6];
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var sun = castleSunPos();
  if (mapSunTap(px, py, sun.x, sun.y, sun.r)) return;
  // Tarinakirja
  var bk = lay.book;
  if (Math.abs(px - bk.x) < bk.s * 1.5 && Math.abs(py - bk.y) < bk.s * 1.4) {
    playNote(659, 0, 0.12, 'triangle', 0.3);
    storyBookOpen();
    return;
  }
  for (i = 0; i < order.length; i++) {
    r = castleRoomRect(lay, order[i]);
    if (!castleHit(r, px, py, lay)) continue;
    if (!castleRoomOpen(r.idx)) {
      // Lukittu: merkki heilahtaa ja lukko kilahtaa
      castleShake = { idx: r.idx, t: 0.6 };
      playNote(330, 0, 0.1, 'square', 0.12);
      playNote(294, 0.1, 0.14, 'square', 0.12);
      return;
    }
    showHome(r.idx);
    return;
  }
  spawnSparkles(px, py, 5, '#ffe27a');
}

function updateCastle(dt) {
  var i;
  globalT += dt;
  updateParticles(dt);
  if (castleShake.t > 0) castleShake.t -= dt;
  for (i = castleNew.length - 1; i >= 0; i--) {
    castleNew[i].t += dt;
    if (castleNew[i].t > 4) castleNew.splice(i, 1);
  }
}

// ---------- Tausta (esirenderöity) ----------
function renderCastleBg() {
  var key = viewW + 'x' + viewH + (castleAllOpen ? 'a' : '') + castleOpenKey();
  if (castleBgKey === key) return;
  castleBgKey = key;
  castleBgCanvas.width = Math.round(viewW * DPR);
  castleBgCanvas.height = Math.round(viewH * DPR);
  var b = castleBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, lay = castleLayout(), gy = lay.gy, u = lay.u, i, x, r;
  // Taivas, aurinko ja pilvet
  var sky = b.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, gy + 2);
  var sun = castleSunPos();
  artGlow(b, sun.x, sun.y, sun.r * 3.2, '#fff4c8', 0.5);
  var sg = b.createRadialGradient(sun.x - sun.r * 0.3, sun.y - sun.r * 0.3, sun.r * 0.1, sun.x, sun.y, sun.r);
  sg.addColorStop(0, '#fffdf0');
  sg.addColorStop(1, '#ffd45a');
  b.fillStyle = sg;
  b.beginPath(); b.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.47, h * 0.12, h * 0.028);
  cloudShape(b, w * 0.6, h * 0.24, h * 0.02);
  // Kaukaiset kukkulat
  b.fillStyle = '#c8e8b0';
  b.beginPath(); b.moveTo(0, gy);
  for (x = 0; x <= w; x += w / 30) b.lineTo(x, gy - u * 0.12 - Math.sin(x / w * 7 + 1) * u * 0.03);
  b.lineTo(w, gy); b.closePath(); b.fill();
  // Tallin kukkula
  var st = castleRoomRect(lay, 6), hx = st.x + st.w * 0.5, hw = st.w * 0.95;
  b.beginPath();
  b.moveTo(hx - hw * 1.1, gy + 2);
  b.bezierCurveTo(hx - hw * 0.7, lay.hillY - u * 0.01, hx - hw * 0.4, lay.hillY, hx, lay.hillY);
  b.bezierCurveTo(hx + hw * 0.4, lay.hillY, hx + hw * 0.7, lay.hillY - u * 0.01, hx + hw * 1.1, gy + 2);
  b.closePath();
  artFillPath(b, '#a8dc8c', lay.hillY, gy, u * 0.2, { line: false });
  // Niitty
  var mg = b.createLinearGradient(0, gy, 0, h);
  mg.addColorStop(0, '#9ee07f');
  mg.addColorStop(1, '#6cc45c');
  b.fillStyle = mg;
  b.fillRect(0, gy, w, h - gy);
  // Polut: keittiön ovelta puutarhaan ja kanatarhaan, kanatarhasta kukkulalle
  var yd = castleRoomRect(lay, 4), co = castleRoomRect(lay, 5);
  b.strokeStyle = '#ecd6a4';
  b.lineCap = 'round';
  b.lineWidth = u * 0.03;
  b.beginPath();
  b.moveTo(lay.castleL, gy + u * 0.03);
  b.quadraticCurveTo(yd.x + yd.w * 0.5, gy + u * 0.16, co.x + co.w * 0.5, gy + u * 0.1);
  b.stroke();
  b.lineWidth = u * 0.02;
  b.beginPath();
  b.moveTo(co.x + co.w * 0.55, gy + u * 0.02);
  b.quadraticCurveTo(hx + st.w * 0.4, gy - u * 0.06, hx + st.w * 0.15, lay.hillY + u * 0.02);
  b.stroke();
  for (i = 0; i < 26; i++) {
    x = (i * 97.1) % w;
    drawFlower(b, x, gy + u * 0.02 + ((i * 53.7) % (h - gy - u * 0.04)), h * 0.008, ['#ff7bac', '#ffd24f', '#c9a0ff'][i % 3]);
  }
  // Kukkula linnan alla ja leikkaus maan alle (holvi)
  var vau = castleRoomRect(lay, 3), mm = lay.m;
  b.beginPath();
  b.moveTo(lay.castleL - u * 0.08, gy + 2);
  b.quadraticCurveTo(lay.cx, gy - u * 0.06, lay.castleR + u * 0.08, gy + 2);
  b.closePath();
  b.fillStyle = '#8fd673';
  b.fill();
  var cut = { x: vau.x - mm * 1.6, y: gy + u * 0.02, w: vau.w + mm * 3.2, h: vau.y + vau.h + mm * 1.4 - gy - u * 0.02 };
  var earth = b.createLinearGradient(0, cut.y, 0, cut.y + cut.h);
  earth.addColorStop(0, '#b98a5a');
  earth.addColorStop(1, '#8a6038');
  b.fillStyle = earth;
  roundRect(b, cut.x, cut.y, cut.w, cut.h, u * 0.05);
  b.fill();
  b.strokeStyle = '#6a4424';
  b.lineWidth = Math.max(1.5, u * 0.004);
  b.stroke();
  b.fillStyle = 'rgba(60,40,20,0.2)';
  for (i = 0; i < 18; i++) {
    b.beginPath();
    b.arc(cut.x + ((i * 61.3) % cut.w), cut.y + u * 0.02 + ((i * 37.9) % (cut.h - u * 0.04)), u * (0.005 + (i % 3) * 0.003), 0, Math.PI * 2);
    b.fill();
  }
  b.beginPath(); b.rect(vau.x - mm, vau.y - mm, vau.w + mm * 2, vau.h + mm * 2);
  artFillPath(b, '#9aa6b8', vau.y - mm, vau.y + vau.h + mm, u * 0.1, { lineColor: '#5a6478', line: Math.max(1.5, u * 0.004) });
  renderCastleBody(b, lay);
}
function castleOpenKey() {
  var s = '', i;
  for (i = 0; i < HOME_ROOMS.length; i++) s += castleRoomOpen(i) ? '1' : '0';
  return s;
}

// Linnan runko: muuri, sivutornit, tornihuoneen torni, katot, liput ja keittiön ovi
function renderCastleBody(b, lay) {
  var u = lay.u, gy = lay.gy, mm = lay.m, i, x, r;
  var wall = '#e8d5f2', tower = '#dcc3ee', roof = '#c286e0', lineC = '#9a6fc4', lw = Math.max(1.5, u * 0.004);
  var sal = castleRoomRect(lay, 0), kit = castleRoomRect(lay, 2), tow = castleRoomRect(lay, 1);
  var top = lay.floorTop - mm;
  // Päämuuri
  b.beginPath(); b.rect(lay.castleL, top, lay.castleR - lay.castleL, gy - top);
  artFillPath(b, wall, top, gy, u * 0.1, { lineColor: lineC, line: lw });
  // Kivirivit
  b.strokeStyle = 'rgba(154,111,196,0.18)';
  b.lineWidth = Math.max(1, u * 0.002);
  for (x = top + u * 0.05; x < gy; x += u * 0.05) { b.beginPath(); b.moveTo(lay.castleL, x); b.lineTo(lay.castleR, x); b.stroke(); }
  // Sakarat (tornin kohdalta tyhjä)
  b.fillStyle = wall;
  for (x = lay.castleL; x < lay.castleR - u * 0.02; x += u * 0.055) {
    if (x + u * 0.035 > tow.x - mm && x < tow.x + tow.w + mm) continue;
    b.fillRect(x, top - u * 0.03, u * 0.035, u * 0.032);
  }
  // Tornihuoneen torni ja katto
  var tx0 = tow.x - mm, tx1 = tow.x + tow.w + mm, ttop = tow.y - mm;
  b.beginPath(); b.rect(tx0, ttop, tx1 - tx0, top - ttop + lw);
  artFillPath(b, tower, ttop, top, u * 0.1, { lineColor: lineC, line: lw });
  var peak = Math.max(viewH * 0.02, ttop - u * 0.14);
  b.beginPath(); b.moveTo(tx0 - u * 0.025, ttop); b.lineTo(tx1 + u * 0.025, ttop); b.lineTo((tx0 + tx1) / 2, peak); b.closePath();
  artFillPath(b, roof, peak, ttop, u * 0.1, { lineColor: lineC, line: lw });
  castleFlag(b, (tx0 + tx1) / 2, peak, Math.min(u * 0.07, peak - viewH * 0.005), lineC, lw, '#ff7bac');
  // Sivutornit
  var sides = [lay.castleL - u * 0.03, lay.castleR + u * 0.03 - u * 0.08];
  for (i = 0; i < 2; i++) {
    var sx = sides[i], stw = u * 0.08, sTop = top - u * 0.1;
    b.beginPath(); b.rect(sx, sTop, stw, gy - sTop);
    artFillPath(b, tower, sTop, gy, stw / 2, { lineColor: lineC, line: lw });
    b.beginPath(); b.moveTo(sx - stw * 0.22, sTop); b.lineTo(sx + stw * 1.22, sTop); b.lineTo(sx + stw / 2, sTop - u * 0.13); b.closePath();
    artFillPath(b, roof, sTop - u * 0.13, sTop, stw, { lineColor: lineC, line: lw });
    castleFlag(b, sx + stw / 2, sTop - u * 0.13, u * 0.05, lineC, lw, i ? '#ffd24f' : '#5fa8ff');
    b.fillStyle = '#7a4fb0';
    roundRect(b, sx + stw * 0.33, sTop + u * 0.05, stw * 0.34, u * 0.06, stw * 0.17);
    b.fill();
    b.fillStyle = '#ffe9a8';
    roundRect(b, sx + stw * 0.4, sTop + u * 0.06, stw * 0.2, u * 0.035, stw * 0.1);
    b.fill();
  }
  // Keittiön ovi pihalle (vasemman tornin juurella)
  var dx = lay.castleL - u * 0.03 + u * 0.015, dw = u * 0.05, dh = u * 0.08;
  b.beginPath();
  b.moveTo(dx, gy); b.lineTo(dx, gy - dh + dw / 2); b.arc(dx + dw / 2, gy - dh + dw / 2, dw / 2, Math.PI, 0); b.lineTo(dx + dw, gy); b.closePath();
  artFillPath(b, '#8a5a30', gy - dh, gy, dw / 2, { lineColor: '#4a2e14', line: lw });
  // Huoneiden aukot: syvä reuna
  for (i = 0; i < 4; i++) {
    r = castleRoomRect(lay, i);
    b.fillStyle = 'rgba(60,30,90,0.35)';
    roundRect(b, r.x - u * 0.008, r.y - u * 0.008, r.w + u * 0.016, r.h + u * 0.016, u * 0.022);
    b.fill();
  }
}
function castleFlag(b, x, y, len, lineC, lw, col) {
  b.strokeStyle = lineC;
  b.lineWidth = lw;
  b.beginPath(); b.moveTo(x, y); b.lineTo(x, y - len); b.stroke();
  b.fillStyle = col;
  b.beginPath(); b.moveTo(x, y - len); b.lineTo(x + len * 0.7, y - len * 0.8); b.lineTo(x, y - len * 0.6); b.closePath(); b.fill();
}

// Huoneen pienoiskuva: maalit, tavarat ja (holvissa) tähtikasa. bare = ulkoalue
// ilman taivasta ja nurmea, suoraan kartan niitylle (ei leikkausta).
var thumbBare = false;
function drawCastleRoomThumb(c, idx, x, y, w, hh, bare) {
  var room = homeRoom(), dec = homeDecor[idx] || homeDecorDefault()[idx];
  var wallP = HOME_PAINTS[dec.wall] || HOME_PAINTS[0], floorP = HOME_PAINTS[dec.floor] || HOME_PAINTS[0];
  var rw = room.x1 - room.x0, rh = room.bottom - room.wallTop, sc = w / rw;
  var fyRel = (room.floorY - room.wallTop) / rh, i, it, def, order = [];
  c.save();
  thumbBare = !!bare;
  if (!bare) {
    roundRect(c, x, y, w, hh, viewH * 0.018);
    c.clip();
  }
  if (idx === YARD_ROOM) {
    yardThumbBg(c, x, y, w, hh, fyRel, wallP);
  } else if (idx === COOP_ROOM) {
    coopThumbBg(c, x, y, w, hh, wallP, floorP);
  } else if (idx === STABLE_ROOM) {
    stabThumbBg(c, x, y, w, hh, wallP, floorP);
  } else {
    var wg = c.createLinearGradient(0, y, 0, y + hh * fyRel);
    wg.addColorStop(0, wallP.wall[0]);
    wg.addColorStop(1, wallP.wall[1]);
    c.fillStyle = wg;
    c.fillRect(x, y, w, hh * fyRel);
    var fg = c.createLinearGradient(0, y + hh * fyRel, 0, y + hh);
    fg.addColorStop(0, floorP.floor[0]);
    fg.addColorStop(1, floorP.floor[1]);
    c.fillStyle = fg;
    c.fillRect(x, y + hh * fyRel, w, hh * (1 - fyRel));
    c.fillStyle = wallP.pot;
    c.fillRect(x, y + hh * fyRel - viewH * 0.006, w, viewH * 0.006);
  }
  var map = function (it2) {
    return { x: x + (it2.fx * viewW - room.x0) * sc, y: y + (it2.fy * viewH - room.wallTop) * (hh / rh) };
  };
  if (idx === BANK_ROOM) {
    // Holvi takaseinällä pienenä
    var vr = viewH * 0.19 * sc, vx = x + (rw * 0.45) * sc, vy = y + viewH * 0.29 * (hh / rh);
    artCircle(c, vx, vy, vr * 1.05, '#d9a93a', { lineColor: '#8a6420' });
    c.fillStyle = '#2a2040';
    c.beginPath(); c.arc(vx, vy, vr * 0.84, 0, Math.PI * 2); c.fill();
    if (bankStars > 0) artGlow(c, vx, vy + vr * 0.4, vr * 0.9, '#ffe678', 0.5);
    drawBankPile(c, vx, vy + vr * 0.52, vr, bankStars, 0);
    if (bankClosed) {
      // Holvi kiinni: pyöreä ovi pyörineen
      artCircle(c, vx, vy, vr * 0.86, '#b9b4c8', { lineColor: '#6a6278' });
      c.strokeStyle = '#6a6278';
      c.lineWidth = Math.max(1.5, vr * 0.05);
      c.beginPath(); c.arc(vx, vy, vr * 0.36, 0, Math.PI * 2); c.stroke();
      artCircle(c, vx, vy, vr * 0.1, '#ffd24f');
    }
  }
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    def = homeItemDef(it.id);
    if (homeItemRoom(it) !== idx || !def) continue;
    if (def.kind === 'wall') { var pw = map(it); drawHomeItem(c, it, pw.x, pw.y, homeItemSize() * sc); }
    else order.push(it);
  }
  order.sort(function (a, b2) { return a.fy - b2.fy; });
  for (i = 0; i < order.length; i++) {
    var p = map(order[i]);
    drawHomeItem(c, order[i], p.x, p.y, homeItemSize() * sc);
  }
  if (idx === COOP_ROOM) coopThumbFront(c, x, y, w);
  if (idx === STABLE_ROOM) stabThumbFront(c, x, y, w);
  thumbBare = false;
  c.restore();
}

// Lukittu sisähuone: suljetut ikkunaluukut
function drawCastleShutters(c, r) {
  var g = c.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, '#4a3a6a');
  g.addColorStop(1, '#2e2448');
  c.fillStyle = g;
  roundRect(c, r.x, r.y, r.w, r.h, viewH * 0.018);
  c.fill();
  var i, half = r.w / 2 - viewH * 0.004;
  for (i = 0; i < 2; i++) {
    var sx = r.x + i * (half + viewH * 0.008);
    artRoundRect(c, sx, r.y, half, r.h, viewH * 0.014, '#a9743f', { lineColor: '#5a3a1e' });
    c.strokeStyle = 'rgba(90,58,30,0.5)';
    c.lineWidth = Math.max(1, viewH * 0.003);
    var k;
    for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(sx + viewH * 0.01, r.y + r.h * k / 4); c.lineTo(sx + half - viewH * 0.01, r.y + r.h * k / 4); c.stroke(); }
  }
}
// Lukitun ulkoalueen kyltti: tolppa ja köysiaita
function drawCastleSignpost(c, r, lay) {
  var fy = r.y + r.h * lay.fyRel, cx = r.x + r.w / 2, s = lay.u, i;
  c.strokeStyle = '#c9a77a';
  c.lineWidth = Math.max(1.5, s * 0.004);
  for (i = 0; i < 5; i++) {
    var px = r.x + r.w * (0.12 + i * 0.19);
    artLimb(c, px, fy + s * 0.03, px, fy - s * 0.04, s * 0.012, '#a9743f', '#5a3a1e');
    if (i < 4) {
      c.beginPath();
      c.moveTo(px, fy - s * 0.03);
      c.quadraticCurveTo(px + r.w * 0.095, fy - s * 0.01, px + r.w * 0.19, fy - s * 0.03);
      c.stroke();
    }
  }
  artLimb(c, cx, fy + s * 0.04, cx, fy - s * 0.11, s * 0.016, '#a9743f', '#5a3a1e');
}
// Lukon merkki: vartijan kuva ja lukko (sh = heilahdus)
function drawCastleLockBadge(c, x, y, s, kind, shake) {
  var wob = shake > 0 ? Math.sin(shake * 30) * 0.2 * (shake / 0.6) : 0;
  c.save();
  c.translate(x, y);
  c.rotate(wob);
  artCircle(c, 0, 0, s, '#fff6d8', { lineColor: '#c9a0ff' });
  if (kind) drawHubRoomIcon(c, kind, 0, s * 0.05, s * 1.9);
  c.restore();
  artCircle(c, x + s * 0.72, y + s * 0.72, s * 0.42, '#ffffff', { lineColor: '#9a8ab0' });
  drawHubLock(c, x + s * 0.72, y + s * 0.76, s * 0.62);
}

function drawCastleMap() {
  var i, r, lay, open, shake;
  if (!viewW || !viewH) return;
  renderCastleBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(castleBgCanvas, 0, 0, castleBgCanvas.width, castleBgCanvas.height, 0, 0, viewW, viewH);
  lay = castleLayout();
  var u = lay.u;
  drawMapSun(ctx);
  // Ulkoalueet kaukaisimmasta lähimpään: talli kukkulalla, kanatarha, puutarha
  var outOrder = [6, 5, 4];
  for (i = 0; i < outOrder.length; i++) {
    r = castleRoomRect(lay, outOrder[i]);
    shake = castleShake.idx === r.idx ? castleShake.t : 0;
    if (castleRoomOpen(r.idx)) {
      drawCastleRoomThumb(ctx, r.idx, r.x, r.y, r.w, r.h, true);
    } else {
      drawCastleSignpost(ctx, r, lay);
      drawCastleLockBadge(ctx, r.x + r.w / 2, r.y + r.h * lay.fyRel - u * 0.13, u * 0.05, castleUnlockKind(r.idx), shake);
    }
  }
  // Linnan huoneet
  for (i = 0; i < 4; i++) {
    r = castleRoomRect(lay, i);
    open = castleRoomOpen(i);
    shake = castleShake.idx === i ? castleShake.t : 0;
    if (open) {
      drawCastleRoomThumb(ctx, i, r.x, r.y, r.w, r.h, false);
    } else {
      drawCastleShutters(ctx, r);
      drawCastleLockBadge(ctx, r.x + r.w / 2, r.y + r.h / 2, Math.min(r.h * 0.3, u * 0.055), castleUnlockKind(i), shake);
    }
  }
  // Nimikyltit: sisähuoneissa aukon yläreunassa, ulkona maan rajassa
  for (i = 0; i < lay.rooms.length; i++) {
    r = lay.rooms[i];
    if (!castleRoomOpen(r.idx)) continue;
    if (r.out) homeRoomSign(ctx, r.idx, r.x + r.w * 0.5, r.y + r.h * lay.fyRel + u * 0.035, u * 0.045);
    else homeRoomSign(ctx, r.idx, r.x + r.w / 2, r.y - u * 0.004, u * 0.045);
  }
  // Juuri aukeava huone: hehku ja tähtirengas
  for (i = 0; i < castleNew.length; i++) {
    r = castleRoomRect(lay, castleNew[i].idx);
    var k = castleNew[i].t, a = Math.max(0, 1 - k / 4), cx = r.x + r.w / 2, cy = r.out ? r.y + r.h * lay.fyRel - u * 0.05 : r.y + r.h / 2, j;
    artGlow(ctx, cx, cy, u * 0.2, '#ffe27a', 0.5 * a);
    for (j = 0; j < 8; j++) {
      var ang = k * 2 + j * Math.PI / 4, rad = u * (0.08 + k * 0.03);
      drawStar(ctx, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.7, u * 0.018 * a, ang, 1);
    }
  }
  // Holvin kertynyt korko: tähti ja "+n" holvin kohdalla
  var v = castleRoomRect(lay, 3);
  if (bankUnseen > 0 && castleRoomOpen(3)) {
    var bx = v.x + v.w - u * 0.02, by = v.y + u * 0.03 + Math.sin(globalT * 4) * u * 0.006;
    drawStar(ctx, bx, by, u * 0.035, globalT, 1);
    ctx.font = 'bold ' + Math.round(u * 0.045) + 'px ' + UI_FONT;
    ctx.textAlign = 'right';
    ctx.lineWidth = u * 0.008;
    ctx.strokeStyle = '#7a3cb8';
    ctx.strokeText('+' + bankUnseen, bx - u * 0.045, by + u * 0.016);
    ctx.fillStyle = '#ffe27a';
    ctx.fillText('+' + bankUnseen, bx - u * 0.045, by + u * 0.016);
  }
  drawCastleBook(ctx, lay.book);
  // Tarinan lopussa Myrskynoita muuttaa torniin: istuu katolla iloisen pilvensä alla
  if (storySeen.ystava) drawCastleWitch(ctx, castleRoomRect(lay, 1), u);
  // Prinsessa yksisarvisella ja puput pihalla
  var pw = lay.pawn;
  drawUnicorn(ctx, pw.x, pw.y, u * 0.0011, 1, 0, false, globalT);
  for (i = 0; i < 3; i++) {
    var bx2 = pw.x + u * (0.12 + i * 0.06), by2 = pw.y + u * (0.06 + (i % 2) * 0.02);
    var hop = Math.abs(Math.sin(globalT * 3 + i * 1.7)) * u * 0.012;
    drawBunny(ctx, bx2, by2 - hop, u * 0.035, hop, globalT * 3 + i, false);
    if (homeBows[i] >= 0) drawBow(ctx, bx2, by2 - hop - u * 0.05, u * 0.01, HOME_BOWS[homeBows[i]]);
  }
  drawParticlesLayerAbs(ctx);
  drawStarBalance(ctx, viewH * 0.03 + viewH * 0.11, viewH * 0.065);
}

// Ystävä tornissa: pieni sadepilvi, sateenkaari ja vilkuttava noita tornin vieressä
function drawCastleWitch(c, tow, u) {
  var x = tow.x + tow.w + u * 0.09, y = tow.y + tow.h * 0.35 + Math.sin(globalT * 1.6) * u * 0.01;
  c.lineCap = 'butt';
  var i;
  for (i = 0; i < RAINBOW_COLORS.length; i++) {
    c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.7);
    c.lineWidth = u * 0.008;
    c.beginPath(); c.arc(x + u * 0.04, y + u * 0.02, u * (0.1 - i * 0.008), Math.PI, 0); c.stroke();
  }
  drawStormWitch(c, x, y, u * 0.03, -1, 'happy');
  drawWitchCloud(c, x + u * 0.01, y - u * 0.1, u * 0.03, globalT, 0.5);
}

// Tarinakirja jalustalla: avoin kirja, joka hehkuu, kun siinä on luettavaa
function drawCastleBook(c, bk) {
  var s = bk.s, x = bk.x, y = bk.y + Math.sin(globalT * 2) * s * 0.04;
  artShadow(c, x, bk.y + s * 0.95, s * 0.9, s * 0.18, 0.18);
  artLimb(c, x, bk.y + s * 0.9, x, bk.y + s * 0.2, s * 0.22, '#a9743f', '#5a3a1e');
  artRoundRect(c, x - s * 0.55, bk.y + s * 0.82, s * 1.1, s * 0.18, s * 0.06, '#a9743f', { lineColor: '#5a3a1e' });
  artGlow(c, x, y - s * 0.1, s * 1.4, '#ffe27a', 0.25 + Math.sin(globalT * 3) * 0.1);
  // Kannet ja sivut
  c.save();
  c.translate(x, y);
  c.rotate(-0.08);
  artRoundRect(c, -s * 1.0, -s * 0.45, s * 2.0, s * 0.62, s * 0.08, '#8a5cb8', { lineColor: '#4a2a78' });
  c.beginPath();
  c.moveTo(0, -s * 0.38); c.quadraticCurveTo(-s * 0.45, -s * 0.5, -s * 0.92, -s * 0.38);
  c.lineTo(-s * 0.92, s * 0.1); c.quadraticCurveTo(-s * 0.45, -s * 0.02, 0, s * 0.1); c.closePath();
  artFillPath(c, '#fff6e8', -s * 0.5, s * 0.1, s * 0.4, { lineColor: '#c9a0ff' });
  c.beginPath();
  c.moveTo(0, -s * 0.38); c.quadraticCurveTo(s * 0.45, -s * 0.5, s * 0.92, -s * 0.38);
  c.lineTo(s * 0.92, s * 0.1); c.quadraticCurveTo(s * 0.45, -s * 0.02, 0, s * 0.1); c.closePath();
  artFillPath(c, '#fff6e8', -s * 0.5, s * 0.1, s * 0.4, { lineColor: '#c9a0ff' });
  // Pikkukuvat sivuilla: linna ja sateenkaari
  c.strokeStyle = '#ff7bac';
  c.lineWidth = s * 0.06;
  c.beginPath(); c.arc(s * 0.46, -s * 0.05, s * 0.22, Math.PI, 0); c.stroke();
  c.strokeStyle = '#5fa8ff';
  c.beginPath(); c.arc(s * 0.46, -s * 0.05, s * 0.15, Math.PI, 0); c.stroke();
  c.fillStyle = '#c9a0ff';
  c.fillRect(-s * 0.6, -s * 0.25, s * 0.3, s * 0.25);
  c.beginPath(); c.moveTo(-s * 0.65, -s * 0.25); c.lineTo(-s * 0.45, -s * 0.4); c.lineTo(-s * 0.25, -s * 0.25); c.fill();
  c.restore();
  drawStar(c, x + s * 0.9, y - s * 0.6, s * 0.18, globalT * 2, 1);
}
