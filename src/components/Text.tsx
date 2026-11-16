import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ease, pop } from "../lib/anim";
import { COLORS, FONTS, LAYOUT, resolveColor } from "../lib/theme";

/**
 * Parse "{teal:TALENT} GOT BORED." into coloured word spans.
 * Anything outside braces uses the default colour.
 */
const parse = (text: string, base: string) => {
  const out: { t: string; c: string }[] = [];
  const re = /\{(\w+|#[0-9a-fA-F]{3,8}):([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), c: base });
    out.push({ t: m[2], c: resolveColor(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), c: base });
  return out;
};

export type HeadlineProps = {
  /** Supports colour tags: "{gold:DAY ONE.} YOU DECIDE." Use "\n" for line breaks. */
  text: string;
  /** frame the headline starts appearing (relative to the parent Sequence) */
  start?: number;
  /** frame it disappears (optional) */
  end?: number;
  y?: number;
  size?: number;
  color?: string;
  /** pop = words bounce in one by one, type = typewriter with block cursor, fade = simple fade-up */
  mode?: "pop" | "type" | "fade";
  weight?: number;
  letterSpacing?: number;
  glow?: boolean;
};

export const Headline: React.FC<HeadlineProps> = ({
  text,
  start = 0,
  end,
  y = LAYOUT.headlineY,
  size = 44,
  color = COLORS.white,
  mode = "pop",
  weight = 800,
  letterSpacing = 1,
  glow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = end === undefined ? 1 : 1 - interpolate(frame, [end - 8, end], [0, 1], { ...clamp, easing: ease.in });
  if (frame < start) return null;

  const spans = parse(text, resolveColor(color));
  const lines: { t: string; c: string }[][] = [[]];
  for (const s of spans) {
    const parts = s.t.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ t: p, c: s.c });
    });
  }

  let charIndex = 0;
  let wordIndex = 0;
  const totalChars = text.replace(/\{\w+:|\}|#[0-9a-fA-F]+:/g, "").length;
  const visibleChars = mode === "type" ? Math.floor(((frame - start) / fps) * 20) : Infinity;

  const fadeUp = interpolate(frame, [start, start + 12], [0, 1], { ...clamp, easing: ease.out });

  return (
    <AbsoluteFill
      style={{
        top: y - size,
        height: "auto",
        alignItems: "center",
        opacity: out * (mode === "fade" ? fadeUp : 1),
        transform: mode === "fade" ? `translateY(${(1 - fadeUp) * 18}px)` : undefined,
      }}
    >
      {lines.map((ln, li) => (
        <div
          key={li}
          style={{
            fontFamily: FONTS.headline,
            fontWeight: weight,
            fontSize: size,
            letterSpacing,
            lineHeight: 1.2,
            textAlign: "center",
            whiteSpace: "pre",
            textShadow: glow ? "0 0 18px rgba(255,200,120,0.35)" : undefined,
          }}
        >
          {ln.map((span, si) => {
            if (mode === "type") {
              const from = charIndex;
              charIndex += span.t.length;
              const shown = span.t.slice(0, Math.max(0, visibleChars - from));
              const isLast = visibleChars >= from && visibleChars < charIndex;
              return (
                <span key={si} style={{ color: span.c }}>
                  {shown}
                  {isLast && visibleChars < totalChars && <span style={{ opacity: 0.9 }}>▌</span>}
                </span>
              );
            }
            if (mode === "fade") return <span key={si} style={{ color: span.c }}>{span.t}</span>;
            // pop: animate each word
            return span.t.split(/(\s+)/).map((w, wi) => {
              if (/^\s+$/.test(w) || w === "") return <span key={`${si}-${wi}`}>{w}</span>;
              const s = pop(frame, start + wordIndex++ * 4, fps);
              return (
                <span
                  key={`${si}-${wi}`}
                  style={{ color: span.c, display: "inline-block", transform: `scale(${s})`, opacity: Math.min(1, s * 1.5) }}
                >
                  {w}
                </span>
              );
            });
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export type Stat = {
  label: string;
  color?: string;
  value: number | string;
  /** shows "value/max" with max dimmed */
  max?: number;
  /** greys out a stat that has "lost" */
  dim?: boolean;
  /** extra glow on the value (e.g. infinity / winner) */
  glow?: boolean;
};

/** Row of labelled counters: TALENT 5 · DISCIPLINE 6/10 · EGO 7 */
export const StatRow: React.FC<{ stats: Stat[]; y?: number; start?: number; end?: number }> = ({ stats, y = LAYOUT.statsY, start = 0, end }) => {
  const frame = useCurrentFrame();
  const out = end === undefined ? 1 : 1 - interpolate(frame, [end - 10, end], [0, 1], clamp);
  const a = interpolate(frame, [start, start + 10], [0, 1], clamp) * out;
  return (
    <AbsoluteFill style={{ top: y - 30, height: "auto", flexDirection: "row", justifyContent: "space-evenly", opacity: a, padding: `0 ${LAYOUT.safeX}px` }}>
      {stats.map((s, i) => {
        const c = resolveColor(s.color ?? "white");
        return (
          <div key={i} style={{ textAlign: "center", fontFamily: FONTS.headline, opacity: s.dim ? 0.45 : 1, minWidth: 120 }}>
            <div style={{ color: c, fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>{s.label}</div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 700,
                color: s.dim ? COLORS.dim : COLORS.white,
                textShadow: s.glow ? `0 0 18px ${c}, 0 0 36px ${c}` : undefined,
              }}
            >
              {s.value}
              {s.max !== undefined && <span style={{ color: COLORS.dim }}>/{s.max}</span>}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Big centred number with a small caption above: "DAYS WAITING / 365". */
export const BigCounter: React.FC<{ label: string; value: number | string; y?: number; color?: string; start?: number; size?: number }> = ({
  label,
  value,
  y = 150,
  color = "white",
  start = 0,
  size = 76,
}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [start, start + 10], [0, 1], clamp);
  const c = resolveColor(color);
  return (
    <AbsoluteFill style={{ top: y - 60, height: "auto", alignItems: "center", opacity: a }}>
      <div style={{ fontFamily: FONTS.headline, fontSize: 22, letterSpacing: 4, color: COLORS.steel, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: FONTS.headline, fontSize: size, fontWeight: 800, color: c, textShadow: `0 0 24px ${c}55` }}>{value}</div>
    </AbsoluteFill>
  );
};

/** Retro pixel label with a fill bar underneath (e.g. "ENVY ███████"). */
export const LabelBar: React.FC<{ label: string; color: string; fill?: number; y?: number; start?: number }> = ({
  label,
  color,
  fill = 1,
  y = 300,
  start = 0,
}) => {
  const frame = useCurrentFrame();
  const c = resolveColor(color);
  const grow = interpolate(frame, [start, start + 20], [0, fill], { ...clamp, easing: ease.out });
  const a = interpolate(frame, [start, start + 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ top: y, height: "auto", padding: "0 98px", opacity: a }}>
      <div style={{ fontFamily: FONTS.pixel, fontSize: 24, color: c, letterSpacing: 3, fontWeight: 700, textShadow: `0 0 10px ${c}` }}>{label}</div>
      <div style={{ marginTop: 14, height: 12, border: `1px solid ${c}55`, background: "#0006" }}>
        <div style={{ width: `${grow * 100}%`, height: "100%", background: c, boxShadow: `0 0 12px ${c}` }} />
      </div>
    </AbsoluteFill>
  );
};
