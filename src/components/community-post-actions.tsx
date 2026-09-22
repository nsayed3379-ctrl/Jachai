"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom action row — comment count + Share, icon-first (Quora/Reddit-style:
 * icon + bare number, no "Comments"/"Share" word) with the full phrase kept
 * as the accessible name for screen readers. The comment count is a plain
 * indicator (not its own button) when the whole card already navigates to
 * the post on click; pass onCommentClick to make it interactive (e.g. the
 * post detail page, where there's no wrapping link to piggyback on).
 */
export function PostActions({
  commentCount,
  onShare,
  onCommentClick,
  label = "Comment",
}: {
  commentCount: number;
  onShare: (e: React.MouseEvent) => void;
  onCommentClick?: (e: React.MouseEvent) => void;
  /** Singular label — "Comment" (default) or "Answer" for a QUESTION post. Pluralized automatically. */
  label?: "Comment" | "Answer";
}) {
  const pillClass =
    "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-medium text-ink-500 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500";
  const countLabel = `${commentCount} ${commentCount === 1 ? label : `${label}s`}`;

  return (
    <div className="flex items-center gap-1">
      {onCommentClick ? (
        <button type="button" onClick={onCommentClick} className={pillClass} aria-label={countLabel}>
          <MessageCircle size={15} />
          {commentCount}
        </button>
      ) : (
        <span className={cn(pillClass, "pointer-events-none")} aria-label={countLabel}>
          <MessageCircle size={15} />
          {commentCount}
        </span>
      )}
      <button type="button" onClick={onShare} className={pillClass} aria-label="Share this post">
        <Share2 size={15} />
      </button>
    </div>
  );
}
