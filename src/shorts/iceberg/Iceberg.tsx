/**
 * "They Only Saw The Top" (18s, 720x1280 @30fps) — metaphor (iceberg).
 * Crowds clap at a gold figure on a small iceberg tip. The camera pans down into the
 * water to reveal the huge iceberg underneath, labelled with the hidden work; YEARS → 10.
 * Then zoom out to the whole iceberg. Storyboard: storyboards/iceberg.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Iceberg as IcebergProp, Particles, Spotlight, Water } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, poseAt, pose, POSES } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS, VIDEO } from "../../lib/theme";

export const ICEBERG_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  lucky: sec(2.3),
  dive: sec(4.5), // pan down starts
  deep: sec(10.2), // pan down ends
  nobody: sec(10.6),
  zoom: sec(12.3), // zoom out to the whole iceberg
  zoomEnd: sec(13.6),
  punch: sec(14),
};

// ---- WORLD (px, camera-independent) ----------------------------------------
const WATER = 640;
const TIP_H = 110;
const DEPTH = 1150;
const CX = 360;
const H = 150;
const proud = pose({ head: -8, frontShoulder: 38, frontElbow: 20, backShoulder: -32, backElbow: 20, frontHip: 14, backHip: -14, frontKnee: 4, backKnee: 4 });
const CROWD = [
  { x: 30, f: 1 as const }, { x: 85, f: 1 as const }, { x: 140, f: 1 as const },
  { x: 580, f: -1 as const }, { x: 635, f: -1 as const }, { x: 690, f: -1 as const },
];
const LABELS = ["FAILURES", "5 AM", "REJECTIONS", "SACRIFICE", "LONELY NIGHTS"];

// ---- CAMERA: world y `camY` is drawn at screen y `anchor`, scaled by `s` ----
const camera = (f: number) => {
  const pan = progress(f, B.dive, B.deep, ease.inOut);
  const z = progress(f, B.zoom, B.zoomEnd, ease.inOut);
  const camPan = WATER + (WATER + DEPTH - 250 - WATER) * pan;
  const camY = camPan + (WATER + (DEPTH - TIP_H) / 2 - 40 - camPan) * z;
  const s = 1 - 0.5 * z;
  const anchor = 640 + 20 * z;
  return { camY, s, anchor };
};
// a label pops when it rises past screen y≈900 during the pan
const labelY = (i: number) => WATER + DEPTH * (0.17 + (0.68 * i) / (LABELS.length - 1));
const LABEL_AT = LABELS.map((_, i) => {
  for (let f = B.dive; f < B.deep + 10; f++) {
    const c = camera(f);
    if ((labelY(i) - c.camY) * c.s + c.anchor < 900) return f;
  }
  return B.deep;
});

const clap = (f: number, k: number) => {
  const c = Math.sin(f * 0.9 + k * 1.3);
  return pose({ head: -12, frontShoulder: 75 + 8 * c, frontElbow: 55 - 25 * c, backShoulder: 70 - 8 * c, backElbow: 60 - 25 * c });
};

export const Iceberg: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  const gold = progress(frame, B.zoom + 10, B.zoomEnd + 6, ease.out);
  const years = Math.round(interpolate(frame, [B.dive, B.deep], [0, 10], { ...clamp, easing: ease.inOut }));
  const clapping = frame < B.deep;
  const sh = shake(frame, B.zoomEnd, 12, 6);

  const heroPose = addPose(
    poseAt(frame, [
      { f: 0, pose: proud },
      { f: B.lucky, pose: proud },
      { f: B.lucky + 10, pose: pose({ head: -12, frontShoulder: 160, frontElbow: 25 }) },
      { f: B.dive, pose: pose({ head: -12, frontShoulder: 160, frontElbow: 25 }) },
      { f: B.dive + 15, pose: proud },
      { f: B.zoomEnd, pose: proud },
      { f: B.zoomEnd + 12, pose: "victory", easing: ease.out },
    ]),
    { ...breathe(frame), frontElbow: frame > B.lucky && frame < B.dive ? Math.sin(frame / 4) * 18 : 0 },
  );

  return (
    <AbsoluteFill>
      <Backdrop mood="ocean" floor={false} glowColor={gold > 0 ? "gold" : undefined} glowStrength={0.5 + 0.4 * gold} />
      <AbsoluteFill
        style={{
          transform: `translate(${sh.x}px, ${cam.anchor + sh.y}px) scale(${cam.s}) translate(0px, ${-cam.camY}px)`,
          transformOrigin: "360px 0px",
        }}
      >
        <Spotlight x={CX} y={WATER - TIP_H - 60} r={170} color="gold" strength={0.6 + 0.4 * gold} />
        <DeepSea />
        <AbsoluteFill style={{ transform: "scaleX(2.6)", transformOrigin: "360px 0px" }}>
          <Water surfaceY={WATER} bottomY={WATER + DEPTH + 800} color="#13304d" />
        </AbsoluteFill>
        <IcebergProp cx={CX} waterY={WATER} tipH={TIP_H} depth={DEPTH} width={640} glow={gold} labels={LABELS.map((text, i) => ({ text, at: LABEL_AT[i] }))} />
        <Shores />
        {CROWD.map((c, k) => (
          <Stickman key={k} x={c.x} y={WATER - 8} height={92} facing={c.f} style="line" color="steel" glow={0.5}
            pose={clapping ? clap(frame, k) : addPose(POSES.stand, breathe(frame + k * 9))} expression="happy" />
        ))}
        <Stickman x={CX} y={WATER - TIP_H} height={H} pose={heroPose} color="gold" expression="happy" glow={1.2 + 0.8 * gold} />
        {gold > 0 && <Particles color="gold" count={24} area={{ x: 120, y: WATER - 400, w: 480, h: 400 }} speed={1.2} size={3} />}
      </AbsoluteFill>

      {/* top band stays readable over the moving world */}
      <AbsoluteFill style={{ background: "linear-gradient(#000d 0%, #0008 20%, #0000 30%)" }} />

      {/* ---- TEXT ---- */}
      <Headline text="THEY ONLY SAW THE {gold:TOP.}" start={B.hook} end={B.lucky} size={44} />
      <Headline text={'"{gold:LUCKY.}" THEY SAID.'} start={B.lucky} end={B.dive} size={46} />
      <Headline text="LOOK {steel:DEEPER.}" start={B.dive} end={B.nobody} size={48} />
      <Headline text="{steel:10 YEARS} NOBODY SAW." start={B.nobody} end={B.punch} size={42} />
      <Headline text={"THEY SAW THE TOP.\n{gold:NOT THE ICEBERG.}"} start={B.punch} size={44} y={100} glow />
      <StatRow start={B.hook} end={B.punch} stats={[{ label: "YEARS", color: gold > 0.5 ? "gold" : "steel", value: years, glow: years === 10 }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (ICEBERG_DURATION / 4)))} />
      <Vignette strength={0.55} />

      {/* ---- SOUND ---- */}
      <Music file="pad-hope.wav" volume={0.3} fadeOut={60} />
      <Sfx at={B.hook} name="boom" volume={0.55} />
      {Array.from({ length: 18 }).map((_, i) => (
        <Sfx key={`c${i}`} at={8 + i * 7} name="tick" volume={0.18 + 0.06 * (i % 3)} durationInFrames={6} />
      ))}
      <Sfx at={B.lucky} name="pop" volume={0.4} />
      <Sfx at={B.dive} name="whoosh" volume={0.55} />
      {LABEL_AT.map((t, i) => (
        <React.Fragment key={`l${i}`}>
          <Sfx at={t} name="pop" volume={0.4} />
          <Sfx at={t + 2} name="thud" volume={0.35} durationInFrames={15} />
        </React.Fragment>
      ))}
      <Sfx at={B.nobody} name="heartbeat" volume={0.55} />
      <Sfx at={B.zoomEnd - sec(1.6)} name="riser" volume={0.4} />
      <Sfx at={B.zoomEnd} name="boom" volume={0.75} />
      <Sfx at={B.zoomEnd} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

/** Dark gradient deep water behind the Water prop (world coords). */
const DeepSea: React.FC = () => (
  <AbsoluteFill>
    <svg width={VIDEO.width} height={WATER + DEPTH + 300} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1a2b" />
          <stop offset="100%" stopColor="#02050a" />
        </linearGradient>
      </defs>
      <rect x={-400} y={WATER} width={VIDEO.width + 800} height={DEPTH + 900} fill="url(#deep)" />
    </svg>
  </AbsoluteFill>
);

/** Two small rocky shores at the waterline where the crowd stands. */
const Shores: React.FC = () => (
  <AbsoluteFill>
    <svg width={VIDEO.width} height={VIDEO.height} style={{ overflow: "visible" }}>
      <path d={`M-400 ${WATER - 8} L170 ${WATER - 8} L190 ${WATER + 40} L-400 ${WATER + 40} Z`} fill="#1b2028" stroke="#3a414c" strokeWidth={2} />
      <path d={`M${VIDEO.width + 400} ${WATER - 8} L550 ${WATER - 8} L530 ${WATER + 40} L${VIDEO.width + 400} ${WATER + 40} Z`} fill="#1b2028" stroke="#3a414c" strokeWidth={2} />
    </svg>
  </AbsoluteFill>
);
