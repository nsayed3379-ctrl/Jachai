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

export function MessageThreadView({ threadId }: { threadId: string }) {
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

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col h-[60vh] rounded-md border border-ink-100 bg-surface shadow-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMine = m.senderUserId === user?.id;
          return (
            <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  isMine ? "bg-crimson-600 text-white" : "bg-ink-100 text-ink-800"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className={cn("mt-1 text-[10px]", isMine ? "text-crimson-100" : "text-ink-400")}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-ink-100 p-3 flex gap-2">
        <Textarea
          className="flex-1 min-h-0"
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
        <Button onClick={send} loading={sending}>
          Send
        </Button>
      </div>
    </div>
  );
}
