import { api } from './api';

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
    const [url, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0];

    expect(url).toContain('/assets/5/movements');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ toCustodianId: 3, note: 'nota' });
  });

  it('createBulk sends a JSON payload with assetIds and only the provided destination fields', async () => {
    await api.movements.createBulk({ assetIds: [1, 2, 3], toLocationId: 7 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0];

    expect(url).toContain('/movements/bulk');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({
      assetIds: [1, 2, 3],
      toLocationId: 7,
    });
  });
});
