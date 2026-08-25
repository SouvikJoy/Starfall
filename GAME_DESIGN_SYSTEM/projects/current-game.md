# Current Game — STARFALL

## Identity

- **Title:** STARFALL
- **Platform:** HTML5 browser (desktop + mobile touch)
- **Genre:** Arcade / Casual Skill Game
- **Format:** Endless high-score chase, one-finger friendly, 30-second learn
- **Design language:** Deep-space indigo, cyan primary, violet secondary,
  gold rewards, rose danger, emerald success; rounded Fredoka display type;
  pill buttons, glassy cards, glow accents; particles, floating text, screen
  shake, WebAudio SFX + generative ambient music.

## Vision

One paragraph:

> STARFALL is a deep-space catch-and-avoid arcade game you can learn in one
> glance and chase for a lifetime. A glowing pod glides along the bottom of a
> starfield, catching falling stars while dodging comets. Every catch builds
> a combo that multiplies your score, every 18 seconds the sky speeds up, and
> every run ends with a number you want to beat. Calm to learn, intense to
> master, and always one more run away from a new record.

## Project-level rules (override genre and core)

These are STARFALL's exact product decisions. Where any of them conflict with
genre rules or core rules, the project rules win.

| # | Decision | Rule |
| --- | --- | --- |
| 1 | Endless survival, not levels/stages | There are no victory levels or stage progression. "Level" is a difficulty tier that advances every 18s; the run is endless and ends only when lives run out. |
| 2 | Comet hit = exactly 1 life | One comet hit costs exactly 1 of 3 lives. No shields, no pickups, no one-shot deaths. Combo also resets. |
| 3 | Gold star frequency | Gold stars spawn at a fixed **8%** of spawns, independent of level. Rarer, but always fair — never scales with difficulty. |
| 4 | Combo window | Combo has **no time decay**. It resets only on a missed star or a comet hit. The multiplier steps up every 5 consecutive catches (`1 + floor(combo/5)`, max **x10**). This favors careful, consistent play over speed-mashing. |
| 5 | Missed star penalty | A missed star resets the combo but costs no life. Neutral feedback — recoverable, not punishing. |
| 6 | Invulnerability grace | 1.2s after a comet hit: pod blinks, ignores comets, stars still catchable. No damage stacking during grace. |
| 7 | Level duration | Level advances every **18 seconds**; spawn interval ramps 0.92s → 0.34s and fall speed 0.32H → 0.66H. Comet spawn rate ramps 7% → 27% of spawns. Full difficulty is reached at level 12. |
| 8 | Pause behavior | Space/P or HUD button pauses; the game **auto-pauses when the tab loses visibility**. Enter confirms, Esc backs out. |
| 9 | Persistence | Only best score + best combo persist (localStorage). No accounts, no cloud. |
| 10 | Session target | One run ~1–3 minutes; the retry path is one tap from game over. |
| 11 | Feedback vocabulary | Gold = reward, cyan = interact, rose = damage, emerald = combo success. Gold star uses `burst`+`rays`; record uses confetti; level up uses a ring — per `core/motion.md`. |
| 12 | Audio | All audio synthesized via WebAudio (no asset files). Music and SFX have separate toggles. See `core/audio.md`. |
| 13 | Reduced motion | OS `prefers-reduced-motion` plus an in-game toggle that disables shake and caps particles. See `core/motion.md`. |

## Persistence contract

| Key | Stores |
| --- | --- |
| Best score | Highest single-run score. |
| Best combo | Highest single-run combo (max multiplier reached). |
| Settings | SFX on/off, music on/off, reduce-motion on/off. |

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-23 | Initial Game Design System baseline. |
| 2026-08-25 | **Vibrant refresh.** Brightened the palette with magenta / orange / blue accents + a rainbow gradient, animated rainbow logo/menu CTA and combo multiplier, level-up banner, and an ambient particle layer (floating motes + more frequent themed shooting stars). Each level tier now carries a **visual theme** (Aurora, Nebula, Gold Rush, Rose Field, Emerald, Ocean, Sunset, Galaxy) that recolors the nebula, ground glow, accent, and particle palette; they cycle endlessly for levels 1…12+. The pod/UFO is unchanged. Level progression remains an endless timed tier, not a stage system. |
