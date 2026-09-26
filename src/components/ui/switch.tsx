"use client";

import { cn, focusRing, interactiveTransition } from "@/lib/utils";

/** A binary on/off control — role="switch", not a checkbox, per WAI-ARIA. No
 *  existing primitive for this in the app yet; every other control here is a
 *  button/link/select, so this is genuinely new rather than a duplicate. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-crimson-600" : "bg-ink-200 dark:bg-ink-700",
        interactiveTransition,
        focusRing
      )}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-150",
          checked ? "translate-x-[19px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}
