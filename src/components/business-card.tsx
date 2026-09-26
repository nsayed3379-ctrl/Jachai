"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { priceTierLabel } from "@/lib/config";
import { useLanguage } from "@/lib/language-context";
import type { BusinessResponse } from "@/lib/types";
import { cn, distanceKm, focusRing, formatDistance, interactiveTransition } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import { Card } from "./ui/misc";

const PHOTO_ROTATE_INTERVAL_MS = 4000;

/** Classic Yelp-style rating widget — five separate rounded squares with a
 * visible gap between each, crimson-filled up to the rounded rating and a
 * light ink square (not a faded one) beyond it. `sm` is for the mobile
 * list-row card. */
function SquareStarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const { t } = useLanguage();
  const filled = Math.round(rating);
  const box = size === "sm" ? "h-[18px] w-[18px] rounded" : "h-8 w-8 rounded-md";
  const icon = size === "sm" ? "h-2.5 w-2.5" : "h-5 w-5";
  return (
    <div
      className={cn("inline-flex items-center", size === "sm" ? "gap-1" : "gap-1.5")}
      aria-label={t("common.stars_out_of_5", { rating })}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "flex items-center justify-center",
            box,
            n <= filled ? "bg-crimson-500 text-white" : "bg-ink-100 text-ink-300"
          )}
        >
          <svg viewBox="0 0 20 20" className={icon} fill="currentColor">
            <path d="M10 2.3l2.24 4.54 5.01.73-3.63 3.53.86 4.99L10 13.7l-4.48 2.39.86-4.99-3.63-3.53 5.01-.73L10 2.3Z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 9.5 9.5 3H16a1 1 0 0 1 1 1v6.5l-6.5 6.5a1 1 0 0 1-1.4 0L3 10.9a1 1 0 0 1 0-1.4Z" strokeLinejoin="round" />
      <circle cx="12.4" cy="7.1" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function VerifiedSealIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16Zm4.3 6.3-5 5a1 1 0 0 1-1.4 0l-2.2-2.2a1 1 0 1 1 1.4-1.4l1.5 1.5 4.3-4.3a1 1 0 0 1 1.4 1.4Z" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
      <path d="M10.5 1.5c.6 2.3-.3 3.6-1.4 4.8C7.9 7.5 6.5 9 6.5 11.3a3.5 3.5 0 0 0 7 0c0-1-.3-1.7-.7-2.4.9.5 1.7 1.6 1.7 3.3a4.5 4.5 0 1 1-9 0c0-3.6 2.6-5.1 4-6.7.9-1 1.3-1.8 1-4Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
      <path d="M10 17.3 8.6 16C4 11.8 1 9 1 5.9 1 3.4 3 1.5 5.4 1.5c1.4 0 2.7.6 3.6 1.7A4.8 4.8 0 0 1 12.6 1.5C15 1.5 17 3.4 17 5.9c0 3.1-3 5.9-7.6 10.1l-1.4 1.3Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 flex-none" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 18s6-5.3 6-9.8A6 6 0 0 0 4 8.2C4 12.7 10 18 10 18Z" strokeLinejoin="round" />
      <circle cx="10" cy="8.2" r="2" />
    </svg>
  );
}

function ChevronDownIcon({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-3 w-3 transition-transform duration-150", up && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rotating photo stack + a graceful "no photo" fallback. Owns its own
 * rotation timer and failed-image tracking so both card layouts (mobile
 * list-row / desktop tile) can drop it in at different sizes. `children`
 * renders as overlays inside the (relative) frame. */
function CardPhoto({
  photos,
  alt,
  categoryName,
  className,
  roundedClass,
  children,
}: {
  photos: string[];
  alt: string;
  categoryName: string;
  className?: string;
  roundedClass?: string;
  children?: ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPhoto = photos.length > 0 && !failed.has(idx);

  useEffect(() => {
    if (photos.length <= 1) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => (i + 1) % photos.length), PHOTO_ROTATE_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [photos.length]);

  return (
    <div className={cn("relative overflow-hidden bg-ink-100", roundedClass, className)}>
      {hasPhoto ? (
        photos.map((url, i) => (
          <div
            key={url}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === idx && !failed.has(i) ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={url}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 40vw, 320px"
              onError={() => setFailed((prev) => new Set(prev).add(i))}
            />
          </div>
        ))
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-ink-900 to-ink-800 text-ink-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L5 19" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="line-clamp-1 px-1 text-center font-display text-[10px] text-ink-300 sm:text-xs">
            {categoryName}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export function BusinessCard({
  business,
  userLocation,
  badge,
  forceTile,
}: {
  business: BusinessResponse;
  userLocation?: { lat: number; lng: number };
  /** Set by the homepage's Trending/Most-loved carousels only — never derived from `business` itself. */
  badge?: "trending" | "most_loved";
  /** BusinessCarousel passes this — the mobile Yelp-style row layout below assumes it
   *  stretches across a full-width list, so squeezed into a ~260px snap-scroll carousel
   *  card it comes out cramped/misaligned. Carousel cards use the vertical photo-tile
   *  layout (normally desktop/tablet-only) at every viewport width instead. */
  forceTile?: boolean;
}) {
  const { t, tn, lang } = useLanguage();
  const distance = userLocation
    ? distanceKm(userLocation, { lat: business.latitude, lng: business.longitude })
    : null;

  const photos = business.photoUrls;
  const priceLabel = priceTierLabel(business.priceTier, lang);
  const href = `/business/${business.slug}`;

  const flaggedChip = business.flagged && (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 sm:px-2.5 sm:py-1 sm:text-[11px]"
      title={business.flagReason ?? undefined}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M5 3a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm2 1h11.5a.5.5 0 0 1 .4.8L16 9l2.9 4.2a.5.5 0 0 1-.4.8H7V4Z" />
      </svg>
      {t("common.flagged")}
    </span>
  );

  const badgeChip = badge && (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-[11px]",
        badge === "trending"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-crimson-200 bg-crimson-50 text-crimson-700"
      )}
    >
      {badge === "trending" ? <FireIcon /> : <HeartIcon />}
      {badge === "trending" ? t("common.badge.trending") : t("common.badge.most_loved")}
    </span>
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-ink-100 bg-white transition-shadow duration-200 hover:shadow-lift">
      {/* ---------- Mobile: Yelp-style horizontal list row ---------- */}
      <div className={cn(forceTile ? "hidden" : "sm:hidden")}>
        <Link href={href} className={cn("flex gap-3 p-3", interactiveTransition, focusRing)}>
          <CardPhoto
            photos={photos}
            alt={business.name}
            categoryName={business.categoryName}
            className="h-24 w-24 flex-none"
            roundedClass="rounded-lg"
          />
          <div className="min-w-0 flex-1">
            {(flaggedChip || badgeChip) && (
              <div className="mb-1 flex flex-wrap items-center gap-1">
                {badgeChip}
                {flaggedChip}
              </div>
            )}
            <h3 className="line-clamp-1 font-display text-[15px] font-bold leading-snug text-ink-900">
              {business.name}
            </h3>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <SquareStarRating rating={business.averageRating} size="sm" />
              <span className="text-xs font-bold text-ink-900">{business.averageRating.toFixed(1)}</span>
              <span className="whitespace-nowrap text-[11px] text-ink-400">({tn("business_card.review_count", business.reviewCount)})</span>
            </div>

            <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-400">
              <PinIcon />
              <span className="truncate">
                {business.areaName}, {business.cityName}
                {distance !== null && <> · {formatDistance(distance)}</>} · {priceLabel}
              </span>
            </p>

            {business.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-500">{business.description}</p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                <CategoryIcon />
                {business.categoryName}
              </span>
              {business.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <VerifiedSealIcon />
                  {t("common.verified")}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* ---------- Desktop / tablet: vertical photo tile ---------- */}
      <div className={cn(forceTile ? "flex grow flex-col" : "hidden sm:flex sm:grow sm:flex-col")}>
        <Link href={href} className={cn("flex grow flex-col", interactiveTransition, focusRing)}>
          <CardPhoto
            photos={photos}
            alt={business.name}
            categoryName={business.categoryName}
            className={cn("w-full flex-none", forceTile ? "h-36" : "h-48")}
            roundedClass="rounded-t-xl"
          >
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 pr-12">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
                <CategoryIcon />
                {business.categoryName}
              </span>
              {business.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                  <VerifiedSealIcon />
                  {t("common.verified")}
                </span>
              )}
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
                    badge === "trending" ? "bg-amber-500 text-white" : "bg-crimson-600 text-white"
                  )}
                >
                  {badge === "trending" ? <FireIcon /> : <HeartIcon />}
                  {badge === "trending" ? t("common.badge.trending") : t("common.badge.most_loved")}
                </span>
              )}
            </div>

            <div className="absolute right-3 top-3">
              <BookmarkButton businessId={business.id} iconOnly />
            </div>

            <span className="absolute bottom-3 right-3 rounded-full bg-sand-200 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
              {priceLabel}
            </span>
          </CardPhoto>

          <div className={cn(forceTile ? "p-3.5" : "p-4")}>
            {flaggedChip && <div className="mb-2">{flaggedChip}</div>}

            <h3 className={cn("font-display font-bold leading-snug text-ink-900", forceTile ? "text-base" : "text-lg")}>
              {business.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SquareStarRating rating={business.averageRating} />
              <span className="text-base font-bold text-ink-900">{business.averageRating.toFixed(1)}</span>
              <span className="whitespace-nowrap text-sm text-ink-400">({tn("business_card.rating_count", business.reviewCount)})</span>
            </div>

            {!forceTile && <CardDescription business={business} />}

            <div className="mt-3">
              <span className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-gold-50 px-3 py-1.5 text-xs font-medium text-gold-700 dark:bg-gold-500/10 dark:text-gold-400">
                <PinIcon />
                <span className="truncate">
                  {business.areaName}, {business.cityName}
                  {distance !== null && <> · {formatDistance(distance)}</>}
                </span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  );
}

/** Card description — the owner-written blurb, clamped to two lines with a
 * See more / See less toggle. Desktop card only. */
function CardDescription({ business }: { business: BusinessResponse }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const text = business.description;
  if (!text) return null;

  return (
    <div className="mt-2">
      <p className={cn("text-sm text-ink-600 leading-snug", !expanded && "line-clamp-2")}>{text}</p>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className={cn("mt-0.5 inline-flex items-center gap-0.5 rounded text-xs font-semibold text-brand-600 hover:text-brand-700", focusRing)}
      >
        {expanded ? t("common.see_less") : t("common.see_more")}
        <ChevronDownIcon up={expanded} />
      </button>
    </div>
  );
}
