"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { offerApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { AdminNav } from "@/components/admin-nav";
import { OfferTypeBadge } from "@/components/offer-type-badge";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/utils";
import type { OfferResponse } from "@/lib/types";
import { Badge, EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

function OffersContent() {
  const { show } = useToast();
  const [offers, setOffers] = useState<OfferResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    offerApi
      .adminQueue(p, 20)
      .then((res) => {
        setOffers(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(0), [load]);

  async function approve(id: string) {
    setBusy(id);
    try {
      await offerApi.adminApprove(id);
      show("Offer approved", "success");
      load(page);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    const reason = prompt("Rejection reason (optional):") ?? undefined;
    setBusy(id);
    try {
      await offerApi.adminReject(id, reason);
      show("Offer rejected", "success");
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
      <p className="text-sm text-ink-500 mb-6">Offers submitted by verified businesses, awaiting approval before they go live.</p>
      <AdminNav />

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && offers.length === 0 && <EmptyState title="No pending offers" />}
      {!loading && !error && offers.length > 0 && (
        <div className="rounded-md border border-ink-100 bg-surface shadow-card divide-y divide-ink-100">
          {offers.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <OfferTypeBadge offer={o} />
                  <span className="text-sm font-medium text-ink-800">{o.title}</span>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  <Link href={`/business/${o.businessSlug}`} className="hover:underline">
                    {o.businessName}
                  </Link>{" "}
                  · {formatDate(o.validFrom)} – {formatDate(o.validUntil)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="gold">Pending</Badge>
                <Button size="sm" variant="outline" onClick={() => approve(o.id)} loading={busy === o.id}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => reject(o.id)} loading={busy === o.id}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

export default function AdminOffersPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <OffersContent />
    </RoleGate>
  );
}
