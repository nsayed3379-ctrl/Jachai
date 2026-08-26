"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { OwnerInsightsPanel } from "@/components/owner/insights-panel";

export default function OwnerInsightsPage() {
  const { business } = useOwnerBusiness();
  return <OwnerInsightsPanel businessId={business.id} />;
}
