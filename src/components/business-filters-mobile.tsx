"use client";

import { useState } from "react";
import type { PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { Select } from "./ui/field";
import { BottomSheet } from "./ui/bottom-sheet";
import {
  FilterOptionPill,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  type FiltersProps,
  type LocationData,
} from "./business-filters";

function FiltersSheetContent({
  value,
  onChange,
  onUseMyLocation,
  locationStatus,
  onDone,
}: FiltersProps & { onDone: () => void }) {
  const [draftPrice, setDraftPrice] = useState<PriceTier | undefined>(value.priceTier);
  const [draftRating, setDraftRating] = useState<number | undefined>(value.minRating);
  const [draftSort, setDraftSort] = useState<SortOption>(value.sort ?? "newest");

  function apply() {
    onChange({ ...value, priceTier: draftPrice, minRating: draftRating, sort: draftSort, page: 0 });
    onDone();
  }

  function reset() {
    setDraftPrice(undefined);
    setDraftRating(undefined);
    setDraftSort("newest");
  }

  return (
    <div className="px-5 pb-5">
      <h2 id="mobile-filters-heading" className="font-display text-lg font-bold text-ink-900 pt-1 pb-4">
        Filters
      </h2>

      <button
        type="button"
        onClick={onUseMyLocation}
        className="w-full flex items-center gap-2.5 h-12 px-4 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 hover:border-crimson-300 hover:text-crimson-700 transition-colors"
      >
        📍 {locationStatus === "granted" ? "Using your location" : "Use my location"}
      </button>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Price</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map((opt) => (
            <FilterOptionPill key={opt.label} active={opt.value === draftPrice} onClick={() => setDraftPrice(opt.value)}>
              {opt.label}
            </FilterOptionPill>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Rating</p>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <FilterOptionPill key={opt.label} active={opt.value === draftRating} onClick={() => setDraftRating(opt.value)}>
              {opt.label}
            </FilterOptionPill>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Sort</p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <FilterOptionPill key={opt.label} active={opt.value === draftSort} onClick={() => opt.value && setDraftSort(opt.value)}>
              {opt.label}
            </FilterOptionPill>
          ))}
        </div>
      </div>

      <div className="mt-7 flex gap-3 sticky bottom-0 bg-white pt-3 -mx-5 px-5 border-t border-ink-100">
        <Button variant="outline" className="flex-1" onClick={reset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

export function MobileFilters({ value, onChange, onUseMyLocation, locationStatus, onSearch, categories, cities, areas, cityId, setCityId }: FiltersProps & LocationData) {
  const [sheetOpen, setSheetOpen] = useState(false);

  function set<K extends keyof typeof value>(key: K, val: (typeof value)[K]) {
    onChange({ ...value, [key]: val, page: 0 });
  }

  const activeRefineCount = [value.priceTier, value.minRating].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-2.5">
      <Select
        className="h-12 w-full rounded-xl text-base"
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
        className="h-12 w-full rounded-xl text-base"
        value={cityId}
        onChange={(e) => {
          setCityId(e.target.value);
          set("areaId", undefined);
        }}
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        className="h-12 w-full rounded-xl text-base"
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

      <div className="flex gap-2 pt-1">
        <Button className="flex-1 h-12 rounded-xl text-base" onClick={onSearch}>
          🔍 Search
        </Button>
        <Button
          variant="outline"
          className="relative h-12 rounded-xl px-4"
          onClick={() => setSheetOpen(true)}
        >
          Filters
          {activeRefineCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-crimson-600 text-white text-[11px] font-bold flex items-center justify-center">
              {activeRefineCount}
            </span>
          )}
        </Button>
      </div>

      {locationStatus === "denied" && (
        <p className="text-xs text-ink-600">Location permission denied — filter by area instead.</p>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} labelledBy="mobile-filters-heading">
        <FiltersSheetContent
          value={value}
          onChange={onChange}
          onUseMyLocation={onUseMyLocation}
          locationStatus={locationStatus}
          onSearch={onSearch}
          onDone={() => setSheetOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}
