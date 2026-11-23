/**
 * "The Bridge" (20s, 720x1280 @30fps) — versus, three characters. The
 * COMPLAINER points, the DREAMER dreams of a bridge, the DOER carries stones
 * one at a time until a bridge stands, and only the DOER crosses.
 * Storyboard: storyboards/the-bridge.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { River, SteppingStones, ThoughtCloud } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, poseAt, POSES, tremble, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { COLORS, LAYOUT } from "../../lib/theme";

export const THE_BRIDGE_DURATION = sec(20);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  complained: sec(2.5),
  dreamed: sec(5.0),
  build: sec(7.6),
  cross: sec(16.0),
  punch: sec(18.0),
};
const CYCLE = 21; // frames per stone (0.7s)
const DROP_AT = 17; // frame within cycle when the stone lands

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const H = 250;
const RIVER_X0 = 205;
const RIVER_X1 = 515;
const COMPLAINER_X = 40;
const DREAMER_X = 100;
const DOER_X = 160;
const FAR_X = 590;
const PILE_X = 182;
const SLOT_X = (i: number) => 228 + i * 25.5;

// Stone i lands at this frame.
const stones = Array.from({ length: 12 }).map((_, i) => ({ x: SLOT_X(i), at: B.build + i * CYCLE + DROP_AT }));
const crossEnd = B.cross + sec(2);

/** One stone's pick → rise → drop → recover cycle. c = frame - cycle start. */
const cyclePose = (c: number) =>
  poseAt(c, [
    { f: 0, pose: "stand" },
    { f: 6, pose: "crouch" },
    { f: 12, pose: "standTall" },
    { f: 17, pose: "bow", easing: ease.out },
    { f: CYCLE, pose: "stand", easing: ease.inOut },
  ]);

export const TheBridge: React.FC = () => {
  const frame = useCurrentFrame();

  const built = stones.filter((s) => frame >= s.at).length;
  const crossing = frame >= B.cross;
  const dimmed = crossing ? 1 : 0;

  // ---- COMPLAINER (left) ----
  const cPose = frame < B.dreamed
    ? addPose(POSES.point, tremble(frame, frame >= B.complained ? 2.2 : 0.6))
    : addPose(POSES.point, breathe(frame));

  // ---- DREAMER (left, sitting) ----
  const dPose = addPose(POSES.sitChair, breathe(frame, 0.5));
  const cloudOp = interpolate(frame, [B.dreamed, B.dreamed + 10], [0, 1], clamp);

  // ---- DOER (carries stones, then crosses) ----
  let doerX = DOER_X;
  let doerPose = addPose(POSES.stand, breathe(frame));
  if (frame >= B.build && frame < B.cross) {
    const c = (frame - B.build) % CYCLE;
    doerPose = cyclePose(c);
  } else if (crossing && frame < crossEnd) {
    const u = ease.inOut(progress(frame, B.cross, crossEnd));
    doerX = DOER_X + (FAR_X - DOER_X) * u;
    doerPose = walkCycle(frame, { startFrame: B.cross, speed: 1.1 }).pose;
  } else if (crossing) {
    doerX = FAR_X;
    doerPose = addPose(POSES.victory, breathe(frame));
  }
  // stone pile on the bank
  const pileVisible = frame < B.cross;

  // ---- CAMERA: the far bank glows once the bridge stands ----
  const glowOn = built >= 12;

  return (
    <AbsoluteFill>
      <Backdrop mood="ocean" glowColor={glowOn ? "gold" : undefined} glowStrength={glowOn ? 1 : 0.8} />

      <River x0={RIVER_X0} x1={RIVER_X1} groundY={G} depth={80} farBank="gold" />
      <SteppingStones stones={stones} groundY={G} color={glowOn ? "gold" : "steel"} />

      {/* Stone pile on the left bank, shrinks as stones are used */}
      {pileVisible && (
        <g>
          {Array.from({ length: Math.max(0, 6 - Math.floor(built / 2)) }).map((_, i) => (
            <rect key={i} x={PILE_X - 8 + (i % 2)} y={G - 10 - i * 9} width={18} height={8} rx={3} fill={COLORS.steel} opacity={0.8} />
          ))}
        </g>
      )}

      {/* Dreamer's thought cloud: a bridge */}
      <ThoughtCloud x={DREAMER_X} y={470} w={190} h={120} opacity={cloudOp}>
        <path d={`M${DREAMER_X - 62} 500 Q${DREAMER_X} 430 ${DREAMER_X + 62} 500`} fill="none" stroke={COLORS.purple} strokeWidth={5} opacity={cloudOp} />
        <line x1={DREAMER_X - 74} y1={500} x2={DREAMER_X + 74} y2={500} stroke={COLORS.purple} strokeWidth={5} opacity={cloudOp} />
      </ThoughtCloud>

      <Stickman x={COMPLAINER_X} y={G} height={H} pose={cPose} color="red" expression="angry" glow={crossing ? 0.3 : 1} opacity={crossing ? 0.35 : 1} />
      <Stickman x={DREAMER_X} y={G} height={H} pose={dPose} color="purple" expression="closed" glow={crossing ? 0.3 : 1} opacity={crossing ? 0.35 : 1} />
      <Stickman x={doerX} y={G} height={H} pose={doerPose} color="gold" expression={crossing ? "happy" : "neutral"} glow={crossing ? 1.5 : 1.1} />

      {/* ---- TEXT ---- */}
      <Headline text="WHO CROSSES THE RIVER?" start={B.hook} end={B.complained} />
      <Headline text="{red:COMPLAINED.}" start={B.complained} end={B.dreamed} />
      <Headline text="{purple:DREAMED.}" start={B.dreamed} end={B.build} />
      <Headline text="{gold:BUILT.}" start={B.build} end={B.punch} />
      <Headline text={"WHICH ONE ARE {gold:YOU?}"} start={B.punch} size={46} glow />
      <Headline text="A, B OR C?" start={B.punch + sec(0.6)} y={206} size={26} color={COLORS.steel} />
      <StatRow
        start={B.hook}
        end={sec(20)}
        y={282}
        stats={[{ label: "STONES", color: "gold", value: `${built}`, glow: built >= 12 }]}
      />
      <Watermark step={Math.min(3, Math.floor(frame / (THE_BRIDGE_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={B.hook} name="boom" volume={0.5} />
      <Sfx at={B.complained} name="glitch" volume={0.4} />
      <Sfx at={B.dreamed} name="ding" volume={0.35} />
      {stones.map((s, i) => (
        <React.Fragment key={`st${i}`}>
          <Sfx at={s.at - 17} name="step" volume={0.3} durationInFrames={8} />
          <Sfx at={s.at} name="thud" volume={0.55} />
          <Sfx at={s.at} name="tick" volume={0.2} durationInFrames={8} />
        </React.Fragment>
      ))}
      <Sfx at={B.cross} name="riser" volume={0.4} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sfx key={`cr${i}`} at={B.cross + Math.round(((crossEnd - B.cross) / 6) * i)} name="step" volume={0.35} durationInFrames={10} />
      ))}
      <Sfx at={B.punch} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};
