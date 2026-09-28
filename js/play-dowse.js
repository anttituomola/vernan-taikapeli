'use strict';

// Aarrevarpu (Kaukamaa, Aurinkodyynit): uusi verbi ETSINTÄ. Hiekkamyrsky
// hautasi karavaanin aarrearkut. Prinsessan taikavarpu seuraa sormea hiekan
// yllä, ja sen kärki jättää hehkuvan jäljen: sininen on kylmä, keltainen
// lämmin ja kultainen kuuma (aarre on lähellä). Kun sormi pysyy paikallaan
// hetken, aavikkokettu Fenni juoksee paikalle ja kaivaa. Kaivuja on rajallisesti
// (tassut HUD:ssa): jos ne loppuvat ennen kuin kaikki arkut löytyvät, tuuli
// peittää kuopat ja aarteet hautautuvat uusiin paikkoihin. Hiekassa piileskelee
// skorpioneja: varpu värisee ja jälki punertuu niiden lähellä, ja skorpionin
// kohdalle kaivaminen vie sydämen. Neljä kovenevaa kierrosta: enemmän arkkuja
// ja skorpioneja, lyhyempi lämmön kantama, viimeisellä kierroksella tuulenpuuskat
// pyyhkivät jäljen. Säästyneet kaivut muuttuvat aurinkokiviksi (bonus).
// Tehtävät 2. ja 3. kierroksen jälkeen.

// chests: arkkuja, spare: ylimääräisiä kaivuja, scorp: skorpioneja, range: lämmön
// kantama × viewW, gust: tuulenpuuskan väli (s, 0 = ei tuulta)
var DOWSE_ROUNDS = [
  { chests: 1, spare: 3, scorp: 0, range: 0.55, gust: 0 },
  { chests: 2, spare: 3, scorp: 1, range: 0.45, gust: 0 },
  { chests: 2, spare: 2, scorp: 2, range: 0.4, gust: 0 },
  { chests: 3, spare: 2, scorp: 3, range: 0.36, gust: 7 }
];
var DOWSE_HIT = 0.08;       // kaivu löytää arkun tämän säteen sisältä × viewH
var DOWSE_SCORP_R = 0.075;  // skorpionin pistosäde × viewH
var DOWSE_SENSE = 0.2;      // varpu aistii skorpionin tältä etäisyydeltä × viewH
var DOWSE_STILL = 0.65;     // paikallaan pito ennen kaivua (s)
var DOWSE_DIG_T = 0.7;      // ketun kaivuanimaatio (s)
var DOWSE_TRAIL_LIFE = 7;   // jäljen hehkun kesto (s)

var dowse = {
  round: 0, state: 'intro', t: 0, R: null, chests: [], scorps: [], holes: [], trail: [],
  digsLeft: 0, found: 0, rod: { x: 0, y: 0, on: false, heat: 0, danger: 0 },
  stillT: 0, stillX: 0, stillY: 0, armed: true, fox: null, bonus: 0, gustT: 0, gust: 0,
  tickT: 0, hintT: 0, dug: false, taskDelay: -1, deco: []
};

function dowseArea() {
  return { x0: viewW * 0.2, x1: viewW * 0.95, y0: viewH * 0.3, y1: viewH * 0.93 };
}
function dowseRandPos(avoid, minD) {
  var A = dowseArea(), i, x, y, ok, tries = 0, k;
  do {
    x = A.x0 + viewH * 0.08 + Math.random() * (A.x1 - A.x0 - viewH * 0.16);
    y = A.y0 + viewH * 0.08 + Math.random() * (A.y1 - A.y0 - viewH * 0.16);
    ok = true;
    for (k = 0; k < avoid.length; k++) {
      if (Math.hypot(x - avoid[k].x, y - avoid[k].y) < minD) { ok = false; break; }
    }
    tries++;
  } while (!ok && tries < 200);
  return { x: x, y: y };
}

// ---------- Kierros ----------
function dowseStartRound() {
  var R = DOWSE_ROUNDS[dowse.round], i, h = viewH, all = [], p;
  dowse.R = R;
  dowse.chests = [];
  dowse.scorps = [];
  dowse.holes = [];
  dowse.trail = [];
  for (i = 0; i < R.chests; i++) {
    p = dowseRandPos(all, viewW * 0.22);
    p.found = false; p.t = 0; p.open = 0;
    dowse.chests.push(p);
    all.push(p);
  }
  // Skorpionit aarteiden lähelle (mutta eivät päälle), jotta jälki pitää lukea tarkkaan
  for (i = 0; i < R.scorp; i++) {
    var base = dowse.chests[i % dowse.chests.length], ang, tries = 0;
    do {
      ang = Math.random() * Math.PI * 2;
      var d = h * (0.2 + Math.random() * 0.12);
      p = { x: base.x + Math.cos(ang) * d, y: base.y + Math.sin(ang) * d * 0.8 };
      tries++;
    } while (tries < 60 && (!dowseInArea(p) || dowse.chests.some(function (c) { return Math.hypot(c.x - p.x, c.y - p.y) < h * 0.18; }) || dowse.scorps.some(function (s) { return Math.hypot(s.x - p.x, s.y - p.y) < h * 0.2; })));
    p.out = 0; p.gone = false;
    dowse.scorps.push(p);
  }
  dowse.digsLeft = R.chests + R.spare;
  dowse.gen = (dowse.gen || 0) + 1;
  dowse.found = 0;
  dowse.gustT = R.gust ? R.gust : 0;
  dowse.gust = 0;
  dowse.state = 'play';
  dowse.t = 0;
  dowse.armed = true;
  dowse.stillT = 0;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}
function dowseInArea(p) {
  var A = dowseArea(), m = viewH * 0.06;
  return p.x > A.x0 + m && p.x < A.x1 - m && p.y > A.y0 + m && p.y < A.y1 - m;
}

// Lämpö 0..1 lähimmän löytymättömän arkun mukaan (1 = kaivu löytäisi arkun),
// vaara 0..1 lähimmän skorpionin mukaan
function dowseHeat(x, y) {
  var i, c, d, best = 0, R = dowse.R;
  for (i = 0; i < dowse.chests.length; i++) {
    c = dowse.chests[i];
    if (c.found) continue;
    d = Math.hypot(x - c.x, y - c.y);
    if (d < DOWSE_HIT * viewH) return 1;
    best = Math.max(best, Math.max(0, 1 - d / (R.range * viewW)) * 0.95);
  }
  return best;
}
function dowseDanger(x, y) {
  var i, s, d, best = 0;
  for (i = 0; i < dowse.scorps.length; i++) {
    s = dowse.scorps[i];
    if (s.gone) continue;
    d = Math.hypot(x - s.x, y - s.y);
    best = Math.max(best, Math.max(0, 1 - d / (DOWSE_SENSE * viewH)));
  }
  return best;
}
// Viisi selkeää lämpövyöhykettä: kylmä, viileä, lämmin, kuuma ja polttava
// (polttava = juuri tästä kaivamalla arkku löytyy)
function dowseHeatColor(k) {
  if (k >= 1) return '#ffffff';
  if (k > 0.6) return '#ff9a20';
  if (k > 0.4) return '#ffe060';
  if (k > 0.2) return '#7fe0c8';
  return '#6aa8ff';
}

// ---------- Alustus ----------
function initDowse() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'compare')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  dowse.round = 0;
  dowse.state = 'intro';
  dowse.t = 0;
  dowse.R = DOWSE_ROUNDS[0];
  dowse.chests = [];
  dowse.scorps = [];
  dowse.holes = [];
  dowse.trail = [];
  dowse.bonus = 0;
  dowse.dug = false;
  dowse.hintT = 0;
  dowse.taskDelay = -1;
  dowse.fox = { x: viewW * 0.12, y: viewH * 0.9, tx: viewW * 0.12, ty: viewH * 0.9, state: 'sit', t: 0, facing: 1, target: null };
  dowse.deco = [];
  // Koristeet kaivualueen ulkopuolella (vasen reuna ja taivaanranta)
  for (i = 0; i < 4; i++) dowse.deco.push({ kind: i % 2 ? 'rock' : 'cactus', x: viewW * [0.04, 0.5, 0.8, 0.17][i], y: viewH * [0.52, 0.26, 0.25, 0.97][i], wig: 0 });
  renderBackground();
}
function respawnDowse() {
  // Sydämet loppu: kierros alkaa alusta uusin paikoin
  dowseStartRound();
}
function resizeDowse() { camX = 0; }

function handleDowseTap(px, py) {
  var i, d;
  dowse.armed = true;
  dowse.stillT = 0;
  dowse.stillX = px; dowse.stillY = py;
  // Koristeet reagoivat napautukseen
  for (i = 0; i < dowse.deco.length; i++) {
    d = dowse.deco[i];
    if (Math.hypot(px - d.x, py - d.y) < viewH * 0.08) {
      d.wig = 0.5;
      playNote(d.kind === 'rock' ? 180 : 880, 0, 0.1, 'triangle', 0.25);
      if (d.kind === 'cactus') spawnSparkles(d.x, d.y - viewH * 0.08, 6, '#ff8ad8');
    }
  }
  var f = dowse.fox;
  if (f && Math.hypot(px - f.x, py - (f.y - viewH * 0.04)) < viewH * 0.07 && f.state === 'sit') {
    f.state = 'hop'; f.t = 0;
    playNote(988, 0, 0.08, 'sine', 0.25);
    playNote(1319, 0.06, 0.1, 'sine', 0.2);
  }
}

// ---------- Kaivu ----------
function dowseStartDig(x, y) {
  var f = dowse.fox;
  f.target = { x: x, y: y };
  f.tx = x - viewH * 0.05;
  f.ty = y + viewH * 0.02;
  f.facing = f.tx >= f.x ? 1 : -1;
  f.state = 'run';
  f.t = 0;
  dowse.armed = false;
  dowse.dug = true;
  playNote(740, 0, 0.06, 'sine', 0.2);
}
function dowseResolveDig() {
  var f = dowse.fox, x = f.target.x, y = f.target.y, h = viewH, i, c, s, hit = null, R = dowse.R, gen = dowse.gen;
  dowse.digsLeft--;
  // Skorpioni ensin: pisto vie sydämen, mutta kaivu voi silti löytää arkun
  for (i = 0; i < dowse.scorps.length; i++) {
    s = dowse.scorps[i];
    if (s.gone) continue;
    if (Math.hypot(x - s.x, y - s.y) < DOWSE_SCORP_R * h) {
      s.gone = true;
      s.out = 1.2;
      artShakeStart(h * 0.01, 0.3);
      spawnSparkles(s.x, s.y, 10, '#c0402a');
      playNote(220, 0, 0.15, 'sawtooth', 0.15);
      loseHeart();
      // Sydämet loppuivat: kierros alkoi alusta
      if (dowse.gen !== gen) return;
    }
  }
  for (i = 0; i < dowse.chests.length; i++) {
    c = dowse.chests[i];
    if (!c.found && Math.hypot(x - c.x, y - c.y) < DOWSE_HIT * h) { hit = c; break; }
  }
  if (hit) {
    hit.found = true;
    hit.t = 0;
    dowse.found++;
    artPop(hit.x, hit.y, h * 0.08, '#ffd24f', 'burst');
    spawnSparkles(hit.x, hit.y - h * 0.04, 22, '#ffd24f');
    playNote(784, 0, 0.1, 'triangle', 0.35);
    playNote(1047, 0.1, 0.12, 'triangle', 0.35);
    playNote(1568, 0.2, 0.25, 'triangle', 0.35);
    // Löydetyn arkun lämpö katoaa jäljestä
    dowseRewarmTrail();
  } else {
    // Tyhjä kuoppa muistaa lämmön, jotta siitä voi päätellä suunnan
    dowse.holes.push({ x: x, y: y, heat: dowseHeat(x, y), t: 0 });
    spawnDust(x, y, 8, 0);
    playNote(262, 0, 0.12, 'triangle', 0.22);
  }
  if (dowse.found >= R.chests) {
    dowse.state = 'roundDone';
    dowse.t = 0;
    // Säästyneet kaivut aurinkokiviksi
    dowse.bonusNow = dowse.digsLeft;
    if (dowse.round === 1 || dowse.round === 2) dowse.taskDelay = 1.8;
    return;
  }
  if (dowse.digsLeft <= 0) {
    dowse.state = 'buried';
    dowse.t = 0;
    playNote(330, 0, 0.3, 'triangle', 0.3);
    playNote(247, 0.25, 0.5, 'triangle', 0.3);
  }
}
function dowseRewarmTrail() {
  var i, p;
  for (i = 0; i < dowse.trail.length; i++) {
    p = dowse.trail[i];
    p.heat = dowseHeat(p.x, p.y);
  }
  for (i = 0; i < dowse.holes.length; i++) dowse.holes[i].heat = dowseHeat(dowse.holes[i].x, dowse.holes[i].y);
}

// ---------- Päivitys ----------
function updateDowse(dt) {
  var busy, i, f = dowse.fox, rod = dowse.rod, h = viewH, W = viewW, A = dowseArea(), k;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  for (i = 0; i < dowse.deco.length; i++) if (dowse.deco[i].wig > 0) dowse.deco[i].wig -= dt;
  for (i = 0; i < dowse.chests.length; i++) {
    var ch = dowse.chests[i];
    if (ch.found) { ch.t += dt; ch.open = Math.min(1, ch.t / 0.5); }
  }
  for (i = 0; i < dowse.scorps.length; i++) if (dowse.scorps[i].out > 0) dowse.scorps[i].out -= dt;
  dowseUpdateFox(dt);
  if (dowse.taskDelay > 0 && !busy) {
    dowse.taskDelay -= dt;
    if (dowse.taskDelay <= 0) {
      if (dowse.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (dowse.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) { rod.on = false; return; }
  dowse.t += dt;
  if (dowse.state === 'intro') { if (dowse.t > 0.8) dowseStartRound(); return; }
  if (dowse.state === 'buried') {
    // Tuuli peittää kuopat, aarteet hautautuvat uusiin paikkoihin
    if (dowse.t > 1.8) dowseStartRound();
    return;
  }
  if (dowse.state === 'roundDone') {
    // Säästyneet kaivut lentävät aurinkokivinä HUD:iin yksi kerrallaan
    if (dowse.bonusNow > 0 && dowse.t > 0.9) {
      dowse.bonusNow--;
      dowse.digsLeft--;
      dowse.bonus++;
      dowse.t = 0.6;
      spawnSparkles(hudX() + h * 0.4, h * 0.06, 8, '#ffd24f');
      playNote(1319 + dowse.bonus * 30, 0, 0.1, 'sine', 0.3);
    }
    if (dowse.bonusNow <= 0 && dowse.t > 2.0 && dowse.taskDelay <= 0) {
      dowse.round++;
      if (dowse.round >= DOWSE_ROUNDS.length) { dowse.state = 'won'; dowse.t = 0; soundFanfare(); }
      else dowseStartRound();
    }
    return;
  }
  if (dowse.state === 'won') { if (dowse.t > 1.6) startCelebration(); return; }

  // Tuulenpuuska pyyhkii jäljen
  if (dowse.R.gust) {
    dowse.gustT -= dt;
    if (dowse.gustT <= 0) {
      dowse.gustT = dowse.R.gust * (0.8 + Math.random() * 0.4);
      dowse.gust = 1.2;
      playNote(200, 0, 0.5, 'sine', 0.08);
    }
  }
  if (dowse.gust > 0) {
    dowse.gust -= dt;
    for (i = 0; i < dowse.trail.length; i++) { dowse.trail[i].x += W * 0.02 * dt; dowse.trail[i].t -= dt * 4; }
  }
  // Jälki haalistuu
  for (i = dowse.trail.length - 1; i >= 0; i--) {
    if (globalT - dowse.trail[i].t > DOWSE_TRAIL_LIFE) dowse.trail.splice(i, 1);
  }
  if (!dowse.dug) dowse.hintT += dt;

  // Varpu seuraa sormea hiekan yllä
  rod.on = holding && lastPX > A.x0 - h * 0.05 && lastPX < A.x1 + h * 0.05 && lastPY > A.y0 - h * 0.05 && lastPY < A.y1 + h * 0.05;
  if (rod.on) {
    rod.x = Math.max(A.x0, Math.min(A.x1, lastPX));
    rod.y = Math.max(A.y0, Math.min(A.y1, lastPY));
    rod.heat = dowseHeat(rod.x, rod.y);
    rod.danger = dowseDanger(rod.x, rod.y);
    var last = dowse.trail[dowse.trail.length - 1];
    if (!last || Math.hypot(last.x - rod.x, last.y - rod.y) > h * 0.022) {
      dowse.trail.push({ x: rod.x, y: rod.y, heat: rod.heat, danger: rod.danger, t: globalT });
      if (dowse.trail.length > 400) dowse.trail.shift();
    }
    // Äänimerkki: tahti tihenee lämmön mukaan, vaara surisee
    dowse.tickT -= dt;
    if (dowse.tickT <= 0) {
      dowse.tickT = 0.55 - rod.heat * 0.45;
      playNote(440 + rod.heat * 660, 0, 0.05, 'sine', 0.12 + rod.heat * 0.1);
      if (rod.danger > 0.3) playNote(150, 0, 0.08, 'sawtooth', 0.05 + rod.danger * 0.06);
    }
    // Paikallaan pito kaivaa
    if (Math.hypot(lastPX - dowse.stillX, lastPY - dowse.stillY) > h * 0.03) {
      dowse.stillX = lastPX; dowse.stillY = lastPY; dowse.stillT = 0; dowse.armed = true;
    } else if (dowse.armed && f.state !== 'run' && f.state !== 'dig') {
      dowse.stillT += dt;
      if (dowse.stillT >= DOWSE_STILL) dowseStartDig(rod.x, rod.y);
    }
  } else {
    dowse.stillT = 0;
  }
  for (i = 0; i < dowse.holes.length; i++) dowse.holes[i].t += dt;
}

function dowseUpdateFox(dt) {
  var f = dowse.fox, dx, dy, d, sp = viewW * 1.1;
  if (!f) return;
  f.t += dt;
  if (f.state === 'run') {
    dx = f.tx - f.x; dy = f.ty - f.y; d = Math.hypot(dx, dy);
    if (d < sp * dt) { f.x = f.tx; f.y = f.ty; f.state = 'dig'; f.t = 0; }
    else { f.x += dx / d * sp * dt; f.y += dy / d * sp * dt; }
  } else if (f.state === 'dig') {
    if (Math.random() < dt * 20) spawnDust(f.target.x, f.target.y, 1, f.facing);
    if (f.t >= DOWSE_DIG_T) {
      f.state = 'sit';
      f.t = 0;
      if (dowse.state === 'play') dowseResolveDig();
    }
  } else if (f.state === 'hop') {
    if (f.t > 0.5) { f.state = 'sit'; f.t = 0; }
  }
}

// ---------- Piirto ----------
function renderDowseBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x, y, A;
  g.addColorStop(0, '#6fcbe8');
  g.addColorStop(0.3, '#ffe2b0');
  g.addColorStop(1, '#f0c078');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.12, h * 0.1, h * 0.06, 0.1, '#fff0b0', '#fffbe8', '#ffd24f');
  // Kaukaiset dyynit
  b.fillStyle = artMix('#f0b878', '#ffe2b0', 0.4);
  b.beginPath(); b.moveTo(0, h * 0.3);
  for (x = 0; x <= vw; x += vw / 20) b.lineTo(x, h * (0.26 - Math.sin(x / vw * 7) * 0.03));
  b.lineTo(vw, h * 0.32); b.lineTo(0, h * 0.32); b.closePath(); b.fill();
  // Kaivualue: pehmeä hiekka
  A = { x0: vw * 0.2, x1: vw * 0.95, y0: h * 0.3, y1: h * 0.93 };
  g = b.createLinearGradient(0, A.y0, 0, A.y1);
  g.addColorStop(0, '#f7d696');
  g.addColorStop(1, '#eab86a');
  b.fillStyle = g;
  roundRect(b, A.x0 - h * 0.03, A.y0 - h * 0.02, A.x1 - A.x0 + h * 0.06, A.y1 - A.y0 + h * 0.04, h * 0.06);
  b.fill();
  b.strokeStyle = 'rgba(160,100,40,0.35)';
  b.lineWidth = Math.max(2, h * 0.006);
  b.setLineDash([h * 0.02, h * 0.015]);
  b.stroke();
  b.setLineDash([]);
  // Väreet
  b.strokeStyle = 'rgba(190,130,60,0.22)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 40; i++) {
    x = A.x0 + (A.x1 - A.x0) * ((i * 0.618) % 1);
    y = A.y0 + (A.y1 - A.y0) * ((i * 0.377 + 0.1) % 1);
    b.beginPath(); b.moveTo(x - h * 0.03, y); b.quadraticCurveTo(x, y - h * 0.01, x + h * 0.03, y); b.stroke();
  }
  // Karavaanin rikkinäinen vankkuri vasemmalla
  artRoundRect(b, vw * 0.02, h * 0.34, h * 0.2, h * 0.08, h * 0.02, '#b07840', { lineColor: '#6a4a28' });
  artCircle(b, vw * 0.02 + h * 0.05, h * 0.43, h * 0.035, '#8a5a30', { lineColor: '#4a3018' });
  b.save();
  b.translate(vw * 0.02 + h * 0.16, h * 0.44);
  b.rotate(0.8);
  artBlob(b, 0, 0, h * 0.035, h * 0.012, '#8a5a30', { lineColor: '#4a3018' });
  b.restore();
}

function drawDowseChest(c, x, y, s, open) {
  artShadow(c, x, y + s * 0.4, s * 0.7, s * 0.15);
  if (open > 0) artGlow(c, x, y - s * 0.2, s * (1 + open), '#ffe27a', 0.5 * open);
  artRoundRect(c, x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.7, s * 0.12, '#b8742a', { lineColor: '#6a3a10' });
  c.fillStyle = '#ffd24f';
  c.fillRect(x - s * 0.6, y - s * 0.05, s * 1.2, s * 0.1);
  // Kansi aukeaa
  c.save();
  c.translate(x, y - s * 0.3);
  c.rotate(-open * 0.9);
  c.beginPath();
  c.moveTo(-s * 0.6, 0); c.lineTo(-s * 0.6, -s * 0.2); c.quadraticCurveTo(0, -s * 0.55, s * 0.6, -s * 0.2); c.lineTo(s * 0.6, 0); c.closePath();
  artFillPath(c, '#c88438', -s * 0.4, 0, s * 0.5, { lineColor: '#6a3a10' });
  c.restore();
  if (open > 0.3) {
    artCircle(c, x - s * 0.2, y - s * 0.32, s * 0.14, '#ffd24f', { lineColor: '#c08a10' });
    artCircle(c, x + s * 0.15, y - s * 0.36, s * 0.16, '#7fd4ff', { lineColor: '#2a7ab8' });
    artCircle(c, x + s * 0.02, y - s * 0.42, s * 0.12, '#ff7bac', { lineColor: '#b83a6a' });
  }
  artCircle(c, x, y + s * 0.02, s * 0.08, '#ffe27a', { lineColor: '#8a5a10' });
}

function drawDowseScorp(c, x, y, s, t) {
  var wig = Math.sin(t * 20) * 0.2;
  artShadow(c, x, y + s * 0.2, s * 0.6, s * 0.12);
  c.lineCap = 'round';
  for (var i = -1; i <= 1; i += 2) {
    artLimb(c, x + i * s * 0.2, y, x + i * s * 0.6, y + s * 0.2, s * 0.08, '#c0402a', '#6a1a10');
    artLimb(c, x + i * s * 0.3, y - s * 0.1, x + i * s * 0.7, y - s * 0.3 + wig * s * 0.2, s * 0.12, '#c0402a', '#6a1a10');
  }
  artBlob(c, x, y, s * 0.3, s * 0.2, '#d8502e', { lineColor: '#6a1a10' });
  c.strokeStyle = '#6a1a10';
  c.lineWidth = s * 0.18;
  c.beginPath(); c.moveTo(x, y + s * 0.1); c.quadraticCurveTo(x, y + s * 0.6, x - s * 0.1, y - s * 0.2 + wig * s * 0.3); c.stroke();
  c.strokeStyle = '#d8502e';
  c.lineWidth = s * 0.12;
  c.stroke();
  artEye(c, x - s * 0.08, y - s * 0.08, s * 0.06, 0, false);
  artEye(c, x + s * 0.08, y - s * 0.08, s * 0.06, 0, false);
}

// Aavikkokettu Fenni: isot korvat, origo tassujen kohdalla
function drawDowseFox(c, f) {
  var s = viewH / 560, x = f.x, y = f.y, run = f.state === 'run', dig = f.state === 'dig', hop = f.state === 'hop';
  var bob = run ? Math.abs(Math.sin(f.t * 30)) * s * 4 : (hop ? Math.sin(Math.min(1, f.t / 0.5) * Math.PI) * s * 25 : 0);
  artShadow(c, x, y + s * 2, s * 22, s * 5);
  c.save();
  c.translate(x, y - bob);
  c.scale(f.facing, 1);
  if (dig) c.rotate(0.35 + Math.sin(f.t * 30) * 0.08);
  // Häntä
  c.beginPath(); c.moveTo(-s * 12, -s * 12); c.quadraticCurveTo(-s * 34, -s * 20 + Math.sin(globalT * 4) * s * 4, -s * 28, -s * 34);
  c.quadraticCurveTo(-s * 22, -s * 18, -s * 10, -s * 8); c.closePath();
  artFillPath(c, '#f0b060', -s * 34, -s * 8, s * 12, { lineColor: '#9a6030' });
  // Jalat
  var sw = run ? Math.sin(f.t * 30) * s * 5 : (dig ? Math.sin(f.t * 40) * s * 6 : 0);
  artLimb(c, -s * 8, -s * 8, -s * 9 - sw, 0, s * 4, '#f0b060', '#9a6030');
  artLimb(c, s * 8, -s * 8, s * 10 + sw, 0, s * 4, '#f0b060', '#9a6030');
  // Vartalo ja pää
  artBlob(c, 0, -s * 14, s * 16, s * 10, '#f5c070', { lineColor: '#9a6030', shadeTo: '#e0a050' });
  artBlob(c, s * 2, -s * 11, s * 8, s * 5, '#fff0d8', { line: false });
  artCircle(c, s * 16, -s * 26, s * 10, '#f5c070', { lineColor: '#9a6030' });
  // Isot korvat
  c.beginPath(); c.moveTo(s * 9, -s * 32); c.lineTo(s * 4, -s * 54); c.lineTo(s * 16, -s * 35); c.closePath();
  artFillPath(c, '#f5c070', -s * 54, -s * 32, s * 8, { lineColor: '#9a6030' });
  c.beginPath(); c.moveTo(s * 18, -s * 35); c.lineTo(s * 26, -s * 56); c.lineTo(s * 25, -s * 31); c.closePath();
  artFillPath(c, '#f5c070', -s * 56, -s * 31, s * 8, { lineColor: '#9a6030' });
  c.fillStyle = '#ffc0c8';
  c.beginPath(); c.moveTo(s * 10, -s * 35); c.lineTo(s * 7, -s * 48); c.lineTo(s * 14, -s * 36); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(s * 20, -s * 36); c.lineTo(s * 24, -s * 50); c.lineTo(s * 23, -s * 33); c.closePath(); c.fill();
  artEye(c, s * 19, -s * 28, s * 2.6, 0.6, Math.sin(globalT * 1.7) > 0.97);
  artCircle(c, s * 26, -s * 23, s * 2, '#3a2a2a', { line: false });
  artBlush(c, s * 16, -s * 21, s * 3);
  c.restore();
}

function drawDowseRod(c, rod, still) {
  var h = viewH, x = rod.x, y = rod.y, shake = rod.danger > 0.2 ? Math.sin(globalT * 60) * h * 0.006 * rod.danger : 0;
  var col = dowseHeatColor(rod.heat);
  // Kärjen hehku ja kaivuun latautuva rengas
  artGlow(c, x + shake, y, h * (0.05 + rod.heat * 0.06), col, 0.6 + Math.sin(globalT * (4 + rod.heat * 14)) * 0.2);
  if (rod.danger > 0.2) artGlow(c, x + shake, y, h * 0.07, '#ff3a2a', rod.danger * 0.5);
  if (still > 0.08) {
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = Math.max(2, h * 0.007);
    c.beginPath(); c.arc(x, y, h * 0.04, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, still / DOWSE_STILL)); c.stroke();
  }
  // Y-varpu
  c.lineCap = 'round';
  artLimb(c, x + shake, y, x + h * 0.02 + shake, y - h * 0.08, h * 0.012, '#a8763e', '#6a4a28');
  artLimb(c, x + h * 0.02 + shake, y - h * 0.08, x - h * 0.02 + shake, y - h * 0.14, h * 0.01, '#a8763e', '#6a4a28');
  artLimb(c, x + h * 0.02 + shake, y - h * 0.08, x + h * 0.06 + shake, y - h * 0.13, h * 0.01, '#a8763e', '#6a4a28');
  artCircle(c, x + shake, y, h * 0.012, col, { lineColor: artShade(col, -0.4) });
}

function drawDowse() {
  var c = ctx, h = viewH, W = viewW, i, p, a, ch, s;
  if (!beginPlayWorld()) return;
  // Koristeet
  for (i = 0; i < dowse.deco.length; i++) {
    var d = dowse.deco[i], wg = d.wig > 0 ? Math.sin(globalT * 40) * 0.1 : 0;
    c.save(); c.translate(d.x, d.y); c.rotate(wg);
    if (d.kind === 'cactus') duneDrawCactus(c, 0, 0, h * 0.12, 0);
    else artBlob(c, 0, -h * 0.02, h * 0.05, h * 0.035, '#b89070', { lineColor: '#6a5040', hi: 0.25 });
    c.restore();
  }
  // Kuopat
  for (i = 0; i < dowse.holes.length; i++) {
    p = dowse.holes[i];
    artBlob(c, p.x, p.y, h * 0.045, h * 0.02, '#b07838', { lineColor: '#8a5a28' });
    artBlob(c, p.x + h * 0.05, p.y - h * 0.01, h * 0.025, h * 0.012, '#e8b870', { line: false });
    artGlow(c, p.x, p.y, h * 0.05, dowseHeatColor(p.heat), 0.55);
  }
  // Jälki
  for (i = 0; i < dowse.trail.length; i++) {
    p = dowse.trail[i];
    a = Math.max(0, 1 - (globalT - p.t) / DOWSE_TRAIL_LIFE);
    if (a <= 0) continue;
    if (p.heat >= 1) {
      // Polttava kohta: kultainen tähti (tästä kaivamalla arkku löytyy)
      c.globalAlpha = 0.4 + a * 0.6;
      drawStar(c, p.x, p.y, h * 0.02, globalT * 2 + i, 0.8);
      c.globalAlpha = 1;
      continue;
    }
    artCircle(c, p.x, p.y, h * 0.011, dowseHeatColor(p.heat), { line: false, alpha: 0.35 + a * 0.55 });
    if (p.danger > 0.3) {
      c.strokeStyle = 'rgba(255,60,40,' + (a * p.danger * 0.8) + ')';
      c.lineWidth = Math.max(1.5, h * 0.004);
      c.beginPath(); c.arc(p.x, p.y, h * 0.018, 0, Math.PI * 2); c.stroke();
    }
  }
  // Löydetyt arkut ja paljastuneet skorpionit
  for (i = 0; i < dowse.chests.length; i++) {
    ch = dowse.chests[i];
    if (ch.found) drawDowseChest(c, ch.x, ch.y - h * 0.01 * easeOutBack(ch.open), h * 0.07 * easeOutBack(Math.min(1, ch.t / 0.3)), ch.open);
    else if (dowse.state === 'buried') {
      // Tuuli paljastaa hetkeksi, missä arkku oli
      artGlow(c, ch.x, ch.y, h * 0.06, '#ffd24f', 0.4);
    }
  }
  for (i = 0; i < dowse.scorps.length; i++) {
    s = dowse.scorps[i];
    if (s.out > 0) {
      var ok = Math.min(1, s.out / 0.3);
      c.globalAlpha = ok;
      drawDowseScorp(c, s.x + (1.2 - s.out) * W * 0.1, s.y, h * 0.06, globalT);
      c.globalAlpha = 1;
    }
  }
  // Prinsessa kaivualueen vasemmalla
  drawPrincessFree(c, W * 0.1, h * 0.72, h / 500, 1, 0, false, globalT);
  drawDowseFox(c, dowse.fox);
  if (dowse.state === 'buried') {
    c.fillStyle = 'rgba(230,180,110,' + Math.min(0.7, dowse.t * 0.6) + ')';
    c.fillRect(0, 0, W, h);
  }
  if (dowse.state === 'play' && dowse.rod.on) drawDowseRod(c, dowse.rod, dowse.armed ? dowse.stillT : 0);
  // Tuulenpuuska
  if (dowse.gust > 0) {
    c.strokeStyle = 'rgba(255,255,255,' + Math.min(0.6, dowse.gust) + ')';
    c.lineWidth = Math.max(2, h * 0.006);
    c.lineCap = 'round';
    for (i = 0; i < 6; i++) {
      var gy = h * (0.35 + i * 0.1), gx = ((globalT * W * 0.8 + i * W * 0.37) % (W * 1.3)) - W * 0.15;
      c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + W * 0.06, gy - h * 0.02, gx + W * 0.12, gy); c.stroke();
    }
  }
  // Vihje: käsi pyyhkii hiekkaa ja pysähtyy
  if (!dowse.dug && dowse.state === 'play' && dowse.hintT > 1.2 && !holding) {
    var k = (dowse.hintT % 2.4) / 2.4, hx = W * (0.35 + Math.min(1, k * 1.6) * 0.3);
    drawHand(c, hx, h * 0.55, h * 0.045);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawDowseHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: kaivut tassuina, löydetyt arkut, aurinkokivet
function drawDowseHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, R = dowse.R || DOWSE_ROUNDS[0], n = R.chests + R.spare, x, y = pad * 0.5 + hs * 1.8;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.4 * n + hs * 1.2, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    x = left + hs * 1.8 + i * hs * 2.4;
    c.globalAlpha = i < dowse.digsLeft ? 1 : 0.25;
    artCircle(c, x, y + hs * 0.25, hs * 0.55, '#9a6030', { line: false });
    artCircle(c, x - hs * 0.5, y - hs * 0.45, hs * 0.25, '#9a6030', { line: false });
    artCircle(c, x, y - hs * 0.7, hs * 0.25, '#9a6030', { line: false });
    artCircle(c, x + hs * 0.5, y - hs * 0.45, hs * 0.25, '#9a6030', { line: false });
    c.globalAlpha = 1;
  }
  // Arkut oikealla
  var rx = viewW * 0.64;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, rx, pad * 0.5, hs * 3 * R.chests + hs * 7, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < R.chests; i++) {
    c.globalAlpha = i < dowse.found ? 1 : 0.3;
    drawDowseChest(c, rx + hs * 1.8 + i * hs * 3, y + hs * 0.4, hs * 1.1, 0);
    c.globalAlpha = 1;
  }
  x = rx + hs * 3 * R.chests + hs * 1.8;
  duneDrawGem(c, x, y, hs * 0.8, globalT);
  c.fillStyle = '#8a4a10';
  c.font = 'bold ' + Math.round(hs * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(dowse.bonus + '', x + hs * 1.3, y + hs * 0.1);
  c.textBaseline = 'alphabetic';
  // Kierrokset pieninä pisteinä
  for (i = 0; i < DOWSE_ROUNDS.length; i++) {
    artCircle(c, rx + hs * 1.2 + i * hs * 1.3, pad * 0.5 + hs * 4.4, hs * 0.4, i < dowse.round || dowse.state === 'won' ? '#ffd24f' : '#ffffff', { line: false, alpha: i < dowse.round || dowse.state === 'won' ? 1 : 0.6 });
  }
}

HUB_ICONS.dowse = function (c, x, y, s) {
  drawDowseChest(c, x + s * 0.05, y + s * 0.06, s * 0.14, 0.6);
  c.lineCap = 'round';
  artLimb(c, x - s * 0.16, y + s * 0.1, x - s * 0.12, y - s * 0.06, s * 0.03, '#a8763e', '#6a4a28');
  artLimb(c, x - s * 0.12, y - s * 0.06, x - s * 0.18, y - s * 0.16, s * 0.025, '#a8763e', '#6a4a28');
  artLimb(c, x - s * 0.12, y - s * 0.06, x - s * 0.05, y - s * 0.15, s * 0.025, '#a8763e', '#6a4a28');
  artGlow(c, x - s * 0.16, y + s * 0.1, s * 0.08, '#ffd24f', 0.7);
};
