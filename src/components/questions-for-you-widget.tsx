"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, ChevronRight, MapPin, Pencil, Rss, X } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn, timeAgo } from "@/lib/utils";
import type { CommunityQuestionRecommendation } from "@/lib/types";
import { Card } from "./ui/misc";

interface FollowState {
  following: boolean;
  count: number;
}

/**
 * "Questions for you" — Quora-style recommendation card. Personalized by the
 * viewer's own post-topic history (see CommunityPostService#recommendedQuestions),
 * so it renders nothing for a logged-out visitor or a viewer with no current
 * recommendations. Follow/Pass are real, persisted per-question actions
 * (CommunityQuestionFollow/CommunityQuestionPass on the backend) — distinct
 * from following a community member.
 */
export function QuestionsForYouWidget({ limit, className }: { limit?: number; className?: string }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [questions, setQuestions] = useState<CommunityQuestionRecommendation[] | null>(null);
  const [followState, setFollowState] = useState<Record<string, FollowState>>({});

  useEffect(() => {
    if (!user) {
      setQuestions([]);
      return;
    }
    communityApi
      .recommendedQuestions()
      .then((data) => {
        setQuestions(data);
        setFollowState(Object.fromEntries(data.map((q) => [q.id, { following: false, count: q.followerCount }])));
      })
      .catch(() => setQuestions([]));
  }, [user]);

  async function handleToggleFollow(id: string) {
    const prevState = followState[id];
    if (!prevState) return;
    const nextFollowing = !prevState.following;
    setFollowState((prev) => ({
      ...prev,
      [id]: { following: nextFollowing, count: prevState.count + (nextFollowing ? 1 : -1) },
    }));
    try {
      if (nextFollowing) await communityApi.followQuestion(id);
      else await communityApi.unfollowQuestion(id);
    } catch (err) {
      setFollowState((prev) => ({ ...prev, [id]: prevState }));
      show(errorMessage(err), "error");
    }
  }

  async function handlePass(id: string) {
    const prevQuestions = questions;
    setQuestions((prev) => (prev ? prev.filter((q) => q.id !== id) : prev));
    try {
      await communityApi.passQuestion(id);
    } catch (err) {
      setQuestions(prevQuestions);
      show(errorMessage(err), "error");
    }
  }

  if (!questions || questions.length === 0) return null;
  const visible = limit ? questions.slice(0, limit) : questions;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-crimson-600 text-white">
            <MapPin size={15} />
          </span>
          <h2 className="font-display text-sm font-bold text-ink-900">Questions for you</h2>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-300" />
      </div>

      <div className="divide-y divide-ink-100">
        {visible.map((q) => {
          const state = followState[q.id];
          return (
            <div key={q.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/community/${q.id}`}
                  className="text-[15px] font-bold leading-snug text-ink-900 hover:underline"
                >
                  {q.headline}
                </Link>
                <button
                  type="button"
                  onClick={() => handlePass(q.id)}
                  aria-label="Dismiss this question"
                  className="shrink-0 rounded-full p-1 text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-700"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-1 text-xs text-ink-400">
                {q.answerCount} {q.answerCount === 1 ? "answer" : "answers"}
                {q.lastFollowedAt && ` · Last followed ${timeAgo(q.lastFollowedAt)}`}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/community/${q.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors duration-150 hover:border-ink-300 hover:bg-ink-50"
                >
                  <Pencil size={12} className="shrink-0" /> Answer
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleFollow(q.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                    state?.following
                      ? "border-crimson-200 bg-crimson-50 text-crimson-700"
                      : "border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50"
                  )}
                >
                  <Rss size={12} className="shrink-0" />
                  {state?.following ? "Following" : "Follow"} · {state?.count ?? q.followerCount}
                </button>
                <button
                  type="button"
                  onClick={() => handlePass(q.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors duration-150 hover:border-ink-300 hover:bg-ink-50"
                >
                  <Ban size={12} className="shrink-0" /> Pass
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
