"use client";

import { useEffect, useRef, useState } from "react";
import { PRICE_TIER_LABELS, SORT_LABELS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { BusinessSearchParams, PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { SearchQueryInput } from "./search-query-input";
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
            : "border-ink-200 bg-surface text-ink-700 hover:border-ink-300"
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
        <div className="absolute z-20 mt-2 min-w-[190px] rounded-xl border border-ink-100 bg-surface p-1.5 shadow-pop">
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
          : "bg-surface border-ink-200 text-ink-700 hover:border-crimson-300 hover:text-crimson-700"
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
  /** Scrolls to the results grid — used after a search commits (search itself is already reactive via onChange). */
  onSearch: () => void;
}

/** Draft q/location state + the commit logic shared by all three breakpoint layouts. */
export function usePrimarySearch(value: BusinessSearchParams, onChange: FiltersProps["onChange"], onSearch: () => void) {
  const [q, setQ] = useState(value.q ?? "");
  const [location, setLocation] = useState(value.location ?? "");

  function submit() {
    const trimmedQ = q.trim();
    const trimmedLocation = location.trim();
    onChange({
      ...value,
      q: trimmedQ || undefined,
      location: trimmedLocation || undefined,
      // Typing a location supersedes a previously-used "near me" GPS fix.
      ...(trimmedLocation ? { lat: undefined, lng: undefined, radiusMeters: undefined } : {}),
      sort: trimmedQ ? "relevance" : value.sort === "relevance" ? "newest" : value.sort,
      page: 0,
    });
    onSearch();
  }

  return { q, setQ, location, setLocation, submit };
}

export function PrimarySearchRow({
  value,
  onChange,
  onUseMyLocation,
  locationStatus,
  onSearch,
}: FiltersProps) {
  const { q, setQ, location, setLocation, submit } = usePrimarySearch(value, onChange, onSearch);

  function useMyLocation() {
    setLocation("");
    // Commit whatever's already typed so page.tsx's geolocation callback
    // sees the current query and can rank by relevance instead of pure distance.
    onChange({ ...value, q: q.trim() || undefined, location: undefined, page: 0 });
    onUseMyLocation();
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 rounded-2xl md:rounded-full border border-ink-200 bg-surface p-1.5 md:p-1.5 shadow-sm">
      <SearchQueryInput
        value={q}
        onChange={setQ}
        onSubmit={submit}
        inputClassName="w-full h-11 rounded-full md:rounded-l-full md:rounded-r-none border-0 bg-transparent pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
      />

      <div className="hidden md:block h-7 w-px bg-ink-200 shrink-0" />

      <div className="relative flex-1 min-w-0">
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
          className="w-full h-11 rounded-full border-0 bg-transparent pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
        />
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locationStatus === "locating"}
        className="shrink-0 h-9 px-3.5 mx-1 rounded-full text-xs font-medium text-crimson-700 hover:bg-crimson-50 transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        📍 {locationStatus === "locating" ? "Locating…" : locationStatus === "granted" ? "Using your location" : "Near me"}
      </button>

      <Button size="lg" className="shrink-0 m-0.5" onClick={submit} aria-label="Search">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="9" r="6" />
          <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
        </svg>
      </Button>
    </div>
  );
}

function DesktopFilters({ value, onChange, onUseMyLocation, locationStatus, onSearch }: FiltersProps) {
  function set<K extends keyof BusinessSearchParams>(key: K, val: BusinessSearchParams[K]) {
    onChange({ ...value, [key]: val, page: 0 });
  }

  return (
    <div className="space-y-4">
      <PrimarySearchRow
        value={value}
        onChange={onChange}
        onUseMyLocation={onUseMyLocation}
        locationStatus={locationStatus}
        onSearch={onSearch}
      />

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
        <p className="text-xs text-ink-600">Location permission denied — enter a location manually instead.</p>
      )}
    </div>
  );
}

export function BusinessFilters(props: FiltersProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileFilters {...props} />
      </div>
      <div className="hidden md:block lg:hidden">
        <TabletFilters {...props} />
      </div>
      <div className="hidden lg:block">
        <DesktopFilters {...props} />
      </div>
    </>
  );
}
