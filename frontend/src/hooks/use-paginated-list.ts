import { useCallback, useEffect, useState } from 'react';
import { PaginatedResponse } from '@/lib/api';

interface FetchPageParams {
  page: number;
  limit: number;
  search: string;
}

interface UsePaginatedListOptions<T> {
  /** Should be stable across renders (e.g. wrapped in useCallback by the caller). */
  fetchPage: (params: FetchPageParams) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
  searchDebounceMs?: number;
}

interface UsePaginatedListResult<T> {
  items: T[];
  meta: PaginatedResponse<T>['meta'] | null;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

export function usePaginatedList<T>({
  fetchPage,
  pageSize = DEFAULT_PAGE_SIZE,
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<T>['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, searchDebounceMs);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch, searchDebounceMs]);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPage({ page, limit: pageSize, search: debouncedSearch })
      .then((response) => {
        if (isCancelled) return;
        setItems(response.data);
        setMeta(response.meta);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar datos.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [fetchPage, page, pageSize, debouncedSearch, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { items, meta, page, setPage, search, setSearch, isLoading, error, reload };
}
