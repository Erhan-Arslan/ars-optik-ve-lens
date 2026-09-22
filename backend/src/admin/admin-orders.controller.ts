import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Tüm siparişleri listeler' })
  findAll() {
    return this.adminOrdersService.findAll();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Sipariş durumunu günceller' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminOrdersService.updateStatus(id, dto.status);
  }
}
