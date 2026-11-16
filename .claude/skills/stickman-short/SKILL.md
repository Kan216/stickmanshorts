---
name: stickman-short
description: End-to-end pipeline to create a vertical glowing-stickman motivational short (9:16, Remotion + ffmpeg) from an idea, a message, or a reference video. Use when the user asks to "make a short/video/reel about X", "create a stickman animation", "make another one like this", or invokes /stickman-short.
argument-hint: "<idea or message>  [--length 15s] [--format versus|split|series|metaphor|counter|compilation]"
---

# Make a stickman short — end to end

Input: `$ARGUMENTS` (an idea, a quote, a lesson, or a path to a reference video).
Output: `out/<Name>.mp4` (720×1280, 30fps, −14 LUFS) + `storyboards/<slug>.md` + `src/shorts/<slug>/`.

Read `CLAUDE.md` and `docs/STYLE_GUIDE.md` first if you have not this session.

## 0. Setup (once per environment)
```bash
[ -d node_modules ] || npm install
[ -f public/sfx/pop.wav ] || npm run sfx
```

## 1. Concept → storyboard  (skill: `stickman-storyboard`)
- If the input is a reference video, run the `reference-analyze` skill first and extract the *format*, not the content.
- Pick ONE format from the style guide, ONE metaphor, ≤3 characters, 1 accent colour each.
- Write `storyboards/<slug>.md` from `docs/STORYBOARD_TEMPLATE.md` with a full beat table (seconds).
- If the user is present and the idea was vague, show them the beat table (hook, beats, punchline) and get a quick OK before coding. If they said "just do it", proceed.

## 2. Code the short  (skill: `stickman-animate`)
1. `cp -r src/shorts/the-climb src/shorts/<slug>` then rename the file/component (`<Name>.tsx`, `export const <Name>`, `<NAME>_DURATION`).
2. Rewrite the `B` beats object from the storyboard table (`sec()` values).
3. Layers in order: `Backdrop` → props / lane lights → characters → text (`Headline`, `StatRow`, `BigCounter`) → `Watermark` → `Vignette` → sound (`Music`, `Sfx`).
4. Characters: `<Stickman pose={poseAt(frame,[...])}/>`, walking via `walkCycle`, idle via `addPose(p, breathe(frame))`.
5. Register in `src/Root.tsx`: `<Composition id="<Name>" component={<Name>} durationInFrames={<NAME>_DURATION} {...VIDEO} />`.
6. `npx tsc --noEmit` must pass.

## 3. Visual QA loop (mandatory)
```bash
for f in <one frame per beat, e.g. 15 45 120 200 300 400>; do npm run still -- <Name> out/<slug>/f$f.png $f; done
```
Read every PNG. Check: headline vs stats overlap, limbs off-screen, characters overlapping
unintentionally, poses reading correctly (silhouette test: is the emotion clear with no text?),
empty-looking frames, text inside safe area. Fix → re-render stills. Repeat until clean.

## 4. Sound pass  (skill: `stickman-sound`)
Every action → an `Sfx`. Music bed with fades. Riser into the payoff, `ding`/`boom` on the punchline.

## 5. Render + analyze
```bash
npm run render -- <Name>                       # → out/<Name>.mp4 (finalize.sh runs loudnorm)
bash scripts/analyze.sh out/<Name>.mp4 out/<slug>/qa 12
```
Read `out/<slug>/qa/sheet.png` (pacing: does something change every ~1.5s? is the payoff held ≥2s?)
and `info.txt` (720x1280, 30fps, I ≈ −14 LUFS). Fix and re-render if needed.

## 6. Deliver
- Report: path to MP4, length, the storyboard summary, and 1–2 ideas for variations/series.
- Optional (skill `ffmpeg-post`): 1080×1920 upscale, thumbnail PNG, GIF preview.
- Commit storyboard + source (never `out/`) if the user wants it saved.

## Pitfalls
- Text pops overshoot — keep ≥ 12px gap between headline and stats.
- Pose angles are torso-relative; leaning torso needs compensated hips (see `stickman-animate`).
- Keep total on-screen words per beat ≤ 6. Viewers watch figures, not paragraphs.
- Don't copy reference channels' names/watermarks/scripts — originals only.
