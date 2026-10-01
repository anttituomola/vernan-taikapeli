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
  netT: 0, spotX: 0, taskDelay: 0, doorDelay: 0, prevFeet: 0,
  clownT: 0, clownX: 0 // pellepupun kamea (rummun yllätys)
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
  circ.clownT = 0;
  circSetupProps();
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
  circSetupProps();
  for (i = 0; i < circ.stars.length; i++) {
    circ.stars[i].ax = circ.starDefs[i].x * circ.u;
    circ.stars[i].ay = circBarY0() - circ.starDefs[i].dy * viewH;
  }
  if (st === 'stand') circStandOn(wasNode);
  else circStandOn(circ.lastPed);
}

// Napautus: korokkeelta loikka, tangosta irrotus
function handleCircusTap(px, py) {
  if (!running || puzzleBusy()) return;
  var n, v;
  if (!celebrating && circ.state === 'stand') {
    n = circ.nodes[circ.node];
    if (!n.door) {
      circ.state = 'fly';
      circ.vx = circ.JUMP[0] * circ.u;
      circ.vy = circ.JUMP[1] * circ.u;
      circ.flyT = 0;
      circ.fromBar = -1;
      circ.prevFeet = circ.y + circHandsToFeet();
      playNote(660, 0, 0.12, 'sine', 0.3);
      playNote(880, 0.08, 0.16, 'sine', 0.25);
    }
  } else if (!celebrating && circ.state === 'hang') {
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
  // Koristeet heilahtavat napautuksen lisäksi: napautus mihin tahansa on jo
  // pelin ohjaus (loikka tai irrotus), joten pelivaste ei muutu
  propsTap(px + camX, py);
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
  propsUpdate(dt);
  if (circ.clownT > 0) circ.clownT -= dt;
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
  // Keskikerros: telttakangas sävytetään hiukan seinän väriin (ilmaperspektiivi)
  var wallC = circHard() ? '#120c32' : '#3a1030';
  var stripeA = artMix(circHard() ? '#2a2060' : '#c8323c', wallC, 0.18);
  var stripeB = artMix(circHard() ? '#e8c04a' : '#fff3e0', wallC, 0.18);
  for (i = 0, x = 0; x < w; i++, x += sw) {
    b.fillStyle = i % 2 ? stripeA : stripeB;
    b.fillRect(x, 0, sw + 1, h * 0.2);
  }
  b.fillStyle = stripeA;
  for (x = sw / 2; x < w + sw; x += sw) { b.beginPath(); b.arc(x, h * 0.2, sw / 2, 0, Math.PI); b.fill(); }
  b.strokeStyle = artMix('#ffd24f', wallC, 0.18);
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
  var edgeA = hard ? '#2a2060' : '#c8323c', edgeB = hard ? '#e8c04a' : '#fff3e0';
  var lw = Math.max(1.2, h * 0.003);
  // Katsomo: kolme penkkiriviä pupusiluetteineen (eturivin kannustajat ovat koristeita)
  for (i = 0; i < rows; i++) {
    y = h * (0.86 + i * 0.035);
    b.fillStyle = i === 0 ? '#2a1a44' : (i === 1 ? '#231538' : '#1b1030');
    b.fillRect(0, y - h * 0.01, w, h * 0.06);
    b.fillStyle = 'rgba(255,255,255,0.07)';
    b.fillRect(0, y - h * 0.01, w, h * 0.005);
    for (x = h * 0.03 + i * h * 0.03; x < w; x += h * 0.065) {
      b.fillStyle = i === 0 ? '#3d2a5c' : '#2f1f4a';
      b.beginPath(); b.arc(x, y, h * 0.02, 0, Math.PI * 2); b.fill();
      b.beginPath();
      if (b.ellipse) { b.ellipse(x - h * 0.008, y - h * 0.032, h * 0.006, h * 0.018, -0.2, 0, Math.PI * 2); b.ellipse(x + h * 0.008, y - h * 0.032, h * 0.006, h * 0.018, 0.2, 0, Math.PI * 2); }
      b.fill();
      if (((x * 7) | 0) % 5 === 0) { b.fillStyle = 'rgba(255,255,255,0.7)'; b.beginPath(); b.arc(x - h * 0.006, y - h * 0.003, h * 0.003, 0, Math.PI * 2); b.arc(x + h * 0.006, y - h * 0.003, h * 0.003, 0, Math.PI * 2); b.fill(); }
    }
  }
  // Areenan reunus: kaksisävyinen raitapalkki tummalla reunaviivalla
  var eg = b.createLinearGradient(0, h * 0.955, 0, h);
  eg.addColorStop(0, artShade(edgeA, 0.14));
  eg.addColorStop(1, artShade(edgeA, -0.22));
  b.fillStyle = eg;
  b.fillRect(0, h * 0.955, w, h * 0.045);
  b.fillStyle = edgeB;
  for (x = 0; x < w; x += h * 0.12) { roundRect(b, x, h * 0.955, h * 0.06, h * 0.045, h * 0.008); b.fill(); }
  b.fillStyle = artShade(edgeA, -0.5);
  b.fillRect(0, h * 0.95, w, h * 0.006);
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
    // Pylväs puolineen
    artRoundRect(b, n.x - h * 0.012, pt, h * 0.024, h * 0.955 - pt, h * 0.008, '#6b4a8a', { lineColor: '#3a2550', line: lw });
    b.strokeStyle = 'rgba(255,255,255,0.35)';
    b.lineWidth = Math.max(1, h * 0.003);
    for (y = pt + h * 0.05; y < h * 0.84; y += h * 0.05) { b.beginPath(); b.moveTo(n.x - h * 0.03, y); b.lineTo(n.x + h * 0.03, y); b.stroke(); }
    // Koroke: kaksisävyinen levy, kultainen reunalista ja tähti
    artRoundRect(b, n.x - n.w / 2, pt, n.w, h * 0.07, h * 0.015, hard ? '#e8c04a' : '#e84a5a', { lineColor: hard ? '#8a6a18' : '#a8263a', line: lw * 1.3 });
    artHighlight(b, n.x - n.w * 0.3, pt + h * 0.03, n.w * 0.12, h * 0.012, 0.25);
    artRoundRect(b, n.x - n.w / 2, pt, n.w, h * 0.014, h * 0.006, '#ffd24f', { lineColor: '#d98a00', line: lw });
    drawStar(b, n.x, pt + h * 0.045, h * 0.02, 0, 0);
    if (n.door) {
      // Loppuovi: tähtiverho kultaisissa kehyksissä
      artRoundRect(b, n.x - n.w * 0.45, pt - h * 0.34, n.w * 0.9, h * 0.34, h * 0.03, '#ffd24f', { lineColor: '#d98a00', line: lw * 1.3 });
      artRoundRect(b, n.x - n.w * 0.38, pt - h * 0.31, n.w * 0.76, h * 0.31, h * 0.025, hard ? '#3a2060' : '#7a3cb8', { lineColor: hard ? '#1a0a30' : '#3a1a60', line: lw });
      artHighlight(b, n.x - n.w * 0.26, pt - h * 0.26, n.w * 0.08, h * 0.03, 0.2);
      drawStar(b, n.x, pt - h * 0.2, h * 0.05, 0, 0);
    }
  }
}

// ---------- Tökättävät koristeet ----------
var CIRC_BULB_COLS = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];

// Rumpu lähtökorokkeen vieressä, lamppuköynnös jokaisen korokkeen aidassa ja
// kolme kannustavaa katsojapupua eturivissä. Paikat u-yksiköissä, joten sama
// asettelu toimii molemmilla radoilla; rakennetaan uudestaan resize-koukussa.
function circSetupProps() {
  var i, j, n, u = circ.u, floorY = viewH * 0.955, last = circ.nodes[circ.nodes.length - 1].x, fx;
  propsReset();
  propAdd({ x: circ.nodes[0].x - 0.32 * u, y: floorY, s: viewH * 0.055, r: viewH * 0.09, hy: viewH * 0.06, color: '#ff8fa0', note: 180, draw: circDrawDrum, poke: circPokeDrum });
  for (i = 0; i < circ.nodes.length; i++) {
    n = circ.nodes[i];
    if (n.kind !== 'ped') continue;
    propAdd({ x: n.x + (n.door ? -0.5 : 0.5) * u, y: floorY, s: viewH * 0.03, w: viewH * 0.36, r: viewH * 0.1, hy: viewH * 0.045, color: '#ffe27a', note: 1047, draw: circDrawBulbs, poke: circPokeBulbs });
  }
  for (j = 0; j < 3; j++) {
    fx = last * (0.28 + j * 0.24);
    // Ei pylvään eikä lamppuköynnöksen kohdalle
    for (i = 0; i < circ.nodes.length; i++) if (circ.nodes[i].kind === 'ped' && Math.abs(circ.nodes[i].x - fx) < 0.35 * u) fx = circ.nodes[i].x + 0.8 * u;
    propAdd({ x: fx, y: viewH * 0.885, s: viewH * 0.04, r: viewH * 0.07, hy: viewH * 0.045, color: CIRC_BULB_COLS[j], note: 880 + j * 120, draw: circDrawFan, poke: circPokeFan });
  }
}

// Bassorumpu: kalvo värähtää tökättäessä
function circDrawDrum(c, p) {
  var s = p.s, i, a, k = p.t >= 0 ? Math.sin(p.t * 32) * Math.exp(-p.t * 4) * 0.06 : 0;
  artShadow(c, 0, 0, s * 1.4, s * 0.26, 0.2);
  artLimb(c, -s * 0.75, -s * 0.55, -s * 1.05, 0, s * 0.18, '#8a6a44', '#4a3418');
  artLimb(c, s * 0.75, -s * 0.55, s * 1.05, 0, s * 0.18, '#8a6a44', '#4a3418');
  artCircle(c, 0, -s * 1.15, s * 1.1, '#e84a5a', { lineColor: '#8a1a2a' });
  artCircle(c, 0, -s * 1.15, s * 0.84 * (1 + k), '#fff6e8', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5', hi: 0.3 });
  c.fillStyle = '#ffd24f';
  c.beginPath();
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3 + 0.3;
    c.moveTo(Math.cos(a) * s * 0.97 + s * 0.08, -s * 1.15 + Math.sin(a) * s * 0.97);
    c.arc(Math.cos(a) * s * 0.97, -s * 1.15 + Math.sin(a) * s * 0.97, s * 0.08, 0, Math.PI * 2);
  }
  c.fill();
  drawStar(c, 0, -s * 1.15, s * 0.34, 0, 0);
  // Kapula nojaa rummun päällä
  artLimb(c, s * 0.35, -s * 2.2, s * 1.25, -s * 2.75, s * 0.1, '#d9b48a', '#8a5a30');
  artCircle(c, s * 1.3, -s * 2.78, s * 0.17, '#fff6e8', { lineColor: '#b8a0c8', shadeTo: '#e3d8f5' });
}
function circPokeDrum(p) {
  playNote(98, 0, 0.22, 'triangle', 0.45);
  playNote(65, 0.02, 0.3, 'sine', 0.4);
  artShakeStart(viewH * 0.004, 0.18);
  if (p.n % 3 === 0) {
    // Yllätys: pellepupu loikkaa rummun takaa jonglööraamaan
    circ.clownT = 4.6;
    circ.clownX = p.x + p.s * 2.8;
    playNote(523, 0.1, 0.1, 'triangle', 0.3);
    playNote(659, 0.2, 0.1, 'triangle', 0.3);
    playNote(784, 0.3, 0.1, 'triangle', 0.3);
    playNote(1047, 0.4, 0.3, 'triangle', 0.35);
  }
}

// Lamppuköynnös kahden kultatolpan välissä; tökkäys sytyttää lamput vuorotellen
function circDrawBulbs(c, p) {
  var s = p.s, w = p.w, n = 6, i, t, x, y, col, on, chase = p.t >= 0 ? Math.floor(p.t * 9) : -1;
  artLimb(c, -w / 2, 0, -w / 2, -s * 1.7, s * 0.24, '#ffd24f', '#b8860b');
  artLimb(c, w / 2, 0, w / 2, -s * 1.7, s * 0.24, '#ffd24f', '#b8860b');
  c.strokeStyle = '#2a1a2a';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.moveTo(-w / 2, -s * 1.7); c.quadraticCurveTo(0, -s * 0.9, w / 2, -s * 1.7); c.stroke();
  for (i = 0; i < n; i++) {
    t = (i + 0.5) / n;
    x = -w / 2 + w * t;
    y = (1 - t) * (1 - t) * (-s * 1.7) + 2 * (1 - t) * t * (-s * 0.9) + t * t * (-s * 1.7) + s * 0.3;
    col = CIRC_BULB_COLS[i % 5];
    on = chase >= 0 && (chase % n === i || chase >= n * 2);
    if (on) artGlow(c, x, y, s * 1.0, col, 0.75);
    artCircle(c, x, y, s * 0.26, on ? artShade(col, 0.5) : col, { flat: true, lineColor: artShade(col, -0.45), line: Math.max(1, s * 0.05) });
  }
}
function circPokeBulbs() {
  playNote(1047, 0.05, 0.07, 'sine', 0.15);
  playNote(1319, 0.13, 0.07, 'sine', 0.15);
  playNote(1568, 0.21, 0.1, 'sine', 0.15);
}

// Katsojapupu eturivissä: tökkäys saa sen hyppäämään ja heiluttamaan viiriä
// (käytössä myös Nuorallakävelyn katsomossa)
function circDrawFan(c, p) {
  var s = p.s, t = p.t, hop = 0, wig = globalT * 2 + p.x;
  if (t >= 0) { hop = Math.sin(Math.min(1, t / 0.5) * Math.PI) * s * 0.7; wig = t * 28; }
  artLimb(c, s * 0.55, -s * 0.5 - hop * 0.5, s * 0.95, -s * 1.6 - hop, s * 0.08, '#8a6a44', '#4a3418');
  c.beginPath(); c.moveTo(s * 0.95, -s * 1.6 - hop); c.lineTo(s * 1.65, -s * 1.4 - hop); c.lineTo(s * 0.95, -s * 1.15 - hop); c.closePath();
  artFillPath(c, p.color, -s * 1.6 - hop, -s * 1.15 - hop, s * 0.3, { lineColor: artShade(p.color, -0.45) });
  artBlob(c, 0, -s * 0.3 - hop * 0.5, s * 0.6, s * 0.36, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE });
  drawBunny(c, 0, -s * 0.85 - hop, s, 0, wig, true);
}
function circPokeFan() {
  playNote(1047, 0.05, 0.08, 'triangle', 0.18);
  playNote(1319, 0.13, 0.12, 'triangle', 0.18);
}

// Yllätys: pellepupu jonglööraa hetken rummun vieressä
function circDrawClown(c) {
  var T = 4.6, left = circ.clownT, t = T - left, s = viewH * 0.045, x = circ.clownX - camX, y = viewH * 0.955, k, i, ph, bx, by, hop;
  if (x < -s * 4 || x > viewW + s * 4) return;
  k = t < 0.4 ? easeOutBack(t / 0.4) : (left < 0.4 ? Math.max(0, left / 0.4) : 1);
  hop = Math.abs(Math.sin(t * 9)) * s * 0.25;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  drawBunny(c, 0, 0, s, hop, t * 6, false);
  // Punainen nenä ja tötteröhattu korvien välissä
  artCircle(c, 0, -hop - s * 0.95, s * 0.1, '#ff3b3b', { lineColor: '#a01010', hi: 0.5 });
  c.beginPath(); c.moveTo(-s * 0.24, -hop - s * 1.42); c.lineTo(s * 0.24, -hop - s * 1.42); c.lineTo(0, -hop - s * 1.95); c.closePath();
  artFillPath(c, '#ffd23e', -hop - s * 1.95, -hop - s * 1.42, s * 0.24, { lineColor: '#b8860b' });
  artCircle(c, 0, -hop - s * 1.97, s * 0.09, '#ff5f7e', { lineColor: '#a02040' });
  // Kolme palloa kaaressa
  for (i = 0; i < 3; i++) {
    ph = t * 5 + i * 2.094;
    bx = Math.sin(ph) * s * 0.6;
    by = -s * 1.9 - Math.abs(Math.cos(ph)) * s * 1.1;
    artCircle(c, bx, by, s * 0.18, maneColors[(i * 2) % maneColors.length], { hi: 0.5 });
  }
  c.restore();
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
  // Köydet
  c.strokeStyle = '#f2e2c0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px - hw * 0.4, py); c.lineTo(bx - hw, by);
  c.moveTo(px + hw * 0.4, py); c.lineTo(bx + hw, by);
  c.stroke();
  // Kiinnike katossa, tanko ja kultaiset kahvat
  artCircle(c, px, py, viewH * 0.012, '#8a6a44', { lineColor: '#4a3418' });
  artLimb(c, bx - hw * 1.2, by, bx + hw * 1.2, by, Math.max(3, viewH * 0.012), '#7a4a26', '#3a2010');
  artCircle(c, bx - hw * 1.2, by, viewH * 0.008, '#ffd24f', { lineColor: '#d98a00', line: 1.2 });
  artCircle(c, bx + hw * 1.2, by, viewH * 0.008, '#ffd24f', { lineColor: '#d98a00', line: 1.2 });
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
  // Kädet (tangosta alas vartaloon)
  artLimb(c, -s * 4, 0, -s * 5 - armSpread, s * 18, s * 5, SKIN, SKIN_LINE);
  artLimb(c, s * 4, 0, s * 5 + armSpread * 0.3, s * 18, s * 5, SKIN, SKIN_LINE);
  // Jalat ja kengät
  artLimb(c, -s * 4, s * 42, -s * 5 - kick, s * 58, s * 5, SKIN, SKIN_LINE);
  artLimb(c, s * 4, s * 42, s * 5 + kick * 0.6, s * 58, s * 5, SKIN, SKIN_LINE);
  artCircle(c, -s * 5 - kick, s * 59, s * 3, '#c94f7e', { lineColor: '#8a2a50' });
  artCircle(c, s * 5 + kick * 0.6, s * 59, s * 3, '#c94f7e', { lineColor: '#8a2a50' });
  // Mekko
  c.beginPath();
  c.moveTo(0, s * 20);
  c.quadraticCurveTo(-s * 16 - (pose === 'fly' ? s * 4 : 0), s * 40, -s * 12, s * 46);
  c.lineTo(s * 12, s * 46);
  c.quadraticCurveTo(s * 16, s * 40, 0, s * 20);
  c.closePath();
  artFillPath(c, DRESS, s * 20, s * 46, s * 12);
  artBlob(c, 0, s * 22, s * 6, s * 8, DRESS, {});
  // Pää, hiukset ja kasvot
  artCircle(c, 0, s * 9, s * 8, SKIN, { lineColor: SKIN_LINE, hi: 0.3 });
  c.beginPath();
  c.arc(0, s * 6, s * 8.2, Math.PI * 0.95, Math.PI * 2.05);
  c.closePath();
  artFillPath(c, HAIR, -s * 3, s * 8, s * 8);
  artBlob(c, -s * 7, s * 12, s * 2.6, s * 7, HAIR, { rot: 0.35 });
  artEye(c, s * 3, s * 9, s * 1.55, 0.45, (t % 4.1) < 0.14);
  artBlush(c, s * 5.2, s * 12, s * 1.8);
  c.strokeStyle = '#c0392b';
  c.lineWidth = Math.max(1, s * 0.9);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 2, s * 11.5, s * 2.2, 0.2, Math.PI - 0.5); c.stroke();
  // Kruunu
  c.beginPath();
  c.moveTo(-s * 6, s * 1); c.lineTo(-s * 6, -s * 5); c.lineTo(-s * 3, -s * 1); c.lineTo(0, -s * 7);
  c.lineTo(s * 3, -s * 1); c.lineTo(s * 6, -s * 5); c.lineTo(s * 6, s * 1);
  c.closePath();
  artFillPath(c, '#ffd24f', -s * 7, s * 1, s * 5, { lineColor: '#d98a00' });
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.arc(0, -s * 1.2, s * 1.1, 0, Math.PI * 2); c.fill();
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
  // Tökättävät koristeet (rumpu, lamppuköynnökset, katsojat) ja pellepupun kamea
  propsDraw(ctx);
  if (circ.clownT > 0) circDrawClown(ctx);
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
