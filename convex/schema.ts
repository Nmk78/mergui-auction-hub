import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(v.literal("seller"), v.literal("buyer"));
const seafoodType = v.union(
  v.literal("Fish"),
  v.literal("Shrimp"),
  v.literal("Crab"),
  v.literal("Squid"),
);
const batchStatus = v.union(
  v.literal("draft"),
  v.literal("assessment"),
  v.literal("ready"),
  v.literal("auction"),
  v.literal("sold"),
);
const qualityGrade = v.union(
  v.literal("Export Grade"),
  v.literal("Premium Local"),
  v.literal("Standard Local"),
  v.literal("Low Quality"),
);

const schema = defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    role,
    displayName: v.string(),
    businessName: v.optional(v.string()),
    primaryPort: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    reserved: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  batches: defineTable({
    sellerId: v.id("users"),
    name: v.string(),
    seafoodType,
    quantity: v.number(),
    weightKg: v.number(),
    catchDate: v.number(),
    arrivalDate: v.number(),
    port: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    status: batchStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_seller", ["sellerId", "updatedAt"])
    .index("by_seller_status", ["sellerId", "status"])
    .index("by_status", ["status", "updatedAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["seafoodType", "status"],
    }),

  assessments: defineTable({
    batchId: v.id("batches"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    qualityScore: v.optional(v.number()),
    grade: v.optional(qualityGrade),
    confidence: v.optional(v.number()),
    freshness: v.optional(v.number()),
    appearance: v.optional(v.number()),
    color: v.optional(v.number()),
    damage: v.optional(v.number()),
    sizeConsistency: v.optional(v.number()),
    detectedIssues: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    recommendation: v.optional(v.string()),
    suggestedStartingBid: v.optional(v.number()),
    suggestedMarketPrice: v.optional(v.number()),
    estimatedExportValue: v.optional(v.number()),
    priceExplanation: v.optional(v.string()),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_batch", ["batchId"]),

  auctions: defineTable({
    batchId: v.id("batches"),
    sellerId: v.id("users"),
    startingPrice: v.number(),
    minimumIncrement: v.number(),
    currentPrice: v.number(),
    currentBidId: v.optional(v.id("bids")),
    currentBidderId: v.optional(v.id("users")),
    bidCount: v.number(),
    startsAt: v.number(),
    endsAt: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("closed"),
      v.literal("cancelled"),
    ),
    winnerId: v.optional(v.id("users")),
    winningBidId: v.optional(v.id("bids")),
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_batch", ["batchId"])
    .index("by_seller", ["sellerId", "createdAt"])
    .index("by_status_end", ["status", "endsAt"])
    .index("by_winner", ["winnerId", "closedAt"]),

  bids: defineTable({
    auctionId: v.id("auctions"),
    bidderId: v.id("users"),
    amount: v.number(),
    placedAt: v.number(),
  })
    .index("by_auction", ["auctionId", "placedAt"])
    .index("by_auction_amount", ["auctionId", "amount", "placedAt"])
    .index("by_bidder", ["bidderId", "placedAt"]),

  transactions: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("users"),
    auctionId: v.optional(v.id("auctions")),
    type: v.union(
      v.literal("hold"),
      v.literal("release"),
      v.literal("purchase"),
      v.literal("manual_funding"),
    ),
    amount: v.number(),
    balanceAfter: v.number(),
    reservedAfter: v.number(),
    note: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_auction", ["auctionId", "createdAt"]),

  activityLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_entity", ["entityType", "entityId"]),
});

export default schema;
