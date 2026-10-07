// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetForm } from './asset-form';
import { api } from '@/lib/api';
import { AssetCondition } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    assets: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
    custodians: { getAll: vi.fn() },
    locations: { getAllUnpaginated: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// The real toast is memoized; a fresh fn per render would re-trigger the form's load effect forever.
const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const getByIdMock = api.assets.getById as unknown as ReturnType<typeof vi.fn>;
const createMock = api.assets.create as unknown as ReturnType<typeof vi.fn>;
const updateMock = api.assets.update as unknown as ReturnType<typeof vi.fn>;
const custodiansGetAllMock = api.custodians.getAll as unknown as ReturnType<typeof vi.fn>;
const locationsCreateMock = api.locations.create as unknown as ReturnType<typeof vi.fn>;
const locationsGetAllUnpaginatedMock = api.locations.getAllUnpaginated as unknown as ReturnType<typeof vi.fn>;

describe('AssetForm condition field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    custodiansGetAllMock.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } });
    locationsGetAllUnpaginatedMock.mockResolvedValue([]);
  });

  it('creates a new asset defaulting to Bueno when the condition is left untouched', async () => {
    createMock.mockResolvedValue({ id: 1 });
    const user = userEvent.setup();
    const { getByLabelText, getByRole } = render(<AssetForm />);

    await user.type(getByLabelText(/nombre del activo/i), 'Laptop Dell');
    await user.click(getByRole('button', { name: /guardar activo/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    expect(createMock.mock.calls[0][0]).toEqual(expect.objectContaining({ condition: AssetCondition.BUENO }));
  });

  it('loads the existing condition when editing an asset', async () => {
    getByIdMock.mockResolvedValue({
      id: 5,
      assetName: 'Impresora',
      condition: AssetCondition.MALO,
    });

    const { getByLabelText } = render(<AssetForm assetId={5} />);

    await waitFor(() => expect(getByLabelText(/condición/i).textContent).toBe('Malo'));
  });

  it('sends the updated condition on save', async () => {
    getByIdMock.mockResolvedValue({
      id: 5,
      assetName: 'Impresora',
      condition: AssetCondition.EN_MANTENIMIENTO,
    });
    updateMock.mockResolvedValue({ id: 5 });
    const user = userEvent.setup();

    const { getByRole, getByLabelText } = render(<AssetForm assetId={5} />);

    await waitFor(() => expect(getByLabelText(/condición/i).textContent).toBe('En mantenimiento'));
    await user.click(getByRole('button', { name: /guardar activo/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(updateMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ condition: AssetCondition.EN_MANTENIMIENTO }),
    );
  });

  it('loads and sends the Regular condition', async () => {
    getByIdMock.mockResolvedValue({
      id: 6,
      assetName: 'Monitor',
      condition: AssetCondition.REGULAR,
    });
    updateMock.mockResolvedValue({ id: 6 });
    const user = userEvent.setup();

    const { getByRole, getByLabelText } = render(<AssetForm assetId={6} />);

    await waitFor(() => expect(getByLabelText(/condición/i).textContent).toBe('Regular'));
    await user.click(getByRole('button', { name: /guardar activo/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(updateMock.mock.calls[0][1]).toEqual(expect.objectContaining({ condition: AssetCondition.REGULAR }));
  });
});

describe('AssetForm canonical location matching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    custodiansGetAllMock.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } });
    locationsGetAllUnpaginatedMock.mockResolvedValue([]);
  });

  it('preselects canton and parroquia when the stored names differ in case and accents', async () => {
    getByIdMock.mockResolvedValue({
      id: 7,
      assetName: 'Laptop',
      geoLocation: { id: 42, canton: 'SANTIAGO', parroquia: 'MENDEZ' },
    });

    const { getByLabelText } = render(<AssetForm assetId={7} />);

    await waitFor(() => expect(getByLabelText('Cantón').textContent).toBe('Santiago'));
    expect(getByLabelText('Parroquia').textContent).toBe('Méndez');
  });

  it('keeps stored names that are not in the catalog so they are not lost', async () => {
    getByIdMock.mockResolvedValue({
      id: 8,
      assetName: 'Laptop',
      geoLocation: { id: 43, canton: 'Narnia', parroquia: 'Cair Paravel' },
    });
    updateMock.mockResolvedValue({ id: 8 });
    locationsGetAllUnpaginatedMock.mockResolvedValue([{ id: 43, canton: 'Narnia', parroquia: 'Cair Paravel' }]);
    const user = userEvent.setup();

    const { getByRole, getByLabelText } = render(<AssetForm assetId={8} />);

    await waitFor(() => expect(getByLabelText(/nombre del activo/i)).toHaveProperty('value', 'Laptop'));
    await user.click(getByRole('button', { name: /guardar activo/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(updateMock.mock.calls[0][1]).toEqual(expect.objectContaining({ locationId: 43 }));
    expect(locationsCreateMock).not.toHaveBeenCalled();
  });

  it('reuses an existing location whose name differs in case and accents instead of creating one', async () => {
    getByIdMock.mockResolvedValue({
      id: 7,
      assetName: 'Laptop',
      geoLocation: { id: 42, canton: 'SANTIAGO', parroquia: 'MENDEZ' },
    });
    updateMock.mockResolvedValue({ id: 7 });
    locationsGetAllUnpaginatedMock.mockResolvedValue([{ id: 42, canton: 'santiago', parroquia: 'méndez' }]);
    const user = userEvent.setup();

    const { getByRole, getByLabelText } = render(<AssetForm assetId={7} />);

    await waitFor(() => expect(getByLabelText('Cantón').textContent).toBe('Santiago'));
    await user.click(getByRole('button', { name: /guardar activo/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(locationsCreateMock).not.toHaveBeenCalled();
    expect(updateMock.mock.calls[0][1]).toEqual(expect.objectContaining({ locationId: 42 }));
  });
});
