import React from "react";
import { AbsoluteFill } from "remotion";
import { Stickman } from "../components/Stickman";
import { ChalkBoard, ChalkProvider } from "./Board";
import { ChalkText, Draw, Flag, Sketch, hatch, roughEllipse, roughLine, roughRect } from "./draw";
import { CHALK } from "./theme";

/** Look-test still: fonts, colours, strokes, flag, stickman poses on the board. */
export const ChalkSheet: React.FC = () => (
  <ChalkProvider format="short">
    <AbsoluteFill>
      <ChalkBoard />
      <ChalkText text="Gochi Hand {yellow:TITLE} 123" x={48} y={60} size={64} font="title" cps={0} />
      <ChalkText text="Patrick Hand body · 13,043" x={48} y={140} size={48} cps={0} />
      <ChalkText text="{yellow:yellow} {pink:pink} {blue:blue} {green:green} {orange:orange} {red:red}" x={48} y={205} size={44} cps={0} />
      <Flag cc="fr" x={60} y={290} w={200} start={-30} />
      <Flag cc="us" x={300} y={290} w={200} start={-30} />
      <Sketch>
        <Draw start={-30} d={roughEllipse(600, 360, 70, 55, 3)} color="yellow" width={5} />
        <Draw start={-30} d={roughRect(60, 480, 560, 44, 4)} color="dim" width={3} />
        <path d={hatch(64, 484, 380, 36, 9, 2)} stroke={CHALK.yellow} strokeWidth={3.5} fill="none" opacity={0.85} />
        <Draw start={-30} d={roughLine(60, 570, 660, 562, 8, 4)} width={6} />
      </Sketch>
      {(["stand", "point", "think", "victory"] as const).map((p, i) => (
        <Stickman key={p} x={110 + i * 165} y={860} height={200} pose={p} facing={-1} style="chalk" color={CHALK.white} glow={0} />
      ))}
    </AbsoluteFill>
  </ChalkProvider>
);
