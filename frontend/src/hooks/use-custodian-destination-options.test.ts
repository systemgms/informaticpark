// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { useCustodianDestinationOptions } from './use-custodian-destination-options';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    custodians: {
      getOptions: vi.fn(),
    },
  },
}));

const getOptionsMock = api.custodians.getOptions as unknown as ReturnType<typeof vi.fn>;

describe('useCustodianDestinationOptions', () => {
  beforeEach(() => {
    getOptionsMock.mockReset();
  });

  it('loads custodian options from getOptions', async () => {
    getOptionsMock.mockResolvedValueOnce([
      { id: 1, fullName: 'Custodio Uno' },
      { id: 2, fullName: 'Custodio Dos' },
    ]);

    const { result } = renderHook(() => useCustodianDestinationOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.custodians).toEqual([
      { id: 1, fullName: 'Custodio Uno' },
      { id: 2, fullName: 'Custodio Dos' },
    ]);
    expect(getOptionsMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a load error', async () => {
    getOptionsMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCustodianDestinationOptions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('boom');
  });
});
