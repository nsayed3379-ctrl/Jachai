"use client";

import { useEffect, useState } from "react";
import { ApiClientError, summaryApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { BusinessReviewSummary } from "@/lib/types";

export function AiSummaryCard({ businessId }: { businessId: string }) {
  const [summary, setSummary] = useState<BusinessReviewSummary | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    summaryApi
      .get(businessId)
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setState("ready");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setState("none");
        } else {
          setState("none");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (state === "loading") return null;
  if (state === "none") return null;
  if (!summary) return null;

  return (
    <div className="rounded-md border border-brand-200 bg-brand-50/60 p-4">
      <div className="flex items-center gap-2 text-brand-800">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M10 1l1.9 5.6L17.5 8 11.9 9.9 10 15.5 8.1 9.9 2.5 8l5.6-1.4z" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wide">AI review summary</span>
      </div>
      <p className="mt-2 text-sm text-ink-800 leading-relaxed">{summary.summaryText}</p>
      <p className="mt-2 text-[11px] text-ink-400">
        Based on {summary.reviewCountAtGeneration} reviews · generated {formatDateTime(summary.generatedAt)}
      </p>
    </div>
  );
}
