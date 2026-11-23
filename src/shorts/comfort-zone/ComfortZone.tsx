/**
 * "Comfort Zone" (17s, 720x1280 @30fps) — metaphor. A figure shrinks inside
 * a teal circle year by year; a gold figure steps out and every step grows a
 * bigger gold circle under him. Storyboard: storyboards/comfort-zone.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { GroundRing } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, POSES, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { LAYOUT } from "../../lib/theme";

export const COMFORT_ZONE_DURATION = sec(17);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  shrinkStart: sec(0.5),
  shrinkEnd: sec(9),
  smaller: sec(9),
  out: sec(10.5), // gold steps out of the circle
  walkStop: sec(13.2),
  line3: sec(13),
  ding: sec(14.5),
  end: sec(17),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const H = 300;
const CX = 250; // circle centre = steel's feet
const R0 = 200;
const R1 = 70;
const GOLD_R = 120;

// Gold trail: a new ring at each step position (deterministic from the walk cycle).
const stepFrames = [0, 1, 2, 3, 4].map((i) => B.out + sec(0.5) * (i + 1));
const goldX = (frame: number) => CX + 330 * ease.out(progress(frame, B.out, B.walkStop));
const trail = stepFrames.map((f) => ({ f, x: goldX(f) }));

export const ComfortZone: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- STEEL (inside the circle) ----
  const t = progress(frame, B.shrinkStart, B.shrinkEnd, ease.inOut);
  const r = interpolate(frame, [B.shrinkStart, B.shrinkEnd], [R0, R1], clamp);
  const years = Math.floor(interpolate(frame, [B.shrinkStart, B.shrinkEnd], [1, 10], clamp));
  const steelPose = addPose(lerpPose(POSES.stand, POSES.crouch, t), breathe(frame, 0.6));
  const steelAngry = frame >= B.smaller;

  // ---- GOLD (steps out) ----
  const outStarted = frame >= B.out;
  const goldWalking = frame < B.walkStop;
  const walk = walkCycle(frame, { startFrame: B.out, speed: 1.1 });
  const gx = goldX(frame);
  const goldPose = !outStarted
    ? POSES.stand
    : goldWalking
      ? walk.pose
      : addPose(POSES.stand, breathe(frame));
  const goldOpacity = interpolate(frame, [B.out - 8, B.out + 4], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Backdrop mood="dusk" glowColor={outStarted ? "gold" : "teal"} glowStrength={outStarted ? 0.9 : 0.7} />

      {/* Steel's shrinking comfort circle */}
      <GroundRing x={CX} r={r} color="teal" strength={frame >= B.smaller ? 1.4 : 1} pulse={frame >= B.smaller} opacity={outStarted ? 0.6 : 1} />

      {/* Gold trail: each step grows a bigger ring */}
      {trail.map((s, i) => {
        const grow = progress(frame, s.f, s.f + 15, ease.out);
        if (grow <= 0) return null;
        return <GroundRing key={i} x={s.x} r={40 + i * 18 + 10 * grow} color="gold" strength={0.9} opacity={grow} />;
      })}

      <Stickman x={CX} y={G} height={H} pose={steelPose} color="steel" expression={steelAngry ? "angry" : "neutral"} glow={0.9} />

      {outStarted && (
        <Stickman x={gx} y={G} height={H} pose={goldPose} color="gold" expression={goldWalking ? "neutral" : "happy"} opacity={goldOpacity} glow={1.2} />
      )}

      {/* ---- TEXT ---- */}
      <Headline text="IT FELT SAFE." start={B.hook} end={B.smaller} />
      <Headline text="IT GOT {red:SMALLER.}" start={B.smaller} end={B.line3} />
      <Headline text={"YOUR COMFORT ZONE\n{red:IS SHRINKING.}"} start={B.line3} size={44} glow />
      <StatRow
        start={B.hook}
        end={B.end}
        stats={[{ label: "YEARS", color: "steel", value: `${years}`, glow: frame >= B.smaller }]}
        y={282}
      />
      <Watermark step={Math.min(3, Math.floor(frame / (COMFORT_ZONE_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`hb${i}`} at={B.shrinkStart + sec(2.1) * i} name="heartbeat" volume={0.45} />
      ))}
      <Sfx at={B.smaller} name="glitch" volume={0.5} />
      <Sfx at={B.out - 9} name="whoosh" volume={0.55} />
      {stepFrames.map((f, i) => (
        <Sfx key={`st${i}`} at={f} name="step" volume={0.4} durationInFrames={10} />
      ))}
      <Sfx at={B.ding} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};
