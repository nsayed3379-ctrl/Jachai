"use client";

import { useState } from "react";
import { Heart, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { businessApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessReactionType, BusinessResponse } from "@/lib/types";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";

const REACTION_META: Record<BusinessReactionType, { labelKey: string; icon: typeof ThumbsUp }> = {
  LIKE: { labelKey: "common.reaction.like", icon: ThumbsUp },
  DISLIKE: { labelKey: "common.reaction.dislike", icon: ThumbsDown },
  LOVE: { labelKey: "common.reaction.love", icon: Heart },
  WOW: { labelKey: "common.reaction.wow", icon: Sparkles },
};

const REACTION_TYPES: BusinessReactionType[] = ["LIKE", "DISLIKE", "LOVE", "WOW"];

/**
 * Business-level reaction row — lives on the business page only (business
 * cards just show the save heart; a 5-way reaction row on every card in a
 * feed was the original source of the "too small, too noisy" complaint).
 * Reactions are mutually exclusive per user, like Facebook's reaction bar —
 * picking a new one clears whichever was active.
 */
export function BusinessReactionBar({ business }: { business: BusinessResponse }) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const { t } = useLanguage();
  const [counts, setCounts] = useState<Record<BusinessReactionType, number>>({
    LIKE: business.totalLikeCount,
    DISLIKE: business.totalDislikeCount,
    LOVE: business.totalLoveCount,
    WOW: business.totalWowCount,
  });
  const [reacted, setReacted] = useState<Set<BusinessReactionType>>(new Set());
  const [reacting, setReacting] = useState<BusinessReactionType | null>(null);

  async function react(type: BusinessReactionType) {
    if (!user) {
      openLogin();
      return;
    }
    if (reacting) return;

    const wasActive = reacted.has(type);
    const othersToClear = wasActive ? [] : [...reacted].filter((t) => t !== type);
    const prevReacted = reacted;
    const prevCounts = counts;

    setReacting(type);
    setReacted(new Set(wasActive ? [] : [type]));
    setCounts((prev) => {
      const next = { ...prev };
      next[type] += wasActive ? -1 : 1;
      for (const t of othersToClear) next[t] -= 1;
      return next;
    });

    try {
      for (const t of othersToClear) {
        await businessApi.react(business.id, t);
      }
      await businessApi.react(business.id, type);
    } catch (err) {
      setReacted(prevReacted);
      setCounts(prevCounts);
      show(errorMessage(err), "error");
    } finally {
      setReacting(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_TYPES.map((type) => {
        const { labelKey, icon: Icon } = REACTION_META[type];
        const label = t(labelKey);
        const isActive = reacted.has(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => react(type)}
            disabled={reacting !== null}
            aria-pressed={isActive}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium disabled:cursor-default disabled:opacity-60",
              interactiveTransition,
              focusRing,
              isActive
                ? "bg-crimson-50 text-crimson-600 dark:bg-crimson-500/15 dark:text-crimson-400"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            )}
          >
            <Icon size={18} strokeWidth={1.75} fill={isActive ? "currentColor" : "none"} />
            <span className="hidden sm:inline">{label}</span>
            <span className="tabular-nums">{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
