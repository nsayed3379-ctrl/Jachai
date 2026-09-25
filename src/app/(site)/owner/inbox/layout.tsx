"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { messageApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { BusinessAccountCta } from "@/components/business-account-cta";
import { errorMessage } from "@/lib/toast-context";
import { lookupBusiness } from "@/lib/business-cache";
import { cn, formatDate } from "@/lib/utils";
import type { MessageThread } from "@/lib/types";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function MessagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasThread = !!pathname.split("/owner/inbox/")[1];

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-6 md:py-8">
      <div className="flex flex-col md:flex-row h-[calc(100dvh-9rem)] min-h-[420px] md:h-[75vh] rounded-2xl border border-ink-200/70 bg-white shadow-xl shadow-ink-900/5 overflow-hidden">
        <ThreadsSidebar />
        <main className={cn("flex-1 flex-col min-w-0 min-h-0", hasThread ? "flex" : "hidden md:flex")}>
          {hasThread && (
            <Link
              href="/owner/inbox"
              className="md:hidden flex shrink-0 items-center gap-1.5 border-b border-ink-100 px-4 py-2.5 text-sm font-medium text-ink-600 hover:text-crimson-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Inbox
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ThreadsSidebar() {
  const pathname = usePathname();
  const activeThreadId = pathname.split("/owner/inbox/")[1];

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    messageApi
      .businessInbox()
      .then(setThreads)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Phones/small tablets: master–detail — the list fills the panel until a
    // thread is open, then the thread takes over (with a back link). md+ keeps
    // the original side-by-side layout.
    <aside
      className={cn(
        "w-full min-h-0 flex-1 md:flex-none md:w-72 lg:w-80 shrink-0 md:border-r border-ink-100 flex-col",
        activeThreadId ? "hidden md:flex" : "flex"
      )}
    >
      <div className="px-4 py-4 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-crimson-600 to-crimson-500 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.076-.163-3.016-.463L3 21l1.5-4.5C3.55 15.163 3 13.63 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-900 leading-tight">Inbox</h1>
            <p className="text-[11px] text-ink-400 leading-tight">Messages from customers</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <PageSpinner />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} />
          </div>
        ) : threads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink-600">No messages yet</p>
            <p className="mt-1 text-xs text-ink-400">
              Customer messages about your listings will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {threads.map((t) => {
              const cached = lookupBusiness(t.businessId);
              const businessName = cached?.name ?? `Business ${t.businessId.slice(0, 8)}…`;
              const name = t.consumerName || `Customer ${t.consumerUserId.slice(0, 8)}…`;
              const active = t.id === activeThreadId;
              return (
                <Link
                  key={t.id}
                  href={`/owner/inbox/${t.id}`}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 transition-colors",
                    active ? "bg-crimson-50" : "hover:bg-ink-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      active
                        ? "bg-crimson-600 text-white"
                        : "bg-ink-100 text-ink-600 group-hover:bg-crimson-100 group-hover:text-crimson-700"
                    )}
                  >
                    {initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        active ? "text-crimson-800" : t.unreadCount > 0 ? "text-ink-900" : "text-ink-800"
                      )}
                    >
                      {name}
                    </p>
                    <p className="truncate text-[11px] text-ink-400">
                      {businessName} · {formatDate(t.createdAt)}
                    </p>
                  </div>
                  {t.unreadCount > 0 && !active && (
                    <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold leading-none text-white">
                      {t.unreadCount > 9 ? "9+" : t.unreadCount}
                    </span>
                  )}
                  {active && <span className="h-2 w-2 shrink-0 rounded-full bg-crimson-500" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

export default function OwnerInboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]} fallback={<BusinessAccountCta />}>
      <MessagesShell>{children}</MessagesShell>
    </RoleGate>
  );
}