'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Custodian } from '@/lib/types';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useListItemDeletion } from '@/hooks/use-list-item-deletion';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CustodianList } from './custodian-list';

export default function CustodiansAdminPage() {
  const fetchCustodians = useCallback(
    (params: { page: number; limit: number; search: string }) => api.custodians.getAll(params),
    [],
  );

  const {
    items: custodians,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    reload,
  } = usePaginatedList<Custodian>({ fetchPage: fetchCustodians });

  const { isDialogOpen, setDialogOpen, requestDelete, confirmDelete } = useListItemDeletion({
    items: custodians,
    page,
    setPage,
    reload,
    deleteItem: api.custodians.delete,
    successMessage: 'Custodio eliminado',
    errorMessage: 'No se pudo eliminar el custodio',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Custodios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Responsables de los activos asignados.</p>
        </div>
        <Button asChild className="w-full cursor-pointer sm:w-auto">
          <Link href="/admin/custodians/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo custodio
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o identificador..." />
        {!isLoading && meta && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      <CustodianList
        custodians={custodians}
        isLoading={isLoading}
        error={error}
        hasSearch={search.length > 0}
        onDeleteClick={requestDelete}
      />

      {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar custodio"
        description="¿Estás seguro de que deseas eliminar este custodio? Los activos y traspasos vinculados podrían verse afectados."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
