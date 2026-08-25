# Audio

All STARFALL audio is synthesized at runtime with WebAudio — there are no
audio asset files. This keeps the game lightweight and lets pitch and density
track gameplay state (e.g., combo-based pitch). The AudioContext is created
and resumed on the first user gesture; it is suspended when the tab is hidden.

## Master architecture

- Master gain ~0.5. SFX bus ~0.9 of master, music bus ~0.35 of master.
- Polyphony cap: 6 concurrent voices; the quietest voice drops first.
- Retrigger policy: re-triggering the same SFX resets its envelope
  (catch spam throttled to min 60ms spacing).
- Pause menu: SFX bus continues only for `uiOpen`/`uiClose`; gameplay SFX and
  music duck to near-silence while paused.

## SFX inventory

Every sound answers a question: the player must know whether the action
succeeded and why.

| SFX | Trigger | WebAudio recipe | Intent |
| --- | --- | --- | --- |
| `click` | Any `.btn` / `.icon-btn` press | Short filtered noise burst + tiny square blip, ~80–120ms | Confirm the press registered. |
| `hover` | Button hover (desktop only, throttled) | Very soft tick, ~40ms, low gain | Make the UI feel alive; never spammy. |
| `catch` | Star caught | Triangle blip, base ~440Hz rising up to ~880Hz as combo grows | Reward cadence that scales with skill. |
| `gold` | Gold star caught | Two-tone chime ~660 → ~990Hz with shimmer | Distinguish the rare, big reward. |
| `hurt` | Comet hit | Low sawtooth + noise thud, downward pitch | Immediate, unambiguous life-loss signal. |
| `miss` | Star missed (reset combo) | Soft descending two-note, low gain | Combo is gone — but calm, not punishing. |
| `levelUp` | Level up (every 18s) | Rising 3–4 note arpeggio | Milestone; speeds are about to change. |
| `comboMilestone` | Every 5th catch (multiplier up) | Quick ascending two-note sparkle | Reward consistency; pairs with badge pop. |
| `record` | New best score | Short fanfare: rising triad + sparkle | Celebration of a personal best. |
| `gameOver` | Run ends (0 lives) | Descending soft chord | Closure; leads into the stats screen. |
| `uiOpen` | Panel/modal opens | Soft upward whoosh (filtered noise swell), ~200ms | Entering a new context. |
| `uiClose` | Panel/modal closes | Downward whoosh, lower gain, ~160ms | Leaving a context. |

Volume ladder (relative): `hover` < `miss` < `click` < `catch` < `levelUp` <
`comboMilestone` < `gold` < `hurt` < `record` < `gameOver`. Important events
are louder; frequent events are quieter.

## Ambient music policy

- Music is a subtle generative loop: a slow pad chord cycle in the indigo/cyan
  mood, built from oscillators and a seeded pattern — no audio files, no
  jarring loops.
- It is low in the mix (`--` music bus 0.35) and must never mask SFX.
- Music has its own toggle, separate from the SFX toggle (both in Settings,
  both persisted).
- Music starts on the menu screen, continues into gameplay, and ducks
  (-8dB for ~1s) on `hurt` and `gameOver` so damage moments read clearly.

## Ducking and overlap guidance

- Duck music -8dB during `hurt` and `gameOver`; restore over ~800ms.
- Never layer `gameOver` over `hurt`; sequence them (~400ms apart).
- `record` may overlap `levelUp` only if they trigger within 150ms — otherwise
  let the record fanfare win.
- Throttle `hover` to one voice per 120ms.
- Keep total simultaneous voices ≤ 6; when the budget is full, drop the
  quietest voice instead of stacking.

## Persistence and accessibility

- Settings persist: SFX on/off, music on/off, reduce-motion on/off.
- When SFX is off, music stays; when music is off, SFX stays — never one
  switch for both.
- No audio is required for comprehension: every sound has a visual
  counterpart (see `feedback.md`), so the game is fully playable muted.
