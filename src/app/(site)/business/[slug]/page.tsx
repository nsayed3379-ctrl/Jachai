"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { businessApi, claimApi, messageApi, reviewApi } from "@/lib/api";
import { rememberBusiness } from "@/lib/business-cache";
import { PRICE_TIER_LABELS, REPORT_REASON_LABELS } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessResponse, ReviewResponse } from "@/lib/types";
import { cn, distanceKm, formatDistance } from "@/lib/utils";
import { StarDisplay } from "@/components/star-rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { MapPreview } from "@/components/map-preview";
import { ShareButton } from "@/components/share-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { ReportButton } from "@/components/report-button";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { AiSummaryCard } from "@/components/ai-summary-card";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export default function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { show } = useToast();

  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "denied">("idle");

  const [heroIndex, setHeroIndex] = useState(0);
  const [failedPhotoIndexes, setFailedPhotoIndexes] = useState<Set<number>>(new Set());
  const thumbStripRef = useRef<HTMLDivElement>(null);

  function scrollThumbs(direction: 1 | -1) {
    thumbStripRef.current?.scrollBy({ left: direction * 200, behavior: "smooth" });
  }

  function showDistanceFromMe() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }

  const loadReviews = useCallback(
    (businessId: string, page: number) => {
      setReviewsLoading(true);
      setReviewsError(null);
      reviewApi
        .listForBusiness(businessId, page, 10)
        .then((res) => {
          setReviews(res.content);
          setReviewTotalPages(res.totalPages);
        })
        .catch((err) => {
          // Reviews require auth per current backend rules — show a
          // friendly prompt instead of a raw 401/403 if logged out.
          setReviewsError(
            user
              ? errorMessage(err)
              : "Log in to view and write reviews for this business."
          );
        })
        .finally(() => setReviewsLoading(false));
    },
    [user]
  );

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    businessApi
      .getBySlug(slug)
      .then((b) => {
        if (cancelled) return;
        setBusiness(b);
        rememberBusiness(b);
        loadReviews(b.id, 0);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function refreshReviews() {
    if (business) loadReviews(business.id, reviewPage);
  }

  async function sendMessage() {
    if (!business || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      await messageApi.send(business.id, messageText.trim());
      setMessageText("");
      show("Message sent to the owner", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSendingMessage(false);
    }
  }

  async function fileClaim() {
    if (!business) return;
    setClaiming(true);
    try {
      await claimApi.file(business.id, "PHONE");
      show("Claim filed — an admin will verify and get back to you.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (error || !business) return <ErrorBanner message={error ?? "Business not found"} />;

  const isOwnerOfThis = user?.role === "BUSINESS_OWNER";
  const photos = business.photoUrls;
  const currentPhoto = photos[heroIndex] && !failedPhotoIndexes.has(heroIndex) ? photos[heroIndex] : null;

  function goToHeroPhoto(index: number) {
    setHeroIndex((index + photos.length) % photos.length);
  }

  return (
    <div>
      {/* Cover + gallery */}
      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-ink-900">
        {currentPhoto ? (
          <>
            {/* Blurred backdrop fills the letterboxed space so the full photo can be
                shown uncropped (object-contain) without bare bars on mismatched aspect ratios. */}
            <Image src={currentPhoto} alt="" fill className="object-cover blur-2xl scale-110 opacity-50" aria-hidden />
            <Image
              src={currentPhoto}
              alt={business.name}
              fill
              className="object-contain"
              priority
              onError={() => setFailedPhotoIndexes((prev) => new Set(prev).add(heroIndex))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/40 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300 font-display">
            {business.categoryName}
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goToHeroPhoto(heroIndex - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lift hover:bg-white transition-colors"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goToHeroPhoto(heroIndex + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lift hover:bg-white transition-colors"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white">
              {heroIndex + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="relative mt-2">
          {photos.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs(-1)}
              aria-label="Scroll thumbnails left"
              className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lift text-ink-700 hover:bg-ink-50"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div
            ref={thumbStripRef}
            className="flex gap-2 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((url, i) =>
              failedPhotoIndexes.has(i) ? null : (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToHeroPhoto(i)}
                  className={cn(
                    "relative h-16 sm:h-20 w-24 sm:w-28 shrink-0 rounded-lg overflow-hidden bg-ink-100 ring-2 transition-colors",
                    i === heroIndex ? "ring-crimson-500" : "ring-transparent hover:ring-ink-200"
                  )}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    onError={() => setFailedPhotoIndexes((prev) => new Set(prev).add(i))}
                  />
                </button>
              )
            )}
          </div>
          {photos.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs(1)}
              aria-label="Scroll thumbnails right"
              className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lift text-ink-700 hover:bg-ink-50"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {business.flagged && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-rose-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-rose-700">Consumer alert</p>
            <p className="mt-0.5 text-sm text-rose-700/90">
              This listing was flagged by our moderation team for{" "}
              {business.flagReason ? REPORT_REASON_LABELS[business.flagReason] ?? business.flagReason : "a policy violation"}.
              Please exercise discretion.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl font-extrabold text-ink-900">{business.name}</h1>
                {business.verified && <VerifiedBadge />}
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {business.categoryName} · {business.areaName}, {business.cityName} ·{" "}
                {PRICE_TIER_LABELS[business.priceTier]}
                {userLocation && (
                  <>
                    {" "}
                    · {formatDistance(distanceKm(userLocation, { lat: business.latitude, lng: business.longitude }))}
                  </>
                )}
                {!userLocation && locationStatus !== "denied" && (
                  <>
                    {" "}
                    ·{" "}
                    <button
                      type="button"
                      onClick={showDistanceFromMe}
                      disabled={locationStatus === "locating"}
                      className="text-crimson-600 hover:underline disabled:opacity-60"
                    >
                      {locationStatus === "locating" ? "Locating…" : "Show distance from me"}
                    </button>
                  </>
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StarDisplay rating={business.averageRating} />
                <span className="text-sm text-ink-600">
                  {business.averageRating.toFixed(1)} ({business.reviewCount} reviews)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookmarkButton businessId={business.id} />
              <ShareButton name={business.name} slug={business.slug} />
              <ReportButton targetType="LISTING" targetId={business.id} />
            </div>
          </div>

          {business.attributes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {business.attributes.map((attr) => (
                <Badge key={attr} tone="crimson">
                  {attr}
                </Badge>
              ))}
            </div>
          )}

          {business.description && (
            <p className="mt-4 text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {business.description}
            </p>
          )}

          <div className="mt-5">
            <AiSummaryCard businessId={business.id} />
          </div>

          {!isOwnerOfThis && user && (
            <div className="mt-3">
              <button onClick={fileClaim} disabled={claiming} className="text-xs text-ink-400 hover:text-crimson-700 hover:underline">
                Is this your business? File a claim →
              </button>
            </div>
          )}

          {/* Reviews */}
          <div id="reviews" className="mt-8 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Reviews</h2>
              {user?.role === "CONSUMER" && !showReviewForm && !editingReview && (
                <Button size="sm" onClick={() => setShowReviewForm(true)}>
                  Write a review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <div className="mt-3">
                <ReviewForm
                  businessId={business.id}
                  onCancel={() => setShowReviewForm(false)}
                  onDone={() => {
                    setShowReviewForm(false);
                    refreshReviews();
                  }}
                />
              </div>
            )}
            {editingReview && (
              <div className="mt-3">
                <ReviewForm
                  businessId={business.id}
                  editing={editingReview}
                  onCancel={() => setEditingReview(null)}
                  onDone={() => {
                    setEditingReview(null);
                    refreshReviews();
                  }}
                />
              </div>
            )}

            <div className="mt-4">
              {reviewsLoading && <PageSpinner />}
              {!reviewsLoading && reviewsError && <ErrorBanner message={reviewsError} />}
              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <EmptyState title="No reviews yet" description="Be the first to share your experience." />
              )}
              {!reviewsLoading &&
                !reviewsError &&
                reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} onChanged={refreshReviews} onEdit={setEditingReview} />
                ))}
              <Pagination
                page={reviewPage}
                totalPages={reviewTotalPages}
                onChange={(p) => {
                  setReviewPage(p);
                  loadReviews(business.id, p);
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <MapPreview latitude={business.latitude} longitude={business.longitude} name={business.name} />

          <div className="rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Contact</p>
            <p className="text-sm text-ink-700">{business.contactNumber}</p>
            {business.operatingHours && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mt-3 mb-1">
                  Operating hours
                </p>
                <p className="text-sm text-ink-700 whitespace-pre-wrap">{business.operatingHours}</p>
              </>
            )}
          </div>

          {user?.role === "CONSUMER" && (
            <div className="rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
                Message the owner
              </p>
              <Textarea
                placeholder="Ask about pricing, availability, or booking…"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
              />
              <Button className="mt-2 w-full" size="sm" onClick={sendMessage} loading={sendingMessage}>
                Send message
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
