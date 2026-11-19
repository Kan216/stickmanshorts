import { FPS, Format, VO } from "./theme";
import type { Episode, PlannedScene, Scene, Timing, Word } from "./types";

export const scenesFor = (ep: Episode, format: Format) =>
  ep.scenes.map((scene, index) => ({ scene, index })).filter(({ scene }) => !scene.only || scene.only === format);

export const sayFor = (scene: Scene, format: Format) => (format === "long" && scene.sayLong ? scene.sayLong : scene.say);

const f = (s: number) => Math.round(s * FPS);

/**
 * Turn episode + (optional) TTS timing into absolute frames.
 * Without timing.json (TTS not run yet) durations are estimated from word count,
 * so stills and Studio previews still work.
 */
export const buildPlan = (ep: Episode, format: Format, timing?: Timing | null): PlannedScene[] => {
  let cursor = 0;
  return scenesFor(ep, format).map(({ scene, index }) => {
    const text = sayFor(scene, format);
    const t = timing?.scenes.find((s) => s.index === index);
    let voDur: number;
    let words: Word[];
    const lead = f(VO.lead);
    if (t) {
      voDur = t.duration;
      words = t.words.map((w) => ({ w: w.w, f: lead + f(w.t), end: lead + f(w.t + w.d) }));
    } else {
      const toks = text.split(/\s+/).filter(Boolean);
      const wps = VO.estWps[format];
      voDur = toks.length / wps + 0.2;
      words = toks.map((w, i) => ({ w, f: lead + f(i / wps), end: lead + f((i + 0.85) / wps) }));
    }
    const dur = lead + f(voDur) + f(scene.pause ?? VO.tail);
    const p: PlannedScene = { scene, index, from: cursor, dur, voFrom: lead, audio: t?.audio, words, text };
    cursor += dur;
    return p;
  });
};

export const totalFrames = (plan: PlannedScene[]) => plan.reduce((a, s) => a + s.dur, 0);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Frame (scene-relative) when the narrator says `target` (first match at/after `afterFrame`).
 * Numbers match with or without thousands separators. Falls back to `fallback`.
 */
export const cueFrame = (words: Word[], target: string | undefined, fallback: number, afterFrame = 0) => {
  if (!target) return fallback;
  const n = norm(target);
  if (!n) return fallback;
  const hit = words.find((w) => w.f >= afterFrame && norm(w.w).includes(n));
  return hit ? hit.f : fallback;
};
