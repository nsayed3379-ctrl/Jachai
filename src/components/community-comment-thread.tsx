"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { useCommunityUsernameModal } from "@/lib/community-username-modal-context";
import { applyVoteDelta } from "@/lib/community-vote";
import { errorMessage, useToast } from "@/lib/toast-context";
import { avatarColorClass, avatarInitials, cn, timeAgo } from "@/lib/utils";
import type { CommunityCommentResponse, CommunityPostVoteType } from "@/lib/types";
import { Badge } from "./ui/misc";
import { VoteControls } from "./vote-controls";

const MAX_REPLY_DEPTH = 5;

interface ThreadProps {
  postId: string;
  comments: CommunityCommentResponse[];
  isPostAuthor: boolean;
  /** Top-level items are "Answers" (with Best Answer marking) instead of plain "Comments". */
  isQuestion?: boolean;
  onCommentAdded: (comment: CommunityCommentResponse) => void;
  onCommentChanged: (comment: CommunityCommentResponse) => void;
  onCommentDeleted: (commentId: string) => void;
  /** Marking a new best answer clears the flag everywhere else — see [postId]/page.tsx. */
  onBestAnswerMarked?: (comment: CommunityCommentResponse) => void;
  onBestAnswerUnmarked?: (comment: CommunityCommentResponse) => void;
}

/** Reddit-style threaded discussion — the API returns a flat list (parentCommentId + depth); this builds the visual tree. */
export function CommunityCommentThread({
  postId,
  comments,
  isPostAuthor,
  isQuestion = false,
  onCommentAdded,
  onCommentChanged,
  onCommentDeleted,
  onBestAnswerMarked,
  onBestAnswerUnmarked,
}: ThreadProps) {
  // A best-answer comment (if any) always sorts first — kept in sync with this render even
  // after local mark/unmark updates, not just the initial fetch order.
  const topLevel = comments
    .filter((c) => c.parentCommentId === null)
    .sort((a, b) => Number(b.isBestAnswer) - Number(a.isBestAnswer));

  if (topLevel.length === 0) {
    return <p className="text-sm text-ink-400">{isQuestion ? "No answers yet — be the first to help." : "No comments yet — be the first to reply."}</p>;
  }

  return (
    <div className="space-y-4">
      {topLevel.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          allComments={comments}
          postId={postId}
          isPostAuthor={isPostAuthor}
          isQuestion={isQuestion}
          onCommentAdded={onCommentAdded}
          onCommentChanged={onCommentChanged}
          onCommentDeleted={onCommentDeleted}
          onBestAnswerMarked={onBestAnswerMarked}
          onBestAnswerUnmarked={onBestAnswerUnmarked}
        />
      ))}
    </div>
  );
}

interface CommentNodeProps {
  comment: CommunityCommentResponse;
  allComments: CommunityCommentResponse[];
  postId: string;
  isPostAuthor: boolean;
  isQuestion: boolean;
  onCommentAdded: (comment: CommunityCommentResponse) => void;
  onCommentChanged: (comment: CommunityCommentResponse) => void;
  onCommentDeleted: (commentId: string) => void;
  onBestAnswerMarked?: (comment: CommunityCommentResponse) => void;
  onBestAnswerUnmarked?: (comment: CommunityCommentResponse) => void;
}

function CommentNode({
  comment,
  allComments,
  postId,
  isPostAuthor,
  isQuestion,
  onCommentAdded,
  onCommentChanged,
  onCommentDeleted,
  onBestAnswerMarked,
  onBestAnswerUnmarked,
}: CommentNodeProps) {
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { openModal: openUsernameModal } = useCommunityUsernameModal();
  const { show } = useToast();

  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingBest, setMarkingBest] = useState(false);

  const replies = allComments.filter((c) => c.parentCommentId === comment.id);
  const isCommentAuthor = profile?.communityProfileId === comment.author.id;
  const canDelete = isCommentAuthor || isPostAuthor;
  const displayName = comment.author.communityUsername ? `u/${comment.author.communityUsername}` : "[deleted]";
  const isAnswer = isQuestion && comment.depth === 0;

  async function handleVote(type: CommunityPostVoteType) {
    await communityApi.voteComment(postId, comment.id, type);
    onCommentChanged(applyVoteDelta(comment, type));
  }

  async function handleToggleBestAnswer() {
    if (markingBest) return;
    setMarkingBest(true);
    try {
      if (comment.isBestAnswer) {
        const updated = await communityApi.unmarkBestAnswer(postId, comment.id);
        onBestAnswerUnmarked?.(updated);
      } else {
        const updated = await communityApi.markBestAnswer(postId, comment.id);
        onBestAnswerMarked?.(updated);
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setMarkingBest(false);
    }
  }

  function startReply() {
    if (!user) {
      openLogin();
      return;
    }
    if (!profile?.communityUsername) {
      openUsernameModal(() => setReplying(true));
      return;
    }
    setReplying(true);
  }

  async function submitReply() {
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const reply = await communityApi.addComment(postId, replyText.trim(), comment.id);
      onCommentAdded(reply);
      setReplyText("");
      setReplying(false);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    try {
      await communityApi.removeComment(postId, comment.id);
      onCommentDeleted(comment.id);
      show("Comment deleted", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        comment.depth > 0 && "ml-4 border-l border-ink-100 pl-3 sm:ml-6 sm:pl-4",
        comment.isBestAnswer && "rounded-lg border border-gold-200 bg-gold-50/40 p-2.5"
      )}
    >
      {comment.isBestAnswer && (
        <Badge tone="gold" className="mb-1.5 font-semibold uppercase tracking-wide">
          <Check size={12} className="shrink-0" /> Best Answer
        </Badge>
      )}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
            avatarColorClass(comment.author.communityUsername ?? comment.author.id)
          )}
        >
          {avatarInitials(comment.author.communityUsername)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink-800">
              {comment.author.communityUsername ? (
                <Link href={`/community/u/${comment.author.communityUsername}`} className="hover:underline">
                  {displayName}
                </Link>
              ) : (
                displayName
              )}
              {comment.author.verified && (
                <span title="Verified member" className="ml-1 text-brand-600">
                  ✓
                </span>
              )}
              <span className="ml-1.5 font-normal text-ink-400">{timeAgo(comment.createdAt)}</span>
            </p>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="shrink-0 text-[11px] text-ink-400 hover:text-rose-600 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-700">{comment.content}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <VoteControls
              score={comment.score}
              myVote={comment.myVote}
              onVote={handleVote}
              size="sm"
              orientation="horizontal"
            />
            {comment.depth < MAX_REPLY_DEPTH && (
              <button type="button" onClick={startReply} className="text-xs font-medium text-ink-500 hover:text-crimson-700">
                Reply
              </button>
            )}
            {isAnswer && isPostAuthor && (
              <button
                type="button"
                onClick={handleToggleBestAnswer}
                disabled={markingBest}
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50",
                  comment.isBestAnswer ? "text-gold-700 hover:text-gold-800" : "text-ink-500 hover:text-crimson-700"
                )}
              >
                {comment.isBestAnswer && <Check size={13} className="shrink-0" />}
                {comment.isBestAnswer ? "Best Answer" : "Mark as Best Answer"}
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2 flex items-start gap-2">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitReply();
                  if (e.key === "Escape") setReplying(false);
                }}
                placeholder={`Reply to ${displayName}…`}
                className="flex-1 rounded-full border border-ink-200 bg-surface px-3.5 py-1.5 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
              />
              <button
                type="button"
                onClick={submitReply}
                disabled={submittingReply || !replyText.trim()}
                className="text-sm font-semibold text-crimson-700 disabled:opacity-40"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              allComments={allComments}
              postId={postId}
              isPostAuthor={isPostAuthor}
              isQuestion={isQuestion}
              onCommentAdded={onCommentAdded}
              onCommentChanged={onCommentChanged}
              onCommentDeleted={onCommentDeleted}
              onBestAnswerMarked={onBestAnswerMarked}
              onBestAnswerUnmarked={onBestAnswerUnmarked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
