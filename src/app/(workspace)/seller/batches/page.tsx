import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { BatchList } from "@/features/batches/batch-list";

export default function BatchesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Inventory"
        title="Seafood batches"
        description="Create, assess, and prepare landed seafood lots for timed auction."
        actions={
          <Button asChild>
            <Link href="/seller/batches/new">
              <Plus className="size-4" />
              Create batch
            </Link>
          </Button>
        }
      />
      <BatchList />
    </>
  );
}
