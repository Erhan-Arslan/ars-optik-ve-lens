import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type OrderEventType = 'order.created' | 'order.statusChanged';

/** Shape expected by the .NET service's POST /internal/order-events. */
export interface OrderEvent {
  type: OrderEventType;
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  customerName: string;
  occurredAt: string;
}

export function buildOrderEvent(
  type: OrderEventType,
  order: { id: string; orderNumber: string; status: string; total: number; items: unknown[] },
  customer: { firstName: string; lastName: string },
): OrderEvent {
  return {
    type,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    itemCount: order.items.length,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    occurredAt: new Date().toISOString(),
  };
}

// Render's free .NET instance can take ~50 s to wake from sleep.
const REQUEST_TIMEOUT_MS = 70_000;

/**
 * Pushes order events to the .NET service, which relays them to admins over SignalR.
 * Live updates are a convenience: publishing never throws and never delays the order request,
 * and is a no-op unless DOTNET_SERVICE_URL and INTERNAL_API_KEY are both configured.
 */
@Injectable()
export class OrderEventsPublisher {
  private readonly logger = new Logger(OrderEventsPublisher.name);
  private readonly endpoint?: string;
  private readonly apiKey?: string;

  constructor(config: ConfigService) {
    const baseUrl = config.get<string>('DOTNET_SERVICE_URL');
    const apiKey = config.get<string>('INTERNAL_API_KEY');
    if (baseUrl && apiKey) {
      this.endpoint = new URL('/internal/order-events', baseUrl).toString();
      this.apiKey = apiKey;
    }
  }

  publish(event: OrderEvent): void {
    if (!this.endpoint || !this.apiKey) return;
    void this.send(this.endpoint, this.apiKey, event);
  }

  private async send(endpoint: string, apiKey: string, event: OrderEvent): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Api-Key': apiKey },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Order event ${event.type} for ${event.orderNumber} rejected: HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Order event ${event.type} for ${event.orderNumber} not delivered: ${String(error)}`);
    }
  }
}
