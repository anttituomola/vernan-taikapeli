'use strict';

// Edistymisen tallennus, sydämet ja tarkistuspisteet.
// Sydämet ovat käytössä vain kentissä, joiden PHASES-rivillä on usesHearts: true.

// ---------- Tallennus ----------
var PROGRESS_KEY = 'vt_progress_v1';
var finaleDone = false;
var rainbowShown = 0;   // montako sateenkaaren väriä on jo paljastettu saaristokartalla
var lastIsland = 1;     // viimeksi vierailtu saari (maailma)

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ cleared: hubCleared, finaleDone: finaleDone, rainbowShown: rainbowShown, lastIsland: lastIsland }));
  } catch (e) { /* yksityinen tila tms: pelataan ilman tallennusta */ }
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return;
    var d = JSON.parse(raw);
    if (d && d.cleared && typeof d.cleared === 'object') hubCleared = d.cleared;
    finaleDone = !!(d && d.finaleDone);
    rainbowShown = (d && d.rainbowShown) | 0;
    lastIsland = ((d && d.lastIsland) | 0) || 1;
  } catch (e) { /* rikkinäinen tallennus: aloitetaan alusta */ }
}

function resetProgress() {
  hubCleared = {};
  finaleDone = false;
  rainbowShown = 0;
  lastIsland = 1;
  saveProgress();
}

// ---------- Sydämet ----------
var HEART_MAX = 3;
var hearts = HEART_MAX;
var hurtT = 0;        // osumasuoja-aika
var hurtFlash = 0;    // punainen välähdys ruudulla
var checkpoints = []; // {fx, x, lit}
var checkpoint = { x: 0, y: 0 };
var sectionItems = []; // tarkistuspisteen jälkeen kerätyt: palautetaan, jos sydämet loppuvat

function heartsOn() {
  return !!phaseNow().usesHearts;
}

function heartsReset() {
  hearts = HEART_MAX;
  hurtT = 0;
  hurtFlash = 0;
  sectionItems = [];
}

function updateHearts(dt) {
  if (hurtT > 0) hurtT -= dt;
}

// Kerätty esine muistetaan, jotta se voidaan palauttaa sydänten loputtua.
// item.collected = true asetetaan kutsujan puolella; item.onRestore(item) on
// vapaaehtoinen koukku, jolla esine palautetaan alkupaikalleen.
function registerCollected(item) {
  if (heartsOn()) sectionItems.push(item);
}

function makeCheckpoints(fxs) {
  var i;
  checkpoints = [];
  for (i = 0; i < fxs.length; i++) {
    checkpoints.push({ fx: fxs[i], x: fxs[i] * worldW, lit: false });
  }
}

function setCheckpoint(cp, x, y) {
  cp.lit = true;
  checkpoint.x = x;
  checkpoint.y = y;
  sectionItems = [];
  hearts = HEART_MAX;
  spawnSparkles(cp.x, groundTop - viewH * 0.16, 14, '#ffe27a');
  playNote(659, 0, 0.18, 'triangle', 0.35);
  playNote(988, 0.1, 0.3, 'triangle', 0.35);
}

// Kutsutaan kentän update-silmukasta: sytyttää lyhdyn, kun hahmo kulkee siitä.
function updateCheckpoints(actorX, actorY) {
  var i;
  for (i = 0; i < checkpoints.length; i++) {
    if (!checkpoints[i].lit && Math.abs(actorX - checkpoints[i].x) < viewH * 0.06) {
      setCheckpoint(checkpoints[i], checkpoints[i].x, actorY);
    }
  }
}

function loseHeart() {
  if (!heartsOn() || hurtT > 0 || celebrating || puzzleBusy()) return false;
  hearts -= 1;
  hurtT = 1.5;
  hurtFlash = 0.35;
  playNote(300, 0, 0.15, 'sawtooth', 0.3);
  playNote(200, 0.12, 0.25, 'sawtooth', 0.3);
  if (hearts <= 0) failSection();
  return true;
}

// Sydämet loppu: tarkistuspisteen jälkeen kerätyt esineet palautuvat ja
// hahmo palaa lyhdylle. Kenttä itse ei ala alusta.
function failSection() {
  var i, it;
  for (i = 0; i < sectionItems.length; i++) {
    it = sectionItems[i];
    it.collected = false;
    if (it.onRestore) it.onRestore(it);
  }
  sectionItems = [];
  hearts = HEART_MAX;
  hurtT = 2.0;
  hurtFlash = 0.8;
  playNote(262, 0, 0.3, 'triangle', 0.35);
  playNote(196, 0.25, 0.55, 'triangle', 0.35);
  var p = phaseNow();
  if (p.respawn) p.respawn();
}

// ---------- Piirto ----------
function drawHeartShape(c, x, y, s, filled) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
  c.fillStyle = filled ? '#ff4f7e' : 'rgba(255,255,255,0.35)';
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = Math.max(1.5, s * 0.14);
  c.stroke();
}

function drawHearts(c) {
  if (!heartsOn()) return;
  var s = viewH * 0.028;
  var cx = viewW / 2;
  var y = viewH * 0.055;
  var i;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, cx - s * 4.6, y - s * 1.4, s * 9.2, s * 2.9, s);
  c.fill();
  for (i = 0; i < HEART_MAX; i++) {
    var pulse = (i === hearts - 1 && hurtT > 1.0) ? 1 + Math.sin(globalT * 25) * 0.15 : 1;
    drawHeartShape(c, cx + (i - 1) * s * 2.8, y, s * pulse, i < hearts);
  }
}

function drawHurtFlash(c) {
  if (hurtFlash <= 0) return;
  c.fillStyle = 'rgba(255,60,80,' + (0.32 * Math.min(1, hurtFlash / 0.35)) + ')';
  c.fillRect(0, 0, viewW, viewH);
}

// Tarkistuspiste-lyhty: sammunut = harmaa, sytytetty = hehkuva
function drawLantern(c, cp, baseY) {
  var x = cp.x - camX;
  var s = viewH * 0.05;
  if (x < -s * 3 || x > viewW + s * 3) return;
  var top = baseY - s * 2.6;
  c.fillStyle = '#5a4a6e';
  c.fillRect(x - s * 0.08, top, s * 0.16, s * 2.6);
  c.fillRect(x - s * 0.45, baseY - s * 0.14, s * 0.9, s * 0.14);
  if (cp.lit) {
    var g = c.createRadialGradient(x, top, s * 0.1, x, top, s * 1.6);
    g.addColorStop(0, 'rgba(255,230,140,0.75)');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, top, s * 1.6, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#7a6a8e';
  roundRect(c, x - s * 0.34, top - s * 0.55, s * 0.68, s * 0.8, s * 0.12);
  c.fill();
  c.fillStyle = cp.lit ? '#ffe27a' : '#3a3346';
  roundRect(c, x - s * 0.22, top - s * 0.42, s * 0.44, s * 0.55, s * 0.08);
  c.fill();
  if (cp.lit) {
    c.fillStyle = '#fff6c8';
    c.beginPath();
    c.arc(x, top - s * 0.12 + Math.sin(globalT * 6) * s * 0.03, s * 0.1, 0, Math.PI * 2);
    c.fill();
  }
}
