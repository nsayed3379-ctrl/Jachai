"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Spec §17(b): consumer-side profile map. Interactive OpenStreetMap tiles via
 * Leaflet — no Google Maps API key required. Scroll-zoom stays off by default
 * so the map doesn't hijack page scroll; it turns on while the cursor is over
 * the map and off again on mouseleave. "Get directions" still hands off to
 * the Google Maps app/website via a universal deep link.
 */
export function MapPreview({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    import("leaflet").then((L) => {
      if (cancelled || mapRef.current) return;

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0F5039;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const map = L.map(el, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude], { icon: pinIcon }).addTo(map).bindPopup(name);

      el.addEventListener("mouseenter", () => map.scrollWheelZoom.enable());
      el.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name]);

  return (
    <div className="relative overflow-hidden rounded-md border border-ink-100 h-56">
      <div ref={containerRef} className="h-full w-full" aria-label={`Map showing location of ${name}`} />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-[500] rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium text-ink-700 shadow hover:bg-surface"
      >
        Get directions →
      </a>
    </div>
  );
}
