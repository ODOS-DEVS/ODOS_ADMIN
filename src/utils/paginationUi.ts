export function buildPageNumberSlots(
  current: number,
  hasMore: boolean,
): Array<number | "ellipsis"> {
  const lastPage = hasMore ? current + 1 : current;
  if (lastPage <= 0) {
    return [];
  }
  if (lastPage === 1) {
    return [1];
  }
  if (lastPage <= 6) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const slots: Array<number | "ellipsis"> = [1];

  if (current > 3) {
    slots.push("ellipsis");
  }

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(lastPage - 1, current + 1);
  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    slots.push(page);
  }

  if (current < lastPage - 2) {
    slots.push("ellipsis");
  }

  slots.push(lastPage);
  return slots;
}

export function formatPaginationRange({
  page,
  pageSize,
  itemCount,
}: {
  page: number;
  pageSize: number;
  itemCount: number;
}) {
  if (itemCount === 0) {
    return "No records on this page";
  }

  const start = (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + itemCount;
  return `Showing ${start} to ${end}`;
}
