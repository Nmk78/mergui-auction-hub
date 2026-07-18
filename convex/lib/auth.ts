import { ConvexError } from "convex/values";
import type { GenericId } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./server";

type ReadCtx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: ReadCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("You must be signed in to continue.");
  }
  return userId;
}

export async function requireProfile(
  ctx: ReadCtx,
  expectedRole?: "seller" | "buyer",
) {
  const userId = await requireUserId(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .unique();

  if (!profile) {
    throw new ConvexError("Your trading profile has not been initialized.");
  }
  if (expectedRole && profile.role !== expectedRole) {
    throw new ConvexError(
      `This action requires an approved ${expectedRole} account.`,
    );
  }
  return { userId, profile };
}

export async function writeActivity(
  ctx: MutationCtx,
  input: {
    userId?: GenericId<"users">;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await ctx.db.insert("activityLogs", {
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    createdAt: Date.now(),
  });
}
