/**
 * Stickman pose system — forward kinematics with angles in DEGREES.
 *
 * Angle convention (character facing right, `facing: 1`):
 *   torso     lean of the spine. 0 = upright, +30 = leaning forward, -90 = lying on back.
 *   head      extra nod relative to torso. + = looking down/forward, - = looking up.
 *   *Shoulder arm relative to the torso. 0 = hanging down, 90 = pointing forward,
 *             180 = straight up, -45 = swung back.
 *   *Elbow    forearm bend. + = curls forward/up (like a bicep curl). 0 = straight.
 *   *Hip      thigh relative to the torso. 0 = straight down, 90 = thigh forward (sitting).
 *   *Knee     shin bend. + = shin folds BACKWARD (natural knee). 0 = straight.
 *   dx, dy    hip offset in units of body height H (dy + = lower, e.g. sitting/lying).
 *
 * IMPORTANT: limbs are relative to the TORSO. When the torso leans by T degrees,
 * a leg/arm that should still point straight down needs angle ≈ +T
 * (e.g. bow: torso 55 → hips ≈ 55 so legs stay vertical).
 *
 * "front*" limbs are on the near side (drawn on top, full colour);
 * "back*" limbs are on the far side (drawn first, dimmer) — this gives depth.
 */
import { interpolate } from "remotion";
import { clamp, ease } from "./anim";

export type Pose = {
  dx: number;
  dy: number;
  torso: number;
  head: number;
  frontShoulder: number;
  frontElbow: number;
  backShoulder: number;
  backElbow: number;
  frontHip: number;
  frontKnee: number;
  backHip: number;
  backKnee: number;
};

export const NEUTRAL: Pose = {
  dx: 0,
  dy: 0,
  torso: 0,
  head: 0,
  frontShoulder: 6,
  frontElbow: 6,
  backShoulder: -6,
  backElbow: 6,
  frontHip: 4,
  frontKnee: 2,
  backHip: -4,
  backKnee: 2,
};

export const pose = (p: Partial<Pose>): Pose => ({ ...NEUTRAL, ...p });

/** Library of reusable poses. Combine with `pose({...POSES.x, head: 20})`. */
export const POSES = {
  stand: NEUTRAL,
  standTall: pose({ frontShoulder: 3, backShoulder: -3, frontHip: 2, backHip: -2, head: -4 }),
  slump: pose({ torso: 12, head: 32, frontShoulder: 2, backShoulder: 0, frontElbow: 2, backElbow: 2 }),
  bow: pose({ torso: 55, head: 15, frontShoulder: 62, backShoulder: 52, frontHip: 55, backHip: 52, frontElbow: 5, backElbow: 5, frontKnee: 2, backKnee: 2 }),
  reachUp: pose({ head: -25, frontShoulder: 170, frontElbow: 5, backShoulder: -10 }),
  holdUp: pose({ head: -15, frontShoulder: 150, frontElbow: 30, backShoulder: 10 }),
  bothArmsUp: pose({ head: -10, frontShoulder: 170, backShoulder: 168, frontElbow: 8, backElbow: 8 }),
  victory: pose({ head: -20, frontShoulder: 145, backShoulder: 150, frontElbow: 25, backElbow: 25, torso: -4 }),
  hang: pose({ head: -6, frontShoulder: 172, backShoulder: 170, frontElbow: 6, backElbow: 6, frontHip: 6, backHip: 0, frontKnee: 8, backKnee: 4 }),
  pullUp: pose({ dy: -0.2, head: -4, frontShoulder: 118, backShoulder: 112, frontElbow: 60, backElbow: 64, frontHip: 25, backHip: 12, frontKnee: 50, backKnee: 40 }),
  hangTired: pose({ head: 20, frontShoulder: 175, backShoulder: 174, frontElbow: 0, backElbow: 0, frontHip: 0, backHip: 0, frontKnee: 0, backKnee: 0 }),
  think: pose({ head: 12, frontShoulder: 35, frontElbow: 120, backShoulder: 25, backElbow: 95 }),
  point: pose({ frontShoulder: 85, frontElbow: 0 }),
  push: pose({ torso: 25, frontShoulder: 75, backShoulder: 70, frontElbow: 10, backElbow: 15, frontHip: 38, backHip: -8, frontKnee: 30, backKnee: 5 }),
  carryOverhead: pose({ head: -5, frontShoulder: 165, backShoulder: 160, frontElbow: 30, backElbow: 35, frontKnee: 6, backKnee: 6 }),
  crouch: pose({ dy: 0.21, torso: 35, head: -15, frontShoulder: 60, backShoulder: 50, frontElbow: 20, backElbow: 25, frontHip: 115, backHip: 105, frontKnee: 100, backKnee: 95 }),
  kneel: pose({ dy: 0.23, torso: 5, head: 10, frontHip: 85, frontKnee: 90, backHip: 0, backKnee: 95 }),
  /** Sitting on a chair/bed edge whose seat is ~0.25H above the floor. */
  sitChair: pose({ dy: 0.23, torso: -4, head: 6, frontShoulder: 25, backShoulder: 20, frontElbow: 50, backElbow: 45, frontHip: 88, backHip: 82, frontKnee: 88, backKnee: 84 }),
  /** Sitting on the floor hugging knees. */
  sitHugKnees: pose({ dy: 0.44, torso: 18, head: 25, frontShoulder: 55, backShoulder: 50, frontElbow: 70, backElbow: 75, frontHip: 140, backHip: 135, frontKnee: 150, backKnee: 150 }),
  /** Lying on the back, head behind, feet forward (dy brings hip to floor). */
  lieBack: pose({ dy: 0.44, torso: -90, head: -5, frontShoulder: 10, backShoulder: -5, frontElbow: 5, backElbow: 5, frontHip: 2, backHip: -2, frontKnee: 3, backKnee: 6 }),
  /** Treading water / drowning — arms up, legs kicking. */
  swimUp: pose({ head: -30, frontShoulder: 160, backShoulder: 120, frontElbow: 30, backElbow: 50, frontHip: 20, backHip: -15, frontKnee: 40, backKnee: 30 }),
  /** Archer: front arm holds bow forward, back arm draws string. */
  drawBow: pose({ head: 4, frontShoulder: 90, frontElbow: 0, backShoulder: -85, backElbow: 160, frontHip: 15, backHip: -15 }),
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

const KEYS = Object.keys(NEUTRAL) as (keyof Pose)[];

export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a };
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
};

export const addPose = (a: Pose, b: Partial<Pose>): Pose => {
  const out = { ...a };
  for (const k of KEYS) out[k] = a[k] + (b[k] ?? 0);
  return out;
};

export type PoseKey = {
  /** frame at which this pose is fully reached */
  f: number;
  pose: Pose | PoseName;
  /** easing used to arrive at this key (default inOut) */
  easing?: (t: number) => number;
};

const asPose = (p: Pose | PoseName): Pose => (typeof p === "string" ? POSES[p] : p);

/**
 * Keyframed pose animation.
 *   poseAt(frame, [{f:0,pose:"stand"},{f:20,pose:"reachUp"},{f:50,pose:"bow"}])
 */
export const poseAt = (frame: number, keys: PoseKey[]): Pose => {
  if (keys.length === 0) return NEUTRAL;
  if (frame <= keys[0].f) return asPose(keys[0].pose);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (frame <= k.f) {
      const prev = keys[i - 1];
      const t = interpolate(frame, [prev.f, k.f], [0, 1], { ...clamp, easing: k.easing ?? ease.inOut });
      return lerpPose(asPose(prev.pose), asPose(k.pose), t);
    }
  }
  return asPose(keys[keys.length - 1].pose);
};

/**
 * Walk cycle. `speed` = cycles per second. Returns a pose plus `travel`
 * (how far the hips moved, in units of H, so feet don't slide:
 *   x = startX + walk.travel * H * direction).
 */
export const walkCycle = (frame: number, { speed = 0.9, stride = 1, fps = 30, startFrame = 0 } = {}) => {
  const t = Math.max(0, frame - startFrame) / fps;
  const ph = t * speed * Math.PI * 2;
  const s = Math.sin(ph);
  const legA = 24 * stride;
  const p = pose({
    dy: -Math.abs(Math.cos(ph)) * 0.012 + 0.006,
    torso: 4,
    head: 2,
    frontHip: s * legA,
    backHip: -s * legA,
    frontKnee: 8 + Math.max(0, -Math.cos(ph)) * 38 * stride,
    backKnee: 8 + Math.max(0, Math.cos(ph)) * 38 * stride,
    frontShoulder: -s * 22 * stride,
    backShoulder: s * 22 * stride,
    frontElbow: 14,
    backElbow: 14,
  });
  // stride length per cycle ≈ 0.62H for stride=1
  return { pose: p, travel: t * speed * 0.62 * stride };
};

/** Run cycle: bigger swing, leaning torso, bent arms. */
export const runCycle = (frame: number, { speed = 1.6, fps = 30, startFrame = 0 } = {}) => {
  const t = Math.max(0, frame - startFrame) / fps;
  const ph = t * speed * Math.PI * 2;
  const s = Math.sin(ph);
  const p = pose({
    dy: -Math.abs(Math.sin(ph)) * 0.04 + 0.02,
    torso: 14,
    head: -4,
    frontHip: s * 45,
    backHip: -s * 45,
    frontKnee: 20 + Math.max(0, -Math.cos(ph)) * 85,
    backKnee: 20 + Math.max(0, Math.cos(ph)) * 85,
    frontShoulder: -s * 50,
    backShoulder: s * 50,
    frontElbow: 85,
    backElbow: 85,
  });
  return { pose: p, travel: t * speed * 1.05 };
};

/** Subtle idle breathing to add on top of any static pose (addPose). */
export const breathe = (frame: number, amount = 1): Partial<Pose> => ({
  dy: Math.sin(frame / 22) * 0.004 * amount,
  head: Math.sin(frame / 22 + 1) * 1.5 * amount,
  frontShoulder: Math.sin(frame / 22) * 2 * amount,
  backShoulder: -Math.sin(frame / 22) * 2 * amount,
});

/** Struggle / shiver jitter (deterministic). */
export const tremble = (frame: number, amount = 1): Partial<Pose> => ({
  dx: Math.sin(frame * 1.9) * 0.004 * amount,
  frontShoulder: Math.sin(frame * 2.3) * 3 * amount,
  backShoulder: Math.cos(frame * 2.1) * 3 * amount,
  frontKnee: Math.abs(Math.sin(frame * 1.7)) * 6 * amount,
});

// ---------------------------------------------------------------------------
// Skeleton solve
// ---------------------------------------------------------------------------

export type Pt = { x: number; y: number };

export const PROPORTIONS = {
  thigh: 0.24,
  shin: 0.24,
  torso: 0.3,
  neck: 0.025,
  headR: 0.085,
  upperArm: 0.17,
  forearm: 0.16,
  shoulderDrop: 0.035,
};

const rad = (d: number) => (d * Math.PI) / 180;
/** unit vector for a "down-relative" angle: 0 = down, 90 = forward, 180 = up */
const dir = (deg: number, facing: number): Pt => ({
  x: Math.sin(rad(deg)) * facing,
  y: Math.cos(rad(deg)),
});
const add = (a: Pt, d: Pt, len: number): Pt => ({ x: a.x + d.x * len, y: a.y + d.y * len });

export type Skeleton = {
  hip: Pt;
  neck: Pt;
  shoulder: Pt;
  head: Pt;
  headR: number;
  /** absolute head-up angle, for orienting the face */
  headAngle: number;
  front: { elbow: Pt; hand: Pt; knee: Pt; foot: Pt };
  back: { elbow: Pt; hand: Pt; knee: Pt; foot: Pt };
};

/**
 * Solve joint positions. (x, groundY) is the point between the feet when
 * standing straight; H is the full standing height in px.
 */
export const solve = (p: Pose, x: number, groundY: number, H: number, facing: 1 | -1 = 1): Skeleton => {
  const P = PROPORTIONS;
  const legLen = (P.thigh + P.shin) * H;
  const hip = { x: x + p.dx * H * facing, y: groundY - legLen + p.dy * H };
  const up = dir(180 - p.torso, facing);
  const neck = add(hip, up, P.torso * H);
  const shoulder = add(neck, up, -P.shoulderDrop * H);
  const headUp = dir(180 - p.torso - p.head, facing);
  const head = add(neck, headUp, (P.neck + P.headR) * H);

  const limb = (sh: number, el: number, hp: number, kn: number) => {
    const elbow = add(shoulder, dir(sh - p.torso, facing), P.upperArm * H);
    const hand = add(elbow, dir(sh + el - p.torso, facing), P.forearm * H);
    const knee = add(hip, dir(hp - p.torso, facing), P.thigh * H);
    const foot = add(knee, dir(hp - kn - p.torso, facing), P.shin * H);
    return { elbow, hand, knee, foot };
  };

  return {
    hip,
    neck,
    shoulder,
    head,
    headR: P.headR * H,
    headAngle: p.torso + p.head,
    front: limb(p.frontShoulder, p.frontElbow, p.frontHip, p.frontKnee),
    back: limb(p.backShoulder, p.backElbow, p.backHip, p.backKnee),
  };
};
