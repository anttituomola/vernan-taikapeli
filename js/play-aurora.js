'use strict';

// Revontulipolku: ratsastus. Revontulesta tippuu valopisara kerrallaan; lumeen
// ilmestyy hohtava rengas siihen kohtaan, johon pisara putoaa. Ratsasta (tai
// napauta pisaraa) renkaaseen ennen kuin pisara osuu lumeen: pisara jää kiinni
// ja taivaan revontuleen syttyy uusi värijuova. Ohi mennyt pisara vain
// pöllähtää lumeen, ja uusi tippuu pian. Kahdeksan pisaraa avaa portin.
// Ei sydämiä. Vaikeus kasvaa tehtäväkaari kerrallaan (lyhyempi putoaminen,
// viimeisellä osuudella pisara leijailee sivuttain).

var AUR_COUNT = 8;
var AUR_QUOTA = [3, 6, 8];           // kerättyjä pisaroita ennen kutakin tehtäväkaarta / porttia
var AUR_FALL = [3.2, 2.8, 2.4];      // putoamisaika osuuksittain (s)
var AUR_WARN = 0.7;                  // revontuli kirkastuu ennen tippumista (s)
var aurLights = [];                  // HUD-rivi: { collected }
var aurWind = [];                    // (VT-kahvan yhteensopivuus: puuskia ei enää ole)
var aurGate = northGateAt(0.96);
var aurDrop = null;                  // { x0, x, y, landY, t, dur, drift, warn }
var aurDropCd = 1.2;                 // tauko ennen seuraavaa pisaraa
var aurStrands = [];                 // taivaalle syttyneet värijuovat
var AUR_STRAND_COLS = ['#7cffc4', '#c9a0ff', '#8ad8ff', '#a8ff9a', '#ff9ad8', '#7cffc4', '#c9a0ff', '#ffe27a'];

function aurCaught() {
  return countCollected(aurLights);
}
function aurZone() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return Math.min(n, AUR_QUOTA.length - 1);
}
function aurZoneSpan(z) {
  var lo = z === 0 ? viewW * 0.12 : tasks[z - 1].x + viewW * 0.12;
  var hi = z < tasks.length ? tasks[z].x - viewW * 0.16 : aurGate.x - viewW * 0.12;
  return { lo: lo, hi: hi };
}

function initAurora() {
  var i;
  tasks = [makeTask(0.32, 'pattern'), makeTask(0.66, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([]);
  aurLights = [];
  for (i = 0; i < AUR_COUNT; i++) aurLights.push({ collected: false });
  aurWind = [];
  aurDrop = null;
  aurDropCd = 1.2;
  aurStrands = [];
  aurGate.x = aurGate.fx * worldW;
  aurGate.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.08;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  aurSetupProps();
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.32);
  playNote(784, 0.14, 0.3, 'triangle', 0.3);
}

function respawnAurora() {}

function resizeAurora(ratio) {
  if (aurDrop) {
    aurDrop.x0 *= ratio;
    aurDrop.x *= ratio;
    aurDrop.landY = Math.min(Math.max(aurDrop.landY, groundTop + viewH * 0.03), groundBottom - viewH * 0.03);
  }
  aurGate.x = aurGate.fx * worldW;
  aurSetupProps();
}

// Tökättävät koristeet: lähikuuset pudottavat lumitupsun; kivet heilahtavat ja
// joka kolmannella tökkäyksellä kiven takaa pyrähtää riekko (yllätys).
function aurSetupProps() {
  var i, h = viewH, w = worldW;
  propsReset();
  for (i = 0; i < 5; i++) voyPineProp(w * (0.1 + i * 0.18), groundTop, h * 0.16, '#1a3850');
  aurRockProp(w * 0.24, groundTop + h * 0.02, h * 0.045);
  aurRockProp(w * 0.5, groundTop + h * 0.015, h * 0.04);
  aurRockProp(w * 0.8, groundTop + h * 0.015, h * 0.038);
}

function aurRockProp(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.4, hy: s * 0.2, color: '#dce8f4', note: 392, amp: 0.07,
    draw: function (c) { drawNorthRock(c, 0, 0, s); },
    poke: function (p) {
      if (p.n % 3 === 0) aurBirdFly(p.x, p.y - s * 0.3);
      else voySnowPuff(p.x + (Math.random() - 0.5) * s, p.y - s * 0.4, s * 0.12, p.y + s * 0.1);
    }
  });
}

// Riekko pyrähtää lentoon kiven takaa, laskeutuu ja haihtuu
function aurBirdFly(x, y) {
  var s = viewH * 0.022, snow = { shadeTo: '#e3d8f5', lineColor: '#b8c8d8' }, dir = Math.random() < 0.5 ? -1 : 1;
  playNote(988, 0, 0.07, 'triangle', 0.18);
  playNote(1175, 0.08, 0.07, 'triangle', 0.18);
  playNote(988, 0.16, 0.1, 'triangle', 0.18);
  propDrop({
    x: x, y: y, dir: dir, vx: dir * viewW * 0.1, vy: -viewH * 0.5, vr: 0, ground: y + s * 1.2, life: 2.0,
    draw: function (c, d) {
      var fl = Math.sin(d.t * 26) * 0.6;
      c.scale(d.dir, 1);
      artBlob(c, -s * 0.5, -s * 0.1, s * 0.75, s * 0.28, '#ffffff', { rot: -0.5 - fl, shadeTo: snow.shadeTo, lineColor: snow.lineColor });
      artBlob(c, 0, 0, s * 0.8, s * 0.6, '#ffffff', { shadeTo: snow.shadeTo, lineColor: snow.lineColor, hi: 0.4 });
      artBlob(c, -s * 0.9, -s * 0.1, s * 0.25, s * 0.12, '#2a2a2a', { line: false });
      artCircle(c, s * 0.7, -s * 0.5, s * 0.36, '#ffffff', snow);
      artBlob(c, s * 0.72, -s * 0.78, s * 0.2, s * 0.07, '#e8323c', { line: false });
      artEye(c, s * 0.8, -s * 0.52, s * 0.08, 0.3, false);
      artBlob(c, s * 1.08, -s * 0.44, s * 0.12, s * 0.07, '#2a2a2a', { line: false });
    }
  });
}

function aurSpawnDrop() {
  var z = aurZone(), sp = aurZoneSpan(z), side, x, d;
  // Useimmiten edessä, joskus takana; aina vähän matkan päässä
  side = Math.random() < 0.75 ? 1 : -1;
  d = viewW * (0.16 + Math.random() * 0.24);
  x = unicorn.x + side * d;
  if (x > sp.hi || x < sp.lo) x = unicorn.x - side * d;
  x = Math.min(Math.max(x, Math.max(sp.lo, camX + viewW * 0.08)), Math.min(sp.hi, camX + viewW * 0.92));
  if (sp.hi < sp.lo) x = (sp.lo + sp.hi) / 2;
  aurDrop = {
    x0: x, x: x, y: viewH * 0.1,
    landY: groundTop + viewH * 0.03 + Math.random() * (groundBottom - groundTop - viewH * 0.06),
    t: 0, dur: AUR_FALL[z], drift: z === 2 ? viewW * 0.05 : 0, warn: AUR_WARN
  };
  playNote(1319, 0, 0.12, 'sine', 0.18);
  playNote(1568, 0.1, 0.18, 'sine', 0.16);
}

// Pisaran saa kiinni sen pudottua vähän matkaa (rengas on silloin jo kirkas)
function aurDropCatchable(d) {
  return d && d.warn <= 0 && d.t / d.dur > 0.45;
}

function aurCatch(d) {
  var idx = aurCaught();
  aurLights[idx].collected = true;
  spawnSparkles(d.x, d.y, 16, '#7cffc4');
  spawnSparkles(d.x, d.y - viewH * 0.06, 10, AUR_STRAND_COLS[idx]);
  soundStar(idx + 1);
  aurStrands.push({ col: AUR_STRAND_COLS[idx], t: 0, ph: Math.random() * 6 });
  aurDrop = null;
  aurDropCd = 0.7;
  if (aurCaught() === AUR_COUNT) {
    aurGate.open = true;
    playNote(523, 0.2, 0.25, 'triangle', 0.35);
    playNote(784, 0.4, 0.4, 'triangle', 0.35);
  }
}

// Ohi mennyt pisara pöllähtää lumeen; ei rangaistusta, uusi tulee pian
function aurMiss(d) {
  var k;
  for (k = 0; k < 3; k++) voySnowPuff(d.x + (k - 1) * viewH * 0.03, d.landY - viewH * 0.01, viewH * 0.012, d.landY + viewH * 0.01);
  spawnSparkles(d.x, d.landY, 8, '#b8ffe0');
  playNote(392, 0, 0.18, 'sine', 0.18);
  aurDrop = null;
  aurDropCd = 0.9;
}

function handleAuroraTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, d = aurDrop;
  // Napautus pisaraan tai sen renkaaseen ohjaa yksisarvisen suoraan renkaalle
  if (d && Math.abs(wx - d.x) < viewH * 0.1 && (py < d.y + viewH * 0.08 || Math.abs(py - d.landY) < viewH * 0.1)) {
    setWalkTarget(d.x - camX, d.landY);
    return;
  }
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateAurora(dt) {
  var i, d, busy, z, k;
  updateTasks(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  northRideUnicorn(dt, busy);
  for (i = 0; i < aurStrands.length; i++) aurStrands[i].t += dt;
  if (!busy && !celebrating) {
    z = aurZone();
    if (!aurDrop && aurCaught() < AUR_QUOTA[z]) {
      aurDropCd -= dt;
      if (aurDropCd <= 0) aurSpawnDrop();
    }
    d = aurDrop;
    if (d) {
      if (d.warn > 0) d.warn -= dt;
      else {
        d.t += dt;
        k = Math.min(1, d.t / d.dur);
        // Alussa hitaampi, lopussa nopeampi (painovoiman tuntu, mutta pehmeä)
        d.y = viewH * 0.1 + (d.landY - viewH * 0.1) * (0.35 * k + 0.65 * k * k);
        d.x = d.x0 + Math.sin(d.t * 1.7) * d.drift;
        if (aurDropCatchable(d) && Math.abs(unicorn.x - d.x) < viewH * 0.11 && Math.abs(unicorn.y - d.landY) < viewH * 0.09) aurCatch(d);
        else if (k >= 1) aurMiss(d);
      }
    }
  }
  if (aurGate.open && !celebrating && Math.abs(unicorn.x - aurGate.x) < viewH * 0.12) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function auroraLayers() {
  return [
    { speed: 0.22, render: renderAuroraFar },
    { speed: 0.55, render: renderAuroraMid },
    { speed: 1, render: renderAuroraNear }
  ];
}
function renderAuroraBg(b, w, h) {
  renderAuroraFar(b, w, h); renderAuroraMid(b, w, h); renderAuroraNear(b, w, h);
}
function renderAuroraFar(b, w, h) { renderNorthSky(b, w, h); }
function renderAuroraMid(b, w, h) {
  var i, x;
  renderNorthHills(b, w, h);
  for (i = 0; i < 7; i++) {
    x = w * (0.08 + i * 0.14);
    drawNorthPine(b, x, groundTop - h * 0.01, h * (0.16 + (i % 3) * 0.04), i % 2 ? '#1a3850' : '#245068');
  }
}
function renderAuroraNear(b, w, h) {
  // Lähikuuset ja kivet ovat tökättäviä koristeita (aurSetupProps)
  renderNorthGround(b, w, h);
}

// Taivaan revontuli kasvaa: jokainen kiinni saatu pisara sytyttää oman juovansa
function drawAuroraStrands(c) {
  var i, s, x, y, base, a, amp;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (i = 0; i < aurStrands.length; i++) {
    s = aurStrands[i];
    a = Math.min(1, s.t / 0.8);
    base = viewH * (0.1 + (i % 4) * 0.035);
    amp = viewH * (0.025 + (i % 3) * 0.01);
    c.beginPath();
    for (x = -20; x <= viewW + 20; x += 24) {
      y = base + Math.sin((x + camX * 0.25) * 0.004 + s.ph + globalT * 0.5) * amp;
      if (x === -20) c.moveTo(x, y); else c.lineTo(x, y);
    }
    // Leveä hehku ja kapea kirkas ydin; uusi juova välähtää syttyessään
    c.strokeStyle = artRGBA(s.col, (0.3 + 0.4 * Math.max(0, 1 - s.t)) * a);
    c.lineWidth = viewH * (0.04 - (i % 3) * 0.008);
    c.stroke();
    c.strokeStyle = artRGBA(s.col, 0.5 * a);
    c.lineWidth = viewH * 0.008;
    c.stroke();
  }
  c.restore();
}

// Pisaran oma revontulikaistale, rengas lumessa ja itse pisara
function drawAuroraDrop(c) {
  var d = aurDrop, x, k, warnA, ring, g, i;
  if (!d) return;
  x = d.x - camX;
  k = d.warn > 0 ? 0 : Math.min(1, d.t / d.dur);
  warnA = d.warn > 0 ? 1 - d.warn / AUR_WARN : 1;
  // Kirkas verho pisaran yllä: näyttää heti, mistä se tulee
  g = c.createLinearGradient(0, 0, 0, viewH * 0.32);
  g.addColorStop(0, 'rgba(140,255,210,' + (0.38 * warnA) + ')');
  g.addColorStop(1, 'rgba(140,255,210,0)');
  c.fillStyle = g;
  c.fillRect(x - viewH * 0.07, 0, viewH * 0.14, viewH * 0.32);
  // Rengas lumessa kasvaa ja kirkastuu pisaran lähestyessä
  ring = viewH * (0.055 + 0.03 * k) * (1 + Math.sin(globalT * 8) * 0.06);
  c.save();
  c.globalAlpha = 0.55 + 0.45 * Math.max(warnA * 0.5, k);
  c.fillStyle = 'rgba(160,255,215,0.45)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, d.landY, ring, ring * 0.38, 0, 0, Math.PI * 2);
  else c.arc(x, d.landY, ring, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#2a9a70';
  c.lineWidth = Math.max(4, viewH * 0.008);
  c.stroke();
  c.strokeStyle = '#b8ffe0';
  c.lineWidth = Math.max(2, viewH * 0.004);
  c.stroke();
  c.restore();
  if (d.warn > 0) {
    artGlow(c, x, d.y, viewH * 0.05 * warnA + 1, '#b8ffe0', 0.7);
    return;
  }
  for (i = 1; i <= 3; i++) {
    c.globalAlpha = 0.3 / i;
    artCircle(c, x, d.y - i * viewH * 0.025, viewH * (0.022 - i * 0.004), '#b8ffe0', { line: false });
  }
  c.globalAlpha = 1;
  artGlow(c, x, d.y, viewH * 0.07, '#8affd0', 0.75);
  artCircle(c, x, d.y, viewH * 0.026, '#d8fff0', { shadeTo: '#4ad0a0', lineColor: '#2a9a70', hi: 0.55 });
}

function drawAurora() {
  var i, us, z;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  drawAuroraStrands(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  propsDraw(ctx);
  drawNorthGate(ctx, aurGate.x - camX, groundTop + viewH * 0.02, viewH * 0.16, aurGate.open);
  // Rengas piirretään yksisarvisen taakse, jos se on syvemmällä kuvassa
  if (aurDrop && aurDrop.landY < unicorn.y) drawAuroraDrop(ctx);
  us = viewH / 800;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  if (aurDrop && aurDrop.landY >= unicorn.y) drawAuroraDrop(ctx);
  drawParticlesLayer(ctx);
  if (!celebrating) {
    z = aurZone();
    if (aurDrop) drawEdgeArrow(ctx, aurDrop.x);
    else if (aurGate.open) drawEdgeArrow(ctx, aurGate.x);
    else if (aurCaught() >= AUR_QUOTA[z] && z < tasks.length) drawEdgeArrow(ctx, tasks[z].x);
  }
  endPlayWorld();
  drawPickupHud(ctx, AUR_COUNT, function (k) { return aurLights[k] && aurLights[k].collected; },
    function (c, x, y, sz) { artCircle(c, x, y, sz * 0.45, '#7cffc4', { hi: 0.4 }); });
  drawTaskOverlay(ctx);
}
