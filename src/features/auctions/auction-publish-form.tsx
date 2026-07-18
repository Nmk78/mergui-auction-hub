"use client";

import { useMutation, useQuery } from "convex/react";
import { CalendarClock, Gavel, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoAssessments, demoBatches } from "@/lib/demo-data";
import { mmk } from "@/lib/constants";
import type { Assessment, BatchSummary } from "@/types/domain";

function localDateTime(timestamp: number) {
  const date = new Date(timestamp - new Date().getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

export function AuctionPublishForm({ batchId }: { batchId: string }) {
  const { configured } = useBackend();
  if (!configured) {
    const batch =
      demoBatches.find((candidate) => candidate.id === batchId) ?? demoBatches[0];
    const assessment =
      demoAssessments.find((candidate) => candidate.batchId === batch.id) ??
      demoAssessments[0];
    return (
      <AuctionPublishView
        batch={batch}
        assessment={assessment}
        onPublish={async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          return "auction-1";
        }}
      />
    );
  }
  return <LiveAuctionPublishForm batchId={batchId} />;
}

function LiveAuctionPublishForm({ batchId }: { batchId: string }) {
  const batchResult = useQuery(convexApi.batches.get, { batchId });
  const assessmentResult = useQuery(convexApi.assessments.getForBatch, {
    batchId,
  });
  const publish = useMutation(convexApi.auctions.publish);

  if (batchResult === undefined || assessmentResult === undefined) {
    return <Skeleton className="h-[540px] w-full" />;
  }
  if (!batchResult || !assessmentResult) {
    return (
      <Alert variant="destructive">
        <CalendarClock className="size-4" />
        <AlertTitle>Batch is not ready</AlertTitle>
        <AlertDescription>
          A completed batch and AI visual assessment are required.
        </AlertDescription>
      </Alert>
    );
  }
  const rawBatch = batchResult as BatchSummary & { _id: string };
  const rawAssessment = assessmentResult as Assessment & { _id: string };
  return (
    <AuctionPublishView
      batch={{ ...rawBatch, id: rawBatch._id }}
      assessment={{ ...rawAssessment, id: rawAssessment._id }}
      onPublish={(input) => publish({ batchId, ...input }) as Promise<string>}
    />
  );
}

function AuctionPublishView({
  batch,
  assessment,
  onPublish,
}: {
  batch: BatchSummary;
  assessment: Assessment;
  onPublish: (input: {
    startingPrice: number;
    minimumIncrement: number;
    startsAt: number;
    endsAt: number;
  }) => Promise<string>;
}) {
  const router = useRouter();
  const [defaultWindow] = useState(() => {
    const now = Date.now();
    return {
      startsAt: localDateTime(now + 5 * 60_000),
      endsAt: localDateTime(now + 4 * 60 * 60_000),
    };
  });
  const [startingPrice, setStartingPrice] = useState(
    assessment.suggestedStartingBid,
  );
  const [minimumIncrement, setMinimumIncrement] = useState(20_000);
  const [startsAt, setStartsAt] = useState(defaultWindow.startsAt);
  const [endsAt, setEndsAt] = useState(defaultWindow.endsAt);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const auctionId = await onPublish({
        startingPrice,
        minimumIncrement,
        startsAt: new Date(startsAt).getTime(),
        endsAt: new Date(endsAt).getTime(),
      });
      toast.success("Auction published and close scheduled");
      router.push(`/auctions/${auctionId}`);
      router.refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not publish auction.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Auction terms</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the opening price, bid step, and exact auction window.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="starting-price">Starting bid (MMK)</Label>
            <Input
              id="starting-price"
              type="number"
              min={1}
              step={1000}
              value={startingPrice}
              onChange={(event) => setStartingPrice(event.target.valueAsNumber)}
              required
            />
            <p className="text-xs text-muted-foreground">
              AI suggestion: {mmk.format(assessment.suggestedStartingBid)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimum-increment">Minimum increment (MMK)</Label>
            <Input
              id="minimum-increment"
              type="number"
              min={1}
              step={1000}
              value={minimumIncrement}
              onChange={(event) => setMinimumIncrement(event.target.valueAsNumber)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts-at">Starts at</Label>
            <Input
              id="starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends-at">Ends at</Label>
            <Input
              id="ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </div>
          <Alert className="sm:col-span-2">
            <CalendarClock className="size-4" />
            <AlertTitle>Automatic close</AlertTitle>
            <AlertDescription>
              Convex schedules a durable close at the exact end time. The highest
              valid bid wins; if values tie, the earlier timestamp wins.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Gavel className="size-4" />
              )}
              Publish auction
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Publication summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Summary label="Batch" value={batch.name} />
          <Summary label="AI grade" value={assessment.grade} />
          <Summary
            label="Quality score"
            value={`${assessment.qualityScore.toFixed(1)} / 10`}
          />
          <Summary
            label="Market estimate"
            value={mmk.format(assessment.suggestedMarketPrice)}
          />
          <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
            Buyers will see the submitted images, stored AI visual assessment,
            auction terms, and live bid history.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
