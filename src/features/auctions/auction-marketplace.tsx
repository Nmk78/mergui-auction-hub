"use client";

import { useQuery } from "convex/react";
import { Gavel } from "lucide-react";
import { AuctionCard } from "@/components/domain/auction-card";
import { useBackend } from "@/components/providers/backend-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoAuctions } from "@/lib/demo-data";
import type { PublicAuction } from "@/types/domain";

export function AuctionMarketplace() {
  const { configured } = useBackend();
  return configured ? <LiveMarketplace /> : <AuctionGrid auctions={demoAuctions} />;
}

function LiveMarketplace() {
  const result = useQuery(convexApi.auctions.listPublic, { status: "live" });
  if (result === undefined) {
    return <MarketplaceSkeleton />;
  }
  return <AuctionGrid auctions={result as PublicAuction[]} />;
}

export function AuctionGrid({ auctions }: { auctions: PublicAuction[] }) {
  if (auctions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <Gavel className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No live auctions</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Assessed seafood batches will appear here when their timed auction
            window opens.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading auctions">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden py-0">
          <Skeleton className="aspect-[16/9] rounded-none" />
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
