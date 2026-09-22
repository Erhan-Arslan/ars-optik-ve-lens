import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment-provider.interface.js';
import { OrderStatus, PaymentStatus } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { serializeOrder } from './order.mapper.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';

const FREE_SHIPPING_THRESHOLD = 750;
const SHIPPING_FEE = 60;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(products.map((p) => [p.id, p]));

    const lensTypeIds = [...new Set(dto.items.map((i) => i.lensTypeId).filter(Boolean))] as string[];
    const lensCoatingIds = [
      ...new Set(dto.items.map((i) => i.lensCoatingId).filter(Boolean)),
    ] as string[];
    const [lensTypes, lensCoatings] = await Promise.all([
      lensTypeIds.length
        ? this.prisma.lensType.findMany({ where: { id: { in: lensTypeIds } } })
        : Promise.resolve([]),
      lensCoatingIds.length
        ? this.prisma.lensCoating.findMany({ where: { id: { in: lensCoatingIds } } })
        : Promise.resolve([]),
    ]);
    const lensTypeById = new Map(lensTypes.map((lt) => [lt.id, lt]));
    const lensCoatingById = new Map(lensCoatings.map((lc) => [lc.id, lc]));

    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Ürün bulunamadı: ${item.productId}`);
      }

      let unitPrice = Number(product.price);
      const lensType = item.lensTypeId ? lensTypeById.get(item.lensTypeId) : undefined;
      const lensCoating = item.lensCoatingId ? lensCoatingById.get(item.lensCoatingId) : undefined;

      if (product.requiresPrescription) {
        if (lensType) unitPrice += Number(lensType.priceModifier);
        if (lensCoating) unitPrice += Number(lensCoating.priceModifier);
      }

      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        lensTypeId: product.requiresPrescription ? lensType?.id : undefined,
        lensCoatingId: product.requiresPrescription ? lensCoating?.id : undefined,
        prescriptionOdSphere: product.requiresPrescription ? item.prescriptionOdSphere : undefined,
        prescriptionOsSphere: product.requiresPrescription ? item.prescriptionOsSphere : undefined,
        prescriptionNotes: product.requiresPrescription ? item.prescriptionNotes : undefined,
      });
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const orderNumber = `ARS${Math.floor(100_000 + Math.random() * 900_000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: { userId, title: 'Sipariş Adresi', ...dto.address },
      });

      return tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: address.id,
          subtotal,
          shipping,
          total,
          items: { createMany: { data: orderItemsData } },
          payment: {
            create: { amount: total, status: PaymentStatus.PENDING },
          },
        },
        include: { items: true, payment: true, address: true },
      });
    });

    const chargeResult = await this.paymentProvider.charge({
      orderNumber: order.orderNumber,
      amount: total,
      cardNumber: dto.card.cardNumber,
    });

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: chargeResult.status === 'PAID' ? OrderStatus.HAZIRLANIYOR : OrderStatus.IPTAL,
        payment: {
          update: {
            status: chargeResult.status === 'PAID' ? PaymentStatus.PAID : PaymentStatus.FAILED,
            providerRef: chargeResult.providerRef,
          },
        },
      },
      include: { items: true, payment: true, address: true },
    });

    if (chargeResult.status === 'FAILED') {
      throw new BadRequestException('Ödeme reddedildi. Lütfen kart bilgilerinizi kontrol edin.');
    }

    return serializeOrder(updated);
  }

  async findAllForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payment: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializeOrder);
  }

  async findOneForUser(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: { items: true, payment: true, address: true },
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return serializeOrder(order);
  }
}
