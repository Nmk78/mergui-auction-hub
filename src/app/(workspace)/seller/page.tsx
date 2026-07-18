import Link from "next/link";
import { ArrowUpRight, Boxes, CircleDollarSign, Gavel } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mmk } from "@/lib/constants";

const metrics = [
  { label: "Active batches", value: "12", icon: Boxes, note: "3 ready for auction" },
  { label: "Live auctions", value: "4", icon: Gavel, note: "27 bids received" },
  {
    label: "Month sales",
    value: mmk.format(6_840_000),
    icon: CircleDollarSign,
    note: "8 completed lots",
  },
];

export default function SellerDashboardPage() {
  return (
    <>
      <PageHeading
        eyebrow="Seller workspace"
        title="Trading overview"
        description="Monitor batch readiness, active auctions, and completed seafood sales."
        actions={
          <Button asChild>
            <Link href="/seller/batches/new">
              Create batch
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-3" aria-label="Seller metrics">
        {metrics.map((metric) => (
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
              <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
