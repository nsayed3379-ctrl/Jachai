"use client";

import { useCallback, useEffect, useState } from "react";
import { nidApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDateTime, truncateId } from "@/lib/utils";
import type { NidVerification } from "@/lib/types";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

function NidQueueContent() {
  const { show } = useToast();
  const [items, setItems] = useState<NidVerification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    nidApi
      .queue(p, 20)
      .then((res) => {
        setItems(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(0), [load]);

  async function resolve(id: string, approve: boolean) {
    const notes = prompt(approve ? "Approval notes (optional):" : "Rejection reason:") ?? undefined;
    setBusy(id);
    try {
      await nidApi.resolve(id, approve, notes);
      show(approve ? "Approved — verified badge is now live" : "Rejected", "success");
      load(page);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Moderation</h1>
      <p className="text-sm text-ink-500 mb-6">NID verification submissions awaiting admin decision.</p>
      <AdminNav />

      <div className="rounded-md border border-gold-200 bg-gold-50 p-3 text-xs text-gold-800 mb-4">
        NID images should be viewed only via short-lived, admin-role-only signed URLs, never a
        public CDN link (spec §8). Until a dedicated secure-view endpoint exists, this queue shows
        submission metadata only — treat the raw <code>encryptedImageRef</code> as sensitive and
        do not expose it further.
      </div>

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No pending NID submissions" />}
      {!loading && !error && items.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card divide-y divide-ink-100">
          {items.map((h) => (
            <div key={h.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-ink-800">Business {truncateId(h.businessId, 10)}…</p>
                <p className="text-xs text-ink-400">
                  Owner {truncateId(h.ownerUserId, 10)}… · submitted {formatDateTime(h.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={h.status === "PENDING" ? "gold" : h.status === "APPROVED" ? "brand" : "rose"}>
                  {h.status}
                </Badge>
                {h.status === "PENDING" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => resolve(h.id, true)} loading={busy === h.id}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => resolve(h.id, false)} loading={busy === h.id}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

export default function AdminNidQueuePage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <NidQueueContent />
    </RoleGate>
  );
}
