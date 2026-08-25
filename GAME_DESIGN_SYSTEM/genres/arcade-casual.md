# Genre — Arcade / Casual Skill Game

STARFALL belongs to the arcade-casual genre: a pick-up-and-play skill game
with instant readability, a forgiving difficulty curve, strong feedback, and
short sessions built for replay. These rules define the genre contract that
all core and project rules must satisfy.

## Genre contract

| Rule | Specification |
| --- | --- |
| Instant readability | A new player understands the goal within 30 seconds of first sight: catch the glowing things, avoid the red things. No tutorial walls; How to Play is optional, one screen, visual. |
| Forgiving difficulty curve | Difficulty ramps smoothly (additive speed/density), first failure happens early enough to teach but late enough to hook (target ~60–90s). Losing a run costs 1–3 minutes, never a save file. |
| Strong feedback loop | Every action has immediate, layered feedback (see `core/feedback.md`). Cause and effect are never ambiguous. |
| Session length | One run lasts ~1–3 minutes. Sessions are naturally bounded and replayable: "one more run" fits a commute, a queue, a break. |
| No punishing complexity | No inventory, no builds, no meta-economy beyond a local best score. The skill ceiling is execution and pattern reading, not systems mastery. |
| Satisfying replay | The pull is a personal best: score, combo, and level reached. Persisted best score + best combo give a concrete target for the next run. |
| One-finger friendly | Full game must be playable with one finger (drag) or one hand (arrows). Minimum touch targets 44px; HUD and panels respect safe areas. |
| Accessible by default | No audio-required information; reduced-motion and mute toggles must exist; keyboard-navigable menus; visible focus. |
| Performance floor | Runs at 60fps on mid-range mobile; particle budgets and pooling are non-negotiable (see `core/qa-checklist.md`). |

## Genre do / don't

| Do | Don't |
| --- | --- |
| Do make every spawn readable at a glance (shape + color + glow). | Don't introduce hidden rules or systems after the first 30 seconds. |
| Do celebrate milestones (combo, level, record). | Don't punish with information loss — a mistake must be visible and recoverable. |
| Do keep runs short and the retry path one tap away. | Don't add permanent consequences for losing. |
| Do keep the difficulty ramp monotonic and telegraphed. | Don't use random difficulty spikes or unavoidable patterns. |
| Do persist the best score/combo locally. | Don't require accounts, login, or online features. |

## Session flow (canonical)

```
Menu → (How to Play / Settings) → Gameplay → Pause ⇄ Resume
                                        ↘ Game Over → Play Again / Menu
```

The player is always at most two inputs away from starting a run, and the
menu CTA is always "Play".
