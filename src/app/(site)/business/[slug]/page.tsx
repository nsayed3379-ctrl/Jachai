"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { businessApi, claimApi, galleryApi, messageApi, reviewApi } from "@/lib/api";
import { rememberBusiness } from "@/lib/business-cache";
import { PRICE_TIER_LABELS } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessPhoto, BusinessResponse, ReviewResponse } from "@/lib/types";
import { distanceKm, formatDistance } from "@/lib/utils";
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
  const [gallery, setGallery] = useState<BusinessPhoto[]>([]);
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

  const [coverPhotoFailed, setCoverPhotoFailed] = useState(false);
  const [failedGalleryPhotoIds, setFailedGalleryPhotoIds] = useState<Set<string>>(new Set());

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
        galleryApi.list(b.id).then((g) => !cancelled && setGallery(g)).catch(() => {});
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

  return (
    <div>
      {/* Cover + gallery */}
      <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-ink-100">
<<<<<<< HEAD
        {business.coverPhotoUrl ? (
          <>
            <Image src={business.coverPhotoUrl} alt={business.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent" />
=======
        {business.coverPhotoUrl && !coverPhotoFailed ? (
          <>
            <Image
              src={business.coverPhotoUrl}
              alt={business.name}
              fill
              className="object-cover"
              priority
              onError={() => setCoverPhotoFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/50 via-transparent to-transparent" />
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300 font-display">
            {business.categoryName}
          </div>
        )}
      </div>

      {gallery.filter((p) => !failedGalleryPhotoIds.has(p.id)).length > 0 && (
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
<<<<<<< HEAD
          {gallery.slice(0, 6).map((photo) => (
            <div key={photo.id} className="relative h-16 sm:h-20 rounded-lg overflow-hidden bg-ink-100">
              <Image src={photo.url} alt="" fill className="object-cover" sizes="120px" />
            </div>
          ))}
=======
          {gallery
            .filter((p) => !failedGalleryPhotoIds.has(p.id))
            .slice(0, 6)
            .map((photo) => (
              <div key={photo.id} className="relative h-16 sm:h-20 rounded-lg overflow-hidden bg-ink-100">
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                  onError={() =>
                    setFailedGalleryPhotoIds((prev) => new Set(prev).add(photo.id))
                  }
                />
              </div>
            ))}
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
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
          <div className="mt-8">
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

<<<<<<< HEAD
          <div className="rounded-xl border border-ink-100/70 bg-white p-4 shadow-card">
=======
          <div className="rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card">
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
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
<<<<<<< HEAD
            <div className="rounded-xl border border-ink-100/70 bg-white p-4 shadow-card">
=======
            <div className="rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card">
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
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
