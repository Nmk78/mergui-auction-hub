"use client";

import { useQuery } from "convex/react";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useBackend } from "@/components/providers/backend-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { mmk, number } from "@/lib/constants";
import {
  demoSellerAnalytics,
  type SellerAnalytics,
  type SellerSale,
} from "@/features/analytics/seller-dashboard";

export function SellerSalesHistory() {
  const { configured } = useBackend();
  return configured ? (
    <LiveSalesHistory />
  ) : (
    <SalesHistoryContent sales={demoSellerAnalytics.sales} />
  );
}

function LiveSalesHistory() {
  const result = useQuery(convexApi.analytics.seller, {});
  if (result === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }
  return <SalesHistoryContent sales={(result as SellerAnalytics).sales} />;
}

function SalesHistoryContent({ sales }: { sales: SellerSale[] }) {
  if (sales.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <ReceiptText className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No completed sales</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Won auctions will appear here after wallet settlement completes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = sales.reduce((sum, sale) => sum + sale.price, 0);
  return (
    <Card>
      <CardHeader className="flex-row items-end justify-between gap-4">
        <div>
          <CardTitle>Completed auction sales</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {sales.length} settled lot{sales.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Recorded sales</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {mmk.format(total)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead className="text-right">Winning price</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <p className="font-medium">{sale.batchName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sale.seafoodType} · {number.format(sale.weightKg)} kg ·{" "}
                    {sale.bidCount} bids
                  </p>
                </TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                  }).format(sale.closedAt)}
                </TableCell>
                <TableCell>
                  {sale.qualityScore === undefined ? (
                    "—"
                  ) : (
                    <Badge variant="outline">
                      {sale.qualityScore.toFixed(1)} / 10
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {mmk.format(sale.price)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/seller/batches/${sale.batchId}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
