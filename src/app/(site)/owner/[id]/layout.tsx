"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { businessApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { BusinessAccountCta } from "@/components/business-account-cta";
import { OwnerBusinessProvider } from "@/lib/owner-business-context";
import { OwnerBusinessSidebar } from "@/components/owner/owner-business-sidebar";
import { FlaggedNotice } from "@/components/owner/flagged-notice";
import { VerifiedBadge } from "@/components/verified-badge";
import { errorMessage } from "@/lib/toast-context";
import type { BusinessResponse } from "@/lib/types";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function Workspace({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [all, setAll] = useState<BusinessResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    businessApi
      .mine()
      .then(setAll)
      .catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorBanner message={error} />;
  if (!all) return <PageSpinner />;

  const business = all.find((b) => b.id === id);
  if (!business) {
    return <ErrorBanner message="Business not found, or you don't own this listing." />;
  }

  return (
    <OwnerBusinessProvider value={{ business, allBusinesses: all, refresh: load }}>
      <div>
        {/* Compact workspace header — always visible above every section */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink-900">{business.name}</h1>
              {business.verified && <VerifiedBadge />}
            </div>
            <p className="mt-0.5 text-sm text-ink-400">
              {business.categoryName} · {business.areaName}, {business.cityName}
            </p>
          </div>
          <Link href={`/business/${business.slug}`} className="mt-1 text-xs text-ink-500 hover:underline">
            View public profile →
          </Link>
        </div>

        <FlaggedNotice business={business} />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <OwnerBusinessSidebar business={business} allBusinesses={all} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </OwnerBusinessProvider>
  );
}

export default function OwnerBusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]} fallback={<BusinessAccountCta />}>
      <Workspace>{children}</Workspace>
    </RoleGate>
  );
}
