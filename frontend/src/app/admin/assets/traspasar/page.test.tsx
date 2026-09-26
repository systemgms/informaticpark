// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkTransferPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    assets: { getAll: vi.fn() },
    movements: { createBulk: vi.fn() },
  },
}));

vi.mock('@/hooks/use-custodian-options', () => ({
  useCustodianOptions: () => ({
    custodians: [{ id: 1, fullName: 'Ana Torres', identifier: 'C1' }],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-location-options', () => ({
  useLocationOptions: () => ({
    locations: [{ id: 1, canton: 'Morona', parroquia: 'Macas' }],
    isLoading: false,
    error: null,
    addLocation: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const getAllMock = api.assets.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(names: string[], page = 1, totalPages = 1) {
  return {
    data: names.map((name, i) => ({ id: page * 100 + i + 1, assetName: name, code: `A${page}-${i + 1}` })),
    meta: { total: names.length * totalPages, page, limit: names.length, totalPages },
  };
}

describe('BulkTransferPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
  });

  it('keeps a selected asset after changing page and shows it in the selection summary', async () => {
    getAllMock
      .mockResolvedValueOnce(makeResponse(['Laptop Dell'], 1, 2))
      .mockResolvedValueOnce(makeResponse(['Monitor LG'], 2, 2));

    const user = userEvent.setup();
    render(<BulkTransferPage />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Laptop Dell/i })).toBeDefined());
    await user.click(screen.getByRole('button', { name: /Laptop Dell/i }));

    expect(screen.getByText(/1 seleccionado/)).toBeDefined();

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
    expect(screen.getByText(/1 seleccionado/)).toBeDefined();
    expect(screen.getByText('Laptop Dell')).toBeDefined();
  });

  it('selects only the current page when using the current-page toggle', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Laptop Dell', 'Monitor LG'], 1, 1));
    const user = userEvent.setup();
    render(<BulkTransferPage />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Laptop Dell/i })).toBeDefined());
    await user.click(screen.getByRole('button', { name: /seleccionar página actual/i }));

    expect(screen.getByText(/2 seleccionado/)).toBeDefined();
  });
});
