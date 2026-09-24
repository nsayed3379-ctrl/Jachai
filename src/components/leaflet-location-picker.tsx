"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/button";
import { Input } from "./ui/field";

interface NominatimResult {
  lat: string;
  lon: string;
}

/**
 * Leaflet + OpenStreetMap Nominatim equivalent of the old Google Maps JS API
 * picker — same UX (type an address, hit Find, or click/drag the pin), no API
 * key or billing account required. Replaces GoogleLocationPicker everywhere
 * so the app has exactly one map provider (matching MapPreview's read-only
 * display), instead of Google Maps failing to load wherever billing/key
 * issues hit it while a different page works fine on Leaflet.
 */
export function LeafletLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    import("leaflet").then((L) => {
      if (cancelled || mapRef.current) return;

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#dc2626;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const map = L.map(el, { center: [latitude, longitude], zoom: 15 });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });
      markerRef.current = marker;
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is built once; live lat/lng sync happens in the effect below instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflects lat/lng that changed from outside the map itself (e.g. "use my current location").
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.panTo([latitude, longitude]);
  }, [latitude, longitude]);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      const results: NominatimResult[] = await res.json();
      const first = results[0];
      if (!first) {
        setError("No results for that address.");
        return;
      }
      onChangeRef.current(Number(Number(first.lat).toFixed(6)), Number(Number(first.lon).toFixed(6)));
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
