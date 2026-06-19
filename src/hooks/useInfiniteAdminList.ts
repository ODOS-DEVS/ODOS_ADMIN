import { useCallback, useEffect, useRef, useState } from "react";

import { ADMIN_PAGE_SIZE } from "@/api/adminPagination";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminListParams, AdminPage } from "@/types/pagination";

function appendUnique<T>(current: T[], incoming: T[], getId: (item: T) => string) {
  if (incoming.length === 0) {
    return current;
  }

  const seen = new Set(current.map(getId));
  const next = [...current];

  for (const item of incoming) {
    const id = getId(item);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    next.push(item);
  }

  return next;
}

export function useInfiniteAdminList<T>({
  loadPage,
  getId,
  pageSize = ADMIN_PAGE_SIZE,
  enabled = true,
  resetKey = "",
}: {
  loadPage: (token: string, params: AdminListParams) => Promise<AdminPage<T>>;
  getId: (item: T) => string;
  pageSize?: number;
  enabled?: boolean;
  resetKey?: string;
}) {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadPageRef = useRef(loadPage);
  const getIdRef = useRef(getId);
  loadPageRef.current = loadPage;
  getIdRef.current = getId;

  const fetchPage = useCallback(
    async ({ offset, append }: { offset: number; append: boolean }) => {
      if (!token) {
        return [];
      }

      const page = await loadPageRef.current(token, { limit: pageSize, offset });
      if (!isMountedRef.current) {
        return page.items;
      }

      const resolveId = getIdRef.current;
      let noNewItems = false;

      setItems((current) => {
        const next = append ? appendUnique(current, page.items, resolveId) : page.items;
        if (append && page.items.length > 0 && next.length === current.length) {
          noNewItems = true;
          return current;
        }
        return next;
      });

      const shouldContinue = page.has_more && page.items.length >= pageSize && !noNewItems;
      hasMoreRef.current = shouldContinue;
      setHasMore(shouldContinue);
      offsetRef.current = offset + page.items.length;
      setError(null);
      hasLoadedOnceRef.current = true;
      return page.items;
    },
    [pageSize, token],
  );

  const loadInitial = useCallback(async () => {
    if (!enabled || !token || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      await fetchPage({ offset: 0, append: false });
    } catch (loadError) {
      if (isMountedRef.current) {
        setItems([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load records.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [enabled, fetchPage, token]);

  const loadInitialRef = useRef(loadInitial);
  loadInitialRef.current = loadInitial;

  const loadMore = useCallback(async () => {
    if (
      !enabled ||
      !token ||
      isFetchingRef.current ||
      isLoadingMore ||
      isLoading ||
      !hasMoreRef.current
    ) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      await fetchPage({ offset: offsetRef.current, append: true });
    } catch (loadError) {
      if (isMountedRef.current) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load more records.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    }
  }, [enabled, fetchPage, isLoading, isLoadingMore, token]);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    await loadInitial();
  }, [loadInitial]);

  const replaceItem = useCallback((nextItem: T) => {
    const resolveId = getIdRef.current;
    setItems((current) =>
      current.map((item) => (resolveId(item) === resolveId(nextItem) ? nextItem : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    const resolveId = getIdRef.current;
    setItems((current) => current.filter((item) => resolveId(item) !== id));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      hasLoadedOnceRef.current = false;
      setItems([]);
      setIsLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      setError(null);
      return;
    }

    if (!token) {
      return;
    }

    void loadInitialRef.current();
  }, [enabled, resetKey, token]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    replaceItem,
    removeItem,
    setItems,
  };
}
