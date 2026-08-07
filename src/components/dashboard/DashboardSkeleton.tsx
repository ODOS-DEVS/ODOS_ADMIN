import { SkeletonBlock, SkeletonGrid } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-14 rounded-2xl" />
      <SkeletonGrid count={4} className="grid grid-cols-2 gap-3 xl:grid-cols-4" tileClassName="h-28 rounded-2xl" />
      <div className="grid h-10 grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={`metric-${index}`} className="rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <SkeletonBlock variant="surface" className="h-72 rounded-2xl xl:col-span-7" />
        <div className="space-y-4 xl:col-span-5">
          <SkeletonBlock variant="surface" className="h-36 rounded-2xl" />
          <SkeletonBlock variant="surface" className="h-52 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
