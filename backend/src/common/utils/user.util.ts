import { Prisma } from '@prisma/client';

export type SafeUser = Omit<
  Prisma.UserGetPayload<Record<string, never>>,
  'password'
>;

export function excludePassword<T extends { password?: unknown }>(
  user: T,
): Omit<T, 'password'> {
  const { password: excludedPassword, ...rest } = user;
  void excludedPassword;
  return rest;
}

export function excludePasswordMany<T extends { password?: unknown }>(
  users: T[],
): Omit<T, 'password'>[] {
  return users.map(excludePassword);
}

export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  custodianId: true,
  createdAt: true,
  updatedAt: true,
} as const;
