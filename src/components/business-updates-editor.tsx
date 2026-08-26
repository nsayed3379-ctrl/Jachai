"use client";

import { useCallback, useEffect, useState } from "react";
import { updatesApi } from "@/lib/api";
import type { BusinessUpdate } from "@/lib/types";
import { errorMessage, useToast } from "@/lib/toast-context";
import { formatDateTime } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";
import { Badge, PageSpinner } from "./ui/misc";
import { ModulePhotoInput } from "./category-modules/module-photo-input";

interface Draft {
  body: string;
  imageUrl: string | null;
  published: boolean;
}
const emptyDraft = (): Draft => ({ body: "", imageUrl: null, published: true });

/** Owner-side updates management: create / edit / delete / publish-toggle. */
export function BusinessUpdatesEditor({ businessId }: { businessId: string }) {
  const { show } = useToast();
  const [items, setItems] = useState<BusinessUpdate[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const load = useCallback(
    (p = 0, append = false) => {
      setLoading(!append);
      updatesApi
        .manageList(businessId, p)
        .then((res) => {
          setItems((prev) => (append ? [...prev, ...res.content] : res.content));
          setPage(res.page);
          setTotalPages(res.totalPages);
        })
        .catch((e) => show(errorMessage(e), "error"))
        .finally(() => setLoading(false));
    },
    [businessId, show]
  );
  useEffect(() => load(0), [load]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  function startAdd() {
    setDraft(emptyDraft());
    setEditingId(null);
    setAdding(true);
  }
  function startEdit(u: BusinessUpdate) {
    setDraft({ body: u.body, imageUrl: u.imageUrl, published: u.published });
    setAdding(false);
    setEditingId(u.id);
  }
  function cancel() {
    setAdding(false);
    setEditingId(null);
  }

  async function save() {
    if (!draft.body.trim()) {
      show("Write something first.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { body: draft.body, imageUrl: draft.imageUrl, published: draft.published };
      if (editingId) await updatesApi.update(businessId, editingId, body);
      else await updatesApi.create(businessId, body);
      cancel();
      load(0);
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(u: BusinessUpdate) {
    setBusyId(u.id);
    try {
      await updatesApi.setPublished(businessId, u.id, !u.published);
      load(0);
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: BusinessUpdate) {
    if (!confirm("Delete this update? This cannot be undone.")) return;
    setBusyId(u.id);
    try {
      await updatesApi.remove(businessId, u.id);
      load(0);
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  const form = (
    <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-sand-50/40 p-3">
      <Textarea
        value={draft.body}
        onChange={(e) => patch({ body: e.target.value })}
        rows={3}
        placeholder="e.g. We're now open until 11 PM every day."
      />
      <ModulePhotoInput
        businessId={businessId}
        value={draft.imageUrl}
        onChange={(url) => patch({ imageUrl: url })}
        label="Image (optional)"
      />
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(e) => patch({ published: e.target.checked })}
          className="h-4 w-4 rounded border-ink-300 text-crimson-600"
        />
        Published (visible on your public page)
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={saving}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && <p className="text-sm text-ink-400">No updates yet.</p>}

      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id} className="rounded-xl border border-ink-200/70 bg-white p-3">
            {editingId === u.id ? (
              form
            ) : (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={u.published ? "brand" : "neutral"}>{u.published ? "Published" : "Draft"}</Badge>
                    <span className="text-xs text-ink-400">
                      {formatDateTime(u.publishedAt ?? u.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{u.body}</p>
                  {u.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.imageUrl} alt="" className="mt-2 max-h-40 rounded-lg border border-ink-100 object-cover" />
                  )}
                </div>
                <div className="flex flex-none flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(u)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(u)} loading={busyId === u.id}>
                    {u.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(u)} loading={busyId === u.id}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? form : (
        <Button size="sm" variant="outline" onClick={startAdd}>
          + Create update
        </Button>
      )}

      {page + 1 < totalPages && (
        <Button size="sm" variant="ghost" onClick={() => load(page + 1, true)}>
          Load older
        </Button>
      )}
    </div>
  );
}
