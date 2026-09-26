// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
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
});
