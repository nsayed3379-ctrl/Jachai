"use client";

import { RoleGate } from "@/components/role-gate";
import { BusinessForm } from "@/components/business-form";

export default function NewBusinessPage() {
  return (
    <RoleGate>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">List your business</h1>
      <BusinessForm />
    </RoleGate>
  );
}
