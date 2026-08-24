"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { businessApi, summaryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { PRICE_TIER_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessReactionType, BusinessResponse } from "@/lib/types";
import { cn, distanceKm, formatDistance } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import { ShareButton } from "./share-button";
import { Card } from "./ui/misc";

const PHOTO_ROTATE_INTERVAL_MS = 4000;

function FilledStarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M10 2.3l2.24 4.54 5.01.73-3.63 3.53.86 4.99L10 13.7l-4.48 2.39.86-4.99-3.63-3.53 5.01-.73L10 2.3Z" />
    </svg>
  );
}

/** Classic Yelp-style rating widget — five separate rounded squares with a
 * visible gap between each, crimson-filled up to the rounded rating and a
 * light ink square (not a faded one) beyond it. */
function SquareStarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            n <= filled ? "bg-crimson-500 text-white" : "bg-ink-100 text-ink-300"
          )}
        >
          <FilledStarIcon />
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

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 18s6-5.3 6-9.8A6 6 0 0 0 4 8.2C4 12.7 10 18 10 18Z" strokeLinejoin="round" />
      <circle cx="10" cy="8.2" r="2" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 14 14 6M8 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
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

/** Reaction badge, two states: unreacted is a plain outline circle in the
 * reaction's color (calm by default — a row of solid gradient circles at
 * rest read as gaudy); reacted fills in as a glossy gradient "sticker" with
 * a highlight streak, the way a tapped reaction should stand out. */
function ReactionBadge({
  active,
  gradient,
  ring,
  iconColor,
  children,
}: {
  active: boolean;
  gradient: string;
  ring: string;
  iconColor: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
        active ? cn("shadow-md", gradient) : cn("bg-white border-2", ring)
      )}
    >
      {active && <span className="pointer-events-none absolute inset-x-2 top-1 h-2 rounded-full bg-white/35 blur-[2px]" />}
      <span className={active ? "relative text-white" : iconColor}>{children}</span>
    </span>
  );
}

function ThumbsUpGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M7 10.5V20h10.2a2 2 0 0 0 1.98-1.72l.9-6A2 2 0 0 0 18.1 10H14l.7-4.2a1.8 1.8 0 0 0-3.2-1.4L7 10.5Z" />
      <path d="M7 10.5H4.5A1.5 1.5 0 0 0 3 12v6.5A1.5 1.5 0 0 0 4.5 20H7Z" />
    </svg>
  );
}

function ThumbsDownGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M17 13.5V4H6.8a2 2 0 0 0-1.98 1.72l-.9 6A2 2 0 0 0 5.9 14H10l-.7 4.2a1.8 1.8 0 0 0 3.2 1.4L17 13.5Z" />
      <path d="M17 13.5h2.5A1.5 1.5 0 0 0 21 12V5.5A1.5 1.5 0 0 0 19.5 4H17Z" />
    </svg>
  );
}

function HeartGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.7 7.9 2.3 4.8 5.4 4.1c2-.4 3.9.5 5 2.1a5.8 5.8 0 0 1 5-2.1c3.1.7 4.7 3.8 3.2 7.1-2.3 4.7-9.6 9.3-9.6 9.3Z" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
      <path d="M10 14a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1 1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Wow: the real Fluent 3D emoji photo, desaturated at rest and blooming
 * into full color once reacted — its own take on "outline until active"
 * since a photo can't be redrawn as a colored line icon. */
function WowBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
        !active && "bg-white border-2 border-gold-300"
      )}
    >
      <Image
        src="/emoji/astonished-face.png"
        alt=""
        width={32}
        height={32}
        unoptimized
        className={cn("transition-all duration-150", active ? "h-8 w-8" : "h-5 w-5 grayscale opacity-50")}
      />
    </span>
  );
}

const REACTION_CONFIG: Record<
  BusinessReactionType,
  { label: string; activeColor: string; render: (active: boolean) => ReactNode }
> = {
  LIKE: {
    label: "Like",
    activeColor: "text-sky-600",
    render: (active) => (
      <ReactionBadge active={active} gradient="bg-gradient-to-b from-sky-500 to-sky-700" ring="border-sky-300" iconColor="text-sky-500">
        <ThumbsUpGlyph />
      </ReactionBadge>
    ),
  },
  DISLIKE: {
    label: "Dislike",
    activeColor: "text-ink-700",
    render: (active) => (
      <ReactionBadge active={active} gradient="bg-gradient-to-b from-ink-500 to-ink-700" ring="border-ink-300" iconColor="text-ink-500">
        <ThumbsDownGlyph />
      </ReactionBadge>
    ),
  },
  LOVE: {
    label: "Love",
    activeColor: "text-crimson-600",
    render: (active) => (
      <ReactionBadge
        active={active}
        gradient="bg-gradient-to-b from-crimson-400 to-crimson-600"
        ring="border-crimson-300"
        iconColor="text-crimson-500"
      >
        <HeartGlyph />
      </ReactionBadge>
    ),
  },
  WOW: {
    label: "Wow",
    activeColor: "text-gold-600",
    render: (active) => <WowBadge active={active} />,
  },
};

const REACTION_TYPES: BusinessReactionType[] = ["LIKE", "DISLIKE", "LOVE", "WOW"];

/** Card description — an AI-generated summary of this business's reviews
 * when one exists, falling back to the owner-written description. Shows the
 * owner text immediately (no fetch wait) and swaps in the review summary if
 * it loads, so the card never sits empty while the network round-trips. */
function CardDescription({ business }: { business: BusinessResponse }) {
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    summaryApi
      .get(business.id)
      .then((s) => {
        if (!cancelled) setSummaryText(s.summaryText);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  const text = summaryText ?? business.description;
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
        className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
      >
        {expanded ? "See less" : "See more"}
        <ChevronDownIcon up={expanded} />
      </button>
    </div>
  );
}

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
  // Reactions are mutually exclusive — one type at a time per user, like
  // Facebook's reaction bar. Picking a new one clears whichever was active;
  // the /react endpoint only toggles a single type per call, so switching
  // costs two round trips (untoggle the old, toggle the new).
  async function react(e: MouseEvent, type: BusinessReactionType) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (reacting) return;

    const wasActive = reacted.has(type);
    const othersToClear = wasActive ? [] : [...reacted].filter((t) => t !== type);
    const prevReacted = reacted;
    const prevCounts = counts;

    setReacting(type);
    // optimistic update — flips immediately, no wait for the network round trip
    setReacted(new Set(wasActive ? [] : [type]));
    setCounts((prev) => {
      const next = { ...prev };
      next[type] += wasActive ? -1 : 1;
      for (const t of othersToClear) next[t] -= 1;
      return next;
    });

    try {
      for (const t of othersToClear) {
        await businessApi.react(business.id, t);
      }
      await businessApi.react(business.id, type);
    } catch (err) {
      // roll back on failure — restore the exact prior state rather than
      // trying to invert a multi-step switch
      setReacted(prevReacted);
      setCounts(prevCounts);
      show(errorMessage(err), "error");
    } finally {
      setReacting(null);
    }
  }

  return (
    <Card className="h-full flex flex-col rounded-xl border border-ink-100 bg-white transition-shadow duration-200 hover:shadow-lift">
      <Link href={`/business/${business.slug}`} className="flex flex-col grow">
        {/* Photo: rounded top corners, badges overlaid — category + verified
            top-left, bookmark top-right, price tier bottom-right. */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-xl bg-ink-100">
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

          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 pr-12">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
              <CategoryIcon />
              {business.categoryName}
            </span>
            {business.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                <VerifiedSealIcon />
                Verified
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3">
            <BookmarkButton businessId={business.id} iconOnly />
          </div>

          <span className="absolute bottom-3 right-3 rounded-full bg-sand-200 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
            {PRICE_TIER_LABELS[business.priceTier]}
          </span>
        </div>

        <div className="p-4 pb-0">
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

          <h3 className="font-display font-bold text-ink-900 text-lg leading-snug">{business.name}</h3>

          <div className="mt-2 flex items-center gap-2">
            <SquareStarRating rating={business.averageRating} />
            <span className="text-base font-bold text-ink-900">{business.averageRating.toFixed(1)}</span>
            <span className="text-sm text-ink-400">
              ({business.reviewCount} {business.reviewCount === 1 ? "rating" : "ratings"})
            </span>
          </div>

          <CardDescription business={business} />
        </div>
      </Link>

      {/* Footer: outside the card's Link so Share's WhatsApp/Facebook <a>
          tags never nest inside the card's own anchor. */}
      <div className="px-4 pb-4">
        <div className="mt-2 pt-2 border-t border-ink-100 grid grid-cols-5">
          {REACTION_TYPES.map((type) => {
            const { label, activeColor, render } = REACTION_CONFIG[type];
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
                  "flex flex-col items-center justify-center gap-0.5 py-0.5 text-xs font-medium transition-colors duration-150 disabled:cursor-default",
                  isActive ? activeColor : "text-ink-400"
                )}
              >
                {render(isActive)}
                <span>{counts[type]}</span>
              </button>
            );
          })}
          <ShareButton name={business.name} slug={business.slug} iconOnly />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-medium text-gold-700 truncate">
            <PinIcon />
            <span className="truncate">
              {business.areaName}, {business.cityName}
              {distance !== null && <> · {formatDistance(distance)}</>}
            </span>
          </span>
          <Link
            href={`/business/${business.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-800"
          >
            View details
            <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </Card>
  );
}
