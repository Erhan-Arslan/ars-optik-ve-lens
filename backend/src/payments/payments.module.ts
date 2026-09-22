import { Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment-provider.interface.js';
import { MockPaymentProvider } from './mock-payment.provider.js';

@Module({
  providers: [{ provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
