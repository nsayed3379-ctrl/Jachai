"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@/lib/api";
import { useOwnerBusiness } from "@/lib/owner-business-context";
import { canBook, canSellDirect, formatTk } from "@/lib/commerce";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { CommerceSettings, DeliveryZone, DeliveryZoneBody } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

const MAX_ZONES = 10;

/** Dispatches to the settings panel for whichever commerce mode this category supports. */
export default function OwnerCommercePage() {
  const { business } = useOwnerBusiness();

  if (canSellDirect(business.categoryKind)) return <OrderSettingsPanel />;
  if (canBook(business.categoryKind)) return <BookingSettingsPanel />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-6 text-center">
      <p className="text-sm text-ink-500">Online ordering / booking isn&apos;t available for this business type yet.</p>
      <Link href={`/owner/${business.id}`} className="mt-2 inline-block text-sm font-medium text-crimson-700 hover:underline">
        ← Back to Overview
      </Link>
    </div>
  );
}

// ============================================================================
// Direct ordering (Phase A — Restaurant & Food)
// ============================================================================
function OrderSettingsPanel() {
  const { business } = useOwnerBusiness();
  const { show } = useToast();

  const [settings, setSettings] = useState<CommerceSettings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // draft copy of settings for the form
  const [ordering, setOrdering] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [cod, setCod] = useState(true);
  const [payAt, setPayAt] = useState(true);
  const [prep, setPrep] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // pause control
  const [pauseReason, setPauseReason] = useState("");
  const [pausing, setPausing] = useState(false);

  const load = useCallback(() => {
    commerceApi
      .ownerSettings(business.id)
      .then((s) => {
        setSettings(s);
        setOrdering(s.mode === "DIRECT_ORDER" && s.orderingEnabled);
        setPickup(s.pickupEnabled);
        setDelivery(s.ownDeliveryEnabled);
        setCod(s.paymentCashOnDelivery);
        setPayAt(s.paymentPayAtBusiness);
        setPrep(s.defaultPrepMinutes != null ? String(s.defaultPrepMinutes) : "");
      })
      .catch((e) => setError(errorMessage(e)));
    commerceApi
      .zones(business.id)
      .then(setZones)
      .catch(() => setZones([]));
  }, [business.id]);

  useEffect(load, [load]);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const updated = await commerceApi.updateSettings(business.id, {
        mode: ordering ? "DIRECT_ORDER" : "SHOWCASE_ONLY",
        orderingEnabled: ordering,
        pickupEnabled: pickup,
        ownDeliveryEnabled: delivery,
        paymentCashOnDelivery: cod,
        paymentPayAtBusiness: payAt,
        defaultPrepMinutes: prep.trim() === "" ? null : Number(prep),
      });
      setSettings(updated);
      show("Order settings saved", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleAccepting(next: boolean) {
    setPausing(true);
    try {
      const updated = await commerceApi.setAccepting(business.id, next, next ? undefined : pauseReason);
      setSettings(updated);
      if (next) setPauseReason("");
      show(next ? "Accepting orders again" : "Orders paused", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setPausing(false);
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!settings || !zones) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Order settings</h2>

      {/* Accepting / paused */}
      {settings.mode === "DIRECT_ORDER" && settings.orderingEnabled && (
        <section className="rounded-2xl border border-ink-100 bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {settings.acceptingOrders ? "🟢 Accepting orders" : "🔴 Not accepting new orders"}
              </p>
              {!settings.acceptingOrders && settings.pauseReason && (
                <p className="mt-0.5 text-xs text-ink-500">{settings.pauseReason}</p>
              )}
            </div>
            <Button
              size="sm"
              variant={settings.acceptingOrders ? "outline" : undefined}
              loading={pausing}
              onClick={() => toggleAccepting(!settings.acceptingOrders)}
            >
              {settings.acceptingOrders ? "Pause orders" : "Resume orders"}
            </Button>
          </div>
          {settings.acceptingOrders && (
            <div className="mt-3">
              <Label htmlFor="pausereason">
                Pause reason <span className="text-ink-300">(optional, shown to customers)</span>
              </Label>
              <Input
                id="pausereason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Too busy right now"
              />
            </div>
          )}
        </section>
      )}

      {/* Commerce config */}
      <section className="space-y-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={ordering}
            onChange={(e) => setOrdering(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-crimson-600"
          />
          <span>
            <span className="font-medium">Accept direct orders</span>
            <span className="block text-xs text-ink-400">
              Customers add menu items to a cart and check out. You fulfil each order yourself.
            </span>
          </span>
        </label>

        {ordering && (
          <>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Fulfilment</p>
              <div className="space-y-1.5">
                <Check label="Customer pickup" checked={pickup} onChange={setPickup} />
                <Check label="Own delivery" checked={delivery} onChange={setDelivery} />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Payment</p>
              <div className="space-y-1.5">
                <Check label="Cash on delivery" checked={cod} onChange={setCod} />
                <Check label="Pay at the business" checked={payAt} onChange={setPayAt} />
              </div>
            </div>
            <div className="max-w-[12rem]">
              <Label htmlFor="prep">
                Typical prep time <span className="text-ink-300">(minutes, optional)</span>
              </Label>
              <Input
                id="prep"
                type="number"
                min="0"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
          </>
        )}

        <Button onClick={saveSettings} loading={savingSettings}>
          Save settings
        </Button>
      </section>

      {/* Delivery zones */}
      {ordering && delivery && (
        <DeliveryZonesEditor
          businessId={business.id}
          zones={zones}
          onChange={setZones}
          onError={(m) => show(m, "error")}
        />
      )}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-300 text-crimson-600"
      />
      {label}
    </label>
  );
}

// ============================================================================
// Appointment booking (Phase C — Salon & Beauty)
// ============================================================================
function BookingSettingsPanel() {
  const { business } = useOwnerBusiness();
  const { show } = useToast();

  const [settings, setSettings] = useState<CommerceSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [pausing, setPausing] = useState(false);

  const load = useCallback(() => {
    commerceApi
      .ownerSettings(business.id)
      .then((s) => {
        setSettings(s);
        setBookingEnabled(s.mode === "BOOKING" && s.bookingEnabled);
        setAutoConfirm(s.autoConfirmBookings);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [business.id]);

  useEffect(load, [load]);

  async function save() {
    setSaving(true);
    try {
      const updated = await commerceApi.setBooking(business.id, bookingEnabled, autoConfirm);
      setSettings(updated);
      show("Booking settings saved", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccepting(next: boolean) {
    setPausing(true);
    try {
      const updated = await commerceApi.setAccepting(business.id, next, next ? undefined : pauseReason);
      setSettings(updated);
      if (next) setPauseReason("");
      show(next ? "Accepting bookings again" : "Bookings paused", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setPausing(false);
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!settings) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Booking settings</h2>

      {settings.mode === "BOOKING" && settings.bookingEnabled && (
        <section className="rounded-2xl border border-ink-100 bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {settings.acceptingOrders ? "🟢 Accepting bookings" : "🔴 Not accepting new bookings"}
              </p>
              {!settings.acceptingOrders && settings.pauseReason && (
                <p className="mt-0.5 text-xs text-ink-500">{settings.pauseReason}</p>
              )}
            </div>
            <Button
              size="sm"
              variant={settings.acceptingOrders ? "outline" : undefined}
              loading={pausing}
              onClick={() => toggleAccepting(!settings.acceptingOrders)}
            >
              {settings.acceptingOrders ? "Pause bookings" : "Resume bookings"}
            </Button>
          </div>
          {settings.acceptingOrders && (
            <div className="mt-3">
              <Label htmlFor="bpausereason">
                Pause reason <span className="text-ink-300">(optional, shown to customers)</span>
              </Label>
              <Input
                id="bpausereason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Fully booked this week"
              />
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-ink-100 bg-surface p-4">
        <label className="flex items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={bookingEnabled}
            onChange={(e) => setBookingEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-crimson-600"
          />
          <span>
            <span className="font-medium">Accept appointment bookings</span>
            <span className="block text-xs text-ink-400">
              Customers pick a service, staff member and a real available time slot from your working hours.
            </span>
          </span>
        </label>

        {bookingEnabled && (
          <label className="flex items-start gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-crimson-600"
            />
            <span>
              <span className="font-medium">Auto-confirm bookings</span>
              <span className="block text-xs text-ink-400">
                New bookings are confirmed immediately. Leave this off to review and confirm or reject each request yourself.
              </span>
            </span>
          </label>
        )}

        <Button onClick={save} loading={saving}>
          Save settings
        </Button>
      </section>

      <p className="text-xs text-ink-400">
        Add services under{" "}
        <Link href={`/owner/${business.id}/sections/services`} className="font-medium text-crimson-700 hover:underline">
          Services
        </Link>{" "}
        and set up staff working hours under{" "}
        <Link href={`/owner/${business.id}/staff-schedule`} className="font-medium text-crimson-700 hover:underline">
          Staff schedules
        </Link>
        .
      </p>
    </div>
  );
}

// ---- delivery zones (ordering only) ---------------------------------------

const emptyZone = (): ZoneDraft => ({
  name: "",
  minDistanceKm: "0",
  maxDistanceKm: "",
  deliveryFee: "",
  minimumOrderAmount: "",
  estimatedDeliveryMinutes: "",
  active: true,
});

interface ZoneDraft {
  name: string;
  minDistanceKm: string;
  maxDistanceKm: string;
  deliveryFee: string;
  minimumOrderAmount: string;
  estimatedDeliveryMinutes: string;
  active: boolean;
}

function toBody(d: ZoneDraft): DeliveryZoneBody {
  return {
    name: d.name.trim(),
    minDistanceKm: Number(d.minDistanceKm || 0),
    maxDistanceKm: Number(d.maxDistanceKm || 0),
    deliveryFee: Number(d.deliveryFee || 0),
    minimumOrderAmount: d.minimumOrderAmount.trim() === "" ? 0 : Number(d.minimumOrderAmount),
    estimatedDeliveryMinutes: d.estimatedDeliveryMinutes.trim() === "" ? null : Number(d.estimatedDeliveryMinutes),
    active: d.active,
  };
}

function DeliveryZonesEditor({
  businessId,
  zones,
  onChange,
  onError,
}: {
  businessId: string;
  zones: DeliveryZone[];
  onChange: (z: DeliveryZone[]) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<ZoneDraft>(emptyZone);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<ZoneDraft>) => setDraft((d) => ({ ...d, ...p }));

  function startAdd() {
    setDraft(emptyZone());
    setEditingId(null);
    setOpen(true);
  }
  function startEdit(z: DeliveryZone) {
    setDraft({
      name: z.name,
      minDistanceKm: String(z.minDistanceKm),
      maxDistanceKm: String(z.maxDistanceKm),
      deliveryFee: String(z.deliveryFee),
      minimumOrderAmount: String(z.minimumOrderAmount),
      estimatedDeliveryMinutes: z.estimatedDeliveryMinutes != null ? String(z.estimatedDeliveryMinutes) : "",
      active: z.active,
    });
    setEditingId(z.id);
    setOpen(true);
  }

  async function save() {
    if (!draft.name.trim() || !draft.maxDistanceKm || draft.deliveryFee === "") return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await commerceApi.updateZone(businessId, editingId, toBody(draft));
        onChange(zones.map((z) => (z.id === editingId ? updated : z)));
      } else {
        const created = await commerceApi.addZone(businessId, toBody(draft));
        onChange([...zones, created]);
      }
      setOpen(false);
      setEditingId(null);
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this delivery zone?")) return;
    try {
      await commerceApi.removeZone(businessId, id);
      onChange(zones.filter((z) => z.id !== id));
    } catch (e) {
      onError(errorMessage(e));
    }
  }

  const form = (
    <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-sand-50/40 p-3">
      <div>
        <Label>Zone name</Label>
        <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Zone 1" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>From (km)</Label>
          <Input type="number" min="0" step="0.5" value={draft.minDistanceKm} onChange={(e) => patch({ minDistanceKm: e.target.value })} />
        </div>
        <div>
          <Label>To (km)</Label>
          <Input type="number" min="0" step="0.5" value={draft.maxDistanceKm} onChange={(e) => patch({ maxDistanceKm: e.target.value })} placeholder="e.g. 2" />
        </div>
        <div>
          <Label>Delivery fee (৳)</Label>
          <Input type="number" min="0" value={draft.deliveryFee} onChange={(e) => patch({ deliveryFee: e.target.value })} placeholder="e.g. 30" />
        </div>
        <div>
          <Label>Minimum order (৳)</Label>
          <Input type="number" min="0" value={draft.minimumOrderAmount} onChange={(e) => patch({ minimumOrderAmount: e.target.value })} placeholder="e.g. 150" />
        </div>
        <div>
          <Label>Est. delivery (min)</Label>
          <Input type="number" min="0" value={draft.estimatedDeliveryMinutes} onChange={(e) => patch({ estimatedDeliveryMinutes: e.target.value })} placeholder="e.g. 30" />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-700">
          <input type="checkbox" checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-crimson-600" />
          Active
        </label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={saving} disabled={!draft.name.trim() || !draft.maxDistanceKm || draft.deliveryFee === ""}>
          {editingId ? "Save zone" : "Add zone"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setEditingId(null); }}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <section className="space-y-3 rounded-2xl border border-ink-100 bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Delivery zones</h3>
        <span className="text-xs text-ink-400">Distance from your business location</span>
      </div>

      {zones.length === 0 && !open && (
        <p className="text-sm text-ink-400">
          No zones yet — add one so delivery orders can be priced. Without a zone, only pickup works.
        </p>
      )}

      <ul className="space-y-2">
        {zones.map((z) =>
          open && editingId === z.id ? (
            <li key={z.id}>{form}</li>
          ) : (
            <li key={z.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink-200/70 bg-white p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">
                  {z.name}
                  {!z.active && <span className="ml-1.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">Inactive</span>}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {z.minDistanceKm}–{z.maxDistanceKm} km · {formatTk(z.deliveryFee)} fee
                  {z.minimumOrderAmount > 0 ? ` · min ${formatTk(z.minimumOrderAmount)}` : ""}
                  {z.estimatedDeliveryMinutes ? ` · ~${z.estimatedDeliveryMinutes} min` : ""}
                </p>
              </div>
              <div className="flex flex-none gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(z)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(z.id)}>Delete</Button>
              </div>
            </li>
          )
        )}
      </ul>

      {open && editingId === null ? (
        form
      ) : (
        !open &&
        zones.length < MAX_ZONES && (
          <Button size="sm" variant="outline" onClick={startAdd}>
            + Add delivery zone
          </Button>
        )
      )}
    </section>
  );
}
