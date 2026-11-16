---
name: stickman-animate
description: Reference + recipes for animating the stickman rig in Remotion — poses, keyframes, walk/run cycles, stairs, hanging, falling, lanes, props, text, camera moves — and for extending the rig with new poses/props/styles. Use when coding or fixing a short's animation in src/shorts/, or when a pose/prop looks wrong.
---

# Animate stickmen (Remotion)

Code lives in `src/lib/pose.ts`, `src/components/*.tsx`. The template short is
`src/shorts/the-climb/TheClimb.tsx` — copy its structure.

## The character
```tsx
<Stickman
  x={360} y={LAYOUT.groundY}      // feet position (px)
  height={300}                    // full standing height (hero 260–330, lanes 200–240, crowd 120–160)
  pose={pose}                     // Pose object or POSES name: "stand" | "slump" | "hang" | ...
  facing={1}                      // 1 = right, -1 = left
  color="teal"                    // COLORS key or any CSS colour
  style="neon"                    // neon | solid | silhouette | line
  expression="angry"              // neutral angry happy sad closed dead none
  glow={1} opacity={1}
  spin={0}                        // whole-body rotation around the hip (falls, tumbles)
  floorLight                      // coloured light pool under the feet
/>
```

## Pose angles (degrees, torso-relative — read this before inventing poses)
- `torso` 0 upright, + lean forward, −90 lying on back. `head` + nod down, − look up.
- `*Shoulder` 0 arm down, 90 forward, 180 up, − behind. `*Elbow` + curls forward/up.
- `*Hip` 0 leg down, 90 thigh forward (sitting). `*Knee` + shin folds back (natural).
- `dx, dy` hip offset in units of height (dy + = lower, sitting ≈ 0.23, floor ≈ 0.44).
- **Compensation:** if `torso: 40`, legs that should stay vertical need `*Hip ≈ 40`;
  arms hanging straight down need `*Shoulder ≈ 40`.
- `front*` = near-side limbs (bright), `back*` = far-side (dim).

## Animating
```ts
const frame = useCurrentFrame();
// keyframes (frames), each key eases in with its own easing
const p = poseAt(frame, [
  { f: B.start, pose: "stand" },
  { f: B.start + 15, pose: "reachUp", easing: ease.out },
  { f: B.fail, pose: POSES.slump },
]);
// layered motion
const idle = addPose(POSES.stand, breathe(frame));          // breathing
const scared = addPose(POSES.hang, tremble(frame, 1.5));     // struggling
const custom = pose({ ...POSES.think, head: 25 });            // variant
const mid = lerpPose(POSES.hang, POSES.pullUp, 0.5 + 0.5 * Math.sin(frame / 8)); // repeated reps
// locomotion (no foot sliding: x follows travel)
const w = walkCycle(frame, { startFrame: B.walk, speed: 0.9 });
const x = 120 + w.travel * H;                                  // H = character height
const r = runCycle(frame, { startFrame: B.run, speed: 1.6 });
```

### Recipes
- **Pull-up reps:** `lerpPose(POSES.hang, POSES.pullUp, (1 - Math.cos(phase)) / 2)` with
  `phase = (frame - start) / framesPerRep * 2π`; count reps with `Math.floor`. For `hang`, hands reach the bar when the feet
  `y ≈ barY + 1.07 * height`; `pullUp` already lifts the hip (dy −0.2). Tune once with a still.
- **Quit / give up:** hang → hangTired (tremble) → drop (`y` eases to ground, `thud`) →
  `walkCycle` off-screen with `facing={-1}`, opacity fades.
- **Stairs:** `stairTop(i, x, stepW, stepH)` + fractional step index with a small hop
  (`- Math.sin(frac*π)*10`) — see `onStairs()` in TheClimb.
- **Falling:** animate `y` with `ease.in`, `spin` 0→90, then `lieBack`, `shake()` the scene + `thud`.
- **Sinking/floating:** `swimUp` + `tremble`, y driven by a weight chain; break the chain → `y` eases up.
- **Lanes:** for 3 lanes use x = 135, 360, 585; `LaneLight` behind each in the character colour.
- **Elimination:** `opacity` 1→0.35, `glow` 1→0.3, StatRow `dim: true`, `glitch` SFX.
- **Payoff:** `Spotlight` + `Particles` (gold) + `glow={1.6}` + `victory` pose + `ding`.
- **Camera push:** wrap layers in `<AbsoluteFill style={{transform:`scale(${1+0.04*progress(frame,a,b)})`}}>`.
- **Shake:** `const s = shake(frame, B.hit, 12, 10)` → `translate(${s.x}px, ${s.y}px)`.
- **Split screen:** two `<AbsoluteFill style={{top:0,height:640,overflow:'hidden'}}>` panels, each with its own
  Backdrop/ground (pass a translated container and use `y` relative to the panel).

## Text
```tsx
<Headline text="{orange:EGO} BROKE TRYING." start={B.x} end={B.y} mode="pop|type|fade" size={44} />
<StatRow stats={[{label:"DISCIPLINE", color:"steel", value: reps, max: 10}, {label:"EGO", color:"orange", value: 7, dim:true}]} />
<BigCounter label="DAYS WAITING" value={countUp(frame, a, b, 0, 365)} />
<LabelBar label="ENVY" color="green" fill={1} />
```

## Extending
- **New pose:** add to `POSES` in `src/lib/pose.ts`, then `npm run still -- PoseSheet out/poses.png`
  and look at it. Iterate angles until it reads clearly as a silhouette.
- **New prop:** add to `src/components/Props.tsx` as a full-frame `<Layer>` SVG; deterministic
  animation only (`useCurrentFrame`, `rand`).
- **New style/expression:** extend `Stickman.tsx` (`StickStyle`, `Face`).
- Need 3D? → skill `threejs-scenes`.

## Debug checklist
- Limb pointing the wrong way → you forgot torso compensation, or sign of `facing`.
- Feet below ground → `dy` too large; floating → too small (check against `LAYOUT.groundY`).
- Jitter → something uses `Math.random()` or non-frame state.
- Always verify with stills at the exact problematic frame.
