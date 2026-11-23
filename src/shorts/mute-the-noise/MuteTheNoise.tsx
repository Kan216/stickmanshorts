/**
 * "Mute The Noise" (15s, 720x1280 @30fps) — metaphor + counter. A walker heads
 * for a gold goal while four grey voices pop speech bubbles that stick to him
 * and slow him. He puts on headphones; the noise shatters and he walks in.
 * Storyboard: storyboards/mute-the-noise.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Flag, Headphones, SpeechBubble, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, POSES, solve, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { LAYOUT } from "../../lib/theme";

export const MUTE_THE_NOISE_DURATION = sec(15);

const G = LAYOUT.groundY;
const H = 280;
const START_X = 60;
const GOAL_X = 600;
const BASE = 2.0; // px per frame at full speed (60 px/s)

// Four voices: where they stand (back row), what they say, when they pop.
const VOICES = [
  { x: 150, text: "YOU CAN'T", at: sec(2.0) },
  { x: 265, text: "TOO LATE", at: sec(3.0) },
  { x: 380, text: "WHO DO YOU THINK YOU ARE?", at: sec(4.0) },
  { x: 495, text: "JUST QUIT", at: sec(5.0) },
];
const ATTACH_DELAY = sec(0.6);
const HEADPHONES_ON = sec(6.6);
const HEADPHONES_DONE = sec(7.2);
const SLOTS = [
  { dx: -78, dy: -62 },
  { dx: 70, dy: -78 },
  { dx: -30, dy: -118 },
  { dx: 88, dy: -20 },
];

/** How many voices are stuck to the walker at frame f (they drop off when the headphones go on). */
const attached = (f: number) => {
  if (f >= HEADPHONES_ON) return 0;
  return VOICES.filter((v) => f >= v.at + ATTACH_DELAY).length;
};
const speedAt = (f: number) => Math.max(0.12, 1 - 0.22 * attached(f));

/** Walker x: integrates speed frame by frame, so each voice really slows him. */
const xCache: number[] = [START_X];
const heroX = (f: number) => {
  const n = Math.max(0, Math.floor(f));
  while (xCache.length <= n) {
    const i = xCache.length - 1;
    xCache.push(Math.min(GOAL_X, xCache[i] + BASE * speedAt(i)));
  }
  return xCache[n];
};

export const MuteTheNoise: React.FC = () => {
  const frame = useCurrentFrame();

  const x = heroX(frame);
  const nAttached = attached(frame);
  const shattered = frame >= HEADPHONES_DONE;
  const shatter = progress(frame, HEADPHONES_DONE, HEADPHONES_DONE + sec(0.6), ease.out);
  const fadeOut = interpolate(frame, [HEADPHONES_DONE + sec(0.3), HEADPHONES_DONE + sec(0.9)], [1, 0], clamp);

  // Pose: walk, slumping more with every voice; upright again after the headphones.
  const walk = walkCycle(frame, { speed: 1.0 * speedAt(frame) }).pose;
  const slump = nAttached / VOICES.length;
  const heroPose = shattered
    ? addPose(POSES.stand, breathe(frame, 0.6))
    : addPose(lerpPose(walk, POSES.slump, slump * 0.8), breathe(frame, 0.4));

  const head = solve(heroPose, x, G, H, 1);
  const headR = H * 0.085;

  // Noise counter: steps up as voices stick, drops to 0 when they shatter.
  const noise = shattered ? Math.round(99 * (1 - progress(frame, HEADPHONES_DONE, HEADPHONES_DONE + sec(0.4)))) : [0, 25, 50, 75, 99][nAttached];

  // Glowing goal, reached near the end.
  const arrived = x >= GOAL_X - 1;
  const goalGlow = interpolate(frame, [sec(7.2), sec(12)], [0.5, 1], clamp);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor="gold" glowStrength={goalGlow} />
      <Spotlight x={GOAL_X + 20} y={G - 90} r={230} color="gold" strength={goalGlow} />
      <Flag x={GOAL_X + 40} glow={arrived ? 2 : 1} label="GOAL" />

      {/* Back row: grey voices */}
      {VOICES.map((v, i) => {
        const popP = progress(frame, v.at, v.at + 8, ease.out);
        return (
          <React.Fragment key={`v${i}`}>
            <Stickman x={v.x} y={760} height={190} style="line" color="#7d8594" pose={addPose(POSES.point, breathe(frame, 0.5))} expression={frame >= v.at ? "angry" : "neutral"} glow={0.4} opacity={0.75} />
            {frame >= v.at && frame < v.at + ATTACH_DELAY + sec(0.4) && (
              <SpeechBubble x={v.x} y={interpolate(popP, [0, 1], [520, 470])} text={v.text} color="white" scale={popP * 0.9 + 0.1} />
            )}
          </React.Fragment>
        );
      })}

      {/* Voices stuck to the walker */}
      {VOICES.map((v, i) => {
        const arrive = v.at + ATTACH_DELAY;
        if (frame < arrive || frame >= HEADPHONES_ON) return null;
        const s = SLOTS[i];
        const p = progress(frame, arrive, arrive + sec(0.4), ease.out);
        const from = { x: v.x, y: 470 };
        const to = { x: head.head.x + s.dx, y: head.head.y + s.dy };
        return (
          <SpeechBubble key={`a${i}`} x={interpolate(p, [0, 1], [from.x, to.x])} y={interpolate(p, [0, 1], [from.y, to.y])} text={v.text} color="white" scale={0.9} />
        );
      })}

      {/* Walker */}
      <Stickman
        x={x}
        y={G}
        height={H}
        pose={heroPose}
        color="white"
        expression={shattered ? "happy" : slump > 0.5 ? "sad" : "neutral"}
        glow={shattered ? 1.4 : 1}
      />
      {frame >= HEADPHONES_ON && (
        <Headphones head={{ x: head.head.x, y: head.head.y }} r={headR} color="gold" opacity={progress(frame, HEADPHONES_ON, HEADPHONES_ON + sec(0.4), ease.out)} />
      )}

      {/* Shattering bubbles at the walker's head */}
      {shatter > 0 && VOICES.map((v, i) => {
        const s = SLOTS[i];
        return (
          <SpeechBubble key={`b${i}`} x={head.head.x + s.dx} y={head.head.y + s.dy} text={v.text} color="white" scale={0.9} shatter={shatter} opacity={fadeOut} />
        );
      })}

      {/* ---- TEXT ---- */}
      <Headline text="THEY SAID YOU CAN'T." start={0} end={sec(6.6)} />
      <Headline text={"MUTE\n{gold:THE NOISE.}"} start={sec(6.6)} size={52} glow y={130} />
      <StatRow start={0} end={sec(15)} y={282} stats={[{ label: "NOISE", color: "gold", value: `${noise}`, dim: shattered && noise === 0 }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (MUTE_THE_NOISE_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={0} name="boom" volume={0.4} />
      {VOICES.map((v, i) => (
        <Sfx key={`p${i}`} at={v.at} name="pop" volume={0.6} />
      ))}
      <Sfx at={sec(5.0)} name="heartbeat" volume={0.5} />
      <Sfx at={HEADPHONES_ON} name="thud" volume={0.6} />
      <Sfx at={HEADPHONES_DONE} name="glitch" volume={0.7} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Sfx key={`s${i}`} at={sec(7.4) + i * 14} name="step" volume={0.3} durationInFrames={8} />
      ))}
      <Sfx at={sec(13.0)} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};
