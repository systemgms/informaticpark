import { ExecutionContext } from '@nestjs/common';
import { shouldSkipMutationsThrottling } from './mutations-throttler.skip-if';

function createMockContext(method: string): ExecutionContext {
  const request = { method };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('shouldSkipMutationsThrottling', () => {
  it.each(['GET', 'HEAD', 'OPTIONS', 'get', 'head', 'options'])(
    'skips the mutations bucket for safe method %s',
    (method) => {
      const context = createMockContext(method);

      expect(shouldSkipMutationsThrottling(context)).toBe(true);
    },
  );

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'post', 'put', 'patch', 'delete'])(
    'applies the mutations bucket for write method %s',
    (method) => {
      const context = createMockContext(method);

      expect(shouldSkipMutationsThrottling(context)).toBe(false);
    },
  );
});
