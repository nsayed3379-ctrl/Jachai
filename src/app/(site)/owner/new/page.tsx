"use client";

import { useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { BusinessForm } from "@/components/business-form";
import { BusinessSearchStep } from "@/components/business-search-step";

function NewBusinessContent() {
  const [prefillName, setPrefillName] = useState<string | null>(null);

  if (prefillName !== null) {
    return (
      <>
        <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">List your business</h1>
        <BusinessForm initialValues={prefillName ? { name: prefillName } : undefined} />
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">List your business</h1>
      <p className="text-sm text-ink-500 mb-6">
        First, search for your business to see if it&apos;s already listed on Jachai.
      </p>
      <BusinessSearchStep onAddNew={setPrefillName} />
    </>
  );
}

export default function NewBusinessPage() {
  return (
    <RoleGate>
      <NewBusinessContent />
    </RoleGate>
  );
}
