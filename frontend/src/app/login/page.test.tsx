// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { api } from '@/lib/api';
import LoginPage from './page';

vi.mock('@/lib/api', () => ({
  api: {
    auth: { login: vi.fn() },
  },
}));

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

vi.mock('@/components/brand-provider', () => ({
  useBrand: () => ({ brand: null }),
}));

describe('LoginPage', () => {
  it('labels the email field "Correo electrónico" in Spanish', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Correo electrónico')).toBeDefined();
  });

  it('announces a failed login as an alert', async () => {
    vi.mocked(api.auth.login).mockRejectedValueOnce(new Error('Credenciales incorrectas'));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'x' } });
    fireEvent.submit(screen.getByLabelText('Correo electrónico').closest('form')!);
    const alert = await waitFor(() => screen.getByRole('alert'));
    expect(alert.textContent).toContain('Credenciales incorrectas');
  });

  it('renders the page title semibold with tight tracking', () => {
    render(<LoginPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('font-semibold');
    expect(heading.className).toContain('tracking-tight');
    expect(heading.className).not.toContain('font-bold');
  });
});
