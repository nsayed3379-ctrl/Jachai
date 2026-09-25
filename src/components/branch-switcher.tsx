"use client";

import { useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { errorMessage } from "@/lib/toast-context";
import type { BusinessResponse } from "@/lib/types";

/**
 * "{N} branches ▾" pill on the business hero — lazily fetches the brand's other locations
 * on first open. Lists them SimilarBusinessCard-style (compact, single-line), marking the
 * current business instead of linking it to itself.
 */
export function BranchSwitcher({
  brandSlug,
  brandName,
  branchCount,
  currentBusinessId,
}: {
  brandSlug: string;
  brandName: string;
  branchCount: number;
  currentBusinessId: string;
}) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BusinessResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen && branches === null && !loading) {
        setLoading(true);
        setError(null);
        businessApi
          .getBranches(brandSlug)
          .then(setBranches)
          .catch((e) => setError(errorMessage(e)))
          .finally(() => setLoading(false));
      }
      return willOpen;
    });
  }

  return (
    <div className="relative inline-block pointer-events-auto">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 underline decoration-white/50 hover:decoration-white"
      >
        {branchCount} branches
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-ink-100 bg-white p-2 text-left text-ink-900 shadow-lift">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {brandName} — other locations
          </p>
          {loading && <p className="px-2 py-2 text-sm text-ink-400">Loading…</p>}
          {error && <p className="px-2 py-2 text-sm text-rose-600">{error}</p>}
          {branches && (
            <ul className="max-h-72 overflow-y-auto">
              {branches.map((b) =>
                b.id === currentBusinessId ? (
                  <li key={b.id} className="rounded-lg px-2 py-2 text-sm">
                    <span className="font-semibold text-ink-900">{b.name}</span>
                    <span className="ml-1.5 text-xs text-ink-400">(this location)</span>
                    <p className="text-xs text-ink-400">
                      {b.areaName}, {b.cityName}
                    </p>
                  </li>
                ) : (
                  <li key={b.id}>
                    <Link
                      href={`/business/${b.slug}`}
                      className="block rounded-lg px-2 py-2 text-sm hover:bg-ink-50"
                    >
                      <span className="font-semibold text-ink-900">{b.name}</span>
                      <p className="text-xs text-ink-400">
                        {b.areaName}, {b.cityName}
                      </p>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
