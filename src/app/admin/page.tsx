"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { moderationApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { errorMessage } from "@/lib/toast-context";
import type { ModerationQueueCounts } from "@/lib/types";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function OverviewContent() {
  const [counts, setCounts] = useState<ModerationQueueCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    moderationApi
      .summary()
      .then(setCounts)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Moderation</h1>
      <p className="text-sm text-ink-500 mb-6">Admin-only view across all trust &amp; safety queues.</p>
      <AdminNav />

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && counts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/reports" className="rounded-md border border-ink-100 bg-white p-5 shadow-card hover:shadow-pop">
            <p className="text-3xl font-display font-bold text-ink-900">{counts.pendingReports}</p>
            <p className="text-sm text-ink-500 mt-1">Pending reports</p>
          </Link>
          <Link href="/admin/nid-queue" className="rounded-md border border-ink-100 bg-white p-5 shadow-card hover:shadow-pop">
            <p className="text-3xl font-display font-bold text-ink-900">{counts.pendingNidVerifications}</p>
            <p className="text-sm text-ink-500 mt-1">Pending NID verifications</p>
          </Link>
          <Link href="/admin/flagged-reviews" className="rounded-md border border-ink-100 bg-white p-5 shadow-card hover:shadow-pop">
            <p className="text-3xl font-display font-bold text-ink-900">{counts.flaggedReviews}</p>
            <p className="text-sm text-ink-500 mt-1">Flagged reviews</p>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <OverviewContent />
    </RoleGate>
  );
}
