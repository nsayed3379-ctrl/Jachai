"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { messageApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn, formatDateTime } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";
import { ErrorBanner, PageSpinner } from "./ui/misc";

const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min of the same sender are grouped

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function MessageThreadView({
  threadId,
  title = "Conversation",
}: {
  threadId: string;
  title?: string;
}) {
  const { user } = useAuth();
  const { show } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    messageApi
      .history(threadId, 0, 50)
      .then((res) => setMessages(res.content))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
    messageApi.markRead(threadId).catch(() => {});
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await messageApi.reply(threadId, reply.trim());
      setReply("");
      load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSending(false);
    }
  }

  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center">
        <PageSpinner />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <ErrorBanner message={error} />
      </div>
    );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-r from-crimson-600 to-crimson-500 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white text-xs font-semibold">
          {initials(title)}
        </div>
        <p className="text-sm font-medium text-white truncate">Chat with {title}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1 bg-ink-50/30 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.ink.300)_transparent]">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-crimson-50">
              <svg
                className="h-5 w-5 text-crimson-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.076-.163-3.016-.463L3 21l1.5-4.5C3.55 15.163 3 13.63 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink-600">No messages yet</p>
            <p className="mt-1 text-xs text-ink-400">Start the conversation below.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMine = m.senderUserId === user?.id;
            const prev = messages[i - 1];
            const next = messages[i + 1];

            const groupedWithPrev =
              !!prev &&
              prev.senderUserId === m.senderUserId &&
              new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
            const groupedWithNext =
              !!next &&
              next.senderUserId === m.senderUserId &&
              new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < GROUP_WINDOW_MS;

            return (
              <div
                key={m.id}
                className={cn(
                  "group flex",
                  isMine ? "justify-end" : "justify-start",
                  groupedWithPrev ? "mt-0.5" : "mt-3"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-colors",
                    isMine
                      ? "bg-gradient-to-br from-crimson-600 to-crimson-700 text-white"
                      : "bg-surface text-ink-800 border border-ink-100 group-hover:bg-ink-50",
                    isMine
                      ? cn(
                          "rounded-2xl",
                          !groupedWithPrev && "rounded-tr-md",
                          !groupedWithNext && "rounded-br-md"
                        )
                      : cn(
                          "rounded-2xl",
                          !groupedWithPrev && "rounded-tl-md",
                          !groupedWithNext && "rounded-bl-md"
                        )
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {!groupedWithNext && (
                    <p
                      className={cn(
                        "mt-1 text-[10px] tabular-nums",
                        isMine ? "text-crimson-100/80" : "text-ink-400"
                      )}
                    >
                      {formatDateTime(m.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-ink-100 bg-surface p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-ink-50/50 px-3 py-2 focus-within:border-crimson-400 focus-within:ring-2 focus-within:ring-crimson-100 transition-shadow">
          <Textarea
            className="flex-1 min-h-0 resize-none border-0 bg-transparent p-0 shadow-none focus:ring-0 focus-visible:outline-none"
            rows={1}
            placeholder="Type a message…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            onClick={send}
            loading={sending}
            disabled={!reply.trim()}
            className="shrink-0 gap-1.5 rounded-full bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-700 hover:to-crimson-600 disabled:opacity-40"
          >
            <span>Send</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
