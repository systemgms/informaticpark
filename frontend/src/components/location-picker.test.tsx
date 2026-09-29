import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocationPicker } from './location-picker';

const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const setViewMock = vi.fn();
vi.mock('leaflet', () => {
  const map = {
    setView: (...args: unknown[]) => {
      setViewMock(...args);
      return map;
    },
    on: vi.fn(),
    remove: vi.fn(),
  };
  const layer = { addTo: () => layer, on: vi.fn(), setLatLng: vi.fn(), remove: vi.fn() };
  return {
    map: () => map,
    tileLayer: () => layer,
    marker: () => layer,
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  };
});

describe('LocationPicker', () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    toastMock.mockClear();
    setViewMock.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  });

  it('centers the map on Macas when there is no saved location', async () => {
    render(<LocationPicker value={null} onChange={vi.fn()} />);

    await waitFor(() => expect(setViewMock).toHaveBeenCalled());
    const [center] = setViewMock.mock.calls[0] as [[number, number]];
    expect(center[0]).toBeCloseTo(-2.3087, 2);
    expect(center[1]).toBeCloseTo(-78.1114, 2);
  });

  it('shows an error toast instead of an alert when geolocation is unavailable', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });

    render(<LocationPicker value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /usar mi ubicación/i }));

    expect(toastMock).toHaveBeenCalledWith('Tu navegador no soporta geolocalización.', 'error');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows an error toast when the position cannot be obtained', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_ok: unknown, fail: () => void) => fail() },
      configurable: true,
    });

    render(<LocationPicker value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /usar mi ubicación/i }));

    expect(toastMock).toHaveBeenCalledWith(
      'No se pudo obtener la ubicación. Verifica los permisos del navegador.',
      'error',
    );
  });
});
