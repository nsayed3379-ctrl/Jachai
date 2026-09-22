"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn, timeUntil } from "@/lib/utils";
import type { CommunityPollResponse } from "@/lib/types";

/**
 * Reddit/Facebook-style single-choice poll — the post's own body is the
 * question, this renders the 2-6 options below it. Counts stay hidden
 * (plain clickable rows, no bars) until the viewer has voted or the poll
 * has closed, matching CommunityPostService#assemblePoll's reveal rule.
 * Sits inside the post card's <Link>, so clicks must not bubble up into a
 * navigation (same pattern as VoteControls/PostMenu).
 */
export function CommunityPoll({
  postId,
  poll,
  onVoted,
}: {
  postId: string;
  poll: CommunityPollResponse;
  onVoted: (poll: CommunityPollResponse) => void;
}) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const [voting, setVoting] = useState(false);

  const revealed = poll.myVoteOptionId !== null || poll.closed;

  async function handleVote(optionId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (voting || poll.closed) return;
    setVoting(true);
    try {
      const updated = await communityApi.votePoll(postId, optionId);
      onVoted(updated);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="mt-2.5 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((option) => {
        const isMine = poll.myVoteOptionId === option.id;
        const pct = revealed && poll.totalVotes > 0 ? Math.round(((option.voteCount ?? 0) / poll.totalVotes) * 100) : 0;

        return (
          <button
            key={option.id}
            type="button"
            onClick={(e) => handleVote(option.id, e)}
            disabled={voting || poll.closed}
            className={cn(
              "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500",
              isMine ? "border-crimson-300" : "border-ink-200 hover:border-ink-300",
              poll.closed && "cursor-default",
              !poll.closed && "cursor-pointer"
            )}
          >
            {revealed && (
              <span
                className={cn("absolute inset-y-0 left-0 transition-all duration-300", isMine ? "bg-crimson-50" : "bg-ink-100")}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            )}
            <span className="relative flex items-center justify-between gap-2">
              <span className={cn("flex items-center gap-1.5 font-medium", isMine ? "text-crimson-700" : "text-ink-800")}>
                {isMine && <Check size={14} className="shrink-0" />}
                {option.label}
              </span>
              {revealed && (
                <span className={cn("shrink-0 tabular-nums", isMine ? "text-crimson-700" : "text-ink-500")}>{pct}%</span>
              )}
            </span>
          </button>
        );
      })}

      <p className="mt-0.5 text-xs text-ink-400">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
        {poll.closed ? " · Poll closed" : ` · ${timeUntil(poll.closesAt)}`}
      </p>
    </div>
  );
}
