"use client";

import { cn } from "@/lib/utils";

export interface BusinessTab {
  key: string;
  label: string;
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
              "shrink-0 -mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-crimson-600 text-crimson-700"
                : "border-transparent text-ink-500 hover:text-ink-800"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
