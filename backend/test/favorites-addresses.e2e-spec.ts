import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Favorites & addresses (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `fav-addr-${Date.now()}@ars-optik.test`,
        password: 'guclu-sifre-123',
        firstName: 'Fav',
        lastName: 'Addr',
      });
    accessToken = register.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds, lists, and removes a favorite product', async () => {
    const products = await request(app.getHttpServer()).get('/products').expect(200);
    const productId = products.body[0].id;

    await request(app.getHttpServer())
      .post(`/favorites/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.some((p: { id: string }) => p.id === productId)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/favorites/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listAfter = await request(app.getHttpServer())
      .get('/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(listAfter.body.some((p: { id: string }) => p.id === productId)).toBe(false);
  });

  it('creates an address, sets it default, and deletes it', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Ev',
        fullName: 'Fav Addr',
        phone: '05551234567',
        city: 'İstanbul',
        district: 'Kadıköy',
        addressLine: 'Test Mahallesi Test Sokak No:1',
        zip: '34710',
      })
      .expect(201);

    const addressId = createResponse.body.id;
    expect(createResponse.body.isDefault).toBe(false);

    await request(app.getHttpServer())
      .patch(`/addresses/${addressId}/default`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.isDefault).toBe(true);
      });

    const list = await request(app.getHttpServer())
      .get('/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.length).toBe(1);

    await request(app.getHttpServer())
      .delete(`/addresses/${addressId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
