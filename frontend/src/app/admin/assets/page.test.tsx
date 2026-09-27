// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetsAdminPage from './page';
import { api } from '@/lib/api';
import { Role, AssetCondition } from '@/lib/types';

// Radix Select relies on APIs jsdom doesn't implement.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      getAll: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: { id: 1, role: Role.ADMIN, custodianId: null } }),
}));

const getAllMock = api.assets.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(names: string[], page = 1, totalPages = 1) {
  return {
    data: names.map((name, i) => ({ id: i + 1, assetName: name, code: `A${i + 1}` })),
    meta: { total: names.length, page, limit: 20, totalPages },
  };
}

describe('AssetsAdminPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse(['Laptop Dell']));
  });

  it('renders rows returned by the server', async () => {
    render(<AssetsAdminPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<AssetsAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'dell');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'dell' })), {
      timeout: 1000,
    });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Laptop Dell'], 1, 2));
    const user = userEvent.setup();
    render(<AssetsAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });

  it('calls the API with the selected condition and resets to page 1', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Laptop Dell'], 1, 2));
    const user = userEvent.setup();
    render(<AssetsAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));
    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));

    await user.click(screen.getByLabelText(/condición/i));
    await user.click(await screen.findByRole('option', { name: 'Malo' }));

    await waitFor(() =>
      expect(getAllMock).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: '',
        condition: AssetCondition.MALO,
      }),
    );
  });
});
