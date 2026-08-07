"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { Select } from "./ui/field";
import {
  FilterOptionPill,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  searchRowControl,
  type FiltersProps,
  type LocationData,
} from "./business-filters";

function FiltersPopover({ value, onChange }: Pick<FiltersProps, "value" | "onChange">) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [draftPrice, setDraftPrice] = useState<PriceTier | undefined>(value.priceTier);
  const [draftRating, setDraftRating] = useState<number | undefined>(value.minRating);
  const [draftSort, setDraftSort] = useState<SortOption>(value.sort ?? "newest");

  useEffect(() => {
    if (!open) return;
    // Reflect current applied filters each time the popover is (re)opened.
    setDraftPrice(value.priceTier);
    setDraftRating(value.minRating);
    setDraftSort(value.sort ?? "newest");
  }, [open, value.priceTier, value.minRating, value.sort]);

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

  const activeCount = [value.priceTier, value.minRating].filter((v) => v !== undefined).length;

  function apply() {
    onChange({ ...value, priceTier: draftPrice, minRating: draftRating, sort: draftSort, page: 0 });
    setOpen(false);
  }

  function reset() {
    setDraftPrice(undefined);
    setDraftRating(undefined);
    setDraftSort("newest");
  }

  return (
    <div ref={rootRef} className="relative">
      <Button type="button" variant="outline" className={cn(searchRowControl, "relative")} onClick={() => setOpen((v) => !v)}>
        Filters
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-crimson-600 text-white text-[11px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[340px] rounded-2xl border border-ink-100 bg-white p-5 shadow-pop">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Price</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <FilterOptionPill key={opt.label} active={opt.value === draftPrice} onClick={() => setDraftPrice(opt.value)}>
                  {opt.label}
                </FilterOptionPill>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Rating</p>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((opt) => (
                <FilterOptionPill key={opt.label} active={opt.value === draftRating} onClick={() => setDraftRating(opt.value)}>
                  {opt.label}
                </FilterOptionPill>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2.5">Sort</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <FilterOptionPill key={opt.label} active={opt.value === draftSort} onClick={() => opt.value && setDraftSort(opt.value)}>
                  {opt.label}
                </FilterOptionPill>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Reset
            </Button>
            <Button className="flex-1" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TabletFilters({ value, onChange, onUseMyLocation, locationStatus, categories, cities, areas, cityId, setCityId }: FiltersProps & LocationData) {
  function set<K extends keyof typeof value>(key: K, val: (typeof value)[K]) {
    onChange({ ...value, [key]: val, page: 0 });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Select
          className={cn(searchRowControl, "w-auto flex-1 min-w-[150px]")}
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
          className={cn(searchRowControl, "w-auto flex-1 min-w-[130px]")}
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
          className={cn(searchRowControl, "w-auto flex-1 min-w-[130px]")}
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

        <Button type="button" variant="outline" onClick={onUseMyLocation} loading={locationStatus === "locating"} className={searchRowControl}>
          📍 {locationStatus === "granted" ? "Using your location" : "Near me"}
        </Button>

        <FiltersPopover value={value} onChange={onChange} />
      </div>

      {locationStatus === "denied" && (
        <p className="text-xs text-ink-600">Location permission denied — filter by area instead.</p>
      )}
    </div>
  );
}
