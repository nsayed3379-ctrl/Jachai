"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, useToast } from "@/lib/toast-context";
import { Button } from "../ui/button";
import { PageSpinner } from "../ui/misc";

/**
 * Shared skeleton for every category module editor (services, team, menu,
 * products): loads the list, renders each row with ▲/▼ reorder + edit/delete,
 * and an add form. Each concrete editor supplies its own fields and API calls.
 * Mirrors the gallery manager's interaction model — no drag-and-drop dep.
 */
export interface ModuleApi<T> {
  list: () => Promise<T[]>;
  create: (body: unknown) => Promise<T>;
  update: (id: string, body: unknown) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<T[]>;
}

export function ModuleListShell<T extends { id: string }, D>({
  api,
  addLabel,
  emptyHint,
  newDraft,
  fromItem,
  toBody,
  renderForm,
  renderRow,
}: {
  api: ModuleApi<T>;
  addLabel: string;
  emptyHint: string;
  newDraft: () => D;
  fromItem: (item: T) => D;
  toBody: (draft: D) => unknown;
  renderForm: (draft: D, patch: (p: Partial<D>) => void) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
}) {
  const { show } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<D>(newDraft);
  const apiRef = useRef(api);
  apiRef.current = api;

  const load = useCallback(() => {
    setLoading(true);
    apiRef.current
      .list()
      .then(setItems)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [show]);
  useEffect(load, [load]);

  const patch = (p: Partial<D>) => setDraft((d) => ({ ...d, ...p }));

  function startAdd() {
    setDraft(newDraft());
    setEditingId(null);
    setAdding(true);
  }
  function startEdit(item: T) {
    setDraft(fromItem(item));
    setAdding(false);
    setEditingId(item.id);
  }
  function cancel() {
    setAdding(false);
    setEditingId(null);
  }

  async function save() {
    setSaving(true);
    try {
      if (editingId) await apiRef.current.update(editingId, toBody(draft));
      else await apiRef.current.create(toBody(draft));
      cancel();
      load();
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setBusy(true);
    try {
      await apiRef.current.remove(id);
      load();
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length || busy) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    const prev = items;
    setItems(next);
    setBusy(true);
    try {
      setItems(await apiRef.current.reorder(next.map((x) => x.id)));
    } catch (e) {
      setItems(prev);
      show(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageSpinner />;

  const formButtons = (
    <div className="flex gap-2">
      <Button size="sm" onClick={save} loading={saving}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={cancel}>
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && <p className="text-sm text-ink-400">{emptyHint}</p>}

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.id} className="rounded-xl border border-ink-200/70 bg-white p-3">
            {editingId === item.id ? (
              <div className="space-y-3">
                {renderForm(draft, patch)}
                {formButtons}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-0.5 text-xs leading-none">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || busy}
                    aria-label="Move up"
                    className="p-0.5 text-ink-400 hover:text-ink-700 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || busy}
                    aria-label="Move down"
                    className="p-0.5 text-ink-400 hover:text-ink-700 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">{renderRow(item)}</div>
                <div className="flex flex-none gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => removeItem(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-sand-50/40 p-3">
          {renderForm(draft, patch)}
          {formButtons}
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={startAdd}>
          + {addLabel}
        </Button>
      )}
    </div>
  );
}
