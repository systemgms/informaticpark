import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureTrustProxy } from '../src/config/trust-proxy.config';

describe('Throttling behind a proxy (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureTrustProxy(app);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Login throttling honors X-Forwarded-For', () => {
    it('gives independent rate-limit counters to different client IPs', async () => {
      const firstClientAttempts = Array.from({ length: 6 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .set('X-Forwarded-For', '203.0.113.10')
          .send({ email: 'admin@example.com', password: `Wrong${i}` }),
      );
      const firstClientResults = await Promise.all(firstClientAttempts);
      expect(
        firstClientResults.filter((res) => res.status === 429).length,
      ).toBeGreaterThanOrEqual(1);

      const secondClientResult = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.20')
        .send({ email: 'admin@example.com', password: 'Wrong0' });

      expect(secondClientResult.status).not.toBe(429);
    }, 30000);
  });

  describe('The mutations throttler bucket only applies to write methods', () => {
    it('does not attach the mutations bucket headers to a GET request', async () => {
      const res = await request(app.getHttpServer()).get('/api/locations');

      expect(res.status).not.toBe(429);
      expect(res.headers['x-ratelimit-limit-mutations']).toBeUndefined();
    });

    it('does not rate-limit six consecutive GET requests under the 20/min mutations limit', async () => {
      const reads = Array.from({ length: 6 }, () =>
        request(app.getHttpServer()).get('/api/locations'),
      );

      const results = await Promise.all(reads);
      expect(results.every((res) => res.status !== 429)).toBe(true);
    }, 30000);

    it('attaches the mutations bucket headers to a POST request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.30')
        .send({ email: 'admin@example.com', password: 'Wrong0' });

      expect(res.headers['x-ratelimit-limit-mutations']).toBeDefined();
    });
  });
});
