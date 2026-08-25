/* ==========================================================================
   STARFALL — Entry point
   Boot order: settings → audio → particles → game → input → ui → main.
   Owns the master requestAnimationFrame loop, resize handling, tab-hide
   auto-pause, and the first user-gesture audio unlock.
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var last = 0;
  var audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (window.GameAudio) GameAudio.init();
  }

  function onResize() {
    if (window.Game) Game.resize();
  }

  function onVisibility() {
    if (document.hidden && window.UI) UI.forcePause();
  }

  function tick(now) {
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05; /* clamp long frames (tab switch / lag) */
    if (dt < 0) dt = 0;

    if (window.Input) Input.update();
    if (window.Game) {
      Game.setControl(Input.getControl());
      Game.update(dt);
      Game.draw();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Boot ---------- */
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  /* Unlock WebAudio on the first user gesture (autoplay policy). */
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  if (window.Input) Input.init(canvas);
  if (window.Game) Game.init(canvas);
  if (window.UI) UI.boot();

  requestAnimationFrame(function (now) {
    last = now;
    requestAnimationFrame(tick);
  });
})();
