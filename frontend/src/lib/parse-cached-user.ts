import { Role, User } from './types';

const VALID_ROLES: readonly string[] = Object.values(Role);

export function parseCachedUser(raw: string | null): User | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.id !== 'number') return null;
  if (typeof candidate.email !== 'string') return null;
  if (typeof candidate.role !== 'string' || !VALID_ROLES.includes(candidate.role)) return null;
  return parsed as User;
}
