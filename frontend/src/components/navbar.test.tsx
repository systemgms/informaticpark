// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

const authMock = vi.fn();
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => authMock(),
}));

vi.mock('@/components/brand-provider', () => ({
  useBrand: () => ({ brand: { appName: 'Infopark', logoUrl: null } }),
}));

let currentPathname = '/admin/assets';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => currentPathname,
}));

function setUser(role: 'ADMIN' | 'USER') {
  authMock.mockReturnValue({ user: { id: 1, name: 'Ana', role }, logout: vi.fn() });
}

describe('Navbar mobile menu', () => {
  beforeEach(() => {
    authMock.mockReset();
    currentPathname = '/admin/assets';
  });

  it('renders a collapsed toggle with an accessible name and controls', () => {
    setUser('ADMIN');
    render(<Navbar />);

    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
  });

  it('opens the panel with the admin links and flips the toggle state', () => {
    setUser('ADMIN');
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const toggle = screen.getByRole('button', { name: 'Cerrar menú' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const panel = screen.getByRole('navigation', { name: 'Menú principal' });
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    const labels = Array.from(panel.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toContain('Traspasar');
    expect(labels).toContain('Marca');
  });

  it('shows only Activos for the USER role', () => {
    setUser('USER');
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const panel = screen.getByRole('navigation', { name: 'Menú principal' });
    const labels = Array.from(panel.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['Activos']);
  });

  it('marks only the best matching route with aria-current="page"', () => {
    setUser('ADMIN');
    currentPathname = '/admin/assets/traspasar';
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const panel = screen.getByRole('navigation', { name: 'Menú principal' });
    const current = Array.from(panel.querySelectorAll('a[aria-current="page"]'));
    expect(current.map((a) => a.textContent)).toEqual(['Traspasar']);
  });

  it('closes the menu when a link is clicked', () => {
    setUser('ADMIN');
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const panel = screen.getByRole('navigation', { name: 'Menú principal' });
    const link = Array.from(panel.querySelectorAll('a')).find((a) => a.textContent === 'Marca');
    expect(link).toBeTruthy();
    fireEvent.click(link as HTMLAnchorElement);

    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeTruthy();
  });

  it('closes on Escape and returns focus to the toggle', () => {
    setUser('ADMIN');
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('closes on outside click', () => {
    setUser('ADMIN');
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
  });
});

describe('Navbar accessible names', () => {
  beforeEach(() => {
    authMock.mockReset();
    currentPathname = '/dashboard';
  });

  it('names the logout button "Cerrar sesión"', () => {
    setUser('ADMIN');
    render(<Navbar />);

    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
  });

  it('gives the logo link the app name as an explicit label', () => {
    setUser('ADMIN');
    render(<Navbar />);

    const logo = screen.getByRole('link', { name: 'Infopark' });
    expect(logo.getAttribute('href')).toBe('/dashboard');
    expect(logo.getAttribute('aria-label')).toBe('Infopark');
  });
});
