import { isEmail } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PATTERN,
  PASSWORD_PATTERN_MESSAGE,
} from './password-policy';

export interface InitialAdminEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_NAME?: string;
}

export interface InitialAdmin {
  email: string;
  password: string;
  name: string;
}

export type InitialAdminParseResult =
  | { isValid: true; admin: InitialAdmin }
  | { isValid: false; errors: string[] };

const DEFAULT_ADMIN_NAME = 'Administrador';

function validatePassword(password: string | undefined): string | null {
  if (!password) return 'ADMIN_PASSWORD es obligatorio';
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_MIN_LENGTH_MESSAGE;
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres`;
  }
  if (!PASSWORD_PATTERN.test(password)) return PASSWORD_PATTERN_MESSAGE;
  return null;
}

/** Validates the env vars for the first admin with the same rules as the user DTOs. */
export function parseInitialAdminInput(
  env: InitialAdminEnv,
): InitialAdminParseResult {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const errors: string[] = [];

  if (!isEmail(email)) {
    errors.push('ADMIN_EMAIL es obligatorio y debe ser un correo válido');
  }
  const passwordError = validatePassword(env.ADMIN_PASSWORD);
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) return { isValid: false, errors };

  return {
    isValid: true,
    admin: {
      email,
      password: env.ADMIN_PASSWORD!,
      name: env.ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME,
    },
  };
}
