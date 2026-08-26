"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { BusinessUpdatesEditor } from "@/components/business-updates-editor";

export default function OwnerUpdatesPage() {
  const { business } = useOwnerBusiness();
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Updates</h2>
      <BusinessUpdatesEditor businessId={business.id} />
    </div>
  );
}
