"use client";

import { useState } from "react";
import Image from "next/image";
import { reviewApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { timeAgo, truncateId } from "@/lib/utils";
import type { ReviewResponse, VoteType } from "@/lib/types";
import { StarDisplay } from "./star-rating";
import { Badge } from "./ui/misc";
import { ReportButton } from "./report-button";

export function ReviewCard({
  review,
  onChanged,
  onEdit,
}: {
  review: ReviewResponse;
  onChanged?: () => void;
  onEdit?: (review: ReviewResponse) => void;
}) {
  const { user } = useAuth();
  const { show } = useToast();
  const [voting, setVoting] = useState<VoteType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwnReview = user?.id === review.userId;

  async function vote(type: VoteType) {
    setVoting(type);
    try {
      await reviewApi.vote(review.id, type);
      onChanged?.();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setVoting(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this review? This cannot be undone after the 72-hour window closes.")) return;
    setDeleting(true);
    try {
      await reviewApi.remove(review.id);
      show("Review deleted", "success");
      onChanged?.();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border-b border-ink-100 py-5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StarDisplay rating={review.rating} size="sm" />
            {review.visibilityStatus === "NOT_RECOMMENDED" && (
              <Badge tone="gold">Not currently recommended</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">
            reviewer {truncateId(review.userId)} · {timeAgo(review.createdAt)}
          </p>
        </div>
        <ReportButton targetType="REVIEW" targetId={review.id} />
      </div>

      {review.content && <p className="mt-2 text-sm text-ink-700 whitespace-pre-wrap">{review.content}</p>}

      {review.photoUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.photoUrls.map((url, i) => (
            <div key={i} className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-ink-100">
              <Image src={url} alt="Review photo" fill className="object-cover" sizes="80px" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs">
        <button
          onClick={() => vote("USEFUL")}
          disabled={!user || voting !== null}
          className="text-ink-500 hover:text-brand-700 disabled:opacity-50"
        >
          👍 Useful ({review.usefulCount})
        </button>
        <button
          onClick={() => vote("FUNNY")}
          disabled={!user || voting !== null}
          className="text-ink-500 hover:text-brand-700 disabled:opacity-50"
        >
          😄 Funny ({review.funnyCount})
        </button>
        <button
          onClick={() => vote("COOL")}
          disabled={!user || voting !== null}
          className="text-ink-500 hover:text-brand-700 disabled:opacity-50"
        >
          😎 Cool ({review.coolCount})
        </button>

        {isOwnReview && review.editable && (
          <div className="ml-auto flex gap-3">
            <button onClick={() => onEdit?.(review)} className="text-brand-700 hover:underline">
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} className="text-rose-600 hover:underline">
              Delete
            </button>
          </div>
        )}
        {isOwnReview && !review.editable && (
          <span className="ml-auto text-ink-300">72h edit window closed</span>
        )}
      </div>
    </div>
  );
}
