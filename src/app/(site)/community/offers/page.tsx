"use client";

import { useCallback, useEffect, useState } from "react";
import { offerApi } from "@/lib/api";
import { useHomeSearch } from "@/lib/home-search-context";
import { errorMessage } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { OFFER_FEED_FILTERS, type OfferFeedFilter } from "@/lib/offer-constants";
import type { OfferResponse } from "@/lib/types";
import { OfferCard } from "@/components/offer-card";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

/**
 * The Offers list — only currently-available (ACTIVE, not past validUntil)
 * offers ever show here, straight from GET /api/v1/offers which already
 * filters server-side. Category reuses the existing business category list;
 * "Nearby" reuses the same city/area pickers Explore's Nearby section uses
 * (useHomeSearch) rather than requesting raw geolocation.
 */
export default function CommunityOffersPage() {
  const { categories, cities, areas, cityId, setCityId } = useHomeSearch();
  const [categoryId, setCategoryId] = useState("");
  const [filter, setFilter] = useState<OfferFeedFilter>("ALL");
  const [areaId, setAreaId] = useState("");

  const [offers, setOffers] = useState<OfferResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todaysOffers, setTodaysOffers] = useState<OfferResponse[]>([]);

  useEffect(() => {
    offerApi
      .feed({ endingSoon: true, size: 8 })
      .then((res) => setTodaysOffers(res.content))
      .catch(() => setTodaysOffers([]));
  }, []);

  const load = useCallback(
    (p: number) => {
      const params = {
        categoryId: categoryId || undefined,
        areaId: filter === "NEARBY" ? areaId || undefined : undefined,
        endingSoon: filter === "ENDING_SOON" ? true : undefined,
        availability: filter === "ONLINE" ? ("ONLINE" as const) : filter === "IN_STORE" ? ("IN_STORE" as const) : undefined,
        page: p,
      };
      if (p === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      offerApi
        .feed(params)
        .then((res) => {
          setOffers((prev) => (p === 0 ? res.content : [...prev, ...res.content]));
          setPage(res.page);
          setTotalPages(res.totalPages);
        })
        .catch((err) => setError(errorMessage(err)))
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [categoryId, filter, areaId]
  );

  useEffect(() => load(0), [load]);

  return (
    <div className="py-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Offers</h1>
      <p className="mt-1 text-sm text-ink-500">Real discounts from verified businesses — claim in-store or order online.</p>

      {todaysOffers.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Today&apos;s Offers</h2>
          <div className="mt-2 -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {todaysOffers.map((o) => (
              <div key={o.id} className="w-56 shrink-0 snap-start sm:w-60">
                <OfferCard offer={o} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {OFFER_FEED_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.value ? "bg-crimson-50 text-crimson-700" : "text-ink-400 hover:text-ink-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-ink-200 bg-surface px-2.5 py-1 text-xs font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filter === "NEARBY" && (
        <div className="mt-3 flex gap-2">
          <select
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setAreaId("");
            }}
            className="rounded-lg border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="rounded-lg border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
          >
            <option value="">Choose an area…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5">
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && !error && filter === "NEARBY" && !areaId && (
          <EmptyState title="Choose an area" description="Pick a city and area above to see nearby offers." />
        )}
        {!loading && !error && offers.length === 0 && (filter !== "NEARBY" || areaId) && (
          <EmptyState
            title={filter === "NEARBY" ? "No offers available near you." : "No active offers right now."}
            description="Check back soon — verified businesses post new offers regularly."
          />
        )}
        {!loading && !error && offers.length > 0 && (filter !== "NEARBY" || areaId) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {!loading && !error && page + 1 < totalPages && (
          <div className="flex justify-center pt-5">
            <Button variant="outline" size="sm" onClick={() => load(page + 1)} loading={loadingMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
