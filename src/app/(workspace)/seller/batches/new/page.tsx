import { PageHeading } from "@/components/layout/page-heading";
import { BatchForm } from "@/features/batches/batch-form";

export default function NewBatchPage() {
  return (
    <>
      <PageHeading
        eyebrow="New inventory"
        title="Create seafood batch"
        description="Record the landed lot and attach clear images for visual assessment."
      />
      <BatchForm mode="create" />
    </>
  );
}
