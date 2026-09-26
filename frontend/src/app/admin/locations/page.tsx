'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LocationList } from './location-list';

export default function LocationsAdminPage() {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

  const fetchLocations = useCallback(
    (params: { page: number; limit: number; search: string }) => api.locations.getAll(params),
    [],
  );

  const {
    items: locations,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    reload,
  } = usePaginatedList<Location>({ fetchPage: fetchLocations });

  function handleDeleteClick(id: number) {
    setLocationToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (locationToDelete === null) return;
    const isLastItemOnPage = locations.length === 1 && page > 1;
    try {
      await api.locations.delete(locationToDelete);
      if (isLastItemOnPage) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ubicaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cantones y parroquias del parque informático.</p>
        </div>
        <Link href="/admin/locations/new" className="w-full sm:w-auto">
          <Button className="w-full cursor-pointer sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Ubicación
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por cantón o parroquia..." />
        {!isLoading && meta && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      <LocationList
        locations={locations}
        isLoading={isLoading}
        error={error}
        hasSearch={search.length > 0}
        onDeleteClick={handleDeleteClick}
      />

      {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar ubicación"
        description="¿Estás seguro de que deseas eliminar esta ubicación? Los activos y custodios vinculados quedarán sin ubicación."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
