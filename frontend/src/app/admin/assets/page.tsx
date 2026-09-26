'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Asset } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useListItemDeletion } from '@/hooks/use-list-item-deletion';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AssetList } from './asset-list';

export default function AssetsAdminPage() {
  const { user } = useAuth();

  const fetchAssets = useCallback(
    (params: { page: number; limit: number; search: string }) => api.assets.getAll(params),
    [],
  );

  const {
    items: assets,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    reload,
  } = usePaginatedList<Asset>({
    fetchPage: fetchAssets,
  });

  const isAdmin = user?.role === 'ADMIN';

  const { isDialogOpen, setDialogOpen, requestDelete, confirmDelete } = useListItemDeletion({
    items: assets,
    page,
    setPage,
    reload,
    deleteItem: api.assets.delete,
    successMessage: 'Activo eliminado',
    errorMessage: 'No se pudo eliminar el activo',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control de inventario y equipos.</p>
        </div>
        {isAdmin && (
          <Link href="/admin/assets/new" className="w-full sm:w-auto">
            <Button className="w-full cursor-pointer sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Activo
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, código o marca..." />
        {!isLoading && meta && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      <AssetList
        assets={assets}
        isLoading={isLoading}
        error={error}
        isAdmin={isAdmin}
        hasSearch={search.length > 0}
        onDeleteClick={requestDelete}
      />

      {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar activo"
        description="¿Estás seguro de que deseas eliminar este activo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
