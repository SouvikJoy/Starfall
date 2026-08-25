/* ==========================================================================
   STARFALL — UI controller
   Screen state machine, HUD updates, keyboard navigation, toasts, settings.
   ========================================================================== */
(function () {
  'use strict';

  var SCREENS = ['menu', 'howto', 'settings', 'pause', 'over'];
  var screens = {};
  var els = {};
  var toastTimer = null;
  var flashTimer = null;
  var vignetteTimer = null;
  var levelBannerTimer = null;

  /* ======================================================================
     Boot / element cache
     ====================================================================== */

  function $(id) { return document.getElementById(id); }

  function boot() {
    for (var i = 0; i < SCREENS.length; i++) {
      screens[SCREENS[i]] = $('screen-' + SCREENS[i]);
    }
    els.hud = $('hud');
    els.toast = $('toast');
    els.flash = $('flash');
    els.vignette = $('vignette');
    els.score = $('hud-score');
    els.best = $('hud-best');
    els.mult = $('hud-mult');
    els.comboFill = $('hud-combo-fill');
    els.comboCount = $('hud-combo-count');
    els.lives = $('hud-lives');
    els.levelLabel = $('hud-level-label');
    els.pauseScore = $('pause-score');
    els.pauseLevel = $('pause-level');
    els.menuBest = $('menu-best');
    els.overTitle = $('over-title');
    els.overNew = $('over-newrecord');
    els.overScore = $('over-score');
    els.overBest = $('over-best');
    els.overCombo = $('over-combo');
    els.overStars = $('over-stars');
    els.overLevel = $('over-level');
    els.setSound = $('set-sound');
    els.setMusic = $('set-music');
    els.setMotion = $('set-motion');
    els.levelBanner = $('level-banner');
    els.levelTag = $('level-banner-tag');
    els.levelName = $('level-banner-name');

    bindActions();
    bindHover();
    bindToggles();
    bindGameEvents();
    buildHearts();

    els.setSound.checked = Settings.sound;
    els.setMusic.checked = Settings.music;
    els.setMotion.checked = Settings.reducedMotion;

    applyReducedMotion();
    updateMenuBest();

    window.addEventListener('sf-key', onKey);
  }

  /* ======================================================================
     Buttons (data-action)
     ====================================================================== */

  function bindActions() {
    var buttons = document.querySelectorAll('[data-action]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var action = this.getAttribute('data-action');
        if (action) handleAction(action);
      });
    }
  }

  function bindHover() {
    var hovers = document.querySelectorAll('[data-action], .icon-btn');
    for (var i = 0; i < hovers.length; i++) {
      hovers[i].addEventListener('mouseenter', function () { play('hover'); });
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'play': startGame(); break;
      case 'howto': goto('howto'); play('click'); break;
      case 'settings': goto('settings'); play('click'); break;
      case 'back':
      case 'back-menu': goto('menu'); play('back'); break;
      case 'resume': resumeGame(); break;
      case 'restart': startGame(); break;
      case 'quit': quitToMenu(); break;
      case 'pause': if (Game.getSnapshot) doPause(); break;
    }
  }

  /* ======================================================================
     Screens
     ====================================================================== */

  function goto(name) {
    for (var i = 0; i < SCREENS.length; i++) {
      screens[SCREENS[i]].hidden = (SCREENS[i] !== name);
    }
    if (name === 'menu') updateMenuBest();
    if (name === 'settings') {
      els.setSound.checked = Settings.sound;
      els.setMusic.checked = Settings.music;
      els.setMotion.checked = Settings.reducedMotion;
    }
    /* Move focus into the screen for keyboard/gamepad users. */
    setTimeout(function () {
      var first = screens[name].querySelector('.btn');
      if (first) first.focus();
    }, 90);
  }

  function hideAll() {
    for (var i = 0; i < SCREENS.length; i++) screens[SCREENS[i]].hidden = true;
  }

  function setHud(visible) {
    els.hud.hidden = !visible;
  }

  function startGame() {
    hideAll();
    setHud(true);
    /* Drop focus so Space doesn't re-activate the menu button during play. */
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    Game.startRun();
    play('click');
    if (window.GameAudio) GameAudio.uiOpen();
  }

  function doPause() {
    var snap = Game.getSnapshot();
    els.pauseScore.textContent = snap.score;
    els.pauseLevel.textContent = snap.level;
    Game.pause();
    goto('pause');
    play('click');
  }

  function resumeGame() {
    hideAll();
    setHud(true);
    Game.resume();
    play('click');
  }

  function quitToMenu() {
    hideAll();
    setHud(false);
    Game.endToMenu();
    goto('menu');
    play('back');
  }

  /* ======================================================================
     Game events → HUD
     ====================================================================== */

  function bindGameEvents() {
    Game.on('score', onScore);
    Game.on('combo', onCombo);
    Game.on('lives', onLives);
    Game.on('level', onLevel);
    Game.on('levelup', onLevelUp);
    Game.on('toast', onToast);
    Game.on('hurt', onHurt);
    Game.on('newrecord', onNewRecord);
    Game.on('gameover', onGameOver);
  }

  function onScore(data) {
    els.score.textContent = data.score;
    bump(els.score);
    var best = Math.max(Settings.best, data.score);
    els.best.textContent = best > 0 ? 'Best ' + best : '';
  }

  function onCombo(data) {
    els.mult.textContent = 'x' + data.mult;
    els.mult.classList.toggle('is-active', data.mult > 1);
    els.comboFill.style.width = (data.fill * 100) + '%';
    els.comboCount.textContent = 'combo ' + data.combo;
    bump(els.mult);
  }

  function onLives(data) {
    renderLives(data.lives);
  }

  function onLevel(data) {
    els.levelLabel.textContent = 'Level ' + data.level;
    if (data.accent) els.levelLabel.style.color = data.accent;
    bump(els.levelLabel);
  }

  function onLevelUp(data) {
    showLevelBanner(data);
  }

  function showLevelBanner(data) {
    els.levelTag.textContent = 'LEVEL ' + data.level;
    els.levelName.textContent = data.name;
    els.levelBanner.setAttribute('data-accent', data.accent || '');
    els.levelBanner.classList.remove('level-banner--show');
    void els.levelBanner.offsetWidth; /* reflow to restart animation */
    els.levelBanner.classList.add('level-banner--show');
    clearTimeout(levelBannerTimer);
    levelBannerTimer = setTimeout(function () {
      els.levelBanner.classList.remove('level-banner--show');
    }, 1900);
  }

  function onToast(data) {
    showToast(data.text, data.tone || 'info');
  }

  function onHurt() {
    flash('danger');
    els.vignette.classList.add('fx-vignette--hurt');
    clearTimeout(vignetteTimer);
    vignetteTimer = setTimeout(function () {
      els.vignette.classList.remove('fx-vignette--hurt');
    }, 420);
  }

  function onNewRecord() {
    showToast('New best score!', 'gold');
  }

  function onGameOver(data) {
    Settings.setBest(data.score);
    Settings.setBestCombo(data.bestCombo);
    Settings.trackGame(data.starsCaught);

    els.overNew.hidden = !data.newRecord;
    els.overTitle.textContent = data.newRecord ? 'New Record!' : 'Game Over';
    animateNumber(els.overScore, data.score, 900);
    els.overBest.textContent = 'Best ' + Settings.best;
    els.overCombo.textContent = data.bestCombo;
    els.overStars.textContent = data.starsCaught;
    els.overLevel.textContent = data.level;

    if (data.newRecord && window.GameAudio) GameAudio.record();
    flash('gold');

    setTimeout(function () {
      setHud(false);
      goto('over');
    }, 750);
  }

  /* ======================================================================
     Widgets
     ====================================================================== */

  function buildHearts() {
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<span class="hud__heart" data-heart="' + i + '">' +
        '<svg class="icon"><use href="#i-heart"></use></svg></span>';
    }
    els.lives.innerHTML = html;
    els.lives.setAttribute('aria-label', 'Lives: 3');
  }

  function renderLives(lives) {
    var hearts = els.lives.querySelectorAll('.hud__heart');
    for (var i = 0; i < hearts.length; i++) {
      hearts[i].classList.toggle('hud__heart--lost', i >= lives);
    }
    els.lives.setAttribute('aria-label', 'Lives: ' + Math.max(0, lives));
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth; /* reflow to restart animation */
    el.classList.add('bump');
    clearTimeout(bumpTimer);
    bumpTimer = setTimeout(function () { el.classList.remove('bump'); }, 200);
  }
  var bumpTimer = null;

  function showToast(text, tone) {
    els.toast.textContent = text;
    els.toast.setAttribute('data-tone', tone || 'info');
    els.toast.hidden = false;
    void els.toast.offsetWidth;
    els.toast.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove('toast--show');
      setTimeout(function () { els.toast.hidden = true; }, 220);
    }, 2000);
  }

  function flash(tone) {
    els.flash.className = 'fx-flash fx-flash--' + tone + ' fx-flash--active';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      els.flash.className = 'fx-flash';
    }, 300);
  }

  function animateNumber(el, to, dur) {
    var t0 = performance.now();
    function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateMenuBest() {
    els.menuBest.textContent = Settings.best || 0;
  }

  /* ======================================================================
     Settings toggles
     ====================================================================== */

  function bindToggles() {
    els.setSound.addEventListener('change', function () {
      Settings.setSound(this.checked);
      if (window.GameAudio) GameAudio.setSound(this.checked);
      play('click');
    });
    els.setMusic.addEventListener('change', function () {
      Settings.setMusic(this.checked);
      if (window.GameAudio) GameAudio.setMusic(this.checked);
      play('click');
    });
    els.setMotion.addEventListener('change', function () {
      Settings.setReducedMotion(this.checked);
      applyReducedMotion();
      play('click');
    });
  }

  function applyReducedMotion() {
    var r = Settings.reducedMotion;
    document.documentElement.classList.toggle('rm', r);
    if (window.Game) Game.setReducedMotion(r);
  }

  /* ======================================================================
     Keyboard navigation ('sf-key' events from input.js)
     ====================================================================== */

  function onKey(e) {
    var action = e.detail.action;
    var active = activeScreenName();

    switch (action) {
      case 'pause':
        if (active === null) { doPause(); }
        else if (active === 'pause') { resumeGame(); }
        break;
      case 'back':
        if (active === 'pause') resumeGame();
        else if (active === 'howto' || active === 'settings') goto('menu');
        else if (active === 'over') quitToMenu();
        break;
      case 'confirm':
        if (active === 'menu') startGame();
        else if (active === 'howto') startGame();
        else if (active === 'settings') goto('menu');
        else if (active === 'pause') resumeGame();
        else if (active === 'over') startGame();
        break;
      case 'up': case 'down': case 'left': case 'right':
        if (active) moveFocus(active, action);
        break;
    }
  }

  function activeScreenName() {
    for (var i = 0; i < SCREENS.length; i++) {
      if (!screens[SCREENS[i]].hidden) return SCREENS[i];
    }
    return null;
  }

  function moveFocus(screenName, dir) {
    var buttons = screens[screenName].querySelectorAll('.btn');
    if (!buttons.length) return;
    var idx = -1;
    var active = document.activeElement;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i] === active) { idx = i; break; }
    }
    if (dir === 'up' || dir === 'left') idx = idx <= 0 ? buttons.length - 1 : idx - 1;
    else idx = idx >= buttons.length - 1 ? 0 : idx + 1;
    buttons[idx].focus();
  }

  /* ======================================================================
     Helpers & public
     ====================================================================== */

  function play(name) {
    if (window.GameAudio && GameAudio[name]) GameAudio[name]();
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  window.UI = {
    boot: boot,
    forcePause: function () {
      if (activeScreenName() === null && Game.getSnapshot()) doPause();
    }
  };
})();
