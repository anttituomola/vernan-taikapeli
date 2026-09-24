'use strict';

// Linnan puutarha: linnan viides huone (HOME_ROOMS[4]) on ulkona keittiön
// vieressä, ja sinne mennään keittiön vasemmasta ovesta tai linnakartalta.
// Kasvit ostetaan kaupasta raahaamalla kuten huonekalut, ja ne alkavat
// siemenenä multakummussa. Kastelukannu raahataan kasvin viereen: kannu
// kallistuu, vesi valuu ja kasvi kasvaa askeleen (siemen -> taimi -> nuppu ->
// kukka/kypsä). Kasvanut kasvi janoaa taas seuraavana päivänä (nuokkuu, kunnes
// se kastellaan). Kypsän marjan, porkkanan, kurpitsan tai omenan napautus
// pudottaa herkun, jonka pupu syö. Aurinko taivaalla ja rikkaruohot
// nurmikolla reagoivat napautukseen. Puutarhan tavaroiden piirto ja napautus
// ovat tässä; itse tavaralista on HOME_ITEMS-listan lopussa (flow-home.js).

var YARD_ROOM = 4;
var YARD_GROW_WAIT = 3;        // s kastelun jälkeen ennen kuin kasvi juo taas
var YARD_POUR = 0.6;           // s kaatoa yhteen kasteluun
// Kasvit ja niiden herkku (null = kukka, ei satoa)
var YARD_PLANTS = {
  tulips: null, sunflower: null, rosebush: null, magicflower: null,
  strawberries: 'berry', veggies: 'carrot', pumpkin: 'pumpkin', appletree: 'apple'
};
var yardWeeds = [];            // { fx, fy, grow, pull }
var yardWeedT = 10;
var yardSeeded = false;        // ensimmäisellä käynnillä kaksi rikkaruohoa odottaa
var yardTreats = [];           // pudonneet herkut { fx, fy, kind, room, vy, z, eat }
var yardDrops = [];            // kannun vesipisarat { x, y, vx, vy, age, floorY }
var yardSun = { t: 0 };

function yardIsPlant(id) {
  return YARD_PLANTS.hasOwnProperty(id);
}
// Kasvuaste 0..3 (kaupan kortti ilman astetta näyttää valmiin kasvin)
function yardStage(it) {
  return it.stage === undefined ? 3 : it.stage;
}
function yardDay() {
  var d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / BANK_DAY);
}
// Janoaako kasvi: kasvava kasvi, joka ei juuri juonut, tai eilen kasvanut
function yardThirsty(it) {
  if (!yardIsPlant(it.id) || it.stage === undefined) return false;
  if (it.stage < 3) return !(it.wetT > 0);
  return it.wd !== yardDay();
}
// Kasvin latvan korkeus (janokupla ja kastelu)
function yardPlantTop(it, s) {
  var st = yardStage(it);
  if (st === 0) return s * 0.2;
  if (it.id === 'appletree') return s * [0.2, 0.7, 1.4, 1.6][st];
  if (it.id === 'sunflower') return s * [0.2, 0.55, 0.95, 1.3][st];
  return s * [0.2, 0.45, 0.65, 0.8][st];
}

// ---------- Kastelu ----------
// Kastelukannun suutin: kasvi, jonka päälle vesi valuisi (tai null)
function yardPourTarget(can) {
  var s = homeItemSize(), sx = can.fx * viewW + s * 0.55, sy = can.fy * viewH, i, it, best = null, bd = 1e9, d;
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (it === can || !yardIsPlant(it.id) || homeItemRoom(it) !== homeRoomIdx) continue;
    d = Math.abs(it.fx * viewW - sx);
    if (d < s * 0.5 && Math.abs(it.fy * viewH - sy) < viewH * 0.11 && d < bd) { bd = d; best = it; }
  }
  return best;
}

function yardWater(p) {
  var s = homeItemSize(), x = p.fx * viewW, y = p.fy * viewH - yardPlantTop(p, s) * 0.6;
  if (p.stage === undefined) p.stage = 3;
  if (p.stage < 3 && !(p.wetT > 0)) {
    p.stage++;
    p.growT = 1;
    p.wetT = YARD_GROW_WAIT;
    if (p.stage === 3) {
      p.wd = yardDay();
      p.apples = 3;
      spawnSparkles(x, y - s * 0.3, 22, p.id === 'magicflower' ? '#c9a0ff' : '#ffe27a');
      playNote(784, 0, 0.12, 'sine', 0.3);
      playNote(988, 0.1, 0.12, 'sine', 0.3);
      playNote(1175, 0.2, 0.14, 'sine', 0.3);
      playNote(1568, 0.3, 0.3, 'sine', 0.3);
    } else {
      spawnSparkles(x, y, 12, '#9ee07f');
      playNote(523 + p.stage * 130, 0, 0.12, 'sine', 0.28);
      playNote(659 + p.stage * 130, 0.1, 0.18, 'sine', 0.28);
    }
    saveProgress();
  } else if (p.stage >= 3 && p.wd !== yardDay()) {
    // Janoinen kasvi piristyy
    p.wd = yardDay();
    p.growT = 1;
    spawnSparkles(x, y, 14, '#ffe27a');
    playNote(659, 0, 0.1, 'sine', 0.28);
    playNote(988, 0.1, 0.2, 'sine', 0.28);
    saveProgress();
  } else {
    // Juonut jo: vain hörppy
    p.phase = 1;
    playNote(1400, 0, 0.05, 'sine', 0.12);
  }
}

// ---------- Napautukset ----------
// Aurinko ja rikkaruohot (ennen tavaroita). Palauttaa true, jos napautus osui.
function yardTap(px, py) {
  var i, w, s = homeItemSize(), sun = yardSunPos(), dx, dy;
  if (homeRoomIdx !== YARD_ROOM) return false;
  dx = px - sun.x; dy = py - sun.y;
  if (dx * dx + dy * dy < sun.r * sun.r * 2.2) {
    yardSun.t = 1.6;
    for (i = 0; i < homeItems.length; i++) if (homeItemRoom(homeItems[i]) === YARD_ROOM && yardIsPlant(homeItems[i].id)) homeItems[i].phase = 1;
    for (i = 0; i < 5; i++) playNote([523, 659, 784, 1047, 1319][i], i * 0.08, 0.2, 'sine', 0.22);
    spawnSparkles(sun.x, sun.y, 18, '#ffd24f');
    return true;
  }
  for (i = yardWeeds.length - 1; i >= 0; i--) {
    w = yardWeeds[i];
    if (w.pull > 0) continue;
    dx = px - w.fx * viewW; dy = py - (w.fy * viewH - s * 0.15);
    if (dx * dx + dy * dy < s * s * 0.2) {
      w.pull = 0.001;
      spawnSparkles(w.fx * viewW, w.fy * viewH, 10, '#8a5a30');
      spawnSparkles(w.fx * viewW, w.fy * viewH - s * 0.2, 6, '#6fd66f');
      playNote(330, 0, 0.06, 'triangle', 0.25);
      playNote(880, 0.06, 0.1, 'sine', 0.25);
      return true;
    }
  }
  return false;
}

function yardDropTreat(it, kind, x, y) {
  var s = homeItemSize();
  yardTreats.push({ fx: (x + (Math.random() - 0.5) * s * 0.5) / viewW, fy: it.fy + 0.02 + Math.random() * 0.03, kind: kind, room: homeRoomIdx, z: it.fy * viewH - y, vy: 0, eat: 0 });
}

// Puutarhatavaran napautus: palauttaa true, jos tavara oli puutarhan
function yardItemTap(it) {
  var i, s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH, st = yardStage(it);
  if (yardIsPlant(it.id)) {
    var top = y - yardPlantTop(it, s);
    if (st < 3) {
      // Kasvaa vielä: heilahdus ja vesitippa muistuttaa kannusta
      playNote(392, 0, 0.1, 'sine', 0.2);
      playNote(349, 0.12, 0.14, 'sine', 0.2);
      spawnSparkles(x, top, 6, '#7fd4ff');
    } else if (YARD_PLANTS[it.id]) {
      // Sato: herkku putoaa maahan
      yardDropTreat(it, YARD_PLANTS[it.id], x, top + s * 0.2);
      if (it.id === 'appletree') {
        it.apples = (it.apples === undefined ? 3 : it.apples) - 1;
        if (it.apples <= 0) { it.stage = 2; it.wetT = 0; }
      } else {
        it.stage = 2;
        it.wetT = 0;
      }
      saveProgress();
      playNote(660, 0, 0.08, 'sine', 0.25);
      playNote(440, 0.12, 0.1, 'triangle', 0.25);
    } else if (it.id === 'magicflower') {
      var mel = [784, 988, 1175, 1568, 1175, 1319, 1568];
      for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.2, 'sine', 0.24);
      var rc = ['#ff5f7e', '#ffb84f', '#ffe27a', '#6fd66f', '#5fa8ff', '#c9a0ff'];
      for (i = 0; i < rc.length; i++) spawnSparkles(x, top, 4, rc[i]);
      it.spinT = 1.8;
    } else {
      it.spinT = 1.2;
      playNote(988, 0, 0.12, 'sine', 0.22);
      playNote(1319, 0.1, 0.2, 'sine', 0.22);
      spawnSparkles(x, top, 10, it.id === 'rosebush' ? '#ff7bac' : '#ffd24f');
    }
  } else if (it.id === 'wateringcan') {
    it.splashT = 0.8;
    for (i = 0; i < 6; i++) yardDrops.push({ x: x + s * 0.5, y: y - s * 0.5, vx: (Math.random() - 0.2) * viewH * 0.3, vy: -viewH * (0.3 + Math.random() * 0.3), age: 0, floorY: y });
    for (i = 0; i < 3; i++) playNote(1400 + i * 200, i * 0.07, 0.06, 'sine', 0.12);
  } else if (it.id === 'shovel') {
    it.digT = 0.6;
    spawnSparkles(x, y - s * 0.05, 14, '#8a5a30');
    playNote(220, 0, 0.08, 'square', 0.08);
    playNote(180, 0.1, 0.1, 'square', 0.08);
  } else if (it.id === 'wheelbarrow') {
    it.roll = (it.roll || 0) + (Math.random() < 0.5 ? -1 : 1) * viewW * 0.14;
    playNote(330, 0, 0.1, 'triangle', 0.22);
    playNote(294, 0.12, 0.1, 'triangle', 0.22);
  } else if (it.id === 'gnome') {
    it.wobT = 1.2;
    playNote(880, 0, 0.08, 'square', 0.08);
    playNote(1175, 0.1, 0.08, 'square', 0.08);
    playNote(988, 0.2, 0.1, 'square', 0.08);
  } else if (it.id === 'birdhouse') {
    it.birdT = 2.2;
    for (i = 0; i < 4; i++) { playNote(2200 + (i % 2) * 400, i * 0.14, 0.06, 'sine', 0.15); playNote(2600, i * 0.14 + 0.05, 0.05, 'sine', 0.1); }
  } else if (it.id === 'beehive') {
    it.buzzT = 2.5;
    playNote(180, 0, 0.6, 'sawtooth', 0.05);
    playNote(200, 0.3, 0.6, 'sawtooth', 0.04);
  } else if (it.id === 'birdbath') {
    it.splashT = 1;
    for (i = 0; i < 8; i++) yardDrops.push({ x: x, y: y - s * 0.62, vx: (Math.random() - 0.5) * viewH * 0.4, vy: -viewH * (0.25 + Math.random() * 0.3), age: 0, floorY: y - s * 0.55 });
    for (i = 0; i < 4; i++) playNote(1200 + Math.random() * 600, i * 0.06, 0.06, 'sine', 0.12);
  } else if (it.id === 'swing') {
    it.rockT = 3;
    playNote(440, 0, 0.12, 'sine', 0.2);
    playNote(523, 0.4, 0.12, 'sine', 0.2);
  } else {
    return false;
  }
  return true;
}

function updateYardItem(it, dt) {
  if (it.wetT > 0) it.wetT -= dt;
  if (it.growT > 0) it.growT = Math.max(0, it.growT - dt * 2);
  if (it.splashT > 0) it.splashT -= dt;
  if (it.digT > 0) it.digT -= dt;
  if (it.wobT > 0) it.wobT -= dt;
  if (it.birdT > 0) it.birdT -= dt;
  if (it.buzzT > 0) it.buzzT -= dt;
  if (it.id === 'wateringcan') {
    var pouring = !!(homeDrag && homeDrag.item === it && !homeDrag.ghost && yardPourTarget(it));
    it.tilt = Math.max(0, Math.min(1, (it.tilt || 0) + (pouring ? dt * 4 : -dt * 4)));
  }
}

// Kannun kaato, pisarat, herkut, rikkaruohot ja pupujen puutarhapuuhat
function updateYard(dt) {
  var i, s = homeItemSize(), room = homeRoom(), can = null, p, b, t;
  if (homeDrag && homeDrag.item && !homeDrag.ghost && homeDrag.item.id === 'wateringcan') can = homeDrag.item;
  if (can && can.tilt > 0.6) {
    p = yardPourTarget(can);
    if (p) {
      if (Math.random() < dt * 30) {
        yardDrops.push({ x: can.fx * viewW + s * 0.6, y: can.fy * viewH - s * 0.42, vx: viewH * (0.05 + Math.random() * 0.08), vy: viewH * 0.05, age: 0, floorY: p.fy * viewH - s * 0.05 });
      }
      if (Math.random() < dt * 6) playNote(1500 + Math.random() * 700, 0, 0.04, 'sine', 0.06);
      p.pour = (p.pour || 0) + dt;
      if (p.pour >= YARD_POUR) { p.pour = 0; yardWater(p); }
    }
  }
  for (i = yardDrops.length - 1; i >= 0; i--) {
    p = yardDrops[i];
    p.age += dt;
    p.vy += viewH * 1.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if ((p.vy > 0 && p.y > p.floorY) || p.age > 2) yardDrops.splice(i, 1);
  }
  if (yardSun.t > 0) yardSun.t -= dt;
  // Herkut putoavat maahan; pupu 1 syö sen (ks. updateHome)
  b = homeBunnies[1];
  for (i = yardTreats.length - 1; i >= 0; i--) {
    t = yardTreats[i];
    if (t.z > 0) {
      t.vy += viewH * 2 * dt;
      t.z = Math.max(0, t.z - t.vy * dt);
      if (t.z === 0) playNote(262, 0, 0.06, 'triangle', 0.2);
    }
    if (t.room !== homeRoomIdx) continue;
    if (t === yardTreatHere() && b && b.state === 'eat') {
      t.eat += dt;
      if (Math.random() < dt * 5) playNote(700 + Math.random() * 300, 0, 0.04, 'square', 0.05);
      if (t.eat > 2.2) {
        spawnSparkles(t.fx * viewW, t.fy * viewH - s * 0.1, 10, '#ffd6ec');
        playNote(1047, 0, 0.1, 'sine', 0.22);
        playNote(1319, 0.1, 0.15, 'sine', 0.22);
        b.hop = 1;
        yardTreats.splice(i, 1);
      }
    }
  }
  // Pupu 0 kottikärryissä ja pupu 2 keinussa: piirto nostaa ja heiluttaa
  for (i = 0; i < homeBunnies.length; i++) { homeBunnies[i].ox = 0; homeBunnies[i].oy = 0; }
  var swing = homeHasHere('swing'), barrow = homeHasHere('wheelbarrow');
  if (homeBunnies[2] && homeBunnies[2].state === 'swing' && swing) {
    swing.rockT = Math.max(swing.rockT || 0, 1.2);
    var a = yardSwingAngle(swing), L = s * 0.9;
    homeBunnies[2].ox = Math.sin(a) * L;
    homeBunnies[2].oy = -s * 1.25 + Math.cos(a) * L - s * 0.02 - (swing.fy * viewH - homeBunnies[2].fy * viewH);
  }
  if (homeBunnies[0] && homeBunnies[0].state === 'ride' && barrow) homeBunnies[0].oy = -s * 0.28;
  // Rikkaruohot kasvavat nurmikolle, enintään kolme kerrallaan
  if (homeRoomIdx !== YARD_ROOM) return;
  if (!yardSeeded) {
    yardSeeded = true;
    yardSpawnWeed(1);
    yardSpawnWeed(1);
  }
  yardWeedT -= dt;
  if (yardWeedT <= 0) {
    yardWeedT = 18 + Math.random() * 14;
    if (yardWeeds.length < 3) yardSpawnWeed(0);
  }
  for (i = yardWeeds.length - 1; i >= 0; i--) {
    var w = yardWeeds[i];
    if (w.grow < 1) w.grow = Math.min(1, w.grow + dt * 0.5);
    if (w.pull > 0) {
      w.pull += dt * 2.5;
      if (w.pull >= 1) yardWeeds.splice(i, 1);
    }
  }
}

function yardSpawnWeed(grown) {
  var room = homeRoom(), s = homeItemSize(), k, x, y, i, r, ok;
  for (k = 0; k < 12; k++) {
    x = room.x0 + s + Math.random() * (room.x1 - room.x0 - s * 3);
    y = room.floorY + s * 0.4 + Math.random() * (room.bottom - room.floorY - s * 0.5);
    ok = true;
    for (i = 0; i < homeItems.length && ok; i++) {
      if (homeItemRoom(homeItems[i]) !== YARD_ROOM) continue;
      r = homeItemRect(homeItems[i]);
      if (x > r.x - s * 0.2 && x < r.x + r.w + s * 0.2 && y > r.y && y < r.y + r.h + s * 0.3) ok = false;
    }
    if (ok) { yardWeeds.push({ fx: x / viewW, fy: y / viewH, grow: grown ? 1 : 0, pull: 0 }); return; }
  }
}

// Lähin syömätön herkku tässä huoneessa (pupu 1 hakee sen)
function yardTreatHere() {
  var i;
  for (i = 0; i < yardTreats.length; i++) if (yardTreats[i].room === homeRoomIdx && yardTreats[i].z === 0) return yardTreats[i];
  return null;
}

function yardOnEnter() {
  var i;
  // Kauppa aukeaa puutarhan sivulta
  for (i = 0; i < HOME_ITEMS.length; i++) if (HOME_ITEMS[i].id === 'wateringcan') break;
  homeShopPage = Math.floor(i / HOME_SHOP_PAGE);
}

// ---------- Piirto ----------
function yardSunPos() {
  var room = homeRoom();
  return { x: room.x0 + (room.x1 - room.x0) * 0.13, y: viewH * 0.13, r: viewH * 0.06 };
}

function yardSwingAngle(it) {
  var k = Math.min(1, (it.rockT || 0) / 1.2);
  return Math.sin(globalT * 3.2) * 0.5 * k;
}

// Tausta: taivas, kukkulat, linnan muuri portteineen, aita (seinämaali) ja
// nurmikko kivipolkuineen (lattiamaali)
function renderYardBg(b, room, h, wallP, floorP) {
  var w = room.x1 + h * 0.02, i, x, y, fy = room.floorY;
  var sky = b.createLinearGradient(0, 0, 0, fy);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#e6f6ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, fy);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.42, h * 0.1, h * 0.028);
  cloudShape(b, w * 0.7, h * 0.2, h * 0.02);
  b.fillStyle = '#b8e4a0';
  b.beginPath(); b.arc(w * 0.2, fy + h * 0.05, h * 0.26, Math.PI, 0); b.fill();
  b.beginPath(); b.arc(w * 0.55, fy + h * 0.08, h * 0.3, Math.PI, 0); b.fill();
  b.fillStyle = '#a2d98a';
  b.beginPath(); b.arc(w * 0.38, fy + h * 0.1, h * 0.22, Math.PI, 0); b.fill();
  drawTree(b, w * 0.3, fy - h * 0.08, h * 0.11);
  drawTree(b, w * 0.62, fy - h * 0.06, h * 0.09);
  // Linnan muuri oikealla (portti = keittiön ovi)
  var mx = room.x1 - h * 0.28, lineC = '#9a6fc4', lw = Math.max(1.5, h * 0.004);
  b.beginPath(); b.rect(mx, h * 0.1, w - mx, fy - h * 0.1);
  artFillPath(b, '#e8d5f2', h * 0.1, fy, h * 0.1, { lineColor: lineC, line: lw });
  b.fillStyle = '#e8d5f2';
  for (x = mx; x < w - h * 0.02; x += h * 0.06) b.fillRect(x, h * 0.07, h * 0.035, h * 0.032);
  b.strokeStyle = 'rgba(154,111,196,0.3)';
  b.lineWidth = lw;
  for (y = h * 0.16; y < fy; y += h * 0.06) {
    b.beginPath(); b.moveTo(mx, y); b.lineTo(w, y); b.stroke();
    for (x = mx + ((y / (h * 0.06)) % 2) * h * 0.05; x < w; x += h * 0.1) { b.beginPath(); b.moveTo(x, y); b.lineTo(x, y - h * 0.06); b.stroke(); }
  }
  // Köynnösruusut muurilla
  for (i = 0; i < 6; i++) drawFlower(b, mx + h * 0.02 + (i % 3) * h * 0.02, h * 0.2 + i * h * 0.05, h * 0.008, i % 2 ? '#ff7bac' : '#ffd6ec');
  // Aita (seinämaalin väri)
  var fc = wallP.pot, ft = fy - h * 0.13;
  b.fillStyle = fc;
  b.fillRect(0, ft + h * 0.03, mx, h * 0.018);
  b.fillRect(0, ft + h * 0.085, mx, h * 0.018);
  for (x = h * 0.01; x < mx - h * 0.02; x += h * 0.055) {
    b.beginPath();
    b.moveTo(x, fy); b.lineTo(x, ft + h * 0.015); b.lineTo(x + h * 0.0145, ft); b.lineTo(x + h * 0.029, ft + h * 0.015); b.lineTo(x + h * 0.029, fy); b.closePath();
    artFillPath(b, fc, ft, fy, h * 0.03, { lineColor: artShade(fc, -0.35), line: Math.max(1, h * 0.003) });
  }
  // Nurmikko
  var grass = b.createLinearGradient(0, fy, 0, h);
  grass.addColorStop(0, '#9ee07f');
  grass.addColorStop(1, '#63b84e');
  b.fillStyle = grass;
  b.fillRect(0, fy, w, h - fy);
  b.strokeStyle = 'rgba(40,110,40,0.35)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 70; i++) {
    x = (i * 131.7) % w;
    y = fy + h * 0.03 + (i * 53.3) % (h - fy - h * 0.04);
    b.beginPath(); b.moveTo(x - h * 0.006, y); b.lineTo(x - h * 0.008, y - h * 0.014); b.moveTo(x, y); b.lineTo(x + h * 0.001, y - h * 0.018); b.moveTo(x + h * 0.006, y); b.lineTo(x + h * 0.009, y - h * 0.013); b.stroke();
  }
  for (i = 0; i < 14; i++) drawFlower(b, (i * 211.3) % w, fy + h * 0.04 + (i * 97.9) % (h - fy - h * 0.06), h * 0.006, ['#ffffff', '#ffd24f', '#ff9ec4'][i % 3]);
  // Kivipolku portilta vasempaan alakulmaan (lattiamaalin väri)
  for (i = 0; i < 9; i++) {
    var k = i / 8;
    x = room.x1 - h * 0.07 - k * (room.x1 - room.x0) * 0.62 + Math.sin(k * 5) * h * 0.06;
    y = fy + h * 0.02 + k * (h - fy - h * 0.05);
    artBlob(b, x, y, h * (0.03 + k * 0.025), h * (0.012 + k * 0.01), i % 2 ? floorP.floor[0] : floorP.floor[1], { lineColor: artShade(floorP.floor[1], -0.3), line: Math.max(1, h * 0.003) });
  }
}

// Linnakartan pienoiskuva: taivas, aita ja nurmikko
function yardThumbBg(c, x, y, w, hh, fyRel, wallP) {
  var sky = c.createLinearGradient(0, y, 0, y + hh * fyRel);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#e6f6ff');
  c.fillStyle = sky;
  c.fillRect(x, y, w, hh * fyRel);
  c.fillStyle = '#b8e4a0';
  c.beginPath(); c.arc(x + w * 0.4, y + hh * fyRel + hh * 0.06, w * 0.35, Math.PI, 0); c.fill();
  var grass = c.createLinearGradient(0, y + hh * fyRel, 0, y + hh);
  grass.addColorStop(0, '#9ee07f');
  grass.addColorStop(1, '#63b84e');
  c.fillStyle = grass;
  c.fillRect(x, y + hh * fyRel, w, hh * (1 - fyRel));
  c.fillStyle = wallP.pot;
  var fy = y + hh * fyRel, ft = fy - hh * 0.12, k;
  c.fillRect(x, ft + hh * 0.04, w * 0.8, hh * 0.02);
  for (k = 0; k < 12; k++) c.fillRect(x + w * 0.02 + k * w * 0.065, ft, w * 0.025, fy - ft);
  c.fillStyle = '#e8d5f2';
  c.fillRect(x + w * 0.82, y + hh * 0.1, w * 0.18, fy - y - hh * 0.1);
}

// Maan tasalla: aurinko, rikkaruohot ja herkut (tavaroiden alla)
function drawYardGround(c) {
  var i, s = homeItemSize(), t;
  if (homeRoomIdx === YARD_ROOM) {
    var sun = yardSunPos(), spin = globalT * 0.3 + (yardSun.t > 0 ? yardSun.t * 3 : 0), glow = yardSun.t > 0 ? 1 : 0.5;
    artGlow(c, sun.x, sun.y, sun.r * (2 + glow * 0.6), '#fff2a0', 0.4 + glow * 0.3);
    c.strokeStyle = '#ffd24f';
    c.lineWidth = Math.max(2, sun.r * 0.12);
    c.lineCap = 'round';
    for (i = 0; i < 10; i++) {
      var a = spin + i * Math.PI / 5, r0 = sun.r * 1.2, r1 = sun.r * (1.55 + (yardSun.t > 0 ? 0.3 : 0) + (i % 2) * 0.15);
      c.beginPath(); c.moveTo(sun.x + Math.cos(a) * r0, sun.y + Math.sin(a) * r0); c.lineTo(sun.x + Math.cos(a) * r1, sun.y + Math.sin(a) * r1); c.stroke();
    }
    c.lineCap = 'butt';
    artCircle(c, sun.x, sun.y, sun.r, '#ffd24f', { lineColor: '#e8a020', hi: true });
    artEye(c, sun.x - sun.r * 0.32, sun.y - sun.r * 0.1, sun.r * 0.13, 0, yardSun.t > 0 ? 1 : 0);
    artEye(c, sun.x + sun.r * 0.32, sun.y - sun.r * 0.1, sun.r * 0.13, 0, yardSun.t > 0 ? 1 : 0);
    c.strokeStyle = '#a0561c';
    c.lineWidth = Math.max(1.5, sun.r * 0.08);
    c.beginPath(); c.arc(sun.x, sun.y + sun.r * 0.12, sun.r * (yardSun.t > 0 ? 0.42 : 0.3), 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    artBlush(c, sun.x - sun.r * 0.55, sun.y + sun.r * 0.2, sun.r * 0.14);
    artBlush(c, sun.x + sun.r * 0.55, sun.y + sun.r * 0.2, sun.r * 0.14);
    for (i = 0; i < yardWeeds.length; i++) drawYardWeed(c, yardWeeds[i], s);
  }
  for (i = 0; i < yardTreats.length; i++) {
    t = yardTreats[i];
    if (t.room !== homeRoomIdx) continue;
    drawYardTreat(c, t.kind, t.fx * viewW, t.fy * viewH - t.z, s * 0.22 * (1 - Math.min(0.8, t.eat / 2.6)));
  }
}

// Tavaroiden päällä: vesipisarat ja janokuplat
function drawYardAbove(c) {
  var i, it, s = homeItemSize(), x, y;
  c.fillStyle = '#5fb8ff';
  for (i = 0; i < yardDrops.length; i++) {
    c.beginPath(); c.arc(yardDrops[i].x, yardDrops[i].y, Math.max(1.5, s * 0.025), 0, Math.PI * 2); c.fill();
  }
  if (homeDrag && homeDrag.ghost) return;
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (homeItemRoom(it) !== homeRoomIdx || !yardThirsty(it)) continue;
    if (homeDrag && homeDrag.item === it) continue;
    x = it.fx * viewW + s * 0.3;
    y = it.fy * viewH - yardPlantTop(it, s) - s * 0.15 + Math.sin(globalT * 3 + i) * s * 0.04;
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.arc(x, y, s * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x - s * 0.1, y + s * 0.13, s * 0.035, 0, Math.PI * 2); c.fill();
    yardDrop(c, x, y + s * 0.02, s * 0.07);
  }
}

function yardDrop(c, x, y, r) {
  c.fillStyle = '#5fb8ff';
  c.beginPath();
  c.moveTo(x, y - r * 1.6);
  c.quadraticCurveTo(x + r * 1.1, y - r * 0.2, x, y + r);
  c.quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 1.6);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.1, r * 0.25, 0, Math.PI * 2); c.fill();
}

function drawYardWeed(c, w, s) {
  var x = w.fx * viewW, y = w.fy * viewH, k = w.grow, lift = 0, i;
  if (w.pull > 0) { lift = w.pull * s * 0.6; c.globalAlpha = Math.max(0, 1 - w.pull); }
  c.fillStyle = '#8a5a30';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 0.14, s * 0.04, 0, 0, Math.PI * 2); else c.arc(x, y, s * 0.1, 0, Math.PI * 2);
  c.fill();
  y -= lift;
  if (w.pull > 0) { c.strokeStyle = '#c9a36a'; c.lineWidth = Math.max(1, s * 0.015); c.beginPath(); c.moveTo(x, y); c.lineTo(x - s * 0.03, y + s * 0.08); c.moveTo(x, y); c.lineTo(x + s * 0.04, y + s * 0.07); c.stroke(); }
  for (i = -2; i <= 2; i++) {
    var a = i * 0.4 + Math.sin(globalT * 2 + w.fx * 40) * 0.08, len = s * (0.22 - Math.abs(i) * 0.03) * k;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    artBlob(c, 0, -len * 0.5, s * 0.035, len * 0.5, '#5aa83e', { lineColor: '#3a7a2a', line: Math.max(1, s * 0.01) });
    c.restore();
  }
  if (k >= 1 && !w.pull) artCircle(c, x, y - s * 0.24, s * 0.035, '#fff38a', { lineColor: '#c9a020', line: 1 });
  c.globalAlpha = 1;
}

function drawYardTreat(c, kind, x, y, r) {
  if (r <= 0.5) return;
  if (kind === 'berry') {
    c.fillStyle = '#e8384f';
    c.beginPath(); c.moveTo(x - r, y - r * 0.9); c.quadraticCurveTo(x, y - r * 1.3, x + r, y - r * 0.9); c.quadraticCurveTo(x + r * 0.6, y + r * 0.2, x, y); c.quadraticCurveTo(x - r * 0.6, y + r * 0.2, x - r, y - r * 0.9); c.fill();
    c.fillStyle = '#ffe27a';
    c.fillRect(x - r * 0.3, y - r * 0.6, r * 0.12, r * 0.12);
    c.fillRect(x + r * 0.2, y - r * 0.4, r * 0.12, r * 0.12);
    c.fillStyle = '#4fb356';
    c.beginPath(); c.arc(x, y - r * 1.05, r * 0.3, 0, Math.PI * 2); c.fill();
  } else if (kind === 'carrot') {
    c.fillStyle = '#ff8a3d';
    c.beginPath(); c.moveTo(x - r * 1.2, y - r * 0.4); c.lineTo(x + r * 1.1, y - r * 0.05); c.lineTo(x - r * 1.2, y + r * 0.1); c.closePath(); c.fill();
    c.fillStyle = '#4fb356';
    c.beginPath(); c.arc(x - r * 1.35, y - r * 0.3, r * 0.3, 0, Math.PI * 2); c.arc(x - r * 1.45, y - r * 0.05, r * 0.25, 0, Math.PI * 2); c.fill();
  } else if (kind === 'pumpkin') {
    artBlob(c, x, y - r * 0.7, r * 1.2, r * 0.8, '#ff9f3a', { lineColor: '#c96a1a' });
    c.fillStyle = '#6a8a2a';
    c.fillRect(x - r * 0.1, y - r * 1.7, r * 0.2, r * 0.35);
  } else {
    artCircle(c, x, y - r * 0.8, r * 0.8, '#ff4f5e', { lineColor: '#b82a3a', hi: true });
    c.fillStyle = '#6a4a2a';
    c.fillRect(x - r * 0.06, y - r * 1.8, r * 0.12, r * 0.35);
    c.fillStyle = '#4fb356';
    c.beginPath(); c.arc(x + r * 0.25, y - r * 1.6, r * 0.2, 0, Math.PI * 2); c.fill();
  }
}

// Multakumpu kasvin juurella (märkä kastelun jälkeen)
function yardMound(c, it, x, y, s) {
  var wet = it.wetT > 0 ? Math.min(1, it.wetT) : 0;
  artBlob(c, x, y - s * 0.03, s * 0.36, s * 0.08, wet ? artMix('#8a5a30', '#5a3818', wet) : '#8a5a30', { lineColor: '#5e3b1c', line: Math.max(1, s * 0.012) });
}
function yardLeaf(c, x, y, len, ang, color) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  artBlob(c, len * 0.5, 0, len * 0.5, len * 0.22, color, { lineColor: artShade(color, -0.35), line: Math.max(1, len * 0.05) });
  c.restore();
}
function yardStem(c, x0, y0, x1, y1, w) {
  c.strokeStyle = '#4f9a3a';
  c.lineWidth = Math.max(1.5, w);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0, (y0 + y1) / 2, x1, y1); c.stroke();
  c.lineCap = 'butt';
}

// Puutarhatavarat: palauttaa true, jos tavara piirrettiin
function drawYardItem(c, it, x, y, s) {
  var i, k, st = yardStage(it), grow = it.growT > 0 ? Math.sin(it.growT * Math.PI) * 0.18 : 0;
  var droop = st >= 3 && it.stage !== undefined && it.wd !== yardDay() ? 1 : 0;
  var sway = Math.sin(globalT * 2 + x * 0.05) * 0.04 + (it.spinT > 0 ? Math.sin(it.spinT * 12) * 0.15 : 0);
  if (yardIsPlant(it.id)) {
    yardMound(c, it, x, y, s);
    if (st === 0) {
      // Siemen: pieni itu mullassa
      artBlob(c, x, y - s * 0.09, s * 0.05, s * 0.035, '#c9a36a', { lineColor: '#8a6a3a', line: 1 });
      yardLeaf(c, x, y - s * 0.1, s * (0.08 + grow * 0.3), -Math.PI * 0.35, '#7fcf68');
      return true;
    }
    c.save();
    c.translate(x, y - s * 0.05);
    c.scale(1 + grow * 0.5, 1 + grow);
    c.rotate(sway + droop * 0.12);
    drawYardPlant(c, it, st, s, droop);
    c.restore();
    return true;
  }
  if (it.id === 'wateringcan') {
    var tl = (it.tilt || 0) * 0.6 + (it.splashT > 0 ? Math.sin(it.splashT * 14) * 0.1 : 0);
    c.save();
    c.translate(x, y - s * 0.28);
    c.rotate(tl);
    c.strokeStyle = '#3f78c9';
    c.lineWidth = Math.max(2, s * 0.06);
    c.beginPath(); c.arc(-s * 0.05, -s * 0.2, s * 0.2, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.lineWidth = Math.max(2, s * 0.07);
    c.beginPath(); c.moveTo(s * 0.2, s * 0.05); c.lineTo(s * 0.52, -s * 0.2); c.stroke();
    artCircle(c, s * 0.54, -s * 0.22, s * 0.06, '#3f78c9');
    artRoundRect(c, -s * 0.28, -s * 0.18, s * 0.5, s * 0.44, s * 0.08, '#5fa8ff', { lineColor: '#2f5f9f', hi: true });
    c.fillStyle = '#ffd24f';
    drawFlower(c, -s * 0.03, s * 0.04, s * 0.045, '#ffd24f');
    c.restore();
    return true;
  }
  if (it.id === 'shovel') {
    var dig = it.digT > 0 ? Math.sin(it.digT * Math.PI / 0.6) * s * 0.15 : 0;
    c.fillStyle = '#8a5a30';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y - s * 0.02, s * 0.2, s * 0.05, 0, 0, Math.PI * 2); else c.arc(x, y, s * 0.15, 0, Math.PI * 2);
    c.fill();
    artLimb(c, x, y - s * 0.2 - dig, x, y - s * 0.9 - dig, s * 0.06, '#c98b4a');
    artRoundRect(c, x - s * 0.12, y - s * 1.0 - dig, s * 0.24, s * 0.07, s * 0.03, '#c98b4a');
    c.beginPath();
    c.moveTo(x - s * 0.14, y - s * 0.24 - dig); c.lineTo(x + s * 0.14, y - s * 0.24 - dig); c.lineTo(x + s * 0.12, y - s * 0.02 - dig); c.quadraticCurveTo(x, y + s * 0.06 - dig, x - s * 0.12, y - s * 0.02 - dig); c.closePath();
    artFillPath(c, '#b9c4d4', y - s * 0.24, y, s * 0.14, { lineColor: '#6a7488' });
    return true;
  }
  if (it.id === 'wheelbarrow') {
    var rot = it.rot || 0;
    artLimb(c, x - s * 0.2, y - s * 0.3, x - s * 0.55, y - s * 0.45, s * 0.05, '#a9743f');
    artLimb(c, x - s * 0.2, y - s * 0.3, x - s * 0.32, y - s * 0.02, s * 0.05, '#a9743f');
    c.beginPath();
    c.moveTo(x - s * 0.45, y - s * 0.55); c.lineTo(x + s * 0.4, y - s * 0.55); c.lineTo(x + s * 0.22, y - s * 0.25); c.lineTo(x - s * 0.3, y - s * 0.25); c.closePath();
    artFillPath(c, '#ff5f7e', y - s * 0.55, y - s * 0.25, s * 0.3, { lineColor: '#b83a52' });
    artCircle(c, x + s * 0.18, y - s * 0.13, s * 0.13, '#5a5a6a', { lineColor: '#3a3a48' });
    c.strokeStyle = '#c9c9d8';
    c.lineWidth = Math.max(1, s * 0.02);
    for (i = 0; i < 3; i++) {
      var ra = rot + i * Math.PI / 3;
      c.beginPath(); c.moveTo(x + s * 0.18 - Math.cos(ra) * s * 0.1, y - s * 0.13 - Math.sin(ra) * s * 0.1); c.lineTo(x + s * 0.18 + Math.cos(ra) * s * 0.1, y - s * 0.13 + Math.sin(ra) * s * 0.1); c.stroke();
    }
    return true;
  }
  if (it.id === 'gnome') {
    var wob = it.wobT > 0 ? Math.sin(it.wobT * 16) * 0.25 * it.wobT : 0;
    artBlob(c, x, y - s * 0.22, s * 0.2, s * 0.22, '#5fa8ff', { lineColor: '#2f5f9f' });
    artCircle(c, x, y - s * 0.5, s * 0.14, '#ffd6b8', { lineColor: '#c99a7a' });
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(x - s * 0.15, y - s * 0.48); c.quadraticCurveTo(x, y - s * 0.12, x + s * 0.15, y - s * 0.48); c.quadraticCurveTo(x, y - s * 0.38, x - s * 0.15, y - s * 0.48); c.fill();
    artEye(c, x - s * 0.05, y - s * 0.54, s * 0.022, 0, 0);
    artEye(c, x + s * 0.05, y - s * 0.54, s * 0.022, 0, 0);
    artCircle(c, x, y - s * 0.49, s * 0.035, '#ff9e9e');
    c.save();
    c.translate(x, y - s * 0.6);
    c.rotate(wob);
    c.beginPath(); c.moveTo(-s * 0.17, 0); c.lineTo(s * 0.17, 0); c.quadraticCurveTo(s * 0.05, -s * 0.2, s * 0.14, -s * 0.42); c.quadraticCurveTo(-s * 0.05, -s * 0.25, -s * 0.17, 0); c.closePath();
    artFillPath(c, '#ff4f5e', -s * 0.42, 0, s * 0.17, { lineColor: '#b82a3a' });
    c.restore();
    return true;
  }
  if (it.id === 'birdhouse') {
    artLimb(c, x, y, x, y - s * 0.55, s * 0.06, '#a9743f');
    artRoundRect(c, x - s * 0.2, y - s * 0.9, s * 0.4, s * 0.36, s * 0.04, '#ffd24f', { lineColor: '#c99a20' });
    c.beginPath(); c.moveTo(x - s * 0.28, y - s * 0.88); c.lineTo(x, y - s * 1.1); c.lineTo(x + s * 0.28, y - s * 0.88); c.closePath();
    artFillPath(c, '#ff5f7e', y - s * 1.1, y - s * 0.88, s * 0.2, { lineColor: '#b83a52' });
    c.fillStyle = '#4a3020';
    c.beginPath(); c.arc(x, y - s * 0.74, s * 0.07, 0, Math.PI * 2); c.fill();
    if (it.birdT > 0) {
      var out = Math.min(1, it.birdT * 2, (2.2 - it.birdT) * 3) * s * 0.1;
      var bx = x + out, by = y - s * 0.76 - Math.abs(Math.sin(globalT * 14)) * s * 0.02;
      artCircle(c, bx, by, s * 0.08, '#5fa8ff', { lineColor: '#2f5f9f', line: 1 });
      artEye(c, bx + s * 0.03, by - s * 0.02, s * 0.015, 0, 0);
      c.fillStyle = '#ffb84f';
      c.beginPath(); c.moveTo(bx + s * 0.07, by - s * 0.01); c.lineTo(bx + s * 0.13, by + s * 0.01); c.lineTo(bx + s * 0.07, by + s * 0.03); c.closePath(); c.fill();
    }
    return true;
  }
  if (it.id === 'beehive') {
    artLimb(c, x - s * 0.15, y, x - s * 0.15, y - s * 0.2, s * 0.04, '#a9743f');
    artLimb(c, x + s * 0.15, y, x + s * 0.15, y - s * 0.2, s * 0.04, '#a9743f');
    for (k = 0; k < 4; k++) artBlob(c, x, y - s * (0.28 + k * 0.13), s * (0.26 - k * 0.045), s * 0.08, '#f0c050', { lineColor: '#b8862a' });
    c.fillStyle = '#4a3020';
    c.beginPath(); c.arc(x, y - s * 0.28, s * 0.05, Math.PI, 0); c.fill();
    var n = it.buzzT > 0 ? 6 : 3, far = it.buzzT > 0 ? 0.7 : 0.35;
    for (i = 0; i < n; i++) {
      var ba = globalT * (2 + i * 0.4) + i * 2.1, bx2 = x + Math.cos(ba) * s * far, by2 = y - s * 0.5 + Math.sin(ba * 1.3) * s * far * 0.5;
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(bx2 - s * 0.015, by2 - s * 0.03, s * 0.025, 0, Math.PI * 2); c.arc(bx2 + s * 0.015, by2 - s * 0.03, s * 0.025, 0, Math.PI * 2); c.fill();
      artBlob(c, bx2, by2, s * 0.035, s * 0.025, '#ffd24f', { lineColor: '#3a3020', line: 1 });
    }
    return true;
  }
  if (it.id === 'birdbath') {
    artRoundRect(c, x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.48, s * 0.04, '#d8d4e4', { lineColor: '#8a8298' });
    artBlob(c, x, y - s * 0.03, s * 0.2, s * 0.05, '#c9c4d8', { lineColor: '#8a8298' });
    artBlob(c, x, y - s * 0.55, s * 0.38, s * 0.1, '#d8d4e4', { lineColor: '#8a8298' });
    var wv = it.splashT > 0 ? Math.sin(it.splashT * 20) * s * 0.02 : 0;
    artBlob(c, x, y - s * 0.6 + wv, s * 0.3, s * 0.05, '#7fd4ff', { lineColor: '#4f9ad9', line: 1 });
    return true;
  }
  if (it.id === 'swing') {
    var sa = yardSwingAngle(it), L = s * 0.9, px = x + Math.sin(sa) * L, py = y - s * 1.25 + Math.cos(sa) * L;
    artLimb(c, x - s * 0.5, y, x - s * 0.35, y - s * 1.3, s * 0.06, '#a9743f');
    artLimb(c, x + s * 0.5, y, x + s * 0.35, y - s * 1.3, s * 0.06, '#a9743f');
    artLimb(c, x - s * 0.42, y - s * 1.28, x + s * 0.42, y - s * 1.28, s * 0.07, '#8a5a30');
    c.strokeStyle = '#c9a36a';
    c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(x - s * 0.15, y - s * 1.25); c.lineTo(px - s * 0.15, py); c.moveTo(x + s * 0.15, y - s * 1.25); c.lineTo(px + s * 0.15, py); c.stroke();
    artRoundRect(c, px - s * 0.2, py - s * 0.02, s * 0.4, s * 0.06, s * 0.02, '#ff7bac', { lineColor: '#c94f7e' });
    return true;
  }
  return false;
}

// Kasvi origossa (juuri), aste 1..3
function drawYardPlant(c, it, st, s, droop) {
  var i, k, h;
  if (it.id === 'tulips') {
    var tc = ['#ff5f7e', '#ffd24f', '#c9a0ff'];
    for (i = -1; i <= 1; i++) {
      h = s * [0, 0.25, 0.45, 0.6][st] * (1 - Math.abs(i) * 0.12);
      var tx = i * s * 0.15, top = -h, hx = tx + i * s * 0.03 + droop * s * 0.06;
      yardStem(c, tx * 0.3, 0, hx, top, s * 0.03);
      yardLeaf(c, tx * 0.3, -h * 0.3, s * 0.16, -Math.PI / 2 + i * 0.6 - 0.5, '#6fc257');
      if (st >= 2) {
        var col = st === 3 ? tc[i + 1] : '#9ad67a', cw = s * (st === 3 ? 0.085 : 0.05);
        c.beginPath();
        c.moveTo(hx - cw, top - cw * 1.4); c.lineTo(hx - cw * 0.35, top - cw * 0.8); c.lineTo(hx, top - cw * 1.5); c.lineTo(hx + cw * 0.35, top - cw * 0.8); c.lineTo(hx + cw, top - cw * 1.4);
        c.quadraticCurveTo(hx + cw, top + cw * 0.3, hx, top + cw * 0.3); c.quadraticCurveTo(hx - cw, top + cw * 0.3, hx - cw, top - cw * 1.4);
        artFillPath(c, col, top - cw * 1.5, top + cw * 0.3, cw, { lineColor: artShade(col, -0.35), line: Math.max(1, s * 0.012) });
      }
    }
  } else if (it.id === 'sunflower') {
    h = s * [0, 0.5, 0.9, 1.2][st];
    var turn = yardSun.t > 0 ? Math.sin(yardSun.t * 6) * s * 0.05 : 0;
    yardStem(c, 0, 0, droop * s * 0.08, -h, s * 0.05);
    yardLeaf(c, 0, -h * 0.35, s * 0.24, -Math.PI * 0.15, '#6fc257');
    yardLeaf(c, 0, -h * 0.55, s * 0.22, -Math.PI * 0.85, '#6fc257');
    var fx = droop * s * 0.08 + turn, fy = -h;
    if (st === 2) artCircle(c, fx, fy, s * 0.08, '#7fbf5a', { lineColor: '#4f8a3a' });
    if (st === 3) {
      c.save();
      c.translate(fx, fy);
      c.rotate((it.spinT > 0 ? it.spinT * 4 : 0) + droop * 0.4);
      for (k = 0; k < 12; k++) {
        c.save(); c.rotate(k * Math.PI / 6);
        artBlob(c, 0, -s * 0.17, s * 0.045, s * 0.09, '#ffd24f', { lineColor: '#e0a020', line: 1 });
        c.restore();
      }
      c.restore();
      artCircle(c, fx, fy, s * 0.1, '#8a5a30', { lineColor: '#5e3b1c' });
      artEye(c, fx - s * 0.035, fy - s * 0.015, s * 0.018, 0, droop);
      artEye(c, fx + s * 0.035, fy - s * 0.015, s * 0.018, 0, droop);
      c.strokeStyle = '#3a2410';
      c.lineWidth = Math.max(1, s * 0.012);
      c.beginPath();
      if (droop) c.arc(fx, fy + s * 0.07, s * 0.035, 1.15 * Math.PI, 1.85 * Math.PI);
      else c.arc(fx, fy + s * 0.02, s * 0.04, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    }
  } else if (it.id === 'rosebush' || it.id === 'strawberries') {
    var rose = it.id === 'rosebush', bh = s * [0, 0.2, 0.34, 0.42][st] * (rose ? 1.2 : 0.8), bw = s * [0, 0.18, 0.3, 0.36][st];
    if (rose) {
      artBlob(c, -bw * 0.4, -bh * 0.5, bw * 0.6, bh * 0.55, '#4f9a3a', { lineColor: '#2f6a2a' });
      artBlob(c, bw * 0.4, -bh * 0.5, bw * 0.6, bh * 0.55, '#4f9a3a', { lineColor: '#2f6a2a' });
      artBlob(c, 0, -bh * 0.8, bw * 0.65, bh * 0.55, '#5aa83e', { lineColor: '#2f6a2a' });
    } else {
      for (k = -1; k <= 1; k++) {
        yardLeaf(c, 0, -s * 0.02, bw * 1.1, -Math.PI / 2 + k * 0.9, '#5aa83e');
      }
    }
    var spots = [[-0.45, -0.55], [0.4, -0.5], [0, -0.95], [-0.2, -0.3], [0.25, -0.85]];
    for (k = 0; k < (rose ? 5 : 3); k++) {
      var sx = spots[k][0] * bw * (rose ? 1 : 1.3), sy = spots[k][1] * bh * (rose ? 1 : 1.2);
      if (st === 2) {
        if (rose) artCircle(c, sx, sy, s * 0.035, '#9ad67a', { lineColor: '#4f8a3a', line: 1 });
        else drawFlower(c, sx, sy, s * 0.025, '#ffffff');
      } else if (st === 3) {
        if (rose) {
          artCircle(c, sx, sy + droop * s * 0.03, s * 0.065, '#ff7bac', { lineColor: '#c94f7e' });
          c.strokeStyle = '#c94f7e';
          c.lineWidth = Math.max(1, s * 0.012);
          c.beginPath(); c.arc(sx, sy + droop * s * 0.03, s * 0.03, 0, Math.PI * 1.5); c.stroke();
        } else {
          drawYardTreat(c, 'berry', sx, sy + s * 0.08 + droop * s * 0.03, s * 0.07);
        }
      }
    }
  } else if (it.id === 'veggies') {
    for (k = -1; k <= 1; k++) {
      var vx = k * s * 0.18;
      h = s * [0, 0.14, 0.22, 0.28][st];
      for (i = -1; i <= 1; i++) yardLeaf(c, vx, -s * 0.02, h, -Math.PI / 2 + i * 0.45 + droop * 0.3, '#5aa83e');
      if (st >= 2) {
        var cw2 = s * (st === 3 ? 0.06 : 0.035);
        c.fillStyle = '#ff8a3d';
        c.beginPath(); c.moveTo(vx - cw2, -s * 0.02); c.lineTo(vx + cw2, -s * 0.02); c.lineTo(vx, s * 0.03); c.closePath(); c.fill();
      }
    }
  } else if (it.id === 'pumpkin') {
    c.strokeStyle = '#4f9a3a';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.moveTo(-s * 0.35, -s * 0.03); c.quadraticCurveTo(0, -s * 0.18, s * 0.35, -s * 0.05); c.stroke();
    for (k = 0; k < st + 1; k++) yardLeaf(c, -s * 0.3 + k * s * 0.18, -s * 0.08, s * 0.16, -Math.PI / 2 - 0.4 + k * 0.3, '#5aa83e');
    if (st >= 2) {
      var pr = s * (st === 3 ? 0.24 : 0.11), pc = st === 3 ? '#ff9f3a' : '#9ad67a';
      artBlob(c, 0, -pr * 0.75, pr * 1.2, pr * 0.8, pc, { lineColor: artShade(pc, -0.35) });
      c.strokeStyle = artShade(pc, -0.25);
      c.lineWidth = Math.max(1, s * 0.012);
      c.beginPath(); c.moveTo(-pr * 0.45, -pr * 1.45); c.quadraticCurveTo(-pr * 0.7, -pr * 0.75, -pr * 0.45, -pr * 0.02); c.moveTo(pr * 0.45, -pr * 1.45); c.quadraticCurveTo(pr * 0.7, -pr * 0.75, pr * 0.45, -pr * 0.02); c.stroke();
      c.fillStyle = '#6a8a2a';
      c.fillRect(-s * 0.02, -pr * 1.55 - s * 0.05, s * 0.04, s * 0.07);
    }
  } else if (it.id === 'appletree') {
    h = s * [0, 0.45, 1.0, 1.1][st];
    var cr = s * [0, 0.16, 0.42, 0.48][st];
    artLimb(c, 0, 0, 0, -h, s * [0, 0.04, 0.09, 0.1][st], '#8a5a30');
    var cyy = -h - cr * 0.4;
    artBlob(c, -cr * 0.5, cyy + cr * 0.2, cr * 0.7, cr * 0.6, '#4f9a3a', { lineColor: '#2f6a2a' });
    artBlob(c, cr * 0.5, cyy + cr * 0.2, cr * 0.7, cr * 0.6, '#4f9a3a', { lineColor: '#2f6a2a' });
    artBlob(c, 0, cyy - cr * 0.2, cr * 0.8, cr * 0.65, '#5aa83e', { lineColor: '#2f6a2a', hi: true });
    var ap = [[-0.5, 0.2], [0.45, 0.1], [0, -0.35], [-0.2, -0.1], [0.25, 0.45]];
    var napples = st === 3 ? (it.apples === undefined ? 3 : it.apples) : (st === 2 ? 5 : 0);
    for (k = 0; k < napples; k++) {
      var ax = ap[k][0] * cr, ay = cyy + ap[k][1] * cr;
      if (st === 2) drawFlower(c, ax, ay, s * 0.022, '#ffd6ec');
      else artCircle(c, ax, ay + droop * s * 0.02, s * 0.055, '#ff4f5e', { lineColor: '#b82a3a', hi: true });
    }
  } else if (it.id === 'magicflower') {
    h = s * [0, 0.3, 0.55, 0.7][st];
    yardStem(c, 0, 0, droop * s * 0.06, -h, s * 0.035);
    yardLeaf(c, 0, -h * 0.4, s * 0.2, -Math.PI * 0.2, '#6fd6a0');
    yardLeaf(c, 0, -h * 0.6, s * 0.18, -Math.PI * 0.8, '#6fd6a0');
    var mx = droop * s * 0.06, my = -h;
    if (st === 2) artCircle(c, mx, my, s * 0.06, '#c9a0ff', { lineColor: '#8a5cb8' });
    if (st === 3) {
      var rc = ['#ff5f7e', '#ffb84f', '#ffe27a', '#6fd66f', '#5fa8ff', '#c9a0ff'];
      artGlow(c, mx, my, s * 0.35, '#fff2ff', droop ? 0.2 : 0.55 + Math.sin(globalT * 3) * 0.15);
      c.save();
      c.translate(mx, my);
      c.rotate(globalT * 0.5 + (it.spinT > 0 ? it.spinT * 5 : 0));
      for (k = 0; k < 6; k++) {
        c.save(); c.rotate(k * Math.PI / 3);
        artBlob(c, 0, -s * 0.12, s * 0.05, s * 0.09, rc[k], { lineColor: artShade(rc[k], -0.3), line: 1 });
        c.restore();
      }
      c.restore();
      drawStar(c, mx, my, s * 0.06, globalT, 0.5);
    }
  }
}
