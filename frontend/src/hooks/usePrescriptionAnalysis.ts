import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { analyzePrescription, PrescriptionValidationError, type PrescriptionFieldErrors } from "@/services/prescriptions.service";
import { localPrescriptionErrors, toAnalysisInput } from "@/lib/prescription";
import type { PrescriptionAnalysis, PrescriptionInfo } from "@/types";

type SettledState =
  | { status: "ready"; analysis: PrescriptionAnalysis }
  | { status: "invalid"; fieldErrors: PrescriptionFieldErrors }
  | { status: "unavailable" };

export type PrescriptionAnalysisState =
  | { status: "incomplete" }
  | { status: "loading"; previous?: PrescriptionAnalysis }
  | SettledState;

const DEBOUNCE_MS = 400;

/**
 * Re-analyses the prescription with the .NET service as the user edits it. Requests are debounced
 * and the in-flight one is aborted when the input changes, so only the latest answer lands.
 */
export function usePrescriptionAnalysis(prescription: PrescriptionInfo, enabled: boolean): PrescriptionAnalysisState {
  const localErrors = useMemo(() => localPrescriptionErrors(prescription), [prescription]);
  const input = useMemo(() => toAnalysisInput(prescription), [prescription]);
  const hasLocalErrors = Object.keys(localErrors).length > 0;
  const requestKey = enabled && input && !hasLocalErrors ? JSON.stringify(input) : null;

  // Each result remembers which input produced it, so a stale answer is never shown as current.
  const [settled, setSettled] = useState<{ key: string; state: SettledState } | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<PrescriptionAnalysis>();

  useEffect(() => {
    if (requestKey === null) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      analyzePrescription(JSON.parse(requestKey), controller.signal)
        .then((analysis) => {
          setLastAnalysis(analysis);
          setSettled({ key: requestKey, state: { status: "ready", analysis } });
        })
        .catch((error: unknown) => {
          if (axios.isCancel(error)) return;
          setSettled({
            key: requestKey,
            state:
              error instanceof PrescriptionValidationError
                ? { status: "invalid", fieldErrors: error.fieldErrors }
                : { status: "unavailable" },
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey]);

  if (hasLocalErrors) {
    return {
      status: "invalid",
      fieldErrors: Object.fromEntries(Object.entries(localErrors).map(([field, message]) => [field, [message]])),
    };
  }
  if (requestKey === null) return { status: "incomplete" };
  if (settled?.key === requestKey) return settled.state;
  return { status: "loading", previous: lastAnalysis };
}
