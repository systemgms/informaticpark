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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { UserList } from './user-list';

export default function UsersAdminPage() {
  // The backend users endpoint does not support `search`, so this page only paginates
  // and strips the (unused) search field before calling the API.
  const fetchUsers = useCallback(
    ({ page, limit }: { page: number; limit: number }) => api.users.getAll({ page, limit }),
    [],
  );

  const {
    items: users,
    meta,
    page,
    setPage,
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
        <Link href="/admin/users/new" className="w-full sm:w-auto">
          <Button className="w-full cursor-pointer sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </Link>
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
