// Global look & feel for every short. Change CHANNEL_NAME once and every
// short picks it up. Palettes are named "moods" so scripts can say
// `mood: "ember"` instead of hex codes.

export const VIDEO = {
  width: 720,
  height: 1280,
  fps: 30,
} as const;

/** Shown in the small watermark under the ground line. */
export const CHANNEL_NAME = "YOUR CHANNEL";

/** Layout guides (px, for 720x1280). Keep text inside the safe area. */
export const LAYOUT = {
  safeX: 48,
  headlineY: 130, // headline baseline zone
  statsY: 210, // counters / labels row
  groundY: 905, // where feet touch the floor
  watermarkY: 975,
  /** Bottom ~25% is covered by YouTube/TikTok UI — keep it decorative only. */
  uiDeadZoneY: 1000,
} as const;

export const FONTS = {
  headline:
    "'Segoe UI', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', 'Courier New', monospace",
  pixel: "'Press Start 2P', 'DejaVu Sans Mono', monospace",
} as const;

/** Character / accent colours. Use these names in scripts. */
export const COLORS = {
  white: "#eef2f7",
  ink: "#05070b",
  dim: "#5d6675",
  steel: "#8fa3c2",
  teal: "#2ec4a6",
  orange: "#f0702c",
  red: "#e5484d",
  gold: "#f2c14e",
  amber: "#e8a640",
  green: "#4ef08a",
  blue: "#6cb6ff",
  pink: "#e45bd8",
  purple: "#9b7bff",
} as const;

export type ColorName = keyof typeof COLORS;

/** Background moods: top/bottom gradient + floor colour + ambient glow. */
export const MOODS = {
  night: { top: "#000000", bottom: "#05070c", floor: "#0b0e15", ambient: "#1b2333" },
  ember: { top: "#0c0705", bottom: "#140b07", floor: "#100c0a", ambient: "#3a1b0c" },
  forest: { top: "#0b120c", bottom: "#121a12", floor: "#0e130f", ambient: "#1e3a22" },
  ocean: { top: "#0d1520", bottom: "#1a2638", floor: "#121821", ambient: "#25405f" },
  dusk: { top: "#0d0a14", bottom: "#151020", floor: "#0f0d16", ambient: "#2d1f45" },
  bedroom: { top: "#15181d", bottom: "#1d2026", floor: "#121418", ambient: "#3a3f4a" },
  warm: { top: "#1c140b", bottom: "#2a1d10", floor: "#18120b", ambient: "#6b4a1f" },
} as const;

export type MoodName = keyof typeof MOODS;

export const resolveColor = (c: string): string =>
  c in COLORS ? COLORS[c as ColorName] : c;
