/**
 * "Run Your Own Race" (17s, 720x1280 @30fps) — versus lanes, side view.
 * Runner A (teal) keeps looking into B's lane, slows, trips. Runner B (gold) keeps eyes
 * forward and breaks the finish tape. Camera follows B; ground marks scroll for speed.
 * Storyboard: storyboards/own-lane.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { FinishTape, GroundMarks, Particles, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, pose, Pose, poseAt, POSES, runCycle, solve } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS, VIDEO } from "../../lib/theme";

export const OWN_LANE_DURATION = sec(17);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  side: sec(2),
  ahead: sec(5.5),
  trip: sec(8.6),
  land: sec(8.6) + 16,
  finish: sec(12), // B breaks the tape
  punch: sec(13.2),
};
const LOOKS = [
  [sec(2.2), sec(3.4)],
  [sec(4.4), sec(5.9)],
  [sec(7.0), sec(8.6)],
];

// ---- LAYOUT ---------------------------------------------------------------
const GA = 560; // upper track (A)
const GB = 905; // lower track (B)
const H = 185;
const V = 8; // px / frame at full speed
const BX = 330; // B screen x while the camera follows

// ---- KINEMATICS (world px) -------------------------------------------------
const lookAt = (f: number) => Math.max(...LOOKS.map(([a, b]) => progress(f, a, a + 6, ease.out) * (1 - progress(f, b - 6, b, ease.in))));
const factorA = (f: number) => 1 - LOOKS.reduce((acc, [a, b], i) => acc + [0.06, 0.08, 0.1][i] * progress(f, a, b), 0);
const vB = (f: number) => (f < B.finish ? V : V * (1 - progress(f, B.finish, B.finish + 45, ease.linear)));
const vA = (f: number) => (f < B.trip ? V * factorA(f) : f < B.land ? V * 0.6 * (1 - (f - B.trip) / 16) : 0);
const integ = (v: (t: number) => number, f: number) => {
  let d = 0;
  for (let t = 0; t < f; t++) d += v(t);
  return d;
};
const camAt = (f: number) => integ((t) => (t < B.finish ? V : 0), f);
const FINISH_X = BX + V * B.finish + 22; // world x of the tape (B's chest reaches it at B.finish)

const runPose = (dist: number, k = 1): Pose => runCycle(dist / V, { speed: 1.25 * k }).pose;

export const OwnLane: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const dA = integ(vA, frame);
  const dB = integ(vB, frame);
  const ax = 470 + dA - cam;
  const bx = BX + dB - cam;
  const look = lookAt(frame);
  const won = frame >= B.finish;
  const gold = progress(frame, B.finish, B.finish + 15, ease.out);

  // ---- A ----
  let aPose: Pose;
  let aSpin = 0;
  let aY = GA;
  if (frame < B.trip) {
    aPose = addPose(runPose(dA), { head: 42 * look, torso: -6 * look, frontShoulder: 0 });
  } else if (frame < B.land) {
    const t = (frame - B.trip) / 16;
    aPose = lerpPose(runPose(dA), pose({ ...POSES.crouch, dy: 0 }), Math.min(1, t * 2));
    aSpin = 270 * ease.inOut(t);
    aY = GA - Math.sin(t * Math.PI) * 45;
  } else {
    aPose = addPose(POSES.lieBack, breathe(frame, 0.4));
  }
  const aSk = solve(aPose, ax, aY, H, 1);

  // ---- B ----
  const bPose = !won
    ? runPose(dB)
    : addPose(lerpPose(runPose(dB), POSES.victory, progress(frame, B.finish + 10, B.finish + 28, ease.out)), breathe(frame));
  const bSk = solve(bPose, bx, GB, H, 1);

  const speedA = frame >= B.trip ? 0 : Math.round(24 * factorA(frame));
  const sh = [shake(frame, B.land, 12, 9), shake(frame, B.finish, 10, 6)].reduce((a, s) => ({ x: a.x + s.x, y: a.y + s.y }));

  // footsteps for B (every half run cycle while running)
  const stepFrames = Array.from({ length: 40 }).map((_, i) => Math.round((i + 0.5) * (30 / 1.25 / 2))).filter((f) => f < B.finish);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" floor={false} glowColor={won ? "gold" : undefined} glowStrength={0.5 + 0.4 * gold} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* tracks */}
        <GroundMarks y={GA} offset={cam} color="teal" opacity={0.8} />
        <GroundMarks y={GB} offset={cam} color="gold" />
        <LaneTag y={GA + 22} text="LANE 1" color={COLORS.teal} />
        <LaneTag y={GB + 22} text="LANE 2" color={COLORS.gold} />

        {/* gaze line from A's eyes into B's lane */}
        {look > 0.02 && frame < B.trip && (
          <AbsoluteFill>
            <svg width={VIDEO.width} height={VIDEO.height}>
              <line x1={aSk.head.x + 10} y1={aSk.head.y + 6} x2={bSk.head.x} y2={bSk.head.y - 4} stroke={COLORS.teal} strokeWidth={3} strokeDasharray="6 9" opacity={0.75 * look} />
            </svg>
          </AbsoluteFill>
        )}

        {won && <Spotlight x={bx} y={GB - 140} r={260} color="gold" strength={gold} />}
        <FinishTape x={FINISH_X - cam} groundY={GB} h={H} broken={progress(frame, B.finish, B.finish + 14, ease.out)} />
        <Stickman x={ax} y={aY} height={H} pose={aPose} spin={aSpin} color="teal" expression={frame >= B.land ? "dead" : look > 0.3 ? "sad" : "neutral"} glow={frame >= B.land ? 0.5 : 1} opacity={frame >= B.land ? 0.7 : 1} />
        <Stickman x={bx} y={GB} height={H} pose={bPose} color="gold" expression={won ? "happy" : "neutral"} glow={1.1 + 0.8 * gold} />
        {won && <Particles color="gold" count={24} area={{ x: bx - 200, y: GB - 380, w: 400, h: 380 }} speed={1.3} size={3} />}
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text="RUN YOUR OWN {gold:RACE.}" start={B.hook} end={B.side} size={46} />
      <Headline text="ONE LOOKS {teal:SIDEWAYS.}" start={B.side} end={B.ahead} size={44} />
      <Headline text="ONE LOOKS {gold:AHEAD.}" start={B.ahead} end={B.trip} size={44} />
      <Headline text="{teal:DISTRACTED.}" start={B.trip} end={B.finish} size={50} />
      <Headline text="EYES ON {gold:YOUR LANE.}" start={B.punch} size={48} glow />
      <StatRow
        start={B.hook}
        end={B.punch}
        stats={[
          { label: "SPEED", color: "teal", value: speedA, dim: frame >= B.trip },
          { label: "SPEED", color: "gold", value: won ? "WIN" : 24, glow: won },
        ]}
      />
      <Watermark step={Math.min(3, Math.floor(frame / (OWN_LANE_DURATION / 4)))} />
      <Vignette strength={0.55} />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={60} />
      <Sfx at={B.hook} name="boom" volume={0.55} />
      {stepFrames.map((f, i) => (
        <Sfx key={`s${i}`} at={f} name="step" volume={0.22} durationInFrames={8} />
      ))}
      {LOOKS.map(([a], i) => (
        <Sfx key={`l${i}`} at={a} name="glitch" volume={0.3} />
      ))}
      <Sfx at={B.trip} name="whoosh" volume={0.5} />
      <Sfx at={B.land} name="thud" volume={0.95} />
      <Sfx at={B.finish - sec(2)} name="riser" volume={0.4} />
      <Sfx at={B.finish} name="boom" volume={0.75} />
      <Sfx at={B.finish} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

const LaneTag: React.FC<{ y: number; text: string; color: string }> = ({ y, text, color }) => (
  <AbsoluteFill style={{ top: y, left: 40, height: "auto", width: "auto", fontFamily: "Segoe UI, Arial", fontWeight: 800, fontSize: 16, letterSpacing: 3, color, opacity: 0.8 }}>
    {text}
  </AbsoluteFill>
);
