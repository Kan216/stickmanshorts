---
name: chalk-explainer
description: End-to-end pipeline for the ChalkTalk channel — chalkboard + stickman data explainers with an edge-tts voice-over ("top 10 countries by X", "country A vs B", rankings, comparisons in numbers). One episode.json renders BOTH a 9:16 Short and a 16:9 long video. Use when the user asks for a ChalkTalk video, a chalkboard/data/comparison/ranking video, "top 10 ...", or invokes /chalk-explainer.
argument-hint: "<topic, e.g. 'top 10 navies'>  [--format short|long|both]"
---

# Make a ChalkTalk episode — end to end

Input: `$ARGUMENTS` (a topic like "top 10 armies by active soldiers").
Output, all from ONE file `src/chalk/episodes/<slug>/episode.json`:
- `out/<Id>Short.mp4` (720×1280) + `out/<Id>Long.mp4` (1280×720), both −14 LUFS
- `out/<Id>-thumb-long.jpg` (1920×1080) + `out/<Id>-thumb-short.jpg` (1080×1920): **stop-scroll thumbnails, always delivered with the videos**

The presenter is the ChalkTalk teacher (`src/chalk/Teacher.tsx`): a big-headed chalk stick figure who
explains: lip-synced to the voice, gesturing per sentence, thinking/idea/surprised/happy faces.

This channel is separate from the motivational shorts: code lives in `src/chalk/`, never edit
`src/shorts/` for it. Same hard rules (deterministic frames, look before you ship).

## 0. Setup (once per environment)
```bash
[ -d node_modules ] || npm install
python3 -c "import edge_tts" 2>/dev/null || pip install edge-tts
[ -f public/sfx/chalk-tap.wav ] || npm run sfx
```
edge-tts needs network access to `speech.platform.bing.com` (see `chalk-voiceover`).

## 1. Research the numbers  (skill: `chalk-research`)
Write `research/<slug>.md`: the ranked table, a source + year for every number, notes on
disputed figures. **Show the table to the user and get an OK before going further** —
wrong numbers are the #1 way this channel gets torn apart in comments.
Set `"verified": true` in episode.json only after that check.

## 2. Write episode.json
`cp -r src/chalk/episodes/top10-air-forces src/chalk/episodes/<slug>` and edit:
- `slug`, `id` (PascalCase → compositions `<id>Short` / `<id>Long`), `title`, `header`, `metric`, `asOf`, `sources`, `voice`.
- `scenes`: `hook` → `rank` ×N (count DOWN: 10 → 1) → `leaderboard` → `outro`. Types are in `src/chalk/types.ts`.
- Each scene has `say` (Short) and optionally `sayLong` (16:9 — add context, one extra fact). `only: "long"` for long-only scenes.
- Short budget: **≤ 55 s of narration**. A rank line is ~3–4 s: `"Number seven. Pakistan, 1,399."`
  Write numbers as digits with commas in `say` — captions show them, and they are the cue words that
  make the stat appear exactly when spoken. `stats[0]` is the headline number and drives the bars.
- Country codes: ISO-3166 alpha-2, lowercase (`us`, `gb`, `kr`).
- Register: add the import to `src/chalk/episodes/index.ts` (Root.tsx picks it up automatically).
- `thumbnail`: `text` (2–4 huge words, a question or shock claim, one `{yellow:WORD}`), `kicker`
  (small tag, e.g. "TOP 10 AIR POWERS"), `flags` (top 3, #1 first, it gets circled red), `flagLabels`
  (`["#1","#2","#3"]`, Short), `flagValues` (numbers under the flags, 16:9), `badge` (the shock number, Short).

## 3. Voice-over  (skill: `chalk-voiceover`)
```bash
npm run chalk:tts -- <slug>                 # both formats; also copies flags to public/flags
npm run chalk:tts -- <slug> --only 4        # redo one scene after editing its line
```
Writes `public/chalk/<slug>/{short,long}/s##.mp3 + timing.json`. Video length and every
scene cut follow the voice automatically (`calculateMetadata`). Retiming = edit the line, re-run TTS.

## 4. Look (stills) — mandatory
Get scene start frames: each scene = 8 + round(dur·30) + round(pause·30) frames (pause default 0.45 s).
Render the hook, one early rank (after its number is said), #1, leaderboard and outro **in both formats**:
```bash
npm run still -- <Id>Short out/chalk/s230.png 230
npm run still -- <Id>Long  out/chalk/l200.png 200
```
Also `npm run still -- TeacherSheet out/chalk/teacher.png 0` after any change to the character.
Read the PNGs. Check: the teacher's head/effects (?, !, bulb, lines) don't touch text; long names fit (e.g. "United States", "Saudi Arabia"); numbers not clipped;
nothing under the presenter stickman; captions don't cover content; Short text above y=1000.

## 5. Render + QA
```bash
npm run render -- <Id>Short        # ~6 min for 60 s on a 4-core container
npm run render -- <Id>Long
bash scripts/analyze.sh out/<Id>Short.mp4 out/qa-<slug>
```
Read `info.txt` (−14 LUFS ±1, duration ≤ 60 s for the Short) and `wave.png` (voice continuous, no dead air).
Note: the contact sheet's timestamps are approximate; to check one moment use
`ffmpeg -ss <t> -i out/<Id>Short.mp4 -frames:v 1 x.png`.

## 6. Thumbnails (always)
```bash
npm run chalk:thumb -- <Id>     # → out/<Id>-thumb-long.jpg + out/<Id>-thumb-short.jpg
```
Read both JPGs. Stop-scroll checklist: readable at phone size (≤ 4 big words), one yellow highlight,
teacher's surprised face large, #1 circled, nothing important in the bottom-right corner of the 16:9
one (YouTube timestamp), no text overlap. Thumbnail must match the video's promise; no fake numbers.

## 7. Deliver
Send the two MP4s **and the two thumbnails** to the user. Report durations, sources and as-of year
(paste-ready for the video description), and whether `verified` is true.
