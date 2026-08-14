"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { PRICE_TIER_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessReactionType, BusinessResponse } from "@/lib/types";
import { avatarColorClass, cn, distanceKm, formatDistance } from "@/lib/utils";
import { Card } from "./ui/misc";
import { StarDisplay } from "./star-rating";
import { VerifiedBadge } from "./verified-badge";

const REACTIONS: {
  type: BusinessReactionType;
  emoji: string;
  label: string;
  activeClass: string;
}[] = [
  {
    type: "LIKE",
    emoji: "👍",
    label: "Like",
    activeClass: "bg-sky-50 ring-1 ring-sky-300 text-sky-700",
  },
  {
    type: "DISLIKE",
    emoji: "👎",
    label: "Dislike",
    activeClass: "bg-ink-100 ring-1 ring-ink-300 text-ink-700",
  },
  {
    type: "LOVE",
    emoji: "❤️",
    label: "Love",
    activeClass: "bg-rose-50 ring-1 ring-rose-300 text-rose-700",
  },
  {
    type: "WOW",
    emoji: "😮",
    label: "Wow",
    activeClass: "bg-amber-50 ring-1 ring-amber-300 text-amber-700",
  },
];

export function BusinessCard({
  business,
  userLocation,
}: {
  business: BusinessResponse;
  userLocation?: { lat: number; lng: number };
}) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [counts, setCounts] = useState<Record<BusinessReactionType, number>>({
    LIKE: business.totalLikeCount,
    DISLIKE: business.totalDislikeCount,
    LOVE: business.totalLoveCount,
    WOW: business.totalWowCount,
  });
  const [reacted, setReacted] = useState<Set<BusinessReactionType>>(new Set());
  const [reacting, setReacting] = useState<BusinessReactionType | null>(null);
  const distance = userLocation
    ? distanceKm(userLocation, { lat: business.latitude, lng: business.longitude })
    : null;

  const photos = business.photoUrls;
  const currentPhoto = photos[photoIndex] ?? null;

  function goToPhoto(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoFailed(false);
    setPhotoIndex((index + photos.length) % photos.length);
  }

  // Business-level reaction (business.BusinessReaction) — a direct "react to
  // this business" toggle, distinct from voting on any one specific review.
  async function react(e: MouseEvent, type: BusinessReactionType) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (reacting) return;
    const wasActive = reacted.has(type);
    setReacting(type);
    // optimistic update — flips immediately, no wait for the network round trip
    setReacted((prev) => {
      const next = new Set(prev);
      wasActive ? next.delete(type) : next.add(type);
      return next;
    });
    setCounts((prev) => ({ ...prev, [type]: prev[type] + (wasActive ? -1 : 1) }));
    try {
      await businessApi.react(business.id, type);
    } catch (err) {
      // roll back on failure
      setReacted((prev) => {
        const next = new Set(prev);
        wasActive ? next.add(type) : next.delete(type);
        return next;
      });
      setCounts((prev) => ({ ...prev, [type]: prev[type] + (wasActive ? 1 : -1) }));
      show(errorMessage(err), "error");
    } finally {
      setReacting(null);
    }
  }

  return (
    <Link href={`/business/${business.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden flex flex-col rounded-2xl border border-ink-100 transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-1 group-hover:border-ink-200">
        {/* Header: identity block sits above the photo, never on top of it —
            avatar + name + verified badge + category, all on plain white. */}
        <div className="p-4 pb-3 flex items-center gap-2.5">
          {business.logoUrl && !logoFailed ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm bg-ink-100">
              <Image
                src={business.logoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                onError={() => setLogoFailed(true)}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white shadow-sm",
                avatarColorClass(business.name)
              )}
            >
              {business.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-bold text-ink-900 leading-snug truncate">{business.name}</h3>
              {business.verified && <VerifiedBadge compact />}
            </div>
            <p className="text-xs text-ink-400 truncate">{business.categoryName}</p>
          </div>
        </div>

        {/* Photo: kept clean like the activity feed's photo — no badges on
            top of it. Only functional overlays (carousel controls) stay. */}
        <div className="relative h-44 w-full bg-ink-100">
          {currentPhoto && !photoFailed ? (
            <Image
              src={currentPhoto}
              alt={business.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-ink-900 to-ink-800 text-ink-400">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L5 19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-xs text-ink-300">{business.categoryName}</span>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => goToPhoto(e, photoIndex - 1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow backdrop-blur-sm hover:bg-black/60 transition-colors"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => goToPhoto(e, photoIndex + 1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow backdrop-blur-sm hover:bg-black/60 transition-colors"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M8 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 rounded-full transition-all", i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content: rating + price/location, same plain-white footer treatment as the header. */}
        <div className="p-4 flex flex-col grow">
          {business.flagged && (
            <span
              className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-[11px] font-semibold text-rose-600"
              title={business.flagReason ?? undefined}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M5 3a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm2 1h11.5a.5.5 0 0 1 .4.8L16 9l2.9 4.2a.5.5 0 0 1-.4.8H7V4Z" />
              </svg>
              Flagged
            </span>
          )}
          <div className="flex items-center gap-2">
            <StarDisplay rating={business.averageRating} size="sm" />
            <span className="text-xs font-semibold text-ink-700">{business.averageRating.toFixed(1)}</span>
            <span className="text-xs text-ink-400">({business.reviewCount})</span>
          </div>

          <p className="mt-2 text-xs text-ink-400 grow">
            {PRICE_TIER_LABELS[business.priceTier]} · {business.areaName}, {business.cityName}
            {distance !== null && <> · {formatDistance(distance)}</>}
          </p>

          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-1.5">
            {REACTIONS.map(({ type, emoji, label, activeClass }) => {
              const isActive = reacted.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={(e) => react(e, type)}
                  disabled={reacting !== null}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-150 disabled:cursor-default",
                    isActive
                      ? activeClass
                      : "text-ink-400 hover:bg-ink-50 hover:text-ink-600 disabled:hover:bg-transparent disabled:hover:text-ink-400"
                  )}
                >
                  <span
                    className={cn(
                      "leading-none transition-transform duration-150",
                      isActive ? "scale-125" : "scale-100"
                    )}
                  >
                    {emoji}
                  </span>
                  <span>{counts[type]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </Link>
  );
}