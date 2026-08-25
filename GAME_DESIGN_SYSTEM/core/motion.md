# Motion

Motion communicates hierarchy and causality. Nothing moves without a reason:
it either explains what happened, points at the next action, or celebrates a
milestone. Motion never obscures gameplay-critical information.

## Timing tokens

All durations come from `css/tokens.css`. Under `prefers-reduced-motion` these
collapse to ~0–1ms automatically — code must use the tokens, never hardcoded
milliseconds.

| Token | Value | Use for |
| --- | --- | --- |
| `--dur-instant` | 80ms | Press feedback, toggles, catch sparks, state flips. |
| `--dur-fast` | 120ms | Hover, small pops, icon swaps, toast entrance. |
| `--dur-base` | 200ms | Standard UI transitions, screen fades, modal entrances. |
| `--dur-slow` | 320ms | Panel slides, screen transitions, shake decay. |
| `--dur-celebration` | 650ms | Record banner, gold catch flourish, combo milestone. |

**Hard rule:** no animation exceeds 650ms except intentionally celebratory
moments (record banner, game-over finale) and only up to `--dur-celebration`.
Avoid linear interpolation for UI; use the easing tokens.

## Easing curves

| Token | Curve | Character | Use for |
| --- | --- | --- | --- |
| `--ease-std` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Standard, steady | Default UI motion. |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast start, soft landing | Entrances, panels, toasts. |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot | Buttons, badges, combo pops, pod catches. |
| `--ease-in` | `cubic-bezier(0.55, 0, 0.55, 0.2)` | Slowing start | Exits, dismissals. |

## Motion principles

1. **Hierarchy** — important events move more and glow more (record banner)
   than routine events (a single star catch).
2. **Causality** — the effect originates at the cause: sparks at the catch
   point, shake at the pod on a hit, floating text above the caught star.
3. **One cause, one motion** — a single event triggers a coordinated suite
   (particles + float text + sound + small shake where called for), never
   competing random animations.
4. **Respect tokens** — durations, easings, and particle lifetimes map to the
   token scale; no arbitrary timers.
5. **Readability first** — if a player cannot track the pod or the fall field,
   the effect is too strong.

## Particle vocabulary

Particles are part of the design system, not decoration. Every particle type
has a defined trigger and budget. Emitters are pooled and never obscure the
HUD or the catch line.

| Particle | Appearance | Lifetime | Trigger |
| --- | --- | --- | --- |
| `spark` | 8–14 small cyan/white points, radial burst | 300–450ms | Star catch, button clicks, combo ticks. |
| `burst` | 12–18 gold points + glow flash | 450–600ms | Gold star catch, record moments. |
| `confetti` | 40–80 small colored rects (cyan, violet, gold, emerald) falling with flutter | 600–650ms (`--dur-celebration`) | New record, multiplier x10. |
| `ring` | Single expanding hollow ring at origin | 400–500ms | Level up, combo milestone, pod catch flash. |
| `rays` | Diverging light rays behind an element | 500–650ms | Logo entrance, pod power-up glow, gold catch backdrop. |
| `debris` | 8–12 rose/danger shards scattering | 350–450ms | Comet hit. |

Budget rules: max 5 concurrent emitters; particle count per event per the
table above. In reduced-motion mode the count is capped at ~25% of these
budgets (see policy below).

## Screen shake

Shake applies to the gameplay canvas only — never to the HUD, modals, or
menus. It decays exponentially and never exceeds `--dur-slow` (320ms).

| Magnitude | Ampliture | Trigger |
| --- | --- | --- |
| subtle | 2–3px | Missed star. |
| medium | 5px | Comet hit (with 1.2s grace flash). |
| strong | 8px | Final life lost / game-over impact. |

Rules: one shake at a time (newer overrides older), decay to zero, no
sustained rumble. Level up uses a gentle pulse + ring instead of shake.

## Floating feedback text

`--float-text` rises ~28px and fades over ≤650ms at the point of the event.

| Variant | Text | Color |
| --- | --- | --- |
| `.float-text--score` | "+10" | `--color-primary-strong` |
| `.float-text--gold` | "+50" | `--color-gold-strong` |
| `.float-text--combo` | "x2!" … "x10!" | `--color-success-strong` |
| `.float-text--miss` | "MISS" | `--color-text-faint` |
| `.float-text--hurt` | "-1" (life lost) | `--color-danger-strong` |

Pooled, max 8 concurrent, never overlaps the HUD band. Gold and combo text
scale up ~1.2 on spawn.

## Reduced-motion policy

Two layers, both mandatory:

1. **OS preference** — `prefers-reduced-motion: reduce` collapses all
   `--dur-*` tokens to ~0–1ms (defined in `css/tokens.css`). Every animation
   and particle lifetime must read from these tokens.
2. **In-game toggle** — "Reduce motion" setting in Settings (persisted):
   - Disables screen shake entirely.
   - Caps particle budgets to ~25% of the table above; disables `confetti`
     and `rays`; keeps `spark`, `ring`, `debris` at reduced counts.
   - Replaces flash overlays with a subtle dim (no full-screen color flash).
   - Keeps essential fade transitions at ≤120ms so state changes stay legible.
   - Keeps floating score text (it is information, not decoration) with fade
     only, no rise.

Reduced motion must never remove information — only its intensity.
