"use client";

import { useCallback, useEffect, useState } from "react";
import { offerApi } from "@/lib/api";
import { useHomeSearch } from "@/lib/home-search-context";
import { errorMessage } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { OFFER_FEED_FILTERS, type OfferFeedFilter } from "@/lib/offer-constants";
import type { OfferResponse } from "@/lib/types";
import { OfferCard } from "@/components/offer-card";
import { Reveal } from "@/components/reveal";
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
      <div className="overflow-hidden rounded-2xl border border-crimson-100 bg-gradient-to-br from-crimson-50 via-surface to-amber-50/60 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-crimson-600 to-crimson-500 text-white shadow-lift">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.8 0l-6.1-6.1a2 2 0 0 1 0-2.8L11.7 3.3a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.6a2 2 0 0 1-.4 1.4Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="15.5" cy="7.5" r="1.5" />
            </svg>
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Offers</h1>
            <p className="mt-0.5 text-sm text-ink-600">Real discounts from verified businesses — claim in-store or order online.</p>
          </div>
        </div>
      </div>

      {todaysOffers.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M12 2c.3 3-1.2 4.7-2.6 6.3C8 10 7 11.6 7 13.5 7 17.6 9.7 21 12 21s5-3.4 5-7.5c0-2.3-1.2-4-2.4-5.6-.4 1.6-1.2 2.6-2.1 2.6-1.4 0-1.9-1.7-1.9-3.2C10.6 5.4 11.2 3.6 12 2Z" />
              </svg>
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-800">Today&apos;s Offers</h2>
          </div>
          <div className="mt-3 -mx-1 flex snap-x gap-3.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {todaysOffers.map((o, i) => (
              <Reveal key={o.id} delay={Math.min(i, 6) * 60} className="w-72 shrink-0 snap-start sm:w-64">
                <OfferCard offer={o} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {OFFER_FEED_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                filter === f.value
                  ? "border-crimson-200 bg-crimson-50 text-crimson-700 shadow-sm"
                  : "border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors duration-150 hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
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
            className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors duration-150 hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
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
            className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors duration-150 hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
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
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((o, i) => (
              <Reveal key={o.id} delay={Math.min(i, 8) * 50}>
                <OfferCard offer={o} />
              </Reveal>
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
