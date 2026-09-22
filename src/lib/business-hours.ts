import type { DayOfWeek, HoursExceptionEntry, OperatingHoursEntry } from "./types";

// The app is Dhaka-only in practice (see the comment in business-filters.tsx),
// so "open now" always reads the business's hours against Asia/Dhaka wall-clock
// time — never the visitor's own local time, which would silently misread the
// status for anyone browsing from outside Bangladesh.
const TIMEZONE = "Asia/Dhaka";

const WEEK_ORDER: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function previousDay(day: DayOfWeek): DayOfWeek {
  const idx = WEEK_ORDER.indexOf(day);
  return WEEK_ORDER[(idx + 6) % 7];
}

/** Current weekday + minutes-since-midnight, read in Asia/Dhaka wall-clock time regardless of the visitor's own timezone. */
function dhakaNow(date: Date): { dayOfWeek: DayOfWeek; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const weekday = (parts.find((p) => p.type === "weekday")?.value ?? "MONDAY").toUpperCase() as DayOfWeek;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24; // hour12:false can render midnight as "24"
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { dayOfWeek: weekday, minutes: hour * 60 + minute };
}

/** "YYYY-MM-DD" in Asia/Dhaka — comparable lexicographically against HoursExceptionEntry's startDate/endDate. */
function dhakaDateStr(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function exceptionCovering(exceptions: HoursExceptionEntry[], dateStr: string): HoursExceptionEntry | undefined {
  return exceptions.find((e) => e.startDate <= dateStr && dateStr <= e.endDate);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** "HH:mm" or "HH:mm:ss" -> "9:00 PM". */
function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr.padStart(2, "0")} ${period}`;
}

export interface OpenStatus {
  open: boolean;
  /** 12h-formatted time the status next changes (closing time if open, opening time if closed later today) — omitted when unknown. */
  changesAt?: string;
  /** Set when a holiday/exception override (not the recurring weekly hours) is the reason for the current status, e.g. "Eid holiday". */
  reason?: string;
}

/**
 * Null means "no structured hours set" (legacy free-text-only business) —
 * callers should render no badge at all, never a guess. A day whose window
 * crosses midnight (closeTime <= openTime) is checked against both today's
 * and yesterday's entry, since a customer at 1am is inside *yesterday's*
 * window, not today's. An active `exceptions` entry (holiday closure or
 * special hours) always takes precedence over the recurring weekly entry for
 * any date it covers.
 */
export function getOpenStatus(
  entries: OperatingHoursEntry[] | null | undefined,
  exceptions?: HoursExceptionEntry[] | null,
  now: Date = new Date()
): OpenStatus | null {
  if (!entries || entries.length === 0) return null;
  const byDay = new Map(entries.map((e) => [e.dayOfWeek, e]));
  const { dayOfWeek, minutes } = dhakaNow(now);

  if (exceptions && exceptions.length > 0) {
    const todayStr = dhakaDateStr(now);
    const todayException = exceptionCovering(exceptions, todayStr);

    if (todayException) {
      if (todayException.closed) {
        return { open: false, reason: todayException.reason ?? undefined };
      }
      if (todayException.openTime && todayException.closeTime) {
        const open = timeToMinutes(todayException.openTime);
        const close = timeToMinutes(todayException.closeTime);
        const crossesMidnight = close <= open;
        if (crossesMidnight ? minutes >= open : minutes >= open && minutes < close) {
          return { open: true, changesAt: formatTime12(todayException.closeTime), reason: todayException.reason ?? undefined };
        }
        if (minutes < open) {
          return { open: false, changesAt: formatTime12(todayException.openTime), reason: todayException.reason ?? undefined };
        }
        // Same-day window and already past close — the exception governs the whole day, so no fallback to weekly hours.
        return { open: false, reason: todayException.reason ?? undefined };
      }
    } else {
      // No exception for today — but yesterday's might still be open past midnight into today.
      const yesterdayStr = dhakaDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      const yesterdayException = exceptionCovering(exceptions, yesterdayStr);
      if (yesterdayException && !yesterdayException.closed && yesterdayException.openTime && yesterdayException.closeTime) {
        const open = timeToMinutes(yesterdayException.openTime);
        const close = timeToMinutes(yesterdayException.closeTime);
        if (close <= open && minutes < close) {
          return { open: true, changesAt: formatTime12(yesterdayException.closeTime), reason: yesterdayException.reason ?? undefined };
        }
      }
    }
  }

  const today = byDay.get(dayOfWeek);
  if (today && !today.closed && today.openTime && today.closeTime) {
    const open = timeToMinutes(today.openTime);
    const close = timeToMinutes(today.closeTime);
    const crossesMidnight = close <= open;
    if (crossesMidnight ? minutes >= open : minutes >= open && minutes < close) {
      return { open: true, changesAt: formatTime12(today.closeTime) };
    }
  }

  const yesterday = byDay.get(previousDay(dayOfWeek));
  if (yesterday && !yesterday.closed && yesterday.openTime && yesterday.closeTime) {
    const open = timeToMinutes(yesterday.openTime);
    const close = timeToMinutes(yesterday.closeTime);
    if (close <= open && minutes < close) {
      return { open: true, changesAt: formatTime12(yesterday.closeTime) };
    }
  }

  if (today && !today.closed && today.openTime && minutes < timeToMinutes(today.openTime)) {
    return { open: false, changesAt: formatTime12(today.openTime) };
  }

  return { open: false };
}

export function isOpenNow(
  entries: OperatingHoursEntry[] | null | undefined,
  exceptions?: HoursExceptionEntry[] | null,
  now: Date = new Date()
): boolean | null {
  const status = getOpenStatus(entries, exceptions, now);
  return status ? status.open : null;
}
