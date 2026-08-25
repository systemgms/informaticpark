import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { role?: string }) {
    const request = {
      user: user || null,
    };
    const handler = jest.fn();
    const classRef = jest.fn();

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => classRef,
      request,
    } as any;
  }

  it('should allow access to public routes', () => {
    const context = createMockContext();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    const context = createMockContext({ role: 'USER' });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        return undefined;
      });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const context = createMockContext({ role: 'ADMIN' });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN'];
        return undefined;
      });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user has wrong role', () => {
    const context = createMockContext({ role: 'USER' });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN'];
        return undefined;
      });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no role', () => {
    const context = createMockContext({});
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN'];
        return undefined;
      });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when request has no user', () => {
    const context = createMockContext(undefined);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN'];
        return undefined;
      });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when multiple roles are required and user has one', () => {
    const context = createMockContext({ role: 'ADMIN' });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN', 'USER'];
        return undefined;
      });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
});
