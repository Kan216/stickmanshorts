import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ChalkFilter } from "../lib/chalkFilter";
import { CHALK, CHALK_FONTS } from "./theme";

/**
 * ChalkTalk's presenter: a big-headed chalk stick figure who explains.
 * Drawn in design units (feet at 0,0, height 100, facing +x) then scaled/mirrored.
 * Everything is a pure function of props + frame (deterministic).
 */

/* ---------------- gestures (arms) ---------------- */

/** Arm angles in degrees. a = upper arm from straight-down toward the outside; b = extra rotation of the forearm. */
export type Arm = { a: number; b: number; hand: "open" | "point" | "fist" };
export type ArmPose = { front: Arm; back: Arm };

const arm = (a: number, b: number, hand: Arm["hand"] = "open"): Arm => ({ a, b, hand });

export const GESTURES = {
  idle: { front: arm(14, 4), back: arm(14, 4) },
  /** one hand up, palm open — "so here's the thing" */
  explain: { front: arm(42, 88), back: arm(14, 6) },
  /** both palms up and out */
  open: { front: arm(48, 66), back: arm(48, 66) },
  /** index finger up — making a point */
  pointUp: { front: arm(85, 80, "point"), back: arm(14, 6) },
  /** arm out toward the board, palm open (facing side) */
  present: { front: arm(84, 8), back: arm(16, 6) },
  presentHigh: { front: arm(118, 10, "point"), back: arm(16, 6) },
  /** hand on chin — thinking */
  chin: { front: arm(30, -205, "fist"), back: arm(40, -150, "fist") },
  /** hands on cheeks — surprised */
  cheeks: { front: arm(70, -235), back: arm(70, -235) },
  /** both arms up */
  cheer: { front: arm(100, 40), back: arm(100, 40) },
  wave: { front: arm(100, 45), back: arm(14, 6) },
  shrug: { front: arm(62, 82), back: arm(62, 82) },
} satisfies Record<string, ArmPose>;

export type GestureName = keyof typeof GESTURES;

export const lerpArms = (p: ArmPose, q: ArmPose, t: number): ArmPose => {
  const l = (x: Arm, y: Arm): Arm => ({ a: x.a + (y.a - x.a) * t, b: x.b + (y.b - x.b) * t, hand: t < 0.5 ? x.hand : y.hand });
  return { front: l(p.front, q.front), back: l(p.back, q.back) };
};

/* ---------------- faces ---------------- */

export type Expression = "neutral" | "talk" | "thinking" | "surprised" | "happy" | "idea" | "confused";
export type Effect = "none" | "lines" | "question" | "exclaim" | "bulb" | "sparkle" | "dots";

export type TeacherProps = {
  x: number;
  ground: number;
  height: number;
  facing?: 1 | -1;
  arms?: ArmPose | GestureName;
  expression?: Expression;
  /** 0 = closed, 1 = wide open (drive from the voice-over) */
  mouth?: number;
  effect?: Effect;
  /** 0→1 pop-in of the effect */
  effectT?: number;
  /** head tilt, degrees */
  tilt?: number;
  canvas: { w: number; h: number };
  /** soft chalk smudge under the feet */
  shadow?: boolean;
  /** stroke thickness multiplier */
  weight?: number;
};

const P = (x: number, y: number) => ({ x, y });
const rad = (d: number) => (d * Math.PI) / 180;

// design-unit skeleton
const HEAD = { x: 0, y: -71, r: 27 };
const NECK = P(0, -44);
const SHOULDER = P(0, -40);
const HIP = P(0, -22);
const UPPER = 15.5;
const FORE = 15.5;

const armPts = (arm: Arm, side: 1 | -1) => {
  const t1 = rad(arm.a);
  const t2 = rad(arm.a + arm.b);
  const sx = side === 1 ? 1.5 : -1.5;
  const s = P(SHOULDER.x + sx, SHOULDER.y);
  const e = P(s.x + Math.sin(t1) * UPPER * side, s.y + Math.cos(t1) * UPPER);
  const h = P(e.x + Math.sin(t2) * FORE * side, e.y + Math.cos(t2) * FORE);
  return { s, e, h, dir: P(Math.sin(t2) * side, Math.cos(t2)) };
};

export const Teacher: React.FC<TeacherProps> = ({
  x,
  ground,
  height,
  facing = -1,
  arms = "idle",
  expression = "neutral",
  mouth = 0,
  effect = "none",
  effectT = 1,
  tilt = 0,
  canvas,
  shadow = true,
  weight = 1,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const k = height / 100;
  const pose = typeof arms === "string" ? GESTURES[arms] : arms;
  const sw = 2.9 * weight; // stroke in design units
  const W = CHALK.white;

  // idle breathing + bob
  const breathe = Math.sin(frame / 15);
  const headY = HEAD.y + breathe * 0.5;

  // blink every ~3.4s for 4 frames (not while eyes are closed anyway)
  const blink = frame % 103 < 4 && frame % 103 >= 0 && frame > 5;

  const F = armPts(pose.front, 1);
  const B = armPts(pose.back, -1);

  const hand = (pt: ReturnType<typeof armPts>, h: Arm["hand"]) => {
    if (h === "point") {
      const tip = P(pt.h.x + pt.dir.x * 6.5, pt.h.y + pt.dir.y * 6.5);
      return (
        <g>
          <circle cx={pt.h.x} cy={pt.h.y} r={3.4} fill={CHALK.board} stroke={W} strokeWidth={sw * 0.9} />
          <path d={`M${pt.h.x + pt.dir.x * 2.5} ${pt.h.y + pt.dir.y * 2.5} L${tip.x} ${tip.y}`} stroke={W} strokeWidth={sw * 1.05} strokeLinecap="round" />
        </g>
      );
    }
    const r = h === "fist" ? 3.2 : 3.9;
    // open mitten: circle + little thumb bump
    const th = P(pt.h.x - pt.dir.y * 3.4 + pt.dir.x * 1.5, pt.h.y + pt.dir.x * 3.4 + pt.dir.y * 1.5);
    return (
      <g>
        <circle cx={pt.h.x + pt.dir.x * 1.5} cy={pt.h.y + pt.dir.y * 1.5} r={r} fill={CHALK.board} stroke={W} strokeWidth={sw * 0.9} />
        {h === "open" && <circle cx={th.x} cy={th.y} r={1.5} fill={CHALK.board} stroke={W} strokeWidth={sw * 0.7} />}
      </g>
    );
  };

  const limb = (pt: ReturnType<typeof armPts>) => `M${pt.s.x} ${pt.s.y} L${pt.e.x} ${pt.e.y} L${pt.h.x} ${pt.h.y}`;

  /* ---- face (head-local, facing +x) ---- */
  const ex1 = 2;
  const ex2 = 15;
  const ey = -3;
  const eyeRy = expression === "surprised" ? 5.8 : 4.8;
  const eyeRx = expression === "surprised" ? 3.6 : 3.1;
  const look = expression === "thinking" ? P(1.2, -1.6) : P(0.6, 0);
  const closedEyes = expression === "happy";

  const eyes = closedEyes ? (
    <g stroke={W} strokeWidth={sw * 0.9} fill="none" strokeLinecap="round">
      <path d={`M${ex1 - 4.2} ${ey + 1} Q${ex1} ${ey - 4.8} ${ex1 + 4.2} ${ey + 1}`} />
      <path d={`M${ex2 - 4.2} ${ey + 1} Q${ex2} ${ey - 4.8} ${ex2 + 4.2} ${ey + 1}`} />
    </g>
  ) : (
    <g fill={W}>
      {[ex1, ex2].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx + look.x} cy={ey + look.y} rx={eyeRx} ry={blink ? 0.5 : eyeRy} />
          {!blink && <circle cx={cx + look.x + 1} cy={ey + look.y - 1.8} r={1} fill={CHALK.board} />}
        </g>
      ))}
    </g>
  );

  const brows = (() => {
    const s = { stroke: W, strokeWidth: sw * 0.8, strokeLinecap: "round" as const, fill: "none" };
    switch (expression) {
      case "thinking":
        return <path d={`M${ex1 - 3} ${ey - 9} L${ex1 + 3} ${ey - 10.5} M${ex2 - 3} ${ey - 11.5} L${ex2 + 3} ${ey - 9.5}`} {...s} />;
      case "confused":
        return <path d={`M${ex1 - 3} ${ey - 10.5} L${ex1 + 3} ${ey - 9} M${ex2 - 3} ${ey - 12.5} Q${ex2} ${ey - 14} ${ex2 + 3.5} ${ey - 11.5}`} {...s} />;
      case "surprised":
      case "idea":
        return <path d={`M${ex1 - 3} ${ey - 11.5} Q${ex1} ${ey - 14} ${ex1 + 3} ${ey - 11.5} M${ex2 - 3} ${ey - 11.5} Q${ex2} ${ey - 14} ${ex2 + 3} ${ey - 11.5}`} {...s} />;
      default:
        return null;
    }
  })();

  const mx = 9.5;
  const my = 10;
  const mouthEl = (() => {
    const st = { stroke: W, strokeWidth: sw * 0.85, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
    const open = Math.max(0, Math.min(1, mouth));
    if (expression === "surprised")
      return <ellipse cx={mx} cy={my + 0.5} rx={3.6 + open * 0.6} ry={4.8 + open * 1.2} fill={CHALK.pink} {...st} />;
    if (expression === "thinking" && open < 0.1) return <path d={`M${mx - 3} ${my + 0.5} L${mx + 3} ${my - 0.5}`} fill="none" {...st} />;
    if (expression === "confused" && open < 0.1) return <path d={`M${mx - 4} ${my + 1.5} Q${mx} ${my - 1.5} ${mx + 4} ${my + 1.5}`} fill="none" {...st} />;
    const big = expression === "happy" || expression === "idea";
    const depth = big ? Math.max(7, 4 + open * 5) : open > 0.05 ? 2 + open * 6.5 : 0;
    const w = big ? 7 : 5.2 + open * 1;
    if (depth === 0) return <path d={`M${mx - 5} ${my - 0.5} Q${mx} ${my + 4} ${mx + 5} ${my - 0.5}`} fill="none" {...st} />;
    return <path d={`M${mx - w} ${my - 0.6} L${mx + w} ${my - 0.6} Q${mx + w * 0.6} ${my + depth} ${mx} ${my + depth} Q${mx - w * 0.6} ${my + depth} ${mx - w} ${my - 0.6} Z`} fill={CHALK.pink} {...st} />;
  })();

  /* ---- screen-space anchor for effects ---- */
  const hx = x + facing * HEAD.x * k;
  const hy = ground + headY * k;
  const R = HEAD.r * k;
  const ep = Math.max(0, Math.min(1, effectT));
  const pop = ep < 1 ? Math.min(1.15, Math.sin((ep * Math.PI) / 2) * 1.15) : 1;
  const wob = Math.sin(frame / 5) * 3;
  const fx = hx + facing * R * 0.95;
  const fy = hy - R * 1.05;

  const effectEl = (() => {
    if (effect === "none" || ep <= 0) return null;
    const txt = (s: string, color: string, size: number) => (
      <text
        x={fx}
        y={fy + wob * 0.3}
        fontFamily={CHALK_FONTS.title}
        fontSize={size}
        fill={color}
        textAnchor="middle"
        transform={`rotate(${facing * 12} ${fx} ${fy})`}
        opacity={pop}
      >
        {s}
      </text>
    );
    switch (effect) {
      case "question":
        return txt("?", CHALK.orange, R * 1.5 * pop);
      case "exclaim":
        return txt("!", CHALK.red, R * 1.6 * pop);
      case "dots":
        return txt("...", CHALK.white, R * 1.0);
      case "lines": {
        const L = R * 0.42 * pop;
        const cx = hx + facing * R * 1.18;
        const cy = hy - R * 0.55;
        return (
          <g stroke={CHALK.yellow} strokeWidth={R * 0.1} strokeLinecap="round">
            {[-40, 0, 40].map((d, i) => {
              const a = rad(d - 20);
              const ux = Math.cos(a) * facing;
              const uy = Math.sin(a);
              const o = R * 0.15;
              return <path key={i} d={`M${cx + ux * o} ${cy + uy * o} L${cx + ux * (o + L)} ${cy + uy * (o + L)}`} />;
            })}
          </g>
        );
      }
      case "bulb": {
        const bx = hx + facing * R * 0.7;
        const by = hy - R * 1.6 + wob * 0.3;
        const r = R * 0.38 * pop;
        return (
          <g strokeLinecap="round">
            {[0, 50, 100, 150, 200, 250].map((d, i) => {
              const a = rad(d - 200);
              return (
                <path
                  key={i}
                  d={`M${bx + Math.cos(a) * r * 1.5} ${by + Math.sin(a) * r * 1.5} L${bx + Math.cos(a) * r * 2.1} ${by + Math.sin(a) * r * 2.1}`}
                  stroke={CHALK.yellow}
                  strokeWidth={R * 0.08}
                />
              );
            })}
            <circle cx={bx} cy={by} r={r} fill={CHALK.yellow} opacity={0.9} />
            <rect x={bx - r * 0.45} y={by + r * 0.8} width={r * 0.9} height={r * 0.6} rx={r * 0.15} fill={CHALK.dim} />
          </g>
        );
      }
      case "sparkle": {
        const star = (sx: number, sy: number, s: number, key: number) => (
          <path
            key={key}
            d={`M${sx} ${sy - s} Q${sx + s * 0.2} ${sy - s * 0.2} ${sx + s} ${sy} Q${sx + s * 0.2} ${sy + s * 0.2} ${sx} ${sy + s} Q${sx - s * 0.2} ${sy + s * 0.2} ${sx - s} ${sy} Q${sx - s * 0.2} ${sy - s * 0.2} ${sx} ${sy - s} Z`}
            fill={CHALK.yellow}
          />
        );
        const tw = (i: number) => (0.75 + 0.25 * Math.sin(frame / 4 + i * 2)) * pop;
        return (
          <g>
            {star(hx + facing * R * 1.25, hy - R * 0.9, R * 0.32 * tw(0), 0)}
            {star(hx - facing * R * 1.2, hy + R * 0.2, R * 0.22 * tw(1), 1)}
            {star(hx + facing * R * 1.5, hy + R * 0.6, R * 0.18 * tw(2), 2)}
          </g>
        );
      }
    }
    return null;
  })();

  return (
    <AbsoluteFill>
      <svg width={canvas.w} height={canvas.h}>
        <defs>
          <ChalkFilter id={`tch-${id}`} seed={1 + (Math.floor(frame / 4) % 6)} rough={0.9} grain={0.7} />
        </defs>
        {shadow && <ellipse cx={x} cy={ground + 1.5 * k} rx={22 * k} ry={3.2 * k} fill="#ffffff" opacity={0.08} />}
        <g filter={`url(#tch-${id})`}>
          <g transform={`translate(${x} ${ground}) scale(${facing * k} ${k})`} fill="none" stroke={W} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            {/* back arm behind body */}
            <path d={limb(B)} opacity={0.85} />
            {hand(B, pose.back.hand)}
            {/* legs + body */}
            <path d={`M${HIP.x - 0.5} ${HIP.y} L${-8.5} ${-0.5} M${HIP.x + 0.5} ${HIP.y} L${8.5} ${-0.5}`} />
            <path d={`M${NECK.x} ${NECK.y + 1} L${HIP.x} ${HIP.y}`} />
            {/* head */}
            <g transform={`rotate(${tilt} ${HEAD.x} ${headY})`}>
              <circle cx={HEAD.x} cy={headY} r={HEAD.r} fill={CHALK.board} />
              <g transform={`translate(${HEAD.x} ${headY}) scale(1.0)`} stroke="none">
                {eyes}
                {brows}
                {mouthEl}
              </g>
            </g>
            {/* front arm over body */}
            <path d={limb(F)} />
            {hand(F, pose.front.hand)}
          </g>
          {effectEl}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
