import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CustodianOption } from '@/lib/types';

interface UseCustodianDestinationOptionsResult {
  custodians: CustodianOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads the minimal custodian list ({id, fullName}) available to any
 * authenticated user, for use as a transfer-destination selector.
 */
export function useCustodianDestinationOptions(): UseCustodianDestinationOptionsResult {
  const [custodians, setCustodians] = useState<CustodianOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    api.custodians
      .getOptions()
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
