"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Store, X } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { COMMUNITY_POST_TYPE_META, COMMUNITY_TOPIC_LABELS } from "@/lib/community-constants";
import { applyVoteDelta } from "@/lib/community-vote";
import type { CommunityPollResponse, CommunityPostResponse, CommunityPostVoteType } from "@/lib/types";
import { CommunityMarkdown } from "./community-markdown";
import { CommunityPostPhotoGrid } from "./community-post-photo-grid";
import { CommunityPoll } from "./community-poll";
import { QuestionStatusBadge } from "./community-question-status-badge";
import { VoteControls } from "./vote-controls";
import { PostHeader } from "./community-post-header";
import { PostActions } from "./community-post-actions";
import { PostMenu } from "./community-post-menu";
import { Badge } from "./ui/misc";

/**
 * Reddit-inspired feed post — the container piece (CommunityPost) that
 * composes VoteControls / PostHeader / PostActions / PostMenu. Same
 * data/props contract as before the redesign: caller still owns the list
 * and passes onChanged/onDeleted to splice this post's slot.
 */
export function CommunityPostCard({
  post,
  onChanged,
  onDeleted,
}: {
  post: CommunityPostResponse;
  onChanged: (post: CommunityPostResponse) => void;
  onDeleted: (postId: string) => void;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { show } = useToast();
  const [deleting, setDeleting] = useState(false);

  const isAuthor = profile?.communityProfileId === post.author.id;
  const typeMeta = COMMUNITY_POST_TYPE_META[post.postType];
  const business = post.mentionedBusinesses[0] ?? null;

  async function handleVote(type: CommunityPostVoteType) {
    await communityApi.vote(post.id, type);
    onChanged(applyVoteDelta(post, type));
  }

  function handlePollVoted(poll: CommunityPollResponse) {
    onChanged({ ...post, poll });
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await communityApi.remove(post.id);
      onDeleted(post.id);
      show("Post deleted", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  // Local-only "not interested" dismiss — same list-splice the parent already
  // does after a real delete, just without the server call/confirmation. The
  // post isn't touched server-side, so it comes back on a fresh page load.
  function handleHide(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDeleted(post.id);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/community/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: post.title ?? "Jachai Community" });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      show("Link copied", "success");
    } catch {
      show(url, "info");
    }
  }

  // Plain div instead of a wrapping <Link> — the header and business badge
  // below render their own <a> tags, and nested anchors are invalid HTML
  // that Next hydrates differently than the browser parses (causes the
  // "In HTML, <a> cannot be a descendant of <a>" DOM-nesting error).
  const postHref = `/community/${post.id}`;
  function handleCardClick() {
    router.push(postHref);
  }
  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(postHref);
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group flex cursor-pointer flex-col py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500"
    >
      <div className="flex items-start justify-between gap-2">
        <PostHeader author={post.author} area={post.area} createdAt={post.createdAt} size="sm" />
        <button
          type="button"
          onClick={handleHide}
          aria-label="Hide this post"
          title="Not interested — hide this post"
          className="shrink-0 rounded-full p-1 text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {post.postType !== "DISCUSSION" && (
          <Badge tone={post.postType === "RECOMMENDATION" ? "gold" : "neutral"} className="uppercase tracking-wide">
            <typeMeta.icon size={11} className="shrink-0" /> {typeMeta.label}
          </Badge>
        )}
        {post.questionStatus && <QuestionStatusBadge status={post.questionStatus} />}
        <Badge tone="crimson" className="border-crimson-100 bg-crimson-50/70 font-medium">
          {COMMUNITY_TOPIC_LABELS[post.topic]}
        </Badge>
      </div>

      {post.title && (
        <h3 className="mt-2 font-display text-[15px] font-bold leading-snug text-ink-900">{post.title}</h3>
      )}

      {post.body && (
        <>
          <CommunityMarkdown
            className={cn(
              "line-clamp-3 overflow-hidden",
              post.title ? "mt-1 text-sm text-ink-600" : "mt-2 text-[15px] font-medium text-ink-900"
            )}
          >
            {post.body}
          </CommunityMarkdown>
          {/* Heuristic on raw length, not rendered height — good enough to tell
              whether the line-clamp above is actually cutting the body off. */}
          {post.body.length > 140 && <span className="text-sm font-medium text-crimson-600">(more)</span>}
        </>
      )}

      {post.postType === "POLL" && post.poll && (
        <CommunityPoll postId={post.id} poll={post.poll} onVoted={handlePollVoted} />
      )}

      <CommunityPostPhotoGrid urls={post.imageUrls} maxVisible={4} />

      {business && (
        <span onClick={(e) => e.stopPropagation()} className="mt-2.5 inline-block">
          <Link
            href={`/business/${business.slug}`}
            className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors duration-150 hover:bg-ink-100"
          >
            <Store size={12} className="shrink-0" /> {business.name}
            {business.verified && <BadgeCheck size={13} className="shrink-0 text-brand-600" aria-label="Verified business" />}
          </Link>
        </span>
      )}

      {/* Quora-style action row: separate "Upvote · N" / bare-downvote pills
          (not one fused Reddit-style score pill), matching the reference feed card. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <VoteControls
            score={post.score}
            upvoteCount={post.upvoteCount}
            myVote={post.myVote}
            onVote={handleVote}
            size="sm"
            orientation="split"
          />
          <PostActions
            commentCount={post.postType === "QUESTION" ? post.answerCount : post.commentCount}
            onShare={handleShare}
            label={post.postType === "QUESTION" ? "Answer" : "Comment"}
          />
        </div>
        <PostMenu
          isAuthor={isAuthor}
          canReport={Boolean(user) && !isAuthor}
          targetId={post.id}
          onDelete={handleDelete}
          deleting={deleting}
        />
      </div>
    </div>
  );
}
