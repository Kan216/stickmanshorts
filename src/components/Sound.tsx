import React from "react";
import { Html5Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";

export type SfxName =
  | "pop"
  | "tick"
  | "step"
  | "thud"
  | "whoosh"
  | "riser"
  | "ding"
  | "glitch"
  | "heartbeat"
  | "boom";

/**
 * One sound effect at a given frame. `name` maps to public/sfx/<name>.wav
 * (run `npm run sfx` to generate the starter pack). Pass a path ending in an
 * extension (e.g. "sfx/my-hit.mp3") to use your own file.
 */
export const Sfx: React.FC<{ at: number; name: SfxName | string; volume?: number; durationInFrames?: number }> = ({
  at,
  name,
  volume = 0.8,
  durationInFrames = 90,
}) => {
  const src = /\.\w+$/.test(name) ? staticFile(name) : staticFile(`sfx/${name}.wav`);
  return (
    <Sequence from={at} durationInFrames={durationInFrames} layout="none">
      <Html5Audio src={src} volume={volume} />
    </Sequence>
  );
};

/** Background music bed with fade in/out. File lives in public/music/. */
export const Music: React.FC<{ file: string; volume?: number; fadeIn?: number; fadeOut?: number; startFrom?: number }> = ({
  file,
  volume = 0.35,
  fadeIn = 15,
  fadeOut = 30,
  startFrom = 0,
}) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Html5Audio
      src={staticFile(`music/${file}`)}
      startFrom={startFrom}
      loop
      volume={(f) =>
        volume *
        interpolate(f, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};
