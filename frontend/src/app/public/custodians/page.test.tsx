// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicCustodiansPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    public: {
      custodians: {
        getAll: vi.fn(),
      },
    },
  },
}));

const getAllMock = api.public.custodians.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(custodians: Array<{ id: number; fullName: string; unit?: string }>, page = 1, totalPages = 1) {
  return {
    data: custodians,
    meta: { total: custodians.length, page, limit: 20, totalPages },
  };
}

describe('PublicCustodiansPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse([{ id: 1, fullName: 'Ana Torres', unit: 'Oficina Central' }]));
  });

  it('renders rows returned by the server', async () => {
    render(<PublicCustodiansPage />);

    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('has no identifier column or text', async () => {
    render(<PublicCustodiansPage />);

    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));
    expect(screen.queryByText(/identificador/i)).toBeNull();
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<PublicCustodiansPage />);
    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'ana');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'ana' })), {
      timeout: 1000,
    });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse([{ id: 1, fullName: 'Ana Torres' }], 1, 2));
    const user = userEvent.setup();
    render(<PublicCustodiansPage />);
    await waitFor(() => expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });

  it('applies the gov-theme scope and renders the government header', () => {
    const { container } = render(<PublicCustodiansPage />);
    expect((container.firstElementChild as HTMLElement).classList.contains('gov-theme')).toBe(true);
    expect(screen.getByAltText('Gobierno del Ecuador')).toBeDefined();
  });

  it('shows the institution line once, in the header', () => {
    render(<PublicCustodiansPage />);
    expect(screen.getAllByText(/Gobernación/)).toHaveLength(1);
  });

  it('keeps the title block with a back link to the landing page', () => {
    render(<PublicCustodiansPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Parque Informático');
    expect(screen.getByText('Custodios registrados')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Volver' }).getAttribute('href')).toBe('/');
  });

  it('does not nest a main landmark (the root layout provides it)', async () => {
    const { container } = render(<PublicCustodiansPage />);
    await waitFor(() => expect(getAllMock).toHaveBeenCalled());
    expect(container.querySelector('main')).toBeNull();
  });
});
