/* ==========================================================================
   STARFALL — Unified input (pointer / touch / keyboard / gamepad)
   Exposes control state for gameplay and dispatches `sf-key` window events
   for menu navigation (confirm / back / pause / up / down / left / right).
   ========================================================================== */
(function () {
  'use strict';

  var canvas = null;
  var pointerX = 0;
  var pointerY = 0;
  var pointerActive = false;
  var pointerOnCanvas = false;
  var usingTouch = false;

  var axisX = 0; /* -1..1 combined keyboard + gamepad stick */
  var left = false;
  var right = false;

  var padPrev = 0; /* gamepad button bitmask from previous poll */
  var gamepadIdx = -1;

  var NAV = {
    Enter: 'confirm',
    ' ': 'pause',
    Spacebar: 'pause',
    Escape: 'back',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyP: 'pause',
    p: 'pause'
  };

  /* Key code normalization (event.code preferred). */
  function keyId(e) {
    return e.code && /^Key[A-Z]$/.test(e.code) ? e.code : (e.key || e.code);
  }

  function navAction(e) {
    var id = keyId(e);
    return NAV[id] || null;
  }

  function onKeyDown(e) {
    var action = navAction(e);
    if (!action) return;
    /* Stop the browser from also "clicking" the focused button (Space/Enter)
       or scrolling (arrows) so gameplay keys never double-fire. */
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('sf-key', { detail: { action: action, key: e.key } }));
  }

  function onKeyUp(e) {
    var action = navAction(e);
    if (!action) return;
    /* Nothing to clear for navigation; movement handled by held keys below. */
  }

  /* Movement: arrows + A/D held keys, always tracked. */
  function onMoveKey(e, down) {
    var id = keyId(e);
    if (id === 'ArrowLeft' || id === 'KeyA') { left = down; e.preventDefault(); }
    if (id === 'ArrowRight' || id === 'KeyD') { right = down; e.preventDefault(); }
  }

  /* ---------- Pointer ---------- */

  function updateRect() {
    if (!canvas) return { left: 0, top: 0, width: 0, height: 0 };
    return canvas.getBoundingClientRect();
  }

  function setPointer(e) {
    var r = updateRect();
    pointerX = e.clientX - r.left;
    pointerY = e.clientY - r.top;
    pointerOnCanvas = pointerX >= 0 && pointerX <= r.width && pointerY >= 0 && pointerY <= r.height;
  }

  function onPointerMove(e) {
    if (e.pointerType !== 'touch') usingTouch = false;
    setPointer(e);
    pointerActive = true;
  }

  function onPointerDown(e) {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') usingTouch = true;
    setPointer(e);
    pointerActive = true;
  }

  function onPointerUp(e) {
    if (e.pointerType === 'touch') {
      pointerActive = false;
    }
    /* Mouse keeps hover-control after release. */
  }

  function onTouchStart(e) {
    usingTouch = true;
    if (e.touches && e.touches[0]) {
      var r = updateRect();
      pointerX = e.touches[0].clientX - r.left;
      pointerY = e.touches[0].clientY - r.top;
      pointerOnCanvas = pointerX >= 0 && pointerX <= r.width && pointerY >= 0 && pointerY <= r.height;
    }
    pointerActive = true;
  }

  function onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      var r = updateRect();
      pointerX = e.touches[0].clientX - r.left;
      pointerY = e.touches[0].clientY - r.top;
      pointerOnCanvas = pointerX >= 0 && pointerX <= r.width && pointerY >= 0 && pointerY <= r.height;
    }
    pointerActive = true;
  }

  function onTouchEnd() {
    pointerActive = false;
  }

  /* ---------- Gamepad ---------- */

  function readGamepad() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepadIdx < 0 || !pads[gamepadIdx]) {
      /* Pick the first connected gamepad. */
      for (var i = 0; i < pads.length; i++) {
        if (pads[i]) { gamepadIdx = i; break; }
      }
    }
    var pad = gamepadIdx >= 0 ? pads[gamepadIdx] : null;
    if (!pad) { padPrev = 0; return; }

    var stick = pad.axes[0] || 0;
    var dpad = (pad.buttons[14] ? -1 : 0) + (pad.buttons[15] ? 1 : 0);
    var gameAxis = stick;
    if (Math.abs(dpad) > Math.abs(gameAxis)) gameAxis = dpad;
    if (Math.abs(gameAxis) < 0.35) gameAxis = 0;

    var mask = 0;
    var map = [0, 1, 8, 9]; /* A, B, Select, Start */
    for (var b = 0; b < map.length; b++) {
      if (pad.buttons[map[b]] && pad.buttons[map[b]].pressed) mask |= 1 << b;
    }

    /* Edge-triggered buttons -> navigation events. */
    var pressed = mask & ~padPrev;
    if (pressed & 1) window.dispatchEvent(new CustomEvent('sf-key', { detail: { action: 'confirm' } }));
    if (pressed & 2) window.dispatchEvent(new CustomEvent('sf-key', { detail: { action: 'back' } }));
    if (pressed & 4) window.dispatchEvent(new CustomEvent('sf-key', { detail: { action: 'back' } }));
    if (pressed & 8) window.dispatchEvent(new CustomEvent('sf-key', { detail: { action: 'pause' } }));
    padPrev = mask;

    if (gameAxis !== 0) {
      /* Debounce dpad/stick navigation with a small cooldown. */
      var now = performance.now();
      if (now - lastNavTime > 200) {
        lastNavTime = now;
        window.dispatchEvent(new CustomEvent('sf-key', {
          detail: { action: gameAxis < 0 ? 'left' : 'right' }
        }));
      }
    }
    /* Add gamepad stick to movement axis when playing. */
    axisFromPad = gameAxis;
  }

  var axisFromPad = 0;
  var lastNavTime = 0;

  /* ---------- Public ---------- */

  window.Input = {
    init: function (c) {
      canvas = c;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keydown', function (e) { onMoveKey(e, true); });
      window.addEventListener('keyup', function (e) { onMoveKey(e, false); });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
    },

    /* Poll every frame: recompute keyboard + gamepad axis. */
    update: function () {
      axisX = 0;
      if (left) axisX -= 1;
      if (right) axisX += 1;
      readGamepad();
      if (Math.abs(axisFromPad) > 0) {
        axisX = axisFromPad;
      }
    },

    getControl: function () {
      return {
        pointerActive: pointerActive,
        pointerOnCanvas: pointerOnCanvas,
        pointerX: pointerX,
        pointerY: pointerY,
        axisX: axisX,
        usingTouch: usingTouch
      };
    },

    get pointerX() { return pointerX; },
    get pointerY() { return pointerY; },
    get usingTouch() { return usingTouch; }
  };
})();
