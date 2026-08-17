"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
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
import { VerifiedBadge } from "./verified-badge";

const PHOTO_ROTATE_INTERVAL_MS = 4000;

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
      <path d="M10 1.3l2.7 5.5 6 .9-4.3 4.3 1 6-5.4-2.8-5.4 2.8 1-6L1.3 7.7l6-.9L10 1.3Z" />
    </svg>
  );
}

/** Yelp-style rating: five small rounded red squares, each holding a white
 * star — filled red up to the rounded rating, dim gray after. */
function SquareRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded",
            n <= filled ? "bg-crimson-600 text-white" : "bg-ink-100 text-ink-300"
          )}
        >
          <StarIcon />
        </span>
      ))}
    </div>
  );
}

function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M7 10.5V20h10.2a2 2 0 0 0 1.98-1.72l.9-6A2 2 0 0 0 18.1 10H14l.7-4.2a1.8 1.8 0 0 0-3.2-1.4L7 10.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 10.5H4.5A1.5 1.5 0 0 0 3 12v6.5A1.5 1.5 0 0 0 4.5 20H7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M17 13.5V4H6.8a2 2 0 0 0-1.98 1.72l-.9 6A2 2 0 0 0 5.9 14H10l-.7 4.2a1.8 1.8 0 0 0 3.2 1.4L17 13.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 13.5h2.5A1.5 1.5 0 0 0 21 12V5.5A1.5 1.5 0 0 0 19.5 4H17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.3C.7 7.9 2.3 4.8 5.4 4.1c2-.4 3.9.5 5 2.1a5.8 5.8 0 0 1 5-2.1c3.1.7 4.7 3.8 3.2 7.1-2.3 4.7-9.6 9.3-9.6 9.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="9.3" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1.8" />
    </svg>
  );
}

const REACTIONS: {
  type: BusinessReactionType;
  icon: ReactNode;
  label: string;
  activeColor: string;
}[] = [
  { type: "LIKE", icon: <ThumbsUpIcon />, label: "Like", activeColor: "text-sky-600" },
  { type: "DISLIKE", icon: <ThumbsDownIcon />, label: "Dislike", activeColor: "text-ink-700" },
  { type: "LOVE", icon: <HeartIcon />, label: "Love", activeColor: "text-rose-600" },
  { type: "WOW", icon: <WowIcon />, label: "Wow", activeColor: "text-amber-600" },
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
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const [logoFailed, setLogoFailed] = useState(false);
  const [counts, setCounts] = useState<Record<BusinessReactionType, number>>({
    LIKE: business.totalLikeCount,
    DISLIKE: business.totalDislikeCount,
    LOVE: business.totalLoveCount,
    WOW: business.totalWowCount,
  });
  const [reacted, setReacted] = useState<Set<BusinessReactionType>>(new Set());
  const [reacting, setReacting] = useState<BusinessReactionType | null>(null);
  const photoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const distance = userLocation
    ? distanceKm(userLocation, { lat: business.latitude, lng: business.longitude })
    : null;

  const photos = business.photoUrls;
  const hasPhoto = photos.length > 0 && !failedIndices.has(photoIndex);

  // Auto-rotates the photo every PHOTO_ROTATE_INTERVAL_MS when there's more
  // than one — no manual prev/next controls, this is the only way through
  // the gallery. Clearing any pre-existing timer before starting a new one
  // keeps this safe under React Strict Mode's dev-only double-invoke.
  useEffect(() => {
    if (photos.length <= 1) return;
    if (photoTimerRef.current) clearInterval(photoTimerRef.current);
    photoTimerRef.current = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % photos.length);
    }, PHOTO_ROTATE_INTERVAL_MS);
    return () => {
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
      photoTimerRef.current = null;
    };
  }, [photos.length]);

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
      <Card className="h-full overflow-hidden flex flex-col rounded-xl border border-ink-100 bg-white transition-shadow duration-200 group-hover:shadow-lift">
        {/* Header: avatar + name, category sitting where a timestamp would go —
            plain white, no gradients, matching a clean activity-feed card. */}
        <div className="p-4 pb-3 flex items-center gap-2.5">
          {business.logoUrl && !logoFailed ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink-100">
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
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
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

        {/* Photo: full card width, edge-to-edge, no rounding, no overlay —
            just the photo, auto-rotating every 4s if there's more than one. */}
        <div className="relative h-44 w-full bg-ink-100 overflow-hidden">
          {hasPhoto ? (
            photos.map((url, i) => (
              <div
                key={url}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === photoIndex && !failedIndices.has(i) ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={url}
                  alt={business.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                  onError={() => setFailedIndices((prev) => new Set(prev).add(i))}
                />
              </div>
            ))
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
        </div>

        {/* Content: business name, star-square rating, a description snippet
            with a "Read more" cue, then quiet price/location detail. */}
        <div className="p-4 flex flex-col grow">
          {business.flagged && (
            <span
              className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600"
              title={business.flagReason ?? undefined}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M5 3a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm2 1h11.5a.5.5 0 0 1 .4.8L16 9l2.9 4.2a.5.5 0 0 1-.4.8H7V4Z" />
              </svg>
              Flagged
            </span>
          )}

          <h4 className="font-display font-bold text-ink-900 text-base leading-snug">{business.name}</h4>

          <div className="mt-1.5 flex items-center gap-2">
            <SquareRating rating={business.averageRating} />
            <span className="text-xs text-ink-400">({business.reviewCount})</span>
          </div>

          {business.description && (
            <p className="mt-2 text-sm text-ink-700 leading-snug line-clamp-2">
              {business.description}{" "}
              <span className="text-brand-600 font-medium whitespace-nowrap">Read more</span>
            </p>
          )}

          <p className="mt-2 text-xs text-ink-400 grow">
            {PRICE_TIER_LABELS[business.priceTier]} · {business.areaName}, {business.cityName}
            {distance !== null && <> · {formatDistance(distance)}</>}
          </p>

          {/* Reaction row: plain outline icons + counts, no pills, no fill —
              evenly spaced, separated only by a top border, like a
              minimal activity-card footer. */}
          <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-4">
            {REACTIONS.map(({ type, icon, label, activeColor }) => {
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
                    "flex flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors duration-150 disabled:cursor-default",
                    isActive ? activeColor : "text-ink-400 hover:text-ink-600"
                  )}
                >
                  {icon}
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