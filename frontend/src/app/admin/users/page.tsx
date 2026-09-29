'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useListItemDeletion } from '@/hooks/use-list-item-deletion';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { ListSearchInput } from '@/components/list-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { UserList } from './user-list';

export default function UsersAdminPage() {
  const fetchUsers = useCallback(
    (params: { page: number; limit: number; search: string }) => api.users.getAll(params),
    [],
  );

  const {
    items: users,
    meta,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    reload,
  } = usePaginatedList<User>({ fetchPage: fetchUsers });

  const { isDialogOpen, setDialogOpen, requestDelete, confirmDelete } = useListItemDeletion({
    items: users,
    page,
    setPage,
    reload,
    deleteItem: api.users.delete,
    successMessage: 'Usuario eliminado',
    errorMessage: 'No se pudo eliminar el usuario',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los accesos y roles del sistema.</p>
        </div>
        <Button asChild className="w-full cursor-pointer sm:w-auto">
          <Link href="/admin/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ListSearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o correo..." />
        {!isLoading && meta && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      <UserList users={users} isLoading={isLoading} error={error} onDeleteClick={requestDelete} />

      {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar usuario"
        description="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
