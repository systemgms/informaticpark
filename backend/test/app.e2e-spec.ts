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

    it('PATCH /api/assets/:id — should persist a valid condition and reject an invalid one', async () => {
      // A single login/create/delete round trip is reused for both
      // assertions on purpose: each extra POST /api/auth/login call here
      // also counts against that route's own 5-per-minute throttle bucket,
      // which the "Rate Limiting" test below depends on being nearly empty.
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'Admin123!' });

      if (loginRes.status !== 200) {
        return;
      }
      const token = loginRes.body.accessToken;

      const createRes = await request(app.getHttpServer())
        .post('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({ assetName: 'Activo E2E condición' });
      expect(createRes.status).toBe(201);
      const assetId = createRes.body.id;

      const validPatchRes = await request(app.getHttpServer())
        .patch(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ condition: 'EN_MANTENIMIENTO' });

      expect(validPatchRes.status).toBe(200);
      expect(validPatchRes.body.condition).toBe('EN_MANTENIMIENTO');

      const getRes = await request(app.getHttpServer())
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.condition).toBe('EN_MANTENIMIENTO');

      const invalidPatchRes = await request(app.getHttpServer())
        .patch(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ condition: 'ROTO' });

      expect(invalidPatchRes.status).toBe(400);

      const regularPatchRes = await request(app.getHttpServer())
        .patch(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ condition: 'REGULAR' });
      expect(regularPatchRes.status).toBe(200);
      expect(regularPatchRes.body.condition).toBe('REGULAR');

      const filterRes = await request(app.getHttpServer())
        .get('/api/assets?condition=REGULAR')
        .set('Authorization', `Bearer ${token}`);
      expect(filterRes.status).toBe(200);
      expect(
        filterRes.body.data.some((a: { id: number }) => a.id === assetId),
      ).toBe(true);

      await request(app.getHttpServer())
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`);
    });
  });

  describe('Custodians', () => {
    it('GET /api/custodians — should require authentication', () => {
      return request(app.getHttpServer()).get('/api/custodians').expect(401);
    });
  });

  describe('Public', () => {
    it('GET /api/public/assets — should be public and expose only allowed fields', async () => {
      return request(app.getHttpServer())
        .get('/api/public/assets?limit=2')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            const keys = Object.keys(res.body.data[0]);
            expect(keys).not.toContain('custodian');
            expect(keys).not.toContain('custodianId');
            expect(keys).not.toContain('serialNumber');
            expect(keys).not.toContain('createdByUser');
            expect(keys).not.toContain('condition');
          }
        });
    });

    it('GET /api/public/custodians — should be public and expose only allowed fields', async () => {
      return request(app.getHttpServer())
        .get('/api/public/custodians?limit=2')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            const keys = Object.keys(res.body.data[0]);
            expect(keys).not.toContain('identifier');
          }
        });
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
