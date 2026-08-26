"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completenessApi, galleryApi, summaryApi } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { BusinessResponse, CompletenessResponse } from "@/lib/types";
import { ProfileCompletenessCard } from "@/components/profile-completeness-card";
import { BusinessPerformance } from "@/components/business-performance";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/misc";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-3 text-center">
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-400">{label}</p>
    </div>
  );
}

/** Completeness recommendation keys that map to a category-module section route. */
const MODULE_ITEM_KEYS = ["menu", "services", "team", "products", "facilities"];

/**
 * The owner workspace "Overview" — at-a-glance metrics, profile completeness, and
 * Business performance. (Was the old dashboard's Overview tab.)
 */
export function OwnerOverviewPanel({ business }: { business: BusinessResponse }) {
  const router = useRouter();
  const { show } = useToast();
  const [completeness, setCompleteness] = useState<CompletenessResponse | null>(null);
  const [galleryCount, setGalleryCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    completenessApi
      .get(business.id)
      .then((c) => !cancelled && setCompleteness(c))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    galleryApi
      .list(business.id)
      .then((p) => !cancelled && setGalleryCount(p.length))
      .catch(() => !cancelled && setGalleryCount(0));
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  function jumpToCompletenessItem(key: string) {
    if (key === "gallery") router.push(`/owner/${business.id}/photos`);
    else if (MODULE_ITEM_KEYS.includes(key)) router.push(`/owner/${business.id}/sections/${key}`);
    else router.push(`/owner/${business.id}/edit`); // description, hours, cover, logo, presence
  }

  async function regenerateSummary() {
    setRegenerating(true);
    try {
      await summaryApi.regenerate(business.id);
      show("Regeneration requested — refresh the public page shortly.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">Overview</h2>
        <Button size="sm" variant="outline" onClick={regenerateSummary} loading={regenerating}>
          Regenerate AI summary
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Average rating" value={business.averageRating.toFixed(1)} />
        <MetricCard label="Reviews" value={business.reviewCount} />
        <MetricCard label="Gallery photos" value={galleryCount ?? "—"} />
        <MetricCard label="Completeness" value={completeness ? `${completeness.percentage}%` : "—"} />
      </div>

      {error && <ErrorBanner message={error} />}
      {completeness && <ProfileCompletenessCard data={completeness} onJump={jumpToCompletenessItem} />}

      <BusinessPerformance businessId={business.id} />
    </div>
  );
}
