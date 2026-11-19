import type { Episode } from "../types";
import top10AirForces from "./top10-air-forces/episode.json";
import top10MilitaryBudgets from "./top10-military-budgets/episode.json";
import top10AircraftCarriers from "./top10-aircraft-carriers/episode.json";
import top10Tanks from "./top10-tanks/episode.json";
import top10Navies from "./top10-navies/episode.json";

/** Every ChalkTalk episode. Each one is registered twice: <id>Short (9:16) and <id>Long (16:9). */
export const EPISODES: Episode[] = [
  top10AirForces as Episode,
  top10MilitaryBudgets as Episode,
  top10AircraftCarriers as Episode,
  top10Tanks as Episode,
  top10Navies as Episode,
];
