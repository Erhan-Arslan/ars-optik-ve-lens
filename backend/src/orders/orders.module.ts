import { Module } from '@nestjs/common';
import { OrderEventsModule } from '../order-events/order-events.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [PaymentsModule, OrderEventsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
