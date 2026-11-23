import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../lib/anim";
import { useChalk } from "./Board";
import { cueFrame } from "./plan";
import { Effect, Expression, GESTURES, GestureName, Teacher, lerpArms } from "./Teacher";
import type { EraScene, PlannedScene, RankScene, VersusScene, Word } from "./types";

/**
 * The "director" for the presenter: turns each scene's narration into gestures,
 * expressions, pop-up effects and a lip-synced mouth, so it looks like the
 * teacher is explaining the board.
 */

type Key = { f: number; arms: GestureName; expr?: Expression; fx?: Effect; fxFrames?: number };

const firstWordAfter = (words: Word[], test: (w: Word) => boolean, fallback: number) => {
  const i = words.findIndex((w, j) => j > 0 && test(words[j - 1]));
  return i > 0 ? words[i].f : fallback;
};

/** Beat gestures while explaining: change hands every few words. */
const beats = (words: Word[], from: number, every = 6): Key[] => {
  const cycle: GestureName[] = ["explain", "open", "pointUp", "explain"];
  const out: Key[] = [];
  let n = 0;
  words.forEach((w, i) => {
    if (w.f > from && i % every === 0) out.push({ f: w.f, arms: cycle[n++ % cycle.length] });
  });
  return out;
};

const sceneKeys = (ps: PlannedScene): Key[] => {
  const s = ps.scene;
  const w = ps.words;
  const lastEnd = w.length ? w[w.length - 1].end : ps.dur;
  switch (s.type) {
    case "hook": {
      const ideaAt = firstWordAfter(w, (x) => /\?$/.test(x.w), Math.round(lastEnd * 0.6));
      return [
        { f: 0, arms: "chin", expr: "thinking", fx: "question" },
        { f: ideaAt, arms: "pointUp", expr: "idea", fx: "bulb" },
      ];
    }
    case "rank": {
      const r = s as RankScene;
      const nameAt = cueFrame(w, r.name.split(" ")[0], 10);
      const statAt = cueFrame(w, String(r.stats[0]?.value ?? ""), nameAt + 14, nameAt);
      const keys: Key[] = [
        { f: 0, arms: "explain" },
        { f: nameAt, arms: "open" },
      ];
      if (r.rank === 1) {
        keys.push({ f: statAt, arms: "cheeks", expr: "surprised", fx: "exclaim", fxFrames: 50 });
        keys.push(...beats(w, statAt + 40, 5));
      } else {
        keys.push({ f: statAt, arms: "present", fx: "lines", fxFrames: 30 });
        keys.push(...beats(w, statAt + 30, 6));
      }
      return keys;
    }
    case "leaderboard":
      return [{ f: 0, arms: "presentHigh", fx: "lines", fxFrames: 30 }];
    case "outro": {
      const keys: Key[] = [{ f: 0, arms: "open" }];
      const comments = cueFrame(w, "comments", -1);
      if (comments > 0) keys.push({ f: comments, arms: "pointUp" });
      keys.push({ f: lastEnd + 4, arms: "wave", expr: "happy", fx: "sparkle" });
      return keys;
    }
    case "era": {
      const e = s as EraScene;
      const yrs = (e.end - e.start).toLocaleString("en-US");
      const durAt = cueFrame(w, yrs, 40);
      const keys: Key[] = [{ f: 0, arms: "explain" }, { f: durAt, arms: "present", fx: "lines", fxFrames: 30 }];
      if (e.rank === 1) keys[1] = { f: durAt, arms: "cheeks", expr: "surprised", fx: "exclaim", fxFrames: 50 };
      keys.push(...beats(w, durAt + 40, 7));
      return keys;
    }
    case "versus": {
      const v = s as VersusScene;
      const aVal = cueFrame(w, v.a.cue ?? String(v.a.value), 40);
      const bVal = cueFrame(w, v.b.cue ?? String(v.b.value), aVal + 25, aVal + 1);
      const winAt = v.winCue ? cueFrame(w, v.winCue, bVal + 25, bVal + 1) : bVal + 25;
      return [
        { f: 0, arms: "chin", expr: "thinking", fx: "question" },
        { f: aVal, arms: "present" },
        { f: bVal, arms: "presentHigh" },
        { f: winAt, arms: "cheer", expr: "happy", fx: "sparkle" },
      ];
    }
    case "timeline":
      return [{ f: 0, arms: "presentHigh", fx: "lines", fxFrames: 30 }, ...beats(w, 60, 8)];
  }
};

/** Mouth openness from word timings: flaps while a word is spoken, closed between words. */
const mouthAt = (words: Word[], f: number) => {
  const i = words.findIndex((w) => f >= w.f && f < w.end);
  if (i < 0) return 0;
  const w = words[i];
  const edge = Math.min(1, (f - w.f) / 2, (w.end - f) / 2);
  return Math.max(0, edge) * (0.35 + 0.65 * Math.abs(Math.sin((f - w.f) * 1.15 + i * 1.7)));
};

export const Presenter: React.FC<{ plan: PlannedScene[] }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { L } = useChalk();
  const si = plan.findIndex((p) => frame >= p.from && frame < p.from + p.dur);
  const ps = plan[si >= 0 ? si : plan.length - 1];
  if (!ps) return null;
  const f = frame - ps.from;

  const keys = sceneKeys(ps);
  let ki = 0;
  keys.forEach((k, i) => {
    if (k.f <= f) ki = i;
  });
  const key = keys[ki];
  // previous gesture: earlier key in this scene, or the last key of the previous scene
  const prevScene = si > 0 ? plan[si - 1] : null;
  const prevKey = ki > 0 ? keys[ki - 1] : prevScene ? sceneKeys(prevScene).slice(-1)[0] : key;
  const t = interpolate(f, [key.f, key.f + 7], [0, 1], { ...clamp, easing: ease.inOut });
  let arms = lerpArms(GESTURES[prevKey.arms], GESTURES[key.arms], ki === 0 && !prevScene ? 1 : t);
  if (key.arms === "wave") {
    const osc = Math.sin(frame / 3.2) * 18;
    arms = { ...arms, front: { ...arms.front, b: arms.front.b + osc } };
  }

  const mouth = mouthAt(ps.words, f);
  const expr: Expression = key.expr ?? (mouth > 0 ? "talk" : "neutral");
  const fxAge = f - key.f;
  const fxOn = key.fx && (!key.fxFrames || fxAge < key.fxFrames);
  const fxT = fxOn ? interpolate(fxAge, [0, 8], [0, 1], clamp) * (key.fxFrames ? interpolate(fxAge, [key.fxFrames - 6, key.fxFrames], [1, 0], clamp) : 1) : 0;
  const tilt = key.arms === "present" || key.arms === "presentHigh" ? -5 : key.expr === "thinking" ? 7 : Math.sin(frame / 40) * 2;
  const enter = interpolate(frame, [0, 8], [0, 1], clamp);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: enter }}>
      <Teacher
        x={L.presenter.x}
        ground={L.presenter.ground}
        height={L.presenter.height}
        facing={-1}
        arms={arms}
        expression={expr}
        mouth={mouth}
        effect={fxOn ? key.fx : "none"}
        effectT={fxT}
        tilt={tilt}
        canvas={{ w: L.W, h: L.H }}
      />
    </div>
  );
};
