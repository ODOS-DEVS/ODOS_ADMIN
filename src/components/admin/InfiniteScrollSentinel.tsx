import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";

export function InfiniteScrollSentinel({
  hasMore,
  isLoadingMore,
  onLoadMore,
  summary,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  summary?: string;
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

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-textMuted">
        {summary ?? (hasMore ? "Scroll or load more to see additional records." : "End of list")}
      </p>
      <div ref={sentinelRef} className="flex items-center justify-end gap-2">
        {hasMore ? (
          <Button
            variant="secondary"
            isLoading={isLoadingMore}
            onClick={() => onLoadMore()}
            className="min-w-[7rem]"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        ) : (
          <span className="text-xs text-textSubtle">All records loaded</span>
        )}
      </div>
    </div>
  );
}
