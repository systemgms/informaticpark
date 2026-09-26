// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLocationOptions } from './use-location-options';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    locations: {
      getAllUnpaginated: vi.fn(),
    },
  },
}));

const getAllUnpaginatedMock = api.locations.getAllUnpaginated as unknown as ReturnType<typeof vi.fn>;

describe('useLocationOptions', () => {
  beforeEach(() => {
    getAllUnpaginatedMock.mockReset();
  });

  it('loads the full unpaginated location list', async () => {
    getAllUnpaginatedMock.mockResolvedValue([
      { id: 1, canton: 'Morona', parroquia: 'Macas' },
      { id: 2, canton: 'Sucúa', parroquia: 'Sucúa' },
    ]);

    const { result } = renderHook(() => useLocationOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.locations).toHaveLength(2);
    expect(getAllUnpaginatedMock).toHaveBeenCalledTimes(1);
  });

  it('appends a location added via addLocation', async () => {
    getAllUnpaginatedMock.mockResolvedValue([]);
    const { result } = renderHook(() => useLocationOptions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.addLocation({
        id: 9,
        canton: 'Palora',
        parroquia: 'Palora',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    expect(result.current.locations).toHaveLength(1);
  });

  it('surfaces a load error', async () => {
    getAllUnpaginatedMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useLocationOptions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('boom');
  });
});
