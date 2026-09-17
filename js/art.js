'use strict';

// Ilme: yhteinen piirtokirjasto ("tarrakirja"-tyyli). Säännöt README:n
// Tyyliopas-osiossa. Lyhyesti: pyöreät muodot, tummempi reunaviiva, kaksi
// sävyä (vaalea yläpuoli, tumma alapuoli), maavarjo jokaisen hahmon alla,
// hehku keräiltävissä. Kaikki funktiot ovat kevyitä: ei shadowBlur- eikä
// filter-suodattimia, jotta vanha tabletti pysyy 60 fps:ssä.

var ART = {
  shadeUp: 0.16,    // vaalennus muodon yläreunassa
  shadeDown: 0.20,  // tummennus muodon alareunassa
  lineDark: 0.45,   // reunaviivan tummennus perusväristä
  lineW: 0.08,      // reunaviivan paksuus suhteessa muodon säteeseen
  lineMin: 1.2,     // reunaviivan vähimmäispaksuus pikseleinä
  shadowAlpha: 0.18 // maavarjon läpinäkyvyys
};

// ---------- Värit ----------
function artParse(hex) {
  var h = hex.replace('#', '');
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  var n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function artHex(r, g, b) {
  var v = (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
  return '#' + ('000000' + v.toString(16)).slice(-6);
}
function artClamp(v) { return Math.max(0, Math.min(255, v)); }
// Vaalenna (amt > 0, kohti valkoista) tai tummenna (amt < 0, kohti mustaa)
function artShade(hex, amt) {
  var c = artParse(hex);
  var i;
  for (i = 0; i < 3; i++) {
    c[i] = amt >= 0 ? c[i] + (255 - c[i]) * amt : c[i] * (1 + amt);
    c[i] = artClamp(c[i]);
  }
  return artHex(c[0], c[1], c[2]);
}
function artRGBA(hex, a) {
  var c = artParse(hex);
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
}
// Sekoita väriä kohti toista (ilmaperspektiivi: kaukainen sävytetään taivaan väriin)
function artMix(hexA, hexB, t) {
  var a = artParse(hexA), b = artParse(hexB);
  return artHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

// ---------- Muodot ----------
// Kaksisävyinen täyttö nykyiselle polulle: liukuväri y0 (vaalea) -> y1 (tumma)
// ja reunaviiva. opts: { line: false | paksuus, lineColor, flat: true (ei liukuväriä),
// shadeTo: varjopuolen väri (valkoisille hahmoille laventeli, ei harmaa), alpha }
function artFillPath(c, color, y0, y1, r, opts) {
  opts = opts || {};
  if (opts.flat) {
    c.fillStyle = color;
  } else {
    var g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, artShade(color, ART.shadeUp));
    g.addColorStop(1, opts.shadeTo || artShade(color, -ART.shadeDown));
    c.fillStyle = g;
  }
  if (opts.alpha !== undefined) c.globalAlpha = opts.alpha;
  c.fill();
  if (opts.line !== false) {
    c.strokeStyle = opts.lineColor || artShade(color, -ART.lineDark);
    c.lineWidth = typeof opts.line === 'number' ? opts.line : Math.max(ART.lineMin, r * ART.lineW);
    c.lineJoin = 'round';
    c.stroke();
  }
  if (opts.alpha !== undefined) c.globalAlpha = 1;
}

// Varjostettu soikio reunaviivalla. opts: { rot, line, flat, hi: kiilto }
function artBlob(c, x, y, rx, ry, color, opts) {
  opts = opts || {};
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, opts.rot || 0, 0, Math.PI * 2);
  else c.arc(x, y, (rx + ry) / 2, 0, Math.PI * 2);
  artFillPath(c, color, y - ry, y + ry, Math.max(rx, ry), opts);
  if (opts.hi) artHighlight(c, x - rx * 0.35, y - ry * 0.4, rx * 0.3, ry * 0.2, opts.hi === true ? 0.35 : opts.hi);
}
function artCircle(c, x, y, r, color, opts) {
  artBlob(c, x, y, r, r, color, opts);
}
// Pyöristetty suorakulmio varjostuksella
function artRoundRect(c, x, y, w, h, r, color, opts) {
  roundRect(c, x, y, w, h, r);
  artFillPath(c, color, y, y + h, Math.min(w, h) / 2, opts);
}
// Raaja: pyöreäpäinen viiva reunaviivalla (jalat, kädet, kaulat).
// line: false = ei reunaviivaa, merkkijono = reunaviivan väri, muuten johdetaan väristä
function artLimb(c, x0, y0, x1, y1, w, color, line) {
  c.lineCap = 'round';
  if (line !== false) {
    c.strokeStyle = typeof line === 'string' ? line : artShade(color, -ART.lineDark);
    c.lineWidth = w + Math.max(ART.lineMin, w * 0.16) * 2;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}
// Valkoinen kiilto (soikio vasemmassa yläkulmassa)
function artHighlight(c, x, y, rx, ry, alpha) {
  c.fillStyle = 'rgba(255,255,255,' + (alpha || 0.35) + ')';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2);
  else c.arc(x, y, rx, 0, Math.PI * 2);
  c.fill();
}
// Maavarjo hahmon alla
function artShadow(c, x, y, rx, ry, alpha) {
  var g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(20,30,40,' + (alpha === undefined ? ART.shadowAlpha : alpha) + ')');
  g.addColorStop(1, 'rgba(20,30,40,0)');
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
  c.restore();
}
// Pehmeä hehku (keräiltävät, lyhdyt, taika)
function artGlow(c, x, y, r, color, alpha) {
  var g = c.createRadialGradient(x, y, r * 0.15, x, y, r);
  g.addColorStop(0, artRGBA(color, alpha === undefined ? 0.5 : alpha));
  g.addColorStop(1, artRGBA(color, 0));
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}
// Silmä: valkuainen, pupilli ja kiilto. look: -1..1 katseen suunta
function artEye(c, x, y, r, look, blink) {
  if (blink) {
    c.strokeStyle = '#333';
    c.lineWidth = Math.max(1, r * 0.35);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke();
    return;
  }
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(x + (look || 0) * r * 0.3, y + r * 0.1, r * 0.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x + (look || 0) * r * 0.3 - r * 0.2, y - r * 0.15, r * 0.22, 0, Math.PI * 2); c.fill();
}
// Poski
function artBlush(c, x, y, r) {
  c.fillStyle = 'rgba(255,120,160,0.35)';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

// ---------- Liike: pehmennykset ----------
function easeOutCubic(t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); }
function easeInOutSine(t) { t = Math.min(1, Math.max(0, t)); return -(Math.cos(Math.PI * t) - 1) / 2; }
// Ylittää hetkeksi maalin ja palaa: pomppaava ilmestyminen
function easeOutBack(t) {
  t = Math.min(1, Math.max(0, t));
  var c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
// Litistys ja venytys: q > 0 venyttää pystyyn, q < 0 litistää. Kutsu translate:n jälkeen.
function artSquash(c, q) {
  c.scale(1 - q, 1 + q);
}

// ---------- Liike: tärinä ----------
var artShake = { t: 0, dur: 0, amp: 0 };
function artShakeStart(amp, dur) {
  artShake.amp = Math.max(artShake.amp, amp);
  artShake.t = dur;
  artShake.dur = dur;
}
function artShakeUpdate(dt) {
  if (artShake.t > 0) {
    artShake.t -= dt;
    if (artShake.t <= 0) { artShake.t = 0; artShake.amp = 0; }
  }
}
function artShakeOffset() {
  if (artShake.t <= 0) return { x: 0, y: 0 };
  var k = artShake.amp * (artShake.t / artShake.dur);
  return { x: Math.sin(globalT * 63) * k, y: Math.cos(globalT * 47) * k * 0.6 };
}

// ---------- Liike: pop-efektit (maailmakoordinaateissa) ----------
// kind: 'ring' laajeneva rengas, 'burst' säteet
var artPops = [];
function artPop(x, y, r, color, kind) {
  if (artPops.length > 24) artPops.shift();
  artPops.push({ x: x, y: y, r: r, color: color || '#ffffff', kind: kind || 'ring', t: 0, life: 0.45 });
}
function artPopsUpdate(dt) {
  var i;
  for (i = artPops.length - 1; i >= 0; i--) {
    artPops[i].t += dt;
    if (artPops[i].t >= artPops[i].life) artPops.splice(i, 1);
  }
}
function artPopsDraw(c, camOff) {
  var i, p, k, a, r, j, ang;
  for (i = 0; i < artPops.length; i++) {
    p = artPops[i];
    k = easeOutCubic(p.t / p.life);
    a = 1 - k;
    if (p.kind === 'ring') {
      c.strokeStyle = artRGBA(p.color, a * 0.9);
      c.lineWidth = Math.max(1.5, p.r * 0.14 * (1 - k * 0.7));
      c.beginPath(); c.arc(p.x - camOff, p.y, p.r * (0.4 + k * 1.4), 0, Math.PI * 2); c.stroke();
    } else {
      c.strokeStyle = artRGBA(p.color, a);
      c.lineWidth = Math.max(1.5, p.r * 0.1);
      c.lineCap = 'round';
      r = p.r * (0.6 + k * 1.6);
      for (j = 0; j < 8; j++) {
        ang = j * Math.PI / 4 + 0.3;
        c.beginPath();
        c.moveTo(p.x - camOff + Math.cos(ang) * r * 0.6, p.y + Math.sin(ang) * r * 0.6);
        c.lineTo(p.x - camOff + Math.cos(ang) * r, p.y + Math.sin(ang) * r);
        c.stroke();
      }
    }
  }
}
function artFxReset() {
  artPops = [];
  artShake.t = 0; artShake.amp = 0;
}
