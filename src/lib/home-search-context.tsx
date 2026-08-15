"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { referenceApi } from "./api";
import { PAGE_SIZE } from "./config";
import type { Area, BusinessSearchParams, Category, City } from "./types";

interface HomeSearchContextValue {
  params: BusinessSearchParams;
  setParams: (next: BusinessSearchParams) => void;
  locationStatus: "idle" | "locating" | "granted" | "denied";
  useMyLocation: () => void;
  categories: Category[];
  cities: City[];
  areas: Area[];
  cityId: string;
  setCityId: (id: string) => void;
}

const HomeSearchContext = createContext<HomeSearchContextValue | null>(null);

/**
 * Wraps the whole app (see layout.tsx) so the primary search bar can live
 * inside the persistent Navbar — rendered there only on the home page — while
 * the results grid and the secondary Price/Rating/Sort row stay in page.tsx,
 * both reading/writing this same state instead of two disconnected copies.
 */
export function HomeSearchProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<BusinessSearchParams>({ sort: "newest", page: 0, size: PAGE_SIZE });
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "granted" | "denied">("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cityId, setCityId] = useState<string>("");

  useEffect(() => {
    referenceApi.categories().then(setCategories).catch(() => {});
    referenceApi
      .cities()
      .then((list) => {
        setCities(list);
        if (list.length > 0) setCityId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    referenceApi.areas(cityId).then(setAreas).catch(() => {});
  }, [cityId]);

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
    <HomeSearchContext.Provider
      value={{ params, setParams, locationStatus, useMyLocation, categories, cities, areas, cityId, setCityId }}
    >
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch(): HomeSearchContextValue {
  const ctx = useContext(HomeSearchContext);
  if (!ctx) throw new Error("useHomeSearch must be used within HomeSearchProvider");
  return ctx;
}