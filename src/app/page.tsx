"use client";

import { useEffect, useRef, useState } from "react";
import { businessApi } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/config";
import { rememberBusinesses } from "@/lib/business-cache";
import { errorMessage } from "@/lib/toast-context";
import type { Area, BusinessResponse, BusinessSearchParams, Category } from "@/lib/types";
import { BusinessCard } from "@/components/business-card";
import { BusinessFilters } from "@/components/business-filters";
import { CategoriesGrid } from "@/components/categories-grid";
import { ExploreCities } from "@/components/explore-cities";
import { EmptyState, ErrorBanner, PageSpinner, Pagination } from "@/components/ui/misc";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1538333581680-29dd4752ddf2?auto=format&fit=crop&w=2000&q=75";

export default function HomePage() {
  const [params, setParams] = useState<BusinessSearchParams>({ sort: "newest", page: 0, size: PAGE_SIZE });
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "granted" | "denied">("idle");
  const [browseLocation, setBrowseLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [browseLocationStatus, setBrowseLocationStatus] = useState<"idle" | "locating" | "denied">("idle");
  const [results, setResults] = useState<BusinessResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Seed the search from a footer/shared deep link (e.g. "/?categoryId=...")
  // once on mount — plain window.location instead of useSearchParams() so
  // this stays a single client component with no Suspense boundary needed.
  useEffect(() => {
    const url = new URL(window.location.href);
    const categoryId = url.searchParams.get("categoryId");
    const areaId = url.searchParams.get("areaId");
    if (!categoryId && !areaId) return;
    setParams((prev) => ({
      ...prev,
      categoryId: categoryId ?? prev.categoryId,
      areaId: areaId ?? prev.areaId,
      page: 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyCategory(category: Category) {
    setParams((prev) => ({ ...prev, categoryId: category.id, page: 0 }));
    scrollToResults();
  }

  function applyArea(area: Area) {
    setParams((prev) => ({ ...prev, areaId: area.id, page: 0 }));
    scrollToResults();
  }

  function showDistances() {
    if (!("geolocation" in navigator)) {
      setBrowseLocationStatus("denied");
      return;
    }
    setBrowseLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => setBrowseLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setBrowseLocationStatus("denied"),
      { timeout: 8000 }
    );
  }

  const cardLocation =
    params.lat !== undefined && params.lng !== undefined
      ? { lat: params.lat, lng: params.lng }
      : browseLocation;

  return (
    <>
      {/* Hero: true full-viewport section, not nested inside any max-width container.
          Height/spacing is tiered per breakpoint — mobile gets a deliberately short
          hero (heading + CTA above the fold), tablet/desktop keep the tall version. */}
      <section className="relative w-full min-h-[480px] md:min-h-[640px] lg:min-h-screen">
        {/* BackgroundImage */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }} />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/60 via-scrim/25 to-scrim/5" />
        {/* Extra darkening behind the transparent navbar so its white text stays legible over any photo */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-scrim/55 to-transparent" />

        {/* Container: only the content is width-constrained, not the section itself */}
        <div className="relative flex flex-col justify-start pt-20 md:pt-24 lg:pt-32 pb-8 md:pb-10 lg:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* SearchCard — one shared card chrome for all three tiers; BusinessFilters
              itself decides what to render inside per breakpoint (mobile/tablet/desktop
              are dedicated components, not a shared layout squeezed to fit). */}
          {/* relative z-20: backdrop-blur creates its own stacking context, so
              without an explicit z-index here the dropdown popovers inside
              BusinessFilters would render underneath the HeroContent below it. */}
          <div className="relative z-20 rounded-2xl md:rounded-[28px] lg:rounded-[32px] border border-white/60 bg-surface/85 backdrop-blur-xl p-4 md:p-6 lg:p-8 shadow-lift">
            <BusinessFilters
              value={params}
              onChange={setParams}
              onUseMyLocation={useMyLocation}
              locationStatus={locationStatus}
              onSearch={scrollToResults}
            />
          </div>

          {/* HeroContent */}
          <div className="max-w-xl mt-4 md:mt-6 lg:mt-8">
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] md:leading-[1.12] tracking-tight drop-shadow-sm">
              Find a business you can actually trust
            </h1>
            <button
              type="button"
              onClick={scrollToResults}
              className="mt-4 md:mt-5 inline-flex items-center gap-2.5 rounded-full bg-crimson-600 text-white font-semibold px-6 md:px-7 py-3 md:py-3.5 text-sm md:text-base shadow-lift transition-all duration-200 hover:bg-crimson-500 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
              </svg>
              Start exploring
            </button>
            <p className="mt-3 md:mt-4 text-white/90 text-sm md:text-base max-w-md leading-relaxed">
              Search verified local businesses across Dhaka — filtered by category, area, price,
              and rating, with owner verification you won&apos;t find on Google Maps or
              Facebook.
            </p>
          </div>
        </div>
      </section>

      {/* BusinessList: owns its own width-constrained container */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20 border-t border-ink-100">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 text-center pt-2 mb-8">
          Browse businesses
        </h2>
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}

        {!loading && !error && (
          <>
            <p className="text-sm font-medium text-ink-500 mb-4">
              {totalElements} businesses found
              {!cardLocation && browseLocationStatus !== "denied" && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    type="button"
                    onClick={showDistances}
                    disabled={browseLocationStatus === "locating"}
                    className="text-crimson-600 hover:underline disabled:opacity-60"
                  >
                    {browseLocationStatus === "locating" ? "Locating…" : "Show distance from me"}
                  </button>
                </>
              )}
            </p>
            {results.length === 0 ? (
              <EmptyState
                title="No businesses match those filters"
                description="Try widening your area, dropping the minimum rating, or clearing a filter."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((b) => (
                  <BusinessCard key={b.id} business={b} userLocation={cardLocation ?? undefined} />
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

      <CategoriesGrid onSelect={applyCategory} />
      <ExploreCities onSelectArea={applyArea} />
    </>
  );
}
