import React from "react";
import { AbsoluteFill } from "remotion";
import { ChalkBoard, ChalkProvider } from "./Board";
import { ChalkText } from "./draw";
import { Effect, Expression, GestureName, Teacher } from "./Teacher";

const CELLS: { label: string; arms: GestureName; expr: Expression; mouth?: number; fx?: Effect }[] = [
  { label: "idle", arms: "idle", expr: "neutral" },
  { label: "talk", arms: "explain", expr: "talk", mouth: 0.8, fx: "lines" },
  { label: "open", arms: "open", expr: "talk", mouth: 0.5 },
  { label: "thinking", arms: "chin", expr: "thinking", fx: "question" },
  { label: "idea", arms: "pointUp", expr: "idea", fx: "bulb" },
  { label: "present", arms: "present", expr: "talk", mouth: 0.6, fx: "lines" },
  { label: "surprised", arms: "cheeks", expr: "surprised", fx: "exclaim" },
  { label: "happy", arms: "open", expr: "happy", fx: "sparkle" },
  { label: "cheer", arms: "cheer", expr: "happy" },
  { label: "wave", arms: "wave", expr: "talk", mouth: 0.4 },
  { label: "confused", arms: "shrug", expr: "confused", fx: "dots" },
];

/** Look-test still for the presenter: every gesture + expression (720x1280). */
export const TeacherSheet: React.FC = () => (
  <ChalkProvider format="short">
    <AbsoluteFill>
      <ChalkBoard watermark={false} />
      {CELLS.map((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 130 + col * 230;
        const g = 330 + row * 300;
        return (
          <React.Fragment key={c.label}>
            <Teacher x={x} ground={g} height={210} facing={-1} arms={c.arms} expression={c.expr} mouth={c.mouth ?? 0} effect={c.fx ?? "none"} canvas={{ w: 720, h: 1280 }} />
            <ChalkText text={c.label} x={x - 100} y={g + 8} w={200} align="center" size={32} color="dim" cps={0} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  </ChalkProvider>
);
