"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { offerApi } from "@/lib/api";
import { offerDiscountLabel } from "@/lib/offer-constants";
import { timeUntil } from "@/lib/utils";
import type { OfferResponse } from "@/lib/types";

/**
 * Compact "this business has an active offer" banner for the business
 * profile sidebar — a small link, not the full offer card (spec: "do not
 * duplicate the entire offer card everywhere"). Renders nothing when the
 * business has no currently-active offer.
 */
export function OfferBusinessBanner({ businessId }: { businessId: string }) {
  const [offers, setOffers] = useState<OfferResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    offerApi
      .businessOffers(businessId)
      .then((res) => !cancelled && setOffers(res))
      .catch(() => !cancelled && setOffers([]));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!offers || offers.length === 0) return null;
  const top = offers[0];

  return (
    <Link
      href={`/community/offers/${top.id}`}
      className="flex items-center gap-2.5 rounded-xl border border-crimson-200 bg-crimson-50 p-3.5 transition-colors hover:border-crimson-300"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-crimson-600 text-white">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.8 0l-6.1-6.1a2 2 0 0 1 0-2.8L11.7 3.3a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.6a2 2 0 0 1-.4 1.4Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="15.5" cy="7.5" r="1.5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-crimson-800">
          {offerDiscountLabel(top)} — {top.title}
        </span>
        <span className="block text-xs text-crimson-700/80">
          {timeUntil(top.validUntil)}
          {offers.length > 1 && ` · +${offers.length - 1} more offer${offers.length > 2 ? "s" : ""}`}
        </span>
      </span>
    </Link>
  );
}
