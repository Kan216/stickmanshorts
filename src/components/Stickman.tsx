import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { Pose, Pt, solve, NEUTRAL, POSES, PoseName } from "../lib/pose";
import { COLORS, VIDEO, resolveColor } from "../lib/theme";

export type StickStyle =
  /** coloured outline tube with dark core + glow (neon look) */
  | "neon"
  /** thick filled colour limbs with dark outline and a face (cartoon look) */
  | "solid"
  /** pure black figure, optional rim light (for lit rooms) */
  | "silhouette"
  /** thin single line, no fill (minimal / chalk look) */
  | "line";

export type Expression = "neutral" | "angry" | "happy" | "sad" | "closed" | "dead" | "none";

export type StickmanProps = {
  /** x of the feet (px) */
  x: number;
  /** y of the floor the feet stand on (px) */
  y: number;
  /** full standing height in px (≈ 330 is a good "hero" size at 720x1280) */
  height?: number;
  pose?: Pose | PoseName;
  facing?: 1 | -1;
  /** colour name from theme COLORS or any CSS colour */
  color?: string;
  style?: StickStyle;
  expression?: Expression;
  /** 0 = no glow, 1 = default, 2 = intense */
  glow?: number;
  opacity?: number;
  /** extra rotation of the whole figure around the hip (deg) — tumbling, falling */
  spin?: number;
  /** draw a soft light pool on the floor under the character */
  floorLight?: boolean;
};

const line = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

export const Stickman: React.FC<StickmanProps> = ({
  x,
  y,
  height = 330,
  pose = NEUTRAL,
  facing = 1,
  color = "white",
  style = "neon",
  expression = "neutral",
  glow = 1,
  opacity = 1,
  spin = 0,
  floorLight = false,
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const p = typeof pose === "string" ? POSES[pose] : pose;
  const s = solve(p, x, y, height, facing);
  const c = resolveColor(color);
  const H = height;

  const sw = style === "solid" ? H * 0.062 : style === "line" ? H * 0.018 : H * 0.034;
  const outline = style === "solid" ? H * 0.014 : 0;

  const torsoPath = line([s.hip, s.neck]);
  const arm = (side: "front" | "back") => line([s.shoulder, s[side].elbow, s[side].hand]);
  const leg = (side: "front" | "back") => line([s.hip, s[side].knee, s[side].foot]);

  const bodyColor = style === "silhouette" ? COLORS.ink : c;
  const coreColor = COLORS.ink;

  /** Draw one bone path in the current style (plain function, not a component, to avoid remounts). */
  const bone = (d: string, dim = false) => {
    const o = dim ? (style === "solid" ? 0.85 : 0.5) : 1;
    const common = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, d };
    if (style === "neon")
      return (
        <g opacity={o}>
          <path {...common} stroke={bodyColor} strokeWidth={sw} />
          <path {...common} stroke={coreColor} strokeWidth={sw * 0.42} />
        </g>
      );
    if (style === "solid")
      return (
        <g opacity={o}>
          <path {...common} stroke={shade(c, -0.45)} strokeWidth={sw + outline * 2} />
          <path {...common} stroke={dim ? shade(c, -0.18) : c} strokeWidth={sw} />
        </g>
      );
    if (style === "silhouette")
      return (
        <g opacity={o}>
          {glow > 0 && <path {...common} stroke={c} strokeWidth={sw + 3} opacity={0.35} />}
          <path {...common} stroke={COLORS.ink} strokeWidth={sw} />
        </g>
      );
    return <path {...common} stroke={c} strokeWidth={sw} opacity={o} />;
  };

  const headFill = style === "solid" ? c : coreColor;
  const headStroke = style === "solid" ? shade(c, -0.45) : style === "silhouette" ? (glow > 0 ? c : COLORS.ink) : c;
  const headSW = style === "solid" ? outline * 1.6 : style === "silhouette" ? 2 : style === "line" ? sw : sw * 0.6;

  const eyeColor = style === "solid" ? "#f4f7fb" : style === "silhouette" ? "#f4f7fb" : COLORS.white;

  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 * glow} result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={18 * glow} result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`pool-${id}`}>
            <stop offset="0%" stopColor={c} stopOpacity={0.45} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </radialGradient>
        </defs>
        {floorLight && <ellipse cx={x} cy={y} rx={H * 0.45} ry={H * 0.07} fill={`url(#pool-${id})`} />}
        <g
          filter={glow > 0 && style !== "silhouette" ? `url(#glow-${id})` : undefined}
          transform={spin ? `rotate(${spin * facing} ${s.hip.x} ${s.hip.y})` : undefined}
        >
          {bone(arm("back"), true)}
          {bone(leg("back"), true)}
          {bone(torsoPath)}
          {bone(leg("front"))}
          <circle cx={s.head.x} cy={s.head.y} r={s.headR} fill={headFill} stroke={headStroke} strokeWidth={headSW} />
          <Face cx={s.head.x} cy={s.head.y} r={s.headR} angle={s.headAngle} facing={facing} kind={expression} color={eyeColor} />
          {bone(arm("front"))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Eyes drawn in head-local space (facing right), then rotated with the head. */
const Face: React.FC<{ cx: number; cy: number; r: number; angle: number; facing: 1 | -1; kind: Expression; color: string }> = ({
  cx,
  cy,
  r,
  angle,
  facing,
  kind,
  color,
}) => {
  if (kind === "none") return null;
  const ex = [0.12 * r, 0.52 * r]; // two eyes, shifted toward the facing side
  const ey = -0.05 * r;
  const w = 0.17 * r;
  const h = 0.28 * r;
  const stroke = { stroke: color, strokeWidth: r * 0.11, strokeLinecap: "round" as const, fill: "none" };
  const eye = (x0: number, i: number) => {
    const inner = i === 0 ? 1 : -1; // which side faces the nose
    switch (kind) {
      case "angry":
        return <path key={i} d={`M${x0 - w} ${ey - h * 0.5 + (inner < 0 ? h * 0.35 : 0)} L${x0 + w} ${ey - h * 0.5 + (inner > 0 ? h * 0.35 : 0)} L${x0 + w * 0.7} ${ey + h * 0.45} L${x0 - w * 0.7} ${ey + h * 0.45} Z`} fill={color} />;
      case "sad":
        return <path key={i} d={`M${x0 - w} ${ey - h * 0.2 + (inner > 0 ? h * 0.3 : 0)} L${x0 + w} ${ey - h * 0.2 + (inner < 0 ? h * 0.3 : 0)} L${x0 + w * 0.7} ${ey + h * 0.5} L${x0 - w * 0.7} ${ey + h * 0.5} Z`} fill={color} />;
      case "happy":
        return <path key={i} d={`M${x0 - w} ${ey + h * 0.2} Q${x0} ${ey - h * 0.7} ${x0 + w} ${ey + h * 0.2}`} {...stroke} />;
      case "closed":
        return <path key={i} d={`M${x0 - w} ${ey + h * 0.1} L${x0 + w} ${ey + h * 0.1}`} {...stroke} />;
      case "dead":
        return (
          <g key={i} {...stroke}>
            <path d={`M${x0 - w} ${ey - w} L${x0 + w} ${ey + w} M${x0 + w} ${ey - w} L${x0 - w} ${ey + w}`} />
          </g>
        );
      default:
        return <rect key={i} x={x0 - w * 0.6} y={ey - h / 2} width={w * 1.2} height={h} rx={w * 0.6} fill={color} />;
    }
  };
  return (
    <g transform={`translate(${cx} ${cy}) scale(${facing} 1) rotate(${angle})`}>
      {ex.map((x0, i) => eye(x0, i))}
    </g>
  );
};

/** Lighten (+) or darken (-) a hex colour. */
export const shade = (hex: string, amt: number) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};
