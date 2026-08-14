"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui/modal";
import { GalleryImage } from "./gallery-image";

/**
 * "See all N photos" experience — a grid of every photo, and a full-screen
 * lightbox (prev/next, keyboard arrows, counter) when one is clicked.
 * No category tabs: the business-photo model has no metadata to filter by,
 * so this deliberately doesn't fake filter chips that don't do anything.
 */
export function PhotoGalleryModal({
  open,
  onClose,
  photos,
  businessName,
  initialIndex = null,
}: {
  open: boolean;
  onClose: () => void;
  photos: string[];
  businessName: string;
  initialIndex?: number | null;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(initialIndex);

  // Re-sync whenever the modal is (re)opened, e.g. clicking a specific hero
  // thumbnail should land directly in the lightbox at that photo.
  useEffect(() => {
    if (open) setLightboxIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (lightboxIndex === null || photos.length === 0) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length));
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, photos.length]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="gallery-modal-heading" panelClassName="max-w-6xl">
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-6">
          {lightboxIndex !== null ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-crimson-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All photos
            </button>
          ) : (
            <h2 id="gallery-modal-heading" className="font-display text-lg font-bold text-ink-900">
              Photos of {businessName} ({photos.length})
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo gallery"
            className="rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lightboxIndex === null ? (
          <div className="overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {photos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-ink-100"
                >
                  <GalleryImage
                    src={url}
                    alt={`${businessName} photo ${i + 1}`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[50vh] flex-1 items-center justify-center bg-ink-950">
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length))}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M8 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
            <div className="relative h-[50vh] w-full sm:h-[70vh]">
              <GalleryImage
                src={photos[lightboxIndex]}
                alt={`${businessName} photo ${lightboxIndex + 1}`}
                sizes="90vw"
                fit="contain"
                priority
              />
            </div>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
              {lightboxIndex + 1} / {photos.length}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
