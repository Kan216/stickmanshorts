---
name: chalk-scenes
description: Reference for ChalkTalk visuals in Remotion — the chalkboard, chalk text that writes itself, hand-drawn lines/circles/hatched bars, flags, the chalk stickman presenter, 9:16 vs 16:9 layouts, and how to add a new scene type (bar race, versus, icon count). Use when changing how a ChalkTalk scene looks or adding a template.
---

# ChalkTalk scenes

```
src/chalk/
  theme.ts        CHALK colours, CHALK_FONTS, LAYOUTS.short / LAYOUTS.long, VO pacing
  types.ts        Episode + Scene types (hook | rank | leaderboard | outro), Timing
  plan.ts         buildPlan(): scenes → frames from timing.json; cueFrame(words, "1,399")
  Board.tsx       ChalkProvider/useChalk (format + layout), ChalkBoard, filter ids CK.*
  draw.tsx        ChalkText, Draw, Sketch, Flag, roughLine/roughRect/roughEllipse/hatch, parseMarkup
  Captions.tsx    word-synced captions
  scenes/         Hook, Rank, Leaderboard, Outro
  Teacher.tsx     the presenter character: GESTURES (arms), expressions, mouth, effects
  Presenter.tsx   "director": narration → gestures/expressions/effects + lip-sync per scene
  TeacherSheet.tsx look-test still with every gesture + expression
  Thumbnail.tsx   stop-scroll thumbnails (<Id>ThumbLong / <Id>ThumbShort stills)
  Explainer.tsx   composition: board, header, scenes, VO audio, SFX, presenter, captions, music
  ChalkSheet.tsx  look-test still (npm run still -- ChalkSheet out/chalk/sheet.png)
src/lib/chalkFilter.tsx  the SVG chalk filter (also used by Stickman style="chalk")
```

## Primitives
- `ChalkText` — `text` supports `{yellow:WORD}` and `\n`; `start` (frame), `cps` chars/sec (0 = instant),
  `font: "title"` (Gochi Hand) or `"body"` (Patrick Hand), `w` + `align`. Text wraps inside `w`.
- `<Sketch>` = full-frame SVG with the chalk filter. Inside: `<Draw d=... start dur color width/>`
  draws a path on; use `roughLine/roughRect/roughEllipse` for hand-drawn shapes, `hatch()` for fills.
- `Flag cc="us"` — flag-icons SVG, wiped in, chalk-textured, hand-drawn frame. Needs
  `public/flags/<cc>.svg` (chalk-tts copies the episode's flags).
- Presenter = `Teacher`: big round head (27% of height), short body, mitten hands, chalk-boiling lines.
  - `arms`: a `GESTURES` name (`idle, explain, open, pointUp, present, presentHigh, chin, cheeks, cheer,
    wave, shrug`) or an `ArmPose` (`lerpArms` to blend). Angles: `a` = upper arm from straight-down toward
    the outside, `b` = extra forearm rotation; negative `b` brings the hand back to the face.
  - `expression`: `neutral | talk | thinking | surprised | happy | idea | confused`; `mouth` 0–1.
  - `effect`: `lines | question | exclaim | bulb | sparkle | dots`, `effectT` 0–1 pops it in.
  - `canvas={{w: L.W, h: L.H}}` is required (16:9 would draw off-canvas otherwise).
- `Presenter.tsx` `sceneKeys()` decides the acting per scene type: hook = thinking + "?" → idea + bulb
  at the 2nd sentence; rank = explain → open at the country name → present (arm to the board) + lines
  when the number is said; #1 = hands-on-cheeks surprised + "!"; then beat gestures every ~6 words;
  leaderboard = presentHigh; outro = open → pointUp at "comments" → wave + happy + sparkles.
  New scene type → add a case there too. Mouth flaps only while a word is spoken (timing.json).
- The old `Stickman style="chalk"` still exists for crowds/extras.
- Animate in at frame ≥ 1, never exactly 0 → a frame-0 still shows nothing for `Draw`/`Flag`.

## Layout rules
- Read positions from `useChalk().L` (stage, presenter, captionY, deadZoneY). Each template branches
  on `format === "short"` for its geometry — keep both branches in sync.
- Short (720×1280): content y 200–830; the teacher stands bottom-right (head x≈560–690, y≈620–750,
  effects reach up to y≈520 and left to x≈490): keep stats/bars right edge ≤ x 490 below y 520.
  Captions at y≈915. Nothing important below y=1000.
- Long (1280×720): content x 60–1020, presenter right (x≈1080–1190). Captions at y≈650.
- Number → appear when spoken: `cueFrame(ps.words, String(value), fallback)`.
- Bars are scaled to `metricMax(ep)` (the #1 value) so every scene compares fairly.

## Adding a scene type (e.g. `versus`, `barRace`, `iconCount`)
1. Add the type to `Scene` in `types.ts` (with `say`, `sayLong?`, `only?`, `pause?`).
2. Write the component in `scenes/` taking `SceneProps<YourScene>`; branch geometry per format.
3. Add a `case` to `SceneBody` in `Explainer.tsx` and to `sceneKeys()` in `Presenter.tsx`.
4. Use it in an episode, run TTS, check stills in BOTH formats.

Ideas queued: `versus` (two flags, two stickmen holding signs, winner circled), `barRace`
(all bars drawn then re-sorted), `iconCount` (1 stickman = N units), `map` (rough outline + pin).

## Performance
SVG filters are CPU-heavy: ~6 min per 60 s Short on 4 cores. Iterate with stills, render once.

## Thumbnails
`Thumbnail.tsx` reads `episode.thumbnail`. Layout: kicker tag → huge question → (Short: shock number)
→ top-3 flags with #1 circled red → big surprised teacher with "!". Text uses `texture="soft"` +
a dark `shadow` for legibility. Render: `npm run chalk:thumb -- <Id>` (1.5× JPEG).
