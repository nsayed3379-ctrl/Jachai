"use client";

import { useCallback, useEffect, useState } from "react";
import { claimApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDateTime, truncateId } from "@/lib/utils";
import type { BusinessClaim } from "@/lib/types";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

function ClaimDocument({ claimId }: { claimId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    claimApi
      .documentBlobUrl(claimId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [claimId]);

  if (failed) return <div className="w-14 h-14 rounded border border-ink-100 flex items-center justify-center text-xs text-ink-400">N/A</div>;
  if (!src) return <div className="w-14 h-14 rounded border border-ink-100 animate-pulse bg-ink-50" />;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img src={src} alt="Claim document" className="w-14 h-14 rounded border border-ink-100 object-cover" />
    </a>
  );
}

function ClaimsContent() {
  const { show } = useToast();
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    claimApi
      .queue(p, 20)
      .then((res) => {
        setClaims(res.content);
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
      await claimApi.resolve(id, approve, notes);
      show(approve ? "Claim approved" : "Claim rejected", "success");
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
      <p className="text-sm text-ink-500 mb-6">
        Document-based ownership claims — phone and email claims verify instantly and never reach this queue.
      </p>
      <AdminNav />

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && claims.length === 0 && <EmptyState title="No pending claims" />}
      {!loading && !error && claims.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card divide-y divide-ink-100">
          {claims.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {c.verificationMethod === "DOCUMENT" && <ClaimDocument claimId={c.id} />}
                <div>
                  <p className="text-sm font-medium text-ink-800">Business {truncateId(c.businessId, 10)}…</p>
                  <p className="text-xs text-ink-400">
                    {c.claimantName || `Claimant ${truncateId(c.claimantUserId, 10)}…`} · via {c.verificationMethod} ·{" "}
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.status === "PENDING" ? "gold" : c.status === "APPROVED" ? "brand" : "rose"}>
                  {c.status}
                </Badge>
                {c.status === "PENDING" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => resolve(c.id, true)} loading={busy === c.id}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => resolve(c.id, false)} loading={busy === c.id}>
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

export default function AdminClaimsPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <ClaimsContent />
    </RoleGate>
  );
}
