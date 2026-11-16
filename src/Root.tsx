import React from "react";
import { Composition, Still } from "remotion";
import { VIDEO } from "./lib/theme";
import { TheClimb, THE_CLIMB_DURATION } from "./shorts/the-climb/TheClimb";
import { TheRock, THE_ROCK_DURATION } from "./shorts/the-rock/TheRock";
import { PoseSheet } from "./shorts/PoseSheet";
import { OrbOfLight3D } from "./three/OrbOfLight3D";

/**
 * Register every short here. Composition id = PascalCase slug, used by
 *   npm run render -- <Id>
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TheClimb" component={TheClimb} durationInFrames={THE_CLIMB_DURATION} {...VIDEO} />
    <Composition id="TheRock" component={TheRock} durationInFrames={THE_ROCK_DURATION} {...VIDEO} />
    <Composition id="OrbOfLight3D" component={OrbOfLight3D} durationInFrames={150} {...VIDEO} />
    <Still id="PoseSheet" component={PoseSheet} width={VIDEO.width} height={VIDEO.height} />
  </>
);
