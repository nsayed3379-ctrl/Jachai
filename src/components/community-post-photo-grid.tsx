"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "./ui/modal";

/**
 * Facebook-style photo attachment grid for a community post — 1 photo full
 * width, 2 side-by-side, 3+ as one large tile + the rest stacked in a
 * column beside it (never a uniform grid, same asymmetric collage FB uses).
 * Pass `maxVisible` to cap the grid and overlay a "+N" count on the last
 * visible tile (feed cards, which stay non-interactive here since the whole
 * card already navigates to the post on click); omit it to show every photo
 * in a plain wrapping grid instead (post detail page) — there, each tile
 * opens a full-size lightbox with prev/next navigation between photos.
 */
export function CommunityPostPhotoGrid({ urls, maxVisible }: { urls: string[]; maxVisible?: number }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  if (!maxVisible) {
    return (
      <>
        <div className="mt-2.5 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="aspect-square overflow-hidden rounded-lg bg-ink-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <Modal open={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} panelClassName="max-w-3xl">
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-500">
                {lightboxIndex !== null && `${lightboxIndex + 1} / ${urls.length}`}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative mt-3 flex items-center justify-center">
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length))}
                  aria-label="Previous photo"
                  className="absolute left-1 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors duration-150 hover:bg-black/60"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {lightboxIndex !== null && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[lightboxIndex]} alt="" className="max-h-[70vh] w-full rounded-lg object-contain" />
              )}
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => (i === null ? i : (i + 1) % urls.length))}
                  aria-label="Next photo"
                  className="absolute right-1 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors duration-150 hover:bg-black/60"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </Modal>
      </>
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

  if (visible.length === 3) {
    return (
      <div className="mt-2.5 grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg">
        {visible.map((url, i) => (
          <div key={i} className={cn("relative", i === 0 && "row-span-2")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // 4+ photos — Facebook-style collage: one large tile on the left, the rest
  // stacked in a column on the right (not a uniform grid), "+N" overlay on
  // the last stacked tile when there are more photos than fit.
  const [first, ...rest] = visible;
  return (
    <div className="mt-2.5 flex h-72 gap-1 overflow-hidden rounded-lg">
      <div className="h-full w-1/2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={first} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex h-full w-1/2 flex-col gap-1">
        {rest.map((url, i) => {
          const showOverlay = i === rest.length - 1 && overflow > 0;
          return (
            <div key={i} className="relative flex-1 overflow-hidden">
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
    </div>
  );
}
