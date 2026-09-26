"use client";

import { cn } from "@/lib/utils";

export interface BusinessTab {
  key: string;
  label: string;
  /** This is where the customer can actually place an order / make a booking —
   *  called out so it doesn't get lost among the other, purely informational tabs. */
  highlight?: boolean;
}

/**
 * Section nav for the business detail page (spec: "Reviews | About | Menu |
 * Photos | Location", dynamic). Purely presentational — the page decides which
 * tabs exist (a tab is only passed in when that business actually has data for
 * it) and which one is active. Reviews stays the default.
 */
export function BusinessTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: BusinessTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  if (tabs.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Business sections"
      className="sticky top-16 z-20 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-ink-100 bg-surface/95 px-4 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 -mb-px flex items-center gap-1 rounded-t-md border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-crimson-600 text-crimson-700"
                : "border-transparent text-ink-500 hover:text-ink-800",
              tab.highlight && !isActive && "bg-crimson-50 text-crimson-700 dark:bg-crimson-500/15 dark:text-crimson-400"
            )}
          >
            {tab.label}
            {tab.highlight && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-600" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
