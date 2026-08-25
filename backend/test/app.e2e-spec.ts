import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  describe('Auth', () => {
    it('POST /api/auth/login — should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Wrong123' })
        .expect(401);
    });

    it('POST /api/auth/login — should reject empty body', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('GET /api/auth/me — should require token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('Assets', () => {
    it('GET /api/assets — should require authentication', () => {
      return request(app.getHttpServer()).get('/api/assets').expect(401);
    });

    it('GET /api/assets — should return paginated list with valid token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'Admin123!' });

      if (loginRes.status === 200) {
        const token = loginRes.body.accessToken;
        return request(app.getHttpServer())
          .get('/api/assets')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      }
    });
  });

  describe('Custodians', () => {
    it('GET /api/custodians — should require authentication', () => {
      return request(app.getHttpServer()).get('/api/custodians').expect(401);
    });
  });

  describe('Locations', () => {
    it('GET /api/locations — should be public', () => {
      return request(app.getHttpServer()).get('/api/locations').expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('POST /api/auth/login — should rate limit after 5 attempts', async () => {
      const attempts = Array.from({ length: 6 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'admin@example.com', password: `Wrong${i}` }),
      );

      const results = await Promise.all(attempts);
      const tooManyRequests = results.filter((r) => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });
});
