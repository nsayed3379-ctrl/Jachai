"use client";

import Link from "next/link";
import { PRICE_TIER_LABELS } from "@/lib/config";
import { distanceKm, formatDistance } from "@/lib/utils";
import type { BusinessResponse } from "@/lib/types";
import { StarDisplay } from "./star-rating";

/**
 * Compact business card for the "Similar businesses nearby" scroll strip on
 * the detail page. Deliberately lighter than <BusinessCard /> — no reaction
 * bar, share, or bookmark — so it stays tidy inside a ~260px cell and the
 * whole card is a single link with nothing interactive nested inside it.
 */
export function SimilarBusinessCard({
  business,
  userLocation,
}: {
  business: BusinessResponse;
  userLocation?: { lat: number; lng: number };
}) {
  const photo = business.photoUrls[0] ?? business.coverPhotoUrl ?? null;
  const distance = userLocation
    ? distanceKm(userLocation, { lat: business.latitude, lng: business.longitude })
    : null;

  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-ink-900 to-ink-800 text-ink-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="2" />
              <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L5 19" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* gradient scrim so the chips stay readable over any photo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
          <span className="inline-block max-w-[64%] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-ink-700 shadow-sm">
            {business.categoryName}
          </span>
          {business.verified && (
            <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 font-display text-sm font-bold leading-snug text-ink-900">{business.name}</h3>

        <div className="mt-1 flex items-center gap-1.5">
          <StarDisplay rating={business.averageRating} size="sm" />
          <span className="text-xs font-bold text-ink-900">{business.averageRating.toFixed(1)}</span>
          <span className="text-[11px] text-ink-400">({business.reviewCount})</span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-400">
          <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="truncate">
            {business.areaName}, {business.cityName}
            {distance !== null && <> · {formatDistance(distance)}</>}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-2">
          <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
            {PRICE_TIER_LABELS[business.priceTier]}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-crimson-700 transition-transform duration-200 group-hover:translate-x-0.5">
            View details
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
