import { AppShell } from "@/components/layout/app-shell";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell variant="seller">{children}</AppShell>
  );
}
