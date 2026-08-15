"use client";

import { useState } from "react";
import type { PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { BottomSheet } from "./ui/bottom-sheet";
import { SearchQueryInput } from "./search-query-input";
import {
  FilterOptionPill,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  usePrimarySearch,
  type FiltersProps,
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

export function MobileFilters({ value, onChange, onUseMyLocation, locationStatus, onSearch }: FiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { q, setQ, location, setLocation, submit } = usePrimarySearch(value, onChange, onSearch);

  function useMyLocation() {
    setLocation("");
    // Commit whatever's already typed so page.tsx's geolocation callback
    // sees the current query and can rank by relevance instead of pure distance.
    onChange({ ...value, q: q.trim() || undefined, location: undefined, page: 0 });
    onUseMyLocation();
  }

  const activeRefineCount = [value.priceTier, value.minRating].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-2.5">
      <SearchQueryInput
        value={q}
        onChange={setQ}
        onSubmit={submit}
        inputClassName="h-12 w-full rounded-xl border border-ink-200 bg-surface text-base focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
      />

      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 18s6-5.5 6-10a6 6 0 1 0-12 0c0 4.5 6 10 6 10Z" strokeLinejoin="round" />
          <circle cx="10" cy="8" r="2" />
        </svg>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Location"
          className="h-12 w-full rounded-xl border border-ink-200 bg-surface pl-10 pr-4 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
        />
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locationStatus === "locating"}
        className="text-xs font-medium text-crimson-700 disabled:opacity-60"
      >
        📍 {locationStatus === "locating" ? "Locating…" : locationStatus === "granted" ? "Using your location" : "Near me"}
      </button>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1 h-12 rounded-xl text-base" onClick={submit}>
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
        <p className="text-xs text-ink-600">Location permission denied — enter a location manually instead.</p>
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
