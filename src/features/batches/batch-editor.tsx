"use client";

import { useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoBatches } from "@/lib/demo-data";
import type { BatchSummary } from "@/types/domain";
import { BatchForm } from "./batch-form";

export function BatchEditor({ batchId }: { batchId: string }) {
  const { configured } = useBackend();
  if (!configured) {
    const batch =
      demoBatches.find((candidate) => candidate.id === batchId) ?? demoBatches[0];
    return <BatchForm mode="edit" batch={batch} />;
  }
  return <LiveBatchEditor batchId={batchId} />;
}

function LiveBatchEditor({ batchId }: { batchId: string }) {
  const result = useQuery(convexApi.batches.get, { batchId });
  if (result === undefined) {
    return <Skeleton className="h-[720px] w-full" />;
  }
  if (result === null) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Batch not found</AlertTitle>
        <AlertDescription>
          It may have been deleted or is no longer editable.
        </AlertDescription>
      </Alert>
    );
  }
  const raw = result as BatchSummary & { _id: string };
  return <BatchForm mode="edit" batch={{ ...raw, id: raw._id }} />;
}
