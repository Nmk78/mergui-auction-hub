import { PageHeading } from "@/components/layout/page-heading";
import { BatchEditor } from "@/features/batches/batch-editor";

export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeading
        eyebrow="Batch management"
        title="Edit seafood batch"
        description="Changes to batch facts or photos invalidate the previous AI assessment."
      />
      <BatchEditor batchId={id} />
    </>
  );
}
