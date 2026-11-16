# CLAUDE.md — Stickman Shorts Studio

This repo makes **vertical (9:16) motivational stickman shorts**: dark minimal scenes,
glowing stickmen, one visual metaphor, bold headline text, live counters, music + SFX,
no voice-over. Videos are **code**: Remotion (React → MP4), optional Three.js via
`@remotion/three`, and ffmpeg for audio/loudness/QA. HyperFrames (HeyGen) is an optional
alternative engine (see `.claude/skills/hyperframes-alt`).

## Quick commands

```bash
npm install                # once
npm run sfx                # generate starter SFX + music pads into public/ (ffmpeg, original/royalty-free)
npm run studio             # live preview in the browser (Remotion Studio)
npm run still -- TheClimb out/f120.png 120   # render ONE frame → look at it
npm run still -- PoseSheet out/poses.png     # all poses on one sheet
npm run render -- TheClimb                   # full MP4 → out/TheClimb.mp4 (loudness-normalised)
bash scripts/analyze.sh out/TheClimb.mp4 out/qa   # contact sheet + waveform + LUFS for QA
npx tsc --noEmit           # typecheck
```

## Skills (use them — they hold the workflow)

| Skill | Use when |
|---|---|
| `stickman-short` | **Main entry.** "Make a short about X" — idea → storyboard → code → QA → render. |
| `stickman-storyboard` | Writing the concept, hook, beat sheet, on-screen text. |
| `stickman-animate` | Posing/animating characters, props, camera; extending the rig. |
| `stickman-sound` | Music bed + SFX timing + loudness. |
| `reference-analyze` | User gives a reference video: "make one like this". |
| `ffmpeg-post` | Final encode, 1080p upscale, thumbnails, previews, series concat, captions. |
| `threejs-scenes` | 3D elements (orbs, particles, objects) behind/with 2D stickmen. |
| `hyperframes-alt` | User explicitly wants HyperFrames/HTML+GSAP instead of Remotion. |

If the Remotion plugin skills are installed (`remotion:*`), use them for Remotion API questions.

## Project layout

```
src/
  index.ts, Root.tsx          # register every short as a <Composition>
  lib/theme.ts                # VIDEO size, CHANNEL_NAME, COLORS, MOODS, LAYOUT guides
  lib/anim.ts                 # sec(), progress(), fade(), pop(), shake(), rand(), countUp()
  lib/pose.ts                 # pose system: POSES library, poseAt keyframes, walk/run cycles, FK solve
  components/Stickman.tsx     # the character (styles: neon | solid | silhouette | line; expressions)
  components/Scene.tsx        # Backdrop, Watermark, Vignette
  components/Text.tsx         # Headline ({color:WORD} markup), StatRow, BigCounter, LabelBar
  components/Props.tsx        # PullUpBar, LaneLight, Stairs, Water, ChainWeight, ThoughtCloud, Target, Particles, Spotlight
  components/Sound.tsx        # <Sfx at name/>, <Music file/>
  shorts/<slug>/<Name>.tsx    # one folder per short (TheClimb is the reference template)
  three/                      # @remotion/three scenes
storyboards/<slug>.md         # the written plan for each short (from docs/STORYBOARD_TEMPLATE.md)
docs/STYLE_GUIDE.md           # the visual language — read before designing a scene
scripts/                      # render.sh, still.sh, finalize.sh, analyze.sh, gen-sfx.sh
public/sfx, public/music      # audio (generated *.wav are git-ignored; regenerate with npm run sfx)
references/                   # drop reference videos here (git-ignored); analysis notes in README
out/                          # renders (git-ignored)
```

## Hard rules

1. **Deterministic frames.** Everything derives from `useCurrentFrame()`. No `Math.random()`
   (use `rand(seed)`), no `Date`, no CSS transitions/animations, no `useFrame` in Three.js.
2. **Time in seconds, code in frames.** Define a `B` (beats) object with `sec()` at the top of
   each short; every animation/text/SFX references a beat. Retiming = editing `B` only.
3. **720×1280 @ 30fps** (`VIDEO` in theme). Text stays inside `LAYOUT.safeX` and above
   `LAYOUT.uiDeadZoneY` (bottom ~22% is covered by platform UI). Feet on `LAYOUT.groundY`.
4. **Look before you ship.** After any visual change render stills (`npm run still`) at each beat and
   *read the PNGs*. After a full render run `scripts/analyze.sh` and read `sheet.png` + `info.txt`.
   Fix overlaps (headline vs stats), off-screen limbs, pacing gaps, then re-render.
5. **Original content only.** Make original concepts and our own art. Don't copy another channel's
   name, watermark, exact scripts or characters. Use `CHANNEL_NAME` from theme for branding.
   Only use music/SFX that is generated here or that the user confirms they have rights to.
6. Each new short: storyboard in `storyboards/`, code in `src/shorts/<slug>/`, register in `Root.tsx`,
   typecheck, stills QA, render, analyze.
7. Pose angles are relative to the torso (see header of `src/lib/pose.ts`). When the torso leans,
   compensate hips/shoulders or legs will swing. Verify new poses on the `PoseSheet` still.

## Environment notes

- Render scripts auto-use `/opt/pw-browsers/chromium` if present (cloud containers); otherwise
  Remotion downloads its own headless shell. Override with `REMOTION_BROWSER=/path/to/chrome`.
- WebGL uses `swangle` (software) — works headless everywhere; set `"angle"` in
  `remotion.config.ts` on a GPU desktop for speed.
- A 15s short renders in ~45s on a small cloud container.
