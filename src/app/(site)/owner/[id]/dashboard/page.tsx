"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  businessApi,
  galleryApi,
  messageApi,
  reviewApi,
  summaryApi,
  uploadFileToPresignedUrl,
} from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { REPORT_REASON_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn,formatDateTime, timeAgo, truncateId } from "@/lib/utils";
import type {
  BusinessPhoto,
  BusinessResponse,
  MessageThread,
  ReviewResponse,
} from "@/lib/types";
import { StarDisplay } from "@/components/star-rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { RatingTrendChart } from "@/components/rating-trend-chart";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

type Tab = "reviews" | "trend" | "gallery";

function ReviewsTab({ business }: { business: BusinessResponse }) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);

  const load = useCallback(
    (p: number) => {
      setLoading(true);
      setError(null);
      reviewApi
        .ownerDashboard(business.id, p, 10)
        .then((res) => {
          setReviews(res.content);
          setTotalPages(res.totalPages);
        })
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false));
    },
    [business.id]
  );

  useEffect(() => {
    load(0);
    messageApi.businessInbox().then((all) => setThreads(all.filter((t) => t.businessId === business.id))).catch(() => {});
  }, [load, business.id]);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (reviews.length === 0) return <EmptyState title="No reviews yet" />;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="text-2xl font-display font-bold text-ink-900">{business.averageRating.toFixed(1)}</p>
          <p className="text-xs text-ink-400">Average rating</p>
        </div>
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="text-2xl font-display font-bold text-ink-900">{business.reviewCount}</p>
          <p className="text-xs text-ink-400">Total reviews</p>
        </div>
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="text-2xl font-display font-bold text-ink-900">{threads.length}</p>
          <p className="text-xs text-ink-400">Message threads</p>
        </div>
      </div>

      {reviews.map((r) => {
        const thread = threads.find((t) => t.consumerUserId === r.userId);
        return (
          <div key={r.id} className="border-b border-ink-100 py-4 last:border-0">
            <div className="flex items-center gap-2">
              <StarDisplay rating={r.rating} size="sm" />
              {r.visibilityStatus !== "RECOMMENDED" && (
                <Badge tone={r.visibilityStatus === "HIDDEN" ? "rose" : "gold"}>
                  {r.visibilityStatus === "HIDDEN" ? "Hidden by moderation" : "Under review"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-0.5">
              {r.userName || `reviewer ${truncateId(r.userId)}`} · {timeAgo(r.createdAt)}
            </p>
            {r.content && <p className="mt-1.5 text-sm text-ink-700">{r.content}</p>}
            <div className="mt-2">
              {thread ? (
                <Link href={`/owner/inbox/${thread.id}`} className="text-xs text-crimson-700 hover:underline">
                  Reply via message thread →
                </Link>
              ) : (
                <span className="text-xs text-ink-300" title="The customer hasn't messaged you yet — the reply channel only opens once they start a conversation.">
                  Reply unavailable until the customer messages you first
                </span>
              )}
            </div>
          </div>
        );
      })}
      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

function TrendTab({ businessId }: { businessId: string }) {
  const [bucket, setBucket] = useState<"week" | "month">("week");
  const [rows, setRows] = useState<unknown[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reviewApi
      .ratingTrend(businessId, bucket)
      .then(setRows)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [businessId, bucket]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={bucket === "week" ? "primary" : "outline"} onClick={() => setBucket("week")}>
          Weekly
        </Button>
        <Button size="sm" variant={bucket === "month" ? "primary" : "outline"} onClick={() => setBucket("month")}>
          Monthly
        </Button>
      </div>
      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && <RatingTrendChart rows={rows} />}
    </div>
  );
}

function GalleryTab({ businessId }: { businessId: string }) {
  const { show } = useToast();
  const [photos, setPhotos] = useState<BusinessPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState<{ file: File; previewUrl: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  function load() {
    setLoading(true);
    galleryApi.list(businessId).then(setPhotos).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, [businessId]);

  // Revoke any not-yet-uploaded preview URLs if the tab/page unmounts, so we
  // don't leak blob: URLs for files the owner selected but never uploaded.
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    if (photos.length + pending.length + incoming.length > 10) {
      show("Maximum 10 gallery photos.", "error");
      incoming.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setPending((prev) => [...prev, ...incoming]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePending(index: number) {
    setPending((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  async function handleUpload() {
    if (pending.length === 0) return;
    if (photos.length + pending.length > 10) {
      show("Maximum 10 gallery photos.", "error");
      return;
    }
    setUploading(true);
    try {
      for (const p of pending) {
        const presigned = await galleryApi.requestUploadUrl(businessId, p.file.name);
        await uploadFileToPresignedUrl(presigned.uploadUrl, p.file);
        await galleryApi.confirm(businessId, presigned.cdnUrlAfterUpload);
      }
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  function toggleSelected(photoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  async function deleteSelected() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`Delete ${count} selected photo${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      for (const photoId of selectedIds) {
        await galleryApi.remove(businessId, photoId);
      }
      setSelectedIds(new Set());
      load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="text-sm"
        />
        <Button size="sm" onClick={handleUpload} loading={uploading} disabled={pending.length === 0}>
          Upload{pending.length > 0 ? ` (${pending.length})` : ""}
        </Button>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="danger" onClick={deleteSelected} loading={deleting}>
            Delete selected ({selectedIds.size})
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-400 mt-1">{photos.length}/10 photos</p>

      {pending.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-ink-500 mb-1">Ready to upload — click Upload to confirm</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {pending.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div
                key={p.previewUrl}
                className="relative aspect-square rounded overflow-hidden bg-ink-100 border-2 border-dashed border-ink-300"
              >
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  aria-label="Remove from upload queue"
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-scrim/70 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {photos.map((p) => {
          const selected = selectedIds.has(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => toggleSelected(p.id)}
              aria-pressed={selected}
              aria-label={selected ? "Deselect photo" : "Select photo"}
              className={cn(
                "relative aspect-square rounded overflow-hidden bg-ink-100 text-left",
                selected && "ring-2 ring-crimson-600"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <span
                className={cn(
                  "absolute top-1 left-1 h-5 w-5 rounded border flex items-center justify-center text-[11px] font-bold",
                  selected ? "bg-crimson-600 border-crimson-600 text-white" : "bg-white/85 border-ink-300 text-transparent"
                )}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [tab, setTab] = useState<Tab>("reviews");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);

  useEffect(() => {
    businessApi
      .mine()
      .then((list) => {
        const match = list.find((b) => b.id === id);
        if (!match) setError("Business not found, or you don't own this listing.");
        else setBusiness(match);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function regenerateSummary() {
    if (!business) return;
    setRegenerating(true);
    try {
      await summaryApi.regenerate(business.id);
      show("Regeneration requested — refresh the profile page shortly.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setRegenerating(false);
    }
  }

  async function requestFlagReview() {
    if (!business) return;
    setRequestingReview(true);
    try {
      await businessApi.requestFlagReview(business.id);
      setReviewRequested(true);
      show("Admins have been notified and will take another look.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setRequestingReview(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (error || !business) return <ErrorBanner message={error ?? "Not found"} />;

  const tabs: { key: Tab; label: string }[] = [
    { key: "reviews", label: "Reviews" },
    { key: "trend", label: "Rating trend" },
    { key: "gallery", label: "Gallery" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap justify-between mb-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-900">{business.name}</h1>
          {business.verified && <VerifiedBadge />}
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${business.slug}`} className="text-xs text-ink-500 hover:underline self-center">
            View public profile →
          </Link>
          <Button size="sm" variant="outline" onClick={regenerateSummary} loading={regenerating}>
            Regenerate AI summary
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-400 mb-6">
        {business.categoryName} · {business.areaName}, {business.cityName}
      </p>

      {business.flagged && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5">
          <p className="text-sm font-semibold text-rose-700">
            ⚠ This listing has been flagged
          </p>
          <p className="mt-1 text-sm text-rose-700/90">
            A user report against this listing was reviewed and confirmed for{" "}
            {business.flagReason ? REPORT_REASON_LABELS[business.flagReason] ?? business.flagReason : "a policy violation"}.
            A warning is now visible on your public listing. Please review and update your listing so it
            complies with our community guidelines.
          </p>
          <div className="mt-3">
            {reviewRequested ? (
              <p className="text-xs text-rose-700/80">
                ✓ Admins have been notified — this will be reviewed again shortly.
              </p>
            ) : (
              <Button size="sm" variant="outline" onClick={requestFlagReview} loading={requestingReview}>
                I've fixed this — request review
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-ink-100 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === t.key ? "border-crimson-600 text-crimson-700 font-medium" : "border-transparent text-ink-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reviews" && <ReviewsTab business={business} />}
      {tab === "trend" && <TrendTab businessId={business.id} />}
      {tab === "gallery" && <GalleryTab businessId={business.id} />}
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]}>
      <DashboardContent />
    </RoleGate>
  );
}
