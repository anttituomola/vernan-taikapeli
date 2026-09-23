'use strict';

// Linnakartta: Vernan kodin oma karttanäkymä. Linna on leikattu auki, ja
// jokainen huone näkyy pienoiskuvana tavaroineen: tornihuone ylhäällä,
// keittiö ja sali maan tasalla, pankkiholvi maan alla. Huoneen napautus vie
// suoraan huoneeseen (showHome). Linnakartalle päästään saaristokartan ja
// Kaukamaan kartan linnanapista (castleBtn), ja vene-nappi palauttaa sille
// kartalle, jolta tultiin.

var castleFrom = 'sea';      // 'sea' tai 'land': minne vene-nappi palaa
var castleBgCanvas = document.createElement('canvas');
var castleBgKey = '';

function showCastle(from) {
  var i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'castleBtn'];
  if (from) castleFrom = from;
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
}

function castleBack() {
  if (castleFrom === 'land' && landUnlocked()) showLand();
  else showSea();
}

// Huoneiden paikat: { idx, x, y, w, h }
function castleLayout() {
  var h = viewH, cx = viewW / 2;
  var ph = h * 0.23, pw = ph * 1.32, gap = h * 0.03;
  var groundY = h * 0.655;
  var floorTop = groundY - ph - h * 0.02;
  var salX = cx + gap / 2 - pw * 0.15;
  return {
    groundY: groundY, pw: pw, ph: ph,
    rooms: [
      { idx: 0, x: salX, y: floorTop, w: pw, h: ph },
      { idx: 1, x: salX + pw * 0.12, y: floorTop - ph - h * 0.05, w: pw * 0.76, h: ph },
      { idx: 2, x: salX - gap - pw, y: floorTop, w: pw, h: ph },
      { idx: 3, x: salX - pw * 0.08, y: groundY + h * 0.05, w: pw * 1.16, h: ph * 0.98 }
    ]
  };
}

function handleCastleTap(px, py) {
  var lay = castleLayout(), i, r;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  for (i = 0; i < lay.rooms.length; i++) {
    r = lay.rooms[i];
    if (px >= r.x - viewH * 0.02 && px <= r.x + r.w + viewH * 0.02 && py >= r.y - viewH * 0.06 && py <= r.y + r.h + viewH * 0.02) {
      showHome(r.idx);
      return;
    }
  }
}

function updateCastle(dt) {
  globalT += dt;
  updateParticles(dt);
}

// ---------- Piirto ----------
function renderCastleBg() {
  var key = viewW + 'x' + viewH;
  if (castleBgKey === key) return;
  castleBgKey = key;
  castleBgCanvas.width = Math.round(viewW * DPR);
  castleBgCanvas.height = Math.round(viewH * DPR);
  var b = castleBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, lay = castleLayout(), gy = lay.groundY, i, r, x;
  // Taivas, pilvet ja kukkulat
  var sky = b.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#e6f6ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, gy);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.12, h * 0.14, h * 0.03);
  cloudShape(b, w * 0.84, h * 0.1, h * 0.025);
  cloudShape(b, w * 0.7, h * 0.3, h * 0.018);
  b.fillStyle = '#a8dc8c';
  b.beginPath(); b.arc(w * 0.1, gy + h * 0.1, h * 0.3, Math.PI, 0); b.fill();
  b.beginPath(); b.arc(w * 0.92, gy + h * 0.12, h * 0.34, Math.PI, 0); b.fill();
  // Maa ja maanalainen kerros
  var earth = b.createLinearGradient(0, gy, 0, h);
  earth.addColorStop(0, '#b98a5a');
  earth.addColorStop(1, '#7a5634');
  b.fillStyle = earth;
  b.fillRect(0, gy, w, h - gy);
  b.fillStyle = 'rgba(60,40,20,0.18)';
  for (i = 0; i < 40; i++) {
    b.beginPath(); b.arc((i * 137.3) % w, gy + h * 0.05 + (i * 71.7) % (h - gy - h * 0.06), h * (0.006 + (i % 3) * 0.004), 0, Math.PI * 2); b.fill();
  }
  b.fillStyle = '#7fcf68';
  b.fillRect(0, gy - h * 0.012, w, h * 0.03);
  for (i = 0; i < 30; i++) {
    x = (i * 97.1) % w;
    drawFlower(b, x, gy - h * 0.005, h * 0.008, ['#ff7bac', '#ffd24f', '#c9a0ff'][i % 3]);
  }
  // Linnan muurit huoneiden ympärillä
  var sal = lay.rooms[0], tow = lay.rooms[1], kit = lay.rooms[2], vau = lay.rooms[3];
  var m = h * 0.03, wall = '#e8d5f2', lineC = '#9a6fc4', lw = Math.max(1.5, h * 0.004);
  var x0 = kit.x - m, x1 = sal.x + sal.w + m, top = sal.y - m;
  // Pikkutorni vasemmalla ja iso torni oikealla (tornihuone)
  var ltw = h * 0.09, ltx = x0 - ltw * 0.3;
  b.beginPath(); b.rect(ltx, top - h * 0.1, ltw, gy - top + h * 0.1);
  artFillPath(b, '#dcc3ee', top - h * 0.1, gy, ltw / 2, { lineColor: lineC, line: lw });
  b.beginPath(); b.moveTo(ltx - ltw * 0.2, top - h * 0.1); b.lineTo(ltx + ltw * 1.2, top - h * 0.1); b.lineTo(ltx + ltw / 2, top - h * 0.24); b.closePath();
  artFillPath(b, '#c286e0', top - h * 0.24, top - h * 0.1, ltw, { lineColor: lineC, line: lw });
  b.beginPath(); b.rect(x0, top, x1 - x0, gy - top);
  artFillPath(b, wall, top, gy, h * 0.1, { lineColor: lineC, line: lw });
  b.fillStyle = wall;
  for (x = x0; x < x1 - h * 0.02; x += h * 0.06) {
    if (x + h * 0.035 > tow.x - m && x < tow.x + tow.w + m) continue;
    b.fillRect(x, top - h * 0.03, h * 0.035, h * 0.032);
  }
  var tx0 = tow.x - m, tx1 = tow.x + tow.w + m, ttop = tow.y - m;
  b.beginPath(); b.rect(tx0, ttop, tx1 - tx0, top - ttop + lw);
  artFillPath(b, '#dcc3ee', ttop, top, h * 0.1, { lineColor: lineC, line: lw });
  b.beginPath(); b.moveTo(tx0 - h * 0.025, ttop); b.lineTo(tx1 + h * 0.025, ttop); b.lineTo((tx0 + tx1) / 2, Math.max(h * 0.015, ttop - h * 0.13)); b.closePath();
  artFillPath(b, '#c286e0', ttop - h * 0.13, ttop, h * 0.1, { lineColor: lineC, line: lw });
  // Lippu tornin huipulla
  var fx = (tx0 + tx1) / 2, fy = Math.max(h * 0.015, ttop - h * 0.13);
  b.strokeStyle = lineC;
  b.lineWidth = lw;
  var fl = Math.min(h * 0.07, fy - h * 0.005);
  b.beginPath(); b.moveTo(fx, fy); b.lineTo(fx, fy - fl); b.stroke();
  b.fillStyle = '#ff7bac';
  b.beginPath(); b.moveTo(fx, fy - fl); b.lineTo(fx + h * 0.05, fy - fl * 0.8); b.lineTo(fx, fy - fl * 0.6); b.closePath(); b.fill();
  // Holvin kivikehys maan alla ja portaat salista alas
  b.beginPath(); b.rect(vau.x - m, vau.y - m, vau.w + m * 2, vau.h + m * 2);
  artFillPath(b, '#9aa6b8', vau.y - m, vau.y + vau.h + m, h * 0.1, { lineColor: '#5a6478', line: lw });
  b.fillStyle = 'rgba(40,50,70,0.25)';
  for (i = 0; i < 8; i++) b.fillRect(vau.x - m + i * (vau.w + m * 2) / 8, vau.y - m, lw, m);
  // Huoneiden aukot (tumma reuna)
  for (i = 0; i < lay.rooms.length; i++) {
    r = lay.rooms[i];
    b.fillStyle = 'rgba(60,30,90,0.35)';
    roundRect(b, r.x - h * 0.008, r.y - h * 0.008, r.w + h * 0.016, r.h + h * 0.016, h * 0.022);
    b.fill();
  }
}

// Huoneen pienoiskuva: maalit, tavarat ja (holvissa) tähtikasa
function drawCastleRoomThumb(c, idx, x, y, w, hh) {
  var room = homeRoom(), dec = homeDecor[idx] || homeDecorDefault()[idx];
  var wallP = HOME_PAINTS[dec.wall] || HOME_PAINTS[0], floorP = HOME_PAINTS[dec.floor] || HOME_PAINTS[0];
  var rw = room.x1 - room.x0, rh = room.bottom - room.wallTop, sc = w / rw;
  var fyRel = (room.floorY - room.wallTop) / rh, i, it, def, order = [];
  c.save();
  roundRect(c, x, y, w, hh, viewH * 0.018);
  c.clip();
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
    drawBankPile(c, vx, vy + vr * 0.52, vr, bankStars);
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
  c.restore();
}

function drawCastleMap() {
  var i, r, lay;
  if (!viewW || !viewH) return;
  renderCastleBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(castleBgCanvas, 0, 0, castleBgCanvas.width, castleBgCanvas.height, 0, 0, viewW, viewH);
  lay = castleLayout();
  for (i = 0; i < lay.rooms.length; i++) {
    r = lay.rooms[i];
    drawCastleRoomThumb(ctx, r.idx, r.x, r.y, r.w, r.h);
    // Hehkuva reunus kutsuu napauttamaan
    ctx.strokeStyle = 'rgba(255,240,180,' + (0.55 + Math.sin(globalT * 3 + i) * 0.25) + ')';
    ctx.lineWidth = Math.max(2, viewH * 0.006);
    roundRect(ctx, r.x, r.y, r.w, r.h, viewH * 0.018);
    ctx.stroke();
    homeRoomSign(ctx, r.idx, r.x + r.w / 2, r.y - viewH * 0.005, viewH * 0.05);
  }
  // Holvin kertynyt korko: tähti ja "+n" holvin kohdalla
  var v = lay.rooms[3];
  var pend = bankUnseen;
  if (pend > 0) {
    var bx = v.x + v.w - viewH * 0.02, by = v.y + viewH * 0.03 + Math.sin(globalT * 4) * viewH * 0.006;
    drawStar(ctx, bx, by, viewH * 0.035, globalT, 1);
    ctx.font = 'bold ' + Math.round(viewH * 0.045) + 'px ' + UI_FONT;
    ctx.textAlign = 'right';
    ctx.lineWidth = viewH * 0.008;
    ctx.strokeStyle = '#7a3cb8';
    ctx.strokeText('+' + pend, bx - viewH * 0.045, by + viewH * 0.016);
    ctx.fillStyle = '#ffe27a';
    ctx.fillText('+' + pend, bx - viewH * 0.045, by + viewH * 0.016);
  }
  // Prinsessa yksisarvisella ja puput linnan pihalla
  var kit = lay.rooms[2];
  var ux = Math.max(viewH * 0.12, kit.x - viewH * 0.3);
  drawUnicorn(ctx, ux, lay.groundY + viewH * 0.02, viewH * 0.0009, 1, 0, false, globalT);
  for (i = 0; i < 3; i++) {
    var bx2 = ux + viewH * (0.02 + i * 0.05), by2 = lay.groundY + viewH * (0.035 + (i % 2) * 0.02);
    if (bx2 > kit.x - viewH * 0.04) break;
    drawBunny(ctx, bx2, by2, viewH * 0.03, Math.abs(Math.sin(globalT * 3 + i)) * viewH * 0.01, globalT * 3 + i, false);
    if (homeBows[i] >= 0) drawBow(ctx, bx2, by2 - viewH * 0.045, viewH * 0.009, HOME_BOWS[homeBows[i]]);
  }
  drawParticlesLayerAbs(ctx);
  drawStarBalance(ctx, viewH * 0.03 + viewH * 0.11, viewH * 0.065);
}
