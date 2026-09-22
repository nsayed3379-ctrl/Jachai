"use client";

import { useState } from "react";
import { businessApi } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { HoursExceptionEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/field";

interface Draft {
  startDate: string;
  endDate: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  reason: string;
}

const emptyDraft = (): Draft => ({
  startDate: "",
  endDate: "",
  closed: true,
  openTime: "10:00",
  closeTime: "18:00",
  reason: "",
});

function toBody(d: Draft): Omit<HoursExceptionEntry, "id"> {
  return {
    startDate: d.startDate,
    endDate: d.endDate || d.startDate,
    closed: d.closed,
    openTime: d.closed ? null : d.openTime,
    closeTime: d.closed ? null : d.closeTime,
    reason: d.reason.trim() || null,
  };
}

/**
 * Owner-side CRUD for holiday/exception hours (V41) — date-range closures or
 * modified hours that take precedence over the recurring weekly picker.
 * Immediate per-action save (not batched with the main form submit), same
 * "existing-only" pattern as BusinessGalleryManager/CategoryModulesManager —
 * exceptions only make sense on an already-created listing.
 */
export function HoursExceptionsManager({ businessId, initial }: { businessId: string; initial: HoursExceptionEntry[] }) {
  const { t } = useLanguage();
  const { show } = useToast();
  const [items, setItems] = useState<HoursExceptionEntry[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function startAdd() {
    setDraft(emptyDraft());
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(e: HoursExceptionEntry) {
    setDraft({
      startDate: e.startDate,
      endDate: e.endDate,
      closed: e.closed,
      openTime: e.openTime ?? "10:00",
      closeTime: e.closeTime ?? "18:00",
      reason: e.reason ?? "",
    });
    setAdding(false);
    setEditingId(e.id);
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
  }

  async function save() {
    if (!draft.startDate) {
      show(t("hours_exceptions.error.date_required"), "error");
      return;
    }
    if (!draft.closed && (!draft.openTime || !draft.closeTime || draft.openTime === draft.closeTime)) {
      show(t("hours_exceptions.error.time_required"), "error");
      return;
    }
    setSaving(true);
    try {
      const body = toBody(draft);
      if (editingId) {
        const updated = await businessApi.updateHoursException(businessId, editingId, body);
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await businessApi.addHoursException(businessId, body);
        setItems((prev) => [...prev, created].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      }
      cancel();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("hours_exceptions.confirm_delete"))) return;
    setBusyId(id);
    try {
      await businessApi.removeHoursException(businessId, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  }

  const form = (
    <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-sand-50/40 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("hours_exceptions.field.start_date")}</Label>
          <Input type="date" value={draft.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
        </div>
        <div>
          <Label>{t("hours_exceptions.field.end_date")}</Label>
          <Input
            type="date"
            value={draft.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            min={draft.startDate || undefined}
          />
        </div>
      </div>

      <div className="inline-flex rounded-full border border-ink-200 bg-ink-50 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => patch({ closed: true })}
          className={cn("rounded-full px-3 py-1.5 transition-colors", draft.closed ? "bg-ink-700 text-white shadow-sm" : "text-ink-400 hover:text-ink-600")}
        >
          {t("hours_exceptions.closed")}
        </button>
        <button
          type="button"
          onClick={() => patch({ closed: false })}
          className={cn("rounded-full px-3 py-1.5 transition-colors", !draft.closed ? "bg-crimson-600 text-white shadow-sm" : "text-ink-400 hover:text-ink-600")}
        >
          {t("hours_exceptions.special_hours")}
        </button>
      </div>

      {!draft.closed && (
        <div className="flex items-center gap-2">
          <Input type="time" value={draft.openTime} onChange={(e) => patch({ openTime: e.target.value })} className="w-32" />
          <span className="text-xs text-ink-400">–</span>
          <Input type="time" value={draft.closeTime} onChange={(e) => patch({ closeTime: e.target.value })} className="w-32" />
        </div>
      )}

      <div>
        <Label>{t("hours_exceptions.field.reason")}</Label>
        <Input
          value={draft.reason}
          onChange={(e) => patch({ reason: e.target.value })}
          placeholder={t("hours_exceptions.reason_placeholder")}
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={saving}>
          {t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && <p className="text-sm text-ink-400">{t("hours_exceptions.empty")}</p>}

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="rounded-xl border border-ink-200/70 bg-white p-3">
            {editingId === it.id ? (
              form
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800">
                    {it.startDate === it.endDate ? it.startDate : `${it.startDate} – ${it.endDate}`}
                  </p>
                  <p className="text-xs text-ink-500">
                    {it.closed ? t("hours_exceptions.closed") : `${it.openTime} – ${it.closeTime}`}
                    {it.reason && ` · ${it.reason}`}
                  </p>
                </div>
                <div className="flex flex-none gap-2 text-xs">
                  <button type="button" onClick={() => startEdit(it)} className="font-medium text-crimson-700 hover:underline">
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    disabled={busyId === it.id}
                    className="font-medium text-rose-600 hover:underline disabled:opacity-50"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        form
      ) : (
        <Button size="sm" variant="outline" onClick={startAdd}>
          + {t("hours_exceptions.add")}
        </Button>
      )}
    </div>
  );
}
