"use client";

import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Edit3,
  Gavel,
  MapPin,
  PackageCheck,
  Sparkles,
  Trash2,
  Weight,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBackend } from "@/components/providers/backend-provider";
import { BatchStatusBadge } from "@/components/domain/status-badge";
import { SeafoodThumbnail } from "@/components/domain/seafood-thumbnail";
import { AssessmentPanel } from "@/features/assessments/assessment-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { demoBatches } from "@/lib/demo-data";
import { BATCH_STATUSES, number } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BatchSummary, BatchStatus } from "@/types/domain";

export function BatchDetail({ batchId }: { batchId: string }) {
  const { configured } = useBackend();
  return configured ? (
    <LiveBatchDetail batchId={batchId} />
  ) : (
    <BatchDetailView
      batch={demoBatches.find((batch) => batch.id === batchId) ?? demoBatches[0]}
      onDelete={async () => undefined}
      onRemoveImage={async () => undefined}
    />
  );
}

function LiveBatchDetail({ batchId }: { batchId: string }) {
  const result = useQuery(convexApi.batches.get, { batchId });
  const removeBatch = useMutation(convexApi.batches.remove);
  const removeImage = useMutation(convexApi.batches.removeImage);
  if (result === undefined) {
    return <BatchDetailSkeleton />;
  }
  if (result === null) {
    return <BatchMissing />;
  }
  const raw = result as BatchSummary & { _id: string };
  return (
    <BatchDetailView
      batch={{ ...raw, id: raw._id }}
      onDelete={() => removeBatch({ batchId: raw._id })}
      onRemoveImage={(storageId) =>
        removeImage({ batchId: raw._id, storageId })
      }
    />
  );
}

function BatchDetailView({
  batch,
  onDelete,
  onRemoveImage,
}: {
  batch: BatchSummary;
  onDelete: () => Promise<unknown>;
  onRemoveImage: (storageId: string) => Promise<unknown>;
}) {
  const router = useRouter();
  const editable = batch.status !== "auction" && batch.status !== "sold";

  async function deleteBatch() {
    try {
      await onDelete();
      toast.success("Batch deleted");
      router.push("/seller/batches");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete batch.");
    }
  }

  async function deleteImage(storageId: string) {
    try {
      await onRemoveImage(storageId);
      toast.success("Photo removed");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not remove photo.");
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {batch.seafoodType}
            </span>
            <BatchStatusBadge status={batch.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {batch.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated{" "}
            {new Date(batch.updatedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" asChild>
              <Link href={`/seller/batches/${batch.id}/edit`}>
                <Edit3 className="size-4" />
                Edit batch
              </Link>
            </Button>
          )}
          {batch.status === "draft" && (
            <Button disabled={batch.images.length === 0} asChild={batch.images.length > 0}>
              {batch.images.length > 0 ? (
                <a href="#assessment">
                  <Sparkles className="size-4" />
                  Run AI assessment
                </a>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Run AI assessment
                </>
              )}
            </Button>
          )}
          {batch.status === "ready" && (
            <Button asChild>
              <Link href={`/seller/batches/${batch.id}/auction`}>
                <Gavel className="size-4" />
                Publish auction
              </Link>
            </Button>
          )}
          {editable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The batch, its photos, and any saved AI assessment will be
                    permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep batch</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteBatch}>
                    Delete batch
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <WorkflowStatus status={batch.status} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch photos</CardTitle>
            </CardHeader>
            <CardContent>
              {batch.images.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 text-center">
                  <PackageCheck className="size-8 text-primary" />
                  <p className="mt-4 font-medium">No photos uploaded</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Add clear seafood images before requesting the AI visual
                    assessment.
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/seller/batches/${batch.id}/edit`}>Add photos</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {batch.images.map((image, index) => (
                    <div key={image.storageId} className="group relative">
                      <SeafoodThumbnail
                        type={batch.seafoodType}
                        url={image.url}
                        alt={`${batch.name}, view ${index + 1}`}
                        className="aspect-square rounded-md border"
                      />
                      {editable && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute right-2 top-2 size-7"
                          onClick={() => deleteImage(image.storageId)}
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {batch.description}
              </p>
            </CardContent>
          </Card>

          <AssessmentPanel batch={batch} />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Landing details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Detail icon={Weight} label="Total weight" value={`${number.format(batch.weightKg)} kg`} />
            <Separator />
            <Detail icon={PackageCheck} label="Quantity" value={`${number.format(batch.quantity)} units`} />
            <Separator />
            <Detail
              icon={CalendarDays}
              label="Catch date"
              value={new Date(batch.catchDate).toLocaleDateString("en-GB", {
                dateStyle: "long",
              })}
            />
            <Separator />
            <Detail
              icon={CalendarDays}
              label="Arrival date"
              value={new Date(batch.arrivalDate).toLocaleDateString("en-GB", {
                dateStyle: "long",
              })}
            />
            <Separator />
            <Detail icon={MapPin} label="Port" value={batch.port} />
          </CardContent>
        </Card>
      </div>

      {batch.status === "draft" && batch.images.length === 0 && (
        <Alert className="mt-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>Assessment is not ready</AlertTitle>
          <AlertDescription>
            Upload at least one clear seafood photo to continue to the AI visual
            assessment.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function WorkflowStatus({ status }: { status: BatchStatus }) {
  const currentIndex = BATCH_STATUSES.indexOf(status);
  return (
    <Card>
      <CardContent className="py-5">
        <ol className="grid grid-cols-5 gap-2" aria-label="Batch workflow">
          {BATCH_STATUSES.map((step, index) => (
            <li key={step} className="min-w-0">
              <div className="flex items-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                    index <= currentIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {index < currentIndex ? <Check className="size-3.5" /> : index + 1}
                </span>
                {index < BATCH_STATUSES.length - 1 && (
                  <span
                    className={cn(
                      "h-px flex-1",
                      index < currentIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <p className="mt-2 truncate pr-2 text-[11px] font-medium capitalize text-muted-foreground sm:text-xs">
                {step === "assessment" ? "AI assessment" : step}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Weight;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function BatchDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading batch">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

function BatchMissing() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>Batch not found</AlertTitle>
      <AlertDescription>
        It may have been deleted or it does not belong to this seller account.
      </AlertDescription>
    </Alert>
  );
}
