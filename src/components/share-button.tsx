"use client";

import { useState, type MouseEvent } from "react";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

export function ShareButton({
  name,
  slug,
  iconOnly,
}: {
  name: string;
  slug: string;
  iconOnly?: boolean;
}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/business/${slug}` : `/business/${slug}`;
  const text = `Check out ${name} on Jachai: ${url}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      show("Link copied", "success");
    } catch {
      show("Could not copy link", "error");
    }
    setOpen(false);
  }

  function toggleOpen(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={toggleOpen}
        className={cn(
          iconOnly
            ? "flex flex-col items-center justify-center gap-0.5 py-0.5 text-xs font-medium text-ink-400 transition-colors duration-150 hover:text-crimson-600"
            : "inline-flex items-center gap-1.5 rounded border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
        )}
      >
        {iconOnly ? (
          <span
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              open ? "shadow-md bg-gradient-to-b from-ink-500 to-ink-700" : "bg-white border-2 border-ink-300"
            )}
          >
            {open && <span className="pointer-events-none absolute inset-x-2 top-1 h-2 rounded-full bg-white/35 blur-[2px]" />}
            <svg
              viewBox="0 0 24 24"
              className={cn("relative h-4 w-4 fill-none", open ? "stroke-white" : "stroke-ink-500")}
              strokeWidth="2"
            >
              <path d="M10 14a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1 1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 10a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1-1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="15" cy="4.5" r="2" />
            <circle cx="5" cy="10" r="2" />
            <circle cx="15" cy="15.5" r="2" />
            <path d="M6.7 9 L13.3 5.5 M6.7 11 L13.3 14.5" />
          </svg>
        )}
        {iconOnly ? <span>Share</span> : "Share"}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-ink-100 bg-surface p-1.5 shadow-pop">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
          >
            Share on WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
          >
            Share on Facebook
          </a>
          <button onClick={copyLink} className="w-full text-left rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
