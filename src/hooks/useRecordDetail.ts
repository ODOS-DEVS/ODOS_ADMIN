import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminAuth } from "@/hooks/useAdminAuth";

export function useRecordDetail<T>({
  id,
  loadDetail,
  loadList,
  getId,
  enabled = true,
}: {
  id: string;
  loadDetail?: (token: string, recordId: string) => Promise<T>;
  loadList?: (token: string) => Promise<T[]>;
  getId?: (item: T) => string;
  enabled?: boolean;
}) {
  const { token } = useAdminAuth();
  const [record, setRecord] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  const loadDetailRef = useRef(loadDetail);
  const loadListRef = useRef(loadList);
  const getIdRef = useRef(getId);
  loadDetailRef.current = loadDetail;
  loadListRef.current = loadList;
  getIdRef.current = getId;

  useEffect(() => {
    if (!enabled) {
      loadedIdRef.current = null;
      setRecord(null);
      setIsLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }
    if (!token || !id) {
      return;
    }

    let cancelled = false;
    const isNewRecord = loadedIdRef.current !== id;

    const run = async (background: boolean) => {
      if (!background && isNewRecord) {
        setIsLoading(true);
      } else if (background) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        let nextRecord: T;
        const loadDetailFn = loadDetailRef.current;
        const loadListFn = loadListRef.current;
        const getIdFn = getIdRef.current;

        if (loadDetailFn) {
          nextRecord = await loadDetailFn(token, id);
        } else if (loadListFn) {
          const items = await loadListFn(token);
          const match = items.find((item) =>
            getIdFn ? getIdFn(item) : String((item as { id: string }).id) === id,
          );
          if (!match) {
            throw new Error("Record not found.");
          }
          nextRecord = match;
        } else {
          throw new Error("No loader configured.");
        }

        if (!cancelled) {
          loadedIdRef.current = id;
          setRecord(nextRecord);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (isNewRecord) {
            loadedIdRef.current = null;
          }
          setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void run(false);

    return () => {
      cancelled = true;
    };
  }, [enabled, id, token]);

  const reload = useCallback(
    async (background = false) => {
      if (!enabled || !token || !id) {
        return;
      }

      if (background) {
        setIsRefreshing(true);
      } else if (loadedIdRef.current !== id) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const loadDetailFn = loadDetailRef.current;
        const loadListFn = loadListRef.current;
        const getIdFn = getIdRef.current;

        if (loadDetailFn) {
          const nextRecord = await loadDetailFn(token, id);
          loadedIdRef.current = id;
          setRecord(nextRecord);
        } else if (loadListFn) {
          const items = await loadListFn(token);
          const match = items.find((item) =>
            getIdFn ? getIdFn(item) : String((item as { id: string }).id) === id,
          );
          if (!match) {
            throw new Error("Record not found.");
          }
          loadedIdRef.current = id;
          setRecord(match);
        } else {
          throw new Error("No loader configured.");
        }
      } catch (loadError) {
        loadedIdRef.current = null;
        setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [enabled, id, token],
  );

  return { record, isLoading, isRefreshing, error, reload, setRecord };
}
