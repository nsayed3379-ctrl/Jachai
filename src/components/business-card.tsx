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
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-1">
        <div className="relative h-44 w-full bg-ink-100">
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
          <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow">
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
          </p>
        </div>
      </Card>
    </Link>
  );
}
