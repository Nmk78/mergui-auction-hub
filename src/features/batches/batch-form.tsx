"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, Save, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { convexApi } from "@/lib/convex-api";
import { SEAFOOD_TYPES } from "@/lib/constants";
import type { BatchSummary } from "@/types/domain";
import {
  batchFormSchema,
  type BatchFormValues,
  validateImageFiles,
} from "./batch-validation";

type BatchMutationInput = {
  name: string;
  seafoodType: BatchFormValues["seafoodType"];
  quantity: number;
  weightKg: number;
  catchDate: number;
  arrivalDate: number;
  port: string;
  description: string;
};

export function BatchForm({
  mode,
  batch,
}: {
  mode: "create" | "edit";
  batch?: BatchSummary;
}) {
  const { configured } = useBackend();
  return configured ? (
    <LiveBatchForm mode={mode} batch={batch} />
  ) : (
    <BatchFormView
      mode={mode}
      batch={batch}
      onSave={async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        return batch?.id ?? "demo-batch-1";
      }}
    />
  );
}

function LiveBatchForm({
  mode,
  batch,
}: {
  mode: "create" | "edit";
  batch?: BatchSummary;
}) {
  const createBatch = useMutation(convexApi.batches.create);
  const updateBatch = useMutation(convexApi.batches.update);
  const generateUploadUrl = useMutation(convexApi.batches.generateUploadUrl);
  const addImage = useMutation(convexApi.batches.addImage);

  return (
    <BatchFormView
      mode={mode}
      batch={batch}
      onSave={async (input, files, onProgress) => {
        const batchId =
          mode === "edit" && batch
            ? await updateBatch({ batchId: batch.id, ...input })
            : await createBatch(input);

        for (const [index, file] of files.entries()) {
          onProgress(index + 1, files.length);
          const uploadUrl = await generateUploadUrl({});
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!response.ok) {
            throw new Error(`Could not upload ${file.name}.`);
          }
          const result = (await response.json()) as { storageId: string };
          await addImage({ batchId, storageId: result.storageId });
        }
        return String(batchId);
      }}
    />
  );
}

function BatchFormView({
  mode,
  batch,
  onSave,
}: {
  mode: "create" | "edit";
  batch?: BatchSummary;
  onSave: (
    input: BatchMutationInput,
    files: File[],
    onProgress: (current: number, total: number) => void,
  ) => Promise<string>;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: batch?.name ?? "",
      seafoodType: batch?.seafoodType ?? "Fish",
      quantity: batch?.quantity ?? 1,
      weightKg: batch?.weightKg ?? 1,
      catchDate: batch
        ? new Date(batch.catchDate).toISOString().slice(0, 10)
        : "",
      arrivalDate: batch
        ? new Date(batch.arrivalDate).toISOString().slice(0, 10)
        : "",
      port: batch?.port ?? "",
      description: batch?.description ?? "",
    },
  });
  const selectedSeafoodType = useWatch({
    control: form.control,
    name: "seafoodType",
  });

  async function submit(values: BatchFormValues) {
    if (mode === "create" && files.length === 0) {
      setFileError("Add at least one seafood image before saving.");
      return;
    }
    setFileError(null);
    try {
      const batchId = await onSave(
        {
          ...values,
          catchDate: new Date(`${values.catchDate}T00:00:00`).getTime(),
          arrivalDate: new Date(`${values.arrivalDate}T00:00:00`).getTime(),
        },
        files,
        (current, total) => setUploadProgress({ current, total }),
      );
      toast.success(mode === "create" ? "Batch created" : "Batch updated");
      router.push(`/seller/batches/${batchId}`);
      router.refresh();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "The batch could not be saved.",
      );
    } finally {
      setUploadProgress(null);
    }
  }

  function onFilesSelected(selected: File[]) {
    const combined = [...files, ...selected];
    const error = validateImageFiles(combined);
    setFileError(error);
    if (!error) {
      setFiles(combined);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record the landed seafood lot exactly as it will appear to buyers.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label="Batch name" error={form.formState.errors.name?.message}>
            <Input
              placeholder="e.g. Tanintharyi Tiger Prawns — Lot 24"
              {...form.register("name")}
            />
          </Field>
          <Field
            label="Seafood type"
            error={form.formState.errors.seafoodType?.message}
          >
            <Select
              value={selectedSeafoodType}
              onValueChange={(value) =>
                form.setValue(
                  "seafoodType",
                  value as BatchFormValues["seafoodType"],
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEAFOOD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quantity" error={form.formState.errors.quantity?.message}>
            <Input
              type="number"
              min={1}
              step={1}
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Total weight (kg)"
            error={form.formState.errors.weightKg?.message}
          >
            <Input
              type="number"
              min={0.1}
              step={0.1}
              {...form.register("weightKg", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Catch date" error={form.formState.errors.catchDate?.message}>
            <Input type="date" {...form.register("catchDate")} />
          </Field>
          <Field
            label="Arrival date"
            error={form.formState.errors.arrivalDate?.message}
          >
            <Input type="date" {...form.register("arrivalDate")} />
          </Field>
          <Field label="Port" error={form.formState.errors.port?.message}>
            <Input placeholder="e.g. Myeik Main Jetty" {...form.register("port")} />
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Description"
              error={form.formState.errors.description?.message}
            >
              <Textarea
                rows={5}
                placeholder="Describe handling, sorting, storage, and any details buyers should know."
                {...form.register("description")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seafood photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add clear images from multiple angles. Up to 8 images, 10 MB each.
          </p>
        </CardHeader>
        <CardContent>
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/35 px-6 py-8 text-center hover:bg-muted/55">
            <UploadCloud className="mb-3 size-7 text-primary" />
            <span className="text-sm font-medium">Choose seafood images</span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, or WEBP
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                onFilesSelected(Array.from(event.target.files ?? []))
              }
            />
          </label>
          {fileError && (
            <Alert variant="destructive" className="mt-4">
              <ImagePlus className="size-4" />
              <AlertTitle>Check the selected images</AlertTitle>
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map(({ file, url }) => (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  {/* Blob previews are local-only and do not benefit from Next image optimization. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 size-7"
                    onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {batch && batch.images.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              {batch.images.length} existing image{batch.images.length === 1 ? "" : "s"} will
              remain attached. Image removal is available from the batch detail page.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {uploadProgress
            ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}`
            : mode === "create"
              ? "Save batch"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
