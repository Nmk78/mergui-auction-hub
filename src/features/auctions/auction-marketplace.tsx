"use client";

import { useQuery } from "convex/react";
import { Gavel, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AuctionCard } from "@/components/domain/auction-card";
import { useBackend } from "@/components/providers/backend-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convexApi } from "@/lib/convex-api";
import { demoAuctions, demoScheduledAuctions } from "@/lib/demo-data";
import type { PublicAuction, SeafoodType } from "@/types/domain";

export function AuctionMarketplace() {
  const { configured } = useBackend();
  const [status, setStatus] = useState<"live" | "scheduled">("live");
  const [search, setSearch] = useState("");
  const [seafoodType, setSeafoodType] = useState<SeafoodType | "all">("all");

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <Tabs
            value={status}
            onValueChange={(value) =>
              setStatus(value as "live" | "scheduled")
            }
          >
            <TabsList>
              <TabsTrigger value="live">Live now</TabsTrigger>
              <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search seafood, seller, or landing port"
              aria-label="Search seafood auctions"
            />
          </div>
          <Select
            value={seafoodType}
            onValueChange={(value) =>
              setSeafoodType(value as SeafoodType | "all")
            }
          >
            <SelectTrigger className="w-full lg:w-44" aria-label="Seafood type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All seafood</SelectItem>
              <SelectItem value="Fish">Fish</SelectItem>
              <SelectItem value="Shrimp">Shrimp</SelectItem>
              <SelectItem value="Crab">Crab</SelectItem>
              <SelectItem value="Squid">Squid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {configured ? (
        <LiveMarketplace
          status={status}
          search={search}
          seafoodType={seafoodType}
        />
      ) : (
        <FilteredMarketplace
          auctions={status === "live" ? demoAuctions : demoScheduledAuctions}
          search={search}
          seafoodType={seafoodType}
        />
      )}
    </div>
  );
}

function LiveMarketplace({
  status,
  search,
  seafoodType,
}: {
  status: "live" | "scheduled";
  search: string;
  seafoodType: SeafoodType | "all";
}) {
  const result = useQuery(convexApi.auctions.listPublic, {
    status,
    seafoodType: seafoodType === "all" ? undefined : seafoodType,
  });
  if (result === undefined) {
    return <MarketplaceSkeleton />;
  }
  return (
    <FilteredMarketplace
      auctions={result as PublicAuction[]}
      search={search}
      seafoodType="all"
    />
  );
}

function FilteredMarketplace({
  auctions,
  search,
  seafoodType,
}: {
  auctions: PublicAuction[];
  search: string;
  seafoodType: SeafoodType | "all";
}) {
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return auctions.filter((auction) => {
      const matchesType =
        seafoodType === "all" ||
        auction.batch.seafoodType === seafoodType;
      const matchesSearch =
        !needle ||
        [
          auction.batch.name,
          auction.batch.seafoodType,
          auction.batch.port,
          auction.sellerName,
        ].some((value) => value.toLowerCase().includes(needle));
      return matchesType && matchesSearch;
    });
  }, [auctions, seafoodType, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} auction{filtered.length === 1 ? "" : "s"} found
        </p>
        {search.trim() && (
          <Badge variant="outline">Search: {search.trim()}</Badge>
        )}
      </div>
      <AuctionGrid
        auctions={filtered}
        emptyTitle="No matching auctions"
        emptyDescription="Try another seafood type or a broader search term."
      />
    </div>
  );
}

export function AuctionGrid({
  auctions,
  emptyTitle = "No auctions available",
  emptyDescription = "Assessed seafood batches will appear here when their auction window is available.",
}: {
  auctions: PublicAuction[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (auctions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <Gavel className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">{emptyTitle}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {emptyDescription}
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
