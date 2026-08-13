"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { reviewApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn, timeAgo, truncateId } from "@/lib/utils";
import type { ReviewResponse, VoteType } from "@/lib/types";
import { StarDisplay } from "./star-rating";
import { Badge } from "./ui/misc";
import { ReportButton } from "./report-button";

const CONTENT_PREVIEW_LENGTH = 220;

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
  const [expanded, setExpanded] = useState(false);
  const [failedPhotoIndexes, setFailedPhotoIndexes] = useState<Set<number>>(new Set());
  const [counts, setCounts] = useState({
    USEFUL: review.usefulCount,
    FUNNY: review.funnyCount,
    COOL: review.coolCount,
  });
  const [reacted, setReacted] = useState<Set<VoteType>>(new Set());

  const isOwnReview = user?.id === review.userId;
  const content = review.content ?? "";
  const isLong = content.length > CONTENT_PREVIEW_LENGTH;
  const shownContent = expanded || !isLong ? content : `${content.slice(0, CONTENT_PREVIEW_LENGTH).trimEnd()}…`;

  async function vote(type: VoteType) {
    if (reacted.has(type) || voting) return;
    setVoting(type);
    try {
      await reviewApi.vote(review.id, type);
      setReacted((prev) => new Set(prev).add(type));
      setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
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
            {review.userName || `reviewer ${truncateId(review.userId)}`} · {timeAgo(review.createdAt)}
          </p>
        </div>
        <ReportButton targetType="REVIEW" targetId={review.id} />
      </div>

      {content && (
        <p className="mt-2 text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
          {shownContent}
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
      )}

      {review.photoUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.photoUrls.map((url, i) =>
            failedPhotoIndexes.has(i) ? null : (
              <div key={i} className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-ink-100">
                <Image
                  src={url}
                  alt="Review photo"
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => setFailedPhotoIndexes((prev) => new Set(prev).add(i))}
                />
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ReactionButton
            icon={<LightbulbIcon />}
            count={counts.USEFUL}
            active={reacted.has("USEFUL")}
            disabled={!user || voting !== null}
            label="Mark useful"
            onClick={() => vote("USEFUL")}
          />
          <ReactionButton
            icon={<SmileyIcon />}
            count={counts.FUNNY}
            active={reacted.has("FUNNY")}
            disabled={!user || voting !== null}
            label="Mark funny"
            onClick={() => vote("FUNNY")}
          />
          <ReactionButton
            icon={<SunglassesIcon />}
            count={counts.COOL}
            active={reacted.has("COOL")}
            disabled={!user || voting !== null}
            label="Mark cool"
            onClick={() => vote("COOL")}
          />
        </div>

        {isOwnReview && review.editable && (
          <div className="flex gap-3 text-xs">
            <button onClick={() => onEdit?.(review)} className="text-crimson-700 hover:underline font-medium">
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} className="text-rose-600 hover:underline font-medium">
              Delete
            </button>
          </div>
        )}
        {isOwnReview && !review.editable && (
          <span className="text-xs text-ink-300">72h edit window closed</span>
        )}
      </div>
    </div>
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
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium transition-colors disabled:cursor-default",
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
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10.5h.01M15.5 10.5h.01" strokeLinecap="round" />
      <path d="M8 14.3c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunglassesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 8.5h4.8a2.7 2.7 0 0 1 2.6 2 2.2 2.2 0 0 0 4.2 0 2.7 2.7 0 0 1 2.6-2h4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.8" cy="12.3" r="3.2" />
      <circle cx="18.2" cy="12.3" r="3.2" />
    </svg>
  );
}
