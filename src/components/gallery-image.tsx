"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Shared <Image fill> wrapper for gallery contexts (hero composition, "see
 * all photos" grid, lightbox) — fades in on load against the parent's
 * bg-ink-100 so there's never a broken-image flash or a layout shift while
 * the network fetch is in flight.
 */
export function GalleryImage({
  src,
  alt,
  sizes,
  priority,
  fit = "cover",
  position = "center",
  className,
  onError,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  // No image-type metadata exists (portrait vs. storefront vs. product), so
  // this can't truly detect a subject. "top" is a pragmatic default for
  // hero use: it keeps a face/signage in frame far more often than a pure
  // center crop, at the cost of sometimes trimming a bit of foreground.
  position?: "center" | "top";
  className?: string;
  onError?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(
        fit === "cover" ? "object-cover" : "object-contain",
        position === "top" ? "object-top" : "object-center",
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={() => setLoaded(true)}
      onError={onError}
    />
  );
}
