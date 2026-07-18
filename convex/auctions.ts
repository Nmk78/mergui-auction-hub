import { getAuthUserId } from "@convex-dev/auth/server";
import { makeFunctionReference } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { DataModel, MutationCtx, QueryCtx } from "./lib/server";
import { internalMutation, mutation, query } from "./lib/server";
import { requireProfile, writeActivity } from "./lib/auth";

const closeAuctionRef =
  makeFunctionReference<"mutation">("auctions:closeAuction");
const startAuctionRef =
  makeFunctionReference<"mutation">("auctions:startAuction");

export const publish = mutation({
  args: {
    batchId: v.id("batches"),
    startingPrice: v.number(),
    minimumIncrement: v.number(),
    startsAt: v.number(),
    endsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.status !== "ready") {
      throw new ConvexError("Only assessed and ready batches can be published.");
    }
    if (batch.imageStorageIds.length === 0) {
      throw new ConvexError("The batch must include at least one photo.");
    }
    const assessment = await ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", args.batchId))
      .unique();
    if (!assessment || assessment.status !== "completed") {
      throw new ConvexError("A completed AI visual assessment is required.");
    }
    const existing = await ctx.db
      .query("auctions")
      .withIndex("by_batch", (query) => query.eq("batchId", args.batchId))
      .first();
    if (existing) {
      throw new ConvexError("This batch already has an auction record.");
    }
    assertMoney(args.startingPrice, "Starting price");
    assertMoney(args.minimumIncrement, "Minimum increment");

    const now = Date.now();
    if (!Number.isFinite(args.startsAt) || args.startsAt < now - 60_000) {
      throw new ConvexError("Auction start time cannot be in the past.");
    }
    if (
      !Number.isFinite(args.endsAt) ||
      args.endsAt < Math.max(args.startsAt, now) + 5 * 60_000
    ) {
      throw new ConvexError("Auction must run for at least 5 minutes.");
    }
    if (args.endsAt > now + 14 * 24 * 60 * 60 * 1000) {
      throw new ConvexError("Auction end time must be within 14 days.");
    }

    const auctionId = await ctx.db.insert("auctions", {
      batchId: args.batchId,
      sellerId: userId,
      startingPrice: args.startingPrice,
      minimumIncrement: args.minimumIncrement,
      currentPrice: args.startingPrice,
      bidCount: 0,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      status: args.startsAt > now ? "scheduled" : "live",
      createdAt: now,
    });
    if (args.startsAt > now) {
      await ctx.scheduler.runAt(args.startsAt, startAuctionRef, { auctionId });
    }
    const scheduledFunctionId = await ctx.scheduler.runAt(
      args.endsAt,
      closeAuctionRef,
      { auctionId },
    );
    await ctx.db.patch(auctionId, { scheduledFunctionId });
    await ctx.db.patch(args.batchId, { status: "auction", updatedAt: now });
    await writeActivity(ctx, {
      userId,
      action: "auction.published",
      entityType: "auction",
      entityId: auctionId,
      metadata: {
        batchId: args.batchId,
        startingPrice: args.startingPrice,
        endsAt: args.endsAt,
      },
    });
    return auctionId;
  },
});

export const placeBid = mutation({
  args: {
    auctionId: v.id("auctions"),
    amount: v.number(),
  },
  handler: async (ctx, { auctionId, amount }) => {
    const { userId } = await requireProfile(ctx, "buyer");
    const auction = await ctx.db.get(auctionId);
    if (!auction) {
      throw new ConvexError("Auction not found.");
    }
    const now = Date.now();
    if (now >= auction.endsAt) {
      await closeAuctionRecord(ctx, auction);
      throw new ConvexError("This auction has ended.");
    }
    if (now < auction.startsAt) {
      throw new ConvexError("This auction has not started.");
    }
    const effectiveStatus =
      auction.status === "scheduled" && now >= auction.startsAt
        ? "live"
        : auction.status;
    if (effectiveStatus === "live" && auction.status === "scheduled") {
      await ctx.db.patch(auctionId, { status: "live" });
    }
    if (effectiveStatus !== "live") {
      throw new ConvexError("This auction is not accepting bids.");
    }
    if (auction.sellerId === userId) {
      throw new ConvexError("Sellers cannot bid on their own batches.");
    }
    assertMoney(amount, "Bid");
    const minimum =
      auction.bidCount === 0
        ? auction.startingPrice
        : auction.currentPrice + auction.minimumIncrement;
    if (amount < minimum) {
      throw new ConvexError(`The next bid must be at least ${minimum} MMK.`);
    }

    const bidId = await ctx.db.insert("bids", {
      auctionId,
      bidderId: userId,
      amount,
      placedAt: now,
    });
    await ctx.db.patch(auctionId, {
      currentPrice: amount,
      currentBidId: bidId,
      currentBidderId: userId,
      bidCount: auction.bidCount + 1,
    });
    await writeActivity(ctx, {
      userId,
      action: "bid.placed",
      entityType: "auction",
      entityId: auctionId,
      metadata: { bidId, amount },
    });
    return bidId;
  },
});

export const closeAuction = internalMutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, { auctionId }) => {
    const auction = await ctx.db.get(auctionId);
    if (!auction || auction.status === "closed" || auction.status === "cancelled") {
      return null;
    }
    return closeAuctionRecord(ctx, auction);
  },
});

export const startAuction = internalMutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, { auctionId }) => {
    const auction = await ctx.db.get(auctionId);
    if (!auction || auction.status !== "scheduled") {
      return null;
    }
    if (Date.now() >= auction.endsAt) {
      return closeAuctionRecord(ctx, auction);
    }
    await ctx.db.patch(auctionId, { status: "live" });
    return auctionId;
  },
});

export const listPublic = query({
  args: {
    seafoodType: v.optional(
      v.union(
        v.literal("Fish"),
        v.literal("Shrimp"),
        v.literal("Crab"),
        v.literal("Squid"),
      ),
    ),
    status: v.optional(v.union(v.literal("live"), v.literal("scheduled"))),
  },
  handler: async (ctx, args) => {
    const desiredStatus = args.status ?? "live";
    const auctions = await ctx.db
      .query("auctions")
      .withIndex("by_status_end", (query) => query.eq("status", desiredStatus))
      .order("asc")
      .collect();
    const hydrated = await Promise.all(
      auctions.map((auction) => hydrateAuction(ctx, auction)),
    );
    return hydrated.filter(
      (auction) =>
        auction !== null &&
        (!args.seafoodType || auction.batch.seafoodType === args.seafoodType),
    );
  },
});

export const getPublic = query({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, { auctionId }) => {
    const auction = await ctx.db.get(auctionId);
    if (!auction) {
      return null;
    }
    const result = await hydrateAuction(ctx, auction);
    if (!result) {
      return null;
    }
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_auction", (query) => query.eq("auctionId", auctionId))
      .order("desc")
      .take(50);
    const timeline = await Promise.all(
      bids.map(async (bid) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (query) => query.eq("userId", bid.bidderId))
          .unique();
        return {
          id: bid._id,
          amount: bid.amount,
          placedAt: bid.placedAt,
          bidderName: profile?.displayName ?? "Registered buyer",
        };
      }),
    );
    const viewerId = await getAuthUserId(ctx);
    return {
      ...result,
      bids: timeline,
      isLeading: Boolean(viewerId && auction.currentBidderId === viewerId),
    };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "seller");
    const auctions = await ctx.db
      .query("auctions")
      .withIndex("by_seller", (query) => query.eq("sellerId", userId))
      .order("desc")
      .collect();
    return Promise.all(auctions.map((auction) => hydrateAuction(ctx, auction)));
  },
});

export const listPurchases = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "buyer");
    const auctions = await ctx.db
      .query("auctions")
      .withIndex("by_winner", (query) => query.eq("winnerId", userId))
      .order("desc")
      .collect();
    return Promise.all(auctions.map((auction) => hydrateAuction(ctx, auction)));
  },
});

async function closeAuctionRecord(
  ctx: MutationCtx,
  auction: DataModel["auctions"]["document"],
) {
  if (auction.status === "closed" || auction.status === "cancelled") {
    return auction.winnerId ?? null;
  }
  const bids = await ctx.db
    .query("bids")
    .withIndex("by_auction", (query) => query.eq("auctionId", auction._id))
    .collect();
  const winner = [...bids].sort(
    (left, right) =>
      right.amount - left.amount || left.placedAt - right.placedAt,
  )[0];
  const now = Date.now();
  await ctx.db.patch(auction._id, {
    status: "closed",
    winnerId: winner?.bidderId,
    winningBidId: winner?._id,
    currentPrice: winner?.amount ?? auction.startingPrice,
    closedAt: now,
  });
  await ctx.db.patch(auction.batchId, {
    status: winner ? "sold" : "ready",
    updatedAt: now,
  });
  await writeActivity(ctx, {
    action: "auction.closed",
    entityType: "auction",
    entityId: auction._id,
    metadata: {
      winnerId: winner?.bidderId,
      winningBidId: winner?._id,
      amount: winner?.amount,
    },
  });
  return winner?.bidderId ?? null;
}

async function hydrateAuction(
  ctx: QueryCtx,
  auction: DataModel["auctions"]["document"],
) {
  const [batch, assessment, seller] = await Promise.all([
    ctx.db.get(auction.batchId),
    ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", auction.batchId))
      .unique(),
    ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", auction.sellerId))
      .unique(),
  ]);
  if (!batch || !assessment || assessment.status !== "completed" || !seller) {
    return null;
  }
  const images = await Promise.all(
    batch.imageStorageIds.map(async (storageId) => ({
      storageId,
      url: await ctx.storage.getUrl(storageId),
    })),
  );
  let winnerName: string | undefined;
  if (auction.winnerId) {
    const winner = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", auction.winnerId!))
      .unique();
    winnerName = winner?.displayName;
  }
  return {
    id: auction._id,
    batchId: batch._id,
    batch: { ...batch, id: batch._id, images },
    assessment: { ...assessment, id: assessment._id },
    sellerName: seller.businessName ?? seller.displayName,
    startingPrice: auction.startingPrice,
    minimumIncrement: auction.minimumIncrement,
    currentPrice: auction.currentPrice,
    bidCount: auction.bidCount,
    startsAt: auction.startsAt,
    endsAt: auction.endsAt,
    status: auction.status,
    winnerName,
  };
}

function assertMoney(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ConvexError(`${field} must be a positive whole MMK amount.`);
  }
}
