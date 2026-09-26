// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsAdminPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    locations: {
      getAll: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const getAllMock = api.locations.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(cantons: string[], page = 1, totalPages = 1) {
  return {
    data: cantons.map((canton, i) => ({ id: i + 1, canton, parroquia: `Parroquia ${i + 1}` })),
    meta: { total: cantons.length, page, limit: 20, totalPages },
  };
}

describe('LocationsAdminPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse(['Quito']));
  });

  it('renders rows returned by the server', async () => {
    render(<LocationsAdminPage />);

    await waitFor(() => expect(screen.getAllByText('Quito').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<LocationsAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Quito').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por cantón o parroquia/i), 'quito');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'quito' })), {
      timeout: 1000,
    });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Quito'], 1, 2));
    const user = userEvent.setup();
    render(<LocationsAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Quito').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });
});
