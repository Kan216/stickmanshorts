import React from "react";
import { AbsoluteFill } from "remotion";
import { ChalkBoard, ChalkProvider } from "./Board";
import { ChalkText, Draw, Flag, Sketch, hatch, roughEllipse, roughLine, roughRect } from "./draw";
import { Teacher } from "./Teacher";
import { CHALK, Format, LAYOUTS } from "./theme";
import type { Episode } from "./types";

/**
 * Stop-scroll thumbnail from episode.thumbnail: huge 2–4 word question, a shock number,
 * the top flags (#1 circled in red), and the teacher with a surprised face.
 * Rendered by scripts/chalk-thumb.sh at 1.5× (→ 1920×1080 / 1080×1920 JPEG).
 */
const SHADOW = "0 5px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.55)";

export const ChalkThumbnail: React.FC<{ episode: Episode; format: Format }> = ({ episode, format }) => {
  const t = episode.thumbnail ?? { text: episode.title };
  const L = LAYOUTS[format];
  const short = format === "short";
  const flags = t.flags ?? [];
  // 16:9: numbers under the flags; 9:16: rank labels (the big badge carries the number)
  const labels = (!short && t.flagValues) || t.flagLabels || flags.map((_, i) => `#${i + 1}`);

  const g = short
    ? {
        kicker: { x: 0, y: 70, w: 720, size: 50, align: "center" as const },
        text: { x: 20, y: 150, w: 680, size: 128, align: "center" as const },
        badge: { x: 0, y: 418, w: 720, size: 118, rot: -4, align: "center" as const },
        flag: { x0: 62, y: 572, w: 172, gap: 32 },
        teacher: { x: 375, ground: 1232, height: 370, facing: 1 as const },
      }
    : {
        kicker: { x: 60, y: 34, w: 700, size: 46, align: "left" as const },
        text: { x: 52, y: 92, w: 880, size: 150, align: "left" as const },
        badge: { x: 560, y: 452, w: 420, size: 104, rot: -6, align: "left" as const },
        flag: { x0: 62, y: 440, w: 150, gap: 44 },
        teacher: { x: 1088, ground: 745, height: 580, facing: -1 as const },
      };

  const fh = (g.flag.w * 3) / 4;
  // auto-fit: never wrap the headline (Gochi Hand caps ≈ 0.6em per char)
  const plain = t.text.replace(/\{(\w+|#[0-9a-fA-F]{3,8}):([^}]+)\}/g, "$2").split("\n");
  const longest = Math.max(...plain.map((l) => l.length));
  const textSize = Math.min(g.text.size, Math.floor(g.text.w / (longest * 0.6)));
  const kickerW = (t.kicker?.length ?? 0) * g.kicker.size * 0.48 + 40;
  const kickerX = short ? (720 - kickerW) / 2 : g.kicker.x - 16;

  return (
    <ChalkProvider format={format}>
      <AbsoluteFill>
        <ChalkBoard watermark={false} />
        {/* light pool behind the teacher so the figure pops */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${(g.teacher.x / L.W) * 100}% ${((g.teacher.ground - g.teacher.height * 0.7) / L.H) * 100}%, rgba(255,255,240,0.13), rgba(0,0,0,0) ${short ? 28 : 30}%)`,
          }}
        />
        {t.kicker && (
          <>
            <Sketch>
              <Draw d={roughRect(kickerX, g.kicker.y - 4, kickerW, g.kicker.size * 1.25, 21, 2)} start={-30} color="yellow" width={5} />
            </Sketch>
            <ChalkText
              text={t.kicker}
              x={g.kicker.x}
              y={g.kicker.y}
              w={short ? g.kicker.w : kickerW}
              size={g.kicker.size}
              align={g.kicker.align}
              font="title"
              color="yellow"
              cps={0}
              texture="soft"
              shadow={SHADOW}
            />
          </>
        )}
        <ChalkText
          text={t.text}
          x={g.text.x}
          y={g.text.y}
          w={g.text.w}
          size={textSize}
          align={g.text.align}
          font="title"
          cps={0}
          lineHeight={0.98}
          texture="soft"
          shadow={SHADOW}
        />
        {flags.map((cc, i) => {
          const x = g.flag.x0 + i * (g.flag.w + g.flag.gap);
          return (
            <React.Fragment key={cc}>
              <Flag cc={cc} x={x} y={g.flag.y} w={g.flag.w} start={-30} />
              <ChalkText
                text={labels[i] ?? ""}
                x={x}
                y={g.flag.y + fh + 6}
                w={g.flag.w}
                align="center"
                size={short ? 52 : 44}
                font="title"
                color={i === 0 ? "yellow" : "white"}
                cps={0}
                texture="soft"
                shadow={SHADOW}
              />
            </React.Fragment>
          );
        })}
        {flags.length > 0 && (
          <Sketch>
            <Draw d={roughEllipse(g.flag.x0 + g.flag.w / 2, g.flag.y + fh / 2 + 18, g.flag.w * 0.68, fh * 0.95, 4)} start={-30} color={CHALK.red} width={8} />
          </Sketch>
        )}
        {/* 16:9 without flags: shock number + a chalk timeline bar fill the lower half */}
        {!short && flags.length === 0 && t.badge && (
          <>
            <ChalkText text={t.badge} x={60} y={410} w={820} size={118} font="title" color="yellow" cps={0} rotate={-3} texture="soft" shadow={SHADOW} />
            <Sketch>
              <Draw d={roughLine(70, 640, 860, 636, 5, 2)} start={-30} color="dim" width={4} />
              <path d={hatch(120, 588, 620, 40, 10, 3)} stroke={CHALK.yellow} strokeWidth={4.5} fill="none" opacity={0.9} />
              <Draw d={roughLine(120, 580, 120, 644, 6, 1)} start={-30} color="yellow" width={5} />
              <Draw d={roughLine(740, 580, 740, 644, 7, 1)} start={-30} color="yellow" width={5} />
            </Sketch>
          </>
        )}
        {/* the shock number: big on the Short; on 16:9 the numbers sit under the flags instead */}
        {t.badge && short && (
          <ChalkText
            text={t.badge}
            x={g.badge.x}
            y={g.badge.y}
            w={g.badge.w}
            size={Math.min(g.badge.size, Math.floor((g.badge.w - 40) / ((t.badge?.length ?? 1) * 0.62)))}
            align={g.badge.align}
            font="title"
            color="yellow"
            cps={0}
            rotate={g.badge.rot}
            texture="soft"
            shadow={SHADOW}
          />
        )}
        <Teacher
          x={g.teacher.x}
          ground={g.teacher.ground}
          height={g.teacher.height}
          facing={g.teacher.facing}
          arms="cheeks"
          expression="surprised"
          mouth={1}
          effect="exclaim"
          weight={1.2}
          shadow={false}
          canvas={{ w: L.W, h: L.H }}
        />
      </AbsoluteFill>
    </ChalkProvider>
  );
};
