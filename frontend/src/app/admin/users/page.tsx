'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { UserList } from './user-list';

export default function UsersAdminPage() {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

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

  function handleDeleteClick(id: number) {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (userToDelete === null) return;
    const isLastItemOnPage = users.length === 1 && page > 1;
    try {
      await api.users.delete(userToDelete);
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

      <UserList users={users} isLoading={isLoading} error={error} onDeleteClick={handleDeleteClick} />

      {meta && <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar usuario"
        description="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
