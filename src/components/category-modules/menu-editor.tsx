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
  price: string; // numeric order price — kept as a string in the form
  available: boolean;
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
      newDraft={() => ({
        name: "",
        description: "",
        priceText: "",
        price: "",
        available: true,
        menuSection: "",
        popular: false,
        photoUrl: null,
      })}
      fromItem={(m) => ({
        name: m.name,
        description: m.description ?? "",
        priceText: m.priceText ?? "",
        price: m.price != null ? String(m.price) : "",
        available: m.available,
        menuSection: m.menuSection ?? "",
        popular: m.popular,
        photoUrl: m.photoUrl,
      })}
      toBody={(d) => {
        const priceNum = d.price.trim() === "" ? null : Number(d.price);
        const price = priceNum != null && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;
        return {
          name: d.name,
          description: d.description || null,
          priceText: d.priceText || null,
          menuSection: d.menuSection || null,
          popular: d.popular,
          photoUrl: d.photoUrl || null,
          // A numeric price makes the item orderable; the backend derives the flag from this.
          price,
          available: d.available,
          orderingEnabled: price != null,
        };
      }}
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
              {m.available && m.price != null && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Orderable · ৳{m.price}
                </span>
              )}
              {!m.available && (
                <span className="ml-1.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">
                  Unavailable
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>
                Order price (৳) <span className="text-ink-300">— set this to let customers order it</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={d.price}
                onChange={(e) => patch({ price: e.target.value })}
                placeholder="e.g. 450"
              />
            </div>
            <div>
              <Label>
                Display price text <span className="text-ink-300">(optional, showcase only)</span>
              </Label>
              <Input
                value={d.priceText}
                onChange={(e) => patch({ priceText: e.target.value })}
                placeholder="e.g. Starts at ৳450"
              />
            </div>
          </div>
          <p className="text-xs text-ink-400">
            An item with an <span className="font-medium">order price</span> shows an “Add to cart” button on your public
            menu (when direct ordering is on). Leave it blank to keep the item showcase-only.
          </p>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={d.popular}
              onChange={(e) => patch({ popular: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-crimson-600"
            />
            Show in &ldquo;Popular items&rdquo;
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={d.available}
              onChange={(e) => patch({ available: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-crimson-600"
            />
            Available (uncheck to temporarily hide from ordering / show &ldquo;Currently unavailable&rdquo;)
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
