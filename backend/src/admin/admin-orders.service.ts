import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SLUG_TO_ORDER_STATUS, serializeOrder } from '../orders/order.mapper.js';
import type { OrderStatusSlug } from './dto/update-order-status.dto.js';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        items: true,
        payment: true,
        address: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializeOrder);
  }

  async updateStatus(id: string, status: OrderStatusSlug) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: SLUG_TO_ORDER_STATUS[status] },
      include: {
        items: true,
        payment: true,
        address: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    return serializeOrder(updated);
  }
}
