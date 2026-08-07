import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return iso;
  const diffSec = Math.round((Date.now() - date) / 1000);
  const table: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = diffSec;
  let unit = "s";
  for (const [size, u] of table) {
    if (value < size) {
      unit = u;
      break;
    }
    value = Math.floor(value / size);
    unit = u;
  }
  if (diffSec < 60) return "just now";
  return `${value}${unit} ago`;
}

/**
 * Normalizes a Bangladeshi phone number to E.164 (+8801XXXXXXXXX), matching
 * the backend's PhoneNumberUtils normalization. Accepts local (01XXXXXXXXX),
 * with-country-code (8801XXXXXXXXX), or already-E.164 (+8801XXXXXXXXX) input.
 */
export function normalizeBdPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("0")) return `+880${digits.slice(1)}`;
  if (digits.startsWith("1")) return `+880${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

export function isValidBdPhone(raw: string): boolean {
  const normalized = normalizeBdPhone(raw);
  return /^\+8801[3-9]\d{8}$/.test(normalized);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function truncateId(id: string, len = 8): string {
  return id ? id.slice(0, len) : id;
}

export function ratingToStars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometers. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}
