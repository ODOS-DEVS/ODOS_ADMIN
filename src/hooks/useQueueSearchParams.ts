import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Hydrate list filters from URL (`?q=&status=&stock=&queue=`) so dashboard
 * attention links and topbar search open the right queue.
 */
export function useQueueSearchParams(options?: {
  statusValues?: readonly string[];
  defaultStatus?: string;
}) {
  const [searchParams] = useSearchParams();
  const defaultStatus = options?.defaultStatus ?? "all";

  const resolveStatus = () => {
    const raw = searchParams.get("status");
    if (!raw) return defaultStatus;
    if (options?.statusValues && !options.statusValues.includes(raw)) {
      return defaultStatus;
    }
    return raw;
  };

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(resolveStatus);
  const [stockFilter, setStockFilter] = useState(() => searchParams.get("stock") ?? "all");
  const [queueFilter, setQueueFilter] = useState(() => searchParams.get("queue") ?? "all");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setStatusFilter(resolveStatus());
    setStockFilter(searchParams.get("stock") ?? "all");
    setQueueFilter(searchParams.get("queue") ?? "all");
     
  }, [searchParams]);

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    queueFilter,
    setQueueFilter,
  };
}
