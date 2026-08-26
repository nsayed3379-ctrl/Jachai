"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { BusinessForm } from "@/components/business-form";

export default function OwnerBusinessInfoPage() {
  const { business } = useOwnerBusiness();
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Business info</h2>
      <BusinessForm existing={business} />
    </div>
  );
}
