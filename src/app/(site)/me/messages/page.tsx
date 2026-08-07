<<<<<<< HEAD

export default function MyMessagesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink-50">
        <svg className="h-5 w-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.076-.163-3.016-.463L3 21l1.5-4.5C3.55 15.163 3 13.63 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-600">Select a conversation</p>
      <p className="mt-1 text-xs text-ink-400">Pick a thread on the left to view messages.</p>
    </div>
  );
}
=======
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { messageApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { errorMessage } from "@/lib/toast-context";
import { lookupBusiness } from "@/lib/business-cache";
import { formatDate } from "@/lib/utils";
import type { MessageThread } from "@/lib/types";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";

function ThreadsContent() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    messageApi
      .myThreads()
      .then(setThreads)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Messages</h1>
      <p className="text-sm text-ink-500 mb-4">
        Direct message threads with business owners you've contacted.
      </p>

      {threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Message a business owner from their profile page to start a thread."
        />
      ) : (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card divide-y divide-ink-100">
          {threads.map((t) => {
            const cached = lookupBusiness(t.businessId);
            return (
              <Link
                key={t.id}
                href={`/me/messages/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ink-50"
              >
                <span className="text-sm font-medium text-ink-800">
                  {cached?.name ?? `Business ${t.businessId.slice(0, 8)}…`}
                </span>
                <span className="text-xs text-ink-400">{formatDate(t.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyMessagesPage() {
  return (
    <RoleGate allow={["CONSUMER"]}>
      <ThreadsContent />
    </RoleGate>
  );
}
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
