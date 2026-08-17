"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { businessApi, messageApi, referenceApi, reviewApi } from "@/lib/api";
import { rememberBusiness } from "@/lib/business-cache";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessResponse, ReviewResponse, ReviewSortOption } from "@/lib/types";
import { StarDisplay } from "@/components/star-rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { MapPreview } from "@/components/map-preview";
import { ShareButton } from "@/components/share-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { ClaimBusinessModal } from "@/components/claim-business-modal";
import { ReportButton } from "@/components/report-button";
import { BusinessCard } from "@/components/business-card";
import { BusinessHeroGallery } from "@/components/business-hero-gallery";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { AiSummaryCard } from "@/components/ai-summary-card";
import { RatingBreakdownChart } from "@/components/rating-breakdown-chart";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
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
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>("newest");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsAuthRequired, setReviewsAuthRequired] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "denied">("idle");

  function openReviewForm() {
    setShowReviewForm(true);
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    (businessId: string, page: number, sort: ReviewSortOption = reviewSort) => {
      setReviewsLoading(true);
      setReviewsError(null);
      setReviewsAuthRequired(false);
      reviewApi
        .listForBusiness(businessId, page, 10, sort)
        .then((res) => {
          setReviews(res.content);
          setReviewTotalPages(res.totalPages);
        })
        .catch((err) => {
          // Reviews require auth per current backend rules — a polished CTA
          // renders for the logged-out case instead of a raw 401/403 banner.
          if (user) {
            setReviewsError(errorMessage(err));
          } else {
            setReviewsAuthRequired(true);
          }
        })
        .finally(() => setReviewsLoading(false));
    },
    [user, reviewSort]
  );

  function changeReviewSort(sort: ReviewSortOption) {
    setReviewSort(sort);
    setReviewPage(0);
    if (business) loadReviews(business.id, 0, sort);
  }

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

  const [similarBusinesses, setSimilarBusinesses] = useState<BusinessResponse[]>([]);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    // BusinessResponse only carries categoryName, not categoryId — look the id
    // up from the public category list rather than fabricating a filter.
    referenceApi
      .categories()
      .then((categories) => {
        const category = categories.find((c) => c.name === business.categoryName);
        if (!category) return null;
        return businessApi.search({ categoryId: category.id, sort: "rating", size: 7 });
      })
      .then((res) => {
        if (cancelled || !res) return;
        setSimilarBusinesses(res.content.filter((b) => b.id !== business.id).slice(0, 6));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [business?.id, business?.categoryName]);

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

  function refreshBusiness() {
    if (!slug) return;
    businessApi.getBySlug(slug).then((b) => {
      setBusiness(b);
      rememberBusiness(b);
    });
  }

  if (loading) return <PageSpinner />;
  if (error || !business) return <ErrorBanner message={error ?? "Business not found"} />;

  const photos = business.photoUrls;

  return (
    <div>
      <BusinessHeroGallery
        business={business}
        userLocation={userLocation}
        locationStatus={locationStatus}
        onShowDistance={showDistanceFromMe}
      />

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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main column */}
        <div className="lg:col-span-2">
          {/* Action row: Yelp-style — a prominent primary CTA, then icon+label utility actions.
              Name/rating/category/hours now live in the hero overlay itself. */}
          <div className="flex flex-wrap items-center gap-2">
            {user && !showReviewForm && !editingReview && (
              <Button onClick={openReviewForm}>Write a Review</Button>
            )}
            <BookmarkButton businessId={business.id} />
            <ShareButton name={business.name} slug={business.slug} />
            <ReportButton targetType="LISTING" targetId={business.id} />
          </div>

          {business.description && (
            <div className="mt-5">
              <h2 className="font-display text-lg font-semibold text-ink-900 mb-2">About the Business</h2>
              <AboutText text={business.description} />
            </div>
          )}

          {business.attributes.length > 0 && (
            <div className="mt-5">
              <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Amenities and More</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                {business.attributes.map((attr) => (
                  <div key={attr} className="flex items-center gap-2 text-sm text-ink-700">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none text-ink-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10.5 8 14l8-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {attr}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <AiSummaryCard businessId={business.id} />
          </div>

          {/* Reviews */}
          <div id="reviews" className="mt-8 scroll-mt-20 border-t border-ink-100 pt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-ink-900">Recommended Reviews</h2>
              {!reviewsAuthRequired && reviews.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-ink-500">
                  Sort by
                  <select
                    value={reviewSort}
                    onChange={(e) => changeReviewSort(e.target.value as ReviewSortOption)}
                    className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </label>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-6 mb-2">
              <div className="text-center">
                <p className="font-display text-3xl font-extrabold text-ink-900">{business.averageRating.toFixed(1)}</p>
                <StarDisplay rating={business.averageRating} />
              </div>
              <RatingBreakdownChart businessId={business.id} />
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

              {!reviewsLoading && reviewsAuthRequired && (
                <div className="rounded-xl border border-ink-100 bg-sand-50/60 p-6 text-center">
                  <p className="font-display text-base font-semibold text-ink-900">Share your experience</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Log in to read what others said and write your own review of {business.name}.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Link href="/login">
                      <Button size="sm">Log in</Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" variant="outline">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!reviewsLoading && !reviewsAuthRequired && reviewsError && <ErrorBanner message={reviewsError} />}

              {!reviewsLoading && !reviewsAuthRequired && !reviewsError && reviews.length === 0 && (
                <EmptyState
                  title="No reviews yet"
                  description="Be the first to share your experience with this business."
                  action={
                    user && !showReviewForm ? (
                      <Button size="sm" onClick={openReviewForm}>
                        Write the first review
                      </Button>
                    ) : undefined
                  }
                />
              )}

              {!reviewsLoading &&
                !reviewsAuthRequired &&
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

          {similarBusinesses.length > 0 && (
            <div className="mt-8 border-t border-ink-100 pt-6">
              <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Similar businesses nearby</h2>
              <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {similarBusinesses.map((b) => (
                  <div key={b.id} className="w-56 shrink-0">
                    <BusinessCard business={b} userLocation={userLocation ?? undefined} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — sticky on desktop so it stays useful while the (much longer) main column scrolls. */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <MapPreview latitude={business.latitude} longitude={business.longitude} name={business.name} />

          {business.verified && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex items-center gap-2">
                <VerifiedBadge compact />
                <p className="text-sm font-semibold text-brand-800">Verified Business</p>
              </div>
              <p className="mt-1.5 text-xs text-brand-700/80 leading-relaxed">
                Jachai has verified this business&apos;s registered contact number.
              </p>
            </div>
          )}

          {user && !business.claimed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Unclaimed listing</p>
              <p className="mt-1.5 text-xs text-amber-800/80 leading-relaxed">
                This business hasn&apos;t been claimed by its owner yet. Is it yours?
              </p>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setClaimModalOpen(true)}>
                Claim this business
              </Button>
              <ClaimBusinessModal
                open={claimModalOpen}
                onClose={() => setClaimModalOpen(false)}
                businessId={business.id}
                businessName={business.name}
                onClaimed={refreshBusiness}
              />
            </div>
          )}

          <div className="rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card space-y-3">
            <a href={`tel:${business.contactNumber}`} className="flex items-center gap-2.5 text-sm text-ink-700 hover:text-crimson-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-ink-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {business.contactNumber}
            </a>
            {business.operatingHours && (
              <div className="flex items-start gap-2.5 text-sm text-ink-700">
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-ink-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="whitespace-pre-wrap">{business.operatingHours}</span>
              </div>
            )}
            <div className="flex items-start gap-2.5 text-sm text-ink-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-ink-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span>
                {business.areaName}, {business.cityName}
              </span>
            </div>
          </div>

          {user && (
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

const ABOUT_PREVIEW_LENGTH = 280;

function AboutText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > ABOUT_PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : `${text.slice(0, ABOUT_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
      {shown}
      {isLong && !expanded && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="font-semibold text-crimson-700 hover:underline"
          >
            Read more
          </button>
        </>
      )}
    </p>
  );
}
