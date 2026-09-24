"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { avatarColorClass, avatarInitials, cn, timeAgo } from "@/lib/utils";
import type { CommunityAreaSummary, CommunityAuthorSummary } from "@/lib/types";

/**
 * Author identity row — Quora-style two-line header: name + inline Follow
 * link on the first line, area/timestamp subtitle on the second. Shared by
 * the feed card and the post detail page so both read as the same product
 * (formerly two hand-duplicated blocks with slightly different markup/spacing).
 * Follow state is local-only (the post/comment payload doesn't carry the
 * viewer's follow relationship to the author) — it calls the same
 * follow/unfollow endpoint as the Following/Followers list, just without a
 * server-confirmed starting state.
 */
export function PostHeader({
  author,
  area,
  createdAt,
  size = "sm",
}: {
  author: CommunityAuthorSummary;
  area?: CommunityAreaSummary | null;
  createdAt: string;
  size?: "sm" | "md";
}) {
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const [following, setFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const displayName = author.communityUsername ? `u/${author.communityUsername}` : "[deleted]";
  const avatarSize = size === "md" ? "h-9 w-9 text-xs" : "h-8 w-8 text-[11px]";
  const nameSize = size === "md" ? "text-sm" : "text-[13px]";
  const isSelf = profile?.communityProfileId === author.id;

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      if (following) {
        await communityApi.unfollow(author.id);
        setFollowing(false);
      } else {
        await communityApi.follow(author.id);
        setFollowing(true);
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
          avatarSize,
          avatarColorClass(author.communityUsername ?? author.id)
        )}
      >
        {avatarInitials(author.communityUsername)}
      </div>
      <div className="min-w-0 leading-tight">
        <p className={cn("flex flex-wrap items-center gap-x-1 gap-y-0.5", nameSize)}>
          {author.communityUsername ? (
            <Link
              href={`/community/u/${author.communityUsername}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 truncate font-semibold text-ink-800 hover:underline"
            >
              {displayName}
              {author.verified && <BadgeCheck size={size === "md" ? 15 : 13} className="shrink-0 text-brand-600" aria-label="Verified member" />}
            </Link>
          ) : (
            <span className="truncate font-semibold text-ink-800">{displayName}</span>
          )}
          {!isSelf && author.communityUsername && (
            <>
              <span className="text-ink-300">·</span>
              <button
                type="button"
                onClick={handleFollow}
                disabled={toggling}
                className={cn(
                  "font-semibold transition-colors duration-150 disabled:opacity-50",
                  following ? "text-ink-400 hover:text-ink-600" : "text-crimson-600 hover:text-crimson-700 hover:underline"
                )}
              >
                {following ? "Following" : "Follow"}
              </button>
            </>
          )}
        </p>
        <p className="text-xs text-ink-400">
          {area && `${area.name} · `}
          {timeAgo(createdAt)}
        </p>
      </div>
    </div>
  );
}
