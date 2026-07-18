"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-[70vh] items-center justify-center px-4 py-12"
    >
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The page could not finish loading. Retry the request, or return to
            the auction marketplace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/auctions">Marketplace</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
