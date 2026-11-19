// ChalkTalk channel — chalkboard data explainers with an edge-tts voice-over.
// One episode.json renders two formats: "short" (9:16) and "long" (16:9).

export const CHALK_CHANNEL = "ChalkTalk";
export const FPS = 30;

export type Format = "short" | "long";

/** Chalk palette. Use names in episode.json markup: "{yellow:SKIES}". */
export const CHALK = {
  white: "#f1efe6",
  dim: "#a9b3ab",
  yellow: "#f4d35e",
  pink: "#f28fb0",
  blue: "#8ecbf0",
  green: "#9be39b",
  orange: "#f5a65b",
  red: "#ef6f6c",
  board: "#1f2d27",
  boardDark: "#16211c",
  wood: "#6b4529",
} as const;

export type ChalkColor = keyof typeof CHALK;
export const chalkColor = (c?: string) => (c && c in CHALK ? CHALK[c as ChalkColor] : c ?? CHALK.white);

export const CHALK_FONTS = {
  /** headlines, big numbers */
  title: "'Gochi Hand', 'Patrick Hand', 'Comic Sans MS', cursive",
  /** body, labels, captions — more legible */
  body: "'Patrick Hand', 'Gochi Hand', 'Comic Sans MS', cursive",
  /** thumbnails: clean, heavy, readable at phone size (Roboto Black 900) */
  bold: "'Roboto', 'Arial Black', Arial, sans-serif",
};

/** Layout per format (px). All scene templates read positions from here. */
export type Layout = {
  W: number;
  H: number;
  pad: number;
  /** persistent episode header (small) */
  headerY: number;
  /** stage = where scene content goes */
  stage: { x: number; y: number; w: number; h: number };
  /** presenter stickman */
  presenter: { x: number; ground: number; height: number };
  /** caption band centre y + max width */
  captionY: number;
  captionW: number;
  captionSize: number;
  /** bottom area covered by platform UI (shorts) — decorative only below this */
  deadZoneY: number;
  /** scale factor for type relative to the short layout */
  k: number;
};

export const LAYOUTS: Record<Format, Layout> = {
  short: {
    W: 720,
    H: 1280,
    pad: 48,
    headerY: 120,
    stage: { x: 48, y: 210, w: 624, h: 620 },
    presenter: { x: 622, ground: 850, height: 236 },
    captionY: 915,
    captionW: 640,
    captionSize: 50,
    deadZoneY: 1000,
    k: 1,
  },
  long: {
    W: 1280,
    H: 720,
    pad: 60,
    headerY: 62,
    stage: { x: 60, y: 120, w: 960, h: 470 },
    presenter: { x: 1138, ground: 600, height: 290 },
    captionY: 650,
    captionW: 1100,
    captionSize: 40,
    deadZoneY: 720,
    k: 0.82,
  },
};

/** Voice-over pacing defaults (seconds). */
export const VO = {
  /** silence before the narrator starts a scene */
  lead: 0.25,
  /** hold after the narrator finishes a scene (scene.pause overrides) */
  tail: 0.45,
  /** words per second used to fake timings before TTS has run */
  estWps: { short: 2.9, long: 2.6 },
};
