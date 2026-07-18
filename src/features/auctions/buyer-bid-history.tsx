"use client";

import { useQuery } from "convex/react";
import { ArrowRight, Gavel, Trophy } from "lucide-react";
import Link from "next/link";
import { useBackend } from "@/components/providers/backend-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoAuctions, demoPurchasedAuctions } from "@/lib/demo-data";
import { mmk } from "@/lib/constants";
import type { PublicAuction } from "@/types/domain";

const demoBidHistory: PublicAuction[] = [
  {
    ...demoAuctions[0],
    isLeading: true,
    myHighestBid: demoAuctions[0].currentPrice,
    lastBidAt: Date.now() - 22 * 60 * 1000,
  },
  {
    ...demoAuctions[1],
    isLeading: false,
    myHighestBid: demoAuctions[1].currentPrice - 15_000,
    lastBidAt: Date.now() - 68 * 60 * 1000,
  },
  ...demoPurchasedAuctions,
];

export function BuyerBidHistory() {
  const { configured } = useBackend();
  return configured ? (
    <LiveBidHistory />
  ) : (
    <BidHistoryList auctions={demoBidHistory} />
  );
}

function LiveBidHistory() {
  const result = useQuery(convexApi.auctions.listMyBids, {});
  if (result === undefined) {
    return <HistorySkeleton />;
  }
  return <BidHistoryList auctions={result as PublicAuction[]} />;
}

function BidHistoryList({ auctions }: { auctions: PublicAuction[] }) {
  if (auctions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <Gavel className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No bids yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Auctions you participate in will appear here with your highest bid
            and current position.
          </p>
          <Button asChild className="mt-5">
            <Link href="/auctions">Browse auctions</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {auctions.map((auction) => {
        const won =
          auction.status === "closed" &&
          auction.myHighestBid === auction.currentPrice;
        const position = won
          ? "Won"
          : auction.isLeading
            ? "Leading"
            : auction.status === "live"
              ? "Outbid"
              : "Closed";
        return (
          <Card key={auction.id}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {auction.batch.seafoodType}
                </p>
                <CardTitle className="mt-1 text-lg">
                  {auction.batch.name}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {auction.sellerName}
                </p>
              </div>
              <Badge
                variant={position === "Outbid" ? "destructive" : "outline"}
                className={
                  position === "Leading" || position === "Won"
                    ? "border-primary/25 bg-primary/8 text-primary"
                    : undefined
                }
              >
                {won && <Trophy className="size-3" />}
                {position}
              </Badge>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 rounded-md bg-muted/50 p-4">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Your highest bid
                  </dt>
                  <dd className="mt-1 font-mono font-semibold">
                    {mmk.format(auction.myHighestBid ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {auction.status === "closed" ? "Winning bid" : "Current bid"}
                  </dt>
                  <dd className="mt-1 font-mono font-semibold">
                    {mmk.format(auction.currentPrice)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Last bid{" "}
                  {auction.lastBidAt
                    ? new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(auction.lastBidAt)
                    : "recorded"}
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/auctions/${auction.id}`}>
                    View
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2" aria-label="Loading bid history">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
