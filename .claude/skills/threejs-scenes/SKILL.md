---
name: threejs-scenes
description: Add Three.js 3D elements (glowing orbs, particle fields, 3D objects, depth backgrounds, camera fly-throughs) to stickman shorts via @remotion/three, layered with the 2D SVG stickmen. Use when a scene needs real 3D, volumetric light, or many particles.
---

# Three.js in stickman shorts (@remotion/three)

Example: `src/three/OrbOfLight3D.tsx` (composition `OrbOfLight3D`).

## When 3D is worth it
- A hero **object** that must rotate/shine: orb of hope, planet, crystal, door, trophy.
- **Hundreds of particles** with depth (stars, embers, snow, dust in a light beam).
- A slow **camera move through space** behind 2D figures (parallax depth).
Otherwise stay 2D — SVG is faster to render and easier to tweak.

## Layering pattern
```tsx
<AbsoluteFill>
  <Backdrop mood="dusk" />                         {/* 2D background */}
  <AbsoluteFill>
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 50 }}>
      {/* transparent canvas: only meshes are drawn */}
    </ThreeCanvas>
  </AbsoluteFill>
  <Stickman ... />                                 {/* 2D characters on top */}
  <Headline ... />
</AbsoluteFill>
```
World ↔ screen: with `fov 50`, `z=10` camera, the visible height at z=0 is ≈ 9.3 units for 1280px
→ 1 unit ≈ 137px; y=0 is the frame centre (px 640). Ground line (905px) ≈ y −1.93.

## Rules (deterministic rendering)
- Drive transforms from `useCurrentFrame()` — **never** `useFrame()`, clocks or `Date.now()`.
- No `Math.random()` — build geometry with `rand(seed)` inside `useMemo`.
- `<ThreeCanvas>` needs explicit `width`/`height` (from `useVideoConfig()`).
- Glow = `emissive` + `emissiveIntensity` and a big low-opacity `meshBasicMaterial` sphere
  behind it (cheap fake bloom). Postprocessing bloom works but slows renders a lot.
- Headless rendering uses `Config.setChromiumOpenGlRenderer("swangle")` (in `remotion.config.ts`).
  If you get "Error creating WebGL context", pass `--gl=swangle`. On a GPU desktop, `angle` is faster.
- Keep poly counts low (icosahedron detail ≤ 3, ≤ 2k points) — software GL is CPU-bound.
- Loading models: put `.glb` in `public/models/`, load with `useGLTF`/`GLTFLoader` from
  `staticFile()`, and wrap in `<Suspense>`; Remotion waits for it via `delayRender` inside loaders.

## Recipes
- **Orb grows in:** `scale = interpolate(frame,[a,b],[0.2,1])`, `pointLight intensity ∝ scale`.
- **Starfield drift:** `points` with `rotation.y = frame*0.004`.
- **Camera dolly:** `<PerspectiveCamera makeDefault position={[0,0,10 - frame*0.02]} />` (from drei,
  install `@react-three/drei` first) or set `camera` prop and move a parent `group` instead.
- **3D stickman?** Prefer 2D. If needed: capsules (`capsuleGeometry`) per bone, positions from
  `solve()` in `src/lib/pose.ts` mapped to world units — reuses the same pose library.

## Verify
`npm run still -- OrbOfLight3D out/orb.png 100` and read the PNG.
