"use client";

import { Check } from "lucide-react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { PreferredLanguage } from "@/lib/types";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { PageSpinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { ScreenHeader } from "./screen-header";

const LANGUAGE_OPTIONS: { value: PreferredLanguage; labelKey: string }[] = [
  { value: "en", labelKey: "account.language.en" },
  { value: "bn", labelKey: "account.language.bn" },
];

/** Optimistic instant-save, shared by the mobile Language sheet and the desktop pane —
 *  flips the UI immediately, then persists; a failed request reverts it with a toast
 *  rather than leaving the UI saying something the backend never agreed to. */
function useLanguageSetting() {
  const { profile, setProfile: setAuthProfile } = useAuth();
  const { setLanguage } = useLanguage();
  const { show } = useToast();

  async function selectLanguage(next: PreferredLanguage) {
    if (!profile || profile.preferredLanguage === next) return;
    const previous = profile.preferredLanguage;
    setLanguage(next);
    try {
      const updated = await userApi.update(profile.name, next, profile.profilePhotoUrl);
      setAuthProfile(updated);
    } catch (err) {
      setLanguage(previous);
      show(errorMessage(err), "error");
    }
  }

  return { current: profile?.preferredLanguage ?? "en", selectLanguage };
}

export function LanguageOptions({ onSelected }: { onSelected?: () => void }) {
  const { t } = useLanguage();
  const { current, selectLanguage } = useLanguageSetting();

  return (
    <div className="p-2 sm:p-3">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            selectLanguage(option.value);
            onSelected?.();
          }}
          className={cn(
            "flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-[15px] font-medium text-ink-900 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800",
            interactiveTransition,
            focusRing
          )}
        >
          {t(option.labelKey)}
          {current === option.value && <Check size={18} className="text-crimson-600" />}
        </button>
      ))}
    </div>
  );
}

export function PreferencesScreen() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!profile) return <PageSpinner />;

  return (
    <div>
      <ScreenHeader title="Preferences" />
      <div className="mx-auto max-w-sm px-4 pb-10 pt-6 md:max-w-none md:px-0">
        <p className="px-1 pb-2 text-[13px] font-semibold text-ink-500">Language</p>
        <div className="rounded-xl border border-ink-100 dark:border-ink-800">
          <LanguageOptions />
        </div>

        <p className="px-1 pb-2 pt-6 text-[13px] font-semibold text-ink-500">Appearance</p>
        <div className="flex min-h-14 items-center justify-between rounded-xl border border-ink-100 px-4 dark:border-ink-800">
          <span className="text-[15px] font-medium text-ink-900 dark:text-ink-100">Dark mode</span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Dark mode"
          />
        </div>
      </div>
    </div>
  );
}
