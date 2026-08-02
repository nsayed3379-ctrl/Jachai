import Image from "next/image";
import Link from "next/link";
import { PRICE_TIER_LABELS } from "@/lib/config";
import type { BusinessResponse } from "@/lib/types";
import { Card } from "./ui/misc";
import { StarDisplay } from "./star-rating";
import { VerifiedBadge } from "./verified-badge";

export function BusinessCard({ business }: { business: BusinessResponse }) {
  return (
    <Link href={`/business/${business.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-pop">
        <div className="relative h-40 w-full bg-ink-100">
          {business.coverPhotoUrl ? (
            <Image
              src={business.coverPhotoUrl}
              alt={business.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300 font-display text-sm">
              {business.categoryName}
            </div>
          )}
          {business.verified && (
            <VerifiedBadge compact className="absolute top-2 right-2 shadow" />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-ink-900 leading-snug line-clamp-1">
              {business.name}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            {business.categoryName} · {business.areaName}, {business.cityName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StarDisplay rating={business.averageRating} size="sm" />
            <span className="text-xs text-ink-500">
              {business.averageRating.toFixed(1)} ({business.reviewCount})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-ink-500">{PRICE_TIER_LABELS[business.priceTier]}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
