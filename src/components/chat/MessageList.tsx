"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ui/misc";
import { dayLabel, groupMessages, initials, isNewDay } from "./chat-utils";
import { MessageBubble, type BubbleStatus } from "./MessageBubble";

function SkeletonBubble({ align }: { align: "left" | "right" }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <div className={cn("skeleton animate-shimmer h-9 w-2/5 max-w-[200px] rounded-2xl", align === "right" && "rounded-br-md", align === "left" && "rounded-bl-md")} />
    </div>
  );
}

export function MessageList({
  messages,
  loading,
  error,
  currentUserId,
  otherPartyName,
  otherPartyAvatarUrl,
  emptyStateSubtitle,
  emptyStateExtra,
  lastMessageStatus,
  onRetryLast,
  onReact,
}: {
  messages: Message[];
  loading: boolean;
  error?: string | null;
  currentUserId: string | undefined;
  otherPartyName: string;
  otherPartyAvatarUrl?: string | null;
  emptyStateSubtitle: string;
  /** Quick-reply chips, rendered inside the empty state only. */
  emptyStateExtra?: React.ReactNode;
  /** Status of the single most recent message, shown only when that message is mine. */
  lastMessageStatus?: BubbleStatus;
  onRetryLast?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const groups = groupMessages(messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex-1 space-y-0.5 overflow-y-auto bg-ink-50 p-3 dark:bg-ink-900"
    >
      {loading ? (
        <div className="space-y-3 py-1">
          <SkeletonBubble align="left" />
          <SkeletonBubble align="right" />
          <SkeletonBubble align="left" />
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          {otherPartyAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherPartyAvatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-crimson-600 text-lg font-bold text-white">
              {initials(otherPartyName)}
            </div>
          )}
          <div>
            <p className="font-display text-sm font-bold text-ink-900 dark:text-ink-100">{otherPartyName}</p>
            <p className="mt-0.5 max-w-[26ch] text-xs text-ink-500 dark:text-ink-400">{emptyStateSubtitle}</p>
          </div>
          {emptyStateExtra && <div className="w-full max-w-xs">{emptyStateExtra}</div>}
        </div>
      ) : (
        <>
          {groups.map(({ message, isFirstInGroup, isLastInGroup }, i) => {
            const isMine = message.senderUserId === currentUserId;
            const isVeryLastMessage = i === groups.length - 1;
            // Pending (optimistic, not-yet-confirmed) messages use a temp id — nothing to
            // react to server-side yet, so the trigger doesn't render for those.
            const isPending = message.id.startsWith("pending-");
            return (
              <div key={message.id}>
                {isNewDay(messages, i) && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                      {dayLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isMine={isMine}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  avatarUrl={otherPartyAvatarUrl}
                  otherPartyName={otherPartyName}
                  status={isMine && isVeryLastMessage ? lastMessageStatus : undefined}
                  onRetry={onRetryLast}
                  onReact={!isPending && onReact ? (emoji) => onReact(message.id, emoji) : undefined}
                />
              </div>
            );
          })}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
