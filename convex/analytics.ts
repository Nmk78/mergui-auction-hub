import { query } from "./lib/server";
import { requireProfile } from "./lib/auth";

export const seller = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireProfile(ctx, "seller");
    const [batches, auctions] = await Promise.all([
      ctx.db
        .query("batches")
        .withIndex("by_seller", (query) => query.eq("sellerId", userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("auctions")
        .withIndex("by_seller", (query) => query.eq("sellerId", userId))
        .order("desc")
        .collect(),
    ]);

    const assessments = await Promise.all(
      batches.map((batch) =>
        ctx.db
          .query("assessments")
          .withIndex("by_batch", (query) => query.eq("batchId", batch._id))
          .unique(),
      ),
    );
    const completedScores = assessments.flatMap((assessment) =>
      assessment?.status === "completed" &&
      assessment.qualityScore !== undefined
        ? [assessment.qualityScore]
        : [],
    );
    const closedSales = auctions.filter(
      (auction) =>
        auction.status === "closed" &&
        auction.winnerId !== undefined &&
        auction.closedAt !== undefined,
    );
    const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthSales = closedSales
      .filter((auction) => auction.closedAt! >= recentCutoff)
      .reduce((total, auction) => total + auction.currentPrice, 0);

    const sales = (
      await Promise.all(
        closedSales.map(async (auction) => {
          const [batch, buyer, assessment] = await Promise.all([
            ctx.db.get(auction.batchId),
            ctx.db
              .query("profiles")
              .withIndex("by_user", (query) =>
                query.eq("userId", auction.winnerId!),
              )
              .unique(),
            ctx.db
              .query("assessments")
              .withIndex("by_batch", (query) =>
                query.eq("batchId", auction.batchId),
              )
              .unique(),
          ]);
          if (!batch) {
            return null;
          }
          return {
            id: auction._id,
            batchId: batch._id,
            batchName: batch.name,
            seafoodType: batch.seafoodType,
            weightKg: batch.weightKg,
            buyerName: buyer?.businessName ?? buyer?.displayName ?? "Buyer",
            price: auction.currentPrice,
            closedAt: auction.closedAt!,
            bidCount: auction.bidCount,
            qualityScore:
              assessment?.status === "completed"
                ? assessment.qualityScore
                : undefined,
          };
        }),
      )
    ).filter((sale) => sale !== null);

    return {
      metrics: {
        totalBatches: batches.length,
        activeBatches: batches.filter((batch) => batch.status !== "sold").length,
        readyBatches: batches.filter((batch) => batch.status === "ready").length,
        liveAuctions: auctions.filter((auction) => auction.status === "live")
          .length,
        bidsReceived: auctions.reduce(
          (total, auction) => total + auction.bidCount,
          0,
        ),
        monthSales,
        soldLots: closedSales.length,
        averageQuality:
          completedScores.length === 0
            ? null
            : completedScores.reduce((total, score) => total + score, 0) /
              completedScores.length,
      },
      statusBreakdown: {
        draft: batches.filter((batch) => batch.status === "draft").length,
        assessment: batches.filter(
          (batch) => batch.status === "assessment",
        ).length,
        ready: batches.filter((batch) => batch.status === "ready").length,
        auction: batches.filter((batch) => batch.status === "auction").length,
        sold: batches.filter((batch) => batch.status === "sold").length,
      },
      sales,
    };
  },
});
