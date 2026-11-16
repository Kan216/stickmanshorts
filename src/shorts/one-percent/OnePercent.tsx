/**
 * "1% Better vs 1% Worse" (18s, 720x1280 @30fps) — counter flip / versus.
 * Two figures start back to back on one platform. BETTER (gold) climbs a
 * rising staircase, WORSE (red) sinks down a falling one, while the day
 * counter runs 1 → 365 and shows 1.01^day vs 0.99^day. Storyboard: storyboards/one-percent.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { BigCounter, Headline, StatRow } from "../../components/Text";
import { LaneLight, Particles, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, poseAt, POSES, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS, LAYOUT, VIDEO } from "../../lib/theme";

export const ONE_PERCENT_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  start: sec(1.5), // day counter starts; "DAY 1. TINY DIFFERENCE."
  nobody: sec(5), // "NOBODY NOTICES."
  compound: sec(8.5), // "THEN IT COMPOUNDS."
  riser: sec(10.5),
  year: sec(12.5), // day 365 lands
  punch: sec(14.5),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const H = 170;
const TOP = 700; // platform top
const PL = 300; // platform left / right edges
const PR = 420;
const SW = 40; // step width
const SH = 34; // step height
const STEPS = 6;

const fmt = (v: number) => (v >= 10 ? v.toFixed(1) : v.toFixed(2));

/** Feet position at fractional step s (0 = platform) for a staircase going dir (-1 up-left, +1 down-right). */
const stairPos = (s: number, side: "up" | "down", startX: number) => {
  const k = Math.floor(s);
  const t = s - k;
  const centre = (i: number) => (i === 0 ? startX : side === "up" ? PL - i * SW + SW / 2 : PR + i * SW - SW / 2);
  const top = (i: number) => (side === "up" ? TOP - i * SH : TOP + i * SH);
  const n = Math.min(k + 1, STEPS);
  const tt = ease.inOut(Math.min(1, t * 1.6));
  return {
    x: centre(k) + (centre(n) - centre(k)) * tt,
    y: top(k) + (top(n) - top(k)) * tt - Math.sin(Math.PI * tt) * (side === "up" ? 10 : 4),
  };
};

export const OnePercent: React.FC = () => {
  const frame = useCurrentFrame();

  const day = Math.round(interpolate(frame, [B.start, B.year], [1, 365], { ...clamp, easing: ease.in }));
  const running = frame >= B.start;
  const done = frame >= B.year;
  const better = running ? Math.pow(1.01, day) : 1;
  const worse = running ? Math.pow(0.99, day) : 1;
  const s = running ? ((day - 1) / 364) * STEPS : 0;

  const moving = running && !done;
  const walk = walkCycle(frame, { startFrame: B.start, speed: 1.3, stride: 0.7 });
  const bPos = stairPos(s, "up", 340);
  const wPos = stairPos(s, "down", 380);

  const bPose = done
    ? addPose(poseAt(frame, [{ f: B.year, pose: walk.pose }, { f: B.year + 14, pose: "victory", easing: ease.out }]), breathe(frame))
    : moving
      ? walk.pose
      : addPose(POSES.standTall, breathe(frame));
  const wPose = done
    ? poseAt(frame, [{ f: B.year, pose: walk.pose }, { f: B.year + 20, pose: "kneel", easing: ease.out }])
    : moving
      ? lerpPose(walk.pose, POSES.slump, progress(frame, B.nobody, B.year))
      : addPose(POSES.stand, breathe(frame));

  const sh = shake(frame, B.year, 14, 10);
  const zoom = 1 + 0.035 * progress(frame, B.riser, B.year, ease.in) - 0.035 * progress(frame, B.year, B.year + 20);
  const wDim = interpolate(frame, [B.compound, B.year + 20], [1, 0.45], clamp);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={done ? "gold" : undefined} glowStrength={done ? 0.7 : 1} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <LaneLight x={180} width={340} color="gold" strength={done ? 1.4 : 0.8} />
        <LaneLight x={540} width={340} color="red" strength={0.8 * wDim} />
        {done && <Spotlight x={bPos.x} y={bPos.y - H * 0.6} r={230} color="gold" strength={progress(frame, B.year, B.year + 15)} />}
        <StairsTwoWay lit={s} />
        {done && <Particles color="gold" count={30} area={{ x: 0, y: 260, w: 360, h: 480 }} speed={1.4} size={3} />}
        <Stickman x={bPos.x} y={bPos.y} height={H} pose={bPose} facing={-1} color="gold" expression={done ? "happy" : "neutral"} glow={done ? 1.6 : 1} />
        <Stickman x={wPos.x} y={wPos.y} height={H} pose={wPose} facing={1} color="red" expression={frame >= B.compound ? "sad" : "neutral"} glow={wDim} opacity={0.5 + 0.5 * wDim} />
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text={"{gold:1% BETTER}\nvs {red:1% WORSE}"} start={B.hook} end={B.start} size={46} />
      <Headline text="DAY 1. TINY DIFFERENCE." start={B.start} end={B.nobody} size={40} />
      <Headline text="NOBODY NOTICES." start={B.nobody} end={B.compound} />
      <Headline text="THEN IT {gold:COMPOUNDS.}" start={B.compound} end={B.year} />
      <Headline text="ONE YEAR LATER." start={B.year} end={B.punch} />
      <Headline text={"SMALL DAILY.\n{gold:HUGE} YEARLY."} start={B.punch} size={52} glow />
      <StatRow
        start={B.start}
        end={B.punch}
        stats={[
          { label: "BETTER", color: "gold", value: fmt(better), glow: done },
          { label: "WORSE", color: "red", value: fmt(worse), dim: done },
        ]}
      />
      {frame >= B.punch - 10 && (
        <StatRow
          start={B.punch}
          y={470}
          stats={[
            { label: "BETTER", color: "gold", value: fmt(better), glow: true },
            { label: "WORSE", color: "red", value: fmt(worse) },
          ]}
        />
      )}
      {running && frame < B.punch && <BigCounter label="DAY" value={day} y={440} size={64} start={B.start} color={done ? "gold" : "white"} />}
      <Watermark step={Math.min(3, Math.floor(frame / (ONE_PERCENT_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={B.hook} name="boom" volume={0.6} />
      <Sfx at={B.hook + 12} name="pop" volume={0.4} />
      {Array.from({ length: 34 }).map((_, i) => {
        // ticks accelerate with the counter (ease.in → denser near the end)
        const t = Math.round(B.start + (B.year - B.start) * Math.pow(i / 34, 0.55));
        return <Sfx key={`t${i}`} at={t} name="tick" volume={0.25} durationInFrames={8} />;
      })}
      {Array.from({ length: STEPS }).map((_, i) => {
        const d = 1 + ((i + 0.3) / STEPS) * 364;
        const t = Math.round(B.start + (B.year - B.start) * Math.sqrt((d - 1) / 364));
        return <Sfx key={`s${i}`} at={t} name="step" volume={0.35} durationInFrames={10} />;
      })}
      <Sfx at={B.nobody} name="whoosh" volume={0.35} />
      <Sfx at={B.compound} name="pop" volume={0.4} />
      <Sfx at={B.riser} name="riser" volume={0.45} />
      <Sfx at={B.year} name="boom" volume={0.8} />
      <Sfx at={B.year} name="ding" volume={0.7} />
      <Sfx at={B.year + 18} name="thud" volume={0.35} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

/** Central platform with a staircase rising left (gold) and one falling right (red). `lit` = steps passed. */
const StairsTwoWay: React.FC<{ lit: number }> = ({ lit }) => {
  const block = (x: number, y: number, w: number, color: string | null, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={G - y} fill="#1b2028" />
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={color ?? "#4a5361"} strokeWidth={color ? 4 : 2} strokeLinecap="round" opacity={color ? 0.95 : 1} />
    </g>
  );
  return (
    <AbsoluteFill>
      <svg width={VIDEO.width} height={VIDEO.height}>
        {block(PL, TOP, PR - PL, null, "p")}
        {Array.from({ length: STEPS }).map((_, k) => {
          const i = k + 1;
          const on = lit >= i - 0.4;
          return (
            <React.Fragment key={i}>
              {block(PL - i * SW, TOP - i * SH, SW, on ? COLORS.gold : null, `u${i}`)}
              {block(PR + (i - 1) * SW, TOP + i * SH, SW, on ? COLORS.red : null, `d${i}`)}
            </React.Fragment>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
