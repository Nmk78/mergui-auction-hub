import type { Assessment, BatchSummary, PublicAuction } from "@/types/domain";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const demoBatches: BatchSummary[] = [
  {
    id: "demo-batch-1",
    name: "Tanintharyi Tiger Prawns — Lot 24",
    seafoodType: "Shrimp",
    quantity: 18,
    weightKg: 540,
    catchDate: now - day,
    arrivalDate: now - day * 0.75,
    port: "Seik Nge Jetty, Myeik",
    description:
      "Uniform large tiger prawns landed before sunrise and transferred to insulated ice boxes immediately.",
    status: "ready",
    images: [],
    updatedAt: now - 42 * 60 * 1000,
  },
  {
    id: "demo-batch-2",
    name: "Andaman Mud Crab — Lot 18",
    seafoodType: "Crab",
    quantity: 42,
    weightKg: 96,
    catchDate: now - day * 1.4,
    arrivalDate: now - day,
    port: "Myeik Main Jetty",
    description:
      "Live mud crab lot sorted by shell width with minimal visible shell damage.",
    status: "auction",
    images: [],
    updatedAt: now - 2.5 * 60 * 60 * 1000,
  },
  {
    id: "demo-batch-3",
    name: "Mergui Reef Snapper — Lot 31",
    seafoodType: "Fish",
    quantity: 65,
    weightKg: 312,
    catchDate: now - day * 0.7,
    arrivalDate: now - day * 0.5,
    port: "Pahtaw Jetty",
    description:
      "Whole reef snapper packed on flake ice and graded for consistent commercial size.",
    status: "draft",
    images: [],
    updatedAt: now - 4 * 60 * 60 * 1000,
  },
  {
    id: "demo-batch-4",
    name: "Coastal Squid — Lot 09",
    seafoodType: "Squid",
    quantity: 24,
    weightKg: 188,
    catchDate: now - day * 3,
    arrivalDate: now - day * 2.8,
    port: "Seik Nge Jetty, Myeik",
    description:
      "Medium whole squid with bright skin tone, chilled immediately after sorting.",
    status: "sold",
    images: [],
    updatedAt: now - day * 2,
  },
];

export const demoAssessments: Assessment[] = [
  {
    id: "assessment-1",
    batchId: "demo-batch-1",
    qualityScore: 8.9,
    grade: "Export Grade",
    confidence: 94,
    freshness: 9.2,
    appearance: 8.8,
    color: 9,
    damage: 8.5,
    sizeConsistency: 9.1,
    detectedIssues: ["Small scratches on two shells", "Minor antenna breakage"],
    summary:
      "The batch presents strong visual freshness, consistent sizing, and a clear shell color. Minor handling marks are limited and do not dominate the lot.",
    recommendation:
      "Suitable for export-oriented buyer review, subject to normal physical inspection and handling checks.",
    suggestedStartingBid: 720_000,
    suggestedMarketPrice: 840_000,
    estimatedExportValue: 910_000,
    priceExplanation:
      "The estimate reflects high freshness, strong size consistency, and limited visible damage across the submitted images.",
    model: "Configured hosted vision model",
    completedAt: now - 65 * 60 * 1000,
  },
  {
    id: "assessment-2",
    batchId: "demo-batch-2",
    qualityScore: 8.4,
    grade: "Premium Local",
    confidence: 91,
    freshness: 8.7,
    appearance: 8.3,
    color: 8.4,
    damage: 8,
    sizeConsistency: 8.5,
    detectedIssues: ["Light shell abrasions", "Some size variance"],
    summary:
      "The lot appears lively and well sorted with a small amount of shell abrasion and moderate size variation.",
    recommendation:
      "Best aligned with premium domestic buyers that can complete an in-person condition check.",
    suggestedStartingBid: 430_000,
    suggestedMarketPrice: 520_000,
    estimatedExportValue: 560_000,
    priceExplanation:
      "Strong apparent freshness supports the value, while shell marks and size variation reduce the export estimate.",
    model: "Configured hosted vision model",
    completedAt: now - 3 * 60 * 60 * 1000,
  },
  {
    id: "assessment-3",
    batchId: "demo-batch-3",
    qualityScore: 8.1,
    grade: "Premium Local",
    confidence: 89,
    freshness: 8.4,
    appearance: 8.2,
    color: 8.3,
    damage: 7.8,
    sizeConsistency: 7.9,
    detectedIssues: ["Minor scale loss", "Moderate size variation"],
    summary:
      "The submitted images show clear eyes and consistent skin color, with minor scale loss visible on a small portion of the lot.",
    recommendation:
      "Appropriate for premium domestic buyer review after routine physical inspection.",
    suggestedStartingBid: 610_000,
    suggestedMarketPrice: 700_000,
    estimatedExportValue: 745_000,
    priceExplanation:
      "Visible freshness supports the estimate, while size variation and minor scale loss temper the upper range.",
    model: "Configured hosted vision model",
    completedAt: now - 2 * 60 * 60 * 1000,
  },
  {
    id: "assessment-4",
    batchId: "demo-batch-4",
    qualityScore: 7.8,
    grade: "Premium Local",
    confidence: 88,
    freshness: 8,
    appearance: 7.9,
    color: 8.1,
    damage: 7.5,
    sizeConsistency: 7.7,
    detectedIssues: ["Light surface marks", "Some mantle-size variation"],
    summary:
      "The lot shows a generally bright surface and good visual condition, with light marks and some variation in mantle size.",
    recommendation:
      "Suitable for local wholesale review, subject to a normal hands-on condition check.",
    suggestedStartingBid: 360_000,
    suggestedMarketPrice: 430_000,
    estimatedExportValue: 455_000,
    priceExplanation:
      "The estimate balances good apparent freshness against surface marks and visible size variation.",
    model: "Configured hosted vision model",
    completedAt: now - day * 3,
  },
];

export const demoAuctions: PublicAuction[] = [
  {
    id: "auction-1",
    batchId: "demo-batch-1",
    batch: demoBatches[0],
    assessment: demoAssessments[0],
    sellerName: "Myeik Blue Ocean Trading",
    startingPrice: 720_000,
    minimumIncrement: 20_000,
    currentPrice: 820_000,
    bidCount: 6,
    startsAt: now - 2 * 60 * 60 * 1000,
    endsAt: now + 3.5 * 60 * 60 * 1000,
    status: "live",
  },
  {
    id: "auction-2",
    batchId: "demo-batch-2",
    batch: demoBatches[1],
    assessment: demoAssessments[1],
    sellerName: "Tanintharyi Catch Cooperative",
    startingPrice: 430_000,
    minimumIncrement: 15_000,
    currentPrice: 505_000,
    bidCount: 5,
    startsAt: now - 5 * 60 * 60 * 1000,
    endsAt: now + 50 * 60 * 1000,
    status: "live",
  },
];

export const demoScheduledAuctions: PublicAuction[] = [
  {
    id: "auction-3",
    batchId: "demo-batch-3",
    batch: demoBatches[2],
    assessment: demoAssessments[2],
    sellerName: "Mergui Coastal Fisheries",
    startingPrice: 610_000,
    minimumIncrement: 20_000,
    currentPrice: 610_000,
    bidCount: 0,
    startsAt: now + 18 * 60 * 60 * 1000,
    endsAt: now + 26 * 60 * 60 * 1000,
    status: "scheduled",
  },
];

export const demoPurchasedAuctions: PublicAuction[] = [
  {
    id: "auction-4",
    batchId: "demo-batch-4",
    batch: demoBatches[3],
    assessment: demoAssessments[3],
    sellerName: "Dawei Andaman Supply",
    startingPrice: 360_000,
    minimumIncrement: 10_000,
    currentPrice: 420_000,
    bidCount: 7,
    startsAt: now - day * 2.5,
    endsAt: now - day * 2,
    status: "closed",
    winnerName: "Demo Buyer",
    myHighestBid: 420_000,
    lastBidAt: now - day * 2 - 5 * 60 * 1000,
  },
];
