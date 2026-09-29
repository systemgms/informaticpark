// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicAssetsPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    public: {
      assets: {
        getAll: vi.fn(),
      },
    },
  },
}));

const getAllMock = api.public.assets.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(
  assets: Array<{
    id: number;
    assetName: string;
    code?: string;
    geoLocation?: { canton: string; parroquia: string } | null;
  }>,
  page = 1,
  totalPages = 1,
) {
  return {
    data: assets,
    meta: { total: assets.length, page, limit: 20, totalPages },
  };
}

describe('PublicAssetsPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(
      makeResponse([
        { id: 1, assetName: 'Laptop Dell', code: 'A1', geoLocation: { canton: 'Cuenca', parroquia: 'Baños' } },
      ]),
    );
  });

  it('renders rows returned by the server', async () => {
    render(<PublicAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
    expect(screen.getAllByText(/Cuenca/).length).toBeGreaterThan(0);
  });

  it('has no custodian column or text', async () => {
    render(<PublicAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));
    expect(screen.queryByText(/custodio/i)).toBeNull();
  });

  it('has no asset value column or text', async () => {
    render(<PublicAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));
    expect(screen.queryByText(/valor/i)).toBeNull();
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<PublicAssetsPage />);
    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'dell');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'dell' })), {
      timeout: 1000,
    });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse([{ id: 1, assetName: 'Laptop Dell' }], 1, 2));
    const user = userEvent.setup();
    render(<PublicAssetsPage />);
    await waitFor(() => expect(screen.getAllByText('Laptop Dell').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });
});
