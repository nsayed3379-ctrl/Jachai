"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { OwnerOverviewPanel } from "@/components/owner/overview-panel";

export default function OwnerOverviewPage() {
  const { business } = useOwnerBusiness();
  return <OwnerOverviewPanel business={business} />;
}
