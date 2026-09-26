// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustodiansAdminPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    custodians: {
      getAll: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const getAllMock = api.custodians.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(names: string[], page = 1, totalPages = 1) {
  return {
    data: names.map((name, i) => ({ id: i + 1, fullName: name, identifier: `ID${i + 1}` })),
    meta: { total: names.length, page, limit: 20, totalPages },
  };
}

describe('CustodiansAdminPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse(['Ana Torres']));
  });

  it('renders rows returned by the server', async () => {
    render(<CustodiansAdminPage />);

    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<CustodiansAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por nombre o identificador/i), 'ana');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'ana' })), {
      timeout: 1000,
    });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Ana Torres'], 1, 2));
    const user = userEvent.setup();
    render(<CustodiansAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });
});
