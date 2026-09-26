import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';

interface UseLocationOptionsResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  addLocation: (location: Location) => void;
}

/**
 * Loads every location for use in a selector, via the unpaginated endpoint.
 * Exposes `addLocation` so callers that create a location on the fly (e.g.
 * the asset form) can keep the option list in sync without refetching.
 */
export function useLocationOptions(): UseLocationOptionsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    api.locations
      .getAllUnpaginated()
      .then((items) => {
        if (!isCancelled) setLocations(items);
      })
      .catch((err: unknown) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Error al cargar ubicaciones.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const addLocation = useCallback((location: Location) => {
    setLocations((prev) => [...prev, location]);
  }, []);

  return { locations, isLoading, error, addLocation };
}
