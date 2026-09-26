import { api } from './api';

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
