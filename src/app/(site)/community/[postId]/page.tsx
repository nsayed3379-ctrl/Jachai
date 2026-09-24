"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Store } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { useCommunityUsernameModal } from "@/lib/community-username-modal-context";
import { applyVoteDelta } from "@/lib/community-vote";
import { COMMUNITY_POST_TYPE_META, COMMUNITY_TOPIC_LABELS } from "@/lib/community-constants";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import type { CommunityCommentResponse, CommunityPostResponse, CommunityPostVoteType } from "@/lib/types";
import { CommunityCommentThread } from "@/components/community-comment-thread";
import { CommunityMarkdown } from "@/components/community-markdown";
import { CommunityPostPhotoGrid } from "@/components/community-post-photo-grid";
import { CommunityPoll } from "@/components/community-poll";
import { PostActions } from "@/components/community-post-actions";
import { PostHeader } from "@/components/community-post-header";
import { PostMenu } from "@/components/community-post-menu";
import { QuestionStatusBadge } from "@/components/community-question-status-badge";
import { VoteControls } from "@/components/vote-controls";
import { Badge, ErrorBanner, PageSpinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

const COMMENTS_PAGE_SIZE = 200;

export default function CommunityPostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { openModal: openUsernameModal } = useCommunityUsernameModal();
  const { show } = useToast();

  const [post, setPost] = useState<CommunityPostResponse | null>(null);
  const [comments, setComments] = useState<CommunityCommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([communityApi.get(postId), communityApi.listComments(postId, 0, COMMENTS_PAGE_SIZE)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes);
        setComments(commentsRes.content);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(load, [load]);

  async function handleVote(type: CommunityPostVoteType) {
    if (!post) return;
    await communityApi.vote(post.id, type);
    setPost(applyVoteDelta(post, type));
  }

  async function handleDelete() {
    if (!post || !confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await communityApi.remove(post.id);
      show("Post deleted", "success");
      router.push("/community");
    } catch (err) {
      show(errorMessage(err), "error");
      setDeleting(false);
    }
  }

  function startComment() {
    if (!user) {
      openLogin();
      return;
    }
    if (!profile?.communityUsername) {
      openUsernameModal();
      return;
    }
  }

  async function submitComment() {
    if (!commentText.trim() || postingComment || !post) return;
    if (!user) {
      openLogin();
      return;
    }
    if (!profile?.communityUsername) {
      openUsernameModal();
      return;
    }
    setPostingComment(true);
    try {
      const comment = await communityApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText("");
      setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setPostingComment(false);
    }
  }

  function handleCommentAdded(comment: CommunityCommentResponse) {
    setComments((prev) => [...prev, comment]);
    setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
  }

  function handleCommentChanged(comment: CommunityCommentResponse) {
    setComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)));
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev));
  }

  function handleBestAnswerMarked(updated: CommunityCommentResponse) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : { ...c, isBestAnswer: false })));
    setPost((prev) => (prev && prev.questionStatus !== "CLOSED" ? { ...prev, questionStatus: "RESOLVED" } : prev));
  }

  function handleBestAnswerUnmarked(updated: CommunityCommentResponse) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setPost((prev) => (prev && prev.questionStatus !== "CLOSED" ? { ...prev, questionStatus: "OPEN" } : prev));
  }

  async function handleCloseQuestion() {
    if (!post) return;
    try {
      await communityApi.closeQuestion(post.id);
      setPost((prev) => (prev ? { ...prev, questionStatus: "CLOSED" } : prev));
      show("Question closed", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    }
  }

  async function handleReopenQuestion() {
    if (!post) return;
    try {
      await communityApi.reopenQuestion(post.id);
      const hasBestAnswer = comments.some((c) => c.isBestAnswer);
      setPost((prev) => (prev ? { ...prev, questionStatus: hasBestAnswer ? "RESOLVED" : "OPEN" } : prev));
      show("Question reopened", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    }
  }

  async function handleShare() {
    if (!post) return;
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

  function focusCommentInput() {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (loading) return <PageSpinner />;
  if (error || !post) return <ErrorBanner message={error ?? "Post not found"} />;

  const isAuthor = profile?.communityProfileId === post.author.id;
  const isQuestion = post.postType === "QUESTION";
  const typeMeta = COMMUNITY_POST_TYPE_META[post.postType];
  const business = post.mentionedBusinesses[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-0">
      <Link href="/community" className="text-sm font-medium text-ink-500 hover:text-ink-800">
        ← Back to Community
      </Link>

      <div className="mt-4 rounded-xl border border-ink-100 bg-surface p-5 transition-shadow duration-200 hover:shadow-card">
        <div className="flex items-start justify-between gap-2">
          <PostHeader author={post.author} area={post.area} createdAt={post.createdAt} size="md" />
          <PostMenu
            isAuthor={isAuthor}
            canReport={Boolean(user) && !isAuthor}
            targetId={post.id}
            onDelete={handleDelete}
            deleting={deleting}
            questionStatus={post.questionStatus}
            onCloseQuestion={handleCloseQuestion}
            onReopenQuestion={handleReopenQuestion}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {post.postType !== "DISCUSSION" && (
            <Badge tone={post.postType === "RECOMMENDATION" ? "gold" : "neutral"}>
              <typeMeta.icon size={11} className="shrink-0" /> {typeMeta.label}
            </Badge>
          )}
          {post.questionStatus && <QuestionStatusBadge status={post.questionStatus} />}
          <Badge tone="crimson">{COMMUNITY_TOPIC_LABELS[post.topic]}</Badge>
        </div>

        {post.title && (
          <h1 className="mt-2 font-display text-xl font-bold leading-snug text-ink-900">{post.title}</h1>
        )}

        {post.body && (
          <CommunityMarkdown
            className={cn(post.title ? "mt-2 text-sm text-ink-700" : "mt-2 text-base text-ink-900")}
          >
            {post.body}
          </CommunityMarkdown>
        )}

        {post.postType === "POLL" && post.poll && (
          <CommunityPoll postId={post.id} poll={post.poll} onVoted={(poll) => setPost((prev) => (prev ? { ...prev, poll } : prev))} />
        )}

        <CommunityPostPhotoGrid urls={post.imageUrls} />

        {business && (
          <Link
            href={`/business/${business.slug}`}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100"
          >
            <Store size={13} className="shrink-0" /> {business.name}
            {business.verified && <BadgeCheck size={14} className="shrink-0 text-brand-600" aria-label="Verified business" />}
          </Link>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-100 pt-3">
          <VoteControls score={post.score} myVote={post.myVote} onVote={handleVote} orientation="horizontal" />
          <PostActions
            commentCount={isQuestion ? post.answerCount : post.commentCount}
            onShare={handleShare}
            onCommentClick={focusCommentInput}
            label={isQuestion ? "Answer" : "Comment"}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-ink-900">
          {isQuestion
            ? `${post.answerCount} Answer${post.answerCount === 1 ? "" : "s"}`
            : `${post.commentCount} Comment${post.commentCount === 1 ? "" : "s"}`}
        </h2>

        {isQuestion && post.questionStatus === "CLOSED" ? (
          <p className="mt-2 text-sm text-ink-400">This question is closed to new answers.</p>
        ) : user ? (
          <div className="mt-2 flex items-start gap-2">
            <input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onFocus={startComment}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitComment();
              }}
              placeholder={isQuestion ? "Write your answer…" : "Add a comment…"}
              className="flex-1 rounded-full border border-ink-200 bg-surface px-3.5 py-2 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
            />
            <Button size="sm" onClick={submitComment} loading={postingComment} disabled={!commentText.trim()}>
              {isQuestion ? "Post Answer" : "Comment"}
            </Button>
          </div>
        ) : (
          <button type="button" onClick={openLogin} className="mt-2 text-sm text-crimson-700 hover:underline">
            {isQuestion ? "Log in to answer" : "Log in to comment"}
          </button>
        )}

        <div className="mt-5">
          <CommunityCommentThread
            postId={post.id}
            comments={comments}
            isPostAuthor={isAuthor}
            isQuestion={isQuestion}
            onCommentAdded={handleCommentAdded}
            onCommentChanged={handleCommentChanged}
            onCommentDeleted={handleCommentDeleted}
            onBestAnswerMarked={handleBestAnswerMarked}
            onBestAnswerUnmarked={handleBestAnswerUnmarked}
          />
        </div>
      </div>
    </div>
  );
}
