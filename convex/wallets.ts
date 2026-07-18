import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./lib/server";
import { requireProfile } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "buyer");
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();
    if (!wallet) {
      throw new ConvexError("Buyer wallet not found.");
    }
    return {
      id: wallet._id,
      balance: wallet.balance,
      reserved: wallet.reserved,
      available: wallet.balance - wallet.reserved,
      updatedAt: wallet.updatedAt,
    };
  },
});

export const transactions = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "buyer");
    return ctx.db
      .query("transactions")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

export const setSeededBalance = internalMutation({
  args: {
    userId: v.id("users"),
    balance: v.number(),
  },
  handler: async (ctx, { userId, balance }) => {
    if (!Number.isSafeInteger(balance) || balance < 0) {
      throw new ConvexError("Seed balance must be a non-negative whole MMK amount.");
    }
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();
    if (!wallet) {
      throw new ConvexError("Wallet not found.");
    }
    if (balance < wallet.reserved) {
      throw new ConvexError("Seed balance cannot be below reserved funds.");
    }
    const now = Date.now();
    await ctx.db.patch(wallet._id, { balance, updatedAt: now });
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      userId,
      type: "manual_funding",
      amount: balance - wallet.balance,
      balanceAfter: balance,
      reservedAfter: wallet.reserved,
      note: "Balance seeded outside the application",
      createdAt: now,
    });
    return wallet._id;
  },
});
