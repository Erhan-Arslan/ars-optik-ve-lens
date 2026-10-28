import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Admin flow (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Seeded admin user (see prisma/seed.ts)
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@arsoptik.com', password: process.env.ADMIN_PASSWORD ?? 'ArsOptik2026!' });
    adminToken = adminLogin.body.accessToken;

    const regularRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-test-${Date.now()}@ars-optik.test`,
        password: 'guclu-sifre-123',
        firstName: 'Regular',
        lastName: 'User',
      });
    regularToken = regularRegister.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a non-admin user from admin endpoints', async () => {
    await request(app.getHttpServer())
      .get('/admin/products')
      .set('Authorization', `Bearer ${regularToken}`)
      .expect(403);
  });

  it('rejects unauthenticated access to admin endpoints', async () => {
    await request(app.getHttpServer()).get('/admin/products').expect(401);
  });

  it('allows an admin to create, list, update, and delete a product', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: `admin-test-product-${Date.now()}`,
        name: 'Admin Test Ürünü',
        brand: 'ARS Test',
        category: 'cerceve',
        gender: 'unisex',
        price: 1500,
        description: 'Admin e2e testi için oluşturulmuş ürün.',
        colors: [{ name: 'Test', hex: '#C89A3E' }],
      })
      .expect(201);

    const productId = createResponse.body.id;
    expect(createResponse.body.name).toBe('Admin Test Ürünü');

    const listResponse = await request(app.getHttpServer())
      .get('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listResponse.body.some((p: { id: string }) => p.id === productId)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 1750 })
      .expect(200)
      .expect((res) => {
        expect(res.body.price).toBe(1750);
      });

    await request(app.getHttpServer())
      .delete(`/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('lists all orders across users for an admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
