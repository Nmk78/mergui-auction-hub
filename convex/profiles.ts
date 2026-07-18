import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./lib/server";
import { internalMutation, mutation, query } from "./lib/server";
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
    role: v.union(v.literal("seller"), v.literal("buyer")),
    businessName: v.optional(v.string()),
    primaryPort: v.optional(v.string()),
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

    const businessName = args.businessName?.trim();
    const primaryPort = args.primaryPort?.trim();
    if (args.role === "seller" && (!businessName || businessName.length < 2)) {
      throw new ConvexError("Business name must contain 2 to 120 characters.");
    }
    if (businessName && businessName.length > 120) {
      throw new ConvexError("Business name must contain 2 to 120 characters.");
    }
    if (primaryPort && primaryPort.length > 120) {
      throw new ConvexError("Primary port must contain at most 120 characters.");
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      displayName: name,
      businessName: businessName || undefined,
      primaryPort: primaryPort || undefined,
      createdAt: now,
      updatedAt: now,
    });
    const walletId =
      args.role === "buyer" ? await ensureBuyerWallet(ctx, userId) : undefined;
    await writeActivity(ctx, {
      userId,
      action: "profile.created",
      entityType: "profile",
      entityId: profileId,
      metadata: { role: args.role, walletId },
    });
    return profileId;
  },
});

export const ensureProfile = mutation({
  args: {
    role: v.union(v.literal("seller"), v.literal("buyer")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const [user, existing] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (query) => query.eq("userId", userId))
        .unique(),
    ]);

    if (existing) {
      if (existing.role === "buyer") {
        await ensureBuyerWallet(ctx, userId);
      }
      return { profileId: existing._id, role: existing.role };
    }

    const fallbackName = user?.name ?? user?.email?.split("@")[0] ?? "Buyer";
    const displayName = normalizeDisplayName(fallbackName);
    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      displayName,
      createdAt: now,
      updatedAt: now,
    });
    const walletId =
      args.role === "buyer" ? await ensureBuyerWallet(ctx, userId) : undefined;
    await writeActivity(ctx, {
      userId,
      action: "profile.created",
      entityType: "profile",
      entityId: profileId,
      metadata: { role: args.role, walletId, source: "oauth" },
    });
    return { profileId, role: args.role };
  },
});

export const provisionSeller = internalMutation({
  args: {
    userId: v.id("users"),
    displayName: v.string(),
    businessName: v.string(),
    primaryPort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("Auth user not found.");
    }
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", args.userId))
      .unique();
    if (existing) {
      if (existing.role !== "seller") {
        throw new ConvexError("This user already has a buyer profile.");
      }
      return existing._id;
    }

    const displayName = args.displayName.trim();
    const businessName = args.businessName.trim();
    const primaryPort = args.primaryPort?.trim();
    if (displayName.length < 2 || displayName.length > 80) {
      throw new ConvexError("Display name must contain 2 to 80 characters.");
    }
    if (businessName.length < 2 || businessName.length > 120) {
      throw new ConvexError("Business name must contain 2 to 120 characters.");
    }
    if (primaryPort && primaryPort.length > 120) {
      throw new ConvexError("Primary port must contain at most 120 characters.");
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId: args.userId,
      role: "seller",
      displayName,
      businessName,
      primaryPort: primaryPort || undefined,
      createdAt: now,
      updatedAt: now,
    });
    await writeActivity(ctx, {
      userId: args.userId,
      action: "profile.provisioned",
      entityType: "profile",
      entityId: profileId,
      metadata: { role: "seller" },
    });
    return profileId;
  },
});

async function ensureBuyerWallet(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .unique();
  if (wallet) {
    return wallet._id;
  }
  return ctx.db.insert("wallets", {
    userId,
    balance: 0,
    reserved: 0,
    updatedAt: Date.now(),
  });
}

function normalizeDisplayName(value: string) {
  const name = value.trim();
  if (name.length >= 2 && name.length <= 80) {
    return name;
  }
  if (name.length > 80) {
    return name.slice(0, 80);
  }
  return "Buyer";
}
