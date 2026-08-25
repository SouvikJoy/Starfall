# Feedback

Every interaction in STARFALL must answer four questions:

1. **What happened** — the event is visible at its source (particles, float
   text, state change).
2. **Why it happened** — the cause is legible (you caught a star, you touched
   a comet).
3. **Whether it succeeded** — positive/negative/neutral is unmistakable
   (reward color vs danger color vs dim).
4. **What the player can do next** — the HUD and state make the next action
   obvious (keep catching, avoid comets, rebuild the combo).

The player should never need to guess the state of the game.

## Feedback layers

Every event uses a coordinated suite across layers (visual, audio, and
haptic-ish vibration via `navigator.vibrate` where supported). Vibrations are
short pulses only, disabled under reduce-motion and on unsupported devices.

| Layer | Role |
| --- | --- |
| Visual | Particles, float text, color flash, shake, HUD state change. |
| Audio | SFX + ducking per `audio.md`. |
| Haptic-ish | One short vibration pulse (max 30ms) for hit; one 15ms pulse for record. |

## Gameplay event map

| Event | What happened | Why | Succeeded? | Next | Visual | Audio | Vibration |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Star caught | +10 × multiplier; combo +1 | Caught a falling star | Yes | Keep catching to raise the multiplier | Spark burst + cyan float text "+10", pod glow pulse, combo bar fills | `catch` (pitch rises with combo) | none |
| Gold star caught | +50 × multiplier; combo +1 | Caught a rare gold star | Yes | Watch for comets; chain toward x10 | Gold burst + rays + gold float text "+50", gold glow flash | `gold` | 15ms pulse |
| Comet hit | -1 life; combo reset; 1.2s grace | Touched a comet | No | Reposition during grace; rebuild combo from x1 | Danger flash overlay, medium shake, debris particles, heart lost animation, pod blink during grace | `hurt` + music duck | 30ms pulse |
| Star missed | Combo reset (no life loss) | A star fell past the catch line | No (neutral) | Recover; catch the next star to restart the chain | Dim "MISS" float text, subtle shake, combo meter empties | `miss` | none |
| Level up | Spawns faster, falls quicker (every 18s) | Survived 18s | Yes (milestone) | Adapt to the new pace | Ring particle + level pill pulse + toast "Level n" | `levelUp` | none |
| Combo milestone (every 5th catch) | Multiplier +1 (max x10) | Consistent catching | Yes | Push toward the next multiplier | Badge pop + success ring + combo float text "x3!" | `comboMilestone` | 15ms pulse |
| New record | Best score beaten | Outstanding run | Yes | Keep playing or end on a high | Gold confetti + record banner + score glow | `record` + music duck | 15ms pulse |
| Game over | Run ended (0 lives) | Out of lives | Ended | Review stats; play again | Strong impact shake, game-over screen with score/best/stats, new-record banner if applicable | `gameOver` + music duck | 30ms pulse |

## UI feedback map

| Interaction | Feedback |
| --- | --- |
| Button press | `click`, scale 0.95, shadow drop. |
| Button hover | `hover`, scale 1.03, brighter gradient. |
| Modal open/close | `uiOpen`/`uiClose`, fade + scale with `--ease-out`. |
| Toggle flip | `click` (lighter), thumb spring, track recolor. |
| Invalid/blocked action | Error tone (low `click` variant), disabled control never plays full click. |
| Pause | `uiOpen`, overlay fade; music ducks to near-silence. |
| Resume | `uiClose`, overlay out; music fades back in. |

## Rules

- Every sound must have a visual counterpart and vice versa — audio is
  enhancement, never the sole channel.
- Important events get more layers than routine events (gold > star; record >
  milestone > routine).
- Feedback never blocks input: effects are fire-and-forget and pooled.
- Life loss is diegetic (heart + pod + float text), never a toast.
- After any feedback, the "what's next" must be visible in the HUD or on the
  current screen.
