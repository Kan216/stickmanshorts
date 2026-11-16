/**
 * "Same 24 Hours" (18s, 720x1280 @30fps) — A/B split screen.
 * Top panel: a figure slumped on a couch scrolling a glowing phone (HOURS SCROLLED climbs).
 * Bottom panel: a figure alternating reading and squats (SKILLS climbs).
 * Time-lapse to 1 YEAR LATER: bottom glows gold, top is dim. Storyboard: storyboards/same-24-hours.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline } from "../../components/Text";
import { Particles, Spotlight } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, pose, Pose, solve } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { COLORS, VIDEO } from "../../lib/theme";
import { DayPill, PanelCounter, SplitPanel as Panel } from "../../components/Split";

export const SAME_24_HOURS_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  split: sec(1.5), // "ONE SCROLLS. ONE BUILDS."
  train: sec(5), // bottom switches from reading to training
  lapse: sec(8.5), // time-lapse starts, "1 YEAR LATER..."
  year: sec(12.5), // payoff: bottom gold, top dim
  punch: sec(14.5),
};

// ---- LAYOUT ---------------------------------------------------------------
const TOP_PANEL = { y: 205, h: 345 };
const BOT_PANEL = { y: 570, h: 365 };
const G_TOP = 520;
const G_BOT = 905;
const H = 200;
const SEAT = 0.25 * H; // couch / bench seat height

// ---- POSES ----------------------------------------------------------------
const phoneSit = pose({ dy: 0.23, torso: 14, head: 30, frontShoulder: 45, frontElbow: 85, backShoulder: 35, backElbow: 90, frontHip: 88, backHip: 82, frontKnee: 88, backKnee: 84 });
const readSit = pose({ dy: 0.23, torso: -2, head: 18, frontShoulder: 55, frontElbow: 75, backShoulder: 48, backElbow: 82, frontHip: 88, backHip: 82, frontKnee: 88, backKnee: 84 });
const squatUp = pose({ head: -4, frontShoulder: 88, backShoulder: 84, frontElbow: 0, backElbow: 0 });
const squatDown = pose({ dy: 0.17, torso: 22, head: -18, frontShoulder: 92, backShoulder: 88, frontElbow: 0, backElbow: 0, frontHip: 95, backHip: 88, frontKnee: 110, backKnee: 104 });

/** Day counter: 1 → 365 during the time-lapse. */
const dayAt = (f: number) => Math.round(interpolate(f, [B.lapse, B.year], [1, 365], { ...clamp, easing: ease.in }));

export const Same24Hours: React.FC = () => {
  const frame = useCurrentFrame();
  const lapse = frame >= B.lapse;
  const done = frame >= B.year;
  const day = dayAt(frame);
  const speed = lapse && !done ? 1 + 3 * progress(frame, B.lapse, B.year, ease.in) : 1;

  // ---- TOP: scroller ----
  const scrollFlick = Math.sin((frame / 30) * Math.PI * 2 * 1.2 * speed);
  const tPose = done
    ? addPose(pose({ ...phoneSit, head: 38, torso: 20 }), breathe(frame, 0.5))
    : addPose(phoneSit, { frontElbow: scrollFlick * 4, ...breathe(frame, 0.6) });
  const tX = 250;
  const tSk = solve(tPose, tX, G_TOP, H, 1);
  const hours = Math.round(
    frame < B.lapse ? interpolate(frame, [B.split, B.lapse], [0, 4], clamp) : interpolate(day, [1, 365], [4, 1460], clamp),
  );
  const topDim = interpolate(frame, [B.lapse, B.year + 15], [1, 0.4], clamp);

  // ---- BOTTOM: builder ----
  const bX = 360;
  const training = frame >= B.train || (lapse && Math.floor((frame - B.lapse) / 20) % 2 === 1);
  const reading = !done && (frame < B.train || (lapse && !training));
  const squatT = (Math.sin(((frame - B.train) / 30) * Math.PI * 2 * 0.8 * speed - Math.PI / 2) + 1) / 2;
  let bPose: Pose;
  if (done) bPose = addPose(lerpPose(squatUp, pose({ head: -15, frontShoulder: 150, backShoulder: 145, frontElbow: 25, backElbow: 25 }), progress(frame, B.year, B.year + 15, ease.out)), breathe(frame));
  else if (reading) bPose = addPose(readSit, breathe(frame, 0.6));
  else bPose = lerpPose(squatUp, squatDown, squatT);
  const bSk = solve(bPose, bX, G_BOT, H, 1);
  const skills = Math.round(
    frame < B.lapse ? interpolate(frame, [B.split, B.lapse], [0, 1], clamp) : interpolate(day, [1, 365], [1, 12], clamp),
  );
  const gold = progress(frame, B.year - 6, B.year + 12, ease.out);
  const bColor = gold > 0.5 ? "gold" : "teal";

  return (
    <AbsoluteFill>
      <Backdrop mood="night" floor={false} glowStrength={0.6} />

      {/* ---- TOP PANEL ---- */}
      <Panel {...TOP_PANEL} accent={COLORS.blue} dim={topDim}>
        <Couch x={tX - 40} ground={G_TOP} />
      </Panel>
      <AbsoluteFill style={{ opacity: topDim }}>
        <Spotlight x={tSk.front.hand.x + 6} y={tSk.front.hand.y - 6} r={90} color="blue" strength={0.9} />
      </AbsoluteFill>
      <Stickman x={tX} y={G_TOP} height={H} pose={tPose} color={done ? "dim" : "blue"} expression={done ? "sad" : "neutral"} glow={topDim} opacity={0.4 + 0.6 * topDim} />
      <Phone x={tSk.front.hand.x} y={tSk.front.hand.y} on={0.7 + 0.3 * Math.abs(scrollFlick)} dim={topDim} />
      <PanelCounter y={TOP_PANEL.y + 18} label="HOURS SCROLLED" value={hours.toLocaleString("en-US")} color={COLORS.blue} dim={done} />

      {/* ---- BOTTOM PANEL ---- */}
      <Panel {...BOT_PANEL} accent={done ? COLORS.gold : COLORS.teal} dim={1} glow={gold}>
        {reading && <Bench x={bX - 40} ground={G_BOT} />}
      </Panel>
      {done && <Spotlight x={bX} y={G_BOT - H * 0.6} r={240} color="gold" strength={gold} />}
      {done && <Particles color="gold" count={24} area={{ x: 120, y: BOT_PANEL.y + 40, w: 480, h: BOT_PANEL.h - 50 }} speed={1.2} size={3} />}
      <Stickman x={bX} y={G_BOT} height={H} pose={bPose} color={bColor} expression={done ? "happy" : "neutral"} glow={1 + 0.8 * gold} />
      {reading && <Book x={(bSk.front.hand.x + bSk.back.hand.x) / 2} y={(bSk.front.hand.y + bSk.back.hand.y) / 2} />}
      <PanelCounter y={BOT_PANEL.y + 18} label="SKILLS" value={String(skills)} color={gold > 0.5 ? COLORS.gold : COLORS.teal} glow={done} />

      {/* day pill on the seam */}
      {lapse && <DayPill text={`DAY ${day}`} gold={done} />}

      {/* ---- TEXT ---- */}
      <Headline text="SAME 24 HOURS." start={B.hook} end={B.split} size={48} y={135} />
      <Headline text={"ONE {blue:SCROLLS.}\nONE {teal:BUILDS.}"} start={B.split} end={B.lapse} size={40} y={110} />
      <Headline text="1 YEAR LATER..." start={B.lapse} end={B.punch} size={44} y={135} />
      <Headline text={"SAME 24 HOURS.\n{gold:DIFFERENT LIFE.}"} start={B.punch} size={44} y={110} glow />
      <Watermark step={Math.min(3, Math.floor(frame / (SAME_24_HOURS_DURATION / 4)))} />
      <Vignette strength={0.5} />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.28} fadeOut={60} />
      <Sfx at={B.hook} name="boom" volume={0.6} />
      <Sfx at={B.split} name="pop" volume={0.4} />
      {[0.4, 1.4, 2.4, 3.4, 4.4].map((t, i) => (
        <Sfx key={`sc${i}`} at={B.split + sec(t)} name="tick" volume={0.25} durationInFrames={8} />
      ))}
      <Sfx at={B.train} name="whoosh" volume={0.35} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`sq${i}`} at={B.train + sec(0.62 + i * 1.25)} name="thud" volume={0.22} durationInFrames={12} />
      ))}
      <Sfx at={B.lapse} name="glitch" volume={0.4} />
      {Array.from({ length: 24 }).map((_, i) => (
        <Sfx key={`d${i}`} at={Math.round(B.lapse + (B.year - B.lapse) * Math.pow(i / 24, 0.55))} name="tick" volume={0.22} durationInFrames={8} />
      ))}
      <Sfx at={B.year - sec(2)} name="riser" volume={0.45} />
      <Sfx at={B.year} name="boom" volume={0.75} />
      <Sfx at={B.year} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

// ---- small scene pieces (local to this short) ----------------------------
const Svg: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <AbsoluteFill style={{ opacity }}>
    <svg width={VIDEO.width} height={VIDEO.height}>{children}</svg>
  </AbsoluteFill>
);

const Couch: React.FC<{ x: number; ground: number }> = ({ x, ground }) => (
  <g>
    <rect x={x - 30} y={ground - SEAT} width={150} height={SEAT} rx={10} fill="#1d2330" stroke="#3b4659" strokeWidth={2} />
    <rect x={x - 46} y={ground - SEAT - 70} width={26} height={SEAT + 70} rx={10} fill="#1d2330" stroke="#3b4659" strokeWidth={2} />
  </g>
);

const Bench: React.FC<{ x: number; ground: number }> = ({ x, ground }) => (
  <g>
    <rect x={x - 30} y={ground - SEAT} width={120} height={10} rx={4} fill="#2a2f38" stroke="#4a5361" strokeWidth={2} />
    <rect x={x - 20} y={ground - SEAT} width={8} height={SEAT} fill="#2a2f38" />
    <rect x={x + 70} y={ground - SEAT} width={8} height={SEAT} fill="#2a2f38" />
  </g>
);

const Phone: React.FC<{ x: number; y: number; on: number; dim: number }> = ({ x, y, on, dim }) => (
  <Svg opacity={0.35 + 0.65 * dim}>
    <rect x={x - 4} y={y - 34} width={22} height={38} rx={4} fill={COLORS.blue} opacity={on} />
    <rect x={x - 4} y={y - 34} width={22} height={38} rx={4} fill="none" stroke="#d9ecff" strokeWidth={2} />
  </Svg>
);

const Book: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <Svg>
    <path d={`M${x - 26} ${y - 22} L${x} ${y - 16} L${x + 26} ${y - 22} L${x + 26} ${y + 6} L${x} ${y + 12} L${x - 26} ${y + 6} Z`} fill="#0d1a18" stroke={COLORS.teal} strokeWidth={3} strokeLinejoin="round" />
    <line x1={x} y1={y - 16} x2={x} y2={y + 12} stroke={COLORS.teal} strokeWidth={2} />
  </Svg>
);
