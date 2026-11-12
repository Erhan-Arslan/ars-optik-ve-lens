import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
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
    })
      // POST /orders allows 5 requests/minute; this suite places more than that on purpose.
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () => Promise.resolve({ totalHits: 1, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 }),
      })
      .compile();

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

  describe('prescription lenses', () => {
    const address = {
      fullName: 'Recete Testi',
      phone: '05551234567',
      city: 'İstanbul',
      district: 'Kadıköy',
      addressLine: 'Test Mahallesi, Test Sokak No:1',
      zip: '34710',
    };
    const card = { cardName: 'RECETE TESTI', cardNumber: '4242424242424242', cardExpiry: '12/28', cardCvc: '123' };

    type LensOption = { id: string; code: string; priceModifier: number };
    let product: { id: string; price: number; colors: { name: string }[] };
    let lensType: LensOption;
    let lensCoating: LensOption;
    let lensIndexes: LensOption[];

    beforeAll(async () => {
      const products = await request(app.getHttpServer()).get('/products').expect(200);
      product = products.body.find((p: { requiresPrescription: boolean }) => p.requiresPrescription);
      const options = await request(app.getHttpServer()).get('/products/meta/lens-options').expect(200);
      lensType = options.body.lensTypes[0];
      lensCoating = options.body.lensCoatings[0];
      lensIndexes = options.body.lensIndexes;
    });

    function order(item: Record<string, unknown>) {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          address,
          card,
          items: [
            {
              productId: product.id,
              quantity: 1,
              selectedColor: product.colors[0].name,
              lensTypeId: lensType.id,
              lensCoatingId: lensCoating.id,
              ...item,
            },
          ],
        });
    }

    it('lists lens indexes from thinnest-cheapest to thinnest', () => {
      expect(lensIndexes.map((li) => li.code)).toEqual(['1.50', '1.60', '1.67', '1.74']);
    });

    it('charges the selected lens index and stores the full prescription', async () => {
      const index = lensIndexes.find((li) => li.code === '1.67')!;

      const response = await order({
        lensIndexId: index.id,
        prescriptionOdSphere: '-3.25',
        prescriptionOsSphere: '-3.00',
        prescriptionOdCylinder: -0.75,
        prescriptionOdAxis: 180,
        prescriptionOsCylinder: -0.5,
        prescriptionOsAxis: 175,
        prescriptionPupillaryDistance: 63.5,
      }).expect(201);

      const [item] = response.body.items;
      expect(item.unitPrice).toBe(
        product.price + lensType.priceModifier + lensCoating.priceModifier + index.priceModifier,
      );
      expect(item).toMatchObject({
        lensIndexId: index.id,
        prescriptionOdCylinder: -0.75,
        prescriptionOdAxis: 180,
        prescriptionOsCylinder: -0.5,
        prescriptionPupillaryDistance: 63.5,
      });
    });

    it('falls back to the standard index for clients that do not send one', async () => {
      const response = await order({ prescriptionOdSphere: '', prescriptionOsSphere: '' }).expect(201);

      expect(response.body.items[0].lensIndexId).toBe(lensIndexes[0].id);
    });

    it('rejects a cylinder without an axis', async () => {
      await order({ prescriptionOdSphere: '-1.00', prescriptionOdCylinder: -1.25 }).expect(400);
    });

    it.each([
      { prescriptionOdSphere: '-1.30' },
      { prescriptionOdSphere: '-21.00' },
      { prescriptionOdCylinder: -0.3, prescriptionOdAxis: 90 },
      { prescriptionOdAxis: 181 },
      { prescriptionPupillaryDistance: 63.3 },
    ])('rejects out-of-range or off-step prescription values: %o', async (values) => {
      await order(values).expect(400);
    });

    it('rejects an unknown lens index', async () => {
      await order({ lensIndexId: 'does-not-exist' }).expect(400);
    });
  });
});
