import Link from "next/link";
import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
      aria-label="MERGUI Auction Hub home"
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Anchor className="size-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm tracking-[0.12em]">MERGUI</span>
          <span className="block text-xs font-medium text-muted-foreground">
            Auction Hub
          </span>
        </span>
      )}
    </Link>
  );
}
