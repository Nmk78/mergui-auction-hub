import { SearchX } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="flex min-h-[70vh] items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
              <SearchX className="size-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              404
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              The requested page may have moved, or the trading record is no
              longer available.
            </p>
            <Button asChild className="mt-6">
              <Link href="/auctions">Browse auctions</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
