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
});
