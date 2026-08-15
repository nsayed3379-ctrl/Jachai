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
import { Reveal } from "@/components/reveal";
import { EmptyState, ErrorBanner, Pagination } from "@/components/ui/misc";

// Rotates every HERO_ROTATE_INTERVAL_MS — see the crossfade layers below.
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1538333581680-29dd4752ddf2?auto=format&fit=crop&w=2000&q=75",
  "https://t3.ftcdn.net/jpg/08/87/43/12/360_F_887431211_oTMtoK4uDoTBYq57CjxkwNBzqExhPYfF.jpg",
  "https://c8.alamy.com/comp/2HTN8DN/car-auto-service-and-vehicle-maintenance-workshop-center-automobile-garage-shop-and-spare-part-changing-automotive-services-station-business-car-re-2HTN8DN.jpg",
];
const HERO_ROTATE_INTERVAL_MS = 5000;

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-ink-100/70 bg-surface shadow-card overflow-hidden">
      <div className="p-4 pb-3 flex items-center gap-2.5">
        <div className="skeleton animate-shimmer h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="skeleton animate-shimmer h-3.5 w-3/4 rounded" />
          <div className="skeleton animate-shimmer h-2.5 w-1/2 rounded" />
        </div>
      </div>
      <div className="skeleton animate-shimmer h-44 w-full" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton animate-shimmer h-3.5 w-1/3 rounded" />
        <div className="skeleton animate-shimmer h-3 w-2/3 rounded" />
        <div className="pt-3 mt-1 border-t border-ink-100 flex gap-2">
          <div className="skeleton animate-shimmer h-6 w-14 rounded-full" />
          <div className="skeleton animate-shimmer h-6 w-14 rounded-full" />
          <div className="skeleton animate-shimmer h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

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
  const [heroIndex, setHeroIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotates the hero background photo — the actual crossfade is pure CSS
  // (transition-opacity on stacked layers below), this just advances which
  // layer is "on top" every HERO_ROTATE_INTERVAL_MS. Explicitly clearing any
  // interval already sitting in heroTimerRef before starting a new one
  // guards against ever having two timers alive at once (e.g. React Strict
  // Mode's dev-only double-invoke, or a hot-reload).
  useEffect(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, HERO_ROTATE_INTERVAL_MS);
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
      heroTimerRef.current = null;
    };
  }, []);

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
          // A query already typed keeps ranking by relevance (radius just narrows candidates);
          // "Near me" on its own falls back to pure proximity, as before.
          sort: prev.q ? "relevance" : "distance",
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
      <section className="relative w-full min-h-[480px] md:min-h-[640px] lg:min-h-screen overflow-hidden">
        {/* BackgroundImage — rotates through HERO_IMAGES every HERO_ROTATE_INTERVAL_MS.
            Every photo is stacked in the same spot; only the current one is
            opacity-100, and transition-opacity crossfades between them.
            animate-ken-burns is unconditional (every layer, from mount) — it must
            never be toggled in step with the opacity crossfade, or the transform
            snaps back to scale(1) the instant a layer becomes active, which reads
            as a jerky "kick" right as it fades in. */}
        {HERO_IMAGES.map((url, i) => (
          <div
            key={url}
            className={`absolute inset-0 bg-cover bg-center animate-ken-burns transition-opacity duration-[1500ms] ease-in-out ${
              i === heroIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${url})` }}
          />
        ))}
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
          <div className="relative z-20 rounded-2xl md:rounded-[28px] lg:rounded-[32px] border border-white/60 bg-surface/85 backdrop-blur-xl p-4 md:p-6 lg:p-8 shadow-lift animate-hero-in">
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
            <h1
              className="animate-hero-in font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] md:leading-[1.12] tracking-tight drop-shadow-sm"
              style={{ animationDelay: "100ms" }}
            >
              Find a business you can actually trust
            </h1>
            <button
              type="button"
              onClick={scrollToResults}
              style={{ animationDelay: "220ms" }}
              className="animate-hero-in mt-4 md:mt-5 inline-flex items-center gap-2.5 rounded-full bg-crimson-600 text-white font-semibold px-6 md:px-7 py-3 md:py-3.5 text-sm md:text-base shadow-lift transition-all duration-200 hover:bg-crimson-500 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-95"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
              </svg>
              Start exploring
            </button>
            <p
              className="animate-hero-in mt-3 md:mt-4 text-white/90 text-sm md:text-base max-w-md leading-relaxed"
              style={{ animationDelay: "320ms" }}
            >
              Search verified local businesses across Dhaka — filtered by category, area, price,
              and rating, with owner verification you won&apos;t find on Google Maps or
              Facebook.
            </p>
          </div>
        </div>
      </section>

      {/* BusinessList: owns its own width-constrained container */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20 border-t border-ink-100">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 text-center pt-2 mb-8">
            Browse businesses
          </h2>
        </Reveal>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {!loading && error && <ErrorBanner message={error} />}

        {!loading && !error && (
          <>
            <p key={totalElements} className="animate-fade-in text-sm font-medium text-ink-500 mb-4">
              {totalElements} businesses found
              {!cardLocation && browseLocationStatus !== "denied" && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    type="button"
                    onClick={showDistances}
                    disabled={browseLocationStatus === "locating"}
                    className="text-crimson-600 hover:underline disabled:opacity-60 transition-opacity"
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
                {results.map((b, i) => (
                  <Reveal key={b.id} delay={Math.min(i, 8) * 60}>
                    <BusinessCard business={b} userLocation={cardLocation ?? undefined} />
                  </Reveal>
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

      <Reveal>
        <CategoriesGrid onSelect={applyCategory} />
      </Reveal>
      <Reveal>
        <ExploreCities onSelectArea={applyArea} />
      </Reveal>
    </>
  );
}
