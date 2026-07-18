"use client";

import { useQuery } from "convex/react";
import {
  ArrowRight,
  Gavel,
  ReceiptText,
  ShoppingBag,
  Trophy,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
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

type WalletView = {
  balance: number;
  reserved: number;
  available: number;
  updatedAt: number;
};

const demoBids: PublicAuction[] = [
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
];

const demoWallet: WalletView = {
  balance: 5_000_000,
  reserved: 1_250_000,
  available: 3_750_000,
  updatedAt: Date.now() - 18 * 60 * 1000,
};

export function BuyerDashboard() {
  const { configured } = useBackend();

  return configured ? (
    <LiveBuyerDashboard />
  ) : (
    <DashboardContent
      bids={demoBids}
      purchases={demoPurchasedAuctions}
      wallet={demoWallet}
    />
  );
}

function LiveBuyerDashboard() {
  const bids = useQuery(convexApi.auctions.listMyBids, {});
  const purchases = useQuery(convexApi.auctions.listPurchases, {});
  const wallet = useQuery(convexApi.wallets.current, {});

  if (bids === undefined || purchases === undefined || wallet === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardContent
      bids={bids as PublicAuction[]}
      purchases={(purchases as Array<PublicAuction | null>).filter(
        (auction): auction is PublicAuction => auction !== null,
      )}
      wallet={wallet as WalletView}
    />
  );
}

function DashboardContent({
  bids,
  purchases,
  wallet,
}: {
  bids: PublicAuction[];
  purchases: PublicAuction[];
  wallet: WalletView;
}) {
  const liveBids = bids.filter((auction) => auction.status === "live");
  const leadingBids = liveBids.filter((auction) => auction.isLeading);
  const recentBids = bids.slice(0, 3);
  const cards = [
    {
      label: "Available to bid",
      value: mmk.format(wallet.available),
      note: `${mmk.format(wallet.reserved)} currently reserved`,
      icon: WalletCards,
    },
    {
      label: "Active bids",
      value: liveBids.length.toString(),
      note: `${leadingBids.length} leading right now`,
      icon: Gavel,
    },
    {
      label: "Purchases",
      value: purchases.length.toString(),
      note:
        purchases.length === 1
          ? "1 completed auction won"
          : `${purchases.length} completed auctions won`,
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-6">
      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label="Buyer metrics"
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
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent bidding</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest lots you have participated in.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/buyer/bids">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBids.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No bids yet"
                description="Open the marketplace to find assessed seafood lots ready for bidding."
                href="/auctions"
                action="Browse auctions"
              />
            ) : (
              <div className="space-y-3">
                {recentBids.map((auction) => (
                  <div
                    key={auction.id}
                    className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{auction.batch.name}</p>
                        {auction.isLeading && (
                          <Badge className="border-primary/25 bg-primary/8 text-primary">
                            <Trophy className="size-3" />
                            Leading
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {auction.sellerName} · {auction.batch.port}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-xs text-muted-foreground">
                          Your bid
                        </p>
                        <p className="font-mono font-semibold">
                          {mmk.format(
                            auction.myHighestBid ?? auction.currentPrice,
                          )}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/auctions/${auction.id}`}
                          aria-label={`View ${auction.batch.name}`}
                        >
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace shortcuts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Buyer tools for auctions, records, and wallet status.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Shortcut href="/auctions" label="Marketplace" icon={ShoppingBag} />
            <Shortcut href="/buyer/bids" label="My bids" icon={Gavel} />
            <Shortcut
              href="/buyer/purchases"
              label="Purchases"
              icon={ReceiptText}
            />
            <Shortcut href="/buyer/wallet" label="Wallet" icon={WalletCards} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Shortcut({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Button asChild variant="outline" className="justify-start">
      <Link href={href}>
        <Icon className="size-4" />
        {label}
      </Link>
    </Button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <Icon className="size-9 text-primary" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-5">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading buyer dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </section>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
