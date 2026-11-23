/**
 * "Protect Your Flame" (18s, 720x1280 @30fps) — A/B split. TOP: a figure lights
 * everyone else's candle from his own and goes out. BOTTOM: he cups his flame
 * first, then lights the same five people and keeps his flame at 100%.
 * Storyboard: storyboards/protect-flame.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline } from "../../components/Text";
import { SplitPanel, PanelCounter, TOP_PANEL, BOT_PANEL } from "../../components/Split";
import { Candle } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, POSES, poseAt, solve, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { COLORS } from "../../lib/theme";

export const PROTECT_FLAME_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  out: sec(11.0),
  yours: sec(11.0),
  protect: sec(14.0),
  cupStart: sec(0.4),
  cupEnd: sec(1.2),
};
const LIGHT = [2.0, 4.2, 6.4, 8.6, 10.8].map(sec); // frame each person is lit
const WALK = sec(0.8);
const PX = [300, 380, 460, 540, 620]; // person x positions (feet), 80px apart so the walker never overlaps them

// Panel geometry
const TOP = { ground: TOP_PANEL.ground, H: 190, startX: 200 };
const BOT = { ground: BOT_PANEL.ground, H: 250, startX: 200 };

/** Walk-then-lean schedule for one figure: returns x, pose, and how many lit so far. */
const schedule = (frame: number, geo: { ground: number; H: number; startX: number }, cup: boolean) => {
  // which person is being approached (the next one to light)
  let x = geo.startX;
  let pose = addPose(POSES.stand, breathe(frame, 0.6));
  let lit = 0;
  for (let i = 0; i < 5; i++) {
    const L = LIGHT[i];
    const walkStart = L - WALK;
    const from = i === 0 ? geo.startX : PX[i - 1] - 40;
    const to = PX[i] - 40;
    if (frame >= L + sec(0.6)) lit = i + 1;
    if (frame >= walkStart && frame < L) {
      const u = ease.inOut(progress(frame, walkStart, L));
      x = from + (to - from) * u;
      pose = walkCycle(frame, { startFrame: walkStart, speed: 1.1 }).pose;
    } else if (frame >= L && frame < (i < 4 ? LIGHT[i + 1] - WALK : L + sec(10))) {
      x = to;
      pose = poseAt(frame, [{ f: L, pose: "stand" }, { f: L + 6, pose: "point", easing: ease.out }]);
    }
  }
  if (!cup && frame < LIGHT[0] - WALK) {
    pose = addPose(POSES.stand, breathe(frame, 0.6));
  }
  return { x, pose, lit };
};

export const ProtectFlame: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- TOP ----
  const top = schedule(frame, TOP, false);
  const topLitCount = top.lit;
  const topFlame = 1 - 0.2 * topLitCount;
  const topOut = topFlame <= 0.001;
  const topPose = topOut && frame >= LIGHT[4] + sec(1) ? addPose(POSES.slump, breathe(frame, 0.5)) : top.pose;
  const topDim = topOut ? 0.6 : 1;
  const topHand = solve(topPose, top.x, TOP.ground, TOP.H, 1).front.hand;
  const topFlameLen = interpolate(frame, [LIGHT[4], LIGHT[4] + sec(0.6)], [0.2, 0], clamp);
  const topLit = (frame >= LIGHT[4] + sec(0.6) ? 0 : 0.2 + topFlame * 0.8) * (topOut ? 0 : 1);
  const topFlameDraw = topOut ? 0 : Math.max(topFlame, 0.2);

  // ---- BOTTOM ----
  const cupping = frame >= B.cupStart && frame < B.cupEnd;
  const bot = schedule(frame, BOT, true);
  const botPose = cupping ? addPose(POSES.think, breathe(frame, 0.5)) : bot.pose;
  const botX = bot.x;
  const botHand = solve(botPose, botX, BOT.ground, BOT.H, 1).front.hand;

  const topCounterValue = `${Math.round(topFlame * 100)}%`;

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" floor={false} stars={0} />
      <SplitPanel y={TOP_PANEL.y} h={TOP_PANEL.h} accent={COLORS.steel} dim={topOut ? 0.4 : 1} glow={topOut ? 0 : 0.4} />
      <SplitPanel y={BOT_PANEL.y} h={BOT_PANEL.h} accent={COLORS.gold} dim={1} glow={0.8} />

      {/* ---- TOP: the one who gives everything away ---- */}
      {PX.map((px, i) => {
        const lit = frame >= LIGHT[i] + sec(0.6);
        return (
          <React.Fragment key={`tp${i}`}>
            <Stickman x={px} y={TOP.ground} height={TOP.H} style="line" color="white" pose={addPose(POSES.holdUp, breathe(frame, 0.4))} expression="neutral" opacity={lit ? 0.9 : 0.5} glow={lit ? 1 : 0.2} />
            <Candle x={solve(addPose(POSES.holdUp, {}), px, TOP.ground, TOP.H, 1).front.hand.x} y={solve(addPose(POSES.holdUp, {}), px, TOP.ground, TOP.H, 1).front.hand.y} lit={lit ? 1 : 0} glow={lit ? 1 : 0} />
          </React.Fragment>
        );
      })}
      <Stickman x={top.x} y={TOP.ground} height={TOP.H} pose={topPose} color="steel" expression={topOut ? "sad" : "neutral"} opacity={topDim} glow={topOut ? 0.4 : 1.1} />
      <Candle x={topHand.x} y={topHand.y} lit={topFlameDraw} glow={topOut ? 0 : 1.2} />

      {/* ---- BOTTOM: the one who keeps his light ---- */}
      {PX.map((px, i) => {
        const lit = frame >= LIGHT[i] + sec(0.6);
        return (
          <React.Fragment key={`bp${i}`}>
            <Stickman x={px} y={BOT.ground} height={BOT.H} style="line" color="white" pose={addPose(POSES.holdUp, breathe(frame, 0.4))} expression="happy" opacity={lit ? 0.95 : 0.5} glow={lit ? 1.2 : 0.2} />
            <Candle x={solve(addPose(POSES.holdUp, {}), px, BOT.ground, BOT.H, 1).front.hand.x} y={solve(addPose(POSES.holdUp, {}), px, BOT.ground, BOT.H, 1).front.hand.y} lit={lit ? 1 : 0} glow={lit ? 1 : 0} />
          </React.Fragment>
        );
      })}
      <Stickman x={botX} y={BOT.ground} height={BOT.H} pose={botPose} color="gold" expression="happy" glow={1.4} />
      <Candle x={botHand.x} y={botHand.y} lit={1} glow={1.4} />

      {/* ---- COUNTERS ---- */}
      <PanelCounter y={TOP_PANEL.y + 20} label="MY FLAME" value={topCounterValue} color={topOut ? COLORS.dim : COLORS.steel} dim={topOut} align="left" glow={!topOut} />
      <PanelCounter y={BOT_PANEL.y + 20} label="MY FLAME" value="100%" color={COLORS.gold} glow align="left" />

      {/* ---- TEXT ---- */}
      <Headline text="YOU GAVE EVERYONE LIGHT." start={B.hook} end={B.yours} size={40} />
      <Headline text="BUT {red:YOURS} WENT OUT." start={B.yours} end={B.protect} size={40} />
      <Headline text={"PROTECT\n{gold:YOUR FLAME.}"} start={B.protect} y={96} size={46} glow />
      <Watermark step={Math.min(3, Math.floor(frame / (PROTECT_FLAME_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-hope.wav" volume={0.3} fadeOut={45} />
      {LIGHT.map((L, i) => (
        <React.Fragment key={`l${i}`}>
          <Sfx at={L} name="pop" volume={0.45} />
          <Sfx at={L - WALK} name="step" volume={0.25} durationInFrames={8} />
        </React.Fragment>
      ))}
      <Sfx at={B.cupStart} name="whoosh" volume={0.35} />
      <Sfx at={LIGHT[4] + sec(0.6)} name="glitch" volume={0.5} />
      <Sfx at={B.yours} name="thud" volume={0.5} />
      <Sfx at={B.protect} name="ding" volume={0.6} />
    </AbsoluteFill>
  );
};
