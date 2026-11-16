# Stickman Shorts Studio

Code-driven **vertical motivational stickman shorts** (glowing figures, one visual metaphor, bold
headlines, live counters, music + SFX), built with **Remotion** (React → MP4), **Three.js**
(`@remotion/three`) and **ffmpeg**. The workflow is packaged as **Claude Code skills**, so you can ask:

> /stickman-short a short about consistency beating talent, versus format, 20 seconds

and Claude writes the storyboard, codes the scene, renders stills to check them, adds sound,
renders the MP4 and QA-checks it.

## Setup
```bash
npm install
npm run sfx          # generate original starter SFX + ambient music pads (ffmpeg)
npm run studio       # preview in the browser
npm run render -- TheClimb   # → out/TheClimb.mp4
```
Requires Node 18+ (22 recommended) and ffmpeg.

## Skills (`.claude/skills/`)
| Skill | What it does |
|---|---|
| `/stickman-short` | Full pipeline: idea → storyboard → code → visual QA → sound → render → analyze |
| `/stickman-storyboard` | Concept, metaphor, hook and second-by-second beat sheet |
| `/stickman-animate` | Rig/pose/props reference and animation recipes |
| `/stickman-sound` | Music bed, SFX timing, loudness |
| `/reference-analyze` | "Make one like this": contact sheets, waveform and LUFS of a reference video |
| `/ffmpeg-post` | Final encode, 1080p, thumbnails, GIFs, compilations, captions |
| `/threejs-scenes` | 3D orbs, particles and objects behind 2D stickmen |
| `/hyperframes-alt` | HeyGen HyperFrames (HTML + GSAP) as an alternative engine |

See `CLAUDE.md` (project rules), `docs/STYLE_GUIDE.md` (visual language) and
`docs/STORYBOARD_TEMPLATE.md`.

## What's in the box
- **Stickman rig**: forward kinematics, 22 named poses, keyframes, walk/run cycles, breathing and
  trembling, plus 4 render styles (neon, solid, silhouette, line) and 7 eye expressions.
- **Scene kit**: backdrops with moods, watermark, vignette, headline with `{color:WORD}` markup
  (pop, typewriter or fade), stat counters, big counter, pixel label bar.
- **Props**: pull-up bar, lane lights, stairs, water, chain + weight, thought cloud, archery
  target, particles, spotlight.
- **Audio**: `<Sfx>` and `<Music>` components and a synthesized royalty-free SFX pack.
- **ffmpeg scripts**: `finalize.sh` (-14 LUFS, H.264, faststart, optional 1080p),
  `analyze.sh` (contact sheet, waveform, cuts, loudness).
- **Examples**: `TheClimb` (15s versus short), `OrbOfLight3D` (Three.js), `PoseSheet` (pose debug still).

## Branding
Set `CHANNEL_NAME` in `src/lib/theme.ts`. Make original concepts. Use only music you have rights to.
