"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, userApi } from "./api";
import { decodeAccessToken, isTokenExpired } from "./jwt";
import {
  clearStoredTokens,
  getStoredAccessToken,
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const hydrateFromStorage = useCallback(() => {
    const token = getStoredAccessToken();
    if (token && !isTokenExpired(token)) {
      const decoded = decodeAccessToken(token);
      if (decoded) {
        setUser({ id: decoded.sub, role: decoded.role });
        setIsLoading(false);
        return;
      }
    }
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrateFromStorage();

    function onAuthInvalid() {
      setUser(null);
      setProfile(null);
    }
    window.addEventListener("rp:auth-invalid", onAuthInvalid);
    return () => window.removeEventListener("rp:auth-invalid", onAuthInvalid);
  }, [hydrateFromStorage]);

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
    const decoded = decodeAccessToken(tokens.accessToken);
    if (decoded) setUser({ id: decoded.sub, role: decoded.role });
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

  const value = useMemo(
    () => ({ user, profile, isLoading, login, logout, refreshProfile, setProfile }),
    [user, profile, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
