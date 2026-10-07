import { fetchAllPages } from './pagination';
import { PaginatedResponse } from './api';

describe('fetchAllPages', () => {
  it('loops through every page until totalPages is reached', async () => {
    const fetchPage = vi
      .fn<(page: number, limit: number) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValueOnce({ data: [1, 2], meta: { total: 5, page: 1, limit: 2, totalPages: 3 } })
      .mockResolvedValueOnce({ data: [3, 4], meta: { total: 5, page: 2, limit: 2, totalPages: 3 } })
      .mockResolvedValueOnce({ data: [5], meta: { total: 5, page: 3, limit: 2, totalPages: 3 } });

    const result = await fetchAllPages(fetchPage, 2);

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 3, 2);
  });

  it('returns an empty array and stops after one call for an empty dataset', async () => {
    const fetchPage = vi
      .fn<(page: number, limit: number) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } });

    const result = await fetchAllPages(fetchPage);

    expect(result).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('defaults the page size to 100', async () => {
    const fetchPage = vi
      .fn<(page: number, limit: number) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValue({ data: [1], meta: { total: 1, page: 1, limit: 100, totalPages: 1 } });

    await fetchAllPages(fetchPage);

    expect(fetchPage).toHaveBeenCalledWith(1, 100);
  });

  it('stops after a single page when everything fits', async () => {
    const fetchPage = vi
      .fn<(page: number, limit: number) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValue({ data: [1, 2, 3], meta: { total: 3, page: 1, limit: 100, totalPages: 1 } });

    const result = await fetchAllPages(fetchPage);

    expect(result).toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('requests pages 2..N concurrently once page 1 has resolved', async () => {
    const resolvers = new Map<number, (r: PaginatedResponse<number>) => void>();
    const fetchPage = vi.fn((page: number, limit: number) => {
      if (page === 1) {
        return Promise.resolve({ data: [1], meta: { total: 3, page, limit, totalPages: 3 } });
      }
      return new Promise<PaginatedResponse<number>>((resolve) => resolvers.set(page, resolve));
    });

    const promise = fetchAllPages(fetchPage, 1);
    await vi.waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(3));
    // Both remaining pages are in flight before either has resolved.
    expect(resolvers.size).toBe(2);

    resolvers.get(2)!({ data: [2], meta: { total: 3, page: 2, limit: 1, totalPages: 3 } });
    resolvers.get(3)!({ data: [3], meta: { total: 3, page: 3, limit: 1, totalPages: 3 } });
    expect(await promise).toEqual([1, 2, 3]);
  });

  it('keeps page order even when later pages resolve first', async () => {
    const resolvers = new Map<number, (r: PaginatedResponse<number>) => void>();
    const fetchPage = vi.fn((page: number, limit: number) => {
      if (page === 1) {
        return Promise.resolve({ data: [1], meta: { total: 3, page, limit, totalPages: 3 } });
      }
      return new Promise<PaginatedResponse<number>>((resolve) => resolvers.set(page, resolve));
    });

    const promise = fetchAllPages(fetchPage, 1);
    await vi.waitFor(() => expect(resolvers.size).toBe(2));
    resolvers.get(3)!({ data: [3], meta: { total: 3, page: 3, limit: 1, totalPages: 3 } });
    resolvers.get(2)!({ data: [2], meta: { total: 3, page: 2, limit: 1, totalPages: 3 } });

    expect(await promise).toEqual([1, 2, 3]);
  });

  it('rejects when any page fails', async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => {
      if (page === 3) throw new Error('boom');
      return { data: [page], meta: { total: 3, page, limit, totalPages: 3 } };
    });

    await expect(fetchAllPages(fetchPage, 1)).rejects.toThrow('boom');
  });
});
