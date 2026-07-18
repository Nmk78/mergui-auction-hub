import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { AuctionMarketplace } from "@/features/auctions/auction-marketplace";

export const metadata: Metadata = {
  title: "Seafood auctions",
};

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const initialSearch =
    typeof params.search === "string" ? params.search.slice(0, 100) : "";
  const initialStatus =
    params.status === "scheduled" ? "scheduled" : "live";
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-9 sm:px-6 lg:px-8"
      >
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Myeik seafood marketplace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Assessed seafood auctions
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Review seller batch facts, submitted images, and AI visual assessments
            before placing a timed bid.
          </p>
        </div>
        <AuctionMarketplace
          initialSearch={initialSearch}
          initialStatus={initialStatus}
        />
      </main>
    </>
  );
}
