/**
 * "Who Trains When No One Watches?" (18s, 720x1280 @30fps) — A/B split screen.
 * Top: trains only while a spotlight is on him (VIEWERS high); lights off → sits.
 * Bottom: trains alone in the dark (VIEWERS 0), REPS keep climbing. Time-lapse,
 * then stadium lights flood the bottom panel with a cheering crowd; top is dim.
 * Storyboard: storyboards/no-one-watching.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline } from "../../components/Text";
import { Crowd, LightBeam, Particles } from "../../components/Props";
import { BOT_PANEL, DayPill, PanelCounter, SplitPanel } from "../../components/Split";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, pose, Pose, POSES } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS } from "../../lib/theme";

export const NO_ONE_WATCHING_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  off: sec(3.5), // top spotlight cuts
  never: sec(5.5), // "HE NEVER STOPS." + top light back on
  lapse: sec(8), // time-lapse
  champ: sec(12.3), // stadium lights flood the bottom
  punch: sec(14),
};

// ---- LAYOUT ---------------------------------------------------------------
const TOP = { y: 205, h: 345 };
const G_TOP = 520;
const G_BOT = 905;
const H = 190;
const X = 360;

// ---- POSES ----------------------------------------------------------------
const squatUp = pose({ head: -4, frontShoulder: 88, backShoulder: 84, frontElbow: 0, backElbow: 0 });
const squatDown = pose({ dy: 0.17, torso: 22, head: -18, frontShoulder: 92, backShoulder: 88, frontElbow: 0, backElbow: 0, frontHip: 95, backHip: 88, frontKnee: 110, backKnee: 104 });
const sitFloor = pose({ ...POSES.sitHugKnees, head: 35 });

/** Top spotlight on/off (1/0) — off at B.off, on again at B.never, flickers in the lapse, off for good at the payoff. */
const topLightOn = (f: number) => {
  if (f < B.off) return 1;
  if (f < B.never) return 0;
  if (f < B.lapse) return 1;
  if (f < B.champ) return Math.floor((f - B.lapse) / 11) % 3 === 0 ? 1 : 0;
  return 0;
};
/** time-lapse speed multiplier for the squat cycle */
const speedAt = (f: number) => (f >= B.lapse && f < B.champ ? 1 + 3 * progress(f, B.lapse, B.champ - 15, ease.in) : 1);
/** integrated squat phase (cycles) up to frame f, only counting frames where `active(f)` */
const phaseUpTo = (f: number, active: (t: number) => boolean) => {
  let ph = 0;
  for (let t = 0; t < f; t++) if (active(t)) ph += (0.75 * speedAt(t)) / 30;
  return ph;
};
const squat = (ph: number) => lerpPose(squatUp, squatDown, (1 - Math.cos(ph * Math.PI * 2)) / 2);
const day = (f: number) => Math.round(interpolate(f, [B.lapse, B.champ - 10], [1, 365], { ...clamp, easing: ease.in }));
const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

export const NoOneWatching: React.FC = () => {
  const frame = useCurrentFrame();
  const lapse = frame >= B.lapse;
  const champ = frame >= B.champ;
  const gold = progress(frame, B.champ, B.champ + 14, ease.out);

  // ---- TOP: trains only in the light ----
  const on = topLightOn(frame);
  const tPh = phaseUpTo(frame, (t) => topLightOn(t) === 1 && t < B.champ);
  const sinceSwitch = (() => {
    let t = frame;
    while (t > 0 && topLightOn(t - 1) === on) t--;
    return frame - t;
  })();
  const sitT = on ? 1 - progress(sinceSwitch, 0, 8, ease.out) : progress(sinceSwitch, 0, 10, ease.out);
  const tPose = lerpPose(squat(tPh), addPose(sitFloor, breathe(frame, 0.5)), sitT);
  const topReps = Math.floor(tPh + 0.5);
  const topViewers = on ? 12400 + Math.round(Math.sin(frame / 7) * 140) : 0;
  const topDim = champ ? 1 - 0.6 * gold : 1;

  // ---- BOTTOM: trains in the dark ----
  const bPh = phaseUpTo(Math.min(frame, B.champ), () => true);
  const bPose = champ
    ? addPose(poseOnPayoff(frame), breathe(frame))
    : squat(bPh);
  const preReps = Math.floor(phaseUpTo(B.lapse, () => true) + 0.5);
  const botReps = !lapse ? Math.floor(bPh + 0.5) : Math.round(interpolate(day(frame), [1, 365], [preReps, 3650], clamp));
  const botViewers = champ ? Math.round(interpolate(frame, [B.champ, B.champ + 30], [0, 1200000], { ...clamp, easing: ease.out })) : 0;

  const sh = shake(frame, B.champ, 14, 8);
  return (
    <AbsoluteFill>
      <Backdrop mood="night" floor={false} glowStrength={0.4} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* ---- TOP PANEL ---- */}
        <SplitPanel {...TOP} accent={COLORS.orange} dim={(0.35 + 0.65 * on) * topDim} />
        <LightBeam x={X} y={TOP.y + 14} toY={G_TOP} w0={34} w1={250} color="#fff3d6" strength={on * 0.9} />
        <Stickman x={X} y={G_TOP} height={H} pose={tPose} color={champ ? "dim" : "orange"} expression={on ? "happy" : "sad"} glow={0.4 + 0.6 * on} opacity={0.45 + 0.55 * topDim} />
        <PanelCounter y={TOP.y + 18} label="VIEWERS" value={k(topViewers)} color={COLORS.orange} dim={!on} />
        <PanelCounter y={TOP.y + 18} label="REPS" value={String(topReps)} color={COLORS.orange} dim={champ} align="right" />

        {/* ---- BOTTOM PANEL ---- */}
        <SplitPanel {...BOT_PANEL} accent={champ ? COLORS.gold : COLORS.steel} dim={0.5} glow={gold} />
        {champ && (
          <>
            <LightBeam x={70} y={BOT_PANEL.y + 16} toX={X - 40} toY={G_BOT} w0={40} w1={300} color="gold" strength={gold * 0.75} />
            <LightBeam x={650} y={BOT_PANEL.y + 16} toX={X + 40} toY={G_BOT} w0={40} w1={300} color="gold" strength={gold * 0.75} />
            <LightBeam x={X} y={BOT_PANEL.y + 12} toY={G_BOT} w0={30} w1={220} color="#fff3d6" strength={gold * 0.6} fixture={false} />
            <Particles color="gold" count={26} area={{ x: 80, y: BOT_PANEL.y + 40, w: 560, h: BOT_PANEL.h - 60 }} speed={1.3} size={3} />
          </>
        )}
        <Stickman x={X} y={G_BOT} height={H} pose={bPose} color={gold > 0.5 ? "gold" : "steel"} expression={champ ? "happy" : "closed"} glow={0.7 + 1.1 * gold} />
        {champ && (
          <>
            <Crowd x0={40} x1={250} baseY={BOT_PANEL.y + BOT_PANEL.h - 4} count={4} size={95} cheer={gold} opacity={gold} seed={2} />
            <Crowd x0={470} x1={680} baseY={BOT_PANEL.y + BOT_PANEL.h - 4} count={4} size={95} cheer={gold} opacity={gold} seed={5} />
          </>
        )}
        <PanelCounter y={BOT_PANEL.y + 18} label="VIEWERS" value={k(botViewers)} color={champ ? COLORS.gold : COLORS.steel} glow={champ} dim={!champ} />
        <PanelCounter y={BOT_PANEL.y + 18} label="REPS" value={botReps.toLocaleString("en-US")} color={champ ? COLORS.gold : COLORS.steel} glow={champ} align="right" />
        {lapse && <DayPill text={champ ? "DAY 365" : `DAY ${day(frame)}`} gold={champ} />}
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text={"WHO TRAINS WHEN\nNO ONE {gold:WATCHES?}"} start={B.hook} end={B.off} size={42} y={100} />
      <Headline text="{orange:LIGHTS OFF.}" start={B.off} end={B.never} size={48} y={130} />
      <Headline text="{steel:HE} NEVER STOPS." start={B.never} end={B.lapse} size={46} y={130} />
      <Headline text="1 YEAR LATER..." start={B.lapse} end={B.champ} size={46} y={130} />
      <Headline text={"CHAMPIONS ARE BUILT\n{gold:IN THE DARK.}"} start={B.punch} size={44} y={100} glow />
      <Watermark step={Math.min(3, Math.floor(frame / (NO_ONE_WATCHING_DURATION / 4)))} />
      <Vignette strength={0.5} />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={60} />
      <Sfx at={B.hook} name="boom" volume={0.6} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Sfx key={`r${i}`} at={sec(0.67 + i * 1.33)} name="tick" volume={0.22} durationInFrames={8} />
      ))}
      <Sfx at={B.off} name="glitch" volume={0.5} />
      <Sfx at={B.off + 8} name="thud" volume={0.5} />
      <Sfx at={B.never} name="pop" volume={0.45} />
      <Sfx at={B.lapse} name="glitch" volume={0.4} />
      {Array.from({ length: 22 }).map((_, i) => (
        <Sfx key={`d${i}`} at={Math.round(B.lapse + (B.champ - 10 - B.lapse) * Math.pow(i / 22, 0.6))} name="tick" volume={0.2} durationInFrames={8} />
      ))}
      <Sfx at={B.champ - sec(2)} name="riser" volume={0.45} />
      <Sfx at={B.champ} name="boom" volume={0.8} />
      <Sfx at={B.champ} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

const poseOnPayoff = (f: number): Pose =>
  lerpPose(squatUp, POSES.victory, progress(f, B.champ, B.champ + 14, ease.out));
