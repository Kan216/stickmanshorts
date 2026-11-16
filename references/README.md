# References

Drop reference videos here (`*.mp4` is git-ignored — they're third-party content and stay local).
Analyze with `bash scripts/analyze.sh references/<file>.mp4` (skill: `reference-analyze`).

Below: format notes from the 4 reference shorts used to design this repo. They describe
**formats and techniques** to learn from, not content to copy.

## Common traits (all 4)
- 720×1280, 30fps, AAC stereo, music + SFX, **no voice-over**, ≈ −14…−16 LUFS mean.
- Near-black backgrounds, glowing stickmen, thin ground line at ~70% height,
  tiny channel watermark with chapter dots under the ground line, empty bottom ~25%.
- ALL-CAPS heavy headline at the top; one keyword coloured like its character.
- A visible **number** drives the story (counters, reps, shots, days, eye/fear meter).

## 1. "Seven sins" chapter series (62s)
- 7 chapters × ~8s. Each: pixel-font label (SLOTH, GLUTTONY, …) + colour bar, the scene tinted
  in that sin's colour, two neon-outline figures acting the sin out.
- Progress object: a tree at the top whose fruits light up one per chapter.
- Ending: all colour drains, a full golden tree, one word: "BOW." → format = **Chapter series**.
- Audio: steady rhythmic bed during chapters, calm gap, final swell + hit at the end.

## 2. "Bad dream at 2:14 AM" A/B split screen (14s)
- Top panel: child alone in a cold blue bedroom; bottom panel: same room, warm lamp, a parent comes.
- Typewriter headline "I HAD A BAD DREAM." + time "2:14 AM"; an eye icon counter per panel
  (fear level) — top climbs to 150+, bottom stays ~17.
- Silhouette figures; shadows/monster hands grow on the top panel only.
- Punchline: "SMALL FEARS / NEED BIG PEOPLE." (line 2 gold) → format = **A/B split**.

## 3. "Who stops first?" versus lanes (25s)
- 3 solid-style characters on a pull-up bar: TALENT (teal), DISCIPLINE (steel blue), EGO (orange);
  coloured light column under each. Counters per character, discipline shows `n/10`.
- Beats: TALENT GOT BORED (drops, walks off) → DISCIPLINE DID ENOUGH (stops at 10/10, walks off
  calmly) → a new red OBSESSION character with "∞" appears → EGO BROKE TRYING →
  "WHICH ONE ARE YOU?" → format = **Versus lanes** with a twist character.

## 4. Metaphor compilation (25s, 3 × ~8s)
- Archers: top lane "SHOTS 0" never shoots, bottom lane shoots repeatedly and finally hits →
  "YOU MISS EVERY SHOT YOU NEVER TAKE."
- Underwater: swimmers chained to "THE PAST" weights; one weight turns gold/breaks and the figure rises.
- Couch vs stairs: thought cloud of stairs, "DAYS WAITING 0 → 365", then "STEPS TAKEN 8",
  "DAY ONE. YOU DECIDE." → format = **Metaphor object** + **Counter flip**, as a **Compilation**.

## Repo coverage
| Technique | Where |
|---|---|
| neon / solid / silhouette / line figures, eyes | `Stickman` styles + expressions |
| coloured keyword headlines, typewriter | `Headline` (`{color:WORD}`, `mode="type"`) |
| stat counters, n/max, dimmed losers, ∞ glow | `StatRow`, `BigCounter`, `countUp` |
| pixel label + bar | `LabelBar` |
| pull-up bar, lane lights, stairs, water, chain weight, thought cloud, target | `Props.tsx` |
| payoff light + embers | `Spotlight`, `Particles` |
| watermark + chapter dots | `Watermark` |
| music + SFX | `Sound.tsx`, `scripts/gen-sfx.sh` |
