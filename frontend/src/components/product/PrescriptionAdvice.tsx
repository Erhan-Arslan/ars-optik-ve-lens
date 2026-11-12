import { AlertTriangle, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrescriptionAnalysisState } from "@/hooks/usePrescriptionAnalysis";
import type { LensIndex } from "@/types";

interface PrescriptionAdviceProps {
  state: PrescriptionAnalysisState;
  recommended?: LensIndex;
  isRecommendedSelected: boolean;
  onApply: () => void;
}

/** Status line + recommendation from the .NET analysis, shown above the lens index cards. */
export function PrescriptionAdvice({ state, recommended, isRecommendedSelected, onApply }: PrescriptionAdviceProps) {
  if (state.status === "incomplete") {
    return <Hint>Size özel incelik önerisi için iki gözün SPH değerini seçin.</Hint>;
  }
  if (state.status === "invalid") {
    return <Hint>Öneri için reçetedeki işaretli alanları düzeltin.</Hint>;
  }
  if (state.status === "unavailable") {
    return <Hint>Öneri servisi şu an yanıt vermiyor. İnceliği kendiniz seçerek siparişe devam edebilirsiniz.</Hint>;
  }

  const analysis = state.status === "ready" ? state.analysis : state.previous;
  if (!analysis) {
    return (
      <p className="flex items-center gap-2 text-xs text-ink-500" role="status">
        <Loader2 size={14} className="animate-spin text-bronze-500" aria-hidden="true" />
        Reçeteniz analiz ediliyor…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" aria-live="polite">
      <div
        className={cn(
          "rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-champagne-50 p-3.5 transition-opacity duration-200",
          state.status === "loading" && "opacity-60",
        )}
      >
        <div className="flex items-start gap-2.5">
          {state.status === "loading" ? (
            <Loader2 size={16} className="mt-0.5 flex-none animate-spin text-bronze-500" aria-hidden="true" />
          ) : (
            <Sparkles size={16} className="mt-0.5 flex-none text-bronze-500" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">
              Önerimiz: {recommended?.name ?? analysis.recommendedLensIndexCode}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">{analysis.recommendationReason}</p>
            {recommended && !isRecommendedSelected && (
              <button
                type="button"
                onClick={onApply}
                className="mt-2.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-medium text-champagne-100 transition-[background-color,transform] duration-150 hover:bg-ink-800 active:scale-[0.97] active:bg-ink-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
              >
                Öneriyi uygula
              </button>
            )}
          </div>
        </div>
      </div>

      {analysis.advisories.map((advisory) => (
        <p
          key={advisory.code}
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed",
            advisory.level === "warning" ? "bg-bronze-50 text-bronze-700" : "bg-ink-50 text-ink-600",
          )}
        >
          {advisory.level === "warning" ? (
            <AlertTriangle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          ) : (
            <Info size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          )}
          {advisory.message}
        </p>
      ))}
    </div>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
      <Info size={14} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
      {children}
    </p>
  );
}
