import { PublicHeader } from "@/components/layout/public-header";
import { AuctionDetail } from "@/features/auctions/auction-detail";

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <AuctionDetail auctionId={id} />
      </main>
    </>
  );
}
