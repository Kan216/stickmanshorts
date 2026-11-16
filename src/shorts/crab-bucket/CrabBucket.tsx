/**
 * "Not Everyone Wants You To Win" (18s, 720x1280 @30fps) — metaphor (crab bucket).
 * A gold figure climbs out of a pit; grey figures grab his feet and pull him back
 * twice. Third attempt he kicks free and stands on the edge in gold light.
 * Storyboard: storyboards/crab-bucket.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Particles, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, pose, Pose, poseAt, POSES, solve, tremble } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS, LAYOUT, VIDEO } from "../../lib/theme";

export const CRAB_BUCKET_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
type Attempt = { start: number; peak: number; height: number; grab: number; pull: number; land: number };
const A: Attempt[] = [
  { start: sec(1.5), peak: sec(3.3), height: 120, grab: sec(3.2), pull: sec(3.7), land: sec(4.1) },
  { start: sec(5.3), peak: sec(7.5), height: 190, grab: sec(7.3), pull: sec(7.9), land: sec(8.35) },
  { start: sec(9.5), peak: sec(11.2), height: 205, grab: sec(10.9), pull: 99999, land: 99999 },
];
const B = {
  hook: 0,
  pulled: sec(4.1), // "THEY PULL HIM BACK."
  again: A[1].start, // "AGAIN."
  last: A[2].start, // "ONE MORE TIME."
  kick: sec(11.2),
  mantle: sec(11.4),
  free: sec(12.4), // stands on the edge in gold light
  punch: sec(13.8),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY; // pit floor
const RIM = 500;
const PIT_L = 140;
const PIT_R = 575;
const H = 170;
const HERO_X = 552;
const LEDGE_X = 625;
const GH = 160;
const GREYS = [285, 365, 445];

const climbA = pose({ head: -20, frontShoulder: 168, frontElbow: 18, backShoulder: 140, backElbow: 55, frontHip: 62, frontKnee: 95, backHip: 8, backKnee: 12 });
const climbB = pose({ head: -20, frontShoulder: 140, frontElbow: 55, backShoulder: 168, backElbow: 18, frontHip: 8, frontKnee: 12, backHip: 62, backKnee: 95 });
const lookUp = pose({ head: -28, frontShoulder: 20, backShoulder: -10, frontElbow: 20 });
const kickBack = pose({ head: -20, frontShoulder: 170, frontElbow: 10, backShoulder: 165, backElbow: 15, frontHip: 15, frontKnee: 10, backHip: -55, backKnee: 10 });

/** Hero state: feet position, pose, spin. */
const hero = (f: number): { x: number; y: number; pose: Pose; spin: number } => {
  if (f >= B.mantle) {
    const t = progress(f, B.mantle, B.free - 6, ease.inOut);
    const p = f < B.free - 6
      ? poseAt(f, [{ f: B.mantle, pose: climbA }, { f: B.mantle + 12, pose: "crouch" }, { f: B.free - 6, pose: "crouch" }])
      : addPose(poseAt(f, [{ f: B.free - 6, pose: "crouch" }, { f: B.free + 8, pose: "standTall", easing: ease.out }, { f: B.free + 30, pose: "victory", easing: ease.out }]), breathe(f));
    return { x: HERO_X + (LEDGE_X - HERO_X) * t, y: G - A[2].height + (RIM - (G - A[2].height)) * ease.out(Math.min(1, t * 1.4)), pose: p, spin: 0 };
  }
  // which attempt are we in (last one that started)?
  const i = [...A].reverse().findIndex((a) => f >= a.start);
  if (i === -1) return { x: HERO_X, y: G, pose: addPose(lookUp, breathe(f)), spin: 0 };
  const a = A[A.length - 1 - i];
  const cyc = (Math.sin(f * 0.45) + 1) / 2;
  if (f < a.pull) {
    const up = progress(f, a.start, a.peak, ease.out);
    const climbing = f < a.peak;
    let p = climbing ? lerpPose(climbA, climbB, cyc) : climbA;
    if (f >= a.grab && a.pull < 99999) p = addPose(climbA, tremble(f, 2.5));
    if (a === A[2] && f >= B.kick - 8) p = poseAt(f, [{ f: B.kick - 8, pose: climbA }, { f: B.kick, pose: kickBack, easing: ease.out }, { f: B.mantle, pose: climbA }]);
    return { x: HERO_X, y: G - a.height * up, pose: p, spin: 0 };
  }
  if (f < a.land) {
    const t = progress(f, a.pull, a.land, ease.in);
    return { x: HERO_X - 20 * t, y: G - a.height * (1 - t), pose: lerpPose(climbA, POSES.swimUp, t), spin: -18 * Math.sin(Math.PI * t) };
  }
  // landed: crouch, then get back up looking at the rim
  return {
    x: HERO_X - 20 + 20 * progress(f, a.land + 20, a.land + 34),
    y: G,
    pose: addPose(poseAt(f, [{ f: a.land, pose: "crouch" }, { f: a.land + 12, pose: "crouch" }, { f: a.land + 30, pose: lookUp }]), breathe(f)),
    spin: 0,
  };
};

/** Grey grabber k: walks in to grab, pulls down, steps back. On attempt 3 the front one gets kicked over. */
const grey = (k: number, f: number): { x: number; pose: Pose; opacity: number } => {
  const base = GREYS[k];
  const idle = addPose(pose({ head: -20, frontShoulder: 25, backShoulder: -10 }), breathe(f + k * 17));
  const grabbers = [[2], [1, 2], [2]];
  for (let n = 0; n < A.length; n++) {
    const a = A[n];
    if (!grabbers[n].includes(k)) continue;
    const reachX = HERO_X - 30 - (2 - k) * 34;
    if (f >= a.grab - 18 && f < a.land + 25) {
      const move = progress(f, a.grab - 18, a.grab - 4) * (1 - progress(f, a.land + 5, a.land + 25));
      const x = base + (reachX - base) * move;
      if (n === 2) {
        // kicked: knocked back onto the floor
        const knock = progress(f, B.kick, B.kick + 10, ease.out);
        if (f >= B.kick) return { x: x - 70 * knock, pose: poseAt(f, [{ f: B.kick, pose: "reachUp" }, { f: B.kick + 12, pose: "lieBack", easing: ease.out }]), opacity: 1 };
        return { x, pose: poseAt(f, [{ f: a.grab - 18, pose: idle }, { f: a.grab, pose: "reachUp" }]), opacity: 1 };
      }
      const p = poseAt(f, [
        { f: a.grab - 18, pose: idle },
        { f: a.grab, pose: k === 2 ? "reachUp" : pose({ ...POSES.reachUp, frontShoulder: 150 }) },
        { f: a.pull, pose: pose({ ...POSES.reachUp, torso: -6, frontShoulder: 175 }) },
        { f: a.land, pose: pose({ torso: 20, head: 10, frontShoulder: 60, frontElbow: 20, frontHip: 30, frontKnee: 25 }), easing: ease.in },
        { f: a.land + 25, pose: idle },
      ]);
      return { x, pose: p, opacity: 1 };
    }
  }
  if (f >= B.kick + 12 && k === 2) return { x: HERO_X - 30 - 70, pose: POSES.lieBack, opacity: 1 };
  return { x: base, pose: idle, opacity: 1 };
};

export const CrabBucket: React.FC = () => {
  const frame = useCurrentFrame();
  const h = hero(frame);
  const free = frame >= B.free;
  const gold = progress(frame, B.free - 8, B.free + 15, ease.out);
  const attempts = A.filter((a) => frame >= a.start).length;

  const sh = [A[0].land, A[1].land].reduce((acc, t) => {
    const s = shake(frame, t, 10, 9);
    return { x: acc.x + s.x, y: acc.y + s.y };
  }, shake(frame, B.free, 12, 6));
  const zoom = 1 + 0.03 * progress(frame, B.last, B.free, ease.in) - 0.03 * progress(frame, B.free, B.free + 25);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={free ? "gold" : undefined} glowStrength={free ? 0.6 * gold : 0.8} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <Spotlight x={LEDGE_X} y={RIM - 110} r={260} color="gold" strength={0.15 + 0.85 * gold} />
        <Pit glow={gold} />
        {GREYS.map((_, k) => {
          const g = grey(k, frame);
          return <Stickman key={k} x={g.x} y={G} height={GH} pose={g.pose} color={COLORS.steel} style="line" expression="angry" glow={0.4} opacity={0.75 - 0.25 * gold} />;
        })}
        <GrabLines frame={frame} />
        {free && <Particles color="gold" count={30} area={{ x: LEDGE_X - 150, y: RIM - 330, w: 300, h: 330 }} speed={1.3} size={3} />}
        <Stickman x={h.x} y={h.y} height={H} pose={h.pose} spin={h.spin} color="gold" expression={free ? "happy" : frame >= A[0].land ? "angry" : "neutral"} glow={1 + 0.8 * gold} />
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text="{gold:HE} WANTS OUT." start={B.hook} end={A[0].grab} />
      <Headline text="{steel:THEY} PULL HIM BACK." start={A[0].pull} end={B.again} size={42} />
      <Headline text="AGAIN." start={B.again} end={A[1].land} />
      <Headline text="AND {steel:AGAIN.}" start={A[1].land} end={B.last} />
      <Headline text="ONE MORE TIME." start={B.last} end={B.free} />
      <Headline text="{gold:FREE.}" start={B.free} end={B.punch} size={56} glow />
      <Headline text={"NOT EVERYONE WANTS\nYOU TO {gold:WIN.}"} start={B.punch} size={46} glow />
      <Headline text="COMMENT IF YOU'VE FELT THIS." start={B.punch + 25} size={26} y={262} color={COLORS.steel} mode="fade" weight={700} />
      <StatRow start={B.hook} end={B.punch} stats={[{ label: "ATTEMPTS", color: "gold", value: attempts, glow: free }]} />
      <Watermark step={Math.min(3, Math.floor(frame / (CRAB_BUCKET_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={B.hook} name="boom" volume={0.55} />
      {A.map((a, n) => (
        <React.Fragment key={n}>
          <Sfx at={a.start} name="pop" volume={0.35} />
          {[0, 1, 2, 3].map((s) => (
            <Sfx key={s} at={a.start + 10 + s * 12} name="step" volume={0.28} durationInFrames={10} />
          ))}
          {a.pull < 99999 && (
            <>
              <Sfx at={a.grab} name="glitch" volume={0.35} />
              <Sfx at={a.pull} name="whoosh" volume={0.45} />
              <Sfx at={a.land} name="thud" volume={0.9} />
            </>
          )}
        </React.Fragment>
      ))}
      <Sfx at={A[1].land + 15} name="heartbeat" volume={0.55} />
      <Sfx at={B.kick - 6} name="whoosh" volume={0.5} />
      <Sfx at={B.kick + 10} name="thud" volume={0.5} />
      <Sfx at={B.free - sec(2)} name="riser" volume={0.4} />
      <Sfx at={B.free} name="boom" volume={0.75} />
      <Sfx at={B.free} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

/** The pit: two ground blocks with a glowing rim on the right ledge at the payoff. */
const Pit: React.FC<{ glow: number }> = ({ glow }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={VIDEO.width} height={VIDEO.height}>
        <defs>
          <linearGradient id="pit-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <rect x={PIT_L} y={RIM} width={PIT_R - PIT_L} height={G - RIM} fill="url(#pit-in)" />
        <rect x={-10} y={RIM} width={PIT_L + 10} height={G - RIM} fill="#1b2028" stroke="#3a414c" strokeWidth={2} />
        <rect x={PIT_R} y={RIM} width={VIDEO.width - PIT_R + 10} height={G - RIM} fill="#1b2028" stroke="#3a414c" strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={PIT_R + 6} y1={RIM + 60 + i * 65} x2={PIT_R + 30 + (i % 2) * 20} y2={RIM + 70 + i * 65} stroke="#2a3039" strokeWidth={3} strokeLinecap="round" />
        ))}
        <line x1={PIT_R} y1={RIM} x2={VIDEO.width} y2={RIM} stroke={COLORS.gold} strokeWidth={3 + 2 * glow} opacity={0.25 + 0.75 * glow} />
        <line x1={0} y1={RIM} x2={PIT_L} y2={RIM} stroke="#4a5361" strokeWidth={2} />
        <rect x={PIT_R} y={RIM - 4} width={VIDEO.width - PIT_R} height={8} fill={COLORS.gold} opacity={glow * (0.25 + 0.1 * Math.sin(f / 6))} />
      </svg>
    </AbsoluteFill>
  );
};

/** Taut grey "arms" from each grabber's hand to the hero's feet while they hold on. */
const GrabLines: React.FC<{ frame: number }> = ({ frame }) => {
  const h = hero(frame);
  const hs = solve(h.pose, h.x, h.y, H, 1);
  const holds = [[2], [1, 2]];
  const lines: React.ReactNode[] = [];
  holds.forEach((ks, n) => {
    const a = A[n];
    if (frame < a.grab || frame >= a.land) return;
    ks.forEach((k) => {
      const g = grey(k, frame);
      const gs = solve(g.pose, g.x, G, GH, 1);
      const foot = k === 2 ? hs.back.foot : hs.front.foot;
      lines.push(
        <g key={`${n}-${k}`}>
          <line x1={gs.front.hand.x} y1={gs.front.hand.y} x2={foot.x} y2={foot.y} stroke={COLORS.steel} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
          <circle cx={foot.x} cy={foot.y} r={6} fill={COLORS.steel} opacity={0.9} />
        </g>,
      );
    });
  });
  return (
    <AbsoluteFill>
      <svg width={VIDEO.width} height={VIDEO.height}>{lines}</svg>
    </AbsoluteFill>
  );
};
