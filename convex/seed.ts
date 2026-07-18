import { ConvexError, v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { env } from "./_generated/server";
import { action, internalMutation } from "./lib/server";
import type { MutationCtx } from "./lib/server";

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_BUYER_BALANCE = 5_000_000;

const seedAccounts = [
  {
    email: "seller1@mergui.test",
    displayName: "Myeik Blue Ocean Trading",
    role: "seller" as const,
    businessName: "Myeik Blue Ocean Trading",
    primaryPort: "Myeik Main Jetty",
  },
  {
    email: "seller2@mergui.test",
    displayName: "Tanintharyi Catch Cooperative",
    role: "seller" as const,
    businessName: "Tanintharyi Catch Cooperative",
    primaryPort: "Seik Nge Jetty, Myeik",
  },
  {
    email: "buyer1@mergui.test",
    displayName: "Ayar Buyer Group",
    role: "buyer" as const,
  },
  {
    email: "buyer2@mergui.test",
    displayName: "Myeik Premium Foods",
    role: "buyer" as const,
  },
  {
    email: "buyer3@mergui.test",
    displayName: "Yangon Wholesale Desk",
    role: "buyer" as const,
  },
];

const upsertProfileRef = makeFunctionReference<"mutation">(
  "seed:upsertProfile",
);
const assignRoleRef = makeFunctionReference<"mutation">(
  "seed:assignExistingProfileRole",
);

/**
 * Creates two seller and three buyer test accounts on a development deployment.
 * Run with: `npm run seed:users`
 */
export const users = action({
  args: {},
  handler: async (ctx) => {
    requireDebugEnabled();

    const results = [];
    for (const account of seedAccounts) {
      const created = await ctx.runMutation(internal.auth.store, {
        args: {
          type: "createAccountFromCredentials",
          provider: "password",
          account: { id: account.email, secret: DEMO_PASSWORD },
          profile: {
            email: account.email,
            name: account.displayName,
          },
          shouldLinkViaEmail: false,
          shouldLinkViaPhone: false,
        },
      });
      if (!created || typeof created === "string" || !("user" in created)) {
        throw new ConvexError(`Could not create ${account.email}.`);
      }
      await ctx.runMutation(upsertProfileRef, {
        userId: created.user._id,
        ...account,
      });
      results.push({ email: account.email, role: account.role });
    }

    return {
      accounts: results,
      password: DEMO_PASSWORD,
    };
  },
});

/**
 * Repairs a test account that was registered under the wrong role.
 * This is intentionally available only when DEBUG_TOOLS_ENABLED is true.
 */
export const assignExistingRole = action({
  args: {
    email: v.string(),
    role: v.union(v.literal("seller"), v.literal("buyer")),
  },
  handler: async (ctx, args) => {
    requireDebugEnabled();
    return ctx.runMutation(assignRoleRef, args);
  },
});

export const upsertProfile = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("seller"), v.literal("buyer")),
    businessName: v.optional(v.string()),
    primaryPort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", args.userId))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        displayName: args.displayName,
        businessName: args.businessName,
        primaryPort: args.primaryPort,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profiles", {
        userId: args.userId,
        role: args.role,
        displayName: args.displayName,
        businessName: args.businessName,
        primaryPort: args.primaryPort,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ensureWalletForRole(ctx, args.userId, args.role);
    return { email: args.email, role: args.role };
  },
});

export const assignExistingProfileRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("seller"), v.literal("buyer")),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", email))
      .unique();
    if (!user) {
      throw new ConvexError(`No user exists for ${email}.`);
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .unique();
    const now = Date.now();
    if (profile) {
      await ctx.db.patch(profile._id, { role: args.role, updatedAt: now });
    } else {
      await ctx.db.insert("profiles", {
        userId: user._id,
        role: args.role,
        displayName: user.name ?? email.split("@")[0],
        createdAt: now,
        updatedAt: now,
      });
    }
    await ensureWalletForRole(ctx, user._id, args.role);
    return { email, role: args.role };
  },
});

async function ensureWalletForRole(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: "seller" | "buyer",
) {
  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .unique();

  if (role === "seller") {
    if (wallet) {
      await ctx.db.delete(wallet._id);
    }
    return;
  }

  if (wallet) {
    await ctx.db.patch(wallet._id, {
      balance: Math.max(wallet.balance, DEMO_BUYER_BALANCE),
      updatedAt: Date.now(),
    });
    return;
  }
  await ctx.db.insert("wallets", {
    userId,
    balance: DEMO_BUYER_BALANCE,
    reserved: 0,
    updatedAt: Date.now(),
  });
}

function requireDebugEnabled() {
  if (env.DEBUG_TOOLS_ENABLED !== "true") {
    throw new ConvexError(
      "Seed tools are disabled. Set DEBUG_TOOLS_ENABLED=true on this development deployment.",
    );
  }
}
