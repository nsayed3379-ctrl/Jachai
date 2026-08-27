"use client";

import { useState } from "react";
import type { CategoryKind } from "@/lib/types";
import { modulesForKind, type ModuleDef, type ModuleKey } from "@/lib/category-modules";
import { Button } from "../ui/button";
import { Input, Label, Textarea } from "../ui/field";

/**
 * Create-flow counterpart to <CategoryModulesManager />. During "List your
 * business" there is no business id yet, so category-detail rows are buffered
 * in local state here; the parent form flushes them to the catalog API right
 * after businessApi.create() (see business-form.tsx). Per-row photos are left
 * out on purpose — the upload URL is business-scoped, so photos are added
 * afterwards from the dashboard.
 */

export interface CatalogDraftRow {
  name: string;
  description: string;
  priceText: string;
  role: string; // team
  bio: string; // team
  menuSection: string; // menu
  popular: boolean; // menu
}

export interface CatalogDraft {
  services: CatalogDraftRow[];
  facilities: CatalogDraftRow[];
  team: CatalogDraftRow[];
  menu: CatalogDraftRow[];
  products: CatalogDraftRow[];
}

export const emptyCatalogDraft: CatalogDraft = {
  services: [],
  facilities: [],
  team: [],
  menu: [],
  products: [],
};

export function catalogDraftCount(d: CatalogDraft): number {
  return d.services.length + d.facilities.length + d.team.length + d.menu.length + d.products.length;
}

const emptyRow = (): CatalogDraftRow => ({
  name: "",
  description: "",
  priceText: "",
  role: "",
  bio: "",
  menuSection: "",
  popular: false,
});

function bucketFor(key: ModuleKey): keyof CatalogDraft {
  switch (key) {
    case "facilities":
      return "facilities";
    case "team":
      return "team";
    case "menu":
      return "menu";
    case "products":
      return "products";
    default:
      return "services";
  }
}

interface FieldSpec {
  namePlaceholder: string;
  showMenuSection: boolean;
  showRole: boolean;
  roleLabel: string;
  showBio: boolean;
  showDescription: boolean;
  showPrice: boolean;
  pricePlaceholder: string;
  showPopular: boolean;
}

function specFor(key: ModuleKey, kind: CategoryKind): FieldSpec {
  const base: FieldSpec = {
    namePlaceholder: "Name",
    showMenuSection: false,
    showRole: false,
    roleLabel: "Role",
    showBio: false,
    showDescription: false,
    showPrice: false,
    pricePlaceholder: "e.g. ৳500",
    showPopular: false,
  };
  switch (key) {
    case "menu":
      return {
        ...base,
        namePlaceholder: "e.g. Chicken Biryani",
        showMenuSection: true,
        showDescription: true,
        showPrice: true,
        pricePlaceholder: "e.g. ৳450",
        showPopular: true,
      };
    case "products":
      return {
        ...base,
        namePlaceholder: "e.g. Wireless Earbuds",
        showDescription: true,
        showPrice: true,
        pricePlaceholder: "e.g. ৳1,500",
      };
    case "team":
      return {
        ...base,
        namePlaceholder: "e.g. Dr. Ayesha Rahman",
        showRole: true,
        roleLabel: kind === "CLINIC" ? "Specialty" : kind === "GYM" ? "Focus / role" : "Role",
        showBio: true,
      };
    case "facilities":
      return { ...base, namePlaceholder: "e.g. Sauna", showDescription: true };
    case "services":
    default:
      return {
        ...base,
        namePlaceholder: "e.g. Haircut",
        showDescription: true,
        showPrice: true,
        pricePlaceholder: "e.g. Starting from ৳500",
      };
  }
}

function rowSummary(r: CatalogDraftRow, spec: FieldSpec): string {
  const bits: string[] = [];
  if (spec.showRole && r.role) bits.push(r.role);
  if (spec.showMenuSection && r.menuSection) bits.push(r.menuSection);
  if (spec.showPrice && r.priceText) bits.push(r.priceText);
  if (spec.showBio && r.bio) bits.push(r.bio);
  else if (spec.showDescription && r.description) bits.push(r.description);
  return bits.join(" · ");
}

function DraftModuleEditor({
  spec,
  rows,
  onRows,
  addLabel,
  emptyHint,
}: {
  spec: FieldSpec;
  rows: CatalogDraftRow[];
  onRows: (rows: CatalogDraftRow[]) => void;
  addLabel: string;
  emptyHint: string;
}) {
  const [draft, setDraft] = useState<CatalogDraftRow>(emptyRow);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const patch = (p: Partial<CatalogDraftRow>) => setDraft((d) => ({ ...d, ...p }));

  function startAdd() {
    setDraft(emptyRow());
    setEditingIndex(null);
    setOpen(true);
  }
  function startEdit(i: number) {
    setDraft({ ...rows[i] });
    setEditingIndex(i);
    setOpen(true);
  }
  function cancel() {
    setOpen(false);
    setEditingIndex(null);
  }
  function save() {
    if (!draft.name.trim()) return;
    if (editingIndex === null) onRows([...rows, draft]);
    else onRows(rows.map((r, i) => (i === editingIndex ? draft : r)));
    cancel();
  }
  function remove(i: number) {
    onRows(rows.filter((_, idx) => idx !== i));
    if (editingIndex === i) cancel();
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onRows(next);
  }

  const form = (
    <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-sand-50/40 p-3">
      <div>
        <Label>Name</Label>
        <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder={spec.namePlaceholder} />
      </div>

      {spec.showMenuSection && (
        <div>
          <Label>
            Menu section <span className="text-ink-300">(optional)</span>
          </Label>
          <Input
            value={draft.menuSection}
            onChange={(e) => patch({ menuSection: e.target.value })}
            placeholder="e.g. Mains, Drinks"
          />
        </div>
      )}

      {spec.showRole && (
        <div>
          <Label>
            {spec.roleLabel} <span className="text-ink-300">(optional)</span>
          </Label>
          <Input value={draft.role} onChange={(e) => patch({ role: e.target.value })} placeholder="e.g. Cardiologist" />
        </div>
      )}

      {spec.showBio && (
        <div>
          <Label>
            Short bio <span className="text-ink-300">(optional)</span>
          </Label>
          <Textarea value={draft.bio} onChange={(e) => patch({ bio: e.target.value })} rows={2} />
        </div>
      )}

      {spec.showDescription && (
        <div>
          <Label>
            Description <span className="text-ink-300">(optional)</span>
          </Label>
          <Textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })} rows={2} />
        </div>
      )}

      {spec.showPrice && (
        <div>
          <Label>
            Price <span className="text-ink-300">(optional)</span>
          </Label>
          <Input
            value={draft.priceText}
            onChange={(e) => patch({ priceText: e.target.value })}
            placeholder={spec.pricePlaceholder}
          />
        </div>
      )}

      {spec.showPopular && (
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={draft.popular}
            onChange={(e) => patch({ popular: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300 text-crimson-600"
          />
          Show in &ldquo;Popular items&rdquo;
        </label>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={!draft.name.trim()}>
          {editingIndex === null ? "Add" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && !open && <p className="text-sm text-ink-400">{emptyHint}</p>}

      <ul className="space-y-2">
        {rows.map((r, i) =>
          open && editingIndex === i ? (
            <li key={i}>{form}</li>
          ) : (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-ink-200/70 bg-white p-3">
              <div className="flex flex-col items-center pt-0.5 text-xs leading-none">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-0.5 text-ink-400 hover:text-ink-700 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label="Move down"
                  className="p-0.5 text-ink-400 hover:text-ink-700 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">
                  {r.name}
                  {spec.showPopular && r.popular && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      ★ Popular
                    </span>
                  )}
                </p>
                {rowSummary(r, spec) && <p className="mt-0.5 text-xs text-ink-500">{rowSummary(r, spec)}</p>}
              </div>
              <div className="flex flex-none gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(i)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(i)}>
                  Delete
                </Button>
              </div>
            </li>
          )
        )}
      </ul>

      {open && editingIndex === null ? (
        form
      ) : (
        !open && (
          <Button size="sm" variant="outline" onClick={startAdd}>
            + {addLabel}
          </Button>
        )
      )}
    </div>
  );
}

export function CategoryModulesDraft({
  kind,
  value,
  onChange,
}: {
  kind: CategoryKind;
  value: CatalogDraft;
  onChange: (next: CatalogDraft) => void;
}) {
  const modules = modulesForKind(kind);

  const setBucket = (bucket: keyof CatalogDraft, rows: CatalogDraftRow[]) =>
    onChange({ ...value, [bucket]: rows });

  return (
    <div className="space-y-8">
      {modules.map((m: ModuleDef) => {
        const bucket = bucketFor(m.key);
        return (
          <section key={m.key}>
            <h3 className="mb-2 text-sm font-semibold text-ink-900">{m.ownerLabel}</h3>
            <DraftModuleEditor
              spec={specFor(m.key, kind)}
              rows={value[bucket]}
              onRows={(rows) => setBucket(bucket, rows)}
              addLabel={m.addLabel}
              emptyHint={`No ${m.ownerLabel.toLowerCase()} added yet.`}
            />
          </section>
        );
      })}
    </div>
  );
}
