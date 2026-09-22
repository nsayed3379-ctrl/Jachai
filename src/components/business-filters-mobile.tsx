"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { BottomSheet } from "./ui/bottom-sheet";
import {
  FilterOptionPill,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  type FiltersProps,
  type LocationData,
} from "./business-filters";

/**
 * Stand-in for a native <select> on the mobile hero filter bar — a plain
 * <select>'s open-state option list is rendered by the OS/browser (not by
 * us), so on Android Chrome especially it comes out as a plain, unstyled
 * list that clashes hard with everything else on the page. This renders its
 * own dropdown panel instead, fully styled, at the cost of building the
 * open/close and click-outside handling ourselves.
 */
function CompactSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-1 rounded-xl border bg-surface px-3 text-xs font-medium text-ink-800 transition-colors duration-150",
          open ? "border-crimson-400" : "border-ink-200"
        )}
      >
        <span className="truncate">{selected?.label ?? options[0]?.label}</span>
        <ChevronDown size={14} className={cn("shrink-0 text-ink-400 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1.5 max-h-60 w-full min-w-[9rem] overflow-y-auto rounded-xl border border-ink-100 bg-surface p-1.5 shadow-pop animate-scale-in"
        >
          {options.map((opt) => (
            <button
              key={opt.value || "__all"}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                opt.value === value ? "bg-crimson-50 font-semibold text-crimson-700" : "text-ink-700 hover:bg-ink-50"
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

      <div className="mt-7 flex gap-3 sticky bottom-0 bg-surface pt-3 -mx-5 px-5 border-t border-ink-100">
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
    <div className="space-y-1.5">
      <CompactSelect
        value={value.categoryId ?? ""}
        onChange={(v) => set("categoryId", v || undefined)}
        options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
      />

      <div className="flex gap-1.5">
        <CompactSelect
          value={cityId}
          onChange={(v) => {
            setCityId(v);
            set("areaId", undefined);
          }}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
        />

        <CompactSelect
          value={value.areaId ?? ""}
          onChange={(v) => set("areaId", v || undefined)}
          options={[{ value: "", label: "All areas" }, ...areas.map((a) => ({ value: a.id, label: a.name }))]}
        />
      </div>

      <div className="flex gap-1.5">
        <Button className="flex-1 h-9 rounded-xl text-sm" onClick={onSearch}>
          🔍 Search
        </Button>
        <Button
          variant="outline"
          className="relative h-9 rounded-xl px-4 text-sm"
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
