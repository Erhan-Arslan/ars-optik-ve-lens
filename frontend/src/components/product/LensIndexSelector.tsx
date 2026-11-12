import { cn, formatPrice } from "@/lib/utils";
import type { LensIndex, LensIndexEstimate } from "@/types";

interface LensIndexSelectorProps {
  lensIndexes: LensIndex[];
  selectedId?: string;
  onSelect: (lensIndex: LensIndex) => void;
  /** Per-index thickness from the .NET analysis; absent until a prescription is analysed. */
  estimates?: LensIndexEstimate[];
  isStale?: boolean;
}

export function LensIndexSelector({ lensIndexes, selectedId, onSelect, estimates, isStale }: LensIndexSelectorProps) {
  const estimateByCode = new Map(estimates?.map((e) => [e.code, e]));
  const thickest = Math.max(...(estimates?.map((e) => e.maxThicknessMm) ?? [0]));

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {lensIndexes.map((lensIndex) => {
        const estimate = estimateByCode.get(lensIndex.code);
        const selected = selectedId === lensIndex.id;

        return (
          <button
            key={lensIndex.id}
            type="button"
            onClick={() => onSelect(lensIndex)}
            aria-pressed={selected}
            className={cn(
              "relative rounded-xl border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
              selected ? "border-gold-500 bg-gold-50" : "border-ink-200 hover:border-ink-300",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-ink-900">{lensIndex.name}</p>
              {estimate?.isRecommended && (
                <span className="flex-none rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
                  Önerilen
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-500">
              {lensIndex.priceModifier > 0 ? `+${formatPrice(lensIndex.priceModifier)}` : "Ücretsiz"}
            </p>

            {estimate ? (
              <div className={cn("mt-2.5 transition-opacity duration-200", isStale && "opacity-50")}>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                  <div
                    className={cn(
                      "h-full origin-left rounded-full transition-transform duration-500 ease-out",
                      estimate.isRecommended ? "bg-gold-500" : "bg-ink-300",
                    )}
                    style={{ transform: `scaleX(${thickest > 0 ? estimate.maxThicknessMm / thickest : 0})` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-500">
                  Tahmini en kalın nokta ≈ {estimate.maxThicknessMm.toLocaleString("tr-TR")} mm
                </p>
              </div>
            ) : (
              <p className="mt-2.5 text-[11px] leading-snug text-ink-400">{lensIndex.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
