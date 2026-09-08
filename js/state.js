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
var mode = 'hub';          // 'sea' = saaristokartta, 'hub' = saaren sokkelo, 'play' = pelivaihe
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

// Pienet tehtävät (lasku, muisti, kuvio, rytmi...). Sama idea kuin taikaportit:
// pysäyttää ja avaa tien. opts: { seqLen, orbs } muistitehtävän pituus ja värien määrä.
var TASK_BF_COLORS = ['#ff7bac', '#ffd24f', '#7fd4ff', '#8fe38f'];
var TASK_BF_NOTES = [523, 659, 784, 988];
var TASK_GLYPH_KINDS = ['flower', 'star', 'heart'];
function makeTask(fx, type, opts) {
  opts = opts || {};
  return {
    fx: fx, x: 0, type: type, opened: false,
    mode: 'idle',
    timer: 0, shakeT: 0, litT: 0,
    seq: [], inputIdx: 0, litOrb: -1, lastShown: -1,
    seqLen: opts.seqLen || 3, orbs: opts.orbs || 3, pairs: opts.pairs || 3,
    regenT: 0,
    word: null, sayT: -1, maxSyl: opts.maxSyl || 3,
    mixLevel: opts.mixLevel || 1,
    presetWord: opts.presetWord || null,
    // Tyypin oma ongelmadata: make(t) palauttaa sen, runtime asettaa t.data:han.
    // Rungon kentät (yllä) ovat kaikkien tyyppien yhteisiä; tyypin omat
    // kentät (answers, choices, pieces, grid...) elävät vain t.data:ssa.
    data: null
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

// Tehtävätyyppien rekisteri: jokainen tyyppi on pieni moduuli sauman takana:
//   { make, draw, tap?, update?, start?, regen?, pitch?, showMode?, replaceShow?, drag? }
// Rekisteröinnit asuvat kunkin tyypin omassa tasks-*.js-tiedostossa;
// ajonaikainen silmukka (taskStart / handleTaskTap / updateTasks) on tasks-core.js:ssä.
var TASK_TYPES = {};

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

// Sokkeloiden kartat, huoneet ja järjestys (HUB_WORLDS) johdetaan
// js/worlds.js:n WORLDS-rekisteristä. Alla vain ajonaikainen sokkelotila.
var hubWorld = 1;
function hubMap() { return (HUB_WORLDS[hubWorld] || HUB_WORLDS[1]).map; }
function hubRooms() { return (HUB_WORLDS[hubWorld] || HUB_WORLDS[1]).rooms; }
function hubOrder() { return (HUB_WORLDS[hubWorld] || HUB_WORLDS[1]).order; }
function hubRoomByKind(kind) {
  var w, ch, rooms;
  for (w in HUB_WORLDS) {
    rooms = HUB_WORLDS[w].rooms;
    for (ch in rooms) if (rooms[ch].kind === kind) return rooms[ch];
  }
  return null;
}
var hubCleared = {};
var hubPlaying = null;
var hubApproach = null;
var hubPawn = { c: 1, r: 1, x: 0, y: 0, facing: 1, walkPhase: 0, path: [] };
var hubToast = { kind: '', t: 0 };
// Puhekupla läpäistyn huoneen tai linnan kohdalla: { c, r, items: [{ act: 'replay'|'boat', kind }] }
var hubOffer = null;

