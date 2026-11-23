import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../lib/anim";
import { useChalk } from "../Board";
import { ChalkText, Draw, Flag, Sketch, hatch, roughEllipse } from "../draw";
import { cueFrame } from "../plan";
import { CHALK } from "../theme";
import type { VersusScene } from "../types";
import type { SceneProps } from "./index";

const dec = (n: number) => (String(n).split(".")[1] ?? "").length;
const fmt = (v: number, d: number, pre = "", unit = "") =>
  `${pre}${v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}${unit}`;

/** Two stacked cards: flag + name + growing bar + value; "VS" between; winner circled. */
export const Versus: React.FC<SceneProps<VersusScene>> = ({ ps }) => {
  const frame = useCurrentFrame();
  const { format } = useChalk();
  const s = ps.scene;
  const short = format === "short";
  const max = Math.max(s.a.value, s.b.value);

  const aName = cueFrame(ps.words, s.a.name.split(" ")[0], 6);
  const bName = cueFrame(ps.words, s.b.name.split(" ")[0], aName + 12, aName + 1);
  const aVal = cueFrame(ps.words, s.a.cue ?? String(s.a.value), bName + 20, bName + 1);
  const bVal = cueFrame(ps.words, s.b.cue ?? String(s.b.value), aVal + 25, aVal + 1);
  const winAt = s.winCue ? cueFrame(ps.words, s.winCue, bVal + 25, bVal + 1) : bVal + 25;
  const winner = s.a.value >= s.b.value ? 0 : 1;

  const G = short
    ? { x: 56, w: 440, flagW: 120, nameSize: 46, valSize: 58, rows: [215, 545], vsY: 470 }
    : { x: 80, w: 760, flagW: 110, nameSize: 48, valSize: 52, rows: [100, 350], vsY: 296 };

  const side = (p: VersusScene["a"], i: number) => {
    const y = G.rows[i];
    const nAt = i === 0 ? aName : bName;
    const vAt = i === 0 ? aVal : bVal;
    const d = dec(p.value);
    const g = interpolate(frame, [vAt, vAt + 20], [0, 1], { ...clamp, easing: ease.out });
    const shown = Math.round(p.value * g * 10 ** d) / 10 ** d;
    const barY = y + G.flagW * 0.75 + 22;
    const barW = (G.w * p.value) / max;
    return (
      <React.Fragment key={i}>
        <Flag cc={p.country} x={G.x} y={y} w={G.flagW} start={Math.max(2, nAt - 4)} dur={10} />
        <ChalkText text={p.name} x={G.x + G.flagW + 22} y={y + G.flagW * 0.375 - G.nameSize * 0.6} w={short ? 620 - G.flagW : G.w} size={Math.min(G.nameSize, Math.floor((short ? 600 - G.flagW : G.w) / (p.name.length * 0.5)))} font="title" start={nAt} cps={26} />
        {frame >= vAt && (
          <>
            <Sketch>
              <path d={hatch(G.x, barY, Math.max(2, barW * g), 34, 9, i + 3)} stroke={i === winner && frame >= winAt ? CHALK.yellow : CHALK.white} strokeWidth={3.5} fill="none" opacity={0.85} />
            </Sketch>
            <ChalkText text={fmt(shown, d, s.prefix, s.unit)} x={G.x} y={barY + 44} w={G.w} align="left" size={G.valSize} font="title" color={i === winner && frame >= winAt ? "yellow" : "white"} cps={0} />
          </>
        )}
        {i === winner && frame >= winAt && (
          <Sketch>
            <Draw d={roughEllipse(G.x + G.w / 2 + 10, y + 104, G.w * 0.66, 136, 11 + i)} start={winAt} dur={14} color="yellow" width={6} />
          </Sketch>
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      {s.label && <ChalkText text={s.label} x={G.x} y={short ? 128 : 40} w={G.w} size={short ? 34 : 30} color="dim" start={2} cps={40} />}
      {side(s.a, 0)}
      <ChalkText text="VS" x={G.x} y={G.vsY} w={G.w} align="center" size={short ? 72 : 60} font="title" color="red" start={Math.max(4, bName - 6)} cps={0} />
      {side(s.b, 1)}
    </>
  );
};
