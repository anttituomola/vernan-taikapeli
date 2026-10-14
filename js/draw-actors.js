'use strict';

// Tähti, pupu, yksisarvinen, prinsessa — "tarrakirja"-ilmeellä (js/art.js):
// kaksi sävyä, reunaviiva, kiilto ja maavarjo.
// ---------- Piirto: tähti, pupu, yksisarvinen ----------
var STAR_COLOR = '#ffd94f';
var STAR_LINE = '#d98a00';
var UNI_WHITE = '#ffffff';
var UNI_SHADE = '#e3d8f5';   // valkoisen varjopuoli: laventeli, ei harmaa
var UNI_LINE = '#b39bd8';
var BUNNY_LINE = '#c9b3cf';
var BUNNY_SHADE = '#eee2f0';
var SKIN = '#ffd9b8';
var SKIN_LINE = '#d9a07a';
var DRESS = '#ff6fb0';
var HAIR = '#f7c948';

function drawStar(c, x, y, r, rot, glow) {
  if (glow > 0) artGlow(c, x, y, r * 2.4, '#ffe678', 0.55 * glow);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (var i = 0; i < 10; i++) {
    var rr = (i % 2 === 0) ? r : r * 0.48;
    var a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  var g = c.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#fff2a8');
  g.addColorStop(0.55, STAR_COLOR);
  g.addColorStop(1, '#ffb62e');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = STAR_LINE;
  c.lineWidth = Math.max(1.5, r * 0.11);
  c.lineJoin = 'round';
  c.stroke();
  // Kiilto
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  if (c.ellipse) c.ellipse(-r * 0.22, -r * 0.3, r * 0.2, r * 0.12, -0.6, 0, Math.PI * 2);
  else c.arc(-r * 0.22, -r * 0.3, r * 0.14, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawBunny(c, x, y, s, hopY, earWiggle, faceOnly) {
  var lineOpts = { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE };
  if (!faceOnly) artShadow(c, x, y + s * 0.08, s * 0.85, s * 0.22, 0.16 * Math.max(0.3, 1 - hopY / (s * 1.5)));
  c.save();
  c.translate(x, y - hopY);
  if (!faceOnly) {
    // Häntä
    artCircle(c, -s * 0.62, -s * 0.45, s * 0.17, '#ffffff', lineOpts);
    // Vartalo
    artBlob(c, 0, -s * 0.55, s * 0.62, s * 0.55, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE, hi: 0.5 });
    // Jalat
    artCircle(c, -s * 0.3, -s * 0.08, s * 0.2, '#ffffff', lineOpts);
    artCircle(c, s * 0.3, -s * 0.08, s * 0.2, '#ffffff', lineOpts);
  }
  // Korvat
  var headY = faceOnly ? 0 : -s * 1.05;
  c.save();
  c.translate(0, headY);
  var wig = Math.sin(earWiggle) * 0.15;
  earShape(c, -s * 0.22, -s * 0.35, s, -0.25 + wig);
  earShape(c, s * 0.22, -s * 0.35, s, 0.25 - wig);
  // Pää
  artCircle(c, 0, 0, s * 0.42, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE, hi: 0.5 });
  // Silmät, nenä, posket
  artEye(c, -s * 0.15, -s * 0.05, s * 0.075, 0, false);
  artEye(c, s * 0.15, -s * 0.05, s * 0.075, 0, false);
  c.fillStyle = '#ff8fbe';
  c.beginPath(); c.arc(0, s * 0.1, s * 0.06, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c96a92';
  c.lineWidth = Math.max(1, s * 0.03);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, s * 0.14); c.lineTo(0, s * 0.2);
  c.moveTo(-s * 0.08, s * 0.24); c.quadraticCurveTo(0, s * 0.3, s * 0.08, s * 0.24);
  c.stroke();
  artBlush(c, -s * 0.27, s * 0.1, s * 0.08);
  artBlush(c, s * 0.27, s * 0.1, s * 0.08);
  c.restore();
  c.restore();
}
function earShape(c, x, y, s, tilt) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  artBlob(c, 0, -s * 0.3, s * 0.13, s * 0.38, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE });
  c.fillStyle = '#ffc4dd';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, -s * 0.28, s * 0.06, s * 0.26, 0, 0, Math.PI * 2);
  else c.arc(0, -s * 0.28, s * 0.1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

var maneColors = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];

function drawUnicorn(c, x, y, s, facing, walkPhase, moving, t) {
  var icy = phaseNow().unicornStyle === 'ice';
  var body = icy ? '#fff8fb' : UNI_WHITE;
  var line = icy ? '#1e3c58' : UNI_LINE;
  var shade = icy ? '#dbe8f5' : UNI_SHADE;
  var lineOpts = { lineColor: line, shadeTo: shade };
  var i;

  // Maavarjo ei heilu hahmon mukana
  artShadow(c, x, y + s * 2, s * 44, s * 9, 0.2);

  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  var bob = moving ? Math.sin(walkPhase * 2) * s * 3 : Math.sin(t * 2) * s * 1.2;
  // Kevyt hengitys paikallaan, nojaus liikkeessä
  var breathe = moving ? 0 : Math.sin(t * 2) * 0.012;
  c.translate(0, -bob);
  c.scale(1 - breathe, 1 + breathe);
  if (moving) c.rotate(-0.04);

  // Takajalat + etujalat (takimmaiset hieman tummempina -> syvyys)
  var legXs = [-26, -12, 12, 26];
  for (i = 0; i < 4; i++) {
    var swing = moving ? Math.sin(walkPhase + i * Math.PI * 0.9) * s * 8 : 0;
    var back = (i === 0 || i === 2);
    artLimb(c, legXs[i] * s, -s * 38, legXs[i] * s + swing, -s * 2, s * 9, back ? shade : body, line);
  }
  // Kaviot
  for (i = 0; i < 4; i++) {
    var swing2 = moving ? Math.sin(walkPhase + i * Math.PI * 0.9) * s * 8 : 0;
    artCircle(c, legXs[i] * s + swing2, -s * 2, s * 4.6, '#d9b3ff', { lineColor: line });
  }
  // Häntä
  c.lineCap = 'round';
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = s * 3.2;
    c.beginPath();
    c.moveTo(-s * 36, -s * 48);
    c.quadraticCurveTo(
      -s * 52, -s * (42 - i * 3) + Math.sin(t * 3 + i) * s * 2,
      -s * (46 + i * 2), -s * (20 - i * 2)
    );
    c.stroke();
  }
  // Vartalo
  artBlob(c, 0, -s * 46, s * 38, s * 20, body, { lineColor: line, shadeTo: shade, hi: 0.45 });
  // Kaula
  c.beginPath();
  c.moveTo(s * 22, -s * 58);
  c.quadraticCurveTo(s * 34, -s * 70, s * 36, -s * 82);
  c.lineTo(s * 47, -s * 76);
  c.quadraticCurveTo(s * 40, -s * 60, s * 34, -s * 42);
  c.closePath();
  artFillPath(c, body, -s * 82, -s * 42, s * 20, lineOpts);
  // Pää
  artBlob(c, s * 44, -s * 82, s * 13.5, s * 9.5, body, { rot: -0.25, lineColor: line, shadeTo: shade, hi: 0.4 });
  // Turpa ja sierain
  artCircle(c, s * 54, -s * 79, s * 4.8, '#ffd9ec', { lineColor: line });
  c.fillStyle = '#d98ab0';
  c.beginPath(); c.arc(s * 56, -s * 80, s * 1.1, 0, Math.PI * 2); c.fill();
  // Korva
  c.beginPath();
  c.moveTo(s * 36, -s * 90);
  c.lineTo(s * 40, -s * 101);
  c.lineTo(s * 44.5, -s * 90);
  c.closePath();
  artFillPath(c, body, -s * 101, -s * 90, s * 5, lineOpts);
  c.fillStyle = '#ffc4dd';
  c.beginPath();
  c.moveTo(s * 38, -s * 91); c.lineTo(s * 40, -s * 97); c.lineTo(s * 42.5, -s * 91);
  c.closePath(); c.fill();
  // Sarvi
  c.beginPath();
  c.moveTo(s * 41, -s * 92);
  c.lineTo(s * 48, -s * 92);
  c.lineTo(s * 46, -s * 114);
  c.closePath();
  var hg = c.createLinearGradient(s * 44, -s * 114, s * 44, -s * 92);
  hg.addColorStop(0, '#fff3b0');
  hg.addColorStop(1, '#ffb54f');
  c.fillStyle = hg;
  c.fill();
  c.strokeStyle = '#d98a00';
  c.lineWidth = Math.max(1.2, s * 1.2);
  c.lineJoin = 'round';
  c.stroke();
  // Sarven kierre
  c.strokeStyle = 'rgba(217,138,0,0.55)';
  c.lineWidth = Math.max(1, s * 0.8);
  c.beginPath();
  c.moveTo(s * 42, -s * 97); c.lineTo(s * 47.3, -s * 99);
  c.moveTo(s * 42.8, -s * 102); c.lineTo(s * 46.9, -s * 104);
  c.moveTo(s * 43.7, -s * 107); c.lineTo(s * 46.5, -s * 108.5);
  c.stroke();
  // Silmä (räpäyttää välillä), katse kulkusuuntaan
  artEye(c, s * 45, -s * 84, s * 2.4, moving ? 0.6 : 0.2, ((t + 1.3) % 3.9) < 0.14);
  artBlush(c, s * 50, -s * 78, s * 2.2);
  // Harja
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = s * 2.8;
    c.beginPath();
    c.moveTo(s * (38 - i * 1.5), -s * (92 - i * 2));
    c.quadraticCurveTo(
      s * (26 - i * 2), -s * (80 - i * 3) + Math.sin(t * 3 + i) * s * 1.5,
      s * (20 - i * 2), -s * (62 - i * 3)
    );
    c.stroke();
  }

  // ----- Prinsessa selässä -----
  drawRiderPrincess(c, -s * 4, -s * 62, s * 1.15, t, moving);

  c.restore();
}

// Prinsessa ratsastusasennossa; origo istuinkohdassa, s = yksisarvisen skaala
function drawRiderPrincess(c, x, y, s, t, moving) {
  c.save();
  c.translate(x, y);
  var sway = moving ? Math.sin(t * 10) * 0.03 : 0;
  c.rotate(sway);
  // Mekko
  c.beginPath();
  c.moveTo(0, -s * 14);
  c.quadraticCurveTo(-s * 17, s * 2, -s * 13, s * 7);
  c.lineTo(s * 13, s * 7);
  c.quadraticCurveTo(s * 17, s * 2, 0, -s * 14);
  c.closePath();
  artFillPath(c, DRESS, -s * 14, s * 7, s * 12);
  // Helman koristeraita
  c.strokeStyle = '#ffd1e8';
  c.lineWidth = Math.max(1, s * 1.1);
  c.beginPath();
  c.moveTo(-s * 11, s * 4.5); c.quadraticCurveTo(0, s * 2.5, s * 11, s * 4.5);
  c.stroke();
  // Ylävartalo
  artBlob(c, 0, -s * 14, s * 5.8, s * 8, DRESS, {});
  // Käsi kohti ohjaksia
  artLimb(c, s * 2, -s * 16, s * 16, -s * 14, s * 3.2, SKIN, SKIN_LINE);
  // Pää
  artCircle(c, 0, -s * 27, s * 6.4, SKIN, { lineColor: SKIN_LINE, hi: 0.3 });
  // Hiukset: otsatukka ja letti
  c.beginPath();
  c.arc(0, -s * 29, s * 6.8, Math.PI * 0.92, Math.PI * 2.08);
  c.closePath();
  artFillPath(c, HAIR, -s * 36, -s * 26, s * 6);
  artBlob(c, -s * 5.5, -s * 21, s * 2.7, s * 7.5, HAIR, { rot: 0.3 });
  artCircle(c, -s * 7, -s * 14, s * 1.6, '#ff8fbe', {});
  // Silmä, poski ja hymy
  artEye(c, s * 2.2, -s * 27.2, s * 1.35, 0.3, (t % 4.3) < 0.14);
  artBlush(c, s * 4.2, -s * 25, s * 1.4);
  c.strokeStyle = '#c0392b';
  c.lineWidth = Math.max(1, s * 0.9);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 1.5, -s * 25, s * 2.2, 0.25, Math.PI - 0.65); c.stroke();
  // Kruunu
  c.beginPath();
  c.moveTo(-s * 4.8, -s * 33);
  c.lineTo(-s * 4.8, -s * 37.5);
  c.lineTo(-s * 2.3, -s * 34.8);
  c.lineTo(0, -s * 38.8);
  c.lineTo(s * 2.3, -s * 34.8);
  c.lineTo(s * 4.8, -s * 37.5);
  c.lineTo(s * 4.8, -s * 33);
  c.closePath();
  artFillPath(c, '#ffd24f', -s * 39, -s * 33, s * 4, { lineColor: '#d98a00' });
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.arc(0, -s * 34.6, s * 0.9, 0, Math.PI * 2); c.fill();
  c.restore();
}

// Prinsessa jaloin (juoksu- ja lentokentät). Origo jalkojen kohdalla.
function drawPrincessFree(c, x, y, s, facing, walkPhase, moving, t) {
  artShadow(c, x, y + s * 1.2, s * 14, s * 4.2, moving ? 0.12 : 0.18);
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  var bob = moving ? Math.abs(Math.sin(walkPhase)) * s * 3 : Math.sin(t * 2) * s * 1.2;
  c.translate(0, -bob);
  var swing = moving ? Math.sin(walkPhase) * s * 7 : 0;
  // Jalat
  artLimb(c, -s * 4, -s * 18, -s * 6 - swing, -s * 2, s * 4.4, SKIN, SKIN_LINE);
  artLimb(c, s * 4, -s * 18, s * 6 + swing, -s * 2, s * 4.4, SKIN, SKIN_LINE);
  // Mekko
  c.beginPath();
  c.moveTo(0, -s * 28);
  c.quadraticCurveTo(-s * 16, -s * 8, -s * 12, -s * 2);
  c.lineTo(s * 12, -s * 2);
  c.quadraticCurveTo(s * 16, -s * 8, 0, -s * 28);
  c.closePath();
  artFillPath(c, DRESS, -s * 28, -s * 2, s * 12);
  c.strokeStyle = '#ffd1e8';
  c.lineWidth = Math.max(1, s * 1.1);
  c.beginPath();
  c.moveTo(-s * 10, -s * 5); c.quadraticCurveTo(0, -s * 8, s * 10, -s * 5);
  c.stroke();
  artBlob(c, 0, -s * 26, s * 6.2, s * 8, DRESS, {});
  // Vapaa käsi
  artLimb(c, -s * 4, -s * 22, -s * 8 - swing * 0.45, -s * 8, s * 3.2, SKIN, SKIN_LINE);
  // Sauva
  artLimb(c, s * 6, -s * 30, s * 22, -s * 48, s * 2.5, '#d9b3ff', '#9a6fc4');
  artGlow(c, s * 24, -s * 50, s * 9, '#ffe27a', 0.4);
  artCircle(c, s * 24, -s * 50, s * 4, '#ffe27a', { lineColor: '#d98a00', hi: 0.45 });
  // Pää
  artCircle(c, 0, -s * 42, s * 8, SKIN, { lineColor: SKIN_LINE, hi: 0.3 });
  c.beginPath();
  c.arc(0, -s * 45, s * 8.2, Math.PI * 0.95, Math.PI * 2.05);
  c.closePath();
  artFillPath(c, HAIR, -s * 54, -s * 42, s * 8);
  artBlob(c, -s * 7, -s * 34, s * 3.4, s * 9, HAIR, { rot: 0.28 });
  artCircle(c, -s * 8.5, -s * 26, s * 2, '#ff8fbe', {});
  artEye(c, s * 3, -s * 42, s * 1.55, moving ? 0.45 : 0.25, (t % 4.1) < 0.14);
  artBlush(c, s * 5.2, -s * 39, s * 1.8);
  c.strokeStyle = '#c0392b';
  c.lineWidth = Math.max(1, s * 0.9);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 1.8, -s * 39.5, s * 2.4, 0.2, Math.PI - 0.7); c.stroke();
  // Kruunu
  c.beginPath();
  c.moveTo(-s * 6, -s * 50);
  c.lineTo(-s * 6, -s * 56);
  c.lineTo(-s * 3, -s * 52);
  c.lineTo(0, -s * 58);
  c.lineTo(s * 3, -s * 52);
  c.lineTo(s * 6, -s * 56);
  c.lineTo(s * 6, -s * 50);
  c.closePath();
  artFillPath(c, '#ffd24f', -s * 58, -s * 50, s * 5, { lineColor: '#d98a00' });
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.arc(0, -s * 52.2, s * 1.1, 0, Math.PI * 2); c.fill();
  c.restore();
}

// Myrskynoita luudalla (finaali, tarinakirja, kartan myrskypilvi). s = mittayksikkö
// (pää on 0,45 s), dir = 1 oikealle / -1 vasemmalle, mood: 'grumpy' äreä,
// 'sulk' murjottaa (pakenee), 'sad' surullinen (kyynel), 'happy' iloinen (punastuu).
function drawStormWitch(c, x, y, s, dir, mood) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  // Luuta
  artLimb(c, -s * 1.6, s * 0.9, s * 1.1, s * 0.5, s * 0.18, '#8a5a30', '#4a2e14');
  c.beginPath();
  c.moveTo(-s * 1.5, s * 0.6); c.lineTo(-s * 2.4, s * 0.55); c.lineTo(-s * 2.5, s * 1.3); c.lineTo(-s * 1.6, s * 1.15);
  c.closePath();
  artFillPath(c, '#c9a25a', s * 0.55, s * 1.3, s * 0.4, { lineColor: '#7a5a20' });
  // Kaapu
  c.beginPath();
  c.moveTo(0, -s * 0.9);
  c.quadraticCurveTo(-s * 1.3, s * 0.2, -s * 1.0, s * 0.8);
  c.lineTo(s * 0.8, s * 0.8);
  c.quadraticCurveTo(s * 0.9, 0, 0, -s * 0.9);
  c.closePath();
  artFillPath(c, '#6a3a98', -s * 0.9, s * 0.8, s * 0.9, { lineColor: '#2e1a4a' });
  // Pää, silmä ja suu ilmeen mukaan
  artCircle(c, 0, -s * 1.1, s * 0.45, '#b8e0a0', { lineColor: '#4a7a3a' });
  artEye(c, s * 0.16, -s * 1.15, s * 0.1, 0.3, false);
  c.strokeStyle = '#2a1a3a';
  c.lineWidth = s * 0.06;
  c.lineCap = 'round';
  c.beginPath();
  if (mood === 'happy') {
    c.arc(s * 0.12, -s * 1.02, s * 0.15, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
    artBlush(c, s * 0.28, -s * 0.98, s * 0.08);
  } else if (mood === 'sad') {
    c.arc(s * 0.12, -s * 0.84, s * 0.12, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
    artBlob(c, s * 0.22, -s * 0.98, s * 0.04, s * 0.07, '#8fd0ff', { lineColor: '#4a8ac0' });
  } else if (mood === 'sulk') {
    c.moveTo(s * 0.02, -s * 0.9); c.lineTo(s * 0.26, -s * 0.94);
    c.stroke();
  } else {
    c.arc(s * 0.1, -s * 0.9, s * 0.15, Math.PI * 1.2, Math.PI * 1.9);
    c.stroke();
  }
  // Hattu
  c.beginPath();
  c.moveTo(-s * 0.75, -s * 1.38); c.lineTo(s * 0.75, -s * 1.38); c.lineTo(s * 0.1, -s * 2.7);
  c.closePath();
  artFillPath(c, '#3a2460', -s * 2.7, -s * 1.38, s * 0.75, { lineColor: '#1a1030' });
  artRoundRect(c, -s * 0.9, -s * 1.48, s * 1.8, s * 0.15, s * 0.05, '#3a2460', { lineColor: '#1a1030' });
  c.fillStyle = '#ffe27a';
  c.fillRect(-s * 0.32, -s * 1.63, s * 0.64, s * 0.15);
  c.restore();
}

// Noidan myrskypilvi: tumma pilvi, sadeviirut ja välillä salama. (x, y) pilven keskikohta,
// s koko, t aika, rain 0..1 sateen määrä.
function drawWitchCloud(c, x, y, s, t, rain) {
  var i, k, rx, ry;
  if (rain > 0) {
    c.strokeStyle = 'rgba(120,140,200,' + (0.55 * rain) + ')';
    c.lineWidth = Math.max(1, s * 0.05);
    c.lineCap = 'round';
    for (i = 0; i < 9; i++) {
      k = ((t * 1.6 + i * 0.37) % 1);
      rx = x + (i - 4) * s * 0.28 - k * s * 0.15;
      ry = y + s * 0.3 + k * s * 1.4;
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - s * 0.08, ry + s * 0.3); c.stroke();
    }
  }
  // Salama välähtää muutaman sekunnin välein
  var flash = (t % 3.7) < 0.12;
  if (flash) {
    c.strokeStyle = '#ffe27a';
    c.lineWidth = Math.max(1.5, s * 0.07);
    c.beginPath();
    c.moveTo(x + s * 0.2, y + s * 0.3); c.lineTo(x - s * 0.05, y + s * 0.8);
    c.lineTo(x + s * 0.15, y + s * 0.8); c.lineTo(x - s * 0.1, y + s * 1.3);
    c.stroke();
  }
  c.fillStyle = flash ? '#8a86b8' : '#6f6a9a';
  c.beginPath();
  c.arc(x - s * 0.6, y + s * 0.05, s * 0.42, 0, Math.PI * 2);
  c.arc(x + s * 0.6, y + s * 0.08, s * 0.4, 0, Math.PI * 2);
  c.arc(x - s * 0.15, y - s * 0.2, s * 0.55, 0, Math.PI * 2);
  c.arc(x + s * 0.3, y - s * 0.12, s * 0.45, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(40,30,80,0.35)';
  c.beginPath();
  c.ellipse(x, y + s * 0.3, s * 0.95, s * 0.14, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); c.arc(x - s * 0.3, y - s * 0.38, s * 0.22, 0, Math.PI * 2); c.fill();
}
