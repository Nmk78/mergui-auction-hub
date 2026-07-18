import { PageHeading } from "@/components/layout/page-heading";
import { AuctionPublishForm } from "@/features/auctions/auction-publish-form";

export default async function PublishAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeading
        eyebrow="Timed auction"
        title="Publish assessed batch"
        description="Confirm the auction terms. Closing and winner selection are automatic."
      />
      <AuctionPublishForm batchId={id} />
    </>
  );
}
