// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from './user-form';
import { api } from '@/lib/api';
import { Role } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    users: { getById: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/hooks/use-custodian-options', () => ({
  useCustodianOptions: () => ({ custodians: [], isLoading: false, error: null }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// The real toast is memoized; a fresh fn per render would re-trigger the form's load effect forever.
const toastMock = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const getByIdMock = api.users.getById as unknown as ReturnType<typeof vi.fn>;
const updateMock = api.users.update as unknown as ReturnType<typeof vi.fn>;

const EXISTING_USER = {
  id: 7,
  name: 'Ana Torres',
  email: 'ana@example.com',
  role: Role.USER,
  isActive: true,
  custodianId: null,
};

describe('UserForm in edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getByIdMock.mockResolvedValue(EXISTING_USER);
    updateMock.mockResolvedValue(EXISTING_USER);
  });

  it('offers an optional new password field', async () => {
    render(<UserForm userId={7} />);

    const passwordInput = await screen.findByLabelText<HTMLInputElement>(/nueva contraseña/i);

    expect(passwordInput.required).toBe(false);
  });

  it('keeps the current password when the field is left blank', async () => {
    const user = userEvent.setup();
    render(<UserForm userId={7} />);
    await screen.findByLabelText(/nueva contraseña/i);

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock.mock.calls[0][1]).not.toHaveProperty('password');
  });

  it('sends the new password when one is typed', async () => {
    const user = userEvent.setup();
    render(<UserForm userId={7} />);
    const passwordInput = await screen.findByLabelText(/nueva contraseña/i);

    await user.type(passwordInput, 'NuevaClave123');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock.mock.calls[0][1]).toMatchObject({ password: 'NuevaClave123' });
  });
});
