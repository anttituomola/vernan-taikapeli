'use strict';

// Pikkupilven kotimatka, luku 4: TÄH-TI-TAI-VAS (ilta -> hämärä -> yö). Matkan
// vaikein luku. Pikkupilvi on kasvanut ISOKSI ja kantaa prinsessaa ja
// yksisarvista selässään. Taivas vierii itsestään oikealle, ja aurinko laskee,
// tulee hämärä ja lopulta tähtiyö kuineen.
//   Ohjaus: sormi RAAHAA isoa pilveä (seuraa sormea pehmeästi, enintään
//   TKS_VMAX × viewH / s) alueella x 0,12–0,6 × viewW, y TKS_YMIN–TKS_YMAX.
//   Sisarpilvet: viisi eksynyttä pastellipikkupilveä leijuu reitin varrella.
//   Kosketus isolla pilvellä -> "jee!", ja sisar liittyy JONOON pilven perään
//   (seuraa pilven kulkemaa reittiä). HUD: viisi paikkaa.
//   Tähdet (20) reitin varrella, HUD-laskuri.
//   Ukkospilvet (äreitä mutta söpöjä) leijuvat ylhäällä seurueen mukana.
//   Ennen iskua ne VAROITTAVAT: jyrinä, välke ja hehkuva katkoviiva iskun
//   kohdalla (hämärässä 1,0 s, yöllä 0,85 s), sitten salama 0,25 s. Osuma ei
//   satu: välähdys, pieni tärinä, prinsessa hytisee ja jonon VIIMEINEN sisar
//   säikähtää ja lepattaa ylös eteenpäin odottamaan, että se otetaan uudestaan
//   kiinni. Iskut kiristyvät: ilta = ei salamoita (lento ja keräys), hämärä =
//   yksittäisiä iskuja, yö = kaksi pilveä vuorotellen ja lopuksi tuplaisku:
//   kahden salaman muuri peittää ruudun toisen laidan ja minttuinen,
//   kimalteleva turvarako on toisella laidalla; heti välähdyksen jälkeen
//   muuri ja rako vaihtavat puolta (vaikein kohta: välähdys, sitten vauhtia).
//   Tuulivyöhykkeet (näkyvät kiehkurat) työntävät pilveä lempeästi ylös tai alas.
//   Lopussa Pilvilinna hehkuu pilvillä sateenkaariviireineen. Portti aukeaa
//   vasta, kun kaikki viisi sisarta ovat jonossa; puuttuvat leijuvat tyynessä
//   ilmassa luo. Iso tähdenlento ylittää taivaan linnan luona: kosketus tai
//   napautus nappaa lahjan (TÄHTI); ohi mennyt tulee uudestaan. Portilla
//   sisaret hurraavat, portti aukeaa valossa -> trekChapterDone().
//   Piilopupu: yöllä kuu on tökättävä; kolmas tökkäys ja kuupupu hyppää isolle
//   pilvelle kyytiin.
//   Tökättävät: tähdenlennot (toivekimallus, joka kolmas = tähtisade),
//   kuumailmapallo ja vilkuttava nalle (ilta), lintuparvi (ilta), unelias pöllö
//   pilvellä (yö, huhuilee; 3. tökkäys: yömyssy), ukkospilvet murahtavat.
//   Kaikki sijainnit tallennetaan osuuksina (x × viewW, y × viewH), joten koon
//   muutos ei riko mitään. Luvulla on oma pitkä koordinaatisto: kamera
//   tks.cam × viewW (camX päivitetään siitä), maailman reuna ei rajoita.

var TKS_SPEED = 0.12;        // vieritys × viewW / s
var TKS_LEN = 19.6;          // kameran matka linnalle × viewW
var TKS_DUSK = 6.0;          // hämärä alkaa (kamera × viewW)
var TKS_NIGHT = 12.6;        // yö alkaa
var TKS_R = 0.115;           // ison pilven säde × viewH
var TKS_UNI = 0.62;          // yksisarvisen skaala × trekUS()
var TKS_VMAX = 1.0;          // pilven enimmäisnopeus × viewH / s
var TKS_FOLLOW = 7;          // sormen seurannan jousi (1 / s)
var TKS_XMIN = 0.12;         // pilven x-alue × viewW
var TKS_XMAX = 0.6;
var TKS_XSPAN = 0.66;        // alueen enimmäisleveys × viewH
var TKS_XMAX_CASTLE = 0.8;   // linnalla saa lentää portille asti
var TKS_YMIN = 0.24;         // pilven y-alue × viewH (yksisarvinen mahtuu ruutuun)
var TKS_YMAX = 0.84;
var TKS_SIB_R = 0.042;       // sisarpilven säde × viewH
var TKS_SIB_GAP = 0.088;     // sisarten väli jonossa × viewH
var TKS_SIB_U = [2.7, 5.4, 8.9, 12.0, 15.4];  // sisarten paikat maailmassa × viewW
var TKS_SIB_TINTS = ['#ffc4dc', '#bff0d8', '#fff0a0', '#dcc8ff', '#ffd2b0'];  // pinkki, minttu, sitruuna, liila, persikka
var TKS_STAR_GROUPS = [[1.6, 3], [3.5, 2], [4.8, 2], [7.4, 2], [8.3, 1], [9.8, 3], [11.1, 1], [13.6, 2], [14.5, 1], [15.9, 2], [17.3, 1]];
var TKS_TEL = [1.0, 0.85];   // salaman varoitus hämärässä / yöllä (s)
var TKS_BOLT = 0.25;         // salaman kesto
var TKS_BOLT_W = 0.055;      // salaman vaaravyön puolileveys × viewH
var TKS_HIT_K = 0.85;        // ison pilven puolileveys osumassa × TKS_R
var TKS_INV = 1.4;           // osuman jälkeinen suoja-aika
var TKS_TRACK = 0.4;         // ukkospilven seurantanopeus × viewW / s
var TKS_LEAD = 0.3;          // ukkospilvi tähtää liikkeen eteen (s)
var TKS_SAFE = [0.06, 0.1];    // turvaraon puolileveys × viewH (arvotaan: leveämpi rako = lyhyempi pyrähdys)
// Ukkosvyöhykkeet (kamera × viewW): single = yksi pilvi, alt = kaksi vuorotellen,
// double = tuplaisku turvarakoineen; rest = tauko iskujen välissä (s)
var TKS_STORMS = [
  { u0: 6.7, u1: 9.6, mode: 'single', rest: [1.6, 2.2] },
  { u0: 10.3, u1: 12.3, mode: 'single', rest: [0.9, 1.3] },
  { u0: 13.2, u1: 15.9, mode: 'alt', rest: [1.2, 1.6] },
  { u0: 16.2, u1: 19.0, mode: 'double', rest: [0.8, 1.1] }
];
// Tuulivyöhykkeet maailmassa (× viewW) ja suunta (-1 ylös, 1 alas)
var TKS_WINDS = [[3.9, 4.5, -1], [6.3, 6.9, 1], [10.0, 10.5, -1], [12.6, 13.1, 1], [16.0, 16.4, -1]];
var TKS_WIND = 0.22;         // tuulen työntö × viewH / s
var TKS_SKYP = 0.2;          // kaukotaivaan parallaksi
// Taivaan värit kameran matkan mukaan: [u, ylä, keski, horisontti]
var TKS_SKY = [
  [0, '#7a86dc', '#f5a2c2', '#ffc884'],
  [4, '#6a6ccc', '#e48cba', '#ffa978'],
  [7, '#45449e', '#9068bc', '#e48aa8'],
  [10.5, '#262a78', '#4d4298', '#8058a4'],
  [13, '#141a52', '#21296c', '#3a3a88'],
  [21, '#0e1446', '#1b2564', '#30347a']
];

var tks = {
  t: 0, cam: 0, state: 'fly', cx: 0.3, cy: 0.5, vx: 0, vy: 0, path: [], sibs: [], trail: [], stars: [],
  starN: 0, tclouds: [], storm: -1, stormT: 0, hitN: 0, invT: 0, shiverT: 0, hitT: 0, flashT: 0, boltFlash: 0,
  wowT: 0, giggleT: 0, wiggleT: 0, idleT: 0, everDrag: false, pokeHold: false, pupTap: false,
  shoots: [], shootT: 4, wishN: 0, gift: null, moonN: 0, moonT: 0, bunny: null, gateT: 0, endT: 0, done: false,
  flyers: [], hudBump: 0, sibBump: 0, puffs: [], inWind: false, rumbleT: 0, castleT: 0, homeT: 0
};

// ---------- Apu ----------
function tksRnd(a, b) { return a + Math.random() * (b - a); }
function tksHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function tksClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function tksR() { return viewH * TKS_R; }
// Ison pilven paikka ruudulla ja maailmassa (pikseleinä)
function tksSX() { return tks.cx * viewW; }
function tksSY() { return tks.cy * viewH; }
function tksWX() { return tks.cam * viewW + tks.cx * viewW; }
// Leveällä ruudulla alue rajataan TKS_XSPAN × viewH leveäksi (sama haaste kaikilla ruuduilla)
function tksXMax() { return tks.state === 'fly' ? Math.min(TKS_XMAX, TKS_XMIN + TKS_XSPAN * viewH / viewW) : TKS_XMAX_CASTLE; }
// Vuorokaudenaika: 0 = ilta, 1 = yö (kameran matkan mukaan)
function tksNight(u) { return tksClamp((u - 6.5) / 6.5, 0, 1); }
function tksPal(u) {
  var i, a, b, k;
  if (u <= TKS_SKY[0][0]) return [TKS_SKY[0][1], TKS_SKY[0][2], TKS_SKY[0][3]];
  for (i = 0; i + 1 < TKS_SKY.length; i++) {
    a = TKS_SKY[i]; b = TKS_SKY[i + 1];
    if (u <= b[0]) {
      k = easeInOutSine((u - a[0]) / (b[0] - a[0]));
      return [artMix(a[1], b[1], k), artMix(a[2], b[2], k), artMix(a[3], b[3], k)];
    }
  }
  a = TKS_SKY[TKS_SKY.length - 1];
  return [a[1], a[2], a[3]];
}
// Pilvien sävy: illalla persikka ja pinkki, hämärässä laventeli, yöllä kuunsininen
function tksPuffCol(u) {
  var n = tksNight(u), body, shade, rim;
  if (n < 0.5) {
    body = artMix('#ffd6c8', '#c9a8e2', n * 2);
    shade = artMix('#f08fb2', '#8a72c0', n * 2);
    rim = artMix('#fff1d0', '#f0d8ff', n * 2);
  } else {
    body = artMix('#c9a8e2', '#5664ac', (n - 0.5) * 2);
    shade = artMix('#8a72c0', '#323c84', (n - 0.5) * 2);
    rim = artMix('#f0d8ff', '#c8d4ff', (n - 0.5) * 2);
  }
  return { body: body, shade: shade, rim: rim };
}

// ---------- Alustus ----------
function tksInit() {
  var i, j, g, n, v, order;
  tks.t = 0;
  tks.cam = 0;
  camX = 0;
  tks.state = 'fly';
  tks.cx = 0.3;
  tks.cy = 0.52;
  tks.vx = 0;
  tks.vy = 0;
  tks.path = [];
  tks.trail = [];
  tks.starN = 0;
  tks.tclouds = [];
  tks.storm = -1;
  tks.stormT = 0;
  tks.hitN = 0;
  tks.invT = 0;
  tks.shiverT = 0;
  tks.hitT = 0;
  tks.flashT = 0;
  tks.boltFlash = 0;
  tks.wowT = 0;
  tks.giggleT = 0;
  tks.wiggleT = 0;
  tks.idleT = 0;
  tks.everDrag = false;
  tks.pokeHold = false;
  tks.pupTap = false;
  tks.shoots = [];
  tks.shootT = 6;
  tks.wishN = 0;
  tks.gift = { state: 'wait', t: 2.5, n: 0, x: 0, y: 0, cx: 0, cy: 0 };
  tks.moonN = 0;
  tks.moonT = 0;
  tks.bunny = null;
  tks.gateT = 0;
  tks.endT = 0;
  tks.done = false;
  tks.flyers = [];
  tks.hudBump = 0;
  tks.sibBump = 0;
  tks.rumbleT = 0;
  tks.castleT = 0;
  tks.homeT = 0;
  tks.inWind = false;
  // Sisarpilvet: värit sekoitetaan, korkeudet arvotaan
  order = [0, 1, 2, 3, 4];
  for (i = order.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); n = order[i]; order[i] = order[j]; order[j] = n; }
  tks.sibs = [];
  for (i = 0; i < TKS_SIB_U.length; i++) {
    v = tksRnd(0.32, 0.76);
    tks.sibs.push({ tint: TKS_SIB_TINTS[order[i]], u: TKS_SIB_U[i] + tksRnd(-0.15, 0.15), v: v, hu: 0, hv: v, x: 0, y: 0, state: 'wait', t: 0, ph: Math.random() * 6, seed: i * 1.7, hop: 0 });
    tks.sibs[i].hu = tks.sibs[i].u;
  }
  // Tähdet ryhminä: kaari, nousu tai lasku; korkeus arvotaan
  tks.stars = [];
  for (i = 0; i < TKS_STAR_GROUPS.length; i++) {
    g = TKS_STAR_GROUPS[i];
    v = tksRnd(0.3, 0.74);
    n = Math.random() < 0.5 ? 1 : -1;
    for (j = 0; j < g[1]; j++) {
      tks.stars.push({ u: g[0] + j * 0.13, v: tksClamp(v + n * (j - (g[1] - 1) / 2) * 0.07 - (g[1] === 3 && j === 1 ? 0.05 : 0), 0.28, 0.8), got: false, ph: Math.random() * 6 });
    }
  }
  // Taustapilvet kahdessa parallaksikerroksessa
  tks.puffs = [];
  for (i = 0; i < 2; i++) {
    var par = i ? 0.62 : 0.34, u = -0.3;
    while (u < TKS_LEN * par + 1.6) {
      tks.puffs.push({ p: par, u: u, v: i ? tksRnd(0.5, 0.74) : tksRnd(0.3, 0.6), s: i ? tksRnd(0.035, 0.05) : tksRnd(0.022, 0.034), seed: Math.random() * 9 });
      u += tksRnd(0.32, 0.6) * (i ? 1.3 : 1);
    }
  }
  tksSetupProps();
  tksRenderKey = '';
}

// ---------- Tökättävät koristeet ----------
// Paikat osuuksina (u × viewW maailmassa, v × viewH); update laskee pikselit,
// joten koon muutos ei vaadi uudelleenrakennusta.
function tksSetupProps() {
  propsReset();
  tksAddBalloon(0.8, 0.2);
  tksAddBirds(1.7, 0.14);
  tksAddOwl(12.95, 0.7);
}
function tksPropPos(p) {
  p.x = p.u * viewW;
  p.y = p.v * viewH;
  p.r = p.rs * viewH;
  p.hy = p.hys * viewH;
}
// Kuumailmapallo, jonka korissa vilkuttaa nalle. Tökkäys: poltin leimahtaa
// ja nalle vilkuttaa; kolmas tökkäys päästää sydänilmapalloja
function tksAddBalloon(u, v) {
  propAdd({
    u: u, v: v, rs: 0.075, hys: -0.02, color: '#ffb0c8', note: 523, amp: 0.08, waveT: 0, flameT: 0, hearts: [],
    update: function (p, dt) {
      var i;
      p.u += 0.065 * dt;
      p.v = v + Math.sin(globalT * 0.7) * 0.01;
      tksPropPos(p);
      if (p.waveT > 0) p.waveT -= dt;
      if (p.flameT > 0) p.flameT -= dt;
      for (i = p.hearts.length - 1; i >= 0; i--) {
        p.hearts[i].t += dt;
        if (p.hearts[i].t > 4) p.hearts.splice(i, 1);
      }
    },
    poke: function (p) {
      var i;
      p.waveT = 1.4;
      p.flameT = 0.6;
      playNote(180, 0, 0.25, 'sawtooth', 0.05);
      playNote(660, 0.1, 0.1, 'triangle', 0.16);
      playNote(880, 0.2, 0.14, 'triangle', 0.16);
      if (p.n % 3 === 0) {
        for (i = 0; i < 4; i++) p.hearts.push({ t: -i * 0.18, dx: (i - 1.5) * 0.4, col: ['#ff7bac', '#ffd24f', '#8fd8ff', '#c9a0ff'][i] });
        playNote(1047, 0.25, 0.12, 'sine', 0.18);
        playNote(1319, 0.37, 0.12, 'sine', 0.18);
        playNote(1568, 0.49, 0.2, 'sine', 0.18);
      }
    },
    draw: function (c, p) {
      var s = viewH * 0.065, i, k, hx, hy, wv;
      // Sydänilmapallot nousevat
      for (i = 0; i < p.hearts.length; i++) {
        k = p.hearts[i].t;
        if (k < 0) continue;
        hx = p.hearts[i].dx * s * 2 + Math.sin(k * 2 + i) * s * 0.3;
        hy = s * 1.6 - k * s * 1.6;
        c.globalAlpha = Math.max(0, Math.min(1, 4 - k));
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(hx, hy + s * 0.3); c.lineTo(hx + Math.sin(k * 3) * s * 0.1, hy + s * 0.8); c.stroke();
        tksHeart(c, hx, hy, s * 0.28, p.hearts[i].col);
        c.globalAlpha = 1;
      }
      // Köydet
      c.strokeStyle = '#8a5a3a';
      c.lineWidth = Math.max(1, s * 0.04);
      c.beginPath();
      c.moveTo(-s * 0.62, s * 0.55); c.lineTo(-s * 0.34, s * 1.4);
      c.moveTo(s * 0.62, s * 0.55); c.lineTo(s * 0.34, s * 1.4);
      c.stroke();
      // Kuori: raidat
      c.save();
      c.beginPath();
      c.moveTo(0, s * 0.95);
      c.bezierCurveTo(-s * 1.25, s * 0.2, -s * 1.05, -s * 1.15, 0, -s * 1.15);
      c.bezierCurveTo(s * 1.05, -s * 1.15, s * 1.25, s * 0.2, 0, s * 0.95);
      c.closePath();
      artFillPath(c, '#ff8fb8', -s * 1.15, s * 0.95, s, { lineColor: '#b0487a' });
      c.clip();
      c.fillStyle = '#ffe27a';
      for (i = -1; i <= 1; i += 2) {
        c.beginPath(); c.ellipse(i * s * 0.48, -s * 0.1, s * 0.2, s * 1.2, 0, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath(); c.ellipse(-s * 0.45, -s * 0.55, s * 0.15, s * 0.35, -0.3, 0, Math.PI * 2); c.fill();
      c.restore();
      // Poltin
      if (p.flameT > 0) {
        k = p.flameT / 0.6;
        artBlob(c, 0, s * 1.02, s * 0.12 * (0.6 + k), s * 0.25 * (0.6 + k), '#ffb84f', { line: false });
        artBlob(c, 0, s * 1.06, s * 0.06 * (0.6 + k), s * 0.12 * (0.6 + k), '#fff3b0', { line: false });
      }
      // Nalle korissa
      wv = p.waveT > 0 ? Math.sin(globalT * 14) * 0.6 : Math.sin(globalT * 1.5) * 0.15;
      artCircle(c, -s * 0.3, s * 1.06, s * 0.09, '#c8905a', { lineColor: '#6a4628' });
      artCircle(c, s * 0.1, s * 1.06, s * 0.09, '#c8905a', { lineColor: '#6a4628' });
      artCircle(c, -s * 0.1, s * 1.24, s * 0.23, '#c8905a', { lineColor: '#6a4628', hi: 0.25 });
      artEye(c, -s * 0.18, s * 1.2, s * 0.045, 0.3, (globalT % 3.1) < 0.12);
      artEye(c, -s * 0.02, s * 1.2, s * 0.045, 0.3, (globalT % 3.1) < 0.12);
      artCircle(c, -s * 0.1, s * 1.31, s * 0.075, '#f0d0a8', { line: false });
      artCircle(c, -s * 0.1, s * 1.29, s * 0.03, '#4a2a18', { line: false });
      artLimb(c, s * 0.12, s * 1.38, s * 0.12 + Math.sin(wv) * s * 0.35, s * 1.38 - Math.cos(wv) * s * 0.35, s * 0.1, '#c8905a', '#6a4628');
      // Kori
      artRoundRect(c, -s * 0.38, s * 1.4, s * 0.76, s * 0.36, s * 0.07, '#d8a060', { lineColor: '#7a5028' });
      c.strokeStyle = 'rgba(122,80,40,0.5)';
      c.lineWidth = Math.max(1, s * 0.03);
      c.beginPath(); c.moveTo(-s * 0.38, s * 1.56); c.lineTo(s * 0.38, s * 1.56); c.stroke();
    }
  });
}
function tksHeart(c, x, y, s, col) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.3, y, x - s * 0.6, y - s * 0.9, x, y - s * 0.3);
  c.bezierCurveTo(x + s * 0.6, y - s * 0.9, x + s * 1.3, y, x, y + s * 0.9);
  c.closePath();
  artFillPath(c, col, y - s * 0.8, y + s * 0.9, s, { lineColor: artShade(col, -0.4) });
}
// Lintuparvi auringonlaskussa: tökkäys = silmukka ja sirkutus; kolmas = sydänmuodostelma
function tksAddBirds(u, v) {
  propAdd({
    u: u, v: v, rs: 0.09, hys: 0, color: '#ffd0e0', note: 988, amp: 0.05, loopT: 0, heartT: 0,
    update: function (p, dt) {
      p.u += 0.07 * dt;
      p.v = v + Math.sin(globalT * 0.9) * 0.012;
      tksPropPos(p);
      if (p.loopT > 0) p.loopT -= dt;
      if (p.heartT > 0) p.heartT -= dt;
    },
    poke: function (p) {
      p.loopT = 1;
      playNote(1760, 0, 0.05, 'sine', 0.12);
      playNote(2093, 0.06, 0.05, 'sine', 0.12);
      playNote(1760, 0.12, 0.05, 'sine', 0.12);
      if (p.n % 3 === 0) {
        p.heartT = 2.6;
        playNote(1319, 0.2, 0.12, 'triangle', 0.15);
        playNote(1568, 0.32, 0.18, 'triangle', 0.15);
      }
    },
    draw: function (c, p) {
      var s = viewH * 0.018, i, bx, by, hk, a, lp, ang;
      var V = [[0, 0], [-1.6, 0.9], [-3.2, 1.8], [-1.6, -0.9], [-3.2, -1.8]];
      // Sydänmuodostelman paikat
      var H = [[0.3, -0.6], [-1.4, -1.9], [-1.4, 1.2], [-3.2, -1.6], [-3.2, 0.6]];
      hk = p.heartT > 0 ? Math.min(1, p.heartT * 2, (2.6 - p.heartT) * 3) : 0;
      lp = p.loopT > 0 ? (1 - p.loopT) * Math.PI * 2 : 0;
      for (i = 0; i < V.length; i++) {
        bx = (V[i][0] + (H[i][0] - V[i][0]) * hk) * s * 1.5;
        by = (V[i][1] + (H[i][1] - V[i][1]) * hk) * s * 1.5;
        if (lp) { ang = lp + i * 0.4; bx += Math.sin(ang) * s * 1.6; by += (1 - Math.cos(ang)) * s * 1.2; }
        a = Math.sin(globalT * 9 + i * 1.3);
        tksDrawBird(c, bx, by, s, a);
      }
    }
  });
}
function tksDrawBird(c, x, y, s, flap) {
  c.strokeStyle = '#5a3a6a';
  c.lineWidth = Math.max(1.5, s * 0.28);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - s, y - flap * s * 0.6);
  c.quadraticCurveTo(x - s * 0.45, y - s * 0.2, x, y + s * 0.15);
  c.quadraticCurveTo(x + s * 0.45, y - s * 0.2, x + s, y - flap * s * 0.6);
  c.stroke();
}
// Unelias pöllö pikkupilvellä: huhuilee; kolmas tökkäys pukee yömyssyn
function tksAddOwl(u, v) {
  propAdd({
    u: u, v: v, rs: 0.08, hys: 0.05, color: '#ffe6a8', note: 392, amp: 0.1, cap: false, awakeT: 0, blink: 0,
    update: function (p, dt) {
      tksPropPos(p);
      if (p.awakeT > 0) p.awakeT -= dt;
      p.blink += dt;
    },
    poke: function (p) {
      p.awakeT = 1.6;
      // Huu-huu
      playNote(392, 0.05, 0.22, 'sine', 0.22);
      playNote(330, 0.32, 0.32, 'sine', 0.22);
      if (p.n % 3 === 0 && !p.cap) {
        p.cap = true;
        spawnSparkles(p.x, p.y - viewH * 0.09, 10, '#9fc0ff');
        playNote(784, 0.6, 0.12, 'triangle', 0.15);
        playNote(1047, 0.72, 0.2, 'triangle', 0.15);
      }
    },
    draw: function (c, p) {
      var s = viewH * 0.038, awake = p.awakeT > 0, k, i;
      // Pikkupilvi
      var col = tksPuffCol(tks.cam + (p.x - camX) / viewW);
      c.fillStyle = col.rim;
      cloudPath(c, 0, s * 0.15, s * 0.95);
      c.fill();
      c.fillStyle = col.body;
      cloudPath(c, 0, s * 0.3, s * 0.9);
      c.fill();
      // Vartalo
      artBlob(c, 0, -s * 0.85, s * 0.8, s * 0.95, '#9a7ab8', { lineColor: '#4a3468', hi: 0.25 });
      artBlob(c, 0, -s * 0.6, s * 0.48, s * 0.6, '#e8d8f0', { line: false });
      // Korvatupsut
      for (i = -1; i <= 1; i += 2) {
        c.beginPath();
        c.moveTo(i * s * 0.25, -s * 1.6); c.lineTo(i * s * 0.62, -s * 2.05); c.lineTo(i * s * 0.62, -s * 1.45);
        c.closePath();
        artFillPath(c, '#9a7ab8', -s * 2.05, -s * 1.45, s * 0.3, { lineColor: '#4a3468' });
      }
      // Silmät: unessa viivat, tökättynä isot pyöreät
      for (i = -1; i <= 1; i += 2) {
        artCircle(c, i * s * 0.32, -s * 1.15, s * 0.3, '#fff4cc', { lineColor: '#6a5088' });
        if (awake) artEye(c, i * s * 0.32, -s * 1.15, s * 0.22, 0, (p.blink % 2.4) < 0.12);
        else {
          c.strokeStyle = '#4a3468';
          c.lineWidth = Math.max(1, s * 0.08);
          c.beginPath(); c.arc(i * s * 0.32, -s * 1.18, s * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        }
      }
      // Nokka
      c.beginPath(); c.moveTo(-s * 0.1, -s * 0.95); c.lineTo(s * 0.1, -s * 0.95); c.lineTo(0, -s * 0.72); c.closePath();
      artFillPath(c, '#ffb84f', -s, -s * 0.72, s * 0.1, { lineColor: '#a8600a' });
      // Yömyssy
      if (p.cap) {
        c.beginPath();
        c.moveTo(-s * 0.75, -s * 1.55);
        c.quadraticCurveTo(-s * 0.2, -s * 2.6, s * 0.9, -s * 2.2 + Math.sin(globalT * 2) * s * 0.1);
        c.quadraticCurveTo(s * 0.3, -s * 1.9, s * 0.75, -s * 1.55);
        c.closePath();
        artFillPath(c, '#5a7ae0', -s * 2.4, -s * 1.55, s * 0.5, { lineColor: '#2a3a8a' });
        artRoundRect(c, -s * 0.82, -s * 1.68, s * 1.64, s * 0.24, s * 0.1, '#ffffff', { lineColor: '#8a9ac8' });
        artCircle(c, s * 0.95, -s * 2.2 + Math.sin(globalT * 2) * s * 0.1, s * 0.18, '#ffe27a', { lineColor: '#c8901e' });
        drawStar(c, -s * 0.1, -s * 1.95, s * 0.12, 0, 0);
      }
      // Unen Z:t
      if (!awake) {
        c.fillStyle = 'rgba(220,230,255,0.85)';
        c.font = 'bold ' + Math.round(s * 0.55) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        for (i = 0; i < 2; i++) {
          k = (globalT * 0.4 + i * 0.5) % 1;
          c.globalAlpha = Math.sin(k * Math.PI);
          c.fillText('Z', s * (0.9 + k * 0.6), -s * (1.8 + k * 1.1));
        }
        c.globalAlpha = 1;
      }
    }
  });
}

// ---------- Syöte ----------
function tksTap(px, py) {
  var i, sb, x, y, d, r = tksR(), sh, tc, m, wx = px + camX;
  initAudio();
  tks.idleT = 0;
  tks.pokeHold = false;
  tks.pupTap = false;
  if (tks.state === 'end') return;
  // Lahjatähti: napautus nappaa sen
  if (tks.gift.state === 'fly' && Math.hypot(px - tks.gift.x, py - tks.gift.y) < viewH * 0.1) {
    tksCatchGift();
    tks.pokeHold = true;
    return;
  }
  // Tähdenlento: toivekimallus
  for (i = 0; i < tks.shoots.length; i++) {
    sh = tks.shoots[i];
    if (sh.t > 0 && sh.t < sh.dur && Math.hypot(px - sh.x, py - sh.y) < viewH * 0.08) {
      tksWish(sh);
      tks.shoots.splice(i, 1);
      tks.pokeHold = true;
      return;
    }
  }
  // Kuu (piilopupu)
  m = tksMoonPos();
  if (m.vis > 0.5 && Math.hypot(px - m.x, py - m.y) < m.r * 1.35) {
    tksPokeMoon(m);
    tks.pokeHold = true;
    return;
  }
  // Ukkospilvi murahtaa
  for (i = 0; i < tks.tclouds.length; i++) {
    tc = tks.tclouds[i];
    if (Math.hypot(px - tc.sx * viewW, py - tc.sy * viewH) < viewH * 0.09) {
      tc.poke = 0.5;
      playNote(147, 0, 0.12, 'square', 0.08);
      playNote(131, 0.12, 0.18, 'square', 0.08);
      spawnSparkles(wx, py, 5, '#c8c0ff');
      tks.pokeHold = true;
      return;
    }
  }
  // Iso pilvi: kikatus, jos sormi ei raahaa (tarkistetaan päästettäessä)
  x = tksSX(); y = tksSY();
  if (Math.abs(px - x) < r * 1.1 && py > y - r * 2 && py < y + r * 0.9) {
    tks.pupTap = true;
    return;
  }
  // Odottava sisarpilvi hyppää ja vinkaisee
  for (i = 0; i < tks.sibs.length; i++) {
    sb = tks.sibs[i];
    if (sb.state === 'trail') continue;
    d = Math.hypot(wx - sb.x * viewW, py - sb.y * viewH);
    if (d < viewH * 0.07) {
      sb.hop = 0.5;
      tksSqueal(0);
      tks.pokeHold = true;
      return;
    }
  }
  if (propsTap(wx, py)) tks.pokeHold = true;
}

// ---------- Päivitys ----------
function tksUpdate(dt) {
  var u;
  updateParticles(dt);
  propsUpdate(dt);
  updateConfetti(dt);
  tks.t += dt;
  if (tks.invT > 0) tks.invT -= dt;
  if (tks.shiverT > 0) tks.shiverT -= dt;
  if (tks.hitT > 0) tks.hitT -= dt;
  if (tks.flashT > 0) tks.flashT -= dt;
  if (tks.boltFlash > 0) tks.boltFlash -= dt;
  if (tks.wowT > 0) tks.wowT -= dt;
  if (tks.giggleT > 0) tks.giggleT -= dt;
  if (tks.wiggleT > 0) tks.wiggleT -= dt;
  if (tks.hudBump > 0) tks.hudBump -= dt;
  if (tks.sibBump > 0) tks.sibBump -= dt;
  if (tks.moonT > 0) tks.moonT -= dt;
  if (!holding) tks.idleT += dt;
  // Pikkupilven napautus ilman raahausta -> kikatus
  if (tks.pupTap && !holding) {
    tks.pupTap = false;
    if (!holdMoved && globalT - holdStartG < 0.4) {
      tks.giggleT = 0.9;
      tks.wiggleT = 0.6;
      trekPupSound('giggle');
      spawnSparkles(tksWX(), tksSY() - tksR() * 0.4, 8, '#ffffff');
    }
  }
  if (holding && holdMoved) tks.pokeHold = false;
  tksUpdateScroll(dt);
  tksUpdateCloud(dt);
  tksUpdatePath();
  tksUpdateSibs(dt);
  tksUpdateStars(dt);
  tksUpdateStorm(dt);
  tksUpdateShoots(dt);
  tksUpdateGift(dt);
  tksUpdateBunny(dt);
  tksUpdateFlyers(dt);
  tksUpdateCastle(dt);
  // Valon sävy vuorokaudenajan mukaan
  u = tks.cam;
  tksLightTint(tksNight(u));
}
function tksUpdateScroll(dt) {
  var sp, left;
  if (tks.state !== 'fly') return;
  // Alussa vieritys kiihtyy hiljalleen (alkukortti); linnalla hidastuu ja pysähtyy
  sp = TKS_SPEED * Math.min(1, tks.t / 3);
  left = TKS_LEN - tks.cam;
  if (left < 0.8) sp *= Math.max(0.12, left / 0.8);
  tks.cam = Math.min(TKS_LEN, tks.cam + sp * dt);
  camX = tks.cam * viewW;
  if (tks.cam >= TKS_LEN - 1e-4) {
    tks.state = 'castle';
    tks.castleT = 0;
    tks.wowT = 1.5;
    trekPupSound('wow');
  }
}
// Iso pilvi seuraa sormea (jousi + enimmäisnopeus); tuuli työntää ylös/alas
function tksUpdateCloud(dt) {
  var x = tksSX(), y = tksSY(), tx, ty, vx = 0, vy = 0, m, vmax = TKS_VMAX * viewH, push, steer, g;
  steer = holding && !tks.pokeHold && tks.state !== 'end';
  if (tks.state === 'end') {
    // Loppu: pilvi liukuu portin eteen
    g = tksGatePos();
    tx = g.x - camX - viewH * 0.24; ty = g.y + viewH * 0.03;
    vx = (tx - x) * 3; vy = (ty - y) * 3;
  } else if (steer) {
    tx = tksClamp(lastPX, TKS_XMIN * viewW, tksXMax() * viewW);
    ty = tksClamp(lastPY, TKS_YMIN * viewH, TKS_YMAX * viewH);
    vx = (tx - x) * TKS_FOLLOW;
    vy = (ty - y) * TKS_FOLLOW;
    m = Math.hypot(vx, vy);
    if (m > vmax) { vx *= vmax / m; vy *= vmax / m; }
    if (m > viewH * 0.15) { tks.everDrag = true; tks.idleT = 0; }
  }
  push = tks.state === 'end' ? 0 : tksWindAt(tksWX());
  vy += push * TKS_WIND * viewH;
  // Tuulen humahdus vyöhykkeeseen tultaessa
  if (push !== 0 && !tks.inWind) {
    tks.inWind = true;
    playNote(push < 0 ? 330 : 440, 0, 0.35, 'sine', 0.08);
    playNote(push < 0 ? 440 : 330, 0.15, 0.4, 'sine', 0.08);
  } else if (push === 0) tks.inWind = false;
  x += vx * dt;
  y += vy * dt;
  if (tks.state !== 'end') {
    x = tksClamp(x, TKS_XMIN * viewW, tksXMax() * viewW);
    y = tksClamp(y, TKS_YMIN * viewH, TKS_YMAX * viewH);
  }
  tks.vx = vx;
  tks.vy = vy;
  tks.cx = x / viewW;
  tks.cy = y / viewH;
}
// Tuulen suunta maailman kohdassa wx (-1 ylös, 1 alas, 0 tyyntä); reunat pehmeät
function tksWindAt(wx) {
  var i, w, u = wx / viewW, k;
  if (tks.state !== 'fly') return 0;
  for (i = 0; i < TKS_WINDS.length; i++) {
    w = TKS_WINDS[i];
    if (u > w[0] && u < w[1]) {
      k = Math.min(1, (u - w[0]) / 0.08, (w[1] - u) / 0.08);
      return w[2] * k;
    }
  }
  return 0;
}
// Pilven kulkema reitti maailmassa: sisaret seuraavat sitä jonossa
function tksUpdatePath() {
  var p = tks.path, wx = tksWX() / viewW, wy = tks.cy, last = p[p.length - 1];
  if (!last || Math.hypot((wx - last.x) * viewW, (wy - last.y) * viewH) > viewH * 0.008) {
    p.push({ x: wx, y: wy });
    if (p.length > 300) p.shift();
  }
}
// Reitin piste matkan d (px) päässä pilven takana
function tksTrailPoint(d) {
  var p = tks.path, i, ax = tksWX(), ay = tksSY(), bx, by, seg;
  for (i = p.length - 1; i >= 0; i--) {
    bx = p[i].x * viewW; by = p[i].y * viewH;
    seg = Math.hypot(bx - ax, by - ay);
    if (seg >= d && seg > 0) return { x: ax + (bx - ax) * d / seg, y: ay + (by - ay) * d / seg };
    d -= seg;
    ax = bx; ay = by;
  }
  // Reitti loppui: jatketaan suoraan taaksepäin
  return { x: ax - d, y: ay };
}
// Kosketus: pilven vartalo (soikio) tai yksisarvinen sen selässä
function tksTouches(wx, wy, rad) {
  var r = tksR(), x = tksWX(), y = tksSY(), dx = (wx - x) / (r * 1.05 + rad), dy = (wy - y) / (r * 0.85 + rad), us = trekUS() * TKS_UNI;
  if (dx * dx + dy * dy <= 1) return true;
  return Math.abs(wx - x) < us * 45 + rad && wy > y - r * 0.6 - us * 110 - rad && wy < y;
}

// Sisarpilvet: odottaa -> jonossa; osumasta lepattaa karkuun; linnalla puuttuvat leijuvat luo
function tksUpdateSibs(dt) {
  var i, sb, wx, wy, tgt, k, r = tksR(), sx, home = tks.state !== 'fly';
  for (i = 0; i < tks.sibs.length; i++) {
    sb = tks.sibs[i];
    sb.ph += dt;
    if (sb.hop > 0) sb.hop -= dt;
    sb.t += dt;
    if (sb.state === 'wait') {
      sb.x = sb.hu + Math.sin(sb.ph * 0.8) * 0.012;
      sb.y = sb.hv + Math.sin(sb.ph * 1.6) * 0.012;
      sx = sb.x * viewW - camX;
      // Ohi lennetty sisar palaa linnan luona
      if (sx < -viewW * 0.08 && !home) { sb.state = 'lost'; continue; }
      if (home) { sb.state = 'home'; sb.t = 0; }
    } else if (sb.state === 'lost') {
      if (home && tks.homeT > 1.2) {
        tks.homeT = 0;
        sb.state = 'home';
        sb.t = 0;
        sb.x = (camX - viewW * 0.05) / viewW;
        sb.y = tksRnd(0.25, 0.45);
      }
      continue;
    } else if (sb.state === 'flee') {
      k = Math.min(1, sb.t / 0.9);
      sb.x = sb.fx0 + (sb.fx1 - sb.fx0) * easeOutCubic(k);
      sb.y = sb.fy0 + (sb.fy1 - sb.fy0) * easeOutCubic(k) - Math.sin(k * Math.PI) * 0.08;
      if (k >= 1) { sb.state = 'wait'; sb.hu = sb.fx1; sb.hv = sb.fy1; sb.ph = 0; }
      continue;
    } else if (sb.state === 'home') {
      // Tyyni ilma linnalla: leijuu hitaasti ison pilven luo
      wx = sb.x * viewW; wy = sb.y * viewH;
      tgt = { x: tksWX(), y: tksSY() };
      k = Math.hypot(tgt.x - wx, tgt.y - wy);
      if (k > 1) {
        wx += (tgt.x - wx) / k * viewH * 0.16 * dt;
        wy += (tgt.y - wy) / k * viewH * 0.16 * dt + Math.sin(sb.ph * 2) * viewH * 0.02 * dt;
      }
      sb.x = wx / viewW; sb.y = wy / viewH;
    } else if (sb.state === 'trail') {
      k = tks.trail.indexOf(sb);
      tgt = tksTrailPoint(r * 1.2 + k * viewH * TKS_SIB_GAP);
      wx = sb.x * viewW; wy = sb.y * viewH;
      var bob = Math.sin(sb.ph * 3 + k) * viewH * 0.008;
      if (tks.state === 'end') bob -= Math.abs(Math.sin(tks.endT * 7 + k * 0.9)) * viewH * 0.03;
      wx += (tgt.x - wx) * Math.min(1, dt * 9);
      wy += (tgt.y + viewH * 0.03 + bob - wy) * Math.min(1, dt * 9);
      sb.x = wx / viewW; sb.y = wy / viewH;
      continue;
    }
    // Kosketus isoon pilveen -> jonoon
    if ((sb.state === 'wait' || sb.state === 'home') && tks.state !== 'end' && tksTouches(sb.x * viewW, sb.y * viewH, viewH * TKS_SIB_R)) tksJoin(sb);
  }
  if (home) tks.homeT += dt;
}
function tksJoin(sb) {
  sb.state = 'trail';
  sb.t = 0;
  tks.trail.push(sb);
  tks.giggleT = 1.1;
  tks.sibBump = 0.45;
  tksSqueal(tks.trail.length);
  setTimeout(function () { trekPupSound('giggle'); }, 260);
  spawnSparkles(sb.x * viewW, sb.y * viewH, 12, sb.tint);
  artPop(sb.x * viewW, sb.y * viewH, viewH * 0.06, '#ffffff', 'ring');
}
// Sisarpilven "jee!": korkea vinkaisu (sitä korkeampi, mitä useampi jonossa)
function tksSqueal(n) {
  var b = 1319 * Math.pow(1.06, n);
  playNote(b, 0, 0.07, 'sine', 0.17);
  playNote(b * 1.26, 0.07, 0.07, 'sine', 0.17);
  playNote(b * 1.5, 0.14, 0.14, 'sine', 0.15);
}
// Osuma: viimeinen sisar säikähtää ja lepattaa ylös eteenpäin odottamaan
function tksScareLast() {
  var sb = tks.trail.pop(), sx;
  if (!sb) return;
  sb.state = 'flee';
  sb.t = 0;
  sb.fx0 = sb.x; sb.fy0 = sb.y;
  sx = tks.state === 'fly' ? Math.min(0.9, tks.cx + 0.42) : tksClamp(tks.cx - 0.25, 0.2, 0.55);
  sb.fx1 = tks.cam + sx;
  sb.fy1 = tksClamp(tks.cy - 0.22, 0.3, 0.62);
  playNote(1568, 0.1, 0.08, 'sine', 0.14);
  playNote(1175, 0.2, 0.12, 'sine', 0.14);
}

// Tähdet: kosketus kerää, tähti lentää HUD:iin
function tksUpdateStars(dt) {
  var i, st, wx, wy;
  for (i = 0; i < tks.stars.length; i++) {
    st = tks.stars[i];
    if (st.got) continue;
    st.ph += dt;
    wx = st.u * viewW;
    if (wx - camX < -viewW * 0.1 || wx - camX > viewW * 1.1) continue;
    wy = (st.v + Math.sin(st.ph * 2) * 0.008) * viewH;
    if (tks.state !== 'end' && tksTouches(wx, wy, viewH * 0.025)) {
      st.got = true;
      tks.starN++;
      tks.wowT = 0.5;
      soundStar(tks.starN % 12);
      artPop(wx, wy, viewH * 0.05, '#ffe27a', 'burst');
      spawnSparkles(wx, wy, 8, '#ffe27a');
      tks.flyers.push({ x0: wx - camX, y0: wy, t: 0, dur: 0.6 });
    }
  }
}
function tksUpdateFlyers(dt) {
  var i;
  for (i = tks.flyers.length - 1; i >= 0; i--) {
    tks.flyers[i].t += dt;
    if (tks.flyers[i].t >= tks.flyers[i].dur) { tks.flyers.splice(i, 1); tks.hudBump = 0.4; }
  }
}

// ---------- Ukkospilvet ----------
// Pilvet kulkevat seurueen mukana (ruutukoordinaatit sx, sy), joten
// iskukohta pysyy paikallaan varoituksen ajan.
function tksStormIdx() {
  var i, z;
  if (tks.state !== 'fly') return -1;
  for (i = 0; i < TKS_STORMS.length; i++) {
    z = TKS_STORMS[i];
    if (tks.cam >= z.u0 && tks.cam < z.u1) return i;
  }
  return -1;
}
function tksTel() { return tks.cam >= TKS_NIGHT ? TKS_TEL[1] : TKS_TEL[0]; }
function tksUpdateStorm(dt) {
  var zi = tksStormIdx(), z, i, tc, n;
  if (zi !== tks.storm) {
    // Vyöhyke vaihtui: vanhat pilvet lähtevät, uudet saapuvat
    for (i = 0; i < tks.tclouds.length; i++) tks.tclouds[i].leaving = true;
    tks.storm = zi;
    if (zi >= 0) {
      z = TKS_STORMS[zi];
      n = z.mode === 'single' ? 1 : 2;
      for (i = 0; i < n; i++) {
        tks.tclouds.push({
          zone: zi, mode: z.mode, slot: i, sx: 1.12 + i * 0.12, sy: 0.135 + i * 0.012, tx: 0.4, state: 'in', t: 0,
          rest: 1.4 + i * (z.mode === 'alt' ? 1.0 : 0), volley: 1, side: 1, colA: 0.3, colB: 0.5, gapW: 0.05, bw: TKS_BOLT_W, gap: 0.5, col: 0, pts: null, poke: 0, ph: Math.random() * 6, leaving: false, hit: false, gap: 0
        });
      }
      playNote(98, 0, 0.5, 'triangle', 0.12);
      playNote(87, 0.25, 0.6, 'triangle', 0.1);
    }
  }
  for (i = tks.tclouds.length - 1; i >= 0; i--) {
    tc = tks.tclouds[i];
    tksUpdateTCloud(tc, dt);
    if (tc.state === 'gone') tks.tclouds.splice(i, 1);
  }
  if (tks.rumbleT > 0) tks.rumbleT -= dt;
}
function tksUpdateTCloud(tc, dt) {
  var z = TKS_STORMS[tc.zone], cx = tks.cx, tx, d, sp, other, i;
  tc.t += dt;
  if (tc.poke > 0) tc.poke -= dt;
  if (tc.state === 'in') {
    tc.sx += (0.55 + tc.slot * 0.1 - tc.sx) * Math.min(1, dt * 2.2);
    if (tc.t > 1.2) { tc.state = 'idle'; tc.t = 0; }
    return;
  }
  if (tc.state === 'out') {
    tc.sx += dt * 0.35;
    tc.sy -= dt * 0.05;
    if (tc.sx > 1.3) tc.state = 'gone';
    return;
  }
  if (tc.state === 'idle') {
    if (tc.leaving) { tc.state = 'out'; tc.t = 0; return; }
    // Tähtäys: tavallisesti ison pilven kohdalle hieman liikkeen eteen
    if (tc.mode === 'double') {
      if (tc.slot === 0 && tc.t < dt * 1.5) tksPickGap(tc);
      other = tksPartner(tc);
      tx = tc.slot === 0 ? tc.colA : (other ? other.colB : 0.4);
      sp = 0.55;
    } else {
      tx = cx + tksClamp(tks.vx * TKS_LEAD, -viewH * 0.15, viewH * 0.15) / viewW;
      // Vuorottelevat pilvet pysyvät erillään
      other = tksPartner(tc);
      if (other && other.state !== 'idle' && Math.abs(tx - other.sx) < 0.13) tx = other.sx + (tx >= other.sx ? 0.13 : -0.13);
      sp = TKS_TRACK;
    }
    tx = tksClamp(tx, 0.06, 0.72);
    d = tx - tc.sx;
    tc.sx += tksClamp(d, -sp * dt, sp * dt);
    tc.sy = 0.135 + tc.slot * 0.012 + Math.sin(globalT * 1.3 + tc.ph) * 0.006;
    if (tc.t >= tc.rest) {
      if (tc.mode === 'double') {
        // Tuplaisku: molemmat paikoillaan ennen varoitusta
        other = tksPartner(tc);
        if (Math.abs(d) > 0.004 || !other || other.state !== 'idle' || other.t < other.rest - 0.001) return;
        tksWarn(other);
      }
      tksWarn(tc);
    }
    return;
  }
  if (tc.state === 'warn') {
    // Hypännyt pilvi liukuu nopeasti iskukohdan ylle
    tc.sx += tksClamp(tc.col - tc.sx, -2.5 * dt, 2.5 * dt);
    if (tc.t >= tksTel()) {
      tc.state = 'bolt';
      tc.t = 0;
      tc.hit = false;
      tc.pts = [];
      for (i = 0; i <= 8; i++) tc.pts.push(i === 0 || i === 8 ? 0 : tksRnd(-1, 1));
      tks.boltFlash = 0.15;
      playNote(90, 0, 0.45, 'sawtooth', 0.14);
      playNote(1250, 0, 0.05, 'square', 0.07);
      playNote(620, 0.05, 0.08, 'square', 0.06);
    }
    return;
  }
  if (tc.state === 'bolt') {
    if (!tc.hit && Math.abs(tks.cx * viewW - tc.col * viewW) < tksR() * TKS_HIT_K + tksBW(tc) * viewH) {
      tc.hit = true;
      tksHit(tc);
    }
    if (tc.t >= TKS_BOLT) {
      tc.state = 'idle';
      tc.t = 0;
      tc.rest = tksRnd(z.rest[0], z.rest[1]);
      // Tuplaisku tulee pareittain: heti ensimmäisen jälkeen pilvet hyppäävät
      // uusille paikoille ja rako on ruudun toisella laidalla
      if (tc.mode === 'double' && tc.slot === 0) {
        other = tksPartner(tc);
        if (tc.volley === 1) {
          tc.volley = 2;
          tksPickGap(tc);
          tksWarn(tc, tc.colA);
          if (other) { other.volley = 2; tksWarn(other, tc.colB); }
        } else {
          tc.volley = 1;
          if (other) { other.volley = 1; other.state = 'idle'; other.t = 0; other.rest = tc.rest; }
        }
        return;
      }
      // Vuorottelu: kumppani varoittaa puolivälissä tätä taukoa
      other = tksPartner(tc);
      if (tc.mode === 'alt' && other && other.state === 'idle') other.rest = Math.max(other.t + 0.15, Math.min(other.rest, other.t + tc.rest * 0.5 + 0.1));
    }
  }
}
function tksPartner(tc) {
  var i, o;
  for (i = 0; i < tks.tclouds.length; i++) {
    o = tks.tclouds[i];
    if (o !== tc && o.zone === tc.zone && o.state !== 'gone' && o.state !== 'out') return o;
  }
  return null;
}
// Tuplaiskun turvarako: arvotaan ulottuville, mieluiten muualle kuin pilven kohdalle
function tksPickGap(tc) {
  // Kahden pilven salamat muodostavat muurin, joka peittää ruudun toisen
  // laidan, ja kimalteleva rako (TKS_SAFE) on toisella laidalla. Pari iskee
  // kahdesti: toisella kerralla muuri ja rako vaihtavat puolta (välähdys,
  // sitten vauhtia). Leveällä ruudulla salamat ovat paksumpia, jotta muuri
  // peittää aina koko matkan raosta toiseen laitaan.
  var ch = (TKS_R * TKS_HIT_K + TKS_BOLT_W) * viewH / viewW, mid = (TKS_XMIN + tksXMax()) / 2, gw = tksRnd(TKS_SAFE[0], TKS_SAFE[1]) * viewH / viewW, L, cw, s0;
  tc.side = tc.volley === 2 ? -tc.side : (tks.cx < mid ? 1 : -1);
  L = tksXMax() - TKS_XMIN - gw * 2 + 0.02;
  cw = Math.max(ch, L / 4 + 0.006);
  tc.bw = cw * viewW / viewH - TKS_R * TKS_HIT_K;
  tc.gapW = gw;
  if (tc.side > 0) {
    s0 = TKS_XMIN - 0.02;
    tc.colA = s0 + L * 0.25;
    tc.colB = s0 + L * 0.75;
    tc.gap = tksXMax() - gw;
  } else {
    s0 = tksXMax() + 0.02;
    tc.colA = s0 - L * 0.25;
    tc.colB = s0 - L * 0.75;
    tc.gap = TKS_XMIN + gw;
  }
}
// Salaman vaaravyön puolileveys × viewH (muurissa leveämpi)
function tksBW(tc) { return tc.mode === 'double' ? tksDbl(tc).bw : TKS_BOLT_W; }
function tksDbl(tc) { return tc.slot === 0 ? tc : (tksPartner(tc) || tc); }
// Varoitus alkaa: iskukohta lukitaan (col; oletuksena pilven kohta)
function tksWarn(tc, col) {
  tc.state = 'warn';
  tc.t = 0;
  tc.col = col === undefined ? tc.sx : tksClamp(col, 0.04, 0.8);
  if (tks.rumbleT <= 0) {
    tks.rumbleT = 0.3;
    playNote(73, 0, 0.5, 'triangle', 0.15);
    playNote(82, 0.18, 0.45, 'triangle', 0.12);
  }
}
// Salama osui: välähdys, tärinä, prinsessa hytisee ja viimeinen sisar säikähtää
function tksHit(tc) {
  if (tks.invT > 0) return;
  tks.invT = TKS_INV;
  tks.hitN++;
  tks.flashT = 0.35;
  tks.shiverT = 1.4;
  tks.hitT = 1.0;
  artShakeStart(viewH * 0.01, 0.35);
  spawnSparkles(tksWX(), tksSY() - tksR() * 0.3, 12, '#fff3a0');
  playNote(1760, 0, 0.04, 'square', 0.07);
  playNote(220, 0.03, 0.2, 'sawtooth', 0.1);
  trekPupSound('scared');
  tksScareLast();
}

// ---------- Tähdenlennot ----------
function tksUpdateShoots(dt) {
  var i, sh, n = tksNight(tks.cam);
  if (tks.state !== 'end') tks.shootT -= dt;
  if (tks.shootT <= 0) {
    tks.shootT = tksRnd(5, 9);
    if (n > 0.2) tksSpawnShoot(0);
  }
  for (i = tks.shoots.length - 1; i >= 0; i--) {
    sh = tks.shoots[i];
    sh.t += dt;
    if (sh.t > 0) {
      sh.x = sh.x0 + sh.dx * sh.t;
      sh.y = sh.y0 + sh.dy * sh.t;
    }
    if (sh.t > sh.dur + 0.3) tks.shoots.splice(i, 1);
  }
}
function tksSpawnShoot(delay) {
  var x0 = tksRnd(0.35, 0.95) * viewW, y0 = tksRnd(0.06, 0.3) * viewH;
  tks.shoots.push({ x0: x0, y0: y0, x: x0, y: y0, dx: -viewW * 0.32, dy: viewH * 0.14, t: -delay, dur: 1.3 });
}
// Toivekimallus: sateenkaarikipinät ja kellot; joka kolmas toive = tähtisade
function tksWish(sh) {
  var i;
  tks.wishN++;
  for (i = 0; i < 6; i++) spawnSparkles(sh.x + camX, sh.y, 3, maneColors[i]);
  artPop(sh.x + camX, sh.y, viewH * 0.06, '#ffe27a', 'burst');
  for (i = 0; i < 4; i++) playNote(1047 * Math.pow(1.26, i % 3) * (i === 3 ? 2 : 1), i * 0.07, 0.18, 'sine', 0.16);
  tks.wowT = 0.8;
  if (tks.wishN % 3 === 0) {
    for (i = 0; i < 6; i++) tksSpawnShoot(0.25 + i * 0.22);
  }
}

// ---------- Kuu ja piilopupu ----------
function tksMoonPos() {
  var u = tks.cam, k = tksClamp((u - 8.8) / 3.6, 0, 1), r = viewH * 0.062;
  return { x: viewW * (0.93 - Math.max(0, u - 8.8) * 0.052), y: viewH * (0.62 - 0.42 * easeInOutSine(k)), r: r, vis: k };
}
function tksPokeMoon(m) {
  tks.moonN++;
  tks.moonT = 0.6;
  spawnSparkles(m.x + camX, m.y, 8, '#fff4cc');
  artPop(m.x + camX, m.y, m.r * 1.2, '#fff4cc', 'ring');
  playNote(880 + tks.moonN * 110, 0, 0.14, 'sine', 0.2);
  playNote(1320 + tks.moonN * 110, 0.1, 0.18, 'sine', 0.16);
  if (tks.moonN === 3 && !tks.bunny) {
    tks.bunny = { state: 'hop', t: 0, x0: m.x + m.r * 0.2, y0: m.y - m.r * 0.9 };
    playNote(1568, 0.25, 0.12, 'triangle', 0.18);
  }
}
function tksUpdateBunny(dt) {
  var b = tks.bunny, p;
  if (!b) return;
  b.t += dt;
  if (b.state === 'hop' && b.t >= 1.4) {
    b.state = 'ride';
    p = tksBunnySeat();
    trekBunnyFound(p.x, p.y);
    tks.wowT = 1;
    trekPupSound('wow');
  }
}
// Kuupupun istumapaikka ison pilven selässä (yksisarvisen takana)
function tksBunnySeat() {
  var r = tksR();
  return { x: tksSX() - r * 0.72, y: tksSY() - r * 0.52 };
}

// ---------- Lahjatähti ja Pilvilinna ----------
function tksGatePos() {
  var cxw = (TKS_LEN + 0.74) * viewW, base = viewH * 0.83, size = viewH * 0.46;
  return { x: cxw, y: base - size * 0.17, base: base, size: size };
}
function tksUpdateGift(dt) {
  var g = tks.gift, k, sp;
  if (g.state === 'caught') {
    // Saalis leijuu ison pilven yllä
    g.t += dt;
    if (tks.state !== 'end') {
      g.x += (tksSX() + tksR() * 0.95 - g.x) * Math.min(1, dt * 5);
      g.y += (tksSY() - tksR() * 1.85 + Math.sin(globalT * 2.4) * viewH * 0.01 - g.y) * Math.min(1, dt * 5);
    }
    return;
  }
  if (tks.cam < TKS_LEN - 0.5) return;
  if (g.state === 'wait') {
    g.t -= dt;
    if (g.t <= 0) {
      g.state = 'fly';
      g.t = 0;
      g.n++;
      playNote(1568, 0, 0.3, 'sine', 0.14);
      playNote(2093, 0.15, 0.4, 'sine', 0.12);
      if (g.n === 1) { tks.wowT = 1.2; trekPupSound('wow'); }
    }
    return;
  }
  // Iso tähdenlento: kaari oikealta ylhäältä vasemmalle alas pelialueen läpi
  g.t += dt;
  sp = 3.4;
  k = g.t / sp;
  g.x = viewW * (1.08 - 1.0 * k);
  g.y = viewH * (0.1 + 0.55 * k + Math.sin(k * Math.PI) * 0.06);
  if (tksTouches(g.x + camX, g.y, viewH * 0.04)) { tksCatchGift(); return; }
  if (k >= 1) { g.state = 'wait'; g.t = 2.2; }
}
function tksCatchGift() {
  var g = tks.gift, i;
  if (g.state === 'caught') return;
  g.state = 'caught';
  g.t = 0;
  tks.wowT = 1.4;
  trekPupSound('wow');
  artPop(g.x + camX, g.y, viewH * 0.1, '#ffe27a', 'burst');
  artPop(g.x + camX, g.y, viewH * 0.08, '#ffffff', 'ring');
  for (i = 0; i < 6; i++) spawnSparkles(g.x + camX, g.y, 3, maneColors[i]);
  for (i = 0; i < 5; i++) playNote(784 * Math.pow(1.19, i), i * 0.08, 0.25, 'triangle', 0.2);
}
function tksUpdateCastle(dt) {
  var g, x, y, open = tks.trail.length >= 5;
  if (tks.state === 'fly') return;
  tks.castleT += dt;
  if (tks.state === 'castle') {
    if (open && tks.gateT === 0) {
      playNote(523, 0, 0.3, 'triangle', 0.22);
      playNote(659, 0.12, 0.3, 'triangle', 0.22);
      playNote(784, 0.24, 0.45, 'triangle', 0.22);
      g = tksGatePos();
      artPop(g.x, g.y, viewH * 0.12, '#ffe27a', 'burst');
    }
    if (open) tks.gateT = Math.min(1, tks.gateT + dt / 1.2);
    g = tksGatePos();
    x = tksWX(); y = tksSY();
    if (tks.gateT >= 1 && tks.gift.state === 'caught' && Math.abs(x - g.x) < viewH * 0.16 && Math.abs(y - g.y) < viewH * 0.2) {
      tks.state = 'end';
      tks.endT = 0;
      soundBunny();
    }
    return;
  }
  // Loppu: sisaret hurraavat, portista tulvii valoa, lahjatähti nousee portin ylle
  var prev = tks.endT, i;
  tks.endT += dt;
  g = tksGatePos();
  for (i = 0; i < 5; i++) {
    if (prev < 0.3 + i * 0.22 && tks.endT >= 0.3 + i * 0.22) {
      tksSqueal(i + 2);
      if (tks.trail[i]) spawnSparkles(tks.trail[i].x * viewW, tks.trail[i].y * viewH - viewH * 0.03, 6, tks.trail[i].tint);
    }
  }
  if (prev < 1.6 && tks.endT >= 1.6) {
    artPop(g.x, g.y - g.size * 0.6, viewH * 0.16, '#ffe27a', 'burst');
    spawnSparkles(g.x, g.y - g.size * 0.6, 20, '#ffe27a');
    playNote(1047, 0, 0.3, 'triangle', 0.25);
    playNote(1319, 0.1, 0.3, 'triangle', 0.25);
    playNote(1568, 0.2, 0.5, 'triangle', 0.25);
    trekPupSound('yay');
  }
  // Lahjatähti liukuu portin ylle
  var gift = tks.gift, k = Math.min(1, Math.max(0, (tks.endT - 0.8) / 0.9));
  if (k > 0) {
    gift.x += (g.x - camX - gift.x) * Math.min(1, dt * 4 * k);
    gift.y += (g.base - g.size * 0.95 - gift.y) * Math.min(1, dt * 4 * k);
  }
  if (tks.endT >= 3.6 && !tks.done) {
    tks.done = true;
    trekChapterDone();
  }
}

// Valon sävy: ilta lämmin, hämärä violetti, yö syvänsininen
function tksLightTint(n) {
  var L = tksLight;
  var a = n < 0.5 ? [[255, 180, 130, 0.05], [255, 120, 150, 0.1]] : [[120, 80, 200, 0.05], [160, 90, 180, 0.09]];
  var b = n < 0.5 ? [[120, 80, 200, 0.05], [160, 90, 180, 0.09]] : [[10, 20, 70, 0.08], [20, 30, 90, 0.16]];
  var k = n < 0.5 ? n * 2 : (n - 0.5) * 2, i, j, o = [], col;
  for (i = 0; i < 2; i++) {
    col = [];
    for (j = 0; j < 4; j++) col.push(a[i][j] + (b[i][j] - a[i][j]) * k);
    o.push('rgba(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ',' + col[3].toFixed(3) + ')');
  }
  L.tint[0] = o[0];
  L.tint[1] = o[1];
}
var tksLight = { vignette: 0.22, tint: ['rgba(255,180,130,0.05)', 'rgba(255,120,150,0.1)'] };

// ---------- Piirto: taivas ----------
// Kaukotaivas esirenderöidään yhdeksi pitkäksi nauhaksi: jokaisessa sarakkeessa
// on se taivaan liukuväri, joka kuuluu kohtaan, jossa sarake on ruudun keskellä.
// Näin ilta, hämärä ja yö sulautuvat vaakasuunnassa toisiinsa.
var tksSkyCv = document.createElement('canvas');
var tksSkySc = 1;
var tksRenderKey = '';
function tksRenderSky() {
  var key = viewW + 'x' + viewH, W, H = viewH, sc, b, X, step, u, pal, g, i, x, y, a, n, rr, col;
  if (tksRenderKey === key) return;
  tksRenderKey = key;
  W = viewW * (1.2 + TKS_LEN * TKS_SKYP);
  sc = Math.min(0.5, 4000 / W);
  tksSkySc = sc;
  tksSkyCv.width = Math.round(W * sc);
  tksSkyCv.height = Math.round(H * sc);
  b = tksSkyCv.getContext('2d');
  // Sarakkeet kokonaisina laitepikseleinä (ei saumoja)
  b.setTransform(1, 0, 0, 1, 0, 0);
  step = 3;
  for (X = 0; X < tksSkyCv.width; X += step) {
    u = ((X + step / 2) / sc - viewW * 0.5) / (TKS_SKYP * viewW);
    pal = tksPal(u);
    g = b.createLinearGradient(0, 0, 0, tksSkyCv.height);
    g.addColorStop(0, pal[0]);
    g.addColorStop(0.5, pal[1]);
    g.addColorStop(0.86, pal[2]);
    g.addColorStop(1, pal[2]);
    b.fillStyle = g;
    b.fillRect(X, 0, step, tksSkyCv.height);
  }
  b.setTransform(sc, 0, 0, sc, 0, 0);
  // Kaukaiset pilvikerrostumat: illalla aurinko värjää reunat
  for (i = 0; i < W / (viewW * 0.12); i++) {
    x = tksHash(i * 3.1) * W;
    u = (x - viewW * 0.5) / (TKS_SKYP * viewW);
    n = tksNight(u);
    pal = tksPal(u);
    y = H * (0.42 + tksHash(i * 7.3) * 0.32);
    col = artMix(artMix(pal[1], pal[2], 0.6), n < 0.6 ? '#ffe8d8' : '#9aa8e8', 0.35 - n * 0.15);
    b.globalAlpha = 0.45;
    b.fillStyle = col;
    b.beginPath();
    b.ellipse(x, y, viewW * (0.12 + tksHash(i * 1.9) * 0.18), H * (0.012 + tksHash(i * 5.7) * 0.016), 0, 0, Math.PI * 2);
    b.fill();
  }
  b.globalAlpha = 1;
  // Tähdet syttyvät hämärästä alkaen; yöllä myös linnunrata
  for (i = 0; i < W / viewW * 70; i++) {
    x = tksHash(i * 2.3 + 0.7) * W;
    y = Math.pow(tksHash(i * 4.1 + 1.3), 1.4) * H * 0.62;
    u = (x - viewW * 0.5) / (TKS_SKYP * viewW);
    a = tksClamp((tksNight(u) - 0.15) * 1.4, 0, 1) * (0.35 + tksHash(i * 9.7) * 0.65);
    if (a < 0.04) continue;
    rr = H * (0.0012 + tksHash(i * 6.1) * 0.0022);
    b.fillStyle = 'rgba(255,' + (240 + Math.round(tksHash(i) * 15)) + ',' + (210 + Math.round(tksHash(i * 3) * 45)) + ',' + a.toFixed(2) + ')';
    b.beginPath(); b.arc(x, y, rr, 0, Math.PI * 2); b.fill();
  }
  for (i = 0; i < W / viewW * 90; i++) {
    x = tksHash(i * 1.37 + 5) * W;
    u = (x - viewW * 0.5) / (TKS_SKYP * viewW);
    a = tksClamp((tksNight(u) - 0.55) * 2.2, 0, 1) * 0.5;
    if (a < 0.04) continue;
    // Linnunrata: vino nauha
    y = H * (0.08 + ((x / viewW) % 1.6) / 1.6 * 0.35) + (tksHash(i * 2.9) - 0.5) * H * 0.09;
    b.fillStyle = 'rgba(220,215,255,' + (a * tksHash(i * 8.3)).toFixed(2) + ')';
    b.beginPath(); b.arc(x, y, H * 0.0012, 0, Math.PI * 2); b.fill();
  }
}
function tksDrawSky(c) {
  var src = tks.cam * TKS_SKYP * viewW * tksSkySc, sun, k, i, x, y, a, n = tksNight(tks.cam), m;
  tksRenderSky();
  c.drawImage(tksSkyCv, src, 0, viewW * tksSkySc, viewH * tksSkySc, 0, 0, viewW, viewH);
  // Laskeva aurinko
  sun = { x: viewW * 0.76 - tks.cam * viewW * TKS_SKYP, y: viewH * (0.6 + tks.cam * 0.05), r: viewH * 0.075 };
  if (sun.y < viewH * 1.05 && sun.x > -sun.r * 3) {
    artGlow(c, sun.x, sun.y, sun.r * 5, '#ffd0a0', 0.55);
    artGlow(c, sun.x, sun.y, sun.r * 2.2, '#fff0c0', 0.6);
    var sg = c.createRadialGradient(sun.x - sun.r * 0.3, sun.y - sun.r * 0.3, sun.r * 0.1, sun.x, sun.y, sun.r);
    sg.addColorStop(0, '#fffbe8');
    sg.addColorStop(1, '#ffa860');
    c.fillStyle = sg;
    c.beginPath(); c.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); c.fill();
  }
  // Tuikkivat tähdet (piirretään joka ruudulla)
  if (n > 0.15) {
    for (i = 0; i < 16; i++) {
      k = 0.5 + 0.5 * Math.sin(globalT * (1.1 + i * 0.13) + i * 2.3);
      x = ((tksHash(i * 5.3) * 1.4 - tks.cam * 0.03 * (1 + i % 3)) % 1.4 + 1.4) % 1.4 * viewW - viewW * 0.2;
      y = viewH * (0.04 + tksHash(i * 3.7) * 0.4);
      a = (n - 0.15) * k;
      if (a > 0.05) tksSparkle(c, x, y, viewH * (0.006 + (i % 3) * 0.003) * (0.7 + k * 0.5), a, '#fff8d8');
    }
  }
  // Kuu
  m = tksMoonPos();
  if (m.vis > 0) tksDrawMoon(c, m);
}
// Nelisakarainen tuike
function tksSparkle(c, x, y, s, a, col) {
  c.globalAlpha = Math.min(1, a);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y - s * 2);
  c.quadraticCurveTo(x, y, x + s * 2, y);
  c.quadraticCurveTo(x, y, x, y + s * 2);
  c.quadraticCurveTo(x, y, x - s * 2, y);
  c.quadraticCurveTo(x, y, x, y - s * 2);
  c.fill();
  c.globalAlpha = 1;
}
function tksDrawMoon(c, m) {
  var r = m.r * (1 + (tks.moonT > 0 ? Math.sin(tks.moonT / 0.6 * Math.PI) * 0.08 : 0)), x = m.x, y = m.y, i, awake = tks.moonN > 0, b = tks.bunny, ear;
  c.globalAlpha = m.vis;
  artGlow(c, x, y, r * 3.4, '#e8e8ff', 0.35);
  artGlow(c, x, y, r * 1.8, '#fff8e0', 0.4);
  // Pupun korvat kurkkaavat kuun takaa (2. tökkäyksen jälkeen)
  if (tks.moonN >= 2 && (!b || b.t < 0.2)) {
    ear = Math.sin(globalT * 3) * 0.12;
    c.save();
    c.translate(x + r * 0.35, y - r * 0.75);
    earShape(c, -r * 0.12, 0, r * 0.75, -0.2 + ear);
    earShape(c, r * 0.12, 0, r * 0.75, 0.25 - ear);
    c.restore();
  }
  artCircle(c, x, y, r, '#fff4cc', { lineColor: '#d8c48a', hi: 0.3 });
  artCircle(c, x - r * 0.4, y - r * 0.35, r * 0.16, '#efe0a8', { line: false });
  artCircle(c, x + r * 0.45, y + r * 0.4, r * 0.11, '#efe0a8', { line: false });
  artCircle(c, x + r * 0.15, y - r * 0.55, r * 0.08, '#efe0a8', { line: false });
  // Unelias naama; tökättynä silmät auki
  for (i = -1; i <= 1; i += 2) {
    if (awake) artEye(c, x + i * r * 0.3, y, r * 0.11, 0.3, (globalT % 3.4) < 0.12);
    else {
      c.strokeStyle = '#a8905a';
      c.lineWidth = Math.max(1, r * 0.06);
      c.lineCap = 'round';
      c.beginPath(); c.arc(x + i * r * 0.3, y - r * 0.02, r * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
  }
  artBlush(c, x - r * 0.5, y + r * 0.22, r * 0.12);
  artBlush(c, x + r * 0.5, y + r * 0.22, r * 0.12);
  c.strokeStyle = '#a8905a';
  c.lineWidth = Math.max(1, r * 0.06);
  c.beginPath(); c.arc(x, y + r * 0.2, r * 0.16, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  c.globalAlpha = 1;
}
// Taustapilvet: parallaksikerros, värit vuorokaudenajan mukaan
function tksDrawPuffs(c, par) {
  var i, p, x, y, s, col;
  for (i = 0; i < tks.puffs.length; i++) {
    p = tks.puffs[i];
    if (p.p !== par) continue;
    x = (p.u - tks.cam * par) * viewW;
    s = p.s * viewH;
    if (x < -s * 4 || x > viewW + s * 4) continue;
    y = (p.v + Math.sin(globalT * 0.3 + p.seed) * 0.006) * viewH;
    col = tksPuffCol(tks.cam + x / viewW);
    c.globalAlpha = par < 0.5 ? 0.75 : 0.92;
    c.fillStyle = col.rim;
    cloudPath(c, x, y - s * 0.12, s);
    c.fill();
    c.fillStyle = col.body;
    cloudPath(c, x, y + s * 0.06, s * 0.96);
    c.fill();
    c.fillStyle = artRGBA(col.shade, 0.55);
    c.beginPath();
    c.ellipse(x, y + s * 0.75, s * 2.1, s * 0.32, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
// Pilvimeri: pyöreät pallerot ruudun alareunassa (reuna vaaleampi)
function tksDrawSea(c, par, y0, sz, amp, seed, alpha) {
  var off = tks.cam * viewW * par, sp = viewH * sz * 1.25, i0 = Math.floor(off / sp) - 1, i, x, y, r, col = tksPuffCol(tks.cam + 0.5), g, pass;
  c.globalAlpha = alpha;
  for (pass = 0; pass < 2; pass++) {
    c.beginPath();
    for (i = i0; i < i0 + viewW / sp + 3; i++) {
      x = i * sp - off;
      r = viewH * sz * (0.75 + tksHash(i * 3 + seed) * 0.55);
      y = viewH * y0 + tksHash(i + seed) * viewH * amp - (pass ? 0 : r * 0.1);
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.rect(-2, viewH * y0 + viewH * amp * 0.5, viewW + 4, viewH);
    if (pass === 0) c.fillStyle = col.rim;
    else {
      g = c.createLinearGradient(0, viewH * (y0 - sz), 0, viewH);
      g.addColorStop(0, col.body);
      g.addColorStop(1, col.shade);
      c.fillStyle = g;
    }
    c.fill();
  }
  c.globalAlpha = 1;
}
// Tuulivyöhyke: virtaviivat ja pienet kimallukset kulkevat tuulen suuntaan
function tksDrawWinds(c) {
  var i, j, w, x0, x1, x, y, k, dir, a, len = viewH * 0.09, fade, wob;
  c.lineCap = 'round';
  for (i = 0; i < TKS_WINDS.length; i++) {
    w = TKS_WINDS[i];
    x0 = w[0] * viewW - camX; x1 = w[1] * viewW - camX;
    if (x1 < -len || x0 > viewW + len) continue;
    dir = w[2];
    for (j = 0; j < 16; j++) {
      k = ((tksHash(j * 3.3 + i) + dir * globalT * 0.35) % 1 + 1) % 1;
      x = x0 + (x1 - x0) * (0.08 + 0.84 * tksHash(j * 1.7 + i * 5));
      y = viewH * (0.04 + k * 0.92);
      // Reunoilla haalea: vyön alku ja loppu sulautuvat taivaaseen
      fade = Math.min(1, (x - x0) / (viewH * 0.06), (x1 - x) / (viewH * 0.06));
      a = Math.sin(k * Math.PI) * 0.6 * Math.max(0, fade);
      if (a < 0.03) continue;
      wob = Math.sin(globalT * 3 + j) * viewH * 0.008;
      c.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      c.lineWidth = Math.max(1.5, viewH * 0.004);
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + wob, y - dir * len * 0.5, x - wob * 0.5, y - dir * len);
      c.stroke();
      // Pää: pieni kimallus liikkeen suunnassa
      if (j % 3 === 0) tksSparkle(c, x, y, viewH * 0.006, a, '#ffffff');
      else { c.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; c.beginPath(); c.arc(x, y, viewH * 0.004, 0, Math.PI * 2); c.fill(); }
    }
  }
}

// ---------- Piirto: ukkospilvet ----------
var TKS_TC_BLOBS = [[-0.62, 0.12, 0.42], [0.62, 0.14, 0.4], [-0.2, -0.2, 0.55], [0.3, -0.16, 0.48], [0, 0.22, 0.52]];
function tksTcPath(c, x, y, s) {
  var i, B = TKS_TC_BLOBS;
  c.beginPath();
  for (i = 0; i < B.length; i++) {
    c.moveTo(x + B[i][0] * s + B[i][2] * s, y + B[i][1] * s);
    c.arc(x + B[i][0] * s, y + B[i][1] * s, B[i][2] * s, 0, Math.PI * 2);
  }
}
// Varoitus: vaaravyö, virtaava katkoviiva ja putoavat kipinät
function tksDrawTelegraph(c, tc) {
  var x = tc.col * viewW, y0 = tc.sy * viewH + viewH * 0.04, k = Math.min(1, tc.t / tksTel()), bw = tksBW(tc) * viewH, pulse = 0.5 + 0.5 * Math.sin(globalT * 18), i, sy, o, x0, x1;
  // Vaaravyö: lämmin keltainen, reunoilla kirkkaat viivat. Muuri on yksi
  // yhtenäinen vyö kummankin salaman yli.
  x0 = x - bw; x1 = x + bw;
  if (tc.mode === 'double') {
    o = tksPartner(tc);
    x0 = Math.min(tc.col, o ? o.col : tc.col) * viewW - bw;
    x1 = Math.max(tc.col, o ? o.col : tc.col) * viewW + bw;
  }
  if (tc.mode !== 'double' || tc.slot === 0) {
    c.fillStyle = 'rgba(255,196,80,' + (0.12 + 0.16 * k + 0.05 * pulse).toFixed(3) + ')';
    c.fillRect(x0, y0, x1 - x0, viewH - y0);
    c.strokeStyle = 'rgba(255,220,120,' + (0.35 + 0.35 * k).toFixed(2) + ')';
    c.lineWidth = Math.max(1.5, viewH * 0.003);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, viewH); c.moveTo(x1, y0); c.lineTo(x1, viewH); c.stroke();
  }
  c.lineCap = 'butt';
  c.strokeStyle = 'rgba(255,230,120,' + (0.25 + 0.2 * k).toFixed(2) + ')';
  c.lineWidth = viewH * (0.012 + 0.01 * k);
  c.setLineDash([viewH * 0.03, viewH * 0.022]);
  c.lineDashOffset = -globalT * viewH * 0.35;
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, viewH); c.stroke();
  c.strokeStyle = 'rgba(255,255,230,' + (0.6 + 0.4 * k * pulse).toFixed(2) + ')';
  c.lineWidth = Math.max(2, viewH * (0.004 + 0.003 * k));
  c.stroke();
  c.setLineDash([]);
  c.lineDashOffset = 0;
  // Kipinät valuvat viivaa pitkin
  for (i = 0; i < 3; i++) {
    sy = y0 + ((globalT * 0.9 + i / 3) % 1) * (viewH - y0);
    tksSparkle(c, x, sy, viewH * 0.006, 0.8, '#fff6c0');
  }
  // Tuplaiskun turvarako kimaltelee
  if (tc.mode === 'double' && tc.slot === 0) {
    var gx = tc.gap * viewW, gw = tc.gapW * viewW + tksR() * TKS_HIT_K;
    // Turvarako: minttuinen hohde ja nousevat kimallukset (kohta, johon iso pilvi mahtuu)
    c.fillStyle = 'rgba(120,255,170,' + (0.1 + 0.06 * pulse).toFixed(3) + ')';
    c.fillRect(gx - gw, y0, gw * 2, viewH - y0);
    c.strokeStyle = 'rgba(170,255,200,0.75)';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    c.setLineDash([viewH * 0.012, viewH * 0.012]);
    c.lineDashOffset = globalT * viewH * 0.1;
    c.beginPath(); c.moveTo(gx - gw, y0); c.lineTo(gx - gw, viewH); c.moveTo(gx + gw, y0); c.lineTo(gx + gw, viewH); c.stroke();
    c.setLineDash([]);
    c.lineDashOffset = 0;
    for (i = 0; i < 8; i++) {
      sy = viewH - ((globalT * 0.5 + i / 8) % 1) * (viewH - y0);
      tksSparkle(c, gx + Math.sin(globalT * 3 + i * 2) * gw * 0.6, sy, viewH * 0.011, 1, '#e0ffe8');
    }
  }
}
function tksDrawBolt(c, tc) {
  var x = tc.col * viewW, y0 = tc.sy * viewH + viewH * 0.03, i, k = 1 - tc.t / TKS_BOLT, pts = tc.pts, n = pts.length - 1, y, w = viewH * 0.03;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (var pass = 0; pass < 3; pass++) {
    c.strokeStyle = pass === 0 ? 'rgba(255,240,150,' + (0.35 * k).toFixed(2) + ')' : pass === 1 ? 'rgba(255,214,80,' + k.toFixed(2) + ')' : 'rgba(255,255,245,' + k.toFixed(2) + ')';
    c.lineWidth = pass === 0 ? tksBW(tc) * viewH * 2 : pass === 1 ? viewH * 0.016 : viewH * 0.006;
    c.beginPath();
    for (i = 0; i <= n; i++) {
      y = y0 + (viewH - y0) * i / n;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x + pts[i] * w, y);
    }
    c.stroke();
  }
}
function tksDrawTCloud(c, tc) {
  var S = viewH * 0.072, x = tc.sx * viewW, y = tc.sy * viewH, warn = tc.state === 'warn', bolt = tc.state === 'bolt', flick, col, k, i, look;
  if (x < -S * 3 || x > viewW + S * 3) return;
  if (warn) x += Math.sin(globalT * 55) * S * 0.04;
  flick = warn && Math.floor(globalT * 14) % 2 === 0;
  col = bolt ? '#c8c4f0' : flick ? '#a29ed8' : '#7c78b4';
  if (tc.poke > 0) { k = Math.sin(tc.poke / 0.5 * Math.PI) * 0.12; c.save(); c.translate(x, y); artSquash(c, -k); c.translate(-x, -y); }
  artShadow(c, x, y + S * 0.95, S * 1.1, S * 0.18, 0.1);
  artUnion(c, tksTcPath, x, y, S, y - S * 0.8, y + S * 0.7, col, { lineColor: '#3c3868', shadeTo: artShade(col, -0.28) });
  artHighlight(c, x - S * 0.35, y - S * 0.45, S * 0.25, S * 0.1, 0.35);
  // Kasvot: kulmat kurtussa, poskipuna; varoittaessa posket pullistuvat
  look = tksClamp((tks.cx - tc.sx) * 3, -1, 1);
  for (i = -1; i <= 1; i += 2) {
    artEye(c, x + i * S * 0.24, y - S * 0.02, S * 0.1, look, !warn && ((globalT + tc.ph) % 3.1) < 0.12);
    c.strokeStyle = '#2a2450';
    c.lineWidth = Math.max(1.2, S * 0.05);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + i * S * 0.38, y - S * 0.2); c.lineTo(x + i * S * 0.12, y - S * 0.13); c.stroke();
  }
  artBlush(c, x - S * 0.45, y + S * 0.14, S * (warn ? 0.15 : 0.1));
  artBlush(c, x + S * 0.45, y + S * 0.14, S * (warn ? 0.15 : 0.1));
  c.strokeStyle = '#2a2450';
  c.lineWidth = Math.max(1.2, S * 0.045);
  c.beginPath();
  if (warn) c.arc(x, y + S * 0.2, S * 0.07, 0, Math.PI * 2);
  else if (bolt) {
    c.moveTo(x - S * 0.14, y + S * 0.2);
    for (i = 1; i <= 4; i++) c.lineTo(x - S * 0.14 + i * S * 0.07, y + S * 0.2 + (i % 2 ? -1 : 1) * S * 0.04);
  } else c.arc(x, y + S * 0.3, S * 0.1, Math.PI * 1.2, Math.PI * 1.8);
  c.stroke();
  // Varoituksen sähkökipinät pilven reunoilla
  if (warn) {
    c.strokeStyle = '#ffe27a';
    c.lineWidth = Math.max(1.5, S * 0.05);
    for (i = 0; i < 2; i++) {
      k = Math.floor(globalT * 10 + i * 3);
      var ex = x + (tksHash(k) - 0.5) * S * 2, ey = y + S * 0.35 + tksHash(k + 1) * S * 0.2;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + S * 0.08, ey + S * 0.14); c.lineTo(ex - S * 0.04, ey + S * 0.16); c.lineTo(ex + S * 0.05, ey + S * 0.3); c.stroke();
    }
  }
  if (tc.poke > 0) c.restore();
}

// ---------- Piirto: hahmot ----------
function tksDrawStars(c) {
  var i, st, x, y, r = viewH * 0.028;
  for (i = 0; i < tks.stars.length; i++) {
    st = tks.stars[i];
    if (st.got) continue;
    x = st.u * viewW - camX;
    if (x < -r * 3 || x > viewW + r * 3) continue;
    y = (st.v + Math.sin(st.ph * 2) * 0.008) * viewH;
    drawStar(c, x, y, r * (1 + Math.sin(st.ph * 3) * 0.06), Math.sin(st.ph * 1.3) * 0.25, 0.85);
  }
}
function tksDrawSib(c, sb, i) {
  var x = sb.x * viewW - camX, y = sb.y * viewH, r = viewH * TKS_SIB_R, mood = 'happy', hop = sb.hop > 0 ? Math.sin(sb.hop / 0.5 * Math.PI) * r * 0.6 : 0, n = tksNight(tks.cam);
  if (x < -r * 3 || x > viewW + r * 3 || sb.state === 'lost') return;
  if (sb.state === 'wait' || sb.state === 'home') mood = tks.storm >= 0 && sb.state === 'wait' ? 'scared' : 'sad';
  if (sb.state === 'flee') mood = 'scared';
  if (n > 0.3) artGlow(c, x, y - hop, r * 2.4, sb.tint, 0.3 * n);
  // Odottaja vilkuttaa apua: pieni hehkurengas
  if (sb.state === 'wait' || sb.state === 'home') {
    c.strokeStyle = artRGBA('#ffffff', 0.35 + 0.25 * Math.sin(globalT * 4 + i));
    c.lineWidth = Math.max(1.5, r * 0.08);
    c.beginPath(); c.arc(x, y - hop, r * (1.55 + 0.1 * Math.sin(globalT * 4 + i)), 0, Math.PI * 2); c.stroke();
  }
  trekDrawPup(c, x, y - hop, r, {
    mood: mood, t: globalT, tint: sb.tint, seed: sb.seed, look: sb.state === 'trail' ? 0.8 : -0.6,
    wave: sb.state !== 'trail' || tks.state === 'end' || tks.giggleT > 0, squint: sb.state === 'trail' && (tks.giggleT > 0 || tks.state === 'end'),
    flip: false
  });
}
// Iso Pikkupilvi, yksisarvinen ja prinsessa selässä
function tksDrawHero(c) {
  var r = tksR(), x = tksSX(), y = tksSY() + Math.sin(globalT * 2) * viewH * 0.005, us = trekUS() * TKS_UNI, mood, tilt, jit, ux, uy, i, b, sq, n = tksNight(tks.cam);
  jit = tks.shiverT > 0 ? Math.sin(globalT * 70) * viewH * 0.004 * Math.min(1, tks.shiverT) : 0;
  if (tks.hitT > 0) mood = 'scared';
  else if (tks.wowT > 0 || tks.state === 'castle' && tks.castleT < 1.5) mood = 'wow';
  else if (tks.giggleT > 0 || tks.state === 'end') mood = 'happy';
  else if (tks.tclouds.length && tks.storm >= 0) mood = 'brave';
  else mood = 'happy';
  tilt = tksClamp(tks.vx / viewH * 0.06, -0.12, 0.12);
  sq = tks.wiggleT > 0 ? Math.sin(tks.wiggleT * 30) * 0.06 : tksClamp(-tks.vy / viewH * 0.03, -0.05, 0.05);
  c.save();
  c.translate(x + jit, y);
  c.rotate(tilt);
  // Kuupupu kyydissä (yksisarvisen takana)
  b = tks.bunny;
  if (b && b.state === 'ride') drawBunny(c, -r * 0.72, -r * 0.52, viewH * 0.03, Math.abs(Math.sin(globalT * 3)) * viewH * 0.004, globalT * 4, false);
  trekDrawPup(c, 0, 0, r, {
    mood: mood, t: globalT, look: tks.state === 'castle' ? 0.8 : 0.5, squash: sq, wave: tks.giggleT > 0 || tks.state === 'end',
    squint: mood === 'happy' && (tks.giggleT > 0 || tks.state === 'end'), glow: n * 0.3
  });
  ux = -r * 0.05; uy = -r * 0.6;
  drawUnicorn(c, ux, uy, us, 1, 0, false, globalT);
  // Pörröiset pallerot kavioiden edessä (yksisarvinen istuu pilvessä)
  for (i = 0; i < 3; i++) artCircle(c, ux + (-0.36 + i * 0.36) * r, uy + r * 0.08, r * (0.2 + (i % 2) * 0.05), artMix('#ffffff', '#fffbe0', n * 0.3), { line: false, shadeTo: '#eef0fc' });
  // Prinsessa hytisee osuman jälkeen
  if (tks.shiverT > 0) tksDrawShiver(c, ux - us * 4, uy - us * 93, us);
  c.restore();
}
function tksDrawShiver(c, hx, hy, us) {
  var i, a = Math.min(1, tks.shiverT * 2);
  c.globalAlpha = a;
  c.strokeStyle = '#ffd24f';
  c.lineWidth = Math.max(1.5, us * 2);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (i = -1; i <= 1; i += 2) {
    c.beginPath();
    c.moveTo(hx + i * us * 14, hy - us * 10);
    c.lineTo(hx + i * us * 18, hy - us * 5);
    c.lineTo(hx + i * us * 14, hy);
    c.lineTo(hx + i * us * 18, hy + us * 5);
    c.stroke();
  }
  // Pörröttyneet hiukset: pienet tähtikipinät pään ympärillä
  for (i = 0; i < 3; i++) tksSparkle(c, hx + Math.cos(globalT * 6 + i * 2.1) * us * 16, hy - us * 12 + Math.sin(globalT * 6 + i * 2.1) * us * 5, us * 2.2, a, '#fff3a0');
  c.globalAlpha = 1;
}
// Putoava tähti kimalluspyrstöineen: pää (x, y), pyrstö kohti suuntaa ang
function tksDrawFalling(c, x, y, r, ang, t, face, tl) {
  var i, k, tx, ty, L = r * (tl || 3.6);
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    c.strokeStyle = ['rgba(255,236,140,0.35)', 'rgba(255,190,220,0.45)', 'rgba(255,255,240,0.8)'][i];
    c.lineWidth = r * [0.9, 0.55, 0.22][i];
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(ang) * L * 0.5 + Math.sin(ang) * r * 0.4, y + Math.sin(ang) * L * 0.5 - Math.cos(ang) * r * 0.4, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
    c.stroke();
  }
  for (i = 0; i < 5; i++) {
    k = ((t * 1.5 + i / 5) % 1);
    tx = x + Math.cos(ang) * L * k + Math.sin(ang) * r * 0.5 * Math.sin(i * 2.3);
    ty = y + Math.sin(ang) * L * k - Math.cos(ang) * r * 0.5 * Math.sin(i * 2.3);
    tksSparkle(c, tx, ty, r * 0.16 * (1 - k * 0.6), 1 - k, maneColors[i % maneColors.length]);
  }
  drawStar(c, x, y, r, Math.sin(t * 2) * 0.2, 0.9);
  if (face) {
    artEye(c, x - r * 0.2, y - r * 0.02, r * 0.11, 0.2, (t % 3) < 0.1);
    artEye(c, x + r * 0.2, y - r * 0.02, r * 0.11, 0.2, (t % 3) < 0.1);
    c.strokeStyle = '#a8600a';
    c.lineWidth = Math.max(1, r * 0.07);
    c.beginPath(); c.arc(x, y + r * 0.12, r * 0.14, 0.2, Math.PI - 0.2); c.stroke();
    artBlush(c, x - r * 0.36, y + r * 0.12, r * 0.09);
    artBlush(c, x + r * 0.36, y + r * 0.12, r * 0.09);
  }
}
function tksDrawShoots(c) {
  var i, sh, k, a, len = viewH * 0.12, ang;
  for (i = 0; i < tks.shoots.length; i++) {
    sh = tks.shoots[i];
    if (sh.t <= 0) continue;
    k = sh.t / sh.dur;
    a = k < 1 ? Math.min(1, sh.t * 4) : Math.max(0, 1 - (sh.t - sh.dur) / 0.3);
    ang = Math.atan2(-sh.dy, -sh.dx);
    var g = c.createLinearGradient(sh.x, sh.y, sh.x + Math.cos(ang) * len, sh.y + Math.sin(ang) * len);
    g.addColorStop(0, 'rgba(255,255,240,' + (0.9 * a).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(255,220,255,0)');
    c.strokeStyle = g;
    c.lineWidth = Math.max(2, viewH * 0.006);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(sh.x + Math.cos(ang) * len, sh.y + Math.sin(ang) * len); c.stroke();
    tksSparkle(c, sh.x, sh.y, viewH * 0.009, a, '#ffffff');
  }
}
function tksDrawBunnyHop(c) {
  var b = tks.bunny, k, p, x, y;
  if (!b || b.state !== 'hop') return;
  k = easeInOutSine(Math.min(1, b.t / 1.4));
  p = tksBunnySeat();
  x = b.x0 + (p.x - b.x0) * k;
  y = b.y0 + (p.y - b.y0) * k - Math.sin(k * Math.PI) * viewH * 0.18;
  artGlow(c, x, y - viewH * 0.02, viewH * 0.06, '#fff8e0', 0.5);
  drawBunny(c, x, y, viewH * (0.04 - 0.01 * k), 0, globalT * 8, false);
}
// Pilvilinna pilvillä: hehku, sateenkaariviirit, lamput sisarille ja portti
function tksDrawCastle(c) {
  var g = tksGatePos(), x = g.x - camX, base = g.base, size = g.size, i, j, k, open = easeInOutSine(tks.gateT), lx, ly, n = tks.trail.length, col = tksPuffCol(TKS_LEN);
  if (x < -size * 2 || x > viewW + size * 2) return;
  artGlow(c, x, base - size * 0.5, size * 1.5, '#ffd8a0', 0.35 + 0.15 * Math.sin(globalT * 1.5));
  artGlow(c, x, base - size * 0.5, size * 0.9, '#fff0c8', 0.3);
  // Sateenkaari linnan takana
  c.lineWidth = size * 0.035;
  for (i = 0; i < 7; i++) {
    c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.5);
    c.beginPath(); c.arc(x, base - size * 0.1, size * (1.25 - i * 0.035), Math.PI * 1.02, Math.PI * 1.98); c.stroke();
  }
  // Pilvisaari
  c.fillStyle = col.rim;
  for (i = -2; i <= 2; i++) { cloudPath(c, x + i * size * 0.38, base + size * 0.04 - (i % 2) * size * 0.03, size * (0.2 - Math.abs(i) * 0.02)); c.fill(); }
  drawCastle(c, x, base, size);
  // Valaistut ikkunat hehkuvat
  for (i = -1; i <= 1; i++) artGlow(c, x + i * size * 0.4, base - size * (i === 0 ? 0.95 : 0.7) + size * 0.17, size * 0.09, '#ffe9a8', 0.6);
  // Sateenkaariviirit tornista toiseen
  for (j = -1; j <= 1; j += 2) {
    var ax = x + j * size * 0.4, ay = base - size * 0.7 - size * 0.02, bx = x, by = base - size * 0.95 - size * 0.02;
    c.strokeStyle = '#9a6fc4';
    c.lineWidth = Math.max(1, size * 0.006);
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + size * 0.12, bx, by); c.stroke();
    for (i = 1; i < 7; i++) {
      k = i / 7;
      lx = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * (ax + bx) / 2 + k * k * bx;
      ly = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * ((ay + by) / 2 + size * 0.12) + k * k * by;
      var wv = Math.sin(globalT * 4 + i + j) * size * 0.012;
      c.fillStyle = RAINBOW_COLORS[(i + (j > 0 ? 2 : 0)) % 7];
      c.beginPath(); c.moveTo(lx - size * 0.025, ly); c.lineTo(lx + size * 0.025, ly); c.lineTo(lx + wv, ly + size * 0.07); c.closePath(); c.fill();
    }
  }
  // Portti: kultainen valo tulvii, kun ovet aukeavat
  var gx = x, gy = base, gw = size * 0.1, gh = size * 0.4;
  if (open > 0) {
    artGlow(c, gx, gy - gh * 0.5, size * (0.3 + open * 0.5), '#fff2b0', 0.7 * open);
    c.fillStyle = 'rgba(255,248,200,' + (0.25 * open).toFixed(2) + ')';
    c.beginPath(); c.moveTo(gx - gw, gy); c.lineTo(gx + gw, gy); c.lineTo(gx + gw * (1 + open * 3), viewH); c.lineTo(gx - gw * (1 + open * 3), viewH); c.closePath(); c.fill();
  }
  c.beginPath();
  c.moveTo(gx - gw, gy); c.lineTo(gx - gw, gy - size * 0.3); c.arc(gx, gy - size * 0.3, gw, Math.PI, 0); c.lineTo(gx + gw, gy); c.closePath();
  c.fillStyle = open > 0 ? '#fff4c8' : '#5a3a8a';
  c.fill();
  // Ovet liukuvat sivuun
  for (j = -1; j <= 1; j += 2) {
    c.save();
    c.beginPath();
    c.moveTo(gx - gw, gy); c.lineTo(gx - gw, gy - size * 0.3); c.arc(gx, gy - size * 0.3, gw, Math.PI, 0); c.lineTo(gx + gw, gy); c.closePath();
    c.clip();
    c.beginPath();
    c.rect(gx + (j < 0 ? -gw : 0) + j * gw * open, gy - gh, gw, gh);
    artFillPath(c, '#b07ad8', gy - gh, gy, gw, { lineColor: '#6a3a98' });
    c.restore();
  }
  // Viisi sisarlamppua portin yllä: syttyvät jonon mukaan
  for (i = 0; i < 5; i++) {
    lx = gx + (i - 2) * size * 0.1;
    ly = gy - size * 0.47;
    if (i < n) artGlow(c, lx, ly, size * 0.07, tks.trail[i].tint, 0.8);
    c.fillStyle = i < n ? artShade(tks.trail[i].tint, -0.45) : '#4a3478';
    cloudPath(c, lx, ly, size * 0.023);
    c.fill();
    c.fillStyle = i < n ? tks.trail[i].tint : '#8a78b8';
    cloudPath(c, lx, ly, size * 0.019);
    c.fill();
  }
}

// Vihjekäsi: ensin raahaus kohti ensimmäistä tähteä, myöhemmin kohti lähintä
// kerättävää, linnalla tähdenlentoa, sisarta tai porttia kohti
function tksDrawHint(c) {
  var to = null, i, st, sb, from, k, hx, hy, g, best = 1e9, x, d;
  if (tks.state === 'end' || holding) return;
  if (tks.state === 'fly') {
    if (!(tks.idleT > 4.5 || (!tks.everDrag && tks.t > 2.2))) return;
    for (i = 0; i < tks.sibs.length; i++) {
      sb = tks.sibs[i];
      if (sb.state !== 'wait') continue;
      x = sb.x * viewW - camX;
      if (x > viewW * 0.15 && x < viewW * 0.95 && x < best) { best = x; to = { x: Math.min(x, viewW * tksXMax()), y: sb.y * viewH }; }
    }
    if (!to) {
      for (i = 0; i < tks.stars.length; i++) {
        st = tks.stars[i];
        if (st.got) continue;
        x = st.u * viewW - camX;
        if (x > viewW * 0.15 && x < viewW * 0.95 && x < best) { best = x; to = { x: Math.min(x, viewW * tksXMax()), y: st.v * viewH }; }
      }
    }
  } else if (tks.idleT > 3) {
    if (tks.gift.state === 'fly') to = { x: tks.gift.x, y: tks.gift.y };
    for (i = 0; !to && i < tks.sibs.length; i++) {
      sb = tks.sibs[i];
      if (sb.state === 'home' || sb.state === 'wait') {
        d = sb.x * viewW - camX;
        if (d > 0 && d < viewW) to = { x: d, y: sb.y * viewH };
      }
    }
    if (!to && tks.gateT >= 1 && tks.gift.state === 'caught') { g = tksGatePos(); to = { x: g.x - camX, y: g.y }; }
  }
  if (!to) return;
  from = { x: tksSX(), y: tksSY() };
  k = (globalT % 1.8) / 1.8;
  hx = from.x + (to.x - from.x) * easeInOutSine(Math.min(1, k * 1.3));
  hy = from.y + (to.y - from.y) * easeInOutSine(Math.min(1, k * 1.3));
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  drawHand(c, hx + viewH * 0.02, hy + viewH * 0.02, viewH * 0.045);
  c.globalAlpha = 1;
}

function tksDraw() {
  var c = ctx, i, tc, a;
  if (!beginPlayWorld()) return;
  tksDrawSky(c);
  tksDrawPuffs(c, 0.34);
  tksDrawSea(c, 0.5, 0.86, 0.06, 0.03, 3, 0.85);
  tksDrawPuffs(c, 0.62);
  tksDrawCastle(c);
  tksDrawShoots(c);
  tksDrawWinds(c);
  propsDraw(c);
  for (i = 0; i < tks.tclouds.length; i++) {
    tc = tks.tclouds[i];
    if (tc.state === 'warn') tksDrawTelegraph(c, tc);
  }
  for (i = 0; i < tks.tclouds.length; i++) tksDrawTCloud(c, tks.tclouds[i]);
  tksDrawStars(c);
  for (i = 0; i < tks.sibs.length; i++) if (tks.sibs[i].state !== 'trail') tksDrawSib(c, tks.sibs[i], i);
  for (i = tks.trail.length - 1; i >= 0; i--) tksDrawSib(c, tks.trail[i], i);
  tksDrawHero(c);
  for (i = 0; i < tks.tclouds.length; i++) {
    tc = tks.tclouds[i];
    if (tc.state === 'bolt') tksDrawBolt(c, tc);
  }
  if (tks.gift.state === 'fly') tksDrawFalling(c, tks.gift.x, tks.gift.y, viewH * 0.045, Math.atan2(-0.55, 1.0), globalT, true);
  else if (tks.gift.state === 'caught') tksDrawFalling(c, tks.gift.x, tks.gift.y, viewH * (tks.state === 'end' ? 0.04 + 0.025 * Math.min(1, tks.endT / 1.6) : 0.032), -Math.PI * 0.75, globalT, true);
  tksDrawBunnyHop(c);
  tksDrawSea(c, 1.25, 0.97, 0.05, 0.02, 11, 1);
  drawParticlesLayer(c);
  tksDrawHint(c);
  endPlayWorld();
  // Salaman välähdys
  a = Math.max(tks.flashT > 0 ? tks.flashT / 0.35 * 0.55 : 0, tks.boltFlash > 0 ? tks.boltFlash / 0.15 * 0.12 : 0);
  if (a > 0) {
    c.fillStyle = 'rgba(255,252,225,' + a.toFixed(3) + ')';
    c.fillRect(0, 0, viewW, viewH);
  }
  tksDrawHud(c);
}

// HUD: viisi sisarpaikkaa ja tähtilaskuri
function tksHudSlot(i) {
  var hs = viewH * 0.022, pad = hs * 1.4;
  return { x: hudX() + pad * 0.5 + hs * 1.5 + i * hs * 3.0, y: pad * 0.5 + hs * 1.7 };
}
function tksHudStar() {
  var hs = viewH * 0.022, pad = hs * 1.4;
  return { x: hudX() + hs * 3.0 * 5 + pad + hs * 0.6 + hs * 1.8, y: pad * 0.5 + hs * 1.7 };
}
function tksDrawHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, top = pad * 0.5, i, sl, sb, bump, p, k, f, x, y, w;
  drawHudPanel(c, hudX(), top, hs * 3.0 * 5 + pad, hs * 3.4, hs);
  for (i = 0; i < 5; i++) {
    sl = tksHudSlot(i);
    sb = tks.trail[i];
    if (sb) {
      bump = tks.sibBump > 0 && i === tks.trail.length - 1 ? 1 + Math.sin(Math.PI * tks.sibBump / 0.45) * 0.4 : 1;
      trekDrawPup(c, sl.x, sl.y + hs * 0.1, hs * 0.9 * bump, { mood: 'happy', t: globalT, tint: sb.tint, seed: sb.seed, squint: tks.giggleT > 0 });
    } else {
      c.strokeStyle = 'rgba(120,100,180,0.55)';
      c.lineWidth = 1.5;
      c.setLineDash([3, 3]);
      c.beginPath(); c.arc(sl.x, sl.y, hs * 0.95, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
    }
  }
  // Tähtilaskuri
  x = hudX() + hs * 3.0 * 5 + pad + hs * 0.6;
  w = hs * 8.2;
  drawHudPanel(c, x, top, w, hs * 3.4, hs);
  p = tksHudStar();
  bump = tks.hudBump > 0 ? 1 + Math.sin(Math.PI * tks.hudBump / 0.4) * 0.4 : 1;
  drawStar(c, p.x, p.y, hs * 1.05 * bump, Math.sin(globalT * 1.5) * 0.15, 0.5);
  c.font = 'bold ' + Math.round(hs * 1.7) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillStyle = '#6a3ca8';
  c.fillText(tks.starN + '/' + tks.stars.length, p.x + hs * 1.6, p.y + hs * 0.1);
  c.textBaseline = 'alphabetic';
  // Lentävät tähdet HUD:iin
  for (i = 0; i < tks.flyers.length; i++) {
    f = tks.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    x = f.x0 + (p.x - f.x0) * k;
    y = f.y0 + (p.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.1;
    drawStar(c, x, y, viewH * 0.026 * (1 - k * 0.4), globalT * 3, 0.5);
  }
}

// ---------- Lahja ja kuvake ----------
function tksGiftDraw(c, x, y, s) {
  tksDrawFalling(c, x - s * 0.13, y + s * 0.13, s * 0.25, -Math.PI * 0.25, globalT, true, 2.2);
}
// Aseman kuva: yötaivas, iso pilvi yksisarvinen selässään ja tähtiä
function tksIcon(c, x, y, s) {
  var g = c.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.5), i, b = Math.sin(globalT * 1.6) * s * 0.015;
  g.addColorStop(0, '#1c2264');
  g.addColorStop(0.6, '#4a3e98');
  g.addColorStop(1, '#c47aa8');
  c.fillStyle = g;
  c.fillRect(x - s * 0.5, y - s * 0.5, s, s);
  for (i = 0; i < 7; i++) tksSparkle(c, x + (tksHash(i * 3.1) - 0.5) * s * 0.8, y - s * 0.4 + tksHash(i * 7.7) * s * 0.35, s * (0.008 + (i % 3) * 0.004), 0.6 + 0.4 * Math.sin(globalT * 2 + i), '#fff8d8');
  artCircle(c, x + s * 0.24, y - s * 0.22, s * 0.08, '#fff4cc', { lineColor: '#d8c48a' });
  drawStar(c, x - s * 0.26, y - s * 0.2, s * 0.06, 0.2, 0.6);
  trekDrawPup(c, x, y + s * 0.17 + b, s * 0.2, { mood: 'happy', t: globalT, look: 0.6 });
  drawUnicorn(c, x - s * 0.01, y + s * 0.05 + b, s * 0.0023, 1, 0, false, globalT);
  for (i = 0; i < 3; i++) artCircle(c, x + (-0.08 + i * 0.07) * s, y + s * 0.07 + b, s * 0.04, '#ffffff', { line: false, shadeTo: '#eef0fc' });
}

trekRegister({
  id: 'sky', order: 4, name: 'TÄH-TI-TAI-VAS', color: '#5a5cb8',
  ambient: null, light: tksLight, bunny: true,
  gift: { draw: tksGiftDraw },
  init: tksInit,
  update: tksUpdate,
  draw: tksDraw,
  tap: tksTap,
  resize: function () { tksRenderKey = ''; camX = tks.cam * viewW; },
  // Kerros on pelkkä pohjaväri: oma taivasnauha piirretään tksDrawSky:ssä
  layers: function () { return [{ speed: 0, render: function (b, w, h) { b.fillStyle = '#2a2c6e'; b.fillRect(0, 0, w, h); } }]; },
  icon: tksIcon
});
