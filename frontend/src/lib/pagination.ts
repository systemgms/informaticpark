import { PaginatedResponse } from './api';

/**
 * Loads every page of a paginated endpoint and flattens the results.
 * Intended for option lists (selectors) that need the full dataset,
 * not just the first page. Page 1 reveals the page count; the remaining
 * pages are then requested concurrently and kept in page order.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  pageSize = 100,
): Promise<T[]> {
  const firstPage = await fetchPage(1, pageSize);
  const totalPages = firstPage.meta.totalPages;

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => fetchPage(index + 2, pageSize)),
  );

  return [firstPage, ...remainingPages].flatMap((response) => response.data);
}
