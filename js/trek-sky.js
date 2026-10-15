'use strict';

// TYNKÄ: TÄH-TI-TAI-VAS (Pikkupilven kotimatka, luku 4). Korvataan oikealla luvulla.
var tks = { t: 0 };
trekRegister({
  id: 'sky', order: 4, name: 'TÄH-TI-TAI-VAS', color: '#5a5cb8',
  ambient: 'stars', light: null, bunny: true,
  gift: { draw: function (c, x, y, s) { artCircle(c, x, y, s * 0.3, '#ffe27a', {}); } },
  init: function () { tks.t = 0; },
  update: function (dt) { tks.t += dt; updateParticles(dt); },
  draw: function () { tksDraw(); },
  tap: function (px, py) { if (px < viewW * 0.3) trekBunnyFound(px, py); else trekChapterDone(); },
  resize: function () {},
  layers: function () { return [{ speed: 1, render: tksRenderBg }]; },
  icon: function (c, x, y, s) { artCircle(c, x, y, s * 0.25, '#ffe27a', {}); }
});
function tksRenderBg(b, w, h) {
  b.fillStyle = '#5a5cb8';
  b.fillRect(0, 0, w, h);
}
function tksDraw() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  trekDrawPup(c, viewW / 2, viewH / 2, viewH * 0.08, { mood: 'happy', t: globalT });
  endPlayWorld();
}
