import nextConfig from '../next.config.mjs';

async function getHeader(key: string): Promise<string> {
  if (!nextConfig.headers) throw new Error('next.config has no headers()');
  const rules = await nextConfig.headers();
  const header = rules.flatMap((rule) => rule.headers).find((h) => h.key === key);
  if (!header) throw new Error(`Missing ${key} header`);
  return header.value;
}

async function getCspDirectives(): Promise<Map<string, string>> {
  const value = await getHeader('Content-Security-Policy');
  return new Map(
    value
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive): [string, string] => {
        const [name, ...sources] = directive.split(/\s+/);
        return [name, sources.join(' ')];
      }),
  );
}

describe('next.config security headers', () => {
  it('sends a Content-Security-Policy that blocks plugins, base hijacking, and framing', async () => {
    const csp = await getCspDirectives();

    expect(csp.get('default-src')).toBe("'self'");
    expect(csp.get('object-src')).toBe("'none'");
    expect(csp.get('base-uri')).toBe("'self'");
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.get('form-action')).toBe("'self'");
  });

  it('allows the backend API, the map tiles, and the Leaflet stylesheet', async () => {
    const csp = await getCspDirectives();

    expect(csp.get('connect-src')).toContain(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');
    expect(csp.get('img-src')).toContain('https:');
    expect(csp.get('style-src')).toContain('https://unpkg.com');
  });

  it('lets the location picker use geolocation on this site only', async () => {
    expect(await getHeader('Permissions-Policy')).toContain('geolocation=(self)');
  });
});
