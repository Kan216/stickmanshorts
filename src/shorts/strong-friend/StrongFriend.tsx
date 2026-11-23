/**
 * "The Strong Friend" (18s, 720x1280 @30fps) — A/B split, emotional. TOP:
 * the figure in public, smiling mask on, likes climbing. BOTTOM: at 2 AM the
 * mask comes off, he sits hugging his knees. A friend knocks, sits, and
 * puts a hand on his shoulder while gold light fills the room.
 * Storyboard: storyboards/strong-friend.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline } from "../../components/Text";
import { Crowd, Mask, Spotlight } from "../../components/Props";
import { SplitPanel, PanelCounter, TOP_PANEL, BOT_PANEL } from "../../components/Split";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, POSES, poseAt, solve, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec } from "../../lib/anim";
import { COLORS } from "../../lib/theme";

export const STRONG_FRIEND_DURATION = sec(18);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  thumbs: sec(1.0),
  likesEnd: sec(4.0),
  maskOff: sec(4.0),
  maskDone: sec(6.0),
  hug: sec(7.0),
  knock: sec(11.0),
  check: sec(11.8),
  friendIn: sec(12.5),
  friendTouch: sec(14.5),
  gold: sec(15.0),
};

// ---- LAYOUT ---------------------------------------------------------------
const TOP = { ground: TOP_PANEL.ground, H: 190, x: 300 };
const BOT = { ground: BOT_PANEL.ground, H: 250, x: 260 };
const FRIEND_START = 700;
const FRIEND_X = 430;

export const StrongFriend: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- TOP: in public ----
  const thumbsUp = frame >= B.thumbs;
  const topPose = thumbsUp ? addPose(POSES.holdUp, breathe(frame, 0.8)) : addPose(POSES.stand, breathe(frame, 0.8));
  const topHead = solve(topPose, TOP.x, TOP.ground, TOP.H, 1).head;
  const likes = Math.round(interpolate(frame, [B.thumbs, B.likesEnd], [0, 1248], { ...clamp, easing: ease.out }));
  const topWarm = interpolate(frame, [0, sec(6)], [0.3, 1], clamp);

  // ---- BOTTOM: at 2 AM ----
  const maskLift = progress(frame, B.maskOff, B.maskDone, ease.inOut);
  const hugP = progress(frame, B.hug, B.hug + sec(1.5), ease.inOut);
  const botBase = frame < B.hug ? POSES.sitChair : POSES.sitHugKnees;
  const botPose = addPose(lerpPose(POSES.sitChair, POSES.sitHugKnees, hugP), breathe(frame, 0.5));
  void botBase;
  const botHead = solve(botPose, BOT.x, BOT.ground, BOT.H, 1).head;
  const heart = frame >= B.maskOff;
  const friendX = interpolate(frame, [B.friendIn, B.friendTouch], [FRIEND_START, FRIEND_X], { ...clamp, easing: ease.out });
  const friendArrived = frame >= B.friendTouch;
  const friendWalking = frame >= B.friendIn && !friendArrived;
  const friendPose = friendWalking
    ? walkCycle(frame, { startFrame: B.friendIn, speed: 1.0 }).pose
    : friendArrived
      ? addPose(lerpPose(POSES.stand, POSES.point, progress(frame, B.friendTouch, B.friendTouch + sec(0.6), ease.out)), breathe(frame, 0.4))
      : POSES.stand;
  const goldWarm = interpolate(frame, [B.gold, B.gold + sec(2)], [0, 1], clamp);
  const sadEyes = maskLift > 0.6 && !friendArrived;

  return (
    <AbsoluteFill>
      <Backdrop mood="dusk" glowColor="gold" glowStrength={0.4 + 0.6 * topWarm * 0.5} />
      <SplitPanel y={TOP_PANEL.y} h={TOP_PANEL.h} accent={COLORS.gold} dim={1} glow={0.3 * topWarm} />
      <SplitPanel y={BOT_PANEL.y} h={BOT_PANEL.h} accent={COLORS.steel} dim={0.6} glow={0.1} />

      {/* ---- TOP ---- */}
      <Crowd x0={40} x1={680} baseY={TOP.ground} count={20} size={0.45} rim={COLORS.gold} cheer={thumbsUp ? 1 : 0} opacity={0.7} seed={3} />
      <Stickman x={TOP.x} y={TOP.ground} height={TOP.H} pose={topPose} color="steel" expression="happy" glow={1.3} />
      <Mask head={topHead} r={TOP.H * 0.085} lift={0} color="#f0e6cc" opacity={1} />
      <PanelCounter y={TOP_PANEL.y + 20} label="LIKES" value={likes.toLocaleString("en-US")} color={COLORS.gold} glow={likes > 0} align="left" />

      {/* ---- BOTTOM ---- */}
      <svg width={720} height={1280} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={470} y={650} width={150} height={120} fill="#243049" opacity={0.6} />
        <line x1={545} y1={650} x2={545} y2={770} stroke="#3a4a6a" strokeWidth={3} opacity={0.6} />
        <rect x={60} y={840} width={250} height={65} rx={8} fill="#161b25" />
      </svg>
      <Stickman x={BOT.x} y={BOT.ground} height={BOT.H} pose={botPose} style="silhouette" color="steel" expression={sadEyes ? "sad" : maskLift > 0.6 ? "closed" : "neutral"} glow={0.8} />
      {maskLift < 0.98 && <Mask head={botHead} r={BOT.H * 0.085} lift={maskLift} color="#f0e6cc" opacity={1} />}
      {heart && <Sfx at={B.maskOff} name="heartbeat" volume={0.5} />}
      <Spotlight x={FRIEND_X - 40} y={BOT.ground - 90} r={200} color="gold" strength={goldWarm} />
      <Stickman
        x={friendX}
        y={BOT.ground}
        height={BOT.H}
        pose={friendPose}
        color="gold"
        facing={friendArrived ? -1 : -1}
        expression={friendArrived ? "happy" : "neutral"}
        glow={1.2}
        opacity={friendArrived || friendWalking ? 1 : 0}
      />

      {/* ---- TEXT ---- */}
      <Headline text="THE STRONG ONE." start={B.hook} end={B.check} />
      <Headline text={"CHECK ON YOUR\n{gold:STRONG} FRIENDS."} start={B.check} size={40} glow y={96} />
      <Watermark step={Math.min(3, Math.floor(frame / (STRONG_FRIEND_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={20} />
      <Music file="pad-hope.wav" volume={0.3} fadeIn={sec(10)} fadeOut={45} />
      <Sfx at={B.thumbs} name="pop" volume={0.35} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={`lk${i}`} at={B.thumbs + sec(0.5) * i} name="tick" volume={0.2} durationInFrames={8} />
      ))}
      <Sfx at={B.maskOff} name="glitch" volume={0.3} />
      <Sfx at={B.hug} name="thud" volume={0.35} />
      <Sfx at={B.knock} name="thud" volume={0.5} />
      <Sfx at={B.knock + sec(0.5)} name="thud" volume={0.5} />
      <Sfx at={B.friendIn} name="step" volume={0.3} durationInFrames={8} />
      <Sfx at={B.friendTouch} name="pop" volume={0.45} />
      <Sfx at={B.gold} name="ding" volume={0.6} />
    </AbsoluteFill>
  );
};
