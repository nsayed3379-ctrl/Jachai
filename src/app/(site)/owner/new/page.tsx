"use client";

import { useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { BusinessForm } from "@/components/business-form";
import { DuplicateCheckStep, type DuplicateCheckValues } from "@/components/duplicate-check-step";

function NewBusinessContent() {
  const [confirmedValues, setConfirmedValues] = useState<DuplicateCheckValues | null>(null);

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">List your business</h1>
      {confirmedValues ? (
        <BusinessForm initialValues={confirmedValues} />
      ) : (
        <DuplicateCheckStep onContinue={setConfirmedValues} />
      )}
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
