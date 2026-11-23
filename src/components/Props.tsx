/**
 * Reusable scene props. Every prop is a full-frame SVG layer so it can be
 * stacked in an <AbsoluteFill> exactly like <Stickman/>. Coordinates are px
 * in the 720x1280 frame.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, LAYOUT, VIDEO, resolveColor } from "../lib/theme";
import { rand } from "../lib/anim";

const Layer: React.FC<{ children: React.ReactNode; opacity?: number; h?: number }> = ({ children, opacity = 1, h = VIDEO.height }) => (
  <AbsoluteFill style={{ opacity }}>
    <svg width={VIDEO.width} height={h} viewBox={`0 0 ${VIDEO.width} ${h}`} style={{ overflow: "visible" }}>
      {children}
    </svg>
  </AbsoluteFill>
);

/** Pull-up rig: a horizontal bar on posts. Lanes are the gaps between posts. */
export const PullUpBar: React.FC<{ y?: number; posts?: number[]; color?: string }> = ({
  y = 535,
  posts = [20, 245, 470, 695],
  color = "#7f8ea3",
}) => (
  <Layer>
    {posts.map((x, i) => (
      <g key={i}>
        <rect x={x - 6} y={y - 16} width={12} height={LAYOUT.groundY - y + 16} rx={4} fill="#4a5361" />
        <rect x={x - 22} y={LAYOUT.groundY - 8} width={44} height={10} rx={3} fill="#3a414c" />
      </g>
    ))}
    <rect x={0} y={y - 4} width={VIDEO.width} height={9} rx={4} fill={color} />
  </Layer>
);

/** Coloured light column rising from the floor in a lane (behind a character). */
export const LaneLight: React.FC<{ x: number; width?: number; color: string; strength?: number }> = ({ x, width = 200, color, strength = 1 }) => {
  const c = resolveColor(color);
  const id = `lane-${Math.round(x)}`;
  return (
    <Layer>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity={0.45 * strength} />
          <stop offset="60%" stopColor={c} stopOpacity={0.06 * strength} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x - width / 2} y={LAYOUT.groundY - 420} width={width} height={420} fill={`url(#${id})`} />
    </Layer>
  );
};

/** Staircase going up-right. `lit` steps are drawn in the accent colour. */
export const Stairs: React.FC<{ x?: number; steps?: number; stepW?: number; stepH?: number; lit?: number; color?: string }> = ({
  x = 380,
  steps = 9,
  stepW = 36,
  stepH = 36,
  lit = 0,
  color = "gold",
}) => {
  const c = resolveColor(color);
  const G = LAYOUT.groundY;
  return (
    <Layer>
      {Array.from({ length: steps }).map((_, i) => (
        <rect
          key={i}
          x={x + i * stepW}
          y={G - (i + 1) * stepH}
          width={VIDEO.width - (x + i * stepW)}
          height={stepH}
          fill={i < lit ? c : "#2a2f38"}
          opacity={i < lit ? 0.55 : 1}
          stroke={i < lit ? c : "#3a414c"}
          strokeWidth={1.5}
        />
      ))}
    </Layer>
  );
};

/** Top-of-step position for a character on `Stairs` with the same params. */
export const stairTop = (i: number, x = 380, stepW = 36, stepH = 36) => ({
  x: x + i * stepW + stepW / 2,
  y: LAYOUT.groundY - (i + 1) * stepH,
});

/** Water body with an animated surface line from `surfaceY` down to the floor (or `bottomY`, may exceed the frame for camera pans). */
export const Water: React.FC<{ surfaceY?: number; color?: string; bottomY?: number }> = ({ surfaceY = 420, color = "#1c2a3d", bottomY = LAYOUT.groundY }) => {
  const f = useCurrentFrame();
  const pts = Array.from({ length: 25 }).map((_, i) => {
    const x = (i / 24) * VIDEO.width;
    return `${x},${surfaceY + Math.sin(i * 0.9 + f / 10) * 4}`;
  });
  return (
    <Layer h={Math.max(VIDEO.height, bottomY + 10)}>
      <polygon points={`0,${bottomY} ${pts.join(" ")} ${VIDEO.width},${bottomY}`} fill={color} opacity={0.85} />
      <polyline points={pts.join(" ")} fill="none" stroke="#9fb6d4" strokeWidth={2.5} opacity={0.8} />
      {Array.from({ length: 14 }).map((_, i) => {
        const y = bottomY - ((f * (0.8 + rand(i) * 1.2) + rand(i + 5) * 500) % (bottomY - surfaceY));
        return <circle key={i} cx={rand(i + 11) * VIDEO.width} cy={y} r={2 + rand(i) * 3} fill="none" stroke="#9fb6d4" opacity={0.35} />;
      })}
    </Layer>
  );
};

/** Labelled weight on the floor with a chain up to a point (e.g. an ankle). */
export const ChainWeight: React.FC<{ x: number; to: { x: number; y: number }; label?: string; color?: string; broken?: boolean }> = ({
  x,
  to,
  label = "THE PAST",
  color = "#9aa6b8",
  broken = false,
}) => {
  const c = resolveColor(color);
  const top = LAYOUT.groundY - 50;
  const links = 14;
  return (
    <Layer>
      {!broken &&
        Array.from({ length: links }).map((_, i) => {
          const t = i / (links - 1);
          return (
            <ellipse
              key={i}
              cx={x + (to.x - x) * t}
              cy={top + (to.y - top) * t}
              rx={i % 2 ? 3 : 6}
              ry={i % 2 ? 7 : 5}
              fill="none"
              stroke={c}
              strokeWidth={2.5}
            />
          );
        })}
      <path d={`M${x - 55} ${LAYOUT.groundY} L${x - 42} ${top} L${x + 42} ${top} L${x + 55} ${LAYOUT.groundY} Z`} fill="#3d434d" stroke={c} strokeWidth={2} />
      <text x={x} y={LAYOUT.groundY - 18} textAnchor="middle" fontFamily="Segoe UI, Arial" fontWeight={800} fontSize={18} fill={COLORS.white}>
        {label}
      </text>
    </Layer>
  );
};

/** Thought cloud above a character with free-form children inside (SVG). */
export const ThoughtCloud: React.FC<{ x: number; y: number; w?: number; h?: number; children?: React.ReactNode; opacity?: number }> = ({
  x,
  y,
  w = 220,
  h = 130,
  children,
  opacity = 1,
}) => (
  <Layer opacity={opacity}>
    <g stroke={COLORS.steel} strokeWidth={2.5} fill="#1a202a">
      {[
        [-0.32, 0.05, 0.3],
        [-0.05, -0.18, 0.34],
        [0.28, -0.05, 0.3],
        [0.12, 0.2, 0.3],
        [-0.22, 0.22, 0.26],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx * w} cy={y + dy * h} r={r * w * 0.75} />
      ))}
    </g>
    <ellipse cx={x} cy={y} rx={w * 0.48} ry={h * 0.42} fill="#1a202a" />
    <circle cx={x - w * 0.35} cy={y + h * 0.75} r={9} fill="#1a202a" stroke={COLORS.steel} strokeWidth={2} />
    <circle cx={x - w * 0.45} cy={y + h * 0.98} r={5} fill="#1a202a" stroke={COLORS.steel} strokeWidth={2} />
    {children}
  </Layer>
);

/** Archery target on a stand. `hits` arrows are drawn stuck in it. */
export const Target: React.FC<{ x: number; y?: number; r?: number; hits?: number; glow?: boolean }> = ({ x, y = 440, r = 38, hits = 0, glow = false }) => (
  <Layer>
    {glow && <circle cx={x} cy={y} r={r * 2.2} fill={COLORS.gold} opacity={0.18} />}
    <line x1={x} y1={y} x2={x - 20} y2={y + 120} stroke="#4a5361" strokeWidth={5} />
    <line x1={x} y1={y} x2={x + 20} y2={y + 120} stroke="#4a5361" strokeWidth={5} />
    {[1, 0.75, 0.5, 0.25].map((k, i) => (
      <ellipse key={i} cx={x} cy={y} rx={r * k * 0.45} ry={r * k} fill={i % 2 ? "#1c2129" : "#5a6472"} stroke="#8a95a6" strokeWidth={1.5} />
    ))}
    {Array.from({ length: hits }).map((_, i) => (
      <line key={i} x1={x} y1={y - 10 + i * 6} x2={x - 60} y2={y - 14 + i * 6} stroke={COLORS.gold} strokeWidth={3} />
    ))}
  </Layer>
);

/** Rising embers / dust motes. */
export const Particles: React.FC<{ count?: number; color?: string; area?: { x: number; y: number; w: number; h: number }; speed?: number; size?: number }> = ({
  count = 30,
  color = "gold",
  area = { x: 0, y: 200, w: VIDEO.width, h: 700 },
  speed = 1,
  size = 2.5,
}) => {
  const f = useCurrentFrame();
  const c = resolveColor(color);
  return (
    <Layer>
      {Array.from({ length: count }).map((_, i) => {
        const life = (f * speed * (0.5 + rand(i) * 0.8) + rand(i + 3) * area.h) % area.h;
        const y = area.y + area.h - life;
        const x = area.x + rand(i + 7) * area.w + Math.sin(f / 15 + i) * 8;
        const a = Math.sin((life / area.h) * Math.PI);
        return <circle key={i} cx={x} cy={y} r={size * (0.5 + rand(i + 9))} fill={c} opacity={0.7 * a} />;
      })}
    </Layer>
  );
};

/** Soft radial spotlight (e.g. a lamp, a glowing goal, a heaven light). */
export const Spotlight: React.FC<{ x: number; y: number; r?: number; color?: string; strength?: number }> = ({ x, y, r = 220, color = "gold", strength = 1 }) => {
  const c = resolveColor(color);
  const id = `spot-${Math.round(x)}-${Math.round(y)}`;
  return (
    <Layer>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={c} stopOpacity={0.5 * strength} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </Layer>
  );
};

/**
 * Boulder with a progressive crack that can split open.
 *  crack 0→1 reveals the main crack top→bottom (branches appear after 0.5)
 *  split 0→1 slides the two halves apart and lets light out from inside
 *  impacts: frames when a hit lands → dust burst + small shake at `impactAt`
 */
export const Boulder: React.FC<{
  cx: number;
  w?: number;
  h?: number;
  crack?: number;
  split?: number;
  crackColor?: string;
  lightColor?: string;
  impacts?: number[];
  /** impact point relative to (cx, ground), px */
  impactAt?: { x: number; y: number };
  opacity?: number;
}> = ({ cx, w = 180, h = 180, crack = 0, split = 0, crackColor = "gold", lightColor = "gold", impacts = [], impactAt = { x: -70, y: -150 }, opacity = 1 }) => {
  const f = useCurrentFrame();
  const G = LAYOUT.groundY;
  const sx = w / 180;
  const sy = h / 180;
  const P = (x: number, y: number) => `${cx + x * sx},${G + y * sy}`;
  const rock = [[-88, 0], [-95, -55], [-78, -122], [-38, -170], [12, -180], [60, -155], [90, -98], [95, -40], [88, 0]];
  const crackPts = [[2, -178], [-12, -142], [8, -110], [-10, -76], [12, -46], [-4, -16], [4, 0]];
  const rockPts = rock.map(([x, y]) => P(x, y)).join(" ");
  const crackD = "M" + crackPts.map(([x, y]) => P(x, y)).join(" L");
  const leftClip = [[2, -260], ...crackPts, [4, 30], [-300, 30], [-300, -260]];
  const rightClip = [[2, -260], ...crackPts, [4, 30], [300, 30], [300, -260]];
  const b1 = `M${P(-12, -142)} L${P(-48, -124)} L${P(-70, -132)}`;
  const b2 = `M${P(12, -46)} L${P(46, -62)} L${P(70, -58)}`;
  const b3 = `M${P(8, -110)} L${P(40, -118)}`;
  const cc = resolveColor(crackColor);
  const lc = resolveColor(lightColor);
  const id = `rock-${Math.round(cx)}`;

  // shake for 6 frames after the latest impact
  const last = impacts.filter((t) => t <= f).pop();
  const since = last === undefined ? 99 : f - last;
  const jx = since < 6 ? Math.sin(f * 3.1) * (6 - since) * 0.8 : 0;

  const half = (clip: number[][], dir: 1 | -1) => (
    <g transform={`translate(${dir * split * (dir > 0 ? 22 : 38) + jx} 0) rotate(${dir * split * 7} ${cx + dir * 88 * sx} ${G})`}>
      <clipPath id={`${id}-${dir}`}>
        <polygon points={clip.map(([x, y]) => P(x, y)).join(" ")} />
      </clipPath>
      <g clipPath={`url(#${id}-${dir})`}>
        <polygon points={rockPts} fill="#272c35" stroke="#7d8798" strokeWidth={3} strokeLinejoin="round" />
        <path d={`M${P(-60, -120)} Q${P(-20, -150)} ${P(30, -150)}`} stroke="#3a414c" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d={`M${P(40, -40)} Q${P(60, -70)} ${P(55, -100)}`} stroke="#1c2027" strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );

  return (
    <Layer opacity={opacity}>
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${id}-light`}>
          <stop offset="0%" stopColor={lc} stopOpacity={0.95} />
          <stop offset="40%" stopColor={lc} stopOpacity={0.5} />
          <stop offset="100%" stopColor={lc} stopOpacity={0} />
        </radialGradient>
      </defs>
      <clipPath id={`${id}-above`}>
        <rect x={0} y={0} width={VIDEO.width} height={G} />
      </clipPath>
      {split > 0 && <ellipse clipPath={`url(#${id}-above)`} cx={cx} cy={G - 90 * sy} rx={60 + split * 120} ry={120 + split * 130} fill={`url(#${id}-light)`} opacity={Math.min(1, split * 1.5)} />}
      {half(leftClip, -1)}
      {half(rightClip, 1)}
      {split < 0.05 && crack > 0 && (
        <g filter={`url(#${id}-glow)`} transform={`translate(${jx} 0)`} stroke={cc} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={crackD} pathLength={1} strokeDasharray={`${crack} 1`} />
          {crack > 0.5 && <path d={b1} pathLength={1} strokeDasharray={`${(crack - 0.5) * 2} 1`} />}
          {crack > 0.7 && <path d={b2} pathLength={1} strokeDasharray={`${(crack - 0.7) * 3.3} 1`} />}
          {crack > 0.85 && <path d={b3} pathLength={1} strokeDasharray={`${(crack - 0.85) * 6.6} 1`} />}
        </g>
      )}
      {impacts.map((t, k) => {
        const age = f - t;
        if (age < 0 || age > 14) return null;
        return Array.from({ length: 8 }).map((_, i) => {
          const ang = -Math.PI * (0.15 + rand(k * 10 + i) * 0.7);
          const sp = 3 + rand(k * 10 + i + 5) * 5;
          return (
            <circle
              key={`${k}-${i}`}
              cx={cx + impactAt.x * sx - Math.cos(ang) * sp * age}
              cy={G + impactAt.y * sy + Math.sin(ang) * sp * age + 0.25 * age * age}
              r={2 + rand(k + i) * 2.5}
              fill="#9aa6b8"
              opacity={1 - age / 14}
            />
          );
        });
      })}
    </Layer>
  );
};

/**
 * Cone of light from (x, y) down to (toX, toY): a stage spot / stadium flood.
 * `w0` = width at the lamp, `w1` = width at the floor. Draws a floor pool and an optional lamp fixture.
 */
export const LightBeam: React.FC<{ x: number; y: number; toX?: number; toY: number; w0?: number; w1?: number; color?: string; strength?: number; fixture?: boolean }> = ({
  x,
  y,
  toX,
  toY,
  w0 = 30,
  w1 = 260,
  color = "white",
  strength = 1,
  fixture = true,
}) => {
  const c = resolveColor(color);
  const tx = toX ?? x;
  const id = `beam-${Math.round(x)}-${Math.round(y)}-${Math.round(tx)}`;
  if (strength <= 0.001) return fixture ? <Layer><rect x={x - w0 / 2 - 6} y={y - 12} width={w0 + 12} height={14} rx={4} fill="#2a2f38" stroke="#4a5361" strokeWidth={1.5} /></Layer> : null;
  return (
    <Layer>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={tx} y2={toY}>
          <stop offset="0%" stopColor={c} stopOpacity={0.55 * strength} />
          <stop offset="100%" stopColor={c} stopOpacity={0.08 * strength} />
        </linearGradient>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0%" stopColor={c} stopOpacity={0.5 * strength} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      <polygon points={`${x - w0 / 2},${y} ${x + w0 / 2},${y} ${tx + w1 / 2},${toY} ${tx - w1 / 2},${toY}`} fill={`url(#${id})`} />
      <ellipse cx={tx} cy={toY} rx={w1 * 0.6} ry={w1 * 0.09} fill={`url(#${id}-pool)`} />
      {fixture && (
        <g>
          <rect x={x - w0 / 2 - 6} y={y - 12} width={w0 + 12} height={14} rx={4} fill="#2a2f38" stroke="#4a5361" strokeWidth={1.5} />
          <rect x={x - w0 / 2} y={y - 2} width={w0} height={4} rx={2} fill={c} opacity={0.4 + 0.6 * strength} />
        </g>
      )}
    </Layer>
  );
};

/**
 * Row of crowd silhouettes (head + shoulders) between x0..x1 standing on baseY.
 * `cheer` 0→1 raises and pumps their arms. `rim` colours the outline (e.g. stadium light).
 */
export const Crowd: React.FC<{ x0: number; x1: number; baseY: number; count?: number; size?: number; rim?: string; cheer?: number; opacity?: number; seed?: number }> = ({
  x0,
  x1,
  baseY,
  count = 8,
  size = 70,
  rim = "gold",
  cheer = 0,
  opacity = 1,
  seed = 1,
}) => {
  const f = useCurrentFrame();
  const rc = resolveColor(rim);
  return (
    <Layer opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const s = size * (0.85 + rand(seed * 31 + i) * 0.3);
        const cx = x0 + ((i + 0.5) / count) * (x1 - x0) + (rand(seed * 7 + i) - 0.5) * 10;
        const bob = cheer * Math.abs(Math.sin(f / 5 + i * 1.7)) * s * 0.08;
        const top = baseY - s - bob;
        const headR = s * 0.17;
        const sw = s * 0.36;
        const shY = top + headR * 2.3;
        const arm = cheer * (0.75 + 0.25 * Math.sin(f / 4 + i));
        const armLen = s * 0.5;
        const lx = cx - sw * (0.8 + 0.3 * arm);
        const ly = shY + 8 - armLen * arm * 1.1 + (1 - arm) * armLen * 0.5;
        const rx = cx + sw * (0.8 + 0.3 * arm);
        return (
          <g key={i} fill="#04060a" stroke={rc} strokeWidth={2} strokeOpacity={0.7}>
            {cheer > 0.02 && (
              <g strokeWidth={s * 0.11} strokeLinecap="round" stroke="#04060a">
                <line x1={cx - sw * 0.7} y1={shY + 8} x2={lx} y2={ly} />
                <line x1={cx + sw * 0.7} y1={shY + 8} x2={rx} y2={ly} />
              </g>
            )}
            {cheer > 0.02 && (
              <g stroke={rc} strokeWidth={2} fill="none" strokeOpacity={0.7}>
                <circle cx={lx} cy={ly} r={s * 0.05} />
                <circle cx={rx} cy={ly} r={s * 0.05} />
              </g>
            )}
            <path d={`M${cx - sw} ${baseY + 4} L${cx - sw} ${shY + sw * 0.5} Q${cx - sw} ${shY} ${cx - sw * 0.4} ${shY} L${cx + sw * 0.4} ${shY} Q${cx + sw} ${shY} ${cx + sw} ${shY + sw * 0.5} L${cx + sw} ${baseY + 4} Z`} />
            <circle cx={cx} cy={top + headR} r={headR} />
          </g>
        );
      })}
    </Layer>
  );
};

/**
 * Iceberg: small tip above `waterY` (flat top, feet go at waterY - tipH) and a huge
 * translucent mass below it. `labels` pop in at their frame `at`, spread evenly down the mass.
 */
export const Iceberg: React.FC<{
  cx: number;
  waterY: number;
  tipW?: number;
  tipH?: number;
  width?: number;
  depth?: number;
  labels?: { text: string; at: number }[];
  glow?: number;
  labelColor?: string;
}> = ({ cx, waterY, tipW = 170, tipH = 110, width = 620, depth = 1100, labels = [], glow = 0, labelColor = "white" }) => {
  const f = useCurrentFrame();
  const P = (pts: number[][]) => pts.map(([x, y]) => `${cx + x},${waterY + y}`).join(" ");
  const w = width;
  const d = depth;
  const tip = P([[-tipW * 0.5, 2], [-tipW * 0.32, -tipH * 0.55], [-tipW * 0.18, -tipH], [tipW * 0.2, -tipH], [tipW * 0.3, -tipH * 0.6], [tipW * 0.5, 2]]);
  const body = P([
    [-tipW * 0.5, 0], [-w * 0.3, d * 0.12], [-w * 0.46, d * 0.3], [-w * 0.5, d * 0.5], [-w * 0.4, d * 0.72], [-w * 0.26, d * 0.9],
    [-w * 0.06, d], [w * 0.14, d * 0.96], [w * 0.34, d * 0.8], [w * 0.5, d * 0.55], [w * 0.45, d * 0.3], [w * 0.3, d * 0.12], [tipW * 0.5, 0],
  ]);
  const gc = COLORS.gold;
  const lc = resolveColor(labelColor);
  return (
    <Layer h={Math.max(VIDEO.height, waterY + d + 40)}>
      <defs>
        <linearGradient id={`ice-${cx}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fb2d9" stopOpacity={0.42} />
          <stop offset="100%" stopColor="#2b4f78" stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <polygon points={body} fill={`url(#ice-${cx})`} stroke={glow > 0 ? gc : "#9fc4e4"} strokeOpacity={0.55 + 0.45 * glow} strokeWidth={3 + 2 * glow} strokeLinejoin="round" />
      {[0.25, 0.55, 0.8].map((t, i) => (
        <path key={i} d={`M${cx - w * (0.32 - i * 0.05)} ${waterY + d * t} l${w * 0.12} ${d * 0.05} l${w * 0.1} -${d * 0.03}`} stroke="#b5d3ec" strokeOpacity={0.25} strokeWidth={2} fill="none" />
      ))}
      <polygon points={tip} fill="#dbeaf6" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
      <polygon points={P([[tipW * 0.05, -tipH], [tipW * 0.2, -tipH], [tipW * 0.3, -tipH * 0.6], [tipW * 0.5, 2], [tipW * 0.1, 2]])} fill="#a9c6de" />
      {labels.map((l, i) => {
        const age = f - l.at;
        if (age < 0) return null;
        const sc = Math.min(1, 0.6 + age / 8) + (age < 8 ? Math.sin((age / 8) * Math.PI) * 0.12 : 0);
        const y = waterY + d * (0.17 + (0.68 * i) / Math.max(1, labels.length - 1));
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${sc})`} opacity={Math.min(1, age / 5)}>
            <text textAnchor="middle" dominantBaseline="middle" fontFamily="Segoe UI, Arial" fontWeight={800} fontSize={34} letterSpacing={2} fill={lc} style={{ filter: `drop-shadow(0 0 8px ${glow > 0 ? gc : "#4a7fb0"})` }}>
              {l.text}
            </text>
          </g>
        );
      })}
    </Layer>
  );
};

/**
 * Running-track strip with lane dashes that scroll left by `offset` px (world distance
 * travelled by the camera) — shows speed in side-view chases. Top edge sits on `y`.
 */
export const GroundMarks: React.FC<{ y: number; offset: number; spacing?: number; len?: number; color?: string; depth?: number; opacity?: number }> = ({
  y,
  offset,
  spacing = 120,
  len = 46,
  color = "#4a5361",
  depth = 30,
  opacity = 1,
}) => {
  const c = resolveColor(color);
  const n = Math.ceil(VIDEO.width / spacing) + 2;
  const shift = ((offset % spacing) + spacing) % spacing;
  return (
    <Layer opacity={opacity}>
      <rect x={0} y={y} width={VIDEO.width} height={depth} fill="#10141b" />
      <line x1={0} y1={y} x2={VIDEO.width} y2={y} stroke="#5d6675" strokeWidth={2} />
      {Array.from({ length: n }).map((_, i) => {
        const x = i * spacing - shift;
        return (
          <g key={i}>
            <line x1={x} y1={y + depth * 0.55} x2={x + len} y2={y + depth * 0.55} stroke={c} strokeWidth={3} strokeLinecap="round" />
            <line x1={x + spacing / 2} y1={y + 3} x2={x + spacing / 2 - 6} y2={y + depth - 3} stroke={c} strokeWidth={1.5} opacity={0.5} />
          </g>
        );
      })}
    </Layer>
  );
};

/**
 * Side-view finish line: checkered strip on the ground, two posts and a tape at chest height.
 * `broken` 0→1 snaps the tape in the middle and swings both halves down.
 */
export const FinishTape: React.FC<{ x: number; groundY: number; h?: number; broken?: number; color?: string }> = ({ x, groundY, h = 160, broken = 0, color = "gold" }) => {
  const f = useCurrentFrame();
  const c = resolveColor(color);
  const ty = groundY - h * 0.62;
  const back = { x: x - 14, y: ty - 12 };
  const front = { x: x + 14, y: ty + 12 };
  const mid = { x: x, y: ty };
  const flutter = broken > 0 ? Math.sin(f / 2.5) * 8 * (1 - broken * 0.5) : 0;
  const half = (p: { x: number; y: number }, dir: 1 | -1) => {
    const len = Math.hypot(mid.x - p.x, mid.y - p.y) + 40 * broken;
    const ang = Math.atan2(mid.y - p.y, mid.x - p.x) + dir * broken * 1.2 + (flutter * Math.PI) / 180;
    return <line x1={p.x} y1={p.y} x2={p.x + Math.cos(ang) * len} y2={p.y + Math.sin(ang) * len} stroke={c} strokeWidth={5} strokeLinecap="round" />;
  };
  return (
    <Layer>
      {Array.from({ length: 6 }).map((_, i) => (
        <polygon key={i} points={`${x - 22 + i * 2},${groundY + i * 5} ${x + 2 + i * 2},${groundY + i * 5} ${x + 4 + i * 2},${groundY + (i + 1) * 5} ${x - 20 + i * 2},${groundY + (i + 1) * 5}`} fill={i % 2 ? "#eef2f7" : "#10141b"} opacity={0.85} />
      ))}
      <rect x={back.x - 3} y={groundY - h - 12} width={6} height={h + 12} fill="#3a414c" />
      {broken === 0 ? <line x1={back.x} y1={back.y} x2={front.x} y2={front.y} stroke={c} strokeWidth={5} strokeLinecap="round" /> : (
        <>
          {half(back, -1)}
          {half(front, 1)}
        </>
      )}
      <rect x={front.x - 3} y={groundY - h + 12} width={6} height={h - 12} fill="#5d6675" />
    </Layer>
  );
};

/** Glowing ring lying flat on the floor (perspective ellipse). Use for comfort zones, footprints, spawn pads. */
export const GroundRing: React.FC<{ x: number; y?: number; r: number; color: string; strength?: number; opacity?: number; pulse?: boolean }> = ({
  x,
  y = LAYOUT.groundY - 2,
  r,
  color,
  strength = 1,
  opacity = 1,
  pulse = false,
}) => {
  const f = useCurrentFrame();
  const c = resolveColor(color);
  const k = pulse ? 1 + 0.03 * Math.sin(f / 4) : 1;
  const rx = r * k;
  const ry = rx * 0.28;
  return (
    <Layer opacity={opacity}>
      <ellipse cx={x} cy={y} rx={rx * 1.08} ry={ry * 1.25} fill={c} opacity={0.12 * strength} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth={10} opacity={0.22 * strength} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth={3} opacity={0.95 * strength} />
    </Layer>
  );
};

/** Dotted route line (GPS style). `progress` 0..1 draws the dots from the start. */
export const DottedRoute: React.FC<{ points: { x: number; y: number }[]; progress?: number; color: string; opacity?: number; dot?: number }> = ({
  points,
  progress = 1,
  color,
  opacity = 1,
  dot = 3,
}) => {
  const c = resolveColor(color);
  const n = Math.floor(points.length * Math.max(0, Math.min(1, progress)));
  return (
    <Layer opacity={opacity}>
      {points.slice(0, n).map((p, i) => (i % 2 === 0 ? <circle key={i} cx={p.x} cy={p.y} r={dot} fill={c} opacity={0.5 + 0.5 * (i / Math.max(1, n))} /> : null))}
    </Layer>
  );
};

/** Dark hole in the ground with a label under it. `hit` dims it after a fall. */
export const Hole: React.FC<{ x: number; label: string; color?: string; groundY?: number; hit?: boolean }> = ({
  x,
  label,
  color = "red",
  groundY = LAYOUT.groundY,
  hit = false,
}) => {
  const c = resolveColor(color);
  return (
    <Layer>
      <ellipse cx={x} cy={groundY} rx={44} ry={11} fill={COLORS.ink} stroke={c} strokeWidth={3} opacity={hit ? 0.5 : 1} />
      <ellipse cx={x} cy={groundY + 1} rx={34} ry={7} fill="#000" opacity={0.9} />
      <text x={x} y={groundY + 36} textAnchor="middle" fill={c} fontFamily="'Segoe UI', Arial, sans-serif" fontWeight={800} fontSize={20} letterSpacing={2} opacity={hit ? 0.5 : 1}>
        {label}
      </text>
    </Layer>
  );
};

/** Goal flag on a pole, with a banner label. */
export const Flag: React.FC<{ x: number; groundY?: number; h?: number; label?: string; color?: string; glow?: number }> = ({
  x,
  groundY = LAYOUT.groundY,
  h = 190,
  label = "GOAL",
  color = "gold",
  glow = 1,
}) => {
  const c = resolveColor(color);
  const top = groundY - h;
  return (
    <Layer>
      <line x1={x} y1={groundY} x2={x} y2={top} stroke={c} strokeWidth={4} strokeLinecap="round" />
      <path d={`M${x} ${top} L${x + 78} ${top + 16} L${x} ${top + 34} Z`} fill={c} opacity={0.95} />
      <rect x={x - 6} y={groundY - 36} width={12} height={36} fill={c} opacity={0.15 * glow} />
      <text x={x + 30} y={top + 20} textAnchor="middle" fill={COLORS.ink} fontFamily="'Segoe UI', Arial, sans-serif" fontWeight={900} fontSize={14} letterSpacing={1}>
        {label}
      </text>
    </Layer>
  );
};
