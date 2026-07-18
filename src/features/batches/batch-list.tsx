"use client";

import { useQuery } from "convex/react";
import { ArrowUpRight, Boxes, CalendarDays, MapPin, Weight } from "lucide-react";
import Link from "next/link";
import { useBackend } from "@/components/providers/backend-provider";
import { BatchStatusBadge } from "@/components/domain/status-badge";
import { SeafoodThumbnail } from "@/components/domain/seafood-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoBatches } from "@/lib/demo-data";
import { number } from "@/lib/constants";
import type { BatchSummary } from "@/types/domain";

export function BatchList() {
  const { configured } = useBackend();
  return configured ? <LiveBatchList /> : <BatchGrid batches={demoBatches} />;
}

function LiveBatchList() {
  const result = useQuery(convexApi.batches.listMine, {});
  if (result === undefined) {
    return <BatchListSkeleton />;
  }
  const batches = (result as Array<BatchSummary & { _id: string }>).map(
    (batch) => ({ ...batch, id: batch._id }),
  );
  return <BatchGrid batches={batches} />;
}

function BatchGrid({ batches }: { batches: BatchSummary[] }) {
  if (batches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
            <Boxes className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-semibold">No seafood batches yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Create the first landed batch, attach clear photos, and request an AI
            visual assessment.
          </p>
          <Button asChild className="mt-5">
            <Link href="/seller/batches/new">Create batch</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {batches.map((batch) => (
        <Card key={batch.id} className="overflow-hidden py-0">
          <SeafoodThumbnail
            type={batch.seafoodType}
            url={batch.images[0]?.url}
            alt={batch.name}
            className="aspect-[16/8] w-full"
          />
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {batch.seafoodType}
                </p>
                <h2 className="mt-1 line-clamp-2 font-semibold leading-6">
                  {batch.name}
                </h2>
              </div>
              <BatchStatusBadge status={batch.status} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Weight className="size-3.5" />
                {number.format(batch.weightKg)} kg
              </span>
              <span className="flex items-center gap-1.5">
                <Boxes className="size-3.5" />
                {number.format(batch.quantity)} units
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {new Date(batch.catchDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{batch.port}</span>
              </span>
            </div>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href={`/seller/batches/${batch.id}`}>
                Open batch
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BatchListSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading batches">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden py-0">
          <Skeleton className="aspect-[16/8] rounded-none" />
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
