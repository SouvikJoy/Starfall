# Gameplay

STARFALL is an endless arcade catch-and-avoid skill game. A glowing pod moves
horizontally along the bottom of the field. Stars fall from the top; catch
stars for points, catch gold stars for big points, avoid comets. Misses and
comet hits reset the combo. Levels tick up every 18 seconds, speeding up
spawns and falls. The run ends when the pod runs out of lives.

## Core loop

```
Catch stars → grow combo → multiplier rises (every 5 catches, max x10)
   → score accelerates → survive faster levels → beat your best score
                      ↑                                        |
                      └────────────── play again ─────────────┘
```

30 seconds to learn, 1–3 minute sessions, "one more run" replay pull.

## Scoring math

| Element | Base points | Notes |
| --- | --- | --- |
| Star | 10 | × current multiplier. |
| Gold star | 50 | × current multiplier. Rare (see project rules). |

**Multiplier** = `1 + floor(combo / 5)`, capped at **x10**.

| Combo range | Multiplier |
| --- | --- |
| 0–4 | x1 |
| 5–9 | x2 |
| 10–14 | x3 |
| 15–19 | x4 |
| 20–24 | x5 |
| 25–29 | x6 |
| 30–34 | x7 |
| 35–39 | x8 |
| 40–44 | x9 |
| 45+ | x10 (cap) |

- Combo increments by +1 for every caught object (star or gold star).
- Combo resets to 0 on a missed star or a comet hit.
- Combo does not decay over time — only misses and hits break the chain
  (project-level decision; keeps the game skill-based, not speed-mashing).
- Score is the sum of all catch points this run. Best score and best combo
  persist in `localStorage`.

## Difficulty ramp

- A **level** advances every **18 seconds**: `level = floor(elapsedSeconds / 18) + 1`.
- Each level tier cycles a **visual theme** (Aurora → Nebula → Gold Rush → Rose Field →
  Emerald → Ocean → Sunset → Galaxy, then repeat). The theme recolors the drifting
  nebula, ground glow, floating-text accent, and the particle palette for that level.
  It is presentation only — it does not change difficulty or spawn rules.
- Both curves interpolate linearly from level 1 to the cap at level 12, then
  hold. `t = clamp((level - 1) / 11, 0, 1)`.

| Curve | Level 1 | Level 5 | Level 8 | Level 10 | Level 12+ |
| --- | --- | --- | --- | --- | --- |
| Spawn interval (s) | 0.92 | 0.71 | 0.55 | 0.45 | 0.34 |
| Fall speed (H/s) | 0.32 | 0.44 | 0.54 | 0.60 | 0.66 |

- `spawnInterval = 0.92 − 0.58t` seconds; `fallSpeed = 0.32 + 0.34t`
  (H = viewport height per second). Each interval gets ±10% jitter so spawns
  never feel robotic.
- **Spawn mix**: normal star always available; gold star chance is fixed
  (8%, project rule); comet chance rises linearly from 8% at level 1 to 22%
  at level 12+.
- **Fairness rule**: a gold star and a comet never spawn in the same lane
  within 0.4s of each other — rewards are risk, not traps. There is always a
  catchable star on screen (spawn spacing guarantees a catch opportunity
  within ~1.5s at any level).

## Collision and catch rules

- The pod is a horizontal catcher along the bottom of the field.
- A falling object is **caught** when its center overlaps the pod's catch zone
  (horizontal overlap with pod bounds AND vertical distance below the pod's
  catch line threshold).
- A star is **missed** when its center passes the bottom edge of the field
  without being caught → combo reset, no life loss.
- A **comet hit** resolves on the same overlap test → lose 1 life, combo
  reset, 1.2s invulnerability grace.
- Catch and hit detection runs per-object per-frame; a comet never
  registers twice (consumed on first overlap).

## Lives and invulnerability

- The pod has **3 lives** (hearts). Comet hit = exactly 1 life lost.
- After a hit, a **1.2s grace period** starts: the pod blinks and ignores
  comets (they pass through); stars are still catchable. Re-hits during grace
  deal no additional damage.
- At 0 lives the run ends (game-over flow below).

## Game-over flow

1. Last life lost → impact flash + strong shake + `hurt`-`gameOver` sequence
   (~400ms apart) with music duck.
2. ~500ms hold on the final frame.
3. Game-over screen (`--container-max` panel): final score (large), best
   score, **new-record banner** (gold, confetti, `record` fanfare) when the
   best was beaten, stat grid (stars, gold stars, max combo, level, time
   survived), and actions: Play Again, Menu.
4. Best score + best combo written to `localStorage` on record.

## Flow-channel policy

The difficulty curve is calibrated so a new player's first death lands around
60–90s, and veterans can push several minutes at the level-12 ceiling. The
ramp is additive (speed + density), never arbitrary: every change is announced
by the level-up moment, giving the player a beat to re-orient before the new
pace matters. There are no sudden "walls" — performance degrades gradually and
always from the player's own chain-breaking.

## Inputs

| Action | Pointer | Touch | Keyboard | Gamepad (optional) |
| --- | --- | --- | --- | --- |
| Move pod | Pointer position/drag | Drag | Arrows / A-D | Left stick / D-pad |
| Pause | HUD button | HUD button | Space / P | Start / Back |
| Confirm | — | — | Enter | A |
| Back / close | — | — | Esc | B |
