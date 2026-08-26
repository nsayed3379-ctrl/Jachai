"use client";

import { useEffect, useState } from "react";
import { reviewApi } from "@/lib/api";
import { errorMessage } from "@/lib/toast-context";
import { RatingTrendChart } from "@/components/rating-trend-chart";
import { Button } from "@/components/ui/button";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

/** Rating trend over time (weekly / monthly). Was the dashboard's "Rating trend" tab. */
export function OwnerInsightsPanel({ businessId }: { businessId: string }) {
  const [bucket, setBucket] = useState<"week" | "month">("week");
  const [rows, setRows] = useState<unknown[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reviewApi
      .ratingTrend(businessId, bucket)
      .then(setRows)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [businessId, bucket]);

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Rating trend</h2>
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={bucket === "week" ? "primary" : "outline"} onClick={() => setBucket("week")}>
          Weekly
        </Button>
        <Button size="sm" variant={bucket === "month" ? "primary" : "outline"} onClick={() => setBucket("month")}>
          Monthly
        </Button>
      </div>
      {loading && <PageSpinner />}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && <RatingTrendChart rows={rows} />}
    </div>
  );
}
