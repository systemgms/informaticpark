const EXACT_PUBLIC_PATHS = ['/', '/login'];
const PUBLIC_PATH_PREFIXES = ['/public'];

/**
 * Decides whether a route is reachable without authentication.
 * Used by both AuthGuard (to skip the login redirect) and Navbar
 * (to hide the private navigation on public pages), so both stay in sync.
 */
export function isPublicPath(pathname: string): boolean {
  if (EXACT_PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
