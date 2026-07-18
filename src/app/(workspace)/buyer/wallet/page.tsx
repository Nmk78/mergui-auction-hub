import { PageHeading } from "@/components/layout/page-heading";
import { WalletDashboard } from "@/features/wallets/wallet-dashboard";

export default function WalletPage() {
  return (
    <>
      <PageHeading
        eyebrow="Virtual funds"
        title="Buyer wallet"
        description="Review available funds, leading-bid reservations, and completed auction debits."
      />
      <WalletDashboard />
    </>
  );
}
