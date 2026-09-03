'use strict';

// Tunnelma: hiukkaset, etualan siluetit ja kentän alkukortti.
// Kaikki kevyttä: hiukkasia on kymmeniä, etuala esirenderöidään kerran.
// Kenttä valitsee ilmeensä PHASES-rivillä: ambient: 'snow', fg: { kind: 'grass', color: '...' }

var ambient = { kind: null, items: [], lastCam: 0 };
var fgCanvas = document.createElement('canvas');
var fgKey = '';
var introT = 0;
var introKind = null;

var AMBIENT_COUNT = {
  butterflies: 4, petals: 18, snow: 45, bubbles: 16, stars: 30, dust: 30, fireflies: 14, sparkle: 22
};

function ambientInit(kind) {
  ambient.kind = kind || null;
  ambient.items = [];
  ambient.lastCam = camX;
  if (!kind) return;
  var n = AMBIENT_COUNT[kind] || 20, i;
  for (i = 0; i < n; i++) ambient.items.push(ambientSpawn(kind, true));
}

function ambientSpawn(kind, anywhere) {
  var it = { x: Math.random() * viewW, y: Math.random() * viewH, vx: 0, vy: 0, s: 1, ph: Math.random() * Math.PI * 2, c: 0, life: 0 };
  if (kind === 'snow') {
    it.y = anywhere ? Math.random() * viewH : -10;
    it.vy = viewH * (0.05 + Math.random() * 0.06);
    it.s = 1.5 + Math.random() * 2.5;
  } else if (kind === 'petals') {
    it.y = anywhere ? Math.random() * viewH : -10;
    it.vy = viewH * (0.04 + Math.random() * 0.05);
    it.s = 3 + Math.random() * 3;
    it.c = Math.floor(Math.random() * 3);
  } else if (kind === 'bubbles') {
    it.y = anywhere ? Math.random() * viewH : viewH + 10;
    it.vy = -viewH * (0.04 + Math.random() * 0.05);
    it.s = 2 + Math.random() * 4;
  } else if (kind === 'butterflies') {
    it.y = viewH * (0.2 + Math.random() * 0.45);
    it.vx = (Math.random() < 0.5 ? -1 : 1) * viewW * (0.02 + Math.random() * 0.03);
    it.s = viewH * 0.018;
    it.c = Math.floor(Math.random() * 4);
  } else if (kind === 'stars') {
    it.y = Math.random() * viewH * 0.6;
    it.s = 1 + Math.random() * 1.5;
    it.life = 2 + Math.random() * 10;   // kun life < 0, tähti lentää hetken
  } else if (kind === 'dust') {
    it.vy = -viewH * 0.01;
    it.vx = viewW * 0.005;
    it.s = 1.5 + Math.random() * 2;
  } else if (kind === 'fireflies') {
    it.y = viewH * (0.3 + Math.random() * 0.55);
    it.s = 2 + Math.random() * 2;
  } else if (kind === 'sparkle') {
    it.vy = viewH * 0.02;
    it.s = 2 + Math.random() * 2;
    it.c = Math.floor(Math.random() * 6);
  }
  return it;
}

function updateAmbient(dt) {
  if (!ambient.kind || mode !== 'play') return;
  var k = ambient.kind, i, it, ns;
  // Hiukkaset ovat ruutukoordinaateissa; kamera liikuttaa niitä puolella nopeudella -> syvyys
  var shift = (camX - ambient.lastCam) * 0.55;
  ambient.lastCam = camX;
  for (i = 0; i < ambient.items.length; i++) {
    it = ambient.items[i];
    it.ph += dt * 2;
    it.x += it.vx * dt - shift;
    it.y += it.vy * dt;
    if (k === 'snow' || k === 'petals') it.x += Math.sin(it.ph) * viewW * 0.06 * dt;
    if (k === 'fireflies') {
      it.x += Math.sin(it.ph * 0.7 + i) * viewW * 0.03 * dt;
      it.y += Math.cos(it.ph * 0.9) * viewH * 0.03 * dt;
    }
    if (k === 'butterflies') it.y += Math.sin(it.ph * 1.7) * viewH * 0.05 * dt;
    if (k === 'dust') it.x += Math.sin(it.ph * 0.5) * viewW * 0.01 * dt;
    if (k === 'stars') {
      it.life -= dt;
      if (it.life < -0.7) {
        it.life = 4 + Math.random() * 10;
        it.x = Math.random() * viewW;
        it.y = Math.random() * viewH * 0.5;
      }
    }
    if (it.x < -40) it.x += viewW + 80;
    if (it.x > viewW + 40) it.x -= viewW + 80;
    if (it.y > viewH + 20) { ns = ambientSpawn(k, false); it.x = ns.x; it.y = ns.y; }
    if (it.y < -20) {
      if (k === 'bubbles') { ns = ambientSpawn(k, false); it.x = ns.x; it.y = ns.y; }
      else it.y += viewH + 40;
    }
  }
}

function drawAmbient(c) {
  if (!ambient.kind || mode !== 'play') return;
  var k = ambient.kind, i, it, a;
  var petalCols = ['#ff9ec6', '#ffc4dd', '#e4b8ff'];
  var bfCols = ['#ff7bac', '#c9a0ff', '#7fd4ff', '#ffd24f'];
  for (i = 0; i < ambient.items.length; i++) {
    it = ambient.items[i];
    if (k === 'snow') {
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(it.x, it.y, it.s, 0, Math.PI * 2); c.fill();
    } else if (k === 'petals') {
      c.save();
      c.translate(it.x, it.y);
      c.rotate(it.ph);
      c.fillStyle = petalCols[it.c];
      c.globalAlpha = 0.85;
      c.beginPath();
      if (c.ellipse) c.ellipse(0, 0, it.s, it.s * 0.55, 0, 0, Math.PI * 2);
      else c.arc(0, 0, it.s * 0.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else if (k === 'bubbles') {
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 1.2;
      c.beginPath(); c.arc(it.x + Math.sin(it.ph) * 4, it.y, it.s, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.beginPath(); c.arc(it.x + Math.sin(it.ph) * 4 - it.s * 0.35, it.y - it.s * 0.35, it.s * 0.25, 0, Math.PI * 2); c.fill();
    } else if (k === 'butterflies') {
      drawButterfly(c, it.x, it.y, it.s, it.ph, bfCols[it.c]);
    } else if (k === 'stars') {
      if (it.life < 0) {
        var p = -it.life / 0.7;
        var sx = it.x + p * viewW * 0.16, sy = it.y + p * viewH * 0.07;
        var sg = c.createLinearGradient(sx - viewW * 0.05, sy - viewH * 0.02, sx, sy);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(1, 'rgba(255,255,255,0.9)');
        c.strokeStyle = sg;
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(sx - viewW * 0.05, sy - viewH * 0.02); c.lineTo(sx, sy); c.stroke();
      } else {
        a = 0.35 + Math.sin(it.ph * 3) * 0.35;
        c.fillStyle = 'rgba(255,255,255,' + Math.max(0, a) + ')';
        c.beginPath(); c.arc(it.x, it.y, it.s, 0, Math.PI * 2); c.fill();
      }
    } else if (k === 'dust') {
      c.fillStyle = 'rgba(200,180,255,' + (0.2 + Math.sin(it.ph) * 0.12) + ')';
      c.beginPath(); c.arc(it.x, it.y, it.s, 0, Math.PI * 2); c.fill();
    } else if (k === 'fireflies') {
      a = 0.35 + Math.sin(it.ph * 2.5 + i) * 0.35;
      var fg = c.createRadialGradient(it.x, it.y, 0, it.x, it.y, it.s * 4);
      fg.addColorStop(0, 'rgba(200,255,150,' + Math.max(0, a) + ')');
      fg.addColorStop(1, 'rgba(200,255,150,0)');
      c.fillStyle = fg;
      c.beginPath(); c.arc(it.x, it.y, it.s * 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(240,255,220,' + Math.max(0, a + 0.3) + ')';
      c.beginPath(); c.arc(it.x, it.y, it.s * 0.7, 0, Math.PI * 2); c.fill();
    } else if (k === 'sparkle') {
      a = 0.4 + Math.sin(it.ph * 3 + i) * 0.4;
      c.globalAlpha = Math.max(0, a);
      c.fillStyle = maneColors[it.c % maneColors.length];
      c.beginPath();
      c.moveTo(it.x, it.y - it.s * 2);
      c.lineTo(it.x + it.s * 0.6, it.y);
      c.lineTo(it.x, it.y + it.s * 2);
      c.lineTo(it.x - it.s * 0.6, it.y);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
    }
  }
  c.globalAlpha = 1;
}

// ---------- Etuala ----------
function fgHash(i) {
  var h = (i + 1) * 2654435761;
  h = (h ^ (h >>> 15)) * 2246822519;
  return (((h ^ (h >>> 13)) >>> 0) % 1000) / 1000;
}

function renderForeground(fg) {
  var key = viewW + 'x' + viewH + '|' + fg.kind + '|' + fg.color;
  if (fgKey === key) return;
  fgKey = key;
  var h = viewH * 0.09, w = viewW;
  fgCanvas.width = Math.round(w * DPR);
  fgCanvas.height = Math.round(h * DPR);
  var b = fgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  b.clearRect(0, 0, w, h);
  var i, j, x, off;
  if (fg.kind === 'grass') {
    var n = 30;
    b.fillStyle = fg.color;
    for (i = 0; i < n; i++) {
      x = (i / n) * w + (fgHash(i) - 0.5) * w / n;
      for (off = -w; off <= w; off += w) {
        for (j = 0; j < 4; j++) {
          var bx = x + off + (j - 1.5) * h * 0.12;
          var bh = h * (0.45 + fgHash(i * 7 + j) * 0.5);
          var lean = (fgHash(i * 3 + j) - 0.5) * h * 0.4;
          b.beginPath();
          b.moveTo(bx - h * 0.05, h);
          b.quadraticCurveTo(bx + lean * 0.3, h - bh * 0.5, bx + lean, h - bh);
          b.quadraticCurveTo(bx + lean * 0.4, h - bh * 0.5, bx + h * 0.05, h);
          b.closePath();
          b.fill();
        }
      }
    }
    b.fillRect(0, h * 0.82, w, h * 0.18);
  } else if (fg.kind === 'snow') {
    b.fillStyle = fg.color;
    for (i = 0; i < 12; i++) {
      x = (i / 12) * w + fgHash(i) * w / 12;
      var rw = w / 12 * (0.7 + fgHash(i * 5) * 0.6), rh = h * (0.4 + fgHash(i * 9) * 0.5);
      for (off = -w; off <= w; off += w) {
        b.beginPath();
        if (b.ellipse) b.ellipse(x + off, h, rw, rh, 0, Math.PI, 0);
        else b.arc(x + off, h, rh, Math.PI, 0);
        b.fill();
      }
    }
    b.fillRect(0, h * 0.85, w, h * 0.15);
  } else if (fg.kind === 'reeds') {
    b.strokeStyle = fg.color;
    b.fillStyle = fg.color;
    b.lineCap = 'round';
    for (i = 0; i < 40; i++) {
      x = (i / 40) * w + (fgHash(i) - 0.5) * w / 40;
      var rhh = h * (0.5 + fgHash(i * 11) * 0.5);
      var tilt = (fgHash(i * 13) - 0.5) * h * 0.3;
      for (off = -w; off <= w; off += w) {
        b.lineWidth = Math.max(1.5, h * 0.05);
        b.beginPath(); b.moveTo(x + off, h); b.quadraticCurveTo(x + off + tilt * 0.3, h - rhh * 0.5, x + off + tilt, h - rhh); b.stroke();
        if (fgHash(i * 17) < 0.3) {
          b.beginPath();
          if (b.ellipse) b.ellipse(x + off + tilt, h - rhh, h * 0.035, h * 0.12, 0, 0, Math.PI * 2);
          else b.arc(x + off + tilt, h - rhh, h * 0.06, 0, Math.PI * 2);
          b.fill();
        }
      }
    }
    b.fillRect(0, h * 0.88, w, h * 0.12);
  }
}

function drawForeground(c) {
  var fg = phaseNow().fg;
  if (!fg || mode !== 'play') return;
  renderForeground(fg);
  var h = viewH * 0.09;
  var off = (camX * 1.3) % viewW;
  var y = viewH - h;
  c.drawImage(fgCanvas, 0, 0, fgCanvas.width, fgCanvas.height, -off, y, viewW, h);
  c.drawImage(fgCanvas, 0, 0, fgCanvas.width, fgCanvas.height, -off + viewW, y, viewW, h);
}

// ---------- Alkukortti ----------
function startIntro(kind) {
  introT = 1.4;
  introKind = kind;
}

function drawIntro(c) {
  if (introT <= 0 || !introKind || mode !== 'play') return;
  var a = Math.min(1, introT / 0.45);
  var room = null, ch;
  for (ch in HUB_ROOMS) { if (HUB_ROOMS[ch].kind === introKind) room = HUB_ROOMS[ch]; }
  var cx = viewW / 2, cy = viewH * 0.46;
  var s = viewH * 0.17 * (1 + (1 - a) * 0.25);
  c.fillStyle = 'rgba(30,10,50,' + (0.45 * a) + ')';
  c.fillRect(0, 0, viewW, viewH);
  c.globalAlpha = a;
  var i;
  for (i = 0; i < 8; i++) {
    var ang = globalT * 1.5 + i * Math.PI / 4;
    drawStar(c, cx + Math.cos(ang) * s * 1.5, cy + Math.sin(ang) * s * 1.5, s * 0.12, ang, 0);
  }
  c.fillStyle = '#ffe27a';
  c.beginPath(); c.arc(cx, cy, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = room ? room.color : '#8a5cb8';
  c.beginPath(); c.arc(cx, cy, s * 0.82, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.beginPath(); c.arc(cx - s * 0.3, cy - s * 0.35, s * 0.28, 0, Math.PI * 2); c.fill();
  if (room) drawHubRoomIcon(c, room.kind, cx, cy + s * 0.1, s * 2.6);
  else drawCastle(c, cx, cy + s * 0.5, s * 1.1);
  c.globalAlpha = 1;
}
