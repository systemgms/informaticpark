// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { CustodianForm } from './custodian-form';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    custodians: { getById: vi.fn(), update: vi.fn(), create: vi.fn() },
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

const getByIdMock = api.custodians.getById as unknown as ReturnType<typeof vi.fn>;

describe('CustodianForm in edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error toast when the custodian fails to load', async () => {
    getByIdMock.mockRejectedValue(new Error('Custodio no encontrado'));

    render(<CustodianForm custodianId={7} />);

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith('Custodio no encontrado', 'error'));
  });
});
