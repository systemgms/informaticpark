// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { GovHeader } from './gov-header';

describe('GovHeader', () => {
  it('renders the white official logo with its alt text and dimensions', () => {
    render(<GovHeader />);
    const logo = screen.getByAltText('Gobierno del Ecuador');
    expect(logo.getAttribute('src')).toBe('/brand/gobierno-ecuador-white.svg');
    expect(logo.getAttribute('width')).toBeTruthy();
    expect(logo.getAttribute('height')).toBeTruthy();
  });

  it('shows the institution line', () => {
    render(<GovHeader />);
    expect(screen.getByText('Gobernación de la Provincia de Morona Santiago')).toBeDefined();
  });

  it('ends with the decorative tricolor stripe', () => {
    const { container } = render(<GovHeader />);
    const header = container.querySelector('header') as HTMLElement;
    const last = header.lastElementChild as HTMLElement;
    expect(last.getAttribute('aria-hidden')).toBe('true');
    expect(last.children).toHaveLength(3);
  });

  it('contains no em dash', () => {
    const { container } = render(<GovHeader />);
    expect(container.textContent).not.toContain('—');
  });
});
