"use client";

import { useQuery } from "convex/react";
import { ArrowRight, PackageCheck } from "lucide-react";
import Link from "next/link";
import { SeafoodThumbnail } from "@/components/domain/seafood-thumbnail";
import { useBackend } from "@/components/providers/backend-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoPurchasedAuctions } from "@/lib/demo-data";
import { mmk, number } from "@/lib/constants";
import type { PublicAuction } from "@/types/domain";

export function BuyerPurchases() {
  const { configured } = useBackend();
  return configured ? (
    <LivePurchases />
  ) : (
    <PurchaseList auctions={demoPurchasedAuctions} />
  );
}

function LivePurchases() {
  const result = useQuery(convexApi.auctions.listPurchases, {});
  if (result === undefined) {
    return <PurchaseSkeleton />;
  }
  return (
    <PurchaseList
      auctions={(result as Array<PublicAuction | null>).filter(
        (auction): auction is PublicAuction => auction !== null,
      )}
    />
  );
}

function PurchaseList({ auctions }: { auctions: PublicAuction[] }) {
  if (auctions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <PackageCheck className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No purchases yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Seafood batches won through a completed auction will be listed here
            as your purchase record.
          </p>
          <Button asChild className="mt-5">
            <Link href="/auctions">Browse auctions</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {auctions.map((auction) => (
        <Card key={auction.id} className="overflow-hidden py-0">
          <CardContent className="grid gap-0 p-0 sm:grid-cols-[11rem_1fr]">
            <SeafoodThumbnail
              type={auction.batch.seafoodType}
              url={auction.batch.images[0]?.url}
              alt={auction.batch.name}
              className="aspect-[16/9] h-full min-h-40 w-full sm:aspect-auto"
            />
            <div className="p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <Badge
                    variant="outline"
                    className="border-primary/25 bg-primary/8 text-primary"
                  >
                    Purchased
                  </Badge>
                  <h2 className="mt-3 text-lg font-semibold">
                    {auction.batch.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {auction.sellerName} · {auction.batch.port}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-muted-foreground">Winning price</p>
                  <p className="mt-1 font-mono text-xl font-semibold">
                    {mmk.format(auction.currentPrice)}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm text-muted-foreground">
                <span>{number.format(auction.batch.weightKg)} kg</span>
                <span>{auction.batch.quantity} units</span>
                <span>
                  Closed{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                  }).format(auction.endsAt)}
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-foreground"
                >
                  <Link href={`/auctions/${auction.id}`}>
                    View report
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PurchaseSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading purchases">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-48 w-full" />
      ))}
    </div>
  );
}
