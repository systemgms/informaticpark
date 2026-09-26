import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fetchAllPages } from '@/lib/pagination';
import { Custodian } from '@/lib/types';

interface UseCustodianOptionsResult {
  custodians: Custodian[];
  isLoading: boolean;
  error: string | null;
}

const OPTION_PAGE_SIZE = 100;

/**
 * Loads every custodian for use in a selector, not just the first page.
 */
export function useCustodianOptions(): UseCustodianOptionsResult {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchAllPages<Custodian>((page, limit) => api.custodians.getAll({ page, limit }), OPTION_PAGE_SIZE)
      .then((items) => {
        if (!isCancelled) setCustodians(items);
      })
      .catch((err: unknown) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Error al cargar custodios.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return { custodians, isLoading, error };
}
