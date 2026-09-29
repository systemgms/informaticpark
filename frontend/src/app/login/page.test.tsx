// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
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
});
