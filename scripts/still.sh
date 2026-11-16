#!/usr/bin/env bash
# Render one frame to PNG — the fastest way for Claude to SEE a scene.
#   npm run still -- TheClimb out/f120.png 120
#   npm run still -- PoseSheet out/poses.png
set -euo pipefail
cd "$(dirname "$0")/.."
ID="${1:?usage: npm run still -- <CompositionId> [out.png] [frame]}"
OUT="${2:-out/$ID.png}"; FRAME="${3:-0}"
mkdir -p "$(dirname "$OUT")"
BROWSER_FLAG=()
if [ -z "${REMOTION_BROWSER:-}" ] && [ -x /opt/pw-browsers/chromium ]; then REMOTION_BROWSER=/opt/pw-browsers/chromium; fi
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER")
npx remotion still src/index.ts "$ID" "$OUT" --frame="$FRAME" "${BROWSER_FLAG[@]}" --log=error
echo "$OUT"
