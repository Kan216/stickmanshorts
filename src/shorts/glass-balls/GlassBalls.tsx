/**
 * "Glass Balls" (18s, 720x1280 @30fps) — metaphor + counter. A juggler keeps
 * five balls in the air. WORK is rubber: it bounces back. FAMILY is glass: it
 * shatters in slow motion and he kneels. Counter JUGGLING 5 → 4.
 * Storyboard: storyboards/glass-balls.md
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { GlassShards, JuggleBall } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, POSES, poseAt } from "../../lib/pose";
import { sec } from "../../lib/anim";
import { LAYOUT } from "../../lib/theme";

export const GLASS_BALLS_DURATION = sec(18);

const G = LAYOUT.groundY;
const H = 300;
const JX = 360;
const T = 30; // frames per juggle cycle (one ball lap)
const BALL_R = 38;

const BALLS = [
  { key: "WORK", label: "WORK", color: "orange", glass: false },
  { key: "FAMILY", label: "FAMILY", color: "gold", glass: true },
  { key: "HEALTH", label: "HEALTH", color: "green", glass: true },
  { key: "FRIENDS", label: "FRIENDS", color: "blue", glass: true },
  { key: "SELF", label: "SELF", color: "pink", glass: true },
];

// Beats
const DROP_WORK = sec(4.5);
const DROP_FAMILY = sec(9.0);
const SLOW_END = sec(9.8); // impact (after the slow-mo drop)
const KNEEL = sec(9.4);

/** Juggling arc for ball i at frame f (x, y in px). */
const arc = (f: number, i: number) => {
  const p = (((f / T + i / BALLS.length) % 1) + 1) % 1;
  const x = JX + 110 * Math.sin(2 * Math.PI * (f / T + i / BALLS.length));
  const y = 530 - 160 * 4 * p * (1 - p);
  return { x, y };
};

/** Bounce path for a rubber ball dropped at `td` from (x0,y0). */
const bounce = (f: number, td: number, x0: number, y0: number) => {
  const u = (f - td) / 30;
  const decay = Math.exp(-2.4 * u);
  const y = G - BALL_R - (G - BALL_R - y0) * 0 - Math.max(0, y0 - (G - BALL_R)) * 0 - Math.abs(Math.cos(Math.PI * u * 2.4)) * 320 * decay;
  const x = x0 - 25 * u;
  return { x, y: Math.min(G - BALL_R, y) };
};

/** Glass ball falling from (x0,y0) after `td`; slow motion for the first 0.9s. */
const fallGlass = (f: number, td: number, x0: number, y0: number) => {
  const slowUntil = td + sec(0.9);
  const eff = f < td ? f : f < slowUntil ? td + (f - td) * 0.3 : td + (slowUntil - td) * 0.3 + (f - slowUntil);
  const u = Math.min(1, Math.max(0, (eff - td) / (sec(0.8) - 0)));
  const t = Math.min(1, Math.max(0, (eff - td) / (SLOW_END - td)));
  const e = t * t;
  return { x: x0 + (JX - 40 - x0) * t * 0.3, y: y0 + (G - BALL_R - y0) * e, u };
};

export const GlassBalls: React.FC = () => {
  const frame = useCurrentFrame();

  // Juggler: arms up while juggling, kneels after FAMILY shatters.
  const juggling = frame < KNEEL;
  const pose = juggling
    ? addPose(POSES.bothArmsUp, breathe(frame, 0.6))
    : poseAt(frame, [{ f: KNEEL, pose: "bothArmsUp" }, { f: KNEEL + sec(0.5), pose: "kneel" }]);
  const expression = frame >= SLOW_END ? "sad" : frame >= DROP_FAMILY ? "angry" : "happy";

  // Counter: balls still in play. WORK bounces (still in play), FAMILY shatters (leaves play).
  const inPlay = frame >= SLOW_END ? 4 : 5;

  // Ball positions
  const drawn = BALLS.map((b, i) => {
    if (b.key === "WORK") {
      const p = frame < DROP_WORK ? arc(frame, i) : bounce(frame, DROP_WORK, arc(DROP_WORK, i).x, arc(DROP_WORK, i).y);
      return { ...b, ...p, visible: true };
    }
    if (b.key === "FAMILY") {
      if (frame < DROP_FAMILY) return { ...b, ...arc(frame, i), visible: true };
      const a = arc(DROP_FAMILY, i);
      const fall = fallGlass(frame, DROP_FAMILY, a.x, a.y);
      return { ...b, x: fall.x, y: fall.y, visible: frame < SLOW_END };
    }
    return { ...b, ...arc(frame, i), visible: true };
  });

  const shardT = Math.min(1, Math.max(0, (frame - SLOW_END) / sec(1.2)));

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor="gold" glowStrength={frame >= SLOW_END ? 0.9 : 0.5} />

      {/* Ground */}
      <line x1={24} y1={G + 2} x2={696} y2={G + 2} stroke="#3a414c" strokeWidth={2} />

      <Stickman x={JX} y={G} height={H} pose={pose} color="white" expression={expression} glow={1.1} />

      {drawn.map((b) =>
        b.visible ? (
          <JuggleBall key={b.key} x={b.x} y={b.y} r={BALL_R} color={b.color} label={b.label} glass={b.glass} />
        ) : null,
      )}

      {frame >= SLOW_END && <GlassShards x={drawn[1].x} y={G - BALL_R} t={shardT} color="gold" count={14} spread={170} />}

      {/* ---- TEXT ---- */}
      <Headline text="LIFE IS 5 BALLS." start={0} end={DROP_WORK} />
      <Headline text="{orange:WORK} BOUNCES BACK." start={DROP_WORK} end={DROP_FAMILY + sec(0.5)} />
      <Headline text={"WORK IS RUBBER.\n{gold:FAMILY IS GLASS.}"} start={DROP_FAMILY + sec(0.5)} size={44} glow y={96} />
      <StatRow start={0} end={sec(18)} y={282} stats={[{ label: "JUGGLING", color: "white", value: `${inPlay}`, glow: frame >= SLOW_END }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (GLASS_BALLS_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={0} name="boom" volume={0.4} />
      <Sfx at={DROP_WORK} name="thud" volume={0.55} />
      <Sfx at={DROP_WORK + 14} name="pop" volume={0.5} />
      <Sfx at={DROP_WORK + 30} name="pop" volume={0.35} />
      <Sfx at={DROP_FAMILY} name="whoosh" volume={0.55} />
      <Sfx at={SLOW_END} name="glitch" volume={0.6} />
      <Sfx at={SLOW_END} name="thud" volume={0.7} />
      <Sfx at={SLOW_END + 6} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};
