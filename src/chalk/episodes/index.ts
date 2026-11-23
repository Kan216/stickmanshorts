import type { Episode } from "../types";
import top10AirForces from "./top10-air-forces/episode.json";
import top10MilitaryBudgets from "./top10-military-budgets/episode.json";
import top10AircraftCarriers from "./top10-aircraft-carriers/episode.json";
import top10Tanks from "./top10-tanks/episode.json";
import top10Navies from "./top10-navies/episode.json";
import longestEmpires from "./longest-empires/episode.json";
import ep_most_subscribed_youtubers from "./most-subscribed-youtubers/episode.json";
import ep_richest_celebrities from "./richest-celebrities/episode.json";
import ep_instagram_most_followed from "./instagram-most-followed/episode.json";
import ep_highest_paid_actors from "./highest-paid-actors/episode.json";
import ep_most_viewed_videos from "./most-viewed-videos/episode.json";
import ep_celebrity_private_jets from "./celebrity-private-jets/episode.json";
import ep_celebrity_houses from "./celebrity-houses/episode.json";
import ep_celebrity_weddings from "./celebrity-weddings/episode.json";
import ep_celebrity_cars from "./celebrity-cars/episode.json";
import ep_who_is_richer from "./who-is-richer/episode.json";
import strongestMilitaries from "./strongest-militaries/episode.json";

/** Every ChalkTalk episode. Each one is registered twice: <id>Short (9:16) and <id>Long (16:9). */
export const EPISODES: Episode[] = [
  top10AirForces as Episode,
  top10MilitaryBudgets as Episode,
  top10AircraftCarriers as Episode,
  top10Tanks as Episode,
  top10Navies as Episode,
  longestEmpires as Episode,
  ep_most_subscribed_youtubers as Episode,
  ep_richest_celebrities as Episode,
  ep_instagram_most_followed as Episode,
  ep_highest_paid_actors as Episode,
  ep_most_viewed_videos as Episode,
  ep_celebrity_private_jets as Episode,
  ep_celebrity_houses as Episode,
  ep_celebrity_weddings as Episode,
  ep_celebrity_cars as Episode,
  ep_who_is_richer as Episode,
  strongestMilitaries as Episode,
];
