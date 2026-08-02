"use client";

/**
 * Spec §17(b): consumer-side profile map is a static, non-interactive preview.
 * Clicking it hands off to the Google Maps app / website via a universal deep
 * link rather than opening an in-app interactive map — no map SDK needed here.
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
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const staticMapsKey = process.env.NEXT_PUBLIC_GOOGLE_STATIC_MAPS_KEY;
  const staticMapUrl = staticMapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=640x280&scale=2&markers=color:0x0F5039%7C${latitude},${longitude}&key=${staticMapsKey}`
    : null;

  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative overflow-hidden rounded-md border border-ink-100 h-56"
      aria-label={`Get directions to ${name}`}
    >
      {staticMapUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={staticMapUrl} alt={`Map showing location of ${name}`} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,#EAF5F0,transparent_60%),radial-gradient(circle_at_70%_70%,#F4E4B9,transparent_55%)] bg-ink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-lg">
              📍
            </div>
            <p className="mt-2 text-xs text-ink-400">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink-900/70 via-transparent to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm font-medium">Get directions →</span>
      </div>
      <div className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink-700 shadow group-hover:hidden">
        Open in Google Maps
      </div>
    </a>
  );
}
