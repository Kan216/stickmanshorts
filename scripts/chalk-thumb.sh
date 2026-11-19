#!/usr/bin/env bash
# ChalkTalk stop-scroll thumbnails for an episode (both formats), 1.5x → JPEG.
#   bash scripts/chalk-thumb.sh Top10AirForces
#   bash scripts/chalk-thumb.sh LongestEmpires Long      # one format only (long-only episodes)
#   → out/Top10AirForces-thumb-long.jpg  (1920x1080, YouTube video thumbnail)
#   → out/Top10AirForces-thumb-short.jpg (1080x1920, Shorts cover)
set -euo pipefail
cd "$(dirname "$0")/.."
ID="${1:?usage: bash scripts/chalk-thumb.sh <EpisodeId>}"
mkdir -p out
BROWSER_FLAG=()
if [ -z "${REMOTION_BROWSER:-}" ] && [ -x /opt/pw-browsers/chromium ]; then REMOTION_BROWSER=/opt/pw-browsers/chromium; fi
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER")
FORMATS=("${@:2}"); [ ${#FORMATS[@]} -eq 0 ] && FORMATS=(Long Short)
for F in "${FORMATS[@]}"; do
  LOW=$(echo "$F" | tr 'A-Z' 'a-z')
  npx remotion still src/index.ts "${ID}Thumb${F}" "out/${ID}-thumb-${LOW}.jpg" \
    --scale=1.5 --image-format=jpeg --jpeg-quality=90 "${BROWSER_FLAG[@]}" --log=error
  echo "out/${ID}-thumb-${LOW}.jpg ($(du -h "out/${ID}-thumb-${LOW}.jpg" | cut -f1))"
done
