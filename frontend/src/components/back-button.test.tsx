// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { BackButton } from './back-button';

describe('BackButton', () => {
  it('renders a link to the given href named "Volver" by default', () => {
    render(<BackButton href="/admin/assets" />);

    const link = screen.getByRole('link', { name: 'Volver' });
    expect(link.getAttribute('href')).toBe('/admin/assets');
  });

  it('accepts a custom accessible name', () => {
    render(<BackButton href="/" aria-label="Volver al inicio" />);

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeTruthy();
  });

  it('never shrinks and keeps the 44px touch target', () => {
    render(<BackButton href="/" className="ml-2" />);

    const link = screen.getByRole('link', { name: 'Volver' });
    expect(link.classList.contains('shrink-0')).toBe(true);
    expect(link.classList.contains('size-11')).toBe(true);
    expect(link.classList.contains('ml-2')).toBe(true);
  });
});
