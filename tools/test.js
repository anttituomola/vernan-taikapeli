// tools/test.js — headless smoke test for vernan-taikapeli.
// Runs the game's scripts in Node with DOM stubs and checks the invariants
// that currently fail SILENTLY when adding a world or task type:
//
//   A. PHASES integrity      — dense levels, resolvable next chains, required hooks
//   B. HUB_WORLDS integrity  — every room/order kind exists, map chars have rooms
//   C. ISLANDS integrity     — worlds match hub worlds, finaleKind exists
//   D. Tehtävä registry      — every makeTask type used has a TASK_TYPES entry
//   E. WORLDS registry       — (post-refactor) derived views match the registry,
//                              no hand-set level numbers remain in play files
//
// Usage: node tools/test.js
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------- DOM stubs

// A universal proxy: any property is callable, any call returns the proxy,
// numeric coercion yields 1. Absorbs all canvas-ctx usage at load/boot time.
const anyProxy = (function make() {
  const fn = function () { return p; };
  const p = new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 1;
      if (k === 'width' || k === 'height') return 0;
      return p;
    },
    set() { return true; },
    apply() { return p; },
    has() { return true; }
  });
  return p;
})();

function fakeCanvas() {
  return {
    width: 800, height: 600, style: {},
    getContext: () => anyProxy,
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  };
}

function fakeEl() {
  return {
    style: {}, textContent: '', innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {},
    getContext: () => anyProxy,
    width: 800, height: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  };
}

function makeSandbox() {
  const elements = {};
  const sandbox = {
    console,
    document: {
      getElementById: (id) => elements[id] || (elements[id] = fakeEl()),
      createElement: (tag) => (tag === 'canvas' ? fakeCanvas() : fakeEl()),
      addEventListener() {},
      body: { style: {} },
      documentElement: { style: {} },
      write() {}
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    requestAnimationFrame: () => 1,
    performance: { now: () => 0 },
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    location: { search: '', href: 'http://localhost/' },
    addEventListener() {}, removeEventListener() {},
    AudioContext: function () { return anyProxy; },
    webkitAudioContext: function () { return anyProxy; },
    Image: function () { return fakeEl(); }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

// ------------------------------------------------------------ script loading

function readSrc(f) {
  return fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
}

// Current index.html: a static `var files = [...]` list.
// Post-refactor: js/worlds.js exposes scriptManifest() and index.html derives
// the list from it. Support both so the same test runs before and after.
function loadGame(sandbox) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let files;
  const staticList = html.match(/var files\s*=\s*\[([\s\S]*?)\]/);
  if (staticList) {
    files = [...staticList[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  } else {
    vm.runInContext(readSrc('worlds'), sandbox, { filename: 'js/worlds.js' });
    files = vm.runInContext('scriptManifest()', sandbox);
    if (!Array.isArray(files) || !files.length) {
      throw new Error('scriptManifest() did not return a file list');
    }
  }
  for (const f of files) {
    if (sandbox.__loadedWorlds && f === 'worlds') continue; // already loaded
    vm.runInContext(readSrc(f), sandbox, { filename: 'js/' + f + '.js' });
  }
  return files;
}

// ---------------------------------------------------------------- assertions

let failures = 0;
function check(ok, label, detail) {
  if (ok) {
    console.log('  ok   ' + label);
  } else {
    failures++;
    console.log('  FAIL ' + label + (detail ? ' — ' + detail : ''));
  }
}

function section(title) {
  console.log('\n[' + title + ']');
}

const sandbox = makeSandbox();
let files;
try {
  files = loadGame(sandbox);
} catch (e) {
  console.error('Could not load game scripts: ' + e.stack);
  process.exit(1);
}
const g = (expr) => vm.runInContext('(typeof ' + expr + ' !== "undefined") ? ' + expr + ' : undefined', sandbox);

// --- A. PHASES
section('A. PHASES integrity');
const PHASES = g('PHASES');
check(!!PHASES, 'PHASES exists');
if (PHASES) {
  const kinds = Object.keys(PHASES);
  const levels = kinds.map((k) => PHASES[k].level);
  const sorted = [...levels].sort((a, b) => a - b);
  check(
    sorted.every((v, i) => v === i + 1),
    'levels are dense 1..' + kinds.length,
    'got ' + JSON.stringify(sorted)
  );
  for (const k of kinds) {
    const p = PHASES[k];
    const nxt = p.next;
    check(nxt === null || !!PHASES[nxt], 'next of ' + k + ' resolves', 'next=' + nxt);
    for (const hook of ['init', 'update', 'draw', 'resize', 'renderBg']) {
      check(typeof p[hook] === 'function', k + '.' + hook + ' is a function');
    }
  }
}

// --- B. HUB_WORLDS
section('B. HUB_WORLDS integrity');
const HUB_WORLDS = g('HUB_WORLDS');
check(!!HUB_WORLDS, 'HUB_WORLDS exists');
const STRUCTURAL = new Set(['#', '.', 'B', 'S', 'G']);
if (HUB_WORLDS && PHASES) {
  const wkeys = Object.keys(HUB_WORLDS).map(Number).sort((a, b) => a - b);
  check(wkeys.every((v, i) => v === i + 1), 'world keys are dense 1..' + wkeys.length);
  const inOrder = new Set();
  for (const w of wkeys) {
    const hub = HUB_WORLDS[w];
    const mapChars = new Set(hub.map.join('').split(''));
    for (const ch of mapChars) {
      if (STRUCTURAL.has(ch)) continue;
      check(!!hub.rooms[ch], 'world ' + w + ' map char ' + ch + ' has a room entry');
    }
    for (const ch of Object.keys(hub.rooms)) {
      check(mapChars.has(ch), 'world ' + w + ' room char ' + ch + ' appears in the map');
      check(!!PHASES[hub.rooms[ch].kind], 'world ' + w + ' room ' + ch + ' kind ' + hub.rooms[ch].kind + ' is a phase');
    }
    for (const kind of hub.order) {
      check(!!PHASES[kind], 'world ' + w + ' order kind ' + kind + ' is a phase');
      check(
        Object.values(hub.rooms).some((r) => r.kind === kind),
        'world ' + w + ' order kind ' + kind + ' has a room'
      );
      inOrder.add(kind);
    }
  }
  const homeless = Object.keys(PHASES).filter((k) => !inOrder.has(k));
  check(
    homeless.every((k) => PHASES[k].hidden === true),
    'every phase not in a hub order is hidden',
    'not hidden, not ordered: ' + homeless.join(', ')
  );
}

// --- C. ISLANDS
section('C. ISLANDS integrity');
const ISLANDS = g('ISLANDS');
check(!!ISLANDS, 'ISLANDS exists');
if (ISLANDS && HUB_WORLDS && PHASES) {
  const wkeys = Object.keys(HUB_WORLDS).map(Number).sort((a, b) => a - b);
  check(
    ISLANDS.map((i) => i.world).join(',') === wkeys.join(','),
    'islands match hub worlds in order'
  );
  for (const isl of ISLANDS) {
    check(!!PHASES[isl.finaleKind], 'island ' + isl.world + ' finaleKind ' + isl.finaleKind + ' is a phase');
  }
}

// --- D. Tehtävä types
section('D. Tehtävä type coverage');
const usedTypes = new Set();
for (const f of files) {
  const src = readSrc(f);
  for (const m of src.matchAll(/makeTask\(\s*[-\w.]+,\s*'(\w+)'/g)) usedTypes.add(m[1]);
}
check(usedTypes.size > 0, 'found makeTask call sites', 'none found');
console.log('  types in use: ' + [...usedTypes].sort().join(', '));
const TASK_TYPES = g('TASK_TYPES');
if (TASK_TYPES) {
  for (const t of usedTypes) {
    const entry = TASK_TYPES[t];
    check(!!entry, 'TASK_TYPES has ' + t);
    if (entry) {
      check(typeof entry.make === 'function', t + '.make is a function');
      check(typeof entry.draw === 'function', t + '.draw is a function');
    }
  }
  for (const t of Object.keys(TASK_TYPES)) {
    check(usedTypes.has(t), 'registry entry ' + t + ' is used by a level');
  }
} else {
  console.log('  (TASK_TYPES not defined yet — registry checks skipped)');
}

// --- E. WORLDS registry (post-refactor)
const WORLDS = g('WORLDS');
if (WORLDS) {
  section('E. WORLDS registry');
  // Derived PHASES must match flattened registry order.
  let pos = 0;
  const flat = [];
  for (const w of WORLDS) for (const lv of w.levels) flat.push({ w, lv });
  for (const { w, lv } of flat) {
    pos++;
    check(PHASES[lv.kind] && PHASES[lv.kind].level === pos,
      lv.kind + ' derived level = ' + pos);
    const expectNext = flat[pos] && flat[pos].w === w ? flat[pos].lv.kind : null;
    const actualNext = PHASES[lv.kind] ? PHASES[lv.kind].next : '<missing>';
    check(actualNext === expectNext,
      lv.kind + ' derived next = ' + JSON.stringify(expectNext),
      'got ' + JSON.stringify(actualNext));
  }
  // No hand-set level numbers remain in play files.
  for (const f of files) {
    const src = readSrc(f);
    check(!/^\s*level\s*=\s*\d+\s*;/m.test(src), f + ' sets no level number by hand');
  }
  // Manifest: state first, main last, every level script present once.
  check(files[0] === 'state', 'manifest starts with state');
  check(files[files.length - 1] === 'main', 'manifest ends with main');
  for (const { lv } of flat) {
    const scripts = Array.isArray(lv.script) ? lv.script : [lv.script];
    for (const s of scripts) {
      check(files.filter((f) => f === s).length === 1, 'manifest contains ' + s + ' exactly once');
    }
  }
}

// ---------------------------------------------------------------- summary
console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'ALL CHECKS PASSED'));
process.exit(failures ? 1 : 0);
