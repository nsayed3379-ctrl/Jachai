"use client";

import { useCallback, useEffect, useState } from "react";
import { offerApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { errorMessage } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import type { OfferClaimResponse, OfferResponse } from "@/lib/types";
import { OfferCard } from "@/components/offer-card";
import { RedemptionCodeCard } from "@/components/redemption-code-card";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

type Tab = "CLAIMED" | "SAVED";

function MyOffersContent() {
  const [tab, setTab] = useState<Tab>("CLAIMED");

  const [claims, setClaims] = useState<OfferClaimResponse[]>([]);
  const [saved, setSaved] = useState<OfferResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (t: Tab, p: number) => {
      setLoading(true);
      setError(null);
      const request = t === "CLAIMED" ? offerApi.myClaims(p) : offerApi.mySavedOffers(p);
      request
        .then((res) => {
          if (t === "CLAIMED") setClaims(res.content as OfferClaimResponse[]);
          else setSaved(res.content as OfferResponse[]);
          setPage(res.page);
          setTotalPages(res.totalPages);
        })
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => load(tab, 0), [tab, load]);

  function switchTab(t: Tab) {
    setTab(t);
  }

  return (
    <div className="py-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">My Offers</h1>
      <p className="mt-1 text-sm text-ink-500">Offers you&apos;ve claimed or saved for later.</p>

      <div className="mt-4 flex gap-1.5">
        {(["CLAIMED", "SAVED"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t ? "bg-crimson-50 text-crimson-700" : "text-ink-400 hover:text-ink-700"
            )}
          >
            {t === "CLAIMED" ? "Claimed" : "Saved"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}

        {!loading && !error && tab === "CLAIMED" && claims.length === 0 && (
          <EmptyState title="No claimed offers yet" description="Claim an offer from the Offers page to get a redemption code." />
        )}
        {!loading && !error && tab === "CLAIMED" && claims.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {claims.map((c) => (
              <RedemptionCodeCard key={c.id} claim={c} />
            ))}
          </div>
        )}

        {!loading && !error && tab === "SAVED" && saved.length === 0 && (
          <EmptyState title="No saved offers yet" description="Save an offer from its detail page to find it here later." />
        )}
        {!loading && !error && tab === "SAVED" && saved.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {!loading && !error && (
          <Pagination page={page} totalPages={totalPages} onChange={(p) => load(tab, p)} />
        )}
      </div>
    </div>
  );
}

export default function MyOffersPage() {
  return (
    <RoleGate>
      <MyOffersContent />
    </RoleGate>
  );
}
