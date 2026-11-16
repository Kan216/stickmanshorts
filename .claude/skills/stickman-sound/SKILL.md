---
name: stickman-sound
description: Add music bed and sound effects to a stickman short, generate original SFX with ffmpeg, time sounds to beats, and hit −14 LUFS. Use when adding/adjusting audio, when the user supplies music, or when a render sounds empty/too loud.
---

# Sound design for shorts

Shorts in this style have **no voice-over**: a music bed + tight SFX carry the emotion.

## Assets
- `npm run sfx` → `scripts/gen-sfx.sh` synthesises an original starter pack with ffmpeg:
  `pop tick step thud whoosh riser ding glitch heartbeat boom` (public/sfx/*.wav) and
  `pad-dark.wav`, `pad-hope.wav` (public/music, 30s ambient pads).
- User music/SFX: drop files in `public/music/` or `public/sfx/` (mp3/wav). Only use audio the
  user has rights to (their own, royalty-free licence, or generated here). Note the licence in
  the storyboard.
- To add a new synthesized SFX, add a `gen <name> "<aevalsrc expr>" <dur> "<filters>"` line.
  **No commas inside expressions** (ffmpeg filter separator) — use `ceil()`, `abs()` tricks.

## In code
```tsx
<Music file="pad-hope.wav" volume={0.3} fadeIn={15} fadeOut={30} />
<Sfx at={B.hook} name="boom" volume={0.6} />
<Sfx at={B.hit} name="sfx/my-hit.mp3" />                       // custom file path
{reps.map((f, i) => <Sfx key={i} at={f} name="tick" volume={0.35} />)}
```

## Timing rules
| Event | SFX | Volume |
|---|---|---|
| Opening frame / title | boom | 0.6 |
| Text pop / counter increment | pop / tick | 0.3–0.4 |
| Footsteps / reps | step / tick | 0.35–0.45 |
| Fast move / transition / chapter change | whoosh | 0.5 |
| Fail / quit / break | glitch, thud | 0.5–0.7 |
| Tension (stuck, fear) | heartbeat (repeat every ~0.8s) | 0.6 |
| 1.5–2s before payoff | riser (ends exactly on payoff) | 0.35 |
| Payoff / reveal / punchline | ding + boom | 0.7 |

- Place the SFX **on the frame the action lands** (impact frame), not when it starts; whooshes 2–4 frames early.
- Riser: `at = B.payoff - sec(2)` with the 2s riser file.
- Music: dark pad for struggle stories, hope pad for growth; duck (lower volume) is rarely needed without voice.
- Lots of repeated ticks? Keep ≤ 0.35 volume or they fatigue.

## Loudness / QA
`scripts/finalize.sh` (run by `npm run render`) applies `loudnorm=I=-14:TP=-1` → platform standard.
Check with `bash scripts/analyze.sh out/<Name>.mp4` → `info.txt` `I: ≈ -14 LUFS`; look at
`wave.png` — there should be visible peaks at each beat and no flat silent stretches.

## External (optional, needs user's API keys / installs)
- Licensed music libraries or AI music tools — user's choice; save files into `public/music/`.
