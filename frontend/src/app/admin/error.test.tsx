// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import AdminError from './error';

describe('AdminError', () => {
  const error = Object.assign(new Error('secret stack detail'), { digest: 'dig123' });

  it('is announced to assistive tech as an alert', () => {
    render(<AdminError error={error} reset={() => {}} />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('shows a generic message and the digest, never the raw error message', () => {
    const { container } = render(<AdminError error={error} reset={() => {}} />);
    expect(container.textContent).not.toContain('secret stack detail');
    expect(container.textContent).toContain('dig123');
    expect(container.textContent).toContain('Ocurrió un error inesperado');
  });

  it('omits the reference code when there is no digest', () => {
    const { container } = render(<AdminError error={new Error('x')} reset={() => {}} />);
    expect(container.textContent).not.toContain('Código de referencia');
  });

  it('renders the digest in a monospace element', () => {
    render(<AdminError error={error} reset={() => {}} />);
    const digest = screen.getByText('dig123');
    expect(digest.className).toContain('font-mono');
  });
});
