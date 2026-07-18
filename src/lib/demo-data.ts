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
