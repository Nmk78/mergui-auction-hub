import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "demo auto bidding tick",
  { seconds: 10 },
  internal.autoBidding.tick,
  {},
);

export default crons;
