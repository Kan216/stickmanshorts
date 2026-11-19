import React from "react";
import { useCurrentFrame } from "remotion";
import { CK, useChalk } from "./Board";
import { CHALK, CHALK_FONTS } from "./theme";
import type { PlannedScene, Word } from "./types";

/** Split a scene's words into short caption chunks (≤ maxWords, break after punctuation). */
const chunk = (words: Word[], maxWords: number, maxChars: number) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,!?;:]$/.test(w.w)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
};

/** Word-synced captions; the word being spoken turns yellow. */
export const Captions: React.FC<{ plan: PlannedScene[] }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { L, format } = useChalk();
  const ps = plan.find((p) => frame >= p.from && frame < p.from + p.dur);
  if (!ps) return null;
  const f = frame - ps.from;
  const chunks = chunk(ps.words, format === "short" ? 4 : 7, format === "short" ? 24 : 46);
  const idx = chunks.findIndex((c, i) => f >= c[0].f && (i === chunks.length - 1 || f < chunks[i + 1][0].f));
  const c = chunks[idx];
  if (!c || f > c[c.length - 1].end + 12) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (L.W - L.captionW) / 2,
        width: L.captionW,
        top: L.captionY - L.captionSize * 0.62,
        textAlign: "center",
        fontFamily: CHALK_FONTS.body,
        fontSize: L.captionSize,
        lineHeight: 1.1,
        filter: `url(#${CK.soft})`,
      }}
    >
      <span
        style={{
          padding: "2px 18px 6px",
          borderRadius: 18,
          background: "rgba(10,16,13,0.55)",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {c.map((w, i) => (
          <span key={i} style={{ color: f >= w.f && f < (c[i + 1]?.f ?? w.end + 6) ? CHALK.yellow : CHALK.white }}>
            {w.w}
            {i < c.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </div>
  );
};
