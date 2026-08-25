/* ==========================================================================
   STARFALL — Settings & persistence
   Lightweight localStorage wrapper. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'starfall:store';
  var store = {};
  var osReduced = false;

  try {
    store = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    store = {};
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) { /* storage unavailable (private mode) — run non-persistent */ }
  }

  window.Settings = {
    /* --- Preferences --- */
    get sound() { return store.sound === undefined ? true : !!store.sound; },
    get music() { return store.music === undefined ? true : !!store.music; },
    /* User override wins; otherwise follow the OS preference. */
    get reducedMotion() {
      if (store.motion === true) return true;
      if (store.motion === false) return false;
      return osReduced;
    },

    setSound: function (v) { store.sound = !!v; save(); },
    setMusic: function (v) { store.music = !!v; save(); },
    setReducedMotion: function (v) {
      store.motion = !!v;
      if (!v && osReduced) store.motion = false; /* explicit "off" overrides OS */
      save();
    },

    /* --- Records --- */
    get best() { return store.best || 0; },
    get bestCombo() { return store.bestCombo || 0; },

    setBest: function (v) {
      if (v > (store.best || 0)) {
        store.best = Math.floor(v);
        save();
      }
    },
    setBestCombo: function (v) {
      if (v > (store.bestCombo || 0)) {
        store.bestCombo = Math.floor(v);
        save();
      }
    },

    /* --- Lifetime stats --- */
    trackGame: function (starsCaught) {
      store.games = (store.games || 0) + 1;
      store.stars = (store.stars || 0) + (starsCaught || 0);
      save();
    }
  };
})();
