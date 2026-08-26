"use client";

import type { CategoryKind } from "@/lib/types";
import { modulesForKind, type ModuleDef } from "@/lib/category-modules";
import { MenuEditor } from "./menu-editor";
import { ProductEditor } from "./product-editor";
import { ServiceListEditor } from "./service-list-editor";
import { TeamListEditor } from "./team-list-editor";

/**
 * Owner-side dispatcher: given a listing's category kind, renders the matching
 * optional module editors with business-facing labels ("Menu", "Doctors",
 * "Membership plans", …). The owner never sees the word "kind".
 */
export function CategoryModulesManager({ businessId, kind }: { businessId: string; kind: CategoryKind }) {
  const modules = modulesForKind(kind);

  return (
    <div className="space-y-8">
      {modules.map((m) => (
        <section key={m.key}>
          <h3 className="mb-2 text-sm font-semibold text-ink-900">{m.ownerLabel}</h3>
          <ModuleEditor module={m} businessId={businessId} kind={kind} />
        </section>
      ))}
    </div>
  );
}

/** A single module's editor with its owner-facing heading — used for the dashboard's per-module tabs. */
export function CategoryModuleSection({
  module: m,
  businessId,
  kind,
}: {
  module: ModuleDef;
  businessId: string;
  kind: CategoryKind;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink-900">{m.ownerLabel}</h3>
      <ModuleEditor module={m} businessId={businessId} kind={kind} />
    </section>
  );
}

function ModuleEditor({ module: m, businessId, kind }: { module: ModuleDef; businessId: string; kind: CategoryKind }) {
  switch (m.key) {
    case "menu":
      return <MenuEditor businessId={businessId} addLabel={m.addLabel} />;
    case "products":
      return <ProductEditor businessId={businessId} addLabel={m.addLabel} />;
    case "team":
      return (
        <TeamListEditor
          businessId={businessId}
          addLabel={m.addLabel}
          emptyHint={`No ${m.ownerLabel.toLowerCase()} added yet.`}
          roleLabel={kind === "CLINIC" ? "Specialty" : kind === "GYM" ? "Focus / role" : "Role"}
        />
      );
    case "facilities":
      return (
        <ServiceListEditor
          businessId={businessId}
          section="FACILITY"
          addLabel={m.addLabel}
          emptyHint="No facilities listed yet."
          withPrice={false}
        />
      );
    case "services":
    default:
      return (
        <ServiceListEditor
          businessId={businessId}
          section="OFFERING"
          addLabel={m.addLabel}
          emptyHint={`No ${m.ownerLabel.toLowerCase()} added yet.`}
        />
      );
  }
}
