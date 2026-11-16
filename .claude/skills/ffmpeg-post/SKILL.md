---
name: ffmpeg-post
description: ffmpeg post-production for stickman shorts — final encode and loudness, 1080x1920 upscale, thumbnails, GIF/preview, concatenating a series, burning captions, adding external music, trimming, looping, and QA analysis. Use after rendering or whenever the user asks to convert, compress, combine, upscale or inspect a video.
---

# ffmpeg post-production

All commands assume repo root. Render first with `npm run render -- <Name>` (it already runs
`scripts/finalize.sh` → `out/<Name>.mp4`).

## Final encode (already automatic)
```bash
bash scripts/finalize.sh out/X.raw.mp4 out/X.mp4             # H.264 high, yuv420p, CRF18, AAC 192k, -14 LUFS, faststart
SCALE=1080 bash scripts/finalize.sh out/X.raw.mp4 out/X_1080.mp4   # 1080x1920 upscale (lanczos)
```
Better than upscaling: render natively at 1080 with `npx remotion render ... --scale=1.5`.

## QA
```bash
bash scripts/analyze.sh out/X.mp4 out/qa/X 12      # contact sheet, waveform, LUFS, cuts
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact out/X.mp4
```

## Thumbnail / cover
```bash
npm run still -- X out/X_thumb.png <payoff frame>                      # crisp, from source
ffmpeg -ss 12 -i out/X.mp4 -frames:v 1 -q:v 2 out/X_thumb.jpg          # from the video
```

## Preview GIF (for chat / README)
```bash
ffmpeg -i out/X.mp4 -vf "fps=12,scale=270:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 out/X.gif
```

## Replace / add music after render
```bash
ffmpeg -i out/X.mp4 -stream_loop -1 -i public/music/track.mp3 \
  -filter_complex "[1:a]volume=0.35,afade=t=out:st=13:d=2[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest out/X_music.mp4
```

## Concatenate a series / compilation
```bash
printf "file '%s'\n" out/Part1.mp4 out/Part2.mp4 out/Part3.mp4 > out/list.txt
ffmpeg -f concat -safe 0 -i out/list.txt -c copy out/Compilation.mp4      # same codec settings → no re-encode
# with crossfades (re-encode): use xfade=transition=fade:duration=0.4:offset=<len1-0.4> and acrossfade
```
(Prefer composing a compilation inside Remotion with `<Series>` when all parts are in this repo.)

## Burn captions / extra text
```bash
ffmpeg -i out/X.mp4 -vf "subtitles=out/X.srt:force_style='Fontsize=18,Alignment=8,MarginV=60'" -c:a copy out/X_subs.mp4
```
(This style normally doesn't need captions — headlines are already on screen.)

## Trim, speed, loop
```bash
ffmpeg -ss 1.0 -to 14.0 -i out/X.mp4 -c copy out/X_trim.mp4
ffmpeg -i out/X.mp4 -filter_complex "[0:v]setpts=PTS/1.1[v];[0:a]atempo=1.1[a]" -map "[v]" -map "[a]" out/X_fast.mp4
ffmpeg -stream_loop 2 -i out/X.mp4 -c copy out/X_x3.mp4
```

## Platform specs
| Platform | Res | Max len | Notes |
|---|---|---|---|
| YouTube Shorts | 1080×1920 (720×1280 ok) | 3 min | −14 LUFS |
| TikTok | 1080×1920 | 10 min | keep text out of bottom 20% & right 15% |
| Instagram Reels | 1080×1920 | 3 min | cover frame = thumbnail |

## Pitfalls
- `-c copy` concat needs identical codecs/fps/res — re-encode otherwise.
- Always `-pix_fmt yuv420p` (finalize does) or some phones show green/black video.
- In `aevalsrc`/filter expressions, commas split filters — escape as `\,` or avoid.
