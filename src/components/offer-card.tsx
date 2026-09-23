"use client";

import Link from "next/link";
import { OFFER_AVAILABILITY_LABELS } from "@/lib/offer-constants";
import { cn, timeUntil } from "@/lib/utils";
import type { OfferResponse } from "@/lib/types";
import { OfferTypeBadge } from "./offer-type-badge";
import { Card } from "./ui/misc";

function ImageFallback({ small }: { small?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-ink-900 to-ink-800 text-ink-400">
      <svg viewBox="0 0 24 24" className={small ? "h-5 w-5" : "h-7 w-7"} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.8 0l-6.1-6.1a2 2 0 0 1 0-2.8L11.7 3.3a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.6a2 2 0 0 1-.4 1.4Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15.5" cy="7.5" r="1.5" />
      </svg>
    </div>
  );
}

function VerifiedChip({ small }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-0.5 rounded-full bg-brand-600 font-semibold text-white shadow-sm",
        small ? "px-1.5 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
      )}
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

function LocationLine({ offer }: { offer: OfferResponse }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-400">
      <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      <span className="truncate">
        {offer.areaName}, {offer.cityName}
      </span>
    </p>
  );
}

function FooterRow({ offer }: { offer: OfferResponse }) {
  return (
    <div className="flex flex-nowrap items-center justify-between gap-1.5 border-t border-ink-100 pt-2">
      <span className="min-w-0 truncate rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
        {OFFER_AVAILABILITY_LABELS[offer.availability]}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-ink-500">
        <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {timeUntil(offer.validUntil)}
      </span>
    </div>
  );
}

/**
 * Offer card — two layouts sharing one component, same pattern as
 * business-card.tsx: a compact Yelp-style horizontal row on mobile (a tall
 * vertical poster card stacked in a single-column list reads as oversized on
 * a phone), a vertical photo-tile card on sm+ where a multi-column grid has
 * room for it. `forceTile` is for the "Today's Offers" horizontal-scroll
 * strip, which stays tile-style at every width — mirrors BusinessCarousel's
 * use of the same flag on BusinessCard.
 */
export function OfferCard({ offer, forceTile }: { offer: OfferResponse; forceTile?: boolean }) {
  const hasPrices = offer.originalPrice != null && offer.offerPrice != null;
  const href = `/community/offers/${offer.id}`;

  return (
    <Card className="h-full overflow-hidden rounded-2xl border-ink-100 shadow-card transition duration-300 hover:border-ink-200 hover:shadow-xl">
      {/* ---------- Mobile: horizontal list row ---------- */}
      <div className={cn(forceTile ? "hidden" : "sm:hidden")}>
        <Link href={href} className="flex gap-3 p-3">
          <div className="relative h-24 w-24 flex-none overflow-hidden rounded-lg bg-ink-100">
            {offer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover" />
            ) : (
              <ImageFallback small />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <OfferTypeBadge offer={offer} className="px-1.5 py-0.5 text-[10px]" />
              {offer.businessVerified && <VerifiedChip small />}
            </div>
            <h3 className="mt-1 line-clamp-1 font-display text-sm font-bold leading-snug text-ink-900">{offer.title}</h3>
            <p className="line-clamp-1 text-xs font-medium text-ink-500">{offer.businessName}</p>
            {hasPrices ? (
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-sm font-extrabold text-crimson-700">৳{offer.offerPrice}</span>
                <span className="text-[11px] text-ink-400 line-through">৳{offer.originalPrice}</span>
              </div>
            ) : (
              <LocationLine offer={offer} />
            )}
          </div>
        </Link>
        <div className="px-3 pb-3">
          <FooterRow offer={offer} />
        </div>
      </div>

      {/* ---------- sm+: vertical photo-tile card ---------- */}
      <Link href={href} className={cn("group h-full flex-col", forceTile ? "flex" : "hidden sm:flex")}>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
          {offer.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ImageFallback />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
            <OfferTypeBadge offer={offer} />
            {offer.businessVerified && <VerifiedChip />}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="line-clamp-1 font-display text-[15px] font-bold leading-snug text-ink-900">{offer.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-ink-500">{offer.businessName}</p>

          {hasPrices && (
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-lg font-extrabold text-crimson-700">৳{offer.offerPrice}</span>
              <span className="text-xs text-ink-400 line-through">৳{offer.originalPrice}</span>
            </div>
          )}

          <LocationLine offer={offer} />

          <div className="mt-auto pt-2.5">
            <FooterRow offer={offer} />
          </div>
        </div>
      </Link>
    </Card>
  );
}
