"use client";

import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import type { CommunityPostVoteType } from "@/lib/types";

/**
 * Reddit-style up/down vote control, shared by the feed card, the post
 * detail view, and comment rows (formerly CommunityVoteButtons — renamed,
 * same shared-component role, no duplicated voting logic). `score` is
 * server-authoritative (upvotes - downvotes); this component calls onVote
 * and lets the caller reconcile the optimistic update (see
 * lib/community-vote.ts#applyVoteDelta).
 */
export function VoteControls({
  score,
  myVote,
  onVote,
  size = "md",
  orientation = "vertical",
}: {
  score: number;
  myVote: CommunityPostVoteType | null;
  onVote: (type: CommunityPostVoteType) => Promise<void>;
  size?: "sm" | "md";
  orientation?: "vertical" | "horizontal";
}) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const [voting, setVoting] = useState(false);

  // Post cards wrap the whole card in a <Link> to the detail page — without
  // stopping propagation, a vote click bubbles up and also navigates away.
  async function handleVote(type: CommunityPostVoteType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (voting) return;
    setVoting(true);
    try {
      await onVote(type);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setVoting(false);
    }
  }

  const iconSize = size === "sm" ? 15 : 18;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const isUp = myVote === "UPVOTE";
  const isDown = myVote === "DOWNVOTE";

  // Grouped pill (used by the vertical layout below) — up arrow, score, and
  // down arrow read as one control, tinted to show the current vote state.
  const pillTone = isUp
    ? "border-crimson-200 bg-crimson-50"
    : isDown
      ? "border-ink-300 bg-ink-200/60"
      : "border-ink-200 bg-ink-50";

  if (orientation === "horizontal") {
    // Single fused pill: up arrow / label / down arrow — the label reads "Vote"
    // until the post actually has votes, then switches to the live count.
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full border pl-0.5 pr-0.5 transition-colors duration-150",
          pillTone
        )}
      >
        <button
          type="button"
          onClick={(e) => handleVote("UPVOTE", e)}
          disabled={voting}
          aria-label="Upvote"
          aria-pressed={isUp}
          title="Upvote"
          className={cn(
            "flex items-center justify-center rounded-full transition-colors duration-150 ease-out",
            size === "sm" ? "p-1" : "p-1.5",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
            "disabled:cursor-not-allowed disabled:opacity-50 active:scale-95",
            isUp ? "text-crimson-600" : "text-ink-400 hover:text-crimson-500"
          )}
        >
          <ArrowBigUp size={iconSize} fill={isUp ? "currentColor" : "none"} strokeWidth={isUp ? 1.5 : 2} />
        </button>

        <span
          className={cn(
            "px-0.5 font-medium tabular-nums",
            textSize,
            isUp && "text-crimson-600",
            isDown && "text-ink-900",
            !myVote && "text-ink-600"
          )}
        >
          {score === 0 ? "Vote" : score}
        </span>

        <button
          type="button"
          onClick={(e) => handleVote("DOWNVOTE", e)}
          disabled={voting}
          aria-label="Downvote"
          aria-pressed={isDown}
          title="Downvote"
          className={cn(
            "flex items-center justify-center rounded-full transition-colors duration-150 ease-out",
            size === "sm" ? "p-1" : "p-1.5",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
            "disabled:cursor-not-allowed disabled:opacity-50 active:scale-95",
            isDown ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
          )}
        >
          <ArrowBigDown size={iconSize} fill={isDown ? "currentColor" : "none"} strokeWidth={isDown ? 1.5 : 2} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-0.5 rounded-2xl border p-1 transition-colors duration-150", pillTone)}>
      <button
        type="button"
        onClick={(e) => handleVote("UPVOTE", e)}
        disabled={voting}
        aria-label="Upvote"
        aria-pressed={isUp}
        title="Upvote"
        className={cn(
          "flex items-center justify-center rounded-full p-1 transition-all duration-150 ease-out",
          "hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
          "disabled:cursor-not-allowed disabled:opacity-50 active:scale-90",
          isUp ? "text-crimson-600" : "text-ink-400 hover:text-crimson-500"
        )}
      >
        <ArrowBigUp size={iconSize} fill={isUp ? "currentColor" : "none"} strokeWidth={isUp ? 1.5 : 2} />
      </button>

      <span
        className={cn(
          "min-w-[1.5ch] text-center font-display font-bold tabular-nums transition-colors duration-150",
          textSize,
          isUp && "text-crimson-600",
          isDown && "text-ink-900",
          !myVote && "text-ink-700"
        )}
      >
        {score}
      </span>

      <button
        type="button"
        onClick={(e) => handleVote("DOWNVOTE", e)}
        disabled={voting}
        aria-label="Downvote"
        aria-pressed={isDown}
        title="Downvote"
        className={cn(
          "flex items-center justify-center rounded-full p-1 transition-all duration-150 ease-out",
          "hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
          "disabled:cursor-not-allowed disabled:opacity-50 active:scale-90",
          isDown ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
        )}
      >
        <ArrowBigDown size={iconSize} fill={isDown ? "currentColor" : "none"} strokeWidth={isDown ? 1.5 : 2} />
      </button>
    </div>
  );
}
