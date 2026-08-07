"use client";

import { useEffect, useRef, useState } from "react";
import { referenceApi } from "@/lib/api";
import { PRICE_TIER_LABELS, SORT_LABELS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Area, BusinessSearchParams, Category, City, PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { Select } from "./ui/field";
import { MobileFilters } from "./business-filters-mobile";
import { TabletFilters } from "./business-filters-tablet";

export interface DropdownOption<T> {
  value: T | undefined;
  label: string;
}

// A single-select popover pill: shows "Label" when nothing is chosen and
// "Label: <choice>" once it is, so the active filter stays visible without
// needing a whole row of chips. Used by the desktop primary card and the
// tablet "Filters" popover.
export function FilterDropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  highlightWhenSet = true,
}: {
  label: string;
  value: T | undefined;
  options: DropdownOption<T>[];
  onChange: (value: T | undefined) => void;
  /** Sort isn't a filter (it doesn't narrow results), so it stays neutrally
   * styled even once a non-default value is picked, unlike Price/Rating. */
  highlightWhenSet?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasValue = value !== undefined;
  const active = highlightWhenSet && hasValue;
  const activeLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-10 inline-flex items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors whitespace-nowrap",
          active
            ? "border-crimson-300 bg-crimson-50 text-crimson-700"
            : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
        )}
      >
        {hasValue ? `${label}: ${activeLabel}` : label}
        <svg
          viewBox="0 0 20 20"
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 min-w-[190px] rounded-xl border border-ink-100 bg-white p-1.5 shadow-pop">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                opt.value === value ? "bg-crimson-50 text-crimson-700 font-medium" : "text-ink-700 hover:bg-ink-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// A single option pill for the mobile bottom sheet / tablet popover, where
// choices are laid out flat instead of behind a popover trigger.
export function FilterOptionPill<T extends string | number>({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-crimson-600 border-crimson-600 text-white"
          : "bg-white border-ink-200 text-ink-700 hover:border-crimson-300 hover:text-crimson-700"
      )}
    >
      {children}
    </button>
  );
}

// Every control in the primary search row shares this height so selects and the
// "Near me" button line up pixel-for-pixel regardless of native rendering differences.
export const searchRowControl = "h-10 rounded-full px-4";

export const PRICE_OPTIONS: DropdownOption<PriceTier>[] = [
  { value: undefined, label: "Any price" },
  ...(Object.entries(PRICE_TIER_LABELS) as [PriceTier, string][]).map(([value, label]) => ({ value, label })),
];

export const RATING_OPTIONS: DropdownOption<number>[] = [
  { value: undefined, label: "Any rating" },
  { value: 4.5, label: "4.5+ ★" },
  { value: 4, label: "4+ ★" },
  { value: 3.5, label: "3.5+ ★" },
  { value: 3, label: "3+ ★" },
];

export const SORT_OPTIONS: DropdownOption<SortOption>[] = (Object.entries(SORT_LABELS) as [SortOption, string][]).map(
  ([value, label]) => ({ value, label })
);

export interface FiltersProps {
  value: BusinessSearchParams;
  onChange: (next: BusinessSearchParams) => void;
  onUseMyLocation: () => void;
  locationStatus: "idle" | "locating" | "granted" | "denied";
  /** Scrolls to the results grid — used by the mobile primary "Search" button
   * (search itself is already live/reactive; this just gets the user there). */
  onSearch: () => void;
}

export interface LocationData {
  categories: Category[];
  cities: City[];
  areas: Area[];
  cityId: string;
  setCityId: (id: string) => void;
}

function DesktopFilters({ value, onChange, onUseMyLocation, locationStatus, categories, cities, areas, cityId, setCityId }: FiltersProps & LocationData) {
  function set<K extends keyof BusinessSearchParams>(key: K, val: BusinessSearchParams[K]) {
    onChange({ ...value, [key]: val, page: 0 });
  }

  return (
    <div className="space-y-4">
      {/* Primary controls: where and what to search */}
      <div className="flex flex-wrap gap-3">
        <Select
          className={cn(searchRowControl, "w-auto flex-1 min-w-[160px]")}
          value={value.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value || undefined)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          className={cn(searchRowControl, "w-auto flex-1 min-w-[140px]")}
          value={cityId}
          onChange={(e) => { setCityId(e.target.value); set("areaId", undefined); }}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          className={cn(searchRowControl, "w-auto flex-1 min-w-[140px]")}
          value={value.areaId ?? ""}
          onChange={(e) => set("areaId", e.target.value || undefined)}
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={onUseMyLocation}
          loading={locationStatus === "locating"}
          className={searchRowControl}
        >
          📍 {locationStatus === "granted" ? "Using your location" : "Near me"}
        </Button>
      </div>

      {/* Refine controls: a quiet second tier, one pill per filter */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3.5 border-t border-ink-100">
        <FilterDropdown label="Price" value={value.priceTier} options={PRICE_OPTIONS} onChange={(v) => set("priceTier", v)} />
        <FilterDropdown label="Rating" value={value.minRating} options={RATING_OPTIONS} onChange={(v) => set("minRating", v)} />

        <div className="ml-auto">
          <FilterDropdown
            label="Sort"
            value={value.sort ?? "newest"}
            options={SORT_OPTIONS}
            onChange={(v) => set("sort", v ?? "newest")}
            highlightWhenSet={false}
          />
        </div>
      </div>

      {locationStatus === "denied" && (
        <p className="text-xs text-ink-600">Location permission denied — filter by area instead.</p>
      )}
    </div>
  );
}

export function BusinessFilters(props: FiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cityId, setCityId] = useState<string>("");

  useEffect(() => {
    referenceApi.categories().then(setCategories).catch(() => {});
    referenceApi.cities().then((list) => {
      setCities(list);
      if (list.length > 0) setCityId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    referenceApi.areas(cityId).then(setAreas).catch(() => {});
  }, [cityId]);

  const locationData: LocationData = { categories, cities, areas, cityId, setCityId };

  return (
    <>
      <div className="md:hidden">
        <MobileFilters {...props} {...locationData} />
      </div>
      <div className="hidden md:block lg:hidden">
        <TabletFilters {...props} {...locationData} />
      </div>
      <div className="hidden lg:block">
        <DesktopFilters {...props} {...locationData} />
      </div>
    </>
  );
}
