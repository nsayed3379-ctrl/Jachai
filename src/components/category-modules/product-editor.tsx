"use client";

import { catalogApi } from "@/lib/api";
import type { FeaturedProduct, FeaturedProductBody } from "@/lib/types";
import { Input, Label, Textarea } from "../ui/field";
import { ModuleListShell, type ModuleApi } from "./module-list-shell";
import { ModulePhotoInput } from "./module-photo-input";

interface Draft {
  name: string;
  description: string;
  priceText: string;
  photoUrl: string | null;
}

/** RETAIL "Featured products" showcase — no checkout, no inventory. */
export function ProductEditor({ businessId, addLabel }: { businessId: string; addLabel: string }) {
  const api: ModuleApi<FeaturedProduct> = {
    list: () => catalogApi.products(businessId),
    create: (b) => catalogApi.addProduct(businessId, b as FeaturedProductBody),
    update: (id, b) => catalogApi.updateProduct(businessId, id, b as FeaturedProductBody),
    remove: (id) => catalogApi.removeProduct(businessId, id),
    reorder: (ids) => catalogApi.reorderProducts(businessId, ids),
  };

  return (
    <ModuleListShell<FeaturedProduct, Draft>
      api={api}
      addLabel={addLabel}
      emptyHint="No featured products yet."
      newDraft={() => ({ name: "", description: "", priceText: "", photoUrl: null })}
      fromItem={(p) => ({
        name: p.name,
        description: p.description ?? "",
        priceText: p.priceText ?? "",
        photoUrl: p.photoUrl,
      })}
      toBody={(d) => ({
        name: d.name,
        description: d.description || null,
        priceText: d.priceText || null,
        photoUrl: d.photoUrl || null,
      })}
      renderRow={(p) => (
        <div className="flex items-start gap-3">
          {p.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt="" className="h-12 w-12 flex-none rounded-lg border border-ink-200 object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">{p.name}</p>
            {p.description && <p className="mt-0.5 text-xs text-ink-500">{p.description}</p>}
            {p.priceText && <p className="mt-0.5 text-xs font-medium text-crimson-700">{p.priceText}</p>}
          </div>
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div>
            <Label>Product name</Label>
            <Input value={d.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Wireless Earbuds" />
          </div>
          <div>
            <Label>
              Short description <span className="text-ink-300">(optional)</span>
            </Label>
            <Textarea value={d.description} onChange={(e) => patch({ description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>
              Price <span className="text-ink-300">(optional)</span>
            </Label>
            <Input value={d.priceText} onChange={(e) => patch({ priceText: e.target.value })} placeholder="e.g. ৳1,500" />
          </div>
          <ModulePhotoInput
            businessId={businessId}
            value={d.photoUrl}
            onChange={(url) => patch({ photoUrl: url })}
            label="Photo (optional)"
          />
        </div>
      )}
    />
  );
}
