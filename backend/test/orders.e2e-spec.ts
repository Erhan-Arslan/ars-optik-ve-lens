import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Checkout flow (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const email = `checkout-${Date.now()}@ars-optik.test`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'guclu-sifre-123', firstName: 'Checkout', lastName: 'Testi' });
    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an order from the seeded catalog and charges the mock payment provider', async () => {
    const productsResponse = await request(app.getHttpServer()).get('/products').expect(200);
    expect(productsResponse.body.length).toBeGreaterThan(0);
    const product = productsResponse.body[0];

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        address: {
          fullName: 'Checkout Testi',
          phone: '05551234567',
          city: 'İstanbul',
          district: 'Kadıköy',
          addressLine: 'Test Mahallesi, Test Sokak No:1',
          zip: '34710',
        },
        card: {
          cardName: 'CHECKOUT TESTI',
          cardNumber: '4242424242424242',
          cardExpiry: '12/28',
          cardCvc: '123',
        },
        items: [{ productId: product.id, quantity: 1, selectedColor: product.colors[0].name }],
      })
      .expect(201);

    expect(orderResponse.body.status).toBe('hazirlaniyor');
    expect(orderResponse.body.total).toBeGreaterThan(0);

    const orderNumber = orderResponse.body.orderNumber;

    const listResponse = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(listResponse.body.some((o: { orderNumber: string }) => o.orderNumber === orderNumber)).toBe(true);

    await request(app.getHttpServer())
      .get(`/orders/${orderNumber}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('rejects a mock card ending in 0000', async () => {
    const productsResponse = await request(app.getHttpServer()).get('/products').expect(200);
    const product = productsResponse.body[0];

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        address: {
          fullName: 'Checkout Testi',
          phone: '05551234567',
          city: 'İstanbul',
          district: 'Kadıköy',
          addressLine: 'Test Mahallesi, Test Sokak No:1',
          zip: '34710',
        },
        card: {
          cardName: 'CHECKOUT TESTI',
          cardNumber: '4242424242420000',
          cardExpiry: '12/28',
          cardCvc: '123',
        },
        items: [{ productId: product.id, quantity: 1, selectedColor: product.colors[0].name }],
      })
      .expect(400);
  });
});
