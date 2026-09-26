"use client";

import { MessageCircle } from "lucide-react";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { ShareButton } from "./share-button";

/**
 * Bottom action row — comment count + Share. The comment count is a plain
 * indicator (not its own button) when the whole card already navigates to
 * the post on click; pass onCommentClick to make it interactive (e.g. the
 * post detail page, where there's no wrapping link to piggyback on).
 */
export function PostActions({
  commentCount,
  shareUrl,
  shareTitle,
  onCommentClick,
  label = "Comment",
}: {
  commentCount: number;
  /** Origin-relative URL of the post, e.g. `/community/${postId}` — handed to the shared ShareButton. */
  shareUrl: string;
  shareTitle: string;
  onCommentClick?: (e: React.MouseEvent) => void;
  /** Singular label — "Comment" (default) or "Answer" for a QUESTION post. Pluralized automatically. */
  label?: "Comment" | "Answer";
}) {
  const pillClass = cn(
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100",
    interactiveTransition,
    focusRing
  );
  const countLabel = `${commentCount} ${commentCount === 1 ? label : `${label}s`}`;

  return (
    <div className="flex items-center gap-1">
      {onCommentClick ? (
        <button type="button" onClick={onCommentClick} className={pillClass} aria-label={countLabel}>
          <MessageCircle size={20} strokeWidth={1.75} />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ) : (
        <span className={cn(pillClass, "pointer-events-none")} aria-label={countLabel}>
          <MessageCircle size={20} strokeWidth={1.75} />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
          <span className="hidden sm:inline">{label}</span>
        </span>
      )}
      <ShareButton url={shareUrl} title={shareTitle} iconOnly />
    </div>
  );
}
