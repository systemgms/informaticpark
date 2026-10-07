import { api, ApiError } from './api';
import { AssetCondition } from './types';

describe('api list params', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    }) as unknown as typeof fetch;
  });

  it('assets.getAll sends page, limit and search as query params', async () => {
    await api.assets.getAll({ page: 2, limit: 50, search: 'laptop' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/assets?');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=50');
    expect(url).toContain('search=laptop');
  });

  it('assets.getAll omits the query string when called without params', async () => {
    await api.assets.getAll();

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.endsWith('/assets')).toBe(true);
  });

  it('assets.getAll omits an empty search term', async () => {
    await api.assets.getAll({ page: 1, limit: 20, search: '' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).not.toContain('search=');
  });

  it('assets.getAll sends the condition filter as a query param', async () => {
    await api.assets.getAll({ page: 1, limit: 20, condition: AssetCondition.MALO });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('condition=MALO');
  });

  it('assets.getAll omits the condition filter when not provided', async () => {
    await api.assets.getAll({ page: 1, limit: 20 });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).not.toContain('condition=');
  });

  it('assets.getStats requests /assets/stats', async () => {
    await api.assets.getStats();

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/assets/stats');
  });

  it('custodians.getAll sends page, limit and search as query params', async () => {
    await api.custodians.getAll({ page: 3, limit: 10, search: 'jose' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/custodians?');
    expect(url).toContain('page=3');
    expect(url).toContain('search=jose');
  });

  it('users.getAll sends page, limit and includeInactive without a search param', async () => {
    await api.users.getAll({ page: 1, limit: 20, includeInactive: true });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('includeInactive=true');
    expect(url).not.toContain('search=');
  });

  it('locations.getAll sends page, limit and search as query params', async () => {
    await api.locations.getAll({ page: 1, limit: 20, search: 'macas' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/locations?');
    expect(url).toContain('search=macas');
  });

  it('locations.getAllUnpaginated requests all=true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as unknown as typeof fetch;

    await api.locations.getAllUnpaginated();

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/locations?all=true');
  });

  it('public.assets.getAll requests /public/assets with page, limit and search', async () => {
    await api.public.assets.getAll({ page: 2, limit: 10, search: 'dell' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/public/assets?');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
    expect(url).toContain('search=dell');
  });

  it('public.custodians.getAll requests /public/custodians with page, limit and search', async () => {
    await api.public.custodians.getAll({ page: 1, limit: 20, search: 'ana' });

    const [url] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/public/custodians?');
    expect(url).toContain('search=ana');
  });
});

describe('api.public 401 handling on a public path', () => {
  const originalPathname = window.location.pathname;

  afterEach(() => {
    window.history.pushState({}, '', originalPathname);
  });

  it('does not redirect to /login or drop the stored token on a 401 from a public page', async () => {
    window.history.pushState({}, '', '/public/assets');
    localStorage.setItem('token', 'stale-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized' }),
    }) as unknown as typeof fetch;

    await expect(api.public.assets.getAll()).rejects.toThrow();

    expect(window.location.pathname).toBe('/public/assets');
    expect(localStorage.getItem('token')).toBe('stale-token');
    localStorage.removeItem('token');
  });

  // The landing page and /login are public too: an expired token there must not
  // hard-redirect. AuthProvider clears the session itself on the ApiError.
  it.each(['/', '/login'])('does not hard-redirect on a 401 from /auth/me while on %s', async (path) => {
    window.history.pushState({}, '', path);
    localStorage.setItem('token', 'expired-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized' }),
    }) as unknown as typeof fetch;

    await expect(api.auth.me()).rejects.toThrow();

    expect(window.location.pathname).toBe(path);
    expect(localStorage.getItem('token')).toBe('expired-token');
    localStorage.removeItem('token');
  });
});

describe('api.movements', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it('create sends a JSON payload with only the provided numeric fields', async () => {
    await api.movements.create(5, { toCustodianId: 3, note: 'nota' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

    expect(url).toContain('/assets/5/movements');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ toCustodianId: 3, note: 'nota' });
  });

  it('createBulk sends a JSON payload with assetIds and only the provided destination fields', async () => {
    await api.movements.createBulk({ assetIds: [1, 2, 3], toLocationId: 7 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

    expect(url).toContain('/movements/bulk');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({
      assetIds: [1, 2, 3],
      toLocationId: 7,
    });
  });
});

describe('api errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an ApiError carrying the HTTP status for a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Prohibido' }),
    }) as unknown as typeof fetch;

    const error = await api.auth.me().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).message).toBe('Prohibido');
  });

  it('throws a plain Error without status for a network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

    const error = await api.auth.me().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
