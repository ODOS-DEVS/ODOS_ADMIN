import { useEffect, useRef } from "react";

import { LoadingState } from "@/components/ui/LoadingState";

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
      <div className="py-4 text-center text-xs text-textMuted">
        End of list
      </div>
    );
  }

  return (
    <div ref={sentinelRef} className="py-4">
      {isLoadingMore ? <LoadingState label="Loading more..." /> : null}
    </div>
  );
}
