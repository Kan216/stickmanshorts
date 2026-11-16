#!/usr/bin/env bash
# Render a composition to out/<Id>.mp4, then post-process for Shorts/Reels/TikTok.
#   npm run render -- TheClimb            # full render + loudness-normalised final
#   npm run render -- TheClimb --frames=0-89   # quick partial render (any remotion flags pass through)
set -euo pipefail
cd "$(dirname "$0")/.."
ID="${1:?usage: npm run render -- <CompositionId> [remotion flags]}"; shift || true
[ -f public/sfx/pop.wav ] || bash scripts/gen-sfx.sh >/dev/null
mkdir -p out
BROWSER_FLAG=()
if [ -z "${REMOTION_BROWSER:-}" ] && [ -x /opt/pw-browsers/chromium ]; then REMOTION_BROWSER=/opt/pw-browsers/chromium; fi
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER")
npx remotion render src/index.ts "$ID" "out/$ID.raw.mp4" "${BROWSER_FLAG[@]}" "$@"
bash scripts/finalize.sh "out/$ID.raw.mp4" "out/$ID.mp4"
echo "✅ out/$ID.mp4"
