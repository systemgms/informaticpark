import { parseInitialAdminInput } from './initial-admin';

describe('parseInitialAdminInput', () => {
  const validEnv = {
    ADMIN_EMAIL: '  Admin@GPMS.gob.ec ',
    ADMIN_PASSWORD: 'Segura123',
  };

  it('normalizes the email and defaults the name', () => {
    const result = parseInitialAdminInput(validEnv);

    expect(result).toEqual({
      isValid: true,
      admin: {
        email: 'admin@gpms.gob.ec',
        password: 'Segura123',
        name: 'Administrador',
      },
    });
  });

  it('uses ADMIN_NAME when provided', () => {
    const result = parseInitialAdminInput({
      ...validEnv,
      ADMIN_NAME: '  Ana Pérez ',
    });

    expect(result.isValid && result.admin.name).toBe('Ana Pérez');
  });

  it('rejects a missing or malformed email', () => {
    expect(parseInitialAdminInput({ ADMIN_PASSWORD: 'Segura123' })).toEqual({
      isValid: false,
      errors: ['ADMIN_EMAIL es obligatorio y debe ser un correo válido'],
    });
    expect(
      parseInitialAdminInput({ ...validEnv, ADMIN_EMAIL: 'no-es-correo' }),
    ).toMatchObject({ isValid: false });
  });

  it.each([
    ['missing', undefined],
    ['too short', 'Ab1'],
    ['without uppercase', 'segura123'],
    ['without lowercase', 'SEGURA123'],
    ['without digit', 'SeguraSegura'],
    ['too long', `Aa1${'x'.repeat(98)}`],
  ])('rejects a password that is %s', (_case, password) => {
    const result = parseInitialAdminInput({
      ...validEnv,
      ADMIN_PASSWORD: password,
    });

    expect(result.isValid).toBe(false);
  });

  it('reports every invalid field at once', () => {
    const result = parseInitialAdminInput({});

    expect(!result.isValid && result.errors).toHaveLength(2);
  });
});
