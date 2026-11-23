import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Sfx } from "../components/Sound";
import { clamp } from "../lib/anim";
import { ChalkBoard, ChalkProvider, useChalk } from "./Board";
import { Captions } from "./Captions";
import { Presenter } from "./Presenter";
import { ChalkText } from "./draw";
import { buildPlan, totalFrames } from "./plan";
import { Hook, Leaderboard, Outro, Rank } from "./scenes";
import { Era, Timeline } from "./scenes/history";
import { Versus } from "./scenes/versus";
import { FPS, Format, LAYOUTS } from "./theme";
import type { Episode, PlannedScene, Timing } from "./types";

export type ExplainerProps = {
  episode: Episode;
  format: Format;
  /** filled by calculateMetadata from public/chalk/<slug>/<format>/timing.json */
  timing?: Timing | null;
};

const SceneBody: React.FC<{ ps: PlannedScene; ep: Episode }> = ({ ps, ep }) => {
  switch (ps.scene.type) {
    case "hook":
      return <Hook ps={ps as never} ep={ep} />;
    case "rank":
      return <Rank ps={ps as never} ep={ep} />;
    case "leaderboard":
      return <Leaderboard ps={ps as never} ep={ep} />;
    case "outro":
      return <Outro ps={ps as never} ep={ep} />;
    case "era":
      return <Era ps={ps as never} ep={ep} />;
    case "timeline":
      return <Timeline ps={ps as never} ep={ep} />;
    case "versus":
      return <Versus ps={ps as never} ep={ep} />;
  }
};

/** Eraser-out at the end of every scene. */
const SceneWrap: React.FC<{ ps: PlannedScene; children: React.ReactNode }> = ({ ps, children }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [ps.dur - 7, ps.dur], [1, 0], clamp);
  const blur = interpolate(f, [ps.dur - 7, ps.dur], [0, 6], clamp);
  return <AbsoluteFill style={{ opacity: out, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>;
};

/** Small persistent header ("TOP 10 AIR FORCES") during data scenes. */
const Header: React.FC<{ plan: PlannedScene[]; text: string }> = ({ plan, text }) => {
  const frame = useCurrentFrame();
  const { L, format } = useChalk();
  const data = plan.filter((p) => p.scene.type === "rank");
  if (!data.length) return null;
  const a = data[0].from;
  const b = data[data.length - 1].from + data[data.length - 1].dur;
  const o = interpolate(frame, [a, a + 8, b - 8, b], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <ChalkText
      text={text}
      x={format === "short" ? L.pad : 80}
      y={format === "short" ? L.headerY - 38 : L.headerY - 34}
      w={format === "short" ? L.W - 2 * L.pad : 900}
      size={format === "short" ? 40 : 34}
      align={format === "short" ? "center" : "left"}
      color="dim"
      cps={0}
      opacity={o * 0.9}
    />
  );
};

/** Music bed that ducks while the narrator talks. */
/** Mix defaults per format: present in gaps (≈4 dB under the voice), tucked under speech (≈12 dB). */
export const MUSIC_DEFAULTS: Record<Format, { file: string; volume: number; duck: number }> = {
  short: { file: "chalk-curious.wav", volume: 0.56, duck: 0.45 },
  long: { file: "chalk-documentary.wav", volume: 0.5, duck: 0.42 },
};

const DuckedMusic: React.FC<{ plan: PlannedScene[]; file: string; volume: number; duckTo: number }> = ({ plan, file, volume, duckTo }) => {
  const total = totalFrames(plan);
  return (
    <Html5Audio
      src={staticFile(`music/${file}`)}
      loop
      volume={(f) => {
        const ps = plan.find((p) => f >= p.from && f < p.from + p.dur);
        let duck = 1;
        if (ps && ps.words.length) {
          const s = ps.from + ps.words[0].f;
          const e = ps.from + ps.words[ps.words.length - 1].end;
          duck = 1 - (1 - duckTo) * interpolate(f, [s - 6, s, e, e + 10], [0, 1, 1, 0], clamp);
        }
        const fade = interpolate(f, [0, 15, total - 30, total], [0, 1, 1, 0], clamp);
        return volume * duck * fade;
      }}
    />
  );
};

export const ChalkExplainer: React.FC<ExplainerProps> = ({ episode, format, timing }) => {
  const plan = buildPlan(episode, format, timing);
  return (
    <ChalkProvider format={format}>
      <AbsoluteFill>
        <ChalkBoard />
        <Header plan={plan} text={episode.header} />
        {plan.map((ps) => (
          <Sequence key={ps.index} from={ps.from} durationInFrames={ps.dur} name={`${ps.index}-${ps.scene.type}`}>
            <SceneWrap ps={ps}>
              <SceneBody ps={ps} ep={episode} />
            </SceneWrap>
            {ps.audio && (
              <Sequence from={ps.voFrom} layout="none">
                <Html5Audio src={staticFile(ps.audio)} />
              </Sequence>
            )}
            <Sfx at={1} name="chalk-tap" volume={0.5} />
            {(ps.scene.type === "rank" || ps.scene.type === "era") && <Sfx at={3} name="chalk-write" volume={0.35} />}
            {ps.from > 0 && <Sfx at={0} name="eraser" volume={0.3} />}
          </Sequence>
        ))}
        <Presenter plan={plan} />
        <Captions plan={plan} />
        {!episode.music?.off && (
          <DuckedMusic
            plan={plan}
            file={(format === "long" ? episode.music?.fileLong : episode.music?.file) ?? MUSIC_DEFAULTS[format].file}
            volume={episode.music?.volume ?? MUSIC_DEFAULTS[format].volume}
            duckTo={episode.music?.duck ?? MUSIC_DEFAULTS[format].duck}
          />
        )}
      </AbsoluteFill>
    </ChalkProvider>
  );
};

/** Reads timing.json (if TTS has run) → exact duration; otherwise estimates. */
export const calcChalkMetadata: CalculateMetadataFunction<ExplainerProps> = async ({ props }) => {
  const { episode, format } = props;
  let timing: Timing | null = null;
  try {
    const res = await fetch(staticFile(`chalk/${episode.slug}/${format}/timing.json`));
    if (res.ok) timing = (await res.json()) as Timing;
  } catch {
    timing = null;
  }
  const plan = buildPlan(episode, format, timing);
  const { W, H } = LAYOUTS[format];
  return { durationInFrames: Math.max(FPS, totalFrames(plan)), width: W, height: H, fps: FPS, props: { ...props, timing } };
};
