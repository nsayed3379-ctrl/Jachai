"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { BusinessGalleryManager } from "@/components/business-gallery-manager";

export default function OwnerPhotosPage() {
  const { business } = useOwnerBusiness();
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Photos</h2>
      <BusinessGalleryManager businessId={business.id} />
    </div>
  );
}
