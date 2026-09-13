"use client";

import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { DayOfWeek, ServiceOffering, StaffServiceAssignment, TeamMember, TimeOff, WeeklyScheduleEntry } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/field";
import { PageSpinner } from "../ui/misc";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

interface ServiceDraft {
  selected: boolean;
  durationMinutes: string;
  bufferMinutes: string;
}

interface DayDraft {
  dayOfWeek: DayOfWeek;
  working: boolean;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

function toHHMM(t: string): string {
  return t.slice(0, 5);
}

function defaultDays(): DayDraft[] {
  return DAYS_OF_WEEK.map((d) => ({
    dayOfWeek: d,
    working: false,
    startTime: "09:00",
    endTime: "17:00",
    hasBreak: false,
    breakStart: "13:00",
    breakEnd: "14:00",
  }));
}

function daysFromSchedule(entries: WeeklyScheduleEntry[]): DayDraft[] {
  const byDay = new Map(entries.map((e) => [e.dayOfWeek, e]));
  return DAYS_OF_WEEK.map((d) => {
    const e = byDay.get(d);
    if (!e) {
      return { dayOfWeek: d, working: false, startTime: "09:00", endTime: "17:00", hasBreak: false, breakStart: "13:00", breakEnd: "14:00" };
    }
    return {
      dayOfWeek: d,
      working: true,
      startTime: toHHMM(e.startTime),
      endTime: toHHMM(e.endTime),
      hasBreak: !!e.breakStart,
      breakStart: e.breakStart ? toHHMM(e.breakStart) : "13:00",
      breakEnd: e.breakEnd ? toHHMM(e.breakEnd) : "14:00",
    };
  });
}

/**
 * Per-staff-member panel: which services they provide, their weekly working
 * hours + one optional daily break, and leave/time-off dates. Powers the
 * Stage 1 booking-availability engine — nothing here is displayed publicly.
 */
export function StaffScheduleEditor({
  businessId,
  staff,
  services,
}: {
  businessId: string;
  staff: TeamMember;
  services: ServiceOffering[];
}) {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serviceDrafts, setServiceDrafts] = useState<Map<string, ServiceDraft>>(new Map());
  const [days, setDays] = useState<DayDraft[]>(defaultDays());
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingTimeOff, setAddingTimeOff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .staffSchedule(businessId, staff.id)
      .then((res) => {
        if (cancelled) return;
        const drafts = new Map<string, ServiceDraft>(
          res.assignments.map((a) => [
            a.serviceId,
            {
              selected: true,
              durationMinutes: a.durationMinutes != null ? String(a.durationMinutes) : "",
              bufferMinutes: a.bufferMinutes != null ? String(a.bufferMinutes) : "",
            },
          ])
        );
        setServiceDrafts(drafts);
        setDays(daysFromSchedule(res.weeklySchedule));
        setTimeOff(res.timeOff);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, staff.id]);

  function toggleService(id: string) {
    setServiceDrafts((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing?.selected) {
        next.delete(id);
      } else {
        next.set(id, { selected: true, durationMinutes: "", bufferMinutes: "" });
      }
      return next;
    });
  }

  function patchServiceDraft(id: string, patch: Partial<ServiceDraft>) {
    setServiceDrafts((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) next.set(id, { ...existing, ...patch });
      return next;
    });
  }

  async function saveServices() {
    setSavingServices(true);
    try {
      const assignments: StaffServiceAssignment[] = [...serviceDrafts.entries()].map(([serviceId, d]) => ({
        serviceId,
        durationMinutes: d.durationMinutes.trim() ? Number(d.durationMinutes) : null,
        bufferMinutes: d.bufferMinutes.trim() ? Number(d.bufferMinutes) : null,
      }));
      await catalogApi.updateStaffServices(businessId, staff.id, assignments);
      show(`${staff.name}'s services saved`, "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSavingServices(false);
    }
  }

  function patchDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function saveSchedule() {
    setSavingSchedule(true);
    try {
      const body: WeeklyScheduleEntry[] = days
        .filter((d) => d.working)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakStart: d.hasBreak ? d.breakStart : null,
          breakEnd: d.hasBreak ? d.breakEnd : null,
        }));
      await catalogApi.updateStaffSchedule(businessId, staff.id, body);
      show(`${staff.name}'s working hours saved`, "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function addTimeOff() {
    if (!newStart || !newEnd) return;
    setAddingTimeOff(true);
    try {
      const row = await catalogApi.addStaffTimeOff(businessId, staff.id, {
        startDate: newStart,
        endDate: newEnd,
        reason: newReason.trim() || null,
      });
      setTimeOff((prev) => [...prev, row].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      setNewStart("");
      setNewEnd("");
      setNewReason("");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setAddingTimeOff(false);
    }
  }

  async function removeTimeOff(id: string) {
    try {
      await catalogApi.removeStaffTimeOff(businessId, staff.id, id);
      setTimeOff((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      show(errorMessage(e), "error");
    }
  }

  if (loading) return <PageSpinner />;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Services provided</p>
        {services.length === 0 ? (
          <p className="text-sm text-ink-400">Add services under Services first.</p>
        ) : (
          <div className="space-y-1.5">
            {services.map((s) => {
              const draft = serviceDrafts.get(s.id);
              const selected = !!draft?.selected;
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-100 bg-white p-2">
                  <button
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (selected
                        ? "border-crimson-500 bg-crimson-50 text-crimson-700"
                        : "border-ink-200 text-ink-600 hover:border-ink-300")
                    }
                  >
                    {s.name}
                  </button>
                  {selected && (
                    <>
                      <Input
                        type="number"
                        min={5}
                        max={600}
                        className="w-36"
                        placeholder={s.durationMinutes ? `Default: ${s.durationMinutes} min` : "Duration (min)"}
                        value={draft?.durationMinutes ?? ""}
                        onChange={(e) => patchServiceDraft(s.id, { durationMinutes: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={240}
                        className="w-36"
                        placeholder={s.bufferMinutes ? `Default: ${s.bufferMinutes} min` : "Buffer (min)"}
                        value={draft?.bufferMinutes ?? ""}
                        onChange={(e) => patchServiceDraft(s.id, { bufferMinutes: e.target.value })}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-1.5 text-[11px] text-ink-400">
          Leave duration/buffer blank to use the service&apos;s own default — only set these if this staff member is faster or slower.
        </p>
        <Button size="sm" className="mt-2" onClick={saveServices} loading={savingServices} disabled={services.length === 0}>
          Save services
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Weekly working hours</p>
        <div className="space-y-1.5">
          {days.map((d, i) => (
            <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-100 bg-white p-2">
              <label className="flex w-28 flex-none items-center gap-1.5 text-xs font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={d.working}
                  onChange={(e) => patchDay(i, { working: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300 text-crimson-600"
                />
                {DAY_LABELS[d.dayOfWeek]}
              </label>
              {d.working && (
                <>
                  <Input type="time" className="w-28" value={d.startTime} onChange={(e) => patchDay(i, { startTime: e.target.value })} />
                  <span className="text-xs text-ink-400">to</span>
                  <Input type="time" className="w-28" value={d.endTime} onChange={(e) => patchDay(i, { endTime: e.target.value })} />
                  <label className="flex items-center gap-1.5 text-xs text-ink-600">
                    <input
                      type="checkbox"
                      checked={d.hasBreak}
                      onChange={(e) => patchDay(i, { hasBreak: e.target.checked })}
                      className="h-4 w-4 rounded border-ink-300 text-crimson-600"
                    />
                    Break
                  </label>
                  {d.hasBreak && (
                    <>
                      <Input type="time" className="w-28" value={d.breakStart} onChange={(e) => patchDay(i, { breakStart: e.target.value })} />
                      <span className="text-xs text-ink-400">to</span>
                      <Input type="time" className="w-28" value={d.breakEnd} onChange={(e) => patchDay(i, { breakEnd: e.target.value })} />
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-2" onClick={saveSchedule} loading={savingSchedule}>
          Save working hours
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Time off / leave</p>
        {timeOff.length > 0 && (
          <ul className="mb-2 space-y-1.5">
            {timeOff.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-xs text-ink-700">
                <span>
                  {t.startDate} → {t.endDate}
                  {t.reason ? ` · ${t.reason}` : ""}
                </span>
                <button type="button" onClick={() => removeTimeOff(t.id)} className="text-rose-600 hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label>From</Label>
            <Input type="date" className="w-40" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" className="w-40" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          </div>
          <div className="min-w-[10rem] flex-1">
            <Label>
              Reason <span className="text-ink-300">(optional)</span>
            </Label>
            <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="e.g. Vacation" />
          </div>
          <Button size="sm" variant="outline" onClick={addTimeOff} loading={addingTimeOff} disabled={!newStart || !newEnd}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
