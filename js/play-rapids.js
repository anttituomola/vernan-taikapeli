'use strict';

// Koski: Vuorisaaren toinen kenttä. Uusi pelimalli: virran ylitys tukilta tukille.
// Napauta prinsessan yläpuolelle hypätäksesi seuraavalle kaistalle (alapuolelle
// = takaisin). Tukit lipuvat sivuttain ja vievät mukanaan; veteen putoaminen vie
// sydämen ja palauttaa viimeiselle rannalle. Ylemmillä kaistoilla kilpikonnat
// sukeltavat välillä. Keskellä saari (lyhty + tehtävä), ylärannalla toinen tehtävä.

var RAP_ROWS = 9;         // 0 = alaranta, 4 = saari, 8 = yläranta
var RAP_HOP_T = 0.32;
var RAP_LANE_DEFS = {
  1: { dir: 1, sp: 0.07, len: 0.18, n: 3, turtle: false },
  2: { dir: -1, sp: 0.085, len: 0.16, n: 3, turtle: false },
  3: { dir: 1, sp: 0.10, len: 0.15, n: 3, turtle: false },
  5: { dir: -1, sp: 0.10, len: 0.15, n: 3, turtle: false },
  6: { dir: 1, sp: 0.12, len: 0.14, n: 3, turtle: true },
  7: { dir: -1, sp: 0.135, len: 0.13, n: 3, turtle: true }
};
var TURTLE_CYCLE = 5.5, TURTLE_UP = 3.6, TURTLE_WARN = 0.8;   // loput = pinnan alla
var rapids = {
  lanes: {}, rowH: 0,
  p: { row: 0, x: 0, y: 0, hop: null, log: null, off: 0, splashT: 0, safeRow: 0, facing: 1 },
  fish: []
};

function rapRowY(r) {
  // r voi tulla for-in-silmukasta merkkijonona: muunnetaan luvuksi
  return viewH * 0.975 - (Number(r) + 0.5) * rapids.rowH;
}

function rapIsWater(r) {
  return !!RAP_LANE_DEFS[r];
}

function rapLayout() {
  var r, i, def, lane, L, P;
  rapids.rowH = viewH * 0.82 / RAP_ROWS;
  for (r in RAP_LANE_DEFS) {
    def = RAP_LANE_DEFS[r];
    L = viewW * def.len;
    P = viewW + L;
    lane = rapids.lanes[r];
    if (!lane) {
      lane = { logs: [], dir: def.dir, sp: def.sp, len: 0 };
      for (i = 0; i < def.n; i++) {
        lane.logs.push({ x: 0, f: ((i + Number(r) * 0.37) % def.n) / def.n, w: L, dir: def.dir, turtle: def.turtle && i === 0, t: i * 1.7 });
      }
      rapids.lanes[r] = lane;
    }
    lane.len = L;
    for (i = 0; i < lane.logs.length; i++) {
      lane.logs[i].w = L;
      lane.logs[i].x = lane.logs[i].f * P - L;
    }
  }
  rapids.p.y = rapRowY(rapids.p.row);
}

function initRapids() {
  var i;
  level = 24;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  activeTask = null;
  heartsReset();
  tasks = [makeTask(-5, 'dots'), makeTask(-5, 'match')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  checkpoints = [{ fx: 0.5, x: viewW * 0.5, lit: false }];
  rapids.lanes = {};
  rapids.p.row = 0;
  rapids.p.x = viewW * 0.5;
  rapids.p.hop = null;
  rapids.p.log = null;
  rapids.p.splashT = 0;
  rapids.p.safeRow = 0;
  rapids.p.facing = 1;
  rapids.fish = [];
  for (i = 0; i < 4; i++) rapids.fish.push({ x: Math.random() * viewW, row: [1, 3, 5, 7][i], t: Math.random() * 6 });
  rapLayout();
  checkpoint.x = rapids.p.x;
  checkpoint.y = rapRowY(0);
  document.body.style.background = '#3aa0d8';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(392, 0, 0.25, 'sine', 0.3);
  playNote(587, 0.14, 0.3, 'triangle', 0.3);
}

// Paluu viimeiselle rannalle (roiskeen jälkeen tai sydänten loputtua)
function rapReturn() {
  var p = rapids.p;
  p.row = p.safeRow;
  p.x = viewW * 0.5;
  p.y = rapRowY(p.row);
  p.hop = null;
  p.log = null;
  p.splashT = 0;
  spawnSparkles(p.x, p.y - viewH * 0.05, 12, '#ffe27a');
}

function respawnRapids() { rapReturn(); }
function resizeRapids() {
  rapids.lanes = {};
  rapLayout();
  rapids.p.x = Math.min(Math.max(rapids.p.x, 0), viewW);
  checkpoints[0].x = viewW * 0.5;
}

function handleRapidsTap(px, py) {
  var p = rapids.p;
  if (!running || celebrating || puzzleBusy() || p.hop || p.splashT > 0) return;
  var to;
  if (py > p.y + rapids.rowH * 0.5 && p.row > 0) to = p.row - 1;
  else if (p.row < RAP_ROWS - 1) to = p.row + 1;
  else return;
  p.hop = { from: p.row, to: to, t: 0 };
  p.log = null;
  playNote(to > p.row ? 740 : 520, 0, 0.1, 'sine', 0.3);
  spawnSparkles(p.x, p.y, 4, '#ffffff');
}

function turtleUnder(log) {
  var ph = log.t % TURTLE_CYCLE;
  return log.turtle && ph > TURTLE_UP + TURTLE_WARN;
}
function turtleWarn(log) {
  var ph = log.t % TURTLE_CYCLE;
  return log.turtle && ph > TURTLE_UP && ph <= TURTLE_UP + TURTLE_WARN;
}

function rapSplash() {
  var p = rapids.p;
  p.splashT = 0.8;
  p.log = null;
  spawnSparkles(p.x, p.y, 18, '#9fdcff');
  playNote(300, 0, 0.2, 'sine', 0.35);
  playNote(180, 0.1, 0.3, 'sine', 0.3);
  loseHeart();
}

function rapLand(row) {
  var p = rapids.p, lane, i, lg, tol = rapids.rowH * 0.3, found = null;
  p.row = row;
  p.y = rapRowY(row);
  if (rapIsWater(row)) {
    lane = rapids.lanes[row];
    for (i = 0; i < lane.logs.length; i++) {
      lg = lane.logs[i];
      if (p.x >= lg.x - tol && p.x <= lg.x + lg.w + tol && !turtleUnder(lg)) { found = lg; break; }
    }
    if (!found) { rapSplash(); return; }
    p.log = found;
    p.off = Math.min(Math.max(p.x - found.x, found.w * 0.1), found.w * 0.9);
    playNote(880, 0, 0.08, 'triangle', 0.25);
    return;
  }
  p.log = null;
  if (row === 4) {
    if (!checkpoints[0].lit) setCheckpoint(checkpoints[0], viewW * 0.5, p.y);
    p.safeRow = 4;
    if (!tasks[0].opened) taskStart(tasks[0]);
  } else if (row === RAP_ROWS - 1) {
    p.safeRow = RAP_ROWS - 1;
    if (!tasks[1].opened) taskStart(tasks[1]);
  } else if (row === 0) {
    p.safeRow = 0;
  }
}

function updateRapids(dt) {
  var p = rapids.p, r, lane, i, lg, P, dx, dy, dist;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Tukit lipuvat ja kiertävät ruudun ympäri
  for (r in rapids.lanes) {
    lane = rapids.lanes[r];
    P = viewW + lane.len;
    for (i = 0; i < lane.logs.length; i++) {
      lg = lane.logs[i];
      if (busy || celebrating) continue;
      lg.x += lane.dir * lane.sp * viewW * dt;
      if (lg.x >= viewW) lg.x -= P;
      if (lg.x < -lane.len) lg.x += P;
      lg.t += dt;
    }
  }
  for (i = 0; i < rapids.fish.length; i++) {
    rapids.fish[i].t += dt;
    if (rapids.fish[i].t > 6) { rapids.fish[i].t = 0; rapids.fish[i].x = Math.random() * viewW; }
  }

  if (p.splashT > 0) {
    p.splashT -= dt;
    if (p.splashT <= 0) rapReturn();
  } else if (p.hop) {
    if (!busy && !celebrating) {
      p.hop.t += dt / RAP_HOP_T;
      p.y = rapRowY(p.hop.from) + (rapRowY(p.hop.to) - rapRowY(p.hop.from)) * Math.min(1, p.hop.t);
      if (p.hop.t >= 1) {
        var to = p.hop.to;
        p.hop = null;
        rapLand(to);
      }
    }
  } else if (p.log) {
    p.x = p.log.x + p.off;
    if (p.x < -rapids.rowH * 0.2) p.x += viewW + p.log.w;
    if (p.x > viewW + rapids.rowH * 0.2) p.x -= viewW + p.log.w;
    p.facing = rapids.lanes[p.row].dir;
    if (turtleUnder(p.log) && !busy && !celebrating) rapSplash();
  }

  if (p.row === RAP_ROWS - 1 && tasks[1].opened && !celebrating && !p.hop) startCelebration();

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderRapidsBg(b, w, h) {
  var i, x, r, y0, y1, vw = viewW, rh = rapids.rowH;
  b.fillStyle = '#2f8ccc';
  b.fillRect(0, 0, w, h);
  // Taivas ja vuoret yläreunassa
  var sky = b.createLinearGradient(0, 0, 0, h * 0.16);
  sky.addColorStop(0, '#9fdcff');
  sky.addColorStop(1, '#dff3ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h * 0.16);
  b.fillStyle = '#8fa8c8';
  for (i = 0; i < 7; i++) {
    x = vw * (i / 6);
    b.beginPath(); b.moveTo(x - h * 0.16, h * 0.16); b.lineTo(x, h * 0.03 + (i % 2) * h * 0.03); b.lineTo(x + h * 0.16, h * 0.16); b.closePath(); b.fill();
    b.fillStyle = '#ffffff';
    b.beginPath(); b.moveTo(x - h * 0.05, h * 0.07 + (i % 2) * h * 0.03); b.lineTo(x, h * 0.03 + (i % 2) * h * 0.03); b.lineTo(x + h * 0.05, h * 0.07 + (i % 2) * h * 0.03); b.closePath(); b.fill();
    b.fillStyle = '#8fa8c8';
  }
  for (r = 0; r < RAP_ROWS; r++) {
    y0 = rapRowY(r) - rh / 2;
    y1 = y0 + rh;
    if (rapIsWater(r)) {
      var wg = b.createLinearGradient(0, y0, 0, y1);
      wg.addColorStop(0, r % 2 ? '#3a9be0' : '#2f8ccc');
      wg.addColorStop(1, r % 2 ? '#2b83c4' : '#2677b8');
      b.fillStyle = wg;
      b.fillRect(0, y0, vw, rh);
      b.fillStyle = 'rgba(255,255,255,0.12)';
      for (i = 0; i < 12; i++) b.fillRect((i * 173 + r * 61) % vw, y0 + rh * (0.2 + (i % 3) * 0.25), vw * 0.03, Math.max(1, h * 0.003));
    } else {
      // Ranta tai saari
      var isIsland = r === 4;
      var gg = b.createLinearGradient(0, y0, 0, y1);
      gg.addColorStop(0, isIsland ? '#f2dfa6' : '#8fd97a');
      gg.addColorStop(1, isIsland ? '#e0c98a' : '#5fb356');
      b.fillStyle = gg;
      if (isIsland) {
        b.beginPath();
        if (b.ellipse) b.ellipse(vw / 2, y0 + rh / 2, vw * 0.42, rh * 0.5, 0, 0, Math.PI * 2);
        else b.arc(vw / 2, y0 + rh / 2, rh * 0.5, 0, Math.PI * 2);
        b.fill();
        b.fillStyle = '#8fd97a';
        b.beginPath();
        if (b.ellipse) b.ellipse(vw / 2, y0 + rh * 0.42, vw * 0.3, rh * 0.28, 0, 0, Math.PI * 2);
        else b.arc(vw / 2, y0 + rh * 0.42, rh * 0.28, 0, Math.PI * 2);
        b.fill();
      } else {
        b.fillRect(0, y0, vw, rh);
        b.fillStyle = 'rgba(255,255,255,0.35)';
        b.fillRect(0, r === 0 ? y0 : y1 - h * 0.006, vw, h * 0.006);
      }
      for (i = 0; i < 14; i++) {
        x = (i * 211.7 + r * 37) % vw;
        if (isIsland && Math.abs(x - vw / 2) > vw * 0.28) continue;
        drawFlower(b, x, y0 + rh * (0.25 + (i % 3) * 0.25), h * 0.008, ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
      }
    }
  }
  // Yläranta: teltta ja lippu
  var ty = rapRowY(RAP_ROWS - 1) + rh * 0.45;
  b.fillStyle = '#ff7bac';
  b.beginPath(); b.moveTo(vw * 0.78, ty); b.lineTo(vw * 0.85, ty - rh * 0.9); b.lineTo(vw * 0.92, ty); b.closePath(); b.fill();
  b.fillStyle = '#c94f7e';
  b.beginPath(); b.moveTo(vw * 0.83, ty); b.lineTo(vw * 0.85, ty - rh * 0.45); b.lineTo(vw * 0.87, ty); b.closePath(); b.fill();
  drawTree(b, vw * 0.12, ty, rh * 1.2);
  drawTree(b, vw * 0.94, rapRowY(0) + rh * 0.45, rh * 1.1);
}

function drawLog(c, lg, y) {
  var x = lg.x, w = lg.w, hh = rapids.rowH * 0.5;
  if (lg.turtle) {
    var under = turtleUnder(lg), warn = turtleWarn(lg);
    var wob = warn ? Math.sin(globalT * 25) * hh * 0.08 : 0;
    if (under) {
      c.strokeStyle = 'rgba(255,255,255,0.45)';
      c.lineWidth = Math.max(1.5, hh * 0.08);
      c.beginPath();
      if (c.ellipse) c.ellipse(x + w / 2, y, w * 0.4, hh * 0.35, 0, 0, Math.PI * 2);
      else c.arc(x + w / 2, y, hh * 0.4, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.arc(x + w * 0.4, y - hh * 0.2 - ((globalT * 0.7) % 1) * hh * 0.4, hh * 0.08, 0, Math.PI * 2); c.fill();
      return;
    }
    c.fillStyle = warn ? '#6fa85a' : '#4f9a4a';
    c.beginPath();
    if (c.ellipse) c.ellipse(x + w / 2, y + wob, w / 2, hh * 0.55, 0, 0, Math.PI * 2);
    else c.arc(x + w / 2, y + wob, hh * 0.55, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(0,60,0,0.35)';
    c.lineWidth = Math.max(1.5, hh * 0.06);
    c.beginPath(); c.moveTo(x + w * 0.25, y - hh * 0.3 + wob); c.lineTo(x + w * 0.35, y + hh * 0.3 + wob); c.moveTo(x + w * 0.5, y - hh * 0.4 + wob); c.lineTo(x + w * 0.5, y + hh * 0.4 + wob); c.moveTo(x + w * 0.75, y - hh * 0.3 + wob); c.lineTo(x + w * 0.65, y + hh * 0.3 + wob); c.stroke();
    // Pää
    c.fillStyle = '#7bc46a';
    c.beginPath(); c.arc(x + (lg.dir > 0 ? w + hh * 0.2 : -hh * 0.2), y + wob, hh * 0.24, 0, Math.PI * 2); c.fill();
    return;
  }
  c.fillStyle = '#8a5a30';
  roundRect(c, x, y - hh * 0.45, w, hh * 0.9, hh * 0.45);
  c.fill();
  c.fillStyle = '#a9743f';
  roundRect(c, x + hh * 0.2, y - hh * 0.3, w - hh * 0.4, hh * 0.3, hh * 0.15);
  c.fill();
  c.fillStyle = '#c98b4a';
  c.beginPath(); c.arc(x + hh * 0.45, y, hh * 0.32, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + w - hh * 0.45, y, hh * 0.32, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(1, hh * 0.05);
  c.beginPath(); c.arc(x + hh * 0.45, y, hh * 0.16, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x + w - hh * 0.45, y, hh * 0.16, 0, Math.PI * 2); c.stroke();
}

function drawRapidsWaves(c) {
  var r, i, y, x, w, rh = rapids.rowH;
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1.5, viewH * 0.004);
  c.lineCap = 'round';
  for (r in rapids.lanes) {
    var lane = rapids.lanes[r];
    y = rapRowY(r);
    for (i = 0; i < 6; i++) {
      w = rh * 0.6;
      x = ((globalT * lane.dir * lane.sp * viewW * 0.6 + i * viewW / 6 + r * 40) % (viewW + w) + viewW + w) % (viewW + w) - w / 2;
      c.beginPath();
      c.moveTo(x - w / 2, y + rh * 0.3);
      c.quadraticCurveTo(x - w / 4, y + rh * 0.3 - w * 0.15, x, y + rh * 0.3);
      c.quadraticCurveTo(x + w / 4, y + rh * 0.3 + w * 0.15, x + w / 2, y + rh * 0.3);
      c.stroke();
    }
  }
  c.lineCap = 'butt';
}

function drawQuestionStone(c, x, y, s) {
  c.fillStyle = '#c9c4d8';
  roundRect(c, x - s * 0.5, y - s * 0.7, s, s * 0.9, s * 0.25);
  c.fill();
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(s * 0.7) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', x, y - s * 0.22);
  drawStar(c, x + s * 0.55, y - s * 0.85, s * 0.16, globalT * 2, 0.6);
}

function drawRapids() {
  var p = rapids.p, r, i, lane, rh = rapids.rowH, y;
  if (!drawWorldBg()) return;
  drawRapidsWaves(ctx);
  for (i = 0; i < rapids.fish.length; i++) {
    var f = rapids.fish[i];
    if (f.t < 1) {
      var fy = rapRowY(f.row) - Math.sin(f.t * Math.PI) * rh * 0.6;
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      if (ctx.ellipse) ctx.ellipse(f.x, fy, rh * 0.16, rh * 0.09, (f.t - 0.5) * 2, 0, Math.PI * 2);
      else ctx.arc(f.x, fy, rh * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (r in rapids.lanes) {
    lane = rapids.lanes[r];
    y = rapRowY(r);
    for (i = 0; i < lane.logs.length; i++) drawLog(ctx, lane.logs[i], y);
  }
  // Saaren lyhty ja tehtäväkivet
  drawLantern(ctx, checkpoints[0], rapRowY(4) + rh * 0.4);
  if (!tasks[0].opened) drawQuestionStone(ctx, viewW * 0.5 + rh * 1.6, rapRowY(4) + rh * 0.35, rh * 0.7);
  if (!tasks[1].opened) drawQuestionStone(ctx, viewW * 0.5 + rh * 1.6, rapRowY(RAP_ROWS - 1) + rh * 0.35, rh * 0.7);
  // Odottavat puput ylärannalla
  drawBunny(ctx, viewW * 0.28, rapRowY(RAP_ROWS - 1) + rh * 0.4, rh * 0.32, celebrating ? Math.abs(Math.sin(globalT * 9)) * rh * 0.2 : 0, globalT * 3, false);
  drawBunny(ctx, viewW * 0.36, rapRowY(RAP_ROWS - 1) + rh * 0.42, rh * 0.28, celebrating ? Math.abs(Math.sin(globalT * 9 + 1)) * rh * 0.2 : 0, globalT * 3 + 1, false);
  // Prinsessa
  var s = rh * 1.15 / 58;
  var hopLift = p.hop ? Math.sin(Math.min(1, p.hop.t) * Math.PI) * rh * 0.6 : 0;
  if (p.splashT > 0) {
    ctx.globalAlpha = 0.6;
    drawPrincessFree(ctx, p.x, p.y + rh * 0.55 + Math.sin(globalT * 8) * rh * 0.05, s * 0.9, p.facing, 0, false, globalT);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x + (i - 1) * rh * 0.3, p.y + rh * 0.1 - ((globalT * 1.5 + i * 0.3) % 1) * rh * 0.3, rh * 0.06, 0, Math.PI * 2); ctx.fill(); }
  } else {
    if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(p.x, p.y + rh * 0.4, rh * 0.3, rh * 0.09, 0, 0, Math.PI * 2);
    else ctx.arc(p.x, p.y + rh * 0.4, rh * 0.15, 0, Math.PI * 2);
    ctx.fill();
    drawPrincessFree(ctx, p.x, p.y + rh * 0.4 - hopLift, s, p.facing, globalT * 8, !!p.hop, globalT);
    ctx.globalAlpha = 1;
  }
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  // HUD: kaistat ylitetty
  drawPickupHud(ctx, RAP_ROWS - 1, function (i2) { return i2 < rapids.p.row; },
    function (c, x, y2, s2) { c.fillStyle = '#5fa8ff'; c.beginPath(); c.arc(x, y2, s2 * 0.45, 0, Math.PI * 2); c.fill(); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
