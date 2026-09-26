// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersAdminPage from './page';
import { api } from '@/lib/api';
import { Role } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      getAll: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const getAllMock = api.users.getAll as unknown as ReturnType<typeof vi.fn>;

function makeResponse(names: string[], page = 1, totalPages = 1) {
  return {
    data: names.map((name, i) => ({
      id: i + 1,
      name,
      email: `${name.toLowerCase()}@example.com`,
      role: Role.USER,
      isActive: true,
    })),
    meta: { total: names.length, page, limit: 20, totalPages },
  };
}

describe('UsersAdminPage', () => {
  beforeEach(() => {
    getAllMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse(['Carlos Pérez']));
  });

  it('renders rows returned by the server', async () => {
    render(<UsersAdminPage />);

    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Carlos Pérez'], 1, 2));
    const user = userEvent.setup();
    render(<UsersAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20 }));
  });
});
