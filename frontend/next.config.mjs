const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const IS_DEV = process.env.NODE_ENV === 'development';

// Next.js injects inline bootstrap scripts, so script-src needs 'unsafe-inline' without a nonce setup.
// Dev mode also needs 'unsafe-eval' (React refresh) and a websocket for hot reload.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  // Brand logos come from admin-provided URLs and map tiles from OpenStreetMap, so any https image is allowed.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${BACKEND_URL}${IS_DEV ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: CONTENT_SECURITY_POLICY,
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(self)',
        },
      ],
    },
  ],
};

export default nextConfig;
