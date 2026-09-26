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

// The real toast is memoized; a fresh fn per render would re-trigger effects that depend on it.
const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const getAllMock = api.users.getAll as unknown as ReturnType<typeof vi.fn>;
const deleteMock = api.users.delete as unknown as ReturnType<typeof vi.fn>;

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
    deleteMock.mockReset();
    toastMock.mockReset();
    getAllMock.mockResolvedValue(makeResponse(['Carlos Pérez']));
  });

  it('renders rows returned by the server', async () => {
    render(<UsersAdminPage />);

    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));
    expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' });
  });

  it('calls the API with the next page when paging', async () => {
    getAllMock.mockResolvedValue(makeResponse(['Carlos Pérez'], 1, 2));
    const user = userEvent.setup();
    render(<UsersAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith({ page: 2, limit: 20, search: '' }));
  });

  it('calls the API with the search term when searching', async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/buscar por nombre o email/i), 'ana');

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'ana' })), {
      timeout: 1000,
    });
  });

  it('renders "Nuevo Usuario" as a single anchor without a nested button', async () => {
    render(<UsersAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));

    const link = screen.getByRole('link', { name: /nuevo usuario/i });
    expect(link.tagName).toBe('A');
    expect(link.querySelector('button')).toBeNull();
  });

  it('shows an error toast when the delete request is rejected', async () => {
    deleteMock.mockRejectedValue(new Error('No tienes permisos para eliminar este usuario'));
    const user = userEvent.setup();
    render(<UsersAdminPage />);
    await waitFor(() => expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThan(0));

    await user.click(screen.getAllByRole('button', { name: 'Eliminar usuario' })[0]);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith('No tienes permisos para eliminar este usuario', 'error'),
    );
    expect(getAllMock).toHaveBeenCalledTimes(1);
  });
});
