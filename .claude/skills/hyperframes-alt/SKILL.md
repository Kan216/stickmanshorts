---
name: hyperframes-alt
description: Build a stickman short with HeyGen HyperFrames (HTML + CSS + GSAP compositions rendered to MP4) instead of Remotion — or port a Remotion storyboard to HyperFrames, or create a hosted HeyGen project via the HyperFrames MCP. Use only when the user explicitly asks for HyperFrames / "hyper frames" / HTML-GSAP video, or wants a hosted HeyGen project.
---

# HyperFrames alternative pipeline

Remotion is this repo's default engine. HyperFrames is an open-source alternative from HeyGen:
**write HTML, render MP4** (`npm: hyperframes`, needs Node ≥ 22 + FFmpeg).

## Option A — local HyperFrames project (editable files)
1. Install the official agent skills (they contain the authoring rules — read them, don't guess):
   ```bash
   npx skills add heygen-com/hyperframes
   ```
   They add `/hyperframes` (compose), `/hyperframes-cli` (init, lint, preview, render) and
   `/hyperframes-media` (TTS, transcribe, background removal).
2. Scaffold next to the Remotion code:
   ```bash
   npx hyperframes init hyperframes/<slug>
   cd hyperframes/<slug>
   npx hyperframes preview          # studio in the browser
   npx hyperframes lint .           # check the composition
   npx hyperframes render -o ../../out/<Name>_hf.mp4
   ```
3. Port the design:
   - Canvas 720×1280 (or 1080×1920), 30fps, same `docs/STYLE_GUIDE.md` rules.
   - Stickmen as inline SVG (`<g>` per bone). The pose maths in `src/lib/pose.ts` is plain TS
     (only `poseAt` imports Remotion's `interpolate`) — copy `solve()`/`POSES`/`lerpPose` into a
     `<script>` and update the SVG paths from the timeline's current time.
   - Beats from the storyboard → GSAP timeline labels; headlines/counters → DOM elements tweened by GSAP.
   - Audio: same `public/sfx` + `public/music` files; check timing/loudness with
     `npx hyperframes audio <file>` and `normalize-audio`.
4. Post-process with the `ffmpeg-post` skill as usual (`scripts/finalize.sh`).

## Option B — hosted HeyGen project (MCP)
If the HyperFrames MCP is connected (`mcp__HyperFrames_by_HeyGen__*`): from a CLI agent the
`compose`/`render_video` tools are disabled by design — use Option A locally. The read tools
(`list_projects`, `get_project`, `get_render_status`) work for checking hosted projects the user made
in a chat client.

## Choosing
| Need | Engine |
|---|---|
| Reusable rig, typed components, React, Three.js | Remotion (default) |
| Plain HTML/CSS/GSAP, designer-editable, HeyGen ecosystem, hosted share links | HyperFrames |
