import type {
  BATCH_STATUSES,
  QUALITY_GRADES,
  SEAFOOD_TYPES,
} from "@/lib/constants";

export type UserRole = "seller" | "buyer";
export type SeafoodType = (typeof SEAFOOD_TYPES)[number];
export type BatchStatus = (typeof BATCH_STATUSES)[number];
export type QualityGrade = (typeof QUALITY_GRADES)[number];
export type AuctionStatus = "scheduled" | "live" | "closed" | "cancelled";

export type BatchImage = {
  storageId: string;
  url: string | null;
};

export type BatchSummary = {
  id: string;
  name: string;
  seafoodType: SeafoodType;
  quantity: number;
  weightKg: number;
  catchDate: number;
  arrivalDate: number;
  port: string;
  description: string;
  status: BatchStatus;
  images: BatchImage[];
  updatedAt: number;
};

export type Assessment = {
  id: string;
  batchId: string;
  qualityScore: number;
  grade: QualityGrade;
  confidence: number;
  freshness: number;
  appearance: number;
  color: number;
  damage: number;
  sizeConsistency: number;
  detectedIssues: string[];
  summary: string;
  recommendation: string;
  suggestedStartingBid: number;
  suggestedMarketPrice: number;
  estimatedExportValue: number;
  priceExplanation: string;
  model: string;
  completedAt: number;
};

export type PublicAuction = {
  id: string;
  batchId: string;
  batch: BatchSummary;
  assessment: Assessment;
  sellerName: string;
  startingPrice: number;
  minimumIncrement: number;
  currentPrice: number;
  bidCount: number;
  startsAt: number;
  endsAt: number;
  status: AuctionStatus;
  winnerName?: string;
  isLeading?: boolean;
};
