import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { CYLINDER_OPTIONS, PD_OPTIONS, SPHERE_OPTIONS, displayPower } from "@/lib/prescription";
import type { PrescriptionInfo } from "@/types";

interface PrescriptionFormProps {
  value: PrescriptionInfo;
  onChange: (value: PrescriptionInfo) => void;
  /** Keyed by the .NET error paths, e.g. "rightEye.axis". */
  fieldErrors?: Record<string, string[]>;
}

type EyeKey = "od" | "os";

const EYES: { key: EyeKey; path: "rightEye" | "leftEye"; label: string; short: string }[] = [
  { key: "od", path: "rightEye", label: "Sağ Göz", short: "OD" },
  { key: "os", path: "leftEye", label: "Sol Göz", short: "OS" },
];

const CYLINDER_CHOICES = CYLINDER_OPTIONS.filter((option) => option !== "0.00");

const controlClass =
  "mt-1 h-10 w-full rounded-lg border bg-white px-2.5 text-sm text-ink-800 transition-colors duration-150 hover:border-ink-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-300";

export function PrescriptionForm({ value, onChange, fieldErrors = {} }: PrescriptionFormProps) {
  function update(field: keyof PrescriptionInfo) {
    return (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const next = { ...value, [field]: event.target.value };
      // Clearing the cylinder clears its axis, which would otherwise linger invisibly.
      if (field === "odCylinder" && !event.target.value) next.odAxis = "";
      if (field === "osCylinder" && !event.target.value) next.osAxis = "";
      onChange(next);
    };
  }

  const pdError = fieldErrors.pupillaryDistance?.[0];

  return (
    <fieldset className="rounded-xl border border-ink-200 p-4">
      {/* Floated so the legend sits inside the box like the page's other section headings. */}
      <legend className="float-left mb-1 w-full font-display text-sm font-medium text-ink-900">Reçete Bilgisi</legend>
      <p className="clear-both mb-4 text-xs leading-relaxed text-ink-500">
        Değerleri reçetenizde yazdığı gibi seçin. Silindir (CYL) yoksa boş bırakın.
      </p>

      <div className="flex flex-col gap-4">
        {EYES.map((eye) => {
          const sphereField = `${eye.key}Sphere` as const;
          const cylinderField = `${eye.key}Cylinder` as const;
          const axisField = `${eye.key}Axis` as const;
          const errors = [
            fieldErrors[`${eye.path}.sphere`]?.[0],
            fieldErrors[`${eye.path}.cylinder`]?.[0],
            fieldErrors[`${eye.path}.axis`]?.[0],
          ].filter(Boolean);
          const errorId = `rx-${eye.key}-error`;

          return (
            <div key={eye.key}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                {eye.label} <span className="font-normal text-ink-400">({eye.short})</span>
              </p>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <label className="text-xs text-ink-500">
                  SPH
                  <select
                    value={value[sphereField] ?? ""}
                    onChange={update(sphereField)}
                    aria-invalid={Boolean(fieldErrors[`${eye.path}.sphere`])}
                    aria-describedby={errors.length ? errorId : undefined}
                    className={cn(controlClass, fieldErrors[`${eye.path}.sphere`] ? "border-bronze-500" : "border-ink-200")}
                  >
                    <option value="">Seçin</option>
                    {SPHERE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {displayPower(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-ink-500">
                  CYL
                  <select
                    value={value[cylinderField] ?? ""}
                    onChange={update(cylinderField)}
                    aria-invalid={Boolean(fieldErrors[`${eye.path}.cylinder`])}
                    aria-describedby={errors.length ? errorId : undefined}
                    className={cn(controlClass, fieldErrors[`${eye.path}.cylinder`] ? "border-bronze-500" : "border-ink-200")}
                  >
                    <option value="">Yok</option>
                    {CYLINDER_CHOICES.map((option) => (
                      <option key={option} value={option}>
                        {displayPower(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-ink-500">
                  AKS (°)
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={180}
                    step={1}
                    placeholder={value[cylinderField] ? "1–180" : "—"}
                    disabled={!value[cylinderField]}
                    value={value[axisField] ?? ""}
                    onChange={update(axisField)}
                    aria-invalid={Boolean(fieldErrors[`${eye.path}.axis`])}
                    aria-describedby={errors.length ? errorId : undefined}
                    className={cn(controlClass, fieldErrors[`${eye.path}.axis`] ? "border-bronze-500" : "border-ink-200")}
                  />
                </label>
              </div>
              {errors.length > 0 && (
                <p id={errorId} role="alert" className="mt-1.5 text-xs text-bronze-600">
                  {errors[0]}
                </p>
              )}
            </div>
          );
        })}

        <label className="text-xs text-ink-500 sm:max-w-[calc(33.333%-0.333rem)]">
          PD (mm) <span className="text-ink-400">— opsiyonel</span>
          <select
            value={value.pupillaryDistance ?? ""}
            onChange={update("pupillaryDistance")}
            aria-invalid={Boolean(pdError)}
            aria-describedby={pdError ? "rx-pd-error" : undefined}
            className={cn(controlClass, pdError ? "border-bronze-500" : "border-ink-200")}
          >
            <option value="">Bilmiyorum</option>
            {PD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(".", ",")}
              </option>
            ))}
          </select>
          {pdError && (
            <span id="rx-pd-error" role="alert" className="mt-1.5 block text-bronze-600">
              {pdError}
            </span>
          )}
        </label>
      </div>
    </fieldset>
  );
}
