import Link from "next/link";
import { Gavel, Users } from "lucide-react";
import { AuctionCountdown } from "@/components/domain/auction-countdown";
import { SeafoodThumbnail } from "@/components/domain/seafood-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mmk } from "@/lib/constants";
import type { PublicAuction } from "@/types/domain";

export function AuctionCard({ auction }: { auction: PublicAuction }) {
  return (
    <Card className="overflow-hidden py-0">
      <SeafoodThumbnail
        type={auction.batch.seafoodType}
        url={auction.batch.images[0]?.url}
        alt={auction.batch.name}
        className="aspect-[16/9] w-full"
      />
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className={
              auction.status === "live"
                ? "border-primary/25 bg-primary/8 text-primary"
                : undefined
            }
          >
            {auction.status === "live"
              ? "Live auction"
              : auction.status === "scheduled"
                ? "Upcoming"
                : "Closed"}
          </Badge>
          {auction.status === "live" && (
            <AuctionCountdown endsAt={auction.endsAt} />
          )}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {auction.batch.seafoodType}
        </p>
        <h2 className="mt-1 line-clamp-2 font-semibold leading-6">
          {auction.batch.name}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{auction.sellerName}</p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {auction.bidCount > 0 ? "Current bid" : "Starting bid"}
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {mmk.format(auction.currentPrice)}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {auction.bidCount} bid{auction.bidCount === 1 ? "" : "s"}
          </span>
        </div>
        <Button asChild className="mt-5 w-full">
          <Link href={`/auctions/${auction.id}`}>
            <Gavel className="size-4" />
            View auction
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
