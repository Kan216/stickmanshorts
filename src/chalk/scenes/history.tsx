import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../lib/anim";
import { useChalk } from "../Board";
import { ChalkText, Draw, Sketch, hatch, roughEllipse, roughLine } from "../draw";
import { cueFrame } from "../plan";
import { CHALK } from "../theme";
import type { EraScene, Episode, TimelineScene } from "../types";
import type { SceneProps } from "./index";

/* ---------- years ---------- */

/** -1070 → "1070 BC", 350 → "AD 350" when the span crosses year 0, else "1299". */
export const fmtYear = (y: number, crossesZero = false) => (y < 0 ? `${-y} BC` : crossesZero ? `AD ${y}` : `${y}`);
export const spanYears = (s: { start: number; end: number }) => s.end - s.start;
export const fmtSpan = (s: { start: number; end: number; approx?: boolean }) => {
  const cross = s.start < 0;
  return `${s.approx ? "c. " : ""}${fmtYear(s.start, cross)} – ${fmtYear(s.end, cross)}`;
};

const axisOf = (ep: Episode) => ep.timeline ?? { from: -1200, to: 2000, step: 500 };

/** Hand-drawn time axis with tick labels. Returns the year→x mapper. */
const Axis: React.FC<{ ep: Episode; x0: number; x1: number; y: number; start: number; labels?: boolean }> = ({ ep, x0, x1, y, start, labels = true }) => {
  const a = axisOf(ep);
  const step = a.step ?? 500;
  const X = (yr: number) => x0 + ((yr - a.from) / (a.to - a.from)) * (x1 - x0);
  const ticks: number[] = [];
  for (let t = Math.ceil(a.from / step) * step; t <= a.to; t += step) ticks.push(t);
  return (
    <>
      <Sketch>
        <Draw d={roughLine(x0, y, x1, y, 91, 2)} start={start} dur={14} color="dim" width={3} />
        {ticks.map((t, i) => (
          <Draw key={t} d={roughLine(X(t), y - 8, X(t), y + 8, 100 + i, 1)} start={start + 6 + i} dur={4} color="dim" width={2.5} />
        ))}
      </Sketch>
      {labels &&
        ticks.map((t, i) =>
          t % (step * 2) === 0 || ticks.length <= 8 ? (
            <ChalkText key={t} text={t === 0 ? "AD 1" : fmtYear(t)} x={X(t) - 60} y={y + 12} w={120} align="center" size={22} color="dim" start={start + 8 + i} cps={0} opacity={0.85} />
          ) : null,
        )}
    </>
  );
};

const mapper = (ep: Episode, x0: number, x1: number) => {
  const a = axisOf(ep);
  return (yr: number) => x0 + ((yr - a.from) / (a.to - a.from)) * (x1 - x0);
};

/* ======================= ERA CARD ======================= */

export const Era: React.FC<SceneProps<EraScene>> = ({ ps, ep }) => {
  const frame = useCurrentFrame();
  const { format } = useChalk();
  const s = ps.scene;
  const short = format === "short";
  const years = spanYears(s);
  const yearsTxt = years.toLocaleString("en-US");

  // geometry (long = 1280x720; short reuses it scaled into the 720 width)
  const g = short
    ? { rank: { x: 50, y: 200, size: 110 }, name: { x: 50, y: 330, w: 620, size: 62 }, span: { x: 52, y: 400 }, badge: { x: 50, y: 450, w: 620 }, axis: { x0: 70, x1: 650, y: 610 }, facts: { x: 60, y: 660, w: 470, size: 32, row: 46 } }
    : { rank: { x: 70, y: 86, size: 112 }, name: { x: 236, y: 90, w: 780, size: 66 }, span: { x: 240, y: 168 }, badge: { x: 640, y: 210, w: 380 }, axis: { x0: 90, x1: 1000, y: 330 }, facts: { x: 96, y: 388, w: 900, size: 40, row: 56 } };

  const nameAt = cueFrame(ps.words, s.name.split(" ").slice(-1)[0], 10);
  const durAt = cueFrame(ps.words, yearsTxt, nameAt + 20, nameAt);
  // facts: cues searched in order
  let after = durAt;
  const factAt = s.facts.map((f, i) => {
    const at = cueFrame(ps.words, f.cue, after + 40 + i * 10, after);
    after = at;
    return at;
  });

  const X = mapper(ep, g.axis.x0, g.axis.x1);
  const grow = interpolate(frame, [durAt, durAt + 28], [0, 1], { ...clamp, easing: ease.inOut });
  const bx0 = X(s.start);
  const bx1 = bx0 + (X(s.end) - bx0) * grow;
  const shown = Math.round(years * interpolate(frame, [durAt, durAt + 24], [0, 1], { ...clamp, easing: ease.out }));
  const rankText = `#${s.rank}`;
  const rankW = g.rank.size * 0.44 * rankText.length;

  return (
    <>
      <ChalkText text={rankText} x={g.rank.x} y={g.rank.y} size={g.rank.size} font="title" color="yellow" start={2} cps={14} />
      <Sketch>
        <Draw d={roughEllipse(g.rank.x + rankW * 0.5, g.rank.y + g.rank.size * 0.55, rankW * 0.62 + 10, g.rank.size * 0.4, s.rank * 7)} start={10} dur={14} color="yellow" width={5} opacity={0.85} />
      </Sketch>
      <ChalkText text={s.name} x={Math.max(g.name.x, g.rank.x + rankW * 1.12 + 34)} y={g.name.y} w={g.name.w} size={g.name.size} font="title" start={Math.max(4, nameAt - 4)} cps={24} />
      <ChalkText text={fmtSpan(s)} x={Math.max(g.span.x, g.rank.x + rankW * 1.12 + 38)} y={g.span.y} size={short ? 34 : 38} color="dim" start={Math.max(8, nameAt + 10)} cps={30} />

      {/* the timeline + the span bar */}
      <Axis ep={ep} x0={g.axis.x0} x1={g.axis.x1} y={g.axis.y} start={Math.max(10, nameAt + 4)} />
      {frame >= durAt && bx1 - bx0 > 2 && (
        <Sketch>
          <path d={hatch(bx0, g.axis.y - 34, bx1 - bx0, 26, 8, s.rank)} stroke={CHALK.yellow} strokeWidth={3.5} fill="none" opacity={0.9} />
          <path d={roughLine(bx0, g.axis.y - 40, bx0, g.axis.y, s.rank, 1)} stroke={CHALK.yellow} strokeWidth={4} fill="none" />
          {grow >= 1 && <path d={roughLine(bx1, g.axis.y - 40, bx1, g.axis.y, s.rank + 3, 1)} stroke={CHALK.yellow} strokeWidth={4} fill="none" />}
        </Sketch>
      )}
      {/* "1,480 YEARS" */}
      {frame >= durAt && (
        <ChalkText
          text={`${shown.toLocaleString("en-US")} {white:YEARS}`}
          x={g.badge.x}
          y={g.badge.y}
          w={g.badge.w}
          align="right"
          size={short ? 64 : 60}
          font="title"
          color="yellow"
          cps={0}
        />
      )}

      {s.facts.map((f, i) =>
        frame >= factAt[i] ? (
          <ChalkText
            key={i}
            text={`• ${f.text}`}
            x={g.facts.x}
            y={g.facts.y + i * g.facts.row}
            w={g.facts.w}
            size={g.facts.size}
            start={factAt[i]}
            cps={34}
          />
        ) : null,
      )}
    </>
  );
};

/* ======================= TIMELINE (all eras) ======================= */

export const Timeline: React.FC<SceneProps<TimelineScene>> = ({ ps, ep }) => {
  const frame = useCurrentFrame();
  const { format } = useChalk();
  const short = format === "short";
  const eras = ep.scenes.filter((x): x is EraScene => x.type === "era").sort((a, b) => a.start - b.start);
  const top = short ? 300 : 110;
  const axisY = short ? 860 : 562;
  const rowH = Math.min(short ? 52 : 46, (axisY - 24 - top) / Math.max(1, eras.length));
  const labelX = short ? 40 : 70;
  const x0 = short ? 290 : 350;
  const x1 = short ? 680 : 1010;
  const X = mapper(ep, x0, x1);
  const step = Math.max(6, Math.min(14, Math.floor((ps.dur * 0.45) / Math.max(1, eras.length))));
  const longest = Math.max(...eras.map(spanYears));
  return (
    <>
      <ChalkText
        text={ps.scene.title ?? "ALL ON ONE {yellow:TIMELINE}"}
        x={short ? 40 : 70}
        y={short ? 200 : 56}
        w={short ? 640 : 900}
        size={short ? 56 : 50}
        font="title"
        start={2}
        cps={30}
      />
      <Axis ep={ep} x0={x0} x1={x1} y={axisY} start={6} />
      {eras.map((e, i) => {
        const at = 16 + i * step;
        if (frame < at) return null;
        const y = top + i * rowH;
        const g = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: ease.out });
        const a = X(e.start);
        const b = a + (X(e.end) - a) * g;
        const isTop = spanYears(e) === longest;
        return (
          <React.Fragment key={e.name}>
            <ChalkText text={`#${e.rank} ${e.name}`} x={labelX} y={y + rowH * 0.12} w={x0 - labelX - 12} size={rowH * 0.56} color={isTop ? "yellow" : "white"} start={at} cps={60} />
            <Sketch>
              <path d={hatch(a, y + rowH * 0.2, Math.max(2, b - a), rowH * 0.5, 7, e.rank)} stroke={isTop ? CHALK.yellow : CHALK.white} strokeWidth={2.8} fill="none" opacity={0.85} />
            </Sketch>
            {g >= 1 && !short && (
              <ChalkText text={spanYears(e).toLocaleString("en-US")} x={b + 8} y={y + rowH * 0.12} size={rowH * 0.5} color="dim" start={at + 16} cps={0} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
