/**
 * "Pressure Diamond" (18s, 720x1280 @30fps) — versus lanes. A heavy slab of
 * PRESSURE drops onto two people. The left one crouches, crawls out and runs
 * off. The right one holds it overhead; at 100 tons the slab cracks and his
 * body becomes a glowing faceted diamond.
 * Storyboard: storyboards/pressure-diamond.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Diamond, Particles, PressureSlab } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, POSES, poseAt, runCycle, tremble, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { COLORS, LAYOUT } from "../../lib/theme";

export const PRESSURE_DIAMOND_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  press: sec(9.0), // slab reaches the overhead hands
  crouch: sec(3.0),
  crawlStart: sec(6.0),
  crawlEnd: sec(8.0),
  runEnd: sec(10.0),
  stayed: sec(9.5),
  riser: sec(11.5),
  diamond: sec(14.0),
  end: sec(18),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const H = 300;
const LEFT_X = 170;
const RIGHT_X = 550;
const SLAB_TOP_0 = 262;
const SLAB_TOP_1 = 492;
const SLAB_TOP_CRUSH = 506;

const slabTop = (f: number) => {
  if (f < B.press) return interpolate(f, [0, B.press], [SLAB_TOP_0, SLAB_TOP_1], { ...clamp, easing: ease.in });
  const k = progress(f, B.diamond, B.diamond + sec(0.8));
  return SLAB_TOP_1 + (SLAB_TOP_CRUSH - SLAB_TOP_1) * k;
};

export const PressureDiamond: React.FC = () => {
  const frame = useCurrentFrame();

  // Counter: pressure in tons, 0 → 100 by the diamond moment.
  const tons = Math.min(100, Math.round(interpolate(frame, [0, B.diamond], [0, 100], clamp)));

  // ---- LEFT: crouch → crawl out → run off ----
  const crouchP = progress(frame, B.crouch, B.crouch + sec(1.0), ease.inOut);
  let lx = LEFT_X;
  let lPose = lerpPose(POSES.stand, POSES.crouch, crouchP);
  if (frame >= B.crawlStart && frame < B.crawlEnd) {
    lx = interpolate(frame, [B.crawlStart, B.crawlEnd], [LEFT_X, 60], { ...clamp, easing: ease.inOut });
    lPose = addPose(POSES.crouch, tremble(frame, 0.8));
  } else if (frame >= B.crawlEnd && frame < B.runEnd) {
    lx = interpolate(frame, [B.crawlEnd, B.runEnd], [60, -120], { ...clamp, easing: ease.in });
    lPose = runCycle(frame, { speed: 1.9, startFrame: B.crawlEnd }).pose;
  } else if (frame >= B.runEnd) {
    lx = -200;
  }
  const leftGone = frame >= B.runEnd;
  const leftDim = leftGone ? 0 : 1;

  // ---- RIGHT: holds the slab overhead, trembles, becomes a diamond ----
  const holdPose = addPose(POSES.carryOverhead, tremble(frame, frame < B.diamond ? 2.2 : 0.4));
  const rightBreath = addPose(holdPose, breathe(frame, 0.4));
  const morph = progress(frame, B.diamond, B.diamond + sec(0.8), ease.inOut);
  const diamondShown = frame >= B.diamond;

  // Slab
  const slabY = slabTop(frame);
  const cracked = progress(frame, B.diamond, B.diamond + sec(0.4));

  // Dust off the slab at impact
  const dust = frame >= B.press - sec(0.5) && frame < B.diamond;

  return (
    <AbsoluteFill>
      <Backdrop mood="ember" glowColor={diamondShown ? "#9fd8ff" : undefined} glowStrength={diamondShown ? 1.2 : 0.7} />

      {/* Lane divider and ground */}
      <line x1={360} y1={520} x2={360} y2={G} stroke="#2a2e36" strokeWidth={2} strokeDasharray="6 8" />
      <line x1={24} y1={G + 2} x2={696} y2={G + 2} stroke="#3a414c" strokeWidth={2} />

      {/* Left lane: teal */}
      <Stickman x={lx} y={G} height={H} pose={lPose} color="teal" expression={leftGone ? "neutral" : frame >= B.crouch ? "angry" : "neutral"} glow={1} opacity={leftDim} />

      {/* Right lane: blue (stickman → diamond) */}
      {!diamondShown || morph < 1 ? (
        <Stickman
          x={RIGHT_X}
          y={G}
          height={H}
          pose={rightBreath}
          color="blue"
          expression={diamondShown ? "happy" : "angry"}
          glow={diamondShown ? 1.8 : 1}
          opacity={diamondShown ? 1 - morph : 1}
        />
      ) : null}
      {diamondShown && (
        <Diamond x={RIGHT_X} y={G - H * 0.6} w={120 + 20 * morph} h={190 + 20 * morph} color="#dff3ff" opacity={morph} glow={1.6} />
      )}
      {diamondShown && frame < B.diamond + sec(1.8) && (
        <Particles color="#cfeaff" count={44} area={{ x: RIGHT_X - 140, y: G - 360, w: 280, h: 360 }} speed={1.6} size={3} />
      )}

      {/* Pressure slab (on top of both) */}
      {!(frame >= B.diamond + sec(0.4)) && <PressureSlab y={slabY} label="PRESSURE" cracked={cracked} />}
      {dust && <Particles color="steel" count={20} area={{ x: 60, y: slabY + 60, w: 600, h: 40 }} speed={0.6} size={2.5} />}

      {/* ---- COUNTER ---- */}
      <StatRow start={0} end={B.end} y={214} stats={[{ label: "PRESSURE", color: "blue", value: `${tons} ${tons === 100 ? "TONS" : "T"}`, glow: frame >= B.diamond }]} />

      {/* ---- TEXT ---- */}
      <Headline text="UNDER PRESSURE." start={0} end={B.crawlStart} />
      <Headline text="{teal:ONE} RAN." start={B.crawlStart} end={B.stayed} />
      <Headline text="{blue:ONE} STAYED." start={B.stayed} end={B.diamond} />
      <Headline text={"PRESSURE MAKES\n{blue:DIAMONDS.}"} start={B.diamond} y={96} size={46} glow />
      <Watermark step={Math.min(3, Math.floor(frame / (PRESSURE_DIAMOND_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={0} name="boom" volume={0.35} />
      <Sfx at={B.press} name="thud" volume={0.7} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`hb${i}`} at={sec(6.0) + i * sec(0.8)} name="heartbeat" volume={0.4} />
      ))}
      <Sfx at={B.crawlStart} name="step" volume={0.3} durationInFrames={8} />
      <Sfx at={B.crawlEnd} name="step" volume={0.3} durationInFrames={8} />
      <Sfx at={B.riser} name="riser" volume={0.45} />
      <Sfx at={B.diamond} name="boom" volume={0.8} />
      <Sfx at={B.diamond} name="ding" volume={0.75} />
      <Sfx at={B.diamond + sec(0.4)} name="glitch" volume={0.4} />
    </AbsoluteFill>
  );
};
