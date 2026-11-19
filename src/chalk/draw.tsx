import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, ease, rand } from "../lib/anim";
import { CK, useChalk } from "./Board";
import { CHALK_FONTS, chalkColor } from "./theme";

/* ---------------- markup ---------------- */

/** "WHO RULES THE {yellow:SKIES}?" → coloured spans. Colours: chalk names or #hex. */
export const parseMarkup = (text: string, base: string) => {
  const out: { t: string; c: string }[] = [];
  const re = /\{(\w+|#[0-9a-fA-F]{3,8}):([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), c: base });
    out.push({ t: m[2], c: chalkColor(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), c: base });
  return out;
};

const plainLen = (s: string) => s.replace(/\{(\w+|#[0-9a-fA-F]{3,8}):([^}]+)\}/g, "$2").length;

/* ---------------- text ---------------- */

export type ChalkTextProps = {
  text: string;
  x: number;
  y: number;
  size: number;
  /** box width; text is aligned inside it */
  w?: number;
  align?: "left" | "center" | "right";
  color?: string;
  font?: "title" | "body" | "bold";
  /** frame the hand starts writing */
  start?: number;
  /** chars per second while writing (0 = appear instantly) */
  cps?: number;
  /** frame to erase (fade + smear) */
  end?: number;
  opacity?: number;
  lineHeight?: number;
  rotate?: number;
  /** chalk texture strength: "text" (default), "soft" (cleaner, for thumbnails), "none" */
  texture?: "text" | "soft" | "none";
  /** CSS text-shadow, e.g. for thumbnail legibility */
  shadow?: string;
  /** CSS font-weight / letter-spacing passthrough */
  letterSpacing?: number;
};

/**
 * Hand-written chalk text: each line is revealed left→right like a hand
 * writing it (clip), lines one after another. Supports {color:word} and \n.
 */
export const ChalkText: React.FC<ChalkTextProps> = ({
  text,
  x,
  y,
  size,
  w,
  align = "left",
  color = "white",
  font = "body",
  start = 0,
  cps = 26,
  end,
  opacity = 1,
  lineHeight = 1.05,
  rotate = 0,
  texture = "text",
  shadow,
  letterSpacing,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const lines = text.split("\n");
  const base = chalkColor(color);
  const out = end === undefined ? 1 : 1 - interpolate(frame, [end - 8, end], [0, 1], clamp);
  let charsBefore = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: CHALK_FONTS[font],
        fontWeight: font === "bold" ? 900 : undefined,
        fontSize: size,
        lineHeight,
        color: base,
        opacity: opacity * out,
        filter: texture === "none" ? undefined : `url(#${texture === "soft" ? CK.soft : CK.text})`,
        textShadow: shadow,
        letterSpacing,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        transformOrigin: "left top",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.map((ln, i) => {
        const n = plainLen(ln);
        const t0 = start + (cps > 0 ? (charsBefore / cps) * 30 : 0);
        const t1 = t0 + (cps > 0 ? Math.max(4, (n / cps) * 30) : 0);
        charsBefore += n;
        const p = cps > 0 ? interpolate(frame, [t0, t1], [0, 100], { ...clamp, easing: ease.linear }) : 100;
        return (
          <div key={i} style={{ clipPath: p >= 100 ? undefined : `inset(-20% ${100 - p}% -20% -5%)` }}>
            {parseMarkup(ln, base).map((s, j) => (
              <span key={j} style={{ color: s.c }}>
                {s.t}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- rough shapes ---------------- */

const r = (seed: number, amp: number) => (rand(seed) - 0.5) * 2 * amp;

/** Slightly bowed hand-drawn line (one quadratic). */
export const roughLine = (x1: number, y1: number, x2: number, y2: number, seed = 1, amp = 3) => {
  const mx = (x1 + x2) / 2 + r(seed, amp);
  const my = (y1 + y2) / 2 + r(seed + 1, amp);
  return `M${x1 + r(seed + 2, amp / 2)} ${y1 + r(seed + 3, amp / 2)} Q${mx} ${my} ${x2 + r(seed + 4, amp / 2)} ${y2 + r(seed + 5, amp / 2)}`;
};

/** Hand-drawn rectangle: four bowed sides, corners slightly overshooting. */
export const roughRect = (x: number, y: number, w: number, h: number, seed = 1, amp = 3) => {
  const o = 6;
  return [
    roughLine(x - o, y, x + w + o * 0.5, y, seed, amp),
    roughLine(x + w, y - o * 0.6, x + w, y + h + o, seed + 10, amp),
    roughLine(x + w + o * 0.4, y + h, x - o * 0.6, y + h, seed + 20, amp),
    roughLine(x, y + h + o * 0.5, x, y - o * 0.5, seed + 30, amp),
  ].join(" ");
};

/** Scribbled ellipse (≈1.15 turns, so the ends overlap like a teacher's circle). */
export const roughEllipse = (cx: number, cy: number, rx: number, ry: number, seed = 1) => {
  const pts: string[] = [];
  const turns = 1.15;
  const N = 40;
  const a0 = -2.2 + r(seed, 0.4);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = a0 + t * turns * Math.PI * 2;
    const k = 1 + 0.06 * Math.sin(t * 7 + seed) + t * 0.06;
    pts.push(`${i ? "L" : "M"}${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return pts.join(" ");
};

/** Diagonal hatch lines filling a box (chalk "colouring in"). */
export const hatch = (x: number, y: number, w: number, h: number, gap = 12, seed = 1) => {
  const out: string[] = [];
  for (let i = -h; i < w; i += gap) {
    const x1 = Math.max(x, x + i);
    const y1 = y + h - Math.max(0, x - (x + i));
    const x2 = Math.min(x + w, x + i + h);
    const y2 = y + h - (x2 - (x + i));
    out.push(`M${x1.toFixed(1)} ${(y1 + r(seed + i, 1.5)).toFixed(1)} L${x2.toFixed(1)} ${(y2 + r(seed + i + 1, 1.5)).toFixed(1)}`);
  }
  return out.join(" ");
};

/* ---------------- drawn strokes ---------------- */

export type DrawProps = {
  d: string;
  start?: number;
  /** frames to draw */
  dur?: number;
  color?: string;
  width?: number;
  opacity?: number;
  fill?: string;
  /** extra frames before the fill appears */
  fillDelay?: number;
};

/** One path that draws itself on (stroke-dash), inside a <Sketch>. */
export const Draw: React.FC<DrawProps> = ({ d, start = 0, dur = 12, color = "white", width = 5, opacity = 1, fill, fillDelay = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const p = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: ease.out });
  const fp = fill ? interpolate(frame, [start + dur + fillDelay, start + dur + fillDelay + 8], [0, 1], clamp) : 0;
  return (
    <>
      {fill && fp > 0 && <path d={d} fill={chalkColor(fill)} opacity={fp * opacity} stroke="none" />}
      <path
        d={d}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        stroke={chalkColor(color)}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
      />
    </>
  );
};

/** Full-frame SVG layer with the chalk line filter applied. */
export const Sketch: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => {
  const { L } = useChalk();
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={L.W} height={L.H}>
        <g filter={`url(#${CK.line})`}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- flag ---------------- */

/**
 * Country flag (flag-icons, 4:3, MIT) drawn as if chalked onto the board:
 * wiped in left→right, grainy, with a hand-drawn frame.
 * Needs public/flags/<cc>.svg — scripts/chalk-tts.py copies the ones an episode uses.
 */
export const Flag: React.FC<{ cc: string; x: number; y: number; w: number; start?: number; dur?: number }> = ({
  cc,
  x,
  y,
  w,
  start = 0,
  dur = 12,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const h = (w * 3) / 4;
  const p = interpolate(frame, [start, start + dur], [0, 100], { ...clamp, easing: ease.out });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          clipPath: `inset(0 ${100 - p}% 0 0)`,
          filter: `url(#${CK.text}) saturate(0.6) brightness(0.92)`,
          opacity: 0.9,
        }}
      >
        <Img src={staticFile(`flags/${cc.toLowerCase()}.svg`)} style={{ width: w, height: h, display: "block" }} />
      </div>
      <Sketch>
        <Draw d={roughRect(x, y, w, h, cc.charCodeAt(0) + cc.charCodeAt(1), 2.5)} start={start + dur * 0.6} dur={14} width={4} />
      </Sketch>
    </>
  );
};
