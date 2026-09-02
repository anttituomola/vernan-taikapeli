'use strict';

// Jaettu pelin tila ja sisältötaulut

// ---------- Perusasiat ----------
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

var viewW = 0, viewH = 0;   // ruudun koko CSS-pikseleinä
var worldW = 0;             // maailman leveys
var groundTop = 0, groundBottom = 0;

var running = false;
var mode = 'hub';          // 'hub' = karttalabyrintti, 'play' = pelivaihe
var celebrating = false;
var celebrateT = 0;
var celebrateReturnId = 0;
var lastTime = 0;
var globalT = 0;

// ---------- Pelin sisältö ----------
var STAR_COUNT = 10;
var BUNNY_COUNT = 3;

// fx = kohta maailman leveydestä, fy = korkeus polun yläpuolella (osuus ruudun korkeudesta),
// jotta tähdet pysyvät aina yksisarvisen ulottuvilla kaikilla ruuduilla.
// Ryppäinä, joiden välissä on tyhjiä rauhallisia osuuksia
var starDefs = [
  { fx: 0.07, fy: 0.06 }, { fx: 0.12, fy: 0.14 }, { fx: 0.16, fy: 0.08 },
  { fx: 0.26, fy: 0.18 }, { fx: 0.31, fy: 0.10 }, { fx: 0.36, fy: 0.16 },
  { fx: 0.48, fy: 0.07 }, { fx: 0.59, fy: 0.15 }, { fx: 0.79, fy: 0.09 },
  { fx: 0.88, fy: 0.13 }
];
function starY(def) { return groundTop - def.fy * viewH - viewH * 0.10; }
var bushDefs = [
  { fx: 0.18 }, { fx: 0.52 }, { fx: 0.85 }
];

// Taikaportit: aukeavat vain toistamalla väriloitsu (katso järjestys, napauta perässä)
var ORB_COLORS = ['#ff5f7e', '#ffe94f', '#5fa8ff', '#6fd66f'];
var ORB_NOTES = [523, 659, 784, 1047];
function makeGate(fx, seqLen, orbCount) {
  return {
    fx: fx, x: 0, seqLen: seqLen, orbs: orbCount, opened: false,
    mode: 'idle',   // idle | show | input | opening | done
    seq: [], inputIdx: 0, timer: 0,
    litOrb: -1, litT: 0, shakeT: 0, lastShown: -1
  };
}
var gates = [];
var activeGate = null;
function spellActive() {
  return !!activeGate &&
    (activeGate.mode === 'show' || activeGate.mode === 'input' || activeGate.mode === 'opening');
}

// Pienet tehtävät (lasku, muisti). Sama idea kuin taikaportit: pysäyttää ja avaa tien.
var TASK_BF_COLORS = ['#ff7bac', '#ffd24f', '#7fd4ff'];
var TASK_BF_NOTES = [523, 659, 784];
var TASK_GLYPH_KINDS = ['flower', 'star', 'heart'];
function makeTask(fx, type) {
  return {
    fx: fx, x: 0, type: type, opened: false,
    mode: 'idle',
    timer: 0, shakeT: 0, litT: 0,
    a: 1, b: 1, answers: [2, 1, 3], correct: 2,
    seq: [], inputIdx: 0, litOrb: -1, lastShown: -1,
    prompt: null, choices: null, glyph: 'flower'
  };
}
var tasks = [];
var activeTask = null;
function taskActive() {
  return !!activeTask &&
    (activeTask.mode === 'show' || activeTask.mode === 'input' || activeTask.mode === 'opening');
}
function puzzleBusy() {
  return spellActive() || taskActive();
}

// Myrskypilvet tiputtavat salamapisaroita; osuma sirottaa kerättyjä tähtiä
var clouds = [];
var drops = [];
var invulnT = 0;

// Peikko partioi loppumatkalla ja varastaa pupun, jos jää kiinni
var troll = { zA: 0.56, zB: 0.70, x: 0, dir: 1, cooldown: 0, bounceT: 0, stillT: 0 };
var holding = false;

// Maali: kun kaikki on kerätty, linnan ylle syttyy majakkatähti ja
// juhla alkaa vasta kun ratsastaa linnalle asti.
var goalReady = false;

var stars = [];    // {x,y,collected,twinkle}
var bunnies = [];  // {bushX, x,y, state:'hidden'|'found', hopT, earT}
var particles = [];
var confetti = [];
var tapRing = null; // {x,y,t}

var unicorn = {
  x: 0, y: 0, tx: 0, ty: 0,
  speed: 265, facing: 1, moving: false, walkPhase: 0
};
var camX = 0;

var level = 1;
var BUTTERFLY_COUNT = 10;
var butterflyDefs = [
  { fx: 0.12, fy: 0.22 }, { fx: 0.18, fy: 0.40 },
  { fx: 0.30, fy: 0.52 }, { fx: 0.38, fy: 0.28 },
  { fx: 0.48, fy: 0.44 }, { fx: 0.55, fy: 0.20 },
  { fx: 0.64, fy: 0.54 }, { fx: 0.74, fy: 0.36 },
  { fx: 0.86, fy: 0.48 }, { fx: 0.93, fy: 0.22 }
];
var platforms = [];
var princess = {
  x: 0, y: 0, vx: 0, vy: 0,
  facing: 1, onGround: true, walkPhase: 0, coyote: 0
};
var butterflies = [];
var sparks = [];
var owl = { x: 0, y: 0, awake: false, flyT: 0 };
var PICKUP_COUNT = 8;
var iceDefs = [
  { fx: 0.12, fy: 0.14 }, { fx: 0.22, fy: 0.24 }, { fx: 0.34, fy: 0.10 },
  { fx: 0.46, fy: 0.20 }, { fx: 0.58, fy: 0.12 }, { fx: 0.70, fy: 0.26 },
  { fx: 0.82, fy: 0.16 }, { fx: 0.92, fy: 0.22 }
];
var pondDefs = [
  { fx: 0.14, fy: 0.22 }, { fx: 0.24, fy: 0.38 }, { fx: 0.36, fy: 0.18 },
  { fx: 0.48, fy: 0.42 }, { fx: 0.58, fy: 0.20 }, { fx: 0.70, fy: 0.48 },
  { fx: 0.82, fy: 0.28 }, { fx: 0.92, fy: 0.16 }
];
var skyDefs = [
  { fx: 0.12, fy: 0.42 }, { fx: 0.24, fy: 0.28 }, { fx: 0.36, fy: 0.50 },
  { fx: 0.48, fy: 0.22 }, { fx: 0.60, fy: 0.46 }, { fx: 0.72, fy: 0.30 },
  { fx: 0.84, fy: 0.52 }, { fx: 0.94, fy: 0.24 }
];
var flakes = [];
var pearls = [];
var moons = [];
var snowballs = [];
var gusts = [];
var fox = { x: 0, y: 0, dir: 1, bounceT: 0, stillT: 0, cooldown: 0 };
var frog = { x: 0, y: 0, awake: false, hopT: 0 };
var sheep = { x: 0, y: 0, awake: false, flyT: 0 };
var holdWorldX = 0;
var holdStartG = 0;
var holdSX = 0, holdSY = 0;
var holdMoved = false;
var lastPX = 0, lastPY = 0;

// Karttalabyrintti: merkit . polku, # seinä, S alku, G linna.
// Seikkailut 1 2 b c d ovat portteja: niistä on kuljettava, jotta tie jatkuu.
var HUB_MAP = [
  '#############',
  '#S.........1#',
  '###########.#',
  '#2..........#',
  '#.###########',
  '#..........b#',
  '###########.#',
  '#G....d...c.#',
  '#############'
];
var HUB_ROOMS = {
  '1': { kind: 'start', name: 'Metsä', color: '#5dbe5a' },
  '2': { kind: 'garden', name: 'Puutarha', color: '#8a5cff' },
  'b': { kind: 'ice', name: 'Jää', color: '#8ecbff' },
  'c': { kind: 'pond', name: 'Lampi', color: '#3ecfb0' },
  'd': { kind: 'sky', name: 'Taivas', color: '#7a5cff' }
};
var HUB_ORDER = ['start', 'garden', 'ice', 'pond', 'sky'];
var hubCleared = {};
var hubPlaying = null;
var hubApproach = null;
var hubPawn = { c: 1, r: 1, x: 0, y: 0, facing: 1, walkPhase: 0, path: [] };
var hubToast = { kind: '', t: 0 };

