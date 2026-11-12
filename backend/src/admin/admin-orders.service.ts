import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SLUG_TO_ORDER_STATUS, serializeOrder } from '../orders/order.mapper.js';
import type { OrderStatusSlug } from './dto/update-order-status.dto.js';

// Admins need readable lens choices next to the prescription to hand the order to the lab.
const ADMIN_ORDER_INCLUDE = {
  items: {
    include: {
      lensType: { select: { name: true } },
      lensCoating: { select: { name: true } },
      lensIndex: { select: { name: true, code: true } },
    },
  },
  payment: true,
  address: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: ADMIN_ORDER_INCLUDE,
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
      include: ADMIN_ORDER_INCLUDE,
    });
    return serializeOrder(updated);
  }
}
