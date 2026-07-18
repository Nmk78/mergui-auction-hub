import { PageHeading } from "@/components/layout/page-heading";
import { BuyerBidHistory } from "@/features/auctions/buyer-bid-history";

export default function BuyerBidsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Auction activity"
        title="My bids"
        description="Track your highest bids, current position, and completed auction outcomes."
      />
      <BuyerBidHistory />
    </>
  );
}
