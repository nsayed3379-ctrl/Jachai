"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PRICE_TIER_LABELS } from "@/lib/config";
import type { BusinessResponse, VoteType } from "@/lib/types";
import { avatarColorClass, cn, distanceKm, formatDistance } from "@/lib/utils";
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
  const { user } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [counts, setCounts] = useState({
    USEFUL: business.totalUsefulCount,
    FUNNY: business.totalFunnyCount,
    COOL: business.totalCoolCount,
  });
  const [reacted, setReacted] = useState<Set<VoteType>>(new Set());
  const [reacting, setReacting] = useState<VoteType | null>(null);
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
  async function react(e: MouseEvent, type: VoteType) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || reacting) return;
    setReacting(type);
    try {
      await businessApi.react(business.id, type);
      setReacted((prev) => {
        const next = new Set(prev);
        next.has(type) ? next.delete(type) : next.add(type);
        return next;
      });
      setCounts((prev) => ({ ...prev, [type]: prev[type] + (reacted.has(type) ? -1 : 1) }));
    } catch {
      // decorative-ish reaction — a failed toggle here just stays as-is, no toast noise
    } finally {
      setReacting(null);
    }
  }

  return (
    <Link href={`/business/${business.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden flex flex-col transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-1">
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

          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-4">
            <ReactionButton
              icon={<LightbulbIcon />}
              count={counts.USEFUL}
              active={reacted.has("USEFUL")}
              disabled={!user || reacting !== null}
              label="React useful"
              onClick={(e) => react(e, "USEFUL")}
            />
            <ReactionButton
              icon={<SmileyIcon />}
              count={counts.FUNNY}
              active={reacted.has("FUNNY")}
              disabled={!user || reacting !== null}
              label="React funny"
              onClick={(e) => react(e, "FUNNY")}
            />
            <ReactionButton
              icon={<SunglassesIcon />}
              count={counts.COOL}
              active={reacted.has("COOL")}
              disabled={!user || reacting !== null}
              label="React cool"
              onClick={(e) => react(e, "COOL")}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ReactionButton({
  icon,
  count,
  active,
  disabled,
  label,
  onClick,
}: {
  icon: ReactNode;
  count: number;
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: (e: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-default",
        active ? "text-crimson-700" : "text-ink-400 hover:text-crimson-600 disabled:hover:text-ink-400"
      )}
    >
      {icon}
      <span>{count}</span>
    </button>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.55.42.6 1.03.6 1.6V16h6v-.6c0-.57.05-1.18.6-1.6A6 6 0 0 0 12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmileyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10.5h.01M15.5 10.5h.01" strokeLinecap="round" />
      <path d="M8 14.3c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunglassesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 8.5h4.8a2.7 2.7 0 0 1 2.6 2 2.2 2.2 0 0 0 4.2 0 2.7 2.7 0 0 1 2.6-2h4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.8" cy="12.3" r="3.2" />
      <circle cx="18.2" cy="12.3" r="3.2" />
    </svg>
  );
}
