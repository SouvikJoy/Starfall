# Foundations

STARFALL's visual language: a deep-space indigo backdrop with cyan primary
action, violet secondary information, gold rewards, rose danger, and emerald
success — rounded "Fredoka" display type, glassy surfaces, and glow accents.

## Single source of truth

`css/tokens.css` is the **single source of truth** for every token in this
document. The CSS file and this markdown mirror each other; the CSS file wins
on any discrepancy. Code must reference tokens with `var(--token)`. Never
hardcode raw colors, sizes, timings, or z-index values.

Note: `tokens.css` also carries a `prefers-reduced-motion` override that sets
all durations to ~0–1ms. Design and code must respect the `var(--dur-*)`
tokens so that override propagates automatically.

## Color palette

### Surfaces (backgrounds and containers)

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-bg` | `#070b1d` | App background; deepest space indigo. Base canvas color. |
| `--color-bg-elev` | `#0d1430` | Elevated background behind content (screens, subtle separation). |
| `--color-surface` | `#141d42` | Card/surface base fill. |
| `--color-surface-2` | `#1c274f` | Nested surface: inputs, secondary rows, hover states of surfaces. |
| `--color-surface-3` | `#25315f` | Deepest nested surface: pressed states, inner wells. |
| `--color-border` | `rgba(255,255,255,0.10)` | Default hairline borders and dividers on dark surfaces. |
| `--color-border-strong` | `rgba(255,255,255,0.20)` | Emphasis borders, active selection outlines, stronger dividers. |

### Primary — cyan (interact, highlight)

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-primary` | `#22d3ee` | Interactive elements, highlights, focus accents, active states. |
| `--color-primary-strong` | `#7ee9ff` | Hover emphasis, bright icon/glow highlights, "current" values. |
| `--color-primary-soft` | `rgba(34,211,238,0.16)` | Tint fills: selected rows, focus rings, catch glow fills. |
| `--color-on-primary` | `#042733` | Text and icons on cyan primary fills (contrast pair). |

### Secondary — violet (info, alternate)

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-secondary` | `#a78bfa` | Secondary actions, info accents, alternate brand elements. |
| `--color-secondary-strong` | `#c9b8ff` | Hover emphasis, bright secondary highlights. |
| `--color-secondary-soft` | `rgba(167,139,250,0.16)` | Secondary tint fills, soft highlights. |
| `--color-on-secondary` | `#1e1140` | Text and icons on secondary fills (contrast pair). |

### Gold — reward, score

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-gold` | `#ffc24b` | Rewards, score emphasis, gold stars, record banners. |
| `--color-gold-strong` | `#ffd98a` | Hover emphasis, bright reward highlights, sparkle accents. |
| `--color-gold-soft` | `rgba(255,194,75,0.16)` | Reward tint fills, gold star glow base. |
| `--color-on-gold` | `#3a2602` | Text and icons on gold fills (contrast pair). |

### Danger — rose (hazard, error, life loss)

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-danger` | `#ff6b81` | Comets, damage, life loss, errors, destructive actions. |
| `--color-danger-strong` | `#ff9db0` | Hover emphasis, bright hazard highlights, hit flash. |
| `--color-danger-soft` | `rgba(255,107,129,0.16)` | Hazard tint fills, damage vignettes. |
| `--color-on-danger` | `#3a0510` | Text and icons on danger fills (contrast pair). |

### Success — emerald (combo, milestone)

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-success` | `#3ddc97` | Combo meter, milestone markers, positive confirmations. |
| `--color-success-strong` | `#7deec0` | Hover emphasis, bright success highlights, milestone glow. |
| `--color-success-soft` | `rgba(61,220,151,0.16)` | Success tint fills, combo progress backgrounds. |

### Text

| Token | Value | Usage intent |
| --- | --- | --- |
| `--color-text` | `#eef3ff` | Primary text on dark surfaces. |
| `--color-text-dim` | `#9fb0d0` | Secondary text, labels, hints. |
| `--color-text-faint` | `#6b7aa3` | Disabled text, meta captions, placeholders. |

## Gradients

| Token | Definition | Usage intent |
| --- | --- | --- |
| `--grad-primary` | `linear-gradient(180deg, #3ce0ff 0%, #0fb5e8 100%)` | Primary button fill, pod/energy fills. |
| `--grad-primary-hover` | `linear-gradient(180deg, #57e8ff 0%, #1ec6f2 100%)` | Primary button hover/pressed emphasis. |
| `--grad-secondary` | `linear-gradient(180deg, #bd9cff 0%, #8b6cf0 100%)` | Secondary button fill, info accents. |
| `--grad-gold` | `linear-gradient(180deg, #ffd98a 0%, #ffb02e 100%)` | Gold star fills, record banners, reward accents. |
| `--grad-danger` | `linear-gradient(180deg, #ff93a4 0%, #ff5f78 100%)` | Comet fills, life-loss flashes, danger accents. |
| `--grad-surface` | `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))` | Glassy panel/card sheen. |
| `--grad-bg` | `radial-gradient(120% 90% at 50% 0%, #151f4e 0%, #0b1130 45%, #070b1d 100%)` | Starfield background wash. |
| `--grad-text-title` | `linear-gradient(180deg, #ffffff 0%, #a5d9ff 55%, #5c8dff 100%)` | Title/logo text gradient. |

## Typography scale

Display font: `--font-display` = `'Fredoka', ui-rounded, 'Segoe UI', system-ui, -apple-system, sans-serif`.
Body font: `--font-body` = `var(--font-display)`. STARFALL uses one rounded
display face for both text and UI; differentiation comes from size, weight,
tracking, and color, not from additional fonts.

| Token | Value | px | Usage |
| --- | --- | --- | --- |
| `--fs-xs` | `0.75rem` | 12 | Tiny captions, kbd keycaps, toast meta. |
| `--fs-sm` | `0.875rem` | 14 | Labels, hints, stat labels, button small. |
| `--fs-base` | `1rem` | 16 | Body text, default button text, toasts. |
| `--fs-md` | `1.125rem` | 18 | Emphasis body, list items, button large. |
| `--fs-lg` | `1.375rem` | 22 | Section titles, stat values. |
| `--fs-xl` | `1.75rem` | 28 | HUD score value, combo multiplier badge. |
| `--fs-2xl` | `2.25rem` | 36 | Screen titles, modal titles, HUD accent. |
| `--fs-3xl` | `3rem` | 48 | Hero titles, game-over score. |
| `--fs-4xl` | `clamp(3.25rem, 9vw, 4.5rem)` | 52–72 | Logo and record banner headline. |

Weights: `--fw-regular` 400, `--fw-medium` 500, `--fw-semi` 600, `--fw-bold` 700.

Line heights: `--lh-tight` 1.15 (titles), `--lh-normal` 1.45 (body).

Tracking: `--tracking-wide` `0.04em` (labels, buttons), `--tracking-title` `0.1em` (titles, logo).

## Spacing scale

Base unit 4px. All layout gaps, paddings, and margins use the scale; do not
invent intermediate values.

| Token | Value | | Token | Value |
| --- | --- | --- | --- | --- |
| `--space-1` | 4px | | `--space-6` | 24px |
| `--space-2` | 8px | | `--space-7` | 32px |
| `--space-3` | 12px | | `--space-8` | 40px |
| `--space-4` | 16px | | `--space-9` | 48px |
| `--space-5` | 20px | | `--space-10` | 64px |

## Border radius scale

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | 8px | Small chips, kbd keycaps, inner wells. |
| `--radius-md` | 12px | Inputs, tiles, small panels. |
| `--radius-lg` | 16px | Standard cards, toasts, modals. |
| `--radius-xl` | 24px | Large cards, big panels. |
| `--radius-pill` | 999px | Buttons, badges, toggles, combo pills. |

## Shadow and glow system

| Token | Definition | Usage |
| --- | --- | --- |
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.30)` | Resting shadows on small elements. |
| `--shadow-2` | `0 4px 14px rgba(0,0,0,0.35)` | Cards, toasts, floating elements. |
| `--shadow-3` | `0 12px 40px rgba(0,0,0,0.50)` | Modals, overlays, elevated panels. |
| `--shadow-primary` | `0 4px 20px rgba(34,211,238,0.40), inset 0 1px 0 rgba(255,255,255,0.35)` | Primary buttons and interactive glows. |
| `--shadow-primary-strong` | `0 0 24px rgba(34,211,238,0.65)` | Catch flash, active pod, focused primary elements. |
| `--shadow-gold` | `0 4px 20px rgba(255,194,75,0.45)` | Gold star glow, reward elements. |
| `--shadow-danger` | `0 4px 20px rgba(255,107,129,0.45)` | Comet glow, damage elements. |
| `--glow-text` | `0 0 18px rgba(126,233,255,0.55)` | Glowing text accents (score pop, titles). |

## Z-index scale

| Token | Value | Layer |
| --- | --- | --- |
| `--z-base` | 1 | Game world, screens' base content. |
| `--z-hud` | 100 | Persistent HUD. |
| `--z-overlay` | 200 | Dim overlays, pause backdrop. |
| `--z-modal` | 300 | Modals and dialogs. |
| `--z-toast` | 400 | Toast notifications. |
| `--z-transition` | 500 | Full-screen transitions. |

## Layout and safe-zone tokens

| Token | Definition | Usage |
| --- | --- | --- |
| `--safe-x` | `max(var(--space-4), env(safe-area-inset-left, 0px))` | Left safe padding; never place interactive content inside. |
| `--safe-x-r` | `max(var(--space-4), env(safe-area-inset-right, 0px))` | Right safe padding. |
| `--safe-y` | `max(var(--space-4), env(safe-area-inset-top, 0px))` | Top safe padding (notch/status bar). |
| `--safe-y-b` | `max(var(--space-4), env(safe-area-inset-bottom, 0px))` | Bottom safe padding (home indicator). |
| `--hud-height` | 64px | Fixed HUD bar height; gameplay canvas leaves this band free. |
| `--container-max` | 520px | Max content width for screens and panels; centered. |

Layout contract: the gameplay field spans the full viewport width, capped for
comfort at `--container-max`, and reserves `--hud-height` at the top plus all
four safe-area insets. No HUD or interactive element may render inside a safe
inset or under a rounded corner.

## Focus system

`--focus-ring` = `0 0 0 3px var(--color-primary-soft), 0 0 0 1px var(--color-primary)`.
Visible on `:focus-visible` only, so keyboard and gamepad users always see the
current control, while pointer users see no extra outline.
