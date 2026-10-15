'use strict';

// TYNKÄ: HOH-TO-LUO-LA (Pikkupilven kotimatka, luku 3). Korvataan oikealla luvulla.
var tkc = { t: 0 };
trekRegister({
  id: 'cave', order: 3, name: 'HOH-TO-LUO-LA', color: '#7a6cd0',
  ambient: 'dust', light: null, bunny: true,
  gift: { draw: function (c, x, y, s) { artCircle(c, x, y, s * 0.3, '#9fe8ff', {}); } },
  init: function () { tkc.t = 0; },
  update: function (dt) { tkc.t += dt; updateParticles(dt); },
  draw: function () { tkcDraw(); },
  tap: function (px, py) { if (px < viewW * 0.3) trekBunnyFound(px, py); else trekChapterDone(); },
  resize: function () {},
  layers: function () { return [{ speed: 1, render: tkcRenderBg }]; },
  icon: function (c, x, y, s) { artCircle(c, x, y, s * 0.25, '#9fe8ff', {}); }
});
function tkcRenderBg(b, w, h) {
  b.fillStyle = '#7a6cd0';
  b.fillRect(0, 0, w, h);
}
function tkcDraw() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  trekDrawPup(c, viewW / 2, viewH / 2, viewH * 0.08, { mood: 'happy', t: globalT });
  endPlayWorld();
}
