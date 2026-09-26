"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { messageApi } from "@/lib/api";
import type { AutoReply, Message } from "@/lib/types";
import type { BubbleStatus } from "./MessageBubble";

const POLL_INTERVAL_MS = 8000;

/** Defends against a backend that hasn't picked up the reactions field yet (e.g. not
 *  redeployed) — without this, an older API response with no `reactions` key at all
 *  crashes every read of `message.reactions` downstream. */
function normalizeMessage(m: Message): Message {
  return { ...m, reactions: m.reactions ?? [] };
}

interface PendingMessage {
  tempId: string;
  content: string;
  status: "sending" | "failed";
}

/**
 * Owns the fetch/send/poll state for one conversation — shared by the
 * business-page widget (which may not have a thread yet, only a businessId
 * to lazily create one from on first send) and the /me/messages and
 * /owner/inbox thread pages (which already know their threadId).
 */
export function useMessageThread({
  threadId: initialThreadId,
  businessId,
  currentUserId,
  enabled,
}: {
  threadId?: string;
  /** Only needed when there's no threadId yet — the first send() creates the thread. */
  businessId?: string;
  currentUserId: string | undefined;
  /** Fetching/polling only runs while true — lets the widget stay mounted-but-idle when closed. */
  enabled: boolean;
}) {
  const [threadId, setThreadId] = useState(initialThreadId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(!!initialThreadId);
  const [error, setError] = useState<string | null>(null);
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const loadHistory = useCallback((id: string) => {
    messageApi
      .history(id, 0, 50)
      .then((res) => {
        setMessages(res.content.map(normalizeMessage));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load messages"))
      .finally(() => setLoading(false));
    messageApi.markRead(id).catch(() => {});
  }, []);

  // Initial load + poll while open, so a reply from the other side shows up without
  // a manual refresh (this app has no websocket — a REST poll on the existing
  // history endpoint is the honest way to approximate "live" here).
  useEffect(() => {
    if (!enabled || !threadId) return;
    loadHistory(threadId);
    const interval = setInterval(() => loadHistory(threadId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, threadId, loadHistory]);

  /** Returns the thread id once the message round-trips, or undefined on failure —
   *  callers that need to chain a follow-up action (e.g. sendQuickReply's auto-reply
   *  trigger) await this instead of just firing send() and moving on. */
  async function send(content: string): Promise<string | undefined> {
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPending((prev) => [...prev, { tempId, content, status: "sending" }]);

    try {
      const currentThreadId = threadIdRef.current;
      const result = normalizeMessage(
        currentThreadId ? await messageApi.reply(currentThreadId, content) : await messageApi.send(businessId!, content)
      );
      setPending((prev) => prev.filter((p) => p.tempId !== tempId));
      setMessages((prev) => [...prev, result]);
      if (!currentThreadId) setThreadId(result.threadId);
      return result.threadId;
    } catch {
      setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: "failed" } : p)));
      return undefined;
    }
  }

  /** Tapping a quick-reply chip: sends its question like any other message, then — only
   *  once that round-trips — triggers the configured auto-answer in the same thread. */
  async function sendQuickReply(autoReply: AutoReply) {
    const resolvedThreadId = await send(autoReply.question);
    if (!resolvedThreadId) return;
    try {
      const reply = normalizeMessage(await messageApi.triggerAutoReply(resolvedThreadId, autoReply.id));
      setMessages((prev) => [...prev, reply]);
    } catch {
      // The question itself already sent successfully — a failed auto-reply just means
      // no instant answer this time; the owner will still see and can reply to it normally.
    }
  }

  /** Tapping an emoji next to a message. Optimistic (flips immediately), rolls back on failure. */
  async function react(messageId: string, emoji: string) {
    const prev = messages;
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;
    const already = target.reactions.find((r) => r.emoji === emoji);
    const optimistic = already
      ? target.reactions
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r))
          .filter((r) => r.count > 0)
      : [
          ...target.reactions.map((r) => (r.reactedByMe ? { ...r, count: r.count - 1, reactedByMe: false } : r)).filter((r) => r.count > 0),
          { emoji, count: (target.reactions.find((r) => r.emoji === emoji)?.count ?? 0) + 1, reactedByMe: true },
        ];
    setMessages((cur) => cur.map((m) => (m.id === messageId ? { ...m, reactions: optimistic } : m)));

    try {
      const reactions = await messageApi.react(messageId, emoji);
      setMessages((cur) => cur.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    } catch {
      setMessages(prev);
    }
  }

  function retry(tempId: string) {
    const item = pending.find((p) => p.tempId === tempId);
    if (!item) return;
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    send(item.content);
  }

  // Pending sends render as their own trailing bubbles, appended after whatever
  // the server has confirmed — real messages are the source of truth for
  // everything already round-tripped, pending ones exist only for the brief
  // window between tapping send and getting a response (or a failure).
  const pendingAsMessages: Message[] = pending.map((p) => ({
    id: p.tempId,
    threadId: threadId ?? "",
    senderUserId: currentUserId ?? "",
    senderName: null,
    content: p.content,
    readAt: null,
    createdAt: new Date().toISOString(),
    reactions: [],
  }));
  const displayMessages = [...messages, ...pendingAsMessages];

  const lastPending = pending[pending.length - 1];
  const lastReal = messages[messages.length - 1];
  let lastMessageStatus: BubbleStatus | undefined;
  if (lastPending) {
    lastMessageStatus = lastPending.status;
  } else if (lastReal && lastReal.senderUserId === currentUserId) {
    lastMessageStatus = lastReal.readAt ? "seen" : "sent";
  }

  return {
    threadId,
    messages: displayMessages,
    loading,
    error,
    send,
    sendQuickReply,
    react,
    retryLast: lastPending ? () => retry(lastPending.tempId) : undefined,
    lastMessageStatus,
  };
}
