/**
 * "The Rock" (20s, 720x1280 @30fps) — consistency beats talent, versus lanes.
 * TALENT swings hard for 3 days and quits. CONSISTENCY taps every day;
 * on day 100 the rock splits open. Storyboard: storyboards/the-rock.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Vignette, Watermark } from "../../components/Scene";
import { Stickman } from "../../components/Stickman";
import { Headline, StatRow } from "../../components/Text";
import { Boulder, LaneLight, Particles } from "../../components/Props";
import { Music, Sfx } from "../../components/Sound";
import { addPose, breathe, lerpPose, poseAt, PoseKey, POSES, tremble, walkCycle } from "../../lib/pose";
import { clamp, ease, progress, sec, shake } from "../../lib/anim";
import { COLORS, LAYOUT } from "../../lib/theme";

export const THE_ROCK_DURATION = sec(20);

// ---- BEATS ----------------------------------------------------------------
const B = {
  hook: 0,
  work: sec(1.5), // both start working; "TALENT HITS HARD."
  talentHits: [sec(2.5), sec(3.5), sec(4.5)],
  bored: sec(5.5), // "TALENT GOT BORED."
  drop: sec(6),
  leave: sec(6.5),
  keep: sec(8.5), // "CONSISTENCY KEPT SHOWING UP."
  day99: sec(12.5), // "DAY 99. NOTHING."
  riser: sec(13),
  lastTap: sec(14),
  hit100: sec(15),
  punch: sec(16),
};

// ---- LAYOUT ---------------------------------------------------------------
const G = LAYOUT.groundY;
const H = 270;
const T_X = 42; // talent feet
const C_X = 398; // consistency feet
const ROCK_DX = 212; // rock centre relative to the character
const TAP = 12; // frames per tap

// Consistency tap impacts: every TAP frames, aligned so the last regular tap lands on B.lastTap.
const tapImpacts: number[] = [];
for (let t = B.lastTap; t >= B.work + TAP; t -= TAP) tapImpacts.unshift(t);

/** Big overhead swing keys landing at `hit`. */
const swingKeys = (hit: number): PoseKey[] => [
  { f: hit - 22, pose: "hammerReady" },
  { f: hit - 8, pose: "hammerUp", easing: ease.out },
  { f: hit, pose: "hammerDown", easing: ease.in },
  { f: hit + 6, pose: "hammerDown" },
  { f: hit + 16, pose: "hammerReady" },
];

/** Small repeated tap; u = frames since the last impact (0..TAP). */
const tapPose = (frame: number) => {
  const u = (((frame - B.lastTap) % TAP) + TAP) % TAP;
  if (u < 2) return POSES.tapDown;
  if (u < 9) return lerpPose(POSES.tapDown, POSES.tapUp, ease.out((u - 2) / 7));
  return lerpPose(POSES.tapUp, POSES.tapDown, ease.in((u - 9) / 3));
};

export const TheRock: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- TALENT ----
  const talentSwings = B.talentHits.filter((h) => frame >= h).length;
  const leaving = frame >= B.leave;
  const walk = walkCycle(frame, { startFrame: B.leave, speed: 1.1 });
  const tX = leaving ? T_X - walk.travel * H : T_X;
  const tPose = leaving
    ? walk.pose
    : frame >= B.bored - 15
      ? addPose(poseAt(frame, [{ f: B.bored - 15, pose: "hammerReady" }, { f: B.bored, pose: "slump" }]), tremble(frame, frame < B.drop ? 1.4 : 0.4))
      : frame >= B.talentHits[0] - 22
        ? poseAt(frame, B.talentHits.flatMap(swingKeys))
        : addPose(POSES.hammerReady, breathe(frame));
  const tCrack = interpolate(
    frame,
    [B.talentHits[0], B.talentHits[0] + 4, B.talentHits[1], B.talentHits[1] + 4, B.talentHits[2], B.talentHits[2] + 4],
    [0, 0.16, 0.16, 0.28, 0.28, 0.36],
    clamp,
  );
  const tOpacity = leaving ? interpolate(tX, [-60, 40], [0, 0.6], clamp) : 1;

  // ---- CONSISTENCY ----
  const finalSwing = frame >= B.lastTap + 2;
  const won = frame >= B.hit100;
  const cPose = won
    ? addPose(poseAt(frame, [{ f: B.hit100 + 8, pose: "hammerDown" }, { f: B.hit100 + 30, pose: "victory", easing: ease.out }]), breathe(frame))
    : finalSwing
      ? poseAt(frame, [
          { f: B.lastTap + 2, pose: "tapDown" },
          { f: B.hit100 - 8, pose: "hammerUp", easing: ease.out },
          { f: B.hit100, pose: "hammerDown", easing: ease.in },
        ])
      : frame >= B.work
        ? tapPose(frame)
        : addPose(POSES.hammerReady, breathe(frame));
  const cDay = won ? 100 : Math.floor(interpolate(frame, [B.work, B.keep, B.day99], [0, 9, 99], clamp));
  const cCrack = interpolate(frame, [B.work, B.keep, B.day99, B.lastTap], [0, 0.18, 0.72, 0.9], clamp);
  const split = progress(frame, B.hit100, B.hit100 + 18, ease.out);

  // ---- CAMERA ----
  const hits = [...B.talentHits, B.hit100];
  const sh = hits.reduce((acc, h) => {
    const s = shake(frame, h, h === B.hit100 ? 16 : 10, h === B.hit100 ? 12 : 7);
    return { x: acc.x + s.x, y: acc.y + s.y };
  }, { x: 0, y: 0 });
  const zoom = 1 + 0.04 * progress(frame, B.riser, B.hit100, ease.in) - 0.04 * progress(frame, B.hit100, B.hit100 + 20);

  return (
    <AbsoluteFill>
      <Backdrop mood="night" glowColor={won ? "gold" : undefined} glowStrength={won ? 0.9 : 1} />
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <LaneLight x={180} width={330} color="teal" strength={leaving ? 0.25 : 0.9} />
        <LaneLight x={540} width={330} color="gold" strength={won ? 1.4 : 0.9} />

        {/* Talent lane */}
        <Boulder cx={T_X + ROCK_DX} w={205} h={205} impactAt={{ x: -80, y: -130 }} crack={tCrack} crackColor="teal" impacts={B.talentHits} opacity={leaving ? 0.8 : 1} />
        {frame >= B.drop && <DroppedHammer x={T_X + 85} />}
        <Stickman
          x={tX}
          y={G}
          height={H}
          pose={tPose}
          facing={leaving ? -1 : 1}
          color="teal"
          expression={frame >= B.bored - 15 ? "angry" : "neutral"}
          holding={frame < B.drop ? "hammer" : "none"}
          opacity={tOpacity}
          glow={leaving ? 0.5 : 1}
        />

        {/* Consistency lane */}
        <Boulder cx={C_X + ROCK_DX} w={205} h={205} crack={cCrack} split={split} crackColor="gold" impacts={[...tapImpacts, B.hit100]} impactAt={{ x: -80, y: -130 }} />
        {won && <Particles color="gold" count={40} area={{ x: C_X + ROCK_DX - 160, y: G - 520, w: 320, h: 520 }} speed={1.6} size={3} />}
        <Stickman
          x={C_X}
          y={G}
          height={H}
          pose={cPose}
          color="gold"
          expression={won ? "happy" : "neutral"}
          holding="hammer"
          glow={won ? 1.6 : 1}
        />
      </AbsoluteFill>

      {/* ---- TEXT ---- */}
      <Headline text="WHO BREAKS THE ROCK?" start={B.hook} end={B.work} />
      <Headline text="{teal:TALENT} HITS HARD." start={B.work} end={B.bored} />
      <Headline text="{teal:TALENT} GOT BORED." start={B.bored} end={B.keep} />
      <Headline text="{gold:CONSISTENCY} KEPT SHOWING UP." start={B.keep} end={B.day99} size={34} />
      <Headline text="DAY {gold:99.} NOTHING." start={B.day99} end={B.hit100} />
      <Headline text={"IT WASN'T DAY 100.\nIT WAS {gold:EVERY DAY.}"} start={B.punch} size={46} glow />
      <StatRow
        start={B.hook}
        end={B.punch}
        stats={[
          { label: "TALENT", color: "teal", value: `DAY ${talentSwings}`, dim: frame >= B.bored },
          { label: "CONSISTENCY", color: "gold", value: `DAY ${cDay}`, glow: won },
        ]}
      />
      <Watermark step={Math.min(3, Math.floor(frame / (THE_ROCK_DURATION / 4)))} />
      <Vignette />

      {/* ---- SOUND ---- */}
      <Music file="pad-dark.wav" volume={0.3} fadeOut={45} />
      <Sfx at={B.hook} name="boom" volume={0.6} />
      {B.talentHits.map((h, i) => (
        <React.Fragment key={`t${i}`}>
          <Sfx at={h - 9} name="whoosh" volume={0.45} />
          <Sfx at={h} name="thud" volume={0.8} />
        </React.Fragment>
      ))}
      {tapImpacts.filter((t) => t < B.day99 || t % (TAP * 2) === B.lastTap % (TAP * 2)).map((t, i) => (
        <Sfx key={`c${i}`} at={t} name="tick" volume={0.28} durationInFrames={10} />
      ))}
      <Sfx at={B.bored} name="glitch" volume={0.5} />
      <Sfx at={B.drop} name="thud" volume={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`w${i}`} at={B.leave + 14 * i} name="step" volume={0.3} durationInFrames={10} />
      ))}
      <Sfx at={B.day99} name="heartbeat" volume={0.6} />
      <Sfx at={B.day99 + 24} name="heartbeat" volume={0.6} />
      <Sfx at={B.hit100 - sec(2)} name="riser" volume={0.4} />
      <Sfx at={B.hit100 - 9} name="whoosh" volume={0.5} />
      <Sfx at={B.hit100} name="boom" volume={0.8} />
      <Sfx at={B.hit100} name="ding" volume={0.7} />
      <Sfx at={B.punch} name="pop" volume={0.4} />
    </AbsoluteFill>
  );
};

/** Hammer lying on the ground after Talent quits. */
const DroppedHammer: React.FC<{ x: number }> = ({ x }) => (
  <AbsoluteFill>
    <svg width={720} height={1280}>
      <line x1={x - 40} y1={G - 6} x2={x + 25} y2={G - 10} stroke={COLORS.teal} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      <rect x={x + 22} y={G - 30} width={14} height={30} fill={COLORS.ink} stroke={COLORS.teal} strokeWidth={3} opacity={0.8} />
    </svg>
  </AbsoluteFill>
);
