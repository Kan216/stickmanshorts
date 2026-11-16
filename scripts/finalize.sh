#!/usr/bin/env bash
# ffmpeg post: loudness-normalise to -14 LUFS (YouTube/TikTok/IG target), true-peak -1 dB,
# H.264 high profile, yuv420p, +faststart, 30fps, AAC 192k. Keeps 720x1280 unless SCALE=1080.
#   bash scripts/finalize.sh in.mp4 out.mp4
#   SCALE=1080 bash scripts/finalize.sh in.mp4 out_1080.mp4   # upscale to 1080x1920
set -euo pipefail
IN="${1:?in}"; OUT="${2:?out}"
VF="fps=30,format=yuv420p"
[ "${SCALE:-}" = "1080" ] && VF="scale=1080:1920:flags=lanczos,$VF"
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  # two-pass loudnorm: measure, then apply linearly (single pass undershoots on dynamic mixes)
  # peak limiter first so short hits (boom/thud) don't stop loudnorm reaching the target
  PRE="alimiter=limit=0.3:attack=3:release=60:level=false"
  M=$(ffmpeg -hide_banner -i "$IN" -af "$PRE,loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  g() { echo "$M" | grep "\"$1\"" | sed -E 's/.*: "?([^",]*)"?,?/\1/'; }
  LN="loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
  AUDIO=(-af "$PRE,$LN" -c:a aac -b:a 192k -ar 48000)
else
  AUDIO=(-an)
fi
ffmpeg -v error -y -i "$IN" -vf "$VF" -c:v libx264 -profile:v high -preset slow -crf 18 "${AUDIO[@]}" -movflags +faststart "$OUT"
