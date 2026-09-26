"use client";

import { useState, type MouseEvent } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { Facebook, WhatsApp } from "./icons/brand";
import { IconButton } from "./ui/icon-button";

/**
 * Shared by business cards/pages and community posts — one share control, one
 * popover, no duplicated Web-Share/clipboard logic per call site. `url` can be
 * origin-relative (a page on this site) or absolute; `title` is what a native
 * share sheet or the WhatsApp prefill text shows.
 */
export function ShareButton({
  url,
  title,
  iconOnly,
  trigger,
}: {
  url: string;
  title: string;
  iconOnly?: boolean;
  /** Renders a custom trigger (e.g. a row inside another menu) instead of the default button — same pattern as ReportButton's `trigger`. Still owns the native-share/popover behavior and renders the popover itself. */
  trigger?: (onClick: (e: MouseEvent) => void) => React.ReactNode;
}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);

  const absoluteUrl = url.startsWith("http")
    ? url
    : typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;
  const whatsappText = `${title}: ${absoluteUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      show("Link copied", "success");
    } catch {
      show("Could not copy link", "error");
    }
    setOpen(false);
  }

  // Native share sheet on mobile (one tap, no popover); desktop browsers mostly
  // don't implement navigator.share, so they fall back to the popover below.
  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: absoluteUrl, title });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {trigger ? (
        trigger(handleClick)
      ) : iconOnly ? (
        <IconButton variant="ghost" size="sm" onClick={handleClick} aria-label="Share" title="Share">
          <Share2 size={18} strokeWidth={1.75} />
        </IconButton>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800",
            interactiveTransition,
            focusRing
          )}
        >
          <Share2 size={16} strokeWidth={1.75} />
          Share
        </button>
      )}
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-ink-100 bg-surface p-1.5 shadow-pop dark:border-ink-700">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("flex items-center gap-2 rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800", focusRing)}
          >
            <WhatsApp className="h-4 w-4 shrink-0" /> Share on WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("flex items-center gap-2 rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800", focusRing)}
          >
            <Facebook className="h-4 w-4 shrink-0" /> Share on Facebook
          </a>
          <button
            type="button"
            onClick={copyLink}
            className={cn("w-full text-left rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800", focusRing)}
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
