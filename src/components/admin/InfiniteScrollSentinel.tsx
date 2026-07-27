import { useEffect, useRef } from "react";

export function InfiniteScrollSentinel({
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore]);

  if (!hasMore && !isLoadingMore) {
    return (
      <div className="py-3 text-center text-xs text-textMuted">End of list</div>
    );
  }

  return (
    <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-3">
      {isLoadingMore ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
          <p className="text-xs text-textMuted">Loading more…</p>
        </>
      ) : (
        <span className="h-1 w-1" aria-hidden />
      )}
    </div>
  );
}
