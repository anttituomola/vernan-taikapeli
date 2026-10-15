'use strict';

// TYNKÄ: KUP-LA-JO-KI (Pikkupilven kotimatka, luku 2). Korvataan oikealla luvulla.
var tkr = { t: 0 };
trekRegister({
  id: 'river', order: 2, name: 'KUP-LA-JO-KI', color: '#6cc8f0',
  ambient: 'bubbles', light: null, bunny: true,
  gift: { draw: function (c, x, y, s) { artCircle(c, x, y, s * 0.3, '#ffd0e0', {}); } },
  init: function () { tkr.t = 0; },
  update: function (dt) { tkr.t += dt; updateParticles(dt); },
  draw: function () { tkrDraw(); },
  tap: function (px, py) { if (px < viewW * 0.3) trekBunnyFound(px, py); else trekChapterDone(); },
  resize: function () {},
  layers: function () { return [{ speed: 1, render: tkrRenderBg }]; },
  icon: function (c, x, y, s) { artCircle(c, x, y, s * 0.25, '#ffd0e0', {}); }
});
function tkrRenderBg(b, w, h) {
  b.fillStyle = '#6cc8f0';
  b.fillRect(0, 0, w, h);
}
function tkrDraw() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  trekDrawPup(c, viewW / 2, viewH / 2, viewH * 0.08, { mood: 'happy', t: globalT });
  endPlayWorld();
}
