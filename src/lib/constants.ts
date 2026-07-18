import {
  Boxes,
  Gavel,
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

export const APP_NAME = "MERGUI Auction Hub";
export const ASSESSMENT_LABEL = "AI Visual Assessment";
export const ASSESSMENT_DISCLAIMER =
  "This AI visual assessment is decision support only and is not an official certification.";

export const SEAFOOD_TYPES = ["Fish", "Shrimp", "Crab", "Squid"] as const;
export const BATCH_STATUSES = [
  "draft",
  "assessment",
  "ready",
  "auction",
  "sold",
] as const;
export const QUALITY_GRADES = [
  "Export Grade",
  "Premium Local",
  "Standard Local",
  "Low Quality",
] as const;

export const sellerNavigation = [
  { label: "Overview", href: "/seller", icon: LayoutDashboard },
  { label: "Seafood batches", href: "/seller/batches", icon: Boxes },
  { label: "Auctions", href: "/seller/auctions", icon: Gavel },
  { label: "Sales history", href: "/seller/sales", icon: ReceiptText },
] as const;

export const buyerNavigation = [
  { label: "Overview", href: "/buyer", icon: LayoutDashboard },
  { label: "Marketplace", href: "/auctions", icon: ShoppingBag },
  { label: "My bids", href: "/buyer/bids", icon: Gavel },
  { label: "Purchases", href: "/buyer/purchases", icon: ReceiptText },
  { label: "Wallet", href: "/buyer/wallet", icon: WalletCards },
] as const;

export const mmk = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "MMK",
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
