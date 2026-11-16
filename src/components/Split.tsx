/**
 * A/B split-screen building blocks (top panel vs bottom panel).
 * Default geometry: TOP_PANEL ground y=520, BOT_PANEL ground y=905 (LAYOUT.groundY).
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, VIDEO } from "../lib/theme";

export const TOP_PANEL = { y: 205, h: 345, ground: 520 };
export const BOT_PANEL = { y: 570, h: 365, ground: 905 };

/** Rounded panel with an accent-coloured floor glow and its own ground line. Children are SVG, dimmed with `dim`. */
export const SplitPanel: React.FC<{ y: number; h: number; accent: string; dim: number; glow?: number; children?: React.ReactNode }> = ({ y, h, accent, dim, glow = 0, children }) => (
  <AbsoluteFill>
    <svg width={VIDEO.width} height={VIDEO.height}>
      <defs>
        <linearGradient id={`pg-${y}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity={0.22 * dim + 0.25 * glow} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={24} y={y} width={672} height={h} rx={18} fill="#07090e" stroke={accent} strokeOpacity={0.35 * dim + 0.5 * glow} strokeWidth={2} />
      <rect x={24} y={y} width={672} height={h} rx={18} fill={`url(#pg-${y})`} />
      <line x1={60} y1={y + h - 30} x2={660} y2={y + h - 30} stroke="#3a414c" strokeWidth={2} />
      <g opacity={0.4 + 0.6 * dim}>{children}</g>
    </svg>
  </AbsoluteFill>
);

/** Small label + mono value pinned to a panel corner. */
export const PanelCounter: React.FC<{ y: number; label: string; value: string; color: string; dim?: boolean; glow?: boolean; align?: "left" | "right" }> = ({
  y,
  label,
  value,
  color,
  dim,
  glow,
  align = "left",
}) => (
  <AbsoluteFill
    style={{
      top: y,
      ...(align === "left" ? { left: 50 } : { left: "auto", right: 50 }),
      height: "auto",
      width: "auto",
      textAlign: align,
      opacity: dim ? 0.45 : 1,
      fontFamily: FONTS.headline,
    }}
  >
    <div style={{ color, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{label}</div>
    <div style={{ fontFamily: FONTS.mono, fontSize: 44, fontWeight: 700, color: dim ? COLORS.dim : COLORS.white, textShadow: glow ? `0 0 18px ${color}, 0 0 36px ${color}` : undefined }}>
      {value}
    </div>
  </AbsoluteFill>
);

/** Pill on the seam between the panels: "DAY 365". */
export const DayPill: React.FC<{ text: string; gold: boolean; y?: number }> = ({ text, gold, y = 540 }) => {
  const c = gold ? COLORS.gold : COLORS.white;
  return (
    <AbsoluteFill style={{ top: y, height: "auto", alignItems: "center" }}>
      <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, color: c, background: "#05070b", border: `2px solid ${c}`, borderRadius: 30, padding: "4px 22px", boxShadow: gold ? `0 0 20px ${c}` : undefined }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
