// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from './page';
import { api } from '@/lib/api';
import { Role } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    users: { getAll: vi.fn() },
    custodians: { getAll: vi.fn() },
    locations: { getAll: vi.fn() },
    assets: { getStats: vi.fn() },
    movements: { getPendingForMe: vi.fn() },
  },
}));

const authMock = vi.fn();
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => authMock(),
}));

function metaResponse(total: number) {
  return { data: [], meta: { total, page: 1, limit: 1, totalPages: total } };
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(api.users.getAll).mockReset().mockResolvedValue(metaResponse(7));
    vi.mocked(api.custodians.getAll).mockReset().mockResolvedValue(metaResponse(4));
    vi.mocked(api.locations.getAll).mockReset().mockResolvedValue(metaResponse(9));
    vi.mocked(api.assets.getStats).mockReset().mockResolvedValue({
      total: 123,
      totalValue: 4567.89,
      withoutCustodian: 3,
      withoutLocation: 2,
    });
    vi.mocked(api.movements.getPendingForMe).mockReset().mockResolvedValue([]);
  });

  it('renders admin stats from meta.total (limit: 1) and getStats, never the first page of assets', async () => {
    authMock.mockReturnValue({ user: { id: 1, role: Role.ADMIN, custodianId: null } });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('123')).toBeDefined());
    expect(api.users.getAll).toHaveBeenCalledWith({ limit: 1 });
    expect(api.custodians.getAll).toHaveBeenCalledWith({ limit: 1 });
    expect(api.locations.getAll).toHaveBeenCalledWith({ limit: 1 });
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('9')).toBeDefined();
    expect(screen.getByText(/activos sin custodio asignado/)).toBeDefined();
    expect(screen.getByText(/activos sin ubicación asignada/)).toBeDefined();
  });

  it('renders custodian stats from getStats for a non-admin user', async () => {
    authMock.mockReturnValue({ user: { id: 2, role: Role.USER, custodianId: 5 } });

    render(<HomePage />);

    await waitFor(() => expect(api.assets.getStats).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('123')).toBeDefined());
    expect(api.users.getAll).not.toHaveBeenCalled();
  });

  it('titles the admin heading in Spanish sentence case', async () => {
    authMock.mockReturnValue({ user: { id: 1, role: Role.ADMIN, custodianId: null } });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('123')).toBeDefined());
    expect(screen.getByRole('heading', { level: 1, name: 'Panel de administración' })).toBeDefined();
  });

  it('titles the non-admin heading in Spanish sentence case', async () => {
    authMock.mockReturnValue({ user: { id: 2, role: Role.USER, custodianId: 5 } });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('123')).toBeDefined());
    expect(screen.getByRole('heading', { level: 1, name: 'Mis activos' })).toBeDefined();
  });

  it('shows an error instead of zeroed stats when the admin stats fail to load', async () => {
    authMock.mockReturnValue({ user: { id: 1, role: Role.ADMIN, custodianId: null } });
    vi.mocked(api.assets.getStats).mockRejectedValue(new Error('No se pudo conectar con el servidor'));

    render(<HomePage />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('No se pudieron cargar las estadísticas');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor');
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('Valor total del parque')).toBeNull();
  });

  it('shows an error instead of zeroed stats when the custodian stats fail to load', async () => {
    authMock.mockReturnValue({ user: { id: 2, role: Role.USER, custodianId: 5 } });
    vi.mocked(api.assets.getStats).mockRejectedValue(new Error('boom'));

    render(<HomePage />);

    await screen.findByRole('alert');
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('Valor total')).toBeNull();
  });

  it('loads the stats again when the user retries after an error', async () => {
    const user = userEvent.setup();
    authMock.mockReturnValue({ user: { id: 1, role: Role.ADMIN, custodianId: null } });
    vi.mocked(api.assets.getStats).mockRejectedValueOnce(new Error('boom'));

    render(<HomePage />);

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.getByText('123')).toBeDefined());
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
