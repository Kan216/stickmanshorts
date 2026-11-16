import { Easing, interpolate, spring } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Seconds -> frames (30fps default). Write timings in seconds, render in frames. */
export const sec = (s: number, fps = 30) => Math.round(s * fps);

export const ease = {
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: (t: number) => t,
};

/** 0→1 progress between two frames, eased and clamped. */
export const progress = (
  frame: number,
  from: number,
  to: number,
  easing: (t: number) => number = ease.inOut,
) => interpolate(frame, [from, to], [0, 1], { ...clamp, easing });

/** Fade in at `start`, optionally fade out at `end`. */
export const fade = (frame: number, start: number, dur = 10, end?: number, outDur = 10) => {
  const a = progress(frame, start, start + dur, ease.out);
  if (end === undefined) return a;
  return a * (1 - progress(frame, end - outDur, end, ease.in));
};

/** Bouncy pop scale (0→1 with overshoot) starting at `start`. */
export const pop = (frame: number, start: number, fps = 30, stiffness = 180) =>
  spring({ frame: frame - start, fps, config: { damping: 14, stiffness, mass: 0.6 } });

/** Small camera / object shake. Deterministic (no Math.random). */
export const shake = (frame: number, start: number, dur: number, amp = 8) => {
  if (frame < start || frame > start + dur) return { x: 0, y: 0 };
  const k = 1 - (frame - start) / dur;
  return {
    x: Math.sin(frame * 2.7) * amp * k,
    y: Math.cos(frame * 3.3) * amp * k,
  };
};

/** Deterministic pseudo-random in [0,1) — use instead of Math.random(). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Typewriter: how many characters of `text` are visible. */
export const typed = (frame: number, start: number, text: string, cps = 22, fps = 30) =>
  text.slice(0, Math.max(0, Math.floor(((frame - start) / fps) * cps)));

/** Count from `from` to `to` between two frames (integer). */
export const countUp = (frame: number, start: number, end: number, from: number, to: number) =>
  Math.round(interpolate(frame, [start, end], [from, to], { ...clamp, easing: ease.out }));
