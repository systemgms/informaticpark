// Shared by the user DTOs and the create-admin script so both enforce the same rules.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const PASSWORD_MIN_LENGTH_MESSAGE = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
export const PASSWORD_PATTERN_MESSAGE =
  'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
