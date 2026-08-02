"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { messageApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { errorMessage } from "@/lib/toast-context";
import { lookupBusiness } from "@/lib/business-cache";
import { formatDate, truncateId } from "@/lib/utils";
import type { MessageThread } from "@/lib/types";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";

function InboxContent() {
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

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Inbox</h1>
      <p className="text-sm text-ink-500 mb-4">
        Messages from customers across all of your businesses.
      </p>

      {threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Customer inquiries and review replies will show up here."
        />
      ) : (
        <div className="rounded-md border border-ink-100 bg-white shadow-card divide-y divide-ink-100">
          {threads.map((t) => {
            const cached = lookupBusiness(t.businessId);
            return (
              <Link
                key={t.id}
                href={`/owner/inbox/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ink-50"
              >
                <span className="text-sm">
                  <span className="font-medium text-ink-800">
                    {cached?.name ?? `Business ${truncateId(t.businessId)}`}
                  </span>
                  <span className="text-ink-400"> — customer {truncateId(t.consumerUserId)}</span>
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

export default function OwnerInboxPage() {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]}>
      <InboxContent />
    </RoleGate>
  );
}
