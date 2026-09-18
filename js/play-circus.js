'use strict';

// Sirkusteltta / Trapetsi: uusi verbi, trapetsi. Prinsessa roikkuu heilahtelevassa
// trapetsissa; napautus irrottaa, ja hän lentää kaaressa seuraavaan tankoon.
// Ohi lentävä putoaa turvaverkkoon (sydän) ja palaa viimeiselle korokkeelle.
// Korokkeelta napautus loikkaa kohti ensimmäistä tankoa. Haalea pistekaari
// näyttää, mihin irrotus juuri nyt veisi — ajoitus tankoon nähden on pelaajan.
// Tähdet kerätään lennossa. Sydämet ja korokkeet (lyhdyt) käytössä.
// Mitat u-yksiköissä (u ≈ ruudun korkeus), jotta heilahdus ja lento skaalautuvat.
// Kaksi kenttää käyttää samaa moottoria: 'easy' Sirkusteltta, 'hard' Trapetsi.
//
// Simuloitu tarttumisikkuna (tools: VT.circus + circBarPos): eteenpäin
// heilahtaessa irrotus onnistuu n. 0,8 s:n ajan jaksosta; hidas heilahdus ja
// vetävä tanko (CIRC_MAG) tekevät ajoituksesta 6-vuotiaalle opittavan.
var CIRC_A = 0.8;        // heilahduksen laajuus (rad)
var CIRC_W = 1.4;        // kulmanopeus (rad/s), jakso ~4.5 s
var CIRC_L = 0.36;       // köyden pituus (u)
var CIRC_K = 2.6;        // irrotuksen nopeuskerroin
var CIRC_G = 0.7;        // lennon painovoima (u/s²)
var CIRC_GRAB = 0.12;    // tarttumissäde (u)
var CIRC_MAG = 0.32;     // tangon vetosäde lennossa (u)
var CIRC_MAG_S = 10;     // vedon voima (1/s²)
var CIRC_JUMP = [0.75, -0.45]; // loikka korokkeelta (u/s)
// Vaikeampi rata: nopea heilahdus, vähän vetoa, pitkät ketjut — irrotus pitää ajoittaa
var CIRC_HARD = { A: 0.88, W: 1.85, G: 0.83, GRAB: 0.09, MAG: 0.17, MAG_S: 6.2 };

var circ = {
  mode: 'easy', A: CIRC_A, W: CIRC_W, L: CIRC_L, K: CIRC_K, G: CIRC_G,
  GRAB: CIRC_GRAB, MAG: CIRC_MAG, MAG_S: CIRC_MAG_S, JUMP: CIRC_JUMP,
  defs: null, starDefs: null,
  u: 0, nodes: [], stars: [], state: 'stand', node: 0, t: 0,
  x: 0, y: 0, vx: 0, vy: 0, flyT: 0, fromBar: -1, lastPed: 0,
  netT: 0, spotX: 0, taskDelay: 0, doorDelay: 0, prevFeet: 0
};

// Rata vasemmalta oikealle (x u-yksiköissä): korokkeet ja trapetsit
var CIRC_EASY_DEFS = [
  { kind: 'ped', x: 0.5 },
  { kind: 'bar', x: 1.35, ph: 0 },
  { kind: 'bar', x: 2.2, ph: Math.PI },
  { kind: 'ped', x: 3.05, task: 0 },
  { kind: 'bar', x: 3.9, ph: 0 },
  { kind: 'bar', x: 4.75, ph: Math.PI },
  { kind: 'bar', x: 5.6, ph: 0 },
  { kind: 'ped', x: 6.45, task: 1 },
  { kind: 'bar', x: 7.3, ph: Math.PI },
  { kind: 'bar', x: 8.15, ph: 0 },
  { kind: 'ped', x: 9.0, door: true }
];
// Tähdet lentoratojen varrella: x u-yksiköissä, dy = korkeus tangon alapisteestä (osuus ruudusta)
// (mitattu: onnistuneet lennot kulkevat puolivälissä n. 0,085 ruutua tangon alapisteen yllä)
var CIRC_EASY_STARS = [
  { x: 0.93, dy: 0.035 }, { x: 1.78, dy: 0.0 }, { x: 2.63, dy: 0.0 },
  { x: 3.47, dy: 0.035 }, { x: 4.32, dy: 0.0 }, { x: 5.17, dy: 0.0 },
  { x: 6.03, dy: 0.0 }, { x: 7.72, dy: 0.0 }
];
// Vaikeampi rata: 4 + 5 + 5 tankoa, harvempi väli (1.00 u)
var CIRC_HARD_DEFS = [
  { kind: 'ped', x: 0.50 },
  { kind: 'bar', x: 1.50, ph: 0 },
  { kind: 'bar', x: 2.50, ph: Math.PI },
  { kind: 'bar', x: 3.50, ph: 0 },
  { kind: 'bar', x: 4.50, ph: Math.PI },
  { kind: 'ped', x: 5.50, task: 0 },
  { kind: 'bar', x: 6.50, ph: 0 },
  { kind: 'bar', x: 7.50, ph: Math.PI },
  { kind: 'bar', x: 8.50, ph: 0 },
  { kind: 'bar', x: 9.50, ph: Math.PI },
  { kind: 'bar', x: 10.50, ph: 0 },
  { kind: 'ped', x: 11.50, task: 1 },
  { kind: 'bar', x: 12.50, ph: Math.PI },
  { kind: 'bar', x: 13.50, ph: 0 },
  { kind: 'bar', x: 14.50, ph: Math.PI },
  { kind: 'bar', x: 15.50, ph: 0 },
  { kind: 'bar', x: 16.50, ph: Math.PI },
  { kind: 'ped', x: 17.50, door: true }
];
var CIRC_HARD_STARS = [
  { x: 1.00, dy: 0.035 }, { x: 2.00, dy: 0.0 }, { x: 3.00, dy: 0.0 }, { x: 4.00, dy: 0.0 },
  { x: 6.00, dy: 0.035 }, { x: 7.50, dy: 0.0 }, { x: 8.50, dy: 0.0 }, { x: 9.50, dy: 0.0 },
  { x: 12.00, dy: 0.035 }, { x: 13.50, dy: 0.0 }, { x: 14.50, dy: 0.0 }, { x: 15.50, dy: 0.0 }
];

function circHard() { return circ.mode === 'hard'; }

function circLoadCourse(mode) {
  circ.mode = mode === 'hard' ? 'hard' : 'easy';
  circ.A = circHard() ? CIRC_HARD.A : CIRC_A;
  circ.W = circHard() ? CIRC_HARD.W : CIRC_W;
  circ.L = CIRC_L;
  circ.K = CIRC_K;
  circ.G = circHard() ? CIRC_HARD.G : CIRC_G;
  circ.GRAB = circHard() ? CIRC_HARD.GRAB : CIRC_GRAB;
  circ.MAG = circHard() ? CIRC_HARD.MAG : CIRC_MAG;
  circ.MAG_S = circHard() ? CIRC_HARD.MAG_S : CIRC_MAG_S;
  circ.JUMP = CIRC_JUMP;
  circ.defs = circHard() ? CIRC_HARD_DEFS : CIRC_EASY_DEFS;
  circ.starDefs = circHard() ? CIRC_HARD_STARS : CIRC_EASY_STARS;
}
circLoadCourse('easy');

function circPivotY() { return viewH * 0.10; }
function circBarY0() { return circPivotY() + circ.L * circ.u; }     // tangon alin piste
function circPedTop() { return circBarY0() + viewH * 0.12; }         // käsien korkeus = tangon korkeus
function circNetY() { return viewH * 0.80; }
function circHandsToFeet() { return viewH * 0.12; }

function layoutCircus() {
  var i, d;
  circ.u = Math.min(viewH, (worldW - viewW * 0.35) / (circ.defs[circ.defs.length - 1].x + 0.4));
  circ.nodes = [];
  for (i = 0; i < circ.defs.length; i++) {
    d = circ.defs[i];
    circ.nodes.push({ kind: d.kind, x: d.x * circ.u, ph: d.ph || 0, task: d.task, door: !!d.door, w: 0.5 * circ.u });
  }
  checkpoints = [];
  for (i = 0; i < circ.nodes.length; i++) {
    if (circ.nodes[i].kind === 'ped') checkpoints.push({ fx: circ.nodes[i].x / worldW, x: circ.nodes[i].x, lit: false, node: i });
  }
}

function circBarPos(n, t) {
  var th = circ.A * Math.sin(circ.W * t + n.ph);
  return { x: n.x + circ.L * circ.u * Math.sin(th), y: circPivotY() + circ.L * circ.u * Math.cos(th), th: th };
}
function circBarVel(n, t) {
  var th = circ.A * Math.sin(circ.W * t + n.ph);
  var dth = circ.A * circ.W * Math.cos(circ.W * t + n.ph);
  return { x: circ.L * circ.u * Math.cos(th) * dth, y: -circ.L * circ.u * Math.sin(th) * dth };
}

function circStandOn(i) {
  var n = circ.nodes[i];
  circ.state = 'stand';
  circ.node = i;
  circ.x = n.x;
  circ.y = circPedTop() - circHandsToFeet();
  circ.vx = 0; circ.vy = 0;
  circ.lastPed = i;
  princess.x = circ.x;
  princess.y = circPedTop();
  princess.facing = 1;
}

function initCircus(mode) {
  var i;
  circLoadCourse(mode);
  layoutCircus();
  tasks = circHard()
    ? [makeTask(-5, 'pay'), makeTask(-5, 'route')]
    : [makeTask(-5, 'clock'), makeTask(-5, 'jigsaw')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  circ.stars = [];
  for (i = 0; i < circ.starDefs.length; i++) {
    circ.stars.push({ ax: circ.starDefs[i].x * circ.u, ay: circBarY0() - circ.starDefs[i].dy * viewH, collected: false, phase: Math.random() * Math.PI * 2 });
  }
  circ.t = 0;
  circ.flyT = 0;
  circ.fromBar = -1;
  circ.netT = 0;
  circ.taskDelay = 0;
  circ.doorDelay = 0;
  circStandOn(0);
  checkpoint.x = circ.x;
  checkpoint.y = circPedTop();
  circ.spotX = circ.x;
  camX = 0;
  renderBackground();
  playNote(523, 0, 0.18, 'triangle', 0.35);
  playNote(659, 0.12, 0.18, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.4);
}

function respawnCircus() {
  circStandOn(circ.lastPed);
  circ.netT = 0;
  spawnSparkles(circ.x, circPedTop() - viewH * 0.1, 14, '#ffe27a');
}

function resizeCircus() {
  var i, wasNode = circ.node, st = circ.state;
  layoutCircus();
  for (i = 0; i < circ.stars.length; i++) {
    circ.stars[i].ax = circ.starDefs[i].x * circ.u;
    circ.stars[i].ay = circBarY0() - circ.starDefs[i].dy * viewH;
  }
  if (st === 'stand') circStandOn(wasNode);
  else circStandOn(circ.lastPed);
}

// Napautus: korokkeelta loikka, tangosta irrotus
function handleCircusTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var n, v;
  if (circ.state === 'stand') {
    n = circ.nodes[circ.node];
    if (n.door) return;
    circ.state = 'fly';
    circ.vx = circ.JUMP[0] * circ.u;
    circ.vy = circ.JUMP[1] * circ.u;
    circ.flyT = 0;
    circ.fromBar = -1;
    circ.prevFeet = circ.y + circHandsToFeet();
    playNote(660, 0, 0.12, 'sine', 0.3);
    playNote(880, 0.08, 0.16, 'sine', 0.25);
    return;
  }
  if (circ.state === 'hang') {
    n = circ.nodes[circ.node];
    v = circBarVel(n, circ.t);
    circ.state = 'fly';
    circ.vx = v.x * circ.K;
    circ.vy = v.y * circ.K;
    circ.flyT = 0;
    circ.fromBar = circ.node;
    circ.prevFeet = circ.y + circHandsToFeet();
    princess.facing = circ.vx >= 0 ? 1 : -1;
    playNote(740, 0, 0.1, 'sine', 0.3);
    spawnSparkles(circ.x, circ.y, 6, '#ffe27a');
  }
}

function circCollectStar(s) {
  s.collected = true;
  registerCollected(s);
  spawnSparkles(s.ax, s.ay, 14, '#ffe27a');
  soundStar(countCollected(circ.stars));
}

function circLandPed(i) {
  var n = circ.nodes[i], k;
  circStandOn(i);
  spawnSparkles(circ.x, circPedTop(), 10, '#fff6c8');
  playNote(523, 0, 0.12, 'triangle', 0.35);
  playNote(784, 0.1, 0.2, 'triangle', 0.35);
  for (k = 0; k < checkpoints.length; k++) {
    if (checkpoints[k].node === i && !checkpoints[k].lit) setCheckpoint(checkpoints[k], n.x, circPedTop());
  }
  if (n.task !== undefined && tasks[n.task] && !tasks[n.task].opened) circ.taskDelay = 0.5;
  if (n.door) circ.doorDelay = 0.4;
}

function updateCircus(dt) {
  var i, n, bp, dx, dy, feet;
  updateTasks(dt);
  var busy = puzzleBusy();
  if (circ.taskDelay > 0) {
    circ.taskDelay -= dt;
    if (circ.taskDelay <= 0) {
      n = circ.nodes[circ.node];
      if (n.task !== undefined && !tasks[n.task].opened) taskStart(tasks[n.task]);
    }
  }
  if (circ.doorDelay > 0 && !celebrating) {
    circ.doorDelay -= dt;
    if (circ.doorDelay <= 0) startCelebration();
  }
  if (!busy && !celebrating) circ.t += dt;

  if (!busy && !celebrating) {
    if (circ.state === 'hang') {
      n = circ.nodes[circ.node];
      bp = circBarPos(n, circ.t);
      circ.x = bp.x; circ.y = bp.y;
    } else if (circ.state === 'fly') {
      circ.flyT += dt;
      circ.vy += circ.G * circ.u * dt;
      // Lähellä oleva tanko "vetää" käsiä puoleensa: anteeksiantava tarttuminen
      if (circ.flyT > 0.3) {
        for (i = 0; i < circ.nodes.length; i++) {
          n = circ.nodes[i];
          if (n.kind !== 'bar' || i === circ.fromBar) continue;
          bp = circBarPos(n, circ.t);
          dx = bp.x - circ.x; dy = bp.y - circ.y;
          if (dx * dx + dy * dy < circ.MAG * circ.u * circ.MAG * circ.u) {
            circ.vx += dx * circ.MAG_S * dt;
            circ.vy += dy * circ.MAG_S * dt;
          }
        }
      }
      circ.x += circ.vx * dt;
      circ.y += circ.vy * dt;
      feet = circ.y + circHandsToFeet();
      // Tartu tankoon
      for (i = 0; i < circ.nodes.length; i++) {
        n = circ.nodes[i];
        if (n.kind !== 'bar') continue;
        if (i === circ.fromBar && circ.flyT < 0.45) continue;
        bp = circBarPos(n, circ.t);
        dx = bp.x - circ.x; dy = bp.y - circ.y;
        if (dx * dx + dy * dy < circ.GRAB * circ.u * circ.GRAB * circ.u) {
          circ.state = 'hang';
          circ.node = i;
          circ.x = bp.x; circ.y = bp.y;
          spawnSparkles(bp.x, bp.y, 10, '#fff6c8');
          playNote(988, 0, 0.14, 'triangle', 0.35);
          playNote(1319, 0.08, 0.2, 'triangle', 0.3);
          break;
        }
      }
      // Laskeudu korokkeelle
      if (circ.state === 'fly' && circ.vy > 0) {
        for (i = 0; i < circ.nodes.length; i++) {
          n = circ.nodes[i];
          if (n.kind !== 'ped') continue;
          if (Math.abs(circ.x - n.x) < n.w * 0.55 && feet >= circPedTop() && circ.prevFeet < circPedTop() + viewH * 0.06) {
            circLandPed(i);
            break;
          }
        }
      }
      circ.prevFeet = feet;
      // Verkko
      if (circ.state === 'fly' && feet > circNetY()) {
        circ.state = 'net';
        circ.netT = 0;
        circ.y = circNetY() - circHandsToFeet();
        spawnSparkles(circ.x, circNetY(), 10, '#c9c9ff');
        loseHeart();
      }
    } else if (circ.state === 'net') {
      circ.netT += dt;
      if (circ.netT > 1.0) circStandOn(circ.lastPed);
    }
    // Tähdet
    for (i = 0; i < circ.stars.length; i++) {
      var s = circ.stars[i];
      if (s.collected) continue;
      s.phase += dt * 2;
      dx = s.ax - circ.x; dy = s.ay - (circ.y + viewH * 0.05);
      if (dx * dx + dy * dy < viewH * 0.11 * viewH * 0.11) circCollectStar(s);
    }
  }
  princess.x = circ.x;
  princess.y = circ.y + circHandsToFeet();
  circ.spotX += (circ.x - circ.spotX) * Math.min(1, dt * 3);
  followCam(circ.x, dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function circusLayers() {
  return [
    { speed: 0.22, render: renderCircusFar },
    { speed: 0.55, render: renderCircusMid },
    { speed: 1, render: renderCircusNear }
  ];
}
function renderCircusBg(b, w, h) {
  renderCircusFar(b, w, h);
  renderCircusMid(b, w, h);
  renderCircusNear(b, w, h);
}
function renderCircusFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  if (circHard()) {
    wall.addColorStop(0, '#1a1448');
    wall.addColorStop(0.35, '#120c32');
    wall.addColorStop(1, '#08061a');
  } else {
    wall.addColorStop(0, '#5a1430');
    wall.addColorStop(0.35, '#3a1030');
    wall.addColorStop(1, '#1c0a22');
  }
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, h * 0.08, h * 0.05, 0.22, '#ffe9a0', '#fff8d0', '#ffd24f');
}
function renderCircusMid(b, w, h) {
  var i, x, y, sw = h * 0.07;
  var stripeA = circHard() ? '#2a2060' : '#c8323c';
  var stripeB = circHard() ? '#e8c04a' : '#fff3e0';
  for (i = 0, x = 0; x < w; i++, x += sw) {
    b.fillStyle = i % 2 ? stripeA : stripeB;
    b.fillRect(x, 0, sw + 1, h * 0.2);
  }
  b.fillStyle = stripeA;
  for (x = sw / 2; x < w + sw; x += sw) { b.beginPath(); b.arc(x, h * 0.2, sw / 2, 0, Math.PI); b.fill(); }
  b.strokeStyle = '#ffd24f';
  b.lineWidth = Math.max(2, h * 0.006);
  b.beginPath();
  for (x = 0; x <= w + sw; x += sw) { b.moveTo(x, h * 0.2); b.arc(x + sw / 2, h * 0.2, sw / 2, Math.PI, 0, true); }
  b.stroke();
  var cols = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath();
  for (x = 0; x <= w; x += h * 0.5) { b.moveTo(x, h * 0.26); b.quadraticCurveTo(x + h * 0.25, h * 0.31, x + h * 0.5, h * 0.26); }
  b.stroke();
  for (i = 0, x = h * 0.05; x < w; i++, x += h * 0.06) {
    y = h * 0.26 + Math.sin(((x % (h * 0.5)) / (h * 0.5)) * Math.PI) * h * 0.025;
    var g = b.createRadialGradient(x, y, 1, x, y, h * 0.022);
    g.addColorStop(0, cols[i % 5]);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    b.fillStyle = g;
    b.beginPath(); b.arc(x, y, h * 0.022, 0, Math.PI * 2); b.fill();
    b.fillStyle = cols[i % 5];
    b.beginPath(); b.arc(x, y, h * 0.008, 0, Math.PI * 2); b.fill();
  }
}
function renderCircusNear(b, w, h) {
  var i, x, y, n, pt = circPedTop(), ny = circNetY();
  var rows = 3;
  var hard = circHard();
  for (i = 0; i < rows; i++) {
    y = h * (0.86 + i * 0.035);
    b.fillStyle = i === 0 ? '#2a1a44' : (i === 1 ? '#231538' : '#1b1030');
    b.fillRect(0, y - h * 0.01, w, h * 0.06);
    for (x = h * 0.03 + i * h * 0.03; x < w; x += h * 0.065) {
      b.fillStyle = i === 0 ? '#3d2a5c' : '#2f1f4a';
      b.beginPath(); b.arc(x, y, h * 0.02, 0, Math.PI * 2); b.fill();
      b.beginPath();
      if (b.ellipse) { b.ellipse(x - h * 0.008, y - h * 0.032, h * 0.006, h * 0.018, -0.2, 0, Math.PI * 2); b.ellipse(x + h * 0.008, y - h * 0.032, h * 0.006, h * 0.018, 0.2, 0, Math.PI * 2); }
      b.fill();
      if (((x * 7) | 0) % 5 === 0) { b.fillStyle = 'rgba(255,255,255,0.7)'; b.beginPath(); b.arc(x - h * 0.006, y - h * 0.003, h * 0.003, 0, Math.PI * 2); b.arc(x + h * 0.006, y - h * 0.003, h * 0.003, 0, Math.PI * 2); b.fill(); }
    }
  }
  // Areenan reunus
  b.fillStyle = hard ? '#2a2060' : '#c8323c';
  b.fillRect(0, h * 0.955, w, h * 0.045);
  b.fillStyle = hard ? '#e8c04a' : '#fff3e0';
  for (x = 0; x < w; x += h * 0.12) b.fillRect(x, h * 0.955, h * 0.06, h * 0.045);
  // Turvaverkko
  b.strokeStyle = 'rgba(200,200,255,0.45)';
  b.lineWidth = Math.max(1, h * 0.002);
  for (x = 0; x < w + h * 0.06; x += h * 0.03) {
    b.beginPath(); b.moveTo(x, ny); b.lineTo(x - h * 0.06, ny + h * 0.06); b.stroke();
    b.beginPath(); b.moveTo(x, ny); b.lineTo(x + h * 0.06, ny + h * 0.06); b.stroke();
  }
  b.strokeStyle = 'rgba(230,230,255,0.8)';
  b.lineWidth = Math.max(2, h * 0.005);
  b.beginPath(); b.moveTo(0, ny); b.lineTo(w, ny); b.stroke();
  // Korokkeet ja pylväät
  for (i = 0; i < circ.nodes.length; i++) {
    n = circ.nodes[i];
    if (n.kind !== 'ped') continue;
    b.fillStyle = '#6b4a8a';
    b.fillRect(n.x - h * 0.012, pt, h * 0.024, h * 0.955 - pt);
    b.strokeStyle = 'rgba(255,255,255,0.35)';
    b.lineWidth = Math.max(1, h * 0.003);
    for (y = pt + h * 0.05; y < h * 0.84; y += h * 0.05) { b.beginPath(); b.moveTo(n.x - h * 0.03, y); b.lineTo(n.x + h * 0.03, y); b.stroke(); }
    var dg = b.createLinearGradient(n.x - n.w / 2, 0, n.x + n.w / 2, 0);
    if (hard) {
      dg.addColorStop(0, '#8a6a18');
      dg.addColorStop(0.5, '#e8c04a');
      dg.addColorStop(1, '#8a6a18');
    } else {
      dg.addColorStop(0, '#a8263a');
      dg.addColorStop(0.5, '#e84a5a');
      dg.addColorStop(1, '#a8263a');
    }
    b.fillStyle = dg;
    roundRect(b, n.x - n.w / 2, pt, n.w, h * 0.07, h * 0.015);
    b.fill();
    b.fillStyle = '#ffd24f';
    b.fillRect(n.x - n.w / 2, pt, n.w, h * 0.012);
    drawStar(b, n.x, pt + h * 0.045, h * 0.02, 0, 0);
    if (n.door) {
      // Loppuovi: tähtiverho
      b.fillStyle = '#ffd24f';
      roundRect(b, n.x - n.w * 0.45, pt - h * 0.34, n.w * 0.9, h * 0.34, h * 0.03);
      b.fill();
      b.fillStyle = hard ? '#3a2060' : '#7a3cb8';
      roundRect(b, n.x - n.w * 0.38, pt - h * 0.31, n.w * 0.76, h * 0.31, h * 0.025);
      b.fill();
      drawStar(b, n.x, pt - h * 0.2, h * 0.05, 0, 0);
    }
  }
}

function drawSpotlight(c, x, alpha) {
  var g = c.createLinearGradient(0, 0, 0, viewH * 0.9);
  g.addColorStop(0, 'rgba(255,245,200,' + alpha + ')');
  g.addColorStop(1, 'rgba(255,245,200,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - viewH * 0.03, 0);
  c.lineTo(x + viewH * 0.03, 0);
  c.lineTo(x + viewH * 0.22, viewH * 0.9);
  c.lineTo(x - viewH * 0.22, viewH * 0.9);
  c.closePath();
  c.fill();
}

function drawTrapeze(c, n, t) {
  var bp = circBarPos(n, t), px = n.x - camX, py = circPivotY(), bx = bp.x - camX, by = bp.y;
  var hw = circ.u * 0.06;
  if (bx < -viewH * 0.5 || bx > viewW + viewH * 0.5) return;
  c.fillStyle = '#8a6a44';
  c.beginPath(); c.arc(px, py, viewH * 0.012, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#f2e2c0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.beginPath();
  c.moveTo(px - hw * 0.4, py); c.lineTo(bx - hw, by);
  c.moveTo(px + hw * 0.4, py); c.lineTo(bx + hw, by);
  c.stroke();
  c.strokeStyle = '#5a3a1e';
  c.lineWidth = Math.max(3, viewH * 0.012);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(bx - hw * 1.2, by); c.lineTo(bx + hw * 1.2, by); c.stroke();
  c.fillStyle = '#ffd24f';
  c.beginPath(); c.arc(bx - hw * 1.2, by, viewH * 0.008, 0, Math.PI * 2); c.arc(bx + hw * 1.2, by, viewH * 0.008, 0, Math.PI * 2); c.fill();
  c.lineCap = 'butt';
}

// Prinsessa käsistä roikkuen tai lennossa; (x, y) = kädet
function drawPrincessPose(c, x, y, s, facing, pose, tilt, t) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.scale(facing, 1);
  var kick = pose === 'hang' ? Math.sin(t * 3) * s * 4 : s * 8;
  var armSpread = pose === 'hang' ? 0 : s * 6;
  // Kädet
  c.strokeStyle = '#ffd9b8';
  c.lineWidth = s * 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 4, 0); c.lineTo(-s * 5 - armSpread, s * 18);
  c.moveTo(s * 4, 0); c.lineTo(s * 5 + armSpread * 0.3, s * 18);
  c.stroke();
  // Jalat
  c.beginPath();
  c.moveTo(-s * 4, s * 42); c.lineTo(-s * 5 - kick, s * 58);
  c.moveTo(s * 4, s * 42); c.lineTo(s * 5 + kick * 0.6, s * 58);
  c.stroke();
  c.fillStyle = '#c94f7e';
  c.beginPath(); c.arc(-s * 5 - kick, s * 59, s * 3, 0, Math.PI * 2); c.arc(s * 5 + kick * 0.6, s * 59, s * 3, 0, Math.PI * 2); c.fill();
  // Mekko
  c.fillStyle = '#ff6fb0';
  c.beginPath();
  c.moveTo(0, s * 20);
  c.quadraticCurveTo(-s * 16 - (pose === 'fly' ? s * 4 : 0), s * 40, -s * 12, s * 46);
  c.lineTo(s * 12, s * 46);
  c.quadraticCurveTo(s * 16, s * 40, 0, s * 20);
  c.closePath(); c.fill();
  c.beginPath();
  if (c.ellipse) c.ellipse(0, s * 22, s * 6, s * 8, 0, 0, Math.PI * 2); else c.arc(0, s * 22, s * 7, 0, Math.PI * 2);
  c.fill();
  // Pää ja hiukset
  c.fillStyle = '#ffd9b8';
  c.beginPath(); c.arc(0, s * 9, s * 8, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f7c948';
  c.beginPath(); c.arc(0, s * 6, s * 8.2, Math.PI * 0.95, Math.PI * 2.05); c.fill();
  c.beginPath();
  if (c.ellipse) c.ellipse(-s * 7, s * 12, s * 2.6, s * 7, 0.35, 0, Math.PI * 2); else c.arc(-s * 7, s * 12, s * 3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 3, s * 9, s * 1.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c0392b';
  c.lineWidth = s * 1;
  c.beginPath(); c.arc(s * 2, s * 11.5, s * 2.2, 0.2, Math.PI - 0.5); c.stroke();
  // Kruunu
  c.fillStyle = '#ffd24f';
  c.beginPath();
  c.moveTo(-s * 6, s * 1); c.lineTo(-s * 6, -s * 5); c.lineTo(-s * 3, -s * 1); c.lineTo(0, -s * 7);
  c.lineTo(s * 3, -s * 1); c.lineTo(s * 6, -s * 5); c.lineTo(s * 6, s * 1);
  c.closePath(); c.fill();
  c.restore();
}

// Loikka korokkeelta: origo jaloissa, molemmat kädet ylhäällä kohti tankoa
function drawPrincessJump(c, x, y, s, facing, tilt, t) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.scale(facing, 1);
  var kick = Math.sin(t * 14) * s * 4;
  artLimb(c, -s * 4, -s * 18, -s * 10, -s * 2 - kick, s * 4.4, SKIN, SKIN_LINE);
  artLimb(c, s * 4, -s * 18, s * 9, -s * 2 + kick * 0.6, s * 4.4, SKIN, SKIN_LINE);
  c.beginPath();
  c.moveTo(0, -s * 28);
  c.quadraticCurveTo(-s * 16, -s * 8, -s * 12, -s * 2);
  c.lineTo(s * 12, -s * 2);
  c.quadraticCurveTo(s * 16, -s * 8, 0, -s * 28);
  c.closePath();
  artFillPath(c, DRESS, -s * 28, -s * 2, s * 12);
  artBlob(c, 0, -s * 26, s * 6.2, s * 8, DRESS, {});
  artCircle(c, 0, -s * 42, s * 8, SKIN, { lineColor: SKIN_LINE, hi: 0.3 });
  c.beginPath();
  c.arc(0, -s * 45, s * 8.2, Math.PI * 0.95, Math.PI * 2.05);
  c.closePath();
  artFillPath(c, HAIR, -s * 54, -s * 42, s * 8);
  artBlob(c, -s * 7, -s * 34, s * 3.4, s * 9, HAIR, { rot: 0.28 });
  artEye(c, s * 3, -s * 42, s * 1.55, 0.45, (t % 4.1) < 0.14);
  artBlush(c, s * 5.2, -s * 39, s * 1.8);
  c.strokeStyle = '#c0392b';
  c.lineWidth = Math.max(1, s * 0.9);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 1.8, -s * 39.5, s * 2.4, 0.2, Math.PI - 0.7); c.stroke();
  c.beginPath();
  c.moveTo(-s * 6, -s * 50);
  c.lineTo(-s * 6, -s * 56);
  c.lineTo(-s * 3, -s * 52);
  c.lineTo(0, -s * 58);
  c.lineTo(s * 3, -s * 52);
  c.lineTo(s * 6, -s * 56);
  c.lineTo(s * 6, -s * 50);
  c.closePath();
  artFillPath(c, '#ffd24f', -s * 58, -s * 50, s * 5, { lineColor: '#d98a00' });
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.arc(0, -s * 52.2, s * 1.1, 0, Math.PI * 2); c.fill();
  artLimb(c, -s * 5, -s * 24, -s * 12, -s * 54, s * 3.4, SKIN, SKIN_LINE);
  artLimb(c, s * 5, -s * 24, s * 11, -s * 56, s * 3.4, SKIN, SKIN_LINE);
  c.restore();
}

// Haalea kaari: mihin irrotus (tai loikka) juuri nyt veisi
function drawCircusGhostArc(c) {
  var vx, vy, n, v, x = circ.x, y = circ.y, i, dt = 0.06, a;
  if (circ.state === 'hang') {
    n = circ.nodes[circ.node];
    v = circBarVel(n, circ.t);
    vx = v.x * circ.K; vy = v.y * circ.K;
  } else if (circ.state === 'stand' && !circ.nodes[circ.node].door) {
    vx = circ.JUMP[0] * circ.u; vy = circ.JUMP[1] * circ.u;
  } else return;
  for (i = 1; i <= 18; i++) {
    vy += circ.G * circ.u * dt;
    x += vx * dt; y += vy * dt;
    if (y > circNetY() - viewH * 0.1) break;
    a = 0.5 * (1 - i / 18);
    c.fillStyle = 'rgba(255,240,180,' + a + ')';
    c.beginPath(); c.arc(x - camX, y, viewH * 0.007, 0, Math.PI * 2); c.fill();
  }
}

function drawCircus() {
  var i, n, s;
  if (!beginPlayWorld()) return;
  // Valokeilat seuraavat
  drawSpotlight(ctx, circ.spotX - camX - viewH * 0.12, 0.12);
  drawSpotlight(ctx, circ.spotX - camX + viewH * 0.14, 0.09);
  // Korokkeiden lyhdyt ja tehtäväverho
  for (i = 0; i < checkpoints.length; i++) {
    drawLantern(ctx, { x: checkpoints[i].x + circ.nodes[checkpoints[i].node].w * 0.38, lit: checkpoints[i].lit }, circPedTop());
  }
  for (i = 0; i < circ.nodes.length; i++) {
    n = circ.nodes[i];
    if (n.kind === 'ped' && n.task !== undefined && tasks[n.task] && !tasks[n.task].opened) {
      var gx = n.x - camX, gy = circPedTop() - viewH * 0.2;
      var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.18);
      g.addColorStop(0, 'rgba(255,230,140,' + (0.45 + Math.sin(globalT * 3) * 0.15) + ')');
      g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold ' + Math.round(viewH * 0.07) + 'px ' + TASK_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', gx, gy);
    }
    if (n.kind === 'ped' && n.door) {
      var dgx = n.x - camX, dgy = circPedTop() - viewH * 0.2;
      var dg = ctx.createRadialGradient(dgx, dgy, viewH * 0.02, dgx, dgy, viewH * 0.22);
      dg.addColorStop(0, 'rgba(255,230,140,' + (0.5 + Math.sin(globalT * 4) * 0.15) + ')');
      dg.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(dgx, dgy, viewH * 0.22, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Trapetsit
  for (i = 0; i < circ.nodes.length; i++) if (circ.nodes[i].kind === 'bar') drawTrapeze(ctx, circ.nodes[i], circ.t);
  // Tähdet
  for (i = 0; i < circ.stars.length; i++) {
    s = circ.stars[i];
    if (s.collected) continue;
    drawStar(ctx, s.ax - camX, s.ay + Math.sin(s.phase) * viewH * 0.012, viewH * 0.03, Math.sin(s.phase * 0.5) * 0.3, 0.7 + Math.sin(s.phase * 2) * 0.3);
  }
  if (!celebrating && !puzzleBusy()) drawCircusGhostArc(ctx);
  // Prinsessa
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  var ps = viewH / 520;
  if (circ.state === 'stand') {
    drawPrincessFree(ctx, circ.x - camX, circPedTop(), ps, 1, 0, false, globalT);
  } else if (circ.state === 'hang') {
    n = circ.nodes[circ.node];
    var th = circBarPos(n, circ.t).th;
    drawPrincessPose(ctx, circ.x - camX, circ.y, ps, 1, 'hang', -th * 0.6, globalT);
  } else if (circ.state === 'fly') {
    var tilt = Math.atan2(circ.vy, Math.abs(circ.vx) + 1) * 0.35;
    drawPrincessJump(ctx, circ.x - camX, circ.y + circHandsToFeet(), ps, princess.facing, tilt * princess.facing, globalT);
  } else {
    var bounce = Math.sin(Math.min(1, circ.netT) * Math.PI) * viewH * 0.06;
    drawPrincessPose(ctx, circ.x - camX, circ.y - bounce, ps, 1, 'fly', Math.sin(circ.netT * 8) * 0.2, globalT);
    // Verkko notkahtaa
    ctx.strokeStyle = 'rgba(230,230,255,0.9)';
    ctx.lineWidth = Math.max(2, viewH * 0.005);
    ctx.beginPath();
    ctx.moveTo(circ.x - camX - viewH * 0.3, circNetY());
    ctx.quadraticCurveTo(circ.x - camX, circNetY() + (1 - Math.min(1, circ.netT * 1.5)) * viewH * 0.06, circ.x - camX + viewH * 0.3, circNetY());
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, circ.stars.length, function (k) { return circ.stars[k] && circ.stars[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
