"use client";

import { useEffect, useState } from "react";
import { referenceApi } from "@/lib/api";
import { PRICE_TIER_LABELS, SORT_LABELS } from "@/lib/config";
import type { Area, BusinessSearchParams, Category, City, PriceTier, SortOption } from "@/lib/types";
import { Button } from "./ui/button";
import { Label, Select } from "./ui/field";

export function BusinessFilters({
  value,
  onChange,
  onUseMyLocation,
  locationStatus,
}: {
  value: BusinessSearchParams;
  onChange: (next: BusinessSearchParams) => void;
  onUseMyLocation: () => void;
  locationStatus: "idle" | "locating" | "granted" | "denied";
}) {
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

  function set<K extends keyof BusinessSearchParams>(key: K, val: BusinessSearchParams[K]) {
    onChange({ ...value, [key]: val, page: 0 });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
      <div>
        <Label>Category</Label>
        <Select
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
      </div>

      <div>
        <Label>City</Label>
        <Select value={cityId} onChange={(e) => { setCityId(e.target.value); set("areaId", undefined); }}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Area</Label>
        <Select
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
      </div>

      <div>
        <Label>Price</Label>
        <Select
          value={value.priceTier ?? ""}
          onChange={(e) => set("priceTier", (e.target.value || undefined) as PriceTier | undefined)}
        >
          <option value="">Any price</option>
          {Object.entries(PRICE_TIER_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Min rating</Label>
        <Select
          value={value.minRating ?? ""}
          onChange={(e) => set("minRating", e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Any rating</option>
          {[4.5, 4, 3.5, 3].map((r) => (
            <option key={r} value={r}>
              {r}+ stars
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Sort by</Label>
        <Select
          value={value.sort ?? "newest"}
          onChange={(e) => set("sort", e.target.value as SortOption)}
        >
          {Object.entries(SORT_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="col-span-2 md:col-span-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUseMyLocation}
          loading={locationStatus === "locating"}
        >
          📍 {locationStatus === "granted" ? "Using your location" : "Search near me"}
        </Button>
        {locationStatus === "denied" && (
          <span className="ml-2 text-xs text-ink-400">
            Location permission denied — filter by area instead.
          </span>
        )}
      </div>
    </div>
  );
}
