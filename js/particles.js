/* ==========================================================================
   STARFALL — Particle System
   --------------------------------------------------------------------------
   Pooled, allocation-free canvas particles for STARFALL.

   Public API:
     window.Particles = {
       setReducedMotion(b), update(dt), draw(ctx), clear(), burst(opts)
     }

   Types: 'spark' | 'confetti' | 'ring' | 'rays' | 'debris' | 'trail'
   Shapes: 'dot' | 'star' | 'rect'  (rays render as short lines internally)

   Colors follow the design tokens in css/tokens.css (gold / cyan / violet /
   rose / green / white). Effects never obscure gameplay: counts are capped,
   and reduced-motion mode disables additive glow and shadowBlur.

   Particles are pooled up front (cap 600 normal / 240 reduced); objects are
   recycled in place. update() and draw() allocate nothing per frame.
   ========================================================================== */
(function () {
  'use strict';

  /* ===== Constants ===== */
  var CAP_NORMAL = 1200;
  var CAP_REDUCED = 400;
  var TAU = Math.PI * 2;
  var UP = -Math.PI / 2;

  /* Design-token palette (css/tokens.css). */
  var GOLD = '#ffc24b';
  var GOLD_STRONG = '#ffd98a';
  var CYAN = '#22d3ee';
  var CYAN_STRONG = '#7ee9ff';
  var VIOLET = '#a78bfa';
  var ROSE = '#ff6b81';
  var GREEN = '#3ddc97';
  var WHITE = '#eef3ff';
  var ROCK = '#6b7aa3';
  var MAGENTA = '#ff6bcb';
  var ORANGE = '#ff9d3c';
  var BLUE = '#5c8dff';

  var PALETTE = [GOLD, GOLD_STRONG, CYAN, CYAN_STRONG, VIOLET, ROSE, GREEN, WHITE, MAGENTA, ORANGE, BLUE];

  /* Per-type defaults. Everything in opts can override these. */
  var TYPE_DEFAULTS = {
    spark: {
      speed: 230, speedVar: 90, angle: UP, spread: Math.PI * 1.6,
      life: 0.5, lifeVar: 0.2, size: 2.4, sizeVar: 1.2,
      gravity: 150, drag: 0, shape: 'dot', count: 10
    },
    confetti: {
      speed: 130, speedVar: 80, angle: UP, spread: Math.PI * 1.4,
      life: 1.5, lifeVar: 0.5, size: 5, sizeVar: 2,
      gravity: 430, drag: 0, shape: 'rect', count: 24
    },
    ring: {
      speed: 170, speedVar: 40, angle: 0, spread: 0,
      life: 0.42, lifeVar: 0.06, size: 2, sizeVar: 0,
      gravity: 0, drag: 0, shape: 'dot', count: 1
    },
    rays: {
      speed: 0, speedVar: 0, angle: 0, spread: TAU,
      life: 0.4, lifeVar: 0.08, size: 26, sizeVar: 8,
      gravity: 0, drag: 0, shape: 'line', count: 10
    },
    debris: {
      speed: 200, speedVar: 110, angle: UP, spread: Math.PI * 1.8,
      life: 0.7, lifeVar: 0.25, size: 4, sizeVar: 2,
      gravity: 520, drag: 0, shape: 'rect', count: 10
    },
    trail: {
      speed: 26, speedVar: 14, angle: UP, spread: Math.PI * 0.5,
      life: 0.55, lifeVar: 0.18, size: 2, sizeVar: 1,
      gravity: 0, drag: 0.85, shape: 'dot', count: 8
    },
    mote: {
      speed: 24, speedVar: 16, angle: UP, spread: Math.PI * 1.7,
      life: 3.2, lifeVar: 1.4, size: 1.8, sizeVar: 1.3,
      gravity: 0, drag: 0.62, shape: 'dot', count: 4
    }
  };

  /* Colors used when opts.colors is omitted, per type. */
  var TYPE_COLORS = {
    spark: [GOLD, GOLD_STRONG, CYAN_STRONG, WHITE],
    confetti: PALETTE,
    ring: [GOLD_STRONG, CYAN_STRONG, WHITE],
    rays: [GOLD, GOLD_STRONG, WHITE],
    debris: [ROSE, ROSE, WHITE, ROCK],
    trail: [CYAN, CYAN_STRONG, VIOLET, WHITE],
    mote: [CYAN_STRONG, VIOLET, GOLD, MAGENTA, WHITE]
  };

  /* Additive-composite (glow) types. */
  var GLOW_TYPES = { spark: true, ring: true, rays: true, mote: true };

  /* Rect aspect ratio per shape type: confetti streamers vs chunky debris. */
  var RECT_ASPECT = { confetti: 0.62, debris: 0.8 };

  /* ===== State ===== */
  var pool = [];
  var cursor = 0;
  var alive = 0;
  var reduced = false;

  /* Auto-honor the OS reduced-motion preference (accessibility). */
  if (typeof window !== 'undefined' && window.matchMedia) {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ===== Pool ===== */

  /* Preallocate all particle objects up front. */
  function preallocate() {
    pool.length = 0;
    for (var i = 0; i < CAP_NORMAL; i++) {
      pool.push({
        active: false, type: 'spark', shape: 'dot', color: WHITE,
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, age: 0, size: 1,
        rotation: 0, rotVel: 0, gravity: 0, dragMul: 1,
        radius: 0, radiusSpeed: 0,
        wobbleAmp: 0, wobbleFreq: 0, wobblePhase: 0
      });
    }
  }
  preallocate();

  /* Rotating-cursor free-slot scan; zero allocations. */
  function acquire() {
    var cap = reduced ? CAP_REDUCED : CAP_NORMAL;
    for (var i = 0; i < cap; i++) {
      cursor++;
      if (cursor >= cap) cursor = 0;
      var p = pool[cursor];
      if (!p.active) return p;
    }
    return null;
  }

  /* ===== Spawn ===== */

  function burst(opts) {
    if (!opts) return;
    var type = opts.type in TYPE_DEFAULTS ? opts.type : 'spark';
    var def = TYPE_DEFAULTS[type];
    var colors = opts.colors && opts.colors.length ? opts.colors : TYPE_COLORS[type];
    var nColors = colors.length;

    var count = opts.count != null ? Math.floor(opts.count) : def.count;
    if (type === 'ring') count = 1;
    if (reduced) count = Math.max(1, Math.ceil(count * 0.6));

    var speed = opts.speed != null ? opts.speed : def.speed;
    var speedVar = opts.speedVar != null ? opts.speedVar : def.speedVar;
    var angle = opts.angle != null ? opts.angle : def.angle;
    var spread = opts.spread != null ? opts.spread : def.spread;
    var life = opts.life != null ? opts.life : def.life;
    var lifeVar = opts.lifeVar != null ? opts.lifeVar : def.lifeVar;
    var size = opts.size != null ? opts.size : def.size;
    var sizeVar = opts.sizeVar != null ? opts.sizeVar : def.sizeVar;
    var gravity = opts.gravity != null ? opts.gravity : def.gravity;
    var drag = opts.drag != null ? opts.drag : def.drag;
    var shape = opts.shape || def.shape;

    /* Per-second drag as a per-frame velocity multiplier. */
    var dragMul = drag > 0 ? Math.pow(1 - drag, 1 / 60) : 1;

    var cap = reduced ? CAP_REDUCED : CAP_NORMAL;
    var room = cap - alive;
    if (count > room) count = room;

    for (var i = 0; i < count; i++) {
      var p = acquire();
      if (!p) break;

      var a = angle + (Math.random() * 2 - 1) * spread;
      var s = speed + (Math.random() * 2 - 1) * speedVar;
      if (s < 0) s = 0;
      var sz = size + (Math.random() * 2 - 1) * sizeVar;
      if (sz < 0.5) sz = 0.5;

      p.active = true;
      p.type = type;
      p.shape = shape;
      p.color = colors[(Math.random() * nColors) | 0];
      p.x = opts.x != null ? opts.x : 0;
      p.y = opts.y != null ? opts.y : 0;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.maxLife = life + (Math.random() * 2 - 1) * lifeVar;
      if (p.maxLife < 0.06) p.maxLife = 0.06;
      p.life = p.maxLife;
      p.age = 0;
      p.size = sz;
      p.gravity = gravity;
      p.dragMul = dragMul;
      p.rotation = Math.random() * TAU;
      p.rotVel = (Math.random() * 2 - 1) * 8;
      p.radius = 0;
      p.radiusSpeed = 0;

      if (type === 'confetti') {
        p.rotVel = (Math.random() * 2 - 1) * 7;
        p.wobbleAmp = 1.5 + Math.random() * 2.5;
        p.wobbleFreq = 6 + Math.random() * 10;
        p.wobblePhase = Math.random() * TAU;
      } else if (type === 'debris') {
        p.rotVel = (Math.random() * 2 - 1) * 9;
      } else if (type === 'ring') {
        /* speed drives radial growth; starts small, expands, fades. */
        p.radius = 4 + Math.random() * 6;
        p.radiusSpeed = speed + (Math.random() * 2 - 1) * speedVar;
        if (p.radiusSpeed < 20) p.radiusSpeed = 20;
      } else if (type === 'rays') {
        /* static radiating lines with a gentle shimmer rotation. */
        p.vx = 0;
        p.vy = 0;
        p.rotation = 0;
        p.rotVel = (Math.random() * 2 - 1) * 1.6;
      } else if (type === 'trail') {
        p.rotVel = 0;
      } else if (type === 'mote') {
        p.rotVel = 0;
        p.wobblePhase = Math.random() * TAU;
        p.wobbleAmp = 6 + Math.random() * 10;
        p.wobbleFreq = 0.8 + Math.random() * 1.4;
      }

      alive++;
    }
  }

  /* ===== Update ===== */

  function update(dt) {
    if (dt <= 0) return;
    /* Clamp for background-tab catch-up; avoids tunneling + spiral of death. */
    if (dt > 0.05) dt = 0.05;

    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (!p.active) continue;

      p.age += dt;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        alive--;
        continue;
      }

      /* Integrate. */
      p.vy += p.gravity * dt;
      if (p.dragMul !== 1) {
        p.vx *= p.dragMul;
        p.vy *= p.dragMul;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'confetti') {
        /* Fall + settle: once nearly stopped, rest in place and fade. */
        if (Math.abs(p.vx) < 8 && Math.abs(p.vy) < 8) {
          p.vx = 0;
          p.vy = 0;
        }
        p.rotation +=
          (p.rotVel + Math.sin(p.age * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp) * dt;
      } else {
        p.rotation += p.rotVel * dt;
      }

      if (p.type === 'ring') p.radius += p.radiusSpeed * dt;

      if (p.type === 'mote') {
        /* Gentle aimless drift — slow horizontal sway + continued rise. */
        p.x += Math.sin(p.age * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp * dt;
        p.y -= 6 * dt;
      }
    }
  }

  /* ===== Draw ===== */

  function draw(ctx) {
    if (alive === 0) return;
    var mode = '';

    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (!p.active) continue;

      var t = p.life / p.maxLife; /* 1 -> 0 */
      var glow = !reduced && GLOW_TYPES[p.type];
      var m = glow ? 'lighter' : 'source-over';
      if (m !== mode) {
        ctx.globalCompositeOperation = m;
        mode = m;
      }

      switch (p.shape) {
        case 'star': drawStar(ctx, p, t, glow); break;
        case 'rect': drawRect(ctx, p, t); break;
        case 'line': drawLine(ctx, p, t, glow); break;
        default: drawDot(ctx, p, t, glow); break;
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawDot(ctx, p, t, glow) {
    var r = Math.max(0.3, p.size * (0.35 + 0.65 * t));
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    if (glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = r * 3;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawStar(ctx, p, t, glow) {
    var outer = Math.max(0.5, p.size * (0.45 + 0.55 * t) * 1.9);
    var inner = outer * 0.45;
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    if (glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = outer * 2.5;
    }
    ctx.beginPath();
    for (var k = 0; k < 5; k++) {
      var a0 = p.rotation + (k * TAU) / 5 - Math.PI / 2;
      var a1 = p.rotation + (k * TAU) / 5 + TAU / 10 - Math.PI / 2;
      var px = p.x + Math.cos(a0) * outer;
      var py = p.y + Math.sin(a0) * outer;
      var qx = p.x + Math.cos(a1) * inner;
      var qy = p.y + Math.sin(a1) * inner;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawRect(ctx, p, t) {
    var w = p.size;
    var h = p.size * (RECT_ASPECT[p.type] || 0.8);
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawLine(ctx, p, t, glow) {
    var len = p.size * (0.3 + 0.7 * t);
    var a = p.angle + p.rotation;
    ctx.globalAlpha = t;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, p.size * 0.16);
    ctx.lineCap = 'round';
    if (glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
    }
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* ===== Public control ===== */

  function setReducedMotion(b) {
    reduced = !!b;
    if (reduced) {
      /* Deactivate anything that no longer fits the reduced cap. */
      for (var i = CAP_REDUCED; i < pool.length; i++) {
        if (pool[i].active) {
          pool[i].active = false;
          alive--;
        }
      }
      if (cursor >= CAP_REDUCED) cursor = 0;
    }
  }

  function clear() {
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].active) {
        pool[i].active = false;
      }
    }
    alive = 0;
  }

  /* ===== Export ===== */
  window.Particles = {
    setReducedMotion: setReducedMotion,
    update: update,
    draw: draw,
    clear: clear,
    burst: burst
  };
})();
