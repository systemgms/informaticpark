import { ExecutionContext } from '@nestjs/common';

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Per-throttler `skipIf` predicate for the `mutations` bucket.
 *
 * `@nestjs/throttler` applies every registered throttler to every route, so
 * without this the `mutations` bucket (20/min) would also cap read (GET)
 * traffic. Safe, read-only methods skip this bucket and are only limited by
 * `default`; write methods (POST/PUT/PATCH/DELETE) are still throttled here.
 */
export function shouldSkipMutationsThrottling(
  context: ExecutionContext,
): boolean {
  const request = context.switchToHttp().getRequest<{ method: string }>();

  return SAFE_HTTP_METHODS.has(request.method.toUpperCase());
}
