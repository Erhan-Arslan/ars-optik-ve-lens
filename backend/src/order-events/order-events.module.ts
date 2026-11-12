import { Module } from '@nestjs/common';
import { OrderEventsPublisher } from './order-events.publisher.js';

@Module({
  providers: [OrderEventsPublisher],
  exports: [OrderEventsPublisher],
})
export class OrderEventsModule {}
