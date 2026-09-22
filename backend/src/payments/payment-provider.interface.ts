export interface ChargeInput {
  orderNumber: string;
  amount: number;
  cardNumber: string;
}

export interface ChargeResult {
  status: 'PAID' | 'FAILED';
  providerRef: string;
}

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
