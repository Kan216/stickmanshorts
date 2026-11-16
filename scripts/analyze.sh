#!/usr/bin/env bash
# Analyse a video (a reference short OR your own render) so Claude can "watch" it:
#   - contact sheet of N evenly spaced frames      -> <outdir>/sheet.png
#   - individual full-res frames                   -> <outdir>/frames/fNN_<t>s.png
#   - audio waveform                               -> <outdir>/wave.png
#   - scene-cut timestamps                         -> <outdir>/cuts.txt
#   - specs + loudness (LUFS)                      -> <outdir>/info.txt
# Usage: bash scripts/analyze.sh <video.mp4> [outdir] [frames=12]
set -euo pipefail
IN="${1:?usage: analyze.sh <video> [outdir] [n]}"
OUT="${2:-references/analysis/$(basename "${IN%.*}")}"
N="${3:-12}"
mkdir -p "$OUT/frames"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
{
  echo "file: $IN"
  ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 "$IN"
  echo "--- loudness"
  ffmpeg -nostats -i "$IN" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" || echo "(no audio)"
} > "$OUT/info.txt"
COLS=$(( N < 6 ? N : 6 )); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -i "$IN" -vf "fps=$N/$DUR,scale=240:-1,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile=${COLS}x${ROWS}:padding=4" -frames:v 1 "$OUT/sheet.png" 2>/dev/null \
  || ffmpeg -v error -y -i "$IN" -vf "fps=$N/$DUR,scale=240:-1,tile=${COLS}x${ROWS}:padding=4" -frames:v 1 "$OUT/sheet.png"
for i in $(seq 0 $((N-1))); do
  T=$(awk -v d="$DUR" -v i="$i" -v n="$N" 'BEGIN{printf "%.2f", (i+0.5)*d/n}')
  ffmpeg -v error -y -ss "$T" -i "$IN" -frames:v 1 "$OUT/frames/f$(printf %02d "$i")_${T}s.png"
done
ffmpeg -v error -y -i "$IN" -filter_complex "showwavespic=s=1400x200:colors=#f2c14e" -frames:v 1 "$OUT/wave.png" 2>/dev/null || true
ffmpeg -v error -i "$IN" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > "$OUT/cuts.txt" || true
echo "→ $OUT/sheet.png  $OUT/wave.png  $OUT/info.txt  ($(wc -l < "$OUT/cuts.txt") cuts)"
cat "$OUT/info.txt"
