/**
 * Trust exactly one proxy hop (Vercel's edge network sits directly in front
 * of this app in production) so Express derives `req.ip` from the
 * client-supplied `X-Forwarded-For` entry closest to us, instead of always
 * returning the proxy's own address. Without this, every client behind the
 * proxy shares one `req.ip` and therefore one throttler bucket (e.g. the
 * login limiter blocks every user after 5 attempts, not just one client).
 *
 * A hop count is used instead of `true`: `true` trusts the entire
 * `X-Forwarded-For` chain, which a client fully controls when there is no
 * real proxy in between, letting an attacker set an arbitrary
 * `X-Forwarded-For` header and rotate through it to bypass the login
 * throttle.
 */
export function configureTrustProxy(app: {
  set(setting: string, val: unknown): unknown;
}): void {
  app.set('trust proxy', 1);
}
