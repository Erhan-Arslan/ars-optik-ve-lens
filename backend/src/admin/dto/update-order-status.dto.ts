import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ORDER_STATUS_SLUGS } from '../../orders/dto/create-order.dto.js';

export type OrderStatusSlug = (typeof ORDER_STATUS_SLUGS)[number];

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUS_SLUGS })
  @IsIn(ORDER_STATUS_SLUGS)
  status!: OrderStatusSlug;
}
