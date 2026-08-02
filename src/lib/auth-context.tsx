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
import { authApi } from "./api";
import { decodeAccessToken, isTokenExpired } from "./jwt";
import {
  clearStoredTokens,
  getStoredAccessToken,
  setStoredTokens,
} from "./storage";
import type { TokenPairDto, UserRole } from "./types";

interface AuthUser {
  id: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (tokens: TokenPairDto) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrateFromStorage();

    function onAuthInvalid() {
      setUser(null);
    }
    window.addEventListener("rp:auth-invalid", onAuthInvalid);
    return () => window.removeEventListener("rp:auth-invalid", onAuthInvalid);
  }, [hydrateFromStorage]);

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
    router.push("/");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
