"use client";

import type { BusinessResponse } from "@/lib/types";
import { BusinessCard } from "./business-card";

/**
 * Horizontal snap-scroll row of BusinessCards — the same recipe already used
 * inline for "Similar businesses nearby" on the business detail page
 * (flex + overflow-x-auto + snap-x, scrollbar hidden), factored out here so
 * the homepage's Trending/Most-loved sections don't duplicate it.
 */
export function BusinessCarousel({
  title,
  businesses,
  badge,
}: {
  title: string;
  businesses: BusinessResponse[];
  badge: "trending" | "most_loved";
}) {
  if (businesses.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink-900 sm:text-xl">{title}</h2>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {businesses.map((b) => (
          <div key={b.id} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
            <BusinessCard business={b} badge={badge} forceTile />
          </div>
        ))}
      </div>
    </div>
  );
}
