import React from "react";
import { Composition, Still } from "remotion";
import { VIDEO } from "./lib/theme";
import { TheClimb, THE_CLIMB_DURATION } from "./shorts/the-climb/TheClimb";
import { TheRock, THE_ROCK_DURATION } from "./shorts/the-rock/TheRock";
import { OnePercent, ONE_PERCENT_DURATION } from "./shorts/one-percent/OnePercent";
import { Same24Hours, SAME_24_HOURS_DURATION } from "./shorts/same-24-hours/Same24Hours";
import { CrabBucket, CRAB_BUCKET_DURATION } from "./shorts/crab-bucket/CrabBucket";
import { NoOneWatching, NO_ONE_WATCHING_DURATION } from "./shorts/no-one-watching/NoOneWatching";
import { Iceberg, ICEBERG_DURATION } from "./shorts/iceberg/Iceberg";
import { Overthinker, OVERTHINKER_DURATION } from "./shorts/overthinker/Overthinker";
import { OwnLane, OWN_LANE_DURATION } from "./shorts/own-lane/OwnLane";
import { PoseSheet } from "./shorts/PoseSheet";
import { OrbOfLight3D } from "./three/OrbOfLight3D";
import { ChalkExplainer, calcChalkMetadata } from "./chalk/Explainer";
import { ChalkSheet } from "./chalk/ChalkSheet";
import { TeacherSheet } from "./chalk/TeacherSheet";
import { ChalkThumbnail } from "./chalk/Thumbnail";
import { EPISODES } from "./chalk/episodes";
import { LAYOUTS } from "./chalk/theme";

/**
 * Register every short here. Composition id = PascalCase slug, used by
 *   npm run render -- <Id>
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TheClimb" component={TheClimb} durationInFrames={THE_CLIMB_DURATION} {...VIDEO} />
    <Composition id="TheRock" component={TheRock} durationInFrames={THE_ROCK_DURATION} {...VIDEO} />
    <Composition id="OnePercent" component={OnePercent} durationInFrames={ONE_PERCENT_DURATION} {...VIDEO} />
    <Composition id="Same24Hours" component={Same24Hours} durationInFrames={SAME_24_HOURS_DURATION} {...VIDEO} />
    <Composition id="CrabBucket" component={CrabBucket} durationInFrames={CRAB_BUCKET_DURATION} {...VIDEO} />
    <Composition id="NoOneWatching" component={NoOneWatching} durationInFrames={NO_ONE_WATCHING_DURATION} {...VIDEO} />
    <Composition id="Iceberg" component={Iceberg} durationInFrames={ICEBERG_DURATION} {...VIDEO} />
    <Composition id="Overthinker" component={Overthinker} durationInFrames={OVERTHINKER_DURATION} {...VIDEO} />
    <Composition id="OwnLane" component={OwnLane} durationInFrames={OWN_LANE_DURATION} {...VIDEO} />
    <Composition id="OrbOfLight3D" component={OrbOfLight3D} durationInFrames={150} {...VIDEO} />
    <Still id="PoseSheet" component={PoseSheet} width={VIDEO.width} height={VIDEO.height} />

    {/* ChalkTalk channel: each episode.json → <Id>Short (9:16) + <Id>Long (16:9); duration comes from the voice-over */}
    {EPISODES.flatMap((ep) =>
      (["short", "long"] as const).map((format) => (
        <Composition
          key={`${ep.id}-${format}`}
          id={`${ep.id}${format === "short" ? "Short" : "Long"}`}
          component={ChalkExplainer}
          defaultProps={{ episode: ep, format, timing: null }}
          calculateMetadata={calcChalkMetadata}
          durationInFrames={300}
          fps={30}
          width={LAYOUTS[format].W}
          height={LAYOUTS[format].H}
        />
      )),
    )}
    {EPISODES.flatMap((ep) =>
      (["short", "long"] as const).map((format) => (
        <Still
          key={`${ep.id}-thumb-${format}`}
          id={`${ep.id}Thumb${format === "short" ? "Short" : "Long"}`}
          component={ChalkThumbnail}
          defaultProps={{ episode: ep, format }}
          width={LAYOUTS[format].W}
          height={LAYOUTS[format].H}
        />
      )),
    )}
    <Still id="ChalkSheet" component={ChalkSheet} width={720} height={1280} />
    <Still id="TeacherSheet" component={TeacherSheet} width={720} height={1280} />
  </>
);
