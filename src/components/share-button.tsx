"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";

export function ShareButton({ name, slug }: { name: string; slug: string }) {
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="15" cy="4.5" r="2" />
          <circle cx="5" cy="10" r="2" />
          <circle cx="15" cy="15.5" r="2" />
          <path d="M6.7 9 L13.3 5.5 M6.7 11 L13.3 14.5" />
        </svg>
        Share
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
