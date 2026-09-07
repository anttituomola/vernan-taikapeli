'use strict';

// Hyppelymoottori: kaistoilla lipuu tukkeja (tai pilviä), joille hypätään
// kaista kerrallaan. Napauta prinsessan yläpuolelle hypätäksesi eteenpäin,
// alapuolelle taaksepäin. Tukit vievät mukanaan; ohi hyppy vie sydämen ja
// palauttaa viimeiselle rannalle. Kolme kenttää käyttää samaa moottoria:
//   'logs'    Koski (Vuorisaari): pelkkä ajoitus, kilpikonnat sukeltavat ylimmillä kaistoilla
//   'syl'     Tavukoski (Kirjainsaari): tukeissa TAVUJA, hyppää sanan seuraavalle tavulle
//   'letters' Kirjainpilvet (Kirjainsaari, vartija): pilvissä KIRJAIMIA, kirjoita sana ylös asti
// Tavu- ja kirjaintiloissa väärä tukki keikahtaa ja pudottaa veteen (sydän).
// Rivit: 0 = alaranta, keskellä saari (lyhty + tehtävä), ylin = yläranta (tehtävä).

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
var RAP_ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVYÄÖ';
var rapids = {
  mode: 'logs', rows: 9, island: 4, lanes: {}, defs: {}, rowH: 0,
  words: [], tokens: {}, done: {}, hudRect: null, sayT: -1, sayWord: -1,
  p: { row: 0, x: 0, y: 0, hop: null, log: null, off: 0, splashT: 0, safeRow: 0, facing: 1 },
  fish: []
};

function rapRowY(r) {
  // r voi tulla for-in-silmukasta merkkijonona: muunnetaan luvuksi
  return viewH * 0.975 - (Number(r) + 0.5) * rapids.rowH;
}

function rapIsWater(r) {
  return !!rapids.defs[r];
}
function rapSky() {
  return rapids.mode === 'letters';
}
function rapTop() {
  return rapids.rows - 1;
}

// Sanan osat: tavut tai kirjaimet
function rapWordParts(word) {
  return rapids.mode === 'syl' ? word.w.split('-') : word.w.replace(/-/g, '').split('');
}

// Kaistat: 'logs' kiinteästä taulukosta, muut sanojen pituuden mukaan.
// tokens[r] = kaistan oikea tavu/kirjain; hämäykset arvotaan muista.
function rapBuildDefs() {
  var r, k, w, parts, row = 1, others, i, tmp;
  rapids.defs = {};
  rapids.tokens = {};
  if (rapids.mode === 'logs') {
    for (r in RAP_LANE_DEFS) rapids.defs[r] = RAP_LANE_DEFS[r];
    rapids.rows = 9;
    rapids.island = 4;
    return;
  }
  for (w = 0; w < rapids.words.length; w++) {
    parts = rapWordParts(rapids.words[w]);
    for (k = 0; k < parts.length; k++) {
      others = [];
      if (rapids.mode === 'syl') {
        for (i = 0; i < WORD_LIST.length; i++) {
          tmp = WORD_LIST[i].w.split('-');
          for (var j = 0; j < tmp.length; j++) if (tmp[j] !== parts[k] && others.indexOf(tmp[j]) < 0) others.push(tmp[j]);
        }
      } else {
        for (i = 0; i < RAP_ALPHABET.length; i++) if (RAP_ALPHABET.charAt(i) !== parts[k]) others.push(RAP_ALPHABET.charAt(i));
      }
      others = shuffleNums(others);
      rapids.defs[row] = { dir: row % 2 ? 1 : -1, sp: 0.06 + row * 0.009, len: rapids.mode === 'syl' ? 0.17 : 0.14, n: 3, turtle: false };
      rapids.tokens[row] = [parts[k], others[0], others[1]];
      row++;
    }
    if (w === 0) { rapids.island = row; row++; }
  }
  rapids.rows = row + 1;
}

function rapLayout() {
  var r, i, def, lane, L, P;
  rapids.rowH = viewH * 0.82 / rapids.rows;
  for (r in rapids.defs) {
    def = rapids.defs[r];
    L = viewW * def.len;
    P = viewW + L;
    lane = rapids.lanes[r];
    if (!lane) {
      lane = { logs: [], dir: def.dir, sp: def.sp, len: 0 };
      var order = shuffleNums([0, 1, 2]);
      for (i = 0; i < def.n; i++) {
        lane.logs.push({
          x: 0, f: ((i + Number(r) * 0.37) % def.n) / def.n, w: L, dir: def.dir,
          turtle: def.turtle && i === 0, t: i * 1.7, tipT: 0,
          token: rapids.tokens[r] ? rapids.tokens[r][order[i]] : null
        });
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

// Arvotaan kaksi sanaa: A saarelle asti (2 osaa), B ylärannalle (3 osaa tai 4 kirjainta)
function rapPickWords() {
  var poolA, poolB, a, b;
  if (rapids.mode === 'syl') {
    poolA = wordsBySyl(2, 2);
    poolB = wordsBySyl(3, 3);
  } else {
    poolA = []; poolB = [];
    for (var i = 0; i < WORD_LIST.length; i++) {
      var n = WORD_LIST[i].w.replace(/-/g, '').length;
      if (n === 3) poolA.push(WORD_LIST[i]);
      if (n === 4) poolB.push(WORD_LIST[i]);
    }
  }
  a = poolA[randInt(poolA.length)];
  do { b = poolB[randInt(poolB.length)]; } while (b === a && poolB.length > 1);
  rapids.words = [a, b];
}

function initRapids(mode, lvl) {
  var i;
  level = lvl || 24;
  rapids.mode = mode || 'logs';
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
  if (rapids.mode === 'logs') tasks = [makeTask(-5, 'dots'), makeTask(-5, 'match')];
  else if (rapids.mode === 'syl') tasks = [makeTask(-5, 'build', { maxSyl: 2 }), makeTask(-5, 'word', { maxSyl: 3 })];
  else tasks = [makeTask(-5, 'letter'), makeTask(-5, 'wordpick', { maxSyl: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  rapids.words = [];
  if (rapids.mode !== 'logs') rapPickWords();
  rapBuildDefs();
  rapids.done = {};
  rapids.hudRect = null;
  rapids.sayT = -1;
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
  for (i = 0; i < 4; i++) rapids.fish.push({ x: Math.random() * viewW, row: 1 + (i * 2) % Math.max(1, rapids.rows - 2), t: Math.random() * 6 });
  rapLayout();
  checkpoint.x = rapids.p.x;
  checkpoint.y = rapRowY(0);
  document.body.style.background = rapSky() ? '#8fc8ff' : '#3aa0d8';
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

// Sanakuplan napautus lukee sanan (tavut/kirjaimet soivat)
function rapSayWord() {
  var w = rapCurWord(), showW = w < 0 ? (rapids.words.length ? 1 : -1) : w, parts, k;
  if (showW < 0) return;
  parts = rapWordParts(rapids.words[showW]);
  for (k = 0; k < parts.length; k++) playNote(392 + k * 60, k * 0.32, 0.28, 'triangle', 0.3);
  rapids.sayT = 0;
  rapids.sayWord = showW;
}

function handleRapidsTap(px, py) {
  var p = rapids.p, hr = rapids.hudRect;
  if (!running || celebrating || puzzleBusy()) return;
  if (hr && px >= hr.x && px <= hr.x + hr.w && py >= hr.y && py <= hr.y + hr.h) { rapSayWord(); return; }
  if (p.hop || p.splashT > 0) return;
  var to, tx = null, i, lg, lane;
  if (py > p.y + rapids.rowH * 0.5 && p.row > 0) to = p.row - 1;
  else if (p.row < rapTop()) to = p.row + 1;
  else return;
  // Napautus tukkiin/pilveen seuraavalla kaistalla: hyppy suuntautuu siihen (ulottuvuuden rajoissa)
  lane = rapids.lanes[to];
  if (lane && Math.abs(py - rapRowY(to)) < rapids.rowH * 0.7) {
    for (i = 0; i < lane.logs.length; i++) {
      lg = lane.logs[i];
      if (px >= lg.x && px <= lg.x + lg.w) {
        tx = Math.min(Math.max(lg.x + lg.w / 2, p.x - viewW * 0.3), p.x + viewW * 0.3);
        break;
      }
    }
  }
  p.hop = { from: p.row, to: to, t: 0, x0: p.x, tx: tx === null ? p.x : tx };
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
  spawnSparkles(p.x, p.y, 18, rapSky() ? '#ffffff' : '#9fdcff');
  playNote(300, 0, 0.2, 'sine', 0.35);
  playNote(180, 0.1, 0.3, 'sine', 0.3);
  loseHeart();
}

// Sana, jota parhaillaan kirjoitetaan (0 = ennen saarta, 1 = saaren jälkeen)
function rapCurWord() {
  if (rapids.mode === 'logs' || rapids.words.length === 0) return -1;
  return rapids.p.row < rapids.island && !rapWordDone(0) ? 0 : (rapWordDone(1) ? -1 : (rapids.p.row >= rapids.island || rapWordDone(0) ? 1 : 0));
}
function rapWordRows(w) {
  var start = w === 0 ? 1 : rapids.island + 1, n = rapWordParts(rapids.words[w]).length;
  return { start: start, end: start + n - 1 };
}
function rapWordDone(w) {
  var rr = rapWordRows(w), r;
  for (r = rr.start; r <= rr.end; r++) if (!rapids.done[r]) return false;
  return true;
}
function rapAllDone() {
  return rapids.mode === 'logs' || (rapWordDone(0) && rapWordDone(1));
}

function rapLand(row) {
  var p = rapids.p, lane, i, lg, tol = rapids.rowH * 0.3, found = null;
  p.row = row;
  p.y = rapRowY(row);
  if (rapIsWater(row)) {
    lane = rapids.lanes[row];
    for (i = 0; i < lane.logs.length; i++) {
      lg = lane.logs[i];
      if (p.x >= lg.x - tol && p.x <= lg.x + lg.w + tol && !turtleUnder(lg) && lg.tipT <= 0) { found = lg; break; }
    }
    if (!found) { rapSplash(); return; }
    if (rapids.tokens[row] && found.token !== rapids.tokens[row][0]) {
      // Väärä tavu/kirjain: tukki keikahtaa ja prinsessa putoaa
      found.tipT = 1.2;
      p.x = found.x + found.w / 2;
      playNote(220, 0, 0.15, 'triangle', 0.3);
      rapSplash();
      return;
    }
    p.log = found;
    p.off = Math.min(Math.max(p.x - found.x, found.w * 0.1), found.w * 0.9);
    if (rapids.tokens[row] && !rapids.done[row]) {
      rapids.done[row] = true;
      var w = row < rapids.island ? 0 : 1, rr = rapWordRows(w), idx = row - rr.start;
      playNote(392 + idx * 70, 0, 0.32, 'triangle', 0.35);
      spawnSparkles(p.x, p.y - rapids.rowH * 0.6, 12, '#ffe27a');
      if (rapWordDone(w)) {
        var parts = rapWordParts(rapids.words[w]), k;
        for (k = 0; k < parts.length; k++) playNote(523 + k * 60, 0.5 + k * 0.28, 0.3, 'triangle', 0.35);
        playNote(1047, 0.5 + parts.length * 0.28, 0.5, 'triangle', 0.4);
      }
    } else {
      playNote(880, 0, 0.08, 'triangle', 0.25);
    }
    return;
  }
  p.log = null;
  if (row === rapids.island) {
    if (!checkpoints[0].lit) setCheckpoint(checkpoints[0], viewW * 0.5, p.y);
    p.safeRow = rapids.island;
    if (!tasks[0].opened) taskStart(tasks[0]);
  } else if (row === rapTop()) {
    p.safeRow = rapTop();
    if (!tasks[1].opened) taskStart(tasks[1]);
  } else if (row === 0) {
    p.safeRow = 0;
  }
}

function updateRapids(dt) {
  var p = rapids.p, r, lane, i, lg, P;
  updateTasks(dt);
  var busy = puzzleBusy();

  for (r in rapids.lanes) {
    lane = rapids.lanes[r];
    P = viewW + lane.len;
    for (i = 0; i < lane.logs.length; i++) {
      lg = lane.logs[i];
      if (lg.tipT > 0) lg.tipT -= dt;
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
  if (rapids.sayT >= 0) { rapids.sayT += dt; if (rapids.sayT > 0.32 * 5) rapids.sayT = -1; }

  if (p.splashT > 0) {
    p.splashT -= dt;
    if (p.splashT <= 0) rapReturn();
  } else if (p.hop) {
    if (!busy && !celebrating) {
      p.hop.t += dt / RAP_HOP_T;
      p.y = rapRowY(p.hop.from) + (rapRowY(p.hop.to) - rapRowY(p.hop.from)) * Math.min(1, p.hop.t);
      p.x = p.hop.x0 + (p.hop.tx - p.hop.x0) * Math.min(1, p.hop.t);
      if (p.hop.tx !== p.hop.x0) p.facing = p.hop.tx > p.hop.x0 ? 1 : -1;
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

  if (p.row === rapTop() && tasks[1].opened && rapAllDone() && !celebrating && !p.hop) startCelebration();

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderRapidsBg(b, w, h) {
  var i, x, r, y0, y1, vw = viewW, rh = rapids.rowH, sky = rapSky();
  b.fillStyle = sky ? '#8fc8ff' : '#2f8ccc';
  b.fillRect(0, 0, w, h);
  if (sky) {
    var sg = b.createLinearGradient(0, 0, 0, h);
    sg.addColorStop(0, '#5fa8ff');
    sg.addColorStop(1, '#dff3ff');
    b.fillStyle = sg;
    b.fillRect(0, 0, w, h);
    b.fillStyle = '#fff6c8';
    b.beginPath(); b.arc(vw * 0.88, h * 0.09, h * 0.05, 0, Math.PI * 2); b.fill();
  } else {
    // Taivas ja vuoret yläreunassa
    var sk = b.createLinearGradient(0, 0, 0, h * 0.16);
    sk.addColorStop(0, '#9fdcff');
    sk.addColorStop(1, '#dff3ff');
    b.fillStyle = sk;
    b.fillRect(0, 0, w, h * 0.16);
    b.fillStyle = '#8fa8c8';
    for (i = 0; i < 7; i++) {
      x = vw * (i / 6);
      b.beginPath(); b.moveTo(x - h * 0.16, h * 0.16); b.lineTo(x, h * 0.03 + (i % 2) * h * 0.03); b.lineTo(x + h * 0.16, h * 0.16); b.closePath(); b.fill();
      b.fillStyle = '#ffffff';
      b.beginPath(); b.moveTo(x - h * 0.05, h * 0.07 + (i % 2) * h * 0.03); b.lineTo(x, h * 0.03 + (i % 2) * h * 0.03); b.lineTo(x + h * 0.05, h * 0.07 + (i % 2) * h * 0.03); b.closePath(); b.fill();
      b.fillStyle = '#8fa8c8';
    }
  }
  for (r = 0; r < rapids.rows; r++) {
    y0 = rapRowY(r) - rh / 2;
    y1 = y0 + rh;
    if (rapIsWater(r)) {
      if (sky) {
        b.fillStyle = r % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)';
        b.fillRect(0, y0, vw, rh);
        continue;
      }
      var wg = b.createLinearGradient(0, y0, 0, y1);
      wg.addColorStop(0, r % 2 ? '#3a9be0' : '#2f8ccc');
      wg.addColorStop(1, r % 2 ? '#2b83c4' : '#2677b8');
      b.fillStyle = wg;
      b.fillRect(0, y0, vw, rh);
      b.fillStyle = 'rgba(255,255,255,0.12)';
      for (i = 0; i < 12; i++) b.fillRect((i * 173 + r * 61) % vw, y0 + rh * (0.2 + (i % 3) * 0.25), vw * 0.03, Math.max(1, h * 0.003));
    } else {
      var isIsland = r === rapids.island;
      if (sky) {
        // Pilvipenkka tai pilvisaari
        b.fillStyle = '#ffffff';
        if (isIsland) {
          b.beginPath();
          if (b.ellipse) b.ellipse(vw / 2, y0 + rh * 0.55, vw * 0.4, rh * 0.45, 0, 0, Math.PI * 2);
          else b.arc(vw / 2, y0 + rh * 0.55, rh * 0.45, 0, Math.PI * 2);
          b.fill();
          for (i = 0; i < 6; i++) cloudShape(b, vw * (0.2 + i * 0.12), y0 + rh * 0.45, rh * 0.18);
        } else {
          b.fillRect(0, y0 + rh * 0.3, vw, rh * 0.7);
          for (i = 0; i < 14; i++) cloudShape(b, vw * (i / 13), y0 + rh * 0.4, rh * 0.2);
        }
        continue;
      }
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
  var ty = rapRowY(rapTop()) + rh * 0.45;
  if (sky) {
    // Sanapöllön oksa ylärannalla
    b.fillStyle = '#8a5a30';
    b.fillRect(vw * 0.78, ty - rh * 0.35, vw * 0.16, rh * 0.08);
  } else {
    // Yläranta: teltta ja lippu
    b.fillStyle = '#ff7bac';
    b.beginPath(); b.moveTo(vw * 0.78, ty); b.lineTo(vw * 0.85, ty - rh * 0.9); b.lineTo(vw * 0.92, ty); b.closePath(); b.fill();
    b.fillStyle = '#c94f7e';
    b.beginPath(); b.moveTo(vw * 0.83, ty); b.lineTo(vw * 0.85, ty - rh * 0.45); b.lineTo(vw * 0.87, ty); b.closePath(); b.fill();
    drawTree(b, vw * 0.12, ty, rh * 1.2);
    drawTree(b, vw * 0.94, rapRowY(0) + rh * 0.45, rh * 1.1);
  }
}

function drawLog(c, lg, y) {
  var x = lg.x, w = lg.w, hh = rapids.rowH * 0.5, tip = lg.tipT > 0 ? Math.sin(Math.min(1, (1.2 - lg.tipT) * 3)) * 0.5 : 0;
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
    c.fillStyle = '#7bc46a';
    c.beginPath(); c.arc(x + (lg.dir > 0 ? w + hh * 0.2 : -hh * 0.2), y + wob, hh * 0.24, 0, Math.PI * 2); c.fill();
    return;
  }
  c.save();
  if (tip) {
    c.translate(x + w / 2, y);
    c.rotate(tip * lg.dir);
    c.translate(-(x + w / 2), -y);
    c.globalAlpha = Math.max(0.2, lg.tipT / 1.2);
  }
  if (rapSky()) {
    // Pilvi
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x + w * 0.25, y + hh * 0.2, hh * 0.55, 0, Math.PI * 2);
    c.arc(x + w * 0.5, y + hh * 0.05, hh * 0.7, 0, Math.PI * 2);
    c.arc(x + w * 0.75, y + hh * 0.2, hh * 0.55, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(200,215,255,0.6)';
    roundRect(c, x + hh * 0.2, y + hh * 0.35, w - hh * 0.4, hh * 0.3, hh * 0.15);
    c.fill();
  } else {
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
  if (lg.token) {
    // Tavu tai kirjain kyltissä tukin/pilven päällä
    var th = hh * 1.05, tw = Math.max(th * 1.2, th * 0.62 * lg.token.length + th * 0.5);
    c.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(c, x + w / 2 - tw / 2, y - th * 0.55, tw, th, th * 0.25);
    c.fill();
    c.strokeStyle = rapSky() ? '#9fc8ff' : '#c98b4a';
    c.lineWidth = Math.max(1.5, th * 0.06);
    c.stroke();
    readFont(c, th * 0.68);
    c.fillStyle = '#8a2be2';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(lg.token, x + w / 2, y - th * 0.02);
    c.textBaseline = 'alphabetic';
  }
  c.restore();
}

function drawRapidsWaves(c) {
  var r, i, y, x, w, rh = rapids.rowH;
  c.strokeStyle = rapSky() ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1.5, viewH * 0.004);
  c.lineCap = 'round';
  for (r in rapids.lanes) {
    var lane = rapids.lanes[r];
    y = rapRowY(r);
    for (i = 0; i < 6; i++) {
      w = rh * 0.6;
      x = ((globalT * lane.dir * lane.sp * viewW * 0.6 + i * viewW / 6 + Number(r) * 40) % (viewW + w) + viewW + w) % (viewW + w) - w / 2;
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

// Sana-HUD: kirjoitettavan sanan osat; tehdyt värillisinä, seuraava hehkuu, kuva lopussa
function drawRapWordHud(c) {
  var w = rapCurWord(), showW = w < 0 ? (rapids.words.length ? 1 : -1) : w;
  if (showW < 0) return;
  var word = rapids.words[showW], parts = rapWordParts(word), rr = rapWordRows(showW), i, x, tw;
  var h = viewH * 0.085, sep = rapids.mode === 'syl' ? '-' : '';
  readFont(c, h * 0.62);
  var widths = [], total = 0;
  for (i = 0; i < parts.length; i++) { widths.push(c.measureText(parts[i]).width); total += widths[i]; }
  if (sep) total += c.measureText(sep).width * (parts.length - 1);
  // Vasemmassa yläkulmassa, jotta sydämet keskellä jäävät näkyviin
  var bw = total + h * 1.6 + h * 1.1, bx = hudX() + bw / 2, by = viewH * 0.075;
  var sayIdx = rapids.sayT >= 0 && rapids.sayWord === showW ? Math.floor(rapids.sayT / 0.32) : -1;
  rapids.hudRect = { x: bx - bw / 2, y: by - h / 2, w: bw, h: h };
  c.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(c, bx - bw / 2, by - h / 2, bw, h, h * 0.4);
  c.fill();
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  x = bx - bw / 2 + h * 0.5;
  var nextFound = false;
  for (i = 0; i < parts.length; i++) {
    var done = !!rapids.done[rr.start + i], isNext = !done && !nextFound;
    if (isNext) {
      nextFound = true;
      var g = c.createRadialGradient(x + widths[i] / 2, by, h * 0.1, x + widths[i] / 2, by, h * 0.7);
      g.addColorStop(0, 'rgba(255,230,140,' + (0.6 + Math.sin(globalT * 5) * 0.25) + ')');
      g.addColorStop(1, 'rgba(255,230,140,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(x + widths[i] / 2, by, h * 0.7, 0, Math.PI * 2); c.fill();
    }
    readFont(c, h * 0.62);
    c.fillStyle = done ? '#ff5f7e' : (isNext ? '#8a2be2' : 'rgba(138,43,226,0.35)');
    if (i === sayIdx) c.fillStyle = '#ffb300';
    c.fillText(parts[i], x, by + h * 0.03);
    x += widths[i];
    if (sep && i < parts.length - 1) { c.fillStyle = '#c9a0ff'; c.fillText(sep, x, by + h * 0.03); x += c.measureText(sep).width; }
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // Kuva paljastuu, kun sana on valmis
  var ix = bx + bw / 2 - h * 0.6;
  c.fillStyle = rapWordDone(showW) ? '#fff6d8' : 'rgba(200,190,220,0.5)';
  c.beginPath(); c.arc(ix, by, h * 0.42, 0, Math.PI * 2); c.fill();
  if (rapWordDone(showW)) drawWordIcon(c, word.icon, ix, by, h * 0.42);
  else {
    c.fillStyle = '#8a2be2';
    readFont(c, h * 0.55);
    c.textBaseline = 'middle';
    c.fillText('?', ix, by + h * 0.03);
    c.textBaseline = 'alphabetic';
  }
}

// Sanapöllö ylärannan oksalla (kirjaintila): nukkuu, kunnes sanat on kirjoitettu
function drawWordOwl(c) {
  var rh = rapids.rowH, x = viewW * 0.86, y = rapRowY(rapTop()) + rh * 0.1;
  var o = { x: x, y: y, state: rapAllDone() ? 'hoot' : 'sleep' };
  drawNightOwl(c, o);
  if (rapAllDone()) drawStar(c, x, y - rh * 0.9, rh * 0.22, globalT, 1);
}

function drawRapids() {
  var p = rapids.p, r, i, lane, rh = rapids.rowH, y, sky = rapSky();
  if (!drawWorldBg()) return;
  drawRapidsWaves(ctx);
  if (!sky) {
    for (i = 0; i < rapids.fish.length; i++) {
      var f = rapids.fish[i];
      if (f.t < 1 && rapIsWater(f.row)) {
        var fy = rapRowY(f.row) - Math.sin(f.t * Math.PI) * rh * 0.6;
        ctx.fillStyle = '#ffb347';
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(f.x, fy, rh * 0.16, rh * 0.09, (f.t - 0.5) * 2, 0, Math.PI * 2);
        else ctx.arc(f.x, fy, rh * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  for (r in rapids.lanes) {
    lane = rapids.lanes[r];
    y = rapRowY(r);
    for (i = 0; i < lane.logs.length; i++) drawLog(ctx, lane.logs[i], y);
  }
  drawLantern(ctx, checkpoints[0], rapRowY(rapids.island) + rh * 0.4);
  if (!tasks[0].opened) drawQuestionStone(ctx, viewW * 0.5 + rh * 1.6, rapRowY(rapids.island) + rh * 0.35, rh * 0.7);
  if (!tasks[1].opened) drawQuestionStone(ctx, viewW * 0.5 + rh * 1.6, rapRowY(rapTop()) + rh * 0.35, rh * 0.7);
  if (sky) drawWordOwl(ctx);
  drawBunny(ctx, viewW * 0.28, rapRowY(rapTop()) + rh * 0.4, rh * 0.32, celebrating ? Math.abs(Math.sin(globalT * 9)) * rh * 0.2 : 0, globalT * 3, false);
  drawBunny(ctx, viewW * 0.36, rapRowY(rapTop()) + rh * 0.42, rh * 0.28, celebrating ? Math.abs(Math.sin(globalT * 9 + 1)) * rh * 0.2 : 0, globalT * 3 + 1, false);
  var s = rh * 1.15 / 58;
  var hopLift = p.hop ? Math.sin(Math.min(1, p.hop.t) * Math.PI) * rh * 0.6 : 0;
  if (p.splashT > 0) {
    ctx.globalAlpha = 0.6;
    var fall = sky ? (0.8 - p.splashT) * rh * 3 : 0;
    drawPrincessFree(ctx, p.x, p.y + rh * 0.55 + fall + Math.sin(globalT * 8) * rh * 0.05, s * 0.9, p.facing, 0, false, globalT);
    ctx.globalAlpha = 1;
    if (!sky) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x + (i - 1) * rh * 0.3, p.y + rh * 0.1 - ((globalT * 1.5 + i * 0.3) % 1) * rh * 0.3, rh * 0.06, 0, Math.PI * 2); ctx.fill(); }
    }
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
  if (rapids.mode === 'logs') {
    drawPickupHud(ctx, rapTop(), function (i2) { return i2 < rapids.p.row; },
      function (c, x, y2, s2) { c.fillStyle = '#5fa8ff'; c.beginPath(); c.arc(x, y2, s2 * 0.45, 0, Math.PI * 2); c.fill(); });
  } else {
    drawRapWordHud(ctx);
  }
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
