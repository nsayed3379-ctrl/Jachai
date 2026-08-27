"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, tryRefresh, userApi } from "./api";
import { decodeAccessToken, isTokenExpired } from "./jwt";
import {
  ACCESS_TOKEN_KEY,
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "./storage";
import type { TokenPairDto, UserProfile, UserRole } from "./types";

interface AuthUser {
  id: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (tokens: TokenPairDto) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  /** Frictionless switch to the linked counterpart account (consumer<->business) — see components/navbar.tsx. */
  switchAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Refresh this many ms before the access token's `exp` so a request never
 *  races an expiry. Also the "does this token still have plenty of life?"
 *  threshold used to skip a redundant refresh another tab already did. */
const REFRESH_LEAD_MS = 120_000;

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const decoded = decodeAccessToken(token);
  return decoded ? { id: decoded.sub, role: decoded.role } : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Resolve the session from storage on load. If the access token is expired
   * (it lives only ~20 min) but a refresh token exists (~14 days), redeem it
   * before concluding the user is logged out — otherwise every reload after a
   * short idle looked like an "auto logout".
   */
  const hydrateFromStorage = useCallback(async () => {
    const token = getStoredAccessToken();
    if (token && !isTokenExpired(token)) {
      const u = userFromToken(token);
      if (u) {
        setUser(u);
        setIsLoading(false);
        return;
      }
    }

    if (getStoredRefreshToken()) {
      const ok = await tryRefresh();
      if (ok) {
        const u = userFromToken(getStoredAccessToken());
        if (u) {
          setUser(u);
          setIsLoading(false);
          return;
        }
      }
    }

    clearStoredTokens();
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void hydrateFromStorage();

    function onAuthInvalid() {
      setUser(null);
      setProfile(null);
    }
    window.addEventListener("rp:auth-invalid", onAuthInvalid);

    // Cross-tab sync: adopt (or drop) whatever another tab just wrote, so two
    // open tabs don't each try to rotate the refresh token and trip the
    // backend's reuse-detection (which revokes the whole session).
    function onStorage(e: StorageEvent) {
      if (e.key !== ACCESS_TOKEN_KEY) return;
      if (!e.newValue) {
        setUser(null);
        setProfile(null);
        return;
      }
      const u = userFromToken(e.newValue);
      if (u) setUser(u);
    }
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("rp:auth-invalid", onAuthInvalid);
      window.removeEventListener("storage", onStorage);
    };
  }, [hydrateFromStorage]);

  /**
   * Proactive refresh: schedule one REFRESH_LEAD_MS before the current access
   * token expires, then reschedule off the new token. A small random jitter
   * plus a "did another tab already refresh?" check keeps two tabs from
   * firing the rotation at the same instant.
   */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function clear() {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    }

    function schedule() {
      clear();
      const token = getStoredAccessToken();
      const decoded = token ? decodeAccessToken(token) : null;
      if (!decoded) return;

      const lead = REFRESH_LEAD_MS + Math.random() * 15_000;
      const delay = Math.max(decoded.exp * 1000 - Date.now() - lead, 5_000);

      refreshTimer.current = setTimeout(async () => {
        if (cancelled) return;

        // Another tab may have refreshed already — if the stored token still
        // has comfortable life left, just reschedule off it.
        const current = getStoredAccessToken();
        const cur = current ? decodeAccessToken(current) : null;
        if (cur && cur.exp * 1000 - Date.now() > REFRESH_LEAD_MS + 30_000) {
          schedule();
          return;
        }

        const ok = await tryRefresh();
        if (cancelled) return;
        if (ok) {
          const u = userFromToken(getStoredAccessToken());
          if (u) setUser(u);
          schedule();
        } else {
          setUser(null);
          setProfile(null);
        }
      }, delay);
    }

    schedule();
    return () => {
      cancelled = true;
      clear();
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      setProfile(await userApi.me());
    } catch {
      // best-effort — navbar just falls back to no avatar
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshProfile();
    else setProfile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = useCallback((tokens: TokenPairDto) => {
    setStoredTokens(tokens.accessToken, tokens.refreshToken);
    const u = userFromToken(tokens.accessToken);
    if (u) setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — clear local state regardless
    }
    clearStoredTokens();
    setUser(null);
    setProfile(null);
    router.push("/");
  }, [router]);

  // Reuses login() verbatim — a switch is just "log into the linked account"
  // without re-entering a password; the new user id automatically triggers
  // the refreshProfile() effect above.
  const switchAccount = useCallback(async () => {
    const tokens = await authApi.switchAccount();
    login(tokens);
  }, [login]);

  const value = useMemo(
    () => ({ user, profile, isLoading, login, logout, refreshProfile, setProfile, switchAccount }),
    [user, profile, isLoading, login, logout, refreshProfile, switchAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
