import { displayPower, formatPowerValue } from "@/lib/prescription";
import { formatPrice } from "@/lib/utils";
import { InvoiceDownloadButton } from "@/components/orders/InvoiceDownloadButton";
import type { AdminOrderItem } from "@/types";

function power(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return displayPower(typeof value === "number" ? formatPowerValue(value) : value);
}

function hasPrescription(item: AdminOrderItem): boolean {
  return [
    item.prescriptionOdSphere,
    item.prescriptionOsSphere,
    item.prescriptionOdCylinder,
    item.prescriptionOsCylinder,
    item.prescriptionPupillaryDistance,
  ].some((value) => value !== null && value !== undefined && value !== "");
}

/** Everything the lab needs per line: lens choices and the full prescription. */
export function OrderItemsDetail({ orderNumber, items }: { orderNumber: string; items: AdminOrderItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <InvoiceDownloadButton orderNumber={orderNumber} />
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const lensChoices = [item.lensType?.name, item.lensCoating?.name, item.lensIndex?.name].filter(Boolean);
          return (
            <li key={item.id} className="rounded-xl border border-ink-100 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-ink-900">
                  {item.productNameSnapshot} <span className="font-normal text-ink-500">× {item.quantity}</span>
                </p>
                <span className="text-ink-700">{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-500">
                {[item.selectedColor, ...lensChoices].join(" · ")}
              </p>

              {hasPrescription(item) && (
                <div className="mt-3 overflow-x-auto">
                  <table className="text-xs text-ink-700">
                    <caption className="sr-only">Reçete</caption>
                    <thead className="text-ink-400">
                      <tr>
                        <th scope="col" className="pr-4 text-left font-medium">Göz</th>
                        <th scope="col" className="pr-4 text-left font-medium">SPH</th>
                        <th scope="col" className="pr-4 text-left font-medium">CYL</th>
                        <th scope="col" className="pr-4 text-left font-medium">AKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row" className="pr-4 text-left font-medium">Sağ (OD)</th>
                        <td className="pr-4">{power(item.prescriptionOdSphere)}</td>
                        <td className="pr-4">{power(item.prescriptionOdCylinder)}</td>
                        <td className="pr-4">{item.prescriptionOdAxis ?? "—"}</td>
                      </tr>
                      <tr>
                        <th scope="row" className="pr-4 text-left font-medium">Sol (OS)</th>
                        <td className="pr-4">{power(item.prescriptionOsSphere)}</td>
                        <td className="pr-4">{power(item.prescriptionOsCylinder)}</td>
                        <td className="pr-4">{item.prescriptionOsAxis ?? "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-1.5 text-xs text-ink-500">
                    PD: {item.prescriptionPupillaryDistance ? `${item.prescriptionPupillaryDistance.toLocaleString("tr-TR")} mm` : "belirtilmedi"}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
