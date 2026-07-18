import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { z } from "zod";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./lib/server";
import { requireUserId, writeActivity } from "./lib/auth";
import { openRouterCompletion } from "./lib/openrouter";

const assessmentResultSchema = z.object({
  qualityScore: z.number().min(0).max(10),
  grade: z.enum([
    "Export Grade",
    "Premium Local",
    "Standard Local",
    "Low Quality",
  ]),
  confidence: z.number().min(0).max(100),
  freshness: z.number().min(0).max(10),
  appearance: z.number().min(0).max(10),
  color: z.number().min(0).max(10),
  damage: z.number().min(0).max(10),
  sizeConsistency: z.number().min(0).max(10),
  detectedIssues: z.array(z.string().min(2).max(120)).max(8),
  summary: z.string().min(20).max(1200),
  recommendation: z.string().min(20).max(600),
  suggestedStartingBid: z.number().int().nonnegative(),
  suggestedMarketPrice: z.number().int().nonnegative(),
  estimatedExportValue: z.number().int().nonnegative(),
  priceExplanation: z.string().min(20).max(600),
});

const assessmentJsonSchema = {
  type: "json_schema",
  json_schema: {
    name: "seafood_visual_assessment",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        qualityScore: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "Overall visual quality score from 0 to 10.",
        },
        grade: {
          type: "string",
          enum: [
            "Export Grade",
            "Premium Local",
            "Standard Local",
            "Low Quality",
          ],
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Confidence in the visual observations, as a percentage.",
        },
        freshness: { type: "number", minimum: 0, maximum: 10 },
        appearance: { type: "number", minimum: 0, maximum: 10 },
        color: { type: "number", minimum: 0, maximum: 10 },
        damage: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "10 means no visible damage; 0 means severe visible damage.",
        },
        sizeConsistency: { type: "number", minimum: 0, maximum: 10 },
        detectedIssues: {
          type: "array",
          maxItems: 8,
          items: { type: "string" },
        },
        summary: { type: "string" },
        recommendation: { type: "string" },
        suggestedStartingBid: {
          type: "integer",
          minimum: 0,
          description: "Suggested starting bid in whole MMK.",
        },
        suggestedMarketPrice: {
          type: "integer",
          minimum: 0,
          description: "Suggested market price in whole MMK.",
        },
        estimatedExportValue: {
          type: "integer",
          minimum: 0,
          description: "Estimated export-oriented value in whole MMK.",
        },
        priceExplanation: { type: "string" },
      },
      required: [
        "qualityScore",
        "grade",
        "confidence",
        "freshness",
        "appearance",
        "color",
        "damage",
        "sizeConsistency",
        "detectedIssues",
        "summary",
        "recommendation",
        "suggestedStartingBid",
        "suggestedMarketPrice",
        "estimatedExportValue",
        "priceExplanation",
      ],
    },
  },
};

const getInputRef = makeFunctionReference<"query">("assessments:getInput");
const markPendingRef =
  makeFunctionReference<"mutation">("assessments:markPending");
const saveResultRef =
  makeFunctionReference<"mutation">("assessments:saveResult");
const saveFailureRef =
  makeFunctionReference<"mutation">("assessments:saveFailure");

export const request = action({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("You must be signed in to request an assessment.");
    }
    const input = (await ctx.runQuery(getInputRef, { batchId, userId })) as {
      batch: {
        name: string;
        seafoodType: string;
        quantity: number;
        weightKg: number;
        catchDate: number;
        arrivalDate: number;
        port: string;
        description: string;
      };
      imageUrls: string[];
    };
    await ctx.runMutation(markPendingRef, { batchId, userId });
    const model =
      process.env.OPENROUTER_VISION_MODEL ?? "openai/gpt-4.1-mini";

    try {
      const prompt = [
        "You are providing an AI Visual Assessment for a commercial seafood trading workflow in Myeik, Myanmar.",
        "Analyze only what is visually supportable in the supplied images plus the seller-provided batch facts.",
        "Assess freshness appearance, color, visible damage, and size consistency. Do not claim laboratory, scientific, regulatory, food-safety, or export certification accuracy.",
        "Grade choices are decision-support labels only. Use cautious language and clearly note image limitations.",
        "Price outputs are indicative MMK estimates, not live market quotes. Base the explanation on batch size, visible quality, consistency, and supplied handling facts. Do not invent current market data.",
        `Batch facts: ${JSON.stringify(input.batch)}`,
      ].join("\n\n");

      const content = await openRouterCompletion({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...input.imageUrls.map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        responseFormat: assessmentJsonSchema,
        temperature: 0.1,
      });
      const json = JSON.parse(content) as unknown;
      const parsed = assessmentResultSchema.safeParse(json);
      if (!parsed.success) {
        console.error("Invalid assessment result", parsed.error.flatten());
        throw new ConvexError("The AI assessment did not pass validation.");
      }
      await ctx.runMutation(saveResultRef, {
        batchId,
        userId,
        model,
        result: parsed.data,
      });
      return parsed.data;
    } catch (cause) {
      await ctx.runMutation(saveFailureRef, {
        batchId,
        userId,
        message:
          cause instanceof Error ? cause.message : "AI assessment failed.",
      });
      throw cause;
    }
  },
});

export const getForBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    const userId = await requireUserId(ctx);
    const batch = await ctx.db.get(batchId);
    if (!batch) {
      throw new ConvexError("Batch not found.");
    }
    if (batch.sellerId !== userId) {
      const publicAuction = await ctx.db
        .query("auctions")
        .withIndex("by_batch", (query) => query.eq("batchId", batchId))
        .unique();
      if (!publicAuction) {
        throw new ConvexError("You do not have access to this assessment.");
      }
    }
    return ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", batchId))
      .unique();
  },
});

export const getInput = internalQuery({
  args: {
    batchId: v.id("batches"),
    userId: v.id("users"),
  },
  handler: async (ctx, { batchId, userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (query) => query.eq("userId", userId))
      .unique();
    const batch = await ctx.db.get(batchId);
    if (!profile || profile.role !== "seller" || !batch || batch.sellerId !== userId) {
      throw new ConvexError("Only the batch seller can request an assessment.");
    }
    if (batch.status === "auction" || batch.status === "sold") {
      throw new ConvexError("Published or sold batches cannot be reassessed.");
    }
    if (batch.imageStorageIds.length === 0) {
      throw new ConvexError("Add at least one image before requesting an assessment.");
    }
    const imageUrls = await Promise.all(
      batch.imageStorageIds.map((storageId) => ctx.storage.getUrl(storageId)),
    );
    if (imageUrls.some((url) => url === null)) {
      throw new ConvexError("One or more batch images are unavailable.");
    }
    return {
      batch: {
        name: batch.name,
        seafoodType: batch.seafoodType,
        quantity: batch.quantity,
        weightKg: batch.weightKg,
        catchDate: batch.catchDate,
        arrivalDate: batch.arrivalDate,
        port: batch.port,
        description: batch.description,
      },
      imageUrls: imageUrls as string[],
    };
  },
});

export const markPending = internalMutation({
  args: {
    batchId: v.id("batches"),
    userId: v.id("users"),
  },
  handler: async (ctx, { batchId, userId }) => {
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    const existing = await ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", batchId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "pending",
        errorMessage: undefined,
        createdAt: now,
      });
    } else {
      await ctx.db.insert("assessments", {
        batchId,
        status: "pending",
        createdAt: now,
      });
    }
    await ctx.db.patch(batchId, { status: "assessment", updatedAt: now });
  },
});

export const saveResult = internalMutation({
  args: {
    batchId: v.id("batches"),
    userId: v.id("users"),
    model: v.string(),
    result: v.object({
      qualityScore: v.number(),
      grade: v.union(
        v.literal("Export Grade"),
        v.literal("Premium Local"),
        v.literal("Standard Local"),
        v.literal("Low Quality"),
      ),
      confidence: v.number(),
      freshness: v.number(),
      appearance: v.number(),
      color: v.number(),
      damage: v.number(),
      sizeConsistency: v.number(),
      detectedIssues: v.array(v.string()),
      summary: v.string(),
      recommendation: v.string(),
      suggestedStartingBid: v.number(),
      suggestedMarketPrice: v.number(),
      estimatedExportValue: v.number(),
      priceExplanation: v.string(),
    }),
  },
  handler: async (ctx, { batchId, userId, model, result }) => {
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      throw new ConvexError("Batch not found.");
    }
    const existing = await ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", batchId))
      .unique();
    if (!existing) {
      throw new ConvexError("Assessment request not found.");
    }
    const now = Date.now();
    await ctx.db.patch(existing._id, {
      ...result,
      status: "completed",
      model,
      errorMessage: undefined,
      completedAt: now,
    });
    await ctx.db.patch(batchId, { status: "ready", updatedAt: now });
    await writeActivity(ctx, {
      userId,
      action: "assessment.completed",
      entityType: "assessment",
      entityId: existing._id,
      metadata: { batchId, qualityScore: result.qualityScore, grade: result.grade },
    });
  },
});

export const saveFailure = internalMutation({
  args: {
    batchId: v.id("batches"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, { batchId, userId, message }) => {
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.sellerId !== userId) {
      return;
    }
    const existing = await ctx.db
      .query("assessments")
      .withIndex("by_batch", (query) => query.eq("batchId", batchId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "failed",
        errorMessage: message.slice(0, 500),
      });
    }
    await ctx.db.patch(batchId, { status: "draft", updatedAt: Date.now() });
  },
});
