import { parsePagination } from './parse-pagination';

describe('parsePagination', () => {
  it('defaults to page 1 and limit 20 when nothing is provided', () => {
    expect(parsePagination(undefined, undefined)).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('parses valid page and limit values', () => {
    expect(parsePagination('3', '10')).toEqual({ page: 3, limit: 10 });
  });

  it('clamps page below 1 up to 1', () => {
    expect(parsePagination('0', '10')).toEqual({ page: 1, limit: 10 });
    expect(parsePagination('-5', '10')).toEqual({ page: 1, limit: 10 });
  });

  it('clamps a negative limit up to 1', () => {
    expect(parsePagination('1', '-5')).toEqual({ page: 1, limit: 1 });
  });

  // `0` is a falsy number, so `parseInt(limit, 10) || defaultLimit` falls back to the
  // default here — this is the exact quirk of the original inline expressions being
  // preserved, not a new design choice.
  it('falls back to the default limit for a zero limit', () => {
    expect(parsePagination('1', '0')).toEqual({ page: 1, limit: 20 });
  });

  it('clamps limit above the default max (100) down to 100', () => {
    expect(parsePagination('1', '500')).toEqual({ page: 1, limit: 100 });
  });

  it('falls back to defaults for garbage input', () => {
    expect(parsePagination('abc', 'xyz')).toEqual({ page: 1, limit: 20 });
  });

  it('falls back to defaults for an empty string', () => {
    expect(parsePagination('', '')).toEqual({ page: 1, limit: 20 });
  });

  it('honors a custom defaultLimit', () => {
    expect(parsePagination(undefined, undefined, { defaultLimit: 50 })).toEqual(
      { page: 1, limit: 50 },
    );
  });

  it('honors a custom maxLimit', () => {
    expect(parsePagination('1', '999', { maxLimit: 200 })).toEqual({
      page: 1,
      limit: 200,
    });
  });

  it('applies both custom options together', () => {
    expect(
      parsePagination(undefined, '9999', { defaultLimit: 5, maxLimit: 30 }),
    ).toEqual({ page: 1, limit: 30 });
  });
});
