import { PaginatedResponse } from './api';

/**
 * Loads every page of a paginated endpoint and flattens the results.
 * Intended for option lists (selectors) that need the full dataset,
 * not just the first page.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  pageSize = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchPage(page, pageSize);
    items.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return items;
}
