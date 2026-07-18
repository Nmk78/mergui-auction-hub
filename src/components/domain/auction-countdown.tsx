"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function remainingLabel(milliseconds: number) {
  if (milliseconds <= 0) {
    return "Ended";
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AuctionCountdown({
  endsAt,
  className,
}: {
  endsAt: number;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => endsAt - Date.now());

  useEffect(() => {
    const update = () => setRemaining(endsAt - Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-sm font-medium tabular-nums",
        remaining <= 60 * 60 * 1000 && remaining > 0 && "text-destructive",
        className,
      )}
    >
      <Clock3 className="size-4" />
      {remainingLabel(remaining)}
    </span>
  );
}
