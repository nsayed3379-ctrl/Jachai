"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { qrApi } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { errorMessage } from "@/lib/toast-context";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

/**
 * Business QR V1's public entry point. Resolves the scanned token to the
 * business's *current* slug (never a slug baked into the QR itself, so a
 * later slug change never breaks an already-printed QR) and redirects to the
 * existing public business page — this route never renders a second copy of
 * that page.
 */
export default function QrRedirectPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    qrApi
      .resolve(token)
      .then((res) => {
        if (cancelled) return;
        trackEvent(res.businessId, "QR_SCAN");
        router.replace(`/business/${res.slug}`);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <ErrorBanner message="This QR code isn't valid, or the business is no longer available." />
    );
  }
  return <PageSpinner />;
}
