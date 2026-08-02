import type { DecodedAccessToken } from "./types";

/**
 * Decodes (does not verify — the backend is the source of truth for
 * verification) the JWT payload so the frontend knows the current user's id
 * and role without a dedicated /me endpoint, which the backend doesn't
 * expose. Signature verification happens server-side on every request.
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as DecodedAccessToken;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeAccessToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000 - 5000; // 5s clock-skew buffer
}
