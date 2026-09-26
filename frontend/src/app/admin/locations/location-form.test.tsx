// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { LocationForm } from './location-form';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    locations: { getById: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// The real toast is memoized; a fresh fn per render would re-trigger the form's load effect forever.
const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const getByIdMock = api.locations.getById as unknown as ReturnType<typeof vi.fn>;

describe('LocationForm in edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error toast when the location fails to load', async () => {
    getByIdMock.mockRejectedValue(new Error('Ubicación no encontrada'));

    render(<LocationForm locationId={7} />);

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith('Ubicación no encontrada', 'error'));
  });
});
