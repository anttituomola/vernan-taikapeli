'use strict';

// Uniaika: kiireetön hoivakenttä ilman sydämiä ja ilman liikkumista.
// Kolme pupua väsyttää. Napauta pupua — se kävelee petiinsä. Napauta petiä,
// kun pupu on siinä — peitto ja tuutulaulu. Kun kaikki nukkuvat, kenttä juhlii.
// Tehtävät avautuvat hoitamisen edetessä (käsin, kuten Kaivoksessa).
// Yölamppu, tyynykasa ja tähtimobile ovat tökättäviä koristeita (props.js);
// nukkuvaa pupua voi tökätä hellästi: se mutisee, ja joka kolmannella
// kerralla se näkee porkkanaunta (yllätys). Kaikki tämä on vain koristetta.

var NAP_BUNNIES = 3;
var napBunnies = [];
var napBeds = [];
var napSleeping = 0;
var NAP_BED_COLORS = ['#ff9ec6', '#7fd4ff', '#ffd24f'];
var NAP_WOOD = '#8a6a9e';
var NAP_WOOD_LINE = '#4a3860';

function napBedX(i) { return viewW * (0.2 + i * 0.3); }

function initNaptime() {
  var i;
  tasks = [makeTask(-5, 'give'), makeTask(-5, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  napBunnies = [];
  for (i = 0; i < NAP_BUNNIES; i++) {
    napBunnies.push({
      bed: i, x: viewW * (0.3 + i * 0.2), y: viewH * 0.62,
      state: 'awake', earT: i * 1.1, hop: 0, yawnT: i * 1.7, facing: 1, walkPhase: 0,
      pokes: 0, murmurT: -1, dreamT: -1
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
  napSetupProps();
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
  napSetupProps();
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
  // Nukkuvan pupun hellä tökkäys: mutinaa, joka kolmannella porkkanauni (vain koriste)
  for (i = 0; i < NAP_BUNNIES; i++) {
    b = napBunnies[i];
    if (b.state !== 'sleep') continue;
    bed = napBeds[i];
    dx = px - (bed.x - viewH * 0.055);
    dy = py - (bed.y - viewH * 0.07);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      napPokeSleeper(b, i);
      return;
    }
  }
  // Koristeet (lamppu, tyynyt, mobile) vain, kun napautus ei osunut peliin
  propsTap(px + camX, py);
}

function napPokeSleeper(b, i) {
  var bed = napBeds[i], hx = bed.x - viewH * 0.055, hy = bed.y - viewH * 0.07;
  b.pokes++;
  b.murmurT = 0;
  spawnSparkles(hx, hy, 4, '#c9a0ff');
  playNote(220 + i * 30, 0, 0.35, 'sine', 0.12);
  playNote(165 + i * 30, 0.2, 0.4, 'sine', 0.1);
  if (b.pokes % 3 === 0) {
    b.dreamT = 0;
    playNote(784, 0.1, 0.25, 'triangle', 0.18);
    playNote(988, 0.25, 0.3, 'triangle', 0.18);
    playNote(1175, 0.4, 0.45, 'triangle', 0.18);
  }
}

function updateNaptime(dt) {
  var i, b;
  updateTasks(dt);
  for (i = 0; i < NAP_BUNNIES; i++) {
    b = napBunnies[i];
    b.earT += dt * (b.state === 'sleep' ? 0.8 : 3);
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 3);
    if (b.murmurT >= 0) { b.murmurT += dt; if (b.murmurT > 1.2) b.murmurT = -1; }
    if (b.dreamT >= 0) { b.dreamT += dt; if (b.dreamT > 3) b.dreamT = -1; }
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
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Koristeet (tökättävät) ----------
function napSetupProps() {
  var vw = viewW, h = viewH;
  propsReset();
  propAdd({ x: vw * 0.93, y: h * 0.86, r: h * 0.07, hy: h * 0.1, color: '#ffe9a0', amp: 0.05, note: 660, flick: -1,
    draw: napDrawLamp, poke: napPokeLamp, update: napUpdateLamp });
  propAdd({ x: vw * 0.07, y: h * 0.95, r: h * 0.06, hy: h * 0.03, color: '#ff9ec6', amp: 0.08, note: 520, draw: napDrawCushion, poke: napPokeCushion });
  propAdd({ x: vw * 0.82, y: 0, r: h * 0.08, hy: -h * 0.12, color: '#ffe678', amp: 0.14, note: 1568, draw: napDrawMobile, poke: napPokeMobile });
}

// Yöpöytä ja lamppu: lamppu lepattaa tökkäyksestä
function napDrawLamp(c, p) {
  var s = viewH * 0.05, fl = 1;
  if (p.flick >= 0) fl = 0.55 + Math.abs(Math.sin(p.flick * 40)) * 0.6;
  artShadow(c, 0, s * 0.1, s * 1.2, s * 0.25, 0.2);
  artRoundRect(c, -s * 0.9, -s * 1.6, s * 1.8, s * 1.6, s * 0.15, '#a97c5a', { lineColor: '#5a3a28' });
  artRoundRect(c, -s * 0.55, -s * 1.1, s * 1.1, s * 0.5, s * 0.1, '#c99a74', { lineColor: '#5a3a28' });
  artCircle(c, 0, -s * 0.85, s * 0.08, '#ffe9a0', { lineColor: '#8a6a3a' });
  artGlow(c, 0, -s * 2.7, s * 2.2 * fl, '#ffe9a0', 0.4 * fl);
  artLimb(c, 0, -s * 1.6, 0, -s * 2.4, s * 0.14, NAP_WOOD, NAP_WOOD_LINE);
  c.beginPath(); c.moveTo(-s * 0.8, -s * 2.4); c.lineTo(s * 0.8, -s * 2.4); c.lineTo(s * 0.55, -s * 3.2); c.lineTo(-s * 0.55, -s * 3.2); c.closePath();
  artFillPath(c, '#ffd98a', -s * 3.2, -s * 2.4, s * 0.8, { lineColor: '#b8862e', alpha: 0.75 + 0.25 * fl });
  artHighlight(c, -s * 0.35, -s * 2.95, s * 0.18, s * 0.25, 0.3);
}
function napPokeLamp(p) {
  p.flick = 0;
  playNote(110, 0, 0.15, 'sawtooth', 0.04);
}
function napUpdateLamp(p, dt) {
  if (p.flick >= 0) { p.flick += dt; if (p.flick > 0.8) p.flick = -1; }
}

// Tyynykasa lattialla: pöllähtää höyheniä
function napDrawCushion(c, p) {
  var s = viewH * 0.05;
  artShadow(c, 0, s * 0.15, s * 1.3, s * 0.25, 0.2);
  artBlob(c, 0, -s * 0.45, s * 1.2, s * 0.5, '#ff9ec6', { lineColor: '#b85a8a', hi: 0.35 });
  artBlob(c, s * 0.15, -s * 1.05, s * 0.9, s * 0.4, '#c9a0ff', { lineColor: '#7a5aa8', hi: 0.35 });
  artCircle(c, s * 0.15, -s * 1.05, s * 0.08, '#fff6f8', { lineColor: '#c9b3cf' });
}
function napPokeCushion(p) {
  var h = viewH, i;
  for (i = 0; i < 3; i++) {
    propDrop({ x: p.x + (i - 1) * h * 0.02, y: p.y - h * 0.07, vx: (i - 1) * viewW * 0.03, vy: -h * 0.18 - i * h * 0.02, ground: p.y + h * 0.01, life: 2.6, vr: (i - 1) * 3,
      draw: napDrawFeather });
  }
}
function napDrawFeather(c, d) {
  var s = viewH * 0.012;
  artBlob(c, 0, 0, s * 0.5, s * 1.1, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  c.strokeStyle = '#c9b3cf';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -s * 1.1); c.lineTo(0, s * 1.1); c.stroke();
}

// Tähtimobile katossa: keinuu ja helisee
function napDrawMobile(c, p) {
  var s = viewH * 0.05, i, sx, sy;
  var arms = [[-1.1, 2.4], [0, 2.9], [1.1, 2.2]];
  artLimb(c, 0, 0, 0, s * 1.0, s * 0.08, '#c9b3cf', NAP_WOOD);
  artLimb(c, -s * 1.2, s * 1.0, s * 1.2, s * 1.0, s * 0.14, NAP_WOOD, NAP_WOOD_LINE);
  for (i = 0; i < 3; i++) {
    sx = arms[i][0] * s;
    sy = arms[i][1] * s + Math.sin(globalT * 1.5 + i) * s * 0.08;
    artLimb(c, sx, s * 1.0, sx, sy - s * 0.3, s * 0.05, '#c9b3cf', false);
    drawStar(c, sx, sy, s * 0.32, globalT * 0.3 + i, 0.5);
  }
}
function napPokeMobile(p) {
  playNote(1976, 0.08, 0.3, 'sine', 0.15);
  playNote(2349, 0.18, 0.4, 'sine', 0.12);
}

// ---------- Piirto ----------
function naptimeLayers() {
  return [
    { speed: 0.22, render: renderNaptimeFar },
    { speed: 0.55, render: renderNaptimeMid },
    { speed: 1, render: renderNaptimeNear }
  ];
}
function renderNaptimeBg(b, w, h) {
  renderNaptimeFar(b, w, h);
  renderNaptimeMid(b, w, h);
  renderNaptimeNear(b, w, h);
}
function renderNaptimeFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#1a1448');
  wall.addColorStop(0.55, '#3a3468');
  wall.addColorStop(1, '#5a4a8a');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, h * 0.2, h * 0.06, 0.22, '#c8d4ff', '#fffdf0', '#ffe08a');
}
function renderNaptimeMid(b, w, h) {
  var i, x;
  b.fillStyle = 'rgba(255,246,200,0.5)';
  for (i = 0; i < 24; i++) {
    x = (i * 137.3) % w;
    b.beginPath(); b.arc(x, (i * 71.7) % (h * 0.5), 1.5 + (i % 3), 0, Math.PI * 2); b.fill();
  }
}
// Lähin kerros: ikkuna ruudun keskellä (kenttä on yhden ruudun levyinen), lattia ja matto
function renderNaptimeNear(b, w, h) {
  var wx = viewW * 0.5, wy = h * 0.26, ww = h * 0.22, wh = h * 0.26;
  artRoundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02, NAP_WOOD, { lineColor: NAP_WOOD_LINE });
  b.fillStyle = '#141a3e';
  b.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  // Kuu ja tähdet ikkunassa
  drawStar(b, wx - ww * 0.3, wy - wh * 0.3, h * 0.007, 0.3, 0.4);
  drawStar(b, wx - ww * 0.15, wy + wh * 0.22, h * 0.005, 1.1, 0.3);
  artGlow(b, wx + ww * 0.2, wy - wh * 0.12, wh * 0.45, '#ffe9a0', 0.4);
  b.fillStyle = '#ffe9a0';
  b.beginPath(); b.arc(wx + ww * 0.2, wy - wh * 0.12, wh * 0.18, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#141a3e';
  b.beginPath(); b.arc(wx + ww * 0.28, wy - wh * 0.17, wh * 0.15, 0, Math.PI * 2); b.fill();
  artLimb(b, wx, wy - wh / 2, wx, wy + wh / 2, h * 0.012, NAP_WOOD, NAP_WOOD_LINE);
  artLimb(b, wx - ww / 2, wy, wx + ww / 2, wy, h * 0.012, NAP_WOOD, NAP_WOOD_LINE);
  artRoundRect(b, wx - ww / 2 - h * 0.03, wy + wh / 2 + h * 0.012, ww + h * 0.06, h * 0.014, h * 0.004, NAP_WOOD, { lineColor: NAP_WOOD_LINE });
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.6, 0, h);
  floor.addColorStop(0, '#c9a8d8');
  floor.addColorStop(1, '#9a7ab8');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.6, w, h * 0.4);
  // Pehmeä matto petien alla
  artBlob(b, viewW * 0.5, h * 0.84, viewW * 0.46, h * 0.055, '#b48ad0', { line: false, alpha: 0.4 });
}

function napDrawBed(c, bed, i) {
  var s = viewH * 0.05, col = NAP_BED_COLORS[i];
  // Peti: runko, päätylauta, tyyny ja peitto (kun pupu nukkuu)
  artShadow(c, bed.x, bed.y + s * 0.5, s * 2.4, s * 0.35, 0.18);
  artRoundRect(c, bed.x - s * 2.2, bed.y - s * 0.5, s * 4.4, s * 0.9, s * 0.25, '#8a5a6e', { lineColor: '#4a2e3a' });
  artHighlight(c, bed.x - s * 1.0, bed.y - s * 0.3, s * 0.9, s * 0.08, 0.16);
  artRoundRect(c, bed.x - s * 2.4, bed.y - s * 1.5, s * 0.5, s * 1.5, s * 0.2, '#a86a80', { lineColor: '#4a2e3a' });
  artRoundRect(c, bed.x - s * 1.9, bed.y - s * 0.75, s * 1.1, s * 0.5, s * 0.2, '#fff6f8', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  if (bed.covered) {
    artRoundRect(c, bed.x - s * 0.9, bed.y - s * 0.95, s * 3.0, s * 1.2, s * 0.3, col, { lineColor: artShade(col, -0.45) });
    c.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(c, bed.x - s * 0.82, bed.y - s * 0.87, s * 2.84, s * 0.3, s * 0.22);
    c.fill();
  }
}

// Pieni pyöreä kupla tekstillä (väsymys-z, mutina)
function napDrawBubble(c, x, y, r, text) {
  artCircle(c, x, y, r, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  c.fillStyle = NAP_WOOD;
  c.font = 'bold ' + Math.round(r * 1.4) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x, y + r * 0.1);
  c.textBaseline = 'alphabetic';
}
// Porkkana (uneen)
function napDrawCarrot(c, x, y, s) {
  var i;
  c.beginPath();
  c.moveTo(x - s * 0.45, y - s * 0.3);
  c.quadraticCurveTo(x - s * 0.3, y + s * 0.6, x, y + s);
  c.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s * 0.45, y - s * 0.3);
  c.closePath();
  artFillPath(c, '#ff8f3a', y - s * 0.3, y + s, s * 0.45, { lineColor: '#b85a14' });
  for (i = -1; i <= 1; i++) artBlob(c, x + i * s * 0.22, y - s * 0.55, s * 0.12, s * 0.32, '#5fd36b', { rot: i * 0.5, lineColor: '#2f7a3a' });
}
// Ajatuskupla, jossa porkkana: r kasvaa pomppaamalla esiin
function napDrawDream(c, x, y, r) {
  if (r < 1) return;
  var lo = { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' };
  artCircle(c, x + r * 0.9, y + r * 1.25, r * 0.16, '#ffffff', lo);
  artCircle(c, x + r * 0.65, y + r * 0.9, r * 0.26, '#ffffff', lo);
  artUnion(c, function (cc, px, py, ss) {
    cc.beginPath();
    cc.arc(px, py, ss, 0, Math.PI * 2);
    cc.arc(px - ss * 0.8, py + ss * 0.2, ss * 0.7, 0, Math.PI * 2);
    cc.arc(px + ss * 0.8, py + ss * 0.2, ss * 0.7, 0, Math.PI * 2);
  }, x, y, r, y - r, y + r, '#ffffff', lo);
  napDrawCarrot(c, x, y + r * 0.05, r * 0.55);
}

function napDrawBunny(c, b, i) {
  var bed = napBeds[i], k, hx, hy;
  if (b.state === 'sleep') {
    // Päännyppy peiton alta + Zzz
    var bob = Math.sin(globalT * 1.6 + i) * viewH * 0.004;
    hx = bed.x - viewH * 0.055;
    hy = bed.y - viewH * 0.055;
    drawBunny(c, hx, hy + bob, viewH * 0.032, 0, b.earT, true);
    c.font = 'bold ' + Math.round(viewH * 0.035) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(60,40,100,0.6)';
    c.lineWidth = Math.max(2, viewH * 0.005);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    var zx = bed.x + viewH * 0.06 + Math.sin(globalT * 0.9 + i) * viewH * 0.01;
    var zy1 = bed.y - viewH * 0.16 - (globalT * 8 + i * 13) % 20;
    var zy2 = bed.y - viewH * 0.12 - (globalT * 8 + i * 13) % 20 * 0.6;
    c.strokeText('Z', zx, zy1);
    c.fillText('Z', zx, zy1);
    c.strokeText('z', zx + viewH * 0.03, zy2);
    c.fillText('z', zx + viewH * 0.03, zy2);
    if (b.murmurT >= 0) {
      k = b.murmurT / 1.2;
      c.globalAlpha = 1 - k;
      napDrawBubble(c, hx + viewH * 0.045, hy - viewH * 0.05 - k * viewH * 0.03, viewH * 0.016, 'mm');
      c.globalAlpha = 1;
    }
    if (b.dreamT >= 0) {
      k = b.dreamT < 0.4 ? easeOutBack(b.dreamT / 0.4) : (b.dreamT > 2.5 ? Math.max(0, 1 - (b.dreamT - 2.5) / 0.5) : 1);
      napDrawDream(c, hx - viewH * 0.03, hy - viewH * 0.11, viewH * 0.042 * k);
    }
    return;
  }
  var hop = b.hop * viewH * 0.02 + (b.state === 'walk' ? Math.abs(Math.sin(b.walkPhase)) * viewH * 0.012 : 0);
  var y = b.state === 'inbed' ? bed.y - viewH * 0.055 : b.y;
  drawBunny(c, b.x, y - hop, viewH * 0.042, 0, b.earT, false);
  // Väsymyskupla valveilla olevalle
  if (b.state === 'awake') napDrawBubble(c, b.x + viewH * 0.05, y - viewH * 0.13, viewH * 0.02, 'z');
}

function drawNaptime() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < NAP_BUNNIES; i++) napDrawBed(ctx, napBeds[i], i);
  for (i = 0; i < NAP_BUNNIES; i++) napDrawBunny(ctx, napBunnies[i], i);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, NAP_BUNNIES, function (i2) { return napBunnies[i2] && napBunnies[i2].state === 'sleep'; },
    function (c, x, y, s) { drawBunny(c, x, y + s * 0.3, s * 0.9, 0, 0, true); });
  drawTaskOverlay(ctx);
}
