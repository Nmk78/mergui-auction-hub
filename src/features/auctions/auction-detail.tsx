"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowUp,
  CalendarClock,
  Gavel,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { toast } from "sonner";
import { AssessmentReport } from "@/features/assessments/assessment-panel";
import { AuctionCountdown } from "@/components/domain/auction-countdown";
import { SeafoodThumbnail } from "@/components/domain/seafood-thumbnail";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { mmk, number } from "@/lib/constants";
import {
  demoAuctions,
  demoPurchasedAuctions,
  demoScheduledAuctions,
} from "@/lib/demo-data";
import type { PublicAuction } from "@/types/domain";

const demoBids = [
  {
    id: "bid-1",
    amount: 820_000,
    placedAt: Date.now() - 18 * 60 * 1000,
    bidderName: "Ayar Buyer Group",
  },
  {
    id: "bid-2",
    amount: 800_000,
    placedAt: Date.now() - 31 * 60 * 1000,
    bidderName: "Myeik Premium Foods",
  },
  {
    id: "bid-3",
    amount: 760_000,
    placedAt: Date.now() - 49 * 60 * 1000,
    bidderName: "Ayar Buyer Group",
  },
];

export function AuctionDetail({ auctionId }: { auctionId: string }) {
  const { configured } = useBackend();
  return configured ? (
    <LiveAuctionDetail auctionId={auctionId} />
  ) : (
    <DemoAuctionDetail auctionId={auctionId} />
  );
}

function LiveAuctionDetail({ auctionId }: { auctionId: string }) {
  const result = useQuery(convexApi.auctions.getPublic, { auctionId });
  const placeBid = useMutation(
    convexApi.auctions.placeBid,
  ).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(convexApi.auctions.getPublic, {
      auctionId: args.auctionId,
    }) as PublicAuction | null | undefined;
    if (!current || current.status !== "live") {
      return;
    }
    const previousOwnHold = current.isLeading ? current.currentPrice : 0;
    const reservationIncrease = args.amount - previousOwnHold;
    const pendingBid = {
      id: `optimistic-${current.id}-${args.amount}-${current.bidCount + 1}`,
      amount: args.amount,
      placedAt: Math.max(
        current.startsAt,
        (current.bids?.[0]?.placedAt ?? current.startsAt) + 1,
      ),
      bidderName: "Your bid · pending",
    };
    store.setQuery(
      convexApi.auctions.getPublic,
      { auctionId: args.auctionId },
      {
        ...current,
        currentPrice: args.amount,
        bidCount: current.bidCount + 1,
        isLeading: true,
        bids: [pendingBid, ...(current.bids ?? [])],
      },
    );

    const profile = store.getQuery(convexApi.profiles.current, {}) as
      | {
          user: unknown;
          profile: unknown;
          wallet: {
            balance: number;
            reserved: number;
            available: number;
          } | null;
        }
      | undefined;
    if (profile?.wallet) {
      store.setQuery(convexApi.profiles.current, {}, {
        ...profile,
        wallet: {
          ...profile.wallet,
          reserved: profile.wallet.reserved + reservationIncrease,
          available: profile.wallet.available - reservationIncrease,
        },
      });
    }
  });
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewer = useQuery(
    convexApi.profiles.current,
    isAuthenticated ? {} : "skip",
  ) as
    | {
        profile: { role: "seller" | "buyer" } | null;
        wallet: { available: number } | null;
      }
    | undefined;

  if (result === undefined) {
    return <AuctionDetailSkeleton />;
  }
  if (result === null) {
    return <AuctionMissing />;
  }
  return (
    <AuctionDetailView
      auction={result as PublicAuction}
      authenticated={Boolean(
        isAuthenticated && viewer?.profile?.role === "buyer",
      )}
      authLoading={isLoading || (isAuthenticated && viewer === undefined)}
      walletAvailable={viewer?.wallet?.available}
      onBid={(amount) => placeBid({ auctionId, amount })}
    />
  );
}

function DemoAuctionDetail({ auctionId }: { auctionId: string }) {
  const initial = [
    ...demoAuctions,
    ...demoScheduledAuctions,
    ...demoPurchasedAuctions,
  ].find((auction) => auction.id === auctionId);
  const [auction, setAuction] = useState<PublicAuction | null>(() =>
    initial
      ? {
          ...initial,
          bids: initial.status === "live" ? demoBids : [],
        }
      : null,
  );
  const authenticated = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => sessionStorage.getItem("mergui-demo-role") === "buyer",
    () => false,
  );
  if (!auction) {
    return <AuctionMissing />;
  }

  return (
    <AuctionDetailView
      auction={auction}
      authenticated={authenticated}
      authLoading={false}
      walletAvailable={authenticated ? 3_750_000 : undefined}
      onBid={async (amount) => {
        const bid = {
          id: `demo-bid-${Date.now()}`,
          amount,
          placedAt: Date.now(),
          bidderName: "Demo Buyer",
        };
        setAuction((current) =>
          current
            ? {
                ...current,
                currentPrice: amount,
                bidCount: current.bidCount + 1,
                bids: [bid, ...(current.bids ?? [])],
                isLeading: true,
              }
            : current,
        );
      }}
    />
  );
}

function AuctionDetailView({
  auction,
  authenticated,
  authLoading,
  walletAvailable,
  onBid,
}: {
  auction: PublicAuction;
  authenticated: boolean;
  authLoading: boolean;
  walletAvailable?: number;
  onBid: (amount: number) => Promise<unknown>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/25 bg-primary/8 text-primary">
              {auction.status === "live" ? "Live auction" : auction.status}
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {auction.batch.seafoodType}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {auction.batch.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Offered by {auction.sellerName}
          </p>
        </div>
        {auction.status === "live" && (
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Time remaining</p>
            <AuctionCountdown endsAt={auction.endsAt} className="mt-1 text-base" />
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden py-0">
            <SeafoodThumbnail
              type={auction.batch.seafoodType}
              url={auction.batch.images[0]?.url}
              alt={auction.batch.name}
              className="aspect-[16/8] w-full"
            />
            <CardContent className="grid gap-5 p-5 sm:grid-cols-3">
              <Meta
                icon={Weight}
                label="Total weight"
                value={`${number.format(auction.batch.weightKg)} kg`}
              />
              <Meta
                icon={MapPin}
                label="Landing port"
                value={auction.batch.port}
              />
              <Meta
                icon={CalendarClock}
                label="Catch date"
                value={new Date(auction.batch.catchDate).toLocaleDateString(
                  "en-GB",
                  { dateStyle: "medium" },
                )}
              />
            </CardContent>
          </Card>

          <AssessmentReport assessment={auction.assessment} publicView />

          <Card>
            <CardHeader>
              <CardTitle>Bid timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Bids are ordered by server timestamp. Earlier time resolves any
                equal-value tie.
              </p>
            </CardHeader>
            <CardContent>
              {!auction.bids?.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No bids have been placed.
                </p>
              ) : (
                <div className="space-y-0">
                  {auction.bids.map((bid, index) => (
                    <div key={bid.id}>
                      {index > 0 && <Separator />}
                      <div className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <p className="text-sm font-medium">{bid.bidderName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(bid.placedAt).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <p className="font-mono font-semibold">
                          {mmk.format(bid.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <BidCard
            auction={auction}
            authenticated={authenticated}
            authLoading={authLoading}
            walletAvailable={walletAvailable}
            onBid={onBid}
          />
        </div>
      </div>
    </div>
  );
}

function BidCard({
  auction,
  authenticated,
  authLoading,
  walletAvailable,
  onBid,
}: {
  auction: PublicAuction;
  authenticated: boolean;
  authLoading: boolean;
  walletAvailable?: number;
  onBid: (amount: number) => Promise<unknown>;
}) {
  const minimum =
    auction.bidCount === 0
      ? auction.startingPrice
      : auction.currentPrice + auction.minimumIncrement;
  const [amount, setAmount] = useState(minimum);
  const [pending, setPending] = useState(false);
  const validAmount = Math.max(amount, minimum);
  const availableForAuction =
    walletAvailable === undefined
      ? undefined
      : walletAvailable + (auction.isLeading ? auction.currentPrice : 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await onBid(validAmount);
      toast.success("Bid placed");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The bid was not accepted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gavel className="size-5 text-primary" />
          <CardTitle>Place a bid</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground">
            {auction.bidCount > 0 ? "Current highest bid" : "Starting bid"}
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">
            {mmk.format(auction.currentPrice)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {auction.bidCount} valid bid{auction.bidCount === 1 ? "" : "s"}
          </p>
        </div>

        {auction.isLeading && (
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertTitle>You are leading</AlertTitle>
            <AlertDescription>
              Your bid is currently the highest valid offer.
            </AlertDescription>
          </Alert>
        )}

        {authenticated && walletAvailable !== undefined && (
          <div className="rounded-lg border bg-muted/25 p-3">
            <p className="text-xs text-muted-foreground">
              Available for this auction
            </p>
            <p className="mt-1 font-mono font-semibold">
              {mmk.format(availableForAuction ?? walletAvailable)}
            </p>
          </div>
        )}

        {auction.status !== "live" ? (
          <Alert>
            <CalendarClock className="size-4" />
            <AlertTitle>
              {auction.status === "scheduled"
                ? "Bidding has not started"
                : "Bidding is closed"}
            </AlertTitle>
            <AlertDescription>
              {auction.status === "scheduled"
                ? `This auction opens ${new Date(auction.startsAt).toLocaleString(
                    "en-GB",
                    { dateStyle: "medium", timeStyle: "short" },
                  )}.`
                : auction.winnerName
                  ? `${auction.winnerName} won at ${mmk.format(auction.currentPrice)}.`
                  : "This auction ended without a winning bid."}
            </AlertDescription>
          </Alert>
        ) : authLoading ? (
          <Skeleton className="h-28" />
        ) : !authenticated ? (
          <div className="rounded-lg border bg-muted/25 p-4 text-center">
            <p className="text-sm font-medium">Buyer account required</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Guests can review the full auction and AI summary but cannot bid.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/register">Register to bid</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-1 w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bid-amount">Your bid (MMK)</Label>
              <Input
                id="bid-amount"
                type="number"
                min={minimum}
                step={1000}
                value={validAmount}
                onChange={(event) => setAmount(event.target.valueAsNumber)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum valid bid: {mmk.format(minimum)}
              </p>
            </div>
            {availableForAuction !== undefined &&
              validAmount > availableForAuction && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Insufficient available balance</AlertTitle>
                <AlertDescription>
                  Existing leading bids may already reserve part of your wallet.
                </AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={
                pending ||
                (availableForAuction !== undefined &&
                  validAmount > availableForAuction)
              }
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
              Confirm bid
            </Button>
          </form>
        )}

        <Separator />
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Minimum increment: {mmk.format(auction.minimumIncrement)}</p>
          <p>
            Ends{" "}
            {new Date(auction.endsAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Weight;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function AuctionDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Skeleton className="h-10 w-1/2" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Skeleton className="h-[680px]" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function AuctionMissing() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Auction not found</AlertTitle>
        <AlertDescription>
          This auction may have been removed or is not available publicly.
        </AlertDescription>
      </Alert>
    </div>
  );
}
