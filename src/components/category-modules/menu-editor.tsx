"use client";

import { catalogApi } from "@/lib/api";
import type { MenuItem, MenuItemBody } from "@/lib/types";
import { Input, Label, Textarea } from "../ui/field";
import { ModuleListShell, type ModuleApi } from "./module-list-shell";
import { ModulePhotoInput } from "./module-photo-input";

interface Draft {
  name: string;
  description: string;
  priceText: string;
  menuSection: string;
  popular: boolean;
  photoUrl: string | null;
}

/** RESTAURANT menu. Grouped in the public view by the free-text `menuSection` label. */
export function MenuEditor({ businessId, addLabel }: { businessId: string; addLabel: string }) {
  const api: ModuleApi<MenuItem> = {
    list: () => catalogApi.menuItems(businessId),
    create: (b) => catalogApi.addMenuItem(businessId, b as MenuItemBody),
    update: (id, b) => catalogApi.updateMenuItem(businessId, id, b as MenuItemBody),
    remove: (id) => catalogApi.removeMenuItem(businessId, id),
    reorder: (ids) => catalogApi.reorderMenuItems(businessId, ids),
  };

  return (
    <ModuleListShell<MenuItem, Draft>
      api={api}
      addLabel={addLabel}
      emptyHint="No menu items yet."
      newDraft={() => ({ name: "", description: "", priceText: "", menuSection: "", popular: false, photoUrl: null })}
      fromItem={(m) => ({
        name: m.name,
        description: m.description ?? "",
        priceText: m.priceText ?? "",
        menuSection: m.menuSection ?? "",
        popular: m.popular,
        photoUrl: m.photoUrl,
      })}
      toBody={(d) => ({
        name: d.name,
        description: d.description || null,
        priceText: d.priceText || null,
        menuSection: d.menuSection || null,
        popular: d.popular,
        photoUrl: d.photoUrl || null,
      })}
      renderRow={(m) => (
        <div className="flex items-start gap-3">
          {m.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photoUrl} alt="" className="h-12 w-12 flex-none rounded-lg border border-ink-200 object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">
              {m.name}
              {m.popular && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  ★ Popular
                </span>
              )}
            </p>
            {m.menuSection && <p className="text-[11px] uppercase tracking-wide text-ink-400">{m.menuSection}</p>}
            {m.description && <p className="mt-0.5 text-xs text-ink-500">{m.description}</p>}
            {m.priceText && <p className="mt-0.5 text-xs font-medium text-crimson-700">{m.priceText}</p>}
          </div>
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Item name</Label>
              <Input value={d.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Chicken Biryani" />
            </div>
            <div>
              <Label>
                Menu section <span className="text-ink-300">(optional)</span>
              </Label>
              <Input
                value={d.menuSection}
                onChange={(e) => patch({ menuSection: e.target.value })}
                placeholder="e.g. Mains, Drinks"
              />
            </div>
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
            <Input value={d.priceText} onChange={(e) => patch({ priceText: e.target.value })} placeholder="e.g. ৳450" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={d.popular}
              onChange={(e) => patch({ popular: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-crimson-600"
            />
            Show in &ldquo;Popular items&rdquo;
          </label>
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
