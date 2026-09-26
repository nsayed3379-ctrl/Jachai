"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import type { Message } from "@/lib/types";
import { cn, focusRing } from "@/lib/utils";
import { initials } from "./chat-utils";

export type BubbleStatus = "sending" | "sent" | "seen" | "failed";

/** Matches MessageService.ALLOWED_REACTIONS on the backend exactly — the server
 *  rejects anything else, so there's no point offering more here. */
const REACTION_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  avatarUrl,
  otherPartyName,
  status,
  onRetry,
  onReact,
}: {
  message: Message;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** Shown next to "theirs" bubbles, only on the last bubble of a group. */
  avatarUrl?: string | null;
  otherPartyName: string;
  /** Only passed by MessageList for the single most-recent message when it's mine. */
  status?: BubbleStatus;
  onRetry?: () => void;
  onReact?: (emoji: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const failed = status === "failed";

  useEffect(() => {
    if (!pickerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  const reactTrigger = onReact && (
    <button
      type="button"
      onClick={() => setPickerOpen((v) => !v)}
      aria-label="React to this message"
      aria-haspopup="menu"
      aria-expanded={pickerOpen}
      className={cn(
        // Hidden until hover (desktop) — but hover never fires on touch, so `revealed`
        // (the same tap-the-bubble state that shows the timestamp) also reveals this,
        // otherwise there'd be no way to react at all on mobile.
        "relative shrink-0 self-end flex h-6 w-6 items-center justify-center rounded-full text-ink-300 opacity-0 transition-opacity duration-150 after:absolute after:-inset-2.5 after:content-[''] hover:text-ink-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-ink-500 dark:hover:text-ink-300",
        (pickerOpen || revealed) && "!opacity-100",
        focusRing
      )}
    >
      <SmilePlus size={16} strokeWidth={1.75} />
    </button>
  );

  return (
    <div
      ref={rowRef}
      className={cn(
        "group relative flex items-end gap-1.5",
        isMine ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-3" : "mt-0.5"
      )}
    >
      {!isMine &&
        (isLastInGroup ? (
          avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-200 text-[9px] font-bold text-ink-700 dark:bg-ink-700 dark:text-ink-200">
              {initials(otherPartyName)}
            </div>
          )
        ) : (
          <div className="h-6 w-6 shrink-0" />
        ))}

      {isMine && reactTrigger}

      <div className="flex max-w-[78%] flex-col">
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className={cn(
            "text-left rounded-2xl px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap",
            focusRing,
            isMine
              ? cn("bg-crimson-600 text-white", isLastInGroup && "rounded-br-md", failed && "opacity-60")
              : cn(
                  "border border-ink-200 bg-surface text-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100",
                  isLastInGroup && "rounded-bl-md"
                )
          )}
        >
          <span className="sr-only">
            {isMine ? "You said" : `${otherPartyName} said`}, {formatTime(message.createdAt)}:{" "}
          </span>
          {message.content}
        </button>

        {message.reactions.length > 0 && (
          <div className={cn("mt-0.5 flex flex-wrap gap-1", isMine ? "justify-end" : "justify-start")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact?.(r.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                  focusRing,
                  r.reactedByMe
                    ? "border-crimson-200 bg-crimson-50 dark:border-crimson-800 dark:bg-crimson-500/15"
                    : "border-ink-200 bg-surface dark:border-ink-700"
                )}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-ink-500 dark:text-ink-400">{r.count}</span>}
              </button>
            ))}
          </div>
        )}

        {isLastInGroup && (
          <p
            className={cn(
              "mt-0.5 hidden px-1 text-[11px] text-ink-400 sm:group-hover:block",
              revealed && "!block",
              isMine ? "text-right" : "text-left"
            )}
          >
            {formatTime(message.createdAt)}
          </p>
        )}

        {isMine && isLastInGroup && status && (
          <p className={cn("mt-0.5 px-1 text-[11px]", failed ? "text-rose-600" : "text-ink-400")}>
            {failed ? (
              <button type="button" onClick={onRetry} className={cn("rounded font-medium hover:underline", focusRing)}>
                Not sent · Tap to retry
              </button>
            ) : status === "sending" ? (
              "Sending…"
            ) : status === "seen" ? (
              "Seen"
            ) : (
              "Sent"
            )}
          </p>
        )}
      </div>

      {!isMine && reactTrigger}

      {pickerOpen && (
        // Anchored to the whole row (left-0/right-0 span its full width, which always
        // fits inside the chat window) rather than to the small trigger button itself —
        // anchoring to the trigger let the popup overflow past the window's edge
        // whenever a wide bubble pushed the trigger close to that edge.
        <div className={cn("absolute bottom-full z-20 mb-1 flex", isMine ? "right-0" : "left-0")}>
          <div
            role="menu"
            className="flex gap-0.5 rounded-full border border-ink-100 bg-surface p-1 shadow-pop dark:border-ink-700"
          >
            {REACTION_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="menuitem"
                onClick={() => {
                  setPickerOpen(false);
                  onReact?.(emoji);
                }}
                aria-label={`React with ${emoji}`}
                className={cn("flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-ink-100 dark:hover:bg-ink-800", focusRing)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
