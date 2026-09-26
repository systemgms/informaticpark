// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useListItemDeletion } from './use-list-item-deletion';

const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

interface Item {
  id: number;
}

describe('useListItemDeletion', () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  it('deletes the item, shows a success toast, and reloads the list', async () => {
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    const setPage = vi.fn();
    const reload = vi.fn();
    const items: Item[] = [{ id: 1 }, { id: 2 }];

    const { result } = renderHook(() =>
      useListItemDeletion({
        items,
        page: 1,
        setPage,
        reload,
        deleteItem,
        successMessage: 'Usuario eliminado',
        errorMessage: 'No se pudo eliminar el usuario',
      }),
    );

    act(() => result.current.requestDelete(2));
    expect(result.current.isDialogOpen).toBe(true);

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteItem).toHaveBeenCalledWith(2);
    expect(toastMock).toHaveBeenCalledWith('Usuario eliminado', 'success');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(setPage).not.toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
  });

  it('steps back a page when the deleted item was the last one on a page beyond the first', async () => {
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    const setPage = vi.fn();
    const reload = vi.fn();
    const items: Item[] = [{ id: 5 }];

    const { result } = renderHook(() =>
      useListItemDeletion({
        items,
        page: 3,
        setPage,
        reload,
        deleteItem,
        successMessage: 'Custodio eliminado',
        errorMessage: 'No se pudo eliminar el custodio',
      }),
    );

    act(() => result.current.requestDelete(5));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(setPage).toHaveBeenCalledWith(2);
    expect(reload).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith('Custodio eliminado', 'success');
  });

  it('shows the API error message and leaves the list untouched on failure', async () => {
    const deleteItem = vi.fn().mockRejectedValue(new Error('El custodio tiene activos asignados'));
    const setPage = vi.fn();
    const reload = vi.fn();
    const items: Item[] = [{ id: 1 }];

    const { result } = renderHook(() =>
      useListItemDeletion({
        items,
        page: 1,
        setPage,
        reload,
        deleteItem,
        successMessage: 'Custodio eliminado',
        errorMessage: 'No se pudo eliminar el custodio',
      }),
    );

    act(() => result.current.requestDelete(1));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastMock).toHaveBeenCalledWith('El custodio tiene activos asignados', 'error');
    expect(reload).not.toHaveBeenCalled();
    expect(setPage).not.toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
  });

  it('falls back to the caller-provided Spanish message when the failure has no message', async () => {
    const deleteItem = vi.fn().mockRejectedValue('network exploded');
    const setPage = vi.fn();
    const reload = vi.fn();
    const items: Item[] = [{ id: 1 }];

    const { result } = renderHook(() =>
      useListItemDeletion({
        items,
        page: 1,
        setPage,
        reload,
        deleteItem,
        successMessage: 'Ubicación eliminada',
        errorMessage: 'No se pudo eliminar la ubicación',
      }),
    );

    act(() => result.current.requestDelete(1));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastMock).toHaveBeenCalledWith('No se pudo eliminar la ubicación', 'error');
  });
});
