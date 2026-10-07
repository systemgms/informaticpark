// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './toast';

function Trigger() {
  const { toast } = useToast();
  return <button onClick={() => toast('Guardado', 'success')}>go</button>;
}

describe('ToastProvider', () => {
  it('renders the toast region as a polite status live region', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('shows a toast message inside the region', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => screen.getByText('go').click());
    expect(screen.getByRole('status').textContent).toContain('Guardado');
  });
});
