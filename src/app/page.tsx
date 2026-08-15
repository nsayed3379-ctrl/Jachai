


"use client";

import { useEffect, useRef, useState } from "react";
import { businessApi } from "@/lib/api";
import { rememberBusinesses } from "@/lib/business-cache";
import { useHomeSearch } from "@/lib/home-search-context";
import { errorMessage } from "@/lib/toast-context";
import type { Area, BusinessResponse, Category } from "@/lib/types";
import { BusinessCard } from "@/components/business-card";
import { BusinessFilters } from "@/components/business-filters";
import { CategoriesGrid } from "@/components/categories-grid";
import { ExploreCities } from "@/components/explore-cities";
import { Reveal } from "@/components/reveal";
import { EmptyState, ErrorBanner, Pagination } from "@/components/ui/misc";

// Rotates every HERO_ROTATE_INTERVAL_MS — see the crossfade layers below.
const HERO_IMAGES = [
  "https://t3.ftcdn.net/jpg/08/87/43/12/360_F_887431211_oTMtoK4uDoTBYq57CjxkwNBzqExhPYfF.jpg",
  "https://c8.alamy.com/comp/2HTN8DN/car-auto-service-and-vehicle-maintenance-workshop-center-automobile-garage-shop-and-spare-part-changing-automotive-services-station-business-car-re-2HTN8DN.jpg",
  "https://alvarezandmarsal-crg.com/wp-content/uploads/2021/07/The-future-Image-Inactive@2x.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlKhRY6buGBK63OnPUWrFw9ja-5CWLgv4K3R2HarHgKg&s=10",
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
  // Category/City/Area/Near-me now live in the Navbar (home page only) —
  // this page and the Navbar both read/write the same shared state instead
  // of keeping two disconnected copies. See lib/home-search-context.tsx.
  const {
    params,
    setParams,
    locationStatus,
    useMyLocation,
    categories,
    cities,
    areas,
    cityId,
    setCityId,
  } = useHomeSearch();

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
  // Mode's dev-only double-invoke, or a hot-reload) — that's what causes
  // rotations to suddenly speed up after the first one.
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
    setParams({
      ...params,
      categoryId: categoryId ?? params.categoryId,
      areaId: areaId ?? params.areaId,
      page: 0,
    });
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

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyCategory(category: Category) {
    setParams({ ...params, categoryId: category.id, page: 0 });
    scrollToResults();
  }

  function applyArea(area: Area) {
    setParams({ ...params, areaId: area.id, page: 0 });
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
      {/* Hero: the primary Category/City/Area/Near-me search now lives up in
          the Navbar itself (see components/navbar.tsx) — this section is just
          the quieter Price/Rating/Sort refine row, a category quick-nav strip,
          and a clean full-bleed photo with a headline underneath. */}
      <section className="relative w-full min-h-[480px] md:min-h-[640px] lg:min-h-screen overflow-hidden flex flex-col">
        {/* BackgroundImage — rotates through HERO_IMAGES every 2s. Every photo
            is stacked in the same spot; only the current one is opacity-100,
            and transition-opacity crossfades between them. animate-ken-burns
            restarts on each layer the moment it becomes the visible one. */}
        {HERO_IMAGES.map((url, i) => (
          <div
            key={url}
            // animate-ken-burns is unconditional (every layer, from mount) —
            // it must NEVER be toggled on/off in step with the opacity
            // crossfade, or the transform snaps back to scale(1) the instant
            // a layer becomes active, which reads as a jerky "kick" right as
            // it fades in. Only opacity animates on rotation; the zoom runs
            // completely independently underneath it, so the fade is smooth.
            className={`absolute inset-0 bg-cover bg-center animate-ken-burns transition-opacity duration-[1500ms] ease-in-out ${
              i === heroIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${url})` }}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/70 via-scrim/30 to-scrim/10" />

        {/* mt-16 sits this flush under the fixed h-16 navbar. On lg+, the
            Navbar itself now carries the entire search (Category/City/Area/
            Price/Rating/Near-me — see components/navbar.tsx), so this strip
            only needs to render for mobile/tablet, which don't have room for
            an inline navbar search and still use their own bottom-sheet/
            popover — plus the category quick-nav strip, which stays lg+ only. */}
        <div className="relative z-20 mt-16 animate-hero-in">
          <div className="lg:hidden bg-scrim/90 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              {/* Full self-contained mobile/tablet filter UI (bottom sheet /
                  popover) — unchanged. Below lg only; lg+ uses the Navbar's
                  inline search instead, so this whole div is lg:hidden above. */}
              <BusinessFilters
                value={params}
                onChange={setParams}
                onUseMyLocation={useMyLocation}
                locationStatus={locationStatus}
                onSearch={scrollToResults}
                categories={categories}
                cities={cities}
                areas={areas}
                cityId={cityId}
                setCityId={setCityId}
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="hidden lg:block backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyCategory(c)}
                    className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-white/85 whitespace-nowrap transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HeroContent — headline + single CTA, anchored toward the bottom of
            the photo (the search work now happens up in the navbar/strip above). */}
        <div className="relative z-10 flex-1 flex flex-col justify-end max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-14 md:pb-16 lg:pb-44">
          <h1
            className="max-w-2xl font-sans text-2xl md:text-3xl lg:text-5xl font-extrabold text-white leading-[1.15] md:leading-[1.12] tracking-tight drop-shadow-sm animate-hero-in"
            style={{ animationDelay: "150ms" }}
          >
            Find a business you can actually trust
          </h1>
          <p
            className="animate-hero-in mt-3 md:mt-10 text-white/90 text-sm md:text-base max-w-md leading-relaxed"
            style={{ animationDelay: "300ms" }}
          >
            Search verified local businesses across Dhaka — filtered by category, area, price,
            and rating, with owner verification you won&apos;t find on Google Maps or
            Facebook.
          </p>
          <button
            type="button"
            onClick={scrollToResults}
            style={{ animationDelay: "420ms" }}
            className="animate-hero-in mt-4 md:mt-5 w-fit inline-flex items-center gap-2.5 rounded-full bg-crimson-600 text-white font-semibold px-6 md:px-7 py-3 md:py-3.5 text-sm md:text-base shadow-lift transition-all duration-200 hover:bg-crimson-500 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-95"
          >

            Start exploring
          </button>
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
              onChange={(page) => setParams({ ...params, page })}
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