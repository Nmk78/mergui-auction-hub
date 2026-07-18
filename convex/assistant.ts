import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { action, internalQuery } from "./lib/server";
import { openRouterCompletion } from "./lib/openrouter";

const getContextRef = makeFunctionReference<"query">("assistant:getContext");

export const ask = action({
  args: {
    batchId: v.id("batches"),
    question: v.string(),
  },
  handler: async (ctx, { batchId, question }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Sign in to ask questions about this report.");
    }
    const normalizedQuestion = question.trim();
    if (normalizedQuestion.length < 3 || normalizedQuestion.length > 500) {
      throw new ConvexError("Question must contain 3 to 500 characters.");
    }
    const context = await ctx.runQuery(getContextRef, { batchId, userId });
    const model =
      process.env.OPENROUTER_ASSISTANT_MODEL ?? "openai/gpt-4.1-mini";
    return openRouterCompletion({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            "You are the MERGUI Seafood Assessment Assistant.",
            "Answer only from the stored batch facts and stored AI visual assessment supplied below.",
            "Never add defects, market facts, safety claims, certification claims, or scientific conclusions that are not in the stored data.",
            'If the data cannot answer the question, say: "That information is not available in this stored assessment."',
            "Use concise, plain commercial language. Remind the user this is an AI visual assessment when discussing quality.",
            `Stored data: ${JSON.stringify(context)}`,
          ].join("\n\n"),
        },
        { role: "user", content: normalizedQuestion },
      ],
    });
  },
});

export const getContext = internalQuery({
  args: {
    batchId: v.id("batches"),
    userId: v.id("users"),
  },
  handler: async (ctx, { batchId, userId }) => {
    const [batch, profile, assessment, auction] = await Promise.all([
      ctx.db.get(batchId),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (query) => query.eq("userId", userId))
        .unique(),
      ctx.db
        .query("assessments")
        .withIndex("by_batch", (query) => query.eq("batchId", batchId))
        .unique(),
      ctx.db
        .query("auctions")
        .withIndex("by_batch", (query) => query.eq("batchId", batchId))
        .unique(),
    ]);
    if (!batch || !profile || (batch.sellerId !== userId && !auction)) {
      throw new ConvexError("You do not have access to this report.");
    }
    if (!assessment || assessment.status !== "completed") {
      throw new ConvexError("A completed assessment is not available.");
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
      assessment: {
        qualityScore: assessment.qualityScore,
        grade: assessment.grade,
        confidence: assessment.confidence,
        freshness: assessment.freshness,
        appearance: assessment.appearance,
        color: assessment.color,
        damage: assessment.damage,
        sizeConsistency: assessment.sizeConsistency,
        detectedIssues: assessment.detectedIssues,
        summary: assessment.summary,
        recommendation: assessment.recommendation,
        suggestedStartingBid: assessment.suggestedStartingBid,
        suggestedMarketPrice: assessment.suggestedMarketPrice,
        estimatedExportValue: assessment.estimatedExportValue,
        priceExplanation: assessment.priceExplanation,
      },
    };
  },
});
