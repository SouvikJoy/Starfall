# UI Components

Reusable, inspectable UI building blocks. Every component below exists once,
is reused everywhere, and follows the states contract. Do not create
one-off variants of any component in this inventory.

## Component states contract

Every interactive component supports all relevant states:

| State | Behavior |
| --- | --- |
| Normal | Resting visual. |
| Hover | Scale ~1.03 with spring easing (`--ease-spring`), brighter gradient (e.g., `--grad-primary-hover`), elevated shadow. |
| Pressed | Scale ~0.95, reduced shadow, gradient compressed. |
| Selected/Active | Persistent highlight (primary fill or `--color-primary-soft` tint + `--color-border-strong`). |
| Disabled | Opacity ~0.45, no hover/press transforms, `aria-disabled="true"`, cursor default. |
| Focus-visible | `--focus-ring` ring; shown only for keyboard/gamepad focus. |

## Buttons — `.btn`

Base `.btn`: pill shape (`--radius-pill`), `--font-display`, medium weight,
`--tracking-wide`, gradient or surface fill, `--shadow-1` resting.

### Variants

| Class | Fill | Text | Shadow/Glow | Use for |
| --- | --- | --- | --- | --- |
| `.btn--primary` | `--grad-primary` (hover `--grad-primary-hover`) | `--color-on-primary` | `--shadow-primary`; strong glow on hover | Primary confirm/advance actions (Play, Resume, Retry). |
| `.btn--secondary` | `--grad-secondary` | `--color-on-secondary` | `--shadow-2` | Alternate/info actions (How to Play, Settings). |
| `.btn--ghost` | Transparent, `--color-border` hairline; hover `--color-primary-soft` tint | `--color-text` | none | Low-emphasis actions (Back, Cancel, Menu). |

### Sizes

| Class | Font | Padding | Min height |
| --- | --- | --- | --- |
| `.btn--sm` | `--fs-sm` | `--space-2` `--space-3` | 36px (non-touch only) |
| default (md) | `--fs-base` | `--space-3` `--space-5` | 44px |
| `.btn--lg` | `--fs-md` | `--space-4` `--space-7` | 48px |

### Behavior

- Hover: `scale(1.03)`, spring, 120ms. Press: `scale(0.95)`, 80ms.
  Release: return with slight overshoot.
- Press plays `uiClick` SFX. Disabled buttons never scale or play SFX.
- Optional `--shadow-primary-strong` glow pulse for the primary CTA of a screen.
- Optional inline icon slot `.btn__icon` (never swaps layout between states).

## Icon buttons — `.icon-btn`

Round or square `--radius-md`/`--radius-pill` button holding a single glyph.

- Hit target: minimum **44 × 44px** on touch; larger visual via padding.
- Variants by fill: `--color-surface-2` normal, hover `--color-primary-soft`
  tint with `--color-primary` glyph, pressed `--color-surface-3`.
- Used for: pause, close, back arrows, mute quick toggles.
- Same state scale behavior as `.btn` and `--focus-ring` support.

## Panels and cards — `.panel`

Glass card container.

| Class | Behavior |
| --- | --- |
| `.panel` | Fill `--grad-surface` over `--color-surface`, hairline `--color-border`, `--radius-lg`, `--shadow-2`, optional backdrop blur. |
| `.panel--card` | Stronger variant: `--color-surface` base, `--color-border-strong` top edge highlight, `--radius-xl`, `--shadow-3`. Used for menus, modals, and game-over. |
| `.panel__title` | `--fs-lg`/`--fs-2xl`, `--fw-semi`, `--lh-tight`, `--tracking-title`. |
| `.panel__body` | `--fs-base`, `--lh-normal`, `--color-text-dim` for body copy. |
| `.panel__footer` | Right-aligned action row, `--space-4` top padding, `--color-border` hairline above. |

## Toggles — `.toggle`

Switch control (`role="switch"`) for settings: SFX, music, reduce motion.

| Part | Class |
| --- | --- |
| Track | `.toggle__track` — `--radius-pill`, `--color-surface-3` when off, `--color-primary` when on. |
| Thumb | `.toggle__thumb` — circle, `--color-text`; slides with spring easing. |

States: off (normal/hover/focus-visible), on (checked), disabled. `--focus-ring`
on the track. Label sits adjacent at `--fs-sm`, `--color-text-dim`.

## Screens and overlays

| Class | Role |
| --- | --- |
| `.screen` | Full-viewport state container (menu, how-to-play, settings, gameplay, game over). Exactly one `.screen--active` at a time. |
| `.screen--active` | Visible + interactive screen; others hidden (`display:none` or aria-hidden). |
| `.overlay` | Dim layer behind modals and pause: `--color-bg-elev` at ~0.7 opacity, `--z-overlay`, subtle blur. |
| `.modal` | Centered `--container-max` panel at `--z-modal`, `--shadow-3`, entrance with scale+fade. |

Navigation contract: Esc closes the top-most overlay/modal, Enter confirms
the focused action. Screen transitions use `--dur-base` fade + 1.03 scale.

## HUD anatomy

Fixed bar, `--hud-height` tall, `--z-hud`, padded by `--safe-x`/`--safe-y`.
Layout left to right: score group, level, combo meter, lives, pause.

| Part | Class | Content |
| --- | --- | --- |
| Score group | `.hud__score` | Label "SCORE" (`--fs-xs`, `--tracking-wide`, dim) + value (`--fs-xl`, `--fw-bold`, `--color-text`; flashes `--color-gold` on record pace). |
| Level | `.hud__level` | Small pill "LV n" (`--fs-sm`, secondary tint); pulses on level up. |
| Combo meter | `.combo` | Pill with progress bar + multiplier badge. |
| Combo progress | `.combo__bar` | `--color-surface-3` track, `--color-success` fill; fills toward next multiplier (every 5 catches). |
| Multiplier badge | `.combo__badge` | "x2" … "x10"; `--fs-xl`, `--fw-bold`, success fill with `--glow-text` at milestones; pops on change. |
| Lives | `.hud__lives` | Three heart glyphs; `.lives__heart` full, `.lives__heart--lost` dimmed danger with shrink-away animation. |
| Pause | `.hud__pause` | `.icon-btn` with pause glyph; Space/P equivalent. |

HUD never shakes, never flashes red except life-loss, and is excluded from
screen-shake transforms.

## Toasts — `.toast`

Transient notification, stacked top-center under the HUD, `--z-toast`,
`--radius-lg`, `--shadow-2`, auto-dismiss after 2.4s (interruptible on hover).

| Class | Use | Accent |
| --- | --- | --- |
| `.toast--success` | Milestones, record | `--color-success` edge glow. |
| `.toast--info` | Tips, level ups | `--color-primary` edge glow. |
| `.toast--danger` | Warnings (never life loss — that is diegetic) | `--color-danger` edge glow. |

Parts: `.toast__icon` (inline glyph) + `.toast__msg` (`--fs-base`). Max 3
visible; oldest dismisses first.

## Stat tiles — `.stat-tile`

Game-over and settings stat grid cell: `--color-surface` base, `--radius-md`,
`--color-border` hairline. Parts: `.stat-tile__value` (`--fs-lg`, `--fw-bold`)
and `.stat-tile__label` (`--fs-sm`, `--color-text-dim`, `--tracking-wide`).
Used for: score, best, stars, gold stars, max combo, level, time survived.

## Control tiles — `.control-tile`

How-to-play grid cell: key/gesture glyph over label. Parts:
`.control-tile__key` (`--fs-md`, keycap style) and `.control-tile__label`
(`--fs-sm`, dim). One tile per control: move (pointer/drag), move
(arrows/A-D), pause (Space/P), confirm (Enter), back (Esc).

## Kbd hints — `.kbd`

Inline keycap: `--fs-xs`, `--fw-medium`, `--color-surface-2` fill,
`--color-border-strong` hairline, `--radius-sm`, padding `--space-1`/`--space-2`.
Used inside buttons and dialogs to show shortcuts.

## Logo — `.logo`

STARFALL wordmark: `--fs-4xl`, `--fw-bold`, `--grad-text-title` text fill,
`--tracking-title`, `--glow-text`, optional rays particle backing on the menu
screen. Reused on menu, pause, and game-over.

## Floating feedback text — `.float-text`

Gameplay-layer element (not HUD): rises ~28px, fades, 650ms max lifetime.
Variants: `.float-text--score` (cyan, +10), `.float-text--gold` (+50),
`.float-text--combo` (success, "x3!"), `.float-text--miss` (dim, "MISS"),
`.float-text--hurt` (danger, life loss). Pooled; max 8 concurrent.

## Component inventory

| Element | Class | States / variants |
| --- | --- | --- |
| Primary button | `.btn.btn--primary` (+ `--sm`/`--lg`) | normal, hover, pressed, focus-visible, disabled |
| Secondary button | `.btn.btn--secondary` (+ `--sm`/`--lg`) | same |
| Ghost button | `.btn.btn--ghost` (+ `--sm`/`--lg`) | same |
| Button icon slot | `.btn__icon` | — |
| Icon button | `.icon-btn` | normal, hover, pressed, focus-visible, disabled; 44px min hit target |
| Panel | `.panel` | default, card |
| Panel title/body/footer | `.panel__title` `.panel__body` `.panel__footer` | — |
| Toggle | `.toggle` (+ `.toggle__track`, `.toggle__thumb`) | off, hover, focus-visible, on, disabled |
| Screen | `.screen` `.screen--active` | active, inactive |
| Overlay | `.overlay` | dim |
| Modal | `.modal` | open, closing |
| HUD bar | `.hud` | — |
| HUD score | `.hud__score` | default, record-pace glow |
| HUD level | `.hud__level` | default, level-up pulse |
| Combo meter | `.combo` `.combo__bar` `.combo__badge` | idle, progress, milestone pop, max (x10) |
| Lives | `.hud__lives` `.lives__heart` `.lives__heart--lost` | full, lost |
| Pause button | `.hud__pause` (`.icon-btn`) | normal, hover, pressed, focus-visible |
| Toast | `.toast` (`--success`/`--info`/`--danger`) + `.toast__icon` `.toast__msg` | entering, idle, dismissing |
| Stat tile | `.stat-tile` + `.stat-tile__value` `.stat-tile__label` | — |
| Control tile | `.control-tile` + `.control-tile__key` `.control-tile__label` | — |
| Kbd keycap | `.kbd` | — |
| Logo | `.logo` | idle, menu glow |
| Floating text | `.float-text` (`--score`/`--gold`/`--combo`/`--miss`/`--hurt`) | rising, fading |
