# QA Checklist

Concrete verification list derived from the whole design system. Run through
it per feature and before any release. A task is not complete because code
compiles — it must behave correctly in actual gameplay.

## 1. Token compliance

- [ ] No hardcoded colors, sizes, durations, or z-index anywhere — all use
      `var()` from `css/tokens.css`.
- [ ] Token names match `css/tokens.css` exactly (including `--safe-x-r`,
      `--color-on-primary`, etc.).
- [ ] No component variant exists that contradicts `core/ui-components.md`.

## 2. Visual consistency

- [ ] Background uses `--grad-bg`; surfaces use `--grad-surface` over
      `--color-surface`; text uses the text scale.
- [ ] Every screen is capped at `--container-max` and centered; safe areas
      (`--safe-x`, `--safe-x-r`, `--safe-y`, `--safe-y-b`) never contain
      interactive or HUD content.
- [ ] HUD is `--hud-height` tall, fixed at `--z-hud`, and never occluded by
      gameplay effects.
- [ ] Radius, spacing, shadows, and glows come from the scales; no off-scale
      values.

## 3. Component states

- [ ] Every `.btn` variant (primary/secondary/ghost, sm/md/lg) checked in all
      states: normal, hover (~1.03), pressed (~0.95), focus-visible, disabled.
- [ ] Icon buttons and all touch controls have ≥ 44px hit targets.
- [ ] Disabled controls: ~0.45 opacity, no transforms, no SFX, `aria-disabled`.
- [ ] Toggle shows off/on/disabled distinctly and flips thumb with spring.
- [ ] `:focus-visible` shows `--focus-ring` for keyboard/gamepad; pointer
      interaction never shows the ring.

## 4. Feedback (four questions)

For each event verify the player can answer: what happened / why / did it
succeed / what's next.

- [ ] Star catch: spark + "+10" float text + `catch` SFX + combo bar fill.
- [ ] Gold catch: burst + rays + "+50" gold text + `gold` SFX.
- [ ] Comet hit: danger flash + medium shake + debris + heart lost + blink
      grace + `hurt` + music duck; combo meter empties.
- [ ] Missed star: "MISS" float text + subtle shake + `miss`; no life loss.
- [ ] Level up: ring + level pill pulse + toast + `levelUp`; new pace begins.
- [ ] Combo milestone: badge pop + success ring + `comboMilestone`, every 5
      catches, capped at x10.
- [ ] New record: confetti + gold banner + `record`; best score updated.
- [ ] Game over: strong impact, stats screen, banner logic, `gameOver` +
      music duck; retry is one tap away.
- [ ] No feedback event blocks or repeats input.

## 5. Motion and particles

- [ ] No animation exceeds 650ms except the intentional celebratory suite
      (record banner, game-over finale), and those cap at `--dur-celebration`.
- [ ] Easing uses tokens (`--ease-std`/`--ease-out`/`--ease-spring`/`--ease-in`);
      no linear UI interpolation.
- [ ] Particle types match the vocabulary (spark/burst/confetti/ring/rays/
      debris) and their budgets; max 5 emitters; HUD and catch line never
      obscured.
- [ ] Screen shake: subtle 2–3px (miss), medium 5px (comet hit), strong 8px
      (game over), ≤320ms, decaying, gameplay canvas only — never HUD/menus.
- [ ] Floating text pooled, max 8, rises ≤650ms, never overlaps HUD.

## 6. Accessibility

- [ ] `prefers-reduced-motion: reduce` collapses all durations via tokens;
      verified with OS setting enabled.
- [ ] In-game "Reduce motion" toggle: shake disabled, particles capped ~25%,
      confetti/rays removed, flash overlays become dim, essential fades ≤120ms,
      float text kept (fade only). Toggle persisted.
- [ ] Game fully playable muted (every SFX has a visual counterpart).
- [ ] Full keyboard navigation: Tab order logical, Enter confirms, Esc backs
      out, Space/P pauses, arrows/A-D move the pod.
- [ ] Contrast: text on surfaces, `--color-on-*` pairs on fills, and HUD text
      meet AA contrast against their backgrounds.
- [ ] Screen readers: `.screen--active` semantics, `aria-hidden` on inactive
      screens, `role="switch"` on toggles, aria labels on icon buttons.

## 7. Audio

- [ ] AudioContext created/resumed on first user gesture; suspended on
      tab-hide; no autoplay warnings.
- [ ] All SFX synthesized (no asset files); names and intents match
      `core/audio.md`; polyphony capped at 6; retrigger throttling works.
- [ ] Music/SFX toggles independent, persisted, and functional mid-run.
- [ ] Ducking: music −8dB on hurt/gameOver, restore ~800ms; `gameOver` never
      layered over `hurt`.
- [ ] Pause ducks gameplay SFX/music; only `uiOpen`/`uiClose` play.

## 8. Responsiveness and layout

- [ ] Resize mid-run: pod bounds, catch line, and HUD recompute; no clipped
      HUD or off-screen spawns at any viewport width ≥ 320px.
- [ ] Mobile safe areas (notch, home indicator, landscape corners) respected;
      touch drag controls the pod 1:1.
- [ ] Desktop hover + mobile drag both verified; no double-firing of pointer
      events (pointerup vs click).
- [ ] Landscape and portrait both playable; HUD layout never overlaps the
      catch field.

## 9. Performance

- [ ] Stable 60fps on mid-range mobile at the level-12 ceiling (worst case:
      dense spawns + full particles).
- [ ] Particle/float-text pools sized and reused; no per-frame allocations in
      hot paths.
- [ ] No memory growth over a 10-minute session (heapsnapshot before/after).
- [ ] No unnecessary rAF loops when paused or in menus (pause stops the game
      loop); game fully suspended on tab-hide.
- [ ] No console errors or warnings during normal play.

## 10. Edge cases

- [ ] Tab hide during run → auto-pause; resume resumes cleanly.
- [ ] Rapid input: mashing pause, drag-pause-drag, comet hit during grace —
      state stays consistent, no double life loss, no stuck pause.
- [ ] Hit during grace: no additional damage; star catch during grace still
      counts.
- [ ] Gold+comet never spawn same lane within 0.4s; always a catchable star
      within ~1.5s at every level.
- [ ] localStorage unavailable (private mode): game runs; best score silently
      not persisted, no crash.
- [ ] Game over exactly at a level-up frame: banner/order correct, no missing
      HUD state.
- [ ] Combo cap verified at x10 (combo 45+); badge never exceeds x10.
- [ ] Gamepad (if supported): left stick/D-pad moves, Start/Back pauses,
      A confirms, B backs out.

## 11. Final pass

- [ ] Fresh-eyes test: a player who has never seen STARFALL understands the
      goal and the risk within 30 seconds.
- [ ] One full loop verified: Menu → How to Play → Settings (toggles persist)
      → Gameplay → Pause → Resume → Game Over → Play Again.
- [ ] First-death timing lands in the ~60–90s window on default settings.
- [ ] Best score and best combo update and persist across reloads.
