'use strict';

// Kellokoneisto (Kaukamaa, Kellopaja): alueen vartija. Pajan suuri tornikello
// on pysähtynyt, kun Myrskynoidan myrsky tukki koneiston. Vartija yhdistää
// Kellopajan verbit yhdeksi koneeksi samalla ruudulla: VESI -> RATTAAT ->
// VIISARIT. Jokaisessa kierroksessa on kolme vaihetta:
//  1. Vesi: napautus kääntää kourupalaa (kuten Vesikourussa). Kun vesi yltää
//     vesirattaaseen eikä vuoda mihinkään, ratas pyörii ja vetää hihnalla
//     moottoriratasta tappitaulun vasemmassa alakulmassa.
//  2. Rattaat: raahaa rattaat tappeihin moottorirattaasta kellorattaaseen
//     (kuten Rataspajassa: naapurit pyörivät vastakkain, kolmio jumittaa).
//     Kellon on käytävä myötäpäivään: väärällä ketjun pituudella viisarit
//     pyörivät taaksepäin, nuoli punertuu ja koneisto ravistaa.
//  3. Viisarit: koneisto käy ja viisarit kiertävät. Tornin kyltti näyttää
//     ajan (tunti punaisella, minuutit sinisellä). Napauta jarruvipua (tai
//     kellotaulua), kun kello on kyltin ajassa: tornikello lyö tunnit ja
//     lyönnit lasketaan näkyviin. Liian aikainen napautus tai ohi ehtinyt kello
//     vie sydämen; ohi ehtinyt kello kelautuu taaksepäin uuteen yritykseen.
//     Sydänten loppuessa palataan saman kierroksen viisarivaiheen alkuun
//     (tarkistuspiste: vesi ja rattaat säilyvät).
// Kolme arvottua, kovenevaa kierrosta: vesiruudukko 4×3, 5×3, 5×4 ja
// enemmän hämäyspaloja; rattaiden ketju pitenee (ruuvattuja valmiita rattaita
// vähemmän), 2. ja 3. kierroksella suorin reitti pyörittää kelloa väärään
// suuntaan (ansa); viisarit nopeutuvat (3,0 / 2,6 / 2,2 s tunnissa), ajat
// tasat -> puolet -> vartit. Aave-viisarit näyttävät kohdan 1. kierroksella
// aina, 2. kierroksella ensimmäisessä kortissa ja ohilyönnin jälkeen.
// Myrskypilvi lennähtää 2.–3. kierroksen vesivaiheessa kourupalan ylle ja
// kääntää sen, ellei pilveä napauteta pois ajoissa (lähestyminen näkyy).
// Kierros ilman sydänmenetystä antaa kultaisen rattaan. Tehtävät 1. ja 2.
// kierroksen jälkeen: kello, lasku. Lopuksi tornikello lyö pitkään ja
// rattaat kultautuvat.
// Lainaa puhtaita apufunktioita: chuteRot/chuteRotN/chuteBit/chuteOpp/
// chuteRotNeed/CHUTE_DIRS/chuteDrawPipe/chuteDrawWheel (Vesikouru),
// gearNbrs/gearShortest/gearDrawWheel/gearDrawDirArrow (Rataspaja),
// cuckooDrawFace/cuckooDrawDigital/cuckooDrawBird/cuckooDrawTonttu/
// cuckooHourOf/cuckooHourAng/cuckooMinAng (Käkikello).

// Vesi: cols × rows, len: reitin pituus (palaa), decoys: hämäyspalat,
// rocks: kivet, par: alkuasennon vähimmäiskäännöt, cloud: myrskypilven käynnit.
// Rattaat: gcols × grows (moottori vasemmassa alakulmassa, kelloratas
// viimeisessä sarakkeessa riveillä trows), glen: ketjun pituus (askelia,
// parillinen = kello myötäpäivään), bolted: ruuvatut valmiit rattaat,
// spare: ylimääräiset, broken: rikkinäiset tapit, trick: suorin reitti väärään
// suuntaan. Viisarit: hits: lyöntejä kierroksessa, sph: sekuntia tunnissa,
// step: kortin minuuttiaskel, ghost: aave-viisarit ('all' | 'help' | 'none').
var CWORK_ROUNDS = [
  { cols: 4, rows: 3, len: [5, 7], decoys: 2, rocks: 1, par: 3, cloud: 0,
    gcols: 5, trows: [2], glen: 4, bolted: 1, spare: 1, broken: 2, trick: false,
    hits: 2, sph: 3.0, step: 60, ghost: 'all' },
  { cols: 5, rows: 3, len: [6, 9], decoys: 4, rocks: 1, par: 4, cloud: 1,
    gcols: 6, trows: [2], glen: 6, bolted: 1, spare: 1, broken: 2, trick: true,
    hits: 3, sph: 2.6, step: 30, ghost: 'help' },
  { cols: 5, rows: 4, len: [8, 12], decoys: 6, rocks: 2, par: 5, cloud: 2,
    gcols: 7, trows: [0, 1, 2], glen: 8, bolted: 2, spare: 2, broken: 3, trick: true,
    hits: 3, sph: 2.2, step: 15, ghost: 'none' }
];
var CWORK_GROWS = 3;            // tappitaulun rivit (kaikilla kierroksilla)
var CWORK_DW = 4 / 3;           // suunnittelukoordinaatiston leveys (korkeus 1)
var CWORK_FILL = 7;             // veden täyttymisnopeus (palaa / s)
var CWORK_WATER_WIN = 0.8;      // vesi valmis näin kauan -> rattaat
var CWORK_GEAR_WIN = 1.2;       // kello käy oikein näin kauan -> viisarit
var CWORK_SPEED = 1.6;          // rattaiden kulmanopeus (rad/s)
var CWORK_EARLY = 0.3;          // ajoitusikkuna ennen kortin aikaa (s)
var CWORK_LATE = 0.57;          // ajoitusikkuna kortin ajan jälkeen (s; reaktioviive)
var CWORK_LEAD = [60, 105];     // viisarit lähtevät näin monta minuuttia ennen kortin aikaa
var CWORK_GAP = 0.5;            // tornikellon lyöntien väli (s)

var cwork = {
  round: 0, state: 'intro', t: 0, R: null, phase: 'water', wait: 0, flawless: true, gold: [], taskDelay: -1,
  W: null, tiles: [], flow: null, okT: 0, wheel: { ang: 0, spin: 0, on: false },
  G: null, items: [], drag: null, net: null, netT: 0, gearOkT: 0, jamT: 0, backT: 0,
  tm: 0, disp: 0, cards: [], ci: 0, sub: 'wind', windFrom: 0, windT: 0, strike: null, helpGhost: false,
  lever: 0, slipT: 0, countPop: 0, tickQ: 0, bellSwing: 0,
  hintT: 0, tapped: false, placed: false, hitAny: false,
  cloud: null, cloudsLeft: 0, cloudT: 0, tonttu: { blink: 0, hop: 0, cheer: 0 }, resets: 0, wonT: 0
};

// ---------- Apufunktiot ----------
function cworkRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function cworkPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function cworkKey(c, r) { return c + ',' + r; }

// ---------- Asettelu ----------
// Kaikki paikat suunnittelukoordinaateista (leveys 4/3, korkeus 1); leveällä
// ruudulla kokonaisuus keskitetään ja reunoille jää koristetilaa.
function cworkLayout() {
  var W = viewW, h = viewH, S = Math.min(h, W / CWORK_DW), X0 = (W - S * CWORK_DW) / 2, Y0 = Math.max(0, (h - S) / 2);
  var R = cwork.R || CWORK_ROUNDS[0], cs = Math.min(0.11, 0.41 / R.rows) * S, gx = X0 + 0.09 * S, cx = X0 + 1.133 * S;
  return {
    S: S, X0: X0, Y0: Y0,
    cs: cs, ox: gx + 0.45 * cs, oy: Y0 + 0.56 * S + (0.41 * S - R.rows * cs) / 2,
    gd: 0.11 * S, gx: gx, gy: Y0 + 0.175 * S,
    trayY: Y0 + 0.495 * S, trayX0: X0 + 0.2 * S, trayX1: X0 + 0.9 * S,
    cx: cx, cy: Y0 + 0.31 * S, cr: 0.15 * S,
    tx0: X0 + 0.963 * S, tx1: X0 + 1.303 * S,
    lever: { x: cx, y: Y0 + 0.75 * S, r: 0.13 * S },
    card: { x: cx, y: Y0 + 0.545 * S, w: 0.28 * S, h: 0.115 * S },
    floor: Y0 + 0.975 * S,
    tont: { x: X0 + 0.885 * S, y: Y0 + 0.975 * S, s: 0.085 * S }
  };
}
function cworkCell(c, r, Lz) {
  Lz = Lz || cworkLayout();
  return { x: Lz.ox + (c + 0.5) * Lz.cs, y: Lz.oy + (r + 0.5) * Lz.cs };
}
function cworkPegPos(c, r, Lz) {
  Lz = Lz || cworkLayout();
  return { x: Lz.gx + (c + (r % 2) * 0.5) * Lz.gd, y: Lz.gy + r * 0.866 * Lz.gd };
}
function cworkWheelPos(Lz) {
  var W = cwork.W, p;
  Lz = Lz || cworkLayout();
  p = cworkCell(0, W ? W.exit.r : 1, Lz);
  return { x: p.x - Lz.cs * 0.95, y: p.y, s: Lz.cs * 0.36 };
}
function cworkSpoutPos(Lz) {
  var W = cwork.W, R = cwork.R || CWORK_ROUNDS[0], p;
  Lz = Lz || cworkLayout();
  p = cworkCell(R.cols - 1, W ? W.src.r : 0, Lz);
  return { x: p.x + Lz.cs * 0.95, y: p.y };
}

// ---------- Arvonta: vesi ----------
// Reitti lähteestä (itäreuna) vesirattaaseen (länsireuna) tasan len palaa.
// Ruudukko on kaksijakoinen, joten pituuden pariteetti määräytyy päistä.
function cworkWaterPath(R, rs, re, len) {
  var path = [], used = {}, budget = 6000, ec = 0, er = re;
  function md(c, r) { return Math.abs(c - ec) + Math.abs(r - er); }
  function dfs(c, r) {
    var dirs, i, d, nc, nr, left;
    if (--budget < 0) return false;
    path.push({ c: c, r: r });
    used[cworkKey(c, r)] = true;
    if (path.length === len) {
      if (c === ec && r === er) return true;
    } else if (!(c === ec && r === er)) {
      dirs = shuffleNums([0, 1, 2, 3]);
      left = len - path.length - 1;
      for (i = 0; i < 4; i++) {
        d = dirs[i];
        nc = c + CHUTE_DIRS[d][0]; nr = r + CHUTE_DIRS[d][1];
        if (nc < 0 || nr < 0 || nc >= R.cols || nr >= R.rows || used[cworkKey(nc, nr)]) continue;
        if (md(nc, nr) > left || (left - md(nc, nr)) % 2) continue;
        if (dfs(nc, nr)) return true;
      }
    }
    path.pop();
    delete used[cworkKey(c, r)];
    return false;
  }
  return dfs(R.cols - 1, rs) ? path : null;
}
function cworkDirTo(a, b) {
  var d;
  for (d = 0; d < 4; d++) if (a.c + CHUTE_DIRS[d][0] === b.c && a.r + CHUTE_DIRS[d][1] === b.r) return d;
  return -1;
}
function cworkTryWater(R) {
  var rs = cworkRandInt(0, R.rows - 1), re = cworkRandInt(0, R.rows - 1), base = R.cols + Math.abs(rs - re);
  var opts = [], len, path, mask = {}, i, k, c, r, key, free = [], kinds = {}, tiles = [], par = 0, t;
  for (len = R.len[0]; len <= R.len[1]; len++) if (len >= base && (len - base) % 2 === 0) opts.push(len);
  if (!opts.length) return null;
  len = cworkPick(opts);
  path = cworkWaterPath(R, rs, re, len);
  if (!path) return null;
  for (i = 0; i < path.length; i++) {
    k = 0;
    if (i > 0) k |= chuteBit(cworkDirTo(path[i], path[i - 1]));
    if (i < path.length - 1) k |= chuteBit(cworkDirTo(path[i], path[i + 1]));
    if (i === 0) k |= chuteBit(1);                    // lähde idästä
    if (i === path.length - 1) k |= chuteBit(3);      // vesiratas lännessä
    if (k === 15) return null;
    mask[cworkKey(path[i].c, path[i].r)] = k;
  }
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) if (mask[cworkKey(c, r)] === undefined) free.push({ c: c, r: r });
  shuffleNums(free);
  for (i = 0; i < free.length; i++) {
    key = cworkKey(free[i].c, free[i].r);
    if (i < R.rocks) kinds[key] = 'rock';
    else if (i < R.rocks + R.decoys) kinds[key] = Math.random() < 0.45 ? 'corner' : (Math.random() < 0.6 ? 'straight' : 'tee');
    else kinds[key] = 'empty';
  }
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) {
    key = cworkKey(c, r);
    t = { c: c, r: r, kind: 'empty', mask: 0, want: -1, rotA: 0, wig: 0, fill: 0 };
    if (mask[key] !== undefined) {
      t.kind = 'pipe'; t.want = mask[key];
      t.mask = chuteRotN(t.want, cworkRandInt(0, 3));
      par += chuteRotNeed(t.mask, t.want);
    } else if (kinds[key] === 'rock') {
      t.kind = 'rock';
    } else if (kinds[key] !== 'empty') {
      t.kind = 'pipe';
      t.mask = chuteRotN(kinds[key] === 'corner' ? 3 : kinds[key] === 'straight' ? 5 : 7, cworkRandInt(0, 3));
    }
    tiles.push(t);
  }
  if (par < R.par) return null;
  return { src: { c: R.cols - 1, r: rs }, exit: { c: 0, r: re }, path: path, tiles: tiles, par: par, cols: R.cols, rows: R.rows };
}
function cworkGenWater(R) {
  var i, W;
  for (i = 0; i < 3000; i++) {
    W = cworkTryWater(R);
    if (W) return W;
  }
  return null;
}

// ---------- Arvonta: rattaat ----------
// Indusoitu polku (mikään ratas ei koske muita kuin naapureitaan ketjussa)
// moottorista kellorattaaseen tasan L askeleella.
function cworkGearPath(Rg, motor, target, L) {
  var dist = {}, q = [target], s, n, i, k, path = [motor], on = {}, budget = 20000;
  dist[cworkKey(target.c, target.r)] = 0;
  while (q.length) {
    s = q.shift();
    n = gearNbrs(Rg, s.c, s.r);
    for (i = 0; i < n.length; i++) {
      k = cworkKey(n[i].c, n[i].r);
      if (dist[k] === undefined) { dist[k] = dist[cworkKey(s.c, s.r)] + 1; q.push(n[i]); }
    }
  }
  on[cworkKey(motor.c, motor.r)] = 0;
  function onlyLast(p) {
    var nb = gearNbrs(Rg, p.c, p.r), j, idx;
    for (j = 0; j < nb.length; j++) {
      idx = on[cworkKey(nb[j].c, nb[j].r)];
      if (idx !== undefined && idx !== path.length - 1) return false;
    }
    return true;
  }
  function dfs() {
    var cur = path[path.length - 1], steps = path.length - 1, nb, j, p, pk, isT;
    if (--budget < 0) return false;
    if (steps === L) return cur.c === target.c && cur.r === target.r;
    if (cur.c === target.c && cur.r === target.r) return false;
    nb = shuffleNums(gearNbrs(Rg, cur.c, cur.r));
    for (j = 0; j < nb.length; j++) {
      p = nb[j]; pk = cworkKey(p.c, p.r);
      isT = p.c === target.c && p.r === target.r;
      if (on[pk] !== undefined || dist[pk] > L - steps - 1) continue;
      if (isT && steps + 1 !== L) continue;
      if (!onlyLast(p)) continue;
      on[pk] = path.length;
      path.push({ c: p.c, r: p.r });
      if (dfs()) return true;
      path.pop();
      delete on[pk];
    }
    return false;
  }
  return dfs() ? path : null;
}
function cworkTryGears(R) {
  var Rg = { cols: R.gcols, rows: CWORK_GROWS }, motor = { c: 0, r: CWORK_GROWS - 1 };
  var target = { c: R.gcols - 1, r: cworkPick(R.trows) }, path, onPath = {}, free = [], broken = {}, i, k, sd, mids, bolted = [];
  path = cworkGearPath(Rg, motor, target, R.glen);
  if (!path) return null;
  for (i = 0; i < path.length; i++) onPath[cworkKey(path[i].c, path[i].r)] = true;
  for (k = 0; k < CWORK_GROWS; k++) for (i = 0; i < R.gcols; i++) if (!onPath[cworkKey(i, k)]) free.push({ c: i, r: k });
  shuffleNums(free);
  for (i = 0; i < R.broken && i < free.length; i++) broken[cworkKey(free[i].c, free[i].r)] = true;
  // Ansa: lyhin reitti (rikkinäiset ohittaen) antaa väärän suunnan; muuten oikean
  sd = gearShortest(Rg, broken, motor, target);
  if (sd < 0) return null;
  if (R.trick ? sd % 2 === 0 : sd % 2 !== 0) return null;
  mids = shuffleNums(path.slice(1, path.length - 1));
  for (i = 0; i < R.bolted && i < mids.length; i++) bolted.push({ c: mids[i].c, r: mids[i].r });
  return {
    Rg: Rg, motor: motor, target: target, path: path, broken: broken, bolted: bolted,
    count: path.length - 2 - bolted.length + R.spare, shortest: sd
  };
}
function cworkGenGears(R) {
  var i, G;
  for (i = 0; i < 3000; i++) {
    G = cworkTryGears(R);
    if (G) return G;
  }
  return null;
}

// ---------- Arvonta: kortit ----------
// Kierroksen ajat: eri tunnit; puolien kierroksella ainakin yksi :30, varttien ainakin yksi :15/:45
function cworkMakeCards(R) {
  var tries, out, hours, i, m, ok, mins = R.step === 60 ? [0] : R.step === 30 ? [0, 30] : [0, 15, 30, 45];
  for (tries = 0; tries < 200; tries++) {
    out = []; hours = shuffleNums([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    ok = R.step === 60;
    for (i = 0; i < R.hits; i++) {
      m = cworkPick(mins);
      if (R.step === 30 && m === 30) ok = true;
      if (R.step === 15 && (m === 15 || m === 45)) ok = true;
      out.push({ tm: (hours[i] % 12) * 60 + m });
    }
    if (ok) return out;
  }
  return out;
}
// Ajoituksen tuomio: ds = sekunteja kortin ajasta (negatiivinen = aikaisin)
function cworkJudge(ds) {
  if (ds < -CWORK_EARLY) return 'early';
  if (ds > CWORK_LATE) return 'late';
  return 'hit';
}
function cworkSpeed(R) { return 60 / (R || cwork.R).sph; }   // minuuttia sekunnissa

// ---------- Virtaus ----------
function cworkTile(c, r) {
  var W = cwork.W;
  return W && c >= 0 && r >= 0 && c < W.cols && r < W.rows ? cwork.tiles[r * W.cols + c] : null;
}
function cworkEvalFlow() {
  var W = cwork.W, q = [], wet = {}, leaks = [], wheel = false, s, t, d, nt, nc, nr, si;
  t = cworkTile(W.src.c, W.src.r);
  if (!t || t.kind !== 'pipe' || !(t.mask & chuteBit(1))) return { wet: wet, leaks: [{ c: W.src.c, r: W.src.r, d: 1, src: true }], wheel: false };
  wet[cworkKey(t.c, t.r)] = { from: -1 };
  q.push(t);
  while (q.length) {
    s = q.shift();
    si = s.r * W.cols + s.c;
    for (d = 0; d < 4; d++) {
      if (!(s.mask & chuteBit(d))) continue;
      if (s.c === W.src.c && s.r === W.src.r && d === 1) continue;
      nc = s.c + CHUTE_DIRS[d][0]; nr = s.r + CHUTE_DIRS[d][1];
      nt = cworkTile(nc, nr);
      if (!nt) {
        if (s.c === W.exit.c && s.r === W.exit.r && d === 3) wheel = true;
        else leaks.push({ c: s.c, r: s.r, d: d });
        continue;
      }
      if (nt.kind !== 'pipe' || !(nt.mask & chuteBit(chuteOpp(d)))) { leaks.push({ c: s.c, r: s.r, d: d }); continue; }
      if (wet[cworkKey(nc, nr)]) continue;
      wet[cworkKey(nc, nr)] = { from: si };
      q.push(nt);
    }
  }
  return { wet: wet, leaks: leaks, wheel: wheel };
}

// ---------- Rattaiden verkko ----------
function cworkNodeAt(c, r) {
  var G = cwork.G, i, it;
  if (G.motor.c === c && G.motor.r === r) return 'motor';
  if (G.target.c === c && G.target.r === r) return 'target';
  for (i = 0; i < G.bolted.length; i++) if (G.bolted[i].c === c && G.bolted[i].r === r) return 'bolted';
  for (i = 0; i < cwork.items.length; i++) {
    it = cwork.items[i];
    if (it.peg && it.peg.c === c && it.peg.r === r && it !== cwork.drag) return 'gear';
  }
  return null;
}
// Leveyshaku moottorista: suunnat vuorottelevat, ristiriita = jumi. Moottori
// pyörii vain, kun vesi pyörittää vesiratasta.
function cworkEvalNet() {
  var G = cwork.G, dir = {}, depth = {}, q = [G.motor], jam = false, s, n, i, k, sk;
  if (!cwork.wheel.on) return { dir: dir, depth: depth, jam: false, target: 0 };
  dir[cworkKey(G.motor.c, G.motor.r)] = 1;
  depth[cworkKey(G.motor.c, G.motor.r)] = 0;
  while (q.length) {
    s = q.shift();
    sk = cworkKey(s.c, s.r);
    n = gearNbrs(G.Rg, s.c, s.r);
    for (i = 0; i < n.length; i++) {
      if (!cworkNodeAt(n[i].c, n[i].r)) continue;
      k = cworkKey(n[i].c, n[i].r);
      if (dir[k] === undefined) { dir[k] = -dir[sk]; depth[k] = depth[sk] + 1; q.push(n[i]); }
      else if (dir[k] === dir[sk]) jam = true;
    }
  }
  return { dir: dir, depth: depth, jam: jam, target: jam ? 0 : (dir[cworkKey(G.target.c, G.target.r)] || 0) };
}
function cworkRefreshNet() {
  var was = cwork.net, d;
  cwork.net = cworkEvalNet();
  if (cwork.phase !== 'gears') return;
  if (cwork.net.jam && !(was && was.jam)) {
    cwork.jamT = 0.6;
    artShakeStart(viewH * 0.006, 0.3);
    playNote(140, 0, 0.3, 'sawtooth', 0.15);
    playNote(120, 0.15, 0.3, 'sawtooth', 0.12);
  }
  d = cwork.net.target;
  if (d !== 0 && (!was || was.target !== d)) {
    if (d > 0) { playNote(784, 0, 0.12, 'triangle', 0.3); playNote(1047, 0.1, 0.2, 'triangle', 0.3); }
    else { playNote(300, 0, 0.25, 'square', 0.1); playNote(250, 0.2, 0.3, 'square', 0.1); artShakeStart(viewH * 0.008, 0.4); }
  }
}

// ---------- Kierros ----------
function cworkStartRound() {
  var R = CWORK_ROUNDS[cwork.round], i;
  cwork.R = R;
  cwork.W = cworkGenWater(R);
  cwork.tiles = cwork.W.tiles;
  cwork.G = cworkGenGears(R);
  cwork.items = [];
  cwork.drag = null;
  cwork.flow = null;
  cwork.net = null;
  cwork.okT = 0;
  cwork.gearOkT = 0;
  cwork.wheel = { ang: cwork.wheel.ang, spin: 0, on: false };
  cwork.phase = 'water';
  cwork.wait = 0;
  cwork.flawless = true;
  cwork.state = 'play';
  cwork.t = 0;
  cwork.hintT = 0;
  cwork.cards = [];
  cwork.ci = 0;
  cwork.sub = 'idle';
  cwork.strike = null;
  cwork.cloud = null;
  cwork.cloudsLeft = R.cloud;
  cwork.cloudT = 3 + Math.random() * 2;
  for (i = 0; i < cwork.tiles.length; i++) { cwork.tiles[i].fill = 0; cwork.tiles[i].wig = 0; }
  cwork.flow = cworkEvalFlow();
  renderBackground();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}
function cworkWaterDone() {
  var p = cworkWheelPos(), i, mel = [659, 784, 988, 1175];
  cwork.phase = 'gears';
  cwork.wait = 0.9;
  cwork.hintT = 0;
  if (cwork.cloud) cworkCloudFlee();
  artPop(p.x, p.y, p.s * 2.5, '#7fd4ff', 'ring');
  spawnSparkles(p.x, p.y, 16, '#bfeaff');
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.1, 0.22, 'triangle', 0.3);
  cwork.tonttu.cheer = 1.2;
  // Rattaat laatikkoon
  for (i = 0; i < cwork.G.count; i++) cwork.items.push({ slot: i, peg: null, x: 0, y: 0, back: null, appear: -0.6 - i * 0.08, pop: 0 });
  for (i = 0; i < cwork.items.length; i++) cworkHome(cwork.items[i], true);
  cworkRefreshNet();
}
function cworkGearsDone() {
  var Lz = cworkLayout(), p = cworkPegPos(cwork.G.target.c, cwork.G.target.r, Lz), i, mel = [784, 988, 1175, 1319];
  cwork.phase = 'clock';
  cwork.wait = 0.9;
  cwork.hintT = 0;
  artPop(p.x, p.y, Lz.gd, '#ffd24f', 'ring');
  spawnSparkles(p.x, p.y, 16, '#ffe27a');
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.1, 0.22, 'triangle', 0.3);
  cwork.tonttu.cheer = 1.2;
  cworkClockStart();
}
// Viisarivaihe alusta (myös tarkistuspiste, kun sydämet loppuvat)
function cworkClockStart() {
  cwork.cards = cworkMakeCards(cwork.R);
  cwork.ci = 0;
  cwork.strike = null;
  cwork.helpGhost = false;
  cworkWindTo(cwork.cards[0].tm - cworkRandInt(CWORK_LEAD[0] / 15, CWORK_LEAD[1] / 15) * 15);
}
// Viisarit kelautuvat lähtöaikaan (kortin aikaa edeltävä)
function cworkWindTo(start) {
  cwork.sub = 'wind';
  cwork.windFrom = cwork.disp;
  cwork.tm = start;
  cwork.windT = 0;
  cwork.tickQ = Math.floor(start / 15);
  playNote(600, 0, 0.08, 'square', 0.06);
  playNote(500, 0.1, 0.08, 'square', 0.06);
  playNote(400, 0.2, 0.08, 'square', 0.06);
}
function cworkRoundDone() {
  var i, mel = [659, 784, 988, 1175, 1319], Lz = cworkLayout();
  cwork.state = 'roundDone';
  cwork.t = 0;
  cwork.sub = 'idle';
  cwork.gold[cwork.round] = cwork.flawless;
  artPop(Lz.cx, Lz.cy, Lz.cr * 1.3, '#ffd24f', 'ring');
  spawnSparkles(Lz.cx, Lz.cy, 18, '#ffe27a');
  for (i = 0; i < mel.length; i++) playNote(mel[i], 0.3 + i * 0.12, 0.25, 'triangle', 0.3);
  if (cwork.flawless) playNote(1760, 1.0, 0.3, 'sine', 0.3);
  cwork.tonttu.cheer = 2;
  if (cwork.round === 0 || cwork.round === 1) cwork.taskDelay = 1.6;
}

// ---------- Tornikello ----------
function cworkBong(vol) {
  playNote(330, 0, 1.3, 'sine', vol);
  playNote(660, 0, 0.8, 'sine', vol * 0.35);
  playNote(990, 0.01, 0.4, 'triangle', vol * 0.12);
}
// Jarruvipu: osuma pysäyttää viisarit kortin aikaan ja kello lyö tunnit
function cworkBrake() {
  var cd, ds, res;
  if (cwork.lever > 0.25) return;
  cwork.lever = 0.45;
  playNote(330, 0, 0.08, 'triangle', 0.25);
  playNote(262, 0.1, 0.1, 'triangle', 0.2);
  if (cwork.sub !== 'run') return;
  cd = cwork.cards[cwork.ci];
  ds = (cwork.tm - cd.tm) / cworkSpeed();
  res = cworkJudge(ds);
  if (res === 'hit') {
    cwork.sub = 'strike';
    cwork.tm = cd.tm;
    cwork.hitAny = true;
    cwork.strike = { n: cuckooHourOf(cd.tm), i: 0, t: 0 };
    cwork.tonttu.hop = 0.4;
    return;
  }
  // Liian aikaisin: jarru luistaa ja kello jatkaa (sydän menee)
  cwork.slipT = 0.6;
  playNote(1400, 0, 0.15, 'sawtooth', 0.06);
  playNote(1250, 0.08, 0.2, 'sawtooth', 0.05);
  cworkMiss();
}
function cworkMiss() {
  if (cwork.R.ghost === 'help') cwork.helpGhost = true;
  if (loseHeart()) cwork.flawless = false;
}
function cworkUpdateClock(dt) {
  var cd = cwork.cards[cwork.ci], st, k, q, n0;
  if (cwork.sub === 'wind') {
    cwork.windT += dt;
    k = easeInOutSine(Math.min(1, cwork.windT / 0.7));
    cwork.disp = cwork.windFrom + (cwork.tm - cwork.windFrom) * k;
    if (cwork.windT >= 0.7) { cwork.disp = cwork.tm; cwork.sub = 'run'; }
    return;
  }
  if (cwork.sub === 'run') {
    cwork.tm += dt * cworkSpeed();
    cwork.disp = cwork.tm;
    // Tikitys vartein, tunnilla matalampi
    q = Math.floor(cwork.tm / 15);
    if (q > cwork.tickQ) {
      cwork.tickQ = q;
      if (q % 4 === 0) playNote(700, 0, 0.05, 'square', 0.06);
      else playNote(1200, 0, 0.03, 'square', 0.04);
    }
    if (cworkJudge((cwork.tm - cd.tm) / cworkSpeed()) === 'late') {
      // Kello ehti ohi: sydän menee ja viisarit kelautuvat uuteen yritykseen
      n0 = cwork.resets;
      playNote(196, 0, 0.3, 'triangle', 0.25);
      cworkMiss();
      if (cwork.resets !== n0) return;
      cworkWindTo(cd.tm - cworkRandInt(CWORK_LEAD[0] / 15, CWORK_LEAD[1] / 15) * 15);
    }
    return;
  }
  if (cwork.sub === 'strike') {
    st = cwork.strike;
    cwork.disp += (cwork.tm - cwork.disp) * Math.min(1, dt * 20);
    st.t += dt;
    if (st.i < st.n && st.t >= 0.3 + st.i * CWORK_GAP) {
      st.i++;
      cworkBong(0.35);
      cwork.countPop = 0.3;
      cwork.bellSwing = 0.5;
    }
    if (st.t >= 0.3 + (st.n - 1) * CWORK_GAP + 1.0) {
      cwork.ci++;
      cwork.strike = null;
      cwork.helpGhost = false;
      if (cwork.ci >= cwork.R.hits) {
        cwork.sub = 'idle';
        if (cwork.round >= CWORK_ROUNDS.length - 1) cworkWin();
        else cworkRoundDone();
      } else {
        cworkWindTo(cwork.cards[cwork.ci].tm - cworkRandInt(CWORK_LEAD[0] / 15, CWORK_LEAD[1] / 15) * 15);
      }
    }
  }
}
function cworkWin() {
  cwork.gold[cwork.round] = cwork.flawless;
  cwork.state = 'won';
  cwork.t = 0;
  cwork.wonT = 0;
  cwork.tonttu.cheer = 5;
}

// ---------- Myrskypilvi ----------
// Lennähtää vesivaiheessa kourupalan ylle; napautus häätää sen ennen kuin se
// kääntää palan. Kohde on mieluiten jo oikein oleva reittipala.
function cworkCloudSpawn() {
  var cand = [], i, t, Lz = cworkLayout();
  for (i = 0; i < cwork.tiles.length; i++) {
    t = cwork.tiles[i];
    if (t.kind === 'pipe' && t.want >= 0 && t.mask === t.want) cand.push(t);
  }
  if (!cand.length) for (i = 0; i < cwork.tiles.length; i++) if (cwork.tiles[i].want >= 0) cand.push(cwork.tiles[i]);
  t = cworkPick(cand);
  cwork.cloud = { tile: t, t: 0, x: Lz.X0 + Lz.S * 0.6, y: -viewH * 0.1, mode: 'come', flee: 0 };
  playNote(110, 0, 0.6, 'sawtooth', 0.12);
  playNote(98, 0.3, 0.6, 'sawtooth', 0.1);
}
function cworkCloudFlee() {
  var cl = cwork.cloud;
  if (!cl || cl.mode === 'flee') return;
  cl.mode = 'flee';
  cl.t = 0;
  artPop(cl.x, cl.y, viewH * 0.06, '#c8c8e0', 'ring');
  spawnSparkles(cl.x, cl.y, 8, '#e0e0f0');
  playNote(880, 0, 0.08, 'sine', 0.2);
  playNote(1175, 0.08, 0.12, 'sine', 0.2);
}
function cworkUpdateCloud(dt) {
  var cl = cwork.cloud, Lz, p, k, tx, ty;
  if (!cl) {
    if (cwork.phase === 'water' && cwork.wait <= 0 && cwork.cloudsLeft > 0) {
      cwork.cloudT -= dt;
      if (cwork.cloudT <= 0) { cwork.cloudsLeft--; cworkCloudSpawn(); }
    }
    return;
  }
  Lz = cworkLayout();
  p = cworkCell(cl.tile.c, cl.tile.r, Lz);
  tx = p.x; ty = p.y - Lz.cs * 0.55;
  cl.t += dt;
  if (cl.mode === 'come') {
    k = Math.min(1, dt * 2.2);
    cl.x += (tx - cl.x) * k;
    cl.y += (ty - cl.y) * k;
    if (cl.t > 1.6) { cl.mode = 'hover'; cl.t = 0; playNote(150, 0, 0.5, 'sawtooth', 0.1); }
  } else if (cl.mode === 'hover') {
    cl.x = tx + Math.sin(cl.t * 9) * Lz.cs * 0.03;
    cl.y = ty;
    if (cl.t > 1.6) {
      // Salama kääntää palan
      cl.tile.mask = chuteRot(cl.tile.mask);
      cl.tile.rotA = -Math.PI / 2;
      cl.tile.wig = 0.3;
      spawnSparkles(p.x, p.y, 12, '#fff27a');
      artShakeStart(viewH * 0.005, 0.25);
      playNote(1600, 0, 0.06, 'square', 0.1);
      playNote(220, 0.05, 0.3, 'sawtooth', 0.15);
      cwork.flow = cworkEvalFlow();
      cl.mode = 'leave';
      cl.t = 0;
    }
  } else {
    cl.y -= viewH * (cl.mode === 'flee' ? 1.4 : 0.6) * dt;
    cl.x += viewW * 0.15 * dt;
    if (cl.t > 1.4) {
      cwork.cloud = null;
      cwork.cloudT = 6 + Math.random() * 4;
    }
  }
}

// ---------- Alustus ----------
function initClockwork() {
  var i;
  tasks = [makeTask(-5, 'clock'), makeTask(-5, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  cwork.round = 0;
  cwork.state = 'intro';
  cwork.t = 0;
  cwork.R = CWORK_ROUNDS[0];
  cwork.W = null;
  cwork.G = null;
  cwork.tiles = [];
  cwork.items = [];
  cwork.drag = null;
  cwork.gold = [];
  cwork.taskDelay = -1;
  cwork.tapped = false;
  cwork.placed = false;
  cwork.hitAny = false;
  cwork.tm = 7 * 60 + 40;      // pysähtynyt kello
  cwork.disp = cwork.tm;
  cwork.sub = 'idle';
  cwork.cloud = null;
  cwork.lever = 0;
  cwork.slipT = 0;
  cwork.bellSwing = 0;
  cwork.resets = 0;
  cwork.tonttu = { blink: 0, hop: 0, cheer: 0 };
  cworkSetupProps();
  renderBackground();
  playNote(196, 0, 0.4, 'sawtooth', 0.1);
  playNote(147, 0.25, 0.5, 'sawtooth', 0.1);
}
function respawnClockwork() {
  // Sydämet loppu: saman kierroksen viisarivaihe alusta (vesi ja rattaat säilyvät)
  cwork.resets++;
  if (cwork.state === 'play' && cwork.phase === 'clock') {
    cwork.wait = 0.4;
    cworkClockStart();
  }
}
function resizeClockwork() {
  var i;
  camX = 0;
  for (i = 0; i < cwork.items.length; i++) cworkHome(cwork.items[i], true);
  cworkSetupProps();
}

// Tökättävät koristeet: tornin kello kellotapulissa (kilahtaa ja heilahtaa;
// joka viides tökkäys: Käkikellon käki kurkistaa tapulista ja kukkuu), kyyhky
// tornin räystäällä (lehahtaa ja kuhertaa) ja koristeratas tornin juurella
// (pyörähtää). Ne ovat kellotaulun, kyltin ja vivun osuma-alueiden ulkopuolella.
function cworkSetupProps() {
  var Lz = cworkLayout(), S = Lz.S;
  propsReset();
  propAdd({
    x: Lz.cx, y: Lz.Y0 + 0.15 * S, r: 0.045 * S, hy: 0.04 * S, color: '#ffd24f', note: 1319, amp: 0.25, birdT: 0,
    update: function (p, dt) { if (p.birdT > 0) p.birdT -= dt; },
    draw: function (c, p) {
      var s = 0.03 * S, sw = Math.sin(globalT * 7) * Math.max(0, cwork.bellSwing || 0) * 0.6, k;
      if (p.birdT > 0) {
        k = Math.min(1, (2.4 - p.birdT) * 4, p.birdT * 3);
        cuckooDrawBird(c, -s * 0.2 - k * s * 1.2, -s * 1.3, s * 0.9 * k + 0.01, p.birdT < 1.6 && p.birdT > 0.6 ? 1 : 0, 0, false);
      }
      c.rotate(sw);
      artCircle(c, 0, -s * 1.85, s * 0.18, '#8a6a10', { line: false });
      c.beginPath();
      c.moveTo(-s * 0.45, -s * 1.7); c.quadraticCurveTo(-s * 0.55, -s * 0.5, -s * 0.95, -s * 0.2);
      c.lineTo(s * 0.95, -s * 0.2); c.quadraticCurveTo(s * 0.55, -s * 0.5, s * 0.45, -s * 1.7); c.closePath();
      artFillPath(c, '#ffd24f', -s * 1.7, -s * 0.2, s, { lineColor: '#8a6a10' });
      artCircle(c, 0, -s * 0.1, s * 0.2, '#8a6a10', { line: false });
    },
    poke: function (p) {
      cworkBong(0.25);
      cwork.bellSwing = 0.8;
      if (p.n % 5 === 0) {
        p.birdT = 2.4;
        playNote(784, 0.5, 0.22, 'sine', 0.3);
        playNote(622, 0.74, 0.32, 'sine', 0.3);
        playNote(784, 1.2, 0.22, 'sine', 0.3);
        playNote(622, 1.44, 0.32, 'sine', 0.3);
      }
    }
  });
  propAdd({
    x: Lz.tx0 - 0.005 * S, y: Lz.Y0 + 0.172 * S, r: 0.045 * S, hy: 0.025 * S, color: '#c8c0e0', note: 523, amp: 0.2, flap: 0,
    update: function (p, dt) { if (p.flap > 0) p.flap -= dt; },
    draw: function (c, p) {
      var s = 0.022 * S, f = p.flap > 0 ? Math.sin(p.flap * 30) * 0.8 : 0, turn = p.n % 2 ? -1 : 1;
      c.scale(turn, 1);
      artBlob(c, s * 0.1, -s * 0.8, s * 1.0, s * 0.7, '#b8b0d0', { lineColor: '#5a5070', hi: 0.25 });
      c.beginPath(); c.moveTo(s * 0.8, -s * 0.9); c.lineTo(s * 1.6, -s * 1.1); c.lineTo(s * 1.5, -s * 0.6); c.closePath();
      artFillPath(c, '#9a92b8', -s * 1.1, -s * 0.6, s * 0.5, { lineColor: '#5a5070' });
      artBlob(c, s * 0.3, -s * 0.9 - f * s * 0.4, s * 0.6, s * 0.3, '#a8a0c4', { lineColor: '#5a5070', rot: -0.3 - f });
      artCircle(c, -s * 0.75, -s * 1.45, s * 0.45, '#b8b0d0', { lineColor: '#5a5070', hi: 0.3 });
      artBlob(c, -s * 0.5, -s * 1.0, s * 0.3, s * 0.2, '#8fd0b0', { line: false, alpha: 0.7 });
      artEye(c, -s * 0.85, -s * 1.55, s * 0.12, -0.5, (globalT % 3.7) < 0.12);
      c.beginPath(); c.moveTo(-s * 1.15, -s * 1.5); c.lineTo(-s * 1.5, -s * 1.38); c.lineTo(-s * 1.15, -s * 1.3); c.closePath();
      artFillPath(c, '#ff9a6a', -s * 1.5, -s * 1.3, s * 0.2, { lineColor: '#a0502a' });
    },
    poke: function (p) {
      p.flap = 0.7;
      playNote(330, 0.05, 0.18, 'sine', 0.2);
      playNote(294, 0.25, 0.25, 'sine', 0.18);
    }
  });
  propAdd({
    x: Lz.cx + 0.125 * S, y: Lz.Y0 + 0.93 * S, r: 0.05 * S, hy: 0, color: '#ffd24f', note: 1175, amp: 0.05, ang: 0.3, spin: 0,
    update: function (p, dt) { p.ang += p.spin * dt; p.spin *= Math.max(0, 1 - dt * 1.6); },
    draw: function (c, p) { gearDrawWheel(c, 0, 0, 0.032 * S, p.ang, '#d9b070', 8); },
    poke: function (p) {
      p.spin = (p.n % 2 ? 1 : -1) * 8;
      playNote(1568, 0.05, 0.25, 'sine', 0.2);
    }
  });
}

// ---------- Syöte ----------
function cworkInBrakeArea(px, py, Lz) {
  var cd = Lz.card;
  if (Math.hypot(px - Lz.cx, py - Lz.cy) < Lz.cr) return true;
  if (Math.hypot(px - Lz.lever.x, py - Lz.lever.y) < Lz.lever.r) return true;
  return Math.abs(px - cd.x) < cd.w / 2 && Math.abs(py - cd.y) < cd.h / 2;
}
function handleClockworkTap(px, py) {
  var Lz, i, it, d, best = null, bd, r, c, t, cl;
  if (puzzleBusy() || celebrating) return;
  Lz = cworkLayout();
  if (cwork.state !== 'play') {
    if (!cworkTapTonttu(px, py, Lz)) propsTap(px, py);
    return;
  }
  // Myrskypilvi päällimmäisenä
  cl = cwork.cloud;
  if (cl && (cl.mode === 'come' || cl.mode === 'hover') && Math.hypot(px - cl.x, py - cl.y) < Lz.cs * 0.75) { cworkCloudFlee(); return; }
  // Viisarivaiheessa kellotaulu, kyltti ja vipu ovat jarru
  if (cworkInBrakeArea(px, py, Lz)) {
    if (cwork.phase === 'clock' && cwork.wait <= 0) cworkBrake();
    else { cwork.lever = 0.2; playNote(196, 0, 0.1, 'triangle', 0.15); }
    return;
  }
  // Rattaat
  if (cwork.phase === 'gears' && cwork.wait <= 0) {
    r = Lz.gd * 0.55;
    bd = 1e9;
    for (i = 0; i < cwork.items.length; i++) {
      it = cwork.items[i];
      if (it.back || it.appear < 1) continue;
      d = Math.hypot(px - it.x, py - it.y);
      if (d < r && d < bd) { bd = d; best = it; }
    }
    if (best) {
      cwork.drag = best;
      if (best.peg) { best.peg = null; cworkRefreshNet(); }
      playNote(880, 0, 0.08, 'sine', 0.2);
      return;
    }
  }
  // Kourupalat
  c = Math.floor((px - Lz.ox) / Lz.cs);
  r = Math.floor((py - Lz.oy) / Lz.cs);
  t = cworkTile(c, r);
  if (t) {
    if (cwork.phase === 'water' && cwork.wait <= 0 && t.kind === 'pipe') {
      cwork.tapped = true;
      t.mask = chuteRot(t.mask);
      t.rotA = -Math.PI / 2;
      playNote(520 + (r * 3 + c) % 5 * 40, 0, 0.07, 'triangle', 0.25);
      cwork.flow = cworkEvalFlow();
    } else {
      t.wig = 0.35;
      playNote(t.kind === 'rock' ? 180 : 330, 0, 0.1, 'triangle', 0.18);
    }
    return;
  }
  if (cworkTapTonttu(px, py, Lz)) return;
  propsTap(px, py);
}
function cworkTapTonttu(px, py, Lz) {
  var T = Lz.tont;
  if (Math.hypot(px - T.x, py - (T.y - T.s * 1.0)) > T.s * 1.1) return false;
  cwork.tonttu.blink = 0.5;
  cwork.tonttu.hop = 0.4;
  playNote(660, 0, 0.1, 'triangle', 0.25);
  playNote(880, 0.1, 0.12, 'triangle', 0.25);
  return true;
}
function cworkSlotPos(i) {
  var Lz = cworkLayout(), n = cwork.items.length, gap = Math.min(Lz.S * 0.1, (Lz.trayX1 - Lz.trayX0) / Math.max(1, n));
  return { x: (Lz.trayX0 + Lz.trayX1) / 2 + (i - (n - 1) / 2) * gap, y: Lz.trayY };
}
function cworkHome(it, snap) {
  var p = it.peg ? cworkPegPos(it.peg.c, it.peg.r) : cworkSlotPos(it.slot);
  it.hx = p.x; it.hy = p.y;
  if (snap) { it.x = p.x; it.y = p.y; }
}
function cworkDrop(it) {
  var G = cwork.G, Lz = cworkLayout(), best = null, bd = Lz.gd * 0.55, c, r, p, d;
  for (r = 0; r < CWORK_GROWS; r++) for (c = 0; c < G.Rg.cols; c++) {
    if (G.broken[cworkKey(c, r)] || cworkNodeAt(c, r)) continue;
    p = cworkPegPos(c, r, Lz);
    d = Math.hypot(it.x - p.x, it.y - p.y);
    if (d < bd) { bd = d; best = { c: c, r: r }; }
  }
  if (best) {
    it.peg = best;
    it.pop = 0.25;
    cwork.placed = true;
    cworkHome(it);
    playNote(700, 0, 0.08, 'triangle', 0.25);
    cworkRefreshNet();
  } else {
    it.peg = null;
    cworkHome(it);
    it.back = { x0: it.x, y0: it.y, t: 0 };
  }
}

// ---------- Päivitys ----------
function updateClockwork(dt) {
  var busy, i, t, w, f, it, k, src, on, Lz, gr;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  if (cwork.tonttu.blink > 0) cwork.tonttu.blink -= dt;
  if (cwork.tonttu.hop > 0) cwork.tonttu.hop -= dt;
  if (cwork.tonttu.cheer > 0) cwork.tonttu.cheer -= dt;
  if (cwork.lever > 0) cwork.lever -= dt;
  if (cwork.slipT > 0) cwork.slipT -= dt;
  if (cwork.countPop > 0) cwork.countPop -= dt;
  if (cwork.bellSwing > 0) cwork.bellSwing -= dt;
  if (cwork.jamT > 0) cwork.jamT -= dt;
  if (cwork.taskDelay > 0 && !busy) {
    cwork.taskDelay -= dt;
    if (cwork.taskDelay <= 0) {
      if (cwork.round === 0 && !tasks[0].opened) taskStart(tasks[0]);
      else if (cwork.round === 1 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Raahaus
  if (cwork.drag) {
    it = cwork.drag;
    Lz = cworkLayout();
    if (holding && !busy && cwork.phase === 'gears') {
      it.x += (lastPX - it.x) * Math.min(1, dt * 18);
      it.y += (lastPY - Lz.gd * 0.3 - it.y) * Math.min(1, dt * 18);
    } else {
      cwork.drag = null;
      cworkDrop(it);
    }
  }
  for (i = 0; i < cwork.items.length; i++) {
    it = cwork.items[i];
    it.appear = Math.min(1, it.appear + dt * 2.5);
    if (it.pop > 0) it.pop -= dt;
    if (it === cwork.drag) continue;
    if (it.back) {
      it.back.t += dt;
      k = easeOutCubic(Math.min(1, it.back.t / 0.4));
      it.x = it.back.x0 + (it.hx - it.back.x0) * k;
      it.y = it.back.y0 + (it.hy - it.back.y0) * k - Math.sin(k * Math.PI) * viewH * 0.05;
      if (it.back.t >= 0.4) it.back = null;
    } else {
      cworkHome(it);
      it.x += (it.hx - it.x) * Math.min(1, dt * 14);
      it.y += (it.hy - it.y) * Math.min(1, dt * 14);
    }
  }
  // Vesi täyttyy pala kerrallaan; vesiratas pyörii, kun vesi yltää siihen
  f = cwork.flow;
  for (i = 0; i < cwork.tiles.length; i++) {
    t = cwork.tiles[i];
    if (t.rotA < 0) t.rotA = Math.min(0, t.rotA + dt * 14);
    if (t.wig > 0) t.wig -= dt;
    w = f && f.wet[cworkKey(t.c, t.r)];
    if (w) {
      src = w.from === -1 ? null : cwork.tiles[w.from];
      if (!src || src.fill >= 1) t.fill = Math.min(1, t.fill + dt * CWORK_FILL);
    } else {
      t.fill = Math.max(0, t.fill - dt * CWORK_FILL * 1.5);
    }
  }
  on = !!(f && f.wheel && cwork.W && cworkTile(cwork.W.exit.c, cwork.W.exit.r).fill >= 1);
  if (on !== cwork.wheel.on) {
    cwork.wheel.on = on;
    if (on) { playNote(784, 0, 0.08, 'sine', 0.15); playNote(988, 0.08, 0.1, 'sine', 0.15); }
    if (cwork.G) cworkRefreshNet();
  }
  cwork.wheel.spin += ((on ? 1 : 0) - cwork.wheel.spin) * Math.min(1, dt * 3);
  cwork.wheel.ang += cwork.wheel.spin * dt * 3;
  if (cwork.net && !cwork.net.jam && cwork.wheel.on) cwork.netT += dt * (cwork.state === 'won' ? 2.5 : 1);
  if (busy || celebrating) return;
  cwork.t += dt;
  if (cwork.state === 'intro') { if (cwork.t > 0.8) cworkStartRound(); return; }
  if (cwork.state === 'roundDone') {
    if (cwork.t > 2.4 && cwork.taskDelay <= 0) { cwork.round++; cworkStartRound(); }
    return;
  }
  if (cwork.state === 'won') { cworkUpdateWon(dt); return; }
  if (cwork.wait > 0) { cwork.wait -= dt; return; }
  cwork.hintT += dt;
  if (cwork.phase === 'water') {
    cworkUpdateCloud(dt);
    if (f && f.wheel && on && f.leaks.length === 0) {
      cwork.okT += dt;
      if (cwork.okT > CWORK_WATER_WIN) cworkWaterDone();
    } else {
      cwork.okT = 0;
    }
  } else {
    if (cwork.cloud) cworkUpdateCloud(dt);
    if (cwork.phase === 'gears') {
      // Kello käy kellorattaan suuntaan: taaksepäin pyörivä koneisto ravistaa
      gr = cwork.net ? cwork.net.target : 0;
      if (!cwork.drag) {
        cwork.tm += gr * dt * 12;
        cwork.disp = cwork.tm;
      }
      if (gr < 0) {
        cwork.backT += dt;
        if (cwork.backT > 0.7) {
          cwork.backT = 0;
          artShakeStart(viewH * 0.006, 0.3);
          playNote(260, 0, 0.18, 'square', 0.07);
          playNote(230, 0.12, 0.2, 'square', 0.06);
        }
      } else {
        cwork.backT = 0.5;
      }
      if (gr > 0 && !cwork.drag) {
        cwork.gearOkT += dt;
        if (cwork.gearOkT > CWORK_GEAR_WIN) cworkGearsDone();
      } else {
        cwork.gearOkT = 0;
      }
    } else if (cwork.phase === 'clock') {
      cworkUpdateClock(dt);
    }
  }
}
// Loppu: tornikello lyö pitkään, rattaat kultautuvat, sitten juhla
function cworkUpdateWon(dt) {
  var before = cwork.wonT, i, n = 12, Lz = cworkLayout();
  cwork.wonT += dt;
  cwork.tm += dt * 90;
  cwork.disp = cwork.tm;
  for (i = 0; i < n; i++) {
    var at = 0.3 + i * 0.28;
    if (before < at && cwork.wonT >= at) {
      cworkBong(0.3);
      cwork.bellSwing = 0.5;
      spawnSparkles(Lz.cx + (Math.random() - 0.5) * Lz.cr * 2, Lz.cy + (Math.random() - 0.5) * Lz.cr * 2, 5, '#ffe27a');
    }
  }
  if (before < 3.8 && cwork.wonT >= 3.8) {
    soundFanfare();
    artPop(Lz.cx, Lz.cy, Lz.cr * 1.6, '#ffd24f', 'burst');
  }
  if (cwork.wonT > 4.6 && !celebrating) startCelebration();
}

// ---------- Piirto ----------
function renderClockworkBg(b, w, h) {
  var Lz = cworkLayout(), S = Lz.S, vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x, R = cwork.R || CWORK_ROUNDS[0];
  var cx = Lz.cx, x0 = Lz.tx0, x1 = Lz.tx1, top = Lz.Y0 + 0.17 * S;
  g.addColorStop(0, '#5e4a5a');
  g.addColorStop(1, '#3e2c34');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Lautaseinä
  b.strokeStyle = 'rgba(20,10,15,0.25)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 18; i++) { x = vw * i / 18; b.beginPath(); b.moveTo(x, 0); b.lineTo(x, Lz.floor); b.stroke(); }
  // Leveän ruudun reunoille seinärattaita ja hylly
  if (Lz.X0 > h * 0.08) {
    b.globalAlpha = 0.4;
    gearDrawWheel(b, Lz.X0 * 0.5, h * 0.3, Math.min(Lz.X0 * 0.3, h * 0.07), 0.3, '#d9b070', 9);
    gearDrawWheel(b, Lz.X0 * 0.5 + Math.min(Lz.X0 * 0.3, h * 0.07) * 1.7, h * 0.42, Math.min(Lz.X0 * 0.2, h * 0.045), 0.1, '#c0c8d8', 7);
    gearDrawWheel(b, vw - Lz.X0 * 0.5, h * 0.25, Math.min(Lz.X0 * 0.28, h * 0.06), 0.6, '#e8b84a', 8);
    b.globalAlpha = 1;
    artRoundRect(b, vw - Lz.X0 * 0.85, h * 0.62, Lz.X0 * 0.7, h * 0.018, h * 0.006, '#a87040', { lineColor: '#4a2a10' });
    for (i = 0; i < 3; i++) artRoundRect(b, vw - Lz.X0 * 0.78 + i * Lz.X0 * 0.22, h * 0.56, Lz.X0 * 0.14, h * 0.06, h * 0.012, ['#7fd4ff', '#ff9ec6', '#ffe27a'][i], { lineColor: '#4a3a5a', hi: 0.4, alpha: 0.85 });
  }
  // Lattia
  artRoundRect(b, 0, Lz.floor, vw, h - Lz.floor + 2, 0, '#8a5a30', { shadeTo: '#5a3a1a', line: false });
  // Tappitaulu
  var Rg = { cols: R.gcols }, bx0 = Lz.gx - Lz.gd * 0.75, bx1 = Lz.gx + (Rg.cols - 0.5) * Lz.gd + Lz.gd * 0.75;
  artRoundRect(b, bx0, Lz.gy - Lz.gd * 0.6, bx1 - bx0, (CWORK_GROWS - 1) * 0.866 * Lz.gd + Lz.gd * 1.35, Lz.gd * 0.25, '#c99a62', { shadeTo: '#a87a48', lineColor: '#5a3a1a', hi: 0.15 });
  // Rataslaatikon hylly
  artRoundRect(b, Lz.trayX0 - S * 0.03, Lz.trayY + S * 0.03, Lz.trayX1 - Lz.trayX0 + S * 0.06, S * 0.015, S * 0.006, '#a87040', { lineColor: '#4a2a10' });
  // Kivinen alusta kourupaloille
  artRoundRect(b, Lz.ox - Lz.cs * 0.12, Lz.oy - Lz.cs * 0.12, Lz.cs * (R.cols + 0.24), Lz.cs * (R.rows + 0.24), Lz.cs * 0.2, '#b8a890', { shadeTo: '#8a7a68', lineColor: '#5a4a3a', hi: 0.1 });
  // Torni: runko, katto ja kellotapuli
  artRoundRect(b, x0, top, x1 - x0, Lz.floor - top + S * 0.01, S * 0.02, '#c8b8a8', { shadeTo: '#9a8a7a', lineColor: '#4a3a3a', hi: 0.1 });
  b.strokeStyle = 'rgba(70,50,50,0.25)';
  b.lineWidth = Math.max(1, S * 0.003);
  for (i = 1; i < 12; i++) {
    var yy = top + i * (Lz.floor - top) / 12;
    b.beginPath(); b.moveTo(x0, yy); b.lineTo(x1, yy); b.stroke();
  }
  b.beginPath();
  b.moveTo(x0 - S * 0.025, top + S * 0.005); b.lineTo(cx, Lz.Y0 + 0.04 * S); b.lineTo(x1 + S * 0.025, top + S * 0.005); b.closePath();
  artFillPath(b, '#7a4a6a', Lz.Y0 + 0.04 * S, top, S * 0.2, { lineColor: '#3a1a30' });
  artRoundRect(b, cx - S * 0.045, Lz.Y0 + 0.085 * S, S * 0.09, S * 0.075, S * 0.04, '#2a1420', { lineColor: '#1a0a14' });
  // Kellotaulun kivikehä ja vivun levy
  artCircle(b, cx, Lz.cy, Lz.cr * 1.12, '#a89888', { lineColor: '#4a3a3a', hi: 0.15 });
  artRoundRect(b, Lz.lever.x - S * 0.05, Lz.lever.y - S * 0.02, S * 0.1, S * 0.11, S * 0.02, '#8a7a6a', { lineColor: '#3a2a2a' });
  // Ovi tornin juurella
  artRoundRect(b, cx - S * 0.06, Lz.floor - S * 0.075, S * 0.12, S * 0.085, S * 0.05, '#6a4020', { lineColor: '#2a1408' });
}

// Jarruvipu: kahva kääntyy alas vedettäessä
function cworkDrawLever(c, Lz, glow) {
  var L = Lz.lever, S = Lz.S, px = L.x, py = L.y + S * 0.035, k = cwork.lever > 0 ? Math.sin(Math.min(1, cwork.lever / 0.45) * Math.PI) : 0;
  var a = -Math.PI * 0.62 + k * 1.1, len = S * 0.12, kx = px + Math.cos(a) * len, ky = py + Math.sin(a) * len;
  if (glow) artGlow(c, kx, ky, S * 0.08, '#ffe27a', 0.35 + Math.sin(globalT * 6) * 0.15);
  artLimb(c, px, py, kx, ky, S * 0.022, '#c0c8d8', '#4a5060');
  artCircle(c, kx, ky, S * 0.04, '#e0403a', { lineColor: '#7a1a10', hi: 0.45 });
  artCircle(c, px, py, S * 0.022, '#8a92a8', { lineColor: '#3a4050' });
  if (cwork.slipT > 0) {
    // Jarru luistaa: kipinöitä tornin rattaista
    for (var i = 0; i < 4; i++) artCircle(c, Lz.cx - Lz.cr * 0.9 + Math.random() * Lz.cr * 0.3, Lz.cy + Lz.cr * (0.9 + Math.random() * 0.2), S * 0.006, '#ffe27a', { line: false });
  }
}
function cworkDrawCard(c, Lz, k) {
  var B = Lz.card, cd = cwork.cards[Math.min(cwork.ci, cwork.cards.length - 1)], i, sc = easeOutBack(Math.min(1, k)), n = cwork.R.hits;
  if (!cd) return;
  c.save();
  c.translate(B.x, B.y);
  c.scale(sc, sc);
  artShadow(c, 0, B.h * 0.55, B.w * 0.45, B.h * 0.08, 0.2);
  artRoundRect(c, -B.w / 2, -B.h / 2, B.w, B.h, B.h * 0.18, '#fffaf0', { shadeTo: '#f0e4cc', lineColor: '#8a6a40', hi: 0.1 });
  cuckooDrawDigital(c, cd.tm, 0, -B.h * 0.1, B.h * 0.58);
  // Lyönnit: täytetty kello = jo lyöty
  for (i = 0; i < n; i++) {
    var bx = (i - (n - 1) / 2) * B.h * 0.32, by = B.h * 0.33, done = i < cwork.ci || (i === cwork.ci && cwork.sub === 'strike');
    artCircle(c, bx, by, B.h * 0.09, done ? '#ffd24f' : '#fff6e0', { lineColor: '#8a6a40', alpha: done ? 1 : 0.8 });
  }
  c.restore();
}
function cworkDrawCloud(c, cl, Lz) {
  var s = Lz.cs * 0.38, x = cl.x, y = cl.y, warn = cl.mode === 'hover', a = cl.mode === 'flee' || cl.mode === 'leave' ? Math.max(0, 1 - cl.t / 1.2) : 1;
  c.globalAlpha = a;
  if (warn) {
    // Varjo palan päällä ja latautuva salama
    var p = cworkCell(cl.tile.c, cl.tile.r, Lz);
    artBlob(c, p.x, p.y, Lz.cs * 0.42, Lz.cs * 0.42, '#3a2a5a', { line: false, alpha: 0.18 + cl.t / 1.6 * 0.25 });
    if (Math.sin(globalT * 30) > 0.3 - cl.t / 1.6) {
      c.strokeStyle = '#fff27a';
      c.lineWidth = Math.max(2, s * 0.12);
      c.beginPath(); c.moveTo(x, y + s * 0.5); c.lineTo(x - s * 0.2, y + s * 0.9); c.lineTo(x + s * 0.1, y + s * 0.95); c.lineTo(x - s * 0.1, y + s * 1.35); c.stroke();
    }
  }
  artCircle(c, x - s * 0.6, y + s * 0.1, s * 0.55, '#6a6080', { lineColor: '#2a2040' });
  artCircle(c, x + s * 0.6, y + s * 0.1, s * 0.55, '#6a6080', { lineColor: '#2a2040' });
  artCircle(c, x, y - s * 0.15, s * 0.75, '#7a7090', { lineColor: '#2a2040', hi: 0.2 });
  artEye(c, x - s * 0.25, y - s * 0.1, s * 0.13, 0.3, cl.mode === 'flee');
  artEye(c, x + s * 0.25, y - s * 0.1, s * 0.13, 0.3, cl.mode === 'flee');
  c.strokeStyle = '#2a2040';
  c.lineWidth = Math.max(1.5, s * 0.07);
  c.beginPath(); c.moveTo(x - s * 0.42, y - s * 0.35); c.lineTo(x - s * 0.12, y - s * 0.25); c.moveTo(x + s * 0.42, y - s * 0.35); c.lineTo(x + s * 0.12, y - s * 0.25); c.stroke();
  c.globalAlpha = 1;
}

function drawClockwork() {
  var c = ctx, Lz, S, W = cwork.W, G = cwork.G, i, k, p, q, t, s, f = cwork.flow, it, r, net = cwork.net, gold = cwork.state === 'won';
  if (!beginPlayWorld()) return;
  Lz = cworkLayout();
  S = Lz.S;
  propsDraw(c);
  var wp = cworkWheelPos(Lz), mp = G ? cworkPegPos(G.motor.c, G.motor.r, Lz) : cworkPegPos(0, CWORK_GROWS - 1, Lz);
  r = Lz.gd * 0.5;
  // Hihna vesirattaasta moottorirattaaseen
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = Math.max(2, S * 0.008);
  c.setLineDash([S * 0.012, S * 0.01]);
  c.lineDashOffset = -cwork.wheel.ang * S * 0.02;
  c.beginPath(); c.moveTo(wp.x - S * 0.016, wp.y); c.lineTo(mp.x - S * 0.016, mp.y); c.stroke();
  c.lineDashOffset = cwork.wheel.ang * S * 0.02;
  c.beginPath(); c.moveTo(wp.x + S * 0.016, wp.y); c.lineTo(mp.x + S * 0.016, mp.y); c.stroke();
  c.setLineDash([]);
  // Akseli kellorattaasta tornikelloon
  if (G) {
    p = cworkPegPos(G.target.c, G.target.r, Lz);
    artLimb(c, p.x, p.y, Lz.cx, Lz.cy, S * 0.018, '#a8a0b8', '#4a4060');
  }
  if (W) {
    s = Lz.cs;
    for (i = 0; i < cwork.tiles.length; i++) {
      t = cwork.tiles[i];
      p = cworkCell(t.c, t.r, Lz);
      artRoundRect(c, p.x - s * 0.46, p.y - s * 0.46, s * 0.92, s * 0.92, s * 0.12, (t.c + t.r) % 2 ? '#d8ccb4' : '#cfc2a8', { lineColor: '#9a8a70', line: Math.max(1, s * 0.02) });
    }
    // Lähdesuu idässä, putki lattiasta
    q = cworkSpoutPos(Lz);
    artRoundRect(c, q.x + s * 0.05, q.y, s * 0.16, Lz.floor - q.y, s * 0.05, '#8a8a98', { lineColor: '#4a4a5a' });
    artRoundRect(c, q.x - s * 0.2, q.y - s * 0.4, s * 0.6, s * 0.8, s * 0.15, '#9a9aa8', { lineColor: '#4a4a5a', hi: 0.2 });
    c.strokeStyle = '#4fb8f0';
    c.lineWidth = s * 0.2;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - s * 0.45, q.y); c.stroke();
    artGlow(c, q.x, q.y, s * 0.5, '#7fd4ff', 0.4);
    // Vesiratas lännessä: vesi valuu sen oikealle kyljelle
    if (cwork.wheel.on) {
      c.strokeStyle = '#4fb8f0';
      c.lineWidth = s * 0.14;
      c.beginPath(); c.moveTo(wp.x + s * 0.5, wp.y); c.quadraticCurveTo(wp.x + s * 0.3, wp.y, wp.x + s * 0.32, wp.y + s * 0.3); c.stroke();
      if (Math.random() < 0.15) spawnSparkles(wp.x + s * 0.3, wp.y + s * 0.35, 2, '#bfeaff');
    } else if (cwork.phase === 'water' && cwork.state === 'play') {
      artGlow(c, wp.x, wp.y, s * 0.6, '#ffe27a', 0.2 + Math.sin(globalT * 4) * 0.1);
    }
    chuteDrawWheel(c, wp.x, wp.y, wp.s, cwork.wheel.ang, cwork.wheel.on);
    artCircle(c, wp.x, wp.y, S * 0.02, '#c0c8d8', { lineColor: '#4a5060' });
    for (i = 0; i < cwork.tiles.length; i++) {
      t = cwork.tiles[i];
      p = cworkCell(t.c, t.r, Lz);
      var wg = t.wig > 0 ? Math.sin(globalT * 50) * s * 0.03 : 0;
      if (t.kind === 'rock') {
        artBlob(c, p.x + wg, p.y + s * 0.08, s * 0.34, s * 0.26, '#9a9aa8', { lineColor: '#4a4a5a', hi: 0.3 });
      } else if (t.kind === 'pipe') {
        c.save();
        c.translate(p.x + wg, p.y);
        c.rotate(t.rotA);
        chuteDrawPipe(c, 0, 0, s, t.mask, t.fill, false, true);
        c.restore();
      }
    }
    // Vuodot
    if (f) {
      for (i = 0; i < f.leaks.length; i++) {
        var lk = f.leaks[i], lt = cworkTile(lk.c, lk.r);
        if (!lt || (lt.fill < 1 && !lk.src)) continue;
        p = cworkCell(lk.c, lk.r, Lz);
        var lx = p.x + CHUTE_DIRS[lk.d][0] * s * 0.5, ly = p.y + CHUTE_DIRS[lk.d][1] * s * 0.5;
        if (lk.src) { lx = p.x + s * 0.55; ly = p.y; }
        for (k = 0; k < 4; k++) {
          var a = globalT * 6 + k * 1.6, rr = s * (0.08 + ((globalT * 2 + k * 0.3) % 1) * 0.18);
          artCircle(c, lx + Math.cos(a) * rr, ly + Math.sin(a) * rr * 0.6 + rr * 0.5, s * 0.05, '#7fd4ff', { line: false, alpha: 0.8 });
        }
      }
    }
  }
  if (G) {
    // Tapit
    for (k = 0; k < CWORK_GROWS; k++) for (i = 0; i < G.Rg.cols; i++) {
      p = cworkPegPos(i, k, Lz);
      if (G.broken[cworkKey(i, k)]) {
        c.strokeStyle = 'rgba(90,50,20,0.55)';
        c.lineWidth = Math.max(2, r * 0.1);
        c.beginPath(); c.moveTo(p.x - r * 0.15, p.y - r * 0.15); c.lineTo(p.x + r * 0.15, p.y + r * 0.15); c.moveTo(p.x + r * 0.15, p.y - r * 0.15); c.lineTo(p.x - r * 0.15, p.y + r * 0.15); c.stroke();
      } else {
        artCircle(c, p.x, p.y, r * 0.16, '#e8c27a', { lineColor: '#7a5a28', hi: 0.4 });
      }
    }
    var jam = net && net.jam, jsh = jam ? Math.sin(globalT * 45) * r * 0.05 : 0;
    var spinOf = function (cc, rr) { var kk = cworkKey(cc, rr); return !net || jam || net.dir[kk] === undefined ? 0 : net.dir[kk]; };
    var angOf = function (cc, rr) {
      var kk = cworkKey(cc, rr), dep = net && net.depth[kk] !== undefined ? net.depth[kk] : 0;
      return spinOf(cc, rr) * cwork.netT * CWORK_SPEED + (dep % 2) * Math.PI / GEAR_TEETH;
    };
    var inJam = function (cc, rr) { return jam && net.dir[cworkKey(cc, rr)] !== undefined; };
    var colOf = function (cc, rr, base) { return gold ? '#ffd24f' : inJam(cc, rr) ? '#ff8a6a' : base; };
    // Moottoriratas (hihnapyörä keskellä)
    gearDrawWheel(c, mp.x + (inJam(G.motor.c, G.motor.r) ? jsh : 0), mp.y, r, angOf(G.motor.c, G.motor.r), colOf(G.motor.c, G.motor.r, '#c0c8d8'));
    artCircle(c, mp.x, mp.y, S * 0.02, '#c0c8d8', { lineColor: '#4a5060' });
    // Ruuvatut rattaat
    for (i = 0; i < G.bolted.length; i++) {
      q = G.bolted[i];
      p = cworkPegPos(q.c, q.r, Lz);
      gearDrawWheel(c, p.x + (inJam(q.c, q.r) ? jsh : 0), p.y, r, angOf(q.c, q.r), colOf(q.c, q.r, '#b8c0d0'));
      for (k = 0; k < 2; k++) artCircle(c, p.x + (k ? 1 : -1) * r * 0.35, p.y, r * 0.09, '#e8ecf4', { lineColor: '#4a5060' });
    }
    // Kelloratas ja suuntanuoli (myötäpäivään)
    var tg = G.target, ts = spinOf(tg.c, tg.r);
    p = cworkPegPos(tg.c, tg.r, Lz);
    if (ts > 0 && cwork.phase === 'gears') artGlow(c, p.x, p.y, r * 1.8, '#ffd24f', 0.45 + Math.sin(globalT * 6) * 0.15);
    gearDrawWheel(c, p.x + (inJam(tg.c, tg.r) ? jsh : 0), p.y, r, angOf(tg.c, tg.r), colOf(tg.c, tg.r, '#ff9a3a'));
    artCircle(c, p.x, p.y, r * 0.42, '#fff6e0', { lineColor: '#8a5a30' });
    artLimb(c, p.x, p.y, p.x, p.y - r * 0.3, Math.max(2, r * 0.08), '#e0403a', '#7a1a10');
    artLimb(c, p.x, p.y, p.x + r * 0.22, p.y, Math.max(2, r * 0.06), '#3a7ae0', '#123a80');
    if (cwork.phase === 'gears' || (cwork.phase === 'water' && cwork.state === 'play')) gearDrawDirArrow(c, p.x, p.y, r * 1.35, 1, ts < 0 ? '#ff5f5f' : '#ffffff');
    // Laatikon ja taulun rattaat; raahattava viimeisenä
    for (i = 0; i < cwork.items.length; i++) {
      it = cwork.items[i];
      if (it === cwork.drag || it.appear <= 0) continue;
      var sc = easeOutBack(it.appear) * (it.pop > 0 ? 1 + it.pop * 0.5 : 1);
      if (it.peg) {
        gearDrawWheel(c, it.x + (inJam(it.peg.c, it.peg.r) ? jsh : 0), it.y, r * sc, angOf(it.peg.c, it.peg.r), colOf(it.peg.c, it.peg.r, '#e8b84a'));
      } else {
        artShadow(c, it.x, it.y + r * 0.8, r * 0.75, r * 0.15, 0.2);
        gearDrawWheel(c, it.x, it.y, r * sc * 0.75, 0.2 * i, '#e8b84a');
      }
    }
  }
  // Tornikello: taulu, aave-viisarit, väärän suunnan punainen hehku
  var cd = cwork.cards[cwork.ci], back = cwork.phase === 'gears' && net && net.target < 0;
  var sh = back ? Math.sin(globalT * 40) * Lz.cr * 0.02 : 0;
  cuckooDrawFace(c, Lz.cx + sh, Lz.cy, Lz.cr, cwork.disp, 0, 0, true);
  if (back) {
    artGlow(c, Lz.cx, Lz.cy, Lz.cr * 1.2, '#ff5a3a', 0.3 + Math.sin(globalT * 8) * 0.1);
    gearDrawDirArrow(c, Lz.cx, Lz.cy, Lz.cr * 1.05, -1, '#ff5f5f');
  }
  if (cwork.phase === 'clock' && cd && cwork.sub !== 'idle' && cworkGhostOn()) {
    c.globalAlpha = 0.4 + Math.sin(globalT * 3) * 0.1;
    artLimb(c, Lz.cx, Lz.cy, Lz.cx + Math.cos(cuckooHourAng(cd.tm)) * Lz.cr * 0.46, Lz.cy + Math.sin(cuckooHourAng(cd.tm)) * Lz.cr * 0.46, Math.max(3, Lz.cr * 0.12), '#ffd24f', '#b8862a');
    artLimb(c, Lz.cx, Lz.cy, Lz.cx + Math.cos(cuckooMinAng(cd.tm)) * Lz.cr * 0.76, Lz.cy + Math.sin(cuckooMinAng(cd.tm)) * Lz.cr * 0.76, Math.max(2, Lz.cr * 0.05), '#ffd24f', '#b8862a');
    c.globalAlpha = 1;
  }
  // Lyöntilaskuri kellon vasemmalla yläpuolella
  if (cwork.strike && cwork.strike.i > 0) {
    var nx = Lz.cx - Lz.cr * 1.05, ny = Lz.cy - Lz.cr * 0.85, pop = cwork.countPop > 0 ? 1 + cwork.countPop : 1;
    artCircle(c, nx, ny, Lz.cr * 0.3 * pop, '#ffffff', { lineColor: '#8a6a40', hi: 0.2 });
    c.fillStyle = '#d8342a';
    c.font = 'bold ' + Math.round(Lz.cr * 0.4 * pop) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(cwork.strike.i), nx, ny + Lz.cr * 0.02);
  }
  // Kyltti ja vipu
  if (cwork.phase === 'clock' && cwork.state === 'play' && cd) cworkDrawCard(c, Lz, cwork.wait > 0 ? 1 - cwork.wait / 0.9 : 1);
  cworkDrawLever(c, Lz, cwork.phase === 'clock' && cwork.state === 'play' && cwork.round === 0);
  // Tonttu
  var T = Lz.tont, hop = cwork.tonttu.hop > 0 ? Math.sin(Math.min(1, cwork.tonttu.hop / 0.4) * Math.PI) * T.s * 0.3 : 0;
  var cheer = cwork.tonttu.cheer > 0, armY = cheer ? T.y - T.s * (1.6 + Math.sin(globalT * 10) * 0.15) : T.y - T.s * 0.35;
  cuckooDrawTonttu(c, T.x, T.y, T.s, armY - hop, hop, cwork.tonttu.blink > 0);
  if (cwork.drag) {
    it = cwork.drag;
    artShadow(c, it.x, it.y + r * 1.6, r * 0.8, r * 0.18, 0.15);
    gearDrawWheel(c, it.x, it.y, r * 1.05, globalT * 0.5, '#f0c860');
  }
  if (cwork.cloud) cworkDrawCloud(c, cwork.cloud, Lz);
  cworkDrawHints(c, Lz);
  drawParticlesLayer(c);
  endPlayWorld();
  drawCworkHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}
function cworkGhostOn() {
  var g = cwork.R.ghost;
  return g === 'all' || (g === 'help' && (cwork.ci === 0 || cwork.helpGhost));
}
// Vihjeet 1. kierroksella: käsi kussakin vaiheessa ensimmäisellä kerralla
function cworkDrawHints(c, Lz) {
  var W = cwork.W, G = cwork.G, i, t, p, q, k, r = Lz.gd * 0.5, cd;
  if (cwork.round !== 0 || cwork.state !== 'play' || cwork.wait > 0) return;
  if (cwork.phase === 'water' && !cwork.tapped && cwork.hintT > 1.5 && W) {
    for (i = 0; i < W.path.length; i++) {
      t = cworkTile(W.path[i].c, W.path[i].r);
      if (t.mask !== t.want) break;
    }
    if (i >= W.path.length) return;
    p = cworkCell(W.path[i].c, W.path[i].r, Lz);
    k = (globalT % 1.2) / 1.2;
    drawHand(c, p.x + Lz.cs * 0.1, p.y + Lz.cs * 0.15 + Math.abs(Math.sin(k * Math.PI)) * Lz.cs * 0.15, Lz.cs * 0.3);
  } else if (cwork.phase === 'gears' && !cwork.placed && !cwork.drag && cwork.hintT > 2 && G && cwork.items.length) {
    var hp = (cwork.hintT - 2) % 3.2, g0 = cwork.items[0], tgt = null;
    for (i = 1; i < G.path.length - 1 && !tgt; i++) {
      if (!cworkNodeAt(G.path[i].c, G.path[i].r)) tgt = G.path[i];
    }
    if (tgt && hp < 2) {
      q = cworkPegPos(tgt.c, tgt.r, Lz);
      k = easeInOutSine(Math.min(1, hp / 1.6));
      var hx = g0.hx + (q.x - g0.hx) * k, hy = g0.hy + (q.y - g0.hy) * k;
      c.globalAlpha = hp > 1.7 ? (2 - hp) / 0.3 : 0.85;
      if (k > 0.05) gearDrawWheel(c, hx, hy, r * 0.9, 0, '#e8b84a');
      drawHand(c, hx + r * 0.4, hy + r * 0.9, r * 0.8);
      c.globalAlpha = 1;
    }
  } else if (cwork.phase === 'clock' && !cwork.hitAny && cwork.sub === 'run') {
    // Käsi vivun päällä; kun kello on kortin ajassa, käsi painaa
    cd = cwork.cards[cwork.ci];
    var inWin = cworkJudge((cwork.tm - cd.tm) / cworkSpeed()) === 'hit';
    p = Lz.lever;
    c.globalAlpha = inWin ? 1 : 0.55;
    drawHand(c, p.x - Lz.S * 0.03, p.y - Lz.S * 0.12 + (inWin ? Math.abs(Math.sin(globalT * 10)) * Lz.S * 0.03 : 0), Lz.S * 0.04);
    c.globalAlpha = 1;
  }
}
// HUD: kierrokset rattaina (kultainen = ei sydänmenetystä) ja vaiheet: pisara, ratas, kello
function drawCworkHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = CWORK_ROUNDS.length, ph = ['water', 'gears', 'clock'], cur;
  var w = hs * 2.8 * n + hs * 1.2 + hs * 2.6 * 3 + hs * 0.8;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, w, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < cwork.round || cwork.state === 'won' || (i === cwork.round && cwork.state === 'roundDone');
    var x = left + hs * 2 + i * hs * 2.8, y = pad * 0.5 + hs * 1.7;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && cwork.gold[i]) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.7);
    gearDrawWheel(c, x, y, hs * 0.8, globalT * (done ? 1 : 0), done && cwork.gold[i] ? '#ffd24f' : '#c9a070', 8);
    c.globalAlpha = 1;
  }
  cur = cwork.state === 'play' ? ph.indexOf(cwork.phase) : -1;
  for (i = 0; i < 3; i++) {
    var px = left + hs * 2.8 * n + hs * 1.6 + i * hs * 2.6, py = pad * 0.5 + hs * 1.7;
    c.globalAlpha = i === cur ? 1 : i < cur ? 0.7 : 0.3;
    if (i === cur) artGlow(c, px, py, hs * 1.5, '#ffffff', 0.6);
    if (i === 0) {
      c.beginPath(); c.moveTo(px, py - hs); c.quadraticCurveTo(px + hs * 0.8, py + hs * 0.1, px, py + hs * 0.8); c.quadraticCurveTo(px - hs * 0.8, py + hs * 0.1, px, py - hs); c.closePath();
      artFillPath(c, '#4fb8f0', py - hs, py + hs * 0.8, hs, { lineColor: '#1e5a8a' });
    } else if (i === 1) {
      gearDrawWheel(c, px, py, hs * 0.75, i === cur ? globalT : 0, '#e8b84a', 8);
    } else {
      cuckooDrawFace(c, px, py, hs * 0.95, i === cur ? globalT * 60 : 180, 0, 0, false);
    }
    c.globalAlpha = 1;
  }
}

HUB_ICONS.clockwork = function (c, x, y, s) {
  var r = s * 0.13;
  artRoundRect(c, x - r * 1.2, y - r * 0.9, r * 2.4, r * 2.9, r * 0.2, '#c8b8a8', { lineColor: '#4a3a3a' });
  c.beginPath(); c.moveTo(x - r * 1.45, y - r * 0.8); c.lineTo(x, y - r * 2.0); c.lineTo(x + r * 1.45, y - r * 0.8); c.closePath();
  artFillPath(c, '#7a4a6a', y - r * 2.0, y - r * 0.8, r, { lineColor: '#3a1a30' });
  cuckooDrawFace(c, x, y + r * 0.15, r * 0.95, 3 * 60 + globalT * 30, 0, 0, false);
  gearDrawWheel(c, x - r * 1.5, y + r * 1.3, r * 0.5, globalT, '#e8b84a', 8);
  c.beginPath(); c.moveTo(x + r * 1.55, y + r * 0.6); c.quadraticCurveTo(x + r * 2.1, y + r * 1.4, x + r * 1.55, y + r * 1.8); c.quadraticCurveTo(x + r * 1.0, y + r * 1.4, x + r * 1.55, y + r * 0.6); c.closePath();
  artFillPath(c, '#4fb8f0', y + r * 0.6, y + r * 1.8, r * 0.5, { lineColor: '#1e5a8a' });
};
