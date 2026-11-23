/**
 * "GPS Recalculating" (20s, 720x1280 @30fps) — metaphor + counter. A figure
 * follows a GPS route to GOAL and falls into FAILURE, REJECTION, BROKE holes.
 * Each time the route is recalculated around the hole. Route 4 reaches GOAL.
 * Storyboard: storyboards/gps-recalculating.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { DottedRoute, Flag, Hole, Particles, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, POSES, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { LAYOUT } from "../../lib/theme";

export const GPS_RECALCULATING_DURATION = sec(20);

const G = LAYOUT.groundY;
const H = 260;
const START_X = 80;
const FLAG_X = 620;
const ROUTE_Y = G - 4;
const ARC_H = 140;

// Holes on the ground, and the arc each route hops over them with.
const HOLES = [
  { x: 250, label: "FAILURE" },
  { x: 390, label: "REJECTION" },
  { x: 530, label: "BROKE" },
];
const arcOver = (x: number) => ({ x0: x - 30, x1: x + 30 });

// Attempts: route k hops over holes 0..k-1 and falls into hole k (route 3 reaches the flag).
const ATTEMPTS = [0, 1, 2, 3].map((k) => {
  const start = sec([0.6, 5.0, 9.4, 13.8][k]);
  const walkStart = start + sec(1.0);
  const stopX = k < 3 ? HOLES[k].x : FLAG_X - 10;
  const walkDur = Math.max(sec(1.6), Math.round(((stopX - START_X) / 220) * 30));
  const walkEnd = walkStart + walkDur;
  const arcs = HOLES.slice(0, k).map((h) => arcOver(h.x));
  return { k, start, walkStart, walkEnd, stopX, arcs, fell: k < 3 };
});

/** Route polyline for attempt k: ground, hopping over the holes behind it. */
const routePoints = (arcs: { x0: number; x1: number }[]) => {
  const pts: { x: number; y: number }[] = [];
  for (let x = START_X; x <= FLAG_X; x += 4) {
    const a = arcs.find((r) => x >= r.x0 && x <= r.x1);
    const lift = a ? ARC_H * Math.sin((Math.PI * (x - a.x0)) / (a.x1 - a.x0)) : 0;
    pts.push({ x, y: ROUTE_Y - lift });
  }
  return pts;
};
const ROUTES = ATTEMPTS.map((a) => routePoints(a.arcs));

const arcLift = (x: number, arcs: { x0: number; x1: number }[]) => {
  const a = arcs.find((r) => x >= r.x0 && x <= r.x1);
  return a ? ARC_H * Math.sin((Math.PI * (x - a.x0)) / (a.x1 - a.x0)) : 0;
};

export const GpsRecalculating: React.FC = () => {
  const frame = useCurrentFrame();

  // Which attempt is current (last one that has started).
  let cur = 0;
  ATTEMPTS.forEach((a) => {
    if (frame >= a.start) cur = a.k;
  });
  const a = ATTEMPTS[cur];

  // ---- FIGURE ----
  let fx = START_X;
  let fy = G;
  let spin = 0;
  let opacity = 1;
  let pose = addPose(POSES.stand, breathe(frame, 0.6));
  if (frame >= a.walkStart && frame < a.walkEnd) {
    const u = ease.inOut(progress(frame, a.walkStart, a.walkEnd));
    fx = START_X + (a.stopX - START_X) * u;
    fy = G - arcLift(fx, a.arcs);
    pose = walkCycle(frame, { startFrame: a.walkStart, speed: 1.1 }).pose;
  } else if (frame >= a.walkEnd) {
    fx = a.stopX;
    if (a.fell) {
      const t = frame - a.walkEnd;
      fy = G + 70 * ease.in(clamp_(t / 12));
      spin = 60 * ease.in(clamp_(t / 12));
      opacity = interpolate(t, [10, 16], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      pose = POSES.crouch;
    } else {
      pose = addPose(POSES.victory, breathe(frame));
    }
  }
  const won = frame >= ATTEMPTS[3].walkEnd;

  // Shake on each fall
  const sh = ATTEMPTS.filter((x) => x.fell).reduce(
    (acc, x) => {
      const s = shake(frame, x.walkEnd, 12, 9);
      return { x: acc.x + s.x, y: acc.y + s.y };
    },
    { x: 0, y: 0 },
  );

  // ---- ROUTE & HOLE VISUALS ----
  const routeOpacity = (k: number) => (k > cur ? 0 : k === cur ? 1 : 0.15);
  const routeDraw = progress(frame, a.start, a.start + sec(1.0), ease.out);

  // Counter: ROUTES 1 → 4
  const routesShown = Math.min(4, cur + 1);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={won ? "gold" : undefined} glowStrength={won ? 1.2 : 0.8} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* Routes (all faded except the current one) */}
        {ROUTES.map((pts, k) => (
          <DottedRoute key={k} points={pts} progress={k === cur ? routeDraw : 1} color="gold" opacity={routeOpacity(k)} dot={4} />
        ))}

        {/* Holes */}
        {HOLES.map((h, i) => (
          <Hole key={h.label} x={h.x} label={h.label} color="red" hit={cur > i || (cur === i && frame >= ATTEMPTS[i].walkEnd)} />
        ))}

        {/* Goal */}
        {won && <Spotlight x={FLAG_X} y={G - 90} r={200} color="gold" strength={progress(frame, ATTEMPTS[3].walkEnd, ATTEMPTS[3].walkEnd + 20)} />}
        <Flag x={FLAG_X} glow={won ? 2 : 1} />
        {won && <Particles color="gold" count={36} area={{ x: FLAG_X - 120, y: G - 420, w: 240, h: 420 }} speed={1.4} size={3} />}

        {/* Figure */}
        {frame < a.walkEnd + sec(0.6) || cur === 3 ? (
          <Stickman
            x={fx}
            y={fy}
            height={H}
            pose={pose}
            color="white"
            expression={won ? "happy" : frame >= a.walkEnd && a.fell ? "dead" : "neutral"}
            spin={spin}
            opacity={opacity}
            glow={won ? 1.6 : 1}
          />
        ) : null}
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text="{gold:FAILED?}" start={0} end={sec(3.2)} />
      <Headline text="RECALCULATING..." start={sec(3.2)} end={won ? ATTEMPTS[3].walkEnd : undefined} mode="type" />
      <Headline text={"FAILURE IS JUST\n{gold:RECALCULATING.}"} start={ATTEMPTS[3].walkEnd} size={46} glow />
      <StatRow start={0} end={sec(20)} y={282} stats={[{ label: "ROUTES", color: "gold", value: `${routesShown}`, glow: won }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (GPS_RECALCULATING_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      {ATTEMPTS.map((x) => (
        <React.Fragment key={`r${x.k}`}>
          <Sfx at={x.start} name="whoosh" volume={0.45} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Sfx key={`s${x.k}${i}`} at={x.walkStart + Math.round(((x.walkEnd - x.walkStart) / 6) * i)} name="step" volume={0.3} durationInFrames={10} />
          ))}
          {x.fell && <Sfx at={x.walkEnd} name="thud" volume={0.85} />}
        </React.Fragment>
      ))}
      <Sfx at={sec(3.2)} name="tick" volume={0.35} durationInFrames={10} />
      <Sfx at={sec(13.8) - sec(1.2)} name="riser" volume={0.4} />
      <Sfx at={ATTEMPTS[3].walkEnd} name="boom" volume={0.8} />
      <Sfx at={ATTEMPTS[3].walkEnd} name="ding" volume={0.7} />
    </AbsoluteFill>
  );
};

const clamp_ = (v: number) => Math.max(0, Math.min(1, v));
