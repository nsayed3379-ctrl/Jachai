"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { messageApi } from "@/lib/api";
import type { BusinessResponse } from "@/lib/types";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { useIsDesktop } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChatPane } from "@/components/chat/ChatPane";
import { initials } from "@/components/chat/chat-utils";

export type MessageWidgetState = "closed" | "open" | "minimized";

/** Compact "Message the owner" sidebar card — desktop business page only (mobile
 *  reaches the same chat through the BusinessActions grid's Message tile). */
export function BusinessMessageSidebarCard({ business, onOpen }: { business: BusinessResponse; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100/70 bg-surface p-4 shadow-card dark:border-ink-700">
      {business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={business.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-sm font-bold text-white">
          {initials(business.name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{business.name}</p>
        <p className="truncate text-xs text-ink-400">Usually replies within a day</p>
      </div>
      <Button variant="outline" size="sm" onClick={onOpen} className="shrink-0">
        <MessageCircle size={16} strokeWidth={1.75} />
        Message
      </Button>
    </div>
  );
}

/**
 * The chat window itself — full-screen sheet on mobile, a floating bottom-right
 * window (or minimized avatar bubble) on desktop. Controlled from the business
 * page so both the sidebar card and the BusinessActions grid's Message tile can
 * open the same instance instead of each owning its own chat state.
 */
export function BusinessMessageWidget({
  state,
  onClose,
  onMinimize,
  onMaximize,
  business,
  currentUserId,
  isLoggedIn,
  onLogin,
}: {
  state: MessageWidgetState;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  business: BusinessResponse;
  currentUserId: string | undefined;
  isLoggedIn: boolean;
  onLogin: () => void;
}) {
  const isDesktop = useIsDesktop();
  const isOwnBusiness = currentUserId === business.ownerUserId;
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  // Resolve an existing thread for this business once, so a returning visitor's
  // history loads instead of the chat starting blank every time it's reopened.
  useEffect(() => {
    if (!isLoggedIn || isOwnBusiness) return;
    messageApi
      .myThreads()
      .then((threads) => setThreadId(threads.find((t) => t.businessId === business.id)?.id))
      .catch(() => {});
  }, [isLoggedIn, isOwnBusiness, business.id]);

  // A real, backend-tracked unread count (not a fabricated presence/notification
  // system) — only worth polling while minimized, since it's what the badge shows;
  // maximizing re-fetches history and marks the thread read, clearing it naturally.
  useEffect(() => {
    if (state !== "minimized" || !threadId) return;
    function poll() {
      messageApi
        .myThreads()
        .then((threads) => setUnreadCount(threads.find((t) => t.id === threadId)?.unreadCount ?? 0))
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [state, threadId]);

  useEffect(() => {
    if (state === "open") setUnreadCount(0);
  }, [state]);

  // Esc closes the open window, matching every other dialog in this app (Modal/BottomSheet).
  useEffect(() => {
    if (state !== "open") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state, onClose]);

  // Swipe-down-to-close on mobile — only starts tracking a drag when the touch
  // begins inside the header's own height, so scrolling the message list below
  // it is never hijacked.
  const HEADER_HEIGHT_PX = 56;
  const DISMISS_THRESHOLD_PX = 100;
  const dragState = useRef<{ startY: number; dragging: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  function onPointerDown(e: React.PointerEvent) {
    if (isDesktop || e.clientY > HEADER_HEIGHT_PX) return;
    dragState.current = { startY: e.clientY, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current?.dragging) return;
    setDragOffset(Math.max(0, e.clientY - dragState.current.startY));
  }
  function onPointerUp() {
    if (!dragState.current?.dragging) return;
    dragState.current.dragging = false;
    if (dragOffset > DISMISS_THRESHOLD_PX) onClose();
    setDragOffset(0);
  }

  if (state === "closed") return null;

  if (state === "minimized") {
    return (
      <button
        type="button"
        onClick={onMaximize}
        aria-label={`Open chat with ${business.name}${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className={cn(
          "fixed bottom-6 right-6 z-[60] hidden h-14 w-14 items-center justify-center rounded-full border border-ink-200 bg-surface shadow-lift sm:flex dark:border-ink-700",
          interactiveTransition,
          focusRing
        )}
      >
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logoUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-crimson-600 text-sm font-bold text-white">
            {initials(business.name)}
          </span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[11px] font-bold text-white ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "fixed z-[60] flex flex-col bg-surface",
        isDesktop
          ? "bottom-6 right-6 h-[520px] w-[360px] overflow-hidden rounded-2xl border border-ink-200 shadow-lg dark:border-ink-700"
          // Starts below the main site navbar (h-16, fixed) instead of true inset-0 —
          // a full-bleed sheet was covering it entirely.
          : "inset-x-0 bottom-0 top-16"
      )}
      style={
        !isDesktop
          ? {
              height: "calc(100dvh - 4rem)",
              transform: `translateY(${dragOffset}px)`,
              transition: dragOffset ? "none" : "transform 200ms ease-out",
            }
          : undefined
      }
    >
      <ChatPane
        threadId={threadId}
        businessId={business.id}
        currentUserId={currentUserId}
        otherPartyName={business.name}
        otherPartyAvatarUrl={business.logoUrl}
        verified={business.verified}
        headerSubtitle="Usually replies within a day"
        onBack={!isDesktop ? onClose : undefined}
        onClose={isDesktop ? onClose : undefined}
        onMinimize={isDesktop ? onMinimize : undefined}
        showQuickReplies
        isLoggedIn={isLoggedIn}
        onLogin={onLogin}
        isOwnBusiness={isOwnBusiness}
      />
    </div>
  );
}
