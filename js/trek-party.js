'use strict';

// TYNKÄ: PIL-VI-LIN-NA (Pikkupilven kotimatka, luku 5). Korvataan oikealla luvulla.
var tkp = { t: 0 };
trekRegister({
  id: 'party', order: 5, name: 'PIL-VI-LIN-NA', color: '#ff9fd0',
  ambient: 'sparkle', light: null, bunny: false,
  gift: null,
  init: function () { tkp.t = 0; },
  update: function (dt) { tkp.t += dt; updateParticles(dt); },
  draw: function () { tkpDraw(); },
  tap: function (px, py) { if (px < viewW * 0.3) trekBunnyFound(px, py); else trekChapterDone(); },
  resize: function () {},
  layers: function () { return [{ speed: 1, render: tkpRenderBg }]; },
  icon: function (c, x, y, s) { artCircle(c, x, y, s * 0.25, '#ffffff', {}); }
});
function tkpRenderBg(b, w, h) {
  b.fillStyle = '#ff9fd0';
  b.fillRect(0, 0, w, h);
}
function tkpDraw() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  trekDrawPup(c, viewW / 2, viewH / 2, viewH * 0.08, { mood: 'happy', t: globalT });
  endPlayWorld();
}
