"use client";

import { useQuery } from "convex/react";
import { AuctionGrid } from "@/features/auctions/auction-marketplace";
import { useBackend } from "@/components/providers/backend-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoAuctions } from "@/lib/demo-data";
import type { PublicAuction } from "@/types/domain";

export function SellerAuctionList() {
  const { configured } = useBackend();
  return configured ? <LiveSellerAuctionList /> : <AuctionGrid auctions={demoAuctions} />;
}

function LiveSellerAuctionList() {
  const result = useQuery(convexApi.auctions.listMine, {});
  if (result === undefined) {
    return <Skeleton className="h-80 w-full" />;
  }
  return (
    <AuctionGrid
      auctions={(result as Array<PublicAuction | null>).filter(
        (auction): auction is PublicAuction => auction !== null,
      )}
    />
  );
}
