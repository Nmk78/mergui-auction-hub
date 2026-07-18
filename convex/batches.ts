import { ConvexError, v } from "convex/values";
import { mutation, query } from "./lib/server";
import type { DataModel, MutationCtx, QueryCtx } from "./lib/server";
import { requireProfile, writeActivity } from "./lib/auth";
import { normalizeBatchInput } from "./lib/batchValidation";

const seafoodType = v.union(
  v.literal("Fish"),
  v.literal("Shrimp"),
  v.literal("Crab"),
  v.literal("Squid"),
);

const batchFields = {
  name: v.string(),
  seafoodType,
  quantity: v.number(),
  weightKg: v.number(),
  catchDate: v.number(),
  arrivalDate: v.number(),
  port: v.string(),
  description: v.string(),
};

async function batchWithImages(
  ctx: QueryCtx | MutationCtx,
  batch: DataModel["batches"]["document"],
) {
  const images = await Promise.all(
    batch.imageStorageIds.map(async (storageId) => ({
      storageId,
      url: await ctx.storage.getUrl(storageId),
    })),
  );
  return { ...batch, images };
}

export const create = mutation({
  args: batchFields,
  handler: async (ctx, args) => {
    const { userId } = await requireProfile(ctx, "seller");
    const input = normalizeBatchInput(args);
    const now = Date.now();
    const batchId = await ctx.db.insert("batches", {
      sellerId: userId,
      ...input,
      imageStorageIds: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    await writeActivity(ctx, {
      userId,
      action: "batch.created",
      entityType: "batch",
      entityId: batchId,
      metadata: { seafoodType: input.seafoodType },
    });
    return batchId;
  },
});

export const update = mutation({
  args: {
    batchId: v.id("batches"),
    ...batchFields,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.status === "auction" || batch.status === "sold") {
      throw new ConvexError("Published or sold batches cannot be edited.");
    }
    const { batchId, ...fields } = args;
    const input = normalizeBatchInput(fields);
    await invalidateAssessment(ctx, batchId);
    await ctx.db.patch(batchId, {
      ...input,
      status: "draft",
      updatedAt: Date.now(),
    });
    await writeActivity(ctx, {
      userId,
      action: "batch.updated",
      entityType: "batch",
      entityId: batchId,
    });
    return batchId;
  },
});

export const remove = mutation({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.status === "auction" || batch.status === "sold") {
      throw new ConvexError("Published or sold batches cannot be deleted.");
    }
    await invalidateAssessment(ctx, batchId);
    await Promise.all(
      batch.imageStorageIds.map((storageId) => ctx.storage.delete(storageId)),
    );
    await ctx.db.delete(batchId);
    await writeActivity(ctx, {
      userId,
      action: "batch.deleted",
      entityType: "batch",
      entityId: batchId,
    });
    return null;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_seller", (query) => query.eq("sellerId", userId))
      .order("desc")
      .collect();
    return Promise.all(batches.map((batch) => batchWithImages(ctx, batch)));
  },
});

export const get = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    return batchWithImages(ctx, batch);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, "seller");
    return ctx.storage.generateUploadUrl();
  },
});

export const addImage = mutation({
  args: {
    batchId: v.id("batches"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { batchId, storageId }) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.status === "auction" || batch.status === "sold") {
      throw new ConvexError("Photos cannot be changed after publication.");
    }
    if (batch.imageStorageIds.length >= 8) {
      throw new ConvexError("A batch can contain up to 8 images.");
    }
    if (batch.imageStorageIds.includes(storageId)) {
      return batchId;
    }

    const metadata = await ctx.db.system.get("_storage", storageId);
    if (!metadata || !metadata.contentType?.startsWith("image/")) {
      throw new ConvexError("Only image files can be attached to a batch.");
    }
    if (metadata.size > 10 * 1024 * 1024) {
      throw new ConvexError("Each image must be 10 MB or smaller.");
    }

    await invalidateAssessment(ctx, batchId);
    await ctx.db.patch(batchId, {
      imageStorageIds: [...batch.imageStorageIds, storageId],
      status: "draft",
      updatedAt: Date.now(),
    });
    await writeActivity(ctx, {
      userId,
      action: "batch.image_added",
      entityType: "batch",
      entityId: batchId,
    });
    return batchId;
  },
});

export const removeImage = mutation({
  args: {
    batchId: v.id("batches"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { batchId, storageId }) => {
    const { userId } = await requireProfile(ctx, "seller");
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.status === "auction" || batch.status === "sold") {
      throw new ConvexError("Photos cannot be changed after publication.");
    }
    if (!batch.imageStorageIds.includes(storageId)) {
      return batchId;
    }
    await invalidateAssessment(ctx, batchId);
    await ctx.db.patch(batchId, {
      imageStorageIds: batch.imageStorageIds.filter((id) => id !== storageId),
      status: "draft",
      updatedAt: Date.now(),
    });
    await ctx.storage.delete(storageId);
    await writeActivity(ctx, {
      userId,
      action: "batch.image_removed",
      entityType: "batch",
      entityId: batchId,
    });
    return batchId;
  },
});

async function invalidateAssessment(
  ctx: MutationCtx,
  batchId: DataModel["batches"]["document"]["_id"],
) {
  const assessment = await ctx.db
    .query("assessments")
    .withIndex("by_batch", (query) => query.eq("batchId", batchId))
    .unique();
  if (assessment) {
    await ctx.db.delete(assessment._id);
  }
}
