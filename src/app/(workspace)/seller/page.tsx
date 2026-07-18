import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { SellerDashboard } from "@/features/analytics/seller-dashboard";

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
      <SellerDashboard />
    </>
  );
}
