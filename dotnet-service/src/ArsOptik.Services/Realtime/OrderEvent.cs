namespace ArsOptik.Services.Realtime;

/// <summary>
/// An order change published by the NestJS backend. It is a notification, not the record:
/// admin clients refetch the order list from NestJS, which stays the source of truth.
/// </summary>
public sealed record OrderEvent(
    string Type,
    string OrderId,
    string OrderNumber,
    string Status,
    decimal Total,
    int ItemCount,
    string CustomerName,
    DateTimeOffset OccurredAt)
{
    public const string Created = "order.created";
    public const string StatusChanged = "order.statusChanged";

    public bool IsValid =>
        Type is Created or StatusChanged
        && !string.IsNullOrWhiteSpace(OrderId)
        && !string.IsNullOrWhiteSpace(OrderNumber)
        && !string.IsNullOrWhiteSpace(Status)
        && Total >= 0
        && ItemCount >= 0;
}
