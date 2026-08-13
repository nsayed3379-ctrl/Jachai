"use client";

import { useEffect, useState } from "react";
import { reviewApi } from "@/lib/api";
import type { RatingBreakdown } from "@/lib/types";

const ROWS: [number, keyof RatingBreakdown][] = [
  [5, "fiveStar"],
  [4, "fourStar"],
  [3, "threeStar"],
  [2, "twoStar"],
  [1, "oneStar"],
];

/** Business detail page "Overall rating" bar chart — public aggregate, self-fetching. */
export function RatingBreakdownChart({ businessId }: { businessId: string }) {
  const [data, setData] = useState<RatingBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    reviewApi
      .ratingBreakdown(businessId)
      .then((res) => !cancelled && setData(res))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!data || data.total === 0) return null;

  return (
    <div className="max-w-xs">
      {ROWS.map(([star, key]) => {
        const count = data[key];
        const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 py-0.5">
            <span className="w-3 text-xs font-medium text-ink-500 text-right">{star}</span>
            <div className="h-2 flex-1 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-crimson-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-xs text-ink-400 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
