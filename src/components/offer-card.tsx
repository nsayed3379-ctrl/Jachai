"use client";

import Link from "next/link";
import { OFFER_AVAILABILITY_LABELS } from "@/lib/offer-constants";
import { timeUntil } from "@/lib/utils";
import type { OfferResponse } from "@/lib/types";
import { OfferTypeBadge } from "./offer-type-badge";

/**
 * Compact offer card for the Offers feed/grid — mirrors similar-business-
 * card.tsx's shape (single link, no nested interactive elements) but swaps
 * the business-rating footer for the offer's own price/expiry/availability.
 * Deliberately light — business name/logo, offer title+discount, price (only
 * when set), location, expiry, Verified badge, availability. Nothing else.
 */
export function OfferCard({ offer }: { offer: OfferResponse }) {
  const hasPrices = offer.originalPrice != null && offer.offerPrice != null;

  return (
    <Link
      href={`/community/offers/${offer.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
        {offer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-ink-900 to-ink-800 text-ink-400">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.8 0l-6.1-6.1a2 2 0 0 1 0-2.8L11.7 3.3a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.6a2 2 0 0 1-.4 1.4Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="15.5" cy="7.5" r="1.5" />
            </svg>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
          <OfferTypeBadge offer={offer} />
          {offer.businessVerified && (
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
        <h3 className="line-clamp-1 font-display text-sm font-bold leading-snug text-ink-900">{offer.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{offer.businessName}</p>

        {hasPrices && (
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-crimson-700">৳{offer.offerPrice}</span>
            <span className="text-xs text-ink-400 line-through">৳{offer.originalPrice}</span>
          </div>
        )}

        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400">
          <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="truncate">
            {offer.areaName}, {offer.cityName}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-2">
          <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
            {OFFER_AVAILABILITY_LABELS[offer.availability]}
          </span>
          <span className="text-[11px] font-medium text-ink-500">{timeUntil(offer.validUntil)}</span>
        </div>
      </div>
    </Link>
  );
}
