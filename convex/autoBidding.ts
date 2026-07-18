import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { DataModel, MutationCtx } from "./lib/server";
import { internalAction, internalMutation } from "./lib/server";
import { writeActivity } from "./lib/auth";
import { availableForAuction, minimumValidBid } from "./lib/auctionRules";
import { placeBidForBuyer } from "./lib/bidding";

const demoBots = [
  {
    email: "demo-buyer-ayeyar@mergui-auction.local",
    displayName: "Ayar Buyer Group Bot",
    balance: 12_000_000,
  },
  {
    email: "demo-buyer-premium@mergui-auction.local",
    displayName: "Myeik Premium Foods Bot",
    balance: 14_000_000,
  },
  {
    email: "demo-buyer-export@mergui-auction.local",
    displayName: "Tanintharyi Export Desk Bot",
    balance: 16_000_000,
  },
  {
    email: "demo-buyer-coldchain@mergui-auction.local",
    displayName: "Mergui Cold Chain Bot",
    balance: 13_500_000,
  },
  {
    email: "demo-buyer-hotel@mergui-auction.local",
    displayName: "Island Resort Procurement Bot",
    balance: 10_000_000,
  },
  {
    email: "demo-buyer-yangon@mergui-auction.local",
    displayName: "Yangon Wholesale Desk Bot",
    balance: 18_000_000,
  },
  {
    email: "demo-buyer-dawei@mergui-auction.local",
    displayName: "Dawei Seafood Traders Bot",
    balance: 11_500_000,
  },
  {
    email: "demo-buyer-export-jp@mergui-auction.local",
    displayName: "Japan Export Buyer Bot",
    balance: 22_000_000,
  },
  {
    email: "demo-buyer-restaurant@mergui-auction.local",
    displayName: "Chef Supply Collective Bot",
    balance: 9_500_000,
  },
  {
    email: "demo-buyer-market@mergui-auction.local",
    displayName: "Myeik Central Market Bot",
    balance: 8_000_000,
  },
  {
    email: "demo-buyer-processor@mergui-auction.local",
    displayName: "Frozen Processor Desk Bot",
    balance: 19_000_000,
  },
  {
    email: "demo-buyer-premium-retail@mergui-auction.local",
    displayName: "Premium Retail Buyer Bot",
    balance: 15_500_000,
  },
] as const;

type AutoBidResult = {
  enabled: boolean;
  bidsPlaced: number;
  scheduled?: boolean;
  delayMs?: number;
  plannedAttempts?: number;
  skipped?: number;
  failed?: number;
};

export const tick = internalAction({
  args: {},
  handler: async (ctx): Promise<AutoBidResult> => {
    if (!isAutoBiddingEnabled()) {
      return { enabled: false, bidsPlaced: 0 };
    }
    if (Math.random() < 0.3) {
      return { enabled: true, bidsPlaced: 0, scheduled: false };
    }

    const burstRoll = Math.random();
    const attemptCount =
      burstRoll > 0.88
        ? 5
        : burstRoll > 0.58
          ? 3
          : 1 + Math.floor(Math.random() * 2);
    const decisions = Array.from({ length: attemptCount }, () => ({
      auctionOffset: Math.random(),
      bidderOffset: Math.random(),
      incrementSteps: Math.floor(Math.random() * 5),
      skipChance: Math.random(),
    }));
    const delayMs = 2_000 + Math.floor(Math.random() * 22_000);

    await ctx.scheduler.runAfter(delayMs, internal.autoBidding.placeRandomBids, {
      decisions,
    });
    return {
      enabled: true,
      bidsPlaced: 0,
      scheduled: true,
      delayMs,
      plannedAttempts: attemptCount,
    };
  },
});

export const placeRandomBids = internalMutation({
  args: {
    decisions: v.array(
      v.object({
        auctionOffset: v.number(),
        bidderOffset: v.number(),
        incrementSteps: v.number(),
        skipChance: v.number(),
      }),
    ),
  },
  handler: async (ctx, { decisions }): Promise<AutoBidResult> => {
    if (!isAutoBiddingEnabled()) {
      return { enabled: false, bidsPlaced: 0 };
    }

    await ensureDemoBuyers(ctx);

    let bidsPlaced = 0;
    let skipped = 0;
    let failed = 0;

    for (const decision of decisions.slice(0, 5)) {
      if (normalizeOffset(decision.skipChance) < 0.12) {
        skipped += 1;
        continue;
      }

      const auction = await pickLiveAuction(ctx, decision.auctionOffset);
      if (!auction) {
        skipped += 1;
        continue;
      }

      const incrementSteps =
        Math.max(0, Math.floor(Math.abs(decision.incrementSteps))) % 5;
      const amount =
        minimumValidBid(auction) + auction.minimumIncrement * incrementSteps;
      const bidderId = await pickFundedBuyer(
        ctx,
        auction,
        amount,
        decision.bidderOffset,
      );
      if (!bidderId) {
        skipped += 1;
        continue;
      }

      try {
        await placeBidForBuyer(ctx, {
          auctionId: auction._id,
          userId: bidderId,
          amount,
          activityAction: "auto_bid.placed",
          activityMetadata: { source: "convex_cron" },
          holdNote: "Funds reserved for demo auto-bid",
        });
        bidsPlaced += 1;
      } catch {
        failed += 1;
      }
    }

    return { enabled: true, bidsPlaced, skipped, failed };
  },
});

async function ensureDemoBuyers(ctx: MutationCtx) {
  const now = Date.now();

  for (const bot of demoBots) {
    let user = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", bot.email))
      .unique();
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: bot.displayName,
        email: bot.email,
      });
      user = await ctx.db.get(userId);
      await writeActivity(ctx, {
        userId,
        action: "demo_bot.created",
        entityType: "user",
        entityId: userId,
        metadata: { displayName: bot.displayName },
      });
    }
    if (!user) {
      continue;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();
    if (!profile) {
      await ctx.db.insert("profiles", {
        userId: user._id,
        role: "buyer",
        displayName: bot.displayName,
        createdAt: now,
        updatedAt: now,
      });
    } else if (profile.role !== "buyer") {
      continue;
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();
    if (!wallet) {
      await ctx.db.insert("wallets", {
        userId: user._id,
        balance: bot.balance,
        reserved: 0,
        updatedAt: now,
      });
      continue;
    }

    const available = wallet.balance - wallet.reserved;
    const targetBalance =
      available < 3_000_000 ? wallet.reserved + bot.balance : wallet.balance;
    if (targetBalance > wallet.balance) {
      await ctx.db.patch(wallet._id, {
        balance: targetBalance,
        updatedAt: now,
      });
      await ctx.db.insert("transactions", {
        walletId: wallet._id,
        userId: user._id,
        type: "manual_funding",
        amount: targetBalance - wallet.balance,
        balanceAfter: targetBalance,
        reservedAfter: wallet.reserved,
        note: "Demo auto-bid wallet top-up",
        createdAt: now,
      });
    }
  }
}

async function pickLiveAuction(
  ctx: MutationCtx,
  offset: number,
): Promise<DataModel["auctions"]["document"] | null> {
  const now = Date.now();
  const auctions = await ctx.db
    .query("auctions")
    .withIndex("by_status_end", (query) => query.eq("status", "live"))
    .order("asc")
    .take(25);
  const eligible = auctions.filter(
    (auction) => auction.startsAt <= now && auction.endsAt > now,
  );
  if (eligible.length === 0) {
    return null;
  }
  return eligible[pickIndex(eligible.length, offset)];
}

async function pickFundedBuyer(
  ctx: MutationCtx,
  auction: DataModel["auctions"]["document"],
  amount: number,
  offset: number,
) {
  const profiles = await ctx.db
    .query("profiles")
    .withIndex("by_role", (query) => query.eq("role", "buyer"))
    .take(75);
  const start = pickIndex(profiles.length, offset);
  const ordered = [...profiles.slice(start), ...profiles.slice(0, start)];
  const preferred = ordered.filter(
    (profile) =>
      profile.userId !== auction.sellerId &&
      profile.userId !== auction.currentBidderId,
  );
  const fallback = ordered.filter(
    (profile) => profile.userId !== auction.sellerId,
  );

  for (const profile of [...preferred, ...fallback]) {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", profile.userId))
      .unique();
    if (!wallet) {
      continue;
    }
    const existingHold =
      auction.currentBidderId === profile.userId ? auction.currentPrice : 0;
    if (
      availableForAuction(wallet.balance, wallet.reserved, existingHold) >=
      amount
    ) {
      return profile.userId;
    }
  }

  return null;
}

function pickIndex(length: number, offset: number) {
  if (length <= 0) {
    return 0;
  }
  return Math.floor(normalizeOffset(offset) * length) % length;
}

function normalizeOffset(offset: number) {
  if (!Number.isFinite(offset)) {
    return 0;
  }
  return Math.abs(offset) % 1;
}

function isAutoBiddingEnabled() {
  return process.env.AUTO_BIDDING_ENABLED === "true";
}
