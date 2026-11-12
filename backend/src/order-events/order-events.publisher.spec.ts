import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOrderEvent, OrderEventsPublisher } from './order-events.publisher.js';

const event = buildOrderEvent(
  'order.created',
  { id: 'order-1', orderNumber: 'ARS123456', status: 'hazirlaniyor', total: 5800, items: [{}, {}] },
  { firstName: 'Ayşe', lastName: 'Yılmaz' },
);

function publisher(env: Record<string, string | undefined>) {
  return new OrderEventsPublisher(new ConfigService(env));
}

// publish() is fire-and-forget; let the pending fetch promise settle.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OrderEventsPublisher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('builds the event the .NET service expects', () => {
    expect(event).toMatchObject({
      type: 'order.created',
      orderId: 'order-1',
      orderNumber: 'ARS123456',
      status: 'hazirlaniyor',
      total: 5800,
      itemCount: 2,
      customerName: 'Ayşe Yılmaz',
    });
    expect(Number.isNaN(Date.parse(event.occurredAt))).toBe(false);
  });

  it('posts the event with the shared key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    publisher({ DOTNET_SERVICE_URL: 'https://dotnet.example', INTERNAL_API_KEY: 'k'.repeat(32) }).publish(event);
    await flush();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://dotnet.example/internal/order-events');
    expect(init.headers).toMatchObject({ 'X-Internal-Api-Key': 'k'.repeat(32) });
    expect(JSON.parse(init.body as string)).toEqual(event);
  });

  it('does nothing when the .NET service is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    publisher({ INTERNAL_API_KEY: 'k'.repeat(32) }).publish(event);
    publisher({ DOTNET_SERVICE_URL: 'https://dotnet.example' }).publish(event);
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws when the .NET service is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    expect(() =>
      publisher({ DOTNET_SERVICE_URL: 'https://dotnet.example', INTERNAL_API_KEY: 'k'.repeat(32) }).publish(event),
    ).not.toThrow();
    await flush();
  });
});
