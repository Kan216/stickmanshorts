import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, FONTS, LAYOUT, MOODS, MoodName, CHANNEL_NAME, VIDEO, resolveColor } from "../lib/theme";
import { rand } from "../lib/anim";

/**
 * Backdrop: vertical gradient, faint stars/dust, ambient glow behind the
 * action, a floor below `LAYOUT.groundY` and a thin ground line.
 */
export const Backdrop: React.FC<{
  mood?: MoodName;
  /** colour of the soft ambient glow behind the characters (overrides mood) */
  glowColor?: string;
  glowStrength?: number;
  stars?: number;
  /** draw a faint hill/horizon line behind the characters */
  horizon?: boolean;
  floor?: boolean;
}> = ({ mood = "night", glowColor, glowStrength = 1, stars = 40, horizon = false, floor = true }) => {
  const frame = useCurrentFrame();
  const m = MOODS[mood];
  const g = glowColor ? resolveColor(glowColor) : m.ambient;
  const W = VIDEO.width;
  const G = LAYOUT.groundY;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${m.top}, ${m.bottom})` }}>
      <svg width={W} height={VIDEO.height}>
        <defs>
          <radialGradient id="ambient" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={g} stopOpacity={0.55 * glowStrength} />
            <stop offset="100%" stopColor={g} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={150} width={W} height={G - 100} fill="url(#ambient)" />
        {Array.from({ length: stars }).map((_, i) => {
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 25 + i));
          return (
            <circle
              key={i}
              cx={rand(i) * W}
              cy={rand(i + 99) * (G - 60)}
              r={0.6 + rand(i + 7) * 1.1}
              fill="#ffffff"
              opacity={0.12 * tw}
            />
          );
        })}
        {horizon && (
          <path
            d={`M0 ${G - 150} L120 ${G - 160} L260 ${G - 175} L370 ${G - 190} L470 ${G - 165} L620 ${G - 140} L${W} ${G - 150}`}
            stroke={COLORS.steel}
            strokeOpacity={0.25}
            strokeWidth={2}
            fill="none"
          />
        )}
        {floor && (
          <>
            <rect x={0} y={G} width={W} height={VIDEO.height - G} fill={m.floor} />
            <line x1={0} x2={W} y1={G} y2={G} stroke={COLORS.steel} strokeOpacity={0.45} strokeWidth={2} />
            {Array.from({ length: 9 }).map((_, i) => (
              <ellipse key={i} cx={rand(i + 300) * W} cy={G + 10 + rand(i + 400) * 30} rx={4 + rand(i) * 6} ry={2} fill={COLORS.steel} opacity={0.15} />
            ))}
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/** Small channel watermark with progress dots (dot `step` of `steps` is lit). */
export const Watermark: React.FC<{ step?: number; steps?: number; name?: string }> = ({ step = 0, steps = 4, name = CHANNEL_NAME }) => (
  <AbsoluteFill style={{ top: LAYOUT.watermarkY - 20, alignItems: "center" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", height: 14 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 9 : 5,
            height: i === step ? 9 : 5,
            borderRadius: 9,
            background: i === step ? COLORS.amber : "#6b5a3a",
            boxShadow: i === step ? `0 0 10px ${COLORS.amber}` : undefined,
          }}
        />
      ))}
    </div>
    <div style={{ marginTop: 6, fontFamily: FONTS.headline, fontSize: 15, letterSpacing: 5, color: "#b89b62", fontWeight: 600 }}>{name}</div>
  </AbsoluteFill>
);

/** Soft vignette on top of everything — makes the glow pop. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);
