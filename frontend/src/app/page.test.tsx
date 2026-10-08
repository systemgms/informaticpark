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

  it('applies the gov-theme scope to the page wrapper', () => {
    const { container } = render(<LandingPage />);
    expect((container.firstElementChild as HTMLElement).classList.contains('gov-theme')).toBe(true);
  });

  it('renders the government header', () => {
    render(<LandingPage />);
    expect(screen.getByText('Gobernación de la Provincia de Morona Santiago')).toBeDefined();
    const logos = screen.getAllByAltText('Gobierno del Ecuador');
    expect(logos[0].getAttribute('src')).toBe('/brand/gobierno-ecuador-white.svg');
  });

  it('shows the navy logo and institution name in the footer', () => {
    const { container } = render(<LandingPage />);
    const footer = container.querySelector('footer') as HTMLElement;
    const logo = footer.querySelector('img') as HTMLImageElement;
    expect(logo.getAttribute('src')).toBe('/brand/gobierno-ecuador-navy.svg');
    expect(footer.textContent).toContain('Gobernación Provincial de Morona Santiago');
  });

  it('keeps the app name as the hero heading', () => {
    brandMock.mockReturnValue({ brand: { appName: 'Inventario GPMS', logoUrl: null } });
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Inventario GPMS');
  });

  it('shows the brand logo in the hero when one is set', () => {
    brandMock.mockReturnValue({ brand: { appName: 'X', logoUrl: '/logo.png' } });
    render(<LandingPage />);
    expect(screen.getByAltText('Logotipo de la aplicación').getAttribute('src')).toBe('/logo.png');
  });

  it('contains no em dash', () => {
    const { container } = render(<LandingPage />);
    expect(container.textContent).not.toContain('\u2014');
  });

  it('does not nest a main landmark (the root layout provides it)', () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector('main')).toBeNull();
  });
});
