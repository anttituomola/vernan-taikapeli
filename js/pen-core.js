'use strict';

// Taikakynän yhteinen ydin: viivat, muste, kynätila ja pintoja seuraava kävely.
// Kentät play-pen, play-rain, play-bunnybridge ja play-scribble käyttävät näitä.
// Kenttä voi asettaa:
//   penHooks.onStroke(s)      -> true, jos kenttä käsitteli viivan (esim. muotoportti)
//   penHooks.bubbleTargets()  -> oliot { x, y, bubbleT }, jotka ympyrä voi vangita

var penStrokes = [];   // { pts: [{x, y}], age, len }
var penBubbles = [];   // { x, y, r, age }
var penCur = null;     // parhaillaan piirrettävä viiva
var penInk = 0, penInkMax = 0;
var penMode = false, penAutoT = 0;
var penWait = false, penWaitT = 0, penStun = 0, penDir = 1;
var penHooks = { onStroke: null, bubbleTargets: null };
var PEN_LIFE = 8, PEN_BUBBLE = 6, PEN_STEP = 0.07, PEN_SLOPE = 1.4, PEN_DROP = 0.4;

function penCoreReset() {
  penStrokes = [];
  penBubbles = [];
  penCur = null;
  penInkMax = viewW * 1.6;
  penInk = penInkMax;
  penMode = false;
  penAutoT = 0;
  penWait = false;
  penWaitT = 0;
  penStun = 0;
  penDir = 1;
  penHooks = { onStroke: null, bubbleTargets: null };
  document.getElementById('jumpBtn').style.display = 'none';
  var btn = document.getElementById('penBtn');
  btn.style.display = 'block';
  btn.className = '';
}

function penCoreResize(ratio) {
  var i, k;
  for (i = 0; i < penStrokes.length; i++) {
    for (k = 0; k < penStrokes[i].pts.length; k++) penStrokes[i].pts[k].x *= ratio;
  }
  for (i = 0; i < penBubbles.length; i++) penBubbles[i].x *= ratio;
  penInkMax = viewW * 1.6;
  penInk = Math.min(penInk, penInkMax);
}

// ---------- Kynätila ----------
function penSetMode(on) {
  penMode = !!on;
  penCur = null;
  document.getElementById('penBtn').className = penMode ? 'on' : '';
  if (penMode) {
    spawnSparkles(princess.x, princess.y - viewH * 0.25, 8, '#c9a0ff');
    playNote(880, 0, 0.08, 'sine', 0.25);
    playNote(1175, 0.06, 0.12, 'sine', 0.25);
  } else {
    playNote(660, 0, 0.08, 'triangle', 0.22);
  }
}

function penToggle() {
  if (!running || celebrating || puzzleBusy()) return;
  penSetMode(!penMode);
}

// ---------- Piirtäminen ----------
function penStart(px, py) {
  if (!running || celebrating || puzzleBusy() || !penMode) return;
  penCur = { pts: [{ x: px + camX, y: py }], age: 0, len: 0 };
}

function penMove(px, py) {
  if (!penCur) return;
  var last = penCur.pts[penCur.pts.length - 1];
  var wx = px + camX, dx = wx - last.x, dy = py - last.y, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 5) return;
  if (penInk <= 0) return;
  var use = Math.min(d, penInk);
  if (use < d) { wx = last.x + dx * use / d; py = last.y + dy * use / d; }
  penInk -= use;
  penCur.len += use;
  penCur.pts.push({ x: wx, y: py });
  if (penCur.pts.length % 4 === 0) spawnSparkles(wx, py, 1, '#c9a0ff');
  if (penCur.pts.length === 2) playNote(660, 0, 0.05, 'sine', 0.12);
}

function penEnd() {
  var s = penCur;
  penCur = null;
  if (!s) return;
  if (s.len < viewH * 0.02) {
    // Pelkkä napautus: ei viivaa, muste takaisin
    penInk = Math.min(penInkMax, penInk + s.len);
    return;
  }
  if (penHooks.onStroke && penHooks.onStroke(s)) return;
  if (penIsLoop(s)) { penCastBubble(s); return; }
  penStrokes.push(s);
  playNote(880, 0, 0.12, 'sine', 0.2);
}

function penBox(s) {
  var i, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (i = 0; i < s.pts.length; i++) {
    minX = Math.min(minX, s.pts[i].x); maxX = Math.max(maxX, s.pts[i].x);
    minY = Math.min(minY, s.pts[i].y); maxY = Math.max(maxY, s.pts[i].y);
  }
  return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, w: maxX - minX, h: maxY - minY };
}

// Suljettu viiva: alku ja loppu lähellä toisiaan, laatikko riittävän iso molempiin suuntiin
function penIsLoop(s) {
  if (s.pts.length < 10) return false;
  var b = penBox(s);
  if (b.w < viewH * 0.07 || b.h < viewH * 0.07) return false;
  var a = s.pts[0], z = s.pts[s.pts.length - 1];
  var dx = a.x - z.x, dy = a.y - z.y;
  return Math.sqrt(dx * dx + dy * dy) < Math.max(b.w, b.h) * 0.3 && s.len > viewH * 0.2;
}

// Kuplakohteet suljetun viivan laatikon sisällä
function penLoopTargets(s) {
  var b = penBox(s), i, r = Math.max(b.w, b.h) / 2, res = [];
  var targets = penHooks.bubbleTargets ? penHooks.bubbleTargets() : [];
  for (i = 0; i < targets.length; i++) {
    var t = targets[i];
    if (t.x > b.minX - r * 0.2 && t.x < b.maxX + r * 0.2 && t.y > b.minY - r * 0.2 && t.y < b.maxY + r * 0.2) res.push(t);
  }
  return res;
}

function penCastBubble(s) {
  var b = penBox(s), i;
  var cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, r = Math.max(b.w, b.h) / 2;
  var hits = penLoopTargets(s);
  for (i = 0; i < hits.length; i++) {
    hits[i].bubbleT = PEN_BUBBLE;
    penBubbles.push({ x: hits[i].x, y: hits[i].y, r: Math.max(r, viewH * 0.09), age: 0 });
  }
  if (hits.length > 0) {
    spawnSparkles(cx, cy, 16, '#c9f0ff');
    playNote(784, 0, 0.15, 'sine', 0.3);
    playNote(1175, 0.1, 0.25, 'sine', 0.3);
  } else {
    // Tyhjä kupla poksahtaa heti
    penBubbles.push({ x: cx, y: cy, r: r, age: PEN_BUBBLE - 0.6 });
    spawnSparkles(cx, cy, 8, '#c9f0ff');
    playNote(392, 0, 0.1, 'sine', 0.2);
  }
}

// ---------- Muodontunnistus (portit) ----------
function penResample(s, n) {
  var pts = s.pts, i, total = 0, segs = [], out = [pts[0]];
  for (i = 1; i < pts.length; i++) {
    var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, d = Math.sqrt(dx * dx + dy * dy);
    segs.push(d);
    total += d;
  }
  if (total < 1 || pts.length < 2) return pts.slice();
  var step = total / (n - 1), acc = 0, target = step;
  for (i = 1; i < pts.length && out.length < n - 1; i++) {
    var d2 = segs[i - 1];
    while (d2 > 0 && acc + d2 >= target && out.length < n - 1) {
      var t = (target - acc) / d2;
      out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t });
      target += step;
    }
    acc += d2;
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// 'line' | 'zigzag' | 'circle' | 'triangle' | 'square'
function penClassify(s) {
  var b = penBox(s), size = Math.max(b.w, b.h), i;
  if (s.len < viewH * 0.12 || size < viewH * 0.06) return 'line';
  var p = penResample(s, 36), n = p.length;
  var a = s.pts[0], z = s.pts[s.pts.length - 1];
  var closeD = Math.sqrt((a.x - z.x) * (a.x - z.x) + (a.y - z.y) * (a.y - z.y));
  var closed = closeD < size * 0.3 && b.w > viewH * 0.06 && b.h > viewH * 0.06;
  var ang = [], turn = [], d;
  for (i = 1; i < n; i++) ang.push(Math.atan2(p[i].y - p[i - 1].y, p[i].x - p[i - 1].x));
  if (closed) ang.push(ang[0], ang[1]);
  for (i = 1; i < ang.length; i++) {
    d = ang[i] - ang[i - 1];
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    turn.push(d);
  }
  // Kulma = kolmen askeleen käännössumma yli 50°; terävyys katsotaan kulman kohdalta
  // parhaasta ikkunasta, jotta osuma ei riipu siitä mihin ikkuna sattuu alkamaan
  var corners = 0, sharp = 0, last = -10, w, wm;
  for (i = 0; i < turn.length; i++) {
    w = Math.abs(turn[i] + (turn[i + 1] || 0) + (turn[i + 2] || 0));
    if (w > 0.87 && i - last > 3) {
      wm = Math.max(w,
        Math.abs((turn[i + 1] || 0) + (turn[i + 2] || 0) + (turn[i + 3] || 0)),
        Math.abs((turn[i + 2] || 0) + (turn[i + 3] || 0) + (turn[i + 4] || 0)));
      corners++;
      last = i;
      if (wm > 1.6) sharp++;
    }
  }
  if (!closed) {
    if (sharp >= 2 && size > viewH * 0.12) return 'zigzag';
    return 'line';
  }
  var cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, mean = 0, dev = 0, rs = [];
  for (i = 0; i < n; i++) { rs.push(Math.sqrt((p[i].x - cx) * (p[i].x - cx) + (p[i].y - cy) * (p[i].y - cy))); mean += rs[i]; }
  mean /= n;
  for (i = 0; i < n; i++) dev += Math.abs(rs[i] - mean);
  dev /= n;
  if (dev / mean < 0.07) return 'circle';
  if (corners <= 2) return 'circle';
  if (corners === 3) return 'triangle';
  return 'square';
}

// ---------- Pinnat ja kävely ----------
// Pinnat kohdassa x: maa (platforms) ja piirretyt viivat
function penSurfaces(x) {
  var res = [], i, k, pl, s, a, b2, y, slope;
  for (i = 0; i < platforms.length; i++) {
    pl = platforms[i];
    if (x >= pl.x && x <= pl.x + pl.w) res.push({ y: pl.y, slope: 0, ground: true });
  }
  for (i = 0; i < penStrokes.length; i++) {
    s = penStrokes[i];
    for (k = 0; k + 1 < s.pts.length; k++) {
      a = s.pts[k]; b2 = s.pts[k + 1];
      if (Math.abs(b2.x - a.x) < 0.5) continue;
      if (x < Math.min(a.x, b2.x) || x > Math.max(a.x, b2.x)) continue;
      y = a.y + (x - a.x) * (b2.y - a.y) / (b2.x - a.x);
      slope = Math.abs((b2.y - a.y) / (b2.x - a.x));
      res.push({ y: y, slope: slope, ground: false });
    }
  }
  return res;
}

function penGroundYAt(x) {
  var i, best = groundTop + viewH;
  for (i = 0; i < platforms.length; i++) {
    if (x >= platforms[i].x && x <= platforms[i].x + platforms[i].w && platforms[i].y < best) best = platforms[i].y;
  }
  return best > groundTop + viewH * 0.5 ? groundTop : best;
}

// Rotkon vasen reuna kohdan x takana (segmentit [[a, b], ...] osuuksina)
function penPitEdgeX(segs, x) {
  var i, best = 0;
  for (i = 0; i < segs.length; i++) {
    var end = segs[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  return best > 0 ? best - viewH * 0.09 : null;
}

// Putoava olio kohdassa x välillä oldY..newY: osuu pintaan? Palauttaa pinnan tai null
function penFallHit(x, oldY, newY) {
  var cands = penSurfaces(x), i, best = null;
  for (i = 0; i < cands.length; i++) {
    if (cands[i].slope <= PEN_SLOPE && cands[i].y >= oldY - 1 && cands[i].y <= newY && (!best || cands[i].y < best.y)) best = cands[i];
  }
  return best;
}

// Yleinen kävelijä: a = { x, y, vy, onGround, facing }, opts = { targetX, speed, stopDist, onFall, wallX }
// Palauttaa 'walk' | 'stand' | 'wait' | 'air'
function penWalkerStep(a, dt, opts) {
  var pw = viewH * 0.045, i, c, best, oldY, newY, cands;
  if (!a.onGround) {
    a.vy += viewH * 1.4 * dt;
    if (a.vy > viewH * 1.05) a.vy = viewH * 1.05;
    oldY = a.y;
    newY = a.y + a.vy * dt;
    best = penFallHit(a.x, oldY, newY);
    if (best) {
      a.y = best.y;
      a.vy = 0;
      a.onGround = true;
    } else {
      a.y = newY;
      if (a.y > groundTop + viewH * 0.12 && opts.onFall) opts.onFall(a);
    }
    return 'air';
  }
  // Onko jalkojen alla yhä pintaa? Haihtunut silta pudottaa
  var here = penSurfaces(a.x), supported = false;
  for (i = 0; i < here.length; i++) {
    if (here[i].slope <= PEN_SLOPE && Math.abs(here[i].y - a.y) <= viewH * 0.02) { supported = true; break; }
  }
  if (!supported) {
    a.onGround = false;
    a.vy = 0;
    return 'air';
  }
  if (opts.targetX === undefined || opts.targetX === null) return 'stand';
  var dxh = opts.targetX - a.x;
  if (Math.abs(dxh) <= (opts.stopDist || 10)) return 'stand';
  var dir = dxh > 0 ? 1 : -1;
  a.facing = dir;
  var nx = a.x + dir * Math.min((opts.speed || viewW * 0.16) * dt, Math.abs(dxh));
  if (nx < pw) nx = pw;
  if (nx > worldW - pw) nx = worldW - pw;
  if (opts.wallX !== undefined && opts.wallX !== null && dir > 0 && nx > opts.wallX) nx = Math.max(a.x, opts.wallX);
  if (Math.abs(nx - a.x) < 0.01) return 'wait';
  cands = penSurfaces(nx);
  best = null;
  for (i = 0; i < cands.length; i++) {
    c = cands[i];
    if (c.slope <= PEN_SLOPE && Math.abs(c.y - a.y) <= viewH * PEN_STEP && (!best || c.y < best.y)) best = c;
  }
  if (best) {
    a.x = nx;
    a.y = best.y;
    return 'walk';
  }
  var drop = null;
  for (i = 0; i < cands.length; i++) {
    c = cands[i];
    if (c.slope <= PEN_SLOPE && c.y > a.y && c.y - a.y <= viewH * PEN_DROP && (!drop || c.y < drop.y)) drop = c;
  }
  if (drop) {
    a.x = nx;
    a.onGround = false;
    a.vy = 0;
    return 'air';
  }
  return 'wait';
}

// Prinsessa: pohjassa pitäminen kävelyttää sormea kohti; reunalla tai seinällä
// pusertaminen ottaa kynän esiin. opts = { onFall, wallX }
function penPrincessStep(dt, opts) {
  opts = opts || {};
  if (penStun > 0) penStun -= dt;
  var target = (holding && !penMode && penStun <= 0) ? holdWorldX : null;
  var r = penWalkerStep(princess, dt, { targetX: target, speed: viewW * 0.16, onFall: opts.onFall, wallX: opts.wallX });
  if (r === 'walk') {
    penDir = princess.facing;
    princess.walkPhase += dt * 10;
    penWait = false;
    penWaitT = 0;
    penAutoT = 0;
  } else if (r === 'wait') {
    if (!penWait) { penWait = true; penWaitT = 0; }
    penWaitT += dt;
    penAutoT += dt;
    if (!penMode && penAutoT > 0.6) penSetMode(true);
  } else {
    if (penWait) penWaitT += dt;
    penAutoT = 0;
    if (r === 'air') penWait = false;
  }
  return r;
}

function penCoreUpdate(dt) {
  var i;
  penInk = Math.min(penInkMax, penInk + viewW * 0.22 * dt);
  for (i = penStrokes.length - 1; i >= 0; i--) {
    penStrokes[i].age += dt;
    if (penStrokes[i].age > PEN_LIFE) penStrokes.splice(i, 1);
  }
  for (i = penBubbles.length - 1; i >= 0; i--) {
    penBubbles[i].age += dt;
    if (penBubbles[i].age > PEN_BUBBLE) penBubbles.splice(i, 1);
  }
}

// ---------- Piirto ----------
function drawPenGlyph(c, x, y, s, color) {
  c.save();
  c.translate(x, y);
  c.rotate(-Math.PI / 4);
  c.fillStyle = color || '#8a4dff';
  roundRect(c, -s * 0.16, -s * 0.6, s * 0.32, s * 0.9, s * 0.1);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-s * 0.16, -s * 0.15, s * 0.32, s * 0.12);
  c.fillStyle = '#4a2a7a';
  c.beginPath(); c.moveTo(-s * 0.16, s * 0.3); c.lineTo(s * 0.16, s * 0.3); c.lineTo(0, s * 0.62); c.closePath(); c.fill();
  c.restore();
}

function drawInkBottle(c, x, y, s) {
  var g = c.createRadialGradient(x, y, s * 0.2, x, y, s * 1.9);
  g.addColorStop(0, 'rgba(201,160,255,0.45)');
  g.addColorStop(1, 'rgba(201,160,255,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, s * 1.9, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e9ddff';
  roundRect(c, x - s * 0.8, y - s * 0.5, s * 1.6, s * 1.4, s * 0.35);
  c.fill();
  c.fillStyle = '#8a4dff';
  roundRect(c, x - s * 0.66, y - s * 0.05, s * 1.32, s * 0.82, s * 0.3);
  c.fill();
  c.fillStyle = '#e9ddff';
  c.fillRect(x - s * 0.35, y - s * 0.95, s * 0.7, s * 0.5);
  c.fillStyle = '#a9743f';
  roundRect(c, x - s * 0.42, y - s * 1.25, s * 0.84, s * 0.4, s * 0.12);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  roundRect(c, x - s * 0.6, y - s * 0.3, s * 0.22, s * 0.8, s * 0.1);
  c.fill();
}

function drawPenStroke(c, s, alpha, live) {
  var i;
  if (s.pts.length < 2) return;
  c.globalAlpha = alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = live ? '#b07dff' : '#8a4dff';
  c.lineWidth = Math.max(4, viewH * 0.018);
  c.beginPath();
  c.moveTo(s.pts[0].x - camX, s.pts[0].y);
  for (i = 1; i < s.pts.length; i++) c.lineTo(s.pts[i].x - camX, s.pts[i].y);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = Math.max(1.5, viewH * 0.006);
  c.stroke();
  c.globalAlpha = 1;
  c.lineCap = 'butt';
  c.lineJoin = 'miter';
}

function drawPenStrokesLayer(c) {
  var i, s, a;
  for (i = 0; i < penStrokes.length; i++) {
    s = penStrokes[i];
    a = s.age > PEN_LIFE - 1 ? Math.max(0, PEN_LIFE - s.age) : 1;
    drawPenStroke(c, s, a, false);
  }
  if (penCur) drawPenStroke(c, penCur, 1, true);
}

function drawPenBubble(c, bb) {
  var x = bb.x - camX, a = bb.age > PEN_BUBBLE - 0.6 ? Math.max(0, (PEN_BUBBLE - bb.age) / 0.6) : 1;
  var r = bb.r * (1 + Math.sin(globalT * 3) * 0.03);
  c.globalAlpha = a;
  c.fillStyle = 'rgba(180,230,255,0.25)';
  c.beginPath(); c.arc(x, bb.y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.arc(x - r * 0.35, bb.y - r * 0.35, r * 0.18, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
}

function drawPenBubblesLayer(c) {
  var i;
  for (i = 0; i < penBubbles.length; i++) drawPenBubble(c, penBubbles[i]);
}

function drawPenInk(c) {
  var w = viewH * 0.3, h = viewH * 0.026, x = viewW / 2 - w / 2, y = viewH * 0.115;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, x - h * 1.6, y - h * 0.5, w + h * 2.2, h * 2, h);
  c.fill();
  drawPenGlyph(c, x - h * 0.6, y + h * 0.5, h * 1.3);
  c.fillStyle = 'rgba(138,77,255,0.2)';
  roundRect(c, x + h * 0.4, y, w - h * 0.4, h, h * 0.5);
  c.fill();
  var f = Math.max(0, Math.min(1, penInk / penInkMax));
  if (f > 0.02) {
    c.fillStyle = f < 0.25 ? '#ff7bac' : '#8a4dff';
    roundRect(c, x + h * 0.4, y, (w - h * 0.4) * f, h, h * 0.5);
    c.fill();
  }
}

function drawPenWaitHint(c) {
  if (!penWait || penMode || penWaitT < 1.2 || celebrating || puzzleBusy()) return;
  var x = princess.x - camX + viewH * 0.09, y = princess.y - viewH * 0.36 + Math.sin(globalT * 3) * viewH * 0.01, s = viewH * 0.045;
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.9, y + s * 0.9, s * 0.25, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 1.3, y + s * 1.4, s * 0.14, 0, Math.PI * 2); c.fill();
  drawPenGlyph(c, x, y, s * 0.9);
}

// Prinsessa, kynä kädessä -merkki ja odotusvihje
function drawPenPrincess(c) {
  var moving = princess.onGround && holding && !penMode && !penWait && penStun <= 0 && !puzzleBusy() && !celebrating && Math.abs(holdWorldX - princess.x) > 10;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) c.globalAlpha = 0.45;
  drawPrincessFree(c, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  c.globalAlpha = 1;
  if (penMode && !celebrating) drawPenGlyph(c, princess.x - camX + princess.facing * viewH * 0.07, princess.y - viewH * 0.24 + Math.sin(globalT * 3) * viewH * 0.008, viewH * 0.04);
  drawPenWaitHint(c);
}

// Paperimaisema: valmiiksi väritetty, ei jäljennettäviä ääriviivoja
function drawPaperGround(b, x, y, w, h) {
  var i;
  b.fillStyle = '#f6ead0';
  b.fillRect(x, y, w, h - y);
  b.fillStyle = '#bfe0a3';
  b.fillRect(x, y - h * 0.008, w, h * 0.022);
  b.fillStyle = 'rgba(160,130,90,0.28)';
  for (i = 0; i < w / (h * 0.05); i++) {
    b.beginPath(); b.arc(x + h * 0.025 + i * h * 0.05, y + h * 0.05 + (i % 3) * h * 0.02, h * 0.005, 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = 'rgba(120,100,160,0.35)';
  b.lineWidth = Math.max(1.5, h * 0.003);
  b.beginPath(); b.moveTo(x, y); b.lineTo(x, h); b.moveTo(x + w, y); b.lineTo(x + w, h); b.stroke();
}

// opts: { paper, sky (rgba-väri taivaan sävyyn), hill1, hill2, sun (bool), clouds (bool) }
function renderPaperScene(b, w, h, segs, segYFn, opts) {
  var i, x, y, seg;
  opts = opts || {};
  b.fillStyle = opts.paper || '#fdf6e3';
  b.fillRect(0, 0, w, h);
  if (opts.sky) { b.fillStyle = opts.sky; b.fillRect(0, 0, w, groundTop); }
  b.strokeStyle = 'rgba(120,100,160,0.06)';
  b.lineWidth = 1;
  for (y = 0; y < h; y += h * 0.06) { b.beginPath(); b.moveTo(0, y); b.lineTo(w, y); b.stroke(); }
  for (x = 0; x < w; x += h * 0.06) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, h); b.stroke(); }
  if (opts.sun !== false) {
    var sg = b.createRadialGradient(w * 0.08, h * 0.16, h * 0.02, w * 0.08, h * 0.16, h * 0.14);
    sg.addColorStop(0, 'rgba(255,226,122,0.7)');
    sg.addColorStop(1, 'rgba(255,226,122,0)');
    b.fillStyle = sg;
    b.beginPath(); b.arc(w * 0.08, h * 0.16, h * 0.14, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#ffe27a';
    b.beginPath(); b.arc(w * 0.08, h * 0.16, h * 0.06, 0, Math.PI * 2); b.fill();
  }
  if (opts.clouds !== false) {
    b.fillStyle = 'rgba(255,255,255,0.9)';
    for (i = 0; i < 9; i++) cloudShape(b, w * (0.1 + i * 0.105), h * (0.12 + (i % 3) * 0.08), h * 0.028);
  }
  b.fillStyle = opts.hill1 || '#dcedc9';
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.03, h * (0.13 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  b.fillStyle = opts.hill2 || '#c8e3b0';
  for (i = 0; i < 12; i++) {
    x = w * (0.04 + i * 0.085);
    b.beginPath(); b.arc(x, groundTop + h * 0.03, h * (0.07 + (i % 2) * 0.03), Math.PI, 0); b.fill();
  }
  b.fillStyle = '#e4d8bd';
  b.fillRect(0, groundTop + h * 0.02, w, h - groundTop);
  for (i = 0; i < segs.length; i++) {
    seg = segs[i];
    drawPaperGround(b, seg[0] * w, segYFn ? segYFn(i) : groundTop, (seg[1] - seg[0]) * w, h);
  }
}
