import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    AUTO_BIDDING_ENABLED: v.optional(
      v.union(v.literal("true"), v.literal("false")),
    ),
    DEBUG_TOOLS_ENABLED: v.optional(
      v.union(v.literal("true"), v.literal("false")),
    ),
  },
});
