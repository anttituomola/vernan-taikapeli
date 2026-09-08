'use strict';

// Uniaika: kiireetön hoivakenttä ilman sydämiä ja ilman liikkumista.
// Kolme pupua väsyttää. Napauta pupua — se kävelee petiinsä. Napauta petiä,
// kun pupu on siinä — peitto ja tuutulaulu. Kun kaikki nukkuvat, kenttä juhlii.
// Tehtävät avautuvat hoitamisen edetessä (käsin, kuten Kaivoksessa).

var NAP_BUNNIES = 3;
var napBunnies = [];
var napBeds = [];
var napSleeping = 0;
var NAP_BED_COLORS = ['#ff9ec6', '#7fd4ff', '#ffd24f'];

function napBedX(i) { return viewW * (0.2 + i * 0.3); }

function initNaptime() {
  var i;
  tasks = [makeTask(-5, 'give'), makeTask(-5, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  napBunnies = [];
  for (i = 0; i < NAP_BUNNIES; i++) {
    napBunnies.push({
      bed: i, x: viewW * (0.3 + i * 0.2), y: viewH * 0.62,
      state: 'awake', earT: i * 1.1, hop: 0, yawnT: i * 1.7, facing: 1, walkPhase: 0
    });
  }
  napBeds = [];
  for (i = 0; i < NAP_BUNNIES; i++) {
    napBeds.push({ x: napBedX(i), y: viewH * 0.8, covered: false });
  }
  napSleeping = 0;
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.9;
  princess.facing = 1;
  princess.walkPhase = 0;
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(523, 0.18, 0.4, 'sine', 0.25);
}

function respawnNaptime() {}
function resizeNaptime() {
  var i;
  for (i = 0; i < NAP_BUNNIES; i++) {
    napBeds[i].x = napBedX(i);
    if (napBunnies[i].state === 'awake') napBunnies[i].x = viewW * (0.3 + i * 0.2);
    else napBunnies[i].x = napBeds[i].x;
  }
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.9;
}

// Tuutulaulu: laskeva kolmen nuotin sävelma
function napLullaby(i) {
  playNote(523, 0, 0.4, 'sine', 0.3);
  playNote(440, 0.35, 0.4, 'sine', 0.3);
  playNote(392, 0.7, 0.7, 'sine', 0.3);
}

function handleNaptimeTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, b, bed, dx, dy;
  // Pedin napautus: peitto ja laulu, kun pupu on petissä
  for (i = 0; i < NAP_BUNNIES; i++) {
    bed = napBeds[i];
    if (bed.covered) continue;
    if (Math.abs(px - bed.x) < viewH * 0.13 && Math.abs(py - bed.y) < viewH * 0.09) {
      b = napBunnies[i];
      if (b.state === 'inbed') {
        b.state = 'sleep';
        bed.covered = true;
        napSleeping++;
        spawnSparkles(bed.x, bed.y - viewH * 0.1, 14, '#c9a0ff');
        napLullaby(i);
        if (!activeTask && !celebrating) {
          if (napSleeping === 1 && !tasks[0].opened) taskStart(tasks[0]);
          else if (napSleeping === 2 && !tasks[1].opened) taskStart(tasks[1]);
        }
        if (napSleeping === NAP_BUNNIES) startCelebration();
      } else {
        playNote(330, 0, 0.1, 'sine', 0.2);
      }
      return;
    }
  }
  // Pupun napautus: väsynyt pupu kävelee petiinsä
  for (i = 0; i < NAP_BUNNIES; i++) {
    b = napBunnies[i];
    if (b.state !== 'awake') continue;
    dx = px - b.x;
    dy = py - (b.y - viewH * 0.05);
    if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) {
      b.state = 'walk';
      b.facing = napBeds[i].x > b.x ? 1 : -1;
      playNote(660, 0, 0.12, 'sine', 0.25);
      playNote(550, 0.1, 0.15, 'sine', 0.2);
      return;
    }
  }
}

function updateNaptime(dt) {
  var i, b;
  updateTasks(dt);
  for (i = 0; i < NAP_BUNNIES; i++) {
    b = napBunnies[i];
    b.earT += dt * (b.state === 'sleep' ? 0.8 : 3);
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 3);
    if (b.state === 'awake') {
      // Haukottelu: pieni pomppu aika ajoin
      b.yawnT -= dt;
      if (b.yawnT <= 0) {
        b.yawnT = 2.5 + Math.random() * 2.5;
        b.hop = 0.6;
        playNote(300 + i * 40, 0, 0.25, 'sine', 0.12);
      }
    } else if (b.state === 'walk') {
      var bed = napBeds[i];
      var dx = bed.x - b.x;
      if (Math.abs(dx) < 4) {
        b.x = bed.x;
        b.state = 'inbed';
        b.hop = 0.8;
        playNote(520, 0, 0.15, 'triangle', 0.25);
      } else {
        b.x += (dx > 0 ? 1 : -1) * viewW * 0.12 * dt;
        b.walkPhase += dt * 8;
      }
    }
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderNaptimeBg(b, w, h) {
  var i, x;
  var wall = b.createLinearGradient(0, 0, 0, h * 0.6);
  wall.addColorStop(0, '#3a3468');
  wall.addColorStop(1, '#5a4a8a');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h * 0.6);
  // Tähtitarra-seinä
  b.fillStyle = 'rgba(255,246,200,0.5)';
  for (i = 0; i < 24; i++) {
    x = (i * 137.3) % w;
    b.beginPath(); b.arc(x, (i * 71.7) % (h * 0.5), 1.5 + (i % 3), 0, Math.PI * 2); b.fill();
  }
  // Ikkuna ja kuu
  var wx = w * 0.5, wy = h * 0.26, ww = h * 0.22, wh = h * 0.26;
  b.fillStyle = '#8a6a9e';
  roundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02);
  b.fill();
  b.fillStyle = '#141a3e';
  b.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  b.fillStyle = '#ffe9a0';
  b.beginPath(); b.arc(wx + ww * 0.2, wy - wh * 0.12, wh * 0.18, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#141a3e';
  b.beginPath(); b.arc(wx + ww * 0.28, wy - wh * 0.17, wh * 0.15, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#8a6a9e';
  b.fillRect(wx - h * 0.006, wy - wh / 2, h * 0.012, wh);
  b.fillRect(wx - ww / 2, wy - h * 0.006, ww, h * 0.012);
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.6, 0, h);
  floor.addColorStop(0, '#c9a8d8');
  floor.addColorStop(1, '#9a7ab8');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.6, w, h * 0.4);
}

function napDrawBed(c, bed, i) {
  var s = viewH * 0.05;
  // Peti: runko, tyyny ja peitto (kun pupu nukkuu)
  c.fillStyle = '#8a5a6e';
  roundRect(c, bed.x - s * 2.2, bed.y - s * 0.5, s * 4.4, s * 0.9, s * 0.25);
  c.fill();
  c.fillStyle = '#a86a80';
  roundRect(c, bed.x - s * 2.4, bed.y - s * 1.5, s * 0.5, s * 1.5, s * 0.2);
  c.fill();
  c.fillStyle = '#fff6f8';
  roundRect(c, bed.x - s * 1.9, bed.y - s * 0.75, s * 1.1, s * 0.5, s * 0.2);
  c.fill();
  if (bed.covered) {
    c.fillStyle = NAP_BED_COLORS[i];
    roundRect(c, bed.x - s * 0.9, bed.y - s * 0.95, s * 3.0, s * 1.2, s * 0.3);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(c, bed.x - s * 0.9, bed.y - s * 0.95, s * 3.0, s * 0.35, s * 0.3);
    c.fill();
  }
}

function napDrawBunny(c, b, i) {
  var bed = napBeds[i];
  if (b.state === 'sleep') {
    // Päännyppy peiton alta + Zzz
    var bob = Math.sin(globalT * 1.6 + i) * viewH * 0.004;
    drawBunny(c, bed.x - viewH * 0.055, bed.y - viewH * 0.055 + bob, viewH * 0.032, 0, b.earT, true);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.font = 'bold ' + Math.round(viewH * 0.035) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    c.textAlign = 'center';
    var zx = bed.x + viewH * 0.06 + Math.sin(globalT * 0.9 + i) * viewH * 0.01;
    c.fillText('Z', zx, bed.y - viewH * 0.16 - (globalT * 8 + i * 13) % 20);
    c.fillText('z', zx + viewH * 0.03, bed.y - viewH * 0.12 - (globalT * 8 + i * 13) % 20 * 0.6);
    return;
  }
  var hop = b.hop * viewH * 0.02 + (b.state === 'walk' ? Math.abs(Math.sin(b.walkPhase)) * viewH * 0.012 : 0);
  var y = b.state === 'inbed' ? bed.y - viewH * 0.055 : b.y;
  drawBunny(c, b.x, y - hop, viewH * 0.042, 0, b.earT, false);
  // Väsymyskupla valveilla olevalle
  if (b.state === 'awake') {
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.arc(b.x + viewH * 0.05, y - viewH * 0.13, viewH * 0.02, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a6a9e';
    c.font = 'bold ' + Math.round(viewH * 0.028) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('z', b.x + viewH * 0.05, y - viewH * 0.128);
    c.textBaseline = 'alphabetic';
  }
}

function drawNaptime() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < NAP_BUNNIES; i++) napDrawBed(ctx, napBeds[i], i);
  for (i = 0; i < NAP_BUNNIES; i++) napDrawBunny(ctx, napBunnies[i], i);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, NAP_BUNNIES, function (i2) { return napBunnies[i2] && napBunnies[i2].state === 'sleep'; },
    function (c, x, y, s) { drawBunny(c, x, y + s * 0.3, s * 0.9, 0, 0, true); });
  drawTaskOverlay(ctx);
}
