import { useCallback, useEffect, useRef, useState } from "react";

import { ADMIN_PAGE_SIZE } from "@/api/adminPagination";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminListParams, AdminPage } from "@/types/pagination";

export function usePaginatedAdminList<T>({
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
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadPageRef = useRef(loadPage);
  const getIdRef = useRef(getId);
  loadPageRef.current = loadPage;
  getIdRef.current = getId;

  const fetchPage = useCallback(
    async (targetPage: number) => {
      if (!token) {
        return;
      }

      const offset = (targetPage - 1) * pageSize;
      const pageResult = await loadPageRef.current(token, { limit: pageSize, offset });
      if (!isMountedRef.current) {
        return;
      }

      setItems(pageResult.items);
      const shouldContinue =
        pageResult.has_more && pageResult.items.length >= pageSize && pageResult.items.length > 0;
      setHasMore(shouldContinue);
      setError(null);
      hasLoadedOnceRef.current = true;
    },
    [pageSize, token],
  );

  const loadPageNumber = useCallback(
    async (targetPage: number, { initial = false }: { initial?: boolean } = {}) => {
      if (!enabled || !token || isFetchingRef.current || targetPage < 1) {
        return;
      }

      isFetchingRef.current = true;
      if (initial && !hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else {
        setIsLoadingPage(true);
      }
      setError(null);

      try {
        await fetchPage(targetPage);
        setPage(targetPage);
      } catch (loadError) {
        if (isMountedRef.current) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load records.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingPage(false);
        }
        isFetchingRef.current = false;
      }
    },
    [enabled, fetchPage, token],
  );

  const refresh = useCallback(async () => {
    await loadPageNumber(page, { initial: false });
  }, [loadPageNumber, page]);

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage === page || targetPage < 1) {
        return;
      }
      void loadPageNumber(targetPage);
    },
    [loadPageNumber, page],
  );

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
      setPage(1);
      setIsLoading(false);
      setIsLoadingPage(false);
      setHasMore(false);
      setError(null);
      return;
    }

    if (!token) {
      return;
    }

    setPage(1);
    void loadPageNumber(1, { initial: true });
    // resetKey intentionally retriggers first-page fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPageNumber is stable enough via refs inside fetch
  }, [enabled, resetKey, token]);

  return {
    items,
    page,
    pageSize,
    isLoading,
    isLoadingPage,
    hasMore,
    error,
    goToPage,
    refresh,
    replaceItem,
    removeItem,
    setItems,
  };
}

/** @deprecated Use usePaginatedAdminList — kept as alias during migration. */
export const useInfiniteAdminList = usePaginatedAdminList;
