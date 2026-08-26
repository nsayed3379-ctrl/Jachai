"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useOwnerBusiness } from "@/lib/owner-business-context";
import { modulesForKind } from "@/lib/category-modules";
import { CategoryModuleSection } from "@/components/category-modules/category-modules-manager";

export default function OwnerModuleSectionPage() {
  const { business } = useOwnerBusiness();
  const { module: moduleKey } = useParams<{ module: string }>();

  const def = modulesForKind(business.categoryKind).find((m) => m.key === moduleKey);

  if (!def) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white p-6 text-center">
        <p className="text-sm text-ink-500">That section isn&apos;t available for this business.</p>
        <Link href={`/owner/${business.id}`} className="mt-2 inline-block text-sm font-medium text-crimson-700 hover:underline">
          ← Back to Overview
        </Link>
      </div>
    );
  }

  return <CategoryModuleSection module={def} businessId={business.id} kind={business.categoryKind} />;
}
