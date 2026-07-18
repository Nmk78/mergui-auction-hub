import { PageHeading } from "@/components/layout/page-heading";
import { SellerAuctionList } from "@/features/auctions/seller-auction-list";

export default function SellerAuctionsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Auction activity"
        title="Seller auctions"
        description="Monitor scheduled, live, and completed auctions for your assessed batches."
      />
      <SellerAuctionList />
    </>
  );
}
