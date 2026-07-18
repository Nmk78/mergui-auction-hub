import { PageHeading } from "@/components/layout/page-heading";
import { SellerSalesHistory } from "@/features/analytics/seller-sales-history";

export default function SellerSalesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Settlement records"
        title="Sales history"
        description="Review completed auction lots, winning buyers, assessed quality, and settled prices."
      />
      <SellerSalesHistory />
    </>
  );
}
