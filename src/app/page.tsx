"use client";

import { useEffect, useState } from "react";
import { businessApi } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/config";
import { rememberBusinesses } from "@/lib/business-cache";
import { errorMessage } from "@/lib/toast-context";
import type { BusinessResponse, BusinessSearchParams } from "@/lib/types";
import { BusinessCard } from "@/components/business-card";
import { BusinessFilters } from "@/components/business-filters";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

export default function HomePage() {
  const [params, setParams] = useState<BusinessSearchParams>({ sort: "newest", page: 0, size: PAGE_SIZE });
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "granted" | "denied">("idle");
  const [results, setResults] = useState<BusinessResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    businessApi
      .search(params)
      .then((page) => {
        if (cancelled) return;
        setResults(page.content);
        setTotalPages(page.totalPages);
        setTotalElements(page.totalElements);
        rememberBusinesses(page.content);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus("granted");
        setParams((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusMeters: 5000,
          sort: "distance",
          page: 0,
        }));
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">
          Find a business you can actually trust
        </h1>
        <p className="mt-2 text-ink-500 max-w-2xl">
          Search verified local businesses across Dhaka — filtered by category, area, price,
          and rating, with NID-checked owner verification you won&apos;t find on Google Maps or
          Facebook.
        </p>
      </section>

      <section className="rounded-md border border-ink-100 bg-white p-4 mb-8 shadow-card">
        <BusinessFilters
          value={params}
          onChange={setParams}
          onUseMyLocation={useMyLocation}
          locationStatus={locationStatus}
        />
      </section>

      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <>
          <p className="text-sm text-ink-400 mb-4">{totalElements} businesses found</p>
          {results.length === 0 ? (
            <EmptyState
              title="No businesses match those filters"
              description="Try widening your area, dropping the minimum rating, or clearing a filter."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          )}
          <Pagination
            page={params.page ?? 0}
            totalPages={totalPages}
            onChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
}
