"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSpinner } from "@/components/ui/misc";

/** Legacy route — the dashboard is now the workspace Overview at /owner/[id]. */
export default function OwnerDashboardRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/owner/${id}`);
  }, [router, id]);

  return <PageSpinner />;
}
