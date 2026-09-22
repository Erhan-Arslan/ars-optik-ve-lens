import type { ReactNode } from "react";
import type { Gender, ProductCategory } from "@/types";
import { cn } from "@/lib/utils";

export interface FilterState {
  category: ProductCategory | "all";
  gender: Gender | "all";
  maxPrice: number;
  sort: "onerilen" | "artan-fiyat" | "azalan-fiyat" | "yeni";
}

const categoryOptions: { value: FilterState["category"]; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "cerceve", label: "Çerçeveler" },
  { value: "gunes-gozlugu", label: "Güneş Gözlükleri" },
  { value: "lens", label: "Lensler" },
];

const genderOptions: { value: FilterState["gender"]; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "kadin", label: "Kadın" },
  { value: "erkek", label: "Erkek" },
  { value: "unisex", label: "Unisex" },
];

const PRICE_MAX = 4000;

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-8">
      <FilterGroup title="Kategori">
        <div className="flex flex-col gap-1">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, category: opt.value })}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                filters.category === opt.value
                  ? "bg-gold-100 font-semibold text-bronze-700"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Cinsiyet">
        <div className="flex flex-wrap gap-2">
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={filters.gender === opt.value}
              onClick={() => onChange({ ...filters, gender: opt.value })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
                filters.gender === opt.value
                  ? "border-bronze-500 bg-bronze-500 text-white"
                  : "border-ink-200 text-ink-600 hover:border-bronze-400",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Maksimum Fiyat">
        <input
          type="range"
          min={500}
          max={PRICE_MAX}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-gold-500"
          aria-label="Maksimum fiyat"
        />
        <div className="mt-1.5 flex justify-between text-xs text-ink-500">
          <span>500₺</span>
          <span className="font-semibold text-ink-800">{filters.maxPrice}₺</span>
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-medium text-ink-900">{title}</h3>
      {children}
    </div>
  );
}
