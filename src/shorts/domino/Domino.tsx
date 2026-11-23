/**
 * "Domino" (16s, 720x1280 @30fps) — metaphor + counter. A small figure taps a
 * tiny domino; each domino after is 1.5x bigger; the chain topples and the
 * camera pulls back to reveal the last one is skyscraper-sized.
 * Storyboard: storyboards/domino.md
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Domino as DominoPiece } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, poseAt, POSES } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { interpolate } from "remotion";
import { LAYOUT } from "../../lib/theme";

export const DOMINO_DURATION = sec(16);

const G = LAYOUT.groundY;
const N = 11;
const BASE_H = 44;
const hOf = (k: number) => BASE_H * Math.pow(1.5, k);
const LABELS = ["5 MIN", "1 PAGE", "1 WORKOUT", "1 HABIT", "1 MONTH", "1 YEAR", "1 CAREER", "1 DECADE", "1 CHAPTER", "2 DECADES", "LIFE CHANGED"];
const X0 = 190;
// x of each domino (left edge): spacing 0.32 × own height, so each one falls into the next
const XS: number[] = [];
{
  let x = X0;
  for (let k = 0; k < N; k++) {
    XS.push(x);
    x += hOf(k) * 0.32;
  }
}
const SPAWN = Array.from({ length: N }).map((_, k) => sec(2.5 + 0.35 * k));
const TIP = (k: number) => sec(7.5) + Math.round(k * sec(0.18));
const TAP = sec(7.2);
const ZOOM_PIVOT_X = 110;

export const Domino: React.FC = () => {
  const frame = useCurrentFrame();

  const spawned = SPAWN.filter((s) => frame >= s).length;
  const size = Math.floor(Math.pow(1.5, Math.max(0, spawned - 1)));

  // Camera pulls back as the chain grows, keeping the figure's feet fixed.
  const zoom = interpolate(frame, [sec(2.5), sec(9.0)], [1, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Figure: raises an arm and taps the first domino.
  const pose = poseAt(frame, [
    { f: sec(6.2), pose: "stand" },
    { f: TAP - 10, pose: "point", easing: ease.out },
    { f: TAP + 8, pose: "point" },
    { f: TAP + 18, pose: "stand" },
  ]);
  const figurePose = frame < sec(6.2) ? addPose(POSES.stand, breathe(frame, 0.6)) : pose;

  // Shake only on the big falls
  const sh = Array.from({ length: N }).reduce<{ x: number; y: number }>(
    (acc, _, k) => {
      if (k < 7) return acc;
      const s = shake(frame, TIP(k) + 6, 10, 6);
      return { x: acc.x + s.x, y: acc.y + s.y };
    },
    { x: 0, y: 0 },
  );

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={frame >= sec(9.6) ? "gold" : undefined} glowStrength={frame >= sec(9.6) ? 1 : 0.8} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${zoom})`, transformOrigin: `${ZOOM_PIVOT_X}px ${G}px` }}>
        {Array.from({ length: N }).map((_, k) => {
          const p = progress(frame, SPAWN[k], SPAWN[k] + 8, ease.out);
          if (p <= 0) return null;
          const fall = 90 * ease.in(progress(frame, TIP(k), TIP(k) + 7));
          const color = k < 3 ? "steel" : "gold";
          return (
            <DominoPiece
              key={k}
              x={XS[k]}
              height={hOf(k) * p}
              fall={fall}
              color={color}
              label={LABELS[k]}
            />
          );
        })}
        <Stickman
          x={ZOOM_PIVOT_X}
          y={G}
          height={250}
          pose={figurePose}
          facing={1}
          color="steel"
          expression={frame >= TAP ? "happy" : "neutral"}
          glow={1}
        />
      </AbsoluteFill>

      <Headline text="HOW SMALL IS TOO SMALL?" start={0} end={sec(9.6)} />
      <Headline text={"SMALL WINS\n{gold:TOPPLE GIANTS.}"} start={sec(9.6)} y={130} size={46} glow />
      <StatRow start={0} end={DOMINO_DURATION} y={282} stats={[{ label: "SIZE", color: "gold", value: `×${size}`, glow: spawned === N }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (DOMINO_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      {SPAWN.map((s, k) => (
        <Sfx key={`sp${k}`} at={s} name="tick" volume={0.3} durationInFrames={10} />
      ))}
      <Sfx at={sec(5.8)} name="riser" volume={0.4} />
      <Sfx at={TAP} name="whoosh" volume={0.5} />
      {Array.from({ length: N }).map((_, k) => (
        <Sfx key={`tp${k}`} at={TIP(k)} name={k < 3 ? "tick" : k < 7 ? "thud" : "boom"} volume={k < 3 ? 0.35 : k < 7 ? 0.5 : 0.8} />
      ))}
      <Sfx at={sec(9.6)} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};
