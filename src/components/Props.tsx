/**
 * Reusable scene props. Every prop is a full-frame SVG layer so it can be
 * stacked in an <AbsoluteFill> exactly like <Stickman/>. Coordinates are px
 * in the 720x1280 frame.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, LAYOUT, VIDEO, resolveColor } from "../lib/theme";
import { rand } from "../lib/anim";

const Layer: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <AbsoluteFill style={{ opacity }}>
    <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
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

/** Water body with an animated surface line from `surfaceY` down to the floor. */
export const Water: React.FC<{ surfaceY?: number; color?: string }> = ({ surfaceY = 420, color = "#1c2a3d" }) => {
  const f = useCurrentFrame();
  const pts = Array.from({ length: 25 }).map((_, i) => {
    const x = (i / 24) * VIDEO.width;
    return `${x},${surfaceY + Math.sin(i * 0.9 + f / 10) * 4}`;
  });
  return (
    <Layer>
      <polygon points={`0,${LAYOUT.groundY} ${pts.join(" ")} ${VIDEO.width},${LAYOUT.groundY}`} fill={color} opacity={0.85} />
      <polyline points={pts.join(" ")} fill="none" stroke="#9fb6d4" strokeWidth={2.5} opacity={0.8} />
      {Array.from({ length: 14 }).map((_, i) => {
        const y = LAYOUT.groundY - ((f * (0.8 + rand(i) * 1.2) + rand(i + 5) * 500) % (LAYOUT.groundY - surfaceY));
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
