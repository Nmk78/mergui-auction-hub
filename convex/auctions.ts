import { getAuthUserId } from "@convex-dev/auth/server";
import { makeFunctionReference } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { DataModel, MutationCtx, QueryCtx } from "./lib/server";
import { internalMutation, mutation, query } from "./lib/server";
import { requireProfile, writeActivity } from "./lib/auth";
import {
  availableForAuction,
  isPositiveWholeMoney,
  minimumValidBid,
  selectWinningBid,
  settleWinningWallet,
} from "./lib/auctionRules";

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
    const minimum = minimumValidBid(auction);
    if (amount < minimum) {
      throw new ConvexError(`The next bid must be at least ${minimum} MMK.`);
    }

    const bidderWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();
    if (!bidderWallet) {
      throw new ConvexError("Buyer wallet not found.");
    }
    const ownExistingHold =
      auction.currentBidderId === userId ? auction.currentPrice : 0;
    const availableForThisAuction = availableForAuction(
      bidderWallet.balance,
      bidderWallet.reserved,
      ownExistingHold,
    );
    if (availableForThisAuction < amount) {
      throw new ConvexError(
        `Available wallet balance is ${availableForThisAuction} MMK.`,
      );
    }

    const bidId = await ctx.db.insert("bids", {
      auctionId,
      bidderId: userId,
      amount,
      placedAt: now,
    });

    if (auction.currentBidderId) {
      const previousWallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (query) =>
          query.eq("userId", auction.currentBidderId!),
        )
        .unique();
      if (!previousWallet || previousWallet.reserved < auction.currentPrice) {
        throw new ConvexError("Previous bid reservation is inconsistent.");
      }
      const previousReserved = previousWallet.reserved - auction.currentPrice;
      await ctx.db.patch(previousWallet._id, {
        reserved: previousReserved,
        updatedAt: now,
      });
      await recordWalletTransaction(ctx, {
        wallet: previousWallet,
        auctionId,
        type: "release",
        amount: auction.currentPrice,
        reservedAfter: previousReserved,
        note:
          auction.currentBidderId === userId
            ? "Previous bid hold replaced by a higher bid"
            : "Bid hold released after being outbid",
      });
    }

    const bidderReservedBase =
      auction.currentBidderId === userId
        ? bidderWallet.reserved - auction.currentPrice
        : bidderWallet.reserved;
    const bidderReservedAfter = bidderReservedBase + amount;
    await ctx.db.patch(bidderWallet._id, {
      reserved: bidderReservedAfter,
      updatedAt: now,
    });
    await recordWalletTransaction(ctx, {
      wallet: bidderWallet,
      auctionId,
      type: "hold",
      amount: -amount,
      reservedAfter: bidderReservedAfter,
      note: "Funds reserved for leading bid",
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

export const listMyBids = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "buyer");
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_bidder", (query) => query.eq("bidderId", userId))
      .order("desc")
      .collect();

    const byAuction = new Map<
      string,
      {
        bid: (typeof bids)[number];
        myHighestBid: number;
        lastBidAt: number;
      }
    >();
    for (const bid of bids) {
      const key = bid.auctionId.toString();
      const existing = byAuction.get(key);
      if (!existing) {
        byAuction.set(key, {
          bid,
          myHighestBid: bid.amount,
          lastBidAt: bid.placedAt,
        });
        continue;
      }
      existing.myHighestBid = Math.max(existing.myHighestBid, bid.amount);
    }

    const results = await Promise.all(
      [...byAuction.values()].map(async (summary) => {
        const auction = await ctx.db.get(summary.bid.auctionId);
        if (!auction) {
          return null;
        }
        const hydrated = await hydrateAuction(ctx, auction);
        if (!hydrated) {
          return null;
        }
        return {
          ...hydrated,
          myHighestBid: summary.myHighestBid,
          lastBidAt: summary.lastBidAt,
          isLeading:
            auction.status === "live" && auction.currentBidderId === userId,
        };
      }),
    );
    return results.filter((result) => result !== null);
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
  const winner = selectWinningBid(bids);
  const now = Date.now();

  if (winner) {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", winner.bidderId))
      .unique();
    const settlement = wallet
      ? settleWinningWallet(wallet.balance, wallet.reserved, winner.amount)
      : null;
    if (!wallet || !settlement) {
      throw new ConvexError(
        "Winning wallet invariant failed; settlement was not applied.",
      );
    }
    await ctx.db.patch(wallet._id, {
      balance: settlement.balanceAfter,
      reserved: settlement.reservedAfter,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      userId: winner.bidderId,
      auctionId: auction._id,
      type: "purchase",
      amount: -winner.amount,
      balanceAfter: settlement.balanceAfter,
      reservedAfter: settlement.reservedAfter,
      note: "Winning auction settlement",
      createdAt: now,
    });
  }

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

async function recordWalletTransaction(
  ctx: MutationCtx,
  input: {
    wallet: DataModel["wallets"]["document"];
    auctionId: DataModel["auctions"]["document"]["_id"];
    type: "hold" | "release";
    amount: number;
    reservedAfter: number;
    note: string;
  },
) {
  await ctx.db.insert("transactions", {
    walletId: input.wallet._id,
    userId: input.wallet.userId,
    auctionId: input.auctionId,
    type: input.type,
    amount: input.amount,
    balanceAfter: input.wallet.balance,
    reservedAfter: input.reservedAfter,
    note: input.note,
    createdAt: Date.now(),
  });
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
  if (!isPositiveWholeMoney(value)) {
    throw new ConvexError(`${field} must be a positive whole MMK amount.`);
  }
}
