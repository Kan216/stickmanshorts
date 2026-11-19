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
- Presenter: `<Stickman style="chalk" canvas={{w: L.W, h: L.H}} .../>`. The `canvas` prop is required
  for 16:9, or the figure is drawn off-canvas. Pose per scene type in `scenePose()` (Explainer.tsx).
- Animate in at frame ≥ 1, never exactly 0 → a frame-0 still shows nothing for `Draw`/`Flag`.

## Layout rules
- Read positions from `useChalk().L` (stage, presenter, captionY, deadZoneY). Each template branches
  on `format === "short"` for its geometry — keep both branches in sync.
- Short (720×1280): content y 200–830, presenter bottom-right (x≈560–690, y 650–840): keep stats
  narrower than x=540 there. Captions at y≈915. Nothing important below y=1000.
- Long (1280×720): content x 60–1020, presenter right (x≈1080–1190). Captions at y≈650.
- Number → appear when spoken: `cueFrame(ps.words, String(value), fallback)`.
- Bars are scaled to `metricMax(ep)` (the #1 value) so every scene compares fairly.

## Adding a scene type (e.g. `versus`, `barRace`, `iconCount`)
1. Add the type to `Scene` in `types.ts` (with `say`, `sayLong?`, `only?`, `pause?`).
2. Write the component in `scenes/` taking `SceneProps<YourScene>`; branch geometry per format.
3. Add a `case` to `SceneBody` and to `scenePose()` in `Explainer.tsx`.
4. Use it in an episode, run TTS, check stills in BOTH formats.

Ideas queued: `versus` (two flags, two stickmen holding signs, winner circled), `barRace`
(all bars drawn then re-sorted), `iconCount` (1 stickman = N units), `map` (rough outline + pin).

## Performance
SVG filters are CPU-heavy: ~6 min per 60 s Short on 4 cores. Iterate with stills, render once.
