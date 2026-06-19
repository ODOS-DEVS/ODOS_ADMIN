export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`kpi-${index}`}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
      <div className="grid h-10 grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`metric-${index}`} className="animate-pulse rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-7" />
        <div className="space-y-4 xl:col-span-5">
          <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
