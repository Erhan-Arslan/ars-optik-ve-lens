import type { PrescriptionAnalysisInput, PrescriptionInfo } from "@/types";

/** Builds the 0.25 D option list as written on Turkish prescriptions: "+1,25", "0,00", "-2,50". */
function powerOptions(max: number): string[] {
  const options: string[] = [];
  for (let quarter = max * 4; quarter >= -max * 4; quarter--) {
    options.push(formatPowerValue(quarter / 4));
  }
  return options;
}

/** Values stored and sent to the APIs use a dot decimal ("-1.25"), matching the NestJS DTO. */
export function formatPowerValue(power: number): string {
  const fixed = power.toFixed(2);
  return power > 0 ? `+${fixed}` : fixed;
}

export function displayPower(value: string): string {
  return value.replace(".", ",");
}

export const SPHERE_OPTIONS = powerOptions(20);
export const CYLINDER_OPTIONS = powerOptions(6);
export const PD_OPTIONS = Array.from({ length: 61 }, (_, i) => (50 + i * 0.5).toFixed(1));

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export interface PrescriptionNumbers {
  odSphere?: number;
  osSphere?: number;
  odCylinder?: number;
  osCylinder?: number;
  odAxis?: number;
  osAxis?: number;
  pupillaryDistance?: number;
}

export function prescriptionNumbers(p: PrescriptionInfo | undefined): PrescriptionNumbers {
  const odCylinder = toNumber(p?.odCylinder);
  const osCylinder = toNumber(p?.osCylinder);
  return {
    odSphere: toNumber(p?.odSphere),
    osSphere: toNumber(p?.osSphere),
    odCylinder: odCylinder || undefined,
    osCylinder: osCylinder || undefined,
    // An axis without a cylinder is meaningless; drop it so the APIs do not store noise.
    odAxis: odCylinder ? toNumber(p?.odAxis) : undefined,
    osAxis: osCylinder ? toNumber(p?.osAxis) : undefined,
    pupillaryDistance: toNumber(p?.pupillaryDistance),
  };
}

/** Field errors the form can show before any API call. Keys match the .NET error paths. */
export function localPrescriptionErrors(p: PrescriptionInfo): Record<string, string> {
  const errors: Record<string, string> = {};
  const n = prescriptionNumbers(p);
  const axisError = (axis: string | undefined) => {
    const value = toNumber(axis);
    return value === undefined || !Number.isInteger(value) || value < 1 || value > 180;
  };
  if (n.odCylinder && axisError(p.odAxis)) errors["rightEye.axis"] = "Silindir için 1–180 arası aks girin.";
  if (n.osCylinder && axisError(p.osAxis)) errors["leftEye.axis"] = "Silindir için 1–180 arası aks girin.";
  return errors;
}

/** Null until both spheres are chosen; the analysis needs at least that much. */
export function toAnalysisInput(p: PrescriptionInfo): PrescriptionAnalysisInput | null {
  const n = prescriptionNumbers(p);
  if (n.odSphere === undefined || n.osSphere === undefined) return null;
  return {
    rightEye: { sphere: n.odSphere, cylinder: n.odCylinder, axis: n.odAxis },
    leftEye: { sphere: n.osSphere, cylinder: n.osCylinder, axis: n.osAxis },
    pupillaryDistance: n.pupillaryDistance,
  };
}

/** Stable identity of a prescription, so cart lines with different prescriptions stay separate. */
export function prescriptionKey(p: PrescriptionInfo | undefined): string {
  if (!p) return "none";
  const n = prescriptionNumbers(p);
  return [n.odSphere, n.odCylinder, n.odAxis, n.osSphere, n.osCylinder, n.osAxis, n.pupillaryDistance]
    .map((v) => v ?? "")
    .join("|");
}
