import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import GlobalError from './global-error';

// global-error replaces the root layout, so it must render a full document.
describe('GlobalError', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  it('renders its own html (lang es) and body, as Next requires', () => {
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
    expect(markup.startsWith('<html lang="es"')).toBe(true);
    expect(markup).toContain('<body');
    expect(markup).toContain('<title>Error | Parque Informático</title>');
  });

  it('uses no emoji or Unicode glyph icons and no placeholder support link', () => {
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
    expect(markup).not.toMatch(/[⚠↻]/u);
    expect(markup).not.toContain('example.com');
    expect(markup).not.toContain('—');
  });

  it('shows the error digest as a reference code and never the raw message', () => {
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
    expect(markup).toContain('abc123');
    expect(markup).not.toContain('boom');
  });

  it('calls reset from an accessible 44px retry button', () => {
    const reset = vi.fn();
    // jsdom already has an <html>; React warns about nesting another one, which
    // is expected for this file convention, so silence only that warning.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<GlobalError error={error} reset={reset} />);
    consoleError.mockRestore();
    const button = screen.getByRole('button', { name: 'Reintentar' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toContain('h-11');
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('announces the error to assistive technology', () => {
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
    expect(markup).toContain('role="alert"');
  });
});
