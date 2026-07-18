import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { BuyerDashboard } from "@/features/analytics/buyer-dashboard";

export default function BuyerPage() {
  return (
    <>
      <PageHeading
        eyebrow="Buyer workspace"
        title="Trading overview"
        description="Track active bids, wallet availability, and seafood lots won through the marketplace."
        actions={
          <Button asChild>
            <Link href="/auctions">
              Browse auctions
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <BuyerDashboard />
    </>
  );
}
