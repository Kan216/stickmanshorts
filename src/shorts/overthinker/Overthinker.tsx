/**
 * "Overthinker vs Doer" (18s, 720x1280 @30fps) — versus lanes.
 * Left: thought clouds multiply until they fill his lane (THOUGHTS → 1000, ACTIONS 0).
 * Right: the doer stacks 12 finished tasks (boxes with checkmarks), ACTIONS 12/12.
 * Storyboard: storyboards/overthinker.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline } from "../../components/Text";
import { LaneLight, Particles, Spotlight, ThoughtCloud } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, pose, Pose, poseAt, POSES, solve, tremble } from "../../lib/pose";
import { clamp, ease, pop, progress, rand, sec } from "../../lib/anim";
import { COLORS, FONTS, LAYOUT, VIDEO } from "../../lib/theme";

export const OVERTHINKER_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  start: sec(1.5),
  does: sec(5),
  spiral: sec(8.5), // overthinker sinks to the floor
  verdict: sec(12.3),
  punch: sec(14),
};
const TASKS = 12;
const PERIOD = 26; // frames per task
const taskStart = (i: number) => B.start + i * PERIOD;

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const LX = 185;
const RX = 500;
const H = 210;
const STACK_X = 625;
const BOX = { w: 50, h: 34 };
const slotY = (i: number) => G - (i + 1) * BOX.h;

// ---- CLOUDS: fill the left lane from the top down --------------------------
const WORDS = ["WHAT IF?", "NOT READY", "LATER", "?", "FAIL?", "TOO LATE", "WHAT IF?", "THEY'LL LAUGH", "MAYBE", "?!", "NOT YET", "WHY ME", "RISKY", "WHAT IF?"];
const CLOUDS = (() => {
  const out: { x: number; y: number; w: number; h: number; text: string }[] = [];
  let n = 0;
  for (let r = 0; r < 10; r++) {
    const y = 385 + r * 52;
    const xs = r % 2 ? [90, 195, 280] : [135, 245];
    for (const x of xs) {
      out.push({ x: x + (rand(n * 3) - 0.5) * 30, y: y + (rand(n * 3 + 1) - 0.5) * 20, w: 118 + rand(n * 3 + 2) * 32, h: 80 + rand(n) * 20, text: WORDS[n % WORDS.length] });
      n++;
    }
  }
  return out;
})();
const cloudAt = (i: number) => Math.round(interpolate(i, [0, CLOUDS.length - 1], [B.start + 6, B.verdict - 12], { easing: (t) => Math.pow(t, 0.62) }));

// ---- POSES ----------------------------------------------------------------
const holdBox = pose({ dy: 0.21, torso: 35, head: 10, frontShoulder: 80, backShoulder: 72, frontElbow: 20, backElbow: 25, frontHip: 115, backHip: 105, frontKnee: 100, backKnee: 95 });
const toss = pose({ head: -18, frontShoulder: 150, backShoulder: 145, frontElbow: 15, backElbow: 20, frontHip: 6, backHip: -8 });

const doer = (f: number): { pose: Pose; held: number | null } => {
  if (f >= B.verdict) return { pose: addPose(poseAt(f, [{ f: B.verdict, pose: "standTall" }, { f: B.verdict + 12, pose: "victory", easing: ease.out }]), breathe(f)), held: null };
  const i = Math.floor((f - B.start) / PERIOD);
  if (f < B.start || i >= TASKS) return { pose: addPose(POSES.standTall, breathe(f)), held: null };
  const t = f - taskStart(i);
  const p = poseAt(t, [
    { f: 0, pose: "standTall" },
    { f: 7, pose: holdBox },
    { f: 15, pose: toss, easing: ease.out },
    { f: 25, pose: "standTall" },
  ]);
  return { pose: p, held: t >= 5 && t < 15 ? i : null };
};

export const Overthinker: React.FC = () => {
  const frame = useCurrentFrame();
  const verdict = frame >= B.verdict;
  const gold = progress(frame, B.verdict, B.verdict + 15, ease.out);
  const placed = Array.from({ length: TASKS }).filter((_, i) => frame >= taskStart(i) + 17).length;
  const thoughts = Math.round(interpolate(frame, [B.start, B.verdict - 6], [0, 1000], { ...clamp, easing: (t) => Math.pow(t, 1.8) }));
  const leftDim = 1 - 0.45 * gold;

  // overthinker
  const otPose = addPose(
    poseAt(frame, [
      { f: 0, pose: "standTall" },
      { f: B.start, pose: "think" },
      { f: B.spiral, pose: "think" },
      { f: B.spiral + 18, pose: "sitHugKnees", easing: ease.out },
    ]),
    { ...breathe(frame), ...tremble(frame, progress(frame, B.does, B.verdict) * 2), head: frame < B.spiral ? Math.sin(frame / 9) * 10 : 0 },
  );

  const d = doer(frame);
  const dSk = solve(d.pose, RX, G, H, 1);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={verdict ? "gold" : undefined} glowStrength={0.5 + 0.4 * gold} />
      <LaneLight x={LX} width={300} color="steel" strength={0.6 * leftDim} />
      <LaneLight x={540} width={300} color="gold" strength={0.5 + 0.6 * gold} />
      <Divider />
      {verdict && <Spotlight x={RX + 40} y={G - 250} r={260} color="gold" strength={gold} />}

      {/* ---- LEFT: overthinker buried by clouds ---- */}
      <Stickman x={LX} y={G} height={H} pose={otPose} color="steel" expression={frame >= B.spiral ? "sad" : "neutral"} glow={0.9 * leftDim} opacity={leftDim} />
      {CLOUDS.map((c, i) => {
        const at = cloudAt(i);
        if (frame < at) return null;
        const s = Math.min(1.08, pop(frame, at));
        const wob = Math.sin(frame / 12 + i) * 3;
        return (
          <AbsoluteFill key={i} style={{ transform: `translate(0px, ${wob}px) scale(${s})`, transformOrigin: `${c.x}px ${c.y}px`, opacity: leftDim }}>
            <ThoughtCloud x={c.x} y={c.y} w={c.w} h={c.h}>
              <text x={c.x} y={c.y + 6} textAnchor="middle" fontFamily={FONTS.headline} fontWeight={800} fontSize={c.text.length > 8 ? 15 : 19} fill={COLORS.steel}>
                {c.text}
              </text>
            </ThoughtCloud>
          </AbsoluteFill>
        );
      })}

      {/* ---- RIGHT: doer stacking finished tasks ---- */}
      <BoxStack count={placed} frame={frame} glow={gold} />
      {d.held !== null && (() => {
        const t = frame - taskStart(d.held);
        const hx = (dSk.front.hand.x + dSk.back.hand.x) / 2;
        const hy = (dSk.front.hand.y + dSk.back.hand.y) / 2;
        const fly = progress(t, 11, 17, ease.out);
        const x = hx + (STACK_X - hx) * fly;
        const y = hy + (slotY(d.held) + BOX.h / 2 - hy) * fly - Math.sin(fly * Math.PI) * 40;
        return <Box x={x} y={y} checked={false} />;
      })()}
      {frame >= B.start && frame < taskStart(TASKS - 1) + 5 && <Box x={RX + 55} y={G - BOX.h / 2} checked={false} dim />}
      <Stickman x={RX} y={G} height={H} pose={d.pose} color="gold" expression={verdict ? "happy" : "neutral"} glow={1 + 0.9 * gold} />
      {verdict && <Particles color="gold" count={26} area={{ x: 380, y: 420, w: 320, h: 480 }} speed={1.2} size={3} />}

      {/* ---- HUD ---- */}
      <LaneHud x={LX} name="OVERTHINKER" color={COLORS.steel} rows={[["THOUGHTS", thoughts.toLocaleString("en-US")], ["ACTIONS", "0"]]} dim={verdict} />
      <LaneHud x={540} name="DOER" color={COLORS.gold} rows={[["ACTIONS", `${placed}/${TASKS}`]]} glow={verdict} />

      {/* ---- TEXT ---- */}
      <Headline text="{steel:OVERTHINKER} VS {gold:DOER}" start={B.hook} end={B.start} size={42} y={110} />
      <Headline text="ONE {steel:THINKS}..." start={B.start} end={B.does} size={44} y={110} />
      <Headline text="ONE {gold:DOES.}" start={B.does} end={B.spiral} size={46} y={110} />
      <Headline text="WHAT IF... {steel:WHAT IF...}" start={B.spiral} end={B.verdict} size={42} y={110} />
      <Headline text="1000 THOUGHTS. {steel:0 ACTIONS.}" start={B.verdict} end={B.punch} size={38} y={110} />
      <Headline text="{gold:ACTION} KILLS FEAR." start={B.punch} size={52} y={110} glow />
      <Watermark step={Math.min(3, Math.floor(frame / (OVERTHINKER_DURATION / 4)))} />
      <Vignette strength={0.55} />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={60} />
      <Sfx at={B.hook} name="boom" volume={0.55} />
      {CLOUDS.map((_, i) => (i % 3 === 0 ? <Sfx key={`c${i}`} at={cloudAt(i)} name="glitch" volume={0.12} durationInFrames={8} /> : null))}
      {Array.from({ length: TASKS }).map((_, i) => (
        <React.Fragment key={`t${i}`}>
          <Sfx at={taskStart(i) + 11} name="whoosh" volume={0.18} durationInFrames={10} />
          <Sfx at={taskStart(i) + 17} name="pop" volume={0.4} />
          <Sfx at={taskStart(i) + 19} name="tick" volume={0.3} durationInFrames={8} />
        </React.Fragment>
      ))}
      <Sfx at={B.spiral} name="heartbeat" volume={0.6} />
      <Sfx at={B.spiral + sec(1.6)} name="heartbeat" volume={0.6} />
      <Sfx at={B.verdict - sec(2)} name="riser" volume={0.4} />
      <Sfx at={B.verdict} name="boom" volume={0.75} />
      <Sfx at={B.verdict} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

const Divider: React.FC = () => (
  <AbsoluteFill>
    <svg width={VIDEO.width} height={VIDEO.height}>
      <line x1={360} y1={330} x2={360} y2={G} stroke="#3a414c" strokeWidth={2} strokeDasharray="8 10" />
    </svg>
  </AbsoluteFill>
);

const Box: React.FC<{ x: number; y: number; checked: boolean; dim?: boolean; glow?: number }> = ({ x, y, checked, dim, glow = 0 }) => (
  <AbsoluteFill>
    <svg width={VIDEO.width} height={VIDEO.height}>
      <rect x={x - BOX.w / 2} y={y - BOX.h / 2} width={BOX.w} height={BOX.h} rx={4} fill={dim ? "#1b2028" : "#2a2312"} stroke={COLORS.gold} strokeOpacity={dim ? 0.3 : 0.6 + 0.4 * glow} strokeWidth={2} />
      {checked && <path d={`M${x - 11} ${y} l7 7 l14 -14`} stroke={COLORS.gold} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  </AbsoluteFill>
);

const BoxStack: React.FC<{ count: number; frame: number; glow: number }> = ({ count, frame, glow }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const at = taskStart(i) + 17;
      const s = pop(frame, at);
      return (
        <AbsoluteFill key={i} style={{ transform: `scale(${0.85 + 0.15 * s})`, transformOrigin: `${STACK_X}px ${slotY(i) + BOX.h / 2}px` }}>
          <Box x={STACK_X} y={slotY(i) + BOX.h / 2} checked glow={glow} />
        </AbsoluteFill>
      );
    })}
  </>
);

const LaneHud: React.FC<{ x: number; name: string; color: string; rows: [string, string][]; dim?: boolean; glow?: boolean }> = ({ x, name, color, rows, dim, glow }) => (
  <AbsoluteFill style={{ top: 185, left: x - 150, width: 300, height: "auto", alignItems: "center", fontFamily: FONTS.headline, opacity: dim ? 0.5 : 1 }}>
    <div style={{ color, fontSize: 26, fontWeight: 800, letterSpacing: 2, textShadow: glow ? `0 0 14px ${color}` : undefined }}>{name}</div>
    {rows.map(([l, v]) => (
      <div key={l} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <span style={{ color: COLORS.steel, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>{l}</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 36, fontWeight: 700, color: COLORS.white, textShadow: glow ? `0 0 16px ${color}` : undefined }}>{v}</span>
      </div>
    ))}
  </AbsoluteFill>
);
