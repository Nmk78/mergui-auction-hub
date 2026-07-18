"use client";

import { useQuery } from "convex/react";
import {
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import { useBackend } from "@/components/providers/backend-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { mmk } from "@/lib/constants";

export type SellerAnalytics = {
  metrics: {
    totalBatches: number;
    activeBatches: number;
    readyBatches: number;
    liveAuctions: number;
    bidsReceived: number;
    monthSales: number;
    soldLots: number;
    averageQuality: number | null;
  };
  statusBreakdown: {
    draft: number;
    assessment: number;
    ready: number;
    auction: number;
    sold: number;
  };
  sales: SellerSale[];
};

export type SellerSale = {
  id: string;
  batchId: string;
  batchName: string;
  seafoodType: "Fish" | "Shrimp" | "Crab" | "Squid";
  weightKg: number;
  buyerName: string;
  price: number;
  closedAt: number;
  bidCount: number;
  qualityScore?: number;
};

export const demoSellerAnalytics: SellerAnalytics = {
  metrics: {
    totalBatches: 12,
    activeBatches: 7,
    readyBatches: 3,
    liveAuctions: 4,
    bidsReceived: 27,
    monthSales: 6_840_000,
    soldLots: 8,
    averageQuality: 8.5,
  },
  statusBreakdown: {
    draft: 2,
    assessment: 1,
    ready: 3,
    auction: 1,
    sold: 5,
  },
  sales: [
    {
      id: "sale-1",
      batchId: "demo-batch-4",
      batchName: "Coastal Squid — Lot 09",
      seafoodType: "Squid",
      weightKg: 188,
      buyerName: "Andaman Cold Chain",
      price: 420_000,
      closedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      bidCount: 7,
      qualityScore: 7.8,
    },
    {
      id: "sale-2",
      batchId: "demo-batch-1",
      batchName: "Myeik White Pomfret — Lot 16",
      seafoodType: "Fish",
      weightKg: 276,
      buyerName: "Yangon Fresh Distribution",
      price: 1_180_000,
      closedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
      bidCount: 11,
      qualityScore: 8.7,
    },
  ],
};

export function SellerDashboard() {
  const { configured } = useBackend();
  return configured ? (
    <LiveSellerDashboard />
  ) : (
    <DashboardContent analytics={demoSellerAnalytics} />
  );
}

function LiveSellerDashboard() {
  const result = useQuery(convexApi.analytics.seller, {});
  if (result === undefined) {
    return <DashboardSkeleton />;
  }
  return <DashboardContent analytics={result as SellerAnalytics} />;
}

function DashboardContent({ analytics }: { analytics: SellerAnalytics }) {
  const cards = [
    {
      label: "Active batches",
      value: analytics.metrics.activeBatches.toString(),
      note: `${analytics.metrics.readyBatches} ready for auction`,
      icon: Boxes,
    },
    {
      label: "Live auctions",
      value: analytics.metrics.liveAuctions.toString(),
      note: `${analytics.metrics.bidsReceived} bids received`,
      icon: Gavel,
    },
    {
      label: "Sales · last 30 days",
      value: mmk.format(analytics.metrics.monthSales),
      note: `${analytics.metrics.soldLots} completed lots overall`,
      icon: CircleDollarSign,
    },
    {
      label: "Average visual quality",
      value:
        analytics.metrics.averageQuality === null
          ? "—"
          : `${analytics.metrics.averageQuality.toFixed(1)} / 10`,
      note: "Completed AI visual assessments",
      icon: ChartNoAxesCombined,
    },
  ];
  const stages = [
    { label: "Draft", value: analytics.statusBreakdown.draft },
    { label: "AI assessment", value: analytics.statusBreakdown.assessment },
    { label: "Ready", value: analytics.statusBreakdown.ready },
    { label: "In auction", value: analytics.statusBreakdown.auction },
    { label: "Sold", value: analytics.statusBreakdown.sold },
  ];

  return (
    <div className="space-y-6">
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Seller metrics"
      >
        {cards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Batch pipeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current inventory across the trading workflow.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {stages.map((stage) => (
              <div key={stage.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="font-mono font-medium">{stage.value}</span>
                </div>
                <Progress
                  value={
                    analytics.metrics.totalBatches === 0
                      ? 0
                      : (stage.value / analytics.metrics.totalBatches) * 100
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent sales</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest completed seafood auction settlements.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/seller/sales">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {analytics.sales.length === 0 ? (
              <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Completed sales will appear here.
              </p>
            ) : (
              <div className="divide-y">
                {analytics.sales.slice(0, 4).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {sale.batchName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sale.buyerName} ·{" "}
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                        }).format(sale.closedAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold">
                        {mmk.format(sale.price)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {sale.bidCount} bids
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading seller analytics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
