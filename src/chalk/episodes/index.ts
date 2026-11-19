import type { Episode } from "../types";
import top10AirForces from "./top10-air-forces/episode.json";

/** Every ChalkTalk episode. Each one is registered twice: <id>Short (9:16) and <id>Long (16:9). */
export const EPISODES: Episode[] = [top10AirForces as Episode];
