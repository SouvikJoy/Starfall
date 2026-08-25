/* ==========================================================================
   STARFALL — Audio System
   --------------------------------------------------------------------------
   Pure WebAudio synthesis. No audio files.

   Public API:
     window.GameAudio = {
       init(), setSound(b), setMusic(b),
       click(), hover(), back(), uiOpen(), uiClose(),
       catch(combo), gold(), hurt(), miss(),
       levelUp(), gameOver(), record(),
       startMusic(), stopMusic()
     }

   Signal chain:
     SFX/master (0.9) -> DynamicsCompressor -> destination
     musicBus -> master (music sits far below SFX)

   Rules followed:
     - AudioContext created lazily in init(); call init() from a user-gesture
       path (e.g. first pointer/key event). resume() is retried on init and on
       every play call to recover from the iOS 'suspended'/'interrupted' state.
     - SFX respect Settings.sound (read via soundEnabled flag); music respects
       Settings.music. Flags are mirrored by setSound()/setMusic().
     - SFX pitches follow the brief exactly (pentatonic combo ticks, ascending
       gold arpeggio, descending gameOver, etc.). No drums, no harsh tones.
     - Music is a gentle generative ambient loop: soft pad chords (~0.03 vol)
       plus sparse plucked pentatonic notes (~0.05 vol) through a lowpass,
       scheduled with a 100ms lookahead ticker scheduling ~180ms ahead.
   ========================================================================== */
(function () {
  'use strict';

  /* ===== Note frequencies (Hz) ===== */
  var N = {
    A3: 220.0, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
    A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880.0, C6: 1046.5, D6: 1174.66, E6: 1318.51,
    G6: 1567.98, C7: 2093.0
  };
  var SEMITONE = Math.pow(2, 1 / 12);
  var CATCH_MAX_OFFSET = 14; /* semitone cap for combo pitch climb */

  /* ===== Music data ===== */
  var SCALE = [N.A3, N.C4, N.D4, N.E4, N.G4, N.A4, N.C5];
  /* 8-step arpeggio motif (indices into SCALE); -1 = rest. */
  var MOTIF = [0, 2, 4, 5, 4, 2, 3, 1];
  /* Soft pentatonic pad chords, cycled every 8 steps (indices into SCALE). */
  var PADS = [
    [0, 2, 4], /* A3 C4 E4 */
    [2, 4, 6], /* C4 E4 C5 */
    [1, 4, 5]  /* C4 G4 A4 */
  ];
  var STEP_DUR = 0.3;
  var PAD_CYCLE = 8; /* 8 steps = 2.4s per chord */

  /* ===== State ===== */
  var ctx = null;
  var master = null;
  var comp = null;
  var musicBus = null;
  var noiseBuffer = null;

  var soundOn = true;
  var musicOn = true;

  var musicTimer = null;
  var nextStep = 0;
  var stepCount = 0;
  var musicNodes = []; /* scheduled oscillators, tracked for stopMusic() */

  /* ===== Context management ===== */

  function resume() {
    if (!ctx) return;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try {
        var r = ctx.resume();
        if (r && r.catch) r.catch(function () {});
      } catch (e) { /* noop */ }
    }
  }

  function init() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || ctx) {
      if (ctx) resume();
      return;
    }

    ctx = new AC();

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 24;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.9;
    musicBus.connect(master);

    noiseBuffer = makeNoiseBuffer();

    resume();

    if (musicOn) startMusic();
  }

  /* One second of white noise, reused by every noise() burst. */
  function makeNoiseBuffer() {
    var len = ctx.sampleRate;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /* ===== Helpers ===== */

  function tone(opts) {
    if (!ctx || !soundOn) return;
    resume();

    var freq = opts.freq || 440;
    var dur = opts.dur != null ? opts.dur : 0.1;
    var type = opts.type || 'sine';
    var vol = opts.vol != null ? opts.vol : 0.2;
    var glideTo = opts.glideTo;
    var delay = opts.delay || 0;
    var attack = opts.attack != null ? opts.attack : 0.005;

    var t0 = ctx.currentTime + delay;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), t0);
    if (glideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    }

    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    osc.onended = function () {
      try { osc.disconnect(); g.disconnect(); } catch (e) { /* noop */ }
    };
  }

  function noise(opts) {
    if (!ctx || !soundOn || !noiseBuffer) return;
    resume();

    var dur = opts.dur != null ? opts.dur : 0.2;
    var vol = opts.vol != null ? opts.vol : 0.3;
    var filterFreq = opts.filterFreq || 1000;
    var filterType = opts.filterType || 'lowpass';
    var delay = opts.delay || 0;
    var attack = opts.attack != null ? opts.attack : 0.005;

    var t0 = ctx.currentTime + delay;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    var f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = filterFreq;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    src.onended = function () {
      try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { /* noop */ }
    };
  }

  /* ===== SFX ===== */

  /* Short 800->600Hz square blip. */
  function click() {
    tone({ freq: 800, glideTo: 600, dur: 0.06, type: 'square', vol: 0.15 });
  }

  /* Soft high sine, very quiet. */
  function hover() {
    tone({ freq: 1200, dur: 0.03, type: 'sine', vol: 0.045 });
  }

  /* Descending two-note. */
  function back() {
    tone({ freq: N.E5, dur: 0.09, type: 'triangle', vol: 0.16 });
    tone({ freq: N.B4, dur: 0.12, type: 'triangle', vol: 0.14, delay: 0.09 });
  }

  /* Rising two-note chirp. */
  function uiOpen() {
    tone({ freq: N.D5, dur: 0.09, type: 'triangle', vol: 0.16 });
    tone({ freq: N.A5, dur: 0.12, type: 'triangle', vol: 0.14, delay: 0.08 });
  }

  /* Falling two-note chirp. */
  function uiClose() {
    tone({ freq: N.A5, dur: 0.09, type: 'triangle', vol: 0.16 });
    tone({ freq: N.D5, dur: 0.12, type: 'triangle', vol: 0.14, delay: 0.08 });
  }

  /* Pentatonic tick that climbs with combo; base C5, +combo*2 semitones. */
  function catchStar(combo) {
    var offset = Math.min((combo || 0) * 2, CATCH_MAX_OFFSET);
    var freq = N.C5 * Math.pow(SEMITONE, offset);
    tone({ freq: freq, dur: 0.09, type: 'triangle', vol: 0.2 });
    /* Brightness partial. */
    tone({ freq: freq * 2, dur: 0.05, type: 'sine', vol: 0.045, delay: 0.02 });
  }

  /* Bright 3-note ascending arpeggio (C6 E6 G6) + sparkle. */
  function gold() {
    tone({ freq: N.C6, dur: 0.09, type: 'triangle', vol: 0.18 });
    tone({ freq: N.E6, dur: 0.09, type: 'triangle', vol: 0.18, delay: 0.07 });
    tone({ freq: N.G6, dur: 0.14, type: 'triangle', vol: 0.18, delay: 0.14 });
    tone({ freq: N.C7, dur: 0.22, type: 'sine', vol: 0.05, delay: 0.16 });
    tone({ freq: N.G6 * 2, dur: 0.16, type: 'sine', vol: 0.03, delay: 0.2 });
  }

  /* Low boom (140->50Hz) + muffled noise burst. */
  function hurt() {
    tone({ freq: 140, glideTo: 50, dur: 0.3, type: 'sine', vol: 0.45 });
    noise({ dur: 0.25, vol: 0.28, filterFreq: 400, filterType: 'lowpass', delay: 0.01 });
  }

  /* Soft descending two-note plop. */
  function miss() {
    tone({ freq: N.G3, glideTo: 160, dur: 0.12, type: 'sine', vol: 0.14 });
    tone({ freq: 146.83, dur: 0.16, type: 'sine', vol: 0.12, delay: 0.1 }); /* D3 */
  }

  /* Ascending 4-note fanfare (C5 D5 E5 G5) + shimmer. */
  function levelUp() {
    tone({ freq: N.C5, dur: 0.12, type: 'triangle', vol: 0.2 });
    tone({ freq: N.D5, dur: 0.12, type: 'triangle', vol: 0.2, delay: 0.08 });
    tone({ freq: N.E5, dur: 0.12, type: 'triangle', vol: 0.2, delay: 0.16 });
    tone({ freq: N.G5, dur: 0.2, type: 'triangle', vol: 0.2, delay: 0.24 });
    tone({ freq: N.G6, dur: 0.3, type: 'sine', vol: 0.05, delay: 0.3 });
  }

  /* Gentle descending 4-note (G4 E4 C4 A3), slower, not harsh. */
  function gameOver() {
    tone({ freq: N.G4, dur: 0.4, type: 'sine', vol: 0.16 });
    tone({ freq: N.E4, dur: 0.4, type: 'sine', vol: 0.16, delay: 0.18 });
    tone({ freq: N.C4, dur: 0.4, type: 'sine', vol: 0.15, delay: 0.36 });
    tone({ freq: N.A3, dur: 0.5, type: 'sine', vol: 0.14, delay: 0.54 });
  }

  /* Triumphant 5-note major fanfare + high shimmer. */
  function record() {
    tone({ freq: N.C5, dur: 0.1, type: 'triangle', vol: 0.2 });
    tone({ freq: N.E5, dur: 0.1, type: 'triangle', vol: 0.2, delay: 0.07 });
    tone({ freq: N.G5, dur: 0.1, type: 'triangle', vol: 0.2, delay: 0.14 });
    tone({ freq: N.C6, dur: 0.12, type: 'triangle', vol: 0.2, delay: 0.21 });
    tone({ freq: N.E6, dur: 0.38, type: 'triangle', vol: 0.2, delay: 0.28 });
    tone({ freq: N.C7, dur: 0.3, type: 'sine', vol: 0.05, delay: 0.3 });
    tone({ freq: N.G6 * 2, dur: 0.3, type: 'sine', vol: 0.03, delay: 0.34 });
  }

  /* ===== Music ===== */

  function musicNote(freq, t, dur, vol) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1600;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(f);
    f.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    musicNodes.push({ osc: osc, g: g });
  }

  function musicPad(freq, t, dur, vol) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.8);
    g.gain.setValueAtTime(vol, t + dur - 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(f);
    f.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    musicNodes.push({ osc: osc, g: g });
  }

  function scheduleStep(step, t) {
    /* Pad chord every 8 steps, held for the full cycle. */
    if (step % PAD_CYCLE === 0) {
      var chord = PADS[(step / PAD_CYCLE) % PADS.length | 0];
      for (var c = 0; c < chord.length; c++) {
        musicPad(SCALE[chord[c]], t, PAD_CYCLE * STEP_DUR + 0.2, 0.028);
      }
    }

    /* Sparse arpeggio plucks. */
    if (step % 4 === 3) return; /* a rest keeps it sparse */
    var idx = MOTIF[step % MOTIF.length];
    var freq = SCALE[idx];
    /* Occasional octave lift for gentle movement. */
    if (step % 8 === 6) freq *= 2;
    musicNote(freq, t, 0.24, 0.05);
  }

  function musicTick() {
    if (!ctx || !musicOn) return;
    resume();
    var ahead = ctx.currentTime + 0.18;
    while (nextStep < ahead) {
      scheduleStep(stepCount, nextStep);
      stepCount++;
      nextStep += STEP_DUR;
    }
  }

  function startMusic() {
    if (!ctx || !musicOn) return;
    stopMusic();
    stepCount = 0;
    nextStep = ctx.currentTime + 0.1;
    if (musicBus) {
      try { musicBus.gain.setTargetAtTime(0.9, ctx.currentTime, 0.05); } catch (e) { /* noop */ }
    }
    musicTimer = setInterval(musicTick, 100);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    /* Fade the bus out quickly to avoid clicks. */
    if (ctx && musicBus) {
      try {
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      } catch (e) { /* noop */ }
    }
    /* Stop and free anything already scheduled. */
    for (var i = 0; i < musicNodes.length; i++) {
      var n = musicNodes[i];
      try {
        n.osc.stop(0);
        n.osc.disconnect();
        n.g.disconnect();
      } catch (e) { /* noop */ }
    }
    musicNodes.length = 0;
  }

  /* ===== Flag control ===== */

  function setSound(b) {
    soundOn = !!b;
  }

  function setMusic(b) {
    musicOn = !!b;
    if (musicOn) {
      if (ctx) startMusic();
    } else {
      stopMusic();
    }
  }

  /* ===== Export ===== */
  window.GameAudio = {
    init: init,
    setSound: setSound,
    setMusic: setMusic,
    click: click,
    hover: hover,
    back: back,
    uiOpen: uiOpen,
    uiClose: uiClose,
    catch: function (combo) { catchStar(combo); },
    gold: gold,
    hurt: hurt,
    miss: miss,
    levelUp: levelUp,
    gameOver: gameOver,
    record: record,
    startMusic: startMusic,
    stopMusic: stopMusic
  };
})();
