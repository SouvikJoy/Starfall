/* ==========================================================================
   STARFALL — Core game engine
   Pod control, falling items (stars / gold / comets), scoring, combos,
   lives, difficulty ramp, background starfield, floating text, screen shake.

   Public API (window.Game):
     init(canvas), resize(), startRun(), pause(), resume(), endToMenu(),
     update(dt), draw(), setControl(c), on(event, cb), getSnapshot(),
     setReducedMotion(b)

   Events emitted: score, combo, lives, level, toast, hurt, newrecord, gameover
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var DPR_CAP = 2;

  var canvas = null;
  var ctx = null;
  var W = 0;
  var H = 0;
  var dpr = 1;

  var state = 'idle'; /* idle | playing | paused | over */
  var reduced = false;
  var time = 0;

  var control = { pointerActive: false, pointerOnCanvas: false, pointerX: 0, axisX: 0, usingTouch: false };

  /* ---------- Run state ---------- */
  var score = 0;
  var combo = 0;
  var maxCombo = 0;
  var mult = 1;
  var lives = 3;
  var elapsed = 0;
  var level = 1;
  var starsCaught = 0;
  var invuln = 0;
  var newRecord = false;
  var recordFired = false;

  var spawnTimer = 0.6;
  var d1 = 0; /* difficulty 0..1 */
  var d2 = 0;

  var pod = {
    x: 0, targetX: 0, y: 0, w: 90, h: 30,
    vx: 0, tilt: 0, squash: 0, blink: 0
  };

  /* ---------- Pools ---------- */
  var items = [];
  var ITEM_CAP = 48;
  var texts = [];
  var TEXT_CAP = 20;
  var usedItems = 0;

  /* ---------- Background ---------- */
  var stars = [];
  var blobA = null;
  var blobB = null;
  var shoot = null;
  var shootTimer = 3 + Math.random() * 4;
  var rockVerts = [];

  /* ---------- Effects ---------- */
  var shakeT = 9; /* >= dur means no shake */
  var shakeDur = 0;
  var shakeMag = 0;

  /* ---------- Gradients (rebuilt on resize) ---------- */
  var gradPod = null;
  var gradGold = null;
  var gradGoldBright = null;
  var gradTail = null;
  var gradGround = null;

  /* ---------- Level themes (cycling, endless tiers) ---------- */
  var THEMES = [
    { name: 'Aurora',   accent: '#7ee9ff', nebA: 'rgba(34,211,238,0.24)',  nebB: 'rgba(167,139,250,0.18)',
      groundTop: 'rgba(34,211,238,0)',     groundBottom: 'rgba(34,211,238,0.20)',
      motes: ['#7ee9ff', '#a78bfa', '#eef3ff', '#3ddc97'],
      confetti: ['#22d3ee', '#a78bfa', '#ffc24b', '#3ddc97'] },
    { name: 'Nebula',   accent: '#c9b8ff', nebA: 'rgba(167,139,250,0.24)', nebB: 'rgba(255,107,203,0.18)',
      groundTop: 'rgba(167,139,250,0)',    groundBottom: 'rgba(167,139,250,0.20)',
      motes: ['#c9b8ff', '#ff6bcb', '#eef3ff', '#7ee9ff'],
      confetti: ['#a78bfa', '#ff6bcb', '#22d3ee', '#ffffff'] },
    { name: 'Gold Rush', accent: '#ffd98a', nebA: 'rgba(255,194,75,0.24)', nebB: 'rgba(255,157,60,0.18)',
      groundTop: 'rgba(255,194,75,0)',     groundBottom: 'rgba(255,194,75,0.20)',
      motes: ['#ffd98a', '#ffc24b', '#eef3ff', '#ff9d3c'],
      confetti: ['#ffc24b', '#ffd98a', '#ff9d3c', '#ffffff'] },
    { name: 'Rose Field', accent: '#ff9db0', nebA: 'rgba(255,107,129,0.24)', nebB: 'rgba(255,107,203,0.18)',
      groundTop: 'rgba(255,107,129,0)',    groundBottom: 'rgba(255,107,129,0.20)',
      motes: ['#ff9db0', '#ff6bcb', '#eef3ff', '#ffd98a'],
      confetti: ['#ff6b81', '#ff6bcb', '#ffc24b', '#ffffff'] },
    { name: 'Emerald',  accent: '#7deec0', nebA: 'rgba(61,220,151,0.24)',  nebB: 'rgba(34,211,238,0.18)',
      groundTop: 'rgba(61,220,151,0)',     groundBottom: 'rgba(61,220,151,0.20)',
      motes: ['#7deec0', '#3ddc97', '#eef3ff', '#7ee9ff'],
      confetti: ['#3ddc97', '#22d3ee', '#ffc24b', '#ffffff'] },
    { name: 'Ocean',    accent: '#8fb0ff', nebA: 'rgba(92,141,255,0.24)',  nebB: 'rgba(34,211,238,0.18)',
      groundTop: 'rgba(92,141,255,0)',     groundBottom: 'rgba(92,141,255,0.20)',
      motes: ['#8fb0ff', '#5c8dff', '#eef3ff', '#7ee9ff'],
      confetti: ['#5c8dff', '#22d3ee', '#a78bfa', '#ffffff'] },
    { name: 'Sunset',   accent: '#ffc07a', nebA: 'rgba(255,157,60,0.24)',  nebB: 'rgba(255,107,129,0.18)',
      groundTop: 'rgba(255,157,60,0)',     groundBottom: 'rgba(255,157,60,0.20)',
      motes: ['#ffc07a', '#ff9d3c', '#eef3ff', '#ff6b81'],
      confetti: ['#ff9d3c', '#ff6b81', '#ffc24b', '#ffffff'] },
    { name: 'Galaxy',   accent: '#a78bfa', nebA: 'rgba(167,139,250,0.24)', nebB: 'rgba(255,194,75,0.16)',
      groundTop: 'rgba(167,139,250,0)',    groundBottom: 'rgba(167,139,250,0.20)',
      motes: ['#a78bfa', '#7ee9ff', '#ffc24b', '#eef3ff'],
      confetti: ['#a78bfa', '#22d3ee', '#ffc24b', '#ff6bcb'] }
  ];
  var themeIndex = 0;
  var theme = THEMES[0];

  /* ---------- Ambient emitter state ---------- */
  var ambientTimer = 0;
  var trailTimer = 0;

  /* ---------- Events ---------- */
  var listeners = {};
  function on(name, cb) { (listeners[name] || (listeners[name] = [])).push(cb); }
  function emit(name, data) {
    var arr = listeners[name];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) arr[i](data);
  }

  /* ======================================================================
     Sizing & setup
     ====================================================================== */

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    pod.w = clamp(W * 0.16, 92, 168);
    pod.h = pod.w * 0.34;
    pod.y = H - Math.max(26, H * 0.03) - pod.h;
    pod.x = clamp(pod.x, pod.w / 2, W - pod.w / 2);
    pod.targetX = pod.x;

    buildGradients();
    buildNebula();
    buildRock();
    initStars();
  }

  function buildGradients() {
    var w = pod.w, h = pod.h;
    var g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#3ce0ff');
    g.addColorStop(0.55, '#22d3ee');
    g.addColorStop(1, '#8b6cf0');
    gradPod = g;

    gradGold = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradGold.addColorStop(0, '#ffe7ad');
    gradGold.addColorStop(0.55, '#ffc24b');
    gradGold.addColorStop(1, '#ff8a3c');

    gradGoldBright = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradGoldBright.addColorStop(0, '#fff4d6');
    gradGoldBright.addColorStop(0.5, '#ffd98a');
    gradGoldBright.addColorStop(1, '#ffb02e');

    gradTail = ctx.createLinearGradient(0, -3.4, 0, -0.8);
    gradTail.addColorStop(0, 'rgba(255,176,46,0)');
    gradTail.addColorStop(1, 'rgba(255,107,129,0.85)');

    buildGroundGradient();
  }

  /* Ground glow follows the current theme. */
  function buildGroundGradient() {
    gradGround = ctx.createLinearGradient(0, pod.y - 56, 0, pod.y);
    gradGround.addColorStop(0, theme.groundTop);
    gradGround.addColorStop(1, theme.groundBottom);
  }

  /* Rebuild the two drifting nebula blobs from the current theme. */
  function buildNebula() {
    blobA = makeBlob(0.58, [theme.nebA, 'rgba(0,0,0,0)']);
    blobB = makeBlob(0.55, [theme.nebB, 'rgba(0,0,0,0)']);
  }

  /* Swap the run's visual theme (called on resize + every level-up). */
  function applyTheme(idx) {
    themeIndex = ((idx % THEMES.length) + THEMES.length) % THEMES.length;
    theme = THEMES[themeIndex];
    buildNebula();
    buildGroundGradient();
  }

  function makeBlob(radius, stops) {
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(W));
    c.height = Math.max(2, Math.round(H));
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * radius);
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function buildRock() {
    rockVerts = [];
    for (var i = 0; i < 8; i++) {
      rockVerts.push(0.78 + Math.random() * 0.28);
    }
  }

  function initStars() {
    stars = [];
    var layers = reduced
      ? [[20, 6], [12, 14]]
      : [[90, 4], [52, 12], [30, 24]];
    for (var l = 0; l < layers.length; l++) {
      var count = layers[l][0];
      var speed = H * (layers[l][1] / 1000);
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.5 + Math.random() * 1.4,
          a: 0.25 + Math.random() * 0.6,
          tw: 0.8 + Math.random() * 2,
          ph: Math.random() * TAU,
          speed: speed
        });
      }
    }
  }

  /* ======================================================================
     Run lifecycle
     ====================================================================== */

  function startRun() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    mult = 1;
    lives = 3;
    elapsed = 0;
    level = 1;
    starsCaught = 0;
    invuln = 0;
    spawnTimer = 0.6;
    newRecord = false;
    recordFired = false;
    d1 = 0;
    d2 = 0;
    for (var i = 0; i < items.length; i++) items[i].active = false;
    usedItems = 0;
    for (var j = 0; j < texts.length; j++) texts[j].active = false;
    if (window.Particles) Particles.clear();
    pod.x = W / 2;
    pod.targetX = W / 2;
    pod.squash = 0;
    applyTheme(0);
    state = 'playing';

    emit('score', { score: score });
    emit('combo', { combo: combo, mult: mult, fill: 0 });
    emit('lives', { lives: lives });
    emit('level', { level: level, name: theme.name, accent: theme.accent });
  }

  function pause() { if (state === 'playing') state = 'paused'; }
  function resume() { if (state === 'paused') state = 'playing'; }

  function endToMenu() {
    state = 'idle';
    for (var i = 0; i < items.length; i++) items[i].active = false;
    usedItems = 0;
    for (var j = 0; j < texts.length; j++) texts[j].active = false;
    if (window.Particles) Particles.clear();
    shakeT = 9;
  }

  /* ======================================================================
     Item spawning
     ====================================================================== */

  function acquireItem() {
    for (var i = 0; i < items.length; i++) {
      if (!items[i].active) return items[i];
    }
    if (items.length < ITEM_CAP) {
      var it = {
        active: false, type: 'star', x: 0, y: 0, baseX: 0, r: 10,
        vy: 0, rot: 0, rotVel: 0, wobAmp: 0, wobFreq: 0, wobPh: 0, seed: 0
      };
      items.push(it);
      return it;
    }
    return null;
  }

  function spawnItem() {
    var it = acquireItem();
    if (!it) return;
    var r = clamp(W * 0.026, 13, 22);
    var pick = Math.random();
    var goldP = 0.08; /* fixed, per project rule #3 */
    var cometP = 0.07 + d1 * 0.20; /* ramps 7% -> 27% */
    var type = 'star';
    if (pick < goldP) type = 'gold';
    else if (pick < goldP + cometP) type = 'comet';

    it.active = true;
    it.type = type;
    it.r = type === 'gold' ? r * 1.12 : r;
    it.baseX = it.x = r + Math.random() * (W - r * 2);
    it.y = -it.r - 6;
    it.vy = lerp(0.32, 0.66, d1) * H * (0.9 + Math.random() * 0.2);
    it.rot = Math.random() * TAU;
    it.rotVel = type === 'comet' ? 1.2 : 0.7;
    it.wobAmp = type === 'comet' ? it.r * 0.12 : it.r * 0.4;
    it.wobFreq = 1.6 + Math.random() * 1.4;
    it.wobPh = Math.random() * TAU;
    it.seed = Math.random() * 100;
    usedItems++;
  }

  /* ======================================================================
     Core update
     ====================================================================== */

  function update(dt) {
    time += dt;

    updateBackground(dt);
    updateShake(dt);
    updateTexts(dt);
    if (window.Particles) Particles.update(dt);

    if (state === 'playing') {
      elapsed += dt;
      updateDifficulty();
      updatePod(dt);
      updateItems(dt);

      invuln -= dt;
      if (invuln < 0) invuln = 0;

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnItem();
        var interval = lerp(0.92, 0.34, d1) * (0.88 + Math.random() * 0.24);
        spawnTimer = interval;
      }
    } else if (state === 'over') {
      /* Let remaining items fall out peacefully; no interactions. */
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.active) continue;
        it.y += it.vy * dt;
        if (it.y - it.r > H + 40) { it.active = false; usedItems--; }
      }
    }

    if (pod.blink > 0) pod.blink -= dt;
  }

  function updateDifficulty() {
    var lvl = 1 + Math.floor(elapsed / 18);
    if (lvl !== level) {
      level = lvl;
      d1 = clamp((level - 1) / 11, 0, 1); /* full difficulty at level 12 */
      applyTheme(level - 1);
      emit('level', { level: level, name: theme.name, accent: theme.accent });
      emit('levelup', { level: level, name: theme.name, accent: theme.accent });
      if (window.GameAudio) GameAudio.levelUp();
      if (window.Particles) {
        Particles.burst({ type: 'confetti', x: pod.x, y: pod.y - pod.h, count: 48, colors: theme.confetti });
        Particles.burst({ type: 'ring', x: pod.x, y: pod.y - pod.h, count: 2, speed: 300, colors: [theme.accent, '#ffffff'] });
        Particles.burst({ type: 'spark', x: pod.x, y: pod.y - pod.h, count: 22, colors: theme.motes, speed: 240 });
      }
    }
  }

  function updatePod(dt) {
    var speed = W * 1.35; /* px/s keyboard/pad speed */
    if (control.pointerActive && control.pointerOnCanvas) {
      pod.targetX = clamp(control.pointerX, pod.w / 2, W - pod.w / 2);
    } else if (control.axisX !== 0) {
      pod.targetX += control.axisX * speed * dt;
      pod.targetX = clamp(pod.targetX, pod.w / 2, W - pod.w / 2);
    }
    var prev = pod.x;
    var k = 1 - Math.exp(-14 * dt);
    pod.x += (pod.targetX - pod.x) * k;
    pod.vx = dt > 0 ? (pod.x - prev) / dt : 0;

    var targetTilt = clamp(pod.vx * 0.0022, -0.26, 0.26);
    pod.tilt += (targetTilt - pod.tilt) * (1 - Math.exp(-10 * dt));
    pod.squash *= Math.exp(-9 * dt);
  }

  function updateItems(dt) {
    var podTop = pod.y - pod.h * 0.5;
    var podBot = pod.y + pod.h * 0.5;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.active) continue;

      it.y += it.vy * dt;
      it.rot += it.rotVel * dt;
      it.x = it.baseX + Math.sin(time * it.wobFreq + it.wobPh) * it.wobAmp;

      if (it.y + it.r < podTop) continue; /* still above pod */

      var half = pod.w * 0.5 + it.r * 0.5;
      var overlapX = Math.abs(it.x - pod.x) <= half;

      if (it.y - it.r <= podBot + it.r * 0.5) {
        if (overlapX) {
          if (state === 'playing') {
            if (it.type === 'comet') {
              if (invuln <= 0) hurtPod(it);
            } else {
              catchItem(it);
            }
          }
          removeItem(i);
        } else if (it.y - it.r > podBot) {
          if (state === 'playing') groundItem(it);
          removeItem(i);
        }
      }
    }
  }

  function removeItem(idx) {
    if (items[idx].active) usedItems--;
    items[idx].active = false;
  }

  function catchItem(it) {
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    var newMult = Math.min(1 + Math.floor(combo / 5), 10);
    var multBumped = newMult > mult;
    mult = newMult;

    var isGold = it.type === 'gold';
    var pts = (isGold ? 50 : 10) * mult;
    score += pts;
    starsCaught++;

    emit('score', { score: score });
    emit('combo', { combo: combo, mult: mult, fill: (combo % 5) / 5 });

    pod.squash = 1;

    var cx = it.x;
    var cy = pod.y - pod.h * 0.5;
    addText(cx, pod.y - pod.h - 12, '+' + pts, isGold ? '#ffd98a' : theme.accent, isGold ? 20 : 15);

    if (isGold) {
      if (window.Particles) {
        Particles.burst({ type: 'ring', x: cx, y: cy, count: 1, speed: 240, colors: ['#ffd98a'] });
        Particles.burst({ type: 'rays', x: cx, y: cy, count: 18, colors: ['#ffd98a', '#ffc24b', '#ffffff'] });
        Particles.burst({ type: 'spark', x: cx, y: cy, count: 26, colors: ['#ffc24b', '#ffd98a', '#ffffff'], speed: 280 });
      }
      if (window.GameAudio) GameAudio.gold();
    } else {
      if (window.Particles) {
        Particles.burst({ type: 'spark', x: cx, y: cy, count: 16, colors: [theme.accent, '#22d3ee', '#ffffff'], speed: 210 });
      }
      if (window.GameAudio) GameAudio.catch(combo);
    }

    if (multBumped) {
      emit('toast', { text: 'Combo x' + mult + '!', tone: 'gold' });
      if (window.Particles) {
        Particles.burst({ type: 'ring', x: cx, y: cy, count: 1, speed: 200, colors: ['#ffc24b'] });
      }
    }

    if (!recordFired && window.Settings && Settings.best > 0 && score > Settings.best) {
      recordFired = true;
      newRecord = true;
      emit('newrecord', { score: score });
    }
  }

  function groundItem(it) {
    if (it.type === 'comet') {
      /* Safe landing — small dust, no penalty. */
      if (window.Particles) {
        Particles.burst({ type: 'debris', x: it.x, y: pod.y, count: 4, colors: ['#6b7aa3', '#ff6b81'], gravity: 300, speed: 90 });
      }
      return;
    }
    combo = 0;
    mult = 1;
    emit('combo', { combo: 0, mult: 1, fill: 0 });
    if (window.GameAudio) GameAudio.miss();
    addText(it.x, pod.y - 14, 'Miss', '#9fb0d0', 13);
    if (window.Particles) {
      Particles.burst({ type: 'trail', x: it.x, y: pod.y, count: 6, colors: ['#6b7aa3'], gravity: 0, speed: 60 });
    }
  }

  function hurtPod(it) {
    lives--;
    combo = 0;
    mult = 1;
    invuln = 1.2;
    pod.blink = 1.2;

    emit('lives', { lives: lives });
    emit('combo', { combo: 0, mult: 1, fill: 0 });
    emit('hurt', {});

    shake(0.38, 14);
    addText(it.x, pod.y - pod.h - 12, 'Ouch!', '#ff9db0', 18);

    if (window.Particles) {
      Particles.burst({ type: 'debris', x: it.x, y: pod.y - 10, count: 22, colors: ['#ff6b81', '#ff5f78', '#ff9db0', '#ffffff'], speed: 280, gravity: 440 });
      Particles.burst({ type: 'ring', x: it.x, y: pod.y - 10, count: 2, speed: 240, colors: ['#ff6b81'] });
    }
    if (window.GameAudio) GameAudio.hurt();

    if (lives <= 0) {
      gameOver();
    }
  }

  function gameOver() {
    state = 'over';
    shake(0.55, 18);
    if (window.GameAudio) GameAudio.gameOver();
    if (window.Particles) {
      Particles.burst({ type: 'debris', x: pod.x, y: pod.y, count: 26, colors: [theme.accent, '#22d3ee', '#8b6cf0', '#ffffff'], speed: 320, gravity: 500 });
      Particles.burst({ type: 'ring', x: pod.x, y: pod.y, count: 3, speed: 360, colors: ['#ff6b81', theme.accent] });
    }

    var best = (window.Settings && Settings.best) || 0;
    newRecord = score > best;

    if (newRecord && window.Particles) {
      Particles.burst({ type: 'confetti', x: W / 2, y: H * 0.4, count: 90, colors: ['#22d3ee', '#a78bfa', '#ffc24b', '#3ddc97', '#ff6b81', '#ff6bcb'] });
      Particles.burst({ type: 'ring', x: W / 2, y: H * 0.4, count: 3, speed: 380, colors: ['#ffd98a', '#ffffff'] });
    }

    emit('gameover', {
      score: score,
      bestCombo: maxCombo,
      starsCaught: starsCaught,
      level: level,
      newRecord: newRecord
    });
  }

  /* ======================================================================
     Background (always running)
     ====================================================================== */

  function updateBackground(dt) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.y += s.speed * dt;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
    }

    if (reduced) { shoot = null; return; }

    /* Always-on ambient motes drifting up from the field floor, tinted by theme. */
    ambientTimer -= dt;
    if (ambientTimer <= 0) {
      ambientTimer = 0.26 + Math.random() * 0.2;
      if (window.Particles) {
        Particles.burst({
          type: 'mote',
          x: Math.random() * W,
          y: H + 10,
          count: 1 + ((Math.random() * 2) | 0),
          colors: theme.motes
        });
      }
    }

    /* Pointer sparkle trail — subtle interactivity, colored by the theme. */
    trailTimer -= dt;
    if (control.pointerActive && control.pointerOnCanvas && trailTimer <= 0) {
      trailTimer = 0.035;
      if (window.Particles) {
        Particles.burst({
          type: 'spark',
          x: control.pointerX,
          y: control.pointerY,
          count: 1,
          colors: [theme.accent, '#ffffff'],
          speed: 14,
          life: 0.5,
          size: 1.6,
          gravity: 0
        });
      }
    }

    if (shoot) {
      shoot.x += shoot.vx * dt;
      shoot.y += shoot.vy * dt;
      shoot.life -= dt;
      if (shoot.life <= 0 || shoot.x > W + 120 || shoot.y > H + 120) shoot = null;
    } else {
      shootTimer -= dt;
      if (shootTimer <= 0) {
        shootTimer = 3.2 + Math.random() * 5;
        var sp = 340 + Math.random() * 300;
        shoot = {
          x: Math.random() * W * 0.6,
          y: Math.random() * H * 0.3,
          vx: sp,
          vy: sp * (0.35 + Math.random() * 0.25),
          life: 0.7,
          maxLife: 0.7
        };
      }
    }
  }

  function updateShake(dt) {
    if (shakeT < shakeDur) shakeT += dt;
  }

  function shake(dur, mag) {
    if (reduced) return;
    shakeDur = dur;
    shakeMag = mag;
    shakeT = 0;
  }

  /* ======================================================================
     Floating text
     ====================================================================== */

  function addText(x, y, text, color, size) {
    for (var i = 0; i < texts.length; i++) {
      if (!texts[i].active) return initText(texts[i], x, y, text, color, size);
    }
    if (texts.length < TEXT_CAP) {
      var t = { active: false, x: 0, y: 0, text: '', color: '#fff', size: 14, life: 0, maxLife: 0 };
      texts.push(t);
      return initText(t, x, y, text, color, size);
    }
  }

  function initText(t, x, y, text, color, size) {
    t.active = true;
    t.x = x;
    t.y = y;
    t.text = text;
    t.color = color;
    t.size = size;
    t.maxLife = 0.85;
    t.life = t.maxLife;
  }

  function updateTexts(dt) {
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      if (!t.active) continue;
      t.life -= dt;
      t.y -= 42 * dt;
      if (t.life <= 0) t.active = false;
    }
  }

  /* ======================================================================
     Rendering
     ====================================================================== */

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (shakeT < shakeDur) {
      var p = 1 - shakeT / shakeDur;
      var amp = shakeMag * p;
      ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
    }

    drawNebula();
    drawStars();
    drawShooting();
    drawGround();

    if (state !== 'idle') {
      drawItems();
      drawPod();
    }

    if (window.Particles) Particles.draw(ctx);
    drawTexts();

    ctx.restore();
  }

  function drawNebula() {
    if (!blobA) return;
    var dx = Math.sin(time * 0.02) * 12;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = reduced ? 0.5 : 1;
    ctx.drawImage(blobA, dx, Math.cos(time * 0.015) * 8, W, H);
    ctx.drawImage(blobB, -dx, 10, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = reduced ? s.a : s.a * (0.5 + 0.5 * Math.sin(time * s.tw + s.ph));
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShooting() {
    if (!shoot) return;
    var a = clamp(shoot.life / shoot.maxLife, 0, 1);
    var len = 70;
    var nx = shoot.vx / Math.hypot(shoot.vx, shoot.vy);
    var ny = shoot.vy / Math.hypot(shoot.vx, shoot.vy);
    var grad = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - nx * len, shoot.y - ny * len);
    grad.addColorStop(0, hexToRgba(theme.accent, 0.9 * a));
    grad.addColorStop(1, hexToRgba(theme.accent, 0));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoot.x, shoot.y);
    ctx.lineTo(shoot.x - nx * len, shoot.y - ny * len);
    ctx.stroke();
  }

  function drawGround() {
    ctx.fillStyle = gradGround;
    ctx.fillRect(0, pod.y - 56, W, 56);
    ctx.fillStyle = hexToRgba(theme.accent, 0.4);
    ctx.fillRect(0, pod.y - 1, W, 2);
  }

  function drawItems() {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.active) continue;
      if (it.y + it.r < -40) continue;
      if (it.type === 'comet') drawComet(it);
      else drawStar(it);
    }
  }

  function drawStar(it) {
    var r = it.r;
    var pulse = 1 + Math.sin(time * 3 + it.seed) * 0.06;
    var isGold = it.type === 'gold';
    var rr = r * pulse;

    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);

    ctx.shadowColor = isGold ? '#ffd98a' : '#ffc24b';
    ctx.shadowBlur = isGold ? 22 + Math.sin(time * 4 + it.seed) * 8 : 14;
    ctx.scale(rr, rr);
    ctx.fillStyle = isGold ? gradGoldBright : gradGold;
    starPath(0, 0, 1, 0.46);
    ctx.fill();
    ctx.restore();
  }

  function drawComet(it) {
    var r = it.r;
    ctx.save();
    ctx.translate(it.x, it.y);

    /* Flame tail (points up — the comet falls downward). */
    ctx.fillStyle = gradTail;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(-r * 0.7, -r * 2.2, 0, -r * 3.1);
    ctx.quadraticCurveTo(r * 0.7, -r * 2.2, 0, -r * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.rotate(it.rot);
    ctx.scale(r, r);
    ctx.fillStyle = '#d9485c';
    ctx.beginPath();
    for (var k = 0; k < rockVerts.length; k++) {
      var a = (k / rockVerts.length) * TAU;
      var px = Math.cos(a) * rockVerts[k];
      var py = Math.sin(a) * rockVerts[k];
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    /* Craters. */
    ctx.fillStyle = 'rgba(120,30,48,0.65)';
    ctx.beginPath(); ctx.arc(0.25, -0.15, 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-0.3, 0.2, 0.16, 0, TAU); ctx.fill();

    ctx.restore();
  }

  function drawPod() {
    var blinkOn = pod.blink > 0 && Math.floor(pod.blink * 14) % 2 === 0;

    ctx.save();
    ctx.translate(pod.x, pod.y);

    /* Under-glow. */
    var glow = ctx.createRadialGradient(0, pod.h * 0.35, 0, 0, pod.h * 0.35, pod.w * 0.62);
    glow.addColorStop(0, 'rgba(34,211,238,0.4)');
    glow.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-pod.w * 0.7, 0, pod.w * 1.4, pod.h * 1.4);

    ctx.rotate(pod.tilt);
    /* Squash & stretch. */
    var sy = 1 - pod.squash * 0.16;
    var sx = 1 + pod.squash * 0.12;
    ctx.scale(sx, sy);
    ctx.globalAlpha = blinkOn ? 0.35 : 1;

    /* Body. */
    ctx.shadowColor = 'rgba(34,211,238,0.55)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = gradPod;
    ctx.beginPath();
    ctx.ellipse(0, 0, pod.w / 2, pod.h / 2, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Rim. */
    ctx.strokeStyle = 'rgba(126,233,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, pod.w / 2, pod.h / 2, 0, 0, TAU);
    ctx.stroke();

    /* Dome. */
    ctx.fillStyle = 'rgba(238,243,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(-pod.w * 0.02, -pod.h * 0.3, pod.w * 0.24, pod.h * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-pod.w * 0.09, -pod.h * 0.44, pod.w * 0.09, pod.h * 0.11, 0, 0, TAU);
    ctx.fill();

    /* Side lights. */
    var i = 0;
    ctx.fillStyle = '#7ee9ff';
    ctx.shadowColor = '#7ee9ff';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(-pod.w * 0.34, pod.h * 0.16, pod.h * 0.11, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(pod.w * 0.34, pod.h * 0.16, pod.h * 0.11, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawTexts() {
    ctx.textAlign = 'center';
    ctx.font = '700 15px "Fredoka", ui-rounded, sans-serif';
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      if (!t.active) continue;
      var p = t.life / t.maxLife; /* 1 -> 0 */
      var pop = 1 + Math.max(0, (p - 0.8) / 0.2) * 0.7; /* quick pop-in */
      ctx.globalAlpha = p < 0.4 ? p / 0.4 : 1;
      ctx.font = '700 ' + Math.round(t.size * pop) + 'px "Fredoka", ui-rounded, sans-serif';
      ctx.strokeStyle = 'rgba(7,11,29,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  function starPath(x, y, outer, inner) {
    ctx.beginPath();
    for (var k = 0; k < 5; k++) {
      var a0 = (k * TAU) / 5 - Math.PI / 2;
      var a1 = a0 + TAU / 10;
      var px = x + Math.cos(a0) * outer;
      var py = y + Math.sin(a0) * outer;
      var qx = x + Math.cos(a1) * inner;
      var qy = y + Math.sin(a1) * inner;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      ctx.lineTo(qx, qy);
    }
    ctx.closePath();
  }

  /* ======================================================================
     Public API
     ====================================================================== */

  window.Game = {
    init: function (c) {
      canvas = c;
      ctx = canvas.getContext('2d');
      resize();
    },

    resize: resize,

    startRun: startRun,
    pause: pause,
    resume: resume,
    endToMenu: endToMenu,

    update: update,
    draw: draw,

    setControl: function (c) { control = c || control; },

    on: on,

    getSnapshot: function () {
      return {
        score: score,
        combo: combo,
        mult: mult,
        lives: lives,
        level: level,
        elapsed: elapsed
      };
    },

    setReducedMotion: function (b) {
      reduced = !!b;
      if (window.Particles) Particles.setReducedMotion(reduced);
      initStars();
    }
  };

  /* ---------- Helpers ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgba(hex, a) {
    var h = hex.replace('#', '');
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ---------- DEV TEST HOOK (removed before shipping) ---------- */
  function spawnTypeAt(type, x) {
    var it = acquireItem();
    if (!it) return false;
    var r = clamp(W * 0.026, 13, 22);
    it.active = true;
    it.type = type;
    it.r = type === 'gold' ? r * 1.12 : r;
    it.baseX = it.x = clamp(x, it.r, W - it.r);
    it.y = -it.r - 6;
    it.vy = H * 0.42;
    it.rot = 0;
    it.rotVel = 0.7;
    it.wobAmp = 0;
    it.wobFreq = 0;
    it.wobPh = 0;
    it.seed = 1;
    usedItems++;
    return true;
  }
  window.__test = {
    spawnAt: spawnTypeAt,
    getState: function () { return state; },
    getPod: function () { return { x: pod.x, y: pod.y, w: pod.w, h: pod.h }; }
  };
})();
