---
name: reference-analyze
description: Study a reference short (mp4) so Claude can "watch" it — contact sheet, key frames, scene cuts, audio waveform, loudness — and extract its format, pacing, layout, palette and sound design into a reusable storyboard. Use when the user uploads/points to a video and says "make one like this", "analyze this", or "copy this style".
argument-hint: "<path/to/video.mp4> [more videos...]"
---

# Analyze a reference video

## 1. Extract
```bash
mkdir -p references
bash scripts/analyze.sh "<video.mp4>" references/analysis/<name> 12
```
Produces: `sheet.png` (12 frames with timestamps), `frames/*.png` (full-res), `wave.png`,
`cuts.txt`, `info.txt` (resolution, fps, duration, LUFS).
For long/fast videos use 24 frames; for a specific moment:
`ffmpeg -ss 7.5 -i in.mp4 -frames:v 1 out.png`.

## 2. Look (read the images — don't guess)
Read `sheet.png` first, then 3–5 full-res frames at the key moments. Note:

| Aspect | What to record |
|---|---|
| Format | versus lanes / split / series / metaphor / counter flip / compilation |
| Structure | hook → escalation → twist → punchline, with timestamps |
| Layout | headline y, stats y, ground y, character size, lanes |
| Palette | background, per-character accents, payoff colour |
| Character style | neon outline / solid / silhouette / line; faces; glow |
| Text | casing, weight, words per beat, colour-keyword pattern, animation (pop/type) |
| Counters | what is counted, how often it changes |
| Motion | pacing (change every N s), camera moves, particles |
| Audio | from `wave.png` + `info.txt`: music bed? hits on beats? loudness |

## 3. Translate into OUR system
- Map each observation to repo components (`Stickman` style, `Headline` mode, `StatRow`,
  `Props`, `MOODS`). Missing piece? Note it for `stickman-animate` → "Extending".
- Write a storyboard with a **new, original concept** in the same *format* — different message,
  different metaphor or twist, our `CHANNEL_NAME`. Never reproduce another creator's
  script, characters, watermark or exact scenes.
- Append a short summary of the reference to `references/README.md` (format + lessons) so
  future sessions can reuse it without re-analyzing.

## 4. Hand off
Continue with the `stickman-short` skill from step 2 (code).
