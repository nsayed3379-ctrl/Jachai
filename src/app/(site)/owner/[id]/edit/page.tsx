"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { businessApi } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { BusinessAccountCta } from "@/components/business-account-cta";
import { BusinessForm } from "@/components/business-form";
import { errorMessage } from "@/lib/toast-context";
import type { BusinessResponse } from "@/lib/types";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function EditContent() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // BusinessController only exposes get-by-slug, not get-by-id — since an
    // owner's own listings are few, we fetch "mine" and find by id here.
    businessApi
      .mine()
      .then((list) => {
        const match = list.find((b) => b.id === id);
        if (!match) {
          setError("Business not found, or you don't own this listing.");
        } else {
          setBusiness(match);
        }
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;
  if (error || !business) return <ErrorBanner message={error ?? "Not found"} />;

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Edit {business.name}</h1>
      <BusinessForm existing={business} />
    </>
  );
}

export default function EditBusinessPage() {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]} fallback={<BusinessAccountCta />}>
      <EditContent />
    </RoleGate>
  );
}
