import { PageHeading } from "@/components/layout/page-heading";
import { BuyerPurchases } from "@/features/auctions/buyer-purchases";

export default function BuyerPurchasesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Acquisition records"
        title="Purchases"
        description="Review seafood batches won through completed auctions and their AI visual reports."
      />
      <BuyerPurchases />
    </>
  );
}
