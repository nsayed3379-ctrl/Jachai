"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const POLL_INTERVAL_MS = 45_000;
const PREVIEW_COUNT = 8;

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    notificationApi
      .list(0, PREVIEW_COUNT)
      .then((res) => {
        setItems(res.notifications.content);
        setUnreadCount(res.unreadCount);
        setLoaded(true);
      })
      .catch(() => {
        // A failed notification fetch shouldn't disrupt the rest of the navbar — stay silent.
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, refresh]);

  if (!user) return null;

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "READ", readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      refresh(); // reconcile local state if the write failed
    }
  }

  async function markAllRead() {
    const previous = items;
    const previousCount = unreadCount;
    setItems((prev) => prev.map((n) => ({ ...n, status: "READ" as const })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      setItems(previous);
      setUnreadCount(previousCount);
    }
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors", className)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full w-80 pt-2 z-50">
          <div className="rounded-xl border border-ink-100 bg-surface shadow-pop overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-100">
              <span className="text-sm font-semibold text-ink-900">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs font-medium text-crimson-700 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!loaded && <div className="px-4 py-6 text-center text-xs text-ink-400">Loading…</div>}
              {loaded && items.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-ink-400">No notifications yet.</div>
              )}
              {items.map((n) => {
                const unread = n.status !== "READ";
                return (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => unread && markRead(n.id)}
                    className={cn(
                      "block w-full text-left px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50 transition-colors",
                      unread && "bg-crimson-50/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {unread && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-crimson-600 flex-none" aria-hidden />}
                      <div className={cn(!unread && "pl-3.5")}>
                        <p className="text-xs font-semibold text-ink-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-ink-600 leading-snug">{n.body}</p>
                        <p className="mt-1 text-[10px] text-ink-400">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-semibold text-crimson-700 hover:bg-ink-50 border-t border-ink-100"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
