import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminOrdersService } from './admin-orders.service.js';

@Module({
  controllers: [AdminProductsController, AdminOrdersController],
  providers: [AdminProductsService, AdminOrdersService],
})
export class AdminModule {}
