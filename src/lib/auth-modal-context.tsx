"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AuthModalMode = "login" | "signup" | "forgot-password" | null;

interface AuthModalContextValue {
  mode: AuthModalMode;
  openLogin: () => void;
  openSignup: () => void;
  openForgotPassword: () => void;
  switchTo: (mode: Exclude<AuthModalMode, null>) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode>(null);

  const openLogin = useCallback(() => setMode("login"), []);
  const openSignup = useCallback(() => setMode("signup"), []);
  const openForgotPassword = useCallback(() => setMode("forgot-password"), []);
  const switchTo = useCallback((next: Exclude<AuthModalMode, null>) => setMode(next), []);
  const close = useCallback(() => setMode(null), []);

  const value = useMemo(
    () => ({ mode, openLogin, openSignup, openForgotPassword, switchTo, close }),
    [mode, openLogin, openSignup, openForgotPassword, switchTo, close]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
