"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { bookmarkApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BookmarkButton({ businessId, iconOnly }: { businessId: string; iconOnly?: boolean }) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();
  const [bookmarked, setBookmarked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }
    bookmarkApi
      .mine()
      .then((list) => setBookmarked(list.some((b) => b.businessId === businessId)))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [user, businessId]);

  // Compact overlay variant for a card thumbnail — a direct save/unsave
  // toggle into the default collection, no collection picker (that stays on
  // the full detail-page button below) so it never needs a dropdown that a
  // photo's overflow-hidden would clip.
  async function quickToggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    if (busy) return;
    const wasBookmarked = bookmarked;
    setBusy(true);
    setBookmarked(!wasBookmarked);
    try {
      if (wasBookmarked) {
        await bookmarkApi.remove(businessId);
      } else {
        await bookmarkApi.add(businessId, null);
      }
    } catch (err) {
      setBookmarked(wasBookmarked);
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle() {
    if (!user) return;
    setBusy(true);
    try {
      if (bookmarked) {
        await bookmarkApi.remove(businessId);
        setBookmarked(false);
        show("Removed from bookmarks", "success");
      } else {
        const cols = await bookmarkApi.myCollections();
        if (cols.length > 0) {
          setCollections(cols);
          setOpen(true);
        } else {
          await bookmarkApi.add(businessId, null);
          setBookmarked(true);
          show("Saved to My Favorites", "success");
        }
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function addToCollection(collectionId: string | null) {
    setBusy(true);
    try {
      await bookmarkApi.add(businessId, collectionId);
      setBookmarked(true);
      setOpen(false);
      show("Bookmarked", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={quickToggle}
        disabled={busy}
        aria-label={bookmarked ? "Remove bookmark" : "Save business"}
        title={bookmarked ? "Remove bookmark" : "Save business"}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-default",
          bookmarked ? "text-crimson-600" : "text-ink-600"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill={bookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path
            d="M12 20.5s-7.5-4.6-9.8-9.3C.7 7.9 2.3 4.8 5.4 4.1c2-.4 3.9.5 5 2.1a5.8 5.8 0 0 1 5-2.1c3.1.7 4.7 3.8 3.2 7.1-2.3 4.7-9.6 9.3-9.6 9.3Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  if (!user || !checked) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm",
          bookmarked
            ? "border-gold-400 bg-gold-50 text-gold-700"
            : "border-ink-200 text-ink-700 hover:bg-ink-50"
        )}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
          <path d="M5 3h10v14l-5-3.5L5 17V3z" />
        </svg>
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-ink-100 bg-surface p-1.5 shadow-pop">
          <button
            onClick={() => addToCollection(null)}
            className="w-full text-left rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
          >
            My Favorites (default)
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => addToCollection(c.id)}
              className="w-full text-left rounded px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
            >
              {c.name || "Unnamed collection"}
            </button>
          ))}
          <button onClick={() => setOpen(false)} className="w-full text-left rounded px-3 py-2 text-xs text-ink-400 hover:bg-ink-50">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
