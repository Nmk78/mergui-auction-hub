import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BatchStatus } from "@/types/domain";

const labels: Record<BatchStatus, string> = {
  draft: "Draft",
  assessment: "AI assessment",
  ready: "Ready",
  auction: "In auction",
  sold: "Sold",
};

export function BatchStatusBadge({
  status,
  className,
}: {
  status: BatchStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        status === "ready" && "border-primary/25 bg-primary/8 text-primary",
        status === "auction" && "border-accent bg-accent/25 text-accent-foreground",
        status === "sold" && "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {labels[status]}
    </Badge>
  );
}
