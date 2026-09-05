'use strict';

// Linnan sisustus: maaliton huone, jossa kentistä kerätyillä tähdillä ostetaan
// huonekaluja ja raahataan ne paikoilleen. Puput reagoivat tavaroihin (peti,
// porkkanat, pallo). Avataan linnan puhekuplasta (Linnasaari).

var HOME_ITEMS = [
  { id: 'rug', price: 2, kind: 'floor' },
  { id: 'lamp', price: 2, kind: 'floor' },
  { id: 'plant', price: 2, kind: 'floor' },
  { id: 'ball', price: 2, kind: 'floor' },
  { id: 'painting', price: 3, kind: 'wall' },
  { id: 'bed', price: 3, kind: 'floor' },
  { id: 'carrots', price: 3, kind: 'floor' },
  { id: 'curtains', price: 3, kind: 'wall' },
  { id: 'mirror', price: 3, kind: 'wall' },
  { id: 'table', price: 4, kind: 'floor' },
  { id: 'shelf', price: 4, kind: 'floor' },
  { id: 'musicbox', price: 4, kind: 'floor' }
];
var homeBunnies = [];
var homeDrag = null;        // { item, dx, dy, sx, sy, moved }
var homeShake = { id: '', t: 0 };
var homeNotes = [];         // soittorasian nuotit
var homeBgCanvas = document.createElement('canvas');
var homeBgKey = '';

function homeRoom() {
  return { x0: viewH * 0.02, x1: viewW * 0.735, wallTop: viewH * 0.03, floorY: viewH * 0.6, bottom: viewH * 0.97 };
}
function homeShopBox() {
  return { x: viewW * 0.755, y: viewH * 0.03, w: viewW * 0.235, h: viewH * 0.94, head: viewH * 0.11 };
}
function homeItemDef(id) {
  var i;
  for (i = 0; i < HOME_ITEMS.length; i++) if (HOME_ITEMS[i].id === id) return HOME_ITEMS[i];
  return null;
}
function homeHas(id) {
  var i;
  for (i = 0; i < homeItems.length; i++) if (homeItems[i].id === id) return homeItems[i];
  return null;
}
function homeItemSize() {
  return viewH * 0.13;
}

function showHome() {
  var i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'seaBtn'];
  mode = 'home';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  homeDrag = null;
  document.getElementById('hubChrome').style.display = 'none';
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#e8dcf5';
  lastTime = 0;
  if (homeBunnies.length === 0) {
    for (i = 0; i < 3; i++) homeBunnies.push({ fx: 0.15 + i * 0.2, fy: 0.72 + (i % 2) * 0.12, tx: 0, ty: 0, hop: 0, earT: i, state: 'wander', timer: 1 + i, moving: false });
    for (i = 0; i < 3; i++) { homeBunnies[i].tx = homeBunnies[i].fx; homeBunnies[i].ty = homeBunnies[i].fy; }
  }
  playNote(523, 0, 0.15, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}

// ---------- Kauppa ----------
function homeShopCells() {
  var s = homeShopBox(), cells = [], i, cols = 2, rows = Math.ceil(HOME_ITEMS.length / cols);
  var pad = viewH * 0.012;
  var cw = (s.w - pad * (cols + 1)) / cols;
  var ch = (s.h - s.head - pad * (rows + 1)) / rows;
  for (i = 0; i < HOME_ITEMS.length; i++) {
    cells.push({
      def: HOME_ITEMS[i],
      x: s.x + pad + (i % cols) * (cw + pad),
      y: s.y + s.head + pad + Math.floor(i / cols) * (ch + pad),
      w: cw, h: ch
    });
  }
  return cells;
}

function homeBuy(def) {
  var room = homeRoom();
  if (homeHas(def.id)) return;
  if (starCoins < def.price) {
    homeShake.id = def.id;
    homeShake.t = 0.5;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    return;
  }
  starCoins -= def.price;
  var it = { id: def.id, fx: 0.38, fy: def.kind === 'wall' ? 0.3 : 0.8, on: true, phase: 0 };
  // Sijoita tyhjään kohtaan: siirrä oikealle, jos paikalla on jo jotain
  var k;
  for (k = 0; k < 6; k++) {
    var busy = false, j;
    for (j = 0; j < homeItems.length; j++) {
      if (homeItems[j].id !== it.id && Math.abs(homeItems[j].fx - it.fx) < 0.08 && Math.abs(homeItems[j].fy - it.fy) < 0.12) busy = true;
    }
    if (!busy) break;
    it.fx += 0.1;
    if (it.fx * viewW > room.x1 - homeItemSize()) it.fx = 0.12;
  }
  homeItems.push(it);
  saveProgress();
  spawnSparkles(it.fx * viewW, it.fy * viewH - homeItemSize() * 0.4, 18, '#ffe27a');
  playNote(784, 0, 0.12, 'sine', 0.35);
  playNote(1047, 0.1, 0.15, 'sine', 0.35);
  playNote(1319, 0.2, 0.3, 'sine', 0.35);
}

// ---------- Syöte ----------
function homeItemRect(it) {
  var s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH, def = homeItemDef(it.id);
  if (def && def.kind === 'wall') return { x: x - s * 0.55, y: y - s * 0.45, w: s * 1.1, h: s * 0.9 };
  return { x: x - s * 0.55, y: y - s * 0.95, w: s * 1.1, h: s * 1.05 };
}

function handleHomeTap(px, py) {
  var i, cells, c, r;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var shop = homeShopBox();
  if (px >= shop.x) {
    cells = homeShopCells();
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) { homeBuy(c.def); return; }
    }
    return;
  }
  // Päällimmäinen tavara sormen alla (viimeksi lisätty on päällimmäinen)
  for (i = homeItems.length - 1; i >= 0; i--) {
    r = homeItemRect(homeItems[i]);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      homeDrag = { item: homeItems[i], dx: px - homeItems[i].fx * viewW, dy: py - homeItems[i].fy * viewH, sx: px, sy: py, moved: false };
      // Nosta päällimmäiseksi
      homeItems.splice(i, 1);
      homeItems.push(homeDrag.item);
      return;
    }
  }
  // Pupun napautus: hyppy ja vikinä
  for (i = 0; i < homeBunnies.length; i++) {
    var b = homeBunnies[i], bx = b.fx * viewW, by = b.fy * viewH;
    if (Math.abs(px - bx) < viewH * 0.06 && py < by && py > by - viewH * 0.12) {
      b.hop = 1;
      b.state = 'wander';
      b.timer = 0.2;
      spawnSparkles(bx, by - viewH * 0.1, 6, '#ffd6ec');
      playNote(1200 + i * 100, 0, 0.08, 'sine', 0.25);
      playNote(1500 + i * 100, 0.07, 0.1, 'sine', 0.2);
      return;
    }
  }
}

function homeMove(px, py) {
  if (!homeDrag) return;
  var it = homeDrag.item, def = homeItemDef(it.id), room = homeRoom(), s = homeItemSize();
  if (Math.abs(px - homeDrag.sx) + Math.abs(py - homeDrag.sy) > 12) homeDrag.moved = true;
  var x = px - homeDrag.dx, y = py - homeDrag.dy;
  x = Math.min(Math.max(x, room.x0 + s * 0.5), room.x1 - s * 0.5);
  if (def && def.kind === 'wall') y = Math.min(Math.max(y, room.wallTop + s * 0.5), room.floorY - s * 0.15);
  else y = Math.min(Math.max(y, room.floorY + s * 0.05), room.bottom);
  it.fx = x / viewW;
  it.fy = y / viewH;
}

function homeUp() {
  if (!homeDrag) return;
  var it = homeDrag.item;
  var moved = homeDrag.moved;
  homeDrag = null;
  if (moved) {
    saveProgress();
    playNote(330, 0, 0.08, 'triangle', 0.2);
    spawnSparkles(it.fx * viewW, it.fy * viewH - homeItemSize() * 0.3, 6, '#ffffff');
    return;
  }
  homeItemTap(it);
}

function homeItemTap(it) {
  var i;
  it.phase = 1;
  if (it.id === 'lamp') {
    it.on = !it.on;
    playNote(it.on ? 880 : 440, 0, 0.1, 'sine', 0.25);
  } else if (it.id === 'musicbox') {
    var mel = [523, 659, 784, 659, 880, 784, 1047];
    for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.18, 0.22, 'sine', 0.28);
    for (i = 0; i < 7; i++) homeNotes.push({ x: it.fx * viewW + (Math.random() - 0.5) * viewH * 0.05, y: it.fy * viewH - homeItemSize() * 0.6, vy: -viewH * (0.12 + Math.random() * 0.08), age: 0, life: 1.4 + i * 0.15, c: i % 3 });
  } else if (it.id === 'ball') {
    it.roll = (it.roll || 0) + (Math.random() < 0.5 ? -1 : 1) * viewW * 0.18;
    playNote(392, 0, 0.1, 'triangle', 0.25);
  } else {
    playNote(660, 0, 0.08, 'triangle', 0.2);
  }
  spawnSparkles(it.fx * viewW, it.fy * viewH - homeItemSize() * 0.5, 6, '#ffe27a');
}

// ---------- Päivitys ----------
function updateHome(dt) {
  var i, it, b, room = homeRoom();
  globalT += dt;
  if (homeShake.t > 0) homeShake.t -= dt;
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (it.phase > 0) it.phase = Math.max(0, it.phase - dt * 3);
    if (it.roll) {
      var nx = it.fx * viewW + it.roll * dt;
      nx = Math.min(Math.max(nx, room.x0 + homeItemSize() * 0.5), room.x1 - homeItemSize() * 0.5);
      it.fx = nx / viewW;
      it.rot = (it.rot || 0) + it.roll * dt / (homeItemSize() * 0.3);
      it.roll *= Math.max(0, 1 - dt * 1.8);
      if (Math.abs(it.roll) < 4) { it.roll = 0; saveProgress(); }
    }
  }
  for (i = homeNotes.length - 1; i >= 0; i--) {
    homeNotes[i].age += dt;
    homeNotes[i].y += homeNotes[i].vy * dt;
    homeNotes[i].x += Math.sin(homeNotes[i].age * 5 + i) * viewH * 0.02 * dt;
    if (homeNotes[i].age > homeNotes[i].life) homeNotes.splice(i, 1);
  }

  // Puput: peti nukuttaa, porkkanat syöttävät, pallo houkuttaa leikkiin, muuten vaellus
  var bed = homeHas('bed'), carrots = homeHas('carrots'), ball = homeHas('ball');
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    b.earT += dt * (b.state === 'eat' ? 12 : 3);
    b.timer -= dt;
    var want = 'wander', target = null;
    if (i === 0 && bed) { want = 'sleep'; target = { fx: bed.fx, fy: bed.fy - 0.005 }; }
    else if (i === 1 && carrots) { want = 'eat'; target = { fx: carrots.fx + 0.045, fy: carrots.fy }; }
    else if (i === 2 && ball) { want = 'play'; target = { fx: ball.fx + (b.side || -1) * 0.05, fy: ball.fy }; }
    if (want !== 'wander') {
      b.tx = target.fx; b.ty = target.fy;
    } else if (b.timer <= 0) {
      b.timer = 2 + Math.random() * 3;
      b.tx = (room.x0 + homeItemSize() * 0.5 + Math.random() * (room.x1 - room.x0 - homeItemSize())) / viewW;
      b.ty = (room.floorY + viewH * 0.05 + Math.random() * (room.bottom - room.floorY - viewH * 0.08)) / viewH;
    }
    var dx = (b.tx - b.fx) * viewW, dy = (b.ty - b.fy) * viewH, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      var sp = viewH * 0.16 * dt;
      if (sp > dist) sp = dist;
      b.fx += (dx / dist) * sp / viewW;
      b.fy += (dy / dist) * sp / viewH;
      b.moving = true;
      b.state = 'wander';
      b.hop = Math.abs(Math.sin(globalT * 9 + i));
    } else {
      b.moving = false;
      b.hop = Math.max(0, b.hop - dt * 4);
      b.state = want;
      if (want === 'play' && b.timer <= 0) {
        b.timer = 1.2 + Math.random();
        b.side = -(b.side || -1);
        ball.roll = (ball.roll || 0) + (b.side < 0 ? 1 : -1) * viewW * 0.08;
        b.hop = 1;
      }
    }
  }
  updateParticles(dt);
}

// ---------- Piirto ----------
function drawHome() {
  var i, it;
  if (!viewW || !viewH) return;
  renderHomeBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(homeBgCanvas, 0, 0, homeBgCanvas.width, homeBgCanvas.height, 0, 0, viewW, viewH);

  // Seinätavarat, sitten lattiatavarat ja puput y-järjestyksessä
  var order = [];
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (homeItemDef(it.id).kind === 'wall') drawHomeItem(ctx, it, it.fx * viewW, it.fy * viewH, homeItemSize());
    else order.push({ y: it.fy * viewH, item: it });
  }
  for (i = 0; i < homeBunnies.length; i++) order.push({ y: homeBunnies[i].fy * viewH, bunny: homeBunnies[i] });
  order.sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < order.length; i++) {
    if (order[i].item) drawHomeItem(ctx, order[i].item, order[i].item.fx * viewW, order[i].item.fy * viewH, homeItemSize());
    else drawHomeBunny(ctx, order[i].bunny);
  }
  if (homeDrag) {
    var r = homeItemRect(homeDrag.item);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = Math.max(2, viewH * 0.005);
    roundRect(ctx, r.x, r.y, r.w, r.h, viewH * 0.02);
    ctx.stroke();
  }
  for (i = 0; i < homeNotes.length; i++) drawNote(ctx, homeNotes[i]);
  drawParticlesLayerAbs(ctx);
  drawHomeShop(ctx);
}

function drawParticlesLayerAbs(c) {
  var i;
  for (i = 0; i < particles.length; i++) {
    c.globalAlpha = 1 - particles[i].age / particles[i].life;
    c.fillStyle = particles[i].color;
    c.fillRect(particles[i].x - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  c.globalAlpha = 1;
}

function drawNote(c, n) {
  var s = viewH * 0.02, cols = ['#ff7bac', '#8a4dff', '#ffb84f'];
  c.globalAlpha = Math.max(0, 1 - n.age / n.life);
  c.fillStyle = cols[n.c];
  c.beginPath(); c.arc(n.x, n.y, s * 0.5, 0, Math.PI * 2); c.fill();
  c.fillRect(n.x + s * 0.35, n.y - s * 1.6, s * 0.18, s * 1.6);
  c.fillRect(n.x + s * 0.35, n.y - s * 1.6, s * 0.7, s * 0.2);
  c.globalAlpha = 1;
}

function drawStarBalance(c, x, y) {
  var s = viewH * 0.03;
  var txt = String(starCoins);
  c.font = 'bold ' + Math.round(s * 1.6) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  var tw = c.measureText(txt).width;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  roundRect(c, x, y - s * 1.2, s * 2.6 + tw + s * 0.8, s * 2.4, s * 1.2);
  c.fill();
  drawStar(c, x + s * 1.3, y, s * 0.85, 0, 0.6);
  c.fillStyle = '#7a3cb8';
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(txt, x + s * 2.6, y + s * 0.05);
  c.textBaseline = 'alphabetic';
}

function drawHomeShop(c) {
  var s = homeShopBox(), cells = homeShopCells(), i, k;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(c, s.x + viewH * 0.006, s.y + viewH * 0.01, s.w, s.h, viewH * 0.03);
  c.fill();
  c.fillStyle = '#fff6e3';
  roundRect(c, s.x, s.y, s.w, s.h, viewH * 0.03);
  c.fill();
  c.strokeStyle = '#e8c9a0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  roundRect(c, s.x, s.y, s.w, s.h, viewH * 0.03);
  c.stroke();
  drawStarBalance(c, s.x + viewH * 0.02, s.y + s.head * 0.5);
  for (i = 0; i < cells.length; i++) {
    var cell = cells[i], def = cell.def, owned = !!homeHas(def.id), afford = starCoins >= def.price;
    var shake = homeShake.id === def.id && homeShake.t > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
    c.fillStyle = owned ? 'rgba(200,190,220,0.35)' : (afford ? '#ffffff' : 'rgba(255,255,255,0.55)');
    roundRect(c, cell.x + shake, cell.y, cell.w, cell.h, viewH * 0.015);
    c.fill();
    c.globalAlpha = owned ? 0.35 : (afford ? 1 : 0.5);
    var isz = Math.min(cell.w, cell.h) * 0.62;
    var fake = { id: def.id, fx: 0, fy: 0, on: true, phase: 0 };
    drawHomeItem(c, fake, cell.x + cell.w / 2 + shake, cell.y + cell.h * (def.kind === 'wall' ? 0.42 : 0.68), isz);
    c.globalAlpha = 1;
    if (owned) {
      c.strokeStyle = '#4fb356';
      c.lineWidth = Math.max(2, viewH * 0.008);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cell.x + cell.w * 0.35, cell.y + cell.h * 0.5);
      c.lineTo(cell.x + cell.w * 0.47, cell.y + cell.h * 0.65);
      c.lineTo(cell.x + cell.w * 0.68, cell.y + cell.h * 0.35);
      c.stroke();
      c.lineCap = 'butt';
    } else {
      var ps = Math.min(cell.w / (def.price * 2.4), cell.h * 0.09);
      for (k = 0; k < def.price; k++) {
        drawStar(c, cell.x + cell.w / 2 + (k - (def.price - 1) / 2) * ps * 2.3 + shake, cell.y + cell.h * 0.88, ps, 0, 0);
      }
    }
  }
}

function drawHomeBunny(c, b) {
  var x = b.fx * viewW, y = b.fy * viewH, s = viewH * 0.042;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 0.8, s * 0.22, 0, 0, Math.PI * 2);
  else c.arc(x, y, s * 0.5, 0, Math.PI * 2);
  c.fill();
  drawBunny(c, x, y, s, b.hop * viewH * 0.02, b.earT, false);
  if (b.state === 'sleep') {
    c.fillStyle = 'rgba(120,80,160,0.8)';
    c.font = Math.round(s * 0.7) + 'px sans-serif';
    c.textAlign = 'left';
    c.fillText('z', x + s * 0.7, y - s * 1.7 - Math.sin(globalT * 2) * s * 0.1);
    c.fillText('z', x + s * 1.1, y - s * 2.2 - Math.sin(globalT * 2 + 1) * s * 0.1);
  } else if (b.state === 'eat') {
    c.fillStyle = '#ff8a3d';
    c.fillRect(x - s * 0.1, y - s * 1.05, s * 0.2 + Math.sin(globalT * 12) * s * 0.05, s * 0.12);
  }
}

// Huonekalut: lattiatavaroilla (x, y) on jalkojen keskikohta, seinätavaroilla keskipiste
function drawHomeItem(c, it, x, y, s) {
  var i, bump = it.phase ? Math.sin(it.phase * Math.PI) * s * 0.06 : 0;
  y -= bump;
  if (it.id === 'rug') {
    var rcols = ['#ff7bac', '#c9a0ff', '#ffd24f'];
    for (i = 0; i < 3; i++) {
      c.fillStyle = rcols[i];
      c.beginPath();
      if (c.ellipse) c.ellipse(x, y - s * 0.08, s * (0.8 - i * 0.22), s * (0.3 - i * 0.08), 0, 0, Math.PI * 2);
      else c.arc(x, y - s * 0.08, s * (0.6 - i * 0.18), 0, Math.PI * 2);
      c.fill();
    }
  } else if (it.id === 'lamp') {
    c.fillStyle = '#8a5cb8';
    c.beginPath(); c.arc(x, y - s * 0.03, s * 0.18, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.03, y - s * 0.9, s * 0.06, s * 0.9);
    if (it.on) {
      var lg = c.createRadialGradient(x, y - s * 0.95, s * 0.1, x, y - s * 0.95, s * 0.9);
      lg.addColorStop(0, 'rgba(255,240,170,0.55)');
      lg.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = lg;
      c.beginPath(); c.arc(x, y - s * 0.95, s * 0.9, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = it.on ? '#ffe9a0' : '#e8d5f2';
    c.beginPath(); c.moveTo(x - s * 0.32, y - s * 0.72); c.lineTo(x + s * 0.32, y - s * 0.72); c.lineTo(x + s * 0.18, y - s * 1.05); c.lineTo(x - s * 0.18, y - s * 1.05); c.closePath(); c.fill();
  } else if (it.id === 'plant') {
    c.fillStyle = '#c96a3a';
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.4); c.lineTo(x + s * 0.3, y - s * 0.4); c.lineTo(x + s * 0.22, y); c.lineTo(x - s * 0.22, y); c.closePath(); c.fill();
    c.fillStyle = '#4fb356';
    for (i = -2; i <= 2; i++) {
      c.beginPath();
      if (c.ellipse) c.ellipse(x + i * s * 0.14, y - s * 0.62 - Math.abs(i) * -s * 0.05, s * 0.12, s * 0.3, i * 0.35, 0, Math.PI * 2);
      else c.arc(x + i * s * 0.14, y - s * 0.65, s * 0.15, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.arc(x, y - s * 0.9, s * 0.08, 0, Math.PI * 2); c.fill();
  } else if (it.id === 'ball') {
    c.save();
    c.translate(x, y - s * 0.3);
    c.rotate(it.rot || 0);
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.arc(0, 0, s * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5fa8ff';
    c.beginPath(); c.arc(0, 0, s * 0.3, -0.5, 0.5); c.lineTo(0, 0); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, 0, s * 0.3, Math.PI - 0.5, Math.PI + 0.5); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffe94f';
    c.beginPath(); c.arc(0, 0, s * 0.12, 0, Math.PI * 2); c.fill();
    c.restore();
  } else if (it.id === 'painting') {
    c.fillStyle = '#a9743f';
    roundRect(c, x - s * 0.5, y - s * 0.4, s, s * 0.8, s * 0.05);
    c.fill();
    c.fillStyle = '#bfe6ff';
    c.fillRect(x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.64);
    var pcols = ['#ff5f7e', '#ffe94f', '#5fa8ff'];
    c.lineWidth = s * 0.04;
    for (i = 0; i < 3; i++) { c.strokeStyle = pcols[i]; c.beginPath(); c.arc(x, y + s * 0.25, s * (0.32 - i * 0.05), Math.PI, 0); c.stroke(); }
    drawCastle(c, x, y + s * 0.3, s * 0.35);
  } else if (it.id === 'bed') {
    c.fillStyle = '#c98b4a';
    roundRect(c, x - s * 0.5, y - s * 0.36, s, s * 0.36, s * 0.12);
    c.fill();
    c.fillStyle = '#ffd6ec';
    roundRect(c, x - s * 0.42, y - s * 0.4, s * 0.84, s * 0.22, s * 0.1);
    c.fill();
    c.fillStyle = '#ffffff';
    roundRect(c, x - s * 0.36, y - s * 0.46, s * 0.3, s * 0.14, s * 0.06);
    c.fill();
  } else if (it.id === 'carrots') {
    c.fillStyle = '#7fd4ff';
    c.beginPath(); c.moveTo(x - s * 0.36, y - s * 0.3); c.lineTo(x + s * 0.36, y - s * 0.3); c.lineTo(x + s * 0.26, y); c.lineTo(x - s * 0.26, y); c.closePath(); c.fill();
    for (i = -1; i <= 1; i++) {
      c.fillStyle = '#ff8a3d';
      c.beginPath(); c.moveTo(x + i * s * 0.18 - s * 0.07, y - s * 0.3); c.lineTo(x + i * s * 0.18 + s * 0.07, y - s * 0.3); c.lineTo(x + i * s * 0.18, y - s * 0.62); c.closePath(); c.fill();
      c.fillStyle = '#4fb356';
      c.fillRect(x + i * s * 0.18 - s * 0.03, y - s * 0.72, s * 0.06, s * 0.12);
    }
  } else if (it.id === 'curtains') {
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.6, y - s * 0.45, s * 1.2, s * 0.05);
    c.fillStyle = '#ff7bac';
    for (i = -1; i <= 1; i += 2) {
      c.beginPath();
      c.moveTo(x + i * s * 0.55, y - s * 0.42);
      c.quadraticCurveTo(x + i * s * 0.2, y, x + i * s * 0.45, y + s * 0.42);
      c.lineTo(x + i * s * 0.55, y + s * 0.42);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ffe27a';
    c.beginPath(); c.arc(x - s * 0.32, y + s * 0.02, s * 0.06, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + s * 0.32, y + s * 0.02, s * 0.06, 0, Math.PI * 2); c.fill();
  } else if (it.id === 'mirror') {
    c.fillStyle = '#d9b34f';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * 0.34, s * 0.44, 0, 0, Math.PI * 2);
    else c.arc(x, y, s * 0.38, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#dff3ff';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * 0.26, s * 0.36, 0, 0, Math.PI * 2);
    else c.arc(x, y, s * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(x - s * 0.1, y - s * 0.15, s * 0.06, 0, Math.PI * 2); c.fill();
    drawStar(c, x + s * 0.1, y + s * 0.1, s * 0.05, globalT, 0.4);
  } else if (it.id === 'table') {
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.36, y - s * 0.5, s * 0.06, s * 0.5);
    c.fillRect(x + s * 0.3, y - s * 0.5, s * 0.06, s * 0.5);
    c.fillStyle = '#c98b4a';
    roundRect(c, x - s * 0.5, y - s * 0.56, s, s * 0.1, s * 0.04);
    c.fill();
    c.fillStyle = '#ffd6ec';
    roundRect(c, x - s * 0.2, y - s * 0.82, s * 0.4, s * 0.26, s * 0.06);
    c.fill();
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.arc(x, y - s * 0.86, s * 0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.fillRect(x - s * 0.02, y - s * 0.98, s * 0.04, s * 0.1);
  } else if (it.id === 'shelf') {
    c.fillStyle = '#8a5a30';
    c.fillRect(x - s * 0.4, y - s * 1.0, s * 0.8, s * 1.0);
    var bcols = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff'];
    var k;
    for (k = 0; k < 3; k++) {
      c.fillStyle = '#c98b4a';
      c.fillRect(x - s * 0.36, y - s * 0.3 - k * s * 0.3, s * 0.72, s * 0.04);
      for (i = 0; i < 5; i++) {
        c.fillStyle = bcols[(i + k) % 5];
        c.fillRect(x - s * 0.33 + i * s * 0.13, y - s * 0.3 - k * s * 0.3 - s * 0.2 + (i % 2) * s * 0.03, s * 0.1, s * 0.2 - (i % 2) * s * 0.03);
      }
    }
  } else if (it.id === 'musicbox') {
    c.fillStyle = '#c9a0ff';
    roundRect(c, x - s * 0.32, y - s * 0.34, s * 0.64, s * 0.34, s * 0.06);
    c.fill();
    c.fillStyle = '#8a4dff';
    roundRect(c, x - s * 0.34, y - s * 0.42, s * 0.68, s * 0.1, s * 0.04);
    c.fill();
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.arc(x, y - s * 0.17, s * 0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.arc(x, y - s * 0.62, s * 0.1, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.02, y - s * 0.55, s * 0.04, s * 0.15);
  }
}

function renderHomeBg() {
  var key = viewW + 'x' + viewH;
  if (homeBgKey === key) return;
  homeBgKey = key;
  homeBgCanvas.width = Math.round(viewW * DPR);
  homeBgCanvas.height = Math.round(viewH * DPR);
  var b = homeBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var room = homeRoom(), w = viewW, h = viewH, i, k, x, y;
  b.fillStyle = '#e8dcf5';
  b.fillRect(0, 0, w, h);
  // Seinä tapetilla
  var wall = b.createLinearGradient(0, 0, 0, room.floorY);
  wall.addColorStop(0, '#f3e9ff');
  wall.addColorStop(1, '#e2d2f5');
  b.fillStyle = wall;
  b.fillRect(0, 0, room.x1 + h * 0.02, room.floorY);
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 14; i++) {
    for (k = 0; k < 7; k++) {
      x = h * 0.06 + i * h * 0.11 + (k % 2) * h * 0.055;
      y = h * 0.06 + k * h * 0.085;
      if (y > room.floorY - h * 0.08) continue;
      drawHeartShape(b, x, y, h * 0.012, true);
    }
  }
  // Ikkuna
  var wx = room.x1 * 0.22, wy = room.floorY * 0.42, ww = h * 0.2, wh = h * 0.26;
  b.fillStyle = '#a9743f';
  roundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02);
  b.fill();
  var sky = b.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#dff3ff');
  b.fillStyle = sky;
  roundRect(b, wx - ww / 2, wy - wh / 2, ww, wh, h * 0.015);
  b.fill();
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, wx - ww * 0.2, wy - wh * 0.2, h * 0.014);
  cloudShape(b, wx + ww * 0.25, wy + wh * 0.05, h * 0.011);
  b.fillStyle = '#7fcf68';
  b.beginPath(); b.arc(wx, wy + wh * 0.62, ww * 0.6, Math.PI, 0); b.fill();
  b.fillStyle = '#a9743f';
  b.fillRect(wx - h * 0.006, wy - wh / 2, h * 0.012, wh);
  b.fillRect(wx - ww / 2, wy - h * 0.006, ww, h * 0.012);
  // Lattialista ja lattia
  b.fillStyle = '#c9a0ff';
  b.fillRect(0, room.floorY - h * 0.03, room.x1 + h * 0.02, h * 0.03);
  var floor = b.createLinearGradient(0, room.floorY, 0, h);
  floor.addColorStop(0, '#e2b98a');
  floor.addColorStop(1, '#c48f5c');
  b.fillStyle = floor;
  b.fillRect(0, room.floorY, room.x1 + h * 0.02, h - room.floorY);
  b.strokeStyle = 'rgba(120,70,30,0.25)';
  b.lineWidth = 2;
  for (y = room.floorY + h * 0.06; y < h; y += h * 0.07) { b.beginPath(); b.moveTo(0, y); b.lineTo(room.x1 + h * 0.02, y); b.stroke(); }
  for (i = 0; i < 12; i++) {
    x = i * h * 0.16 + (i % 2) * h * 0.08;
    b.beginPath(); b.moveTo(x, room.floorY); b.lineTo(x - h * 0.06, h); b.stroke();
  }
  // Ovi oikeassa reunassa huoneen ja kaupan välissä
  b.fillStyle = '#8a5a30';
  roundRect(b, room.x1 - h * 0.13, room.floorY - h * 0.3, h * 0.12, h * 0.3, h * 0.03);
  b.fill();
  b.fillStyle = '#ffd24f';
  b.beginPath(); b.arc(room.x1 - h * 0.04, room.floorY - h * 0.14, h * 0.01, 0, Math.PI * 2); b.fill();
}
