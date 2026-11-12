import axios from "axios";
import { dotnetApi } from "@/lib/dotnetApi";
import type { PrescriptionAnalysis, PrescriptionAnalysisInput } from "@/types";

export type PrescriptionFieldErrors = Record<string, string[]>;

export class PrescriptionValidationError extends Error {
  readonly fieldErrors: PrescriptionFieldErrors;

  constructor(fieldErrors: PrescriptionFieldErrors) {
    super("Reçete değerleri geçersiz.");
    this.fieldErrors = fieldErrors;
  }
}

export async function analyzePrescription(
  input: PrescriptionAnalysisInput,
  signal?: AbortSignal,
): Promise<PrescriptionAnalysis> {
  try {
    const { data } = await dotnetApi.post<PrescriptionAnalysis>("/prescriptions/analyze", input, { signal });
    return data;
  } catch (error) {
    // ASP.NET ValidationProblem: { errors: { "rightEye.sphere": ["..."] } }
    if (axios.isAxiosError<{ errors?: PrescriptionFieldErrors }>(error) && error.response?.status === 400) {
      throw new PrescriptionValidationError(error.response.data?.errors ?? {});
    }
    throw error;
  }
}
