import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ChargeInput, ChargeResult, PaymentProvider } from './payment-provider.interface.js';

/**
 * Sandbox ödeme sağlayıcısı. `PaymentProvider` arayüzünü uygular; gerçek bir
 * entegrasyon (iyzico, PayTR, Stripe) eklenirken sadece bu sınıfın yerine
 * yenisi `PaymentsModule`de bağlanır, geri kalan kod değişmez.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  async charge(input: ChargeInput): Promise<ChargeResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cardEndsInFailureDigit = input.cardNumber.replace(/\s/g, '').endsWith('0000');
    if (cardEndsInFailureDigit) {
      this.logger.warn(`Ödeme reddedildi — sipariş ${input.orderNumber}`);
      return { status: 'FAILED', providerRef: `mock_fail_${randomUUID()}` };
    }

    this.logger.log(`Ödeme onaylandı — sipariş ${input.orderNumber}, tutar ${input.amount}₺`);
    return { status: 'PAID', providerRef: `mock_${randomUUID()}` };
  }
}
