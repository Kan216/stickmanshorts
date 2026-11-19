import type { Format } from "./theme";

/** A number on the board. `cue` = word the narrator says when it should appear (default: the number itself). */
export type Stat = { label: string; value: number; unit?: string; cue?: string; color?: string };

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

export type Scene = HookScene | RankScene | LeaderboardScene | OutroScene;

export type Episode = {
  slug: string;
  /** composition id prefix, PascalCase: Top10AirForces → Top10AirForcesShort / Top10AirForcesLong */
  id: string;
  title: string;
  /** small persistent header during data scenes */
  header: string;
  /** what the first stat measures, for the bar + leaderboard ("Total aircraft") */
  metric: string;
  asOf: string;
  sources: string[];
  /** false until the numbers have been checked against the sources */
  verified: boolean;
  voice: { name: string; rateShort?: string; rateLong?: string; pitch?: string };
  music?: { file: string; volume?: number };
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
