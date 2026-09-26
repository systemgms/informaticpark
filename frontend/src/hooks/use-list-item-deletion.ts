'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface UseListItemDeletionOptions<T> {
  /** Current items shown on the page, used to detect deleting the last row of a page. */
  items: T[];
  page: number;
  setPage: (page: number) => void;
  reload: () => void;
  deleteItem: (id: number) => Promise<void>;
  /** Spanish success toast text, e.g. 'Usuario eliminado'. */
  successMessage: string;
  /** Spanish fallback toast text used when the failure carries no message. */
  errorMessage: string;
}

interface UseListItemDeletionResult {
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  requestDelete: (id: number) => void;
  confirmDelete: () => Promise<void>;
}

export function useListItemDeletion<T>({
  items,
  page,
  setPage,
  reload,
  deleteItem,
  successMessage,
  errorMessage,
}: UseListItemDeletionOptions<T>): UseListItemDeletionResult {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const requestDelete = useCallback((id: number) => {
    setIdToDelete(id);
    setDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (idToDelete === null) return;
    const isLastItemOnPage = items.length === 1 && page > 1;

    try {
      await deleteItem(idToDelete);
      toast(successMessage, 'success');
      if (isLastItemOnPage) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : errorMessage;
      toast(message, 'error');
    } finally {
      setDialogOpen(false);
      setIdToDelete(null);
    }
  }, [idToDelete, items.length, page, deleteItem, successMessage, errorMessage, toast, setPage, reload]);

  return { isDialogOpen, setDialogOpen, requestDelete, confirmDelete };
}
