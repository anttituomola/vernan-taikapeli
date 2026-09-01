'use strict';

// Tähti, pupu, yksisarvinen
// ---------- Piirto: tähti, pupu, yksisarvinen ----------
function drawStar(c, x, y, r, rot, glow) {
  if (glow > 0) {
    var g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4);
    g.addColorStop(0, 'rgba(255,230,120,' + (0.55 * glow) + ')');
    g.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r * 2.4, 0, Math.PI * 2); c.fill();
  }
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (var i = 0; i < 10; i++) {
    var rr = (i % 2 === 0) ? r : r * 0.45;
    var a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = '#ffd94f';
  c.fill();
  c.strokeStyle = '#e8a800';
  c.lineWidth = Math.max(1.5, r * 0.09);
  c.stroke();
  c.restore();
}

function drawBunny(c, x, y, s, hopY, earWiggle, faceOnly) {
  c.save();
  c.translate(x, y - hopY);
  if (!faceOnly) {
    // Vartalo
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse ? c.ellipse(0, -s * 0.55, s * 0.62, s * 0.55, 0, 0, Math.PI * 2)
              : c.arc(0, -s * 0.55, s * 0.58, 0, Math.PI * 2);
    c.fill();
    // Jalat
    c.beginPath(); c.arc(-s * 0.3, -s * 0.08, s * 0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.08, s * 0.2, 0, Math.PI * 2); c.fill();
    // Häntä
    c.beginPath(); c.arc(-s * 0.62, -s * 0.45, s * 0.16, 0, Math.PI * 2); c.fill();
  }
  // Korvat
  var headY = faceOnly ? 0 : -s * 1.05;
  c.save();
  c.translate(0, headY);
  var wig = Math.sin(earWiggle) * 0.15;
  earShape(c, -s * 0.22, -s * 0.35, s, -0.25 + wig);
  earShape(c, s * 0.22, -s * 0.35, s, 0.25 - wig);
  // Pää
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(0, 0, s * 0.42, 0, Math.PI * 2); c.fill();
  // Silmät ja nenä
  c.fillStyle = '#333';
  c.beginPath(); c.arc(-s * 0.15, -s * 0.05, s * 0.05, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.15, -s * 0.05, s * 0.05, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ff9ec6';
  c.beginPath(); c.arc(0, s * 0.1, s * 0.06, 0, Math.PI * 2); c.fill();
  // Posket
  c.fillStyle = 'rgba(255,158,198,0.5)';
  c.beginPath(); c.arc(-s * 0.26, s * 0.1, s * 0.08, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.26, s * 0.1, s * 0.08, 0, Math.PI * 2); c.fill();
  c.restore();
  c.restore();
}
function earShape(c, x, y, s, tilt) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 0.3, s * 0.13, s * 0.38, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 0.3, s * 0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffc4dd';
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 0.28, s * 0.06, s * 0.26, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 0.28, s * 0.1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

var maneColors = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];

function drawUnicorn(c, x, y, s, facing, walkPhase, moving, t) {
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  var bob = moving ? Math.sin(walkPhase * 2) * s * 3 : Math.sin(t * 2) * s * 1.2;
  c.translate(0, -bob);

  var i;
  var icy = level === 3;
  // Takajalat + etujalat
  if (icy) {
    c.strokeStyle = '#1e3c58';
    c.lineWidth = s * 11;
    c.lineCap = 'round';
    var legXs0 = [-26, -12, 12, 26];
    for (i = 0; i < 4; i++) {
      var swing0 = moving ? Math.sin(walkPhase + i * Math.PI * 0.9) * s * 8 : 0;
      c.beginPath();
      c.moveTo(legXs0[i] * s, -s * 38);
      c.lineTo(legXs0[i] * s + swing0, -s * 2);
      c.stroke();
    }
  }
  c.strokeStyle = icy ? '#fff8fb' : '#f5f0ff';
  c.lineWidth = s * 9;
  c.lineCap = 'round';
  var legXs = [-26, -12, 12, 26];
  for (i = 0; i < 4; i++) {
    var swing = moving ? Math.sin(walkPhase + i * Math.PI * 0.9) * s * 8 : 0;
    c.beginPath();
    c.moveTo(legXs[i] * s, -s * 38);
    c.lineTo(legXs[i] * s + swing, -s * 2);
    c.stroke();
  }
  // Kaviot
  c.fillStyle = '#d9b3ff';
  for (i = 0; i < 4; i++) {
    var swing2 = moving ? Math.sin(walkPhase + i * Math.PI * 0.9) * s * 8 : 0;
    c.beginPath();
    c.arc(legXs[i] * s + swing2, -s * 2, s * 4.5, 0, Math.PI * 2);
    c.fill();
  }
  // Häntä
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = s * 3;
    c.beginPath();
    c.moveTo(-s * 36, -s * 48);
    c.quadraticCurveTo(
      -s * 52, -s * (42 - i * 3) + Math.sin(t * 3 + i) * s * 2,
      -s * (46 + i * 2), -s * (20 - i * 2)
    );
    c.stroke();
  }
  // Vartalo
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 46, s * 38, s * 20, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 46, s * 30, 0, Math.PI * 2);
  c.fill();
  if (icy) { c.strokeStyle = '#1e3c58'; c.lineWidth = Math.max(2, s * 2.2); c.stroke(); }
  // Kaula
  c.beginPath();
  c.moveTo(s * 22, -s * 56);
  c.quadraticCurveTo(s * 34, -s * 70, s * 36, -s * 82);
  c.lineTo(s * 46, -s * 76);
  c.quadraticCurveTo(s * 40, -s * 60, s * 34, -s * 44);
  c.closePath();
  c.fill();
  if (icy) c.stroke();
  // Pää
  c.beginPath();
  c.ellipse ? c.ellipse(s * 44, -s * 82, s * 13, s * 9, -0.25, 0, Math.PI * 2)
            : c.arc(s * 44, -s * 82, s * 11, 0, Math.PI * 2);
  c.fill();
  if (icy) c.stroke();
  // Turpa
  c.fillStyle = '#ffd9ec';
  c.beginPath();
  c.arc(s * 54, -s * 79, s * 4.5, 0, Math.PI * 2);
  c.fill();
  // Korva
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(s * 36, -s * 90);
  c.lineTo(s * 40, -s * 100);
  c.lineTo(s * 44, -s * 90);
  c.closePath(); c.fill();
  // Sarvi
  var hg = c.createLinearGradient(s * 44, -s * 112, s * 44, -s * 92);
  hg.addColorStop(0, '#ffe27a');
  hg.addColorStop(1, '#ffb54f');
  c.fillStyle = hg;
  c.beginPath();
  c.moveTo(s * 41, -s * 92);
  c.lineTo(s * 48, -s * 92);
  c.lineTo(s * 46, -s * 113);
  c.closePath(); c.fill();
  // Silmä
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 44, -s * 84, s * 1.8, 0, Math.PI * 2); c.fill();
  // Harja
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = s * 2.6;
    c.beginPath();
    c.moveTo(s * (38 - i * 1.5), -s * (92 - i * 2));
    c.quadraticCurveTo(
      s * (26 - i * 2), -s * (80 - i * 3) + Math.sin(t * 3 + i) * s * 1.5,
      s * (20 - i * 2), -s * (62 - i * 3)
    );
    c.stroke();
  }

  // ----- Prinsessa selässä -----
  c.save();
  c.translate(-s * 4, -s * 62);
  // Mekko
  c.fillStyle = '#ff6fb0';
  c.beginPath();
  c.moveTo(0, -s * 14);
  c.quadraticCurveTo(-s * 16, s * 2, -s * 12, s * 6);
  c.lineTo(s * 12, s * 6);
  c.quadraticCurveTo(s * 16, s * 2, 0, -s * 14);
  c.closePath(); c.fill();
  // Ylävartalo
  c.fillStyle = '#ff6fb0';
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 14, s * 5.5, s * 8, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 14, s * 6, 0, Math.PI * 2);
  c.fill();
  // Käsi kohti ohjaksia
  c.strokeStyle = '#ffd9b8';
  c.lineWidth = s * 3;
  c.beginPath();
  c.moveTo(s * 2, -s * 16);
  c.quadraticCurveTo(s * 10, -s * 12, s * 16, -s * 14);
  c.stroke();
  // Pää
  c.fillStyle = '#ffd9b8';
  c.beginPath(); c.arc(0, -s * 27, s * 6, 0, Math.PI * 2); c.fill();
  // Hiukset
  c.fillStyle = '#f7c948';
  c.beginPath();
  c.arc(0, -s * 29, s * 6.2, Math.PI * 0.95, Math.PI * 2.05);
  c.fill();
  c.beginPath();
  c.ellipse ? c.ellipse(-s * 5, -s * 22, s * 2.5, s * 7, 0.3, 0, Math.PI * 2)
            : c.arc(-s * 5, -s * 22, s * 3, 0, Math.PI * 2);
  c.fill();
  // Silmä ja hymy
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 2, -s * 27, s * 0.9, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c0392b';
  c.lineWidth = s * 0.9;
  c.beginPath(); c.arc(s * 1.5, -s * 25, s * 2, 0.2, Math.PI - 0.6); c.stroke();
  // Kruunu
  c.fillStyle = '#ffd24f';
  c.beginPath();
  c.moveTo(-s * 4.5, -s * 33);
  c.lineTo(-s * 4.5, -s * 37);
  c.lineTo(-s * 2.2, -s * 34.5);
  c.lineTo(0, -s * 38);
  c.lineTo(s * 2.2, -s * 34.5);
  c.lineTo(s * 4.5, -s * 37);
  c.lineTo(s * 4.5, -s * 33);
  c.closePath(); c.fill();
  c.restore();

  c.restore();
}

