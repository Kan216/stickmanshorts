import type { Format } from "./theme";

/** A number on the board. `cue` = word the narrator says when it should appear (default: the number itself). */
export type Stat = {
  label: string;
  value: number;
  /** shown before the number, e.g. "$" */
  prefix?: string;
  /** shown after the number, e.g. "B" or " t" */
  unit?: string;
  /** decimals to display (default: as many as `value` has) */
  decimals?: number;
  cue?: string;
  color?: string;
};

type Common = {
  /** narration (both formats unless sayLong is given) */
  say: string;
  /** longer narration for the 16:9 version */
  sayLong?: string;
  /** render this scene only in one format */
  only?: Format;
  /** seconds to hold after narration ends (default VO.tail) */
  pause?: number;
};

export type HookScene = Common & {
  type: "hook";
  /** big title, supports {yellow:WORD} markup and \n */
  title: string;
  subtitle?: string;
};

export type RankScene = Common & {
  type: "rank";
  rank: number;
  /** ISO 3166-1 alpha-2, lowercase: "us", "fr" */
  country: string;
  name: string;
  /** first stat is the headline number and drives the comparison bar */
  stats: Stat[];
  /** short extra fact written under the stats (long format only by default) */
  note?: string;
};

export type LeaderboardScene = Common & {
  type: "leaderboard";
  title?: string;
};

export type OutroScene = Common & {
  type: "outro";
  title: string;
};

/** Long-form history card: a span of years on a timeline + facts written as they're narrated. */
export type EraScene = Common & {
  type: "era";
  rank: number;
  name: string;
  /** years; negative = BC */
  start: number;
  end: number;
  /** dates are estimates → shown with "c." */
  approx?: boolean;
  /** each fact is written when the narrator says its cue word (searched in order) */
  facts: { text: string; cue?: string }[];
};

/** All era scenes of the episode on one shared time axis (Gantt chart). */
export type TimelineScene = Common & {
  type: "timeline";
  title?: string;
};

/** Head-to-head: two people/countries, one number each; the bigger one wins. */
export type VersusSide = { name: string; country: string; value: number; cue?: string };
export type VersusScene = Common & {
  type: "versus";
  a: VersusSide;
  b: VersusSide;
  label?: string;
  prefix?: string;
  unit?: string;
  /** word that triggers the winner circle (default: after the second value) */
  winCue?: string;
};

export type Scene = HookScene | RankScene | LeaderboardScene | OutroScene | EraScene | TimelineScene | VersusScene;

export type Episode = {
  slug: string;
  /** composition id prefix, PascalCase: Top10AirForces → Top10AirForcesShort / Top10AirForcesLong */
  id: string;
  title: string;
  /** small persistent header during data scenes */
  header: string;
  /** what the first stat measures, for the bar + leaderboard ("Total aircraft") */
  metric: string;
  /** prefix/unit for the metric in the bar label + leaderboard, e.g. "$" / "B" */
  metricPrefix?: string;
  metricUnit?: string;
  asOf: string;
  sources: string[];
  /** false until the numbers have been checked against the sources */
  verified: boolean;
  voice: { name: string; rateShort?: string; rateLong?: string; pitch?: string };
  /**
   * Background music. Defaults: Shorts → chalk-curious.wav, long-form → chalk-documentary.wav
   * (original tracks from scripts/gen-music.py). volume = level in gaps; duck = fraction kept under the voice.
   */
  music?: { file?: string; fileLong?: string; volume?: number; duck?: number; off?: boolean };
  /** stop-scroll thumbnail (both formats) */
  thumbnail?: {
    /** 2–4 huge words, {yellow:WORD} markup, \n for lines */
    text: string;
    /** small tag above the big text */
    kicker?: string;
    /** flags to show (ISO-2), in order; the first one gets circled */
    flags?: string[];
    /** labels under the flags, e.g. ["#1", "#2", "#3"] */
    flagLabels?: string[];
    /** values under the flags on the 16:9 thumbnail, e.g. ["13,043", "4,292", "3,309"] */
    flagValues?: string[];
    /** big number badge, e.g. "13,043" */
    badge?: string;
  };
  scenes: Scene[];
  /** formats to register (default both) */
  formats?: Format[];
  /** time axis for era/timeline scenes, in years (negative = BC) */
  timeline?: { from: number; to: number; step?: number };
};

/** Written by scripts/chalk-tts.py → public/chalk/<slug>/<format>/timing.json */
export type Timing = {
  format: Format;
  voice: string;
  scenes: {
    index: number;
    audio: string;
    duration: number;
    words: { w: string; t: number; d: number }[];
  }[];
};

/** Word with frame times relative to the scene start. */
export type Word = { w: string; f: number; end: number };

export type PlannedScene = {
  scene: Scene;
  /** index in episode.scenes (stable id for audio files) */
  index: number;
  from: number;
  dur: number;
  /** frame (scene-relative) when narration starts */
  voFrom: number;
  audio?: string;
  words: Word[];
  text: string;
};
