"use client";

import { useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  LockKeyhole,
  WalletCards,
} from "lucide-react";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { convexApi } from "@/lib/convex-api";
import { mmk } from "@/lib/constants";

type WalletView = {
  balance: number;
  reserved: number;
  available: number;
  updatedAt: number;
};

type WalletTransaction = {
  _id: string;
  type: "hold" | "release" | "purchase" | "manual_funding";
  amount: number;
  balanceAfter: number;
  reservedAfter: number;
  note: string;
  createdAt: number;
};

const demoWallet: WalletView = {
  balance: 5_000_000,
  reserved: 1_250_000,
  available: 3_750_000,
  updatedAt: Date.now() - 18 * 60 * 1000,
};

const demoTransactions: WalletTransaction[] = [
  {
    _id: "txn-1",
    type: "hold",
    amount: -820_000,
    balanceAfter: 5_000_000,
    reservedAfter: 1_250_000,
    note: "Funds reserved for leading bid",
    createdAt: Date.now() - 18 * 60 * 1000,
  },
  {
    _id: "txn-2",
    type: "purchase",
    amount: -680_000,
    balanceAfter: 5_000_000,
    reservedAfter: 430_000,
    note: "Winning auction settlement",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "txn-3",
    type: "manual_funding",
    amount: 5_680_000,
    balanceAfter: 5_680_000,
    reservedAfter: 0,
    note: "Balance seeded outside the application",
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
];

export function WalletDashboard() {
  const { configured } = useBackend();
  return configured ? (
    <LiveWalletDashboard />
  ) : (
    <WalletViewContent wallet={demoWallet} transactions={demoTransactions} />
  );
}

function LiveWalletDashboard() {
  const wallet = useQuery(convexApi.wallets.current, {});
  const transactions = useQuery(convexApi.wallets.transactions, {});
  if (wallet === undefined || transactions === undefined) {
    return <Skeleton className="h-[520px] w-full" />;
  }
  return (
    <WalletViewContent
      wallet={wallet as WalletView}
      transactions={transactions as WalletTransaction[]}
    />
  );
}

function WalletViewContent({
  wallet,
  transactions,
}: {
  wallet: WalletView;
  transactions: WalletTransaction[];
}) {
  const metrics = [
    {
      label: "Total balance",
      value: wallet.balance,
      icon: WalletCards,
      description: "Debited only after winning",
    },
    {
      label: "Reserved for leading bids",
      value: wallet.reserved,
      icon: LockKeyhole,
      description: "Released automatically if outbid",
    },
    {
      label: "Available to bid",
      value: wallet.available,
      icon: Landmark,
      description: "Cannot fall below zero",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3" aria-label="Wallet balances">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold">
                {mmk.format(metric.value)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Alert>
        <Landmark className="size-4" />
        <AlertTitle>Virtual wallet</AlertTitle>
        <AlertDescription>
          Funds are added manually outside MERGUI Auction Hub. This MVP has no
          top-up, banking, or payment integration.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Wallet activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Holds, releases, manual funding records, and completed purchases.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance after</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
                        {transaction.amount >= 0 ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {transactionLabel(transaction.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.note}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${
                      transaction.amount >= 0 ? "text-primary" : ""
                    }`}
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {mmk.format(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {mmk.format(transaction.balanceAfter)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function transactionLabel(type: WalletTransaction["type"]) {
  return {
    hold: "Bid hold",
    release: "Hold released",
    purchase: "Auction purchase",
    manual_funding: "Manual funding",
  }[type];
}
