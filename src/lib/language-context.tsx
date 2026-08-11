"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-context";
import { translate } from "./i18n";
import type { PreferredLanguage } from "./types";

const STORAGE_KEY = "language";

interface LanguageContextValue {
  lang: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  // Read the last-known choice from localStorage first so the navbar/forms
  // render in the right language immediately on load, before the profile
  // API call (userApi.me()) resolves.
  const [lang, setLangState] = useState<PreferredLanguage>(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(STORAGE_KEY) === "bn" ? "bn" : "en";
  });

  const setLanguage = useCallback((next: PreferredLanguage) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Once the account profile loads (or is updated via Account settings' Save
  // button), that's the authoritative source — keep the UI in sync with it.
  useEffect(() => {
    if (profile?.preferredLanguage && profile.preferredLanguage !== lang) {
      setLanguage(profile.preferredLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferredLanguage]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}