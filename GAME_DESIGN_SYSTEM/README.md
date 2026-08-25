# STARFALL — Game Design System

The Game Design System (GDS) is the single authority for how STARFALL looks,
feels, sounds, and plays. It exists so every screen, effect, and interaction
is consistent, intentional, and never arbitrary.

STARFALL is a production HTML5 casual arcade skill game. The system documents
every rule a designer, artist, or developer needs: visual foundations, UI
components, motion and particles, audio, gameplay rules, and quality gates.

## Purpose

- Guarantee visual, motion, and interaction consistency across all screens.
- Make every gameplay event answer four questions: What happened, why it
  happened, whether it succeeded, and what the player can do next.
- Provide reusable components and tokens so nothing is built one-off.
- Define the player experience contract: one-finger friendly, 30 seconds to
  learn, replayable in 1–3 minute sessions.

## How to use this system

1. Start with the current game identity:
   `projects/current-game.md` — what STARFALL is and its project-level rules.
2. Apply genre rules: `genres/arcade-casual.md` — the genre contract.
3. Fall back to core rules: `core/*.md` — foundations, UI, motion, audio,
   feedback, gameplay, and the QA checklist.
4. Every CSS value, duration, and color must come from
   `css/tokens.css`. Never hardcode raw values.

## Conflict resolution

When two rules disagree, resolve in this priority:

```
1. Project-specific rules   (projects/current-game.md)
2. Genre rules              (genres/arcade-casual.md)
3. Core rules               (core/*.md)
```

The current game's rules always win, then genre rules, then global defaults.
If a change belongs in the project layer, update `projects/current-game.md`
and log it in its changelog. Do not silently bend core or genre rules.

## File map

| Path | Responsibility |
| --- | --- |
| `README.md` | Index, purpose, conflict resolution, file map. |
| `core/foundations.md` | Colors, typography, spacing, radius, shadow/glow, z-index, layout and safe-area tokens. Mirror of `css/tokens.css`. |
| `core/ui-components.md` | Reusable components: buttons, icon buttons, panels, toggles, screens/overlays, HUD anatomy, toasts, stat tiles, control tiles, kbd hints, logo. Full component inventory. |
| `core/motion.md` | Timing tokens, easing curves, motion principles, particle vocabulary, screen shake rules, floating feedback text, reduced-motion policy. |
| `core/audio.md` | WebAudio synthesis approach, SFX list with intent, ambient music policy, ducking and overlap guidance. |
| `core/feedback.md` | The four feedback questions and the event-to-feedback map (visual + audio + vibration). |
| `core/gameplay.md` | Game rules, scoring math, difficulty ramp, collision rules, lives and grace, game-over flow, flow-channel policy. |
| `genres/arcade-casual.md` | Genre rules: instant readability, forgiving curve, strong feedback loop, short sessions, satisfying replay. |
| `projects/current-game.md` | STARFALL project identity, vision, project-level overrides, changelog. |
| `core/qa-checklist.md` | Concrete verification checklist derived from the whole system. |

## Rules of authorship

- Match token names exactly as they appear in `css/tokens.css`.
- Do not invent components, tokens, or rules when an existing one applies.
- Do not use emojis anywhere in the design system.
- Prefer tables and concrete values over prose when a list gets long.
