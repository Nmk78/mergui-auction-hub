import { ConvexError, v } from "convex/values";
import { mutation, query } from "./lib/server";
import { requireUserId, writeActivity } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const [user, profile, wallet] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (query) => query.eq("userId", userId))
        .unique(),
      ctx.db
        .query("wallets")
        .withIndex("by_user", (query) => query.eq("userId", userId))
        .unique(),
    ]);

    return {
      user: user ? { name: user.name, email: user.email } : null,
      profile,
      wallet: wallet
        ? {
            balance: wallet.balance,
            reserved: wallet.reserved,
            available: wallet.balance - wallet.reserved,
          }
        : null,
    };
  },
});

export const initialize = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.displayName.trim();
    if (name.length < 2 || name.length > 80) {
      throw new ConvexError("Display name must contain 2 to 80 characters.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();
    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: "buyer",
      displayName: name,
      createdAt: now,
      updatedAt: now,
    });
    const walletId = await ctx.db.insert("wallets", {
      userId,
      balance: 0,
      reserved: 0,
      updatedAt: now,
    });
    await writeActivity(ctx, {
      userId,
      action: "profile.created",
      entityType: "profile",
      entityId: profileId,
      metadata: { role: "buyer", walletId },
    });
    return profileId;
  },
});
