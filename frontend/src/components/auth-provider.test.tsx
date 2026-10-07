// @vitest-environment jsdom
import { act, render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-provider';
import { ApiError } from '@/lib/api';
import { Role, User } from '@/lib/types';

const meMock = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, api: { auth: { me: () => meMock() } } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const cachedUser: User = {
  id: 1,
  name: 'Cached',
  email: 'cached@example.com',
  role: Role.ADMIN,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};
const freshUser: User = { ...cachedUser, name: 'Fresh', role: Role.USER };

let latest: { user: User | null; isLoading: boolean } = { user: null, isLoading: true };
function Probe() {
  const { user, isLoading } = useAuth();
  latest = { user, isLoading };
  return null;
}

function mount() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    meMock.mockReset();
    latest = { user: null, isLoading: true };
  });

  it('with no token finishes loading without calling /auth/me', async () => {
    mount();

    await waitFor(() => expect(latest.isLoading).toBe(false));
    expect(latest.user).toBeNull();
    expect(meMock).not.toHaveBeenCalled();
  });

  it('hydrates from a valid cached user before /auth/me resolves, then refreshes it', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(cachedUser));
    let resolveMe: (u: User) => void = () => {};
    meMock.mockReturnValue(new Promise<User>((resolve) => (resolveMe = resolve)));

    mount();

    expect(latest.isLoading).toBe(false);
    expect(latest.user?.name).toBe('Cached');
    expect(meMock).toHaveBeenCalledTimes(1);

    await act(async () => resolveMe(freshUser));

    expect(latest.user?.name).toBe('Fresh');
    expect(JSON.parse(localStorage.getItem('user') ?? '{}').name).toBe('Fresh');
  });

  it('waits for /auth/me when the cache is corrupt', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', '{broken');
    let resolveMe: (u: User) => void = () => {};
    meMock.mockReturnValue(new Promise<User>((resolve) => (resolveMe = resolve)));

    mount();

    expect(latest.isLoading).toBe(true);
    expect(latest.user).toBeNull();

    await act(async () => resolveMe(freshUser));

    expect(latest.isLoading).toBe(false);
    expect(latest.user?.name).toBe('Fresh');
  });

  it('waits for /auth/me when the cache has an invalid shape', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify({ ...cachedUser, role: 'ROOT' }));
    meMock.mockReturnValue(new Promise<User>(() => {}));

    mount();

    expect(latest.isLoading).toBe(true);
    expect(latest.user).toBeNull();
  });

  it.each([401, 403])('clears token, cache and user when /auth/me answers %i', async (status) => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(cachedUser));
    meMock.mockRejectedValue(new ApiError('no', status));

    mount();

    await waitFor(() => expect(latest.user).toBeNull());
    expect(latest.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('keeps the token and cached user when /auth/me fails with a network error', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(cachedUser));
    meMock.mockRejectedValue(new Error('No se pudo conectar con el servidor.'));

    mount();

    await waitFor(() => expect(meMock).toHaveBeenCalled());
    await act(async () => {});

    expect(latest.user?.name).toBe('Cached');
    expect(latest.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBe('t');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  it('stops loading with a null user when there is no cache and /auth/me fails with a network error', async () => {
    localStorage.setItem('token', 't');
    meMock.mockRejectedValue(new Error('timeout'));

    mount();

    await waitFor(() => expect(latest.isLoading).toBe(false));
    expect(latest.user).toBeNull();
    expect(localStorage.getItem('token')).toBe('t');
  });
});
