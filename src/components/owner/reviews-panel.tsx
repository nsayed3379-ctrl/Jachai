"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { messageApi, reviewApi } from "@/lib/api";
import { errorMessage } from "@/lib/toast-context";
import { timeAgo, truncateId } from "@/lib/utils";
import type { BusinessResponse, MessageThread, ReviewResponse } from "@/lib/types";
import { StarDisplay } from "@/components/star-rating";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

/** Owner's view of their reviews — includes hidden / under-review ones, with a
 *  jump to the customer's message thread when one exists. (Was the dashboard's Reviews tab.) */
export function OwnerReviewsPanel({ business }: { business: BusinessResponse }) {
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
    messageApi
      .businessInbox()
      .then((all) => setThreads(all.filter((t) => t.businessId === business.id)))
      .catch(() => {});
  }, [load, business.id]);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Reviews</h2>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="font-display text-2xl font-bold text-ink-900">{business.averageRating.toFixed(1)}</p>
          <p className="text-xs text-ink-400">Average rating</p>
        </div>
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="font-display text-2xl font-bold text-ink-900">{business.reviewCount}</p>
          <p className="text-xs text-ink-400">Total reviews</p>
        </div>
        <div className="rounded-md border border-ink-100 bg-surface p-3 text-center">
          <p className="font-display text-2xl font-bold text-ink-900">{threads.length}</p>
          <p className="text-xs text-ink-400">Message threads</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <>
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
                <p className="mt-0.5 text-xs text-ink-400">
                  {r.userName || `reviewer ${truncateId(r.userId)}`} · {timeAgo(r.createdAt)}
                </p>
                {r.content && <p className="mt-1.5 text-sm text-ink-700">{r.content}</p>}
                <div className="mt-2">
                  {thread ? (
                    <Link href={`/owner/inbox/${thread.id}`} className="text-xs text-crimson-700 hover:underline">
                      Reply via message thread →
                    </Link>
                  ) : (
                    <span
                      className="text-xs text-ink-300"
                      title="The customer hasn't messaged you yet — the reply channel only opens once they start a conversation."
                    >
                      Reply unavailable until the customer messages you first
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p);
              load(p);
            }}
          />
        </>
      )}
    </div>
  );
}
