// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import LandingPage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    public: {
      assets: { getAll: vi.fn() },
      custodians: { getAll: vi.fn() },
    },
  },
}));

const authMock = vi.fn();
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => authMock(),
}));

const brandMock = vi.fn();
vi.mock('@/components/brand-provider', () => ({
  useBrand: () => brandMock(),
}));

function metaResponse(total: number) {
  return { data: [], meta: { total, page: 1, limit: 1, totalPages: total } };
}

describe('LandingPage', () => {
  beforeEach(() => {
    authMock.mockReset().mockReturnValue({ user: null });
    brandMock.mockReset().mockReturnValue({ brand: null });
    vi.mocked(api.public.assets.getAll).mockReset().mockResolvedValue(metaResponse(42));
    vi.mocked(api.public.custodians.getAll).mockReset().mockResolvedValue(metaResponse(8));
  });

  it('renders the institution name', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Gobernación Provincial de Morona Santiago/).length).toBeGreaterThan(0);
  });

  it('shows "Iniciar sesión" linking to /login for an anonymous visitor', () => {
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Iniciar sesión/i });
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('shows "Ir al panel" linking to /dashboard for a logged-in user', () => {
    authMock.mockReturnValue({ user: { id: 1, role: 'ADMIN' } });
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Ir al panel/i });
    expect(link.getAttribute('href')).toBe('/dashboard');
  });

  it('links the inventory CTA to /public/assets', () => {
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Consultar inventario/i });
    expect(link.getAttribute('href')).toBe('/public/assets');
  });

  it('renders the asset and custodian counts once the API resolves', async () => {
    render(<LandingPage />);
    await waitFor(() => expect(screen.getByText(/42/)).toBeDefined());
    expect(screen.getByText(/8/)).toBeDefined();
  });

  it('uses the singular label for a single record', async () => {
    vi.mocked(api.public.assets.getAll).mockReset().mockResolvedValue(metaResponse(1));

    render(<LandingPage />);

    await waitFor(() => expect(screen.getByText('1 registrado')).toBeDefined());
    expect(screen.getByText('8 registrados')).toBeDefined();
  });

  it('renders without counts when the API rejects', async () => {
    vi.mocked(api.public.assets.getAll).mockReset().mockRejectedValue(new Error('down'));
    vi.mocked(api.public.custodians.getAll).mockReset().mockRejectedValue(new Error('down'));

    render(<LandingPage />);

    await waitFor(() => expect(api.public.assets.getAll).toHaveBeenCalled());
    expect(screen.queryByText(/42/)).toBeNull();
    expect(screen.queryByText(/8/)).toBeNull();
  });
});
