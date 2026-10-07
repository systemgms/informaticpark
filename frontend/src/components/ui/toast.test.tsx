// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('has a named 44px close button that dismisses the toast', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => screen.getByText('go').click());
    const close = screen.getByRole('button', { name: 'Cerrar notificación' });
    expect(close.getAttribute('type')).toBe('button');
    expect(close.className).toContain('size-11');
    fireEvent.click(close);
    expect(screen.getByRole('status').textContent).not.toContain('Guardado');
  });

  it('does not re-render toast-only consumers when a toast is added', () => {
    let renderCount = 0;
    let showToast: ReturnType<typeof useToast>['toast'] = () => {};
    function Consumer() {
      const { toast } = useToast();
      showToast = toast;
      renderCount += 1;
      return null;
    }
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    const initialRenders = renderCount;

    act(() => showToast('Uno', 'info'));
    act(() => showToast('Dos', 'error'));

    expect(screen.getByText('Uno')).toBeDefined();
    expect(renderCount).toBe(initialRenders);
  });

  it('keeps the same toast function across renders', () => {
    const seen = new Set<unknown>();
    let showToast: ReturnType<typeof useToast>['toast'] = () => {};
    function Consumer() {
      const { toast } = useToast();
      showToast = toast;
      seen.add(toast);
      return null;
    }
    const { rerender } = render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    act(() => showToast('Uno'));
    rerender(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    expect(seen.size).toBe(1);
  });

  it('gives unique ids to toasts created in the same millisecond', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      let showToast: ReturnType<typeof useToast>['toast'] = () => {};
      function Consumer() {
        showToast = useToast().toast;
        return null;
      }
      render(
        <ToastProvider>
          <Consumer />
        </ToastProvider>,
      );
      act(() => {
        showToast('Uno');
        showToast('Dos');
      });
      expect(screen.getByText('Uno')).toBeDefined();
      expect(screen.getByText('Dos')).toBeDefined();
      const duplicateKeyWarnings = errorSpy.mock.calls.filter((call) => String(call[0]).includes('same key'));
      expect(duplicateKeyWarnings).toHaveLength(0);

      // Dismissing one must not remove the other.
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.queryByText('Uno')).toBeNull();
      expect(screen.getByText('Dos')).toBeDefined();
    } finally {
      errorSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
