// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaginatedList } from './use-paginated-list';
import { PaginatedResponse } from '@/lib/api';

interface FetchArgs {
  page: number;
  limit: number;
  search: string;
}

function makeFetchPage(total: number) {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  return vi.fn(async ({ page, limit, search }: FetchArgs): Promise<PaginatedResponse<number>> => {
    const filtered = search ? all.filter((n) => String(n).includes(search)) : all;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  });
}

describe('usePaginatedList', () => {
  it('loads the first page on mount', async () => {
    const fetchPage = makeFetchPage(5);
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 20 }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.meta?.total).toBe(5);
    expect(result.current.page).toBe(1);
    expect(fetchPage).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('refetches when the page changes', async () => {
    const fetchPage = makeFetchPage(25);
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 20 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.items).toEqual([21, 22, 23, 24, 25]));
  });

  it('keeps a page change made before the initial debounce elapses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchPage = makeFetchPage(25);
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 20, searchDebounceMs: 300 }));

    act(() => result.current.setPage(2));
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.page).toBe(2);
    vi.useRealTimers();
  });

  it('debounces search input and resets to page 1', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchPage = makeFetchPage(20);
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 5, searchDebounceMs: 300 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(fetchPage).toHaveBeenCalledTimes(1);

    act(() => result.current.setPage(3));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.page).toBe(3);

    act(() => result.current.setSearch('1'));
    // page must not reset before the debounce fires
    expect(result.current.page).toBe(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.page).toBe(1);
    vi.useRealTimers();
  });

  it('surfaces fetch errors and clears loading state', async () => {
    const fetchPage = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 20 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('reload triggers a fresh fetch without changing page or search', async () => {
    const fetchPage = makeFetchPage(5);
    const { result } = renderHook(() => usePaginatedList({ fetchPage, pageSize: 20 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.reload());
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(result.current.page).toBe(1);
  });
});
