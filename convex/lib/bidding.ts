import { ConvexError } from "convex/values";
import type { DataModel, MutationCtx } from "./server";
import { writeActivity } from "./auth";
import {
  availableForAuction,
  isPositiveWholeMoney,
  minimumValidBid,
  selectWinningBid,
  settleWinningWallet,
} from "./auctionRules";

export async function placeBidForBuyer(
  ctx: MutationCtx,
  input: {
    auctionId: DataModel["auctions"]["document"]["_id"];
    userId: DataModel["users"]["document"]["_id"];
    amount: number;
    activityAction?: string;
    activityMetadata?: Record<string, unknown>;
    holdNote?: string;
  },
) {
  const auction = await ctx.db.get(input.auctionId);
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
    await ctx.db.patch(input.auctionId, { status: "live" });
  }
  if (effectiveStatus !== "live") {
    throw new ConvexError("This auction is not accepting bids.");
  }
  if (auction.sellerId === input.userId) {
    throw new ConvexError("Sellers cannot bid on their own batches.");
  }
  assertMoney(input.amount, "Bid");
  const minimum = minimumValidBid(auction);
  if (input.amount < minimum) {
    throw new ConvexError(`The next bid must be at least ${minimum} MMK.`);
  }

  const bidderWallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (query) => query.eq("userId", input.userId))
    .unique();
  if (!bidderWallet) {
    throw new ConvexError("Buyer wallet not found.");
  }
  const ownExistingHold =
    auction.currentBidderId === input.userId ? auction.currentPrice : 0;
  const availableForThisAuction = availableForAuction(
    bidderWallet.balance,
    bidderWallet.reserved,
    ownExistingHold,
  );
  if (availableForThisAuction < input.amount) {
    throw new ConvexError(
      `Available wallet balance is ${availableForThisAuction} MMK.`,
    );
  }

  const bidId = await ctx.db.insert("bids", {
    auctionId: input.auctionId,
    bidderId: input.userId,
    amount: input.amount,
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
      auctionId: input.auctionId,
      type: "release",
      amount: auction.currentPrice,
      reservedAfter: previousReserved,
      note:
        auction.currentBidderId === input.userId
          ? "Previous bid hold replaced by a higher bid"
          : "Bid hold released after being outbid",
      createdAt: now,
    });
  }

  const bidderReservedBase =
    auction.currentBidderId === input.userId
      ? bidderWallet.reserved - auction.currentPrice
      : bidderWallet.reserved;
  const bidderReservedAfter = bidderReservedBase + input.amount;
  await ctx.db.patch(bidderWallet._id, {
    reserved: bidderReservedAfter,
    updatedAt: now,
  });
  await recordWalletTransaction(ctx, {
    wallet: bidderWallet,
    auctionId: input.auctionId,
    type: "hold",
    amount: -input.amount,
    reservedAfter: bidderReservedAfter,
    note: input.holdNote ?? "Funds reserved for leading bid",
    createdAt: now,
  });

  await ctx.db.patch(input.auctionId, {
    currentPrice: input.amount,
    currentBidId: bidId,
    currentBidderId: input.userId,
    bidCount: auction.bidCount + 1,
  });
  await writeActivity(ctx, {
    userId: input.userId,
    action: input.activityAction ?? "bid.placed",
    entityType: "auction",
    entityId: input.auctionId,
    metadata: {
      bidId,
      amount: input.amount,
      ...input.activityMetadata,
    },
  });
  return bidId;
}

export async function closeAuctionRecord(
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
    createdAt: number;
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
    createdAt: input.createdAt,
  });
}

function assertMoney(value: number, field: string) {
  if (!isPositiveWholeMoney(value)) {
    throw new ConvexError(`${field} must be a positive whole MMK amount.`);
  }
}
