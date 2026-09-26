// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { useCustodianOptions } from './use-custodian-options';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    custodians: {
      getAll: vi.fn(),
    },
  },
}));

const getAllMock = api.custodians.getAll as unknown as ReturnType<typeof vi.fn>;

function makePage(ids: number[], page: number, totalPages: number) {
  return {
    data: ids.map((id) => ({ id, fullName: `Custodio ${id}`, identifier: `C${id}` })),
    meta: { total: totalPages * ids.length, page, limit: ids.length, totalPages },
  };
}

describe('useCustodianOptions', () => {
  beforeEach(() => {
    getAllMock.mockReset();
  });

  it('loads every page of custodians, not just the first', async () => {
    getAllMock.mockResolvedValueOnce(makePage([1, 2], 1, 2)).mockResolvedValueOnce(makePage([3, 4], 2, 2));

    const { result } = renderHook(() => useCustodianOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.custodians).toHaveLength(4);
    expect(getAllMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces a load error', async () => {
    getAllMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCustodianOptions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('boom');
  });
});
