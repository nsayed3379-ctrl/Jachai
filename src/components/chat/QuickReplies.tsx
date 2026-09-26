"use client";

import type { AutoReply } from "@/lib/types";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";

/**
 * Suggested questions, Messenger-style — tapping a chip sends the question AND
 * auto-posts its configured answer immediately (see use-message-thread.ts's
 * sendQuickReply), rather than just filling the composer. Wraps onto multiple
 * rows within the chat window's own width instead of horizontal-scrolling
 * (which left chips looking clipped at the edge with no obvious way to see
 * the rest).
 */
export function QuickReplies({
  items,
  onPick,
  disabled,
}: {
  items: AutoReply[];
  onPick: (item: AutoReply) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item)}
          disabled={disabled}
          className={cn(
            // h-9 keeps the visual chip compact per spec; the invisible after:-inset-1
            // extends the actual tap target to 44px without growing the pill itself.
            "relative inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-ink-200 px-3.5 text-sm text-ink-700 after:absolute after:-inset-1 after:content-[''] hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:text-ink-300 dark:hover:border-crimson-800 dark:hover:bg-crimson-500/15 dark:hover:text-crimson-400",
            interactiveTransition,
            focusRing
          )}
        >
          {item.question}
        </button>
      ))}
    </div>
  );
}
