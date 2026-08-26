"use client";

import { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";
import type { AnalyticsRange, AnalyticsResponse } from "@/lib/types";
import { errorMessage } from "@/lib/toast-context";
import { PageSpinner } from "./ui/misc";

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-3 text-center">
      <p className="font-display text-2xl font-bold text-ink-900">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-ink-400">{label}</p>
    </div>
  );
}

/**
 * Owner "Business performance" — five real first-party counts for a date range
 * (default: last 30 days). Aggregated server-side; no chart in Phase 3.
 */
export function BusinessPerformance({ businessId }: { businessId: string }) {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsApi
      .get(businessId, range)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [businessId, range]);

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-900">Business performance</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-crimson-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading && <PageSpinner />}
        {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && !error && data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Profile views" value={data.profileViews} />
            <MetricCard label="Phone clicks" value={data.phoneClicks} />
            <MetricCard label="WhatsApp clicks" value={data.whatsappClicks} />
            <MetricCard label="Directions" value={data.directionsClicks} />
            <MetricCard label="Website clicks" value={data.websiteClicks} />
          </div>
        )}
      </div>
    </div>
  );
}
