'use strict';

// TYNKÄ: KUK-KA-NIIT-TY (Pikkupilven kotimatka, luku 1). Korvataan oikealla luvulla.
var tkm = { t: 0 };
trekRegister({
  id: 'meadow', order: 1, name: 'KUK-KA-NIIT-TY', color: '#8fdc7a',
  ambient: 'butterflies', light: null, bunny: true,
  gift: { draw: function (c, x, y, s) { artCircle(c, x, y, s * 0.3, '#ff7bac', {}); } },
  init: function () { tkm.t = 0; },
  update: function (dt) { tkm.t += dt; updateParticles(dt); },
  draw: function () { tkmDraw(); },
  tap: function (px, py) { if (px < viewW * 0.3) trekBunnyFound(px, py); else trekChapterDone(); },
  resize: function () {},
  layers: function () { return [{ speed: 1, render: tkmRenderBg }]; },
  icon: function (c, x, y, s) { artCircle(c, x, y, s * 0.25, '#ff7bac', {}); }
});
function tkmRenderBg(b, w, h) {
  b.fillStyle = '#8fdc7a';
  b.fillRect(0, 0, w, h);
}
function tkmDraw() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  trekDrawPup(c, viewW / 2, viewH / 2, viewH * 0.08, { mood: 'happy', t: globalT });
  endPlayWorld();
}
