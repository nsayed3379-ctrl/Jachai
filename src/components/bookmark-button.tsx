"use client";

import { useEffect, useState } from "react";
import { bookmarkApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BookmarkButton({ businessId }: { businessId: string }) {
  const { user } = useAuth();
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
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-ink-100 bg-white p-1.5 shadow-pop">
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
