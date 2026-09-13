"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError, bookingApi, catalogApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { AvailabilityResponse, Booking, ServiceOffering, TeamMember } from "@/lib/types";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input, Label, Select, Textarea } from "./ui/field";
import { PageSpinner } from "./ui/misc";

const ANY_STAFF = "";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * "Book appointment" — Service (passed in) → Staff → Date → Available time →
 * Customer details → Confirm. Real slots come from the availability engine;
 * this view is advisory only — the backend re-checks at submit time and a
 * slot that was just taken comes back as a clear inline error, not a crash.
 */
export function BookingModal({
  open,
  onClose,
  businessId,
  businessName,
  service,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  service: ServiceOffering | null;
}) {
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();

  const [staff, setStaff] = useState<TeamMember[] | null>(null);
  const [staffId, setStaffId] = useState(ANY_STAFF);
  const [date, setDate] = useState(todayIso());
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<Booking | null>(null);

  useEffect(() => {
    if (!open || !service) return;
    setStaff(null);
    catalogApi
      .staffForService(businessId, service.id)
      .then(setStaff)
      .catch(() => setStaff([]));
  }, [open, businessId, service]);

  useEffect(() => {
    if (!open) return;
    setStaffId(ANY_STAFF);
    setDate(todayIso());
    setTime(null);
    setSlotError(null);
    setNote("");
    setBooked(null);
    setName(profile?.name ?? "");
    setPhone(profile?.phoneNumber ?? "");
  }, [open, profile]);

  useEffect(() => {
    if (!open || !service || !staff || staff.length === 0) return;
    setLoadingSlots(true);
    setTime(null);
    setSlotError(null);
    bookingApi
      .availability(businessId, service.id, staffId || null, date)
      .then(setAvailability)
      .catch(() => setAvailability(null))
      .finally(() => setLoadingSlots(false));
  }, [open, businessId, service, staff, staffId, date]);

  async function submit() {
    if (!service || !time || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setSlotError(null);
    try {
      const b = await bookingApi.place(businessId, {
        serviceId: service.id,
        staffId: staffId || null,
        preferredDate: date,
        preferredTime: time,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerNote: note.trim() || null,
      });
      setBooked(b);
      show(b.autoConfirmed ? "Appointment confirmed" : "Booking requested", "success");
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 409) {
        setSlotError(`⚠️ ${e.message}`);
        setTime(null);
        bookingApi
          .availability(businessId, service.id, staffId || null, date)
          .then(setAvailability)
          .catch(() => undefined);
      } else {
        show(errorMessage(e), "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!time && !!name.trim() && !!phone.trim();
  const noStaffAtAll = staff !== null && staff.length === 0;

  return (
    <Modal open={open} onClose={onClose} labelledBy="booking-modal-heading" panelClassName="max-w-md">
      <div className="p-6">
        {!user ? (
          <div className="text-center">
            <h2 id="booking-modal-heading" className="font-display text-lg font-bold text-ink-900">
              Log in to book
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Sign in to request an appointment with {businessName}.
            </p>
            <Button className="mt-4 w-full" onClick={openLogin}>
              Log in
            </Button>
          </div>
        ) : booked ? (
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mt-2 font-display text-lg font-bold text-ink-900">
              {booked.autoConfirmed ? "Appointment confirmed" : "Booking requested"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {booked.autoConfirmed
                ? `${booked.bookingNumber} is confirmed with ${businessName}.`
                : `${businessName} will confirm ${booked.bookingNumber} soon.`}{" "}
              You can track it from My bookings.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Link href={`/bookings/${booked.id}`} className="flex-1">
                <Button className="w-full">View booking</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 id="booking-modal-heading" className="font-display text-lg font-bold text-ink-900">
              Book {service?.name}
            </h2>
            <p className="mt-0.5 text-sm text-ink-400">
              {businessName}
              {service?.durationMinutes ? ` · Approximately ${service.durationMinutes} minutes` : ""}
            </p>

            {staff === null ? (
              <div className="mt-6">
                <PageSpinner />
              </div>
            ) : noStaffAtAll ? (
              <p className="mt-4 rounded-lg bg-sand-50 px-3 py-2.5 text-sm text-ink-600">
                No staff are currently available for this service.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="staff">Staff</Label>
                  <Select id="staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                    <option value={ANY_STAFF}>Any available staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.role ? ` — ${s.role}` : ""}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div>
                  <Label>Available time</Label>
                  {loadingSlots ? (
                    <PageSpinner />
                  ) : !availability || availability.slots.length === 0 ? (
                    <p className="rounded-lg bg-sand-50 px-3 py-2.5 text-sm text-ink-600">
                      No available times for this staff member on this date.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {availability.slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => {
                            setTime(slot.time);
                            setSlotError(null);
                          }}
                          className={
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors " +
                            (!slot.available
                              ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300"
                              : time === slot.time
                                ? "border-crimson-500 bg-crimson-50 text-crimson-700"
                                : "border-ink-200 text-ink-700 hover:border-crimson-300")
                          }
                        >
                          {formatSlotTime(slot.time)}
                          {!slot.available && <span className="ml-1 text-[10px]">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {slotError && <p className="mt-1.5 text-xs font-medium text-rose-600">{slotError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bname">Name</Label>
                    <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="bphone">Phone</Label>
                    <Input id="bphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bnote">
                    Note <span className="text-ink-300">(optional)</span>
                  </Label>
                  <Textarea
                    id="bnote"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything the business should know…"
                  />
                </div>

                <Button className="w-full" onClick={submit} loading={submitting} disabled={!canSubmit}>
                  {time ? `Book ${formatSlotTime(time)}` : "Select a time"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
