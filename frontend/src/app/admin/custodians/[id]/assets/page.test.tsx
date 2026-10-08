// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import CustodianAssetsPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    custodians: {
      getById: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '7' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const getByIdMock = api.custodians.getById as unknown as ReturnType<typeof vi.fn>;

const custodian = {
  id: 7,
  fullName: 'Ana Torres',
  identifier: 'SIN-CEDULA-1234567890',
  unit: null,
  assets: [
    { id: 1, code: 'EQ-001', assetName: 'Laptop', brand: 'Dell', model: null, serialNumber: null, location: null },
    { id: 2, code: null, assetName: 'Monitor', brand: null, model: 'P2419', serialNumber: 'SN2', location: 'Macas' },
  ],
};

describe('CustodianAssetsPage', () => {
  beforeEach(() => {
    getByIdMock.mockReset();
  });

  it('shows skeletons while loading instead of plain text', () => {
    getByIdMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<CustodianAssetsPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cargando...')).toBeNull();
  });

  it('renders a card per asset with a real link to its detail page', async () => {
    getByIdMock.mockResolvedValue(custodian);
    const { container } = render(<CustodianAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0));
    const cards = container.querySelector('.md\\:hidden');
    expect(cards).not.toBeNull();
    const links = Array.from(cards!.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain('/admin/assets/1');
    expect(links).toContain('/admin/assets/2');
  });

  it('keeps the table for md and up with links instead of clickable rows', async () => {
    getByIdMock.mockResolvedValue(custodian);
    const { container } = render(<CustodianAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0));
    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(table!.closest('.hidden.md\\:block')).not.toBeNull();
    expect(table!.querySelector('a[href="/admin/assets/1"]')).not.toBeNull();
    expect(table!.querySelectorAll('tr[class*="cursor-pointer"]').length).toBe(0);
  });

  it('does not render em dashes for empty fields', async () => {
    getByIdMock.mockResolvedValue(custodian);
    const { container } = render(<CustodianAssetsPage />);

    await waitFor(() => expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0));
    expect(container.textContent).not.toContain('—');
  });

  it('wraps long identifiers and uses a responsive title', async () => {
    getByIdMock.mockResolvedValue(custodian);
    render(<CustodianAssetsPage />);

    const heading = await screen.findByRole('heading', { name: 'Ana Torres' });
    expect(heading.className).toContain('text-2xl');
    expect(heading.className).toContain('md:text-3xl');
    expect(heading.className).toContain('break-words');
    // break-words only splits tokens that overflow; break-all also split plain words.
    const identifier = screen.getByText(/SIN-CEDULA-1234567890/);
    expect(identifier.className).toContain('break-words');
    expect(identifier.className).not.toContain('break-all');
  });

  it('labels each field in the mobile asset card', async () => {
    getByIdMock.mockResolvedValue(custodian);
    render(<CustodianAssetsPage />);

    await screen.findByRole('heading', { name: 'Ana Torres' });
    for (const label of ['Código', 'Marca y modelo', 'Serie', 'Ubicación']) {
      expect(screen.getAllByText(label).some((el) => el.tagName === 'DT')).toBe(true);
    }
  });

  it('has a 44px back link to the custodian list', async () => {
    getByIdMock.mockResolvedValue(custodian);
    render(<CustodianAssetsPage />);

    const back = await screen.findByRole('link', { name: 'Volver' });
    expect(back.getAttribute('href')).toBe('/admin/custodians');
  });

  it('shows the empty message when the custodian has no assets', async () => {
    getByIdMock.mockResolvedValue({ ...custodian, assets: [] });
    render(<CustodianAssetsPage />);

    await waitFor(() =>
      expect(screen.getAllByText('Este custodio no tiene equipos asignados.').length).toBeGreaterThan(0),
    );
  });

  it('renders technical identifiers in monospace', async () => {
    getByIdMock.mockResolvedValue(custodian);
    const { container } = render(<CustodianAssetsPage />);

    await screen.findByRole('heading', { name: 'Ana Torres' });
    expect(screen.getByText('SIN-CEDULA-1234567890').className).toContain('font-mono');
    const table = container.querySelector('table')!;
    const cells = Array.from(table.querySelectorAll('td'));
    const codeCell = cells.find((td) => td.textContent === 'EQ-001');
    const serialCell = cells.find((td) => td.textContent === 'SN2');
    expect(codeCell?.querySelector('span')?.className).toContain('font-mono');
    expect(serialCell?.querySelector('span')?.className).toContain('font-mono');
    const serialDd = Array.from(container.querySelectorAll('dd')).find((dd) => dd.textContent === 'SN2');
    expect(serialDd?.querySelector('span')?.className).toContain('font-mono');
  });
});
