/**
 * EXAMPLE SHORT — "The Climb" (15s, 720x1280 @30fps)
 * Concept: MOTIVATION sprints up the stairs and burns out; HABIT walks one
 * step at a time and reaches the top. Punchline: "WHICH ONE ARE YOU?"
 *
 * Use this file as the template for new shorts (see .claude/skills/stickman-short).
 * Structure: BEATS (timing) → helpers (positions) → layers (bg → props → chars → text → sfx).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Particles, Spotlight, Stairs, stairTop } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, poseAt, runCycle, tremble, walkCycle, POSES, lerpPose } from "../../lib/pose";
import { clamp, progress, sec } from "../../lib/anim";
import { interpolate } from "remotion";

export const THE_CLIMB_DURATION = sec(15);

// ---- BEATS (frames) -------------------------------------------------------
const B = {
  hook: 0, // "WHO REACHES THE TOP?"
  start: sec(1), // both start climbing
  motivationStops: sec(3),
  motivationSits: sec(5),
  line2: sec(5.3), // "MOTIVATION GOT TIRED."
  line3: sec(8), // "HABIT KEPT WALKING."
  habitTop: sec(11.3),
  punch: sec(12.3), // "WHICH ONE ARE YOU?"
};

// ---- STAIRS ---------------------------------------------------------------
const ST = { x: 150, steps: 10, stepW: 44, stepH: 40 };
const top = (i: number) => stairTop(i, ST.x, ST.stepW, ST.stepH);
const H = 215; // character height

/** Position on the stairs for a fractional step index s (-1 = floor before stairs). */
const onStairs = (s: number) => {
  const i = Math.floor(s);
  const f = s - i;
  const a = top(i);
  const b = top(i + 1);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 10 };
};

// MOTIVATION: fast, 6 steps in 2 seconds, then stops.
const motivationStep = (f: number) => interpolate(f, [B.start, B.motivationStops], [-1, 5], clamp);
// HABIT: steady one step every 30 frames until the top.
const HABIT_STEP_FRAMES = 30; // 10 steps × 30f + 40f start ≈ B.habitTop
const habitStep = (f: number) => Math.min(ST.steps - 1, -1 + Math.max(0, f - B.start - 10) / HABIT_STEP_FRAMES);

export const TheClimb: React.FC = () => {
  const frame = useCurrentFrame();

  // --- MOTIVATION ---
  const mS = motivationStep(frame);
  const mPos = onStairs(mS);
  const mPose =
    frame < B.motivationStops
      ? runCycle(frame, { startFrame: B.start, speed: 2.2 }).pose
      : frame < B.motivationSits
        ? addPose(lerpPose(POSES.stand, POSES.slump, progress(frame, B.motivationStops, B.motivationStops + 20)), tremble(frame, 1.2))
        : poseAt(frame, [
            { f: B.motivationSits, pose: POSES.slump },
            { f: B.motivationSits + 18, pose: POSES.sitHugKnees },
          ]);
  const mDim = frame > B.line2;

  // --- HABIT ---
  const hS = habitStep(frame);
  // Habit starts a little behind Motivation so they don't overlap on frame 0.
  const hPos0 = onStairs(hS);
  const hPos = { x: hPos0.x - 55 * Math.max(0, -hS), y: hPos0.y };
  const arrived = frame >= B.habitTop;
  const hPose = arrived
    ? addPose(poseAt(frame, [{ f: B.habitTop, pose: POSES.stand }, { f: B.habitTop + 15, pose: POSES.victory }]), breathe(frame))
    : frame < B.start + 10
      ? addPose(POSES.stand, breathe(frame))
      : walkCycle(frame, { startFrame: B.start + 10, speed: 30 / (HABIT_STEP_FRAMES * 2), stride: 0.8 }).pose;

  const habitSteps = Math.max(0, Math.floor(hS + 1));
  const motivationSteps = Math.max(0, Math.floor(mS + 1));

  // step sounds for habit (one per stair)
  const habitStepFrames = Array.from({ length: ST.steps }, (_, i) => B.start + 10 + (i + 1) * HABIT_STEP_FRAMES);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={arrived ? "gold" : "#1b2333"} glowStrength={arrived ? 0.8 : 1} />
      <Stairs {...ST} lit={habitSteps} color="gold" />
      {arrived && <Spotlight x={hPos.x} y={hPos.y - H * 0.6} r={260} color="gold" strength={progress(frame, B.habitTop, B.habitTop + 25)} />}
      {arrived && <Particles color="gold" count={24} area={{ x: hPos.x - 150, y: hPos.y - 350, w: 300, h: 350 }} />}

      <Stickman x={mPos.x} y={mPos.y} height={H} pose={mPose} color="teal" style="neon" expression={frame > B.motivationStops ? "sad" : "angry"} opacity={mDim ? 0.55 : 1} glow={mDim ? 0.4 : 1} />
      <Stickman x={hPos.x} y={hPos.y} height={H} pose={hPose} color="gold" style="neon" expression={arrived ? "happy" : "neutral"} glow={arrived ? 1.6 : 1} />

      {/* ---- TEXT ---- */}
      <Headline text="WHO REACHES THE TOP?" start={B.hook} end={B.line2} />
      <Headline text="{teal:MOTIVATION} GOT TIRED." start={B.line2} end={B.line3} />
      <Headline text="{gold:HABIT} KEPT WALKING." start={B.line3} end={B.punch} />
      <Headline text="WHICH ONE ARE {gold:YOU?}" start={B.punch} size={48} glow />
      <StatRow
        start={B.start - 10}
        stats={[
          { label: "MOTIVATION", color: "teal", value: motivationSteps, max: ST.steps, dim: mDim },
          { label: "HABIT", color: "gold", value: habitSteps, max: ST.steps, glow: arrived },
        ]}
      />
      <Watermark step={Math.min(3, Math.floor(frame / (THE_CLIMB_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-hope.wav" volume={0.3} />
      <Sfx at={B.hook} name="boom" volume={0.6} />
      <Sfx at={B.start} name="whoosh" volume={0.5} />
      {Array.from({ length: 6 }, (_, i) => (
        <Sfx key={`m${i}`} at={B.start + Math.round((i * (B.motivationStops - B.start)) / 6)} name="tick" volume={0.35} />
      ))}
      <Sfx at={B.motivationStops} name="heartbeat" volume={0.7} />
      <Sfx at={B.motivationSits} name="thud" volume={0.5} />
      {habitStepFrames.filter((f) => f <= B.habitTop).map((f, i) => (
        <Sfx key={`h${i}`} at={f} name="step" volume={0.45} />
      ))}
      <Sfx at={B.habitTop - sec(2)} name="riser" volume={0.35} />
      <Sfx at={B.habitTop} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="boom" volume={0.7} />
    </AbsoluteFill>
  );
};
