"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

/**
 * Shared "[<-] Title" bar for every /account/* sub-screen. Sticky + full-bleed below
 * `md` (a real screen you drilled into); a plain in-flow heading at `md` and up, where
 * the left nav (AccountSidebar) stays visible instead — there's nothing to "go back" from.
 * Defaults `onBack` to the /account list itself, since every sub-screen lives under it;
 * the root list overrides this with router.back() to leave via wherever it was entered from.
 */
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.push("/account"));

  return (
    <div
      className={
        "sticky top-16 z-10 -mx-4 flex h-14 items-center gap-1 border-b border-ink-100 bg-surface/95 px-2 backdrop-blur " +
        "sm:-mx-6 md:static md:z-auto md:mx-0 md:h-auto md:border-0 md:bg-transparent md:px-0 md:pb-6 md:backdrop-blur-none dark:border-ink-800"
      }
    >
      <IconButton variant="ghost" size="sm" onClick={handleBack} aria-label="Back" className="md:hidden">
        <ArrowLeft size={20} strokeWidth={1.75} />
      </IconButton>
      <h1 className="font-display text-[17px] font-semibold text-ink-900 md:text-xl dark:text-ink-100">{title}</h1>
    </div>
  );
}
