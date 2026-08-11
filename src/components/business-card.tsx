"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PRICE_TIER_LABELS } from "@/lib/config";
import type { BusinessResponse } from "@/lib/types";
import { distanceKm, formatDistance } from "@/lib/utils";
import { Card } from "./ui/misc";
import { StarDisplay } from "./star-rating";
import { VerifiedBadge } from "./verified-badge";

export function BusinessCard({
  business,
  userLocation,
}: {
  business: BusinessResponse;
  userLocation?: { lat: number; lng: number };
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const distance = userLocation
    ? distanceKm(userLocation, { lat: business.latitude, lng: business.longitude })
    : null;

  return (
    <Link href={`/business/${business.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-1">
        <div className="relative h-44 w-full bg-ink-100">
          {business.coverPhotoUrl && !photoFailed ? (
            <Image
              src={business.coverPhotoUrl}
              alt={business.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300 font-display text-sm">
              {business.categoryName}
            </div>
          )}
          {business.verified && (
            <VerifiedBadge compact className="absolute top-2 right-2 shadow" />
          )}
          {business.flagged && (
            <span
              className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow"
              title={business.flagReason ?? undefined}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M5 3a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm2 1h11.5a.5.5 0 0 1 .4.8L16 9l2.9 4.2a.5.5 0 0 1-.4.8H7V4Z" />
              </svg>
              Flagged
            </span>
          )}
          <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow">
            {business.categoryName}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display font-bold text-ink-900 leading-snug line-clamp-1">
            {business.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <StarDisplay rating={business.averageRating} size="sm" />
            <span className="text-xs font-semibold text-ink-700">
              {business.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-ink-400">({business.reviewCount})</span>
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {PRICE_TIER_LABELS[business.priceTier]} · {business.areaName}, {business.cityName}
            {distance !== null && <> · {formatDistance(distance)}</>}
          </p>
        </div>
      </Card>
    </Link>
  );
}
