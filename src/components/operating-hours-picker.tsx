"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Select } from "./ui/field";

type DayKey = "SAT" | "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI";

const DAYS: { key: DayKey; short: string; full: string }[] = [
  { key: "SAT", short: "Sat", full: "Saturday" },
  { key: "SUN", short: "Sun", full: "Sunday" },
  { key: "MON", short: "Mon", full: "Monday" },
  { key: "TUE", short: "Tue", full: "Tuesday" },
  { key: "WED", short: "Wed", full: "Wednesday" },
  { key: "THU", short: "Thu", full: "Thursday" },
  { key: "FRI", short: "Fri", full: "Friday" },
];

// Every half hour, 12-hour clock — "12:00 AM" ... "11:30 PM".
const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
      const period = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      opts.push(`${hour12}:${m} ${period}`);
    }
  }
  return opts;
})();

const ALL_DAY_OPEN = "12:00 AM";
const ALL_DAY_CLOSE = "11:30 PM";

interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

const DEFAULT_DAY: DayHours = { closed: false, open: "10:00 AM", close: "9:00 PM" };

function daySignature(d: DayHours) {
  if (d.closed) return "Closed";
  if (d.open === ALL_DAY_OPEN && d.close === ALL_DAY_CLOSE) return "Open 24 hours";
  return `${d.open} – ${d.close}`;
}

// Groups consecutive days sharing the same hours into one line, matching
// the "Sat–Thu: 10am – 9pm / Friday: 3pm – 9pm" style owners used to type.
function buildSummary(hours: Record<DayKey, DayHours>): string {
  const lines: string[] = [];
  let i = 0;
  while (i < DAYS.length) {
    const sig = daySignature(hours[DAYS[i].key]);
    let j = i;
    while (j + 1 < DAYS.length && daySignature(hours[DAYS[j + 1].key]) === sig) j++;
    const isWholeWeek = i === 0 && j === DAYS.length - 1;
    const label = isWholeWeek ? "Everyday" : i === j ? DAYS[i].full : `${DAYS[i].short}–${DAYS[j].short}`;
    lines.push(`${label}: ${sig}`);
    i = j + 1;
  }
  return lines.join("\n");
}

function makeWeek(fn: (key: DayKey) => DayHours): Record<DayKey, DayHours> {
  const next = {} as Record<DayKey, DayHours>;
  for (const d of DAYS) next[d.key] = fn(d.key);
  return next;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenClosedToggle({ closed, onChange }: { closed: boolean; onChange: (closed: boolean) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-full border border-ink-200 bg-ink-50 p-0.5 text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!closed}
        className={cn(
          "rounded-full px-2 py-1 transition-colors",
          !closed ? "bg-crimson-600 text-white shadow-sm" : "text-ink-400 hover:text-ink-600"
        )}
      >
        Open
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={closed}
        className={cn(
          "rounded-full px-2 py-1 transition-colors",
          closed ? "bg-ink-700 text-white shadow-sm" : "text-ink-400 hover:text-ink-600"
        )}
      >
        Closed
      </button>
    </div>
  );
}

/** Day/time dropdown builder for the free-text `operatingHours` field — the
 * backend only stores a string, so this just generates one in a consistent
 * format instead of leaving owners to type it by hand. Starts blank rather
 * than parsing whatever text was already saved (too unreliable to guess a
 * format back out of free text) and only starts writing to `onChange` once
 * the owner actually touches a control, so it never silently clobbers an
 * existing value just by mounting. */
export function OperatingHoursPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(() => makeWeek(() => ({ ...DEFAULT_DAY })));
  const [touched, setTouched] = useState(false);

  function apply(next: Record<DayKey, DayHours>) {
    setHours(next);
    onChange(buildSummary(next));
    setTouched(true);
  }

  function update(key: DayKey, patch: Partial<DayHours>) {
    apply({ ...hours, [key]: { ...hours[key], ...patch } });
  }

  function applyPreset(preset: "same" | "weekdays" | "always") {
    if (preset === "same") apply(makeWeek(() => ({ ...DEFAULT_DAY })));
    else if (preset === "weekdays")
      apply(makeWeek((key) => (key === "FRI" ? { ...DEFAULT_DAY, closed: true } : { ...DEFAULT_DAY })));
    else apply(makeWeek(() => ({ closed: false, open: ALL_DAY_OPEN, close: ALL_DAY_CLOSE })));
  }

  function copyFirstDayToAll() {
    apply(makeWeek(() => ({ ...hours.SAT })));
  }

  return (
    <div className="space-y-3">
      {value && !touched && (
        <p className="whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
          Currently saved: {value}
          {"\n"}Pick a quick setup or set days below to replace it.
        </p>
      )}

      {/* Quick setups — one click covers the common cases; per-day rows below still override anything. */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => applyPreset("same")}
          className="rounded-full border border-crimson-200 bg-crimson-50 px-3 py-1.5 text-xs font-medium text-crimson-700 transition-colors hover:bg-crimson-100"
        >
          Same hours every day
        </button>
        <button
          type="button"
          onClick={() => applyPreset("weekdays")}
          className="rounded-full border border-crimson-200 bg-crimson-50 px-3 py-1.5 text-xs font-medium text-crimson-700 transition-colors hover:bg-crimson-100"
        >
          Sat–Thu, Friday off
        </button>
        <button
          type="button"
          onClick={() => applyPreset("always")}
          className="rounded-full border border-crimson-200 bg-crimson-50 px-3 py-1.5 text-xs font-medium text-crimson-700 transition-colors hover:bg-crimson-100"
        >
          Open 24 hours
        </button>
        <button
          type="button"
          onClick={copyFirstDayToAll}
          className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700"
        >
          <CopyIcon />
          Copy Saturday to all
        </button>
      </div>

      <div className="divide-y divide-ink-100 rounded-lg border border-ink-100">
        {DAYS.map((d) => {
          const day = hours[d.key];
          return (
            <div key={d.key} className="grid grid-cols-[2.5rem_6rem_1fr] items-center gap-1.5 px-3 py-2 transition-colors hover:bg-ink-50/70">
              <span className="text-xs font-semibold text-ink-700">{d.short}</span>

              <OpenClosedToggle closed={day.closed} onChange={(closed) => update(d.key, { closed })} />

              {day.closed ? (
                <span className="text-xs text-ink-300">Closed all day</span>
              ) : (
                <div className="flex flex-nowrap items-center gap-1 overflow-x-auto">
                  <Select
                    value={day.open}
                    onChange={(e) => update(d.key, { open: e.target.value })}
                    className="!w-auto min-w-0 !px-2 !pr-6 py-1.5 text-xs"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                  <span className="shrink-0 text-xs text-ink-300">–</span>
                  <Select
                    value={day.close}
                    onChange={(e) => update(d.key, { close: e.target.value })}
                    className="!w-auto min-w-0 !px-2 !pr-6 py-1.5 text-xs"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {touched && (
        <div className="rounded-lg border border-crimson-100 bg-crimson-50/50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-crimson-700">
            <ClockIcon />
            Will be saved as
          </div>
          <p className="mt-1 whitespace-pre-line text-xs text-ink-700">{buildSummary(hours)}</p>
        </div>
      )}
    </div>
  );
}
