import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { DebugTools } from "@/features/debug/debug-tools";

export const metadata: Metadata = {
  title: "Debug tools",
};

export default function DebugPage() {
  if (process.env.NEXT_PUBLIC_DEBUG_TOOLS_ENABLED !== "true") {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-7 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
            Debug mode
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Account and session tools
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Reset development auth state, remove the signed-in account, and clear
            records connected to marketplace testing.
          </p>
        </div>
        <DebugTools />
      </main>
    </>
  );
}
