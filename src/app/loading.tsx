import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Loading page"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full max-w-lg" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-72 w-full" />
        ))}
      </div>
    </main>
  );
}
