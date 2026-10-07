// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from './auth-guard';

const authMock = vi.fn();
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => authMock(),
}));

const pushMock = vi.fn();
let currentPathname = '/';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    pushMock.mockReset();
    authMock.mockReset();
  });

  it('renders the landing page for an anonymous visitor without redirecting', async () => {
    currentPathname = '/';
    authMock.mockReturnValue({ user: null, isLoading: false });

    render(
      <AuthGuard>
        <div data-testid="landing">Landing</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('landing')).toBeDefined();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });

  it('redirects an anonymous visitor away from the dashboard to /login', async () => {
    currentPathname = '/dashboard';
    authMock.mockReturnValue({ user: null, isLoading: false });

    render(
      <AuthGuard>
        <div data-testid="dashboard">Dashboard</div>
      </AuthGuard>,
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
  });

  it('renders the dashboard for a logged-in user', () => {
    currentPathname = '/dashboard';
    authMock.mockReturnValue({ user: { id: 1, role: 'USER' }, isLoading: false });

    render(
      <AuthGuard>
        <div data-testid="dashboard">Dashboard</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('dashboard')).toBeDefined();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('renders a public path immediately while auth is loading', () => {
    currentPathname = '/login';
    authMock.mockReturnValue({ user: null, isLoading: true });

    render(
      <AuthGuard>
        <div data-testid="login">Login</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('login')).toBeDefined();
  });

  it('does not render private content or redirect while auth is loading', () => {
    currentPathname = '/dashboard';
    authMock.mockReturnValue({ user: null, isLoading: true });

    render(
      <AuthGuard>
        <div data-testid="dashboard">Dashboard</div>
      </AuthGuard>,
    );

    expect(screen.queryByTestId('dashboard')).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('sends a non-admin user away from admin-only paths', async () => {
    currentPathname = '/admin/users';
    authMock.mockReturnValue({ user: { id: 1, role: 'USER' }, isLoading: false });

    render(
      <AuthGuard>
        <div>Users</div>
      </AuthGuard>,
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/assets'));
  });

  it('lets an admin stay on admin-only paths', () => {
    currentPathname = '/admin/users';
    authMock.mockReturnValue({ user: { id: 1, role: 'ADMIN' }, isLoading: false });

    render(
      <AuthGuard>
        <div data-testid="users">Users</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('users')).toBeDefined();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
