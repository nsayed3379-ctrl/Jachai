"use client";

import { cn } from "@/lib/utils";

/**
 * Facebook-style photo attachment grid for a community post — 1 photo full
 * width, 2 side-by-side, 3 as one tall + two stacked, 4+ as a 2x2 grid.
 * Pass `maxVisible` to cap the grid and overlay a "+N" count on the last
 * visible tile (feed cards); omit it to show every photo in a plain
 * wrapping grid instead (post detail page).
 */
export function CommunityPostPhotoGrid({ urls, maxVisible }: { urls: string[]; maxVisible?: number }) {
  if (urls.length === 0) return null;

  if (!maxVisible) {
    return (
      <div className="mt-2.5 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {urls.map((url, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  const visible = urls.slice(0, maxVisible);
  const overflow = urls.length - visible.length;

  if (visible.length === 1) {
    return (
      <div className="mt-2.5 overflow-hidden rounded-lg bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={visible[0]} alt="" className="max-h-96 w-full object-cover" />
      </div>
    );
  }

  if (visible.length === 2) {
    return (
      <div className="mt-2.5 grid h-56 grid-cols-2 gap-1 overflow-hidden rounded-lg">
        {visible.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2.5 grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg">
      {visible.map((url, i) => {
        const showOverlay = i === visible.length - 1 && overflow > 0;
        return (
          <div key={i} className={cn("relative", i === 0 && visible.length === 3 && "row-span-2")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                +{overflow}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
