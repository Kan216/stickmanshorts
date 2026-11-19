import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../lib/anim";
import { useChalk } from "../Board";
import { ChalkText, Draw, Flag, Sketch, hatch, roughEllipse, roughLine, roughRect } from "../draw";
import { cueFrame } from "../plan";
import { CHALK, CHALK_CHANNEL } from "../theme";
import type { Episode, HookScene, LeaderboardScene, OutroScene, PlannedScene, RankScene } from "../types";

export type SceneProps<S> = { ps: PlannedScene & { scene: S }; ep: Episode };

const fmtNum = (n: number) => n.toLocaleString("en-US");

/** Max headline stat across the episode — every bar is scaled to it. */
export const metricMax = (ep: Episode) =>
  Math.max(1, ...ep.scenes.filter((s): s is RankScene => s.type === "rank").map((s) => s.stats[0]?.value ?? 0));

/* ======================= HOOK ======================= */

export const Hook: React.FC<SceneProps<HookScene>> = ({ ps }) => {
  const { L, format } = useChalk();
  const s = ps.scene;
  const short = format === "short";
  const size = short ? 96 : 84;
  const lines = s.title.split("\n").length;
  const titleY = short ? 250 : 170;
  const w = short ? L.W - 2 * L.pad : 900;
  const x = short ? L.pad : 80;
  const ulY = titleY + lines * size * 1.02 + 10;
  return (
    <>
      <ChalkText text={s.title} x={x} y={titleY} w={w} size={size} align={short ? "center" : "left"} font="title" start={2} cps={20} />
      <Sketch>
        <Draw d={roughLine(x + (short ? 90 : 0), ulY, x + (short ? w - 90 : 620), ulY - 6, 7, 4)} start={22} dur={10} color="yellow" width={6} />
      </Sketch>
      {s.subtitle && (
        <ChalkText
          text={s.subtitle}
          x={x}
          y={ulY + 30}
          w={w}
          size={short ? 40 : 42}
          align={short ? "center" : "left"}
          color="dim"
          start={30}
        />
      )}
    </>
  );
};

/* ======================= RANK ======================= */

export const Rank: React.FC<SceneProps<RankScene>> = ({ ps, ep }) => {
  const { L, format } = useChalk();
  const frame = useCurrentFrame();
  const s = ps.scene;
  const short = format === "short";
  const max = metricMax(ep);

  // when the narrator says the country name / each number
  const nameAt = cueFrame(ps.words, s.name.split(" ")[0], 10);
  const statAt = s.stats.map((st, i) => cueFrame(ps.words, st.cue ?? String(st.value), nameAt + 14 + i * 20, nameAt));

  const g = short
    ? {
        rank: { x: 56, y: 200, size: 160 },
        flag: { x: 352, y: 228, w: 290 },
        name: { x: L.pad, y: 458, w: L.W - 2 * L.pad, size: 78, align: "center" as const },
        stats: { x: 56, y: 560, w: 432, row: 66, label: 40, value: 56 },
        barW: 432,
      }
    : {
        rank: { x: 76, y: 104, size: 140 },
        flag: { x: 80, y: 278, w: 250 },
        name: { x: 70, y: 478, w: 380, size: 60, align: "left" as const },
        stats: { x: 500, y: 150, w: 500, row: 74, label: 40, value: 60 },
        barW: 500,
      };

  const rankText = `#${s.rank}`;
  const rankW = g.rank.size * 0.44 * rankText.length;
  const barY = g.stats.y + s.stats.length * g.stats.row + 26;
  const barH = short ? 36 : 40;
  const v0 = s.stats[0]?.value ?? 0;
  const grow = interpolate(frame, [statAt[0], statAt[0] + 22], [0, 1], { ...clamp, easing: ease.out });
  const fillW = g.barW * (v0 / max) * grow;

  return (
    <>
      {/* big rank number, circled */}
      <ChalkText text={rankText} x={g.rank.x} y={g.rank.y} size={g.rank.size} font="title" color="yellow" start={2} cps={14} />
      <Sketch>
        <Draw
          d={roughEllipse(g.rank.x + rankW * 0.5, g.rank.y + g.rank.size * 0.55, rankW * 0.62 + 10, g.rank.size * 0.4, s.rank * 3)}
          start={10}
          dur={14}
          color="yellow"
          width={5}
          opacity={0.85}
        />
      </Sketch>

      <Flag cc={s.country} x={g.flag.x} y={g.flag.y} w={g.flag.w} start={Math.max(4, nameAt - 6)} dur={12} />
      <ChalkText text={s.name} x={g.name.x} y={g.name.y} w={g.name.w} size={g.name.size} align={g.name.align} font="title" start={nameAt} cps={22} />

      {/* stat rows */}
      {s.stats.map((st, i) => {
        const at = statAt[i];
        if (frame < at) return null;
        const y = g.stats.y + i * g.stats.row;
        const val = Math.round(st.value * interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: ease.out }));
        return (
          <React.Fragment key={i}>
            <ChalkText text={st.label} x={g.stats.x} y={y + (g.stats.value - g.stats.label) * 0.7} size={g.stats.label} color="dim" start={at} cps={40} />
            <ChalkText
              text={`${fmtNum(val)}${st.unit ?? ""}`}
              x={g.stats.x}
              y={y}
              w={g.stats.w}
              align="right"
              size={g.stats.value}
              font="title"
              color={st.color ?? (i === 0 ? "yellow" : "white")}
              start={at}
              cps={0}
            />
            <Sketch>
              <Draw d={roughLine(g.stats.x, y + g.stats.value + 6, g.stats.x + g.stats.w, y + g.stats.value + 2, 40 + i, 2)} start={at} dur={10} color="dim" width={2.5} opacity={0.6} />
            </Sketch>
          </React.Fragment>
        );
      })}

      {/* comparison bar: outline = the #1 value, hatch = this country */}
      {frame >= statAt[0] && (
        <>
          <Sketch>
            <Draw d={roughRect(g.stats.x, barY, g.barW, barH, 60 + s.rank, 2)} start={statAt[0]} dur={12} color="dim" width={3} opacity={0.7} />
            {fillW > 2 && (
              <>
                <path d={hatch(g.stats.x + 3, barY + 3, fillW - 6, barH - 6, 9, s.rank)} stroke={CHALK.yellow} strokeWidth={3.5} opacity={0.85} fill="none" />
                <path d={roughLine(g.stats.x + fillW, barY - 6, g.stats.x + fillW, barY + barH + 6, s.rank, 1)} stroke={CHALK.yellow} strokeWidth={4} fill="none" />
              </>
            )}
          </Sketch>
          <ChalkText
            text={`${ep.metric} · #1 = ${fmtNum(max)}`}
            x={g.stats.x}
            y={barY + barH + 8}
            w={g.barW}
            size={30}
            color="dim"
            align="right"
            start={statAt[0] + 10}
            cps={60}
            opacity={0.8}
          />
        </>
      )}

      {s.note && !short && (
        <ChalkText text={s.note} x={g.stats.x} y={barY + barH + 56} w={g.barW} size={36} color="blue" start={statAt[statAt.length - 1] + 20} cps={30} />
      )}
    </>
  );
};

/* ======================= LEADERBOARD ======================= */

export const Leaderboard: React.FC<SceneProps<LeaderboardScene>> = ({ ps, ep }) => {
  const { L, format } = useChalk();
  const frame = useCurrentFrame();
  const short = format === "short";
  const rows = ep.scenes.filter((s): s is RankScene => s.type === "rank").sort((a, b) => a.rank - b.rank);
  const max = metricMax(ep);
  const top = short ? 290 : 150;
  const bottom = short ? 820 : 600;
  const rowH = Math.min(short ? 56 : 46, (bottom - top) / Math.max(1, rows.length));
  const x0 = short ? 56 : 80;
  const flagW = rowH * 0.9;
  const nameX = x0 + 70 + flagW + 14;
  const barX = short ? 430 : 560;
  const barMaxW = short ? 190 : 340;
  const step = Math.max(3, Math.min(8, Math.floor((ps.dur * 0.5) / Math.max(1, rows.length))));
  return (
    <>
      <ChalkText
        text={ps.scene.title ?? "THE FULL LIST"}
        x={short ? L.pad : 80}
        y={short ? 200 : 84}
        w={short ? L.W - 2 * L.pad : 900}
        size={short ? 64 : 52}
        align={short ? "center" : "left"}
        font="title"
        color="yellow"
        start={2}
        cps={30}
      />
      {rows.map((r, i) => {
        const at = 12 + i * step;
        const y = top + i * rowH;
        const v = r.stats[0]?.value ?? 0;
        const grow = interpolate(frame, [at + 4, at + 20], [0, 1], { ...clamp, easing: ease.out });
        const fs = rowH * 0.62;
        return (
          <React.Fragment key={r.rank}>
            <ChalkText text={`#${r.rank}`} x={x0} y={y} size={fs} font="title" color={r.rank === 1 ? "yellow" : "white"} start={at} cps={0} />
            <Flag cc={r.country} x={x0 + 66} y={y + rowH * 0.12} w={flagW} start={at} dur={6} />
            <ChalkText text={r.name} x={nameX} y={y} size={fs} start={at} cps={60} />
            {frame >= at + 4 && (
              <Sketch>
                <path
                  d={hatch(barX, y + rowH * 0.22, Math.max(2, barMaxW * (v / max) * grow), rowH * 0.42, 7, r.rank)}
                  stroke={r.rank === 1 ? CHALK.yellow : CHALK.white}
                  strokeWidth={2.5}
                  opacity={0.8}
                  fill="none"
                />
              </Sketch>
            )}
            {!short && <ChalkText text={fmtNum(v)} x={barX + barMaxW + 16} y={y} size={fs} color="dim" start={at + 8} cps={0} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ======================= OUTRO ======================= */

export const Outro: React.FC<SceneProps<OutroScene>> = ({ ps, ep }) => {
  const { L, format } = useChalk();
  const short = format === "short";
  const x = short ? L.pad : 80;
  const w = short ? L.W - 2 * L.pad : 900;
  return (
    <>
      <ChalkText text={ps.scene.title} x={x} y={short ? 230 : 170} w={w} size={short ? 84 : 76} align={short ? "center" : "left"} font="title" start={2} cps={22} />
      <ChalkText text={`Follow {yellow:${CHALK_CHANNEL}}\nfor more numbers`} x={x} y={short ? 430 : 360} w={w} size={short ? 56 : 48} align={short ? "center" : "left"} start={24} cps={30} />
      <Sketch>
        {short && <Draw d="M300 580 q-8 50 4 100 M280 655 l24 28 l20 -30" start={50} dur={14} color="yellow" width={5} />}
      </Sketch>
      <ChalkText
        text={`Sources: ${ep.sources.join(", ")}`}
        x={x}
        y={short ? 740 : 500}
        w={short ? 470 : w}
        size={short ? 28 : 26}
        align={short ? "center" : "left"}
        color="dim"
        start={20}
        cps={80}
        opacity={0.8}
      />
    </>
  );
};
