import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as any;
    guard = new JwtAuthGuard(jwtService, reflector, configService);
  });

  function createMockContext(metadata: Record<string, any> = {}) {
    const request = {
      headers: {},
      user: null,
    };
    const handler = jest.fn();
    const classRef = jest.fn();

    // Set metadata on handler
    if (metadata.isPublic !== undefined) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, metadata.isPublic, handler);
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => classRef,
      request,
    } as any;
  }

  it('should allow access to public routes', async () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token provided', async () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token format is invalid', async () => {
    const context = createMockContext();
    context.request.headers['authorization'] = 'InvalidToken';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    const context = createMockContext();
    context.request.headers['authorization'] = 'Bearer invalid-token';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should allow access with valid token', async () => {
    const context = createMockContext();
    context.request.headers['authorization'] = 'Bearer valid-token';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
      sub: 1,
      role: 'ADMIN',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.request.user).toEqual({ sub: 1, role: 'ADMIN' });
  });

  it('should call verifyAsync with correct secret and algorithm', async () => {
    const context = createMockContext();
    context.request.headers['authorization'] = 'Bearer valid-token';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 1 });

    await guard.canActivate(context);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
      algorithms: ['HS256'],
    });
  });
});
