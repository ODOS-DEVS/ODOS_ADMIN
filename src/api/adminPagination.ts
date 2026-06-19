import type { AdminListParams, AdminPage } from "@/types/pagination";

export const ADMIN_PAGE_SIZE = 30;

/** Accepts paginated `{ items, has_more }` or legacy bare arrays from older backends. */
export function normalizeAdminPageResponse<T>(
  payload: AdminPage<T> | T[] | null | undefined,
): AdminPage<T> {
  if (Array.isArray(payload)) {
    return { items: payload, has_more: false };
  }

  if (payload && Array.isArray(payload.items)) {
    const hasMore =
      "has_more" in payload
        ? Boolean(payload.has_more)
        : Boolean((payload as { hasMore?: boolean }).hasMore);

    return {
      items: payload.items,
      has_more: hasMore,
    };
  }

  return { items: [], has_more: false };
}

export function buildAdminListQuery(params: AdminListParams = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

const MAX_ADMIN_PAGES = 200;

export async function fetchAllAdminPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<AdminPage<T>>,
  pageSize = ADMIN_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  let hasMore = true;
  let pagesFetched = 0;

  while (hasMore) {
    if (pagesFetched >= MAX_ADMIN_PAGES) {
      break;
    }
    pagesFetched += 1;

    const page = await fetchPage(offset, pageSize);
    const items = page.items ?? [];
    if (items.length === 0) {
      break;
    }

    all.push(...items);
    offset += items.length;
    hasMore = page.has_more && items.length >= pageSize;
  }

  return all;
}
