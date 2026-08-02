import type { BusinessResponse, CachedBusinessSummary } from "./types";

// The backend's Bookmark, MessageThread etc. records only carry a raw
// businessId (UUID) — there's no endpoint to fetch a business by id (only by
// slug), so screens like "My Bookmarks" or "My Message Threads" have nothing
// to render a name/photo from on their own. As a pragmatic frontend-only
// bridge, every full BusinessResponse we see anywhere in the app (search
// results, a business profile page) gets mirrored into this localStorage
// cache keyed by id. Screens that only have a businessId look it up here;
// if it's missing (e.g. cache cleared, or bookmarked before ever being
// viewed in this browser), we fall back to showing the raw id.

const CACHE_KEY = "rp.businessCache.v1";

function readCache(): Record<string, CachedBusinessSummary> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CachedBusinessSummary>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors — this is a best-effort convenience cache
  }
}

export function rememberBusiness(business: BusinessResponse) {
  const cache = readCache();
  cache[business.id] = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    coverPhotoUrl: business.coverPhotoUrl,
    categoryName: business.categoryName,
    areaName: business.areaName,
    cityName: business.cityName,
  };
  writeCache(cache);
}

export function rememberBusinesses(businesses: BusinessResponse[]) {
  if (!businesses.length) return;
  const cache = readCache();
  for (const b of businesses) {
    cache[b.id] = {
      id: b.id,
      name: b.name,
      slug: b.slug,
      coverPhotoUrl: b.coverPhotoUrl,
      categoryName: b.categoryName,
      areaName: b.areaName,
      cityName: b.cityName,
    };
  }
  writeCache(cache);
}

export function lookupBusiness(id: string): CachedBusinessSummary | null {
  return readCache()[id] ?? null;
}
