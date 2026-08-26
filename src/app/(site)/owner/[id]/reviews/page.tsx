"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { OwnerReviewsPanel } from "@/components/owner/reviews-panel";

export default function OwnerReviewsPage() {
  const { business } = useOwnerBusiness();
  return <OwnerReviewsPanel business={business} />;
}
