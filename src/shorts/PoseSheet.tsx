/**
 * Debug still: every pose in POSES on a grid. Render it with
 *   npm run still -- PoseSheet out/poses.png
 * and LOOK at it after editing pose.ts or Stickman.tsx.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { Stickman, StickStyle } from "../components/Stickman";
import { POSES, PoseName } from "../lib/pose";
import { COLORS, FONTS } from "../lib/theme";

const palette = ["white", "teal", "orange", "gold", "blue", "pink", "green", "red"];
const styles: StickStyle[] = ["neon", "solid", "neon", "line"];

export const PoseSheet: React.FC = () => {
  const names = Object.keys(POSES) as PoseName[];
  const cols = 4;
  const cellW = 720 / cols;
  const cellH = 196;
  return (
    <AbsoluteFill style={{ background: "#07090d" }}>
      {names.map((n, i) => {
        const cx = (i % cols) * cellW + cellW / 2;
        const gy = Math.floor(i / cols) * cellH + 175;
        return (
          <React.Fragment key={n}>
            <AbsoluteFill style={{ left: cx - cellW / 2, top: gy + 6, width: cellW, height: 20, color: COLORS.steel, fontFamily: FONTS.mono, fontSize: 14, textAlign: "center" }}>
              {n}
            </AbsoluteFill>
            <Stickman x={cx} y={gy} height={135} pose={n} color={palette[i % palette.length]} style={styles[Math.floor(i / cols) % styles.length]} glow={0.6} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
