"use client";

import { useState } from "react";
import Link from "next/link";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { avatarColorClass, avatarInitials, cn, timeAgo } from "@/lib/utils";
import type { CommunityCommentResponse, CommunityPostReactionType, CommunityPostResponse } from "@/lib/types";
import { Spinner } from "./ui/misc";

const REACTIONS: { type: CommunityPostReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
];

// Text-only posts (no image) get a colored card, like the target design's
// "question" post — purely a visual treatment, deterministic per post id so
// a given post doesn't change color on re-render.
const TEXT_CARD_GRADIENTS = [
  "from-crimson-600 to-crimson-800",
  "from-brand-600 to-brand-800",
  "from-gold-600 to-gold-800",
  "from-ink-700 to-ink-900",
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TEXT_CARD_GRADIENTS[hash % TEXT_CARD_GRADIENTS.length];
}

export function CommunityPostCard({
  post,
  onChanged,
  onDeleted,
}: {
  post: CommunityPostResponse;
  onChanged: (post: CommunityPostResponse) => void;
  onDeleted: (postId: string) => void;
}) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();

  const [reacting, setReacting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommunityCommentResponse[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const isAuthor = user?.id === post.author.id;
  const displayName = post.author.name || "Community member";

  async function react(type: CommunityPostReactionType) {
    if (!user) {
      openLogin();
      return;
    }
    if (reacting) return;
    setReacting(true);
    setPickerOpen(false);
    try {
      await communityApi.react(post.id, type);
      const refreshed = await communityApi.get(post.id);
      onChanged(refreshed);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setReacting(false);
    }
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

  async function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        const res = await communityApi.listComments(post.id, 0, 20);
        setComments(res.content);
      } catch (err) {
        show(errorMessage(err), "error");
      } finally {
        setLoadingComments(false);
      }
    }
  }

  async function submitComment() {
    if (!user) {
      openLogin();
      return;
    }
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const comment = await communityApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...(prev ?? []), comment]);
      setCommentText("");
      onChanged({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setPostingComment(false);
    }
  }

  async function deleteComment(commentId: string) {
    try {
      await communityApi.removeComment(post.id, commentId);
      setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
      onChanged({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
    } catch (err) {
      show(errorMessage(err), "error");
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/community#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "Jachai Community" });
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

  const activeReaction = REACTIONS.find((r) => r.type === post.myReaction);
  const topReactions = REACTIONS.filter((r) => {
    const key = `${r.type.toLowerCase()}Count` as
      | "likeCount"
      | "loveCount"
      | "hahaCount"
      | "wowCount"
      | "sadCount"
      | "angryCount";
    return post[key] > 0;
  }).slice(0, 3);

  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
              avatarColorClass(post.author.name ?? post.author.id)
            )}
          >
            {avatarInitials(post.author.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-900">{displayName}</p>
            <p className="text-xs text-ink-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-ink-400 hover:text-rose-600 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {post.content && !post.imageUrl ? (
        <div
          className={cn(
            "mt-3 rounded-xl bg-gradient-to-br p-5 text-base font-medium text-white shadow-inner",
            gradientFor(post.id)
          )}
        >
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      ) : (
        post.content && <p className="mt-3 whitespace-pre-wrap text-sm text-ink-800">{post.content}</p>
      )}

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 max-h-[480px] w-full rounded-lg object-cover" />
      )}

      {post.mentionedBusinesses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.mentionedBusinesses.map((b) => (
            <Link
              key={b.id}
              href={`/business/${b.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2.5 py-1 text-xs font-medium text-crimson-700 hover:bg-crimson-100"
            >
              @{b.name}
              {b.verified && <span title="Verified business">✓</span>}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2 text-xs text-ink-400">
        <span className="flex items-center gap-1">
          {topReactions.length > 0 && (
            <span className="flex items-center -space-x-1">
              {topReactions.map((r) => (
                <span
                  key={r.type}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[10px] ring-1 ring-surface"
                >
                  {r.emoji}
                </span>
              ))}
            </span>
          )}
          {post.totalReactionCount > 0 && <span>{post.totalReactionCount}</span>}
        </span>
        <span>{post.commentCount > 0 ? `${post.commentCount} comments` : ""}</span>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-1 border-t border-ink-100 pt-1">
        <div
          className="relative"
          onMouseEnter={() => setPickerOpen(true)}
          onMouseLeave={() => setPickerOpen(false)}
        >
          <button
            type="button"
            onClick={() => react(activeReaction?.type ?? "LIKE")}
            disabled={reacting}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-ink-50 disabled:opacity-50",
              activeReaction ? "text-crimson-700" : "text-ink-600"
            )}
          >
            <span>{activeReaction?.emoji ?? "👍"}</span>
            {activeReaction?.label ?? "Like"}
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-ink-100 bg-surface px-2 py-1.5 shadow-pop">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => react(r.type)}
                  title={r.label}
                  className="text-lg transition-transform hover:scale-125"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleComments}
          className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          💬 Comment
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          📤 Share
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-2 border-t border-ink-100 pt-3">
          {loadingComments && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {!loadingComments && (
            <div className="space-y-3">
              {(comments ?? []).map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                      avatarColorClass(c.author.name ?? c.author.id)
                    )}
                  >
                    {avatarInitials(c.author.name)}
                  </div>
                  <div className="flex-1 rounded-lg bg-ink-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink-900">{c.author.name || "Community member"}</p>
                      {(user?.id === c.author.id || isAuthor) && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-[11px] text-ink-400 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-700">{c.content}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))}
              {(comments ?? []).length === 0 && <p className="text-xs text-ink-400">No comments yet.</p>}
            </div>
          )}

          {user ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitComment();
                }}
                placeholder="Write a comment…"
                className="flex-1 rounded-full border border-ink-200 bg-surface px-3.5 py-2 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={postingComment || !commentText.trim()}
                className="text-sm font-semibold text-crimson-700 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          ) : (
            <button type="button" onClick={openLogin} className="mt-3 text-xs text-crimson-700 hover:underline">
              Log in to comment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
