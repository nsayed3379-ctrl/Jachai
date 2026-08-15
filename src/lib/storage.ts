// Thin localStorage wrappers. All guarded for SSR (window undefined during
// server render / build) since Next.js App Router renders these client
// components on the server first.

const ACCESS_TOKEN_KEY = "rp.accessToken";
const REFRESH_TOKEN_KEY = "rp.refreshToken";
const ACCOUNT_MODE_KEY = "rp.accountMode";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export type AccountMode = "personal" | "business";

/** Every account can both write reviews and manage businesses — this just remembers which nav view they last picked. */
export function getStoredAccountMode(): AccountMode {
  if (typeof window === "undefined") return "personal";
  return window.localStorage.getItem(ACCOUNT_MODE_KEY) === "business" ? "business" : "personal";
}

export function setStoredAccountMode(mode: AccountMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_MODE_KEY, mode);
}
