import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Stickman } from "../components/Stickman";
import { Sfx } from "../components/Sound";
import { clamp } from "../lib/anim";
import { Pose, PoseName, POSES, addPose, poseAt } from "../lib/pose";
import { ChalkBoard, ChalkProvider, useChalk } from "./Board";
import { Captions } from "./Captions";
import { ChalkText } from "./draw";
import { buildPlan, totalFrames } from "./plan";
import { Hook, Leaderboard, Outro, Rank } from "./scenes";
import { CHALK, FPS, Format, LAYOUTS } from "./theme";
import type { Episode, PlannedScene, Scene, Timing } from "./types";

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
  }
};

/** Eraser-out at the end of every scene. */
const SceneWrap: React.FC<{ ps: PlannedScene; children: React.ReactNode }> = ({ ps, children }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [ps.dur - 7, ps.dur], [1, 0], clamp);
  const blur = interpolate(f, [ps.dur - 7, ps.dur], [0, 6], clamp);
  return <AbsoluteFill style={{ opacity: out, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>;
};

const scenePose = (s: Scene): PoseName => {
  switch (s.type) {
    case "hook":
      return "think";
    case "rank":
    case "leaderboard":
      return "point";
    case "outro":
      return "victory";
  }
};

/** The teacher: stands bottom-right, changes pose with each scene, breathes. */
const Presenter: React.FC<{ plan: PlannedScene[] }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { L } = useChalk();
  const keys = plan.flatMap((p, i) => [
    { f: p.from, pose: (i === 0 ? scenePose(p.scene) : scenePose(plan[i - 1].scene)) as Pose | PoseName },
    { f: p.from + 9, pose: scenePose(p.scene) as Pose | PoseName },
  ]);
  const base = poseAt(frame, keys);
  const breathe = Math.sin(frame / 14);
  const pose = addPose(base, { frontShoulder: breathe * 3, backShoulder: -breathe * 2, head: breathe * 1.5 });
  const enter = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <Stickman
      x={L.presenter.x}
      y={L.presenter.ground}
      height={L.presenter.height}
      pose={pose}
      facing={-1}
      style="chalk"
      color={CHALK.white}
      expression={plan[0] && frame < plan[0].dur ? "neutral" : "happy"}
      glow={0}
      opacity={enter}
      canvas={{ w: L.W, h: L.H }}
    />
  );
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
const DuckedMusic: React.FC<{ plan: PlannedScene[]; file: string; volume: number }> = ({ plan, file, volume }) => {
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
          duck = 1 - 0.6 * interpolate(f, [s - 6, s, e, e + 10], [0, 1, 1, 0], clamp);
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
            {ps.scene.type === "rank" && <Sfx at={3} name="chalk-write" volume={0.35} />}
            {ps.from > 0 && <Sfx at={0} name="eraser" volume={0.3} />}
          </Sequence>
        ))}
        <Presenter plan={plan} />
        <Captions plan={plan} />
        {episode.music && <DuckedMusic plan={plan} file={episode.music.file} volume={episode.music.volume ?? 0.22} />}
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
