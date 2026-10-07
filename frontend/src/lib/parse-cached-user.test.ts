import { parseCachedUser } from './parse-cached-user';
import { Role } from './types';

const validUser = {
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  role: Role.ADMIN,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('parseCachedUser', () => {
  it('returns the user for a valid JSON payload', () => {
    expect(parseCachedUser(JSON.stringify(validUser))).toEqual(validUser);
  });

  it('accepts the USER role', () => {
    expect(parseCachedUser(JSON.stringify({ ...validUser, role: 'USER' }))?.role).toBe(Role.USER);
  });

  it('returns null for null input', () => {
    expect(parseCachedUser(null)).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    expect(parseCachedUser('{not json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(parseCachedUser('42')).toBeNull();
    expect(parseCachedUser('null')).toBeNull();
    expect(parseCachedUser('"x"')).toBeNull();
  });

  it('returns null when id is not a number', () => {
    expect(parseCachedUser(JSON.stringify({ ...validUser, id: '1' }))).toBeNull();
  });

  it('returns null when email is not a string', () => {
    expect(parseCachedUser(JSON.stringify({ ...validUser, email: 5 }))).toBeNull();
  });

  it('returns null when the role is unknown', () => {
    expect(parseCachedUser(JSON.stringify({ ...validUser, role: 'ROOT' }))).toBeNull();
  });
});
