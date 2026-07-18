import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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

const demoSellers = [
  {
    email: "demo-seller-myeik@mergui-auction.local",
    displayName: "Myeik Harbour Seller Bot",
    businessName: "Myeik Harbour Catch (Demo Bot)",
    primaryPort: "Myeik",
  },
  {
    email: "demo-seller-kawthaung@mergui-auction.local",
    displayName: "Kawthaung Seller Bot",
    businessName: "Kawthaung Strait Seafood (Demo Bot)",
    primaryPort: "Kawthaung",
  },
  {
    email: "demo-seller-bokpyin@mergui-auction.local",
    displayName: "Bokpyin Seller Bot",
    businessName: "Bokpyin Coastal Supply (Demo Bot)",
    primaryPort: "Bokpyin",
  },
  {
    email: "demo-seller-dawei@mergui-auction.local",
    displayName: "Dawei Seller Bot",
    businessName: "Dawei Landing Market (Demo Bot)",
    primaryPort: "Dawei",
  },
] as const;

const demoLots = [
  {
    name: "Myeik Tiger Prawns — iced landing",
    seafoodType: "Shrimp",
    quantity: 36,
    weightKg: 48,
    port: "Myeik",
    startingPrice: 1_680_000,
    minimumIncrement: 40_000,
    grade: "Export Grade",
    color: "#d66d4a",
  },
  {
    name: "Andaman Blue Swimming Crab — mixed sizes",
    seafoodType: "Crab",
    quantity: 42,
    weightKg: 64,
    port: "Kawthaung",
    startingPrice: 1_240_000,
    minimumIncrement: 30_000,
    grade: "Premium Local",
    color: "#3d7ca8",
  },
  {
    name: "Myeik Reef Squid — day-boat catch",
    seafoodType: "Squid",
    quantity: 28,
    weightKg: 37,
    port: "Myeik",
    startingPrice: 1_090_000,
    minimumIncrement: 25_000,
    grade: "Premium Local",
    color: "#8777b6",
  },
  {
    name: "Tanintharyi Threadfin Bream — chilled",
    seafoodType: "Fish",
    quantity: 55,
    weightKg: 83,
    port: "Dawei",
    startingPrice: 1_360_000,
    minimumIncrement: 35_000,
    grade: "Standard Local",
    color: "#4b9b86",
  },
] as const;

const DEMO_MARKETPLACE_CAPACITY = 3;
const DEMO_AUCTION_DURATION_MS = 18 * 60 * 1000;

type AutoBidResult = {
  enabled: boolean;
  bidsPlaced: number;
  scheduled?: boolean;
  delayMs?: number;
  plannedAttempts?: number;
  skipped?: number;
  failed?: number;
  listingsScheduled?: number;
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
    const supplyOffset = Math.random();
    const delayMs = 2_000 + Math.floor(Math.random() * 22_000);

    await ctx.scheduler.runAfter(delayMs, internal.autoBidding.placeRandomBids, {
      decisions,
      supplyOffset,
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
    supplyOffset: v.optional(v.number()),
  },
  handler: async (ctx, { decisions, supplyOffset }): Promise<AutoBidResult> => {
    if (!isAutoBiddingEnabled()) {
      return { enabled: false, bidsPlaced: 0 };
    }

    await ensureDemoBuyers(ctx);
    const sellers = await ensureDemoSellers(ctx);
    const listingsScheduled = await maintainDemoMarketplace(
      ctx,
      sellers,
      supplyOffset ?? 0,
    );

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

    return { enabled: true, bidsPlaced, skipped, failed, listingsScheduled };
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

async function ensureDemoSellers(ctx: MutationCtx) {
  const sellerAccounts: Array<{
    userId: DataModel["users"]["document"]["_id"];
    displayName: string;
    businessName: string;
    primaryPort: string;
  }> = [];
  const now = Date.now();

  for (const seller of demoSellers) {
    let user = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", seller.email))
      .unique();
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: seller.displayName,
        email: seller.email,
      });
      user = await ctx.db.get(userId);
      await writeActivity(ctx, {
        userId,
        action: "demo_seller_bot.created",
        entityType: "user",
        entityId: userId,
        metadata: { displayName: seller.displayName },
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
        role: "seller",
        displayName: seller.displayName,
        businessName: seller.businessName,
        primaryPort: seller.primaryPort,
        createdAt: now,
        updatedAt: now,
      });
    } else if (profile.role !== "seller") {
      continue;
    }

    sellerAccounts.push({ userId: user._id, ...seller });
  }

  return sellerAccounts;
}

async function maintainDemoMarketplace(
  ctx: MutationCtx,
  sellers: Awaited<ReturnType<typeof ensureDemoSellers>>,
  offset: number,
) {
  const liveAuctions = await ctx.db
    .query("auctions")
    .withIndex("by_status_end", (query) => query.eq("status", "live"))
    .order("asc")
    .take(DEMO_MARKETPLACE_CAPACITY);
  if (liveAuctions.length >= DEMO_MARKETPLACE_CAPACITY || sellers.length === 0) {
    return 0;
  }

  const seller = sellers[pickIndex(sellers.length, offset)];
  const lot = demoLots[pickIndex(demoLots.length, offset * 17)];
  if (!seller || !lot) {
    return 0;
  }

  const lotIndex = demoLots.indexOf(lot);
  await ctx.scheduler.runAfter(
    0,
    internal.autoBidding.createDemoAuctionWithImage,
    { sellerId: seller.userId, lotIndex },
  );
  return 1;
}

export const createDemoAuctionWithImage = internalAction({
  args: {
    sellerId: v.id("users"),
    lotIndex: v.number(),
  },
  handler: async (ctx, { sellerId, lotIndex }): Promise<number> => {
    const lot = demoLots[Math.floor(lotIndex)];
    if (!lot) {
      return 0;
    }
    const imageStorageId = await ctx.storage.store(
      new Blob([demoSeafoodSvg(lot.name, lot.seafoodType, lot.color)], {
        type: "image/svg+xml",
      }),
    );
    const listingsCreated: number = await ctx.runMutation(
      internal.autoBidding.insertDemoAuction,
      { sellerId, lotIndex, imageStorageId },
    );
    return listingsCreated;
  },
});

export const insertDemoAuction = internalMutation({
  args: {
    sellerId: v.id("users"),
    lotIndex: v.number(),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, { sellerId, lotIndex, imageStorageId }): Promise<number> => {
    const lot = demoLots[Math.floor(lotIndex)];
    if (!lot) {
      await ctx.storage.delete(imageStorageId);
      return 0;
    }
    const liveAuctions = await ctx.db
      .query("auctions")
      .withIndex("by_status_end", (query) => query.eq("status", "live"))
      .order("asc")
      .take(DEMO_MARKETPLACE_CAPACITY);
    const sellerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", sellerId))
      .unique();
    if (
      liveAuctions.length >= DEMO_MARKETPLACE_CAPACITY ||
      !sellerProfile ||
      sellerProfile.role !== "seller"
    ) {
      await ctx.storage.delete(imageStorageId);
      return 0;
    }

    await insertDemoAuctionRecord(ctx, sellerId, lot, imageStorageId);
    return 1;
  },
});

async function insertDemoAuctionRecord(
  ctx: MutationCtx,
  sellerId: DataModel["users"]["document"]["_id"],
  lot: (typeof demoLots)[number],
  imageStorageId: Id<"_storage">,
) {
  const now = Date.now();
  const batchId = await ctx.db.insert("batches", {
    sellerId,
    name: lot.name,
    seafoodType: lot.seafoodType,
    quantity: lot.quantity,
    weightKg: lot.weightKg,
    catchDate: now - 8 * 60 * 60 * 1000,
    arrivalDate: now - 2 * 60 * 60 * 1000,
    port: lot.port,
    description:
      "Automated demo listing supplied by a simulated seller bot for marketplace testing.",
    imageStorageIds: [imageStorageId],
    status: "auction",
    createdAt: now,
    updatedAt: now,
  });
  const assessmentId = await ctx.db.insert("assessments", {
    batchId,
    status: "completed",
    qualityScore: 8.2,
    grade: lot.grade,
    confidence: 82,
    freshness: 8.3,
    appearance: 8.1,
    color: 8.2,
    damage: 8.4,
    sizeConsistency: 7.9,
    detectedIssues: ["Illustrative demo listing; inspect the physical lot before purchase."],
    summary:
      "Simulated assessment for a demo seller-bot listing. This is illustrative marketplace data, not a real AI or physical inspection.",
    recommendation:
      "Use this listing to exercise bidding flows only; arrange normal verification before any real trade decision.",
    suggestedStartingBid: lot.startingPrice,
    suggestedMarketPrice: Math.round(lot.startingPrice * 1.18),
    estimatedExportValue: Math.round(lot.startingPrice * 1.32),
    priceExplanation:
      "Illustrative MMK pricing generated for the demo marketplace; it does not reflect a live market quote.",
    model: "demo-seller-bot",
    createdAt: now,
    completedAt: now,
  });
  const endsAt = now + DEMO_AUCTION_DURATION_MS;
  const auctionId = await ctx.db.insert("auctions", {
    batchId,
    sellerId,
    startingPrice: lot.startingPrice,
    minimumIncrement: lot.minimumIncrement,
    currentPrice: lot.startingPrice,
    bidCount: 0,
    startsAt: now,
    endsAt,
    status: "live",
    createdAt: now,
  });
  const scheduledFunctionId = await ctx.scheduler.runAt(
    endsAt,
    internal.auctions.closeAuction,
    { auctionId },
  );
  await ctx.db.patch(auctionId, { scheduledFunctionId });
  await writeActivity(ctx, {
    userId: sellerId,
    action: "demo_seller_bot.auction_created",
    entityType: "auction",
    entityId: auctionId,
    metadata: { batchId, assessmentId, source: "convex_cron" },
  });
}

function demoSeafoodSvg(name: string, seafoodType: string, color: string) {
  const label = `${seafoodType} demo lot`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${label}"><rect width="1200" height="800" fill="#082f49"/><path d="M0 590C210 510 390 690 600 590s390-80 600 0v210H0z" fill="#0e7490"/><circle cx="600" cy="355" r="180" fill="${color}" opacity=".92"/><path d="M470 355c85-125 190-125 260 0-70 125-175 125-260 0Z" fill="#f8fafc" opacity=".92"/><text x="600" y="120" fill="#f8fafc" font-family="Arial, sans-serif" font-size="46" text-anchor="middle">DEMO SELLER BOT</text><text x="600" y="700" fill="#e0f2fe" font-family="Arial, sans-serif" font-size="32" text-anchor="middle">${name}</text></svg>`;
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
  return env.AUTO_BIDDING_ENABLED === "true";
}
