import {
  ADMIN_PAGE_SIZE,
  buildAdminListQuery,
  fetchAllAdminPages,
  normalizeAdminPageResponse,
} from "@/api/adminPagination";
import { requestJson } from "@/api/client";
import type { AdminListParams, AdminPage } from "@/types/pagination";

export function createPaginatedAdminApi<TBackend, TDomain>({
  path,
  mapItem,
}: {
  path: string;
  mapItem: (item: TBackend) => TDomain;
}) {
  async function getPage(token: string, params: AdminListParams = {}) {
    const raw = await requestJson<AdminPage<TBackend> | TBackend[]>(
      `${path}${buildAdminListQuery({ limit: ADMIN_PAGE_SIZE, ...params })}`,
      { token },
    );
    const page = normalizeAdminPageResponse(raw);
    return { ...page, items: page.items.map(mapItem) };
  }

  async function getAll(token: string) {
    return fetchAllAdminPages((offset, limit) => getPage(token, { offset, limit }));
  }

  return { getPage, getAll };
}
