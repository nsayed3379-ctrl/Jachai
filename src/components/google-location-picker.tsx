"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { Button } from "./ui/button";
import { Input } from "./ui/field";

/**
 * Google Maps JS API + Geocoding equivalent of the admin panel's
 * Leaflet/Nominatim picker (business-fields.html) — same UX (type an
 * address, hit Find, or click/drag the pin), different provider.
 */
export function GoogleLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        const map = new g.maps.Map(containerRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const marker = new g.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          draggable: true,
        });
        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) onChangeRef.current(Number(pos.lat().toFixed(6)), Number(pos.lng().toFixed(6)));
        });
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          onChangeRef.current(Number(e.latLng.lat().toFixed(6)), Number(e.latLng.lng().toFixed(6)));
        });
        mapRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new g.maps.Geocoder();
        setReady(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load Google Maps"));
    return () => {
      cancelled = true;
    };
    // Map is built once; live lat/lng sync happens in the effect below instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflects lat/lng that changed from outside the map itself (e.g. "use my current location").
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [latitude, longitude]);

  async function handleSearch() {
    if (!query.trim() || !geocoderRef.current) return;
    setSearching(true);
    setError(null);
    try {
      const res = await geocoderRef.current.geocode({ address: query, componentRestrictions: { country: "BD" } });
      const first = res.results[0];
      if (!first) {
        setError("No results for that address.");
        return;
      }
      const loc = first.geometry.location;
      onChangeRef.current(Number(loc.lat().toFixed(6)), Number(loc.lng().toFixed(6)));
    } catch {
      setError("Search failed — try a more specific address.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          placeholder='Search an address or landmark, e.g. "Gulshan 2, Dhaka"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleSearch} loading={searching}>
          Find
        </Button>
      </div>

      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}

      <div ref={containerRef} className="h-64 w-full rounded-md border border-ink-200 bg-ink-50" />
      {!ready && !error && <p className="mt-1 text-xs text-ink-400">Loading map…</p>}

      <p className="mt-2 text-xs text-ink-400">
        Click the map, drag the pin, or search an address above — the coordinates fill in automatically.
      </p>
    </div>
  );
}
