import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { env } from "./_generated/server";
import { mutation, query } from "./lib/server";
import type { DataModel, MutationCtx, QueryCtx } from "./lib/server";

const MAX_DEBUG_ROWS = 500;

type UserId = DataModel["users"]["document"]["_id"];
type SessionId = DataModel["authSessions"]["document"]["_id"];
type AccountId = DataModel["authAccounts"]["document"]["_id"];
type AuctionDoc = DataModel["auctions"]["document"];

type CleanupCounts = {
  users: number;
  authSessions: number;
  authRefreshTokens: number;
  authAccounts: number;
  authVerificationCodes: number;
  authVerifiers: number;
  authRateLimits: number;
  profiles: number;
  wallets: number;
  batches: number;
  assessments: number;
  auctions: number;
  bids: number;
  transactions: number;
  activityLogs: number;
  storageFiles: number;
};

const emptyCounts = (): CleanupCounts => ({
  users: 0,
  authSessions: 0,
  authRefreshTokens: 0,
  authAccounts: 0,
  authVerificationCodes: 0,
  authVerifiers: 0,
  authRateLimits: 0,
  profiles: 0,
  wallets: 0,
  batches: 0,
  assessments: 0,
  auctions: 0,
  bids: 0,
  transactions: 0,
  activityLogs: 0,
  storageFiles: 0,
});

export const status = query({
  args: {},
  handler: async (ctx) => {
    if (!debugEnabled()) {
      return {
        enabled: false,
        authenticated: false,
        user: null,
        profile: null,
        wallet: null,
        records: [],
      };
    }

    const userId = await getAuthUserId(ctx);
    const sessionId = await getAuthSessionId(ctx);
    if (!userId) {
      return {
        enabled: true,
        authenticated: false,
        user: null,
        profile: null,
        wallet: null,
        records: [],
      };
    }

    const [user, profile, wallet] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique(),
      ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique(),
    ]);

    return {
      enabled: true,
      authenticated: true,
      sessionId,
      user: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
          }
        : null,
      profile: profile
        ? {
            role: profile.role,
            displayName: profile.displayName,
            businessName: profile.businessName,
          }
        : null,
      wallet: wallet
        ? {
            balance: wallet.balance,
            reserved: wallet.reserved,
            available: wallet.balance - wallet.reserved,
          }
        : null,
      records: await getUserRecordSummary(ctx, userId),
    };
  },
});

export const clearCurrentSession = mutation({
  args: {},
  handler: async (ctx) => {
    requireDebugEnabled();
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      throw new ConvexError("No active auth session was found.");
    }

    const counts = emptyCounts();
    await deleteSessionGraph(ctx, sessionId, counts);
    return counts;
  },
});

export const clearAllSessions = mutation({
  args: {},
  handler: async (ctx) => {
    requireDebugEnabled();
    const userId = await requireCurrentUserId(ctx);
    const counts = emptyCounts();
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1);
    for (const session of limitedRows(sessions, "auth sessions")) {
      await deleteSessionGraph(ctx, session._id, counts);
    }
    return counts;
  },
});

export const resetCurrentUserData = mutation({
  args: {},
  handler: async (ctx) => {
    requireDebugEnabled();
    const userId = await requireCurrentUserId(ctx);
    const counts = emptyCounts();
    await deleteApplicationDataForUser(ctx, userId, counts);
    return counts;
  },
});

export const deleteCurrentAccount = mutation({
  args: {},
  handler: async (ctx) => {
    requireDebugEnabled();
    const userId = await requireCurrentUserId(ctx);
    const user = await ctx.db.get(userId);
    const counts = emptyCounts();

    await deleteApplicationDataForUser(ctx, userId, counts);
    await deleteAuthDataForUser(ctx, userId, user?.email, counts);
    if (user) {
      await ctx.db.delete(userId);
      counts.users += 1;
    }

    return counts;
  },
});

export const clearAuthRateLimit = mutation({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, { identifier }) => {
    requireDebugEnabled();
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError("Enter an email or auth rate-limit identifier.");
    }

    const counts = emptyCounts();
    await deleteAuthRateLimit(ctx, normalized, counts);
    return counts;
  },
});

async function getUserRecordSummary(ctx: QueryCtx, userId: UserId) {
  const [sessions, accounts, profiles, wallets, batches, bids, transactions, logs] =
    await Promise.all([
      countAuthSessions(ctx, userId),
      countAuthAccounts(ctx, userId),
      countProfiles(ctx, userId),
      countWallets(ctx, userId),
      countBatches(ctx, userId),
      countBids(ctx, userId),
      countTransactions(ctx, userId),
      countActivityLogs(ctx, userId),
    ]);

  return [
    { label: "Auth sessions", ...sessions },
    { label: "Auth accounts", ...accounts },
    { label: "Profiles", ...profiles },
    { label: "Wallets", ...wallets },
    { label: "Seller batches", ...batches },
    { label: "Buyer bids", ...bids },
    { label: "Wallet transactions", ...transactions },
    { label: "Activity logs", ...logs },
  ];
}

async function countAuthSessions(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countAuthAccounts(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countProfiles(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countWallets(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countBatches(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("batches")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countBids(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("bids")
      .withIndex("by_bidder", (q) => q.eq("bidderId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countTransactions(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

async function countActivityLogs(ctx: QueryCtx, userId: UserId) {
  return limitCount(
    await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_DEBUG_ROWS + 1),
  );
}

function limitCount(rows: readonly unknown[]) {
  return {
    count: Math.min(rows.length, MAX_DEBUG_ROWS),
    limited: rows.length > MAX_DEBUG_ROWS,
  };
}

function limitedRows<T>(rows: T[], label: string) {
  if (rows.length > MAX_DEBUG_ROWS) {
    throw new ConvexError(
      `Debug cleanup found more than ${MAX_DEBUG_ROWS} ${label}. Add a batched cleanup before continuing.`,
    );
  }
  return rows;
}

async function requireCurrentUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Sign in before using debug tools.");
  }
  return userId;
}

async function deleteApplicationDataForUser(
  ctx: MutationCtx,
  userId: UserId,
  counts: CleanupCounts,
) {
  const batches = await ctx.db
    .query("batches")
    .withIndex("by_seller", (q) => q.eq("sellerId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const batch of limitedRows(batches, "seller batches")) {
    await deleteBatchGraph(ctx, batch, counts);
  }

  const orphanedSellerAuctions = await ctx.db
    .query("auctions")
    .withIndex("by_seller", (q) => q.eq("sellerId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const auction of limitedRows(orphanedSellerAuctions, "seller auctions")) {
    await deleteAuctionGraph(ctx, auction, counts);
  }

  const bids = await ctx.db
    .query("bids")
    .withIndex("by_bidder", (q) => q.eq("bidderId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  const affectedAuctionIds = new Set<string>();
  for (const bid of limitedRows(bids, "buyer bids")) {
    affectedAuctionIds.add(bid.auctionId);
  }
  for (const auctionId of affectedAuctionIds) {
    const auction = await ctx.db.get(
      auctionId as DataModel["auctions"]["document"]["_id"],
    );
    if (auction) {
      await cancelAuctionAfterUserRemoval(ctx, auction, userId, counts);
    }
  }

  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const transaction of limitedRows(transactions, "wallet transactions")) {
    await ctx.db.delete(transaction._id);
    counts.transactions += 1;
  }

  const wallets = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const wallet of limitedRows(wallets, "wallets")) {
    await ctx.db.delete(wallet._id);
    counts.wallets += 1;
  }

  const profiles = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const profile of limitedRows(profiles, "profiles")) {
    await ctx.db.delete(profile._id);
    counts.profiles += 1;
  }

  await deleteActivityLogsForUser(ctx, userId, counts);
}

async function deleteBatchGraph(
  ctx: MutationCtx,
  batch: DataModel["batches"]["document"],
  counts: CleanupCounts,
) {
  const auctions = await ctx.db
    .query("auctions")
    .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const auction of limitedRows(auctions, "batch auctions")) {
    await deleteAuctionGraph(ctx, auction, counts);
  }

  const assessments = await ctx.db
    .query("assessments")
    .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const assessment of limitedRows(assessments, "batch assessments")) {
    await ctx.db.delete(assessment._id);
    counts.assessments += 1;
  }

  for (const storageId of batch.imageStorageIds) {
    await ctx.storage.delete(storageId);
    counts.storageFiles += 1;
  }
  await deleteActivityLogsForEntity(ctx, "batch", batch._id, counts);
  await ctx.db.delete(batch._id);
  counts.batches += 1;
}

async function deleteAuctionGraph(
  ctx: MutationCtx,
  auction: AuctionDoc,
  counts: CleanupCounts,
) {
  await cancelScheduledClose(ctx, auction);

  const bids = await ctx.db
    .query("bids")
    .withIndex("by_auction", (q) => q.eq("auctionId", auction._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const bid of limitedRows(bids, "auction bids")) {
    await ctx.db.delete(bid._id);
    counts.bids += 1;
  }

  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_auction", (q) => q.eq("auctionId", auction._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const transaction of limitedRows(transactions, "auction transactions")) {
    await ctx.db.delete(transaction._id);
    counts.transactions += 1;
  }

  await deleteActivityLogsForEntity(ctx, "auction", auction._id, counts);
  await ctx.db.delete(auction._id);
  counts.auctions += 1;
}

async function cancelAuctionAfterUserRemoval(
  ctx: MutationCtx,
  auction: AuctionDoc,
  removedUserId: UserId,
  counts: CleanupCounts,
) {
  await cancelScheduledClose(ctx, auction);

  if (
    auction.currentBidderId &&
    auction.currentBidderId !== removedUserId &&
    auction.currentPrice > 0
  ) {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", auction.currentBidderId!))
      .unique();
    if (wallet) {
      await ctx.db.patch(wallet._id, {
        reserved: Math.max(0, wallet.reserved - auction.currentPrice),
        updatedAt: Date.now(),
      });
    }
  }

  const bids = await ctx.db
    .query("bids")
    .withIndex("by_auction", (q) => q.eq("auctionId", auction._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const bid of limitedRows(bids, "auction bids")) {
    await ctx.db.delete(bid._id);
    counts.bids += 1;
  }

  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_auction", (q) => q.eq("auctionId", auction._id))
    .take(MAX_DEBUG_ROWS + 1);
  for (const transaction of limitedRows(transactions, "auction transactions")) {
    await ctx.db.delete(transaction._id);
    counts.transactions += 1;
  }

  await ctx.db.patch(auction._id, {
    currentPrice: auction.startingPrice,
    currentBidId: undefined,
    currentBidderId: undefined,
    bidCount: 0,
    status: "cancelled",
    winnerId: undefined,
    winningBidId: undefined,
    closedAt: Date.now(),
    scheduledFunctionId: undefined,
  });
  const batch = await ctx.db.get(auction.batchId);
  if (batch) {
    await ctx.db.patch(batch._id, {
      status: "ready",
      updatedAt: Date.now(),
    });
  }
  counts.auctions += 1;
}

async function deleteAuthDataForUser(
  ctx: MutationCtx,
  userId: UserId,
  email: string | undefined,
  counts: CleanupCounts,
) {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const account of limitedRows(accounts, "auth accounts")) {
    await deleteAccountGraph(ctx, account._id, counts);
  }

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const session of limitedRows(sessions, "auth sessions")) {
    await deleteSessionGraph(ctx, session._id, counts);
  }

  if (email) {
    await deleteAuthRateLimit(ctx, email.toLowerCase(), counts);
  }
}

async function deleteAccountGraph(
  ctx: MutationCtx,
  accountId: AccountId,
  counts: CleanupCounts,
) {
  const verificationCodes = await ctx.db
    .query("authVerificationCodes")
    .withIndex("accountId", (q) => q.eq("accountId", accountId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const code of limitedRows(verificationCodes, "verification codes")) {
    await ctx.db.delete(code._id);
    counts.authVerificationCodes += 1;
  }

  const account = await ctx.db.get(accountId);
  if (account) {
    await ctx.db.delete(accountId);
    counts.authAccounts += 1;
  }
}

async function deleteSessionGraph(
  ctx: MutationCtx,
  sessionId: SessionId,
  counts: CleanupCounts,
) {
  const refreshTokens = await ctx.db
    .query("authRefreshTokens")
    .withIndex("sessionId", (q) => q.eq("sessionId", sessionId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const token of limitedRows(refreshTokens, "refresh tokens")) {
    await ctx.db.delete(token._id);
    counts.authRefreshTokens += 1;
  }

  const verifiers = await ctx.db.query("authVerifiers").take(MAX_DEBUG_ROWS + 1);
  for (const verifier of limitedRows(verifiers, "auth verifiers")) {
    if (verifier.sessionId === sessionId) {
      await ctx.db.delete(verifier._id);
      counts.authVerifiers += 1;
    }
  }

  const session = await ctx.db.get(sessionId);
  if (session) {
    await ctx.db.delete(sessionId);
    counts.authSessions += 1;
  }
}

async function deleteAuthRateLimit(
  ctx: MutationCtx,
  identifier: string,
  counts: CleanupCounts,
) {
  const rows = await ctx.db
    .query("authRateLimits")
    .withIndex("identifier", (q) => q.eq("identifier", identifier))
    .take(MAX_DEBUG_ROWS + 1);
  for (const row of limitedRows(rows, "auth rate limits")) {
    await ctx.db.delete(row._id);
    counts.authRateLimits += 1;
  }
}

async function deleteActivityLogsForUser(
  ctx: MutationCtx,
  userId: UserId,
  counts: CleanupCounts,
) {
  const logs = await ctx.db
    .query("activityLogs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_DEBUG_ROWS + 1);
  for (const log of limitedRows(logs, "user activity logs")) {
    await ctx.db.delete(log._id);
    counts.activityLogs += 1;
  }
}

async function deleteActivityLogsForEntity(
  ctx: MutationCtx,
  entityType: string,
  entityId: string,
  counts: CleanupCounts,
) {
  const logs = await ctx.db
    .query("activityLogs")
    .withIndex("by_entity", (q) =>
      q.eq("entityType", entityType).eq("entityId", entityId),
    )
    .take(MAX_DEBUG_ROWS + 1);
  for (const log of limitedRows(logs, "entity activity logs")) {
    await ctx.db.delete(log._id);
    counts.activityLogs += 1;
  }
}

async function cancelScheduledClose(ctx: MutationCtx, auction: AuctionDoc) {
  if (!auction.scheduledFunctionId) {
    return;
  }
  try {
    await ctx.scheduler.cancel(auction.scheduledFunctionId);
  } catch {
    // The scheduled function may already have run; cleanup can still continue.
  }
}

function debugEnabled() {
  return env.DEBUG_TOOLS_ENABLED === "true";
}

function requireDebugEnabled() {
  if (!debugEnabled()) {
    throw new ConvexError("Debug tools are disabled for this deployment.");
  }
}
