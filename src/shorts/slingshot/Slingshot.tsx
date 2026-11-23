/**
 * "Slingshot" (15s, 720x1280 @30fps) — metaphor + counter. Three runners race
 * right. The gold runner is caught by a SETBACK elastic and dragged back three
 * times; he is released and launched past everyone, crossing the finish tape.
 * Storyboard: storyboards/slingshot.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Elastic, FinishTape, MotionStreaks } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, POSES, runCycle, tremble } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { LAYOUT } from "../../lib/theme";

export const SLINGSHOT_DURATION = sec(15);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  caught: sec(2.6),
  drag1: sec(2.6),
  drag2: sec(3.8),
  drag3: sec(5.0),
  good: sec(5.0),
  riser: sec(6.4),
  release: sec(8.0),
  passed: sec(10.0),
  finish: sec(11.0),
  end: sec(15),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const LANES = {
  teal: { y: 600, H: 170, color: "teal" },
  steel: { y: 745, H: 200, color: "steel" },
  gold: { y: G, H: 260, color: "gold" },
};
const START = 120;
const FINISH_X = 650;
const POST_X = 40;

/** Gold's x: runs, is dragged back in three steps, held, then launched forward. */
const goldX = (frame: number) => {
  if (frame < B.caught) return START + 75 * (frame / 30) * 0.92;
  const d1 = 225 + 0 * 0;
  const pos = (f: number) => {
    if (f < B.caught) return START + 75 * (f / 30) * 0.92;
    if (f < B.drag1 + sec(0.7)) return interpolate(f, [B.drag1, B.drag1 + sec(0.7)], [250, 225], { ...clamp, easing: ease.inOut });
    if (f < B.drag2) return d1 - 0 * 1;
    if (f < B.drag2 + sec(0.7)) return interpolate(f, [B.drag2, B.drag2 + sec(0.7)], [225, 190], { ...clamp, easing: ease.inOut });
    if (f < B.drag3) return 190;
    if (f < B.drag3 + sec(0.8)) return interpolate(f, [B.drag3, B.drag3 + sec(0.8)], [190, 150], { ...clamp, easing: ease.inOut });
    if (f < B.release) return 150;
    if (f < B.finish) return interpolate(f, [B.release, B.finish], [150, FINISH_X], { ...clamp, easing: ease.out });
    return FINISH_X;
  };
  return pos(frame);
};

/** Teal and Steel run, then tire and slow near the finish. */
const rivalX = (frame: number, speed: number, stopAt: number) => START + Math.min(stopAt - START, speed * (frame / 30));

export const Slingshot: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- rivals ----
  const tealX = rivalX(frame, 75, 560);
  const steelX = rivalX(frame, 62, 590);
  const tealRun = frame < sec(6.0);
  const steelRun = frame < sec(7.6);
  const tealPose = tealRun ? runCycle(frame, { speed: 1.5 }).pose : addPose(POSES.bow, breathe(frame, 0.5));
  const steelPose = steelRun ? runCycle(frame, { speed: 1.3 }).pose : addPose(POSES.bow, breathe(frame, 0.5));

  // ---- gold ----
  const gx = goldX(frame);
  const dragging = (f: number) => (f >= B.drag1 && f < B.drag1 + sec(0.7)) || (f >= B.drag2 && f < B.drag2 + sec(0.7)) || (f >= B.drag3 && f < B.drag3 + sec(0.8));
  const isDragged = dragging(frame);
  const isHeld = frame >= B.drag3 + sec(0.8) && frame < B.release;
  const isRunning = frame < B.caught || frame >= B.release;
  const goldRunning = frame >= B.release ? runCycle(frame, { speed: 2.3, startFrame: B.release }).pose : runCycle(frame, { speed: 1.5 }).pose;
  let goldPose = goldRunning;
  if (isDragged) goldPose = addPose(lerpPose(POSES.stand, POSES.crouch, 0.5), tremble(frame, 2.2));
  if (isHeld) goldPose = addPose(POSES.push, tremble(frame, 1.6));
  if (frame >= B.finish) goldPose = addPose(POSES.victory, breathe(frame));
  const goldWaist = { x: gx, y: LANES.gold.y - LANES.gold.H * 0.6 };

  // elastic tension: high while held/dragged, zero when launched
  const tension = isDragged || isHeld ? 1 : isRunning && frame < B.caught ? 0.2 : 0;
  const launched = frame >= B.release;

  // ---- counter ----
  const stage = frame >= B.drag3 ? 3 : frame >= B.drag2 ? 2 : frame >= B.drag1 ? 1 : 0;
  const counter = launched ? Math.round(-30 + progress(frame, B.release, B.finish) * 100) : -10 * stage;

  // Speed streaks on the launch
  const streakOn = frame >= B.release && frame < B.finish + sec(0.4);

  return (
    <AbsoluteFill>
      <Backdrop mood="dusk" glowColor={launched ? "gold" : undefined} glowStrength={launched ? 0.9 : 0.6} />

      {/* Lane lines */}
      {Object.values(LANES).map((l, i) => (
        <line key={i} x1={24} y1={l.y + 4} x2={696} y2={l.y + 4} stroke="#3a414c" strokeWidth={2} />
      ))}
      <FinishTape x={FINISH_X} groundY={G} h={160} broken={frame >= B.finish ? 1 : 0} color="gold" />

      {/* Rivals */}
      <Stickman x={tealX} y={LANES.teal.y} height={LANES.teal.H} pose={tealPose} color="teal" expression={tealRun ? "happy" : "closed"} glow={0.9} />
      <Stickman x={steelX} y={LANES.steel.y} height={LANES.steel.H} pose={steelPose} color="steel" expression={steelRun ? "neutral" : "closed"} glow={0.9} />

      {/* Elastic from post behind gold to his waist */}
      <Elastic x1={POST_X} y1={goldWaist.y} x2={goldWaist.x} y2={goldWaist.y} label={!launched && frame < B.release + sec(0.2) ? "SETBACK" : undefined} color="gold" tension={tension} postBottom={G} />

      {streakOn && <MotionStreaks x={gx - 30} y={LANES.gold.y - 120} len={130} color="gold" count={6} opacity={interpolate(frame, [B.release, B.finish], [0.9, 0.5], clamp)} />}
      <Stickman x={gx} y={LANES.gold.y} height={LANES.gold.H} pose={goldPose} color="gold" expression={frame >= B.finish ? "happy" : isDragged || isHeld ? "angry" : "neutral"} glow={frame >= B.finish ? 1.8 : 1.2} />

      {/* ---- TEXT ---- */}
      <Headline text="PULLED BACK?" start={B.hook} end={B.good} />
      <Headline text="{gold:GOOD.}" start={B.good} end={sec(11.0)} />
      <Headline text={"A SETBACK IS A\n{gold:SLINGSHOT.}"} start={sec(11.0)} size={46} glow y={130} />
      <StatRow start={0} end={B.end} y={282} stats={[{ label: "DISTANCE", color: "gold", value: `${counter > 0 ? "+" : ""}${counter}`, glow: launched }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (SLINGSHOT_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={B.hook} name="boom" volume={0.45} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={`st${i}`} at={sec(0.5) + i * 14} name="step" volume={0.25} durationInFrames={8} />
      ))}
      {[B.drag1, B.drag2, B.drag3].map((d, i) => (
        <React.Fragment key={`dr${i}`}>
          <Sfx at={d} name="glitch" volume={0.45} />
          <Sfx at={d + 4} name="thud" volume={0.6} />
        </React.Fragment>
      ))}
      <Sfx at={B.riser} name="riser" volume={0.45} />
      <Sfx at={B.release} name="whoosh" volume={0.7} />
      <Sfx at={B.passed} name="whoosh" volume={0.4} />
      <Sfx at={B.finish} name="boom" volume={0.8} />
      <Sfx at={B.finish} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};
