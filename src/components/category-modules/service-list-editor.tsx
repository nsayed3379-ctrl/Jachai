"use client";

import { catalogApi } from "@/lib/api";
import type { ServiceOffering, ServiceOfferingBody, ServiceSection } from "@/lib/types";
import { Input, Label, Textarea } from "../ui/field";
import { ModuleListShell, type ModuleApi } from "./module-list-shell";

interface Draft {
  name: string;
  description: string;
  priceText: string;
}

/**
 * Services (GENERAL / SALON / CLINIC), gym membership plans (section OFFERING),
 * and gym facilities (section FACILITY — pass withPrice={false}). Same
 * ServiceOffering backing table throughout.
 */
export function ServiceListEditor({
  businessId,
  section = "OFFERING",
  addLabel,
  emptyHint,
  withPrice = true,
}: {
  businessId: string;
  section?: ServiceSection;
  addLabel: string;
  emptyHint: string;
  withPrice?: boolean;
}) {
  const api: ModuleApi<ServiceOffering> = {
    list: () => catalogApi.services(businessId, section),
    create: (b) => catalogApi.addService(businessId, b as ServiceOfferingBody),
    update: (id, b) => catalogApi.updateService(businessId, id, b as ServiceOfferingBody),
    remove: (id) => catalogApi.removeService(businessId, id),
    reorder: (ids) => catalogApi.reorderServices(businessId, ids, section),
  };

  return (
    <ModuleListShell<ServiceOffering, Draft>
      api={api}
      addLabel={addLabel}
      emptyHint={emptyHint}
      newDraft={() => ({ name: "", description: "", priceText: "" })}
      fromItem={(s) => ({ name: s.name, description: s.description ?? "", priceText: s.priceText ?? "" })}
      toBody={(d) => ({
        name: d.name,
        description: d.description || null,
        priceText: withPrice ? d.priceText || null : null,
        section,
      })}
      renderRow={(s) => (
        <div>
          <p className="text-sm font-semibold text-ink-900">{s.name}</p>
          {s.description && <p className="mt-0.5 text-xs text-ink-500">{s.description}</p>}
          {s.priceText && <p className="mt-0.5 text-xs font-medium text-crimson-700">{s.priceText}</p>}
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input
              value={d.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={withPrice ? "e.g. Haircut" : "e.g. Sauna"}
            />
          </div>
          <div>
            <Label>
              Description <span className="text-ink-300">(optional)</span>
            </Label>
            <Textarea value={d.description} onChange={(e) => patch({ description: e.target.value })} rows={2} />
          </div>
          {withPrice && (
            <div>
              <Label>
                Price <span className="text-ink-300">(optional)</span>
              </Label>
              <Input
                value={d.priceText}
                onChange={(e) => patch({ priceText: e.target.value })}
                placeholder="e.g. Starting from ৳500"
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
